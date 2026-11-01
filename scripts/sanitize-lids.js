const fs = require('fs');
const path = require('path');
const phoneService = require('../src/services/phoneService');

console.log('[Sanitize] Memulai pembersihan data LID...');

// 1. Sanitize chats.json
const chatsFile = path.join(__dirname, '../data/chats.json');
if (fs.existsSync(chatsFile)) {
  try {
    const raw = fs.readFileSync(chatsFile, 'utf8');
    const messages = JSON.parse(raw || '[]');
    let modified = 0;
    for (const msg of messages) {
      if (!msg) continue;
      if (msg.jid && (msg.jid.includes('@lid') || phoneService.isLid(msg.jid))) {
        const phone = phoneService.getPhone(msg.jid) || (phoneService.isRealPhone(msg.phone) ? phoneService.cleanPhoneNumber(msg.phone) : null);
        if (phone) {
          msg.jid = `${phone}@s.whatsapp.net`;
          msg.phone = phone;
          modified++;
        }
      }
    }
    if (modified > 0) {
      fs.writeFileSync(chatsFile, JSON.stringify(messages, null, 2), 'utf8');
      console.log(`[Sanitize] ${modified} pesan di chats.json berhasil dimigrasikan dari @lid ke nomor asli.`);
    } else {
      console.log('[Sanitize] chats.json sudah bersih.');
    }
  } catch (e) {
    console.error('[Sanitize Error chats.json]:', e.message);
  }
}

// 2. Sanitize synced_chats.json
const syncedFile = path.join(__dirname, '../data/synced_chats.json');
if (fs.existsSync(syncedFile)) {
  try {
    const raw = fs.readFileSync(syncedFile, 'utf8');
    const synced = JSON.parse(raw || '{}');
    let modified = 0;
    const newSynced = {};
    for (const [key, val] of Object.entries(synced)) {
      if (key.includes('@lid') || phoneService.isLid(key)) {
        const phone = phoneService.getPhone(key);
        if (phone && phoneService.isRealPhone(phone)) {
          const newKey = `${phone}@s.whatsapp.net`;
          newSynced[newKey] = {
            ...val,
            jid: newKey
          };
          modified++;
        }
      } else {
        newSynced[key] = val;
      }
    }
    if (modified > 0) {
      fs.writeFileSync(syncedFile, JSON.stringify(newSynced, null, 2), 'utf8');
      console.log(`[Sanitize] ${modified} kontak di synced_chats.json berhasil dimigrasikan dari @lid.`);
    }
  } catch (e) {
    console.error('[Sanitize Error synced_chats.json]:', e.message);
  }
}

// 3. Sanitize handoff.json
const handoffFile = path.join(__dirname, '../data/handoff.json');
if (fs.existsSync(handoffFile)) {
  try {
    const raw = fs.readFileSync(handoffFile, 'utf8');
    const handoff = JSON.parse(raw || '{}');
    let modified = 0;
    const newHandoff = {};
    for (const [key, val] of Object.entries(handoff)) {
      if (key.includes('@lid') || phoneService.isLid(key)) {
        const phone = phoneService.getPhone(key);
        if (phone && phoneService.isRealPhone(phone)) {
          const newKey = `${phone}@s.whatsapp.net`;
          newHandoff[newKey] = {
            ...val,
            jid: newKey,
            phone
          };
          modified++;
        }
      } else {
        newHandoff[key] = val;
      }
    }
    if (modified > 0) {
      fs.writeFileSync(handoffFile, JSON.stringify(newHandoff, null, 2), 'utf8');
      console.log(`[Sanitize] ${modified} sesi handoff.json berhasil dimigrasikan dari @lid.`);
    }
  } catch (e) {
    console.error('[Sanitize Error handoff.json]:', e.message);
  }
}

// 4. Sanitize opt_in.json
const optInFile = path.join(__dirname, '../data/opt_in.json');
if (fs.existsSync(optInFile)) {
  try {
    const raw = fs.readFileSync(optInFile, 'utf8');
    const optIn = JSON.parse(raw || '{}');
    let modified = 0;
    const newOptIn = {};
    for (const [key, val] of Object.entries(optIn)) {
      if (key.includes('@lid') || phoneService.isLid(key)) {
        const phone = phoneService.getPhone(key);
        if (phone && phoneService.isRealPhone(phone)) {
          const newKey = `${phone}@s.whatsapp.net`;
          newOptIn[newKey] = val;
          modified++;
        }
      } else {
        newOptIn[key] = val;
      }
    }
    if (modified > 0) {
      fs.writeFileSync(optInFile, JSON.stringify(newOptIn, null, 2), 'utf8');
      console.log(`[Sanitize] ${modified} sesi opt_in.json berhasil dimigrasikan dari @lid.`);
    }
  } catch (e) {
    console.error('[Sanitize Error opt_in.json]:', e.message);
  }
}

console.log('✅ [Sanitize] Pembersihan data selesai.');

