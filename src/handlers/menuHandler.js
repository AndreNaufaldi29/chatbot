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
          name: "Harbor",
          tagline: "Stoneware & Mindful Living",
          phone: "0812-3456-7890",
          hours: "Senin - Jumat 09:00 - 18:00 WIB"
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
    const clean = String(identifier).trim().toLowerCase();
    const catalog = this.getCatalog();

    return catalog.find((item, idx) => 
      String(item.id).toLowerCase() === clean ||
      String(idx + 1) === clean ||
      String(item.code || '').toLowerCase() === clean ||
      item.title.toLowerCase().includes(clean)
    ) || null;
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

    return stripStarsAndEmojis(`Halo ${senderName}, selamat datang di ${b.name} (${b.tagline || 'Stoneware & Mindful Living'}).

Layanan yang dapat kami bantu:
1. Katalog Koleksi Produk
2. Lokasi dan Jam Buka Showroom
3. Layanan Pelanggan (Customer Service)

Silakan beri tahu kami apa yang ingin Anda tanyakan atau pilih salah satu layanan di atas.`);
  }

  getBranchesMenu() {
    const branches = this.getBranches();

    let text = `DAFTAR CABANG DAN SHOWROOM HARBOR\n`;
    text += `Temukan produk stoneware kami di toko fisik terdekat:\n\n`;

    branches.forEach((b, idx) => {
      text += `${idx + 1}. Harbor ${b.city} (${b.area || 'Store'})\n`;
      text += `   Alamat: ${b.address}\n`;
      text += `   Jam Buka: ${b.hours}\n\n`;
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

Silakan sampaikan jika Anda ingin melihat cabang lain atau membutuhkan informasi lebih lanjut.`);
  }

  getCatalogSelectionMenu() {
    const config = this.getConfig();
    const catalog = this.getCatalog();

    let text = `KOLEKSI PRODUK ${config.business.name.toUpperCase()}\n`;
    text += `${config.business.tagline || 'Stoneware & Mindful Living'}\n\n`;
    text += `Berikut daftar koleksi stoneware artisanal kami:\n\n`;

    catalog.forEach((item, idx) => {
      text += `${idx + 1}. ${item.title}\n`;
      text += `   Harga: ${item.price}\n`;
      text += `   Keterangan: ${item.subtitle}\n`;
      text += `   Varian: ${item.footer}\n\n`;
    });

    text += `Silakan sebutkan nama produk atau nomor yang menarik perhatian Anda untuk informasi lebih lengkap.`;
    return stripStarsAndEmojis(text);
  }

  getProductConfirmationMessage(product) {
    if (!product) return this.getCatalogSelectionMenu();

    return stripStarsAndEmojis(`RINCIAN PRODUK

Produk yang Anda pilih:
${product.title}
Harga: ${product.price}
Keterangan: ${product.subtitle}
Varian: ${product.footer}

Pilihan langkah selanjutnya:
1. Pesan produk ini
2. Lihat foto dan spesifikasi lengkap
3. Lihat koleksi produk lainnya

Silakan informasikan pilihan Anda.`);
  }

  getCatalogOverviewText() {
    return this.getCatalogSelectionMenu();
  }

  getServicesMenu() {
    const config = this.getConfig();
    const services = config.services || [];

    let text = `DAFTAR LAYANAN DAN SPESIALISASI\n`;
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

    text += `Bila Anda membutuhkan konsultasi lebih lanjut, silakan beri tahu kami.`;
    return stripStarsAndEmojis(text);
  }

  getBusinessInfoMenu() {
    const config = this.getConfig();
    const b = config.business;

    return stripStarsAndEmojis(`INFORMASI SHOWROOM DAN JAM OPERASIONAL
${b.name}

Jam Operasional:
${b.hours}

Alamat Showroom:
${b.address}

Google Maps:
${b.maps_url || 'https://maps.google.com'}

Kontak Resmi:
- Telepon/WhatsApp: ${b.phone}
- Email: ${b.email}
- Website: ${b.website}`);
  }

  getFaqMenu() {
    const config = this.getConfig();
    const faqs = config.faqs || [];

    let text = `PERTANYAAN UMUM (FAQ)\n`;
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

Deskripsi:
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

Silakan sampaikan pertanyaan, permohonan pembelian, atau kendala Anda di sini.`);
  }
}

module.exports = new MenuHandler();
