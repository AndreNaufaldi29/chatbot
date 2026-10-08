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

// Titles Map (All 12 Sidebar Items)
const tabTitles = {
  'tab-chats': { title: '💬 Obrolan WhatsApp', subtitle: 'Memantau pesan masuk dari pelanggan dan balasan otomatis bot secara real-time' },
  'tab-ai': { title: '✨ AI Studio & Simulator Respons', subtitle: 'Kelola penyedia AI (Groq / Gemini) dan uji coba simulasi percakapan sebelum melayani customer' },
  'tab-qr': { title: '▦ Koneksi WhatsApp', subtitle: 'Scan QR code menggunakan aplikasi WhatsApp di smartphone untuk menghubungkan bot' },
  'tab-store-profile': { title: '♙ Profil & Pemilik Toko', subtitle: 'Informasi kredibilitas, legalitas izin usaha NIB/SIUP, dan pendiri Sultan Carpet Gallery' },
  'tab-catalog': { title: '🛍️ Katalog Produk', subtitle: 'Koleksi karpet masjid Turki Grade A, karpet klasik Persia, hunian & kantor komersial' },
  'tab-schedule': { title: '🕐 Jadwal Operasional & Jam Kerja', subtitle: 'Waktu buka galeri, jadwal survey lapangan DKM masjid, dan teknisi pasang malam 20 jam' },
  'tab-location': { title: '📍 Lokasi & Alamat Galeri', subtitle: 'Showroom utama Fatmawati Jakarta Selatan, gudang obras Narogong, dan galeri cabang' },
  'tab-warranty': { title: '🛡️ Ketentuan Garansi Resmi', subtitle: 'Jaminan keaslian benang Turki 100%, garansi obras & pasang 1 tahun, dan garansi tukar baru 14 hari' },
  'tab-promo': { title: '🏷️ Promo & Diskon Spesial', subtitle: 'Paket karpet masjid barakah, potongan khusus DKM pengurus, dan fasilitas survey gratis' },
  'tab-tickets': { title: '⚙️ Pusat Komplain & Customer Service', subtitle: 'Kelola permohonan layanan, keluhan pelanggan, dan eskalasi penanganan tim CS' },
  'tab-qna': { title: '🧠 Basis Tanya Jawab AI (Knowledge Base)', subtitle: 'Kelola basis pertanyaan dan jawaban resmi toko agar AI menjawab pertanyaan pelanggan secara konsisten dan akurat' },
  'tab-handoff': { title: '🎧 Hands-Off Customer Service & AI Takeover', subtitle: 'Kelola alih kendali otomatis dan manual dari asisten AI ke Customer Service manusia secara real-time' },
  'tab-sender': { title: 'Kirim Pesan WhatsApp Langsung', subtitle: 'Kirim pesan individual ke nomor pelanggan tertentu langsung dari dashboard' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSSE();
  initActionButtons();
  loadTickets();
  loadConfig();
  loadCatalog();
  loadFaqs();
  loadCustomerQuestions();
  loadAiStudio();
  initQnaModal();
  initSendForm();
  initAiStudioForm();
  initModal();
  initWaMenuModal();
  loadRecentChatLogs();
  loadHandoffs();
  initHandoffForm();
  loadCrawledPages();
  initCrawlerForm();

  // Detect URL parameter or hash to activate specific tab directly
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (tabParam === 'handoff' || tabParam === 'tab-handoff' || hash === 'handoff' || hash === 'hands-off' || hash === 'tab-handoff') {
      switchTab('tab-handoff');
    } else if (tabParam && tabTitles[tabParam]) {
      switchTab(tabParam);
    } else if (hash && tabTitles[hash]) {
      switchTab(hash);
    }
  } catch (e) {}
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
  } else if (tabId === 'tab-catalog') {
    loadCatalog();
  } else if (tabId === 'tab-qna') {
    loadFaqs();
    loadCustomerQuestions();
  } else if (tabId === 'tab-ai') {
    loadAiStudio();
  } else if (tabId === 'tab-handoff') {
    loadHandoffs();
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
    if (data.status === 'connected') {
      loadRecentChatLogs();
      if (currentTab === 'tab-qr') {
        switchTab('tab-chats');
      }
    }
  });

  eventSource.addEventListener('chats_updated', () => {
    loadRecentChatLogs();
    loadCustomerQuestions();
  });

  eventSource.addEventListener('faqs_updated', () => {
    loadFaqs();
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
    loadHandoffs();
  });

  eventSource.addEventListener('human_handoff_started', (e) => {
    try {
      const data = JSON.parse(e.data);
      showToast(`🎧 Sesi CS Manusia Aktif untuk: ${data.phone || data.jid}`, 'info');
      loadHandoffs();
    } catch (err) {}
  });

  eventSource.addEventListener('human_handoff_ended', (e) => {
    try {
      const data = JSON.parse(e.data);
      showToast(`🤖 AI Bot diaktifkan kembali untuk: ${data.phone || data.jid}`, 'success');
      loadHandoffs();
    } catch (err) {}
  });

  eventSource.addEventListener('contact_ai_toggled', () => {
    loadHandoffs();
  });

  eventSource.addEventListener('protections_updated', () => {
    loadHandoffs();
  });

  eventSource.addEventListener('rag_updated', () => {
    loadCrawledPages();
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

  const navQrDot = document.getElementById('nav-qr-dot');
  if (navQrDot) {
    navQrDot.classList.toggle('online', status === 'connected');
  }

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
    const ok = await askConfirmDialog({
      title: 'Mulai Ulang Koneksi WhatsApp?',
      message: 'Sistem akan memuat ulang socket WhatsApp dan menyegarkan koneksi bot secara otomatis.',
      confirmText: 'Mulai Ulang',
      cancelText: 'Batal',
      type: 'info'
    });
    if (!ok) return;
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
    const ok = await askConfirmDialog({
      title: 'Logout Sesi WhatsApp?',
      message: 'Sesi WhatsApp akan dihapus dan Anda harus melakukan scan QR ulang untuk menghubungkan kembali.',
      confirmText: 'Ya, Logout',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
    try {
      showToast('Menghapus sesi & memuat QR baru...', 'info');
      updateStatusUI('connecting', null, null);
      switchTab('tab-qr');
      const res = await fetch('/api/logout', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Logout berhasil', 'success');
      setTimeout(fetchBotStatus, 1200);
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

// Load All Synced Chat Messages on Login / Initialization
async function loadRecentChatLogs() {
  try {
    const res = await fetch('/api/chats/messages');
    if (!res.ok) return;
    const messages = await res.json();
    if (Array.isArray(messages) && messages.length > 0) {
      if (emptyChatState) emptyChatState.style.display = 'none';
      chatLogBox.innerHTML = '';
      chatCount = 0;
      messages.forEach(msg => appendChatMessage(msg));
    }
  } catch (err) {
    console.error('Gagal memuat riwayat obrolan:', err);
  }
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

// AI Studio Engine & Simulator
let currentAiProvider = 'groq';

async function loadAiStudio() {
  try {
    const res = await fetch('/api/ai/provider');
    const data = await res.json();
    if (data.provider) {
      currentAiProvider = data.provider;
      const radio = document.getElementById(`radio-${data.provider}`);
      if (radio) radio.checked = true;

      const tag = document.getElementById('ai-studio-active-tag');
      if (tag) {
        tag.textContent = data.provider === 'groq' 
          ? 'Provider Aktif: ⚡ Groq (Llama 3.3 70B)' 
          : 'Provider Aktif: 🔮 Google Gemini (Gemini 2.5 Flash)';
      }

      const badge = document.getElementById('ai-provider-badge');
      if (badge) {
        badge.textContent = data.provider === 'groq' ? '⚡ Groq' : '🔮 Gemini';
      }
    }
  } catch (err) {
    console.error('Gagal memuat info AI provider:', err);
  }
}

function initAiStudioForm() {
  const saveBtn = document.getElementById('btn-save-ai-provider');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const selected = document.querySelector('input[name="ai-provider-select"]:checked')?.value || 'groq';
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
        const res = await fetch('/api/ai/provider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: selected })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Engine AI berhasil dialihkan ke ${selected.toUpperCase()}!`, 'success');
          loadAiStudio();
        } else {
          showToast('Gagal mengubah engine AI: ' + (data.error || 'Unknown'), 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Terapkan Engine Pilihan';
      }
    });
  }

  const simForm = document.getElementById('form-simulate-ai');
  if (simForm) {
    simForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('sim-input-message');
      const userText = input.value.trim();
      if (!userText) return;

      const chatBox = document.getElementById('simulator-chat-box');
      // Append user bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'sim-bubble sim-user';
      userBubble.innerHTML = `<strong>Customer:</strong><p>${escapeHtml(userText)}</p>`;
      chatBox.appendChild(userBubble);
      input.value = '';

      // Append thinking bubble
      const thinkingBubble = document.createElement('div');
      thinkingBubble.className = 'sim-bubble sim-bot';
      thinkingBubble.innerHTML = `<strong>AI Customer Service (${currentAiProvider}):</strong><p><em>Sedang menganalisis Knowledge Base...</em></p>`;
      chatBox.appendChild(thinkingBubble);
      chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const sendBtn = document.getElementById('btn-sim-send');
        if (sendBtn) sendBtn.disabled = true;

        const res = await fetch('/api/ai/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, senderName: 'Pengunjung Web' })
        });
        const data = await res.json();

        if (res.ok && data.reply) {
          let ragInfo = '';
          if (data.ragDocs && data.ragDocs.length > 0) {
            ragInfo = `<div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap; font-size:10px;"><span style="color:#c084fc; font-weight:600;">📚 RAG Sumber:</span>${data.ragDocs.map(d => `<span style="background:rgba(192,132,252,0.15); border:1px solid rgba(192,132,252,0.3); color:#e9d5ff; padding:1px 6px; border-radius:999px;">${escapeHtml(d.page)}</span>`).join('')}</div>`;
          }
          thinkingBubble.innerHTML = `<strong>AI Customer Service (${data.provider || currentAiProvider}):</strong><p>${formatWhatsAppText(data.reply)}</p>${ragInfo}`;
        } else {
          thinkingBubble.innerHTML = `<strong>AI Error:</strong><p style="color:#fca5a5;">${escapeHtml(data.error || 'AI tidak menghasilkan balasan.')}</p>`;
        }
      } catch (err) {
        thinkingBubble.innerHTML = `<strong>AI Error:</strong><p style="color:#fca5a5;">${escapeHtml(err.message)}</p>`;
      } finally {
        const sendBtn = document.getElementById('btn-sim-send');
        if (sendBtn) sendBtn.disabled = false;
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    });
  }
}

window.quickSimulate = function(promptText) {
  const input = document.getElementById('sim-input-message');
  if (input) {
    input.value = promptText;
    const form = document.getElementById('form-simulate-ai');
    if (form) form.dispatchEvent(new Event('submit'));
  }
};

// ========================================================
// AI Knowledge Base (Q&A & Customer Psychology) Management
// ========================================================
let allFaqs = [];
let activeCategory = 'all';
let searchQuery = '';

async function loadFaqs() {
  try {
    const res = await fetch('/api/faqs');
    const data = await res.json();
    allFaqs = data.faqs || [];

    // Update Stats
    const totalEl = document.getElementById('stat-total-faqs');
    const catEl = document.getElementById('stat-total-categories');
    const ansEl = document.getElementById('stat-total-answers');
    const badgeEl = document.getElementById('qna-counter');
    const statFaqCount = document.getElementById('ai-stat-faq-count');

    if (totalEl) totalEl.textContent = String(allFaqs.length);
    if (badgeEl) badgeEl.textContent = String(allFaqs.length);
    if (statFaqCount) statFaqCount.textContent = `${allFaqs.length} Terhubung`;

    const categories = new Set(allFaqs.map(f => f.category).filter(Boolean));
    if (catEl) catEl.textContent = String(categories.size);
    if (ansEl) ansEl.textContent = '100%';

    renderFaqs();
  } catch (err) {
    console.error('Gagal memuat faqs:', err);
  }
}

function renderFaqs() {
  const container = document.getElementById('faqs-list-container');
  if (!container) return;

  const filtered = allFaqs.filter(faq => {
    const matchCategory = activeCategory === 'all' || (faq.category || '').toLowerCase() === activeCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchSearch = !query || 
      (faq.question || '').toLowerCase().includes(query) ||
      (faq.answer || '').toLowerCase().includes(query) ||
      (faq.category || '').toLowerCase().includes(query);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Tidak ada tanya-jawab yang cocok dengan filter atau pencarian Anda.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddFaqModal()" style="margin-top: 10px;">
          + Tambah Q&A Baru
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(faq => `
    <div class="faq-card" data-id="${escapeHtml(faq.id)}">
      <div class="faq-card-header">
        <span class="faq-category-badge">${escapeHtml(faq.category || 'Umum')}</span>
        <div class="faq-card-actions">
          <button class="btn-icon-sm" onclick="editFaq('${escapeHtml(faq.id)}')">✏️ Edit</button>
          <button class="btn-icon-sm danger" onclick="deleteFaq('${escapeHtml(faq.id)}')">🗑️ Hapus</button>
        </div>
      </div>
      <div class="faq-question">❓ ${escapeHtml(faq.question)}</div>
      <div class="faq-answer">
        <strong>Jawaban Resmi AI:</strong>
        <p style="margin-top: 4px;">${formatWhatsAppText(faq.answer)}</p>
      </div>
    </div>
  `).join('');
}

async function loadCustomerQuestions() {
  try {
    const res = await fetch('/api/customer-questions');
    const data = await res.json();
    const questions = data.questions || [];

    const box = document.getElementById('detected-questions-box');
    const list = document.getElementById('detected-questions-list');
    const counter = document.getElementById('detected-counter');

    if (!box || !list) return;

    if (questions.length === 0) {
      box.style.display = 'none';
      return;
    }

    box.style.display = 'block';
    if (counter) counter.textContent = `${questions.length} Baru`;

    list.innerHTML = questions.slice(0, 5).map(q => `
      <div class="dq-item">
        <div class="dq-info">
          <span class="dq-question">"${escapeHtml(q.question)}"</span>
          <span class="dq-sender">${escapeHtml(q.senderName || 'Pelanggan')} (+${escapeHtml(q.phone || '')}) &bull; ${new Date(q.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="teachFromQuestion('${escapeHtml(q.question)}')">
          Ajari AI Jawaban Ini
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Gagal memuat customer questions:', err);
  }
}

function initQnaModal() {
  const addBtn = document.getElementById('btn-add-faq');
  if (addBtn) addBtn.onclick = openAddFaqModal;

  const modal = document.getElementById('qna-modal');
  const closeBtn = document.getElementById('modal-qna-close-btn');
  const cancelBtn = document.getElementById('modal-qna-cancel-btn');
  const saveBtn = document.getElementById('modal-qna-save-btn');

  if (closeBtn) closeBtn.onclick = closeQnaModal;
  if (cancelBtn) cancelBtn.onclick = closeQnaModal;

  if (saveBtn) {
    saveBtn.onclick = saveQnaItem;
  }

  // Search input filter
  const searchInput = document.getElementById('qna-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderFaqs();
    });
  }

  // Category pills filter
  const pills = document.querySelectorAll('#qna-category-pills .pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-cat') || 'all';
      renderFaqs();
    });
  });
}

window.openAddFaqModal = function() {
  const modal = document.getElementById('qna-modal');
  if (!modal) return;
  document.getElementById('modal-qna-title').textContent = 'Ajari AI: Tambah Tanya-Jawab Baru';
  document.getElementById('modal-qna-id').value = '';
  document.getElementById('modal-qna-category').value = 'Pemasangan & Obras';
  document.getElementById('modal-qna-question').value = '';
  document.getElementById('modal-qna-answer').value = '';
  modal.classList.add('active');
};

window.teachFromQuestion = function(questionText) {
  openAddFaqModal();
  document.getElementById('modal-qna-question').value = questionText;
  document.getElementById('modal-qna-answer').focus();
};

window.editFaq = function(faqId) {
  const faq = allFaqs.find(f => f.id === faqId);
  if (!faq) return;

  const modal = document.getElementById('qna-modal');
  if (!modal) return;

  document.getElementById('modal-qna-title').textContent = 'Edit Knowledge Base AI';
  document.getElementById('modal-qna-id').value = faq.id;
  document.getElementById('modal-qna-category').value = faq.category || 'Pemasangan & Obras';
  document.getElementById('modal-qna-question').value = faq.question || '';
  document.getElementById('modal-qna-answer').value = faq.answer || '';
  modal.classList.add('active');
};

window.deleteFaq = async function(faqId) {
  const ok = await askConfirmDialog({
    title: 'Hapus Tanya-Jawab AI?',
    message: 'Apakah Anda yakin ingin menghapus tanya-jawab ini dari Knowledge Base AI?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!ok) return;
  try {
    const res = await fetch(`/api/faqs/${faqId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Tanya-jawab berhasil dihapus!', 'success');
      loadFaqs();
    } else {
      showToast('Gagal menghapus: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

window.closeQnaModal = function() {
  const modal = document.getElementById('qna-modal');
  if (modal) modal.classList.remove('active');
};

async function saveQnaItem() {
  const id = document.getElementById('modal-qna-id').value;
  const category = document.getElementById('modal-qna-category').value;
  const question = document.getElementById('modal-qna-question').value.trim();
  const answer = document.getElementById('modal-qna-answer').value.trim();

  if (!question || !answer) {
    showToast('Pertanyaan dan jawaban wajib diisi!', 'error');
    return;
  }

  const payload = { category, question, answer };
  const saveBtn = document.getElementById('modal-qna-save-btn');

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan...';
    }

    const url = id ? `/api/faqs/${id}` : '/api/faqs';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(id ? 'Knowledge Base berhasil diperbarui!' : 'Tanya-jawab baru berhasil diajarkan ke AI!', 'success');
      closeQnaModal();
      loadFaqs();
    } else {
      showToast('Gagal menyimpan: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan ke Knowledge Base';
    }
  }
}

// Bot & Business Settings (Safe fallback)
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    if (config.business && document.getElementById('cfg-biz-name')) {
      document.getElementById('cfg-biz-name').value = config.business.name || '';
      if (document.getElementById('cfg-biz-tagline')) document.getElementById('cfg-biz-tagline').value = config.business.tagline || '';
      if (document.getElementById('cfg-biz-phone')) document.getElementById('cfg-biz-phone').value = config.business.phone || '';
      if (document.getElementById('cfg-biz-email')) document.getElementById('cfg-biz-email').value = config.business.email || '';
      if (document.getElementById('cfg-biz-website')) document.getElementById('cfg-biz-website').value = config.business.website || '';
      if (document.getElementById('cfg-biz-address')) document.getElementById('cfg-biz-address').value = config.business.address || '';
      if (document.getElementById('cfg-biz-maps')) document.getElementById('cfg-biz-maps').value = config.business.maps_url || '';
      if (document.getElementById('cfg-biz-hours')) document.getElementById('cfg-biz-hours').value = config.business.hours || '';
    }

    if (config.bot && document.getElementById('cfg-bot-ignore-groups')) {
      document.getElementById('cfg-bot-ignore-groups').checked = !!config.bot.ignore_groups;
    }
  } catch (err) {
    console.error('Gagal memuat konfigurasi:', err);
  }
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

// Custom In-App Confirmation Pop-up (Replaces native browser confirm)
function askConfirmDialog({ title = 'Konfirmasi Tindakan', message = '', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'warning' } = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
      resolve(true);
      return;
    }
    const titleEl = document.getElementById('confirm-modal-title-text');
    const msgEl = document.getElementById('confirm-modal-message');
    const iconEl = document.getElementById('confirm-modal-icon');
    const okBtn = document.getElementById('confirm-modal-ok-btn');
    const cancelBtn = document.getElementById('confirm-modal-cancel-btn');
    const closeBtn = document.getElementById('confirm-modal-close-btn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (iconEl) iconEl.textContent = type === 'danger' ? '🗑️' : type === 'info' ? '🔄' : '⚠️';
    if (okBtn) {
      okBtn.textContent = confirmText;
      okBtn.className = type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
    }
    if (cancelBtn) cancelBtn.textContent = cancelText;

    let resolved = false;
    const cleanup = (result) => {
      if (resolved) return;
      resolved = true;
      modal.classList.remove('active');
      okBtn?.removeEventListener('click', onOk);
      cancelBtn?.removeEventListener('click', onCancel);
      closeBtn?.removeEventListener('click', onCancel);
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    okBtn?.addEventListener('click', onOk);
    cancelBtn?.addEventListener('click', onCancel);
    closeBtn?.addEventListener('click', onCancel);

    modal.classList.add('active');
  });
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

// ========================================================
// HANDS-OFF CUSTOMER SERVICE & AI TAKEOVER CONTROLLER
// ========================================================
let handoffConfigData = {
  enabled: true,
  keywords: ['cs', 'operator', 'admin', 'bantuan manusia', 'komplain'],
  release_keywords: ['aktifkan bot', 'bot on', 'reset bot'],
  auto_expire_hours: 2,
  takeover_notice: 'Halo! Permintaan Anda telah kami teruskan ke Customer Service Sultan Carpet. Tim kami akan segera merespons Anda.',
  release_notice: 'Bot asisten Sultan Carpet telah aktif kembali. Silakan ketik pertanyaan atau konsultasi karpet Anda.'
};

async function loadHandoffs() {
  try {
    const res = await fetch('/api/handoffs');
    if (!res.ok) return;
    const data = await res.json();
    
    if (data.config) {
      handoffConfigData = { ...handoffConfigData, ...data.config };
      populateHandoffConfigUI(handoffConfigData);
    }

    const handoffs = data.handoffs || [];
    const counterEl = document.getElementById('handoff-counter');
    if (counterEl) {
      counterEl.textContent = handoffs.length;
      counterEl.style.display = handoffs.length > 0 ? 'inline-block' : 'none';
    }

    const statActive = document.getElementById('stat-active-handoffs');
    if (statActive) statActive.textContent = handoffs.length;

    const statKeywords = document.getElementById('stat-handoff-keywords');
    if (statKeywords) statKeywords.textContent = (handoffConfigData.keywords || []).length;

    const statExpire = document.getElementById('stat-handoff-expire');
    if (statExpire) statExpire.textContent = `${handoffConfigData.auto_expire_hours || 2} Jam`;

    renderHandoffsList(handoffs);
  } catch (err) {
    console.error('Error loading handoffs:', err);
  }
}

function populateHandoffConfigUI(cfg) {
  const kwInput = document.getElementById('handoff-keywords-input');
  if (kwInput && !kwInput.matches(':focus')) {
    kwInput.value = (cfg.keywords || []).join(', ');
  }

  const rkwInput = document.getElementById('release-keywords-input');
  if (rkwInput && !rkwInput.matches(':focus')) {
    rkwInput.value = (cfg.release_keywords || []).join(', ');
  }

  const expInput = document.getElementById('handoff-expire-input');
  if (expInput && !expInput.matches(':focus')) {
    expInput.value = cfg.auto_expire_hours || 2;
  }

  const toggle = document.getElementById('handoff-enabled-toggle');
  if (toggle) {
    toggle.checked = cfg.enabled !== false;
  }

  const badge = document.getElementById('handoff-status-badge');
  if (badge) {
    badge.textContent = cfg.enabled !== false ? 'Modul Aktif' : 'Modul Nonaktif';
    badge.className = cfg.enabled !== false ? 'tag-status' : 'tag-status tag-closed';
  }

  const tNotice = document.getElementById('handoff-takeover-notice');
  if (tNotice && !tNotice.matches(':focus')) {
    tNotice.value = cfg.takeover_notice || '';
  }

  const rNotice = document.getElementById('handoff-release-notice');
  if (rNotice && !rNotice.matches(':focus')) {
    rNotice.value = cfg.release_notice || '';
  }
}

function renderHandoffsList(handoffs) {
  const container = document.getElementById('handoffs-list-container');
  if (!container) return;

  if (!handoffs || handoffs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <div style="font-size: 28px; margin-bottom: 8px;">✅</div>
        <p style="font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0;">Tidak Ada Kontak dalam Mode Takeover</p>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Semua chat pelanggan saat ini ditangani otomatis oleh asisten AI bot.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${handoffs.map(h => {
        const jid = h.jid || h.phone || '';
        const phone = h.phone || jid.replace('@s.whatsapp.net', '');
        const timeStr = h.startedAt ? new Date(h.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md); flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="font-weight: 600; color: #f87171; display: flex; align-items: center; gap: 8px;">
                <span>👤 +${escapeHtml(phone)}</span>
                <span style="font-size: 11px; background: rgba(239, 68, 68, 0.2); padding: 2px 8px; border-radius: 999px;">CS Aktif</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Alasan: <em>${escapeHtml(h.reason || 'Takeover oleh sistem')}</em> • Waktu: ${timeStr} WIB
              </div>
            </div>
            <div>
              <button class="btn btn-secondary" onclick="releaseHandoffDirect('${escapeHtml(jid)}')" style="padding: 6px 14px; font-size: 12px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color);">
                <span>Kembalikan ke Bot</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.releaseHandoffDirect = async function(jid) {
  try {
    const res = await fetch(`/api/chats/${encodeURIComponent(jid)}/toggle-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiEnabled: true, isHumanHandoff: false })
    });
    if (res.ok) {
      showToast('Bot AI berhasil diaktifkan kembali untuk kontak ini', 'success');
      loadHandoffs();
    } else {
      showToast('Gagal mengubah status kontak', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan jaringan', 'error');
  }
};

function initHandoffForm() {
  const btnRefresh = document.getElementById('btn-refresh-handoffs');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadHandoffs();
      showToast('Data alih kendali disegarkan', 'info');
    });
  }

  const btnManual = document.getElementById('btn-do-manual-handoff');
  if (btnManual) {
    btnManual.addEventListener('click', async () => {
      const input = document.getElementById('manual-handoff-input');
      const reasonInput = document.getElementById('manual-handoff-reason');
      const phone = (input?.value || '').trim();
      const reason = (reasonInput?.value || '').trim() || 'Takeover manual oleh admin';

      if (!phone) {
        showToast('Masukkan nomor WhatsApp pelanggan', 'error');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

      try {
        const res = await fetch(`/api/chats/${encodeURIComponent(jid)}/toggle-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aiEnabled: false, isHumanHandoff: true, reason })
        });
        if (res.ok) {
          showToast(`Nomor +${cleanPhone} berhasil ditakeover oleh CS Manusia`, 'success');
          if (input) input.value = '';
          if (reasonInput) reasonInput.value = '';
          loadHandoffs();
        } else {
          showToast('Gagal melakukan takeover manual', 'error');
        }
      } catch (err) {
        showToast('Kesalahan jaringan', 'error');
      }
    });
  }

  const btnSaveConfig = document.getElementById('btn-save-handoff-config');
  if (btnSaveConfig) {
    btnSaveConfig.addEventListener('click', async () => {
      const kwInput = document.getElementById('handoff-keywords-input');
      const rkwInput = document.getElementById('release-keywords-input');
      const expInput = document.getElementById('handoff-expire-input');
      const toggle = document.getElementById('handoff-enabled-toggle');
      const tNotice = document.getElementById('handoff-takeover-notice');
      const rNotice = document.getElementById('handoff-release-notice');

      const keywords = (kwInput?.value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const release_keywords = (rkwInput?.value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const auto_expire_hours = Number(expInput?.value || 2);
      const enabled = toggle ? toggle.checked : true;
      const takeover_notice = tNotice?.value || '';
      const release_notice = rNotice?.value || '';

      try {
        const res = await fetch('/api/handoffs/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled,
            keywords,
            release_keywords,
            auto_expire_hours,
            takeover_notice,
            release_notice
          })
        });
        if (res.ok) {
          showToast('Pengaturan Hands-Off berhasil disimpan!', 'success');
          loadHandoffs();
        } else {
          showToast('Gagal menyimpan pengaturan', 'error');
        }
      } catch (err) {
        showToast('Kesalahan jaringan saat menyimpan', 'error');
      }
    });
  }

  const btnTest = document.getElementById('btn-test-handoff');
  if (btnTest) {
    btnTest.addEventListener('click', () => {
      const input = document.getElementById('test-handoff-input');
      const text = (input?.value || '').toLowerCase().trim();
      const resultBox = document.getElementById('test-handoff-result');
      if (!text || !resultBox) return;

      const keywords = handoffConfigData.keywords || [];
      const matched = keywords.filter(k => text.includes(k.toLowerCase()));

      resultBox.style.display = 'block';
      if (matched.length > 0) {
        resultBox.style.background = 'rgba(239, 68, 68, 0.15)';
        resultBox.style.border = '1px solid rgba(239, 68, 68, 0.4)';
        resultBox.style.color = '#fca5a5';
        resultBox.innerHTML = `⚠️ <strong>Memicu Alih Kendali!</strong> Kata kunci terdeteksi: <strong>"${matched.join('", "')}"</strong>. Sistem akan menghentikan bot dan menyerahkan chat ke CS manusia.`;
      } else {
        resultBox.style.background = 'rgba(34, 197, 94, 0.15)';
        resultBox.style.border = '1px solid rgba(34, 197, 94, 0.4)';
        resultBox.style.color = '#86efac';
        resultBox.innerHTML = `✅ <strong>Aman (Dijawab AI Bot)</strong>: Pesan ini tidak memicu alih kendali. Bot AI akan merespons pertanyaan pelanggan secara normal.`;
      }
    });
  }
}

// ========================================================
// WEBSITE CRAWLER & SCRAPING CONTROLLER
// ========================================================
let crawledPagesData = [];

async function loadCrawledPages() {
  const container = document.getElementById('crawled-pages-container');
  if (!container) return;

  try {
    const res = await fetch('/api/crawler/pages');
    if (!res.ok) throw new Error('Gagal memuat data crawler');
    const data = await res.json();
    crawledPagesData = data.pages || [];
    renderCrawledPagesList(crawledPagesData);
  } catch (err) {
    if (container) {
      container.innerHTML = `<div class="empty-state"><p style="color: #f87171;">Gagal memuat data: ${escapeHtml(err.message)}</p></div>`;
    }
  }
}

function renderCrawledPagesList(pages) {
  const container = document.getElementById('crawled-pages-container');
  if (!container) return;

  if (!pages || pages.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 28px 16px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <div style="font-size: 26px; margin-bottom: 8px;">🌐</div>
        <p style="font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0;">Belum Ada Halaman Website Terindeks</p>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Masukkan URL website/katalog pada formulir di atas untuk mulai scraping ke otak RAG.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;">
      ${pages.map(p => {
        const timeStr = p.crawledAt ? new Date(p.crawledAt).toLocaleString('id-ID') : '-';
        const chunkCount = p.chunks ? p.chunks.length : 0;
        const excerpt = p.content ? escapeHtml(p.content.slice(0, 160)) + '...' : 'Tidak ada ringkasan teks.';
        return `
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0; line-height: 1.3;" title="${escapeHtml(p.title || '')}">
                  ${escapeHtml(p.title || 'Halaman Web')}
                </h4>
                <span style="font-size: 11px; font-weight: 600; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 999px; padding: 2px 8px; white-space: nowrap;">
                  ${chunkCount} Chunks
                </span>
              </div>
              <a href="${escapeHtml(p.url)}" target="_blank" rel="noreferrer" style="font-size: 12px; color: #38bdf8; text-decoration: none; margin-top: 6px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                🔗 ${escapeHtml(p.url)}
              </a>
              <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0; line-height: 1.5; background: rgba(2, 6, 23, 0.5); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
                ${excerpt}
              </p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; pt-2; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
              <span style="font-size: 11px; color: #64748b;">
                ${timeStr}
              </span>
              <button onclick="deleteCrawledPageDirect('${escapeHtml(p.id)}')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px; background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">
                🗑️ Hapus
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.deleteCrawledPageDirect = async function(id) {
  const ok = await askConfirmDialog({
    title: 'Hapus Halaman Website dari RAG?',
    message: 'Potongan teks halaman ini akan dihapus dari basis pengetahuan AI bot.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!ok) return;

  try {
    const res = await fetch(`/api/crawler/pages/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Halaman website berhasil dihapus dari RAG', 'success');
      loadCrawledPages();
    } else {
      showToast('Gagal menghapus halaman website', 'error');
    }
  } catch (err) {
    showToast('Kesalahan jaringan: ' + err.message, 'error');
  }
};

function initCrawlerForm() {
  const form = document.getElementById('crawler-form');
  const btnRefresh = document.getElementById('btn-refresh-crawler');
  const statusLabel = document.getElementById('crawler-status-label');
  const submitBtn = document.getElementById('btn-start-crawl');

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadCrawledPages();
      showToast('Data website crawler disegarkan', 'info');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const urlInput = document.getElementById('crawler-url-input');
      const maxPagesSelect = document.getElementById('crawler-max-pages');
      const followCheckbox = document.getElementById('crawler-follow-links');

      const url = (urlInput?.value || '').trim();
      const maxPages = Number(maxPagesSelect?.value || 1);
      const followInternalLinks = followCheckbox ? followCheckbox.checked : false;

      if (!url) {
        showToast('Masukkan URL website yang valid', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sedang Scraping...</span>';
      }
      if (statusLabel) {
        statusLabel.textContent = '⏳ Mengunduh & mengekstrak konten web...';
      }

      try {
        const res = await fetch('/api/crawler/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, maxPages, followInternalLinks })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showToast(`Berhasil scrape ${data.totalPages || 1} halaman (${data.totalChunks || 0} chunks RAG)!`, 'success');
          if (urlInput) urlInput.value = '';
          loadCrawledPages();
        } else {
          showToast('Gagal scraping: ' + (data.error || 'Kesalahan server'), 'error');
        }
      } catch (err) {
        showToast('Kesalahan jaringan saat crawling: ' + err.message, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Mulai Scraping Web</span>';
        }
        if (statusLabel) {
          statusLabel.textContent = '';
        }
      }
    });
  }
}
