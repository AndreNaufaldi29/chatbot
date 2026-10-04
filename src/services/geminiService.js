const fs = require('fs');
const path = require('path');
const menuHandler = require('../handlers/menuHandler');
const { stripStarsAndEmojis } = require('../utils/textCleaner');
require('dotenv').config();

const DEFAULT_FAST_MODEL = 'gemini-3.5-flash-lite';
const ENV_FILE = path.join(__dirname, '../../.env');

class GeminiService {
  constructor() {
    this.conversationHistories = new Map(); // jid -> array of { role: 'user' | 'model', text: string }
    this.maxHistoryTurns = 6;
    this.activeModel = DEFAULT_FAST_MODEL;
    // Auto-warmup connection on initialization so AI answers immediately on user message
    setTimeout(() => this.autoWarmup(), 1500);
  }

  getApiKey() {
    const config = menuHandler.getConfig();
    return process.env.GEMINI_API_KEY || config.ai?.gemini_api_key || '';
  }

  getModel() {
    const config = menuHandler.getConfig();
    let model = config.ai?.model;
    if (!model || model === 'gemini-flash-latest' || model.includes('gemini-2.0') || model.includes('gemini-1.5') || model.includes('gemini-2.5')) {
      model = DEFAULT_FAST_MODEL;
    }
    return model;
  }

  isAiEnabled() {
    const config = menuHandler.getConfig();
    return config.ai?.enabled !== false && Boolean(this.getApiKey());
  }

