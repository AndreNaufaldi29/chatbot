const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, '../../data/phone_mapping.json');

const INITIAL_MAPPING = {
  names: {},
  contactNames: {}
};

const SYSTEM_NAMES = [
  'admin', 'harbor bot', 'harbor ai', 'bot', 'gemini', 'cs', 'operator',
  'pelanggan', 'saya', 'rumah indah carpet bot', 'rumah indah carpet ai', 'rumah indah carpet',
  'groq', 'ai', 'assistant'
];

class PhoneService {
  constructor() {
    this.mapping = {};
    this.isDirty = false;
    this.saveTimeout = null;
    this.loadMapping();

    process.on('beforeExit', () => {
      if (this.isDirty) {
        this.saveMapping(true);
      }
    });
  }

  isLid(value) {
    if (!value) return false;
    const str = String(value).trim();
    if (str.endsWith('@lid') || str.includes('@lid')) return true;
    const num = str.replace(/\D/g, '');
    // Nomor HP Indonesia ASLI SELALU diawali dengan 628 atau 08, panjang 10 sampai 14 digit
    if (num.startsWith('628') && num.length >= 10 && num.length <= 14) return false;
    if (num.startsWith('08') && num.length >= 10 && num.length <= 14) return false;

    // Setiap digit dengan panjang 13 atau lebih yang BUKAN 628/08 adalah LID internal WhatsApp!
    if (num.length >= 13) return true;

    return false;
  }

  isRealPhone(value) {
    if (!value) return false;
    if (this.isLid(value)) return false;
    let clean = String(value).replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);

    // Nomor HP Indonesia (628...) panjang 10 sampai 14 digit
    if (clean.startsWith('628')) {
      return clean.length >= 10 && clean.length <= 14;
    }

