const menuHandler = require('../handlers/menuHandler');
const ticketService = require('./ticketService');

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Mengindeks seluruh data dari 11 halaman/fitur Sultan Carpet Gallery:
 * 1. Profil & Pemilik Toko (store_profile)
 * 2. Katalog Produk & Spesifikasi (catalog)
 * 3. Kategori Produk (categories)
 * 4. Layanan Resmi (services)
 * 5. Jadwal & Jam Operasional (schedule)
 * 6. Lokasi & Alamat Showroom/Gudang (location)
 * 7. Ketentuan Garansi & Kebijakan Klaim (warranty)
 * 8. Promo & Diskon Aktif (promo)
 * 9. Pusat Komplain & Tiket CS (complaint & tickets)
 * 10. Alih Kendali CS Manusia (handoff)
 * 11. Basis Tanya-Jawab AI / FAQ (qna)
 */
class RagService {
  constructor() {
    this.documents = [];
    this.lastIndexTime = 0;
    this.indexIntervalMs = 15000; // Refresh index at most every 15 detik bila ada update
    this.buildIndex();
  }

  /**
   * Bangun indeks dokumen pengetahuan dari seluruh halaman proyek
   */
  buildIndex() {
    try {
      const config = menuHandler.getConfig() || {};
      const b = config.business || {};
      const o = config.owner_info || {};
      const s = config.schedule_info || {};
      const w = config.warranty_info || {};
      const p = config.promo_info || {};
      const c = config.complaint_info || {};
      const catalog = config.catalog || [];
      const categories = config.categories || [];
      const services = config.services || [];
      const branches = config.branches || [];
      const locInfo = config.location_info || {};
      const faqs = config.faqs || [];
      const handoffCfg = config.protections?.human_handoff || {};

      const docs = [];

      // 1. HALAMAN: PROFIL TOKO & PEMILIK
      docs.push({
        id: 'page_store_profile',
        page: 'Profil Toko & Pemilik',
        title: 'Profil Toko Sultan Carpet Gallery & Pendiri',
        keywords: ['profil', 'pemilik', 'founder', 'sejarah', 'ahmad fauzi', 'maryam', 'reputasi', 'legalitas', 'masjid', 'tentang toko', 'tentang kami'],
        content: `Nama Toko: ${b.name || 'Sultan Carpet Gallery'}.
Tagline: ${b.tagline || 'Pusat Karpet Masjid Turki, Karpet Ruang Tamu Mewah & Karpet Kantor Elegan'}.
Pemilik & Founder: ${o.owner_name || 'H. Ahmad Fauzi & Hj. Maryam'} (Jabatan: ${o.role || 'Founder & Managing Director'}).
Tahun Berdiri: Sejak tahun ${b.established || '2012'} (${o.experience || '12+ tahun pengalaman'}).
Reputasi & Pengalaman: Telah dipercaya melayani lebih dari 1.500 masjid di seluruh Indonesia, ribuan hunian mewah, serta ratusan kantor korporat.
Legalitas Resmi: ${b.legal || 'NIB: 9120003481923 / SIUP: 510/089/PK/X/2012'}.
Komitmen Toko: ${o.commitment || 'Menyediakan karpet 100% original berkualitas grade A dengan harga transparan, layanan purnajual prima, survey gratis, dan garansi penuh'}.
Kontak Resmi: Telepon/WA ${b.phone || '0812-9876-5432'}, Email ${b.email || 'info@sultancarpet.co.id'}, Website ${b.website || 'https://sultancarpet.co.id'}.`
      });

      // 2. HALAMAN: KATALOG PRODUK (Per Produk & Ringkasan)
      catalog.forEach((item, idx) => {
        const code = item.code || item.id || `PROD-${idx + 1}`;
        docs.push({
          id: `product_${code.toLowerCase()}`,
          page: 'Katalog Produk',
          title: `Produk: ${item.title} (${code})`,
          keywords: [
            code.toLowerCase(),
            item.title.toLowerCase(),
            'karpet',
            'harga',
            'spesifikasi',
            'foto',
            'gambar',
            'detail',
            ...(item.category ? [item.category.toLowerCase()] : [])
          ],
          content: `Nama Produk: ${item.title}
Kode Produk: ${code}
Tag Foto Otomatis: [KIRIM_FOTO: ${code}]
Harga: ${item.price}
Spesifikasi & Ketebalan: ${item.subtitle || '-'}
Varian Ukuran / Warna: ${item.footer || '-'}
Deskripsi: ${item.description || item.subtitle || '-'}
Aturan Pengiriman Foto: Jika pelanggan meminta foto/gambar karpet ini, berikan deskripsi ringkas dan cantumkan tag [KIRIM_FOTO: ${code}] di akhir pesan.`
        });
      });

      // 3. HALAMAN: KATEGORI PRODUK
      categories.forEach((cat) => {
        docs.push({
          id: `category_${cat.slug || cat.id}`,
          page: 'Katalog Produk - Kategori',
          title: `Kategori Karpet: ${cat.name}`,
          keywords: ['kategori', cat.name.toLowerCase(), cat.slug ? cat.slug.toLowerCase() : '', 'koleksi'],
          content: `Kategori: ${cat.name}
Slug: ${cat.slug || '-'}
Deskripsi Kategori: ${cat.description || '-'}
Produk Terkait dalam Kategori: ${catalog.filter(p => (p.category && p.category.toLowerCase().includes(cat.name.toLowerCase())) || (p.title && p.title.toLowerCase().includes(cat.name.toLowerCase()))).map(p => p.title).join(', ') || 'Tersedia beragam pilihan di galeri'}.`
        });
      });

      // 4. HALAMAN: LAYANAN TOKO
      services.forEach((srv) => {
        docs.push({
          id: `service_${srv.id}`,
          page: 'Layanan Toko',
          title: `Layanan: ${srv.name}`,
          keywords: ['layanan', 'service', srv.name.toLowerCase(), 'tarif', 'ongkos', 'biaya'],
          content: `Nama Layanan: ${srv.name}
Biaya / Tarif: ${srv.price}
Detail Layanan: ${srv.description}
Keunggulan: Dilakukan oleh tim teknisi spesialis bersertifikat dengan peralatan canggih dan portable.`
        });
      });

      // 5. HALAMAN: JADWAL & JAM OPERASIONAL
      docs.push({
        id: 'page_schedule',
        page: 'Jadwal & Jam Operasional',
        title: 'Jadwal Operasional Showroom, Survey, dan Teknisi Pasang',
        keywords: ['jadwal', 'jam buka', 'jam operasional', 'tutup', 'buka', 'hari libur', 'hari kerja', 'survey', 'pasang malam', 'waktu'],
        content: `Jam Buka Showroom: ${s.store_hours || b.hours || 'Senin - Sabtu: 08:30 - 20:00 WIB, Minggu & Libur Nasional: 09:00 - 18:00 WIB'}.
Jadwal Survey Gratis ke Lokasi: ${s.survey_hours || 'Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB (Bisa disesuaikan dengan janji temu DKM masjid / pengurus / pemilik rumah)'}.
Jadwal Pasang & Obras Karpet di Tempat: ${s.installation_hours || 'Tersedia layanan teknisi 24 jam by appointment (dapat dikerjakan malam hari setelah sholat Isya agar tidak mengganggu kegiatan ibadah di masjid atau aktivitas kerja di kantor)'}.
Jadwal Pengiriman Karpet: ${s.shipping_schedule || 'Pengiriman Jabodetabek setiap hari kerja armada sendiri. Pengiriman luar kota/pulau menggunakan ekspedisi kargo resmi'}.`
      });

      // 6. HALAMAN: LOKASI SHOWROOM & CABANG
      const branchItems = locInfo.items || branches || [];
      branchItems.forEach((br, idx) => {
        docs.push({
          id: `location_${br.id || idx}`,
          page: 'Lokasi & Alamat Showroom',
          title: `Lokasi Showroom: ${br.title || br.name}`,
          keywords: [
            'lokasi',
            'alamat',
            'cabang',
            'showroom',
            'toko',
            (br.city || '').toLowerCase(),
            (br.area || '').toLowerCase(),
            (br.title || br.name || '').toLowerCase(),
            'maps',
            'petunjuk arah',
            'gudang'
          ],
          content: `Nama Galeri/Cabang: ${br.title || br.name}
Jenis: ${br.type || 'Showroom Galeri'}
Alamat Lengkap: ${br.address}
Patokan / Landmark: ${br.landmark || '-'}
Jam Buka: ${br.hours || '08:30 - 20:00 WIB'}
Nomor Telepon: ${br.phone}
Link Google Maps: ${br.maps_url}`
        });
      });

      // 7. HALAMAN: GARANSI RESMI & KEBIJAKAN KLAIM
      docs.push({
        id: 'page_warranty',
        page: 'Ketentuan Garansi',
        title: 'Kebijakan Garansi Resmi & Alur Klaim Sultan Carpet',
        keywords: ['garansi', 'klaim', 'jaminan', 'rusak', 'cacat', 'benang asli', 'obras', 'tukar baru', 'retur'],
        content: `Ringkasan Garansi: ${w.summary || 'Garansi 100% benang asli impor Turki & Persia, garansi obras & pasang 1 tahun, serta garansi tukar baru 14 hari bila ada cacat pabrik'}.
Rincian 3 Pilar Garansi Resmi:
1. Garansi 100% Keaslian Benang: Jaminan uang kembali 100% jika terbukti karpet bukan buatan Turki/Persia autentik.
2. Garansi 1 Tahun Pemasangan & Obras: Perbaikan obras sambungan gratis selama 1 tahun bila terjadi benang obras terurai atau renggang.
3. Garansi 14 Hari Tukar Baru: Penggantian unit baru secara cuma-cuma apabila karpet diterima dengan cacat produksi pabrik.
Alur Pengajuan Klaim: ${w.claim_steps || 'Pelanggan cukup mengirimkan foto/video kendala via chat WhatsApp ini. Sistem akan menerbitkan nomor tiket layanan resmi dan tim teknisi merespons dalam 1x24 jam kerja'}.`
      });

      // 8. HALAMAN: PROMO & DISKON AKTIF
      const promoItems = p.active_promos || [];
      docs.push({
        id: 'page_promo',
        page: 'Promo & Diskon',
        title: 'Penawaran Diskon & Promo Aktif Toko',
        keywords: ['promo', 'diskon', 'potongan harga', 'voucher', 'penawaran', 'spesial', 'cashback', 'gratis obras', 'parfum'],
        content: `Daftar Promo Aktif:
${promoItems.map((pr, i) => `${i + 1}. [${pr.badge || 'PROMO'}] ${pr.title}: ${pr.discount} (${pr.desc}) - Berlaku s/d: ${pr.valid_until}`).join('\n')}
Fasilitas Tambahan Promo Masjid: Gratis obras sambungan keliling di lokasi, gratis parfum karpet masjid wangi tahan lama, serta subsidi ongkos kirim se-Jawa.
Voucher Rumah: SULTANHOME (Potongan dan layanan pengiriman instan area Jabodetabek).`
      });

      // 9. HALAMAN: PUSAT KOMPLAIN & CUSTOMER SERVICE (TIKET)
      docs.push({
        id: 'page_complaint_tickets',
        page: 'Pusat Komplain & CS',
        title: 'Pusat Komplain, Pengaduan, dan Tiket Layanan Konsumen',
        keywords: ['komplain', 'pengaduan', 'keluhan', 'tiket', 'cs', 'customer service', 'layanan', 'sla', 'tanggapan', 'masalah'],
        content: `Standar Penanganan Komplain:
Target Respon Cepat (SLA): ${c.sla || 'Maksimal 1x24 Jam Kerja'}.
Hotline Manajer CS: ${c.contact_manager || b.phone_cs || b.phone || '0811-2345-6789'}.
Alur Layanan:
1. Pelanggan menyampaikan keluhan atau permohonan (Survey, Order, Garansi, Komplain).
2. Bot atau admin mencatat identitas dan detail kendala.
3. Diterbitkan nomor tiket resmi (format TKT-XXXX).
4. Petugas teknisi/CS menghubungi pelanggan untuk penyelesaian masalah hingga tuntas.`
      });

      // 10. HALAMAN: HANDS-OFF CS & AI TAKEOVER
      docs.push({
        id: 'page_handoff',
        page: 'Hands-Off CS & AI',
        title: 'Alih Kendali Customer Service (Human Handoff)',
        keywords: ['human handoff', 'hands-off', 'operator', 'cs manusia', 'admin manusia', 'bicara dengan cs', 'staf', 'takeover', 'alih kendali'],
        content: `Fitur Alih Kendali ke CS Manusia (Human Handoff):
Status Modul: ${handoffCfg.enabled !== false ? 'Aktif' : 'Nonaktif'}.
Kata Kunci Pemicu Alih Kendali: ${(handoffCfg.keywords || ['cs', 'operator', 'admin', 'bantuan manusia', 'komplain']).join(', ')}.
Kata Kunci Pengaktifan Kembali Bot: ${(handoffCfg.release_keywords || ['aktifkan bot', 'bot on', 'reset bot']).join(', ')}.
Batas Waktu Otomatis (Auto-Expire): ${handoffCfg.auto_expire_hours || 2} jam.
Notifikasi Alih Kendali: "${handoffCfg.takeover_notice || 'Halo! Permintaan Anda telah kami teruskan ke Customer Service Sultan Carpet. Tim kami akan segera merespons Anda.'}"
Peran Bot saat Handoff: Jika pelanggan secara spesifik ingin berbicara dengan staf/manusia atau komplain kritis, bot harus bersikap sangat sopan menginformasikan bahwa pesan diteruskan ke admin manusia, lalu sistem otomatis mematikan AI bot pada nomor tersebut.`
      });

      // 11. HALAMAN: BASIS PENGETAHUAN TANYA-JAWAB (FAQ / KNOWLEDGE BASE)
      faqs.forEach((faq, idx) => {
        docs.push({
          id: `faq_${faq.id || idx}`,
          page: 'Knowledge Base (Q&A)',
          title: `FAQ [${faq.category || 'Umum'}]: ${faq.q}`,
          keywords: [
            'faq',
            'tanya jawab',
            (faq.category || '').toLowerCase(),
            ...faq.q.toLowerCase().split(/\s+/).filter(w => w.length > 3)
          ],
          content: `Pertanyaan: ${faq.q}
Kategori: ${faq.category || 'Umum'}
Jawaban Resmi: ${faq.a}
Sumber: ${faq.source || 'Sistem Resmi Toko'}`
        });
      });

      this.documents = docs;
      this.lastIndexTime = Date.now();
      return docs;
    } catch (err) {
      console.error('[RagService] Gagal membangun indeks RAG:', err.message);
      return this.documents;
    }
  }

