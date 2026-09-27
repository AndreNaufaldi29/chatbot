// State Variables
let currentTab = 'tab-qr';
let chatCount = 0;
let eventSource = null;
let currentEditingTicketId = null;
let storedMenuMap = {};

// DOM Elements
const sidebarStatusPill = document.getElementById('sidebar-status-pill');
const sidebarStatusText = document.getElementById('sidebar-status-text');
const qrStatusTag = document.getElementById('qr-status-tag');
const qrImage = document.getElementById('qr-image');
const qrSpinner = document.getElementById('qr-spinner');
const connectedCard = document.getElementById('connected-card');
const qrBoxCard = document.querySelector('.qr-box-card .qr-container');
const connectedPhone = document.getElementById('connected-phone');
const connectedName = document.getElementById('connected-name');
const chatLogBox = document.getElementById('chat-log-box');
const emptyChatState = document.getElementById('empty-chat-state');
const chatCounter = document.getElementById('chat-counter');
const ticketCounter = document.getElementById('ticket-counter');
const ticketsTbody = document.getElementById('tickets-tbody');
const ticketModal = document.getElementById('ticket-modal');

// Titles Map
const tabTitles = {
  'tab-qr': { title: 'Koneksi & QR Code Login', subtitle: 'Scan QR code menggunakan aplikasi WhatsApp untuk menghubungkan bot' },
  'tab-chats': { title: 'Live Chat Log Real-Time', subtitle: 'Memantau pesan masuk dari pelanggan dan balasan otomatis bot secara langsung' },
  'tab-tickets': { title: 'Daftar Tiket & Pengaduan Pelanggan', subtitle: 'Kelola permohonan layanan dan komplain yang masuk melalui chatbot' },
  'tab-catalog': { title: 'Katalog Produk & Kartu Interaktif', subtitle: 'Pratinjau kartu pesan WhatsApp dengan tombol View collection' },
  'tab-sender': { title: 'Kirim Pesan WhatsApp Langsung', subtitle: 'Kirim pesan individual ke nomor pelanggan tertentu langsung dari dashboard' },
  'tab-settings': { title: 'Pengaturan Bisnis & Chatbot', subtitle: 'Sesuaikan profil perusahaan, jam operasional, kontak resmi, dan layanan' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSSE();
  initActionButtons();
  loadTickets();
  loadConfig();
  loadCatalog();
  initSendForm();
  initSettingsForm();
  initModal();
  initWaMenuModal();
});

// Navigation / Tab Switching
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-item');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  currentTab = tabId;

  // Update nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });

  // Update Topbar
  const meta = tabTitles[tabId] || { title: 'Dashboard', subtitle: '' };
  document.getElementById('page-title').textContent = meta.title;
  document.getElementById('page-subtitle').textContent = meta.subtitle;

  if (tabId === 'tab-tickets') {
    loadTickets();
  }
}

// Server-Sent Events (SSE) Real-Time Connection
function initSSE() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/api/events');

  eventSource.addEventListener('init', (e) => {
    const data = JSON.parse(e.data);
    updateStatusUI(data.status, data.user, data.qrDataUrl);
  });

  eventSource.addEventListener('status_change', (e) => {
    const data = JSON.parse(e.data);
    updateStatusUI(data.status, data.user, data.qrDataUrl);
  });

  eventSource.addEventListener('qr', (e) => {
    const data = JSON.parse(e.data);
    displayQR(data.qrDataUrl);
  });

  eventSource.addEventListener('chat_log', (e) => {
    const msg = JSON.parse(e.data);
    appendChatMessage(msg);
  });

  eventSource.addEventListener('ticket_created', (e) => {
    const ticket = JSON.parse(e.data);
    showToast(`Tiket Baru: ${ticket.id} (${ticket.name})`, 'success');
    loadTickets();
  });

  eventSource.addEventListener('ticket_updated', () => {
    loadTickets();
  });

  eventSource.addEventListener('human_cs_requested', (e) => {
    const data = JSON.parse(e.data);
    showToast(`⚠️ Pelanggan ${data.phone} (${data.senderName}) meminta bantuan CS Manusia!`, 'info');
  });

  eventSource.onerror = () => {
    sidebarStatusPill.className = 'connection-pill status-disconnected';
    sidebarStatusText.textContent = 'Menyambung ulang...';
    setTimeout(initSSE, 5000);
  };
}

