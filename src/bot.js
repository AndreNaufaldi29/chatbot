const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const EventEmitter = require('events');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const messageHandler = require('./handlers/messageHandler');
const menuHandler = require('./handlers/menuHandler');
const phoneService = require('./services/phoneService');
const chatService = require('./services/chatService');
const dbService = require('./services/dbService');

const AUTH_FOLDER = path.join(__dirname, '../auth_info_wwebjs');

function getChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      console.log(`[whatsapp-web.js] Menggunakan browser: ${c}`);
      return c;
    }
  }
  return undefined;
}

class WhatsAppBot extends EventEmitter {
  constructor() {
    super();

    this.client = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'waiting_qr' | 'connected'
    this.qrCodeRaw = null;
    this.qrCodeDataUrl = null;
    this.userInfo = null;
    this.connectedAt = null;
    this.engine = 'whatsapp-web.js (Puppeteer Chrome)';
    this.isInitializing = false;

    // Baileys-compatible adapter socket for messageHandler & services
    this.sock = this._createSockAdapter();

    // Link messageHandler with bot's event emitter for real-time web logs
    messageHandler.setEventEmitter(this);
    this.currentMessageHandler = messageHandler;
  }

  // --- Reload All Handlers & Modules from Disk ---
  reloadHandlers() {
    try {
      const srcDir = path.resolve(__dirname);
      Object.keys(require.cache).forEach((key) => {
        if (key.startsWith(srcDir) && !key.includes('bot.js')) {
          delete require.cache[key];
        }
      });
      const newMessageHandler = require('./handlers/messageHandler');
      newMessageHandler.setEventEmitter(this);
      this.currentMessageHandler = newMessageHandler;
      console.log('[whatsapp-web.js] Seluruh modul & handler berhasil dimuat ulang segar dari disk!');
      return true;
    } catch (err) {
      console.error('[whatsapp-web.js] Gagal memuat ulang modul:', err.message);
      return false;
    }
  }

  // --- Format recipient for whatsapp-web.js (requires @c.us or @g.us, NEVER @lid) ---
  formatRecipient(jidOrPhone) {
    if (!jidOrPhone) return '';
    const str = String(jidOrPhone).trim();

    if (str.endsWith('@g.us')) return str;

    // 1. Selalu periksa apakah target/LID/JID sudah terpetakan ke nomor HP asli di phoneService
    const mapped = phoneService.getPhone(str);
    if (mapped && phoneService.isRealPhone(mapped)) {
      return `${mapped}@c.us`;
    }

    const cleanNum = str.split('@')[0].replace(/\D/g, '');
    const mappedClean = phoneService.getPhone(cleanNum);
    if (mappedClean && phoneService.isRealPhone(mappedClean)) {
      return `${mappedClean}@c.us`;
    }

    // 2. Jika cleanNum adalah nomor telepon asli yang valid
    if (phoneService.isRealPhone(cleanNum)) {
      let p = cleanNum;
      if (p.startsWith('0')) p = '62' + p.slice(1);
      return `${p}@c.us`;
    }

    // 3. Jika ini adalah LID tanpa pemetaan, JANGAN PERNAH dibuat menjadi <lid>@c.us karena WhatsApp Web akan crash
    if (phoneService.isLid(cleanNum) || str.includes('@lid')) {
      console.warn(`[formatRecipient] Menolak target LID tanpa nomor telepon terdaftar: ${str}`);
      throw new Error(`Target WhatsApp tidak valid (LID tanpa nomor telepon terdaftar: ${str})`);
    }

    let clean = cleanNum;
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return `${clean}@c.us`;
  }

