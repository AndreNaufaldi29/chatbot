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

  async updateTicketStatus(id, status, notes = null, category = null, priority = null) {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        const data = { updatedAt: new Date() };
        if (status) data.status = status;
        if (notes !== null) data.notes = notes;
        if (category) data.category = category;
        if (priority) data.priority = priority;

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
            image: msg.image || null,
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

  // ================= BUSINESS PROFILE =================
  async getBusinessProfile() {
    const isReady = await this.checkPrisma();
    if (isReady) {
      try {
        const profile = await this.prisma.businessProfile.findFirst({
          orderBy: { id: 'asc' }
        });
        if (profile) {
          return {
            name: profile.name,
            tagline: profile.tagline,
            phone: profile.phone,
            email: profile.email,
            website: profile.website,
            address: profile.address,
            maps_url: profile.mapsUrl,
            hours: profile.hours
          };
        }
      } catch (e) {
        this.isPrismaConnected = false;
      }
    }

    try {
      const configFile = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configFile)) {
        const conf = JSON.parse(fs.readFileSync(configFile, 'utf8') || '{}');
        return conf.business || {};
      }
    } catch (e) {}
    return {};
  }
}

module.exports = new DbService();