// Update UI based on WhatsApp Bot connection status
function updateStatusUI(status, user, qrDataUrl) {
  sidebarStatusPill.className = 'connection-pill';

  if (status === 'connected') {
    sidebarStatusPill.classList.add('status-connected');
    sidebarStatusText.textContent = 'Terhubung';
    qrStatusTag.textContent = 'Online';
    qrStatusTag.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
    qrStatusTag.style.color = '#34d399';
    qrStatusTag.style.borderColor = 'rgba(16, 185, 129, 0.3)';

    // Show Connected Card, Hide QR Code
    if (qrBoxCard) qrBoxCard.style.display = 'none';
    if (connectedCard) {
      connectedCard.style.display = 'block';
      connectedPhone.textContent = user?.id ? `+${user.id}` : '-';
      connectedName.textContent = user?.name || 'WhatsApp CS';
    }
  } else if (status === 'waiting_qr') {
    sidebarStatusPill.classList.add('status-waiting');
    sidebarStatusText.textContent = 'Menunggu Scan QR';
    qrStatusTag.textContent = 'Scan QR';
    qrStatusTag.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
    qrStatusTag.style.color = '#fbbf24';
    qrStatusTag.style.borderColor = 'rgba(245, 158, 11, 0.3)';

    if (qrBoxCard) qrBoxCard.style.display = 'flex';
    if (connectedCard) connectedCard.style.display = 'none';
    if (qrDataUrl) displayQR(qrDataUrl);
  } else if (status === 'connecting') {
    sidebarStatusPill.classList.add('status-waiting');
    sidebarStatusText.textContent = 'Menghubungkan...';
    qrStatusTag.textContent = 'Menghubungkan';
    if (qrSpinner) qrSpinner.style.display = 'flex';
    if (qrImage) qrImage.style.display = 'none';
  } else {
    sidebarStatusPill.classList.add('status-disconnected');
    sidebarStatusText.textContent = 'Terputus';
    qrStatusTag.textContent = 'Terputus';
    qrStatusTag.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    qrStatusTag.style.color = '#fca5a5';
    qrStatusTag.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    if (connectedCard) connectedCard.style.display = 'none';
    if (qrBoxCard) qrBoxCard.style.display = 'flex';
  }
}

function displayQR(dataUrl) {
  if (!dataUrl) return;
  if (qrSpinner) qrSpinner.style.display = 'none';
  if (qrImage) {
    qrImage.src = dataUrl;
    qrImage.style.display = 'block';
  }
}

