const fs = require('fs');
const path = require('path');
const phoneService = require('./phoneService');
const protectionService = require('./protectionService');

const CHATS_FILE = path.join(__dirname, '../../data/chats.json');
const SYNCED_CHATS_FILE = path.join(__dirname, '../../data/synced_chats.json');

const INITIAL_SEED_CHATS = [];

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
      fs.writeFileSync(CHATS_FILE, JSON.stringify([], null, 2), 'utf8');
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
      if (!Array.isArray(messages)) return [];
      // Sanitize: filter out corrupt [text] or empty messages
      return messages.filter(m => m && m.text && typeof m.text === 'string' && m.text.trim() && m.text.trim() !== '[text]');
    } catch (err) {
      console.error('[ChatService] Gagal membaca chats.json:', err.message);
      return [];
    }
  }

  saveMessages(messages) {
    try {
      this.ensureFileExists();
      const valid = (Array.isArray(messages) ? messages : []).filter(
        m => m && m.text && typeof m.text === 'string' && m.text.trim() && m.text.trim() !== '[text]'
      );
      // Keep at most 1000 messages to prevent unbounded growth
      const trimmed = valid.slice(-1000);
      fs.writeFileSync(CHATS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[ChatService] Gagal menyimpan chats.json:', err.message);
      return false;
    }
  }

  addMessage(msg) {
    if (!msg || !msg.text || typeof msg.text !== 'string' || !msg.text.trim() || msg.text.trim() === '[text]') return null;
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
      const extracted = phoneService.extractPhoneFromText(msg.text);
      if (extracted && phoneService.isRealPhone(extracted)) {
        realPhone = extracted;
      }
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
      text: messageText,
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
      if (!msg || !msg.text || typeof msg.text !== 'string' || !msg.text.trim() || msg.text.trim() === '[text]') continue;
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
      if (!realPhone) {
        const extracted = phoneService.extractPhoneFromText(msg.text);
        if (extracted && phoneService.isRealPhone(extracted)) {
          realPhone = extracted;
        }
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
      if (!msg || !msg.text || !msg.text.trim() || msg.text.trim() === '[text]') continue;

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

    // 2. Enrich EXISTING conversations with syncedChats metadata only (NO ghost contacts without messages!)
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
        // Enrich existing conversation only!
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
      // Note: Never add ghost contacts with 0 messages!
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

    // 4. Deduplicate by canonical key (conv.jid or conv.phone) and exclude empty conversations
    const uniqueMap = new Map();
    for (const conv of convMap.values()) {
      // Exclude conversations that have no messages or only empty messages
      if (!conv.messages || conv.messages.length === 0) continue;

      const canonicalKey = conv.phone ? `${conv.phone}@s.whatsapp.net` : (conv.jid || conv.phone);
      if (!canonicalKey) continue;

      if (!uniqueMap.has(canonicalKey)) {
        uniqueMap.set(canonicalKey, conv);
      } else {
        const existing = uniqueMap.get(canonicalKey);
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

    // 5. Convert map to array and sort by most recent message descending
    const conversations = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

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
