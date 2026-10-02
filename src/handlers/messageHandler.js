const fs = require('fs');
const path = require('path');
const { prepareWAMessageMedia, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const menuHandler = require('./menuHandler');
const ticketService = require('../services/ticketService');
const sessionManager = require('../services/sessionManager');
const aiService = require('../services/aiService');
const phoneService = require('../services/phoneService');
const { stripStarsAndEmojis } = require('../utils/textCleaner');
const protectionService = require('../services/protectionService');

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
    if (!message) return { text: '', mediaType: 'text' };
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
        text: caption ? `[Foto: ${caption}]` : '[Foto pelanggan]',
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

    // 7. Interactive / Button responses
    if (msg.templateButtonReplyMessage?.selectedId) {
      return { text: msg.templateButtonReplyMessage.selectedId, mediaType: 'text' };
    }
    if (msg.buttonsResponseMessage?.selectedButtonId) {
      return { text: msg.buttonsResponseMessage.selectedButtonId, mediaType: 'text' };
    }
    if (msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
      try {
        const params = JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
        const val = params.id || params.selectedId || params.rowId || params.title;
        if (val) return { text: val, mediaType: 'text' };
      } catch (e) {}
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

    // 1. Klaim Garansi
    if (
      textLower.includes('garansi') ||
      textLower.includes('klaim') ||
      textLower.includes('pecah') ||
      textLower.includes('rusak saat pengiriman') ||
      textLower.includes('ganti baru') ||
      textLower.includes('retak saat datang') ||
      textLower.includes('patah') ||
      textLower.includes('barang pecah')
    ) {
      return 'Klaim Garansi';
    }

    // 2. Pengaduan Produk / Komplain
    if (
      textLower.includes('pengaduan') ||
      textLower.includes('komplain') ||
      textLower.includes('cacat') ||
      textLower.includes('kecewa') ||
      textLower.includes('salah kirim') ||
      textLower.includes('barang kurang') ||
      textLower.includes('keluhan') ||
      textLower.includes('tidak sesuai')
    ) {
      return 'Pengaduan Produk';
    }

    // 3. Pembelian Produk
    if (
      textLower.startsWith('order') ||
      textLower.startsWith('pesan') ||
      textLower.startsWith('beli') ||
      textLower.includes('mau beli') ||
      textLower.includes('ingin beli') ||
      textLower.includes('mau pesan') ||
      textLower.includes('ingin pesan') ||
      textLower.includes('mau order') ||
      textLower.includes('checkout') ||
      textLower.includes('cara beli') ||
      textLower.includes('cara pesan')
    ) {
      return 'Pembelian Produk';
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

      const config = menuHandler.getConfig();
      const rawText = record.texts.join(' \n ').trim();
      if (!rawText) return;

      const senderName = msg.pushName || 'Pelanggan';

      // Extract real phone number
      const rawPn = msg.key.senderPn || msg.key.participantPn;
      let realPhone = null;
      if (rawPn) {
        realPhone = rawPn.split('@')[0];
        phoneService.setMapping(jid, realPhone, senderName);
      } else if (jid.endsWith('@s.whatsapp.net')) {
        realPhone = jid.split('@')[0];
        phoneService.setMapping(jid, realPhone, senderName);
      } else {
        realPhone = phoneService.getPhone(jid, senderName);
      }
      const cleanPhone = realPhone || jid.split('@')[0];

      // Emit incoming message to dashboard
      this.emitLog({
        id: msg.key.id,
        direction: 'in',
        jid,
        phone: cleanPhone,
        senderName,
        text: rawText,
        mediaType: record.mediaType,
        timestamp: new Date().toISOString()
      });

      // Mark message as read
      if (config.bot?.auto_read_messages) {
        await sock.readMessages([msg.key]).catch(() => {});
      }

      // 🛡️ 4. Sesi & Session Timeout Check
      const session = sessionManager.getSession(jid);
      const textLower = rawText.toLowerCase();

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

      // Jika user sedang dalam penanganan CS manusia, bot DIAM dan tidak menimpa chat admin
      if (sessionManager.isHumanMode(jid)) {
        console.log(`[CS Mode] Pesan dari ${cleanPhone}: "${rawText}" (Sedang dalam penanganan CS manusia - Bot diam)`);
        return;
      }

      // 🎯 Intent Detection: Activate Ticket with Category Badge
      const detectedIntent = this.detectServiceIntent(textLower);
      if (detectedIntent) {
        const { ticket, isNew } = ticketService.ensureActiveTicket({
          sender: cleanPhone,
          name: senderName,
          contact: cleanPhone,
          description: rawText,
          category: detectedIntent,
          priority: detectedIntent === 'Pembelian Produk' ? 'Normal' : 'Tinggi'
        });

        if (this.eventEmitter && isNew) {
          this.eventEmitter.emit('ticket_created', ticket);
        }
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
        const catalogItem = menuHandler.getCatalogItem(itemIdentifier) || menuHandler.getCatalogItem('1');

        if (catalogItem) {
          sessionManager.setState(jid, 'TICKET_NAME', {
            product: catalogItem.title,
            price: catalogItem.price
          });
          const reply = `Pemesanan Produk: ${catalogItem.title}\nHarga: ${catalogItem.price}\n\nUntuk memproses pesanan Anda, silakan sebutkan nama lengkap Anda:`;
          await this.sendReply(sock, jid, reply, msg);
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
    const contact = session.data?.contact || '-';
    const product = session.data?.product || null;

    const fullDesc = product ? `[Pesanan: ${product}] Alamat/Catatan: ${description}` : description;
    const category = product ? 'Pembelian Produk' : 'Layanan Umum';

    const newTicket = ticketService.createTicket({
      sender: phone,
      name,
      contact,
      description: fullDesc,
      category,
      priority: product ? 'Tinggi' : 'Normal'
    });

    sessionManager.resetSession(jid);

    if (this.eventEmitter) {
      this.eventEmitter.emit('ticket_created', newTicket);
    }

    const titleMsg = product ? 'Pesanan Anda telah berhasil kami catat.' : 'Laporan tiket layanan Anda telah dibuat.';
    const reply = `${titleMsg}\n\n` +
      `Rincian:\n` +
      `ID Tiket: ${newTicket.id}\n` +
      `Kategori: ${newTicket.category}\n` +
      `Nama: ${newTicket.name}\n` +
      `Kontak: ${newTicket.contact}\n` +
      `Status: OPEN\n` +
      `Rincian: "${newTicket.description}"\n\n` +
      `Tim kami akan segera memverifikasi dan menghubungi Anda kembali.\n` +
      `Simpan nomor tiket (${newTicket.id}) untuk pengecekan status sewaktu-waktu.`;

    await this.sendReply(sock, jid, reply, originalMsg);
  }

  async handleSelectProductState(sock, jid, text, originalMsg) {
    const textTrim = text.trim();
    const textLower = textTrim.toLowerCase();

    if (['0', 'menu', 'batal', 'kembali'].includes(textLower)) {
      sessionManager.resetSession(jid);
      await this.sendListMenu(sock, jid, originalMsg.pushName || 'Kak', originalMsg);
      return;
    }

    let productId = textTrim;
    if (textLower.startsWith('katalog ') || textLower.startsWith('produk ')) {
      productId = textLower.replace(/^(katalog|produk)\s+/i, '').trim();
    }

    const product = menuHandler.getCatalogItem(productId);
    if (product) {
      sessionManager.setState(jid, 'CONFIRM_PRODUCT', { selectedProduct: product });
      const reply = menuHandler.getProductConfirmationMessage(product);
      await this.sendReply(sock, jid, reply, originalMsg);
    } else {
      const reply = 'Pilihan produk tidak ditemukan. Silakan pilih nomor produk berikut:\n\n' + menuHandler.getCatalogSelectionMenu();
      await this.sendReply(sock, jid, reply, originalMsg);
    }
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

    // 1. Pesan langsung
    if (
      textLower === '1' ||
      textLower === 'pesan' ||
      textLower === 'order' ||
      textLower === 'ya' ||
      textLower === 'beli' ||
      textLower.startsWith('order') ||
      textLower.startsWith('pesan')
    ) {
      sessionManager.setState(jid, 'TICKET_NAME', {
        product: product.title,
        price: product.price
      });
      const reply = `Pemesanan Produk: ${product.title}\nHarga: ${product.price}\n\nUntuk memproses pesanan Anda, silakan sebutkan nama lengkap Anda:`;
      await this.sendReply(sock, jid, reply, originalMsg);
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
      textLower.includes('detail')
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
      /^(foto|detail|fotonya|gambar|spill|lihat|pic|pict|mau|ya|boleh|kirim|ok|oke|ya mau|mau foto|minta foto|kirim foto|lihat foto)$/i.test(textTrim) ||
      /\b(foto|detail|fotonya|gambar|spill|lihat foto|minta foto|kirim foto)\b/i.test(textLower);

    // CASE 1: User confirms photo/detail for a previously offered/discussed product
    if (pendingProduct && isDetailConfirmation) {
      delete session.data.pendingDetailProduct;
      // Send STRICTLY 1 message: single catalog card with photo + full specs caption
      await this.sendCatalogCard(sock, jid, pendingProduct, originalMsg);
      return;
    }

    // CASE 2: User explicitly mentions a specific product name AND requests photo/detail
    const isAskingPhoto = /\b(foto|gambar|pic|pict|lihat|spill|detail|fotonya)\b/i.test(textLower);
    if (isAskingPhoto) {
      let matchedItem = null;
      for (const item of catalog) {
        const code = (item.code || '').toLowerCase();
        const titleWords = item.title.toLowerCase().split(' ').filter(w => w.length > 3);
        if ((code && textLower.includes(code)) || titleWords.some(w => textLower.includes(w))) {
          matchedItem = item;
          break;
        }
      }

      if (matchedItem) {
        delete session.data.pendingDetailProduct;
        await this.sendCatalogCard(sock, jid, matchedItem, originalMsg);
        return;
      }

      // If user asks for photos in general without specifying a product:
      // DO NOT blast photos! Ask user to select or confirm which product first (1 message).
      sessionManager.setState(jid, 'SELECT_PRODUCT');
      const askMsg = `Kami menyediakan beragam koleksi karpet berkualitas tinggi. Silakan sebutkan jenis karpet yang ingin Kakak lihat foto dan spesifikasi detailnya:\n\n` +
        menuHandler.getCatalogSelectionMenu();
      await this.sendReply(sock, jid, askMsg, originalMsg);
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
      const stickerReply = `Halo ${senderName}, terima kasih atas sapaan stikernya. Ada yang dapat kami bantu terkait produk karpet atau layanan Sultan Carpet Gallery hari ini?`;
      await this.sendReply(sock, jid, stickerReply, originalMsg);
      return;
    }

    // 3. AI Smart Interaction (Groq LPU / Gemini)
    if (aiService.isAiEnabled()) {
      try {
        let aiPrompt = text;
        if (detectedIntent) {
          aiPrompt = `[Catatan Sistem: Pelanggan memiliki intensi "${detectedIntent}". Tiket layanan aktif telah disiapkan. Berikan respon yang ramah, sopan, tanpa bintang dan tanpa emoji, serta tanyakan detail yang diperlukan tanpa menyuruh pelanggan mengetik perintah kaku]\n\nPesan Pelanggan: ${text}`;
        }

        const aiReply = await aiService.generateReply(jid, aiPrompt, senderName);
        if (aiReply) {
          // Detect if any specific product is mentioned or recommended
          let matchedProduct = null;
          for (const item of catalog) {
            const code = (item.code || '').toLowerCase();
            const titleWords = item.title.toLowerCase().split(' ').filter(w => w.length > 3);
            if (
              (code && (textLower.includes(code) || aiReply.toLowerCase().includes(code))) ||
              titleWords.some(w => textLower.includes(w) || aiReply.toLowerCase().includes(w))
            ) {
              matchedProduct = item;
              break;
            }
          }

          // If no specific product matched but question is about carpets/masjid/kantor, select appropriate candidate
          if (!matchedProduct) {
            if (textLower.includes('masjid')) {
              matchedProduct = catalog.find(c => (c.category || '').toLowerCase().includes('masjid') || c.title.toLowerCase().includes('masjid')) || catalog[0];
            } else if (textLower.includes('kantor')) {
              matchedProduct = catalog.find(c => (c.category || '').toLowerCase().includes('kantor') || c.title.toLowerCase().includes('kantor')) || catalog[0];
            } else if (textLower.includes('rekomendasi') || textLower.includes('koleksi') || textLower.includes('karpet') || textLower.includes('harga')) {
              matchedProduct = catalog[0];
            }
          }

          // Save pendingDetailProduct in session so user can confirm with "FOTO" or "DETAIL"
          if (matchedProduct) {
            session.data.pendingDetailProduct = matchedProduct;
          }

          // Clean up reply: strip [KIRIM_FOTO: ...] tags
          let cleanReply = aiReply.replace(/\[KIRIM_FOTO:[^\]]+\]/gi, '').trim();
          cleanReply = stripStarsAndEmojis(cleanReply);

          // Append confirmation prompt if product is discussed and confirmation hint is missing
          if (matchedProduct && !cleanReply.toLowerCase().includes('foto') && !cleanReply.toLowerCase().includes('detail')) {
            cleanReply += `\n\nBila Kakak ingin melihat foto fisik dan rincian spesifikasi lengkap ${matchedProduct.title}, silakan balas dengan 'FOTO' atau 'DETAIL'.`;
          }

          // Send STRICTLY 1 text message with all protections enabled
          const provider = aiService.getActiveProvider();
          const providerDisplayName = provider === 'groq' ? 'Sultan Carpet AI (Groq)' : 'Sultan Carpet AI (Gemini)';

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

    // 4. Keyword Fallback
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

      // 3. Per-User Cooldown + Natural Randomized Jitter
      await protectionService.waitForUserCooldown(jid);

      // 4. Simulasi Mengetik Alami ('composing')
      await protectionService.simulateTypingPresence(sock, jid, textContent.length);

      // 5. Kirim via Baileys dengan Retry Limit & Exponential Backoff
      const result = await protectionService.withRetry(async () => {
        return await sock.sendMessage(jid, messagePayload, { quoted: originalMsg });
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
      const resolvedPhone = phoneService.getPhone(jid) || jid.split('@')[0];
      this.emitLog({
        id: logOptions.id || `out_${Date.now()}`,
        direction: 'out',
        jid,
        phone: resolvedPhone,
        senderName: logOptions.senderName || 'Sultan Carpet Bot',
        text: textContent,
        isAi: !!logOptions.isAi,
        image: logOptions.image || null,
        mediaType: logOptions.mediaType || (logOptions.image ? 'image' : 'text'),
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
      { id: `out_menu_${Date.now()}`, senderName: 'Sultan Carpet Bot' }
    );
  }

  async sendBranchesListMenu(sock, jid, originalMsg) {
    const reply = stripStarsAndEmojis(menuHandler.getBranchesMenu());
    await this.safeSendMessage(
      sock,
      jid,
      { text: reply },
      originalMsg,
      { id: `out_branches_${Date.now()}`, senderName: 'Sultan Carpet Bot' }
    );
  }

  async sendCatalogSelection(sock, jid, originalMsg) {
    sessionManager.setState(jid, 'SELECT_PRODUCT');
    const selectionMenu = stripStarsAndEmojis(menuHandler.getCatalogSelectionMenu());
    await this.sendReply(sock, jid, selectionMenu, originalMsg);
  }

  async sendCatalogCard(sock, jid, product, originalMsg) {
    let imageFullPath = null;
    const candidates = [
      product.image,
      product.image ? path.join(__dirname, '../../', product.image) : null,
      product.image ? path.join(__dirname, '../../assets/', product.image.replace(/^assets[\\/]/, '')) : null,
      product.image ? path.join(__dirname, '../../public/', product.image.replace(/^public[\\/]/, '')) : null,
      path.join(__dirname, '../../assets/catalog/karpet-masjid-turki.jpg')
    ];

    for (const cand of candidates) {
      if (cand && fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        imageFullPath = cand;
        break;
      }
    }

    const hasLocalImage = imageFullPath !== null;
    const caption = stripStarsAndEmojis(`${product.title.toUpperCase()}\n` +
      `${product.subtitle}\n\n` +
      `Varian: ${product.footer}\n` +
      `Harga: ${product.price}\n\n` +
      `Detail Koleksi: ${product.url || 'https://sultancarpet.co.id'}\n` +
      `───────────────────\n` +
      `Bila Anda ingin memesan ${product.title} atau survey gratis, silakan beri tahu kami.`);

    const messagePayload = hasLocalImage
      ? { image: fs.readFileSync(imageFullPath), caption }
      : { text: caption };

    await this.safeSendMessage(
      sock,
      jid,
      messagePayload,
      originalMsg,
      {
        id: `out_cat_${Date.now()}`,
        senderName: 'Sultan Carpet Bot',
        image: product.image,
        mediaType: hasLocalImage ? 'image' : 'text'
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
        senderName: options.senderName || 'Sultan Carpet Bot',
        isAi: options.isAi || false
      }
    );
  }
}

module.exports = new MessageHandler();
