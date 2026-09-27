const fs = require('fs');
const path = require('path');
const menuHandler = require('../handlers/menuHandler');
const { stripStarsAndEmojis } = require('../utils/textCleaner');

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

  buildSystemInstruction() {
    const config = menuHandler.getConfig();
    const b = config.business || {};
    const catalog = config.catalog || [];
    const branches = config.branches || [];
    const faqs = config.faqs || [];

    let catalogSummary = catalog.map((item, idx) => 
      `${idx + 1}. ${item.title} - Harga: ${item.price} | Varian: ${item.footer} | Keterangan: ${item.subtitle}`
    ).join('\n');

    let branchSummary = branches.map((br, idx) => 
      `${idx + 1}. ${br.name} (${br.city} - ${br.area})\n   Alamat: ${br.address}\n   Jam Buka: ${br.hours}\n   Maps: ${br.maps_url}`
    ).join('\n\n');

    let faqSummary = faqs.map(f => `Tanya: ${f.q}\nJawab: ${f.a}`).join('\n');

    const customPrompt = config.ai?.system_instructions || '';

    return `${customPrompt}

=== INFORMASI RESMI BISNIS ===
Nama Toko: ${b.name} (${b.tagline || 'Stoneware & Mindful Living'})
Alamat Utama: ${b.address}
Jam Operasional: ${b.hours}
Telepon/WA: ${b.phone}
Email: ${b.email}
Website: ${b.website}

=== KATALOG PRODUK KERAMIK ARTISANAL ===
${catalogSummary}

=== DAFTAR CABANG & SHOWROOM TOKO FISIK ===
${branchSummary}

=== PERTANYAAN UMUM (FAQ) & KEBIJAKAN ===
${faqSummary}
Garansi Barang Pecah: 100% Ganti Baru Gratis jika terjadi kerusakan atau pecah saat pengiriman ekspedisi.

=== ATURAN MUTLAK FORMAT DAN GAYA BAHASA ===
1. Berinteraksilah secara luwes, santun, ramah, dan solutif dalam Bahasa Indonesia.
2. DILARANG KERAS menggunakan tanda bintang (*) untuk menebalkan teks maupun untuk simbol apapun. Tulis teks polos tanpa simbol asterisk (*).
3. DILARANG KERAS menggunakan icon emoji apapun dalam seluruh balasan Anda. Pesan harus bersih dan elegan.
4. DILARANG KERAS menyuruh pelanggan mengetik perintah tertentu seperti 'Ketik ORDER', 'Ketik MENU', 'Ketik CS', atau sejenisnya. Tawarkan bantuan secara alami seperti konsultan customer service profesional (misal: 'Bila Anda berminat dengan koleksi ini, silakan beri tahu kami agar dapat kami bantu proseskan').
5. Pahami maksud pelanggan dengan cerdas:
   - Jika pelanggan ingin membeli produk, tanyakan nama dan alamat atau bantu proseskan pembeliannya.
   - Jika pelanggan mengalami barang pecah atau ingin klaim garansi, sampaikan permohonan maaf dan minta foto bukti barang pecah untuk kami proseskan ganti baru gratis.
   - Jika pelanggan menyampaikan keluhan atau pengaduan produk, tanggapi dengan empati dan jelaskan bahwa tiket pengaduan akan segera ditindaklanjuti tim kami.
6. Buat balasan ringkas, padat, dan nyaman dibaca (maksimal 2-3 paragraf singkat).
7. Jangan pernah mengarang informasi di luar data resmi toko di atas.
8. FITUR FOTO PRODUK: Jika pelanggan meminta foto/gambar produk (seperti 'kirim foto piring', 'lihat gambar everyday set', 'ada foto produk?', 'spill fotonya', 'tampilkan katalog foto') atau Anda merekomendasikan produk katalog, sertakan tag di paling akhir teks balasan Anda:
[KIRIM_FOTO: KODE_PRODUK]
Contoh:
- The Everyday Set: [KIRIM_FOTO: EVERYDAY-SET]
- The Slow Pour-Over Set: [KIRIM_FOTO: POUROVER-SET]
- The Organic Serving Platter: [KIRIM_FOTO: SERVING-PLATTER]
- Seluruh koleksi: [KIRIM_FOTO: ALL]
Sistem bot WhatsApp kami akan otomatis membaca tag tersebut dan mengirimkan foto produk berkualitas tinggi ke WhatsApp pelanggan.`;
  }

  async generateReply(jid, userText, senderName = 'Kak') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    const model = this.getModel();
    const systemInstruction = this.buildSystemInstruction();

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
      content: `[Pengirim: ${senderName}]: ${userText}`
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
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices?.[0]?.message?.content;

          if (replyText) {
            // Strip asterisks and emojis
            const cleanReply = stripStarsAndEmojis(replyText.trim());
            this.activeModel = m;

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
