const fs = require('fs');
const path = require('path');
let downloadMediaMessage;
try {
  downloadMediaMessage = require('@whiskeysockets/baileys').downloadMediaMessage;
} catch (_) {}

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
   * Helper to unwrap viewOnce, ephemeral, or documentWithCaption containers
   */
  unwrapMessage(message) {
    if (!message) return null;
    let m = message;
    if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
    if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
    if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
    if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
    return m;
  }

  /**
   * Helper to extract inner imageMessage
   */
  extractImageMessage(message) {
    const m = this.unwrapMessage(message);
    return m?.imageMessage || null;
  }

  /**
   * Helper to extract inner videoMessage
   */
  extractVideoMessage(message) {
    const m = this.unwrapMessage(message);
    return m?.videoMessage || null;
  }

  /**
   * Helper to extract inner audioMessage (voice notes & audio)
   */
  extractAudioMessage(message) {
    const m = this.unwrapMessage(message);
    return m?.audioMessage || null;
  }

  /**
   * Detect media type from WhatsApp message
   */
  detectMediaType(message) {
    const m = this.unwrapMessage(message);
    if (!m) return null;
    if (m.imageMessage) return 'image';
    if (m.videoMessage) return 'video';
    if (m.audioMessage) return 'audio';
    if (m.documentMessage) return 'document';
    if (m.stickerMessage) return 'sticker';
    return null;
  }

  /**
   * Download and save incoming or outbound WhatsApp image message to local disk.
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

    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 0) return webPath;
      } catch (_) {}
    }

    if (msg._buffer && Buffer.isBuffer(msg._buffer)) {
      fs.writeFileSync(filePath, msg._buffer);
      return webPath;
    }

    if (typeof downloadMediaMessage === 'function') {
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
    }

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
   * Download and save incoming or outbound WhatsApp video message to local disk.
   * Returns a web-accessible URL path like '/media/vid_123456.mp4', or null.
   */
  async downloadAndSaveVideo(msg, sock = null) {
    if (!msg || !msg.message) return null;

    const vidMsg = this.extractVideoMessage(msg.message);
    if (!vidMsg) return null;

    this.ensureMediaDir();

    const msgId = msg.key?.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ext = vidMsg.mimetype?.includes('quicktime') ? 'mov' : 'mp4';
    const fileName = `vid_${msgId}.${ext}`;
    const filePath = path.join(MEDIA_DIR, fileName);
    const webPath = `/media/${fileName}`;

    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 0) return webPath;
      } catch (_) {}
    }

    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        sock ? { reuploadRequest: (update) => sock.updateMediaMessage(update) } : {}
      );

      if (buffer && buffer.length > 0) {
        fs.writeFileSync(filePath, buffer);
        console.log(`[MediaService] 🎬 Berhasil menyimpan video WhatsApp: ${fileName} (${buffer.length} bytes)`);
        return webPath;
      }
    } catch (err) {
      console.warn(`[MediaService] Download video WhatsApp via socket gagal: ${err.message}`);
    }

    // Fallback: save thumbnail if full video download failed
    if (vidMsg.jpegThumbnail) {
      try {
        const thumbBuf = Buffer.isBuffer(vidMsg.jpegThumbnail)
          ? vidMsg.jpegThumbnail
          : Buffer.from(vidMsg.jpegThumbnail, 'base64');
        if (thumbBuf && thumbBuf.length > 0) {
          const thumbFileName = `thumb_vid_${msgId}.jpg`;
          const thumbFilePath = path.join(MEDIA_DIR, thumbFileName);
          fs.writeFileSync(thumbFilePath, thumbBuf);
          return `/media/${thumbFileName}`;
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Download and save incoming WhatsApp voice note or audio message to local disk.
   * Returns a web-accessible URL path like '/media/audio_123456.ogg', or null.
   */
  async downloadAndSaveAudio(msg, sock = null) {
    if (!msg || !msg.message) return null;

    const audioMsg = this.extractAudioMessage(msg.message);
    if (!audioMsg) return null;

    this.ensureMediaDir();

    const msgId = msg.key?.id || `audio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let ext = 'ogg';
    if (audioMsg.mimetype?.includes('mp4') || audioMsg.mimetype?.includes('m4a')) ext = 'm4a';
    else if (audioMsg.mimetype?.includes('mpeg') || audioMsg.mimetype?.includes('mp3')) ext = 'mp3';

    const fileName = `audio_${msgId}.${ext}`;
    const filePath = path.join(MEDIA_DIR, fileName);
    const webPath = `/media/${fileName}`;

    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 0) return webPath;
      } catch (_) {}
    }

    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        sock ? { reuploadRequest: (update) => sock.updateMediaMessage(update) } : {}
      );

      if (buffer && buffer.length > 0) {
        fs.writeFileSync(filePath, buffer);
        console.log(`[MediaService] 🎙️ Berhasil menyimpan audio/voice note WhatsApp: ${fileName} (${buffer.length} bytes)`);
        return webPath;
      }
    } catch (err) {
      console.warn(`[MediaService] Download audio WhatsApp via socket gagal: ${err.message}`);
    }

    return null;
  }

  /**
   * Universal downloader: automatically detects and saves image, video, or audio message
   */
  async downloadAndSaveMedia(msg, sock = null) {
    if (!msg || !msg.message) return null;

    const mediaType = this.detectMediaType(msg.message);
    if (!mediaType) return null;

    if (mediaType === 'image') {
      const url = await this.downloadAndSaveImage(msg, sock);
      return url ? { mediaType: 'image', url } : null;
    }

    if (mediaType === 'video') {
      const url = await this.downloadAndSaveVideo(msg, sock);
      return url ? { mediaType: 'video', url } : null;
    }

    if (mediaType === 'audio') {
      const url = await this.downloadAndSaveAudio(msg, sock);
      return url ? { mediaType: 'audio', url } : null;
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
