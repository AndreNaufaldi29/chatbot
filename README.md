# 🤖 Chatbot WhatsApp Pelayanan dengan Next.js & Google Gemini AI

Aplikasi Chatbot WhatsApp enterprise untuk layanan pelanggan (Customer Service) otomatis yang diperkuat oleh **Google Gemini AI** dan **Dashboard Next.js modern (React 19 + Tailwind CSS v4)** dengan otentikasi sesi persisten `@whiskeysockets/baileys` (Multi-Device).

---

## ✨ Fitur Utama

### 1. 🧠 Integrasi Google Gemini AI (Super Responsif & Pintar)
- **Grounded Knowledge Base:** AI Gemini memahami katalog produk (*The Everyday Set*, *The Slow Pour-Over Set*, *The Organic Serving Platter*), harga, varian, alamat showroom (Jakarta, Bandung, Bali), jam operasional, FAQ (keamanan microwave/dishwasher), serta garansi pengiriman barang pecah 100% baru gratis.
- **Percakapan Kontekstual (Multi-Turn Memory):** Mengingat riwayat percakapan sebelumnya sehingga pelanggan dapat mengajukan pertanyaan lanjutan secara natural.
- **Pilihan Model Fleksibel:** Mendukung `gemini-2.0-flash` (ultra cepat & responsif), `gemini-1.5-flash`, dan `gemini-1.5-pro`.
- **Pengaturan Mudah via Dashboard & `.env`:** Masukkan Google Gemini API Key langsung melalui menu **Gemini AI Studio** di dashboard web atau melalui file `.env`.
- **Simulator AI Bawaan:** Uji coba respons AI langsung dari web dashboard sebelum pelanggan mencobanya di WhatsApp.

### 2. ⚡ Modern Full-Stack Dashboard (Next.js + Tailwind CSS v4)
- **Dashboard Next.js:** Dibangun menggunakan App Router, React 19, dan styling modern Tailwind CSS v4 dengan glassmorphism dan tema gelap elegan.
- **Live Chat Stream (Real-Time SSE):** Memantau pesan masuk dari pelanggan dan balasan otomatis (termasuk badge penanda respons AI Gemini) secara langsung.
- **Koneksi & QR Code Scanner:** Tampilan status koneksi live (🟢 Terhubung / 🟡 Menunggu Scan / 🔴 Terputus), QR Code real-time, tombol Restart Bot, dan Logout / Reset Sesi.
- **Manajemen Tiket Layanan:** Mengelola pesanan dan tiket keluhan pelanggan, filter status, prioritas, dan catatan petugas.
- **Katalog Produk:** Visualisasi kartu produk keramik artisanal dan tombol uji coba kirim pesan.
- **Kirim Pesan Manual:** Mengirim pesan resmi secara langsung dari dashboard ke nomor WhatsApp pelanggan.
- **Pengaturan Bisnis:** Mengubah profil bisnis, alamat cabang, jam operasional, dan parameter bot tanpa perlu mengedit kode.

### 3. 📱 Format Pesan Teks 100% Kompatibel Mobile
- Respon bot diformat dalam teks standar WhatsApp (*bold*, emoji, baris baru rapi) yang dijamin **100% muncul dan terbaca di aplikasi WhatsApp HP (Android, iOS) maupun WhatsApp Web/Desktop**.
- Navigasi angka mudah (`1` untuk Katalog, `2` untuk Cabang, `3` untuk CS manusia, `0` untuk Menu Utama).

---

## 🚀 Panduan Menjalankan

### 1. Konfigurasi Gemini API Key
Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey).
Lalu isi di file `.env`:
```env
GEMINI_API_KEY=AIzaSy...
PORT=3000
NODE_ENV=development
```
*(Atau Anda bisa langsung mengisinya melalui menu **Gemini AI Studio** di Web Dashboard).*

### 2. Menjalankan Aplikasi
Buka terminal di direktori proyek dan jalankan:
```bash
npm start
```
*(Atau: `node index.js`)*

Akses Web Dashboard di browser Anda:
```
http://localhost:3000
```
