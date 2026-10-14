// Suppress noisy libsignal / Baileys internal decryption errors & SessionEntry dumps
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleLog = console.log;

function isNoisySessionMessage(args) {
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'object') {
      if (
        arg.constructor?.name === 'SessionEntry' ||
        (arg._chains && typeof arg.registrationId !== 'undefined')
      ) {
        return true;
      }
    }
    const str = typeof arg === 'string' ? arg : (arg.message || arg.stack || String(arg));
    if (
      str.includes('Failed to decrypt message with any known session') ||
      str.includes('Session error:') ||
      str.includes('Bad MAC') ||
      str.includes('Over 2000 messages into the future') ||
      str.includes('No matching sessions found for message') ||
      str.includes('Decrypted message with closed session') ||
      str.includes('Closing session:') ||
      str.includes('Opening session:') ||
      str.includes('Session already closed') ||
      str.includes('Session already open') ||
      str.includes('SessionEntry')
    ) {
      return true;
    }
  }
  return false;
}

console.error = function (...args) {
  if (isNoisySessionMessage(args)) return;
  originalConsoleError.apply(console, args);
};
console.warn = function (...args) {
  if (isNoisySessionMessage(args)) return;
  originalConsoleWarn.apply(console, args);
};
console.info = function (...args) {
  if (isNoisySessionMessage(args)) return;
  originalConsoleInfo.apply(console, args);
};
console.log = function (...args) {
  if (isNoisySessionMessage(args)) return;
  originalConsoleLog.apply(console, args);
};

// Also intercept process.stdout.write & process.stderr.write in case libsignal writes directly
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

function isNoisyStreamChunk(chunk) {
  const str = typeof chunk === 'string' ? chunk : (chunk?.toString ? chunk.toString() : '');
  return (
    str.includes('Failed to decrypt message with any known session') ||
    str.includes('Session error:') ||
    str.includes('Bad MAC') ||
    str.includes('Over 2000 messages into the future') ||
    str.includes('No matching sessions found for message') ||
    str.includes('Decrypted message with closed session') ||
    str.includes('Closing session:') ||
    str.includes('Opening session:') ||
    str.includes('Session already closed') ||
    str.includes('Session already open') ||
    str.includes('SessionEntry')
  );
}

process.stdout.write = function (chunk, encoding, callback) {
  if (isNoisyStreamChunk(chunk)) {
    if (typeof encoding === 'function') encoding();
    else if (typeof callback === 'function') callback();
    return true;
  }
  return originalStdoutWrite(chunk, encoding, callback);
};

process.stderr.write = function (chunk, encoding, callback) {
  if (isNoisyStreamChunk(chunk)) {
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
