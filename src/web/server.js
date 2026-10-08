const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bot = require('../bot');
const ticketService = require('../services/ticketService');
const chatService = require('../services/chatService');
const menuHandler = require('../handlers/menuHandler');
const geminiService = require('../services/geminiService');
const groqService = require('../services/groqService');
const aiService = require('../services/aiService');
const prisma = require('../db/prisma');
const dbService = require('../services/dbService');
const protectionService = require('../services/protectionService');
const sessionManager = require('../services/sessionManager');
const ragService = require('../services/ragService');
const crawlerService = require('../services/crawlerService');
const phoneService = require('../services/phoneService');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(express.static(path.join(__dirname, '../../public'), { index: false }));

// Store active SSE clients
let sseClients = [];

// Send SSE event to all connected web clients
function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (err) {
      // Client may have disconnected
    }
  });
}

// Hook bot events to SSE broadcast
bot.on('status_change', (data) => broadcastSSE('status_change', data));
bot.on('qr', (data) => broadcastSSE('qr', data));
bot.on('chat_log', (data) => {
  chatService.addMessage(data);
  dbService.saveChatMessage(data).catch(() => {});
  broadcastSSE('chat_log', data);
});
bot.on('ticket_created', (data) => broadcastSSE('ticket_created', data));
bot.on('human_cs_requested', (data) => broadcastSSE('human_cs_requested', data));
bot.on('chats_updated', (data) => broadcastSSE('chats_updated', data));
protectionService.on('human_handoff_started', (data) => broadcastSSE('human_handoff_started', data));
protectionService.on('human_handoff_ended', (data) => broadcastSSE('human_handoff_ended', data));

// Server-Sent Events Endpoint
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const clientId = Date.now();
  const clientObj = { id: clientId, res };
  sseClients.push(clientObj);

  // Send initial state immediately
  res.write(`event: init\ndata: ${JSON.stringify(bot.getStatus())}\n\n`);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// API Status
app.get('/api/status', (req, res) => {
  res.json(bot.getStatus());
});

// Chat History & Conversations Endpoints (1 User 1 Chat WhatsApp Layout)
app.get('/api/chats', (req, res) => {
  const conversations = chatService.getConversations();
  if (bot && typeof bot.resolveLidPhone === 'function') {
    for (const c of conversations) {
      if (c.jid && phoneService.isLid(c.jid) && !c.phone) {
        bot.resolveLidPhone(c.jid, c.senderName).catch(() => {});
      }
    }
  }
  res.json(conversations);
});

app.get('/api/chats/messages', (req, res) => {
  const messages = chatService.getAllMessages();
  res.json(messages);
});

app.delete('/api/chats', async (req, res) => {
  try {
    await chatService.clearAll();
    broadcastSSE('chats_cleared', {});
    res.json({ success: true, message: 'Seluruh riwayat obrolan dibersihkan.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membersihkan riwayat obrolan: ' + err.message });
  }
});

