const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
let messageHandler = require('./handlers/messageHandler');
const sessionManager = require('./services/sessionManager');
const phoneService = require('./services/phoneService');
const protectionService = require('./services/protectionService');
const chatService = require('./services/chatService');
const dbService = require('./services/dbService');

const AUTH_FOLDER = path.join(__dirname, '../auth_info_baileys');

class WhatsAppBot extends EventEmitter {
  constructor() {
    super();
    this.sock = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'waiting_qr' | 'connected'
    this.qrCodeRaw = null;
    this.qrCodeDataUrl = null;
    this.userInfo = null;
    this.connectedAt = null;
    this.connectedTimestamp = 0;
    this.isReconnecting = false;

    // Link messageHandler with bot's event emitter for real-time web logs
    messageHandler.setEventEmitter(this);
  }

  async init() {
    try {
      this.status = 'connecting';
      this.emit('status_change', { status: this.status });

      // Reload handlers to pick up latest code changes without needing full process restart
      try {
        delete require.cache[require.resolve('./handlers/messageHandler')];
        delete require.cache[require.resolve('./handlers/menuHandler')];
        messageHandler = require('./handlers/messageHandler');
        messageHandler.setEventEmitter(this);
      } catch (e) {
        console.warn('[WhatsAppBot] Handler reload notice:', e.message);
      }

      // Bersihkan sesi ratchet lama yang berpotensi rusak (Bad MAC / 2000 messages into future)
      // Login utama (creds.json) tetap aman dan terjaga
      this.cleanCorruptedRatchetSessions();

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`[WhatsAppBot] Menggunakan WA Web v${version.join('.')}, isLatest: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // We'll handle terminal QR explicitly with qrcode-terminal
        auth: state,
        browser: ['WhatsApp CS Bot', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        syncFullHistory: true, // Enable full WhatsApp chat and message history sync
        shouldIgnoreJid: (jid) => {
          // Abaikan status cerita & siaran newsletter agar tidak memicu error dekripsi sesi
          return (
            !jid ||
            jid.endsWith('@broadcast') ||
            jid.includes('status@broadcast') ||
            jid.endsWith('@newsletter')
          );
        },
        getMessage: async (key) => {
          return sessionManager.getMessage(key?.id);
        }
      });

      // Handle credentials update
      this.sock.ev.on('creds.update', saveCreds);

      // Handle connection updates (QR, open, close)
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCodeRaw = qr;
          this.status = 'waiting_qr';

          try {
            // Generate QR Code as base64 image for the Web Dashboard
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 7 });
          } catch (err) {
            console.error('[WhatsAppBot] Gagal membuat QR DataURL:', err.message);
          }

          console.log('\n==================================================');
          console.log('📱 SCAN QR CODE DI BAWAH INI DENGAN WHATSAPP ANDA:');
          console.log('   (Atau buka Web Dashboard di browser: http://localhost:3000)');
          console.log('==================================================\n');
          qrcodeTerminal.generate(qr, { small: true });

          this.emit('qr', { qrRaw: this.qrCodeRaw, qrDataUrl: this.qrCodeDataUrl });
          this.emit('status_change', { status: this.status, qrDataUrl: this.qrCodeDataUrl });
        }

        if (connection === 'connecting') {
          console.log('[WhatsAppBot] Sedang menyambungkan ke server WhatsApp...');
          this.status = 'connecting';
          this.emit('status_change', { status: this.status });
        }

        if (connection === 'open') {
          console.log('\n==================================================');
          console.log('✅ WHATSAPP BERHASIL TERHUBUNG & LOGIN!');
          console.log(`   Nomor Bot: ${this.sock.user?.id ? this.sock.user.id.split(':')[0] : 'Aktif'}`);
          console.log(`   Nama Akun: ${this.sock.user?.name || 'WhatsApp CS'}`);
          console.log('   Chatbot siap melayani pesan masuk.');
          console.log('==================================================\n');

          this.status = 'connected';
          this.qrCodeRaw = null;
          this.qrCodeDataUrl = null;
          this.connectedAt = new Date().toISOString();
          this.connectedTimestamp = Date.now();
          this.userInfo = {
            id: this.sock.user?.id?.split(':')[0] || 'Unknown',
            name: this.sock.user?.name || 'WhatsApp CS'
          };

          this.emit('status_change', {
            status: this.status,
            user: this.userInfo,
            connectedAt: this.connectedAt
          });
          this.emit('chats_updated', { source: 'connection_open' });
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WhatsAppBot] Koneksi terputus. Kode alasan: ${statusCode}, Reconnect: ${shouldReconnect}`);
          this.status = 'disconnected';
          this.userInfo = null;
          this.emit('status_change', { status: this.status, reason: statusCode });

          if (shouldReconnect) {
            if (!this.isReconnecting) {
              this.isReconnecting = true;
              console.log('[WhatsAppBot] Mencoba menyambung kembali dalam 5 detik...');
              setTimeout(() => {
                this.isReconnecting = false;
                this.init();
              }, 5000);
            }
          } else {
            console.log('[WhatsAppBot] Sesi telah logout atau kedaluwarsa. Membersihkan sesi...');
            this.clearSessionFolder();
            setTimeout(() => {
              this.init();
            }, 3000);
          }
        }
      });

      // Handle phone number share event
      this.sock.ev.on('chats.phoneNumberShare', ({ lid, jid }) => {
        if (lid && jid) {
          const pn = jid.split('@')[0];
          console.log(`[WhatsAppBot] Nomor telepon terhubung untuk LID ${lid} -> ${pn}`);
          phoneService.setMapping(lid, pn);
        }
      });

      // Helper for syncing contact identity (Name, Phone, LID)
      // Helper for syncing contact identity (Name, Phone, LID)
      const syncContact = (c) => {
        if (!c || !c.id || c.id === '0@s.whatsapp.net' || c.id.endsWith('@broadcast') || c.id.endsWith('@newsletter')) return;
        const name = c.name || c.notify || c.verifiedName;
        const lid = c.lid || (c.id.endsWith('@lid') ? c.id : null);
        const pn = (c.jid || c.phoneNumber || (c.id.endsWith('@s.whatsapp.net') ? c.id : null));
        let realPhone = pn ? pn.split('@')[0].replace(/\D/g, '') : null;

        if (!realPhone && c.id.endsWith('@s.whatsapp.net')) {
          const clean = c.id.split('@')[0].replace(/\D/g, '');
          if (phoneService.isRealPhone(clean)) realPhone = clean;
        }

        if (lid && realPhone && phoneService.isRealPhone(realPhone)) {
          phoneService.setMapping(lid, realPhone, name);
        } else if (realPhone && phoneService.isRealPhone(realPhone)) {
          phoneService.setMapping(c.id, realPhone, name);
        }

        if (name && !phoneService.isLid(name) && !/^\+?\d+$/.test(name)) {
          phoneService.setName(c.id, name);
          if (lid) phoneService.setName(lid, name);
          if (realPhone) phoneService.setName(realPhone, name);
        }
      };

      // 1. Handle Full Messaging History Sync from WhatsApp
      this.sock.ev.on('messaging-history.set', async ({ chats, contacts, messages, isLatest, progress }) => {
        console.log(`[WhatsAppBot] 📥 Menerima sinkronisasi riwayat WhatsApp: ${chats?.length || 0} obrolan, ${contacts?.length || 0} kontak, ${messages?.length || 0} pesan (progress: ${progress || 100}%).`);

        // a. Sinkronisasi Kontak & Nama ke phoneService TERLEBIH DAHULU
        if (Array.isArray(contacts)) {
          contacts.forEach(syncContact);
        }

        // b. Sinkronisasi Pesan Riwayat (Messages batch) KEDUA agar nomor telepon & pushName stanza terdaftar di phoneService
        if (Array.isArray(messages) && messages.length > 0) {
          const parsedList = [];
          for (const m of messages) {
            if (m.key?.id && m.message) {
              sessionManager.storeMessage(m.key.id, m.message);
            }
            const parsed = this.parseWAMessage(m);
            if (parsed) {
              parsedList.push(parsed);
              dbService.saveChatMessage(parsed).catch(() => {});
            }
          }

          if (parsedList.length > 0) {
            const added = chatService.addMessagesBatch(parsedList);
            console.log(`[WhatsAppBot] ✅ ${added.length} pesan riwayat WhatsApp berhasil disimpan.`);
          }
        }

        // c. Sinkronisasi Obrolan (Chats metadata) KETIGA setelah semua kontak & pesan terpetakan
        if (Array.isArray(chats)) {
          for (const ch of chats) {
            if (ch.id && ch.id !== '0@s.whatsapp.net' && !ch.id.endsWith('@broadcast') && !ch.id.endsWith('@newsletter')) {
              const contactName = phoneService.getName(ch.id);
              const realPhone = phoneService.getPhone(ch.id, ch.name);
              // Hanya simpan ke syncedChats jika memiliki nama kontak atau nomor telepon valid
              if (ch.name || contactName || realPhone) {
                chatService.setSyncedChat(ch.id, {
                  name: ch.name || contactName || null,
                  unreadCount: ch.unreadCount || 0,
                  updatedAt: ch.conversationTimestamp ? new Date(Number(ch.conversationTimestamp) * 1000).toISOString() : null
                });
              }
            }
          }
        }

        // d. Trigger real-time re-render di semua dashboard
        this.emit('chats_updated', { source: 'history_sync', count: messages?.length || 0 });
      });

      // 2. Handle Chats Upsert & Update
      this.sock.ev.on('chats.upsert', (newChats) => {
        if (Array.isArray(newChats)) {
          for (const ch of newChats) {
            if (ch.id && !ch.id.endsWith('@broadcast') && !ch.id.endsWith('@newsletter')) {
              const contactName = phoneService.getName(ch.id);
              chatService.setSyncedChat(ch.id, {
                name: ch.name || contactName || null,
                unreadCount: ch.unreadCount,
                updatedAt: ch.conversationTimestamp ? new Date(Number(ch.conversationTimestamp) * 1000).toISOString() : null
              });
            }
          }
          this.emit('chats_updated', { source: 'chats_upsert', count: newChats.length });
        }
      });

      this.sock.ev.on('chats.update', (updates) => {
        if (Array.isArray(updates)) {
          for (const ch of updates) {
            if (ch.id && !ch.id.endsWith('@broadcast') && !ch.id.endsWith('@newsletter')) {
              const contactName = phoneService.getName(ch.id);
              chatService.setSyncedChat(ch.id, {
                name: ch.name || contactName || null,
                unreadCount: ch.unreadCount,
                updatedAt: ch.conversationTimestamp ? new Date(Number(ch.conversationTimestamp) * 1000).toISOString() : null
              });
            }
          }
          this.emit('chats_updated', { source: 'chats_update', count: updates.length });
        }
      });

      // 3. Handle Contacts Upsert & Update
      this.sock.ev.on('contacts.upsert', (newContacts) => {
        if (Array.isArray(newContacts)) {
          newContacts.forEach(syncContact);
          this.emit('chats_updated', { source: 'contacts_upsert', count: newContacts.length });
        }
      });

      this.sock.ev.on('contacts.update', (updates) => {
        if (Array.isArray(updates)) {
          updates.forEach(syncContact);
          this.emit('chats_updated', { source: 'contacts_update', count: updates.length });
        }
      });

      // 4. Handle incoming messages (Both history append and real-time notify)
      this.sock.ev.on('messages.upsert', async (m) => {
        // Handle history append messages
        if (m.type === 'append') {
          const parsedList = [];
          for (const msg of m.messages) {
            if (msg.key?.remoteJid?.endsWith('@broadcast') || msg.key?.remoteJid?.endsWith('@newsletter')) continue;
            if (msg.key?.id && msg.message) {
              sessionManager.storeMessage(msg.key.id, msg.message);
            }
            const parsed = this.parseWAMessage(msg);
            if (parsed) {
              parsedList.push(parsed);
              dbService.saveChatMessage(parsed).catch(() => {});
            }
          }
          if (parsedList.length > 0) {
            chatService.addMessagesBatch(parsedList);
            this.emit('chats_updated', { source: 'messages_append', count: parsedList.length });
          }
          return;
        }

        // Handle live notify messages
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            // Abaikan pesan broadcast status & newsletter
            if (msg.key?.remoteJid?.endsWith('@broadcast') || msg.key?.remoteJid?.endsWith('@newsletter')) {
              continue;
            }
            if (msg.key?.id && msg.message) {
              sessionManager.storeMessage(msg.key.id, msg.message);
            }

            // Cek apakah pesan ini dikirim sebelum bot terhubung (antrean offline)
            const botConnTime = this.connectedTimestamp || 0;
            const rawTs = msg.messageTimestamp
              ? (typeof msg.messageTimestamp === 'object' && msg.messageTimestamp.low !== undefined ? msg.messageTimestamp.low : Number(msg.messageTimestamp))
              : 0;
            const msgTimeMs = rawTs > 0 ? rawTs * 1000 : Date.now();
            const isOldMessage = botConnTime > 0 && msgTimeMs < (botConnTime - 90000);

            if (isOldMessage) {
              // Simpan dan tampilkan pesan offline di dashboard tanpa memicu auto-reply bot
              const parsed = this.parseWAMessage(msg);
              if (parsed) {
                chatService.addMessage(parsed);
                dbService.saveChatMessage(parsed).catch(() => {});
                this.emit('chat_log', parsed);
              }
              continue;
            }

            // Pesan baru saat online: proses respons otomatis asisten
            messageHandler.handleMessage(this.sock, msg).catch((err) => {
              console.error('[WhatsAppBot] Error handling message:', err.message);
            });
          }
        }
      });

    } catch (err) {
      console.error('[WhatsAppBot] Error inisialisasi Baileys:', err);
      this.status = 'disconnected';
      this.emit('status_change', { status: this.status, error: err.message });
    }
  }

  parseWAMessage(msg) {
    if (!msg || !msg.key) return null;
    const jid = msg.key.remoteJid;
    if (!jid || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) return null;

    const isFromMe = Boolean(msg.key.fromMe);
    const info = messageHandler.extractMessageInfo(msg.message);
    const text = (info.text || '').trim();
    if (!text && (info.mediaType === 'unknown' || info.mediaType === 'text')) return null;
    if (text === '[text]' || text === '') return null;

    let cleanText = text;
    if (!cleanText) {
      if (info.mediaType === 'image') cleanText = info.caption ? `[Foto: ${info.caption}]` : '[Foto pelanggan]';
      else if (info.mediaType === 'video') cleanText = info.caption ? `[Video: ${info.caption}]` : '[Video pelanggan]';
      else if (info.mediaType === 'audio') cleanText = '[Pesan Suara]';
      else if (info.mediaType === 'sticker') cleanText = '[Stiker WhatsApp]';
      else if (info.mediaType === 'document') cleanText = `[Dokumen: ${info.fileName || 'File'}]`;
      else return null;
    }

    let timestampIso = new Date().toISOString();
    if (msg.messageTimestamp) {
      const rawTs = typeof msg.messageTimestamp === 'object' && msg.messageTimestamp.low !== undefined
        ? msg.messageTimestamp.low
        : Number(msg.messageTimestamp);
      if (!isNaN(rawTs) && rawTs > 0) {
        timestampIso = new Date(rawTs * 1000).toISOString();
      }
    }

    // 1. Resolve real phone number from stanza attributes, remoteJid, participant, or mapping
    const rawPn = msg.key?.senderPn || msg.key?.participantPn;
    let realPhone = null;
    if (rawPn) {
      const clean = rawPn.split('@')[0].replace(/\D/g, '');
      if (phoneService.isRealPhone(clean)) realPhone = clean;
    }
    if (!realPhone && jid && jid.endsWith('@s.whatsapp.net')) {
      const clean = jid.split('@')[0].replace(/\D/g, '');
      if (phoneService.isRealPhone(clean)) realPhone = clean;
    }
    if (!realPhone && msg.key?.participant && msg.key.participant.endsWith('@s.whatsapp.net')) {
      const clean = msg.key.participant.split('@')[0].replace(/\D/g, '');
      if (phoneService.isRealPhone(clean)) realPhone = clean;
    }
    if (!realPhone && msg.participant && typeof msg.participant === 'string' && msg.participant.endsWith('@s.whatsapp.net')) {
      const clean = msg.participant.split('@')[0].replace(/\D/g, '');
      if (phoneService.isRealPhone(clean)) realPhone = clean;
    }
    if (!realPhone) {
      realPhone = phoneService.getPhone(jid, msg.pushName);
    }
    if (realPhone && phoneService.isRealPhone(realPhone)) {
      phoneService.setMapping(jid, realPhone, msg.pushName);
    }

    // 2. Resolve sender name (Reject raw LID or digit strings)
    let senderName = 'Saya';
    if (!isFromMe) {
      const candidateName = msg.pushName;
      if (candidateName && !phoneService.isLid(candidateName) && !/^\+?\d+$/.test(candidateName.trim())) {
        senderName = candidateName.trim();
        phoneService.setName(jid, senderName);
        if (realPhone) phoneService.setName(realPhone, senderName);
      } else {
        const storedName = phoneService.getName(jid) || (realPhone ? phoneService.getName(realPhone) : null);
        if (storedName) {
          senderName = storedName;
        } else if (realPhone) {
          senderName = phoneService.formatPhone(realPhone);
        } else {
          senderName = 'Pelanggan';
        }
      }
    }

    // If still missing phone and jid is LID, attempt asynchronous resolution
    if (!realPhone && phoneService.isLid(jid)) {
      this.resolveLidPhone(jid, senderName).catch(() => {});
    }

    return {
      id: msg.key.id || `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      direction: isFromMe ? 'out' : 'in',
      jid,
      phone: realPhone || null,
      formattedPhone: phoneService.formatPhone(realPhone, jid),
      senderName,
      text: cleanText,
      mediaType: info.mediaType || 'text',
      image: null,
      isAi: false,
      timestamp: timestampIso
    };
  }

  getStatus() {
    return {
      status: this.status,
      user: this.userInfo,
      qrDataUrl: this.qrCodeDataUrl,
      connectedAt: this.connectedAt
    };
  }

  async sendCustomMessage(target, text, senderName = 'Admin (Balasan Web)', explicitPhone = null, customMessageId = null, options = {}) {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('Bot belum terhubung ke WhatsApp.');
    }

    if (!target) {
      throw new Error('Tujuan pengiriman pesan tidak valid.');
    }

    let jid;
    let targetStr = String(target).trim();

    // Check if target is already a full JID (e.g. @lid, @s.whatsapp.net, @g.us)
    if (targetStr.includes('@s.whatsapp.net') || targetStr.includes('@lid') || targetStr.includes('@g.us')) {
      jid = targetStr;
    } else {
      let cleanPhone = targetStr.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      jid = `${cleanPhone}@s.whatsapp.net`;
    }

    // Determine real phone number to display
    const candidatePhone = explicitPhone || phoneService.getPhone(jid, senderName) || phoneService.getPhone(targetStr);
    const resolvedPhone = (candidatePhone && phoneService.isRealPhone(candidatePhone))
      ? candidatePhone
      : (jid.endsWith('@s.whatsapp.net') ? jid.split('@')[0] : null);

    console.log(`[WhatsAppBot] Mengirim pesan web ke ${jid} (Phone: ${resolvedPhone || 'LID'}): "${text}"`);

    // Prepare message payload (text or image)
    let messagePayload = { text: text || '' };
    let hasImage = false;
    let imageLog = null;

    if (options.image || options.imageBase64) {
      let imageBuffer = null;
      if (options.imageBase64 && typeof options.imageBase64 === 'string') {
        const matches = options.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const b64 = matches ? matches[2] : options.imageBase64;
        imageBuffer = Buffer.from(b64, 'base64');
      } else if (Buffer.isBuffer(options.image)) {
        imageBuffer = options.image;
      } else if (typeof options.image === 'string') {
        if (options.image.startsWith('http://') || options.image.startsWith('https://')) {
          messagePayload = { image: { url: options.image }, caption: text || '', mimetype: 'image/jpeg' };
          hasImage = true;
          imageLog = options.image;
        } else {
          let resolvedPath = options.image;
          if (!fs.existsSync(resolvedPath)) {
            const cleanRel = String(options.image).replace(/^[/\\]+/, '').replace(/^assets[/\\]+/, '');
            const candidates = [
              path.join(process.cwd(), 'public', cleanRel),
              path.join(process.cwd(), 'assets', cleanRel),
              path.join(__dirname, '../public', cleanRel),
              path.join(__dirname, '../assets', cleanRel)
            ];
            for (const cand of candidates) {
              if (fs.existsSync(cand)) {
                resolvedPath = cand;
                break;
              }
            }
          }
          if (fs.existsSync(resolvedPath)) {
            imageBuffer = fs.readFileSync(resolvedPath);
            imageLog = options.image;
          }
        }
      }

      if (imageBuffer) {
        messagePayload = { image: imageBuffer, caption: text || '', mimetype: 'image/jpeg' };
        hasImage = true;
        imageLog = options.imagePath || imageLog || 'custom_upload.jpg';
      }
    }

    // 🛡️ Global rate limit wait & send with retry limit
    await protectionService.waitForGlobalRateLimit();
    await protectionService.withRetry(async () => {
      return await this.sock.sendMessage(jid, messagePayload);
    }, {
      maxRetries: 2,
      baseDelayMs: 1000,
      context: `Web dashboard send to ${jid}`
    });

    // 🛡️ Otomatis aktifkan mode Human CS (Handoff) agar bot tidak menimpa percakapan admin
    sessionManager.setHumanMode(jid, true, 'Balasan manual via Dashboard Admin');

    const logData = {
      id: customMessageId || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      direction: 'out',
      jid,
      phone: resolvedPhone,
      senderName,
      text: text || (hasImage ? '[Foto Terkirim]' : ''),
      mediaType: hasImage ? 'image' : 'text',
      image: imageLog,
      isAi: false,
      timestamp: new Date().toISOString()
    };

    // Emit to live log & web dashboard
    this.emit('chat_log', logData);
    dbService.saveChatMessage(logData).catch(() => {});

    return { success: true, jid, phone: resolvedPhone, message: logData };
  }

  async resolveLidPhone(lid, senderName = null) {
    if (!lid || !phoneService.isLid(lid) || !this.sock) return null;
    const cleanLid = lid.includes('@') ? lid : `${lid}@lid`;
    try {
      const { USyncQuery, USyncUser } = require('@whiskeysockets/baileys');
      const usyncQuery = new USyncQuery().withContactProtocol();
      usyncQuery.withUser(new USyncUser().withId(cleanLid));
      const result = await this.sock.executeUSyncQuery(usyncQuery);
      if (result && Array.isArray(result.list)) {
        for (const item of result.list) {
          const itemJid = item.id;
          if (itemJid && itemJid.endsWith('@s.whatsapp.net')) {
            const cleanPn = itemJid.split('@')[0].replace(/\D/g, '');
            if (phoneService.isRealPhone(cleanPn)) {
              console.log(`[WhatsAppBot] 🔍 Berhasil menyelesaikan LID ${lid} -> ${cleanPn}`);
              phoneService.setMapping(cleanLid, cleanPn, senderName);
              this.emit('chats_updated', { source: 'lid_resolved', lid: cleanLid, phone: cleanPn });
              return cleanPn;
            }
          }
        }
      }
    } catch (err) {
      // USync query fallback
    }
    return null;
  }

  cleanCorruptedRatchetSessions() {
    try {
      if (!fs.existsSync(AUTH_FOLDER)) return;
      const files = fs.readdirSync(AUTH_FOLDER);
      let count = 0;
      for (const f of files) {
        // Hapus session-*.json yang menyimpan counter ratchet usang
        // creds.json (kunci login akun) dan pre-key-*.json TETAP dipertahankan aman!
        if (f.startsWith('session-')) {
          try {
            fs.unlinkSync(path.join(AUTH_FOLDER, f));
            count++;
          } catch (_) {}
        }
      }
      if (count > 0) {
        console.log(`[WhatsAppBot] Membersihkan ${count} cache sesi ratchet lama agar terhindar dari Bad MAC & Over 2000 messages.`);
      }
    } catch (err) {
      console.warn('[WhatsAppBot] Gagal membersihkan sesi ratchet:', err.message);
    }
  }

  clearSessionFolder() {
    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        console.log('[WhatsAppBot] Folder sesi berhasil dibersihkan.');
      }
    } catch (err) {
      console.error('[WhatsAppBot] Gagal menghapus folder sesi:', err.message);
    }
  }

  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
      }
    } catch (err) {
      console.error('[WhatsAppBot] Error saat logout:', err.message);
    }
    this.clearSessionFolder();
    this.status = 'disconnected';
    this.userInfo = null;
    this.qrCodeDataUrl = null;
    this.emit('status_change', { status: this.status });
    setTimeout(() => {
      this.init();
    }, 2000);
    return { success: true };
  }

  async restart() {
    try {
      if (this.sock) {
        this.sock.end(undefined);
      }
    } catch (err) {
      console.error('[WhatsAppBot] Error saat restart socket:', err.message);
    }
    setTimeout(() => {
      this.init();
    }, 2000);
    return { success: true };
  }
}

module.exports = new WhatsAppBot();
