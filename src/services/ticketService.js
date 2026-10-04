const fs = require('fs');
const path = require('path');
const dbService = require('./dbService');

const TICKETS_FILE = path.join(__dirname, '../../data/tickets.json');

class TicketService {
  constructor() {
    this.ensureFileExists();
  }

  ensureFileExists() {
    const dir = path.dirname(TICKETS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(TICKETS_FILE)) {
      fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  getAllTickets() {
    try {
      this.ensureFileExists();
      const raw = fs.readFileSync(TICKETS_FILE, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      if (!Array.isArray(parsed)) return [];
      const seen = new Set();
      return parsed.filter(t => {
        if (!t || !t.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    } catch (err) {
      console.error('[TicketService] Gagal membaca tickets.json:', err.message);
      return [];
    }
  }

  saveTickets(tickets) {
    try {
      this.ensureFileExists();
      const seen = new Set();
      const unique = [];
      for (const t of tickets) {
        if (t && t.id && !seen.has(t.id)) {
          seen.add(t.id);
          unique.push(t);
        }
      }
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(unique, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[TicketService] Gagal menyimpan tickets.json:', err.message);
      return false;
    }
  }

  getTicketById(ticketId) {
    if (!ticketId) return null;
    const cleanId = String(ticketId).trim().toUpperCase();
    const tickets = this.getAllTickets();
    return tickets.find(t => t.id.toUpperCase() === cleanId) || null;
  }

  getTicketsBySender(senderPhone) {
    if (!senderPhone) return [];
    const clean = String(senderPhone).replace(/\D/g, '');
    const tickets = this.getAllTickets();
    return tickets.filter(t => String(t.sender).replace(/\D/g, '') === clean);
  }

  createTicket({ sender, name, contact, description, priority = 'Normal', category = 'Layanan Umum' }) {
    const tickets = this.getAllTickets();
    let newId;
    let attempts = 0;
    do {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      newId = `TKT-${randomCode}`;
      attempts++;
    } while (tickets.some(t => t.id === newId) && attempts < 100);

    const newTicket = {
      id: newId,
      sender: sender || 'Unknown',
      name: (name || 'Pelanggan').trim(),
      contact: (contact || '-').trim(),
      description: (description || '-').trim(),
      category: category || 'Layanan Umum',
      status: 'Open',
      priority: priority || (category === 'Klaim Garansi' || category === 'Pengaduan Produk' ? 'Tinggi' : 'Normal'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Tiket aktif dibuat otomatis via WhatsApp (${category}).`
    };

    tickets.unshift(newTicket);
    this.saveTickets(tickets);
    dbService.saveTicket(newTicket).catch(() => {});
    return newTicket;
  }

  ensureActiveTicket({ sender, name, contact, description, category = 'Layanan Umum', priority = 'Normal' }) {
    const tickets = this.getAllTickets();
    const cleanSender = String(sender || '').replace(/\D/g, '');

    // Check if there is already an Open ticket with same category for this user
    const existing = tickets.find(t => 
      t.status === 'Open' &&
      t.category === category &&
      String(t.sender || '').replace(/\D/g, '') === cleanSender
    );

    if (existing) {
      existing.updatedAt = new Date().toISOString();
      if (description && !existing.description.includes(description.slice(0, 30))) {
        existing.description = `${existing.description} | Update: ${description}`.slice(0, 500);
      }
      this.saveTickets(tickets);
      dbService.saveTicket(existing).catch(() => {});
      return { ticket: existing, isNew: false };
    }

    const newTicket = this.createTicket({ sender, name, contact, description, category, priority });
    return { ticket: newTicket, isNew: true };
  }

  updateTicketStatus(ticketId, status, notes = null, category = null, priority = null) {
    const tickets = this.getAllTickets();
    const cleanId = String(ticketId).trim().toUpperCase();
    const index = tickets.findIndex(t => t.id.toUpperCase() === cleanId);
    if (index === -1) return null;

    if (status) tickets[index].status = status;
    if (category) tickets[index].category = category;
    if (priority) tickets[index].priority = priority;
    tickets[index].updatedAt = new Date().toISOString();
    if (notes !== null) {
      tickets[index].notes = notes;
    }

    this.saveTickets(tickets);
    dbService.updateTicketStatus(cleanId, status, notes, category, priority).catch(() => {});
    return tickets[index];
  }

  deleteTicket(ticketId) {
    if (!ticketId) return false;
    const cleanId = String(ticketId).trim().toUpperCase();
    const tickets = this.getAllTickets();
    const filtered = tickets.filter(t => t.id && t.id.toUpperCase() !== cleanId);
    if (filtered.length === tickets.length) return false;
    this.saveTickets(filtered);
    dbService.deleteTicket(cleanId).catch(() => {});
    return true;
  }
}

module.exports = new TicketService();
