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
        syncFullHistory: false,
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
          this.userInfo = {
            id: this.sock.user?.id?.split(':')[0] || 'Unknown',
            name: this.sock.user?.name || 'WhatsApp CS'
          };

          this.emit('status_change', {
            status: this.status,
            user: this.userInfo,
            connectedAt: this.connectedAt
          });
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

      // Handle incoming messages concurrently (no bottleneck/queue delay between different users)
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            // Abaikan pesan broadcast status & newsletter
            if (msg.key?.remoteJid?.endsWith('@broadcast') || msg.key?.remoteJid?.endsWith('@newsletter')) {
              continue;
            }
            if (msg.key?.id && msg.message) {
              sessionManager.storeMessage(msg.key.id, msg.message);
            }
            // Process message asynchronously so User B does not wait for User A
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

  getStatus() {
    return {
      status: this.status,
      user: this.userInfo,
      qrDataUrl: this.qrCodeDataUrl,
      connectedAt: this.connectedAt
    };
  }

  async sendCustomMessage(target, text, senderName = 'Admin (Balasan Web)', explicitPhone = null, customMessageId = null) {
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
    const resolvedPhone = explicitPhone || phoneService.getPhone(jid, senderName) || phoneService.getPhone(targetStr) || jid.split('@')[0];

    console.log(`[WhatsAppBot] Mengirim pesan web ke ${jid} (Phone: ${resolvedPhone}): "${text}"`);
    await this.sock.sendMessage(jid, { text });

    const logData = {
      id: customMessageId || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      direction: 'out',
      jid,
      phone: resolvedPhone,
      senderName,
      text,
      isAi: false,
      timestamp: new Date().toISOString()
    };

    // Emit to live log & web dashboard
    this.emit('chat_log', logData);

    return { success: true, jid, phone: resolvedPhone, message: logData };
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