  /**
   * Preprocessing & tokenizing teks query
   */
  tokenize(text = '') {
    if (!text) return [];
    const stopWords = new Set([
      'yang', 'di', 'dan', 'ini', 'itu', 'ke', 'dari', 'pada', 'untuk', 'dengan',
      'adalah', 'ada', 'bisa', 'apakah', 'bagaimana', 'apa', 'saya', 'kak', 'kakak',
      'mau', 'ingin', 'tanya', 'tolong', 'mohon', 'kami', 'dong', 'ya', 'yaudah',
      'gimana', 'kan', 'deh', 'siapa', 'berapa'
    ]);

    const cleaned = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned
      .split(' ')
      .map(w => w.trim())
      .filter(w => w.length >= 2 && !stopWords.has(w));
  }

  /**
   * Melakukan pencarian dokumen paling relevan menggunakan algoritma scoring terbobot (BM25-inspired)
   */
  search(query = '', topK = 4) {
    if (!query) return [];

    // Rebuild index jika sudah lewat interval
    if (Date.now() - this.lastIndexTime > this.indexIntervalMs) {
      this.buildIndex();
    }

    const queryTokens = this.tokenize(query);
    const queryLower = query.toLowerCase();

    if (queryTokens.length === 0) {
      // Default fallback jika query sangat pendek
      return this.documents.slice(0, topK);
    }

    const scored = this.documents.map(doc => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();

      // 1. Exact phrase match boost (Tinggi sekali)
      if (titleLower.includes(queryLower)) {
        score += 35;
      }
      if (contentLower.includes(queryLower)) {
        score += 20;
      }

      // 2. Keyword boost
      for (const kw of doc.keywords || []) {
        if (queryLower.includes(kw)) {
          score += 18;
        }
      }

      // 3. Token-level matching
      for (const token of queryTokens) {
        // Title match
        if (titleLower.includes(token)) {
          score += 8;
        }
        // Keywords match
        for (const kw of doc.keywords || []) {
          if (kw.includes(token)) {
            score += 5;
          }
        }
        // Content term frequency
        const regex = new RegExp(`\\b${token}`, 'gi');
        const matches = contentLower.match(regex);
        if (matches) {
          score += Math.min(matches.length * 2, 10);
        }
      }

      // 4. Intent-specific category booster
      if (/(foto|gambar|lihat|spill|warna|motif|tebal|tipe|beli|order)/i.test(queryLower) && doc.page.includes('Katalog')) {
        score += 15;
      }
      if (/(buka|tutup|jam|hari|minggu|malam|kapan|waktu|jadwal)/i.test(queryLower) && doc.page.includes('Jadwal')) {
        score += 15;
      }
      if (/(alamat|lokasi|dimana|jalan|cabang|bandung|surabaya|fatmawati|maps|arah)/i.test(queryLower) && doc.page.includes('Lokasi')) {
        score += 15;
      }
      if (/(garansi|klaim|rusak|cacat|palsu|asli|tukar)/i.test(queryLower) && doc.page.includes('Garansi')) {
        score += 15;
      }
      if (/(diskon|promo|murah|potongan|voucher|cashback)/i.test(queryLower) && doc.page.includes('Promo')) {
        score += 15;
      }
      if (/(manusia|operator|admin|cs|petugas|staf|orang|bicara langsung)/i.test(queryLower) && doc.page.includes('Hands-Off')) {
        score += 25;
      }
      if (/(komplain|keluhan|kecewa|lapor|tiket)/i.test(queryLower) && (doc.page.includes('Komplain') || doc.page.includes('Hands-Off'))) {
        score += 20;
      }
      if (/(siapa|pemilik|founder|berdiri|sejak|profil|ahmad|maryam)/i.test(queryLower) && doc.page.includes('Profil')) {
        score += 15;
      }

      return {
        ...doc,
        score
      };
    });

