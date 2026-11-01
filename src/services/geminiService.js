const fs = require('fs');
const path = require('path');
const menuHandler = require('../handlers/menuHandler');
const ragService = require('./ragService');
const { stripStarsAndEmojis } = require('../utils/textCleaner');
const timeHelper = require('../utils/timeHelper');
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

  buildSystemInstruction(userText = '', politeCustomer = 'Kak') {
    const config = menuHandler.getConfig();
    const b = config.business || {};
    const customPrompt = config.ai?.system_instructions || '';
    const ragContext = userText ? ragService.retrieveContext(userText, 10) : '';
    const timeContext = timeHelper.getAiTimeContext();

    return `${customPrompt}

${timeContext}

=== INFORMASI TERVERIFIKASI RAG (RUJUKAN UTAMA JAWABAN ANDA) ===
${ragContext ? ragContext : `Nama Toko: ${b.name || 'Rumah Indah Carpet Gallery'} (${b.tagline || 'Pusat Karpet Masjid & Hunian Mewah'})`}

=== ATURAN MUTLAK: JAWABAN PROFESIONAL, SIMPLE & FOKUS PADA RAG ===
1. ETIKA & SAPAAN PROFESIONAL (SANGAT PENTING):
   - DILARANG KERAS MENGULANG-ULANG SAPAAN WAKTU ("Selamat malam", "Selamat pagi", dll.) di setiap balasan pesan!
   - Pada obrolan yang sedang berlangsung, JANGAN menyapa waktu lagi. Langsung jawab inti pesan dengan santun (misal: "Baik ${politeCustomer}, ...", "Tentu ${politeCustomer}, ...").
   - Selalu panggil pelanggan dengan sebutan hormat "${politeCustomer}". JANGAN pernah memanggil nama tanpa sebutan "Kak".
   - Nada bicara harus profesional, hangat, ramah, dan berkelas layaknya staf konsultan karpet resmi Rumah Indah Carpet Gallery.
2. JAWABAN TO-THE-POINT & KELENGKAPAN DAFTAR PRODUK (SANGAT PENTING):
   - Jawab secara to-the-point, jelas, dan ramah langsung ke inti pertanyaan pelanggan.
   - HINDARI penjelasan bertele-tele dan DILARANG KERAS memuat informasi tambahan yang tidak ditanyakan (jangan sebut nomor telepon, promo, survey gratis, garansi, jam buka, atau alamat kecuali pelanggan secara spesifik menanyakannya).
   - ATURAN MUTLAK DAFTAR / LIST / KATALOG PRODUK: Jika pelanggan meminta daftar, list, koleksi, atau menanyakan produk apa saja yang tersedia untuk suatu kategori (seperti karpet masjid, karpet ruang tamu, karpet bulu, karpet kantor, dll.), Anda WAJIB menyebutkan SELURUH produk yang terdaftar pada kategori tersebut di data RAG secara lengkap satu per satu beserta harga resminya tanpa ada produk yang terlewat atau dikurangi! Tampilkan dalam format daftar bernomor yang rapi dan mudah dibaca.
   - Untuk pertanyaan umum selain permintaan list produk, jawab secara ringkas dalam 1-2 paragraf pendek.
3. SERTAKAN HARGA RESMI JIKA MENJELASKAN PRODUK:
   - Jika menyebutkan atau merekomendasikan produk karpet tertentu dari data RAG, selalu sertakan rincian harga resminya secara jelas dan transparan.
4. DILARANG KERAS MENYEBUTKAN KODE PRODUK KEPADA PELANGGAN:
   - Di katalog toko, TIDAK ADA kode produk untuk pelanggan. Jangan pernah menyebutkan kode (seperti MASJID-TURKI-A, NORDIC-SCANDI, dll.) dan JANGAN PERNAH menyuruh pelanggan menyebutkan kode produk.
   - Selalu sebutkan produk dengan NAMA PRODUK resminya secara wajar dan alami (misal: "Karpet Masjid Turki Indah", "Karpet Scandinavia", "Karpet Bulu Shaggy").
   - Kode produk HANYA dipakai di dalam tag sistem [KIRIM_FOTO: KODE] dan TIDAK BOLEH muncul dalam kalimat untuk pelanggan.
5. FOKUS UTAMA PADA DATA RAG:
   - Jawab HANYA berdasarkan fakta yang tertera pada bagian INFORMASI TERVERIFIKASI RAG di atas.
   - Jika pelanggan bertanya produk karpet secara umum (misal: "saya ingin tahu produk karpet"), sebutkan ringkas 2-3 kategori karpet utama kami dari data RAG (misal: karpet masjid, karpet ruang tamu, dan karpet kantor) dan tanyakan kebutuhan mereka secara santun tanpa pernah menyebutkan kode produk.
6. DILARANG KERAS MENGGUNAKAN SIMBOL BINTANG (*) UNTUK MENEBALKAN TEKS ATAU SIMBOL APAPUN. Tulis teks polos tanpa simbol bintang (*).
7. DILARANG KERAS MENGGUNAKAN ICON EMOJI APAPUN. Pesan harus bersih dan profesional.
8. DILARANG menyuruh pelanggan mengetik format kaku seperti 'Ketik ORDER', 'Ketik MENU', atau 'Ketik CS'. Berbicaralah santun dan luwes.
9. FOTO PRODUK:
   - HANYA cantumkan tag [KIRIM_FOTO: KODE_PRODUK] di akhir pesan jika pelanggan secara eksplisit meminta atau menanyakan foto/gambar fisik karpet (misal: "kirim foto", "minta foto", "lihat gambarnya").
   - Jika pelanggan belum meminta foto, berikan penjelasan singkat biasa tanpa tag foto.
10. PERTANYAAN DI LUAR KONTEKS TOKO / PRODUK (MUTLAK & WAJIB):
   - Lingkup Anda HANYALAH seputar Rumah Indah Carpet Gallery, produk karpet, pemesanan, layanan survey/pemasangan, lokasi toko, jadwal buka, promo, garansi, komplain, dan layanan toko.
   - Jika pelanggan menanyakan pertanyaan atau topik apapun DI LUAR KONTEKS TOKO (misalnya pengetahuan umum di luar toko, matematika, coding/pemrograman, politik, resep masakan, cuaca, olahraga, berita dunia, lelucon, atau hal lainnya yang tidak berkaitan dengan produk dan layanan toko), Anda WAJIB HANYA menjawab kalimat:
     "Mohon maaf, saya tidak bisa menjawab pertanyaan tersebut."
   - DILARANG KERAS mencoba menjawab pertanyaan di luar konteks tersebut, DILARANG berhalusinasi, DILARANG memberikan rekomendasi karpet jika topik tidak berkaitan, dan JANGAN menambahkan kalimat lain selain penolakan santun tersebut.`;
  }

  async generateReply(jid, userText, senderName = 'Kak') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    let cleanSender = String(senderName || 'Kak').trim().replace(/^(kak|pak|bu|mas|mbak)\s+/i, '').trim();
    const politeCustomer = cleanSender && cleanSender.toLowerCase() !== 'pelanggan' ? `Kak ${cleanSender}` : 'Kak';

    const model = this.getModel();
    const systemInstruction = this.buildSystemInstruction(userText, politeCustomer);

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
    const currentUserMessage = `[Pelanggan: ${politeCustomer}]: ${userText}`;
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
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
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
          signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            let cleanReply = stripStarsAndEmojis(replyText.trim());
            // Remember active working model so all subsequent calls go straight to it
            this.activeModel = m;

            // Pastikan tidak ada sapaan berulang pada percakapan lanjutan
            if (history.length > 0) {
              cleanReply = cleanReply.replace(/^(selamat\s+(pagi|siang|sore|malam)|halo\s+kak\s+[^,.!?\n]+|hai\s+kak\s+[^,.!?\n]+|halo\s+[^,.!?\n]+|hai\s+[^,.!?\n]+)[,.! ]\s*/i, '');
              if (cleanReply.length > 0) {
                cleanReply = cleanReply.charAt(0).toUpperCase() + cleanReply.slice(1);
              }
            } else {
              // Jika baru turn pertama tetapi pada jam dini hari (00:00 - 04:59 WIB), ganti "Selamat malam" dengan "Halo Kak [Nama]"
              const timeInfo = timeHelper.getWIBTime();
              if (timeInfo.timeCategory === 'Dini Hari') {
                cleanReply = cleanReply.replace(/^selamat\s+malam(,\s*kak\s+[^,.!?\n]+|,\s*[^,.!?\n]+)?[.!, ]\s*/i, `${politeCustomer ? `Halo ${politeCustomer}, ` : 'Halo Kak, '}`);
              }
            }

            // Update conversation history
            history.push({ role: 'user', text: userText });
            history.push({ role: 'model', text: cleanReply });

            // Trim history if it exceeds max turns
            if (history.length > this.maxHistoryTurns * 2) {
              history = history.slice(-this.maxHistoryTurns * 2);
            }
            this.conversationHistories.set(jid, history);

            return cleanReply;
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
