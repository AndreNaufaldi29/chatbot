// Suppress noisy libsignal / Baileys internal decryption errors (Bad MAC, Over 2000 messages, etc.)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
function isNoisySessionError(args) {
  for (const arg of args) {
    if (!arg) continue;
    const str = typeof arg === 'string' ? arg : (arg.message || arg.stack || String(arg));
    if (
      str.includes('Failed to decrypt message with any known session') ||
      str.includes('Session error:') ||
      str.includes('Bad MAC') ||
      str.includes('Over 2000 messages into the future') ||
      str.includes('No matching sessions found for message') ||
      str.includes('Decrypted message with closed session')
    ) {
      return true;
    }
  }
  return false;
}
console.error = function (...args) {
  if (isNoisySessionError(args)) return;
  originalConsoleError.apply(console, args);
};
console.warn = function (...args) {
  if (isNoisySessionError(args)) return;
  originalConsoleWarn.apply(console, args);
};

// Also intercept process.stderr.write in case libsignal writes directly
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function (chunk, encoding, callback) {
  const str = typeof chunk === 'string' ? chunk : (chunk?.toString ? chunk.toString() : '');
  if (
    str.includes('Failed to decrypt message with any known session') ||
    str.includes('Session error:') ||
    str.includes('Bad MAC') ||
    str.includes('Over 2000 messages into the future') ||
    str.includes('No matching sessions found for message') ||
    str.includes('Decrypted message with closed session')
  ) {
    if (typeof encoding === 'function') encoding();
    else if (typeof callback === 'function') callback();
    return true;
  }
  return originalStderrWrite(chunk, encoding, callback);
};

const net = require('net');
const bot = require('./src/bot');
const { startServer } = require('./src/web/server');
const menuHandler = require('./src/handlers/menuHandler');

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
  console.log('====================================================');

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

  // 1. Start Web Dashboard
  await startServer(port);

  console.log(`\n🌐 Web Dashboard Siap: http://localhost:${port}`);
  console.log(`💡 Anda dapat memindai (scan) QR code langsung di browser atau melalui terminal.`);
  console.log('----------------------------------------------------\n');

  // 2. Initialize WhatsApp Socket
  console.log('[Sistem] Menginisialisasi koneksi WhatsApp...');
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

// Handle uncaught exceptions to prevent process termination on transient socket disconnects
process.on('uncaughtException', (err) => {
  const msg = err?.message || String(err || '');
  if (
    msg.includes('Bad MAC') ||
    msg.includes('Over 2000 messages') ||
    msg.includes('SessionError') ||
    msg.includes('No matching sessions') ||
    msg.includes('Decrypted message with closed session') ||
    msg.includes('Connection Closed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE')
  ) {
    console.warn('[System] Mengabaikan error soket sementara:', msg);
    return;
  }
  console.error('[Uncaught Exception]', err);
});

// Auto-clean corrupted ratchet session on unhandled rejection
process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason || '');
  if (
    msg.includes('Bad MAC') ||
    msg.includes('Over 2000 messages') ||
    msg.includes('SessionError') ||
    msg.includes('No matching sessions')
  ) {
    bot.cleanCorruptedRatchetSessions();
    return;
  }
  console.error('[Unhandled Rejection]', reason);
});

main().catch(err => {
  console.error('[Fatal Error] Gagal menjalankan chatbot:', err);
});
