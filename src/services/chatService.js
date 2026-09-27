const fs = require('fs');
const path = require('path');
const phoneService = require('./phoneService');

const CHATS_FILE = path.join(__dirname, '../../data/chats.json');

const INITIAL_SEED_CHATS = [
  {
    id: 'seed_1_in',
    direction: 'in',
    jid: '92011503861900@lid',
    phone: '6282115038619',
    senderName: 'Andre N',
    text: 'Halo',
    isAi: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'seed_1_out',
    direction: 'out',
    jid: '92011503861900@lid',
    phone: '6282115038619',
    senderName: 'Harbor AI (Gemini)',
    text: 'Halo Kak *Andre!* ✨ Selamat datang di *Harbor (Stoneware & Mindful Living)*. 🌿\n\nSaya Harbor Assistant, siap membantu Kakak menemukan keindahan dalam keseharian melalui koleksi keramik artisanal kami yang dibuat dengan penuh rasa. 🏺\n\nUntuk memulai perjalanan *mindful* Kakak bersama kami, silakan ketik pilihan di bawah ini:\n• Ketik *MENU* untuk melihat seluruh katalog produk & info showroom kami.\n• Ketik *ORDER [nomor]* jika ingin langsung memesan (misal: *ORDER 1*).\n• Ketik *CS* jika ingin terhubung langsung dengan tim kami.\n\nAda yang bisa kami bantu hari ini, Kak? ☕',
    isAi: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString()
  },
  {
    id: 'seed_2_in',
    direction: 'in',
    jid: '21453546229779@lid',
    phone: '6282333893488',
    senderName: 'Kharisma Alung P',
    text: 'Halo, apakah keramiknya aman dimasukkan ke microwave?',
    isAi: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  },
  {
    id: 'seed_2_out',
    direction: 'out',
    jid: '21453546229779@lid',
    phone: '6282333893488',
    senderName: 'Harbor AI (Gemini)',
    text: '👋 *Halo Kak Kharisma!* Ya, tentu saja! Seluruh produk keramik artisanal dari *Harbor* 100% food-safe, microwave safe, dan dishwasher safe 🌿.\n\nApakah ada produk tertentu yang sedang Kakak cari seperti *The Everyday Set*?',
    isAi: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString()
  }
];

class ChatService {
  constructor() {
    this.ensureFileExists();
  }

