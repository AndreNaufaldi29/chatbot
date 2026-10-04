const fs = require('fs');
const path = require('path');
const { stripStarsAndEmojis } = require('../utils/textCleaner');

const CONFIG_PATH = path.join(__dirname, '../../config/config.json');

class MenuHandler {
  getConfig() {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[MenuHandler] Gagal membaca config.json:', err.message);
      return {
        business: {
          name: "Sultan Carpet Gallery",
          owner: "H. Ahmad Fauzi & Hj. Maryam",
          tagline: "Pusat Karpet Masjid Turki, Karpet Ruang Tamu Mewah & Karpet Kantor Elegan",
          phone: "0812-9876-5432",
          hours: "Senin - Sabtu 08:30 - 20:00 WIB"
        },
        catalog: [],
        services: [],
        faqs: []
      };
    }
  }

  saveConfig(newConfig) {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[MenuHandler] Gagal menyimpan config.json:', err.message);
      return false;
    }
  }

  getCatalog() {
    const config = this.getConfig();
    return config.catalog || [];
  }

  getCatalogItem(identifier) {
    if (!identifier) return null;
    let clean = String(identifier).trim().toLowerCase();
    const catalog = this.getCatalog();
    if (!catalog || catalog.length === 0) return null;

    // 1. Direct ID, Index, or exact Code match
    const direct = catalog.find((item, idx) => 
      String(item.id).toLowerCase() === clean ||
      String(idx + 1) === clean ||
      String(item.code || '').toLowerCase() === clean
    );
    if (direct) return direct;

    // 2. Clean out common prefix/filler words:
    // e.g. "foto no 1", "lihat nomor 2", "katalog 3", "karpet persia", "gambar karpet masjid"
    clean = clean
      .replace(/^(foto|gambar|gambarnya|fotonya|poto|potonya|lihat|liat|spill|detail|katalog|produk|koleksi|nomor|no\.?|ke)\s+/gi, '')
      .replace(/\b(nomor|no\.?|ke)\s+/gi, '')
      .trim();

    // Re-check direct ID / index after stripping prefixes (e.g. "foto no 1" -> "1")
    const afterPrefix = catalog.find((item, idx) => 
      String(item.id).toLowerCase() === clean ||
      String(idx + 1) === clean ||
      String(item.code || '').toLowerCase() === clean
    );
    if (afterPrefix) return afterPrefix;

    // 3. Keyword / Weighted matching against catalog items
    const rawLower = String(identifier).toLowerCase();
    let bestItem = null;
    let highestScore = 0;

    const distinctiveKeywords = {
      'masjid': 12,
      'turki': 12,
      'turkey': 12,
      'mihrab': 10,
      'kubah': 8,
      'shaf': 8,
      'musholla': 12,
      'mesjid': 12,
      'persia': 12,
      'tabriz': 12,
      'sutra': 8,
      'klasik': 8,
      'nordic': 12,
      'scandi': 12,
      'scandinavia': 12,
      'shaggy': 12,
      'fluffy': 10,
      'bulu': 8,
      'kantor': 12,
      'office': 12,
      'tile': 12
    };

    for (const item of catalog) {
      let score = 0;
      const code = (item.code || '').toLowerCase();
      const title = item.title.toLowerCase();
      const subtitle = (item.subtitle || '').toLowerCase();

      // Check number reference in raw text: e.g. "no 1", "nomor 2", "produk 3"
      const numMatch = rawLower.match(/\b(?:no\.?|nomor|ke|produk|pilihan)\s*([1-9])\b/);
      if (numMatch && String(item.id) === numMatch[1]) {
        score += 30;
      }
      if (new RegExp(`\\b${item.id}\\b`).test(rawLower) && !rawLower.includes('http')) {
        score += 15;
      }

      // Check exact code in text
      if (code && rawLower.includes(code)) {
        score += 25;
      }

      // Check distinctive keywords
      for (const [kw, pts] of Object.entries(distinctiveKeywords)) {
        if (rawLower.includes(kw) && (title.includes(kw) || subtitle.includes(kw) || code.includes(kw))) {
          score += pts;
        }
      }

      // Check title significant words (excluding generic words)
      const stopWords = new Set(['karpet', 'sultan', 'gallery', 'grade', 'koleksi', 'produk', 'mewah', 'dan', 'yang', 'untuk', 'dengan']);
      const titleWords = title.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      for (const word of titleWords) {
        if (rawLower.includes(word)) {
          score += 5;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestItem = item;
      }
    }

    if (highestScore >= 5) {
      return bestItem;
    }

    return null;
  }

  getBranches() {
    const config = this.getConfig();
    return config.branches || [];
  }

  getBranchByIdOrName(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const branches = this.getBranches();

    return branches.find(b => 
      String(b.id) === clean ||
      b.city.toLowerCase().includes(clean) ||
      (b.area && b.area.toLowerCase().includes(clean)) ||
      b.name.toLowerCase().includes(clean)
    ) || null;
  }

  getMainMenu(senderName = 'Kak') {
    const config = this.getConfig();
    const b = config.business;

    return stripStarsAndEmojis(`Halo ${senderName}, selamat datang di ${b.name}.
${b.tagline}

Layanan dan informasi yang dapat kami bantu:
1. Katalog Koleksi Karpet
2. Profil Toko & Nama Pemilik
3. Jadwal & Jam Kerja
4. Lokasi & Alamat Showroom
5. Ketentuan Garansi Resmi
6. Promo & Diskon Spesial
7. Layanan Komplain & Customer Service

Silakan sebutkan kebutuhan Anda atau pilih nomor layanan di atas.`);
  }

  getStoreProfileMenu() {
    const config = this.getConfig();
    const b = config.business;
    const o = config.owner_info || {};

    return stripStarsAndEmojis(`PROFIL TOKO & NAMA PEMILIK
${b.name.toUpperCase()}

Nama Toko: ${b.name}
Pemilik / Founder: ${o.owner_name || b.owner || 'H. Ahmad Fauzi & Hj. Maryam'}
Jabatan: ${o.role || 'Founder & Managing Director'}
Tahun Berdiri: Sejak ${b.established || '2012'} (${o.experience || '12+ Tahun Melayani Seluruh Indonesia'})
Legalitas Usaha: ${b.legal || 'NIB: 9120003481923 / SIUP: 510/089/PK/X/2012'}

Sejarah Singkat:
${o.story || b.description}

Komitmen Kami:
${o.commitment || 'Menghadirkan karpet bermutu tinggi dengan harga transparan dan bergaransi resmi.'}

Kontak Manajemen:
- Telepon/WhatsApp: ${o.phone || b.phone}
- Email: ${o.email || b.email}
- Website: ${b.website}`);
  }

  getWorkingHoursMenu() {
    const config = this.getConfig();
    const s = config.schedule_info || {};
    const b = config.business;

    return stripStarsAndEmojis(`JADWAL DAN JAM KERJA OPERASIONAL
${b.name.toUpperCase()}

1. Jam Operasional Showroom:
${s.store_hours || b.hours}

2. Jadwal Layanan Survey & Ukur Lokasi:
${s.survey_hours || 'Setiap Hari: 08:00 - 21:00 WIB (Gratis Jabodetabek, jadwal fleksibel mengikuti waktu pengurus masjid/konsumen)'}

3. Jadwal Pemasangan & Obras Karpet:
${s.installation_hours || 'Tersedia 24 Jam teknisi khusus masjid & kantor (bisa malam hari setelah Isya agar tidak mengganggu ibadah/kerja)'}

4. Jadwal Pengiriman:
${s.shipping_schedule || 'Jabodetabek: Setiap hari kerja (Armada sendiri)\nLuar Kota/Pulau: Ekspedisi kargo terpercaya'}

Silakan hubungi kami bila ingin membuat janji survey atau kunjungan ke showroom.`);
  }

  getLocationMenu() {
    const config = this.getConfig();
    const loc = config.location_info || {};
    const main = loc.main_showroom || {};
    const wh = loc.warehouse || {};
    const branches = config.branches || [];

    let text = `LOKASI DAN ALAMAT SHOWROOM
${config.business.name.toUpperCase()}

1. SHOWROOM UTAMA (JAKARTA SELATAN):
Alamat: ${main.address || config.business.address}
Patokan / Landmark: ${main.landmark || 'Dekat Stasiun MRT Cipete Raya'}
Jam Buka: ${main.hours || config.business.hours}
Telepon: ${main.phone || config.business.phone}
Google Maps: ${main.maps_url || config.business.maps_url}

2. GUDANG PUSAT & WORKSHOP OBRAS:
Alamat: ${wh.address || 'Kawasan Industri Bizpark No. 18, Jl. Narogong KM 7, Bekasi'}
Jam Operasional: ${wh.hours || 'Senin - Sabtu: 08:00 - 17:00 WIB'}

3. CABANG LAINNYA:
`;

    branches.forEach((br, idx) => {
      text += `- Cabang ${br.city} (${br.area || 'Gallery'}): ${br.address} (Telp: ${br.phone})\n`;
    });

    text += `\nSilakan kunjungi showroom terdekat kami untuk melihat dan merasakan langsung tekstur karpet impian Anda.`;
    return stripStarsAndEmojis(text);
  }

  getWarrantyMenu() {
    const config = this.getConfig();
    const w = config.warranty_info || {};
    const items = w.items || [];

    let text = `KETENTUAN GARANSI RESMI
${config.business.name.toUpperCase()}

${w.summary || 'Kami menjamin setiap karpet yang kami jual memiliki mutu terbaik dan bergaransi penuh.'}

Rincian Garansi:
`;

    items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.title}\n   ${item.desc}\n\n`;
    });

    text += `Alur Klaim Garansi:
${w.claim_steps || '1. Foto/videokan kendala karpet Anda\n2. Hubungi WhatsApp CS kami\n3. Tim teknisi akan memproses dalam 1x24 jam'}`;

    return stripStarsAndEmojis(text);
  }

  getPromoMenu() {
    const config = this.getConfig();
    const p = config.promo_info || {};
    const promos = p.active_promos || [];

    let text = `PROMO & PENAWARAN SPESIAL TERKINI
${config.business.name.toUpperCase()}

`;

    if (promos.length === 0) {
      text += `Saat ini belum ada promo aktif. Hubungi tim sales kami untuk penawaran khusus.\n`;
    } else {
      promos.forEach((pr, idx) => {
        text += `${idx + 1}. [${pr.badge || 'PROMO'}] ${pr.title}\n`;
        text += `   Penawaran: ${pr.discount}\n`;
        text += `   Keterangan: ${pr.desc}\n`;
        text += `   Periode: ${pr.valid_until}\n\n`;
      });
    }

    text += `Segera manfaatkan promo ini sebelum kuota habis. Sampaikan promo yang ingin Anda klaim kepada tim kami.`;
    return stripStarsAndEmojis(text);
  }

  getComplaintMenu() {
    const config = this.getConfig();
    const c = config.complaint_info || {};
    const wf = c.workflow || [];

    let text = `PUSAT PENGADUAN & KOMPLAIN PELANGGAN
${config.business.name.toUpperCase()}

Kepuasan Anda adalah prioritas utama kami. Bila terjadi ketidaksesuaian barang, kendala jahitan obras, keterlambatan pengiriman, atau keluhan teknisi, silakan sampaikan langsung kepada kami.

Jaminan Waktu Tanggap:
${c.sla || 'Maksimal 1x24 Jam Kerja'}

Hotline Pengaduan Langsung:
${c.contact_manager || config.business.phone_cs || config.business.phone}

Alur Penanganan Komplain:
`;

    wf.forEach((step, idx) => {
      text += `${step}\n`;
    });

    text += `\nSilakan ketikkan detail keluhan Anda di chat ini, tim Customer Care kami akan segera membuatkan tiket komplain dan menindaklanjutinya.`;
    return stripStarsAndEmojis(text);
  }

  getBranchesMenu() {
    const branches = this.getBranches();

    let text = `DAFTAR CABANG DAN SHOWROOM SULTAN CARPET\n`;
    text += `Kunjungi toko fisik dan galeri karpet kami di kota Anda:\n\n`;

    branches.forEach((b, idx) => {
      text += `${idx + 1}. Sultan Carpet ${b.city} (${b.area || 'Store'})\n`;
      text += `   Alamat: ${b.address}\n`;
      text += `   Jam Buka: ${b.hours}\n`;
      text += `   Telepon: ${b.phone}\n\n`;
    });

    text += `Silakan beri tahu kami nama kota atau nomor cabang yang ingin Anda ketahui lebih detail.`;
    return stripStarsAndEmojis(text);
  }

  getBranchDetail(branch) {
    if (!branch) return this.getBranchesMenu();

    return stripStarsAndEmojis(`${branch.name.toUpperCase()}
Area: ${branch.area || branch.city}

Alamat Lengkap:
${branch.address}

Jam Operasional:
${branch.hours}

Kontak Langsung:
${branch.phone}

Petunjuk Arah Google Maps:
${branch.maps_url || 'https://maps.google.com'}

Silakan sampaikan jika Anda ingin melihat cabang lain atau membutuhkan jadwal survey gratis.`);
  }

  getCatalogSelectionMenu() {
    const config = this.getConfig();
    const catalog = this.getCatalog();

    let text = `KOLEKSI PRODUK ${config.business.name.toUpperCase()}\n`;
    text += `${config.business.tagline}\n\n`;
    text += `Berikut daftar koleksi karpet unggulan kami:\n\n`;

    catalog.forEach((item, idx) => {
      text += `${idx + 1}. ${item.title}\n`;
      text += `   Harga: ${item.price}\n`;
      text += `   Spesifikasi: ${item.subtitle}\n`;
      text += `   Varian: ${item.footer}\n\n`;
    });

    text += `Silakan sebutkan nama produk atau nomor yang ingin Anda tanyakan lebih lengkap atau Anda pesan.`;
    return stripStarsAndEmojis(text);
  }

  getProductConfirmationMessage(product) {
    if (!product) return this.getCatalogSelectionMenu();

    return stripStarsAndEmojis(`RINCIAN PRODUK KARPET

Produk Pilihan:
${product.title}
Harga: ${product.price}
Spesifikasi: ${product.subtitle}
Varian / Ukuran: ${product.footer}

Pilihan langkah selanjutnya:
1. Pesan karpet ini (atau minta survey gratis)
2. Lihat foto dan spesifikasi lengkap
3. Lihat koleksi karpet lainnya

Silakan informasikan pilihan Anda.`);
  }

  getCatalogOverviewText() {
    return this.getCatalogSelectionMenu();
  }

  getServicesMenu() {
    const config = this.getConfig();
    const services = config.services || [];

    let text = `LAYANAN DAN JASA SPESIALIS KARPET\n`;
    text += `${config.business.name}\n\n`;

    if (services.length === 0) {
      text += `Belum ada data paket layanan yang tersedia saat ini.\n\n`;
    } else {
      services.forEach((s, idx) => {
        text += `${idx + 1}. ${s.name}\n`;
        text += `   Biaya: ${s.price}\n`;
        text += `   Keterangan: ${s.description}\n\n`;
      });
    }

    text += `Bila Anda membutuhkan konsultasi lebih lanjut atau booking jadwal, silakan beri tahu kami.`;
    return stripStarsAndEmojis(text);
  }

  getBusinessInfoMenu() {
    return this.getLocationMenu();
  }

  getFaqMenu() {
    const config = this.getConfig();
    const faqs = config.faqs || [];

    let text = `PERTANYAAN UMUM (FAQ) SEPUTAR KARPET\n`;
    text += `${config.business.name}\n\n`;

    if (faqs.length === 0) {
      text += `Belum ada FAQ yang ditambahkan.\n\n`;
    } else {
      faqs.forEach((item, idx) => {
        text += `Pertanyaan: ${item.q}\n`;
        text += `Jawaban: ${item.a}\n\n`;
      });
    }

    text += `Bila ada pertanyaan lain yang belum terjawab, kami siap membantu Anda secara langsung.`;
    return stripStarsAndEmojis(text);
  }

  getTicketStatusMessage(ticket) {
    if (!ticket) {
      return stripStarsAndEmojis(`Tiket Tidak Ditemukan

Maaf, nomor tiket yang Anda masukkan tidak terdaftar dalam sistem kami.
Silakan periksa kembali nomor tiket Anda atau hubungi kami untuk bantuan lebih lanjut.`);
    }

    const createdDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
    const updatedDate = ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';

    return stripStarsAndEmojis(`STATUS TIKET LAYANAN

ID Tiket: ${ticket.id}
Kategori: ${ticket.category || 'Layanan Umum'}
Nama Pelapor: ${ticket.name}
Status Saat Ini: ${ticket.status ? ticket.status.toUpperCase() : 'OPEN'}
Prioritas: ${ticket.priority || 'Normal'}
Waktu Dibuat: ${createdDate} WIB
Pembaruan Terakhir: ${updatedDate} WIB

Rincian:
"${ticket.description}"

Catatan Petugas:
${ticket.notes || 'Tiket sedang dalam penanganan oleh tim support.'}`);
  }

  getHumanCsPrompt() {
    const config = this.getConfig();
    const b = config.business;

    return stripStarsAndEmojis(`LAYANAN PELANGGAN (CUSTOMER SERVICE)

Permintaan Anda telah diteruskan ke petugas Customer Service ${b.name}.
Petugas kami akan segera membaca pesan Anda dan membalas secara langsung.

Silakan sampaikan pertanyaan, pesanan karpet, atau keluhan Anda di sini.`);
  }
}

module.exports = new MenuHandler();
