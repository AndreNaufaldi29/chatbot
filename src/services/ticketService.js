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

  createTicket({ sender, name, contact, description, priority = 'Normal', category = 'Layanan Umum', queueNumber = null }) {
    const tickets = this.getAllTickets();
    let newId;
    let attempts = 0;
    do {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      newId = `TKT-${randomCode}`;
      attempts++;
    } while (tickets.some(t => t.id === newId) && attempts < 100);

    // Hitung nomor urut antrian harian (misal A-001, A-002, dst) secara akurat di WIB (Asia/Jakarta)
    let assignedQueue = queueNumber ? String(queueNumber).replace(/^#+/, '').trim() : null;
    if (!assignedQueue) {
      const now = new Date();
      const todayWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now); // 'YYYY-MM-DD'

      const todayTickets = tickets.filter(t => {
        if (!t.createdAt) return false;
        try {
          const tDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(t.createdAt));
          return tDate === todayWIB;
        } catch (e) {
          return false;
        }
      });

      // Cari nomor urut terbesar hari ini agar tidak pernah duplikat/ganda
      let maxNum = 0;
      for (const t of todayTickets) {
        if (t.queueNumber) {
          const m = String(t.queueNumber).match(/\d+/);
          if (m) {
            const val = parseInt(m[0], 10);
            if (val > maxNum) maxNum = val;
          }
        }
      }

      const queueSeq = maxNum + 1;
      assignedQueue = `A-${String(queueSeq).padStart(3, '0')}`;
    }

    const isUrgent = category.includes('Garansi') || category.includes('Komplain') || category.includes('Pengaduan');

    const newTicket = {
      id: newId,
      queueNumber: assignedQueue,
      sender: sender || 'Unknown',
      name: (name || 'Pelanggan').trim(),
      contact: (contact || '-').trim(),
      description: (description || '-').trim(),
      category: category || 'Layanan Umum',
      status: 'Open',
      priority: priority || (isUrgent ? 'Tinggi' : 'Normal'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Tiket antrian #${assignedQueue} aktif dibuat otomatis via WhatsApp (${category}) - Menunggu konfirmasi admin.`
    };

    tickets.unshift(newTicket);
    this.saveTickets(tickets);
    dbService.saveTicket(newTicket).catch(() => {});
    return newTicket;
  }

  ensureActiveTicket({ sender, name, contact, description, category = 'Layanan Umum', priority = 'Normal', queueNumber = null }) {
    const tickets = this.getAllTickets();
    const cleanSender = String(sender || '').replace(/\D/g, '');

    // Cek apakah sudah ada tiket Open untuk pelanggan ini (agar nomor antrian tidak duplikat)
    const existing = tickets.find(t => 
      t.status === 'Open' &&
      String(t.sender || '').replace(/\D/g, '') === cleanSender
    );

    if (existing) {
      existing.updatedAt = new Date().toISOString();
      if (!existing.queueNumber) {
        const now = new Date();
        const todayWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
        const todayTickets = tickets.filter(t => {
          if (!t.createdAt) return false;
          try {
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(t.createdAt)) === todayWIB;
          } catch (e) {
            return false;
          }
        });
        let maxNum = 0;
        for (const t of todayTickets) {
          if (t.queueNumber) {
            const m = String(t.queueNumber).match(/\d+/);
            if (m) {
              const val = parseInt(m[0], 10);
              if (val > maxNum) maxNum = val;
            }
          }
        }
        existing.queueNumber = `A-${String(maxNum + 1).padStart(3, '0')}`;
      } else {
        existing.queueNumber = String(existing.queueNumber).replace(/^#+/, '').trim();
      }

      if (category && category !== 'Layanan Umum') {
        existing.category = category;
      }
      if (description && !existing.description.includes(description.slice(0, 30))) {
        existing.description = `${existing.description} | Update: ${description}`.slice(0, 500);
      }
      this.saveTickets(tickets);
      dbService.saveTicket(existing).catch(() => {});
      return { ticket: existing, isNew: false };
    }

    const newTicket = this.createTicket({ sender, name, contact, description, category, priority, queueNumber });
    return { ticket: newTicket, isNew: true };
  }

  updateTicketStatus(ticketId, status, notes = null, category = null, priority = null, description = null) {
    const tickets = this.getAllTickets();
    const cleanId = String(ticketId).trim().toUpperCase();
    const index = tickets.findIndex(t => t.id.toUpperCase() === cleanId);
    if (index === -1) return null;

    if (status) tickets[index].status = status;
    if (category) tickets[index].category = category;
    if (priority) tickets[index].priority = priority;
    if (description !== null && description !== undefined) tickets[index].description = description;
    tickets[index].updatedAt = new Date().toISOString();
    if (notes !== null) {
      tickets[index].notes = notes;
    }

    this.saveTickets(tickets);
    dbService.updateTicketStatus(cleanId, status, notes, category, priority, description).catch(() => {});
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