  ensureFileExists() {
    const dir = path.dirname(CHATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CHATS_FILE)) {
      fs.writeFileSync(CHATS_FILE, JSON.stringify(INITIAL_SEED_CHATS, null, 2), 'utf8');
    }
  }

  getAllMessages() {
    try {
      this.ensureFileExists();
      const raw = fs.readFileSync(CHATS_FILE, 'utf8');
      const messages = JSON.parse(raw || '[]');
      return Array.isArray(messages) ? messages : [];
    } catch (err) {
      console.error('[ChatService] Gagal membaca chats.json:', err.message);
      return [];
    }
  }

  saveMessages(messages) {
    try {
      this.ensureFileExists();
      // Keep at most 1000 messages to prevent unbounded growth
      const trimmed = messages.slice(-1000);
      fs.writeFileSync(CHATS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[ChatService] Gagal menyimpan chats.json:', err.message);
      return false;
    }
  }

  addMessage(msg) {
    if (!msg || !msg.text) return null;
    const messages = this.getAllMessages();

    // Determine target JID and real phone
    const jid = msg.jid || (msg.phone ? `${msg.phone.replace(/\D/g, '')}@s.whatsapp.net` : 'unknown@s.whatsapp.net');
    const realPhone = phoneService.getPhone(jid, msg.senderName) || (msg.phone ? String(msg.phone).replace(/\D/g, '') : (jid ? jid.split('@')[0] : 'Unknown'));

    if (jid && realPhone && realPhone.length >= 8) {
      phoneService.setMapping(jid, realPhone, msg.senderName);
    }

    const messageText = String(msg.text).trim();
    const messageDirection = msg.direction === 'out' ? 'out' : 'in';
    const messageTimestamp = msg.timestamp || new Date().toISOString();
    const messageTimeMs = new Date(messageTimestamp).getTime();

    // Deduplication check: check if identical message already exists
    const duplicateIndex = messages.findIndex((m) => {
      if (msg.id && m.id === msg.id) return true;
      if (
        m.jid === jid &&
        m.direction === messageDirection &&
        m.text &&
        m.text.trim() === messageText &&
        Math.abs(new Date(m.timestamp).getTime() - messageTimeMs) < 6000
      ) {
        return true;
      }
      return false;
    });

    if (duplicateIndex !== -1) {
      console.log(`[ChatService] Mencegah duplikasi pesan id: ${msg.id} untuk ${jid}`);
      return messages[duplicateIndex];
    }

    // Standardize object
    const normalized = {
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      direction: messageDirection,
      jid,
      phone: realPhone,
      formattedPhone: phoneService.formatPhone(realPhone),
      senderName: msg.senderName || 'Pelanggan',
      text: String(msg.text),
      isAi: !!msg.isAi,
      timestamp: messageTimestamp
    };

    messages.push(normalized);
    this.saveMessages(messages);
    return normalized;
  }

  getConversations() {
    const messages = this.getAllMessages();
    const convMap = new Map();

    for (const msg of messages) {
      // Find real phone using phoneService
      const realPhone = phoneService.getPhone(msg.jid, msg.senderName) || (msg.phone ? String(msg.phone).replace(/\D/g, '') : null);
      
      // Canonical groupKey: prioritize canonical remote JID or real phone
      const groupKey = msg.jid || (realPhone ? `${realPhone}@s.whatsapp.net` : (msg.phone || 'unknown'));

      if (!convMap.has(groupKey)) {
        convMap.set(groupKey, {
          jid: msg.jid || (realPhone ? `${realPhone}@s.whatsapp.net` : null),
          phone: realPhone || msg.phone || (msg.jid ? msg.jid.split('@')[0] : 'Unknown'),
          formattedPhone: phoneService.formatPhone(realPhone || msg.phone),
          senderName: msg.direction === 'in' ? msg.senderName : (msg.senderName?.includes('AI') || msg.senderName?.includes('Bot') ? (realPhone || msg.phone) : msg.senderName),
          lastMessage: msg,
          unreadCount: 0,
          messages: [],
          updatedAt: msg.timestamp
        });
      }

      const conv = convMap.get(groupKey);

      // Prefer @lid jid if encountered for active direct messaging
      if (msg.jid && msg.jid.includes('@lid')) {
        conv.jid = msg.jid;
      } else if (!conv.jid && msg.jid) {
        conv.jid = msg.jid;
      }

      // If customer sent this message, prioritize customer's real display name
      if (msg.direction === 'in' && msg.senderName && msg.senderName !== 'Pelanggan') {
        conv.senderName = msg.senderName;
      }

      // Always update real phone if we discovered a real valid phone number
      if (realPhone && realPhone.length >= 8 && !realPhone.startsWith('214535') && !realPhone.startsWith('920115')) {
        conv.phone = realPhone;
        conv.formattedPhone = phoneService.formatPhone(realPhone);
      }

      // Deduplicate messages in conversation thread
      const isDuplicate = conv.messages.some(
        (m) =>
          m.id === msg.id ||
          (m.direction === msg.direction &&
            m.text &&
            msg.text &&
            m.text.trim() === msg.text.trim() &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 6000)
      );

      if (!isDuplicate) {
        conv.messages.push(msg);
        conv.lastMessage = msg;
        conv.updatedAt = msg.timestamp;
      }
    }

    // Secondary pass: ensure phoneService mappings apply to each conversation
    for (const conv of convMap.values()) {
      const mapped = phoneService.getPhone(conv.jid, conv.senderName);
      if (mapped && mapped.length >= 8 && !mapped.startsWith('214535') && !mapped.startsWith('920115')) {
        conv.phone = mapped;
        conv.formattedPhone = phoneService.formatPhone(mapped);
      }
    }

    // Deduplicate by canonical key (conv.jid or conv.phone) to guarantee 1 User = 1 Chat
    const uniqueMap = new Map();
    for (const conv of convMap.values()) {
      const canonicalKey = conv.jid || conv.phone;
      if (!canonicalKey) continue;

      if (!uniqueMap.has(canonicalKey)) {
        uniqueMap.set(canonicalKey, conv);
      } else {
        const existing = uniqueMap.get(canonicalKey);
        // Merge messages and preserve order
        for (const m of conv.messages) {
          if (!existing.messages.some((em) => em.id === m.id)) {
            existing.messages.push(m);
          }
        }
        if (new Date(conv.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          existing.lastMessage = conv.lastMessage;
          existing.updatedAt = conv.updatedAt;
        }
      }
    }

    // Convert map to array and sort by most recent message descending
    const conversations = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return conversations;
  }

  updateCustomerProfile(targetJid, { name, phone }) {
    if (!targetJid) return null;
    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    if (cleanPhone && cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const cleanJid = String(targetJid).trim();

    if (cleanPhone) {
      phoneService.setMapping(cleanJid, cleanPhone, name);
    }

    const messages = this.getAllMessages();
    const updatedMessages = messages.map(m => {
      const isMatch = m.jid === cleanJid || 
                      (cleanPhone && m.phone === cleanPhone) || 
                      (name && m.senderName && m.senderName.toLowerCase() === name.toLowerCase());
      if (isMatch) {
        return {
          ...m,
          ...(name && m.direction === 'in' ? { senderName: name.trim() } : {}),
          ...(cleanPhone ? { 
            phone: cleanPhone, 
            formattedPhone: phoneService.formatPhone(cleanPhone) 
          } : {})
        };
      }
      return m;
    });

    this.saveMessages(updatedMessages);
    const conversations = this.getConversations();
    return conversations.find(c => c.jid === cleanJid || (cleanPhone && c.phone === cleanPhone)) || null;
  }

  getMessagesByJid(jid) {
    if (!jid) return [];
    const cleanKey = String(jid).toLowerCase();
    const cleanPhone = cleanKey.replace(/\D/g, '');
    const messages = this.getAllMessages();

    return messages.filter(m => 
      String(m.jid).toLowerCase() === cleanKey || 
      String(m.phone).replace(/\D/g, '') === cleanPhone
    );
  }

  clearConversation(jid) {
    if (!jid) return false;
    const cleanKey = String(jid).toLowerCase();
    const cleanPhone = cleanKey.replace(/\D/g, '');
    const realPhone = phoneService.getPhone(cleanKey);
    const messages = this.getAllMessages();

    const filtered = messages.filter(m => {
      const mJid = String(m.jid || '').toLowerCase();
      const mPhone = String(m.phone || '').replace(/\D/g, '');
      if (mJid === cleanKey || mPhone === cleanPhone) return false;
      if (realPhone && mPhone === realPhone) return false;
      return true;
    });

    return this.saveMessages(filtered);
  }

  clearAll() {
    return this.saveMessages([]);
  }
}

module.exports = new ChatService();
