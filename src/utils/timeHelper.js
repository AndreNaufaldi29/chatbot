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
   * - 00:00 - 04:59: Dini Hari
   * - 05:00 - 10:59: Pagi
   * - 11:00 - 14:59: Siang
   * - 15:00 - 18:29: Sore
   * - 18:30 - 23:59: Malam
   */
  getTimeCategory(hour, minute = 0) {
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes < 5 * 60) {
      return 'Dini Hari';
    }
    if (totalMinutes < 11 * 60) {
      return 'Pagi';
    }
    if (totalMinutes < 15 * 60) {
      return 'Siang';
    }
    if (totalMinutes < 18 * 60 + 30) {
      return 'Sore';
    }
    return 'Malam';
  }

  /**
   * Returns a polite greeting for the customer:
   * e.g. "Selamat pagi Kak Andre" or "Halo Kak Andre"
   */
  getGreeting(senderName = '') {
    const { greetingWord, timeCategory } = this.getWIBTime();
    let cleanName = String(senderName || '').trim();
    cleanName = cleanName.replace(/^(kak|pak|bu|mas|mbak)\s+/i, '').trim();

    const nameSuffix = (cleanName && cleanName.toLowerCase() !== 'pelanggan') ? ` Kak ${cleanName}` : ' Kak';

    if (timeCategory === 'Dini Hari') {
      return `Halo${nameSuffix}`;
    }
    return `${greetingWord}${nameSuffix}`;
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

    // Jam Pelayanan Admin CS: 08:00 - 21:00 WIB setiap hari
    const isCsActive = totalMin >= 8 * 60 && totalMin <= 21 * 60;
    const csScheduleText = 'Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB (Di luar jam ini dibantu AI 24 Jam)';

    return {
      ...info,
      isOpen,
      statusLabel: isOpen ? 'BUKA' : 'TUTUP',
      scheduleText,
      isCsActive,
      csStatusLabel: isCsActive ? 'AKTIF (ADMIN STANDBY)' : 'OFFLINE (DILAYANI AI 24 JAM)',
      csScheduleText,
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
1. Status Jam Operasional Toko (Showroom Fisik): ${status.statusLabel} (Jadwal: ${status.scheduleText})
2. Status Jam Pelayanan Admin CS (WhatsApp): ${status.csStatusLabel} (Jadwal Admin: ${status.csScheduleText})
Layanan Asisten AI Chatbot: Aktif 24 Jam Nonstop

PETUNJUK ETIKA & SAPAAN PROFESIONAL CS:
1. DILARANG KERAS MENGULANG-ULANG SAPAAN WAKTU ("Selamat malam", "Selamat pagi", dll.) DI SETIAP PESAN!
2. Jika obrolan sedang berlangsung, LANGSUNG jawab pertanyaan pelanggan dengan ramah, santun, dan to-the-point tanpa diawali sapaan waktu.
3. Selalu panggil pelanggan dengan sebutan hormat "Kak [Nama]" (contoh: "Kak Andre"), bukan namanya saja.
4. PEMISAHAN INFORMASI JAM:
   - Jika pelanggan bertanya jam buka toko/showroom/kunjungan langsung, sebutkan: "Jam Operasional Toko: ${status.scheduleText}".
   - Jika pelanggan bertanya jam respon admin atau ingin bicara dengan staf manusia, sebutkan: "Jam Pelayanan Admin CS: ${status.csScheduleText}" dan tekankan bahwa asisten AI siap melayani 24 jam nonstop untuk informasi & pencatatan pesanan.
5. Jangan pernah menyapa "Selamat malam" jika waktu berada pada jam subuh/dini hari (00:00 - 04:59 WIB).`;
  }
}

module.exports = new TimeHelper();