    // Urutkan berdasarkan skor tertinggi
    scored.sort((a, b) => b.score - a.score);

    // Filter dokumen dengan skor signifikan
    const topResults = scored.filter(d => d.score > 0).slice(0, topK);

    // Jika tidak ada skor > 0, berikan 2 dokumen profil & katalog utama sebagai fallback
    if (topResults.length === 0) {
      return this.documents.slice(0, 2);
    }

    return topResults;
  }

  /**
   * Mengambil konteks teks terformat untuk langsung diinjeksi ke System Prompt LLM (RAG Context)
   */
  retrieveContext(query = '', topK = 4) {
    const matchedDocs = this.search(query, topK);
    if (!matchedDocs || matchedDocs.length === 0) {
      return '';
    }

    let text = '=== INFORMASI TERVERIFIKASI SISTEM RAG (RETRIEVED KNOWLEDGE DARI SELURUH HALAMAN) ===\n';
    text += 'Gunakan data faktual di bawah ini sebagai rujukan utama Anda untuk menjawab pertanyaan pelanggan:\n\n';

    matchedDocs.forEach((doc, idx) => {
      text += `[DOKUMEN ${idx + 1} - HALAMAN: ${doc.page} | ${doc.title}]\n`;
      text += `${doc.content}\n\n`;
    });

    return text.trim();
  }

  /**
   * Mengambil statistik status indeks RAG untuk dashboard / AI Studio
   */
  getStatus() {
    if (this.documents.length === 0) {
      this.buildIndex();
    }

    const pages = {};
    for (const doc of this.documents) {
      pages[doc.page] = (pages[doc.page] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.length,
      lastIndexed: new Date(this.lastIndexTime).toISOString(),
      indexedPages: Object.keys(pages).length,
      pageBreakdown: pages
    };
  }
}

module.exports = new RagService();