app.delete('/api/chats/:jid', async (req, res) => {
  try {
    const { jid } = req.params;
    await chatService.clearConversation(jid);
    broadcastSSE('chat_deleted', { jid });
    res.json({ success: true, message: `Riwayat obrolan berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus obrolan: ' + err.message });
  }
});

// Update Customer Profile (Name & Real Phone Number)
app.patch('/api/chats/:jid/profile', (req, res) => {
  const { jid } = req.params;
  const { name, phone } = req.body;
  if (!name && !phone) {
    return res.status(400).json({ error: 'Nama atau nomor telepon wajib diisi.' });
  }

  const updated = chatService.updateCustomerProfile(jid, { name, phone });
  broadcastSSE('profile_updated', {
    jid,
    name: updated?.senderName || name,
    phone: updated?.phone || phone,
    formattedPhone: updated?.formattedPhone
  });
  res.json({ success: true, updated });
});

// Restart Bot Connection
app.post('/api/restart', async (req, res) => {
  try {
    const result = await bot.restart();
    res.json({ success: true, message: result?.message || 'Memulai ulang koneksi WhatsApp...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout and Reset Session
app.post('/api/logout', async (req, res) => {
  try {
    const result = await bot.logout();
    res.json({ success: true, message: result?.message || 'Sesi WhatsApp dibersihkan. QR Code baru akan dibuat.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tickets Management
app.get('/api/tickets', (req, res) => {
  const tickets = ticketService.getAllTickets();
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const { sender, name, contact, description, priority, category, status, notes } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Nama dan deskripsi wajib diisi.' });
  }
  let ticket = ticketService.createTicket({ sender, name, contact, description, priority, category });
  if ((status && status !== 'Open') || (notes && notes.trim())) {
    const updated = ticketService.updateTicketStatus(ticket.id, status, notes);
    if (updated) ticket = updated;
  }
  broadcastSSE('ticket_created', ticket);
  res.json(ticket);
});

app.patch('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes, category, priority } = req.body;
  const updated = ticketService.updateTicketStatus(id, status, notes, category, priority);
  if (!updated) {
    return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
  }
  broadcastSSE('ticket_updated', updated);
  res.json(updated);
});

app.delete('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const success = ticketService.deleteTicket(id);
  if (!success) {
    return res.status(404).json({ error: 'Tiket tidak ditemukan atau sudah dihapus.' });
  }
  broadcastSSE('ticket_deleted', { id: String(id).toUpperCase() });
  res.json({ success: true, id: String(id).toUpperCase() });
});

// =========================================================================
// Protections & Anti-Ban Management Endpoints
// =========================================================================
app.get('/api/protections', (req, res) => {
  const config = protectionService.getConfig();
  const stats = protectionService.getStats();
  const blockedUsers = typeof protectionService.getBlockedUsersList === 'function' ? protectionService.getBlockedUsersList() : [];
  res.json({
    success: true,
    config,
    stats,
    blockedUsers
  });
});

app.post('/api/protections/config', (req, res) => {
  try {
    const newConfig = req.body;
    const config = menuHandler.getConfig();
    if (!config.protections) config.protections = {};

    // Deep merge untuk menjaga sub-properti tidak hilang
    for (const key of Object.keys(newConfig)) {
      if (typeof newConfig[key] === 'object' && newConfig[key] !== null && !Array.isArray(newConfig[key])) {
        config.protections[key] = {
          ...(config.protections[key] || {}),
          ...newConfig[key]
        };
      } else {
        config.protections[key] = newConfig[key];
      }
    }

    menuHandler.saveConfig(config);
    broadcastSSE('protections_updated', config.protections);
    res.json({ success: true, protections: config.protections, message: 'Pengaturan proteksi & anti-spam berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/protections/reset-stats', (req, res) => {
  try {
    const stats = protectionService.resetStats();
    res.json({ success: true, stats, message: 'Statistik proteksi berhasil direset.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/protections/unblock', (req, res) => {
  try {
    const { jid } = req.body;
    if (!jid) return res.status(400).json({ error: 'JID nomor telepon wajib disertakan.' });
    const unblocked = protectionService.unblockUser(jid);
    res.json({ success: true, unblocked, jid, message: `Nomor ${jid} berhasil dibuka blokirnya.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Human Handoff Control (Takeover or release conversation)
app.post('/api/chats/:jid/handoff', (req, res) => {
  const { jid } = req.params;
  const { active, reason } = req.body;
  const isHandoff = active !== false;
  const aiEnabled = !isHandoff;
  sessionManager.setHumanMode(jid, isHandoff, reason || (isHandoff ? 'Admin takeover via Web Dashboard' : 'Returned to bot by Admin'));
  broadcastSSE('handoff_status_changed', { jid, active: isHandoff, aiEnabled });
  broadcastSSE('contact_ai_toggled', { jid, aiEnabled, isHumanHandoff: isHandoff });
  res.json({ success: true, jid, active: isHandoff, aiEnabled });
});

// Per-Contact AI On/Off Toggle (supports both ai-toggle and toggle-ai aliases)
app.post(['/api/chats/:jid/ai-toggle', '/api/chats/:jid/toggle-ai'], (req, res) => {
  const { jid } = req.params;
  const { enabled, aiEnabled: bodyAiEnabled, isHumanHandoff, reason } = req.body;
  const aiEnabled = enabled !== undefined ? Boolean(enabled) : (bodyAiEnabled !== undefined ? Boolean(bodyAiEnabled) : !isHumanHandoff);
  const isHandoff = !aiEnabled;
  sessionManager.setHumanMode(jid, isHandoff, reason || (isHandoff ? 'AI dinonaktifkan oleh Admin (Mode CS Manusia)' : 'AI diaktifkan kembali oleh Admin'));
  broadcastSSE('contact_ai_toggled', { jid, aiEnabled, isHumanHandoff: isHandoff });
  broadcastSSE('handoff_status_changed', { jid, active: isHandoff, aiEnabled });
  res.json({ success: true, jid, aiEnabled, isHumanHandoff: isHandoff });
});

// Opt-In / Consent Control
app.post('/api/chats/:jid/opt-in', (req, res) => {
  const { jid } = req.params;
  const { optedIn, reason } = req.body;
  protectionService.setOptIn(jid, optedIn !== false, reason || 'Admin update via Web Dashboard');
  broadcastSSE('opt_in_changed', { jid, optedIn: optedIn !== false });
  res.json({ success: true, jid, optedIn: optedIn !== false });
});

// Human Handoff List & Configuration Endpoints
app.get('/api/handoffs', (req, res) => {
  try {
    const handoffs = protectionService.getAllHandoffs ? protectionService.getAllHandoffs() : [];
    const config = protectionService.getConfig().human_handoff || {};
    const stats = protectionService.getStats();
    res.json({ success: true, handoffs, config, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/handoffs/config', (req, res) => {
  try {
    const { enabled, keywords, release_keywords, auto_expire_hours, takeover_notice, release_notice } = req.body;
    const config = menuHandler.getConfig();
    if (!config.protections) config.protections = {};
    if (!config.protections.human_handoff) config.protections.human_handoff = {};

    if (enabled !== undefined) config.protections.human_handoff.enabled = Boolean(enabled);
    if (Array.isArray(keywords)) config.protections.human_handoff.keywords = keywords;
    if (Array.isArray(release_keywords)) config.protections.human_handoff.release_keywords = release_keywords;
    if (auto_expire_hours !== undefined) config.protections.human_handoff.auto_expire_hours = Number(auto_expire_hours);
    if (takeover_notice !== undefined) config.protections.human_handoff.takeover_notice = String(takeover_notice);
    if (release_notice !== undefined) config.protections.human_handoff.release_notice = String(release_notice);

    menuHandler.saveConfig(config);
    broadcastSSE('protections_updated', config.protections);
    res.json({ success: true, human_handoff: config.protections.human_handoff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prisma Database Management Endpoints
app.get('/api/db/status', async (req, res) => {
  try {
    const prismaReady = !!(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);
    let isConnected = false;
    let counts = { products: 0, tickets: 0, chats: 0 };

    if (prismaReady) {
      try {
        const [ticketCount, productCount, chatCount] = await Promise.all([
          prisma.serviceTicket.count().catch(() => 0),
          prisma.catalogProduct.count().catch(() => 0),
          prisma.chatMessage.count().catch(() => 0),
        ]);
        counts = { products: productCount, tickets: ticketCount, chats: chatCount };
        isConnected = true;
      } catch (e) {
        isConnected = false;
      }
    }

    res.json({
      connected: isConnected,
      databaseUrl: process.env.DATABASE_URL ? 'Terkonfigurasi' : 'Belum diatur',
      prisma: {
        installed: true,
        version: '6.4.1',
        schema: 'prisma/schema.prisma',
        vercelReady: prismaReady,
        models: [
          'BusinessProfile',
          'CatalogProduct',
          'Branch',
          'Faq',
          'ServiceTicket',
          'ChatMessage',
          'PhoneMapping'
        ]
      },
      counts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/config', async (req, res) => {
  try {
    const { databaseUrl, host, port, user, password, database } = req.body;
    let finalUrl = databaseUrl;

    if (!finalUrl && host) {
      const encodedPass = encodeURIComponent(password || '');
      const userPass = password ? `${user || 'postgres'}:${encodedPass}` : (user || 'postgres');
      finalUrl = `postgresql://${userPass}@${host}:${port || 5432}/${database || 'chatbot_wa'}?schema=public`;
    }

    if (!finalUrl) {
      return res.status(400).json({ success: false, error: 'Database URL tidak valid.' });
    }

    // Update .env file
    try {
      const envPath = path.join(__dirname, '../../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      const envVars = {
        DATABASE_URL: finalUrl,
        POSTGRES_PRISMA_URL: finalUrl.includes('?') ? `${finalUrl}&pgbouncer=true` : `${finalUrl}?pgbouncer=true`,
        POSTGRES_URL_NON_POOLING: finalUrl
      };

      for (const [key, val] of Object.entries(envVars)) {
        process.env[key] = val;
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}="${val}"`);
        } else {
          envContent += `\n${key}="${val}"`;
        }
      }
      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (e) {
      console.warn('[Server] Gagal memperbarui .env:', e.message);
    }

    // Broadcast status to web dashboard
    broadcastSSE('db_status', {
      connected: true,
      prisma: { installed: true, vercelReady: true }
    });

    res.json({
      success: true,
      message: 'Konfigurasi Prisma Database URL berhasil disimpan ke .env!',
      databaseUrl: finalUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bot & Business Configuration
app.get('/api/config', (req, res) => {
  res.json(menuHandler.getConfig());
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig || (!newConfig.business && !newConfig.faqs && !newConfig.catalog)) {
    return res.status(400).json({ error: 'Format konfigurasi tidak valid.' });
  }
  const saved = menuHandler.saveConfig(newConfig);
  if (saved) {
    if (newConfig.ai) {
      aiService.syncConfig(newConfig.ai);
    }
    if (newConfig.faqs) {
      broadcastSSE('faqs_updated', newConfig.faqs);
    }
    res.json({ success: true, message: 'Pengaturan berhasil disimpan!' });
  } else {
    res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
  }
});

// =========================================================================
// FAQ & Customer Behavior Knowledge Base Endpoints
// =========================================================================
app.get('/api/faqs', (req, res) => {
  const config = menuHandler.getConfig();
  res.json(config.faqs || []);
});

app.post('/api/faqs', (req, res) => {
  try {
    const { id, q, a, category, source } = req.body;
    if (!q || !a) {
      return res.status(400).json({ error: 'Pertanyaan (q) dan Jawaban (a) wajib diisi.' });
    }
    const config = menuHandler.getConfig();
    if (!config.faqs) config.faqs = [];

    const newId = id || `faq-${Date.now()}`;
    const newFaq = {
      id: newId,
      q: q.trim(),
      a: a.trim(),
      category: category ? category.trim() : 'Umum',
      source: source || 'Input Admin',
      updatedAt: new Date().toISOString()
    };

    const existingIndex = config.faqs.findIndex(f => f.id === newId);
    if (existingIndex !== -1) {
      config.faqs[existingIndex] = { ...config.faqs[existingIndex], ...newFaq };
    } else {
      config.faqs.unshift(newFaq);
    }

    menuHandler.saveConfig(config);
    broadcastSSE('faqs_updated', config.faqs);
    res.json({ success: true, faq: newFaq, faqs: config.faqs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/faqs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { q, a, category, source } = req.body;
    const config = menuHandler.getConfig();
    if (!config.faqs) config.faqs = [];

    const index = config.faqs.findIndex(f => String(f.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Item Tanya-Jawab tidak ditemukan.' });
    }

    config.faqs[index] = {
      ...config.faqs[index],
      q: q !== undefined ? q.trim() : config.faqs[index].q,
      a: a !== undefined ? a.trim() : config.faqs[index].a,
      category: category !== undefined ? category.trim() : config.faqs[index].category,
      source: source || config.faqs[index].source,
      updatedAt: new Date().toISOString()
    };

    menuHandler.saveConfig(config);
    broadcastSSE('faqs_updated', config.faqs);
    res.json({ success: true, faq: config.faqs[index], faqs: config.faqs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/faqs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = menuHandler.getConfig();
    if (!config.faqs) config.faqs = [];

    const beforeLen = config.faqs.length;
    config.faqs = config.faqs.filter(f => String(f.id) !== String(id));

    if (config.faqs.length === beforeLen) {
      return res.status(404).json({ error: 'Item Tanya-Jawab tidak ditemukan.' });
    }

    menuHandler.saveConfig(config);
    broadcastSSE('faqs_updated', config.faqs);
    res.json({ success: true, faqs: config.faqs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to discover and analyze customer question patterns from real chats
app.get('/api/customer-questions', (req, res) => {
  try {
    const messages = chatService.getAllMessages();
    const config = menuHandler.getConfig();
    const existingFaqs = config.faqs || [];

    const questionKeywords = ['?', 'apakah', 'berapa', 'bisa', 'ada', 'gimana', 'bagaimana', 'kenapa', 'kapan', 'dimana', 'harga', 'ongkir', 'ukuran', 'diskon', 'promo', 'warna', 'bahan', 'garansi', 'obras', 'pasang', 'survey', 'katalog', 'sample', 'contoh', 'tipe', 'roll', 'meter'];
    
    const detected = [];
    const seenTexts = new Set();

    messages
      .filter(m => m.direction === 'in' && m.text && typeof m.text === 'string')
      .reverse()
      .forEach(m => {
        const text = m.text.trim();
        const lower = text.toLowerCase();
        if (text.length < 4 || text.length > 250) return;
        
        const isQuestion = lower.includes('?') || questionKeywords.some(kw => lower.includes(kw));
        if (isQuestion && !seenTexts.has(lower)) {
          seenTexts.add(lower);
          
          const isLearned = existingFaqs.some(f => 
            f.q.toLowerCase().includes(lower) || lower.includes(f.q.toLowerCase().slice(0, 15))
          );

          detected.push({
            id: m.id || `cq-${Date.now()}-${Math.random()}`,
            text: text,
            senderName: m.senderName || 'Pelanggan',
            phone: m.phone || '',
            jid: m.jid,
            timestamp: m.timestamp || new Date().toISOString(),
            isLearned
          });
        }
      });

    res.json(detected.slice(0, 30));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Carpet Categories Management (GET, POST, DELETE)
app.get('/api/categories', (req, res) => {
  const categories = menuHandler.getCategories();
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  try {
    const { id, name, slug, icon, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
    }
    const config = menuHandler.getConfig();
    if (!config.carpet_categories) {
      config.carpet_categories = menuHandler.getCategories();
    }

    const catId = id || `kat-${Date.now().toString().slice(-4)}`;
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingIndex = config.carpet_categories.findIndex(c => c.id === catId);

    const newCategory = {
      id: catId,
      slug: catSlug,
      name: name.trim(),
      icon: icon || '🏷️',
      description: description ? description.trim() : 'Koleksi karpet pilihan dari Sultan Carpet Gallery.'
    };

    if (existingIndex !== -1) {
      config.carpet_categories[existingIndex] = newCategory;
    } else {
      config.carpet_categories.push(newCategory);
    }

    menuHandler.saveConfig(config);
    broadcastSSE('categories_updated', config.carpet_categories);
    res.json({ success: true, category: newCategory, categories: config.carpet_categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = menuHandler.getConfig();
    if (!config.carpet_categories) {
      config.carpet_categories = menuHandler.getCategories();
    }
    config.carpet_categories = config.carpet_categories.filter(c => c.id !== id);
    menuHandler.saveConfig(config);
    broadcastSSE('categories_updated', config.carpet_categories);
    res.json({ success: true, categories: config.carpet_categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catalog Management (GET, POST, PUT, DELETE)
app.get('/api/catalog', (req, res) => {
  const catalog = menuHandler.getCatalog();
  res.json(catalog);
});

app.post('/api/catalog', (req, res) => {
  try {
    const { title, price, subtitle, footer, code, url, image, imageBase64, category } = req.body;
    if (!title || !price) {
      return res.status(400).json({ error: 'Nama produk (title) dan harga (price) wajib diisi.' });
    }

    const config = menuHandler.getConfig();
    if (!config.catalog) {
      config.catalog = [];
    }

    // Determine next numeric ID
    const numericIds = config.catalog
      .map(c => parseInt(c.id, 10))
      .filter(n => !isNaN(n));
    const nextId = numericIds.length > 0 ? String(Math.max(...numericIds) + 1) : "1";

    let finalImagePath = image || 'catalog/karpet-masjid-turki.jpg';

    // Handle base64 image upload if user uploaded a file
    if (imageBase64 && typeof imageBase64 === 'string') {
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : (mimeType.split('/')[1] || 'png');
        const fileName = `product-${nextId}-${Date.now()}.${ext}`;

        const publicCatalogDir = path.join(__dirname, '../../public/catalog');
        const assetsCatalogDir = path.join(__dirname, '../../assets/catalog');

        if (!fs.existsSync(publicCatalogDir)) {
          fs.mkdirSync(publicCatalogDir, { recursive: true });
        }
        if (!fs.existsSync(assetsCatalogDir)) {
          fs.mkdirSync(assetsCatalogDir, { recursive: true });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(path.join(publicCatalogDir, fileName), buffer);
        fs.writeFileSync(path.join(assetsCatalogDir, fileName), buffer);

        finalImagePath = `catalog/${fileName}`;
      }
    }

    const newProduct = {
      id: nextId,
      category: (category || 'Karpet Masjid & Musholla').trim(),
      code: (code || title.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()).slice(0, 25),
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : 'Karpet mutu tinggi berkualitas prima dari Sultan Carpet Gallery.',
      footer: footer ? footer.trim() : 'Tersedia berbagai pilihan ukuran dan warna eksklusif.',
      price: price.trim().startsWith('Rp') ? price.trim() : `Rp ${price.trim()}`,
      buttonText: 'Lihat Koleksi ›',
      url: url ? url.trim() : `https://sultancarpet.co.id/products/${nextId}`,
      image: finalImagePath
    };

    config.catalog.push(newProduct);
    const saved = menuHandler.saveConfig(config);
    if (!saved) {
      return res.status(500).json({ error: 'Gagal menyimpan produk baru ke database.' });
    }

    broadcastSSE('catalog_updated', config.catalog);
    res.json({ success: true, product: newProduct, catalog: config.catalog });
  } catch (err) {
    console.error('[Catalog API] Error adding product:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/catalog/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, subtitle, footer, code, url, image, imageBase64, category } = req.body;

    const config = menuHandler.getConfig();
    if (!config.catalog) {
      return res.status(404).json({ error: 'Katalog kosong.' });
    }

    const index = config.catalog.findIndex(p => String(p.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    let finalImagePath = image || config.catalog[index].image;

    // Handle base64 image update
    if (imageBase64 && typeof imageBase64 === 'string') {
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : (mimeType.split('/')[1] || 'png');
        const fileName = `product-${id}-${Date.now()}.${ext}`;

        const publicCatalogDir = path.join(__dirname, '../../public/catalog');
        const assetsCatalogDir = path.join(__dirname, '../../assets/catalog');

        if (!fs.existsSync(publicCatalogDir)) fs.mkdirSync(publicCatalogDir, { recursive: true });
        if (!fs.existsSync(assetsCatalogDir)) fs.mkdirSync(assetsCatalogDir, { recursive: true });

        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(path.join(publicCatalogDir, fileName), buffer);
        fs.writeFileSync(path.join(assetsCatalogDir, fileName), buffer);

        finalImagePath = `catalog/${fileName}`;
      }
    }

    const existing = config.catalog[index];
    config.catalog[index] = {
      ...existing,
      category: category !== undefined ? category.trim() : (existing.category || 'Karpet Masjid & Musholla'),
      title: title !== undefined ? title.trim() : existing.title,
      price: price !== undefined ? (price.trim().startsWith('Rp') ? price.trim() : `Rp ${price.trim()}`) : existing.price,
      subtitle: subtitle !== undefined ? subtitle.trim() : existing.subtitle,
      footer: footer !== undefined ? footer.trim() : existing.footer,
      code: code !== undefined ? code.trim() : existing.code,
      url: url !== undefined ? url.trim() : existing.url,
      image: finalImagePath
    };

    const saved = menuHandler.saveConfig(config);
    if (!saved) {
      return res.status(500).json({ error: 'Gagal memperbarui produk.' });
    }

    broadcastSSE('catalog_updated', config.catalog);
    res.json({ success: true, product: config.catalog[index], catalog: config.catalog });
  } catch (err) {
    console.error('[Catalog API] Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/catalog/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = menuHandler.getConfig();
    if (!config.catalog) {
      return res.status(404).json({ error: 'Katalog kosong.' });
    }

    const beforeLength = config.catalog.length;
    config.catalog = config.catalog.filter(p => String(p.id) !== String(id));

    if (config.catalog.length === beforeLength) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const saved = menuHandler.saveConfig(config);
    if (!saved) {
      return res.status(500).json({ error: 'Gagal menghapus produk.' });
    }

    broadcastSSE('catalog_updated', config.catalog);
    res.json({ success: true, catalog: config.catalog });
  } catch (err) {
    console.error('[Catalog API] Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cache to prevent rapid duplicate messages (e.g. rapid double click, network retry)
const recentSends = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentSends.entries()) {
    if (now - timestamp > 15000) recentSends.delete(key);
  }
}, 30000);

// Send Custom WhatsApp Message (Supports direct web reply to JID / LID, phone, and optional images)
app.post('/api/send', async (req, res) => {
  const { jid, phone, message, senderName, clientMessageId, image, imageBase64, imagePath } = req.body;
  const target = jid || phone;
  if (!target || (!message && !image && !imageBase64)) {
    return res.status(400).json({ error: 'Tujuan pengiriman (JID atau nomor telepon) dan pesan/gambar wajib diisi.' });
  }

  // Deduplication check: ignore identical message to the same target within 4 seconds
  const dedupKey = `${target}_${String(message || image || '').trim()}`;
  const now = Date.now();
  const lastSent = recentSends.get(dedupKey);
  if (lastSent && now - lastSent < 4000) {
    console.log(`[API Send] Mengabaikan duplicate send ke ${target} dalam kurun waktu 4 detik`);
    return res.json({ success: true, duplicate: true, message: 'Pesan duplikat diabaikan.' });
  }
  recentSends.set(dedupKey, now);

  try {
    const result = await bot.sendCustomMessage(
      target,
      message,
      senderName || 'Admin (Balasan Web)',
      phone,
      clientMessageId,
      { image, imageBase64, imagePath }
    );
    res.json({ success: true, result });
  } catch (err) {
    console.error('[API Send Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// AI Test Connection Endpoint (Supports Groq & Gemini)
app.post('/api/ai/test', async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;
    const activeProvider = provider || aiService.getActiveProvider();
    const result = await aiService.testConnection(activeProvider, apiKey, model);
    if (result.success && apiKey) {
      if (activeProvider === 'groq') {
        groqService.syncApiKey(apiKey, result.model || model);
      } else {
        geminiService.syncApiKey(apiKey, result.model || model);
      }
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Gemini AI Test Connection Endpoint (Backward Compatibility)
app.post('/api/gemini/test', async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const result = await geminiService.testConnection(apiKey, model);
    if (result.success && apiKey) {
      geminiService.syncApiKey(apiKey, result.model || model);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Playground / Simulation Endpoint (Supports Groq & Gemini)
app.post('/api/ai/simulate', async (req, res) => {
  try {
    const { message, senderName, provider } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Pesan simulasi wajib diisi.' });
    }
    let reply;
    const chosenProvider = provider || aiService.getActiveProvider();
    if (chosenProvider === 'groq') {
      reply = await groqService.generateReply('simulated_session', message, senderName || 'Pengunjung Web');
    } else if (chosenProvider === 'gemini') {
      reply = await geminiService.generateReply('simulated_session', message, senderName || 'Pengunjung Web');
    } else {
      reply = await aiService.generateReply('simulated_session', message, senderName || 'Pengunjung Web');
    }

    if (!reply) {
      return res.status(400).json({ 
        error: `AI ${chosenProvider.toUpperCase()} tidak menghasilkan balasan. Pastikan API Key telah diisi dengan benar di Pengaturan atau file .env.` 
      });
    }

    const ragDocs = ragService.search(message, 3);
    res.json({ success: true, reply, provider: chosenProvider, ragDocs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RAG Status & Retrieval Endpoints for AI Studio
app.get('/api/rag/status', (req, res) => {
  try {
    const status = ragService.getStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/rag/search', (req, res) => {
  try {
    const { query, topK } = req.body;
    const results = ragService.search(query || '', topK || 4);
    const context = ragService.retrieveContext(query || '', topK || 4);
    res.json({ success: true, results, context });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Web Crawler & Scraper Endpoints (RAG Web Knowledge Ingestion)
app.get('/api/crawler/pages', (req, res) => {
  try {
    const pages = crawlerService.getAllPages();
    res.json({ success: true, count: pages.length, pages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/crawler/crawl', async (req, res) => {
  try {
    const { url, maxPages, followLinks } = req.body;
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      return res.status(400).json({ success: false, error: 'URL website tidak valid (wajib diawali http:// atau https://).' });
    }
    const result = await crawlerService.crawl(url.trim(), { maxPages: maxPages || 1, followLinks: Boolean(followLinks) });
    broadcastSSE('rag_updated', { source: 'crawler', url });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/crawler/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = crawlerService.deletePage(id);
    broadcastSSE('rag_updated', { source: 'crawler', deletedId: id });
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/crawler/pages', (req, res) => {
  try {
    crawlerService.clearAll();
    broadcastSSE('rag_updated', { source: 'crawler', cleared: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Gemini AI Simulation Endpoint (Backward Compatibility)
app.post('/api/gemini/simulate', async (req, res) => {
  try {
    const { message, senderName } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Pesan simulasi wajib diisi.' });
    }
    const reply = await aiService.generateReply('simulated_session', message, senderName || 'Pengunjung Web');
    if (!reply) {
      return res.status(400).json({ 
        error: 'AI tidak menghasilkan balasan. Pastikan API Key telah diisi dengan benar di Pengaturan atau file .env.' 
      });
    }
    const ragDocs = ragService.search(message, 3);
    res.json({ success: true, reply, provider: aiService.getActiveProvider(), ragDocs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static assets for catalog images
app.use('/catalog', express.static(path.join(__dirname, '../../assets/catalog')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

async function startServer(port = 3000) {
  const dev = process.env.NODE_ENV !== 'production';
  const next = require('next');
  const nextApp = next({ dev, dir: path.join(__dirname, '../../') });
  const handle = nextApp.getRequestHandler();

  console.log('[WebDashboard] Mengompilasi Next.js Dashboard (React + Tailwind v4)...');
  await nextApp.prepare();

  // All remaining routes handled by Next.js App Router
  app.use((req, res) => {
    return handle(req, res);
  });

  return new Promise((resolve) => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`[WebDashboard] Next.js Dashboard dan API aktif di: http://0.0.0.0:${port}`);
      resolve(app);
    });
  });
}

module.exports = { app, startServer };
