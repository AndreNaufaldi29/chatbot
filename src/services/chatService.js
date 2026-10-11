const fs = require('fs');
const path = require('path');
const phoneService = require('./phoneService');
const protectionService = require('./protectionService');

const CHATS_FILE = path.join(__dirname, '../../data/chats.json');
const SYNCED_CHATS_FILE = path.join(__dirname, '../../data/synced_chats.json');
const DELETED_CHATS_FILE = path.join(__dirname, '../../data/deleted_chats.json');

const INITIAL_SEED_CHATS = [];

class ChatService {
  constructor() {
    this.deletedChats = new Set();
    this.syncedChats = new Map(); // jid -> { name, unreadCount, updatedAt }
    this.ensureFileExists();
    this.loadDeletedChats();
    this.loadSyncedChats();
  }

  ensureFileExists() {
    const dir = path.dirname(CHATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CHATS_FILE)) {
      fs.writeFileSync(CHATS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  isSelfJid(jid) {
    if (!jid) return false;
    const clean = String(jid).split(':')[0].replace(/[@a-zA-Z._-]/g, '');
    return clean === '6285189520708' || clean === '90560006230229';
  }

  loadDeletedChats() {
    try {
      if (fs.existsSync(DELETED_CHATS_FILE)) {
        const raw = fs.readFileSync(DELETED_CHATS_FILE, 'utf8');
        const list = JSON.parse(raw || '[]');
        if (Array.isArray(list)) {
          this.deletedChats = new Set(list.map(k => String(k).toLowerCase()));
        }
      }
    } catch (e) {
      console.warn('[ChatService] Gagal memuat deleted_chats.json:', e.message);
    }
  }

  saveDeletedChats() {
    try {
      const dir = path.dirname(DELETED_CHATS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DELETED_CHATS_FILE, JSON.stringify(Array.from(this.deletedChats), null, 2), 'utf8');
    } catch (e) {
      console.warn('[ChatService] Gagal menyimpan deleted_chats.json:', e.message);
    }
  }

  isChatDeleted(jid, phone = null) {
    if (!jid && !phone) return false;
    const candidates = [];
    if (jid) {
      const raw = String(jid).trim().toLowerCase();
      candidates.push(raw);
      candidates.push(raw.split('@')[0]);
      const digits = raw.replace(/\D/g, '');
      if (digits) {
        candidates.push(digits);
        candidates.push(`${digits}@s.whatsapp.net`);
        candidates.push(`${digits}@lid`);
      }
      if (phoneService && phoneService.mapping) {
        const mapped = phoneService.mapping[raw] || phoneService.mapping[raw.split('@')[0]];
        if (mapped) {
          const mDigits = String(mapped).replace(/\D/g, '');
          candidates.push(mDigits);
          candidates.push(`${mDigits}@s.whatsapp.net`);
          candidates.push(`${mDigits}@lid`);
        }
      }
    }
    if (phone) {
      const p = String(phone).replace(/\D/g, '');
      if (p) {
        candidates.push(p);
        candidates.push(`${p}@s.whatsapp.net`);
        candidates.push(`${p}@lid`);
      }
    }
    return candidates.some(k => this.deletedChats.has(k));
  }

  unmarkDeleted(jid, phone = null) {
    if (!jid && !phone) return;
    let changed = false;
    const candidates = [];
    if (jid) {
      const raw = String(jid).trim().toLowerCase();
      candidates.push(raw, raw.split('@')[0]);
      const digits = raw.replace(/\D/g, '');
      if (digits) candidates.push(digits, `${digits}@s.whatsapp.net`, `${digits}@lid`);
    }
    if (phone) {
      const p = String(phone).replace(/\D/g, '');
      if (p) candidates.push(p, `${p}@s.whatsapp.net`, `${p}@lid`);
    }
    for (const c of candidates) {
      if (this.deletedChats.has(c)) {
        this.deletedChats.delete(c);
        changed = true;
      }
    }
    if (changed) this.saveDeletedChats();
  }

  loadSyncedChats() {
    try {
      if (fs.existsSync(SYNCED_CHATS_FILE)) {
        const raw = fs.readFileSync(SYNCED_CHATS_FILE, 'utf8');
        const data = JSON.parse(raw || '{}');
        for (const [k, v] of Object.entries(data)) {
          if (!k || k === '0@s.whatsapp.net' || k.endsWith('@broadcast') || k.endsWith('@newsletter') || this.isSelfJid(k)) continue;
          if (this.isChatDeleted(k)) continue;
          this.syncedChats.set(k, v);
        }
      }
      this.pruneEmptySyncedChats();
    } catch (e) {
      console.warn('[ChatService] Gagal memuat synced_chats.json:', e.message);
    }
  }

  pruneEmptySyncedChats() {
    try {
      const messages = this.getAllMessages();
      const activeKeys = new Set();
      for (const m of messages) {
        if (m.jid) activeKeys.add(m.jid);
        if (m.phone) {
          activeKeys.add(m.phone);
          activeKeys.add(`${m.phone}@s.whatsapp.net`);
        }
      }
      let changed = false;
      for (const k of Array.from(this.syncedChats.keys())) {
        const cleanPhone = String(k).split('@')[0].replace(/\D/g, '');
        if (!activeKeys.has(k) && !activeKeys.has(cleanPhone)) {
          this.syncedChats.delete(k);
          changed = true;
        }
      }
      if (changed) {
        this.saveSyncedChats();
      }
    } catch (e) {
      console.warn('[ChatService] Gagal memangkas synced_chats.json:', e.message);
    }
  }

  saveSyncedChats() {
    try {
      const obj = {};
      for (const [k, v] of this.syncedChats.entries()) {
        if (!k || k === '0@s.whatsapp.net' || k.endsWith('@broadcast') || k.endsWith('@newsletter') || this.isSelfJid(k)) continue;
        if (this.isChatDeleted(k)) continue;
        obj[k] = v;
      }
      fs.writeFileSync(SYNCED_CHATS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('[ChatService] Gagal menyimpan synced_chats.json:', e.message);
    }
  }

  setSyncedChat(jid, chatData = {}) {
    if (!jid || jid === '0@s.whatsapp.net' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter') || this.isSelfJid(jid)) return;
    if (this.isChatDeleted(jid)) return;
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
      if (!Array.isArray(messages)) return [];
      // Sanitize: keep valid messages (text or image)
      return messages.filter(m => m && (m.text || m.image) && (typeof m.text === 'string' ? m.text.trim() !== '[text]' : true));
    } catch (err) {
      console.error('[ChatService] Gagal membaca chats.json:', err.message);
      return [];
    }
  }

  saveMessages(messages) {
    try {
      this.ensureFileExists();
      const valid = (Array.isArray(messages) ? messages : []).filter(
        m => m && (m.text || m.image) && (typeof m.text === 'string' ? m.text.trim() !== '[text]' : true)
      );
      // Keep at most 3000 messages to prevent unbounded growth while keeping rich history
      const trimmed = valid.slice(-3000);
      fs.writeFileSync(CHATS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[ChatService] Gagal menyimpan chats.json:', err.message);
      return false;
    }
  }

  addMessage(msg) {
    if (!msg) return null;
    let messageText = typeof msg.text === 'string' ? msg.text.trim() : '';
    if (
      messageText === '[Foto pelanggan]' ||
      messageText === '[Foto]' ||
      messageText.toLowerCase() === 'pelanggan' ||
      messageText === '[Foto Terkirim]'
    ) {
      messageText = '';
    }
    if (!messageText && !msg.image) return null;
    if (messageText === '[text]' && !msg.image) return null;

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
    if (!realPhone) {
      const extracted = phoneService.extractPhoneFromText(messageText);
      if (extracted && phoneService.isRealPhone(extracted)) {
        realPhone = extracted;
      }
    }

    if (jid && realPhone && phoneService.isRealPhone(realPhone)) {
      phoneService.setMapping(jid, realPhone, senderName);
    }

    // If incoming message from customer, unmark from deletedChats so active conversation is restored
    if (msg.direction === 'in') {
      this.unmarkDeleted(jid, realPhone);
    }

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
      // If previous message lacked an image but current has it, update image
      if (msg.image && !messages[duplicateIndex].image) {
        messages[duplicateIndex].image = msg.image;
        messages[duplicateIndex].mediaType = msg.mediaType || 'image';
        this.saveMessages(messages);
      }
      return messages[duplicateIndex];
    }

    // Standardize object with full mediaType and image support
    const normalized = {
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      direction: messageDirection,
      jid,
      phone: realPhone || null,
      formattedPhone: phoneService.formatPhone(realPhone, jid),
      senderName,
      text: messageText,
      mediaType: msg.mediaType || (msg.image ? 'image' : 'text'),
      image: msg.image || null,
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
      if (!msg) continue;
      let messageText = typeof msg.text === 'string' ? msg.text.trim() : '';
      if (
        messageText === '[Foto pelanggan]' ||
        messageText === '[Foto]' ||
        messageText.toLowerCase() === 'pelanggan' ||
        messageText === '[Foto Terkirim]'
      ) {
        messageText = '';
      }
      if (!messageText && !msg.image) continue;
      if (messageText === '[text]' && !msg.image) continue;

      const jid = msg.jid || (msg.phone ? `${String(msg.phone).replace(/\D/g, '')}@s.whatsapp.net` : 'unknown@s.whatsapp.net');
      if (jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) continue;
      if (this.isChatDeleted(jid, msg.phone)) continue;

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
      if (!realPhone) {
        const extracted = phoneService.extractPhoneFromText(messageText);
        if (extracted && phoneService.isRealPhone(extracted)) {
          realPhone = extracted;
        }
      }

      if (jid && realPhone && phoneService.isRealPhone(realPhone)) {
        phoneService.setMapping(jid, realPhone, senderName);
      }

      const id = msg.id || `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if (existingIds.has(id)) continue;

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
      const hasText = Boolean(msg.text && typeof msg.text === 'string' && msg.text.trim() && msg.text.trim() !== '[text]');
      const hasMedia = Boolean(msg.image || msg.mediaType === 'image');
      if (!hasText && !hasMedia) continue;
      if (this.isSelfJid(msg.jid) || this.isSelfJid(msg.phone)) continue;
      if (this.isChatDeleted(msg.jid, msg.phone)) continue;

      let realPhone = phoneService.getPhone(msg.jid, msg.senderName);
      if (!realPhone && phoneService.isRealPhone(msg.phone)) {
        realPhone = String(msg.phone).replace(/\D/g, '');
      }
      if (!realPhone && msg.jid && msg.jid.endsWith('@s.whatsapp.net')) {
        const clean = msg.jid.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) realPhone = clean;
      }
      if (!realPhone && msg.text) {
        const ext = phoneService.extractPhoneFromText(msg.text);
        if (ext && phoneService.isRealPhone(ext)) realPhone = ext;
      }

      // Group key: prioritize remote JID to keep distinct contact chats separate
      const groupKey = msg.jid || (realPhone ? `${realPhone}@s.whatsapp.net` : 'unknown');

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

    // 2. Enrich EXISTING conversations or ADD conversations from synced WhatsApp chats
    for (const [jid, c] of this.syncedChats.entries()) {
      if (!jid || jid === '0@s.whatsapp.net' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter') || this.isSelfJid(jid)) continue;
      if (this.isChatDeleted(jid)) continue;
      
      let realPhone = phoneService.getPhone(jid, c.name);
      if (!realPhone && jid.endsWith('@s.whatsapp.net')) {
        const clean = jid.split('@')[0].replace(/\D/g, '');
        if (phoneService.isRealPhone(clean)) realPhone = clean;
      }
      if (realPhone && this.isChatDeleted(jid, realPhone)) continue;

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
        if (c.unreadCount !== undefined && c.unreadCount > 0) {
          conv.unreadCount = Math.max(conv.unreadCount || 0, c.unreadCount);
        }
        if (contactName && (!conv.senderName || conv.senderName === 'Pelanggan')) {
          conv.senderName = contactName;
          phoneService.setName(conv.jid, contactName);
          if (conv.phone) phoneService.setName(conv.phone, contactName);
        }
        if (realPhone && !conv.phone) {
          conv.phone = realPhone;
          conv.formattedPhone = phoneService.formatPhone(realPhone, conv.jid);
          phoneService.setMapping(conv.jid, realPhone, conv.senderName);
        }
      }
    }

    // 3. Secondary pass: ensure phoneService mappings and message-extracted phones apply
    for (const conv of convMap.values()) {
      if (!conv.phone || phoneService.isLid(conv.phone)) {
        let mapped = phoneService.getPhone(conv.jid, conv.senderName);
        if (!mapped) {
          for (const m of conv.messages) {
            if (m.text) {
              const ext = phoneService.extractPhoneFromText(m.text);
              if (ext && phoneService.isRealPhone(ext)) {
                mapped = ext;
                break;
              }
            }
          }
        }

        if (mapped && phoneService.isRealPhone(mapped)) {
          conv.phone = mapped;
          conv.formattedPhone = phoneService.formatPhone(mapped, conv.jid);
          phoneService.setMapping(conv.jid, mapped, conv.senderName);
        } else {
          conv.phone = null;
          conv.formattedPhone = phoneService.formatPhone(null, conv.jid);
        }
      }

      const storedName = phoneService.getName(conv.jid) || (conv.phone ? phoneService.getName(conv.phone) : null);
      if (storedName && !phoneService.isLid(storedName) && !/^\+?\d+$/.test(storedName)) {
        conv.senderName = storedName;
      }
    }

    // 4. Deduplicate by canonical key (conv.jid or conv.phone)
    const uniqueMap = new Map();
    for (const conv of convMap.values()) {
      if (this.isChatDeleted(conv.jid, conv.phone)) continue;
      const canonicalKey = conv.phone ? `${conv.phone}@s.whatsapp.net` : (conv.jid || conv.phone);
      if (!canonicalKey) continue;

      if (!uniqueMap.has(canonicalKey)) {
        uniqueMap.set(canonicalKey, conv);
      } else {
        const existing = uniqueMap.get(canonicalKey);

        // Guard: If existing and conv have distinct, conflicting sender names, NEVER merge them into 1 chat!
        const existingName = (existing.senderName || '').trim().toLowerCase();
        const convName = (conv.senderName || '').trim().toLowerCase();
        const isConflict = existingName && convName &&
                           existingName !== 'pelanggan' && convName !== 'pelanggan' &&
                           !existingName.includes('pelanggan whatsapp') && !convName.includes('pelanggan whatsapp') &&
                           existingName !== convName;

        if (isConflict) {
          // Keep both separate!
          uniqueMap.set(conv.jid || `${canonicalKey}_${conv.senderName}`, conv);
          continue;
        }

        if (conv.senderName && conv.senderName !== 'Pelanggan' && (!existing.senderName || existing.senderName === 'Pelanggan')) {
          existing.senderName = conv.senderName;
        }
        if (conv.phone && !existing.phone) {
          existing.phone = conv.phone;
          existing.formattedPhone = conv.formattedPhone;
        }
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

    // 5. Convert map to array and sort by most recent message descending (strictly keep conversations with real messages!)
    const conversations = Array.from(uniqueMap.values())
      .filter((conv) => {
        if (!conv || !Array.isArray(conv.messages) || conv.messages.length === 0) return false;
        const hasRealMessage = conv.messages.some(
          (m) => m && m.id && !m.id.startsWith('sync_init_') && !m.id.startsWith('contact_init_')
        );
        return hasRealMessage;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // 6. Final hygiene pass
    for (const conv of conversations) {
      if (!conv.senderName || phoneService.isLid(conv.senderName) || /^\+?\d+$/.test(conv.senderName.trim())) {
        const stored = phoneService.getName(conv.jid) || (conv.phone ? phoneService.getName(conv.phone) : null);
        conv.senderName = stored || (conv.phone ? phoneService.formatPhone(conv.phone) : 'Pelanggan');
      }
      if (phoneService.isLid(conv.phone)) {
        conv.phone = null;
        conv.formattedPhone = phoneService.formatPhone(null, conv.jid);
      }
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
                      (cleanPhone && m.jid && m.jid.replace(/\D/g, '') === cleanPhone);
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
    const cleanDigits = cleanKey.replace(/\D/g, '');
    const isReal = phoneService.isRealPhone(cleanDigits);
    const messages = this.getAllMessages();

    return messages.filter(m => {
      if (!m) return false;
      const mJid = String(m.jid || '').toLowerCase();
      if (mJid === cleanKey) return true;
      if (isReal && m.phone && String(m.phone).replace(/\D/g, '') === cleanDigits) {
        return true;
      }
      return false;
    });
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

    // Also purge any reverse mappings in phoneService (e.g. LID that mapped to this phone)
    const targetPhones = [cleanDigits, mappedPhone].filter(Boolean);
    if (phoneService && phoneService.mapping) {
      for (const [k, v] of Object.entries(phoneService.mapping)) {
        if (k === 'names' || k === 'contactNames') continue;
        if (targetPhones.includes(v) || targetPhones.includes(String(v).replace(/\D/g, ''))) {
          const kLow = String(k).toLowerCase();
          keysToPurge.add(kLow);
          keysToPurge.add(kLow.split('@')[0]);
          const d = kLow.replace(/\D/g, '');
          if (d) {
            keysToPurge.add(d);
            keysToPurge.add(`${d}@lid`);
            keysToPurge.add(`${d}@s.whatsapp.net`);
          }
        }
      }
    }

    // 0. Mark as permanently deleted so it never resurrects
    for (const k of keysToPurge) {
      if (k) this.deletedChats.add(k);
    }
    this.saveDeletedChats();

    // 1. Remove contact completely from phoneService
    phoneService.removeContact(targetJid);
    if (mappedPhone) phoneService.removeContact(mappedPhone);

    // 2. Delete from this.syncedChats
    for (const k of Array.from(this.syncedChats.keys())) {
      const kLow = String(k).toLowerCase();
      const kDigits = kLow.replace(/\D/g, '');
      const kShort = kLow.split('@')[0];
      if (keysToPurge.has(kLow) || keysToPurge.has(kDigits) || keysToPurge.has(kShort)) {
        this.syncedChats.delete(k);
      }
    }
    this.saveSyncedChats();

    // 3. Filter out from chats.json
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

    // 4. Delete from Prisma / Postgres
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
    // 0. Mark all current conversations as permanently deleted
    const messages = this.getAllMessages();
    for (const m of messages) {
      if (m.jid) this.deletedChats.add(String(m.jid).toLowerCase());
      if (m.phone) this.deletedChats.add(String(m.phone).replace(/\D/g, ''));
    }
    for (const k of this.syncedChats.keys()) {
      this.deletedChats.add(String(k).toLowerCase());
    }
    const contactNames = phoneService.mapping?.contactNames || {};
    for (const k of Object.keys(contactNames)) {
      this.deletedChats.add(String(k).toLowerCase());
    }
    this.saveDeletedChats();

    // 1. Purge messages and synced chats
    this.saveMessages([]);
    this.syncedChats.clear();
    this.saveSyncedChats();

    // 2. Clear contacts in phoneService
    if (phoneService.mapping) {
      phoneService.mapping.contactNames = {};
      phoneService.mapping.names = {};
      phoneService.saveMapping();
    }

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
