const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const MEDIA_DIR = path.join(__dirname, '../../public/media');

class MediaService {
  constructor() {
    this.ensureMediaDir();
  }

  ensureMediaDir() {
    try {
      if (!fs.existsSync(MEDIA_DIR)) {
        fs.mkdirSync(MEDIA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[MediaService] Gagal membuat direktori media:', err.message);
    }
  }

  getMediaDir() {
    this.ensureMediaDir();
    return MEDIA_DIR;
  }

  /**
   * Helper to extract inner imageMessage from various WA message wrappings
   */
  extractImageMessage(message) {
    if (!message) return null;
    let m = message;
    if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
    if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
    if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
    if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
    return m.imageMessage || null;
  }

  /**
   * Download and save incoming or outbound WhatsApp image message to local disk.
   * Returns a web-accessible URL path like '/media/img_123456.jpg', or null.
   */
  async downloadAndSaveImage(msg, sock = null) {
    if (!msg || !msg.message) return null;

    const imgMsg = this.extractImageMessage(msg.message);
    if (!imgMsg) return null;

    this.ensureMediaDir();

    const msgId = msg.key?.id || `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ext = imgMsg.mimetype?.includes('png') ? 'png' : 'jpg';
    const fileName = `img_${msgId}.${ext}`;
    const filePath = path.join(MEDIA_DIR, fileName);
    const webPath = `/media/${fileName}`;

    // 1. If already saved on disk, return existing web path
    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 0) {
          return webPath;
        }
      } catch (_) {}
    }

    // 2. Attempt full download using Baileys downloadMediaMessage
    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        sock ? { reuploadRequest: (update) => sock.updateMediaMessage(update) } : {}
      );

      if (buffer && buffer.length > 0) {
        fs.writeFileSync(filePath, buffer);
        console.log(`[MediaService] ✅ Berhasil menyimpan gambar WhatsApp: ${fileName} (${buffer.length} bytes)`);
        return webPath;
      }
    } catch (err) {
      console.warn(`[MediaService] Download media WhatsApp via socket gagal (${err.message}). Menggunakan thumbnail...`);
    }

    // 3. Fallback: Save jpegThumbnail if full media download failed/expired
    if (imgMsg.jpegThumbnail) {
      try {
        const thumbBuf = Buffer.isBuffer(imgMsg.jpegThumbnail)
          ? imgMsg.jpegThumbnail
          : Buffer.from(imgMsg.jpegThumbnail, 'base64');
        if (thumbBuf && thumbBuf.length > 0) {
          const thumbFileName = `thumb_${msgId}.jpg`;
          const thumbFilePath = path.join(MEDIA_DIR, thumbFileName);
          fs.writeFileSync(thumbFilePath, thumbBuf);
          console.log(`[MediaService] 🖼️ Menggunakan thumbnail lokal: ${thumbFileName}`);
          return `/media/${thumbFileName}`;
        }
      } catch (thumbErr) {
        console.warn('[MediaService] Gagal menyimpan thumbnail:', thumbErr.message);
      }
    }

    return null;
  }

  /**
   * Save uploaded base64 data to public/media
   */
  saveBase64Image(base64Data, customId = null) {
    if (!base64Data || typeof base64Data !== 'string') return null;
    try {
      this.ensureMediaDir();
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const b64 = matches ? matches[2] : base64Data;
      const mime = matches ? matches[1] : 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : 'jpg';

      const fileId = customId || `sent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const fileName = `${fileId}.${ext}`;
      const filePath = path.join(MEDIA_DIR, fileName);

      const buffer = Buffer.from(b64, 'base64');
      fs.writeFileSync(filePath, buffer);
      return `/media/${fileName}`;
    } catch (err) {
      console.error('[MediaService] Gagal menyimpan gambar base64:', err.message);
      return null;
    }
  }

  /**
   * Save Buffer to public/media
   */
  saveBufferImage(buffer, customId = null, ext = 'jpg') {
    if (!Buffer.isBuffer(buffer)) return null;
    try {
      this.ensureMediaDir();
      const fileId = customId || `sent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const fileName = `${fileId}.${ext}`;
      const filePath = path.join(MEDIA_DIR, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/media/${fileName}`;
    } catch (err) {
      console.error('[MediaService] Gagal menyimpan gambar buffer:', err.message);
      return null;
    }
  }
}

module.exports = new MediaService();
