const fs = require('fs');
const path = require('path');
const menuHandler = require('./menuHandler');
const ticketService = require('../services/ticketService');
const sessionManager = require('../services/sessionManager');
const aiService = require('../services/aiService');
const phoneService = require('../services/phoneService');
const { stripStarsAndEmojis } = require('../utils/textCleaner');
const protectionService = require('../services/protectionService');
const timeHelper = require('../utils/timeHelper');

class MessageHandler {
  constructor() {
    this.eventEmitter = null;
    this.userQueues = new Map(); // Per-JID concurrency queue
  }

  setEventEmitter(emitter) {
    this.eventEmitter = emitter;
  }

  emitLog(logData) {
    if (this.eventEmitter) {
      this.eventEmitter.emit('chat_log', logData);
    }
  }

  extractMessageInfo(message) {
    if (!message) return { text: '', mediaType: 'unknown' };
    let msg = message;
    if (msg.viewOnceMessage?.message) msg = msg.viewOnceMessage.message;
    if (msg.viewOnceMessageV2?.message) msg = msg.viewOnceMessageV2.message;
    if (msg.ephemeralMessage?.message) msg = msg.ephemeralMessage.message;
    if (msg.documentWithCaptionMessage?.message) msg = msg.documentWithCaptionMessage.message;

    // 1. Text message
    if (msg.conversation) {
      return { text: msg.conversation, mediaType: 'text' };
    }
    if (msg.extendedTextMessage?.text) {
      return { text: msg.extendedTextMessage.text, mediaType: 'text' };
    }

    // 2. Image message
    if (msg.imageMessage) {
      const caption = msg.imageMessage.caption ? msg.imageMessage.caption.trim() : '';
      return {
        text: caption || '',
        mediaType: 'image',
        caption,
        mimetype: msg.imageMessage.mimetype || 'image/jpeg'
      };
    }

    // 3. Video message
    if (msg.videoMessage) {
      const caption = msg.videoMessage.caption ? msg.videoMessage.caption.trim() : '';
      const seconds = msg.videoMessage.seconds ? `${msg.videoMessage.seconds} detik` : '';
      return {
        text: caption ? `[Video: ${caption}]` : `[Video pelanggan ${seconds}]`.trim(),
        mediaType: 'video',
        caption,
        mimetype: msg.videoMessage.mimetype || 'video/mp4'
      };
    }

    // 4. Sticker message
    if (msg.stickerMessage) {
      return {
        text: '[Stiker WhatsApp]',
        mediaType: 'sticker',
        mimetype: msg.stickerMessage.mimetype || 'image/webp'
      };
    }

    // 5. Document message
    if (msg.documentMessage) {
      const fileName = msg.documentMessage.fileName || 'Dokumen';
      const caption = msg.documentMessage.caption || '';
      return {
        text: caption ? `[Dokumen: ${fileName} - ${caption}]` : `[Dokumen: ${fileName}]`,
        mediaType: 'document',
        fileName
      };
    }

    // 6. Audio message
    if (msg.audioMessage) {
      return {
        text: '[Pesan Suara]',
        mediaType: 'audio'
      };
    }

    // 7. Interactive / Button responses (Semua fungsi tombol WhatsApp terlindungi & didukung penuh)
    if (msg.templateButtonReplyMessage?.selectedId) {
      return { text: msg.templateButtonReplyMessage.selectedId, mediaType: 'text' };
    }
    if (msg.templateButtonReplyMessage?.selectedDisplayText) {
      return { text: msg.templateButtonReplyMessage.selectedDisplayText, mediaType: 'text' };
    }
    if (msg.buttonsResponseMessage?.selectedButtonId) {
      return { text: msg.buttonsResponseMessage.selectedButtonId, mediaType: 'text' };
    }
    if (msg.buttonsResponseMessage?.selectedDisplayText) {
      return { text: msg.buttonsResponseMessage.selectedDisplayText, mediaType: 'text' };
    }
    if (msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
      try {
        const params = JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
        const val = params.id || params.selectedId || params.rowId || params.title;
        if (val) return { text: val, mediaType: 'text' };
      } catch (e) { }
    }
    if (msg.interactiveResponseMessage?.body?.text) {
      return { text: msg.interactiveResponseMessage.body.text, mediaType: 'text' };
    }
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId) {
      return { text: msg.listResponseMessage.singleSelectReply.selectedRowId, mediaType: 'text' };
    }
    if (msg.listResponseMessage?.title) {
      return { text: msg.listResponseMessage.title, mediaType: 'text' };
    }