    // Nomor telepon internasional standar: panjang 9 sampai 12 digit
    return clean.length >= 9 && clean.length <= 12;
  }

  cleanPhoneNumber(phone) {
    if (!phone) return '';
    let clean = String(phone).replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  }

  extractPhoneFromJid(jid, senderName = null) {
    if (!jid) return '';
    const mapped = this.getPhone(jid, senderName);
    if (mapped) return mapped;
    const raw = String(jid).split('@')[0];
    const cleaned = this.cleanPhoneNumber(raw);
    if (this.isRealPhone(cleaned)) return cleaned;
    return raw;
  }

  loadMapping() {
    try {
      const dir = path.dirname(MAPPING_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(MAPPING_FILE)) {
        const raw = fs.readFileSync(MAPPING_FILE, 'utf8');
        this.mapping = JSON.parse(raw || '{}');
      } else {
        this.mapping = { ...INITIAL_MAPPING };
        this.saveMapping(true);
      }

      if (!this.mapping.names) this.mapping.names = {};
      if (!this.mapping.contactNames) this.mapping.contactNames = {};

      let cleaned = false;
      // 🛡️ Data Sanitization: Clean any corrupted mappings where value was a LID
      for (const [k, v] of Object.entries(this.mapping)) {
        if (k === 'names' || k === 'contactNames') continue;
        if (this.isLid(v) || (typeof v === 'string' && v.replace(/\D/g, '').length >= 14)) {
          delete this.mapping[k];
          cleaned = true;
        }
      }

      // Clean corrupted names
      for (const [k, v] of Object.entries(this.mapping.names)) {
        if (this.isLid(v) || /^\d+$/.test(k) || SYSTEM_NAMES.some(s => k.includes(s))) {
          delete this.mapping.names[k];
          cleaned = true;
        }
      }

      // Clean corrupted contactNames
      for (const [k, v] of Object.entries(this.mapping.contactNames)) {
        if (this.isLid(v) || /^\+?\d+$/.test(v) || SYSTEM_NAMES.some(s => v.toLowerCase().includes(s))) {
          delete this.mapping.contactNames[k];
          cleaned = true;
        }
      }

      if (cleaned) {
        this.scheduleSave();
      }
    } catch (err) {
      console.error('[PhoneService] Error loading mapping:', err.message);
      this.mapping = { ...INITIAL_MAPPING };
    }
  }

  scheduleSave(delay = 500) {
    this.isDirty = true;
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveMapping();
    }, delay);
  }

  saveMapping(forceSync = false) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.isDirty = false;

    const dir = path.dirname(MAPPING_FILE);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    }

    const content = JSON.stringify(this.mapping, null, 2);
    const tmpFile = `${MAPPING_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        fs.writeFileSync(tmpFile, content, 'utf8');
        fs.renameSync(tmpFile, MAPPING_FILE);
        return true;
      } catch (err) {
        attempts++;
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}

        if (attempts >= maxAttempts) {
          try {
            fs.writeFileSync(MAPPING_FILE, content, 'utf8');
            return true;
          } catch (finalErr) {
            console.error('[PhoneService] Error saving mapping:', finalErr.message);
            this.scheduleSave(2000);
            return false;
          }
        }

        // Delay to allow Windows file locks to clear
        const start = Date.now();
        while (Date.now() - start < 40 * attempts) {}
      }
    }
  }

  normalizeName(name) {
    if (!name || typeof name !== 'string') return '';
    let n = name.trim().toLowerCase();
    // Strip common Indonesian honorifics
    n = n.replace(/^(?:kak|pak|bu|mbak|mas|bang|om|tante|bapak|ibu|juragan|tuan|nyonya)\s+/i, '');
    // Strip emojis & special symbols
    n = n.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    return n;
  }

  extractPhoneFromText(text) {
    if (!text || typeof text !== 'string') return null;
    // Match Indonesian numbers starting with +628, 628, or 08 with 9-13 digits
    const matches = text.match(/(?:^|[^\d+])(?:\+?62|0)(8\d{8,11})(?:[^\d]|$)/g);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const digits = m.replace(/\D/g, '');
        let clean = digits;
        if (clean.startsWith('0')) clean = '62' + clean.slice(1);
        if (clean.startsWith('8')) clean = '62' + clean;
        if (this.isRealPhone(clean)) {
          return clean;
        }
      }
    }
    return null;
  }

  setName(key, name) {
    if (!key || !name || typeof name !== 'string') return;
    const cleanName = name.trim();
    // Reject empty, purely numeric (LIDs/phone numbers), or system names
    if (!cleanName || /^\+?\d+$/.test(cleanName) || cleanName.length < 2) return;
    const lower = cleanName.toLowerCase();
    if (SYSTEM_NAMES.some(s => lower.includes(s))) return;

    if (!this.mapping.contactNames) this.mapping.contactNames = {};

    const rawKey = String(key).trim();
    const shortKey = rawKey.split('@')[0];

    let changed = false;
    if (this.mapping.contactNames[rawKey] !== cleanName) {
      this.mapping.contactNames[rawKey] = cleanName;
      changed = true;
    }
    if (this.mapping.contactNames[shortKey] !== cleanName) {
      this.mapping.contactNames[shortKey] = cleanName;
      changed = true;
    }

    const base = this.normalizeName(cleanName);

    // If key is mapped to a real phone, link name to real phone as well
    const mappedPhone = this.mapping[rawKey] || this.mapping[shortKey];
    if (mappedPhone && this.isRealPhone(mappedPhone)) {
      if (this.mapping.contactNames[mappedPhone] !== cleanName) {
        this.mapping.contactNames[mappedPhone] = cleanName;
        changed = true;
      }
      if (this.mapping.contactNames[`${mappedPhone}@s.whatsapp.net`] !== cleanName) {
        this.mapping.contactNames[`${mappedPhone}@s.whatsapp.net`] = cleanName;
        changed = true;
      }
      if (!this.mapping.names) this.mapping.names = {};
      if (this.mapping.names[lower] !== mappedPhone) {
        this.mapping.names[lower] = mappedPhone;
        changed = true;
      }
      if (base && this.mapping.names[base] !== mappedPhone) {
        this.mapping.names[base] = mappedPhone;
        changed = true;
      }
    }

    if (changed) {
      this.scheduleSave();
    }
    return cleanName;
  }

  getName(key) {
    if (!key) return null;
    const rawKey = String(key).trim();
    const shortKey = rawKey.split('@')[0];

    if (!this.mapping.contactNames) return null;

    let candidate = this.mapping.contactNames[rawKey] || this.mapping.contactNames[shortKey];
    if (candidate && !this.isLid(candidate) && !/^\+?\d+$/.test(candidate)) {
      return candidate;
    }

    // Check mapped phone's name
    const mappedPhone = this.mapping[rawKey] || this.mapping[shortKey];
    if (mappedPhone && this.mapping.contactNames[mappedPhone]) {
      candidate = this.mapping.contactNames[mappedPhone];
      if (candidate && !this.isLid(candidate) && !/^\+?\d+$/.test(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  setMapping(key, phone, senderName = null) {
    if (!key || !phone) return;

    // Strict validation: Reject if 'phone' is a LID!
    if (this.isLid(phone)) return;

    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    if (!this.isRealPhone(cleanPhone)) return;

    const rawKey = String(key).trim();
    const shortKey = rawKey.split('@')[0];

    let changed = false;
    if (this.mapping[rawKey] !== cleanPhone) {
      this.mapping[rawKey] = cleanPhone;
      changed = true;
    }
    if (this.mapping[shortKey] !== cleanPhone) {
      this.mapping[shortKey] = cleanPhone;
      changed = true;
    }

    if (senderName && typeof senderName === 'string') {
      const cleanName = senderName.trim();
      const lowerName = cleanName.toLowerCase();
      if (!SYSTEM_NAMES.some(s => lowerName.includes(s)) && !/^\d+$/.test(lowerName) && lowerName.length >= 2) {
        if (!this.mapping.names) this.mapping.names = {};
        if (this.mapping.names[lowerName] !== cleanPhone) {
          this.mapping.names[lowerName] = cleanPhone;
          changed = true;
        }
        const base = this.normalizeName(cleanName);
        if (base && this.mapping.names[base] !== cleanPhone) {
          this.mapping.names[base] = cleanPhone;
          changed = true;
        }

        if (!this.mapping.contactNames) this.mapping.contactNames = {};
        const contactKeys = [rawKey, shortKey, cleanPhone, `${cleanPhone}@s.whatsapp.net`];
        for (const ck of contactKeys) {
          if (this.mapping.contactNames[ck] !== cleanName) {
            this.mapping.contactNames[ck] = cleanName;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      this.scheduleSave();
    }
    return cleanPhone;
  }

  getPhone(key, senderName = null) {
    if (!key && !senderName) return null;
    const rawKey = key ? String(key).trim() : '';

    // If it's already a standard phone JID (@s.whatsapp.net)
    if (rawKey.endsWith('@s.whatsapp.net')) {
      const clean = rawKey.split('@')[0].replace(/\D/g, '');
      if (this.isRealPhone(clean)) {
        return clean;
      }
    }

    // 1. Check direct key in mapping
    if (rawKey) {
      const mapped = this.mapping[rawKey] || this.mapping[rawKey.split('@')[0]];
      if (mapped && this.isRealPhone(mapped)) {
        return mapped;
      }
    }

    // 2. Direct fallback if key itself is purely digits and a valid real phone (not a LID)
    if (rawKey && !this.isLid(rawKey)) {
      const shortKey = rawKey.split('@')[0].replace(/\D/g, '');
      if (this.isRealPhone(shortKey)) {
        return shortKey;
      }
    }

    // 3. Fallback by exact senderName match (pure read-only lookup, never mutates mapping)
    if (senderName && typeof senderName === 'string') {
      const clean = senderName.trim().toLowerCase();
      if (clean && !SYSTEM_NAMES.some(s => clean.includes(s)) && !/^\+?\d+$/.test(clean)) {
        if (this.mapping.names && this.mapping.names[clean] && this.isRealPhone(this.mapping.names[clean])) {
          return this.mapping.names[clean];
        }
      }
    }

    return null;
  }

  formatPhone(phone, jid = null) {
    let targetPhone = phone;

    // If phone is missing or LID, try resolving via jid mapping
    if (!targetPhone || this.isLid(targetPhone)) {
      if (jid) {
        const mapped = this.getPhone(jid);
        if (mapped && this.isRealPhone(mapped)) {
          targetPhone = mapped;
        }
      }
    }

    if (!targetPhone || this.isLid(targetPhone)) {
      return '-';
    }

    const clean = String(targetPhone).replace(/\D/g, '');
    if (this.isLid(clean)) {
      return '-';
    }

    // Format Indonesian mobile numbers (628...)
    if (clean.startsWith('628')) {
      const prefix = '+62';
      const part1 = clean.slice(2, 5); // 812
      const part2 = clean.slice(5, 9); // 1652
      const part3 = clean.slice(9);    // 6150
      return `${prefix} ${part1}-${part2}-${part3}`;
    }

    // Format other +62 numbers
    if (clean.startsWith('62')) {
      return `+${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
    }

    // Generic formatting with + for valid phone numbers
    if (clean.length >= 8 && clean.length <= 13) {
      return `+${clean}`;
    }

    return '-';
  }

  removeContact(key) {
    if (!key) return;
    const rawKey = String(key).trim();
    const shortKey = rawKey.split('@')[0];
    const cleanDigits = rawKey.replace(/\D/g, '');
    const mappedPhone = this.mapping[rawKey] || this.mapping[shortKey];

    const targetPhones = [cleanDigits, mappedPhone].filter(Boolean);

    const keysToRemove = new Set([
      rawKey,
      shortKey,
      cleanDigits,
      `${cleanDigits}@s.whatsapp.net`,
      `${cleanDigits}@lid`
    ]);

    if (mappedPhone) {
      const p = String(mappedPhone).replace(/\D/g, '');
      keysToRemove.add(p);
      keysToRemove.add(`${p}@s.whatsapp.net`);
      keysToRemove.add(`${p}@lid`);
    }

    // Also purge any reverse mappings (e.g. LID that mapped to this phone)
    for (const [k, v] of Object.entries(this.mapping)) {
      if (k === 'names' || k === 'contactNames') continue;
      if (targetPhones.includes(v) || targetPhones.includes(String(v).replace(/\D/g, ''))) {
        keysToRemove.add(k);
        keysToRemove.add(k.split('@')[0]);
      }
    }

    let changed = false;
    for (const k of keysToRemove) {
      if (!k) continue;
      if (this.mapping[k]) {
        delete this.mapping[k];
        changed = true;
      }
      if (this.mapping.contactNames && this.mapping.contactNames[k]) {
        const name = this.mapping.contactNames[k];
        delete this.mapping.contactNames[k];
        changed = true;
        if (name && typeof name === 'string' && this.mapping.names) {
          const lower = name.trim().toLowerCase();
          const base = this.normalizeName(name);
          delete this.mapping.names[lower];
          if (base) delete this.mapping.names[base];
        }
      }
    }

    if (changed) {
      this.scheduleSave();
    }
  }
}

module.exports = new PhoneService();
