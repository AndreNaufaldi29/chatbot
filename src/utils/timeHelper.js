/**
 * Time Helper Utility for WhatsApp Chatbot
 * Manages real-time Indonesian time awareness (WIB / Asia/Jakarta):
 * - Detects time category: Pagi, Siang, Sore, Malam
 * - Provides appropriate greeting: "Selamat pagi", "Selamat siang", "Selamat sore", "Selamat malam"
 * - Formats dates in Indonesian: "Senin, 13 Oktober 2026"
 * - Calculates store open/closed status based on real-time WIB
 * - Detects customer greetings in incoming text
 */

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

class TimeHelper {
  /**
   * Retrieves current time components in Asia/Jakarta (WIB) timezone
   */
  getWIBTime(date = new Date()) {
    try {
      const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const getVal = (type) => parts.find(p => p.type === type)?.value || '';

      const dayName = getVal('weekday') || DAYS_ID[date.getDay()];
      const day = parseInt(getVal('day') || date.getDate(), 10);
      const monthName = getVal('month') || MONTHS_ID[date.getMonth()];
      const year = parseInt(getVal('year') || date.getFullYear(), 10);
      const hour = parseInt(getVal('hour') || date.getHours(), 10);
      const minute = parseInt(getVal('minute') || date.getMinutes(), 10);
      const second = parseInt(getVal('second') || date.getSeconds(), 10);

      const hourPad = String(hour).padStart(2, '0');
      const minPad = String(minute).padStart(2, '0');
      const timeStr = `${hourPad}:${minPad} WIB`;
      const dateStr = `${dayName}, ${day} ${monthName} ${year}`;

      const timeCategory = this.getTimeCategory(hour, minute);

      return {
        dayName,
        day,
        monthName,
        year,
        hour,
        minute,
        second,
        timeStr,
        dateStr,
        timeCategory, // 'Pagi' | 'Siang' | 'Sore' | 'Malam'
        greetingWord: `Selamat ${timeCategory.toLowerCase()}`, // 'Selamat pagi' | 'Selamat siang' | dll
      };
    } catch (e) {
      // Fallback using UTC+7 offset
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const wib = new Date(utc + (3600000 * 7));
      const hour = wib.getHours();
      const minute = wib.getMinutes();
      const timeCategory = this.getTimeCategory(hour, minute);
      const dayName = DAYS_ID[wib.getDay()];
      const day = wib.getDate();
      const monthName = MONTHS_ID[wib.getMonth()];
      const year = wib.getFullYear();

      return {
        dayName,
        day,
        monthName,
        year,
        hour,
        minute,
        second: wib.getSeconds(),
        timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WIB`,
        dateStr: `${dayName}, ${day} ${monthName} ${year}`,
        timeCategory,
        greetingWord: `Selamat ${timeCategory.toLowerCase()}`
      };
    }
  }

  /**
   * Time Category:
   * - 04:00 - 10:59: Pagi
   * - 11:00 - 14:59: Siang
   * - 15:00 - 18:29: Sore
   * - 18:30 - 03:59: Malam
   */
  getTimeCategory(hour, minute = 0) {
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes >= 4 * 60 && totalMinutes < 11 * 60) {
      return 'Pagi';
    }
    if (totalMinutes >= 11 * 60 && totalMinutes < 15 * 60) {
      return 'Siang';
    }
    if (totalMinutes >= 15 * 60 && totalMinutes < 18 * 60 + 30) {
      return 'Sore';
    }
    return 'Malam';
  }

  /**
   * Returns a polite greeting for the customer:
   * e.g. "Selamat pagi Kak Budi" or "Selamat siang Kak"
   */
  getGreeting(senderName = '') {
    const { greetingWord } = this.getWIBTime();
    const cleanName = String(senderName || '').trim();
    if (cleanName && cleanName.toLowerCase() !== 'pelanggan' && cleanName.toLowerCase() !== 'kak') {
      return `${greetingWord} Kak ${cleanName}`;
    }
    return `${greetingWord} Kak`;
  }

  /**
   * Evaluates if store showroom is currently OPEN or CLOSED in WIB
   * Monday - Saturday: 08:30 - 20:00 WIB
   * Sunday: 09:00 - 18:00 WIB
   */
  getStoreStatus(date = new Date()) {
    const info = this.getWIBTime(date);
    const isSunday = info.dayName.toLowerCase() === 'minggu';
    const totalMin = info.hour * 60 + info.minute;

    let isOpen = false;
    let scheduleText = '';

    if (isSunday) {
      // 09:00 - 18:00
      isOpen = totalMin >= 9 * 60 && totalMin <= 18 * 60;
      scheduleText = 'Minggu: 09:00 - 18:00 WIB';
    } else {
      // 08:30 - 20:00
      isOpen = totalMin >= 8 * 60 + 30 && totalMin <= 20 * 60;
      scheduleText = 'Senin - Sabtu: 08:30 - 20:00 WIB';
    }

    return {
      ...info,
      isOpen,
      statusLabel: isOpen ? 'BUKA' : 'TUTUP',
      scheduleText,
      surveyStatus: 'Layanan survey & pasang masjid siap 24 jam (by appointment)'
    };
  }

  /**
   * Detects greeting pattern in customer message:
   * Detects: "pagi", "siang", "sore", "malam", "assalamualaikum", "halo", "hai"
   */
  detectGreeting(text) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase().trim();

    const greetings = [
      { type: 'pagi', regex: /\b(selamat\s+pagi|met\s+pagi|pagi(\s+(min|kak|gan|pak|bu|mas|mbak|mba|bro|sis|om|tante))?)\b/i },
      { type: 'siang', regex: /\b(selamat\s+siang|met\s+siang|siang(\s+(min|kak|gan|pak|bu|mas|mbak|mba|bro|sis|om|tante))?)\b/i },
      { type: 'sore', regex: /\b(selamat\s+sore|met\s+sore|sore(\s+(min|kak|gan|pak|bu|mas|mbak|mba|bro|sis|om|tante))?)\b/i },
      { type: 'malam', regex: /\b(selamat\s+malam|met\s+malam|malam(\s+(min|kak|gan|pak|bu|mas|mbak|mba|bro|sis|om|tante))?)\b/i },
      { type: 'islamic', regex: /\b(assalamu['\s]?alaikum|assalamualaikum|wa['\s]?alaikumsalam|samlikum)\b/i },
      { type: 'general', regex: /\b(halo|hai|hello|hey|hei|hola)\b/i }
    ];

    for (const g of greetings) {
      if (g.regex.test(lower)) {
        return g.type;
      }
    }
    return null;
  }

  /**
   * Formats a system prompt block explaining the current time to AI models
   */
  getAiTimeContext() {
    const status = this.getStoreStatus();
    return `=== WAKTU & STATUS OPERASIONAL SAAT INI (REAL-TIME WIB) ===
Hari & Tanggal: ${status.dateStr}
Waktu Saat Ini: ${status.timeStr}
Kategori Waktu: ${status.timeCategory} (Gunakan "${status.greetingWord}" jika menyapa)
Status Showroom Toko: ${status.statusLabel} (Jadwal Operasional Hari Ini: ${status.scheduleText})
Layanan Survey & Pasang: Siap 24 jam dengan appointment (pengukuran & survey gratis Jabodetabek)

PETUNJUK WAKTU & SAPAAN:
1. Selalu sadari waktu saat ini (${status.timeCategory}).
2. Jika pelanggan mengucapkan salam atau menyapa waktu ("pagi", "siang", "sore", "malam", "halo", dll), balas secara alami dengan sapaan yang sesuai waktu saat ini yaitu "${status.greetingWord}".
3. Jika pelanggan bertanya apakah toko/galeri buka sekarang atau jam berapa operasional, gunakan data waktu saat ini (${status.timeStr}, status: ${status.statusLabel}) untuk menjawab secara jujur dan akurat.
4. Jangan pernah mengucapkan sapaan waktu yang salah (misal: jangan mengucapkan selamat malam jika waktu saat ini adalah pagi).`;
  }
}

module.exports = new TimeHelper();
