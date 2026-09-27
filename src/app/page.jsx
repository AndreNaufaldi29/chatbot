'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  MessageSquare,
  Ticket,
  ShoppingBag,
  Send,
  Sparkles,
  Settings,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Bot,
  User,
  Zap,
  Phone,
  Building,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Check,
  Search,
  Sliders,
  ChevronRight,
  ArrowRight,
  Plus,
  Edit3,
  X,
  Upload,
  Image as ImageIcon,
  CheckCheck,
  MessageCircle,
  Filter,
  Smile,
  Copy,
  Menu,
  ArrowLeft,
  Database,
  Smartphone
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'gemini' | 'qr' | 'tickets' | 'catalog' | 'sender' | 'settings'

  // Mobile Navigation & View States
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Prisma Database State
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    databaseUrl: '',
    prisma: { installed: true, vercelReady: true },
    counts: { products: 0, tickets: 0, chats: 0 }
  });
  const [dbForm, setDbForm] = useState({
    databaseUrl: '',
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    database: 'chatbot_wa'
  });
  const [savingDb, setSavingDb] = useState(false);

  // Bot Status State
  const [botStatus, setBotStatus] = useState({
    status: 'connecting',
    user: null,
    qrDataUrl: null,
    connectedAt: null,
  });

  // Data States
  const [chatLogs, setChatLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [toast, setToast] = useState(null);

  // AI Provider & State
  const [aiProvider, setAiProvider] = useState('groq'); // 'groq' | 'gemini'
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showGroqApiKey, setShowGroqApiKey] = useState(false);
  const [groqModel, setGroqModel] = useState('openai/gpt-oss-120b');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash-lite');
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);

  // Gemini Simulator State
  const [simPrompt, setSimPrompt] = useState('Halo, apakah keramik Harbor tahan dimasukkan ke microwave?');
  const [simulating, setSimulating] = useState(false);
  const [simHistory, setSimHistory] = useState([
    {
      role: 'user',
      text: 'Halo, saya mau tanya apakah piring keramiknya aman buat microwave?',
      time: '19:10',
    },
    {
      role: 'ai',
      text: 'Halo Kak, ya tentu saja. Seluruh produk keramik artisanal dari Harbor 100% food-safe, aman untuk microwave, maupun dishwasher. Apakah ada produk tertentu yang sedang Kakak cari seperti The Everyday Set?',
      time: '19:10',
    }
  ]);

  // Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState('Open');
  const [ticketNotesUpdate, setTicketNotesUpdate] = useState('');
  const [ticketCategoryUpdate, setTicketCategoryUpdate] = useState('Layanan Umum');
  const [ticketPriorityUpdate, setTicketPriorityUpdate] = useState('Normal');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('Semua');

  // Send Manual Message Form
  const [manualPhone, setManualPhone] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [sendingManual, setSendingManual] = useState(false);

  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState({
    name: 'Harbor',
    tagline: 'Stoneware & Mindful Living',
    phone: '',
    email: '',
    website: '',
    address: '',
    hours: ''
  });

  // Product Catalog State & Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    code: '',
    price: '',
    subtitle: '',
    footer: '',
    url: '',
    image: 'catalog/everyday-set.jpg',
    imageBase64: '',
  });
  const [imagePreview, setImagePreview] = useState('/catalog/everyday-set.jpg');
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const fileInputRef = useRef(null);

  // Conversations State (1 User 1 Chat WhatsApp Layout)
  const [conversations, setConversations] = useState([]);
  const [selectedChatJid, setSelectedChatJid] = useState(null);
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'unread' | 'ai'
  const [chatInputText, setChatInputText] = useState('');
  const [sendingDirectReply, setSendingDirectReply] = useState(false);
  const isSendingDirectReplyRef = useRef(false);
  const activeChatScrollRef = useRef(null);

  // Active selected conversation (accessible throughout component and handlers)
  const activeConversation = conversations.find(
    (c) => (c.jid && c.jid === selectedChatJid) || c.phone === selectedChatJid
  ) || (conversations.length > 0 ? conversations[0] : null);

  // Customer Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const chatContainerRef = useRef(null);

  // Show Toast Notification
  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial config & status
  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchTickets();
    fetchChats();
    fetchDbStatus();

    // Setup SSE for real-time events
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('init', (e) => {
      try {
        const data = JSON.parse(e.data);
        setBotStatus(data);
      } catch (err) {}
    });

    eventSource.addEventListener('status_change', (e) => {
      try {
        const data = JSON.parse(e.data);
        setBotStatus((prev) => ({ ...prev, ...data }));
        if (data.status === 'connected') {
          showToastMsg('WhatsApp berhasil terhubung!', 'success');
        }
      } catch (err) {}
    });

    eventSource.addEventListener('qr', (e) => {
      try {
        const data = JSON.parse(e.data);
        setBotStatus((prev) => ({
          ...prev,
          status: 'waiting_qr',
          qrDataUrl: data.qrDataUrl,
        }));
      } catch (err) {}
    });

    eventSource.addEventListener('chat_log', (e) => {
      try {
        const msg = JSON.parse(e.data);
        setChatLogs((prev) => [...prev, msg]);

        // Real-time 1 User 1 Chat state update
        setConversations((prev) => {
          const key = msg.jid || msg.phone;
          const index = prev.findIndex((c) => {
            if (c.jid && c.jid === key) return true;
            if (msg.jid && c.jid === msg.jid) return true;
            if (msg.phone && c.phone && c.phone === msg.phone) return true;
            if (msg.senderName && msg.senderName !== 'Pelanggan' && c.senderName === msg.senderName) return true;
            return false;
          });

          if (index !== -1) {
            const updated = [...prev];
            const target = { ...updated[index] };
            const existingMsgIndex = (target.messages || []).findIndex(
              (m) =>
                m.id === msg.id ||
                (m.direction === msg.direction &&
                  m.text &&
                  msg.text &&
                  m.text.trim() === msg.text.trim() &&
                  Math.abs(new Date(m.timestamp || 0).getTime() - new Date(msg.timestamp || 0).getTime()) < 6000)
            );

            if (existingMsgIndex !== -1) {
              const newMsgs = [...(target.messages || [])];
              newMsgs[existingMsgIndex] = { ...newMsgs[existingMsgIndex], ...msg };
              target.messages = newMsgs;
            } else {
              target.messages = [...(target.messages || []), msg];
            }
            target.lastMessage = msg;
            target.updatedAt = msg.timestamp;
            if (msg.direction === 'in' && msg.senderName && msg.senderName !== 'Pelanggan') {
              target.senderName = msg.senderName;
            }
            if (msg.jid && msg.jid.includes('@lid')) {
              target.jid = msg.jid;
            }
            if (msg.phone && msg.phone.length <= 13) {
              target.phone = msg.phone;
              if (msg.formattedPhone) target.formattedPhone = msg.formattedPhone;
            }
            // Move active conversation to the top
            updated.splice(index, 1);
            return [target, ...updated];
          } else {
            const newConv = {
              jid: msg.jid,
              phone: msg.phone,
              formattedPhone: msg.formattedPhone,
              senderName: msg.senderName || msg.phone,
              lastMessage: msg,
              unreadCount: msg.direction === 'in' ? 1 : 0,
              messages: [msg],
              updatedAt: msg.timestamp,
            };
            const remaining = prev.filter(
              (c) => (msg.jid && c.jid === msg.jid) ? false : (msg.phone && c.phone === msg.phone ? false : true)
            );
            return [newConv, ...remaining];
          }
        });
      } catch (err) {}
    });

    eventSource.addEventListener('chats_cleared', () => {
      setConversations([]);
      setSelectedChatJid(null);
    });

    eventSource.addEventListener('chat_deleted', (e) => {
      try {
        const data = JSON.parse(e.data);
        setConversations((prev) => prev.filter((c) => c.jid !== data.jid && c.phone !== data.jid));
      } catch (err) {}
    });

    eventSource.addEventListener('profile_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        setConversations((prev) =>
          prev.map((c) => {
            const isMatch = c.jid === data.jid || c.phone === data.jid || (data.phone && c.phone === data.phone);
            if (isMatch) {
              return {
                ...c,
                senderName: data.name || c.senderName,
                phone: data.phone || c.phone,
                formattedPhone: data.formattedPhone || c.formattedPhone,
                messages: (c.messages || []).map((m) => ({
                  ...m,
                  senderName: m.direction === 'in' ? (data.name || m.senderName) : m.senderName,
                  phone: data.phone || m.phone,
                  formattedPhone: data.formattedPhone || m.formattedPhone,
                }))
              };
            }
            return c;
          })
        );
      } catch (err) {}
    });

    eventSource.addEventListener('ticket_created', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data || !data.id) return;
        setTickets((prev) => {
          const exists = prev.some((t) => t.id === data.id);
          if (exists) {
            return prev.map((t) => (t.id === data.id ? { ...t, ...data } : t));
          }
          return [data, ...prev];
        });
        showToastMsg(`Tiket baru dibuat: #${data.id}`, 'info');
      } catch (err) {}
    });

    eventSource.addEventListener('ticket_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        setTickets((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      } catch (err) {}
    });

    eventSource.addEventListener('catalog_updated', (e) => {
      try {
        const newCatalog = JSON.parse(e.data);
        setConfig((prev) => prev ? { ...prev, catalog: newCatalog } : prev);
      } catch (err) {}
    });

    eventSource.addEventListener('db_status', (e) => {
      try {
        const data = JSON.parse(e.data);
        setDbStatus(data);
      } catch (err) {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Auto scroll chat log to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLogs]);

  // Auto scroll active WhatsApp conversation to bottom (guaranteed latest message on tab switch)
  const scrollToBottom = () => {
    if (activeChatScrollRef.current) {
      activeChatScrollRef.current.scrollTop = activeChatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (activeTab === 'chats') {
      scrollToBottom();
      const t1 = setTimeout(scrollToBottom, 40);
      const t2 = setTimeout(scrollToBottom, 120);
      const t3 = setTimeout(scrollToBottom, 300);
      const t4 = setTimeout(scrollToBottom, 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [activeTab, selectedChatJid, conversations]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const unique = [];
        const seen = new Set();
        for (const item of data) {
          const k = item.jid || item.phone;
          if (k && !seen.has(k)) {
            seen.add(k);
            unique.push(item);
          }
        }
        setConversations(unique);
        if (unique.length > 0 && !selectedChatJid) {
          setSelectedChatJid(unique[0].jid || unique[0].phone);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setBotStatus(data);
    } catch (err) {}
  };

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      if (data.ai) {
        setAiProvider(data.ai.provider || 'groq');
        setGroqApiKey(data.ai.groq_api_key || '');
        let gModel = data.ai.groq_model || 'openai/gpt-oss-120b';
        if (gModel.includes('mixtral') || gModel.includes('preview') || gModel.includes('llama-3.3') || gModel.includes('llama-3.1')) {
          gModel = 'openai/gpt-oss-120b';
        }
        setGroqModel(gModel);
        setGeminiApiKey(data.ai.gemini_api_key || '');
        let model = data.ai.model || 'gemini-3.5-flash-lite';
        if (model.includes('gemini-2.0') || model.includes('gemini-1.5') || model.includes('gemini-2.5')) {
          model = 'gemini-3.5-flash-lite';
        }
        setGeminiModel(model);
        setGeminiEnabled(data.ai.enabled !== false);
        setSystemPrompt(data.ai.system_instructions || '');
      }
      if (data.business) {
        setBusinessSettings(data.business);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (Array.isArray(data)) {
        const seen = new Set();
        const unique = [];
        for (const t of data) {
          if (t && t.id && !seen.has(t.id)) {
            seen.add(t.id);
            unique.push(t);
          }
        }
        setTickets(unique);
      }
    } catch (err) {}
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {}
  };

  const handleSaveDbConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingDb(true);
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbForm),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(data.message || 'Konfigurasi Prisma berhasil disimpan!', 'success');
        fetchDbStatus();
      } else {
        showToastMsg(data.error || 'Gagal menyimpan konfigurasi Prisma', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingDb(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('Mulai ulang koneksi WhatsApp?')) return;
    try {
      showToastMsg('Memulai ulang koneksi...', 'info');
      const res = await fetch('/api/restart', { method: 'POST' });
      const data = await res.json();
      showToastMsg(data.message || 'Restart terkirim', 'success');
      fetchStatus();
    } catch (err) {
      showToastMsg('Gagal restart: ' + err.message, 'error');
    }
  };

  const handleLogout = async () => {
    if (!confirm('Logout dan hapus sesi WhatsApp? Anda perlu scan QR ulang.')) return;
    try {
      showToastMsg('Menghapus sesi & memuat QR...', 'info');
      await fetch('/api/logout', { method: 'POST' });
      setActiveTab('qr');
      showToastMsg('Sesi dihapus. Silakan scan QR baru.', 'success');
    } catch (err) {
      showToastMsg('Gagal logout: ' + err.message, 'error');
    }
  };

  const handleSaveAiSettings = async () => {
    if (!config) return;
    const updated = {
      ...config,
      ai: {
        ...config.ai,
        enabled: geminiEnabled,
        provider: aiProvider,
        groq_api_key: groqApiKey.trim(),
        groq_model: groqModel,
        gemini_api_key: geminiApiKey.trim(),
        model: geminiModel,
        system_instructions: systemPrompt,
      },
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(updated);
        showToastMsg('Pengaturan AI (Groq & Gemini) berhasil disimpan!', 'success');
      } else {
        showToastMsg(data.error || 'Gagal menyimpan', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    }
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const activeKey = aiProvider === 'groq' ? groqApiKey.trim() : geminiApiKey.trim();
      const activeModel = aiProvider === 'groq' ? groqModel : geminiModel;
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: activeKey,
          model: activeModel,
        }),
      });
      const data = await res.json();
      setAiTestResult(data);
      if (data.success) {
        if (aiProvider === 'gemini' && data.model) {
          setGeminiModel(data.model);
        } else if (aiProvider === 'groq' && data.model) {
          setGroqModel(data.model);
        }
        showToastMsg(`${aiProvider === 'groq' ? 'Groq LPU' : 'Gemini'} AI Terhubung! (${data.elapsed}ms)`, 'success');
      } else {
        showToastMsg(`Koneksi ${aiProvider === 'groq' ? 'Groq' : 'Gemini'} gagal: ` + (data.message || data.error), 'error');
      }
    } catch (err) {
      setAiTestResult({ success: false, message: err.message });
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setTestingAi(false);
    }
  };

  const handleSimulateAi = async (e) => {
    e.preventDefault();
    if (!simPrompt.trim() || simulating) return;

    const userMessage = simPrompt.trim();
    setSimPrompt('');
    setSimHistory((prev) => [
      ...prev,
      { role: 'user', text: userMessage, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
    ]);

    setSimulating(true);
    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          provider: aiProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimHistory((prev) => [
          ...prev,
          { 
            role: 'ai', 
            text: data.reply, 
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            provider: data.provider || aiProvider,
          },
        ]);
      } else {
        setSimHistory((prev) => [
          ...prev,
          { role: 'ai', text: `⚠️ *Error:* ${data.error || 'Gagal mendapatkan balasan AI.'}`, time: 'Sekarang' },
        ]);
      }
    } catch (err) {
      setSimHistory((prev) => [
        ...prev,
        { role: 'ai', text: `⚠️ *Error:* ${err.message}`, time: 'Sekarang' },
      ]);
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!config) return;
    const updated = {
      ...config,
      business: businessSettings,
    };
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(updated);
        showToastMsg('Profil bisnis berhasil diperbarui!', 'success');
      }
    } catch (err) {
      showToastMsg('Gagal: ' + err.message, 'error');
    }
  };

  const handleSendManual = async (e) => {
    e.preventDefault();
    if (!manualPhone || !manualMessage || sendingManual) return;
    setSendingManual(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: manualPhone, message: manualMessage }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Pesan WhatsApp berhasil dikirim!', 'success');
        setManualMessage('');
        setActiveTab('chats');
      } else {
        showToastMsg('Gagal mengirim: ' + data.error, 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSendingManual(false);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      code: '',
      price: '',
      subtitle: '',
      footer: '',
      url: '',
      image: 'catalog/everyday-set.jpg',
      imageBase64: '',
    });
    setImagePreview('/catalog/everyday-set.jpg');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    const cleanImg = (product.image || 'catalog/everyday-set.jpg').replace(/^assets\//, '');
    setProductForm({
      title: product.title || '',
      code: product.code || '',
      price: product.price || '',
      subtitle: product.subtitle || '',
      footer: product.footer || '',
      url: product.url || '',
      image: product.image || 'catalog/everyday-set.jpg',
      imageBase64: '',
    });
    setImagePreview(cleanImg.startsWith('http') || cleanImg.startsWith('data:') ? cleanImg : `/${cleanImg}`);
    setShowProductModal(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToastMsg('Ukuran foto maksimal 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm((prev) => ({ ...prev, imageBase64: reader.result }));
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title.trim() || !productForm.price.trim()) {
      showToastMsg('Nama produk dan harga wajib diisi!', 'error');
      return;
    }

    setSavingProduct(true);
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/catalog/${editingProduct.id}` : '/api/catalog';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(
          isEdit ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan ke katalog!',
          'success'
        );
        setShowProductModal(false);
        setConfig((prev) => ({ ...prev, catalog: data.catalog }));
      } else {
        showToastMsg(data.error || 'Gagal menyimpan produk', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    if (!confirm(`Hapus produk "${productTitle}" dari katalog?`)) return;
    setDeletingProductId(productId);
    try {
      const res = await fetch(`/api/catalog/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Produk "${productTitle}" berhasil dihapus dari katalog`, 'success');
        setConfig((prev) => ({ ...prev, catalog: data.catalog }));
      } else {
        showToastMsg(data.error || 'Gagal menghapus produk', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleSendDirectReply = async (e) => {
    if (e) e.preventDefault();
    if (isSendingDirectReplyRef.current) return;
    if (!chatInputText.trim() || sendingDirectReply || !activeConversation) return;

    isSendingDirectReplyRef.current = true;
    const messageToSend = chatInputText.trim();
    const targetJid = activeConversation.jid;
    const targetPhone = activeConversation.phone;

    // Use consistent client ID that backend Baileys and SSE will reuse
    const clientMsgId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    setChatInputText('');
    setSendingDirectReply(true);

    // Optimistically append sent reply so it appears immediately in the chat thread
    const optimisticMsg = {
      id: clientMsgId,
      direction: 'out',
      jid: targetJid,
      phone: targetPhone,
      senderName: 'Admin (Balasan Web)',
      text: messageToSend,
      isAi: false,
      timestamp: new Date().toISOString()
    };

    setConversations((prev) =>
      prev.map((c) => {
        const isMatch = (c.jid && c.jid === targetJid) || (c.phone && c.phone === targetPhone);
        if (isMatch) {
          // Avoid appending if already exists
          const alreadyExists = (c.messages || []).some(
            (m) =>
              m.id === clientMsgId ||
              (m.direction === 'out' &&
                m.text &&
                m.text.trim() === messageToSend &&
                Math.abs(new Date(m.timestamp || 0).getTime() - Date.now()) < 4000)
          );
          if (alreadyExists) return c;
          return {
            ...c,
            lastMessage: optimisticMsg,
            messages: [...(c.messages || []), optimisticMsg],
            updatedAt: optimisticMsg.timestamp
          };
        }
        return c;
      })
    );

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid: targetJid,
          phone: targetPhone,
          message: messageToSend,
          senderName: 'Admin (Balasan Web)',
          clientMessageId: clientMsgId
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showToastMsg('Gagal mengirim ke WhatsApp: ' + (data.error || 'Terjadi kesalahan'), 'error');
      } else if (!data.duplicate) {
        showToastMsg('Balasan berhasil dikirim ke WhatsApp!', 'success');
      }
    } catch (err) {
      showToastMsg('Error mengirim pesan: ' + err.message, 'error');
    } finally {
      isSendingDirectReplyRef.current = false;
      setSendingDirectReply(false);
    }
  };

  const handleInsertQuickTemplate = (text) => {
    setChatInputText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleDeleteConversation = async (e, conv) => {
    if (e) e.stopPropagation();
    if (!confirm(`Hapus seluruh riwayat obrolan dengan "${conv.senderName}"?`)) return;
    try {
      await fetch(`/api/chats/${encodeURIComponent(conv.jid || conv.phone)}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.jid !== conv.jid && c.phone !== conv.phone));
      showToastMsg(`Obrolan dengan ${conv.senderName} telah dihapus`, 'info');
      if (selectedChatJid === conv.jid || selectedChatJid === conv.phone) {
        const remaining = conversations.filter((c) => c.jid !== conv.jid && c.phone !== conv.phone);
        setSelectedChatJid(remaining.length > 0 ? remaining[0].jid || remaining[0].phone : null);
      }
    } catch (err) {
      showToastMsg('Gagal menghapus obrolan', 'error');
    }
  };

  const handleClearAllChats = async () => {
    if (!confirm('Hapus seluruh riwayat obrolan semua pelanggan?')) return;
    try {
      await fetch('/api/chats', { method: 'DELETE' });
      setConversations([]);
      setSelectedChatJid(null);
      showToastMsg('Seluruh riwayat obrolan telah dibersihkan', 'info');
    } catch (err) {
      showToastMsg('Gagal membersihkan riwayat obrolan', 'error');
    }
  };

  const handleOpenProfileModal = (conv) => {
    if (!conv) return;
    setProfileTarget(conv);
    setEditProfileName(conv.senderName || '');
    setEditProfilePhone(conv.phone || '');
    setShowProfileModal(true);
  };

  const handleCopyText = async (text, fieldName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToastMsg(`${fieldName} berhasil disalin!`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      showToastMsg('Gagal menyalin ke clipboard', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileTarget) return;

    const jid = profileTarget.jid || profileTarget.phone;
    if (!jid) return;

    setSavingProfile(true);
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(jid)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProfileName.trim(),
          phone: editProfilePhone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg('Profil pelanggan berhasil diperbarui!', 'success');
        // Update local state immediately
        setConversations((prev) =>
          prev.map((c) => {
            const isMatch = c.jid === jid || c.phone === jid || (profileTarget.phone && c.phone === profileTarget.phone);
            if (isMatch) {
              return {
                ...c,
                senderName: data.name || c.senderName,
                phone: data.phone || c.phone,
                formattedPhone: data.formattedPhone || c.formattedPhone,
                messages: (c.messages || []).map((m) => ({
                  ...m,
                  senderName: m.direction === 'in' ? (data.name || m.senderName) : m.senderName,
                  phone: data.phone || m.phone,
                  formattedPhone: data.formattedPhone || m.formattedPhone,
                }))
              };
            }
            return c;
          })
        );
        setShowProfileModal(false);
      } else {
        showToastMsg(data.error || 'Gagal menyimpan profil', 'error');
      }
    } catch (err) {
      console.error('Error updating customer profile:', err);
      showToastMsg('Terjadi kesalahan saat menyimpan profil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    try {
      if (selectedTicket.id === 'NEW') {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: selectedTicket.sender || selectedTicket.contact,
            name: selectedTicket.name,
            contact: selectedTicket.contact,
            description: selectedTicket.description,
            status: ticketStatusUpdate,
            notes: ticketNotesUpdate,
            category: ticketCategoryUpdate,
            priority: ticketPriorityUpdate,
          }),
        });
        const created = await res.json();
        setTickets((prev) => [created, ...prev]);
        setSelectedTicket(null);
        showToastMsg('Tiket baru berhasil dibuat!', 'success');
        return;
      }

      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: ticketStatusUpdate,
          notes: ticketNotesUpdate,
          category: ticketCategoryUpdate,
          priority: ticketPriorityUpdate,
        }),
      });
      const updated = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(null);
      showToastMsg('Status tiket berhasil diperbarui!', 'success');
    } catch (err) {
      showToastMsg('Gagal update tiket: ' + err.message, 'error');
    }
  };

  // Helper to format WhatsApp markdown and media tags into HTML
  const formatWaText = (text) => {
    if (!text) return '';
    let s = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format media indicators (photos, videos, stickers, docs, voice)
    s = s.replace(/\[Foto:?([^\]]*)\]/g, (match, caption) => {
      const capText = caption && caption.trim() ? `<div class="mt-1 text-slate-200 text-xs font-normal">${caption.trim()}</div>` : '';
      return `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium my-0.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Foto Diterima</div>${capText}`;
    });
    s = s.replace(/\[Video:?([^\]]*)\]/g, (match, caption) => {
      const capText = caption && caption.trim() ? `<div class="mt-1 text-slate-200 text-xs font-normal">${caption.trim()}</div>` : '';
      return `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-300 text-xs font-medium my-0.5"><span class="w-2 h-2 rounded-full bg-sky-400"></span>Video Diterima</div>${capText}`;
    });
    s = s.replace(/\[Stiker WhatsApp\]/g, '<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-medium my-0.5"><span class="w-2 h-2 rounded-full bg-purple-400"></span>Stiker WhatsApp</div>');
    s = s.replace(/\[Dokumen:?([^\]]*)\]/g, (match, docName) => {
      const dName = docName && docName.trim() ? `: ${docName.trim()}` : '';
      return `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-medium my-0.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span>Dokumen${dName}</div>`;
    });
    s = s.replace(/\[Pesan Suara \/ Audio\]/g, '<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-medium my-0.5"><span class="w-2 h-2 rounded-full bg-teal-400"></span>Pesan Suara / Audio</div>');

    s = s.replace(/\*([^*\n]+)\*/g, '<strong class="font-bold text-emerald-300">$1</strong>');
    s = s.replace(/_([^_\n]+)_/g, '<em class="italic text-slate-300">$1</em>');
    s = s.replace(/~([^~\n]+)~/g, '<del class="line-through text-slate-500">$1</del>');
    return s;
  };

  const isConnected = botStatus.status === 'connected';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b1120] text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-sky-950/90 border-sky-500/40 text-sky-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {toast.type === 'info' && <Zap className="w-5 h-5 text-sky-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* MOBILE DRAWER NAVIGATION */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex animate-in fade-in duration-200">
          <div className="w-4/5 max-w-xs bg-[#0f172a] border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl h-full animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
                    🏺
                  </div>
                  <div>
                    <h1 className="font-bold text-base text-white">Harbor CS</h1>
                    <p className="text-[11px] text-slate-400">WhatsApp AI Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('chats');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'chats'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" />
                    <span>Obrolan WhatsApp</span>
                  </div>
                  {conversations.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      {conversations.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('gemini');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'gemini'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI Studio (Groq / Gemini)</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    aiProvider === 'groq' ? 'bg-amber-500/30 text-amber-200' : 'bg-purple-500/30 text-purple-200'
                  }`}>
                    {aiProvider === 'groq' ? 'Groq' : 'Gemini'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('qr');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'qr'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-4 h-4" />
                    <span>Koneksi WhatsApp</span>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'tickets'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="w-4 h-4" />
                    <span>Tiket Layanan</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {tickets.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('catalog');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Katalog Produk</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {config?.catalog?.length || 3}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('sender');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'sender'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan Manual</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'settings'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Pengaturan & Database</span>
                </button>
              </nav>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {isConnected ? 'WA Terhubung' : 'WA Offline'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      {botStatus.user?.name || botStatus.user?.id || 'Bot Server'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>{dbStatus.connected ? 'PG OK' : 'No DB'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-medium transition border border-rose-900/40 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex md:w-72 shrink-0 border-r border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-xl flex-col justify-between p-4">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 px-3 py-3 mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent border border-emerald-500/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
              🏺
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-wide text-white">Harbor CS</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400">WhatsApp AI Assistant</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'chats'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>Obrolan WhatsApp</span>
              </div>
              {conversations.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {conversations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'gemini'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Studio (Groq / Gemini)</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                aiProvider === 'groq' ? 'bg-amber-500/30 text-amber-200' : 'bg-purple-500/30 text-purple-200'
              }`}>
                {aiProvider === 'groq' ? '⚡ Groq' : '🔮 Gemini'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'qr'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-4 h-4" />
                <span>Koneksi WhatsApp</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'tickets'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4" />
                <span>Tiket Layanan</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Katalog Produk</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {config?.catalog?.length || 3}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sender')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'sender'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesan Manual</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Bisnis</span>
            </button>
          </nav>
        </div>

        {/* Status Pill in Footer */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          {/* Prisma Status Indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Database className={`w-3.5 h-3.5 ${dbStatus.connected ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <span className="text-slate-300 text-[11px]">
                {dbStatus.connected ? 'Prisma Aktif' : 'Prisma ORM Ready'}
              </span>
            </div>
            <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span
                className={`relative flex h-2.5 w-2.5`}
              >
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {isConnected ? 'Terhubung' : 'Menunggu Koneksi'}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {botStatus.user?.name || botStatus.user?.id || 'Bot Server'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRestart}
              title="Restart Bot"
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b1120] overflow-hidden">
        {/* MOBILE TOPBAR (Hidden on md+) */}
        <header className="h-14 md:hidden shrink-0 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md px-3.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏺</span>
              <h1 className="font-bold text-sm text-white">Harbor CS</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prisma Mini Pill */}
            <div
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer ${
                dbStatus.connected
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
              }`}
              title={dbStatus.connected ? 'Prisma Terhubung' : 'Prisma ORM Ready (Klik untuk setting)'}
            >
              <Database className="w-3 h-3" />
              <span>{dbStatus.connected ? 'Prisma OK' : 'Prisma'}</span>
            </div>

            {/* WA Status Dot */}
            <div
              onClick={() => setActiveTab('qr')}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{isConnected ? 'WA' : 'Scan'}</span>
            </div>

            {/* Quick Restart */}
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Restart Bot"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* DESKTOP TOPBAR */}
        <header className="hidden md:flex h-16 shrink-0 border-b border-slate-800/80 bg-[#0f172a]/50 backdrop-blur-md px-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white capitalize">
              {activeTab === 'chats' && 'Live Chat Log Real-Time'}
              {activeTab === 'gemini' && 'AI Studio & Playground (Groq & Google Gemini)'}
              {activeTab === 'qr' && 'Koneksi & QR Code WhatsApp'}
              {activeTab === 'tickets' && 'Daftar Tiket Layanan Pelanggan'}
              {activeTab === 'catalog' && 'Katalog Produk & Preview Kartu'}
              {activeTab === 'sender' && 'Kirim Pesan WhatsApp Langsung'}
              {activeTab === 'settings' && 'Pengaturan Bisnis & Database'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              Next.js 16 • Tailwind v4
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Prisma Status Badge */}
            <div
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                dbStatus.connected
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40'
              }`}
              title="Klik untuk membuka konfigurasi database Prisma"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>{dbStatus.connected ? 'Prisma Terhubung' : 'Prisma ORM Ready'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
            </div>

            {/* AI Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              aiProvider === 'groq' 
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' 
                : 'bg-purple-950/40 border-purple-500/30 text-purple-200'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${aiProvider === 'groq' ? 'text-amber-400' : 'text-purple-400'}`} />
              <span>{aiProvider === 'groq' ? `Groq: ${groqModel}` : `Gemini: ${geminiModel}`}</span>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${aiProvider === 'groq' ? 'bg-amber-400' : 'bg-purple-400'}`}></span>
            </div>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-medium transition border border-rose-900/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* TAB PANELS */}
        <div className={`flex-1 min-h-0 ${activeTab === 'chats' ? 'p-2 sm:p-4 h-[calc(100vh-4rem)] flex flex-col' : 'overflow-y-auto p-6'}`}>
          {/* TAB 1: 1 USER 1 CHAT WHATSAPP WEB LAYOUT */}
          {activeTab === 'chats' && (
            <div className="h-full flex-1 flex flex-col md:flex-row rounded-2xl border border-slate-800/80 bg-[#0b101b] overflow-hidden shadow-2xl">
              {/* LEFT COLUMN: LIST OF CONVERSATIONS (1 User 1 Chat) */}
              <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-800/80 bg-[#0f172a]/95 shrink-0 h-full ${
                mobileChatOpen ? 'hidden md:flex' : 'flex'
              }`}>
                {/* Left Header */}
                <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Obrolan WhatsApp</h3>
                      <p className="text-[11px] text-slate-400">
                        {conversations.length} kontak pelanggan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={fetchChats}
                      title="Perbarui Obrolan"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {conversations.length > 0 && (
                      <button
                        onClick={handleClearAllChats}
                        title="Bersihkan Semua Obrolan"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="p-3 border-b border-slate-800/60 space-y-2 bg-slate-900/30">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Cari atau mulai obrolan..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {chatSearch && (
                      <button
                        onClick={() => setChatSearch('')}
                        className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      onClick={() => setChatFilter('all')}
                      className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                        chatFilter === 'all'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setChatFilter('unread')}
                      className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                        chatFilter === 'unread'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Pesan Masuk
                    </button>
                    <button
                      onClick={() => setChatFilter('ai')}
                      className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                        chatFilter === 'ai'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AI Aktif
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                  {(() => {
                    const filtered = conversations.filter((c) => {
                      if (chatFilter === 'unread' && c.lastMessage?.direction !== 'in') return false;
                      if (chatFilter === 'ai' && !c.lastMessage?.isAi) return false;
                      if (!chatSearch.trim()) return true;
                      const q = chatSearch.toLowerCase();
                      return (
                        (c.senderName || '').toLowerCase().includes(q) ||
                        (c.phone || '').toLowerCase().includes(q) ||
                        (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q))
                      );
                    });

                    // Deduplicate conversations to guarantee strictly unique React keys
                    const uniqueFiltered = [];
                    const seenConvKeys = new Set();
                    for (const conv of filtered) {
                      const k = conv.jid || conv.phone;
                      if (k && !seenConvKeys.has(k)) {
                        seenConvKeys.add(k);
                        uniqueFiltered.push(conv);
                      }
                    }

                    if (uniqueFiltered.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-500 space-y-2">
                          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
                          <p className="text-xs text-slate-400 font-medium">
                            {chatSearch ? 'Kontak tidak ditemukan' : 'Belum ada obrolan'}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Kirim pesan dari nomor WhatsApp ke bot untuk memulai obrolan baru.
                          </p>
                        </div>
                      );
                    }

                    return uniqueFiltered.map((conv, idx) => {
                      const isSelected = selectedChatJid === conv.jid || selectedChatJid === conv.phone;
                      const initials = (conv.senderName || conv.phone || 'WA')
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      // Generate background color based on name/phone
                      const colors = [
                        'from-emerald-600 to-teal-800',
                        'from-sky-600 to-blue-800',
                        'from-purple-600 to-indigo-800',
                        'from-amber-600 to-orange-800',
                        'from-rose-600 to-pink-800',
                      ];
                      const hash = (conv.phone || conv.senderName || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                      const avatarBg = colors[hash % colors.length];

                      const lastMsgTime = conv.updatedAt
                        ? new Date(conv.updatedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';

                      const isOutbound = conv.lastMessage?.direction === 'out';
                      const isAi = conv.lastMessage?.isAi;

                      return (
                        <div
                          key={conv.jid || conv.phone || `conv_${idx}`}
                          onClick={() => {
                            setSelectedChatJid(conv.jid || conv.phone);
                            setMobileChatOpen(true);
                          }}
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition relative group ${
                            isSelected
                              ? 'bg-slate-800/90 border-l-4 border-emerald-400'
                              : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                          }`}
                        >
                          {/* Avatar with initials & online dot */}
                          <div
                            className="relative shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChatJid(conv.jid || conv.phone);
                              handleOpenProfileModal(conv);
                            }}
                            title="Klik untuk melihat profil pelanggan"
                          >
                            <div
                              className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-xs shadow hover:scale-105 transition cursor-pointer`}
                            >
                              {initials}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                          </div>

                          {/* Contact Info & Snippet */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className="font-semibold text-xs text-slate-100 truncate">
                                {conv.senderName}
                              </h4>
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                {lastMsgTime}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 font-mono mb-1 truncate">
                              {conv.formattedPhone || (conv.phone && conv.phone.startsWith('+') ? conv.phone : `+${conv.phone || ''}`)}
                            </p>

                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0 text-slate-400 text-xs">
                                {isOutbound && (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                )}
                                <span className="truncate text-[11px] text-slate-400">
                                  {conv.lastMessage?.text || 'Mulai percakapan'}
                                </span>
                              </div>

                              {isAi && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-semibold shrink-0">
                                  AI
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover Actions: Profile & Delete Chat */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProfileModal(conv);
                              }}
                              title="Lihat profil pelanggan"
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv)}
                              title="Hapus riwayat obrolan ini"
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* RIGHT COLUMN: ACTIVE CONVERSATION THREAD */}
              {(() => {
                if (!activeConversation) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#090d16] text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-3">
                        <MessageSquare className="w-8 h-8 text-slate-600" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-300 mb-1">
                        WhatsApp Web untuk Layanan Pelanggan
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Pilih salah satu obrolan pelanggan di sebelah kiri untuk melihat percakapan lengkap atau membalas pesan secara langsung.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className={`flex-1 flex flex-col bg-[#0b101b] min-w-0 h-full relative ${
                    mobileChatOpen ? 'flex' : 'hidden md:flex'
                  }`}>
                    {/* Active Chat Topbar */}
                    <div className="h-16 px-3 md:px-6 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setMobileChatOpen(false)}
                          className="md:hidden p-2 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition shrink-0"
                          title="Kembali ke daftar kontak"
                        >
                          <ArrowLeft className="w-5 h-5 text-emerald-400" />
                        </button>

                        <div
                          onClick={() => handleOpenProfileModal(activeConversation)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer p-1 rounded-xl hover:bg-slate-800/70 transition group select-none"
                          title="Klik untuk melihat & ubah profil pelanggan"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-xs shadow shrink-0 group-hover:ring-2 group-hover:ring-emerald-400/50 group-hover:scale-105 transition">
                            {(activeConversation.senderName || 'WA').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition flex items-center gap-1">
                                <span>{activeConversation.senderName}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                              </h3>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hidden sm:inline-block">
                                WhatsApp Aktif
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono group-hover:text-slate-300 transition">
                              {activeConversation.formattedPhone || (activeConversation.phone && activeConversation.phone.startsWith('+') ? activeConversation.phone : `+${activeConversation.phone || ''}`)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenProfileModal(activeConversation)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
                          title="Lihat & ubah nomor kontak atau profil pelanggan"
                        >
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          <span className="hidden sm:inline">Profil</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTicket({
                              id: `NEW`,
                              name: activeConversation.senderName,
                              contact: `+${activeConversation.phone}`,
                              sender: activeConversation.jid || activeConversation.phone,
                              description: activeConversation.lastMessage?.text || 'Permohonan bantuan via WhatsApp',
                              category: 'Layanan Umum',
                              priority: 'Normal',
                            });
                            setTicketStatusUpdate('Open');
                            setTicketNotesUpdate('');
                            setTicketCategoryUpdate('Layanan Umum');
                            setTicketPriorityUpdate('Normal');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5 hidden sm:flex"
                        >
                          <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Buat Tiket</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteConversation(e, activeConversation)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
                          title="Bersihkan obrolan ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Messages Canvas */}
                    <div
                      ref={activeChatScrollRef}
                      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 font-sans text-sm bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#090d16]"
                    >
                      {/* Centered Date Badge */}
                      <div className="flex justify-center my-2">
                        <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-400 text-[11px] font-medium border border-slate-700/50 shadow-sm">
                          Hari ini
                        </span>
                      </div>

                      {(activeConversation.messages || [])
                        .filter((msg, idx, arr) => {
                          if (idx === 0) return true;
                          const prev = arr[idx - 1];
                          const isSameText = prev.text && msg.text && prev.text.trim() === msg.text.trim();
                          const isSameDir = prev.direction === msg.direction;
                          const isVeryClose = Math.abs(new Date(msg.timestamp || 0).getTime() - new Date(prev.timestamp || 0).getTime()) < 6000;
                          return !(isSameText && isSameDir && isVeryClose);
                        })
                        .map((msg, idx) => {
                        const isUser = msg.direction === 'in';
                        const isAi = msg.isAi || msg.senderName?.includes('Gemini') || msg.senderName?.includes('Groq') || msg.senderName?.includes('AI');
                        const isAdmin = msg.senderName?.includes('Admin') || msg.senderName?.includes('Manual');

                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md whitespace-pre-wrap leading-relaxed relative group ${
                                isUser
                                  ? 'bg-[#1e293b] text-slate-100 rounded-tl-sm border border-slate-700/60'
                                  : isAi
                                  ? 'bg-gradient-to-br from-purple-950/90 via-[#064e3b]/90 to-[#064e3b]/90 text-white rounded-tr-sm border border-purple-500/40 shadow-purple-500/10'
                                  : 'bg-[#064e3b] text-white rounded-tr-sm border border-emerald-500/40'
                              }`}
                            >
                              {/* Message Header Tag */}
                              {!isUser && (
                                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-white/10 text-[10px] font-semibold">
                                  {isAi ? (
                                    <span className="text-purple-300 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-purple-400" />
                                      {msg.senderName || 'Harbor AI'}
                                    </span>
                                  ) : isAdmin ? (
                                    <span className="text-sky-300">Admin (Balasan Manual)</span>
                                  ) : (
                                    <span className="text-emerald-300">Harbor Bot</span>
                                  )}
                                </div>
                              )}

                              {/* Product Image preview if msg.image exists */}
                              {msg.image && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/60 max-w-xs shadow-md">
                                  <img
                                    src={msg.image.startsWith('/') ? msg.image : `/${msg.image}`}
                                    alt="Foto Produk Harbor"
                                    className="w-full h-44 object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                              )}

                              {/* Message Content */}
                              <div
                                className="text-xs leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: formatWaText(msg.text) }}
                              />

                              {/* Timestamp & Status */}
                              <div className="flex items-center justify-end gap-1 mt-1.5 pt-0.5 text-[10px] text-slate-400">
                                <span>
                                  {msg.timestamp
                                    ? new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                                {!isUser && (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400 ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Reply Suggestions */}
                    <div className="px-4 py-2 border-t border-slate-800/60 bg-[#0f172a]/60 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                      <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0 mr-1">
                        Template:
                      </span>
                      {[
                        { label: 'Sapa Pelanggan', text: 'Halo Kak, ada yang bisa kami bantu seputar produk keramik Harbor?' },
                        { label: 'Kirim Info Katalog', text: 'Berikut tautan katalog stoneware artisanal Harbor. Silakan pilih produk yang diminati agar dapat kami bantu proses pemesanannya.' },
                        { label: 'Lokasi Showroom', text: 'Showroom fisik Harbor berlokasi di Jakarta Senopati, Bandung Riau, dan Bali Canggu.' },
                        { label: 'Garansi Pecah', text: 'Seluruh pesanan Harbor dilindungi Garansi 100% Ganti Baru Gratis jika terjadi kerusakan saat pengiriman.' },
                        { label: 'Hubungkan CS', text: 'Baik Kak, pesan Anda sedang kami teruskan ke tim Customer Service kami.' },
                      ].map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleInsertQuickTemplate(chip.text)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/60 transition shrink-0"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Bottom Chat Composer (Direct Reply to WhatsApp) */}
                    <div className="p-3 md:p-4 border-t border-slate-800 bg-[#0f172a]/95 shrink-0">
                      <form onSubmit={handleSendDirectReply} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            placeholder={`Ketik balasan WhatsApp untuk ${activeConversation.senderName}...`}
                            className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!chatInputText.trim() || sendingDirectReply || !isConnected}
                          className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-40 shrink-0 flex items-center justify-center"
                          title="Kirim Pesan WhatsApp"
                        >
                          {sendingDirectReply ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </form>
                      {!isConnected && (
                        <p className="text-[11px] text-amber-400 mt-1 text-center">
                          ⚠️ Bot WhatsApp belum terhubung. Silakan pindai QR code terlebih dahulu.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: AI STUDIO (GROQ & GEMINI) */}
          {activeTab === 'gemini' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left Column: AI Configuration */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">Konfigurasi AI Layanan</h3>
                        <p className="text-xs text-slate-400">Pilih penyedia AI (Groq LPU / Google Gemini)</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={geminiEnabled}
                        onChange={(e) => setGeminiEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Provider Selector Tabs */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Penyedia AI Utama (Primary Provider)</label>
                    <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 gap-1">
                      <button
                        type="button"
                        onClick={() => setAiProvider('groq')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          aiProvider === 'groq'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>⚡ Groq LPU</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiProvider('gemini')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          aiProvider === 'gemini'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🔮 Gemini AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Groq Settings Section */}
                  {aiProvider === 'groq' && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Pengaturan Groq AI (LPU Engine)</span>
                        </div>
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
                        >
                          <span>Dapatkan Key Gratis</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Groq API Key Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Groq API Key (gsk_...)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showGroqApiKey ? 'text' : 'password'}
                            value={groqApiKey}
                            onChange={(e) => setGroqApiKey(e.target.value)}
                            placeholder="gsk_..."
                            className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pr-10 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGroqApiKey(!showGroqApiKey)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                          >
                            {showGroqApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Groq Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Pilihan Model Groq</label>
                        <select
                          value={groqModel}
                          onChange={(e) => setGroqModel(e.target.value)}
                          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="openai/gpt-oss-120b">OpenAI GPT-OSS 120B (Sangat Cerdas ~750ms - Rekomendasi Utama)</option>
                          <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Ultra Cepat ~500ms)</option>
                          <option value="openai/gpt-oss-20b">OpenAI GPT-OSS 20B (Ringan & Cepat ~580ms)</option>
                          <option value="allam-2-7b">Allam 2 7B</option>
                        </select>
                        <p className="text-[11px] text-amber-300/80 leading-relaxed">
                          ⚡ Model OpenAI GPT-OSS 120B & Qwen 27B di Groq LPU merespon dalam waktu &lt; 1 detik dengan pemahaman bahasa Indonesia yang sangat luwes.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gemini Settings Section */}
                  {aiProvider === 'gemini' && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Pengaturan Google Gemini</span>
                        </div>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 underline underline-offset-2"
                        >
                          <span>Dapatkan Key Gratis</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Gemini API Key Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-purple-400" />
                          <span>Google Gemini API Key (AIzaSy...)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 pr-10 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Gemini Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Pilihan Model Gemini</label>
                        <select
                          value={geminiModel}
                          onChange={(e) => setGeminiModel(e.target.value)}
                          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Super Cepat ~1.8s - Rekomendasi Utama)</option>
                          <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Sangat Ringan & Cepat)</option>
                          <option value="gemini-3.5-flash">Gemini 3.5 Flash (Stabil)</option>
                          <option value="gemini-flash-latest">Gemini Flash Latest</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Failover Info Banner */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Sistem Auto-Failover:</strong> Jika penyedia utama ({aiProvider === 'groq' ? 'Groq' : 'Gemini'}) mengalami kendala atau habis kuota, bot otomatis mengalihkan balasan ke penyedia cadangan tanpa jeda.
                    </span>
                  </div>

                  {/* System Instruction / Persona */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Instruksi Sistem & Persona Bot</label>
                    <textarea
                      rows={4}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Instruksi untuk gaya bahasa dan persona bot..."
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveAiSettings}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Pengaturan AI</span>
                    </button>
                    <button
                      onClick={handleTestAi}
                      disabled={testingAi}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                        aiProvider === 'groq'
                          ? 'bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border-amber-500/40'
                          : 'bg-purple-950/30 hover:bg-purple-950/50 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {testingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Uji {aiProvider === 'groq' ? 'Groq' : 'Gemini'}</span>
                    </button>
                  </div>

                  {/* Test Result Display */}
                  {aiTestResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        aiTestResult.success
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="font-bold mb-1 flex items-center gap-1.5">
                        {aiTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{aiTestResult.success ? `Koneksi Berhasil (${aiTestResult.elapsed}ms)` : 'Gagal'}</span>
                      </div>
                      <p>{aiTestResult.reply || aiTestResult.message || aiTestResult.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live AI Simulator / Playground */}
              <div className="lg:col-span-7 flex flex-col h-full rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      aiProvider === 'groq' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        Simulator Percakapan AI ({aiProvider === 'groq' ? 'Groq LPU' : 'Gemini'})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Uji respons langsung dengan pengetahuan katalog stoneware & showroom Harbor
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSimHistory([])}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Reset Chat
                  </button>
                </div>

                {/* Simulator Message Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {simHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-500 mb-1 px-1">
                        {item.role === 'user' 
                          ? 'Simulasi Pelanggan' 
                          : `Harbor AI (${item.provider === 'groq' ? '⚡ Groq' : '🔮 Gemini'})`} • {item.time}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                          item.role === 'user'
                            ? 'bg-slate-800 text-slate-100 rounded-tr-none'
                            : item.provider === 'groq'
                            ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 text-amber-100 border border-amber-500/30 rounded-tl-none'
                            : 'bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 text-purple-100 border border-purple-500/30 rounded-tl-none'
                        }`}
                        dangerouslySetInnerHTML={{ __html: formatWaText(item.text) }}
                      />
                    </div>
                  ))}

                  {simulating && (
                    <div className="flex items-center gap-2 text-xs text-purple-400 italic py-2">
                      <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                      <span>{aiProvider === 'groq' ? 'Groq LPU sedang memproses (~300ms)...' : 'Gemini sedang menyusun balasan...'}</span>
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={handleSimulateAi}
                  className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={simPrompt}
                    onChange={(e) => setSimPrompt(e.target.value)}
                    placeholder="Ketik pertanyaan untuk menguji AI (misal: 'Apakah keramik aman microwave?')"
                    className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={simulating || !simPrompt.trim()}
                    className={`p-2.5 rounded-xl text-white transition disabled:opacity-50 ${
                      aiProvider === 'groq' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE & CONNECTION */}
          {activeTab === 'qr' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-8 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                      }`}
                    />
                    {isConnected ? 'WhatsApp Terhubung & Aktif' : 'Menunggu Scan QR Code'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {isConnected ? 'Sesi WhatsApp Siap Digunakan' : 'Pindai QR Code Menggunakan WhatsApp'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-6">
                  {isConnected
                    ? `Bot saat ini aktif melayani pelanggan melalui nomor +${botStatus.user?.id || 'Aktif'}.`
                    : 'Buka WhatsApp di HP Anda > Menu Titik Tiga / Pengaturan > Perangkat Tertaut > Tautkan Perangkat.'}
                </p>

                {/* QR Code Container */}
                {isConnected ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 max-w-md w-full text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        WA
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Akun Terhubung</p>
                        <p className="text-sm font-bold text-emerald-300">
                          {botStatus.user?.name || 'WhatsApp CS Bot'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 pt-2 border-t border-emerald-500/20 flex justify-between">
                      <span>Nomor Telepon:</span>
                      <span className="font-mono text-slate-200">+{botStatus.user?.id || '-'}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>Waktu Terhubung:</span>
                      <span className="text-slate-200">
                        {botStatus.connectedAt
                          ? new Date(botStatus.connectedAt).toLocaleTimeString('id-ID')
                          : 'Baru saja'}
                      </span>
                    </div>
                  </div>
                ) : botStatus.qrDataUrl ? (
                  <div className="p-4 bg-white rounded-2xl shadow-2xl mb-4">
                    <img
                      src={botStatus.qrDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-2xl bg-slate-800/50 flex flex-col items-center justify-center gap-3 border border-slate-700 mb-4">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs text-slate-400">Sedang memuat QR Code...</p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={handleRestart}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Muat Ulang Koneksi</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/40 transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset Sesi / Scan Ulang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">Tiket Layanan & Pemesanan Pelanggan</h3>
                  <p className="text-xs text-slate-400">
                    Tiket otomatis aktif dan bertanda saat pelanggan ingin membeli produk, klaim garansi, atau pengaduan produk
                  </p>
                </div>
                <button
                  onClick={fetchTickets}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'Semua', label: 'Semua Tiket' },
                  { id: 'Pembelian Produk', label: 'Pembelian Produk' },
                  { id: 'Klaim Garansi', label: 'Klaim Garansi' },
                  { id: 'Pengaduan Produk', label: 'Pengaduan Produk' },
                  { id: 'Layanan Umum', label: 'Layanan Umum' },
                ].map((item) => {
                  const count = item.id === 'Semua'
                    ? tickets.length
                    : tickets.filter((t) => (t.category || 'Layanan Umum').toLowerCase().includes(item.id.toLowerCase().slice(0, 5))).length;
                  const isSelected = ticketCategoryFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTicketCategoryFilter(item.id)}
                      className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 border whitespace-nowrap ${
                        isSelected
                          ? 'bg-emerald-500/20 text-white border-emerald-500/50 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        isSelected ? 'bg-emerald-500/40 text-emerald-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block rounded-2xl border border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                      <th className="p-3.5 font-semibold">ID Tiket</th>
                      <th className="p-3.5 font-semibold">Pelanggan</th>
                      <th className="p-3.5 font-semibold">Kontak</th>
                      <th className="p-3.5 font-semibold">Kategori & Tanda</th>
                      <th className="p-3.5 font-semibold">Rincian Permohonan</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold">Prioritas</th>
                      <th className="p-3.5 font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(() => {
                      const seen = new Set();
                      const filteredTickets = tickets
                        .filter((t) => {
                          if (ticketCategoryFilter === 'Semua') return true;
                          const cat = (t.category || 'Layanan Umum').toLowerCase();
                          return cat.includes(ticketCategoryFilter.toLowerCase().slice(0, 5));
                        })
                        .filter((t) => {
                          if (!t || !t.id || seen.has(t.id)) return false;
                          seen.add(t.id);
                          return true;
                        });

                      if (filteredTickets.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500">
                              {ticketCategoryFilter === 'Semua' 
                                ? 'Belum ada tiket layanan yang terdaftar.' 
                                : `Tidak ada tiket dalam kategori "${ticketCategoryFilter}".`}
                            </td>
                          </tr>
                        );
                      }

                      return filteredTickets.map((t, idx) => (
                        <tr key={`${t.id || 'ticket'}_${idx}`} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5 font-mono font-semibold text-emerald-400">{t.id}</td>
                          <td className="p-3.5 font-medium text-slate-200">{t.name}</td>
                          <td className="p-3.5 text-slate-400 font-mono">{t.contact || t.sender}</td>
                          <td className="p-3.5">
                            {(() => {
                              const cat = (t.category || 'Layanan Umum').toLowerCase();
                              if (cat.includes('beli') || cat.includes('order') || cat.includes('pembelian')) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Pembelian Produk</span>
                                  </span>
                                );
                              }
                              if (cat.includes('garansi') || cat.includes('klaim')) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>Klaim Garansi</span>
                                  </span>
                                );
                              }
                              if (cat.includes('pengaduan') || cat.includes('komplain') || cat.includes('rusak') || cat.includes('keluhan')) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10">
                                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                                    <span>Pengaduan Produk</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                  <span>{t.category || 'Layanan Umum'}</span>
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3.5 text-slate-300 max-w-xs truncate" title={t.description}>
                            {t.description}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                t.status === 'Open'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : t.status === 'Resolved' || t.status === 'Closed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (t.priority || '').toLowerCase() === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : (t.priority || '').toLowerCase() === 'tinggi' || (t.priority || '').toLowerCase() === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {t.priority || 'Normal'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setTicketStatusUpdate(t.status || 'Open');
                                setTicketNotesUpdate(t.notes || '');
                                setTicketCategoryUpdate(t.category || 'Layanan Umum');
                                setTicketPriorityUpdate(t.priority || 'Normal');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                            >
                              Kelola
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW (md:hidden) */}
              <div className="md:hidden space-y-3">
                {(() => {
                  const seenMobile = new Set();
                  const filteredTickets = tickets
                    .filter((t) => {
                      if (ticketCategoryFilter === 'Semua') return true;
                      const cat = (t.category || 'Layanan Umum').toLowerCase();
                      return cat.includes(ticketCategoryFilter.toLowerCase().slice(0, 5));
                    })
                    .filter((t) => {
                      if (!t || !t.id || seenMobile.has(t.id)) return false;
                      seenMobile.add(t.id);
                      return true;
                    });

                  if (filteredTickets.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500 rounded-2xl bg-[#0f172a]/60 border border-slate-800">
                        {ticketCategoryFilter === 'Semua' 
                          ? 'Belum ada tiket layanan yang terdaftar.' 
                          : `Tidak ada tiket dalam kategori "${ticketCategoryFilter}".`}
                      </div>
                    );
                  }

                  return filteredTickets.map((t, idx) => {
                    const cat = (t.category || 'Layanan Umum').toLowerCase();
                    return (
                      <div
                        key={`${t.id || 'm_ticket'}_${idx}`}
                        className="p-4 rounded-2xl border border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-xl shadow-lg space-y-3"
                      >
                        {/* Header: ID + Status + Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-emerald-400">
                            #{t.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                t.status === 'Open'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : t.status === 'Resolved' || t.status === 'Closed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              (t.priority || '').toLowerCase() === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : (t.priority || '').toLowerCase() === 'tinggi' || (t.priority || '').toLowerCase() === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {t.priority || 'Normal'}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Contact */}
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{t.name}</h4>
                          <p className="text-xs text-slate-400 font-mono">{t.contact || t.sender}</p>
                        </div>

                        {/* Category Badge with Pulse */}
                        <div>
                          {cat.includes('beli') || cat.includes('order') || cat.includes('pembelian') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Pembelian Produk</span>
                            </span>
                          ) : cat.includes('garansi') || cat.includes('klaim') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>Klaim Garansi</span>
                            </span>
                          ) : cat.includes('pengaduan') || cat.includes('komplain') || cat.includes('rusak') || cat.includes('keluhan') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10">
                              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                              <span>Pengaduan Produk</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                              <span>{t.category || 'Layanan Umum'}</span>
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 line-clamp-3">
                          {t.description}
                        </p>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setTicketStatusUpdate(t.status || 'Open');
                            setTicketNotesUpdate(t.notes || '');
                            setTicketCategoryUpdate(t.category || 'Layanan Umum');
                            setTicketPriorityUpdate(t.priority || 'Normal');
                          }}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                        >
                          Kelola Tiket #{t.id}
                        </button>
                      </div>
                    );
                  })
                })()}
              </div>
            </div>
          )}

          {/* TAB 5: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Header with Title, Search, and Tambah Produk Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white">Koleksi Produk Artisanal Harbor</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                      {config?.catalog?.length || 0} Produk
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Produk stoneware yang terintegrasi otomatis dengan bot WhatsApp dan memori AI
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Cari produk..."
                      className="rounded-xl bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
                    />
                  </div>
                  <button
                    onClick={handleOpenAddProduct}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Produk Baru</span>
                  </button>
                </div>
              </div>

              {/* Product Cards Grid */}
              {(() => {
                const filteredCatalog = (config?.catalog || []).filter((item) => {
                  if (!catalogSearch.trim()) return true;
                  const q = catalogSearch.toLowerCase();
                  return (
                    item.title.toLowerCase().includes(q) ||
                    (item.code && item.code.toLowerCase().includes(q)) ||
                    (item.subtitle && item.subtitle.toLowerCase().includes(q))
                  );
                });

                if (filteredCatalog.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                      <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="font-semibold text-slate-400 text-sm">
                        {catalogSearch ? 'Tidak ada produk yang cocok dengan pencarian' : 'Belum ada produk di katalog'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Klik tombol di bawah untuk menambahkan produk stoneware baru ke katalog Anda.
                      </p>
                      <button
                        onClick={handleOpenAddProduct}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk Sekarang</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCatalog.map((item) => {
                      const cleanImg = (item.image || 'catalog/everyday-set.jpg').replace(/^assets\//, '');
                      const imgSrc = cleanImg.startsWith('http') || cleanImg.startsWith('data:') ? cleanImg : `/${cleanImg}`;

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl overflow-hidden shadow-xl flex flex-col group hover:border-slate-700 transition"
                        >
                          <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                            <img
                              src={imgSrc}
                              alt={item.title}
                              onError={(e) => {
                                e.target.src = '/catalog/everyday-set.jpg';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            {/* Price Badge */}
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 font-bold text-xs border border-emerald-500/30 shadow">
                              {item.price}
                            </span>
                            {/* Actions on Card Image */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleOpenEditProduct(item)}
                                title="Edit Produk"
                                className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(item.id, item.title)}
                                disabled={deletingProductId === item.id}
                                title="Hapus Produk"
                                className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/80 border border-rose-900/50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-bold text-white text-base truncate" title={item.title}>{item.title}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono shrink-0">
                                  #{item.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2 leading-relaxed line-clamp-2">{item.subtitle}</p>
                              {item.footer && (
                                <p className="text-[11px] text-purple-300 font-medium">🎨 {item.footer}</p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-mono text-[11px]">
                                {item.code || `PROD-${item.id}`}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenEditProduct(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveTab('sender');
                                    setManualMessage(`Halo! Saya tertarik memesan produk: *${item.title}* (${item.price})`);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 transition flex items-center gap-1"
                                >
                                  <span>Kirim Pesan</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 6: MANUAL SENDER */}
          {activeTab === 'sender' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-8 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-2xl space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Kirim Pesan WhatsApp Manual</h3>
                  <p className="text-xs text-slate-400">
                    Kirim pesan resmi secara langsung ke nomor pelanggan dari dashboard
                  </p>
                </div>

                <form onSubmit={handleSendManual} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Nomor Telepon / WhatsApp Tujuan</label>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="Contoh: 081234567890 atau 6281234567890"
                      required
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Isi Pesan WhatsApp</label>
                    <textarea
                      rows={5}
                      value={manualMessage}
                      onChange={(e) => setManualMessage(e.target.value)}
                      placeholder="Ketik pesan resmi di sini..."
                      required
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingManual || !isConnected}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingManual ? 'Sedang Mengirim...' : 'Kirim Pesan Sekarang'}</span>
                  </button>

                  {!isConnected && (
                    <p className="text-center text-xs text-amber-400">
                      ⚠️ Bot WhatsApp belum terhubung. Silakan pindai QR code terlebih dahulu.
                    </p>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: BUSINESS SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-8 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Profil Bisnis & Informasi Resmi</h3>
                  <p className="text-xs text-slate-400">
                    Informasi ini dijadikan sumber pengetahuan utama bagi AI Gemini dan bot WhatsApp
                  </p>
                </div>

                <form onSubmit={handleSaveBusiness} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Nama Bisnis</label>
                      <input
                        type="text"
                        value={businessSettings.name}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Tagline / Slogan</label>
                      <input
                        type="text"
                        value={businessSettings.tagline}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, tagline: e.target.value })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Nomor Telepon Resmi</label>
                      <input
                        type="text"
                        value={businessSettings.phone}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Email Resmi</label>
                      <input
                        type="text"
                        value={businessSettings.email}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Alamat Showroom Utama</label>
                    <input
                      type="text"
                      value={businessSettings.address}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Jam Operasional</label>
                    <textarea
                      rows={2}
                      value={businessSettings.hours}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, hours: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20"
                  >
                    Simpan Perubahan Bisnis
                  </button>
                </form>
              </div>

              {/* PRISMA DATABASE CARD */}
              <div className="p-6 md:p-8 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                        <span>Database Prisma ORM</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                          dbStatus.connected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {dbStatus.connected ? 'Terhubung' : 'Prisma Ready'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Vercel Ready
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Didukung Prisma Client v6 di <code className="text-indigo-300 font-mono text-[11px]">prisma/schema.prisma</code> siap sambung ke Vercel Postgres / Neon / Supabase
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchDbStatus}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Cek Status</span>
                  </button>
                </div>

                {/* Live DB Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">Katalog Produk</p>
                      <p className="text-lg font-bold text-white font-mono">{dbStatus.counts?.products ?? 0}</p>
                    </div>
                    <ShoppingBag className="w-5 h-5 text-emerald-400 opacity-60" />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">Tiket Layanan</p>
                      <p className="text-lg font-bold text-white font-mono">{dbStatus.counts?.tickets ?? 0}</p>
                    </div>
                    <Ticket className="w-5 h-5 text-sky-400 opacity-60" />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">Pesan Tersimpan</p>
                      <p className="text-lg font-bold text-white font-mono">{dbStatus.counts?.chats ?? 0}</p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-purple-400 opacity-60" />
                  </div>
                </div>

                {/* Connection Form */}
                <form onSubmit={handleSaveDbConfig} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>DATABASE_URL (Prisma Connection String)</span>
                      <span className="text-[10px] text-indigo-400 font-mono">Vercel Postgres / Neon / Supabase</span>
                    </label>
                    <input
                      type="text"
                      value={dbForm.databaseUrl}
                      onChange={(e) => setDbForm({ ...dbForm, databaseUrl: e.target.value })}
                      placeholder="postgresql://user:password@host:port/database?schema=public"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      Format: postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Sistem menggunakan <strong>Prisma Client</strong> untuk seluruh query data (Tiket, Katalog, Chat). Jika database belum terhubung, sistem otomatis berjalan dengan penyimpanan lokal JSON tanpa crash.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-800/80">
                      <Database className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Sinkronisasi Skema ke Vercel:</strong> Cukup jalankan <code className="text-indigo-300 font-mono font-semibold">npm run db:push</code> di terminal untuk membuat seluruh tabel secara otomatis di cloud Vercel / Neon.
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingDb}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingDb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    <span>{savingDb ? 'Menyimpan Konfigurasi...' : 'Simpan Konfigurasi Prisma (.env)'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) */}
        {!mobileChatOpen && (
          <nav className="md:hidden shrink-0 h-16 bg-[#0f172a]/95 border-t border-slate-800 backdrop-blur-xl px-2 flex items-center justify-around z-20 shadow-lg">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                activeTab === 'chats' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {conversations.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {conversations.length}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                activeTab === 'gemini' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px]">AI Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                activeTab === 'tickets' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Ticket className="w-5 h-5" />
                {tickets.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {tickets.length}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Tiket</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                activeTab === 'catalog' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px]">Katalog</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                activeTab === 'settings' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px]">Pengaturan</span>
            </button>
          </nav>
        )}
      </main>

      {/* TICKET EDIT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Kelola Tiket #{selectedTicket.id}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400">Pelapor:</p>
                <p className="font-semibold text-slate-200">
                  {selectedTicket.name} ({selectedTicket.contact})
                </p>
              </div>
              <div>
                <p className="text-slate-400">Rincian:</p>
                <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Status Tiket</label>
                  <select
                    value={ticketStatusUpdate}
                    onChange={(e) => setTicketStatusUpdate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                  >
                    <option value="Open">Open (Menunggu Penanganan)</option>
                    <option value="In Progress">In Progress (Sedang Diproses)</option>
                    <option value="Resolved">Resolved (Selesai)</option>
                    <option value="Closed">Closed (Ditutup)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prioritas</label>
                  <select
                    value={ticketPriorityUpdate}
                    onChange={(e) => setTicketPriorityUpdate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Kategori Layanan</label>
                <select
                  value={ticketCategoryUpdate}
                  onChange={(e) => setTicketCategoryUpdate(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                >
                  <option value="Pembelian Produk">Pembelian Produk (Order / Beli)</option>
                  <option value="Klaim Garansi">Klaim Garansi (Ganti Baru / Pecah)</option>
                  <option value="Pengaduan Produk">Pengaduan Produk (Komplain / Kendala)</option>
                  <option value="Layanan Umum">Layanan Umum (Pertanyaan / Informasi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Catatan Petugas</label>
                <textarea
                  rows={3}
                  value={ticketNotesUpdate}
                  onChange={(e) => setTicketNotesUpdate(e.target.value)}
                  placeholder="Tuliskan catatan tindak lanjut..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleUpdateTicket}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                Simpan Pembaruan
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-[#0f172a] border border-slate-700 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingProduct ? `Edit Produk: ${editingProduct.title}` : 'Tambah Produk Baru ke Katalog'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Otomatis terhubung di WhatsApp Bot & memori pengetahuan AI Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Image Preview & Upload Options */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Foto Produk</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0 relative">
                    <img
                      src={imagePreview || '/catalog/everyday-set.jpg'}
                      alt="Preview"
                      onError={(e) => {
                        e.target.src = '/catalog/everyday-set.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Foto dari Komputer</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Mendukung format JPG, PNG, WEBP (maks. 5MB). Atau pilih preset gambar di bawah:
                    </p>
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {[
                        { label: 'Everyday Set', path: 'catalog/everyday-set.jpg' },
                        { label: 'Pour-Over', path: 'catalog/pourover-set.jpg' },
                        { label: 'Platter', path: 'catalog/serving-platter.jpg' },
                      ].map((preset) => (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => ({ ...prev, image: preset.path, imageBase64: '' }));
                            setImagePreview(`/${preset.path}`);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2 Cols: Title & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setProductForm((prev) => ({
                        ...prev,
                        title,
                        code: prev.code || title.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().slice(0, 20),
                      }));
                    }}
                    placeholder="Contoh: The Ceramic Matcha Mug"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Harga *</label>
                  <input
                    type="text"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="Contoh: Rp 195.000"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Grid 2 Cols: Code & Variations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kode Produk</label>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: MATCHA-MUG"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Pilihan Warna / Varian</label>
                  <input
                    type="text"
                    value={productForm.footer}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, footer: e.target.value }))}
                    placeholder="Contoh: Tersedia warna Stone & Sage Green."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Deskripsi Singkat / Subtitle</label>
                <textarea
                  rows={2}
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Contoh: Mug keramik artisanal 250ml berbahan stoneware tahan microwave untuk ritual kopi dan teh pagi."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* URL Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Link URL Produk (Opsional)</label>
                <input
                  type="text"
                  value={productForm.url}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://harbor.example.com/collections/..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{savingProduct ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Simpan Produk Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE MODAL */}
      {showProfileModal && profileTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Profil Kontak Pelanggan</h3>
                  <p className="text-xs text-slate-400">Kelola nomor telepon & informasi kontak WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-4 ring-emerald-500/20 shrink-0">
                {(profileTarget.senderName || 'WA').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-bold text-base text-white truncate">
                    {profileTarget.senderName}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold shrink-0">
                    Aktif
                  </span>
                </div>
                <p className="text-xs font-mono text-emerald-400 mb-1 font-semibold truncate">
                  {profileTarget.formattedPhone || (profileTarget.phone ? `+${profileTarget.phone}` : 'Belum terhubung')}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {profileTarget.messages?.length || 0} pesan tercatat dalam obrolan
                </p>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={profileTarget.phone ? `https://wa.me/${profileTarget.phone.replace(/[^0-9]/g, '')}` : '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  profileTarget.phone
                    ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyText(profileTarget.phone, 'Nomor Telepon')}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
              >
                {copiedField === 'Nomor Telepon' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{copiedField === 'Nomor Telepon' ? 'Tersalin!' : 'Salin Nomor'}</span>
              </button>
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Nama Pelanggan</span>
                  <span className="text-[10px] text-slate-500">Tampil di dashboard</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="Contoh: Kharisma Alung P"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Nomor Telepon (WhatsApp)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-time sync</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                    +
                  </span>
                  <input
                    type="text"
                    required
                    value={editProfilePhone.startsWith('+') ? editProfilePhone.slice(1) : editProfilePhone}
                    onChange={(e) => setEditProfilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="6281216526150"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-7 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Gunakan kode negara tanpa spasi atau tanda strip (contoh: <span className="font-mono text-slate-400">6281216526150</span>).
                </p>
              </div>

              {/* JID / Session ID technical details */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>ID Sesi Baileys (JID)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(profileTarget.jid, 'JID Sesi')}
                    className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === 'JID Sesi' ? 'Tersalin!' : 'Salin JID'}</span>
                  </button>
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 break-all select-all">
                  {profileTarget.jid || profileTarget.phone}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