// Action Buttons (Restart & Logout)
function initActionButtons() {
  document.getElementById('btn-restart').addEventListener('click', async () => {
    if (!confirm('Apakah Anda yakin ingin memulai ulang (restart) koneksi bot?')) return;
    try {
      showToast('Memulai ulang bot...', 'info');
      const res = await fetch('/api/restart', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Restart berhasil', 'success');
    } catch (err) {
      showToast('Gagal restart: ' + err.message, 'error');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    if (!confirm('Apakah Anda yakin ingin logout? Sesi WhatsApp akan dihapus dan Anda harus melakukan scan QR ulang.')) return;
    try {
      showToast('Menghapus sesi & memuat QR baru...', 'info');
      const res = await fetch('/api/logout', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Logout berhasil', 'success');
      switchTab('tab-qr');
    } catch (err) {
      showToast('Gagal logout: ' + err.message, 'error');
    }
  });

  document.getElementById('btn-clear-chat-log').addEventListener('click', () => {
    chatLogBox.innerHTML = '';
    chatLogBox.appendChild(emptyChatState);
    emptyChatState.style.display = 'flex';
    chatCount = 0;
    chatCounter.textContent = '0';
  });
}

// Live Chat Log Real-time Display
function appendChatMessage(msg) {
  if (emptyChatState) emptyChatState.style.display = 'none';

  chatCount++;
  chatCounter.textContent = String(chatCount);

  const row = document.createElement('div');
  row.className = `chat-bubble-row ${msg.direction === 'in' ? 'in' : 'out'}`;

  const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
  const senderLabel = msg.direction === 'in' ? `${msg.senderName} (+${msg.phone})` : 'Bot Pelayanan';

  let csBadge = '';
  if (msg.direction === 'in' && msg.text.toLowerCase().includes('cs')) {
    csBadge = '<span class="badge-cs-handover">CS Request</span>';
  }

  let bubbleHtml = '';
  if (msg.isListMenu && msg.rows && msg.rows.length > 0) {
    const menuKey = msg.id || `menu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    storedMenuMap[menuKey] = {
      title: msg.buttonTitle || 'Pilih Menu Layanan',
      rows: msg.rows,
      jid: msg.jid,
      phone: msg.phone
    };

    bubbleHtml = `
      <div class="chat-bubble wa-list-bubble">
        <div class="wa-list-text">${escapeHtml(msg.text)}</div>
        <button class="wa-list-btn-preview" onclick="openMenuPopup('${menuKey}')" title="Klik untuk membuka pilihan menu">
          <svg class="wa-list-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
          </svg>
          <span class="wa-list-btn-title">${escapeHtml(msg.buttonTitle || 'Pilih Menu Layanan')}</span>
        </button>
      </div>
    `;
  } else {
    bubbleHtml = `<div class="chat-bubble">${formatWhatsAppText(msg.text)}</div>`;
  }

  row.innerHTML = `
    <div class="chat-meta">
      <strong>${senderLabel}</strong>
      <span>${timeStr}</span>
      ${csBadge}
    </div>
    ${bubbleHtml}
  `;

  chatLogBox.appendChild(row);
  chatLogBox.scrollTop = chatLogBox.scrollHeight;
}

// Tickets Management
async function loadTickets() {
  try {
    const res = await fetch('/api/tickets');
    const tickets = await res.json();

    ticketCounter.textContent = String(tickets.length);

    if (tickets.length === 0) {
      ticketsTbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 30px; color: var(--text-muted);">Belum ada tiket layanan yang terdaftar.</td></tr>`;
      return;
    }

    ticketsTbody.innerHTML = tickets.map(t => {
      const createdStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
      const statusClass = (t.status || 'open').toLowerCase().replace(' ', '-');
      
      return `
        <tr>
          <td><span class="ticket-id-tag">${t.id}</span></td>
          <td><strong>${escapeHtml(t.name)}</strong></td>
          <td>+${escapeHtml(t.sender)}</td>
          <td><span title="${escapeHtml(t.description)}">${escapeHtml(t.description.length > 50 ? t.description.slice(0, 50) + '...' : t.description)}</span></td>
          <td><span class="status-badge ${statusClass}">${t.status}</span></td>
          <td>${t.priority || 'Normal'}</td>
          <td><small>${createdStr}</small></td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="openTicketModal('${t.id}')">Update</button>
              <button class="btn btn-primary btn-sm" onclick="replyTicketViaWhatsApp('${t.sender}', '${t.id}')" title="Kirim Pesan WhatsApp">Balas</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    ticketsTbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: var(--danger);">Gagal memuat tiket: ${err.message}</td></tr>`;
  }
}

document.getElementById('btn-refresh-tickets').addEventListener('click', () => {
  loadTickets();
  showToast('Daftar tiket dimuat ulang', 'info');
});

// Ticket Modal
function initModal() {
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const saveBtn = document.getElementById('modal-save-btn');

  closeBtn.addEventListener('click', closeTicketModal);
  cancelBtn.addEventListener('click', closeTicketModal);

  saveBtn.addEventListener('click', async () => {
    if (!currentEditingTicketId) return;

    const status = document.getElementById('modal-status-select').value;
    const notes = document.getElementById('modal-notes').value;

    try {
      const res = await fetch(`/api/tickets/${currentEditingTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        showToast(`Tiket ${currentEditingTicketId} berhasil diperbarui!`, 'success');
        closeTicketModal();
        loadTickets();
      } else {
        const errData = await res.json();
        showToast('Gagal update tiket: ' + errData.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

window.openTicketModal = async function(ticketId) {
  currentEditingTicketId = ticketId;
  try {
    const res = await fetch('/api/tickets');
    const tickets = await res.json();
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;

    document.getElementById('modal-ticket-title').textContent = `Perbarui Tiket: ${t.id}`;
    document.getElementById('modal-ticket-desc').textContent = `Keluhan: "${t.description}" (${t.name} - +${t.sender})`;
    document.getElementById('modal-status-select').value = t.status;
    document.getElementById('modal-notes').value = t.notes || '';

    ticketModal.classList.add('active');
  } catch (err) {
    showToast('Gagal membuka detail tiket: ' + err.message, 'error');
  }
};

function closeTicketModal() {
  ticketModal.classList.remove('active');
  currentEditingTicketId = null;
}

window.replyTicketViaWhatsApp = function(phone, ticketId) {
  switchTab('tab-sender');
  document.getElementById('send-phone').value = phone;
  document.getElementById('send-text').value = `Halo Kak, terkait tiket Anda *${ticketId}*:\n\n`;
  document.getElementById('send-text').focus();
};

// Direct Message Sender
function initSendForm() {
  const form = document.getElementById('form-send-message');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById('send-phone');
    const textInput = document.getElementById('send-text');
    const btn = document.getElementById('btn-submit-send');

    const phone = phoneInput.value.trim();
    const message = textInput.value.trim();

    if (!phone || !message) return;

    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Pesan WhatsApp berhasil terkirim!', 'success');
        textInput.value = '';
      } else {
        showToast('Gagal mengirim pesan: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> <span>Kirim Pesan</span>`;
    }
  });
}

// Bot & Business Settings
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    if (config.business) {
      document.getElementById('cfg-biz-name').value = config.business.name || '';
      document.getElementById('cfg-biz-tagline').value = config.business.tagline || '';
      document.getElementById('cfg-biz-phone').value = config.business.phone || '';
      document.getElementById('cfg-biz-email').value = config.business.email || '';
      document.getElementById('cfg-biz-website').value = config.business.website || '';
      document.getElementById('cfg-biz-address').value = config.business.address || '';
      document.getElementById('cfg-biz-maps').value = config.business.maps_url || '';
      document.getElementById('cfg-biz-hours').value = config.business.hours || '';
    }

    if (config.bot) {
      document.getElementById('cfg-bot-ignore-groups').checked = !!config.bot.ignore_groups;
    }
  } catch (err) {
    console.error('Gagal memuat konfigurasi:', err);
  }
}

function initSettingsForm() {
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    try {
      const currentConfigRes = await fetch('/api/config');
      const config = await currentConfigRes.json();

      config.business = {
        name: document.getElementById('cfg-biz-name').value.trim(),
        tagline: document.getElementById('cfg-biz-tagline').value.trim(),
        phone: document.getElementById('cfg-biz-phone').value.trim(),
        email: document.getElementById('cfg-biz-email').value.trim(),
        website: document.getElementById('cfg-biz-website').value.trim(),
        address: document.getElementById('cfg-biz-address').value.trim(),
        maps_url: document.getElementById('cfg-biz-maps').value.trim(),
        hours: document.getElementById('cfg-biz-hours').value.trim()
      };

      config.bot = config.bot || {};
      config.bot.ignore_groups = document.getElementById('cfg-bot-ignore-groups').checked;

      const saveRes = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (saveRes.ok) {
        showToast('Pengaturan bisnis & bot berhasil disimpan!', 'success');
      } else {
        const err = await saveRes.json();
        showToast('Gagal menyimpan: ' + err.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Helper: Escape HTML strings
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Format WhatsApp basic markdown (*bold*, _italic_, ~strike~)
function formatWhatsAppText(raw) {
  if (!raw) return '';
  let s = escapeHtml(raw);
  s = s.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  s = s.replace(/~([^~\n]+)~/g, '<del>$1</del>');
  return s;
}

// Catalog Products Management & Live Preview
let catalogItemsCache = [];
let currentCarouselIndex = 0;

async function loadCatalog() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    const catalog = config.catalog || [];
    catalogItemsCache = catalog;

    const counter = document.getElementById('catalog-counter');
    if (counter) counter.textContent = String(catalog.length);

    // 1. Render Carousel Cards in Phone Mockup Viewport
    renderCarouselMockup(catalog);

    // 2. Render List Grid on Right Side
    const container = document.getElementById('catalog-items-container');
    if (!container) return;

    if (catalog.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 24px;">Belum ada item katalog yang ditambahkan.</p>`;
      return;
    }

    container.innerHTML = catalog.map((item, idx) => {
      const imgPath = item.image.replace(/^assets\//, '/');
      return `
        <div class="catalog-item-card">
          <div class="catalog-item-thumb">
            <img src="${imgPath}" alt="${escapeHtml(item.title)}" onerror="this.src='/catalog/everyday-set.jpg'">
          </div>
          <div class="catalog-item-details">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.subtitle)}</p>
            <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">🎨 ${escapeHtml(item.footer)}</small>
            <span class="catalog-item-price">${escapeHtml(item.price)}</span>
          </div>
          <div class="catalog-item-actions">
            <button class="btn btn-secondary btn-sm" onclick="goToCarouselSlide(${idx})">
              Buka di Mockup
            </button>
            <button class="btn btn-primary btn-sm" onclick="sendCatalogTestPrompt('${escapeHtml(item.title)}')">
              Uji Coba Kirim
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Hook test send carousel button
    const testSendBtn = document.getElementById('btn-test-send-carousel');
    if (testSendBtn) {
      testSendBtn.onclick = () => {
        switchTab('tab-sender');
        document.getElementById('send-text').value = 'KATALOG';
        document.getElementById('send-phone').focus();
        showToast('Ketik nomor tujuan lalu kirim "KATALOG" untuk menguji carousel!', 'info');
      };
    }

  } catch (err) {
    console.error('Gagal memuat katalog:', err);
  }
}

function renderCarouselMockup(catalog) {
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const indicator = document.getElementById('carousel-page-indicator');
  const prevBtn = document.getElementById('btn-carousel-prev');
  const nextBtn = document.getElementById('btn-carousel-next');

  if (!track || !catalog.length) return;

  // Render cards in track
  track.innerHTML = catalog.map((item) => {
    const imgPath = item.image.replace(/^assets\//, '/');
    return `
      <div class="wa-interactive-card">
        <div class="wa-card-image">
          <img src="${imgPath}" alt="${escapeHtml(item.title)}" onerror="this.src='/catalog/everyday-set.jpg'">
        </div>
        <div class="wa-card-content">
          <h4>${escapeHtml(item.title)}</h4>
          <p class="wa-card-desc">${escapeHtml(item.subtitle)}</p>
          <div class="wa-card-meta">
            <span>${escapeHtml(item.footer)}</span>
            <span class="wa-timestamp">09:41</span>
          </div>
        </div>
        <div class="wa-card-btn-action">
          <a href="${item.url || '#'}" target="_blank">
            <span>${escapeHtml(item.buttonText || 'View collection')}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = catalog.map((_, idx) => `
      <div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="goToCarouselSlide(${idx})"></div>
    `).join('');
  }

  // Hook navigation arrows
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentCarouselIndex > 0) {
        goToCarouselSlide(currentCarouselIndex - 1);
      } else {
        goToCarouselSlide(catalog.length - 1);
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentCarouselIndex < catalog.length - 1) {
        goToCarouselSlide(currentCarouselIndex + 1);
      } else {
        goToCarouselSlide(0);
      }
    };
  }

  goToCarouselSlide(0);
}

window.goToCarouselSlide = function(index) {
  const track = document.getElementById('carousel-track');
  const indicator = document.getElementById('carousel-page-indicator');
  const dots = document.querySelectorAll('.carousel-dot');

  if (!track || !catalogItemsCache.length) return;

  if (index < 0) index = 0;
  if (index >= catalogItemsCache.length) index = catalogItemsCache.length - 1;

  currentCarouselIndex = index;
  track.style.transform = `translateX(-${index * 100}%)`;

  if (indicator) {
    indicator.textContent = `${index + 1} / ${catalogItemsCache.length}`;
  }

  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === index);
  });
};

window.sendCatalogTestPrompt = function(productTitle) {
  switchTab('tab-sender');
  document.getElementById('send-text').value = `Hai! Ini katalog *${productTitle}* dari Harbor:\n\nKetik *KATALOG* untuk melihat kartu carousel.`;
  document.getElementById('send-phone').focus();
  showToast(`Siap mengirim uji coba untuk ${productTitle}`, 'info');
};

// ========================================================
// WhatsApp Pop-up Menu Modal Controller (Matches Image 3)
// ========================================================
function initWaMenuModal() {
  const closeBtn = document.getElementById('wa-menu-close-btn');
  const backdrop = document.getElementById('wa-menu-backdrop');

  if (closeBtn) closeBtn.addEventListener('click', closeMenuPopup);
  if (backdrop) backdrop.addEventListener('click', closeMenuPopup);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenuPopup();
  });
}

