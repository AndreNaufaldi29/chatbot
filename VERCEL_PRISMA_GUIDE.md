# Panduan Integrasi Prisma ORM ke Vercel Postgres

Proyek ini telah dikonfigurasi penuh menggunakan **Prisma ORM** yang siap dihubungkan langsung ke **Vercel Postgres**, **Neon**, **Supabase**, maupun database PostgreSQL lokal.

---

## 1. Struktur File Prisma yang Disediakan

- **`prisma/schema.prisma`**: Skema data relasional lengkap sesuai arsitektur chatbot:
  - `BusinessProfile`: Pengaturan profil bisnis resmi Harbor.
  - `CatalogProduct`: Katalog produk keramik artisanal, harga, varian, dan foto produk.
  - `Branch`: Daftar showroom cabang fisik.
  - `Faq`: Pengetahuan tanya-jawab chatbot.
  - `ServiceTicket`: Tiket layanan pelanggan, kategori (Pembelian, Klaim Garansi, Pengaduan, Layanan Umum), prioritas, dan catatan admin.
  - `ChatMessage`: Riwayat pesan WhatsApp masuk & keluar secara real-time.
  - `PhoneMapping`: Pemetaan nomor telepon WhatsApp asli dan profil pelanggan.
- **`src/db/prisma.js`**: Singleton client Prisma untuk mencegah penipisan koneksi (*connection exhaustion*) pada Next.js hot-reload maupun Vercel Serverless Functions.
- **`src/services/dbService.js`**: Mengekspos `dbService.prisma` agar seluruh operasi database dapat menggunakan Prisma Client secara native.

---

## 2. Cara Menghubungkan ke Vercel Postgres

### Langkah 1: Buat Database di Vercel
1. Buka dashboard proyek Anda di [vercel.com](https://vercel.com).
2. Pilih tab **Storage**.
3. Klik **Create Database** dan pilih **Postgres** (ditenagai oleh Neon Serverless).
4. Klik **Connect Project** dan pilih repositori proyek ini.

### Langkah 2: Variabel Lingkungan Otomatis di Vercel
Saat Anda menghubungkan Vercel Postgres, Vercel secara otomatis menyuntikkan variabel berikut ke Environment Variables proyek Anda:
- `POSTGRES_PRISMA_URL`: URL koneksi dengan *connection pooling* (PgBouncer) untuk beban kerja serverless.
- `POSTGRES_URL_NON_POOLING`: URL koneksi langsung (*direct connection*) untuk eksekusi migrasi skema Prisma.
- `DATABASE_URL`: URL standar PostgreSQL.

> [!NOTE]
> File `prisma/schema.prisma` telah dikonfigurasi menggunakan `POSTGRES_PRISMA_URL` sebagai `url` dan `POSTGRES_URL_NON_POOLING` sebagai `directUrl`.

---

## 3. Menjalankan Migrasi Skema ke Vercel

Setelah database di Vercel terhubung atau variabel di `.env` telah diisi, Anda dapat menyinkronkan seluruh tabel dan indeks ke database cloud dengan satu perintah:

```bash
npm run db:push
```

Perintah di atas akan:
1. Membaca `prisma/schema.prisma`.
2. Membuat semua tabel (`catalog_products`, `service_tickets`, `chat_messages`, dll.) di Vercel Postgres secara otomatis.
3. Membuat semua indeks pencarian performa tinggi.

---

## 4. Perintah Tambahan (Scripts)

Di dalam `package.json` telah ditambahkan shortcut perintah Prisma:

| Perintah | Fungsi |
|---|---|
| `npm run postinstall` | Menjalankan `prisma generate` otomatis setiap kali proses build di Vercel dijalankan. |
| `npm run db:generate` | Men-generate ulang `@prisma/client` setelah mengubah `schema.prisma`. |
| `npm run db:push` | Menerapkan perubahan skema langsung ke database tanpa file migrasi rumit. |
| `npm run db:pull` | Membaca skema tabel dari database yang sudah ada ke `schema.prisma`. |
| `npm run db:studio` | Membuka antarmuka grafis (GUI) di browser untuk melihat dan mengedit data tabel secara visual. |

---

## 5. Penggunaan Prisma di Kode Aplikasi

Anda dapat mengimpor Prisma Client di route handler Next.js atau service backend:

```javascript
const prisma = require('./src/db/prisma');
// atau melalui dbService:
const dbService = require('./src/services/dbService');

// Contoh: Mengambil seluruh produk aktif
const products = await prisma.catalogProduct.findMany({
  orderBy: { id: 'asc' }
});

// Contoh: Membuat tiket baru
const ticket = await prisma.serviceTicket.create({
  data: {
    id: 'TKT-1234',
    sender: '628123456789',
    name: 'Budi Santoso',
    contact: '+628123456789',
    description: 'Ingin memesan The Everyday Set',
    category: 'Pembelian Produk',
    status: 'Open',
    priority: 'Tinggi'
  }
});
```
