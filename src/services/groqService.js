const fs = require('fs');
const path = require('path');
const menuHandler = require('../handlers/menuHandler');
const ragService = require('./ragService');
const { stripStarsAndEmojis } = require('../utils/textCleaner');
const timeHelper = require('../utils/timeHelper');

const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
const ACTIVE_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
];

class GroqService {
  constructor() {
    this.conversationHistories = new Map();
    this.maxHistoryTurns = 6;
    this.activeModel = DEFAULT_GROQ_MODEL;

    // Background warmup
    setTimeout(() => {
      this.autoWarmup().catch(() => {});
    }, 2000);
  }

  getApiKey() {
    return (
      process.env.GROQ_API_KEY ||
      menuHandler.getConfig()?.ai?.groq_api_key ||
      ''
    ).trim();
  }

  getModel() {
    const config = menuHandler.getConfig();
    let model = (
      config?.ai?.groq_model ||
      process.env.GROQ_MODEL ||
      this.activeModel ||
      DEFAULT_GROQ_MODEL
    );

    // Auto-migrate decommissioned or unavailable models
    if (
      !model ||
      model.includes('mixtral') ||
      model.includes('preview') ||
      model.includes('llama-3.3') ||
      model.includes('llama-3.1')
    ) {
      model = DEFAULT_GROQ_MODEL;
    }

    return model;
  }

  isAiEnabled() {
    const config = menuHandler.getConfig();
    return !!this.getApiKey() && config?.ai?.enabled !== false;
  }

  syncApiKey(key, model = null) {
    if (key !== undefined && key !== null) {
      process.env.GROQ_API_KEY = key.trim();
    }
    if (model) {
      this.activeModel = model;
      process.env.GROQ_MODEL = model;
    }

    // 1. Update config.json
    try {
      const configPath = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const configData = JSON.parse(raw);
        if (!configData.ai) configData.ai = {};
        if (key !== undefined && key !== null) {
          configData.ai.groq_api_key = key.trim();
        }
        if (model) {
          configData.ai.groq_model = model;
        }
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
      }
    } catch (err) {
      console.warn('[GroqService] Gagal memperbarui config.json:', err.message);
    }

    // 2. Update .env
    try {
      const envPath = path.join(__dirname, '../../.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

      if (key !== undefined && key !== null && key.trim() !== '') {
        if (/^GROQ_API_KEY=/m.test(envContent)) {
          envContent = envContent.replace(/^GROQ_API_KEY=.*$/m, `GROQ_API_KEY=${key.trim()}`);
        } else {
          envContent += `\nGROQ_API_KEY=${key.trim()}`;
        }
      }

      if (model) {
        if (/^GROQ_MODEL=/m.test(envContent)) {
          envContent = envContent.replace(/^GROQ_MODEL=.*$/m, `GROQ_MODEL=${model}`);
        } else {
          envContent += `\nGROQ_MODEL=${model}`;
        }
      }

      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (err) {
      console.warn('[GroqService] Gagal memperbarui .env:', err.message);
    }
  }

  async autoWarmup() {
    const key = this.getApiKey();
    if (!key) return;

    try {
      const model = this.getModel();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        console.log(`[GroqService] AI Groq siap & aktif pada model: ${model}`);
      }
    } catch (err) {
      // Warmup is non-blocking
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

    // Get conversation history for this JID
    let history = this.conversationHistories.get(jid) || [];

    const messages = [
      { role: 'system', content: systemInstruction }
    ];

    for (const item of history) {
      messages.push({
        role: item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user',
        content: item.text
      });
    }

    messages.push({
      role: 'user',
      content: `[Pelanggan: ${politeCustomer}]: ${userText}`
    });

    const candidateModels = Array.from(new Set([
      model,
      this.activeModel,
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b'
    ].filter(m => m && !m.includes('mixtral') && !m.includes('preview') && !m.includes('llama-3.3') && !m.includes('llama-3.1'))));

    for (const m of candidateModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: 0.7,
            max_tokens: 800
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices?.[0]?.message?.content;

          if (replyText) {
            // Strip asterisks and emojis
            let cleanReply = stripStarsAndEmojis(replyText.trim());
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
            history.push({ role: 'assistant', text: cleanReply });

            if (history.length > this.maxHistoryTurns * 2) {
              history = history.slice(-this.maxHistoryTurns * 2);
            }
            this.conversationHistories.set(jid, history);

            return cleanReply;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[GroqService] Model ${m} returned ${response.status}:`, errData.error?.message || response.statusText);
        }
      } catch (err) {
        console.warn(`[GroqService] Model ${m} error:`, err.message);
      }
    }

    return null;
  }

  async testConnection(customApiKey = null, customModel = null) {
    const apiKey = (customApiKey || this.getApiKey()).trim();
    if (!apiKey) {
      return {
        success: false,
        message: 'Groq API Key belum diisi. Silakan masukkan API Key Groq Anda.'
      };
    }

    const testModel = customModel || this.getModel();
    const candidateModels = Array.from(new Set([
      testModel,
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b'
    ].filter(m => m && !m.includes('mixtral') && !m.includes('preview'))));

    const startTime = Date.now();
    let lastError = 'Gagal terhubung ke model Groq.';

    for (const m of candidateModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: m,
            messages: [
              {
                role: 'system',
                content: 'Anda adalah asisten AI Harbor. Balas sangat singkat maksimal 1 kalimat ramah dalam Bahasa Indonesia.'
              },
              {
                role: 'user',
                content: 'Katakan bahwa koneksi AI Groq Harbor berhasil terhubung dan siap melayani.'
              }
            ],
            temperature: 0.5,
            max_tokens: 250
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          const elapsed = Date.now() - startTime;
          this.activeModel = m;
          this.syncApiKey(apiKey, m);

          return {
            success: true,
            elapsed,
            reply: reply ? stripStarsAndEmojis(reply) : 'Halo, koneksi integrasi AI Groq aktif dan siap digunakan.',
            model: m,
            provider: 'groq'
          };
        } else {
          const err = await res.json().catch(() => ({}));
          lastError = `Groq API Error (${res.status}): ${err.error?.message || res.statusText}`;
          console.warn(`[GroqService] Model ${m} gagal (${res.status}):`, lastError);
        }
      } catch (err) {
        lastError = `Koneksi ke Groq gagal (${err.message})`;
        console.warn(`[GroqService] Model ${m} fetch error:`, err.message);
      }
    }

    return {
      success: false,
      message: lastError,
      model: testModel
    };
  }

  clearHistory(jid) {
    this.conversationHistories.delete(jid);
  }
}

module.exports = new GroqService();