window.openMenuPopup = function(menuKey) {
  const data = storedMenuMap[menuKey];
  if (!data) return;

  const modal = document.getElementById('wa-menu-modal');
  const titleEl = document.getElementById('wa-menu-title');
  const badgeEl = document.getElementById('wa-menu-badge');
  const itemsContainer = document.getElementById('wa-menu-items');

  if (titleEl) titleEl.textContent = data.title || 'Pilih Menu Layanan';
  if (badgeEl) badgeEl.textContent = `${(data.rows || []).length} Opsi`;

  if (itemsContainer) {
    itemsContainer.innerHTML = (data.rows || []).map(r => `
      <div class="wa-popup-item" onclick="selectMenuItem('${escapeHtml(r.id)}', '${escapeHtml(r.title)}', this)">
        <div class="wa-popup-item-info">
          <div class="wa-popup-item-title">${escapeHtml(r.title)}</div>
          <div class="wa-popup-item-desc">${escapeHtml(r.description || '')}</div>
        </div>
        <div class="wa-popup-radio"></div>
      </div>
    `).join('');
  }

  if (modal) modal.classList.add('active');
};

window.closeMenuPopup = function() {
  const modal = document.getElementById('wa-menu-modal');
  if (modal) modal.classList.remove('active');
};

window.selectMenuItem = function(itemId, itemTitle, element) {
  if (element) {
    document.querySelectorAll('.wa-popup-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
  }
  showToast(`Pilihan dipilih: ${itemTitle}`, 'info');
  setTimeout(() => {
    closeMenuPopup();
  }, 350);
};


