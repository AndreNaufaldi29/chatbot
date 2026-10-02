const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, '../../data/phone_mapping.json');

const INITIAL_MAPPING = {
  // Kharisma Alung P's verified real phone number from WhatsApp stanza attributes
  "21453546229779": "6281216526150",
  "21453546229779@lid": "6281216526150",
  "names": {
    "kharisma alung p": "6281216526150"
  },
  "contactNames": {
    "21453546229779": "Kharisma Alung P",
    "21453546229779@lid": "Kharisma Alung P",
    "6281216526150": "Kharisma Alung P"
  }
};

const SYSTEM_NAMES = ['admin', 'harbor bot', 'harbor ai', 'bot', 'gemini', 'cs', 'operator', 'pelanggan', 'saya', 'sultan carpet bot'];

class PhoneService {
  constructor() {
    this.mapping = {};
    this.loadMapping();
  }

  isLid(value) {
    if (!value) return false;
    const str = String(value).trim();
    if (str.endsWith('@lid') || str.includes('@lid')) return true;
    const num = str.replace(/\D/g, '');
    // Indonesian mobile numbers are 628... with length 10 to 13 digits
    if (num.startsWith('628') && num.length >= 10 && num.length <= 13) return false;
    // Standard national 08... numbers
    if (num.startsWith('08') && num.length >= 10 && num.length <= 13) return false;
    // Any sequence of 14 or more digits is an internal WhatsApp LID
    if (num.length >= 14) return true;
    return false;
  }

  isRealPhone(value) {
    if (!value) return false;
    if (this.isLid(value)) return false;
    let clean = String(value).replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    // Real phone numbers are 9 to 13 digits (Indonesian 10-13, global 9-13)
    return clean.length >= 9 && clean.length <= 13;
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
        this.saveMapping();
      }

      if (!this.mapping.names) this.mapping.names = {};
      if (!this.mapping.contactNames) this.mapping.contactNames = {};

      // 🛡️ Data Sanitization: Clean any corrupted mappings where value was a LID
      for (const [k, v] of Object.entries(this.mapping)) {
        if (k === 'names' || k === 'contactNames') continue;
        if (this.isLid(v) || (typeof v === 'string' && v.replace(/\D/g, '').length >= 14)) {
          delete this.mapping[k];
        }
      }

      // Clean corrupted names
      for (const [k, v] of Object.entries(this.mapping.names)) {
        if (this.isLid(v) || /^\d+$/.test(k) || SYSTEM_NAMES.some(s => k.includes(s))) {
          delete this.mapping.names[k];
        }
      }

      // Clean corrupted contactNames
      for (const [k, v] of Object.entries(this.mapping.contactNames)) {
        if (this.isLid(v) || /^\+?\d+$/.test(v) || SYSTEM_NAMES.some(s => v.toLowerCase().includes(s))) {
          delete this.mapping.contactNames[k];
        }
      }

      // Seed verified initial contacts
      this.mapping["21453546229779"] = "6281216526150";
      this.mapping["21453546229779@lid"] = "6281216526150";
      this.mapping.names["kharisma alung p"] = "6281216526150";
      this.mapping.contactNames["21453546229779"] = "Kharisma Alung P";
      this.mapping.contactNames["21453546229779@lid"] = "Kharisma Alung P";
      this.mapping.contactNames["6281216526150"] = "Kharisma Alung P";

      this.saveMapping();
    } catch (err) {
      console.error('[PhoneService] Error loading mapping:', err.message);
      this.mapping = { ...INITIAL_MAPPING };
    }
  }

  saveMapping() {
    try {
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(this.mapping, null, 2), 'utf8');
    } catch (err) {
      console.error('[PhoneService] Error saving mapping:', err.message);
    }
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

    this.mapping.contactNames[rawKey] = cleanName;
    this.mapping.contactNames[shortKey] = cleanName;

    // If key is mapped to a real phone, link name to real phone as well
    const mappedPhone = this.mapping[rawKey] || this.mapping[shortKey];
    if (mappedPhone && this.isRealPhone(mappedPhone)) {
      this.mapping.contactNames[mappedPhone] = cleanName;
      this.mapping.contactNames[`${mappedPhone}@s.whatsapp.net`] = cleanName;
      if (!this.mapping.names) this.mapping.names = {};
      this.mapping.names[lower] = mappedPhone;
    }

    this.saveMapping();
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

    this.mapping[rawKey] = cleanPhone;
    this.mapping[shortKey] = cleanPhone;

    if (senderName && typeof senderName === 'string') {
      this.setName(rawKey, senderName);
      this.setName(cleanPhone, senderName);
      const lowerName = senderName.trim().toLowerCase();
      if (!SYSTEM_NAMES.some(s => lowerName.includes(s)) && !/^\d+$/.test(lowerName) && lowerName.length > 2) {
        if (!this.mapping.names) this.mapping.names = {};
        this.mapping.names[lowerName] = cleanPhone;
      }
    }

    this.saveMapping();
    return cleanPhone;
  }

  getPhone(key, senderName = null) {
    if (!key) return null;
    const rawKey = String(key).trim();

    // If it's already a standard phone JID (@s.whatsapp.net)
    if (rawKey.endsWith('@s.whatsapp.net')) {
      const clean = rawKey.split('@')[0].replace(/\D/g, '');
      if (this.isRealPhone(clean)) {
        return clean;
      }
    }

    // Check direct key in mapping
    const mapped = this.mapping[rawKey] || this.mapping[rawKey.split('@')[0]];
    if (mapped && this.isRealPhone(mapped)) {
      return mapped;
    }

    // Check by sender name (ONLY exact match on verified real phone)
    if (senderName && typeof senderName === 'string' && this.mapping.names) {
      const nameKey = senderName.trim().toLowerCase();
      if (!SYSTEM_NAMES.some(s => nameKey.includes(s)) && !/^\d+$/.test(nameKey)) {
        if (this.mapping.names[nameKey] && this.isRealPhone(this.mapping.names[nameKey])) {
          return this.mapping.names[nameKey];
        }
      }
    }

    const shortKey = rawKey.split('@')[0].replace(/\D/g, '');
    if (this.isRealPhone(shortKey)) {
      return shortKey;
    }

    // If it's an unmapped LID, return null. NEVER return raw LID as phone number!
    return null;
  }

  formatPhone(phone, jid = null) {
    if (!phone) {
      if (jid && this.isLid(jid)) {
        return 'WhatsApp ID (LID)';
      }
      return '-';
    }

    const clean = String(phone).replace(/\D/g, '');
    if (this.isLid(clean) || this.isLid(phone)) {
      return 'WhatsApp ID (LID)';
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
}

module.exports = new PhoneService();
