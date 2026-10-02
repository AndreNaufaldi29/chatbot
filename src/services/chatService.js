const fs = require('fs');
const path = require('path');
const phoneService = require('./phoneService');
const protectionService = require('./protectionService');

const CHATS_FILE = path.join(__dirname, '../../data/chats.json');
const SYNCED_CHATS_FILE = path.join(__dirname, '../../data/synced_chats.json');

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
    this.syncedChats = new Map(); // jid -> { name, unreadCount, updatedAt }
    this.ensureFileExists();
    this.loadSyncedChats();
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

  loadSyncedChats() {
    try {
      if (fs.existsSync(SYNCED_CHATS_FILE)) {
        const raw = fs.readFileSync(SYNCED_CHATS_FILE, 'utf8');
        const data = JSON.parse(raw || '{}');
        for (const [k, v] of Object.entries(data)) {
          if (!k || k === '0@s.whatsapp.net' || k.endsWith('@broadcast') || k.endsWith('@newsletter')) continue;
          // Filter out ghost entries with no name, no phone, and no stored identity
          const realPhone = phoneService.getPhone(k, v?.name);
          const hasName = v?.name && !phoneService.isLid(v.name) && !/^\+?\d+$/.test(String(v.name).trim()) && v.name !== 'Pelanggan';
          const hasPhone = realPhone && phoneService.isRealPhone(realPhone);
          const storedName = phoneService.getName(k);
          if (!hasName && !hasPhone && !storedName) {
            continue; // Skip ghost chat
          }
          this.syncedChats.set(k, v);
        }
      }
    } catch (e) {
      console.warn('[ChatService] Gagal memuat synced_chats.json:', e.message);
    }
  }

  saveSyncedChats() {
    try {
      const obj = {};
      for (const [k, v] of this.syncedChats.entries()) {
        if (!k || k === '0@s.whatsapp.net' || k.endsWith('@broadcast') || k.endsWith('@newsletter')) continue;
        obj[k] = v;
      }
      fs.writeFileSync(SYNCED_CHATS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('[ChatService] Gagal menyimpan synced_chats.json:', e.message);
    }
  }

  setSyncedChat(jid, chatData = {}) {
    if (!jid || jid === '0@s.whatsapp.net' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) return;
    const existing = this.syncedChats.get(jid) || {};
    this.syncedChats.set(jid, {
      ...existing,
      ...chatData,
      jid,
      updatedAt: chatData.updatedAt || existing.updatedAt || new Date().toISOString()
    });
    this.saveSyncedChats();
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
    const jid = msg.jid || (msg.phone ? `${String(msg.phone).replace(/\D/g, '')}@s.whatsapp.net` : 'unknown@s.whatsapp.net');
    
    // Resolve clean senderName (never pure digits or LID)
    let senderName = msg.senderName;
    if (senderName && (phoneService.isLid(senderName) || /^\+?\d+$/.test(senderName.trim()))) {
      senderName = null;
    }
    if (!senderName && msg.direction === 'in') {
      senderName = phoneService.getName(jid);
    }
    if (!senderName) {
      senderName = msg.direction === 'out' ? 'Saya' : 'Pelanggan';
    } else if (msg.direction === 'in' && senderName !== 'Pelanggan') {
      phoneService.setName(jid, senderName);
    }

    // Resolve real phone
    let realPhone = phoneService.getPhone(jid, senderName);
    if (!realPhone && phoneService.isRealPhone(msg.phone)) {
      realPhone = String(msg.phone).replace(/\D/g, '');
    }

    if (jid && realPhone && phoneService.isRealPhone(realPhone)) {
      phoneService.setMapping(jid, realPhone, senderName);
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
      phone: realPhone || null,
      formattedPhone: phoneService.formatPhone(realPhone, jid),
      senderName,
      text: String(msg.text),
      isAi: !!msg.isAi,
      timestamp: messageTimestamp
    };

    messages.push(normalized);
    this.saveMessages(messages);
    return normalized;
  }

  addMessagesBatch(msgList) {
    if (!Array.isArray(msgList) || msgList.length === 0) return [];
    const messages = this.getAllMessages();
    const existingIds = new Set(messages.map((m) => m.id));
    const added = [];

    for (const msg of msgList) {
      if (!msg || !msg.text) continue;
      const jid = msg.jid || (msg.phone ? `${String(msg.phone).replace(/\D/g, '')}@s.whatsapp.net` : 'unknown@s.whatsapp.net');
      if (jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) continue;

      let senderName = msg.senderName;
      if (senderName && (phoneService.isLid(senderName) || /^\+?\d+$/.test(senderName.trim()))) {
        senderName = null;
      }
      if (!senderName && msg.direction === 'in') {
        senderName = phoneService.getName(jid);
      }
      if (!senderName) {
        senderName = msg.direction === 'out' ? 'Saya' : 'Pelanggan';
      } else if (msg.direction === 'in' && senderName !== 'Pelanggan') {
        phoneService.setName(jid, senderName);
      }

      let realPhone = phoneService.getPhone(jid, senderName);
      if (!realPhone && phoneService.isRealPhone(msg.phone)) {
        realPhone = String(msg.phone).replace(/\D/g, '');
      }

      if (jid && realPhone && phoneService.isRealPhone(realPhone)) {
        phoneService.setMapping(jid, realPhone, senderName);
      }

      const id = msg.id || `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if (existingIds.has(id)) continue;

      const messageText = String(msg.text).trim();
      const messageDirection = msg.direction === 'out' ? 'out' : 'in';
      const messageTimestamp = msg.timestamp || new Date().toISOString();
      const messageTimeMs = new Date(messageTimestamp).getTime();

      // Deduplication check: check if identical message already exists
      const isDuplicate = messages.some((m) =>
        m.jid === jid &&
        m.direction === messageDirection &&
        m.text &&
        m.text.trim() === messageText &&
        Math.abs(new Date(m.timestamp).getTime() - messageTimeMs) < 6000
      );

      if (isDuplicate) continue;

      const normalized = {
        id,
        direction: messageDirection,
        jid,
        phone: realPhone || null,
        formattedPhone: phoneService.formatPhone(realPhone, jid),
        senderName,
        text: messageText,
        mediaType: msg.mediaType || 'text',
        image: msg.image || null,
        isAi: !!msg.isAi,
        timestamp: messageTimestamp
      };

      existingIds.add(id);
      messages.push(normalized);
      added.push(normalized);
    }

    if (added.length > 0) {
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const trimmed = messages.slice(-3000);
      this.saveMessages(trimmed);
    }

    return added;
  }

  getConversations() {
    const messages = this.getAllMessages();
    const convMap = new Map();

    // 1. Populate and merge actual message history FIRST
    for (const msg of messages) {
      if (!msg) continue;
      let realPhone = phoneService.getPhone(msg.jid, msg.senderName);
      if (!realPhone && phoneService.isRealPhone(msg.phone)) {
        realPhone = String(msg.phone).replace(/\D/g, '');
      }
      if (!realPhone && msg.jid && msg.jid.endsWith('@s.whatsapp.net')) {
        const clean = msg.jid.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) realPhone = clean;
      }

      // Canonical groupKey: prioritize real phone JID or remote JID
      const groupKey = realPhone ? `${realPhone}@s.whatsapp.net` : (msg.jid || 'unknown');

      if (!convMap.has(groupKey)) {
        let contactName = phoneService.getName(msg.jid) || (realPhone ? phoneService.getName(realPhone) : null);
        if (!contactName && msg.direction === 'in' && msg.senderName && !phoneService.isLid(msg.senderName) && !/^\+?\d+$/.test(msg.senderName) && msg.senderName !== 'Pelanggan') {
          contactName = msg.senderName;
        }

        const displayName = (contactName && !phoneService.isLid(contactName) && !/^\+?\d+$/.test(contactName.trim()))
          ? contactName
          : (realPhone ? phoneService.formatPhone(realPhone) : 'Pelanggan');

        convMap.set(groupKey, {
          jid: msg.jid || (realPhone ? `${realPhone}@s.whatsapp.net` : null),
          phone: realPhone || null,
          formattedPhone: phoneService.formatPhone(realPhone, msg.jid),
          senderName: displayName,
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
      if (msg.direction === 'in' && msg.senderName && !phoneService.isLid(msg.senderName) && !/^\+?\d+$/.test(msg.senderName.trim()) && msg.senderName !== 'Pelanggan') {
        conv.senderName = msg.senderName.trim();
        phoneService.setName(conv.jid, conv.senderName);
        if (realPhone) phoneService.setName(realPhone, conv.senderName);
      }

      // Check if bot message greeted the customer by name (e.g. "Halo Pak Zaenal" or "Halo Kak Andre")
      if (msg.direction === 'out' && msg.text && (!conv.senderName || conv.senderName === 'Pelanggan' || phoneService.isLid(conv.senderName) || /^\+?\d+$/.test(conv.senderName.trim()))) {
        const greetMatch = msg.text.match(/(?:Halo|Hai|Pagi|Siang|Sore|Malam)\s+(?:Pak\s+|Bu\s+|Kak\s+)?([A-Z][a-zA-Z0-9_\s]{1,25})[,.!\n]/i);
        if (greetMatch && greetMatch[1]) {
          const extracted = greetMatch[1].trim();
          if (!['admin', 'bot', 'gemini', 'groq', 'pelanggan', 'saya', 'sultan carpet bot'].includes(extracted.toLowerCase()) && !/^\d+$/.test(extracted)) {
            conv.senderName = extracted;
            phoneService.setName(conv.jid, extracted);
            if (realPhone) phoneService.setName(realPhone, extracted);
          }
        }
      }

      // Always update real phone if discovered
      if (realPhone && phoneService.isRealPhone(realPhone)) {
        conv.phone = realPhone;
        conv.formattedPhone = phoneService.formatPhone(realPhone, conv.jid);
      } else {
        if (phoneService.isLid(conv.phone)) {
          conv.phone = null;
        }
        conv.formattedPhone = phoneService.formatPhone(conv.phone, conv.jid);
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

    // 2. Enrich with syncedChats metadata or add valid named/phone contacts
    for (const [jid, c] of this.syncedChats.entries()) {
      if (!jid || jid === '0@s.whatsapp.net' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) continue;
      
      let realPhone = phoneService.getPhone(jid, c.name);
      if (!realPhone && jid.endsWith('@s.whatsapp.net')) {
        const clean = jid.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) realPhone = clean;
      }

      let contactName = c.name;
      if (!contactName || phoneService.isLid(contactName) || /^\+?\d+$/.test(contactName.trim())) {
        contactName = phoneService.getName(jid) || (realPhone ? phoneService.getName(realPhone) : null);
      }

      const canonicalKey = realPhone ? `${realPhone}@s.whatsapp.net` : jid;

      // Check if this chat already exists in convMap (via messages)
      let conv = convMap.get(canonicalKey) || convMap.get(jid);
      if (!conv && realPhone) {
        conv = Array.from(convMap.values()).find(cv => cv.phone === realPhone || cv.jid === jid);
      }

      if (conv) {
        // Enrich existing conversation
        if (c.unreadCount !== undefined && c.unreadCount > 0) {
          conv.unreadCount = Math.max(conv.unreadCount || 0, c.unreadCount);
        }
        if (contactName && (!conv.senderName || conv.senderName === 'Pelanggan')) {
          conv.senderName = contactName;
        }
        if (realPhone && !conv.phone) {
          conv.phone = realPhone;
          conv.formattedPhone = phoneService.formatPhone(realPhone, conv.jid);
        }
      } else {
        // Chat has NO messages in chats.json!
        // FILTER: Only add if it has a valid contact name or real phone number!
        const hasValidName = Boolean(contactName && !phoneService.isLid(contactName) && !/^\+?\d+$/.test(contactName.trim()) && contactName !== 'Pelanggan');
        const hasValidPhone = Boolean(realPhone && phoneService.isRealPhone(realPhone));

        // Skip ghost chats without messages, name, or phone!
        if (!hasValidName && !hasValidPhone) {
          continue;
        }

        const displayName = hasValidName ? contactName : phoneService.formatPhone(realPhone);
        convMap.set(canonicalKey, {
          jid,
          phone: realPhone || null,
          formattedPhone: phoneService.formatPhone(realPhone, jid),
          senderName: displayName,
          lastMessage: {
            id: `last_${jid}`,
            direction: 'in',
            jid,
            phone: realPhone || null,
            senderName: displayName,
            text: 'Belum ada riwayat pesan',
            timestamp: c.updatedAt || new Date().toISOString()
          },
          unreadCount: c.unreadCount || 0,
          messages: [],
          updatedAt: c.updatedAt || new Date().toISOString()
        });
      }
    }

    // Secondary pass: ensure phoneService mappings apply to each conversation
    for (const conv of convMap.values()) {
      const mapped = phoneService.getPhone(conv.jid, conv.senderName);
      if (mapped && phoneService.isRealPhone(mapped)) {
        conv.phone = mapped;
        conv.formattedPhone = phoneService.formatPhone(mapped, conv.jid);
      } else if (phoneService.isLid(conv.phone)) {
        conv.phone = null;
        conv.formattedPhone = phoneService.formatPhone(null, conv.jid);
      }

      const storedName = phoneService.getName(conv.jid) || (conv.phone ? phoneService.getName(conv.phone) : null);
      if (storedName && !phoneService.isLid(storedName) && !/^\+?\d+$/.test(storedName)) {
        conv.senderName = storedName;
      }
    }

    // Deduplicate by canonical key (conv.jid or conv.phone) to guarantee 1 User = 1 Chat
    const uniqueMap = new Map();
    for (const conv of convMap.values()) {
      const canonicalKey = conv.phone ? `${conv.phone}@s.whatsapp.net` : (conv.jid || conv.phone);
      if (!canonicalKey) continue;

      if (!uniqueMap.has(canonicalKey)) {
        uniqueMap.set(canonicalKey, conv);
      } else {
        const existing = uniqueMap.get(canonicalKey);
        // If conv has a real name and existing has fallback, take conv's real name!
        if (conv.senderName && conv.senderName !== 'Pelanggan' && (!existing.senderName || existing.senderName === 'Pelanggan')) {
          existing.senderName = conv.senderName;
        }
        // If conv has real phone and existing doesn't, take conv's phone!
        if (conv.phone && !existing.phone) {
          existing.phone = conv.phone;
          existing.formattedPhone = conv.formattedPhone;
        }
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

    // Final hygiene pass: guarantee no raw LIDs in names or phones, and format real phone as name if name missing
    for (const conv of conversations) {
      if (!conv.senderName || phoneService.isLid(conv.senderName) || /^\+?\d+$/.test(conv.senderName.trim())) {
        const stored = phoneService.getName(conv.jid) || (conv.phone ? phoneService.getName(conv.phone) : null);
        conv.senderName = stored || (conv.phone ? phoneService.formatPhone(conv.phone) : 'Pelanggan');
      }
      if (phoneService.isLid(conv.phone)) {
        conv.phone = null;
        conv.formattedPhone = phoneService.formatPhone(null, conv.jid);
      }
      // If still Pelanggan but phone is known, use formatted phone as title
      if (conv.senderName === 'Pelanggan' && conv.phone && phoneService.isRealPhone(conv.phone)) {
        conv.senderName = phoneService.formatPhone(conv.phone);
      }
      conv.isHumanHandoff = protectionService.isHumanHandoff(conv.jid) || (conv.phone ? protectionService.isHumanHandoff(conv.phone) : false);
      conv.aiEnabled = !conv.isHumanHandoff;
      conv.isOptedIn = protectionService.isOptedIn(conv.jid);
    }

    return conversations;
  }

  updateCustomerProfile(targetJid, { name, phone }) {
    if (!targetJid) return null;
    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    if (cleanPhone && cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const cleanJid = String(targetJid).trim();

    if (name) {
      phoneService.setName(cleanJid, name);
    }

    if (cleanPhone && phoneService.isRealPhone(cleanPhone)) {
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
            formattedPhone: phoneService.formatPhone(cleanPhone, m.jid) 
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

  async clearConversation(targetJid) {
    if (!targetJid) return false;
    const rawKey = String(targetJid).trim().toLowerCase();
    const shortKey = rawKey.split('@')[0];
    const cleanDigits = rawKey.replace(/\D/g, '');
    const mappedPhone = phoneService.getPhone(rawKey) || phoneService.getPhone(shortKey);

    const keysToPurge = new Set([
      rawKey,
      shortKey,
      cleanDigits,
      `${cleanDigits}@s.whatsapp.net`,
      `${cleanDigits}@lid`
    ]);
    if (mappedPhone) {
      const p = String(mappedPhone).toLowerCase().replace(/\D/g, '');
      keysToPurge.add(p);
      keysToPurge.add(`${p}@s.whatsapp.net`);
      keysToPurge.add(`${p}@lid`);
    }

    // 1. Delete from this.syncedChats
    for (const k of Array.from(this.syncedChats.keys())) {
      const kLow = String(k).toLowerCase();
      const kDigits = kLow.replace(/\D/g, '');
      const kShort = kLow.split('@')[0];
      if (keysToPurge.has(kLow) || keysToPurge.has(kDigits) || keysToPurge.has(kShort)) {
        this.syncedChats.delete(k);
      }
    }
    this.saveSyncedChats();

    // 2. Filter out from chats.json
    const messages = this.getAllMessages();
    const filtered = messages.filter((m) => {
      const mJid = String(m.jid || '').toLowerCase();
      const mJidShort = mJid.split('@')[0];
      const mPhone = String(m.phone || '').replace(/\D/g, '');
      if (keysToPurge.has(mJid) || keysToPurge.has(mJidShort) || keysToPurge.has(mPhone)) {
        return false;
      }
      return true;
    });
    this.saveMessages(filtered);

    // 3. Delete from Prisma / Postgres
    const jidArray = Array.from(keysToPurge).filter(Boolean);
    try {
      const dbService = require('./dbService');
      await dbService.deleteChatMessagesByJid(jidArray);
    } catch (e) {
      console.warn('[ChatService] dbService delete error:', e.message);
    }

    return true;
  }

  async clearAll() {
    this.saveMessages([]);
    this.syncedChats.clear();
    this.saveSyncedChats();
    try {
      const dbService = require('./dbService');
      await dbService.clearAllChatMessages();
    } catch (e) {
      console.warn('[ChatService] dbService clearAll error:', e.message);
    }
    return true;
  }
}

module.exports = new ChatService();