  // --- Create Baileys-compatible Adapter Socket ---
  _createSockAdapter() {
    const self = this;
    return {
      get user() {
        return self.userInfo || { id: 'bot@s.whatsapp.net', name: 'Chatbot WhatsApp' };
      },

      sendMessage: async (jid, messagePayload, options = {}) => {
        return await self.sendMessage(jid, messagePayload, options);
      },

      readMessages: async (keys = []) => {
        if (!self.client || !Array.isArray(keys) || keys.length === 0) return;
        const target = keys[0]?.remoteJid;
        if (!target) return;
        try {
          const chat = await self.client.getChatById(self.formatRecipient(target)).catch(() => null);
          if (chat && typeof chat.sendSeen === 'function') {
            await chat.sendSeen().catch(() => {});
          }
        } catch (_) {}
      },

      sendPresenceUpdate: async (state, jid) => {
        if (!self.client || !jid) return;
        try {
          const chat = await self.client.getChatById(self.formatRecipient(jid)).catch(() => null);
          if (chat) {
            if (state === 'composing') {
              await chat.sendStateTyping().catch(() => {});
            } else {
              await chat.clearState().catch(() => {});
            }
          }
        } catch (_) {}
      }
    };
  }

  // --- Initialization & Lifecycle ---
  async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (_) {}
        this.client = null;
      }

      console.log('[whatsapp-web.js] Menginisialisasi browser WhatsApp Web...');
      this.status = 'connecting';
      this.emit('status_change', this.getStatus());

      const chromeExecutable = getChromePath();

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: AUTH_FOLDER
        }),
        puppeteer: {
          headless: true,
          executablePath: chromeExecutable,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions'
          ]
        }
      });

      // 1. QR Code Event
      this.client.on('qr', async (qr) => {
        try {
          this.qrCodeRaw = qr;
          this.qrCodeDataUrl = await QRCode.toDataURL(qr);
          this.status = 'waiting_qr';

          this.emit('qr', { qrDataUrl: this.qrCodeDataUrl });
          this.emit('status_change', this.getStatus());

          console.log('\n📲 SCAN QR CODE WHATSAPP (WHATSAPP-WEB.JS):');
          qrcodeTerminal.generate(qr, { small: true });
        } catch (err) {
          console.error('[whatsapp-web.js] Gagal membuat QR Code:', err.message);
        }
      });

      // 2. Ready Event (Koneksi Berhasil)
      this.client.on('ready', async () => {
        console.log('✅ [whatsapp-web.js] WhatsApp Berhasil Terhubung!');
        this.status = 'connected';
        this.connectedAt = new Date().toISOString();
        this.qrCodeDataUrl = null;
        this.qrCodeRaw = null;

        const wid = this.client.info?.wid;
        const num = wid?.user || '';
        const name = this.client.info?.pushname || 'WhatsApp Business';

        this.userInfo = {
          id: `${num}@s.whatsapp.net`,
          name,
          phone: num
        };

        // Pasang patch runtime anti-LID memoizer agar WhatsApp Web tidak throw error "Data passed to getter..." atau "No LID for users"
        try {
          await this.client.pupPage.evaluate(() => {
            try {
              if (window.WWebJS) {
                const origGetChat = window.WWebJS.getChat;
                window.WWebJS.getChat = async (chatId, opts = {}) => {
                  let targetId = chatId;
                  // Jika targetId berupa LID, alihkan ke WID nomor telepon asli (@c.us) dari kontak memory
                  if (typeof targetId === 'string' && (targetId.endsWith('@lid') || targetId.includes('@lid'))) {
                    try {
                      const collections = window.require('WAWebCollections');
                      const contacts = collections?.Contact?.getModelsArray() || [];
                      const c = contacts.find(x => x.lid?._serialized === targetId || x.id?._serialized === targetId);
                      const phone = c?.phoneNumber?.user || (c?.id?.server === 'c.us' ? c.id.user : null);
                      if (phone) {
                        targetId = `${phone}@c.us`;
                      }
                    } catch (_) {}
                  }

                  try {
                    return await origGetChat(targetId, opts);
                  } catch (e) {
                    try {
                      const widFactory = window.require('WAWebWidFactory');
                      const chatWid = widFactory.createWid(targetId);
                      const collections = window.require('WAWebCollections');
                      const chat = collections?.Chat?.get(chatWid);
                      if (chat) {
                        return opts?.getAsModel ? await window.WWebJS.getChatModel(chat) : chat;
                      }
                    } catch (_) {}
                    throw e;
                  }
                };
              }
            } catch (_) {}
          });
          console.log('[whatsapp-web.js] Patch anti-LID memoizer & No LID aktif.');
        } catch (_) {}

        // Sinkronisasi otomatis seluruh kontak WhatsApp ke phoneService (anti-LID total)
        try {
          const syncContacts = await this.client.pupPage.evaluate(() => {
            try {
              const collections = window.require('WAWebCollections');
              const contacts = collections.Contact.getModelsArray();
              return contacts.map(c => ({
                id: c.id?._serialized,
                phone: c.phoneNumber ? c.phoneNumber.user : (c.id?.server === 'c.us' ? c.id.user : null),
                lid: c.lid?._serialized || (c.id?.server === 'lid' ? c.id._serialized : null),
                name: c.name || c.pushname
              })).filter(x => x.phone);
            } catch (_) {
              return [];
            }
          });
          let mappedCount = 0;
          for (const item of syncContacts) {
            if (item.phone && phoneService.isRealPhone(item.phone)) {
              if (item.id) phoneService.setMapping(item.id, item.phone, item.name);
              if (item.lid) phoneService.setMapping(item.lid, item.phone, item.name);
              mappedCount++;
            }
          }
          phoneService.saveMapping();
          console.log(`[whatsapp-web.js] Berhasil sinkronisasi ${mappedCount} kontak & pemetaan LID.`);
        } catch (_) {}

        this.emit('status_change', this.getStatus());
      });

      // 3. Authenticated Event
      this.client.on('authenticated', () => {
        console.log('[whatsapp-web.js] Sesi berhasil diautentikasi.');
      });

      // 4. Auth Failure Event
      this.client.on('auth_failure', (msg) => {
        console.error('[whatsapp-web.js] Gagal autentikasi sesi:', msg);
        this.status = 'disconnected';
        this.emit('status_change', this.getStatus());
      });

      // 5. Disconnected Event
      this.client.on('disconnected', (reason) => {
        console.warn('[whatsapp-web.js] WhatsApp terputus:', reason);
        this.status = 'disconnected';
        this.userInfo = null;
        this.connectedAt = null;
        this.emit('status_change', this.getStatus());
      });

      // 6. Inbound Message Event
      this.client.on('message', async (wMsg) => {
        try {
          if (!wMsg) return;
          if (wMsg.from === 'status@broadcast') return;
          if (wMsg.fromMe) return;

          const isGroup = wMsg.from.endsWith('@g.us');
          const config = menuHandler.getConfig();
          if (isGroup && config.bot?.ignore_groups) return;

          const text = (wMsg.body || '').trim();
          if (!text && !wMsg.hasMedia) return;

          let pushName = wMsg._data?.notifyName || '';

          // 1. Cari nomor HP asli via phoneService terlebih dahulu
          let realPhone = phoneService.getPhone(wMsg.from, pushName) || (wMsg.author ? phoneService.getPhone(wMsg.author, pushName) : null);

          // 2. Jika belum ada di phoneService, baca langsung dari Contact memory collection (tanpa memicu findImpl)
          if (!realPhone || !phoneService.isRealPhone(realPhone)) {
            try {
              const lookupJid = wMsg.author || wMsg.from;
              const contactData = await this.client.pupPage.evaluate((jidToFind) => {
                try {
                  const widFactory = window.require('WAWebWidFactory');
                  const collections = window.require('WAWebCollections');
                  const wid = widFactory.createWid(jidToFind);
                  const c = collections.Contact.get(wid);
                  if (c) {
                    const pn = c.phoneNumber ? c.phoneNumber.user : (c.id?.server === 'c.us' ? c.id.user : null);
                    return { phone: pn, name: c.name || c.pushname };
                  }
                  return null;
                } catch (_) {
                  return null;
                }
              }, lookupJid);

              if (contactData?.phone && phoneService.isRealPhone(contactData.phone)) {
                realPhone = phoneService.cleanPhoneNumber(contactData.phone);
                if (contactData.name && !pushName) pushName = contactData.name;
              }
            } catch (_) {}
          }

          // 3. Fallback panggil wMsg.getContact() jika perlu
          if (!realPhone || !phoneService.isRealPhone(realPhone)) {
            const contact = await wMsg.getContact().catch(() => null);
            if (contact?.number && phoneService.isRealPhone(contact.number)) {
              realPhone = phoneService.cleanPhoneNumber(contact.number);
            } else if (contact?.id?.user && phoneService.isRealPhone(contact.id.user)) {
              realPhone = phoneService.cleanPhoneNumber(contact.id.user);
            }
            if (!pushName) pushName = contact?.pushname || contact?.name || '';
          }

          // Catat mapping ke phoneService agar target @lid langsung terhubung ke nomor HP asli
          if (realPhone && phoneService.isRealPhone(realPhone)) {
            phoneService.setMapping(wMsg.from, realPhone, pushName);
            if (wMsg.author) phoneService.setMapping(wMsg.author, realPhone, pushName);
          }

          // Tetapkan JID: JANGAN GUNAKAN @lid. Selalu gunakan format <nomor>@s.whatsapp.net untuk chat pribadi
          let jid;
          if (isGroup) {
            jid = wMsg.from;
          } else if (realPhone && phoneService.isRealPhone(realPhone)) {
            jid = `${realPhone}@s.whatsapp.net`;
          } else if (wMsg.from.endsWith('@c.us') && phoneService.isRealPhone(wMsg.from.split('@')[0])) {
            jid = wMsg.from.replace('@c.us', '@s.whatsapp.net');
          } else {
            const mapped = phoneService.getPhone(wMsg.from, pushName);
            if (mapped && phoneService.isRealPhone(mapped)) {
              jid = `${mapped}@s.whatsapp.net`;
            } else {
              jid = wMsg.from;
            }
          }

          const senderPhone = realPhone || phoneService.extractPhoneFromJid(jid);
          const senderName = pushName || (phoneService.isRealPhone(senderPhone) ? phoneService.formatPhone(senderPhone) : 'Pelanggan');

          // Real-time chat log to web dashboard
          this.emit('chat_log', {
            id: wMsg.id?._serialized || `msg_${Date.now()}`,
            jid,
            phone: senderPhone,
            sender: senderName,
            text: text || (wMsg.hasMedia ? '(Media Gambar/Dokumen)' : ''),
            fromMe: false,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            isAiReplied: false,
            status: 'received'
          });

          // Baileys-compatible adapter message for messageHandler
          const adapterMsg = {
            key: {
              remoteJid: jid,
              fromMe: false,
              id: wMsg.id?._serialized || `msg_${Date.now()}`
            },
            pushName: senderName,
            message: {
              conversation: text
            },
            messageTimestamp: wMsg.timestamp,
            _wMsg: wMsg
          };

          const activeHandler = this.currentMessageHandler || messageHandler;
          await activeHandler.handleMessage(this.sock, adapterMsg);
        } catch (err) {
          console.error('[whatsapp-web.js] Error memproses pesan masuk:', err.message);
        }
      });

      // Watchdog: jika WhatsApp Web sudah terautentikasi dari sesi sebelumnya, langsung sinkronkan status
      const syncWatcher = setInterval(async () => {
        if (!this.client?.pupPage) return;
        try {
          const isSynced = await this.client.pupPage.evaluate(() => {
            if (typeof window.onAppStateHasSyncedEvent === 'function') {
              const hasUser = window.require?.('WAWebUserPrefsMeUser')?.getMaybeMePnUser?.() || window.require?.('WAWebUserPrefsMeUser')?.getMaybeMeLidUser?.();
              if (hasUser && typeof window.WWebJS === 'undefined') {
                window.onAppStateHasSyncedEvent();
                return true;
              }
            }
            return false;
          });
          if (isSynced) {
            clearInterval(syncWatcher);
          }
        } catch (_) {}
      }, 1500);

      this.client.once('ready', () => clearInterval(syncWatcher));
      this.client.once('auth_failure', () => clearInterval(syncWatcher));
      this.client.once('disconnected', () => clearInterval(syncWatcher));

      // Start client
      await this.client.initialize();
    } catch (err) {
      console.error('[whatsapp-web.js] Gagal inisialisasi:', err.message);
      this.status = 'disconnected';
      this.emit('status_change', this.getStatus());
    } finally {
      this.isInitializing = false;
    }
  }

  // --- Send Message via whatsapp-web.js ---
  async sendMessage(target, messagePayload, options = {}) {
    if (!this.client) {
      throw new Error('WhatsApp client belum aktif. Tunggu hingga browser siap.');
    }

    // A. Pesan Gambar / Media
    const isImage = Boolean(
      messagePayload?.image ||
      messagePayload?.media ||
      options?.image ||
      options?.imageBase64 ||
      options?.imagePath
    );

    let media = null;
    const raw = messagePayload?.image || messagePayload?.media || options?.imageBase64 || options?.image || options?.imagePath;
    const caption = messagePayload?.caption || options?.caption || (typeof messagePayload === 'string' ? messagePayload : '');

    if (isImage && raw) {
      if (Buffer.isBuffer(raw)) {
        media = new MessageMedia('image/jpeg', raw.toString('base64'));
      } else if (typeof raw === 'string' && fs.existsSync(raw)) {
        media = MessageMedia.fromFilePath(raw);
      } else if (typeof raw === 'string' && raw.startsWith('data:')) {
        const parts = raw.split(';base64,');
        const mime = parts[0].replace('data:', '');
        media = new MessageMedia(mime, parts[1]);
      } else if (typeof raw === 'string' && raw.length > 100) {
        media = new MessageMedia('image/jpeg', raw);
      }
    }

    const text = typeof messagePayload === 'string' ? messagePayload : (messagePayload?.text || '');

    // B. Kirim via recipient terverifikasi (hindari wMsg.reply yang memicu error getter id pada LID)
    let recipient = this.formatRecipient(target);
    if (!recipient) {
      throw new Error(`Target nomor WhatsApp tidak valid: ${target}`);
    }

    // Anti-LID: Jangan pernah mengirim ke JID @lid karena WhatsApp Web internal memoizer akan crash
    if (recipient.endsWith('@lid') || phoneService.isLid(recipient)) {
      const real = phoneService.getPhone(recipient);
      if (real && phoneService.isRealPhone(real)) {
        recipient = `${real}@c.us`;
      } else {
        const clean = recipient.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) {
          recipient = `${clean}@c.us`;
        } else {
          throw new Error(`Target pengiriman adalah LID (${recipient}) tanpa nomor HP yang valid`);
        }
      }
    }

    if (!isImage && !text) {
      throw new Error('Pesan teks atau gambar tidak boleh kosong.');
    }

    // Opsi pengiriman (sertakan quotedMessageId jika tersedia dan bukan LID)
    const sendOpts = {};
    if (caption) sendOpts.caption = caption;
    if (
      options?.quoted?.key?.id &&
      !String(options?.quoted?.key?.id || '').includes('@lid') &&
      !String(options?.quoted?.key?.remoteJid || '').includes('@lid')
    ) {
      sendOpts.quotedMessageId = options.quoted.key.id;
    }

    try {
      if (isImage && media) {
        return await this.client.sendMessage(recipient, media, sendOpts);
      }
      return await this.client.sendMessage(recipient, text, sendOpts);
    } catch (sendErr) {
      const errStr = String(sendErr.message || sendErr);
      console.warn(`[whatsapp-web.js] sendMessage ke ${recipient} dengan quote gagal (${errStr}), mencoba kirim langsung tanpa quote...`);

      // Fallback 1: Kirim langsung tanpa quotedMessageId
      try {
        if (isImage && media) {
          return await this.client.sendMessage(recipient, media, { caption: caption || '' });
        }
        return await this.client.sendMessage(recipient, text);
      } catch (f1Err) {
        console.warn(`[whatsapp-web.js] Fallback tanpa quote gagal: ${f1Err.message}, mencoba via Chat model...`);
      }

      // Fallback 2: Kirim melalui Chat model langsung jika sendMessage throw error
      try {
        const chat = await this.client.getChatById(recipient).catch(() => null);
        if (chat && typeof chat.sendMessage === 'function') {
          if (isImage && media) {
            return await chat.sendMessage(media, { caption: caption || '' });
          }
          return await chat.sendMessage(text);
        }
      } catch (chatErr) {
        console.warn(`[whatsapp-web.js] chat.sendMessage juga gagal: ${chatErr.message}`);
      }

      // Fallback 3: Jika pengiriman media/gambar gagal (misal bug memoize WhatsApp Web), kirim teksnya saja agar pelanggan tetap menerima informasi!
      if (isImage && (caption || text)) {
        try {
          console.warn(`[whatsapp-web.js] Pengiriman media ke ${recipient} gagal, mencoba fallback kirim pesan teks informasi...`);
          return await this.client.sendMessage(recipient, caption || text);
        } catch (textErr) {
          console.warn(`[whatsapp-web.js] Fallback teks ke ${recipient} juga gagal: ${textErr.message}`);
        }
      }

      throw sendErr;
    }
  }

  // --- Send Custom Message from Web Dashboard (Manual / AI CS) ---
  async sendCustomMessage(target, text, senderName = 'Admin', explicitPhone = null, customMessageId = null, mediaOpts = {}) {
    if (!target && !explicitPhone) throw new Error('Target pengiriman wajib diisi.');

    // Utamakan nomor telepon asli (anti-LID)
    let resolvedTarget = target;
    let resolvedPhone = explicitPhone ? phoneService.cleanPhoneNumber(explicitPhone) : null;

    if (!resolvedPhone || !phoneService.isRealPhone(resolvedPhone)) {
      resolvedPhone = phoneService.getPhone(target) || phoneService.extractPhoneFromJid(target);
    }

    if (resolvedPhone && phoneService.isRealPhone(resolvedPhone)) {
      resolvedTarget = `${resolvedPhone}@c.us`;
    }

    const msgId = customMessageId || `custom_${Date.now()}`;

    // Kirim pesan via whatsapp-web.js
    const result = await this.sendMessage(resolvedTarget, text, mediaOpts);

    // Kirim event chat_log agar dashboard langsung menampilkan balon chat secara real-time
    this.emit('chat_log', {
      id: msgId,
      jid: resolvedPhone ? `${resolvedPhone}@s.whatsapp.net` : (resolvedTarget.includes('@') ? resolvedTarget.replace('@c.us', '@s.whatsapp.net') : `${resolvedTarget}@s.whatsapp.net`),
      phone: resolvedPhone,
      sender: senderName,
      text: text || '(Media Gambar)',
      fromMe: true,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isAiReplied: false,
      status: 'sent',
      mediaType: mediaOpts?.imageBase64 || mediaOpts?.image ? 'image' : 'text'
    });

    return result;
  }

  // --- Sync Presence ---
  async syncPresenceNow() {
    // whatsapp-web.js auto-manages presence
  }

  // --- Restart Connection ---
  async restart() {
    console.log('[whatsapp-web.js] Memuat ulang modul & memulai ulang sesi WhatsApp...');
    this.reloadHandlers();
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (_) {}
      this.client = null;
    }
    this.status = 'connecting';
    this.qrCodeRaw = null;
    this.qrCodeDataUrl = null;
    this.emit('status_change', this.getStatus());

    setTimeout(() => {
      this.init();
    }, 1000);

    return { success: true, message: 'Koneksi WhatsApp sedang dimuat ulang...' };
  }

  // --- Logout Session ---
  async logout() {
    console.log('[whatsapp-web.js] Memutuskan sesi WhatsApp...');
    if (this.client) {
      try {
        await this.client.logout();
      } catch (_) {}
      try {
        await this.client.destroy();
      } catch (_) {}
      this.client = null;
    }

    this.status = 'disconnected';
    this.userInfo = null;
    this.connectedAt = null;
    this.qrCodeDataUrl = null;
    this.qrCodeRaw = null;
    this.emit('status_change', this.getStatus());

    // Bersihkan folder sesi lokal
    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
      }
    } catch (_) {}

    setTimeout(() => {
      this.init();
    }, 1000);

    return { success: true, message: 'Sesi WhatsApp berhasil diputuskan. Memuat QR Code baru...' };
  }

  // --- Dummy handleWebhook for backward compatibility ---
  async handleWebhook() {
    // No webhook needed for whatsapp-web.js
  }

  // --- Get Status Summary for Web Dashboard ---
  getStatus() {
    return {
      status: this.status,
      user: this.userInfo,
      qrDataUrl: this.qrCodeDataUrl,
      connectedAt: this.connectedAt,
      engine: this.engine
    };
  }
}

// Export singleton instance
const bot = new WhatsAppBot();
module.exports = bot;
