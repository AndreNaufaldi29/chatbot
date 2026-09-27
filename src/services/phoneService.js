const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, '../../data/phone_mapping.json');

const INITIAL_MAPPING = {
  // Kharisma Alung P's verified real phone number from WhatsApp stanza attributes
  "21453546229779": "6281216526150",
  "21453546229779@lid": "6281216526150",
  "names": {
    "kharisma alung p": "6281216526150"
  }
};

const SYSTEM_NAMES = ['admin', 'harbor bot', 'harbor ai', 'bot', 'gemini', 'cs', 'operator', 'pelanggan'];

class PhoneService {
  constructor() {
    this.mapping = {};
    this.loadMapping();
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

      // Clean any system names from mapping.names
      if (this.mapping.names) {
        for (const k of Object.keys(this.mapping.names)) {
          if (SYSTEM_NAMES.some(s => k.includes(s))) {
            delete this.mapping.names[k];
          }
        }
      }

      // Ensure Kharisma's verified phone is accurate
      this.mapping["21453546229779"] = "6281216526150";
      this.mapping["21453546229779@lid"] = "6281216526150";
      if (!this.mapping.names) this.mapping.names = {};
      this.mapping.names["kharisma alung p"] = "6281216526150";

      // If 92011503861900 had Kharisma's number erroneously mapped to it, clean it
      if (this.mapping["92011503861900"] === "6282333893488" || this.mapping["92011503861900"] === "6281216526150") {
        delete this.mapping["92011503861900"];
        delete this.mapping["92011503861900@lid"];
      }

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

  setMapping(key, phone, senderName = null) {
    if (!key || !phone) return;
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    // Reject invalid or LID-like numbers as phone numbers
    if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) return;
    if (cleanPhone.startsWith('214535') && cleanPhone.length > 13) return; // LID
    if (cleanPhone.startsWith('920115') && cleanPhone.length > 13) return; // LID

    const rawKey = String(key).trim();
    const shortKey = rawKey.split('@')[0];

    this.mapping[rawKey] = cleanPhone;
    this.mapping[shortKey] = cleanPhone;

    if (senderName && typeof senderName === 'string') {
      const lowerName = senderName.trim().toLowerCase();
      const isSystem = SYSTEM_NAMES.some(s => lowerName.includes(s));
      if (!isSystem && lowerName.length > 2) {
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

    // If it's already a standard phone JID
    if (rawKey.endsWith('@s.whatsapp.net')) {
      const clean = rawKey.split('@')[0].replace(/\D/g, '');
      if (clean.startsWith('62') || (clean.length >= 10 && clean.length <= 13)) {
        return clean;
      }
    }

    // Check direct key in mapping
    if (this.mapping[rawKey]) {
      return this.mapping[rawKey];
    }

    // Check short key (before @)
    const shortKey = rawKey.split('@')[0];
    if (this.mapping[shortKey]) {
      return this.mapping[shortKey];
    }

    // Check by sender name (only for non-system names)
    if (senderName && this.mapping.names) {
      const nameKey = String(senderName).trim().toLowerCase();
      const isSystem = SYSTEM_NAMES.some(s => nameKey.includes(s));
      if (!isSystem) {
        if (this.mapping.names[nameKey]) {
          return this.mapping.names[nameKey];
        }
        for (const [n, p] of Object.entries(this.mapping.names)) {
          if (nameKey.includes(n) || n.includes(nameKey)) {
            return p;
          }
        }
      }
    }

    // If shortKey itself looks like a standard phone number (10-13 digits, starting with 62)
    const numOnly = shortKey.replace(/\D/g, '');
    if (numOnly.startsWith('62') && numOnly.length >= 10 && numOnly.length <= 13) {
      return numOnly;
    }

    // Fallback: return shortKey if not mapped
    return shortKey;
  }

  formatPhone(phone) {
    if (!phone) return '-';
    let clean = String(phone).replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }

    // If it's an LID (14+ digits not starting with 62, or known LID prefix)
    if ((clean.startsWith('214535') || clean.startsWith('920115') || clean.startsWith('905600')) && clean.length >= 14) {
      return `LID: ${clean}`;
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

    // Generic formatting with +
    if (clean.length >= 8 && clean.length <= 14) {
      return `+${clean}`;
    }

    return phone;
  }
}

module.exports = new PhoneService();
