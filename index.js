require('dotenv').config();
const net = require('net');
const bot = require('./src/bot');
const { startServer } = require('./src/web/server');
const menuHandler = require('./src/handlers/menuHandler');
const dbService = require('./src/services/dbService');

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function main() {
  console.clear();
  console.log('====================================================');
  console.log('  🤖 CHATBOT WHATSAPP PELAYANAN (CUSTOMER SERVICE)  ');
  console.log('          POWERED BY WHATSAPP-WEB.JS (CHROME)       ');
  console.log('====================================================');

  // Inisialisasi & Sinkronisasi Database Informasi Toko
  try {
    await dbService.syncStoreInfoToDb();
    const dbStoreInfo = await dbService.loadAllStoreInfo();
    if (dbStoreInfo && Object.keys(dbStoreInfo).length > 0) {
      menuHandler.saveConfig(dbStoreInfo);
      console.log(`[Database] Sinkronisasi ${dbStoreInfo.catalog?.length || 0} produk katalog dari database ke runtime bot berhasil!`);
    }
  } catch (dbErr) {
    console.warn('[Database] Peringatan sinkronisasi database toko:', dbErr.message);
  }

  const config = menuHandler.getConfig();
  const port = Number(process.env.PORT || config.server?.port || 3000);

  // Check if port is already in use by another instance
  const isAvailable = await checkPortAvailable(port);
  if (!isAvailable) {
    console.error(`\n❌ [PORT BENTROK] Port ${port} saat ini sedang digunakan oleh proses lain.`);
    console.error(`👉 Kemungkinan bot atau server Next.js sudah berjalan di terminal lain.`);
    console.error(`👉 Silakan tutup proses tersebut terlebih dahulu sebelum menjalankan 'npm start'.\n`);
    process.exit(1);
  }

  // 1. Start Web Dashboard & Webhook Server
  await startServer(port);

  console.log(`\n🌐 Web Dashboard Siap: http://localhost:${port}`);
  console.log('----------------------------------------------------\n');

  // 2. Initialize whatsapp-web.js Connection
  console.log('[Sistem] Menginisialisasi koneksi WhatsApp (whatsapp-web.js)...');
  await bot.init();
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n[Sistem] Menutup layanan chatbot WhatsApp...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Sistem] Menghentikan bot...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

main().catch(err => {
  console.error('[Fatal Error] Gagal menjalankan chatbot:', err);
});
