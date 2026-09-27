const fs = require('fs');
const path = require('path');
const { prepareWAMessageMedia, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const menuHandler = require('./menuHandler');
const ticketService = require('../services/ticketService');
const sessionManager = require('../services/sessionManager');
const aiService = require('../services/aiService');
const phoneService = require('../services/phoneService');
const { stripStarsAndEmojis } = require('../utils/textCleaner');

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
    const jid = msg.key?.remoteJid;
    if (!jid) return;

    // Non-blocking per-JID concurrency queue:
    // Different users process simultaneously in parallel.
    // Rapid messages from the SAME user are processed in sequence.
    const currentPromise = this.userQueues.get(jid) || Promise.resolve();
    const nextPromise = currentPromise
      .then(() => this._processMessage(sock, msg))
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

  async _processMessage(sock, msg) {
    try {
      if (!msg.message || msg.key.fromMe) return;

      const jid = msg.key.remoteJid;
      const isGroup = jid.endsWith('@g.us');
      const config = menuHandler.getConfig();

      if (isGroup && config.bot.ignore_groups) {
        return;
      }

      const messageInfo = this.extractMessageInfo(msg.message);
      const rawText = messageInfo.text.trim();
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
        mediaType: messageInfo.mediaType,
        timestamp: new Date().toISOString()
      });

      // Mark message as read
      if (config.bot.auto_read_messages) {
        await sock.readMessages([msg.key]).catch(() => {});
      }

      const session = sessionManager.getSession(jid);
      const textLower = rawText.toLowerCase();

      // Check if user is in HUMAN_CS mode
      if (sessionManager.isHumanMode(jid)) {
        if (['bot', 'menu', 'reset', 'aktifkan bot', 'kembali'].includes(textLower)) {
          sessionManager.setHumanMode(jid, false);
          const reply = 'Mode asisten otomatis telah aktif kembali.';
          await this.sendReply(sock, jid, reply, msg);
          await this.sendListMenu(sock, jid, senderName, msg);
          return;
        }

        console.log(`[CS Mode] Pesan dari ${cleanPhone}: "${rawText}" (Sedang dalam penanganan CS manusia)`);
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

    // 2. Foto & detail
    if (
      textLower === '2' ||
      textLower === 'foto' ||
      textLower === 'gambar' ||
      textLower === 'detail' ||
      textLower.includes('foto') ||
      textLower.includes('gambar') ||
      textLower.includes('detail')
    ) {
      await this.sendCatalogCard(sock, jid, product, originalMsg);
      const reminder = `Bila Anda ingin memesan ${product.title}, silakan beri tahu kami atau pilih produk lainnya.`;
      await this.sendReply(sock, jid, reminder, originalMsg);
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

    // 1. Explicit menu commands
    const isExplicitKatalog = textLower === '1' || textLower === 'katalog' || textLower === 'menu_katalog';
    const isExplicitCabang = textLower === '2' || textLower === 'cabang' || textLower === 'menu_cabang' || textLower === 'showroom';
    const isExplicitCs = textLower === '3' || textLower === 'cs' || textLower === 'menu_cs' || textLower === 'admin' || textLower === 'operator';

    if (isExplicitKatalog) {
      await this.sendCatalogSelection(sock, jid, originalMsg);
      return;
    }

    if (isExplicitCabang) {
      sessionManager.setState(jid, 'SELECT_BRANCH');
      await this.sendBranchesListMenu(sock, jid, originalMsg);
      return;
    }

    if (isExplicitCs) {
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
      const stickerReply = `Halo ${senderName}, terima kasih atas sapaan stikernya. Ada yang dapat kami bantu terkait produk keramik atau layanan Harbor hari ini?`;
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
          // Detect [KIRIM_FOTO: ...] tags from AI
          const photoTags = [];
          const tagRegex = /\[KIRIM_FOTO:\s*([A-Za-z0-9_-]+)\]/gi;
          let match;
          while ((match = tagRegex.exec(aiReply)) !== null) {
            photoTags.push(match[1].toUpperCase());
          }

          // Heuristic detection: if user asked for photos and mentioned products
          const isAskingPhoto = textLower.includes('foto') || textLower.includes('gambar') || textLower.includes('pic') || textLower.includes('pict') || textLower.includes('lihat') || textLower.includes('spill') || textLower.includes('tampil');
          const catalog = menuHandler.getCatalog();

          if (isAskingPhoto && photoTags.length === 0) {
            for (const item of catalog) {
              const code = (item.code || '').toLowerCase();
              const titleWords = item.title.toLowerCase().split(' ').filter(w => w.length > 3);
              if ((code && textLower.includes(code)) || titleWords.some(w => textLower.includes(w))) {
                photoTags.push(item.code || item.id);
                break;
              }
            }
            if (photoTags.length === 0 && (textLower.includes('katalog') || textLower.includes('produk') || textLower.includes('koleksi') || textLower.includes('semua'))) {
              photoTags.push('ALL');
            }
          }

          // Strip [KIRIM_FOTO: ...] tags before sending clean text to user
          let cleanReply = aiReply.replace(/\[KIRIM_FOTO:[^\]]+\]/gi, '').trim();
          cleanReply = stripStarsAndEmojis(cleanReply);

          sessionManager.updateReplyTime(jid);
          await sock.sendMessage(jid, { text: cleanReply }, { quoted: originalMsg });

          const provider = aiService.getActiveProvider();
          const providerDisplayName = provider === 'groq' ? 'Harbor AI (Groq)' : 'Harbor AI (Gemini)';

          this.emitLog({
            id: `out_ai_${Date.now()}`,
            direction: 'out',
            jid,
            phone,
            senderName: providerDisplayName,
            text: cleanReply,
            isAi: true,
            timestamp: new Date().toISOString()
          });

          // Send actual product image(s) if requested or recommended!
          if (photoTags.length > 0) {
            let productsToSend = [];
            if (photoTags.includes('ALL')) {
              productsToSend = catalog.slice(0, 3);
            } else {
              for (const tag of photoTags) {
                const item = catalog.find(c =>
                  String(c.id) === String(tag) ||
                  (c.code && c.code.toUpperCase() === tag) ||
                  c.title.toUpperCase().includes(tag)
                );
                if (item && !productsToSend.some(p => p.id === item.id)) {
                  productsToSend.push(item);
                }
              }
            }

            for (const prod of productsToSend) {
              await this.sendCatalogCard(sock, jid, prod, originalMsg);
            }
          }

          return;
        }
      } catch (aiErr) {
        console.warn('[MessageHandler] Gagal memproses AI, beralih ke fallback:', aiErr.message);
      }
    }

    // 4. Keyword Fallback
    if (
      textLower.includes('katalog') ||
      textLower.includes('produk') ||
      textLower.includes('koleksi') ||
      textLower.includes('harga')
    ) {
      await this.sendCatalogSelection(sock, jid, originalMsg);
      return;
    }

    if (
      textLower.includes('cabang') ||
      textLower.includes('lokasi') ||
      textLower.includes('alamat') ||
      textLower.includes('toko')
    ) {
      sessionManager.setState(jid, 'SELECT_BRANCH');
      await this.sendBranchesListMenu(sock, jid, originalMsg);
      return;
    }

    if (
      textLower.includes('cs') ||
      textLower.includes('bantuan') ||
      textLower.includes('komplain')
    ) {
      sessionManager.setHumanMode(jid, true);
      const reply = menuHandler.getHumanCsPrompt();
      await this.sendReply(sock, jid, reply, originalMsg);
      return;
    }

    // Default Fallback: Menu Utama
    await this.sendListMenu(sock, jid, senderName, originalMsg);
  }

  async sendListMenu(sock, jid, senderName, originalMsg) {
    try {
      sessionManager.updateReplyTime(jid);
      const menuText = stripStarsAndEmojis(menuHandler.getMainMenu(senderName));
      const resolvedPhone = phoneService.getPhone(jid, senderName) || jid.split('@')[0];

      await sock.sendMessage(jid, { text: menuText }, { quoted: originalMsg });

      this.emitLog({
        id: `out_menu_${Date.now()}`,
        direction: 'out',
        jid,
        phone: resolvedPhone,
        senderName: 'Harbor Bot',
        text: menuText,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[MessageHandler] Gagal mengirim menu utama:', err.message);
    }
  }

  async sendBranchesListMenu(sock, jid, originalMsg) {
    try {
      sessionManager.updateReplyTime(jid);
      const reply = stripStarsAndEmojis(menuHandler.getBranchesMenu());
      const resolvedPhone = phoneService.getPhone(jid) || jid.split('@')[0];

      await sock.sendMessage(jid, { text: reply }, { quoted: originalMsg });

      this.emitLog({
        id: `out_branches_${Date.now()}`,
        direction: 'out',
        jid,
        phone: resolvedPhone,
        senderName: 'Harbor Bot',
        text: reply,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[MessageHandler] Gagal mengirim menu cabang:', err.message);
    }
  }

  async sendCatalogSelection(sock, jid, originalMsg) {
    try {
      sessionManager.updateReplyTime(jid);
      sessionManager.setState(jid, 'SELECT_PRODUCT');
      const selectionMenu = stripStarsAndEmojis(menuHandler.getCatalogSelectionMenu());
      await this.sendReply(sock, jid, selectionMenu, originalMsg);
    } catch (err) {
      console.error('[MessageHandler] Gagal mengirim menu pemilihan katalog:', err.message);
    }
  }

  async sendCatalogCard(sock, jid, product, originalMsg) {
    try {
      sessionManager.updateReplyTime(jid);

      let imageFullPath = null;
      const candidates = [
        product.image,
        product.image ? path.join(__dirname, '../../', product.image) : null,
        product.image ? path.join(__dirname, '../../assets/', product.image.replace(/^assets[\\/]/, '')) : null,
        product.image ? path.join(__dirname, '../../public/', product.image.replace(/^public[\\/]/, '')) : null,
        path.join(__dirname, '../../assets/catalog/everyday-set.jpg')
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
        `Detail Koleksi: ${product.url || 'https://harbor.example.com'}\n` +
        `───────────────────\n` +
        `Bila Anda ingin memesan ${product.title}, silakan beri tahu kami.`);

      const resolvedPhone = phoneService.getPhone(jid) || jid.split('@')[0];

      if (hasLocalImage) {
        await sock.sendMessage(jid, {
          image: fs.readFileSync(imageFullPath),
          caption
        }, { quoted: originalMsg });
      } else {
        await sock.sendMessage(jid, { text: caption }, { quoted: originalMsg });
      }

      this.emitLog({
        id: `out_cat_${Date.now()}`,
        direction: 'out',
        jid,
        phone: resolvedPhone,
        senderName: 'Harbor Bot',
        text: caption,
        image: product.image,
        mediaType: 'image',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[MessageHandler] Gagal mengirim kartu katalog:', err.message);
    }
  }

  async sendReply(sock, jid, text, originalMsg) {
    try {
      sessionManager.updateReplyTime(jid);
      const cleanText = stripStarsAndEmojis(text);
      const resolvedPhone = phoneService.getPhone(jid) || jid.split('@')[0];
      await sock.sendMessage(jid, { text: cleanText }, { quoted: originalMsg });

      this.emitLog({
        id: `out_${Date.now()}`,
        direction: 'out',
        jid,
        phone: resolvedPhone,
        senderName: 'Harbor Bot',
        text: cleanText,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[MessageHandler] Gagal mengirim balasan:', err.message);
    }
  }
}

module.exports = new MessageHandler();