    return { text: '', mediaType: 'unknown' };
  }

  detectServiceIntent(textLower) {
    if (!textLower) return null;
    const clean = textLower.trim();

    // 1. Klaim Garansi
    const isWarrantyInfoOnly = /^(apakah ada|ada|info|informasi|syarat|ketentuan|berapa lama)\s+garansi/i.test(clean) ||
      clean === '5' || clean === 'garansi';

    if (!isWarrantyInfoOnly) {
      if (
        clean.includes('klaim garansi') ||
        clean.includes('ajukan klaim') ||
        clean.includes('klaim') ||
        clean.includes('retur') ||
        clean.includes('ganti baru') ||
        clean.includes('rusak garansi') ||
        clean.includes('garansi rusak') ||
        clean.includes('pecah saat pengiriman') ||
        clean.includes('rusak saat pengiriman') ||
        clean.includes('retak saat datang') ||
        clean.includes('barang pecah')
      ) {
        return 'Klaim Garansi';
      }
    }

    // 2. Pengaduan Produk / Komplain
    if (
      clean === '7' ||
      clean.includes('pengaduan') ||
      clean.includes('komplain') ||
      clean.includes('keluhan') ||
      clean.includes('kecewa') ||
      clean.includes('cacat') ||
      clean.includes('salah kirim') ||
      clean.includes('barang kurang') ||
      clean.includes('tidak sesuai') ||
      clean.includes('jahitan lepas') ||
      clean.includes('sobek') ||
      clean.includes('lapor kendala') ||
      clean.includes('lapor masalah') ||
      clean.includes('rusak') ||
      clean.includes('pelayanan buruk')
    ) {
      return 'Pengaduan & Komplain';
    }

    // 3. Pembelian / Pemesanan Produk
    const isOrderHowToOnly = /^(bagaimana|gimana|cara|tutorial)\s+(pesan|order|beli|membeli|memesan)/i.test(clean);
    const isPureInquiry = /^(apakah|bisa|boleh|ada|berapa minimal)\s+(beli|dibeli|pesan|dipesan|order)\s+(meteran|custom|eceran|sedikit|rollan)/i.test(clean);

    if (!isOrderHowToOnly && !isPureInquiry) {
      if (
        clean.includes('membeli') ||
        clean.includes('memesan') ||
        clean.includes('mengorder') ||
        clean.includes('checkout') ||
        clean.includes('booking') ||
        clean.includes('mau beli') ||
        clean.includes('ingin beli') ||
        clean.includes('mau pesan') ||
        clean.includes('ingin pesan') ||
        clean.includes('mau order') ||
        clean.includes('ingin order') ||
        clean.includes('beli ini') ||
        clean.includes('pesan ini') ||
        clean.includes('order ini') ||
        clean.includes('ambil ini') ||
        clean.includes('ambil yang ini') ||
        clean.includes('beli yang ini') ||
        clean.includes('pesan yang ini') ||
        clean.includes('order yang ini') ||
        clean.includes('beli karpet') ||
        clean.includes('pesan karpet') ||
        clean.includes('order karpet') ||
        clean.includes('beli sekarang') ||
        clean.includes('pesan sekarang') ||
        clean.includes('order sekarang') ||
        clean.includes('jadi beli') ||
        clean.includes('jadi pesan') ||
        clean.includes('jadi order') ||
        clean.includes('fix beli') ||
        clean.includes('fix pesan') ||
        clean.includes('fix order') ||
        clean.includes('proses pembelian') ||
        clean.includes('proses order') ||
        clean.includes('proses pesanan') ||
        clean.includes('minta rekening') ||
        clean.includes('nomor rekening') ||
        clean.includes('no rekening') ||
        clean.includes('transfer kemana') ||
        clean.startsWith('order') ||
        clean.startsWith('pesan') ||
        clean.startsWith('beli') ||
        clean.startsWith('membeli') ||
        clean.startsWith('memesan')
      ) {
        return 'Pemesanan Produk';
      }
    }

    return null;
  }

  async handleMessage(sock, msg) {
    if (!msg || !msg.key || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    if (!jid) return;

    // Abaikan broadcast status & newsletter
    if (jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) {
      return;
    }

    const isGroup = jid.endsWith('@g.us');
    const config = menuHandler.getConfig();
    if (isGroup && config.bot?.ignore_groups) {
      return;
    }

    const messageInfo = this.extractMessageInfo(msg.message);
    const rawText = (messageInfo.text || '').trim();
    if (!rawText) return;

    // 🛡️ 1. Proteksi Message Deduplication (Inbound ID & Content Fingerprint)
    // Mencegah looping / replay pesan yang sama saat reconnect atau retry jaringan
    if (protectionService.isDuplicateInbound(msg.key?.id, jid, rawText)) {
      console.log(`[Protection:Deduplication] Mengabaikan pesan duplikat dari ${jid} (ID: ${msg.key?.id})`);
      return;
    }
    protectionService.recordInbound(msg.key?.id, jid, rawText);

    // 🛡️ 1.5. Proteksi Inbound Flood: Nomor customer tidak boleh diblokir sama sekali
    // Semua pesan pelanggan akan selalu diproses secara lancar tanpa pemblokiran

    // 🛡️ 2. Proteksi Opt-In / Consent Policy (0pt-in & Opt-Out)
    // Kepatuhan regulasi WA: Jika user kirim STOP/BERHENTI, bot diam selamanya agar nomor tidak dilaporkan SPAM
    const optCheck = protectionService.checkOptInOut(jid, rawText);
    if (optCheck.handled) {
      if (optCheck.shouldIgnore) {
        // User telah opt-out: diam secara silent tanpa membalas apapun
        return;
      }
      if (optCheck.reply) {
        await this.sendReply(sock, jid, optCheck.reply, msg);
        return;
      }
    }

    // 🛡️ 3. Proteksi Conversation Buffer (Inbound Multi-Burst Aggregator)
    // Mengumpulkan pesan beruntun dari pengguna (misal 2 detik) menjadi 1 kesatuan utuh
    // Mencegah bot membalas setiap bubble chat secara terpisah
    protectionService.bufferInboundMessage(
      jid,
      msg,
      rawText,
      messageInfo.mediaType,
      (record) => {
        this._enqueueUserProcessing(sock, jid, record);
      }
    );
  }

  _enqueueUserProcessing(sock, jid, record) {
    // Non-blocking per-JID concurrency queue:
    // Different users process simultaneously in parallel.
    // Rapid turns from the SAME user are processed in strict sequence.
    const currentPromise = this.userQueues.get(jid) || Promise.resolve();
    const nextPromise = currentPromise
      .then(() => this._processAggregatedMessage(sock, jid, record))
      .catch(err => {
        console.error(`[MessageHandler] Error handling message for ${jid}:`, err.message);
      })
      .finally(() => {
        if (this.userQueues.get(jid) === nextPromise) {
          this.userQueues.delete(jid);
        }
      });

    this.userQueues.set(jid, nextPromise);
    return nextPromise;
  }

  async _processAggregatedMessage(sock, jid, record) {
    try {
      const msg = record.lastMsg;
      if (!msg.message || msg.key.fromMe) return;

      // Catat waktu awal pesan masuk dari customer untuk kalkulasi jeda respons tepat ~1 menit
      msg._inboundTimestamp = record.startTime || Date.now();

      const config = menuHandler.getConfig();
      const rawText = record.texts.join(' \n ').trim();
      if (!rawText) return;

      // 1. Resolve real sender name (never purely digits or LID)
      let senderName = 'Pelanggan';
      if (msg.pushName && !phoneService.isLid(msg.pushName) && !/^\+?\d+$/.test(msg.pushName.trim())) {
        senderName = msg.pushName.trim();
        phoneService.setName(jid, senderName);
      } else {
        const storedName = phoneService.getName(jid);
        if (storedName) senderName = storedName;
      }

      // 2. Extract real phone number
      const rawPn = msg.key.senderPn || msg.key.participantPn;
      let realPhone = null;
      if (rawPn) {
        const clean = rawPn.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) {
          realPhone = clean;
          phoneService.setMapping(jid, realPhone, senderName);
        }
      } else if (jid.endsWith('@s.whatsapp.net')) {
        const clean = jid.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) {
          realPhone = clean;
          phoneService.setMapping(jid, realPhone, senderName);
        }
      } else {
        realPhone = phoneService.getPhone(jid, senderName);
      }

      if (realPhone && phoneService.isRealPhone(realPhone)) {
        phoneService.setName(realPhone, senderName);
      }

      const cleanPhone = (realPhone && phoneService.isRealPhone(realPhone)) ? realPhone : null;

      // Emit incoming message to dashboard
      let incomingMedia = null;
      if ((record.mediaType === 'image' || record.mediaType === 'video' || record.mediaType === 'audio') && record.lastMsg) {
        try {
          const mediaService = require('../services/mediaService');
          incomingMedia = await mediaService.downloadAndSaveMedia(record.lastMsg, sock);
        } catch (e) {
          console.warn('[MessageHandler] Gagal download media:', e.message);
        }
      }

      this.emitLog({
        id: msg.key.id,
        direction: 'in',
        jid,
        phone: cleanPhone,
        formattedPhone: phoneService.formatPhone(cleanPhone, jid),
        senderName,
        text: rawText,
        mediaType: record.mediaType,
        image: incomingMedia?.mediaType === 'image' ? incomingMedia.url : null,
        video: incomingMedia?.mediaType === 'video' ? incomingMedia.url : null,
        audio: incomingMedia?.mediaType === 'audio' ? incomingMedia.url : null,
        mediaUrl: incomingMedia?.url || null,
        timestamp: new Date().toISOString()
      });

      // Jika sistem proteksi cooldown aktif, tanda baca (read receipt / centang biru)
      // akan ditunda secara alami (3-8 detik) di dalam waitForUserCooldown agar tidak terbaca 0ms robotik
      const protections = protectionService.getConfig();
      if (config.bot?.auto_read_messages && protections.cooldown?.enabled === false) {
        await sock.readMessages([msg.key]).catch(() => { });
      }

      // 🛡️ 4. Sesi & Session Timeout Check
      const session = sessionManager.getSession(jid);
      const textLower = rawText.toLowerCase();
      const textTrim = rawText.trim();

      // 🛡️ 5. Proteksi Human Handoff (Transisi & Pelepasan Mode CS Manusia)
      const handoffKeyword = protectionService.checkHandoffKeywords(textLower);

      // Jika user sedang dalam mode CS dan mengirim kata kunci kembali ke bot:
      if (handoffKeyword === 'RELEASE' && sessionManager.isHumanMode(jid)) {
        sessionManager.setHumanMode(jid, false);
        const menuText = stripStarsAndEmojis(menuHandler.getMainMenu(senderName));
        const reply = `Mode asisten otomatis telah aktif kembali.\n\n${menuText}`;
        await this.sendReply(sock, jid, reply, msg);
        return;
      }

      // Jika user meminta bantuan CS manusia secara eksplisit:
      if (handoffKeyword === 'TRIGGER') {
        sessionManager.setHumanMode(jid, true, 'User triggered CS: ' + textLower);
        const reply = menuHandler.getHumanCsPrompt();
        if (this.eventEmitter) {
          this.eventEmitter.emit('human_cs_requested', {
            phone: cleanPhone,
            senderName,
            jid,
            timestamp: new Date().toISOString()
          });
        }
        await this.sendReply(sock, jid, reply, msg);
        return;
      }

      // Jika user sedang dalam penanganan CS manusia atau AI kontak dinonaktifkan, bot DIAM dan tidak menimpa chat admin
      if (sessionManager.isHumanMode(jid) || protectionService.isHumanHandoff(jid)) {
        console.log(`[CS Mode] Pesan dari ${cleanPhone || jid}: "${rawText}" (Sedang dalam penanganan CS manusia / AI nonaktif - Bot diam)`);
        return;
      }

      // 🎯 Intent Detection: Pengaduan/Komplain, Klaim Garansi, & Pesanan
      // Saat customer melakukan salah satu dari 3 hal ini pada status IDLE:
      // 1. Bot membuat tiket antrian resmi dengan nomor antrian harian (#A-00X)
      // 2. Bot mengirim tiket antrian ke customer di WhatsApp
      // 3. Obrolan otomatis dialihkan ke Hands-Off (menunggu konfirmasi dari admin)
      // 🎯 Intent Detection: Pengaduan/Komplain, Klaim Garansi, & Pesanan
      // Saat customer melakukan salah satu dari 3 hal ini:
      // 1. Bot membuat tiket antrian resmi dengan nomor antrian harian (#A-00X)
      // 2. Bot mengirim tiket antrian ke customer di WhatsApp
      // 3. Obrolan otomatis dialihkan ke Hands-Off (menunggu konfirmasi dari admin)
      let detectedIntent = null;
      if (!['HUMAN_CS', 'TICKET_NAME', 'TICKET_CONTACT', 'TICKET_DESC'].includes(session.state)) {
        detectedIntent = this.detectServiceIntent(textLower);
        if (detectedIntent) {
          let extraInfo = '';
          if (detectedIntent === 'Pemesanan Produk') {
            let matchedItem = menuHandler.getCatalogItem(textLower);
            if (!matchedItem) {
              matchedItem = session.data?.lastViewedProduct ||
                            session.data?.selectedProduct ||
                            session.data?.pendingDetailProduct;
            }
            if (matchedItem) {
              extraInfo = ` [Produk: ${matchedItem.title} - Harga: ${matchedItem.price}]`;
            }
          }

          let complaintNote = '';
          if (detectedIntent === 'Pengaduan & Komplain' && (textTrim === '7' || textLower === 'komplain' || textLower === 'pengaduan')) {
            complaintNote = 'Pengaduan & Komplain Pelanggan';
          }

          const fullDesc = complaintNote || `${rawText}${extraInfo}`.trim();
          const priority = (detectedIntent.includes('Garansi') || detectedIntent.includes('Komplain') || detectedIntent.includes('Pengaduan')) ? 'Tinggi' : 'Normal';

          const { ticket, isNew } = ticketService.ensureActiveTicket({
            sender: cleanPhone || jid,
            name: senderName,
            contact: phoneService.formatPhone(cleanPhone, jid),
            description: fullDesc,
            category: detectedIntent,
            priority
          });

          // 1. Emit ke Dashboard & Admin secara real-time
          if (this.eventEmitter) {
            if (isNew) this.eventEmitter.emit('ticket_created', ticket);
            this.eventEmitter.emit('human_cs_requested', {
              phone: cleanPhone,
              senderName,
              jid,
              category: detectedIntent,
              ticketId: ticket.id,
              queueNumber: ticket.queueNumber,
              timestamp: new Date().toISOString()
            });
          }

          // 2. Kirim pesan Tiket Antrian ke Customer
          const queueReply = menuHandler.getQueueTicketMessage(ticket, senderName);
          await this.sendReply(sock, jid, queueReply, msg);

          // 3. Otomatis Hands-Off: Sesi obrolan dialihkan ke CS manusia & bot diam menunggu konfirmasi admin
          sessionManager.setHumanMode(jid, true, `Tiket ${ticket.id} (${detectedIntent}) dibuat - Hands-off menunggu konfirmasi admin`);

          console.log(`[Hands-Off] Chat ${jid} (${cleanPhone || senderName}) otomatis hands-off menunggu konfirmasi admin. Tiket: ${ticket.id}, Antrian: ${ticket.queueNumber}, Kategori: ${detectedIntent}`);
          return;
        }
      }

      // 🛡️ Anti-Spam: Jangan membalas pesan penutup atau basa-basi ucapan terima kasih
      // Mengabaikan pesan seperti: 'terima kasih', 'makasih kak', 'oke siap', 'sip' agar tidak spamming ke pelanggan
      const isClosingPleasantry = /^(oke\s+)?(terima\s*kasih|makasih|trims|tengkyu|thanks|thank\s*you|thx|tq)(\s*(ya|kak|gan|pak|bu|mas|mbak|banyak))?$/i.test(textTrim) ||
        /^(siap|oke\s*siap|ok\s*siap|sip|oke\s*sip|baik\s*terima\s*kasih|siap\s*terima\s*kasih|oke\s*makasih|ok\s*makasih|sama-sama|sama\s*sama|sama2)(\s*(ya|kak|gan|pak|bu|mas|mbak))?$/i.test(textTrim);

      if (isClosingPleasantry && session.state === 'IDLE') {
        console.log(`[Protection:AntiSpam] Mengabaikan pesan penutup dari ${jid} ("${textTrim}") agar percakapan selesai alami tanpa spam.`);
        return;
      }

      // Global Reset / Menu Commands
      if (['0', 'menu', 'help', 'bantuan', 'batal', 'cancel', 'reset'].includes(textLower)) {
        sessionManager.resetSession(jid);
        await this.sendListMenu(sock, jid, senderName, msg);
        return;
      }

      // Check Order Shortcuts (e.g. order 1, pesan 1, order everyday set)
      if (textLower.startsWith('order_') || textLower.startsWith('pesan ') || textLower.startsWith('order ')) {
        const itemIdentifier = textLower.replace(/^(order_|pesan\s+|order\s+)/i, '').trim();
        const catalogItem = menuHandler.getCatalogItem(itemIdentifier) || 
                            session.data?.lastViewedProduct || 
                            session.data?.selectedProduct || 
                            session.data?.pendingDetailProduct || 
                            menuHandler.getCatalogItem('1');

        if (catalogItem) {
          const extraInfo = ` [Produk: ${catalogItem.title} - Harga: ${catalogItem.price}]`;
          const fullDesc = `${rawText}${extraInfo}`.trim();

          const { ticket, isNew } = ticketService.ensureActiveTicket({
            sender: cleanPhone || jid,
            name: senderName,
            contact: phoneService.formatPhone(cleanPhone, jid),
            description: fullDesc,
            category: 'Pemesanan Produk',
            priority: 'Normal'
          });

          if (this.eventEmitter) {
            if (isNew) this.eventEmitter.emit('ticket_created', ticket);
            this.eventEmitter.emit('human_cs_requested', {
              phone: cleanPhone,
              senderName,
              jid,
              category: 'Pemesanan Produk',
              ticketId: ticket.id,
              queueNumber: ticket.queueNumber,
              timestamp: new Date().toISOString()
            });
          }

          const queueReply = menuHandler.getQueueTicketMessage(ticket, senderName);
          await this.sendReply(sock, jid, queueReply, msg);
          sessionManager.setHumanMode(jid, true, `Tiket ${ticket.id} (Pemesanan Produk) dibuat - Hands-off menunggu konfirmasi admin`);
          return;
        }
      }

      // Check Dialog State Machine
      switch (session.state) {
        case 'SELECT_PRODUCT':
          await this.handleSelectProductState(sock, jid, rawText, msg);
          return;

        case 'CONFIRM_PRODUCT':
          await this.handleConfirmProductState(sock, jid, rawText, msg);
          return;

        case 'SELECT_BRANCH':
          await this.handleSelectBranchState(sock, jid, rawText, msg);
          return;

        case 'CHECK_TICKET':
          await this.handleCheckTicketState(sock, jid, rawText, msg);
          return;

        case 'TICKET_NAME':
          await this.handleTicketNameState(sock, jid, rawText, msg);
          return;

        case 'TICKET_CONTACT':
          await this.handleTicketContactState(sock, jid, rawText, msg);
          return;

        case 'TICKET_DESC':
          await this.handleTicketDescState(sock, jid, rawText, msg, cleanPhone, senderName);
          return;

        case 'IDLE':
        default:
          await this.handleIdleMenu(sock, jid, rawText, senderName, msg, cleanPhone, detectedIntent);
          return;
      }

    } catch (err) {
      console.error('[MessageHandler] Error handling message:', err);
    }
  }

  async handleCheckTicketState(sock, jid, text, originalMsg) {
    const ticketId = text.trim();
    const ticket = ticketService.getTicketById(ticketId);
    const reply = menuHandler.getTicketStatusMessage(ticket);
    sessionManager.resetSession(jid);
    await this.sendReply(sock, jid, reply, originalMsg);
  }

  async handleTicketNameState(sock, jid, text, originalMsg) {
    const name = text.trim();
    if (!name || name.length < 2) {
      const reply = 'Mohon informasikan nama lengkap Anda agar dapat kami catat.';
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    sessionManager.setState(jid, 'TICKET_CONTACT', { name });
    const reply = `Terima kasih ${name}. Selanjutnya, mohon masukkan alamat email atau nomor telepon yang dapat dihubungi:`;
    await this.sendReply(sock, jid, reply, originalMsg);
  }

  async handleTicketContactState(sock, jid, text, originalMsg) {
    const contact = text.trim();
    const session = sessionManager.getSession(jid);
    sessionManager.setState(jid, 'TICKET_DESC', { contact });

    if (session.data?.product) {
      const reply = `Baik. Mohon sampaikan alamat pengiriman lengkap atau catatan khusus untuk pesanan ${session.data.product}:`;
      await this.sendReply(sock, jid, reply, originalMsg);
    } else {
      const reply = 'Baik. Mohon sampaikan secara rinci keperluan atau kendala yang ingin Anda sampaikan:';
      await this.sendReply(sock, jid, reply, originalMsg);
    }
  }

  async handleTicketDescState(sock, jid, text, originalMsg, phone, senderName) {
    const description = text.trim();
    const session = sessionManager.getSession(jid);
    const name = session.data?.name || senderName;
    const contact = session.data?.contact || (phone ? phoneService.formatPhone(phone, jid) : '-');
    const product = session.data?.product || null;

    const fullDesc = product ? `[Pesanan: ${product}] Alamat/Catatan: ${description}` : description;
    const category = product ? 'Pemesanan Produk' : 'Layanan Umum';

    const newTicket = ticketService.createTicket({
      sender: phone || jid,
      name,
      contact,
      description: fullDesc,
      category,
      priority: product ? 'Tinggi' : 'Normal'
    });

    sessionManager.resetSession(jid);

    if (this.eventEmitter) {
      this.eventEmitter.emit('ticket_created', newTicket);
      this.eventEmitter.emit('human_cs_requested', {
        phone,
        senderName: name,
        jid,
        category,
        ticketId: newTicket.id,
        queueNumber: newTicket.queueNumber,
        timestamp: new Date().toISOString()
      });
    }

    // Kirim Tiket Antrian resmi ke customer
    const reply = menuHandler.getQueueTicketMessage(newTicket, name);
    await this.sendReply(sock, jid, reply, originalMsg);

    // Otomatis Hands-Off: Sesi chat dialihkan ke CS manusia & bot diam menunggu konfirmasi admin
    sessionManager.setHumanMode(jid, true, `Pesanan ${newTicket.id} dibuat - Hands-off menunggu konfirmasi admin`);
    console.log(`[Hands-Off] Pesanan selesai untuk ${jid} (Tiket: ${newTicket.id}, Antrian: ${newTicket.queueNumber}) - Hands-off menunggu konfirmasi admin.`);
  }

  async handleSelectProductState(sock, jid, text, originalMsg) {
    const textTrim = text.trim();
    const textLower = textTrim.toLowerCase();
    const session = sessionManager.getSession(jid);
    const catalog = menuHandler.getCatalog();

    if (['0', 'menu', 'batal', 'kembali'].includes(textLower)) {
      sessionManager.resetSession(jid);
      await this.sendListMenu(sock, jid, originalMsg.pushName || 'Kak', originalMsg);
      return;
    }

    if (textLower === 'katalog') {
      sessionManager.setState(jid, 'SELECT_PRODUCT');
      const selectionMenu = stripStarsAndEmojis(menuHandler.getCatalogSelectionMenu());
      await this.sendReply(sock, jid, selectionMenu, originalMsg);
      return;
    }

    if (session.data?.pendingDetailProduct && /^(foto|detail|fotonya|gambar|gambarnya|poto|potonya|mau|kirim|ok|oke|ya|boleh)$/i.test(textTrim)) {
      const prod = session.data.pendingDetailProduct;
      delete session.data.pendingDetailProduct;
      sessionManager.setState(jid, 'IDLE');
      await this.sendCatalogCard(sock, jid, prod, originalMsg);
      return;
    }

    // A. If user was viewing products inside a specific category (e.g. Karpet Masjid & Musholla)
    if (session.data?.selectedCategory) {
      const cName = (session.data.selectedCategory || '').trim().toLowerCase();
      const categoryProducts = catalog.filter(p => {
        const pCat = (p.category || '').trim().toLowerCase();
        return pCat === cName || (pCat.length > 5 && (cName.includes(pCat) || pCat.includes(cName)));
      });

      const num = parseInt(textTrim, 10);
      if (!isNaN(num) && num >= 1 && num <= categoryProducts.length) {
        const selectedProd = categoryProducts[num - 1];
        sessionManager.setState(jid, 'IDLE');
        await this.sendCatalogCard(sock, jid, selectedProd, originalMsg);
        return;
      }
    }

    // B. Check if user selected a Specific Carpet Product by name/code
    const product = menuHandler.getCatalogItem(textTrim);
    if (product) {
      sessionManager.setState(jid, 'IDLE');
      await this.sendCatalogCard(sock, jid, product, originalMsg);
      return;
    }

    // C. Check if user selected a Carpet Category
    const category = menuHandler.getCategoryByIdOrName(textTrim);
    if (category) {
      sessionManager.setState(jid, 'SELECT_PRODUCT', { selectedCategory: category.name });
      const categoryProductsMenu = menuHandler.getCatalogSelectionMenu(category.name);
      await this.sendReply(sock, jid, categoryProductsMenu, originalMsg);
      return;
    }

    // D. Fallback if not found
    const reply = 'Pilihan kategori atau produk tidak ditemukan. Silakan pilih nomor kategori atau nama koleksi karpet berikut:\n\n' + menuHandler.getCatalogSelectionMenu();
    await this.sendReply(sock, jid, reply, originalMsg);
  }

  async handleConfirmProductState(sock, jid, text, originalMsg) {
    const textTrim = text.trim();
    const textLower = textTrim.toLowerCase();
    const session = sessionManager.getSession(jid);
    const product = session.data?.selectedProduct || menuHandler.getCatalogItem('1');

    if (['0', 'menu', 'batal', 'kembali'].includes(textLower)) {
      sessionManager.resetSession(jid);
      await this.sendListMenu(sock, jid, originalMsg.pushName || 'Kak', originalMsg);
      return;
    }

    // 1. Pesan langsung: Terbitkan tiket antrian resmi dan alihkan ke CS manusia (hands-off)
    if (
      textLower === '1' ||
      textLower === 'pesan' ||
      textLower === 'order' ||
      textLower === 'ya' ||
      textLower === 'beli' ||
      textLower.startsWith('order') ||
      textLower.startsWith('pesan') ||
      textLower.startsWith('beli') ||
      textLower.includes('membeli') ||
      textLower.includes('memesan')
    ) {
      const targetProduct = product || session.data?.lastViewedProduct || menuHandler.getCatalogItem('1');
      const extraInfo = targetProduct ? ` [Produk: ${targetProduct.title} - Harga: ${targetProduct.price}]` : '';
      const fullDesc = `Pemesanan Produk${extraInfo}`.trim();

      const senderName = originalMsg.pushName || 'Pelanggan';
      const cleanPhone = phoneService.getPhone(jid, senderName) || (jid.endsWith('@s.whatsapp.net') ? jid.split('@')[0] : null);

      const { ticket, isNew } = ticketService.ensureActiveTicket({
        sender: cleanPhone || jid,
        name: senderName,
        contact: phoneService.formatPhone(cleanPhone, jid),
        description: fullDesc,
        category: 'Pemesanan Produk',
        priority: 'Normal'
      });

      if (this.eventEmitter) {
        if (isNew) this.eventEmitter.emit('ticket_created', ticket);
        this.eventEmitter.emit('human_cs_requested', {
          phone: cleanPhone,
          senderName,
          jid,
          category: 'Pemesanan Produk',
          ticketId: ticket.id,
          queueNumber: ticket.queueNumber,
          timestamp: new Date().toISOString()
        });
      }

      const queueReply = menuHandler.getQueueTicketMessage(ticket, senderName);
      await this.sendReply(sock, jid, queueReply, originalMsg);
      sessionManager.setHumanMode(jid, true, `Tiket ${ticket.id} (Pemesanan Produk) dibuat - Hands-off menunggu konfirmasi admin`);
      return;
    }

    // 2. Foto & detail (Strictly 1 single message with image + caption specs)
    if (
      textLower === '2' ||
      textLower === 'foto' ||
      textLower === 'gambar' ||
      textLower === 'detail' ||
      textLower.includes('foto') ||
      textLower.includes('gambar') ||
      textLower.includes('detail') ||
      textLower.includes('poto') ||
      textLower.includes('liat') ||
      textLower.includes('lihat') ||
      textLower.includes('spill') ||
      textLower.includes('pic')
    ) {
      sessionManager.setState(jid, 'IDLE');
      await this.sendCatalogCard(sock, jid, product, originalMsg);
      return;
    }

    // 3. Produk lain
    if (
      textLower === '3' ||
      textLower === 'katalog' ||
      textLower === 'ganti' ||
      textLower === 'lain' ||
      textLower.includes('katalog')
    ) {
      await this.sendCatalogSelection(sock, jid, originalMsg);
      return;
    }

    const otherProduct = menuHandler.getCatalogItem(textTrim);
    if (otherProduct && String(otherProduct.id) !== String(product.id)) {
      sessionManager.setState(jid, 'CONFIRM_PRODUCT', { selectedProduct: otherProduct });
      const reply = menuHandler.getProductConfirmationMessage(otherProduct);
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    const reply = menuHandler.getProductConfirmationMessage(product);
    await this.sendReply(sock, jid, reply, originalMsg);
  }

  async handleSelectBranchState(sock, jid, text, originalMsg) {
    const textTrim = text.trim();
    const textLower = textTrim.toLowerCase();
    if (['0', 'menu', 'batal', 'kembali'].includes(textLower)) {
      sessionManager.resetSession(jid);
      await this.sendListMenu(sock, jid, originalMsg.pushName || 'Kak', originalMsg);
      return;
    }

    let branchId = textTrim;
    if (textLower.startsWith('branch_')) {
      branchId = textLower.replace('branch_', '');
    }

    const branch = menuHandler.getBranchByIdOrName(branchId);
    if (branch) {
      sessionManager.resetSession(jid);
      const reply = menuHandler.getBranchDetail(branch);
      await this.sendReply(sock, jid, reply, originalMsg);
    } else {
      await this.sendBranchesListMenu(sock, jid, originalMsg);
    }
  }

  async handleIdleMenu(sock, jid, text, senderName, originalMsg, phone, detectedIntent = null) {
    const textTrim = text.trim();
    const textLower = textTrim.toLowerCase();
    const session = sessionManager.getSession(jid);
    const catalog = menuHandler.getCatalog();

    // ─── ANTI-SPAM CONFIRMATION & DETAIL INTERACTION CHECK ───
    const pendingProduct = session.data?.pendingDetailProduct;

    const isDetailConfirmation =
      /^(foto|detail|fotonya|gambar|gambarnya|poto|potonya|spill|lihat|liat|pic|pict|mau|ya|boleh|kirim|ok|oke|siap|tentu|coba|iya|ya mau|mau foto|minta foto|kirim foto|lihat foto|liat foto|kirim fotonya|kirim gambar|kirim gambarnya|mau dong|kirim dong|boleh dong|iya mau|iya boleh|mana fotonya|mana gambarnya|gambarnya mana|fotonya mana)$/i.test(textTrim) ||
      /\b(foto|fotonya|gambar|gambarnya|poto|potonya|spill|pic|pict|detail)\b/i.test(textLower) ||
      (/\b(mau|lihat|liat|kirim|tampilkan|spill)\b/i.test(textLower) && /\b(foto|gambar|poto|pic|fotonya|gambarnya)\b/i.test(textLower));

    // CASE 1: User confirms photo/detail for a previously offered/discussed product
    if (pendingProduct && isDetailConfirmation) {
      delete session.data.pendingDetailProduct;
      // Send STRICTLY 1 message: single catalog card with photo + full specs caption
      await this.sendCatalogCard(sock, jid, pendingProduct, originalMsg);
      return;
    }

    // CASE 2: User explicitly mentions a specific product name AND requests photo/detail
    const isAskingPhoto = /\b(foto|fotonya|gambar|gambarnya|poto|potonya|pic|pict|spill)\b/i.test(textLower) ||
      (/\b(lihat|liat|minta|kirim|ada|mau)\b/i.test(textLower) && /\b(foto|gambar|poto|pic|fotonya|gambarnya|produk|katalog)\b/i.test(textLower));

    if (isAskingPhoto) {
      const matchedItem = menuHandler.getCatalogItem(textLower);

      if (matchedItem) {
        delete session.data.pendingDetailProduct;
        await this.sendCatalogCard(sock, jid, matchedItem, originalMsg);
        return;
      }

      // If user asks for photos in general without specifying a product:
      // DO NOT blast photos! Ask user to select or confirm which product first (1 message).
      sessionManager.setState(jid, 'SELECT_PRODUCT');
      const askMsg = `Kami menyediakan beragam koleksi karpet berkualitas tinggi. Silakan sebutkan nomor atau jenis karpet yang ingin Kakak lihat foto dan spesifikasi detailnya:\n\n` +
        menuHandler.getCatalogSelectionMenu();
      await this.sendReply(sock, jid, askMsg, originalMsg);
      return;
    }

    // Pengecekan status tiket instan jika pesan memuat ID tiket (misal TKT-1234 atau status tiket TKT-1234)
    const ticketMatch = textTrim.match(/\b(TKT-\d{3,6})\b/i);
    if (ticketMatch) {
      const ticket = ticketService.getTicketById(ticketMatch[1]);
      const reply = menuHandler.getTicketStatusMessage(ticket);
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    // 1. Explicit numbered menu commands
    if (textLower === '1' || textLower === 'katalog' || textLower === 'menu_katalog' || textLower === 'karpet') {
      await this.sendCatalogSelection(sock, jid, originalMsg);
      return;
    }

    if (textLower === '2' || textLower === 'profil' || textLower === 'pemilik' || textLower === 'owner' || textLower === 'toko') {
      const reply = menuHandler.getStoreProfileMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (textLower === '3' || textLower === 'jadwal' || textLower === 'jam kerja' || textLower === 'jam buka' || textLower === 'operasional') {
      const reply = menuHandler.getWorkingHoursMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (textLower === '4' || textLower === 'lokasi' || textLower === 'alamat' || textLower === 'showroom' || textLower === 'cabang' || textLower === 'maps') {
      const reply = menuHandler.getLocationMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (textLower === '5' || textLower === 'garansi' || textLower === 'klaim garansi' || textLower === 'jaminan') {
      const reply = menuHandler.getWarrantyMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (textLower === '6' || textLower === 'promo' || textLower === 'diskon' || textLower === 'penawaran' || textLower === 'potongan') {
      const reply = menuHandler.getPromoMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (textLower === '7' || textLower === 'komplain' || textLower === 'pengaduan' || textLower === 'keluhan') {
      const reply = menuHandler.getComplaintMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (textLower === 'cs' || textLower === 'menu_cs' || textLower === 'admin' || textLower === 'operator') {
      sessionManager.setHumanMode(jid, true);
      const reply = menuHandler.getHumanCsPrompt();
      if (this.eventEmitter) {
        this.eventEmitter.emit('human_cs_requested', {
          phone,
          senderName,
          jid,
          timestamp: new Date().toISOString()
        });
      }
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    // 2. Sticker response
    if (textTrim === '[Stiker WhatsApp]') {
      const greeting = timeHelper.getGreeting(senderName);
      const stickerReply = `${greeting}, terima kasih atas sapaan stikernya. Ada yang dapat kami bantu terkait produk karpet atau layanan Rumah Indah Carpet Gallery hari ini?`;
      await this.sendReply(sock, jid, stickerReply, originalMsg);
      return;
    }

    // 3. AI Smart Interaction (Groq LPU / Gemini)
    if (aiService.isAiEnabled(jid)) {
      try {
        let aiPrompt = text;
        if (detectedIntent) {
          aiPrompt = `[Catatan Sistem: Pelanggan memiliki intensi "${detectedIntent}". Tiket layanan aktif telah disiapkan. Berikan respon yang ramah, sopan, tanpa bintang dan tanpa emoji, serta tanyakan detail yang diperlukan tanpa menyuruh pelanggan mengetik perintah kaku]\n\nPesan Pelanggan: ${text}`;
        }

        const aiReply = await aiService.generateReply(jid, aiPrompt, senderName);
        if (aiReply) {
          // Detect if AI output contains [KIRIM_FOTO: KODE_PRODUK]
          const photoTagMatch = aiReply.match(/\[KIRIM_FOTO:\s*([^\]]+)\]/i);
          let photoProduct = null;
          if (photoTagMatch) {
            photoProduct = menuHandler.getCatalogItem(photoTagMatch[1].trim());
          }

          // Check if customer explicitly requested photo in current turn
          const customerRequestedPhoto = /\b(foto|fotonya|gambar|gambarnya|poto|potonya|pic|pict|spill)\b/i.test(textLower) ||
            (/\b(lihat|liat|minta|kirim|mau)\b/i.test(textLower) && /\b(foto|gambar|poto|pic|fotonya|gambarnya)\b/i.test(textLower));

          // Check if customer is asking for a list / catalog / collection of products
          const isListOrCatalogRequest = /\b(list|daftar|katalog|apa saja|ada apa|koleksi|pilihan|semua produk|semuanya|macam)\b/i.test(textLower);

          // Detect if any specific product is mentioned or recommended
          let matchedProduct = photoProduct || menuHandler.getCatalogItem(textLower);

          // Do not arbitrarily assign matchedProduct to a single product if customer requested a list/catalog
          if (!matchedProduct && !isListOrCatalogRequest) {
            for (const item of catalog) {
              const code = (item.code || '').toLowerCase();
              if (code && code.length >= 3 && (textLower.includes(code) || aiReply.toLowerCase().includes(code))) {
                matchedProduct = item;
                break;
              }
            }
          }

          // If customer explicitly requested a list, ensure matchedProduct is null so no single product is pinned
          if (isListOrCatalogRequest) {
            matchedProduct = null;
          }

          // Clean up reply: strip [KIRIM_FOTO: ...] tags
          let cleanReply = aiReply.replace(/\[KIRIM_FOTO:[^\]]+\]/gi, '').trim();
          cleanReply = stripStarsAndEmojis(cleanReply);

          // Cek apakah balasan merupakan penolakan di luar konteks
          const isOutOfContext = /tidak bisa menjawab pertanyaan tersebut|di luar konteks/i.test(cleanReply);
          if (isOutOfContext) {
            cleanReply = 'Mohon maaf, saya tidak bisa menjawab pertanyaan tersebut.';
            const provider = aiService.getActiveProvider();
            const providerDisplayName = provider === 'groq' ? 'Rumah Indah Carpet AI (Groq)' : 'Rumah Indah Carpet AI (Gemini)';
            await this.sendReply(sock, jid, cleanReply, originalMsg, {
              id: `out_ai_${Date.now()}`,
              senderName: providerDisplayName,
              isAi: true
            });
            return;
          }

          // If AI explicitly requested to send photo OR customer explicitly requested photo and product is identified:
          if (photoProduct || (customerRequestedPhoto && matchedProduct)) {
            const productToSend = photoProduct || matchedProduct;
            delete session.data.pendingDetailProduct;
            await this.sendCatalogCard(sock, jid, productToSend, originalMsg, cleanReply);
            return;
          }

          // General single product discussion: save pendingDetailProduct & lastViewedProduct in session so user can confirm with "FOTO" or order immediately
          if (matchedProduct && !isListOrCatalogRequest) {
            session.data.pendingDetailProduct = matchedProduct;
            session.data.lastViewedProduct = matchedProduct;
          } else {
            delete session.data.pendingDetailProduct;
          }

          // Append confirmation prompt ONLY when discussing one specific product (NOT when displaying a list/catalog)
          if (!isListOrCatalogRequest && matchedProduct && !cleanReply.toLowerCase().includes('foto') && !cleanReply.toLowerCase().includes('detail')) {
            cleanReply += `\n\nBila Kakak ingin melihat foto fisik dan rincian spesifikasi lengkap ${matchedProduct.title}, silakan balas dengan 'FOTO' atau 'DETAIL'.`;
          }

          // Send STRICTLY 1 text message with all protections enabled
          const provider = aiService.getActiveProvider();
          const providerDisplayName = provider === 'groq' ? 'Rumah Indah Carpet AI (Groq)' : 'Rumah Indah Carpet AI (Gemini)';

          await this.sendReply(sock, jid, cleanReply, originalMsg, {
            id: `out_ai_${Date.now()}`,
            senderName: providerDisplayName,
            isAi: true
          });

          return;
        }
      } catch (aiErr) {
        console.warn('[MessageHandler] Gagal memproses AI, beralih ke fallback:', aiErr.message);
      }
    }

    // 4. Greeting & Time Information Fallback (jika AI nonaktif atau gagal)
    const detectedGreeting = timeHelper.detectGreeting(textTrim);
    const isAskingTime = /\b(jam berapa|sekarang jam|waktu sekarang|pagi apa siang|siang apa malam|pagi apa sore|sore apa malam|sekarang pagi|sekarang siang|sekarang sore|sekarang malam)\b/i.test(textLower);

    if (detectedGreeting || isAskingTime) {
      const greeting = timeHelper.getGreeting(senderName);
      const timeInfo = timeHelper.getWIBTime();
      const status = timeHelper.getStoreStatus();

      let replyText = `${greeting}.\n\nSaat ini pukul ${timeInfo.timeStr} (${timeInfo.dayName}, ${timeInfo.dateStr}) - Waktu ${timeInfo.category}.\nStatus Showroom: ${status.statusLabel} (${status.scheduleText}).\n\nAda yang dapat kami bantu seputar koleksi karpet atau layanan survey kami hari ini?`;
      await this.sendReply(sock, jid, replyText, originalMsg);
      return;
    }

    // 5. Keyword Fallback
    if (
      textLower.includes('pemilik') ||
      textLower.includes('owner') ||
      textLower.includes('siapa yang punya') ||
      textLower.includes('profil toko') ||
      textLower.includes('tentang toko')
    ) {
      const reply = menuHandler.getStoreProfileMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (
      textLower.includes('jadwal') ||
      textLower.includes('jam buka') ||
      textLower.includes('jam kerja') ||
      textLower.includes('operasional') ||
      textLower.includes('buka jam berapa') ||
      textLower.includes('tutup jam berapa')
    ) {
      const reply = menuHandler.getWorkingHoursMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (
      textLower.includes('alamat') ||
      textLower.includes('lokasi') ||
      textLower.includes('dimana') ||
      textLower.includes('showroom') ||
      textLower.includes('cabang') ||
      textLower.includes('maps')
    ) {
      const reply = menuHandler.getLocationMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (
      textLower.includes('garansi') ||
      textLower.includes('klaim') ||
      textLower.includes('jaminan')
    ) {
      const reply = menuHandler.getWarrantyMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (
      textLower.includes('promo') ||
      textLower.includes('diskon') ||
      textLower.includes('potongan') ||
      textLower.includes('cashback') ||
      textLower.includes('sale')
    ) {
      const reply = menuHandler.getPromoMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (
      textLower.includes('komplain') ||
      textLower.includes('pengaduan') ||
      textLower.includes('keluhan') ||
      textLower.includes('kecewa') ||
      textLower.includes('rusak') ||
      textLower.includes('cacat')
    ) {
      const reply = menuHandler.getComplaintMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    if (
      textLower.includes('katalog') ||
      textLower.includes('produk') ||
      textLower.includes('koleksi') ||
      textLower.includes('karpet') ||
      textLower.includes('harga')
    ) {
      await this.sendCatalogSelection(sock, jid, originalMsg);
      return;
    }

    if (
      textLower.includes('cs') ||
      textLower.includes('bantuan') ||
      textLower.includes('admin') ||
      textLower.includes('operator')
    ) {
      sessionManager.setHumanMode(jid, true);
      const reply = menuHandler.getHumanCsPrompt();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    // Default Fallback: Menu Utama
    await this.sendListMenu(sock, jid, senderName, originalMsg);
  }

  /**
   * 🛡️ Safe Central Outbound Dispatcher
   * Menerapkan 5 lapis proteksi anti-ban pada SETIAP pesan keluar:
   * 1. Message Deduplication: Hindari pengiriman pesan duplikat ke nomor yang sama
   * 2. Global Rate Limiter: Batasi total pesan keluar per menit bot secara keseluruhan
   * 3. Cooldown & Jitter Manusiawi: Jeda acak seperti manusia mengetik
   * 4. Human-like Typing Simulation: Tampilkan status 'composing' proporsional
   * 5. Retry Limit & Error Handling: Maksimal 2x retry dengan exponential backoff
   */
  async safeSendMessage(sock, jid, messagePayload, originalMsg, logOptions = {}) {
    try {
      const textContent = messagePayload.text || messagePayload.caption || '';

      // 1. Deduplikasi Pesan Keluar (Mencegah double reply jika ada glitch atau reconnect)
      if (textContent && protectionService.isDuplicateOutbound(jid, textContent)) {
        console.log(`[Protection:Deduplication] Mengabaikan balasan duplikat ke ${jid}`);
        return null;
      }

      // 2. Global Rate Limiter (Token Bucket / Sliding Window)
      await protectionService.waitForGlobalRateLimit();

      // 3. Per-User Cooldown + Natural Multi-Stage Human Simulation (~1 Menit)
      const inboundTimestamp = originalMsg?._inboundTimestamp || (originalMsg?.messageTimestamp ? Number(originalMsg.messageTimestamp) * 1000 : null);
      const originalKey = originalMsg?.key || null;

      await protectionService.waitForUserCooldown(jid, inboundTimestamp, textContent.length, sock, originalKey);

      // 5. Kirim via Baileys dengan Retry Limit & Exponential Backoff + Unquoted Fallback
      const result = await protectionService.withRetry(async () => {
        try {
          return await sock.sendMessage(jid, messagePayload, originalMsg ? { quoted: originalMsg } : {});
        } catch (sendErr) {
          // Jika pengiriman dengan quoted pesan error (misal format stanza lama tidak valid), coba kirim langsung tanpa quoted
          if (originalMsg) {
            console.warn(`[Protection:QuotedRetry] Gagal kirim dengan quoted (${sendErr.message}), mencoba kirim langsung tanpa quoted...`);
            return await sock.sendMessage(jid, messagePayload);
          }
          throw sendErr;
        }
      }, {
        maxRetries: 2,
        baseDelayMs: 1000,
        context: `WhatsApp sendMessage to ${jid}`
      });

      // Catat fingerprint pesan keluar & perbarui waktu respon
      if (textContent) {
        protectionService.recordOutbound(jid, textContent);
      }
      sessionManager.updateReplyTime(jid);

      // Emit log ke Web Dashboard
      const candidatePhone = phoneService.getPhone(jid);
      const resolvedPhone = (candidatePhone && phoneService.isRealPhone(candidatePhone))
        ? candidatePhone
        : (jid.endsWith('@s.whatsapp.net') ? jid.split('@')[0] : null);

      let finalImg = logOptions.image || null;
      if (finalImg && !finalImg.startsWith('http') && !finalImg.startsWith('/') && !finalImg.startsWith('data:')) {
        finalImg = '/' + finalImg;
      }

      this.emitLog({
        id: logOptions.id || `out_${Date.now()}`,
        direction: 'out',
        jid,
        phone: resolvedPhone,
        formattedPhone: phoneService.formatPhone(resolvedPhone, jid),
        senderName: logOptions.senderName || 'Rumah Indah Carpet Bot',
        text: textContent,
        isAi: !!logOptions.isAi,
        image: finalImg,
        mediaType: logOptions.mediaType || (finalImg ? 'image' : 'text'),
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (err) {
      console.error(`[Protection:Error] Gagal mengirim pesan ke ${jid} setelah retry:`, err.message);
      return null;
    }
  }

  async sendListMenu(sock, jid, senderName, originalMsg) {
    const menuText = stripStarsAndEmojis(menuHandler.getMainMenu(senderName));
    await this.safeSendMessage(
      sock,
      jid,
      { text: menuText },
      originalMsg,
      { id: `out_menu_${Date.now()}`, senderName: 'Rumah Indah Carpet Bot' }
    );
  }

  async sendBranchesListMenu(sock, jid, originalMsg) {
    const reply = stripStarsAndEmojis(menuHandler.getBranchesMenu());
    await this.safeSendMessage(
      sock,
      jid,
      { text: reply },
      originalMsg,
      { id: `out_branches_${Date.now()}`, senderName: 'Rumah Indah Carpet Bot' }
    );
  }

  async sendCatalogSelection(sock, jid, originalMsg) {
    sessionManager.setState(jid, 'SELECT_PRODUCT');
    const selectionMenu = stripStarsAndEmojis(menuHandler.getCatalogSelectionMenu());
    await this.sendReply(sock, jid, selectionMenu, originalMsg);
  }

  async sendCatalogCard(sock, jid, product, originalMsg, customCaption = null) {
    if (!product) return;

    let imagePayload = null;
    let localImagePath = null;

    // 1. Check if product.image is a remote URL (http:// or https://)
    if (product.image && (product.image.startsWith('http://') || product.image.startsWith('https://'))) {
      imagePayload = { url: product.image };
    } else {
      // 2. Resolve local file path across known assets/catalog directories
      const baseName = product.image ? path.basename(product.image) : '';
      const candidates = [
        product.image,
        product.image ? path.resolve(__dirname, '../../', product.image) : null,
        product.image ? path.resolve(__dirname, '../../assets/', product.image.replace(/^assets[\\/]/, '')) : null,
        product.image ? path.resolve(__dirname, '../../public/', product.image.replace(/^public[\\/]/, '')) : null,
        baseName ? path.resolve(__dirname, '../../assets/catalog/', baseName) : null,
        baseName ? path.resolve(__dirname, '../../public/catalog/', baseName) : null,
        path.resolve(__dirname, '../../assets/catalog/karpet-masjid-turki.jpg')
      ];

      for (const cand of candidates) {
        if (cand && fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          localImagePath = cand;
          break;
        }
      }

      if (localImagePath) {
        try {
          imagePayload = fs.readFileSync(localImagePath);
        } catch (e) {
          console.warn('[sendCatalogCard] Gagal membaca file gambar lokal:', e.message);
        }
      }
    }

    const hasImage = Boolean(imagePayload);

    // Simpan produk terakhir yang dilihat untuk kejelasan konteks pemesanan
    const session = sessionManager.getSession(jid);
    if (session) {
      if (!session.data) session.data = {};
      session.data.lastViewedProduct = product;
      session.data.selectedProduct = product;
    }

    let caption;
    if (customCaption) {
      caption = stripStarsAndEmojis(
        `${customCaption}\n\n` +
        `Koleksi: ${product.title}\n` +
        `Harga: ${product.price}\n` +
        `Spesifikasi: ${product.subtitle}\n` +
        `Varian: ${product.footer}`
      );
    } else {
      caption = stripStarsAndEmojis(
        `${product.title.toUpperCase()}\n` +
        `Harga: ${product.price}\n\n` +
        `Spesifikasi: ${product.subtitle}\n` +
        `Varian: ${product.footer}\n` +
        `Koleksi Resmi: Rumah Indah Carpet Gallery\n` +
        `───────────────────\n` +
        `Bila Kakak ingin memesan ${product.title} atau survey gratis, silakan beri tahu kami.`
      );
    }

    const messagePayload = hasImage
      ? { image: imagePayload, caption, mimetype: 'image/jpeg' }
      : { text: caption };

    const catalogImg = product.image ? (product.image.startsWith('/') ? product.image : '/' + product.image) : null;

    await this.safeSendMessage(
      sock,
      jid,
      messagePayload,
      originalMsg,
      {
        id: `out_cat_${Date.now()}`,
        senderName: 'Rumah Indah Carpet Bot',
        image: catalogImg,
        mediaType: hasImage ? 'image' : 'text'
      }
    );
  }

  async sendReply(sock, jid, text, originalMsg, options = {}) {
    const cleanText = stripStarsAndEmojis(text);
    await this.safeSendMessage(
      sock,
      jid,
      { text: cleanText },
      originalMsg,
      {
        id: options.id || `out_${Date.now()}`,
        senderName: options.senderName || 'Rumah Indah Carpet Bot',
        isAi: options.isAi || false
      }
    );
  }
}

module.exports = new MessageHandler();