  syncApiKey(key, model = DEFAULT_FAST_MODEL) {
    if (!key) return;
    process.env.GEMINI_API_KEY = key;
    this.activeModel = model || DEFAULT_FAST_MODEL;

    // Update config.json
    try {
      const config = menuHandler.getConfig();
      if (!config.ai) config.ai = {};
      config.ai.gemini_api_key = key;
      config.ai.model = this.activeModel;
      config.ai.enabled = true;
      menuHandler.saveConfig(config);
    } catch (err) {
      console.warn('[GeminiService] Gagal memperbarui config.json:', err.message);
    }

    // Update .env file
    try {
      let envContent = '';
      if (fs.existsSync(ENV_FILE)) {
        envContent = fs.readFileSync(ENV_FILE, 'utf8');
      }
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${key}`);
      } else {
        envContent = `GEMINI_API_KEY=${key}\n` + envContent;
      }
      fs.writeFileSync(ENV_FILE, envContent, 'utf8');
    } catch (err) {
      console.warn('[GeminiService] Gagal memperbarui .env:', err.message);
    }

    this.autoWarmup();
  }

  async autoWarmup() {
    const apiKey = this.getApiKey();
    if (!apiKey) return;

    const fastModels = [
      this.activeModel || DEFAULT_FAST_MODEL,
      DEFAULT_FAST_MODEL,
      'gemini-3.1-flash-lite'
    ];

    for (const m of fastModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Halo' }] }]
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (res.ok) {
          const d = await res.json();
          if (d.candidates?.[0]?.content?.parts?.[0]?.text) {
            this.activeModel = m;
            console.log(`[GeminiService] AI Gemini siap & hangat pada model: ${m}`);
            return;
          }
        }
      } catch (err) {}
    }
  }

  buildSystemInstruction() {
    const config = menuHandler.getConfig();
    const b = config.business || {};
    const o = config.owner_info || {};
    const s = config.schedule_info || {};
    const w = config.warranty_info || {};
    const p = config.promo_info || {};
    const c = config.complaint_info || {};
    const catalog = config.catalog || [];
    const branches = config.branches || [];
    const faqs = config.faqs || [];

    let catalogSummary = catalog.map((item, idx) => 
      `${idx + 1}. [${item.code || item.id}] ${item.title} - Harga: ${item.price} | Varian: ${item.footer} | Spesifikasi: ${item.subtitle}`
    ).join('\n');

    let branchSummary = branches.map((br, idx) => 
      `${idx + 1}. ${br.name} (${br.city} - ${br.area})\n   Alamat: ${br.address}\n   Jam Buka: ${br.hours}\n   Telepon: ${br.phone}\n   Maps: ${br.maps_url}`
    ).join('\n\n');

    let promoSummary = (p.active_promos || []).map((pr, idx) =>
      `${idx + 1}. [${pr.badge || 'PROMO'}] ${pr.title}: ${pr.discount} (${pr.desc}) - Periode: ${pr.valid_until}`
    ).join('\n');

    let faqSummary = faqs.map(f => `Tanya: ${f.q}\nJawab: ${f.a}`).join('\n');

    const customPrompt = config.ai?.system_instructions || '';

    return `${customPrompt}

=== INFORMASI RESMI TOKO & PEMILIK ===
Nama Toko: ${b.name} (${b.tagline})
Pemilik / Founder: ${o.owner_name || b.owner || 'H. Ahmad Fauzi & Hj. Maryam'}
Jabatan: ${o.role || 'Founder & Managing Director'}
Tahun Berdiri: Sejak ${b.established || '2012'} (${o.experience || '12+ Tahun Melayani Seluruh Indonesia'})
Alamat Utama: ${b.address}
Telepon/WA: ${b.phone}
Email: ${b.email}
Website: ${b.website}

=== JADWAL DAN JAM KERJA OPERASIONAL ===
Jam Operasional Showroom: ${s.store_hours || b.hours}
Jadwal Survey Gratis & Ukur Lokasi: ${s.survey_hours || 'Setiap Hari: 08:00 - 21:00 WIB (Gratis Jabodetabek)'}
Jadwal Pasang & Obras: ${s.installation_hours || 'Tersedia teknisi 24 jam (bisa malam hari setelah Isya agar tidak mengganggu ibadah/kerja)'}

=== KETENTUAN GARANSI RESMI SULTAN CARPET ===
${w.summary || 'Garansi 100% benang asli impor Turki & Persia, garansi obras & pasang 1 tahun, serta garansi tukar baru 14 hari bila ada cacat pabrik.'}
Alur Klaim: ${w.claim_steps || 'Kirimkan foto/video kendala, tim kami proses dalam 1x24 jam.'}

=== PROMO & DISKON SPESIAL AKTIF ===
${promoSummary || 'Promo Berkah Masjid diskon 25% + free obras, promo karpet rumah cashback Rp 200rb, promo karpet kantor free pasang.'}

=== PUSAT KOMPLAIN & PENGADUAN KONSUMEN ===
Waktu Respon (SLA): ${c.sla || 'Maksimal 1x24 Jam Kerja'}
Hotline Manajer CS: ${c.contact_manager || b.phone_cs || b.phone}
Kebijakan: Setiap keluhan pelanggan akan segera diterbitkan tiket penanganan resmi dan ditindaklanjuti hingga tuntas.

=== KATALOG PRODUK KOLEKSI KARPET ===
${catalogSummary}

=== DAFTAR CABANG & SHOWROOM FISIK ===
${branchSummary}

=== PERTANYAAN UMUM (FAQ) ===
${faqSummary}

=== ATURAN MUTLAK FORMAT DAN GAYA BAHASA ===
1. Berinteraksilah secara luwes, santun, ramah, dan solutif dalam Bahasa Indonesia.
2. DILARANG KERAS menggunakan tanda bintang (*) untuk menebalkan teks maupun untuk simbol apapun. Tulis teks polos tanpa simbol asterisk (*).
3. DILARANG KERAS menggunakan icon emoji apapun dalam seluruh balasan Anda. Pesan harus bersih dan elegan.
4. DILARANG KERAS menyuruh pelanggan mengetik perintah tertentu seperti 'Ketik ORDER', 'Ketik MENU', 'Ketik CS', atau sejenisnya. Tawarkan bantuan secara alami seperti konsultan karpet profesional berpengalaman.
5. Pahami maksud pelanggan dengan cerdas:
   - Jika pelanggan ingin memesan karpet atau minta survey lokasi gratis, tanyakan ukuran ruangan atau jenis karpet yang diminati serta nomor kontak dan alamatnya.
   - Jika pelanggan ingin tahu jadwal buka, lokasi alamat, garansi resmi, promo aktif, atau ingin menyampaikan komplain, berikan penjelasan yang lengkap, transparan, dan menenangkan.
6. ATURAN ANTI-SPAM & 1 PESAN TUNGGAL:
   - Balas selalu dalam TEPAT 1 pesan chat yang ringkas, jelas, dan padat (maksimal 2 paragraf singkat).
   - DILARANG KERAS membanjiri pelanggan dengan pesan panjang atau mengirim banyak pesan beruntun.
7. KEBIJAKAN FOTO & DETAIL PRODUK:
   - Jika pelanggan meminta, menanyakan, atau mengonfirmasi foto/gambar/detail karpet (misal: "kirim foto", "lihat gambar", "mau foto", "spill foto", "detail", "fotonya", "ada fotonya?"), berikan penjelasan ringkas dan WAJIB sertakan tag [KIRIM_FOTO: KODE_PRODUK] di akhir pesan agar sistem otomatis mengirimkan gambar fisik karpet ke pelanggan.
   - Contoh kode produk: MASJID-TURKI-A, PERSIA-TABRIZ, NORDIC-SCANDI, SHAGGY-CLOUD, OFFICE-TILE-50.
   - Jika pelanggan baru bertanya tentang karpet secara umum tanpa meminta foto, berikan penjelasan ringkas dan tawarkan konfirmasi:
     "Bila Kakak ingin melihat foto fisik dan rincian spesifikasi lengkap karpet ini, silakan balas dengan 'FOTO' atau 'DETAIL'."
   - Jangan pernah menggunakan tag [KIRIM_FOTO: ALL] untuk menghindari deteksi spam WhatsApp.`;
  }

  async generateReply(jid, userText, senderName = 'Kak') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    const model = this.getModel();
    const systemInstruction = this.buildSystemInstruction();

    // Get or initialize conversation history for this JID
    let history = this.conversationHistories.get(jid) || [];

    // Format contents payload for Gemini API
    const contents = [];

    // Add recent turns
    for (const item of history) {
      contents.push({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: item.text }]
      });
    }

    // Add the current user query (with sender context)
    const currentUserMessage = `[Pengirim: ${senderName}]: ${userText}`;
    contents.push({
      role: 'user',
      parts: [{ text: currentUserMessage }]
    });

    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 600,
        topP: 0.95
      }
    };

    // Prioritize active fast models for maximum speed (< 2 seconds)
    const candidateModels = Array.from(new Set([
      this.activeModel || DEFAULT_FAST_MODEL,
      model,
      DEFAULT_FAST_MODEL,
      'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.5-flash'
    ].filter(Boolean)));

    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(6000)
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            const cleanReply = replyText.trim();
            // Remember active working model so all subsequent calls go straight to it
            this.activeModel = m;

            // Update conversation history
            history.push({ role: 'user', text: userText });
            history.push({ role: 'model', text: cleanReply });

            // Trim history if it exceeds max turns
            if (history.length > this.maxHistoryTurns * 2) {
              history = history.slice(-this.maxHistoryTurns * 2);
            }
            this.conversationHistories.set(jid, history);

            return stripStarsAndEmojis(cleanReply);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`[GeminiService] Model ${m} returned ${response.status}:`, errorData.error?.message || response.statusText);
        }
      } catch (err) {
        console.warn(`[GeminiService] Model ${m} timeout atau error:`, err.message);
      }
    }

    return null;
  }

  clearHistory(jid) {
    if (jid) {
      this.conversationHistories.delete(jid);
    } else {
      this.conversationHistories.clear();
    }
  }

  async testConnection(testApiKey, testModel) {
    const key = testApiKey || this.getApiKey();
    if (!key) {
      return { success: false, message: 'API Key Gemini belum diisi.' };
    }

    let primaryModel = testModel || this.getModel();
    if (!primaryModel || primaryModel === 'gemini-flash-latest' || primaryModel.includes('gemini-2.0') || primaryModel.includes('gemini-1.5') || primaryModel.includes('gemini-2.5')) {
      primaryModel = DEFAULT_FAST_MODEL;
    }

    const candidateModels = Array.from(new Set([
      this.activeModel || DEFAULT_FAST_MODEL,
      primaryModel,
      DEFAULT_FAST_MODEL,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash'
    ].filter(Boolean)));

    const startTime = Date.now();
    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Halo Gemini! Balas dalam 1 kalimat singkat bahwa koneksi integrasi AI Harbor telah aktif.' }] }]
          }),
          signal: AbortSignal.timeout(5000)
        });

        const data = await res.json();
        const elapsed = Date.now() - startTime;

        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const reply = stripStarsAndEmojis(data.candidates[0].content.parts[0].text.trim());
          this.activeModel = m;
          // Auto-sync valid key & fast model
          this.syncApiKey(key, m);

          return {
            success: true,
            elapsed,
            reply,
            model: m
          };
        }
      } catch (err) {}
    }

    return {
      success: false,
      message: 'Gagal terhubung ke Gemini. Silakan periksa kembali API Key Anda.'
    };
  }
}

module.exports = new GeminiService();
