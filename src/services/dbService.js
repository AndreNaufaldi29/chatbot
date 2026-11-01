const prisma = require('../db/prisma');
const fs = require('fs');
const path = require('path');

class DbService {
  constructor() {
    this.prisma = prisma;
    this.isPrismaConnected = false;
    this.lastCheck = 0;
  }

  async checkPrisma() {
    const now = Date.now();
    // Re-check at most once every 30 seconds if offline
    if (!this.isPrismaConnected && now - this.lastCheck < 30000) {
      return false;
    }
    this.lastCheck = now;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.isPrismaConnected = true;
      return true;
    } catch (e) {
      this.isPrismaConnected = false;
      return false;
    }
  }

  // ================= TICKETS =================
  async getAllTickets() {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        const tickets = await this.prisma.serviceTicket.findMany({
          orderBy: { createdAt: 'desc' }
        });
        if (tickets && tickets.length > 0) {
          return tickets.map(r => ({
            id: r.id,
            sender: r.sender,
            name: r.name,
            contact: r.contact,
            description: r.description,
            category: r.category,
            status: r.status,
            priority: r.priority,
            notes: r.notes,
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString()
          }));
        }
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }

    // JSON Fallback
    try {
      const file = path.join(__dirname, '../../data/tickets.json');
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
      }
    } catch (e) {}
    return [];
  }

  async saveTicket(ticket) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.prisma.serviceTicket.upsert({
          where: { id: ticket.id },
          update: {
            name: ticket.name || 'Pelanggan',
            contact: ticket.contact || '-',
            description: ticket.description || '-',
            category: ticket.category || 'Layanan Umum',
            status: ticket.status || 'Open',
            priority: ticket.priority || 'Normal',
            notes: ticket.notes || '',
            updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : new Date()
          },
          create: {
            id: ticket.id,
            sender: ticket.sender || '-',
            name: ticket.name || 'Pelanggan',
            contact: ticket.contact || '-',
            description: ticket.description || '-',
            category: ticket.category || 'Layanan Umum',
            status: ticket.status || 'Open',
            priority: ticket.priority || 'Normal',
            notes: ticket.notes || '',
            createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
            updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : new Date()
          }
        });
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }

    // Save to JSON as mirror/fallback
    try {
      const file = path.join(__dirname, '../../data/tickets.json');
      let tickets = [];
      if (fs.existsSync(file)) {
        tickets = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
      }
      const idx = tickets.findIndex(t => t.id === ticket.id);
      if (idx !== -1) {
        tickets[idx] = ticket;
      } else {
        tickets.unshift(ticket);
      }
      fs.writeFileSync(file, JSON.stringify(tickets, null, 2), 'utf8');
    } catch (e) {}
    return true;
  }

  async updateTicketStatus(id, status, notes = null, category = null, priority = null, description = null) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        const data = { updatedAt: new Date() };
        if (status) data.status = status;
        if (notes !== null) data.notes = notes;
        if (category) data.category = category;
        if (priority) data.priority = priority;
        if (description !== null && description !== undefined) data.description = description;

        const updated = await this.prisma.serviceTicket.update({
          where: { id },
          data
        });
        if (updated) {
          return {
            id: updated.id,
            sender: updated.sender,
            name: updated.name,
            contact: updated.contact,
            description: updated.description,
            category: updated.category,
            status: updated.status,
            priority: updated.priority,
            notes: updated.notes,
            createdAt: updated.createdAt ? updated.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : new Date().toISOString()
          };
        }
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }

    // JSON Fallback
    try {
      const file = path.join(__dirname, '../../data/tickets.json');
      if (fs.existsSync(file)) {
        const tickets = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
        const idx = tickets.findIndex(t => t.id === id);
        if (idx !== -1) {
          if (status) tickets[idx].status = status;
          if (notes !== null) tickets[idx].notes = notes;
          if (category) tickets[idx].category = category;
          if (priority) tickets[idx].priority = priority;
          tickets[idx].updatedAt = new Date().toISOString();
          fs.writeFileSync(file, JSON.stringify(tickets, null, 2), 'utf8');
          return tickets[idx];
        }
      }
    } catch (e) {}
    return null;
  }

  async deleteTicket(id) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.prisma.serviceTicket.delete({
          where: { id }
        });
      } catch (err) {}
    }
    try {
      const file = path.join(__dirname, '../../data/tickets.json');
      if (fs.existsSync(file)) {
        const tickets = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
        const filtered = tickets.filter(t => t.id !== id);
        fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf8');
      }
    } catch (e) {}
    return true;
  }

  // ================= CATALOG PRODUCTS =================
  async getCatalog() {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        const products = await this.prisma.catalogProduct.findMany({
          orderBy: { id: 'asc' }
        });
        if (products && products.length > 0) {
          return products.map(r => ({
            id: String(r.id),
            code: r.code,
            category: r.category || 'Karpet Masjid & Musholla',
            title: r.title,
            subtitle: r.subtitle,
            footer: r.footer,
            price: r.price,
            buttonText: r.buttonText,
            url: r.url,
            image: r.image
          }));
        }
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }

    // Fallback config.json
    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configFile)) {
        const conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
        return conf.catalog || [];
      }
    } catch (e) {}
    return [];
  }

  getCategories() {
    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configFile)) {
        const conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
        return conf.carpet_categories || [];
      }
    } catch (e) {}
    return [];
  }

  async addCatalogProduct(product) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        const created = await this.prisma.catalogProduct.create({
          data: {
            code: product.code || product.title.replace(/\s+/g, '-').toUpperCase(),
            category: product.category || 'Karpet Masjid & Musholla',
            title: product.title,
            subtitle: product.subtitle || '',
            footer: product.footer || '',
            price: product.price,
            buttonText: product.buttonText || 'Lihat Koleksi ›',
            url: product.url || '',
            image: product.image || 'catalog/karpet-masjid-turki.jpg'
          }
        });
        if (created) {
          return {
            id: String(created.id),
            code: created.code,
            category: created.category,
            title: created.title,
            subtitle: created.subtitle,
            footer: created.footer,
            price: created.price,
            buttonText: created.buttonText,
            url: created.url,
            image: created.image
          };
        }
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }

    return null;
  }

  // ================= CHAT MESSAGES =================
  async saveChatMessage(msg) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.prisma.chatMessage.upsert({
          where: { id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` },
          update: {},
          create: {
            id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            jid: msg.jid,
            phone: msg.phone,
            senderName: msg.senderName,
            direction: msg.direction || 'in',
            text: msg.text || '',
            mediaType: msg.mediaType || 'text',
            image: msg.image || msg.video || msg.audio || msg.mediaUrl || null,
            isAi: !!msg.isAi,
            createdAt: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }
        });
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }
  }

  async clearAllChatMessages() {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.prisma.chatMessage.deleteMany({});
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }
  }

  async deleteChatMessagesByJid(jids = []) {
    if (!Array.isArray(jids) || jids.length === 0) return;
    const cleanJids = jids.map(j => String(j).trim()).filter(Boolean);
    if (cleanJids.length === 0) return;

    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.prisma.chatMessage.deleteMany({
          where: {
            OR: [
              { jid: { in: cleanJids } },
              { phone: { in: cleanJids } }
            ]
          }
        });
      } catch (err) {
        this.isPrismaConnected = false;
      }
    }
  }

  // ================= INFORMASI TOKO & STORE DATABASE =================
  async ensureStoreTables() {
    const isReady = await this.checkPrisma();
    if (!isReady) return false;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS store_settings (
          id VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return true;
    } catch (e) {
      console.warn('[DbService] Gagal memastikan tabel store_settings:', e.message);
      return false;
    }
  }

  async getStoreSetting(key) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.ensureStoreTables();
        const rows = await this.prisma.$queryRawUnsafe(
          `SELECT value FROM store_settings WHERE id = $1 LIMIT 1`,
          key
        );
        if (rows && rows.length > 0 && rows[0].value) {
          return JSON.parse(rows[0].value);
        }
      } catch (e) {
        console.warn(`[DbService] Gagal membaca store_setting ${key}:`, e.message);
      }
    }

    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configFile)) {
        const conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
        return conf[key] || null;
      }
    } catch (e) {}
    return null;
  }

  async saveStoreSetting(key, data) {
    const isReady = await this.checkPrisma();
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);

    if (isReady) {
      try {
        await this.ensureStoreTables();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO store_settings (id, value, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          key,
          jsonStr
        );
      } catch (e) {
        console.warn(`[DbService] Gagal menyimpan store_setting ${key} ke DB:`, e.message);
      }
    }

    // Mirror to config.json
    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      let conf = {};
      if (fs.existsSync(configFile)) {
        conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
      }
      conf[key] = typeof data === 'string' ? JSON.parse(data) : data;
      fs.writeFileSync(configFile, JSON.stringify(conf, null, 2), 'utf8');
    } catch (e) {}

    return true;
  }

  async saveAllStoreInfo(fullConfig) {
    if (!fullConfig || typeof fullConfig !== 'object') return false;

    const storeKeys = [
      'business',
      'owner_info',
      'schedule_info',
      'location_info',
      'branches',
      'warranty_info',
      'promo_info',
      'complaint_info',
      'carpet_categories',
      'catalog'
    ];

    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        await this.ensureStoreTables();

        // 1. Simpan ke tabel store_settings di PostgreSQL
        for (const key of storeKeys) {
          if (fullConfig[key] !== undefined) {
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO store_settings (id, value, updated_at)
               VALUES ($1, $2, CURRENT_TIMESTAMP)
               ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
              key,
              JSON.stringify(fullConfig[key])
            );
          }
        }

        // 2. Sinkronkan ke tabel business_profile bila ada perubahan profil toko
        if (fullConfig.business) {
          const b = fullConfig.business;
          const first = await this.prisma.businessProfile.findFirst({ orderBy: { id: 'asc' } }).catch(() => null);
          if (first) {
            await this.prisma.businessProfile.update({
              where: { id: first.id },
              data: {
                name: b.name || 'Rumah Indah Carpet Gallery',
                tagline: b.tagline || '',
                phone: b.phone || '',
                email: b.email || '',
                website: b.website || '',
                address: b.address || '',
                mapsUrl: b.maps_url || '',
                hours: b.hours || '',
                updatedAt: new Date()
              }
            }).catch(() => {});
          } else {
            await this.prisma.businessProfile.create({
              data: {
                name: b.name || 'Rumah Indah Carpet Gallery',
                tagline: b.tagline || '',
                phone: b.phone || '',
                email: b.email || '',
                website: b.website || '',
                address: b.address || '',
                mapsUrl: b.maps_url || '',
                hours: b.hours || ''
              }
            }).catch(() => {});
          }
        }

        // 3. Sinkronkan ke tabel branches bila ada data cabang
        if (Array.isArray(fullConfig.branches) && fullConfig.branches.length > 0) {
          try {
            await this.prisma.branch.deleteMany({}).catch(() => {});
            for (const br of fullConfig.branches) {
              await this.prisma.branch.create({
                data: {
                  name: br.name || 'Cabang Galeri',
                  city: br.city || '',
                  area: br.area || '',
                  address: br.address || '',
                  hours: br.hours || '',
                  phone: br.phone || '',
                  mapsUrl: br.maps_url || ''
                }
              }).catch(() => {});
            }
          } catch (e) {}
        }

        // 4. Sinkronkan ke tabel catalog_products bila ada data katalog produk
        if (Array.isArray(fullConfig.catalog) && fullConfig.catalog.length > 0) {
          try {
            for (const prod of fullConfig.catalog) {
              const code = prod.code || prod.title.replace(/\s+/g, '-').toUpperCase();
              await this.prisma.catalogProduct.upsert({
                where: { code },
                update: {
                  title: prod.title,
                  subtitle: prod.subtitle || '',
                  footer: prod.footer || '',
                  price: prod.price || '',
                  buttonText: prod.buttonText || 'Lihat Koleksi ›',
                  url: prod.url || '',
                  image: prod.image || ''
                },
                create: {
                  code,
                  title: prod.title,
                  subtitle: prod.subtitle || '',
                  footer: prod.footer || '',
                  price: prod.price || '',
                  buttonText: prod.buttonText || 'Lihat Koleksi ›',
                  url: prod.url || '',
                  image: prod.image || ''
                }
              }).catch(() => {});
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('[DbService] Error sync store info to DB:', err.message);
      }
    }

    // Selalu simpan ke config.json sebagai cadangan lokal (mirroring)
    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      let conf = {};
      if (fs.existsSync(configFile)) {
        conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
      }
      const merged = { ...conf, ...fullConfig };
      fs.writeFileSync(configFile, JSON.stringify(merged, null, 2), 'utf8');
    } catch (e) {}

    return true;
  }

  async loadAllStoreInfo() {
    const isReady = await this.checkPrisma();
    let dbConfig = {};

    if (isReady) {
      try {
        await this.ensureStoreTables();
        const rows = await this.prisma.$queryRawUnsafe(`SELECT id, value FROM store_settings`);
        if (rows && Array.isArray(rows) && rows.length > 0) {
          for (const row of rows) {
            try {
              dbConfig[row.id] = JSON.parse(row.value);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('[DbService] Gagal membaca store_settings dari DB:', err.message);
      }
    }

    let fileConfig = {};
    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configFile)) {
        fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
      }
    } catch (e) {}

    return {
      ...fileConfig,
      ...dbConfig
    };
  }

  async syncStoreInfoToDb() {
    const isReady = await this.checkPrisma();
    if (!isReady) return false;

    try {
      await this.ensureStoreTables();
      const countResult = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM store_settings`);
      const count = countResult?.[0]?.count || 0;

      if (count === 0) {
        console.log('[DbService] Melakukan inisialisasi awal database Informasi Toko ke PostgreSQL...');
        const configFile = path.join(__dirname, '../../config/config.json');
        if (fs.existsSync(configFile)) {
          const conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
          await this.saveAllStoreInfo(conf);
          console.log('[DbService] Seluruh data Informasi Toko berhasil di-migrasi ke PostgreSQL!');
        }
      }
      return true;
    } catch (err) {
      console.warn('[DbService] syncStoreInfoToDb error:', err.message);
      return false;
    }
  }

  async getStoreInfoDbStatus() {
    const isConnected = await this.checkPrisma();
    let tablesStatus = {
      store_settings: 0,
      business_profile: 0,
      branches: 0,
      catalog_products: 0
    };

    if (isConnected) {
      try {
        await this.ensureStoreTables();
        const [settingsCount, bpCount, branchCount, prodCount] = await Promise.all([
          this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM store_settings`).then(r => r?.[0]?.count || 0).catch(() => 0),
          this.prisma.businessProfile.count().catch(() => 0),
          this.prisma.branch.count().catch(() => 0),
          this.prisma.catalogProduct.count().catch(() => 0)
        ]);
        tablesStatus = {
          store_settings: settingsCount,
          business_profile: bpCount,
          branches: branchCount,
          catalog_products: prodCount
        };
      } catch (e) {}
    }

    return {
      connected: isConnected,
      databaseType: 'PostgreSQL (Prisma Cloud Database)',
      tables: tablesStatus,
      sectionsSavedInDb: [
        'Profil Toko (business & owner_info)',
        'Katalog Produk (catalog & carpet_categories)',
        'Jadwal & Jam Kerja (schedule_info)',
        'Lokasi & Alamat (location_info & branches)',
        'Ketentuan Garansi (warranty_info)',
        'Promo & Diskon (promo_info)',
        'Pusat Komplain & CS (complaint_info)'
      ]
    };
  }
}

module.exports = new DbService();
