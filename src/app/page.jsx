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
  RotateCcw,
  Lock,
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
  Smartphone,
  Award,
  Calendar,
  MapPin,
  ShieldCheck,
  Tag,
  HelpCircle,
  FileText,
  PhoneCall,
  Mail,
  Map,
  Flame,
  Percent,
  ShieldAlert,
  UserCheck,
  Download,
  ArrowUpDown,
  CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'gemini' | 'qr' | 'tickets' | 'catalog' | 'store_profile' | 'schedule' | 'location' | 'warranty' | 'promo' | 'complaint' | 'sender' | 'settings'

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
  const [simPrompt, setSimPrompt] = useState('Halo, apakah karpet masjid bisa dipotong dan diobras langsung di lokasi?');
  const [simulating, setSimulating] = useState(false);
  const [simHistory, setSimHistory] = useState([
    {
      role: 'user',
      text: 'Halo, saya mau tanya apakah karpet masjid Turki bisa dipasang dan diobras di tempat?',
      time: '19:10',
    },
    {
      role: 'ai',
      text: 'Halo Kak, ya tentu saja. Teknisi Sultan Carpet Gallery membawa mesin obras portable ke lokasi masjid Anda sehingga pemotongan presisi mengikuti sudut pilar dan arah shaf kiblat dengan sangat rapi. Ada yang dapat kami bantu untuk survey lokasi atau sampel karpet?',
      time: '19:10',
    }
  ]);

  // Ticket Management States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState('Open');
  const [ticketNotesUpdate, setTicketNotesUpdate] = useState('');
  const [ticketCategoryUpdate, setTicketCategoryUpdate] = useState('Layanan Umum');
  const [ticketPriorityUpdate, setTicketPriorityUpdate] = useState('Normal');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('Semua');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('Semua');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('Semua');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketSortOrder, setTicketSortOrder] = useState('newest');
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    name: '',
    contact: '',
    category: 'Pembelian Produk',
    priority: 'Normal',
    status: 'Open',
    description: '',
    notes: '',
  });
  const [submittingNewTicket, setSubmittingNewTicket] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState(null);

  // Send Manual Message Form
  const [manualPhone, setManualPhone] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [sendingManual, setSendingManual] = useState(false);

  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState({
    name: 'Sultan Carpet Gallery',
    owner: 'H. Ahmad Fauzi & Hj. Maryam',
    tagline: 'Pusat Karpet Masjid Turki, Karpet Ruang Tamu Mewah & Karpet Kantor Elegan',
    phone: '0812-9876-5432',
    phone_cs: '0811-2345-6789',
    email: 'info@sultancarpet.co.id',
    website: 'https://sultancarpet.co.id',
    address: 'Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan 12430',
    hours: 'Senin - Sabtu: 08:30 - 20:00 WIB\nMinggu & Libur Nasional: 09:00 - 18:00 WIB\nLayanan Survey & Pasang: 24 Jam (By Appointment)'
  });

  // Store Pages State (Nama Toko/Pemilik, Jadwal Kerja, Lokasi Alamat, Garansi, Promo, Komplain)
  const [ownerSettings, setOwnerSettings] = useState({
    owner_name: 'H. Ahmad Fauzi & Hj. Maryam',
    role: 'Founder & Managing Director',
    experience: '12+ Tahun Melayani Seluruh Nusantara',
    story: 'Didirikan pada tahun 2012 oleh H. Ahmad Fauzi dan Hj. Maryam, berawal dari kecintaan terhadap keindahan seni rajut karpet Turki dan Persia. Kini Sultan Carpet Gallery telah melayani lebih dari 1.500 masjid di seluruh Indonesia, ribuan hunian mewah, serta ratusan kantor korporat multinasional.',
    phone: '0812-9876-5432',
    email: 'owner@sultancarpet.co.id',
    commitment: 'Kami berkomitmen menghadirkan produk karpet 100% original berkualitas grade A dengan harga transparan, diiringi layanan purnajual terbaik, survey gratis, dan garansi penuh.'
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    store_hours: 'Senin - Sabtu: 08:30 - 20:00 WIB\nMinggu & Hari Libur: 09:00 - 18:00 WIB',
    survey_hours: 'Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB (Gratis Jabodetabek, jadwal fleksibel)',
    installation_hours: 'Tersedia teknisi 24 jam (bisa malam hari setelah Isya agar tidak mengganggu ibadah/kerja)',
    shipping_schedule: 'Jabodetabek: Setiap hari kerja (Armada sendiri)\nLuar Kota/Pulau: Ekspedisi kargo terpercaya (Indah, Dakota, Baraka, Sentral)'
  });

  const [locationSettings, setLocationSettings] = useState({
    main_showroom: {
      title: 'Showroom Utama Fatmawati (Pusat Koleksi & Gallery)',
      address: 'Jl. Fatmawati Raya No. 45, RT.04/RW.02, Cilandak Barat, Cilandak, Jakarta Selatan 12430',
      phone: '0812-9876-5432',
      hours: 'Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB',
      maps_url: 'https://maps.google.com/?q=Fatmawati+Jakarta+Selatan',
      landmark: '500 meter dari Stasiun MRT Cipete Raya, seberang SPBU Shell Fatmawati'
    },
    warehouse: {
      title: 'Gudang Pusat & Workshop Obras',
      address: 'Kawasan Industri & Pergudangan Bizpark No. 18, Jl. Raya Narogong KM 7, Bekasi',
      phone: '0813-8899-7766',
      hours: 'Senin - Jumat: 08:00 - 17:00 WIB | Sabtu: 08:00 - 14:00 WIB',
      maps_url: 'https://maps.google.com/?q=Bekasi+Narogong'
    },
    items: [
      {
        id: 'loc-1',
        type: 'Showroom Utama',
        title: 'Showroom Utama Fatmawati (Pusat Koleksi & Gallery)',
        address: 'Jl. Fatmawati Raya No. 45, RT.04/RW.02, Cilandak Barat, Cilandak, Jakarta Selatan 12430',
        landmark: '500 meter dari Stasiun MRT Cipete Raya, seberang SPBU Shell Fatmawati',
        hours: 'Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB',
        phone: '0812-9876-5432',
        maps_url: 'https://maps.google.com/?q=Fatmawati+Jakarta+Selatan'
      },
      {
        id: 'loc-2',
        type: 'Gudang & Obras',
        title: 'Gudang Pusat & Workshop Obras Bekasi',
        address: 'Kawasan Industri & Pergudangan Bizpark No. 18, Jl. Raya Narogong KM 7, Bekasi',
        landmark: 'Kawasan Bizpark Blok B-18, akses kontainer 40ft',
        hours: 'Senin - Jumat: 08:00 - 17:00 WIB | Sabtu: 08:00 - 14:00 WIB',
        phone: '0813-8899-7766',
        maps_url: 'https://maps.google.com/?q=Bekasi+Narogong'
      },
      {
        id: 'loc-3',
        type: 'Cabang Gallery',
        title: 'Galeri Sultan Carpet Bandung',
        address: 'Jl. L.L.R.E. Martadinata (Riau) No. 82, Citarum, Bandung 40115',
        landmark: 'Samping Heritage Factory Outlet, seberang Bank Mandiri',
        hours: 'Senin - Minggu: 09:00 - 20:00 WIB',
        phone: '0813-2233-4455',
        maps_url: 'https://maps.google.com/?q=Bandung+Riau'
      },
      {
        id: 'loc-4',
        type: 'Cabang Gallery',
        title: 'Galeri Sultan Carpet Surabaya',
        address: 'Jl. Mayjen HR. Muhammad No. 102, Pradahkalikendal, Dukuhpakis, Surabaya 60226',
        landmark: 'Dekat bundaran HR Muhammad, seberang Mayapada Hospital',
        hours: 'Senin - Minggu: 09:00 - 20:00 WIB',
        phone: '0821-3344-5566',
        maps_url: 'https://maps.google.com/?q=Surabaya+HR+Muhammad'
      }
    ]
  });

  const [warrantySettings, setWarrantySettings] = useState({
    title: 'Jaminan Kualitas & Garansi Resmi Sultan Carpet',
    summary: 'Garansi 100% benang asli impor Turki & Persia, garansi obras & pasang 1 tahun, serta garansi tukar baru 14 hari.',
    items: [
      {
        title: 'Garansi 100% Benang Asli Impor',
        desc: 'Kami menjamin seluruh karpet masjid impor kami 100% didatangkan langsung dari Turki dan karpet klasik dari Persia dengan sertifikat keaslian dan grade resmi.'
      },
      {
        title: 'Garansi Pemasangan & Obras 1 Tahun',
        desc: 'Garansi jahitan obras rapi dan tidak mudah lepas selama 12 bulan penuh. Jika ada obrasan terbuka atau sambungan bergeser, teknisi kami siap perbaiki gratis.'
      },
      {
        title: 'Garansi Tukar Baru 14 Hari (Cacat Pabrik)',
        desc: 'Jika ditemukan cacat produksi atau benang cacat saat barang tiba, kami tukar dengan karpet baru tanpa biaya tambahan apapun.'
      },
      {
        title: 'Jaminan Kerapian Potong Presisi',
        desc: 'Pemotongan karpet mengikuti sudut ruangan, lekukan tiang/pilar masjid, serta kemiringan shaf kiblat dengan toleransi presisi tinggi.'
      }
    ],
    claim_steps: '1. Foto atau videokan bagian karpet yang mengalami kendala\n2. Kirim pesan ke nomor WhatsApp layanan garansi kami atau laporkan melalui menu Komplain\n3. Tim teknisi akan melakukan verifikasi dalam 1x24 jam dan menjadwalkan kunjungan servis'
  });

  const [promoSettings, setPromoSettings] = useState({
    title: 'Promo & Penawaran Spesial Karpet',
    active_promos: [
      {
        id: 'PROMO-MASJID',
        title: 'Promo Berkah Masjid & Musholla',
        discount: 'Diskon hingga 25% + Gratis Obras Keliling',
        desc: 'Dapatkan potongan harga spesial untuk pemesanan karpet masjid minimal 5 roll. Gratis obras sambungan, gratis parfum karpet masjid wangi tahan lama, dan subsidi ongkir se-Jawa.',
        badge: 'Terpopuler',
        valid_until: 'Akhir Bulan Ini'
      },
      {
        id: 'PROMO-RUMAH',
        title: 'Promo Gebyar Karpet Rumah Minimalis',
        discount: 'Cashback Rp 200.000 + Free Keset Mewah',
        desc: 'Beli karpet ruang tamu Nordic Scandinavia atau Bulu Shaggy, gratis keset kaki memory foam microfiber anti-slip premium.',
        badge: 'Bestseller',
        valid_until: 'Stok Terbatas'
      },
      {
        id: 'PROMO-KANTOR',
        title: 'Paket Renovasi Karpet Kantor & Komersial',
        discount: 'Gratis Pemasangan untuk Luas > 100 m²',
        desc: 'Pemesanan karpet tile komersial heavy duty diatas 100 m² mendapatkan gratis lem khusus karpet dan jasa pasang teknisi berpengalaman.',
        badge: 'Spesial B2B',
        valid_until: 'Berlaku Selama Kuota Ada'
      },
      {
        id: 'PROMO-SURVEY',
        title: 'Layanan Survey & Bawa Sampel GRATIS',
        discount: 'Gratis 100% Tanpa Syarat',
        desc: 'Bingung memilih motif dan mengukur ruangan? Tim kami siap datang membawakan contoh bahan karpet fisik dan melakukan pengukuran langsung ke lokasi Anda (Jabodetabek).',
        badge: 'Gratis',
        valid_until: 'Setiap Hari'
      }
    ]
  });

  const [complaintSettings, setComplaintSettings] = useState({
    title: 'Pusat Layanan Pengaduan & Komplain Pelanggan',
    sla: 'Respon Cepat Maksimal 1x24 Jam Kerja',
    contact_manager: '0811-2345-6789 (Hotline Layanan Konsumen)',
    workflow: [
      'Langkah 1: Sampaikan keluhan Anda melalui WhatsApp bot, formulir web, atau telepon langsung.',
      'Langkah 2: Sistem kami otomatis menerbitkan Nomor Tiket Komplain resmi (contoh: #TK-XXXXX).',
      'Langkah 3: Customer Care Officer kami memverifikasi laporan dan menghubungi Anda dalam 1x24 jam.',
      'Langkah 4: Jika diperlukan perbaikan fisik/tukar karpet, tim teknisi akan dijadwalkan datang ke lokasi Anda.',
      'Langkah 5: Tiket selesai setelah Anda merasa puas dengan penyelesaian yang diberikan.'
    ]
  });

  // Complaint Submission Form State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    name: '',
    phone: '',
    category: 'Pengaduan Produk',
    issueType: 'Kualitas / Obras Karpet',
    description: '',
    priority: 'Tinggi'
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Promo Modal Form State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    id: '',
    title: '',
    discount: '',
    desc: '',
    badge: 'Spesial',
    valid_until: 'Akhir Bulan'
  });
  const [editingPromoIndex, setEditingPromoIndex] = useState(null);

  // Location Modal Form State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState(null);
  const [locationForm, setLocationForm] = useState({
    id: '',
    type: 'Showroom Utama',
    title: '',
    address: '',
    landmark: '',
    hours: 'Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB',
    phone: '0812-9876-5432',
    maps_url: ''
  });

  const [savingStoreInfo, setSavingStoreInfo] = useState(false);

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
    image: 'catalog/karpet-masjid-turki.jpg',
    imageBase64: '',
  });
  const [imagePreview, setImagePreview] = useState('/catalog/karpet-masjid-turki.jpg');
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
  const [togglingAiJid, setTogglingAiJid] = useState(null);
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
        setBotStatus((prev) => {
          if (data.status === 'connected' && prev.status !== 'connected') {
            showToastMsg('WhatsApp berhasil terhubung! Memuat seluruh chat...', 'success');
            fetchChats();
            setActiveTab((curr) => (curr === 'qr' ? 'chats' : curr));
          }
          return { ...prev, ...data };
        });
      } catch (err) {}
    });

    eventSource.addEventListener('chats_updated', () => {
      fetchChats();
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
            if (msg.direction === 'in' && msg.senderName && msg.senderName !== 'Pelanggan' && !/^\+?\d{10,}$/.test(msg.senderName.trim())) {
              target.senderName = msg.senderName.trim();
            }
            if (msg.jid && msg.jid.includes('@lid')) {
              target.jid = msg.jid;
            }
            if (msg.phone && msg.phone.length <= 13 && !msg.phone.includes('@lid') && !/^\d{14,}$/.test(msg.phone)) {
              target.phone = msg.phone;
              if (msg.formattedPhone) target.formattedPhone = msg.formattedPhone;
            }
            // Move active conversation to the top
            updated.splice(index, 1);
            return [target, ...updated];
          } else {
            const cleanName = msg.senderName && !/^\+?\d{10,}$/.test(msg.senderName.trim()) ? msg.senderName.trim() : 'Pelanggan';
            const cleanPhone = (msg.phone && msg.phone.length <= 13 && !msg.phone.includes('@lid') && !/^\d{14,}$/.test(msg.phone)) ? msg.phone : null;
            const newConv = {
              jid: msg.jid,
              phone: cleanPhone,
              formattedPhone: msg.formattedPhone || (cleanPhone ? `+${cleanPhone}` : 'WhatsApp ID'),
              senderName: cleanName,
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
        if (!data || !data.jid) return;
        const targetKey = String(data.jid).toLowerCase();
        setConversations((prev) =>
          prev.filter((c) => {
            const cJid = String(c.jid || '').toLowerCase();
            const cPhone = String(c.phone || '').toLowerCase();
            return cJid !== targetKey && cPhone !== targetKey && !targetKey.includes(cJid);
          })
        );
        setSelectedChatJid((curr) => {
          if (curr && (String(curr).toLowerCase() === targetKey || targetKey.includes(String(curr).toLowerCase()))) {
            return null;
          }
          return curr;
        });
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

    eventSource.addEventListener('ticket_deleted', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data || !data.id) return;
        setTickets((prev) => prev.filter((t) => t.id && t.id.toUpperCase() !== data.id.toUpperCase()));
        showToastMsg(`Tiket #${data.id} telah dihapus.`, 'info');
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

    // 🛡️ Real-time Contact AI & Human CS Handoff Synchronization
    const handleHandoffOrAiChange = (data) => {
      if (!data || !data.jid) return;
      const targetJid = data.jid;
      const isHumanHandoff = data.isHumanHandoff !== undefined ? data.isHumanHandoff : (data.active !== undefined ? data.active : !data.aiEnabled);
      const aiEnabled = data.aiEnabled !== undefined ? data.aiEnabled : !isHumanHandoff;

      setConversations((prev) =>
        prev.map((c) => {
          const isMatch = c.jid === targetJid || c.phone === targetJid || (data.phone && c.phone === data.phone);
          if (isMatch) {
            return {
              ...c,
              isHumanHandoff,
              aiEnabled,
            };
          }
          return c;
        })
      );
    };

    eventSource.addEventListener('contact_ai_toggled', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleHandoffOrAiChange(data);
      } catch (err) {}
    });

    eventSource.addEventListener('handoff_status_changed', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleHandoffOrAiChange(data);
      } catch (err) {}
    });

    eventSource.addEventListener('human_handoff_started', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleHandoffOrAiChange({ jid: data.jid, isHumanHandoff: true, aiEnabled: false });
      } catch (err) {}
    });

    eventSource.addEventListener('human_handoff_ended', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleHandoffOrAiChange({ jid: data.jid, isHumanHandoff: false, aiEnabled: true });
      } catch (err) {}
    });

    eventSource.addEventListener('human_cs_requested', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data || !data.jid) return;
        handleHandoffOrAiChange({ jid: data.jid, phone: data.phone, isHumanHandoff: true, aiEnabled: false });
        const name = data.senderName || data.phone || 'Pelanggan';
        showToastMsg(`🔔 ${name} meminta bantuan CS! Chat AI otomatis dinonaktifkan.`, 'warning');
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

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchChats();
    }
  }, [activeTab]);

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
      if (data.owner_info) {
        setOwnerSettings(data.owner_info);
      }
      if (data.schedule_info) {
        setScheduleSettings(data.schedule_info);
      }
      if (data.location_info) {
        const locInfo = data.location_info;
        if (!locInfo.items || locInfo.items.length === 0) {
          locInfo.items = [
            {
              id: 'loc-1',
              type: 'Showroom Utama',
              title: locInfo.main_showroom?.title || 'Showroom Utama Fatmawati (Pusat Koleksi & Gallery)',
              address: locInfo.main_showroom?.address || 'Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan 12430',
              landmark: locInfo.main_showroom?.landmark || '500 meter dari Stasiun MRT Cipete Raya',
              hours: locInfo.main_showroom?.hours || 'Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB',
              phone: locInfo.main_showroom?.phone || '0812-9876-5432',
              maps_url: locInfo.main_showroom?.maps_url || 'https://maps.google.com/?q=Fatmawati+Jakarta+Selatan'
            },
            {
              id: 'loc-2',
              type: 'Gudang & Obras',
              title: locInfo.warehouse?.title || 'Gudang Pusat & Workshop Obras Bekasi',
              address: locInfo.warehouse?.address || 'Kawasan Industri & Pergudangan Bizpark No. 18, Jl. Raya Narogong KM 7, Bekasi',
              landmark: 'Kawasan Bizpark Blok B-18, akses kontainer 40ft',
              hours: locInfo.warehouse?.hours || 'Senin - Jumat: 08:00 - 17:00 WIB | Sabtu: 08:00 - 14:00 WIB',
              phone: locInfo.warehouse?.phone || '0813-8899-7766',
              maps_url: locInfo.warehouse?.maps_url || 'https://maps.google.com/?q=Bekasi+Narogong'
            }
          ];
        }
        setLocationSettings(locInfo);
      }
      if (data.warranty_info) {
        setWarrantySettings(data.warranty_info);
      }
      if (data.promo_info) {
        setPromoSettings(data.promo_info);
      }
      if (data.complaint_info) {
        setComplaintSettings(data.complaint_info);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveStoreSection = async (sectionKey, sectionData, successMessage) => {
    if (!config) return;
    const updated = {
      ...config,
      [sectionKey]: sectionData,
    };
    setSavingStoreInfo(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(updated);
        showToastMsg(successMessage || 'Informasi toko berhasil disimpan!', 'success');
      } else {
        showToastMsg(data.error || 'Gagal menyimpan', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingStoreInfo(false);
    }
  };

  const handleCreateComplaintTicket = async (e) => {
    if (e) e.preventDefault();
    if (!complaintForm.name.trim() || !complaintForm.description.trim()) {
      showToastMsg('Nama dan rincian keluhan wajib diisi!', 'error');
      return;
    }
    setSubmittingComplaint(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: complaintForm.phone || 'Tamu Web',
          name: complaintForm.name,
          contact: complaintForm.phone || '-',
          description: `[${complaintForm.issueType}] ${complaintForm.description}`,
          category: complaintForm.category || 'Pengaduan Produk',
          priority: complaintForm.priority || 'Tinggi',
          status: 'Open',
        }),
      });
      const created = await res.json();
      if (created && created.id) {
        setTickets((prev) => [created, ...prev]);
        showToastMsg(`Tiket komplain #${created.id} berhasil diterbitkan! Tim Customer Care akan segera merespons.`, 'success');
        setComplaintForm({
          name: '',
          phone: '',
          category: 'Pengaduan Produk',
          issueType: 'Kualitas / Obras Karpet',
          description: '',
          priority: 'Tinggi',
        });
        setShowComplaintModal(false);
      }
    } catch (err) {
      showToastMsg('Gagal membuat tiket: ' + err.message, 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleSavePromo = async (e) => {
    if (e) e.preventDefault();
    if (!promoForm.title.trim() || !promoForm.discount.trim()) {
      showToastMsg('Judul promo dan penawaran wajib diisi!', 'error');
      return;
    }
    const currentPromos = [...(promoSettings.active_promos || [])];
    if (editingPromoIndex !== null) {
      currentPromos[editingPromoIndex] = promoForm;
    } else {
      const newId = `PROMO-${Date.now().toString().slice(-4)}`;
      currentPromos.push({ ...promoForm, id: promoForm.id || newId });
    }
    const updatedPromoSettings = { ...promoSettings, active_promos: currentPromos };
    setPromoSettings(updatedPromoSettings);
    await handleSaveStoreSection('promo_info', updatedPromoSettings, 'Daftar promo berhasil diperbarui!');
    setShowPromoModal(false);
    setEditingPromoIndex(null);
  };

  const handleDeletePromo = async (indexToDelete) => {
    if (!confirm('Hapus promo ini?')) return;
    const currentPromos = (promoSettings.active_promos || []).filter((_, idx) => idx !== indexToDelete);
    const updatedPromoSettings = { ...promoSettings, active_promos: currentPromos };
    setPromoSettings(updatedPromoSettings);
    await handleSaveStoreSection('promo_info', updatedPromoSettings, 'Promo berhasil dihapus!');
  };

  const handleOpenAddLocation = () => {
    setEditingLocationIndex(null);
    setLocationForm({
      id: `loc-${Date.now().toString().slice(-4)}`,
      type: 'Showroom Utama',
      title: '',
      address: '',
      landmark: '',
      hours: 'Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB',
      phone: '0812-9876-5432',
      maps_url: ''
    });
    setShowLocationModal(true);
  };

  const handleOpenEditLocation = (loc, index) => {
    setEditingLocationIndex(index);
    setLocationForm({
      id: loc.id || `loc-${index}`,
      type: loc.type || 'Showroom Utama',
      title: loc.title || loc.name || '',
      address: loc.address || '',
      landmark: loc.landmark || '',
      hours: loc.hours || '',
      phone: loc.phone || '',
      maps_url: loc.maps_url || ''
    });
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (e) => {
    if (e) e.preventDefault();
    if (!locationForm.title.trim() || !locationForm.address.trim()) {
      showToastMsg('Nama lokasi dan alamat lengkap wajib diisi!', 'error');
      return;
    }

    const currentItems = [...(locationSettings.items || [])];
    if (editingLocationIndex !== null && editingLocationIndex >= 0) {
      currentItems[editingLocationIndex] = locationForm;
    } else {
      currentItems.push(locationForm);
    }

    const updatedLocationSettings = {
      ...locationSettings,
      items: currentItems,
      main_showroom: currentItems[0] || locationSettings.main_showroom,
      warehouse: currentItems.find((item) => item.type && item.type.includes('Gudang')) || currentItems[1] || locationSettings.warehouse
    };

    setLocationSettings(updatedLocationSettings);
    await handleSaveStoreSection('location_info', updatedLocationSettings, 'Data lokasi & alamat berhasil disimpan!');
    setShowLocationModal(false);
    setEditingLocationIndex(null);
  };

  const handleDeleteLocation = async (indexToDelete, locTitle) => {
    if (!confirm(`Hapus lokasi "${locTitle || 'ini'}"?`)) return;
    const currentItems = (locationSettings.items || []).filter((_, idx) => idx !== indexToDelete);
    const updatedLocationSettings = {
      ...locationSettings,
      items: currentItems,
      main_showroom: currentItems[0] || locationSettings.main_showroom,
      warehouse: currentItems.find((item) => item.type && item.type.includes('Gudang')) || currentItems[1] || locationSettings.warehouse
    };
    setLocationSettings(updatedLocationSettings);
    await handleSaveStoreSection('location_info', updatedLocationSettings, 'Lokasi berhasil dihapus!');
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

  const applyPersonaPreset = (type) => {
    if (type === 'default') {
      setSystemPrompt(
        "Anda adalah Sultan Carpet Assistant, asisten customer service resmi dari Sultan Carpet Gallery (Pusat Karpet Masjid Turki, Karpet Ruang Tamu Mewah & Karpet Kantor Elegan). Pemilik toko adalah H. Ahmad Fauzi & Hj. Maryam, berdiri sejak 2012 dengan reputasi terpercaya melayani lebih dari 1.500 masjid di seluruh Indonesia. Jawab pertanyaan pelanggan dengan sangat ramah, santun, profesional, solutif, dan ringkas dalam Bahasa Indonesia. DILARANG KERAS menggunakan tanda bintang (*) untuk menebalkan teks maupun untuk simbol apapun. Tulis teks polos tanpa simbol bintang (*). DILARANG KERAS menggunakan icon emoji apapun dalam balasan Anda. DILARANG KERAS menyuruh pelanggan mengetik perintah kaku seperti Ketik ORDER, Ketik MENU, atau Ketik CS. Berinteraksilah secara alami, hangat, dan luwes layaknya konsultan karpet profesional berpengalaman. Anda menguasai seluruh katalog karpet, jam operasional showroom, jadwal survey gratis dan pasang karpet 24 jam by appointment, alamat showroom utama di Jl. Fatmawati Raya No. 45 Jakarta Selatan beserta cabang Bandung dan Surabaya, kebijakan garansi 1 tahun pemasangan & 100% benang asli, promo diskon hingga 25% + free obras, serta alur penanganan komplain 1x24 jam."
      );
      showToastMsg('Preset Standar diterapkan!', 'success');
    } else if (type === 'survey') {
      setSystemPrompt(
        "Anda adalah Konsultan Teknis Sultan Carpet Gallery spesialis karpet masjid & hunian mewah. Fokus utama Anda adalah mengarahkan pelanggan untuk menjadwalkan SURVEY LOKASI GRATIS, pengukuran kiblat & luas masjid, pembawaan sampel bahan fisik karpet Turki ke lokasi pemesan, dan estimasi waktu potong sambung obras di tempat. Berikan penjelasan yang meyakinkan, santun, dan tanpa simbol bintang (*) maupun emoji."
      );
      showToastMsg('Preset Fokus Survey diterapkan!', 'success');
    } else if (type === 'concise') {
      setSystemPrompt(
        "Anda adalah CS Sultan Carpet Gallery yang efisien, to-the-point, dan ramah. Berikan jawaban cepat, padat, dan jelas mengenai harga karpet per roll/meter, stok katalog, dan kontak CS resmi. Tanpa basa-basi berlebih, tanpa simbol bintang (*), dan tanpa emoji."
      );
      showToastMsg('Preset Ringkas diterapkan!', 'success');
    }
  };

  const handleSimulateAiWithText = async (textToSend) => {
    const userMessage = (textToSend || '').trim();
    if (!userMessage || simulating) return;

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

  const handleSimulateAi = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!simPrompt.trim()) return;
    handleSimulateAiWithText(simPrompt);
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
      image: 'catalog/karpet-masjid-turki.jpg',
      imageBase64: '',
    });
    setImagePreview('/catalog/karpet-masjid-turki.jpg');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    const cleanImg = (product.image || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '');
    setProductForm({
      title: product.title || '',
      code: product.code || '',
      price: product.price || '',
      subtitle: product.subtitle || '',
      footer: product.footer || '',
      url: product.url || '',
      image: product.image || 'catalog/karpet-masjid-turki.jpg',
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
    if (!conv) return;
    const targetName = (conv.senderName && !/^\+?\d{10,}$/.test(conv.senderName.trim()) && conv.senderName !== 'Pelanggan')
      ? conv.senderName.trim()
      : (conv.formattedPhone && !conv.formattedPhone.includes('LID') ? conv.formattedPhone : 'pelanggan ini');
    if (!confirm(`Hapus seluruh riwayat obrolan dengan "${targetName}"? Obrolan akan dihapus secara permanen.`)) return;

    const targetKey = conv.jid || conv.phone;
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(targetKey)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus obrolan dari server');

      setConversations((prev) => {
        const remaining = prev.filter((c) => c.jid !== conv.jid && c.phone !== conv.phone && (c.jid || c.phone) !== targetKey);
        if (selectedChatJid === conv.jid || selectedChatJid === conv.phone || selectedChatJid === targetKey) {
          setSelectedChatJid(remaining.length > 0 ? (remaining[0].jid || remaining[0].phone) : null);
        }
        return remaining;
      });
      showToastMsg(`Obrolan dengan ${targetName} telah dihapus`, 'info');
    } catch (err) {
      showToastMsg('Gagal menghapus obrolan: ' + err.message, 'error');
    }
  };

  const handleClearAllChats = async () => {
    if (!confirm('Hapus seluruh riwayat obrolan semua pelanggan? Seluruh daftar obrolan akan dikosongkan secara permanen.')) return;
    try {
      const res = await fetch('/api/chats', { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal membersihkan riwayat obrolan dari server');
      setConversations([]);
      setSelectedChatJid(null);
      showToastMsg('Seluruh riwayat obrolan telah dibersihkan', 'info');
    } catch (err) {
      showToastMsg('Gagal membersihkan riwayat obrolan: ' + err.message, 'error');
    }
  };

  const handleToggleContactAi = async (conv) => {
    if (!conv) return;
    const targetJid = conv.jid || conv.phone;
    if (!targetJid) return;

    const currentHandoff = Boolean(conv.isHumanHandoff);
    const newAiEnabled = currentHandoff; // If currently in handoff (AI off), toggling turns AI ON
    const newHandoff = !newAiEnabled;

    setTogglingAiJid(targetJid);

    // Optimistically update conversation state in UI
    setConversations((prev) =>
      prev.map((c) => {
        const isMatch = c.jid === targetJid || c.phone === targetJid || c.jid === conv.jid || (conv.phone && c.phone === conv.phone);
        if (isMatch) {
          return { ...c, isHumanHandoff: newHandoff, aiEnabled: newAiEnabled };
        }
        return c;
      })
    );

    const contactName = (conv.senderName && !/^\+?\d{10,}$/.test(conv.senderName.trim()))
      ? conv.senderName.trim()
      : (conv.formattedPhone || 'pelanggan ini');

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(targetJid)}/ai-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newAiEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(
          newAiEnabled
            ? `Chat AI diaktifkan untuk ${contactName}. Bot akan membalas otomatis.`
            : `Chat AI dimatikan untuk ${contactName}. Mode CS Manusia aktif.`,
          newAiEnabled ? 'success' : 'info'
        );
      } else {
        throw new Error(data.error || 'Gagal mengubah status AI');
      }
    } catch (err) {
      showToastMsg('Gagal memperbarui status Chat AI kontak', 'error');
      // Revert on failure
      setConversations((prev) =>
        prev.map((c) => {
          const isMatch = c.jid === targetJid || c.phone === targetJid || c.jid === conv.jid || (conv.phone && c.phone === conv.phone);
          if (isMatch) {
            return { ...c, isHumanHandoff: currentHandoff, aiEnabled: !currentHandoff };
          }
          return c;
        })
      );
    } finally {
      setTogglingAiJid(null);
    }
  };

  const handleOpenProfileModal = (conv) => {
    if (!conv) return;
    setProfileTarget(conv);
    const isDigitsOnly = conv.senderName && /^\+?\d{10,}$/.test(conv.senderName.trim());
    setEditProfileName(isDigitsOnly ? '' : (conv.senderName || ''));
    const isLidPhone = conv.phone && (/^\d{14,}$/.test(conv.phone.trim()) || conv.phone.includes('@lid'));
    setEditProfilePhone(isLidPhone ? '' : (conv.phone || ''));
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

  const handleQuickStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
          setTicketStatusUpdate(newStatus);
        }
        showToastMsg(`Status tiket #${ticketId} diubah ke ${newStatus}`, 'success');
      } else {
        showToastMsg('Gagal mengubah status tiket', 'error');
      }
    } catch (err) {
      showToastMsg('Gagal mengubah status: ' + err.message, 'error');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm(`Yakin ingin menghapus tiket #${ticketId}? Data tiket akan dihapus secara permanen.`)) {
      return;
    }
    setDeletingTicketId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id && t.id.toUpperCase() !== ticketId.toUpperCase()));
        if (selectedTicket && selectedTicket.id && selectedTicket.id.toUpperCase() === ticketId.toUpperCase()) {
          setSelectedTicket(null);
        }
        showToastMsg(`Tiket #${ticketId} berhasil dihapus!`, 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToastMsg(errData.error || 'Gagal menghapus tiket', 'error');
      }
    } catch (err) {
      showToastMsg('Gagal menghapus tiket: ' + err.message, 'error');
    } finally {
      setDeletingTicketId(null);
    }
  };

  const handleCreateManualTicket = async (e) => {
    if (e) e.preventDefault();
    if (!newTicketForm.name.trim() || !newTicketForm.description.trim()) {
      showToastMsg('Nama pelanggan dan rincian permohonan wajib diisi!', 'error');
      return;
    }
    setSubmittingNewTicket(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: newTicketForm.contact ? newTicketForm.contact.trim() : 'Manual',
          name: newTicketForm.name.trim(),
          contact: newTicketForm.contact ? newTicketForm.contact.trim() : '-',
          description: newTicketForm.description.trim(),
          category: newTicketForm.category || 'Pembelian Produk',
          priority: newTicketForm.priority || 'Normal',
          status: newTicketForm.status || 'Open',
          notes: newTicketForm.notes && newTicketForm.notes.trim() ? newTicketForm.notes.trim() : 'Tiket manual diinput oleh operator CS.'
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        setShowCreateTicketModal(false);
        setNewTicketForm({
          name: '',
          contact: '',
          category: 'Pembelian Produk',
          priority: 'Normal',
          status: 'Open',
          description: '',
          notes: '',
        });
        showToastMsg(`Tiket baru #${created.id} berhasil ditambahkan!`, 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToastMsg(errData.error || 'Gagal membuat tiket baru', 'error');
      }
    } catch (err) {
      showToastMsg('Gagal membuat tiket: ' + err.message, 'error');
    } finally {
      setSubmittingNewTicket(false);
    }
  };

  const handleExportTicketsCsv = () => {
    if (!tickets || tickets.length === 0) {
      showToastMsg('Belum ada tiket layanan untuk diekspor!', 'error');
      return;
    }
    try {
      const headers = ['ID Tiket', 'Tanggal Dibuat', 'Nama Pelanggan', 'No Kontak / WhatsApp', 'Kategori', 'Status', 'Prioritas', 'Deskripsi Permohonan', 'Catatan'];
      const rows = tickets.map((t) => {
        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : '-';
        return [
          `"${(t.id || '').replace(/"/g, '""')}"`,
          `"${dateStr.replace(/"/g, '""')}"`,
          `"${(t.name || '').replace(/"/g, '""')}"`,
          `"${(t.contact || t.sender || '').replace(/"/g, '""')}"`,
          `"${(t.category || '').replace(/"/g, '""')}"`,
          `"${(t.status || '').replace(/"/g, '""')}"`,
          `"${(t.priority || '').replace(/"/g, '""')}"`,
          `"${(t.description || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
          `"${(t.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Daftar_Tiket_Layanan_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToastMsg('Daftar tiket berhasil diunduh dalam format CSV!', 'success');
    } catch (err) {
      showToastMsg('Gagal mengekspor data tiket: ' + err.message, 'error');
    }
  };

  const openWhatsAppChat = (contact, ticketId, name) => {
    if (!contact || contact === '-' || contact.trim() === '') {
      showToastMsg('Nomor kontak pelanggan tidak tersedia', 'error');
      return;
    }
    let clean = String(contact).replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    if (!clean || clean.length < 8) {
      showToastMsg('Nomor telepon WhatsApp tidak valid', 'error');
      return;
    }
    const message = encodeURIComponent(`Halo Kak ${name || ''}, kami dari Customer Support Sultan Carpet Gallery menindaklanjuti permohonan tiket #${ticketId || ''}...`);
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
                    🕌
                  </div>
                  <div>
                    <h1 className="font-bold text-base text-white">Sultan Carpet</h1>
                    <p className="text-[11px] text-slate-400">Pusat Karpet Masjid & Mewah</p>
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
              <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
                <button
                  onClick={() => {
                    setActiveTab('chats');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
                    setActiveTab('catalog');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Katalog Karpet</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {config?.catalog?.length || 5}
                  </span>
                </button>

                <div className="pt-2 pb-1 px-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Informasi Toko Karpet</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('store_profile');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'store_profile'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Profil & Pemilik Toko</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('schedule');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Jadwal & Jam Kerja</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('location');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'location'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Lokasi & Alamat</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('warranty');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'warranty'
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Ketentuan Garansi</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('promo');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'promo'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Tag className="w-4 h-4 text-rose-400" />
                  <span>Promo & Diskon</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('complaint');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'complaint'
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Pusat Komplain & CS</span>
                </button>

                <div className="pt-2 pb-1 px-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Layanan & Sistem</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
                    setActiveTab('sender');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
        <div className="flex flex-col h-[calc(100vh-130px)]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 px-3 py-3 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
              🕌
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-wide text-white">Sultan Carpet</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gallery
                </span>
              </div>
              <p className="text-xs text-slate-400">Pusat Karpet Masjid & Mewah</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 overflow-y-auto pr-1 flex-1">
            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'chats'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Obrolan WhatsApp</span>
              </div>
              {conversations.length > 0 && (
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {conversations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'gemini'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Studio (Groq / Gemini)</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                aiProvider === 'groq' ? 'bg-amber-500/30 text-amber-200' : 'bg-purple-500/30 text-purple-200'
              }`}>
                {aiProvider === 'groq' ? '⚡ Groq' : '🔮 Gemini'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'qr'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
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
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Katalog Karpet</span>
              </div>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {config?.catalog?.length || 5}
              </span>
            </button>

            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Informasi Toko Resmi</p>
            </div>

            <button
              onClick={() => setActiveTab('store_profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'store_profile'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Profil & Pemilik Toko</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Jadwal & Jam Kerja</span>
            </button>

            <button
              onClick={() => setActiveTab('location')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'location'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Lokasi & Alamat</span>
            </button>

            <button
              onClick={() => setActiveTab('warranty')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'warranty'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Ketentuan Garansi</span>
            </button>

            <button
              onClick={() => setActiveTab('promo')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'promo'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Tag className="w-4 h-4 text-rose-400" />
              <span>Promo & Diskon</span>
            </button>

            <button
              onClick={() => setActiveTab('complaint')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'complaint'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Pusat Komplain & CS</span>
              </div>
              {tickets.filter(t => (t.category || '').includes('Pengaduan') || (t.category || '').includes('Garansi')).length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  {tickets.filter(t => (t.category || '').includes('Pengaduan') || (t.category || '').includes('Garansi')).length}
                </span>
              )}
            </button>

            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Layanan & Sistem</p>
            </div>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'tickets'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4" />
                <span>Tiket Layanan</span>
              </div>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sender')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
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
              <span className="text-lg">👑</span>
              <h1 className="font-bold text-sm text-white">Sultan Carpet CS</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              {activeTab === 'gemini' && 'AI Studio & Simulator Percakapan (Groq & Gemini)'}
              {activeTab === 'qr' && 'Koneksi & QR Code WhatsApp'}
              {activeTab === 'tickets' && 'Daftar Tiket Layanan Pelanggan'}
              {activeTab === 'catalog' && 'Katalog Karpet Sultan & Koleksi Lengkap'}
              {activeTab === 'store_profile' && 'Profil Toko & Pemilik Karpet'}
              {activeTab === 'schedule' && 'Jadwal & Jam Operasional Toko'}
              {activeTab === 'location' && 'Alamat & Lokasi Showroom'}
              {activeTab === 'warranty' && 'Garansi & Kebijakan Klaim Karpet'}
              {activeTab === 'promo' && 'Promo & Penawaran Diskon Aktif'}
              {activeTab === 'complaint' && 'Pusat Pengaduan & Layanan Komplain'}
              {activeTab === 'sender' && 'Kirim Pesan WhatsApp Langsung'}
              {activeTab === 'settings' && 'Pengaturan Bisnis'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
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
        <div className={`flex-1 min-h-0 ${['chats', 'gemini'].includes(activeTab) ? 'p-3 sm:p-5 h-[calc(100vh-4rem)] flex flex-col overflow-hidden' : 'overflow-y-auto p-6'}`}>
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
                    <button
                      onClick={() => setChatFilter('cs')}
                      className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                        chatFilter === 'cs'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      CS Manusia
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                  {(() => {
                    const filtered = conversations.filter((c) => {
                      if (chatFilter === 'unread' && c.lastMessage?.direction !== 'in') return false;
                      if (chatFilter === 'ai' && c.isHumanHandoff) return false;
                      if (chatFilter === 'cs' && !c.isHumanHandoff) return false;
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
                      const rawName = conv.senderName && !/^\+?\d{10,}$/.test(conv.senderName.trim()) ? conv.senderName.trim() : null;
                      const displayName = rawName || (conv.formattedPhone && !conv.formattedPhone.includes('LID') ? conv.formattedPhone : 'Pelanggan');
                      const initials = (rawName || 'WA')
                        .split(' ')
                        .filter(Boolean)
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'WA';

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
                                {displayName}
                              </h4>
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                {lastMsgTime}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 font-mono mb-1 truncate">
                              {conv.formattedPhone || (conv.phone ? `+${conv.phone}` : 'WhatsApp ID')}
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

                              {conv.isHumanHandoff ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold shrink-0 flex items-center gap-0.5 shadow-sm" title="Mode CS Manusia Aktif (Chat AI nonaktif)">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  <span>CS</span>
                                </span>
                              ) : isAi ? (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-semibold shrink-0">
                                  AI
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Actions: Profile & Delete Chat */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProfileModal(conv);
                              }}
                              title="Lihat & ubah profil pelanggan"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800/80 transition"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv)}
                              title={`Hapus obrolan dengan ${displayName}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

                const rawActiveName = activeConversation.senderName && !/^\+?\d{10,}$/.test(activeConversation.senderName.trim())
                  ? activeConversation.senderName.trim()
                  : null;
                const activeHasRealPhone = activeConversation.phone && !/^\d{14,}$/.test(activeConversation.phone) && !activeConversation.phone.includes('@lid');
                const activeFormattedPhone = activeConversation.formattedPhone && !activeConversation.formattedPhone.includes('LID')
                  ? activeConversation.formattedPhone
                  : (activeHasRealPhone
                      ? (activeConversation.phone.startsWith('+') ? activeConversation.phone : `+${activeConversation.phone}`)
                      : null);
                const activeDisplayName = rawActiveName || activeFormattedPhone || 'Pelanggan';
                const activeInitials = (rawActiveName || 'Pelanggan')
                  .split(' ')
                  .filter(Boolean)
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'PL';
                const activeSubtitle = activeFormattedPhone || 'WhatsApp ID (LID)';

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
                            {activeInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition flex items-center gap-1">
                                <span>{activeDisplayName}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                              </h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold hidden sm:inline-block ${
                                activeConversation.isHumanHandoff
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              }`}>
                                {activeConversation.isHumanHandoff ? 'Mode CS Manusia' : 'WhatsApp Aktif'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono group-hover:text-slate-300 transition">
                              {activeSubtitle}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* ON/OFF AI per Contact Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleContactAi(activeConversation)}
                          disabled={togglingAiJid === (activeConversation.jid || activeConversation.phone)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center gap-2 shadow-sm ${
                            activeConversation.isHumanHandoff
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300 hover:border-amber-500/60'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:border-emerald-500/60'
                          } ${togglingAiJid === (activeConversation.jid || activeConversation.phone) ? 'opacity-50 cursor-wait' : ''}`}
                          title={
                            activeConversation.isHumanHandoff
                              ? 'Mode CS Manusia Aktif (Chat AI mati untuk kontak ini). Klik untuk mengaktifkan Chat AI otomatis.'
                              : 'Chat AI Aktif (Bot membalas otomatis untuk kontak ini). Klik untuk mematikan Chat AI (beralih ke CS Manusia).'
                          }
                        >
                          <div className="flex items-center gap-1.5">
                            {activeConversation.isHumanHandoff ? (
                              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-semibold text-[11px] hidden sm:inline">
                              {activeConversation.isHumanHandoff ? 'AI: Nonaktif (CS)' : 'Chat AI: Aktif'}
                            </span>
                          </div>

                          {/* Interactive Pill Switch Indicator */}
                          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                            activeConversation.isHumanHandoff ? 'bg-slate-700 justify-start' : 'bg-emerald-500 justify-end'
                          }`}>
                            <div className="w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200" />
                          </div>
                        </button>

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
                              name: activeDisplayName,
                              contact: activeSubtitle,
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
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Hapus riwayat obrolan pelanggan ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* CS Mode Active Notice Banner */}
                    {activeConversation.isHumanHandoff && (
                      <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shrink-0 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                          <span className="text-[11px] font-medium leading-tight">
                            <strong className="font-semibold text-amber-200">Mode CS Manusia Aktif</strong> — Chat AI otomatis dinonaktifkan untuk pelanggan ini. Anda dapat membalas secara langsung tanpa interupsi bot.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleContactAi(activeConversation)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-semibold transition ml-2 shrink-0"
                        >
                          Nyalakan AI Kembali
                        </button>
                      </div>
                    )}

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
                                      {msg.senderName || 'Sultan Carpet AI'}
                                    </span>
                                  ) : isAdmin ? (
                                    <span className="text-sky-300">Admin (Balasan Manual)</span>
                                  ) : (
                                    <span className="text-emerald-300">Sultan Carpet Bot</span>
                                  )}
                                </div>
                              )}

                              {/* Product Image preview if msg.image exists */}
                              {msg.image && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/60 max-w-xs shadow-md">
                                  <img
                                    src={msg.image.startsWith('/') ? msg.image : `/${msg.image}`}
                                    alt="Foto Produk Karpet"
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
                        { label: 'Sapa Pelanggan', text: 'Halo Kak, selamat datang di Sultan Carpet Gallery. Ada yang bisa kami bantu seputar koleksi karpet kami?' },
                        { label: 'Kirim Info Katalog', text: 'Berikut tautan katalog karpet impor Turki, Persia, dan modern kami. Silakan pilih motif atau ukuran yang diminati agar dapat kami buatkan penawaran terbaik.' },
                        { label: 'Lokasi Showroom', text: 'Showroom fisik kami berlokasi di Jl. Fatmawati Raya No. 45 Jakarta Selatan, Bandung Riau, dan Surabaya HR Muhammad.' },
                        { label: 'Garansi Karpet', text: 'Seluruh karpet Sultan Carpet bergaransi 100% benang impor asli, garansi obras & pasang 1 tahun, serta garansi tukar cacat pabrik 14 hari.' },
                        { label: 'Survey Gratis', text: 'Kami menyediakan layanan survey dan bawa sampel bahan gratis langsung ke lokasi Anda se-Jabodetabek.' },
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
                            placeholder={`Ketik balasan WhatsApp untuk ${activeDisplayName}...`}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-0">
              {/* Left Column: AI Configuration */}
              <div className="lg:col-span-5 flex flex-col h-full min-h-0 rounded-2xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Konfigurasi AI Layanan</h3>
                      <p className="text-[11px] text-slate-400">Pilih penyedia & model AI untuk balasan otomatis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold ${geminiEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {geminiEnabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={geminiEnabled}
                        onChange={(e) => setGeminiEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                {/* Panel Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
                  {/* Provider Selector Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Penyedia AI Utama (Primary Engine)</label>
                      <span className="text-[10px] text-slate-400">Pilih mesin kecerdasan</span>
                    </div>
                    <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAiProvider('groq')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          aiProvider === 'groq'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>⚡ Groq LPU</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 text-white/90 font-mono font-normal">~300ms</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiProvider('gemini')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          aiProvider === 'gemini'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🔮 Gemini AI</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 text-white/90 font-mono font-normal">Flash</span>
                      </button>
                    </div>
                  </div>

                  {/* Groq Settings Section (NO API Key input!) */}
                  {aiProvider === 'groq' && (
                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pengaturan Mesin Groq AI (LPU Engine)</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Kredensial Server Aktif
                        </span>
                      </div>

                      {/* Groq Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                          <span>Pilihan Model Groq</span>
                          <span className="text-[10px] text-amber-400/80">Kecepatan Tinggi</span>
                        </label>
                        <select
                          value={groqModel}
                          onChange={(e) => setGroqModel(e.target.value)}
                          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                        >
                          <option value="openai/gpt-oss-120b">OpenAI GPT-OSS 120B (Sangat Cerdas ~750ms - Rekomendasi Utama)</option>
                          <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Ultra Cepat ~500ms)</option>
                          <option value="openai/gpt-oss-20b">OpenAI GPT-OSS 20B (Ringan & Cepat ~580ms)</option>
                          <option value="allam-2-7b">Allam 2 7B</option>
                        </select>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          ⚡ Model OpenAI GPT-OSS 120B & Qwen 27B di Groq LPU merespon dalam waktu &lt; 1 detik dengan pemahaman katalog karpet yang sangat luwes.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gemini Settings Section (NO API Key input!) */}
                  {aiProvider === 'gemini' && (
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Pengaturan Mesin Google Gemini</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Kredensial Server Aktif
                        </span>
                      </div>

                      {/* Gemini Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                          <span>Pilihan Model Gemini</span>
                          <span className="text-[10px] text-purple-400/80">Google DeepMind</span>
                        </label>
                        <select
                          value={geminiModel}
                          onChange={(e) => setGeminiModel(e.target.value)}
                          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                        >
                          <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Super Cepat ~1.8s - Rekomendasi Utama)</option>
                          <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Sangat Ringan & Cepat)</option>
                          <option value="gemini-3.5-flash">Gemini 3.5 Flash (Stabil)</option>
                          <option value="gemini-flash-latest">Gemini Flash Latest</option>
                        </select>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-purple-300/90 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          🔮 Gemini Flash Lite memberikan penalaran mendalam dengan pemahaman katalog, spek rajutan karpet, dan alur komplain yang sangat akurat.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Failover Info Banner */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="text-white">Auto-Failover 24/7 Aktif:</strong> Jika penyedia utama ({aiProvider === 'groq' ? 'Groq' : 'Gemini'}) mengalami kendala atau habis kuota, bot otomatis mengalihkan balasan ke penyedia cadangan tanpa jeda.
                    </div>
                  </div>

                  {/* System Instruction / Persona */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Instruksi Sistem & Persona Bot</label>
                      <span className="text-[10px] text-slate-500">{systemPrompt.length} karakter</span>
                    </div>
                    <div className="flex items-center gap-1.5 pb-1 flex-wrap">
                      <span className="text-[10px] text-slate-400">Preset:</span>
                      <button
                        type="button"
                        onClick={() => applyPersonaPreset('default')}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      >
                        Sultan Carpet Resmi
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPersonaPreset('survey')}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      >
                        Fokus Survey & Obras
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPersonaPreset('concise')}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      >
                        Ringkas & Cepat
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Instruksi untuk gaya bahasa dan persona bot..."
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={handleSaveAiSettings}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Pengaturan AI</span>
                    </button>
                    <button
                      onClick={handleTestAi}
                      disabled={testingAi}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                        aiProvider === 'groq'
                          ? 'bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : 'bg-purple-950/40 hover:bg-purple-950/60 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {testingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Uji {aiProvider === 'groq' ? 'Groq' : 'Gemini'}</span>
                    </button>
                  </div>

                  {/* Test Result Display */}
                  {aiTestResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                        aiTestResult.success
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="font-bold mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {aiTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                          <span>{aiTestResult.success ? `Koneksi Berhasil (${aiTestResult.elapsed}ms)` : 'Koneksi Gagal'}</span>
                        </div>
                        {aiTestResult.model && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30">
                            {aiTestResult.model}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-3 text-[11px] opacity-90">{aiTestResult.reply || aiTestResult.message || aiTestResult.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live AI Simulator / Playground */}
              <div className="lg:col-span-7 flex flex-col h-full min-h-0 rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl overflow-hidden">
                {/* Simulator Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      aiProvider === 'groq' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Simulator Percakapan AI</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          aiProvider === 'groq'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        }`}>
                          {aiProvider === 'groq' ? '⚡ Groq LPU' : '🔮 Google Gemini'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Uji respons langsung dengan pengetahuan katalog karpet & showroom Sultan Carpet Gallery
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSimHistory([])}
                    className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition"
                    title="Bersihkan riwayat obrolan simulasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Chat</span>
                  </button>
                </div>

                {/* Simulator Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
                  {simHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                        aiProvider === 'groq'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/10'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-purple-500/10'
                      }`}>
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        Simulator Percakapan AI Sultan Carpet
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
                        Uji kecerdasan bot dalam memahami pertanyaan pelanggan seputar karpet masjid Turki, jadwal survey, obras di lokasi, alamat showroom, dan garansi resmi.
                      </p>

                      <div className="w-full max-w-md space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400 text-left px-1 flex items-center gap-1.5">
                          <span>💡 Pertanyaan Cepat untuk Pengujian:</span>
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {[
                            'Halo, apakah karpet masjid Turki bisa dipasang dan diobras di tempat?',
                            'Berapa harga karpet masjid grade A+ per roll dan minimal pemesanan?',
                            'Dimana lokasi showroom utama dan apakah buka di hari libur/Minggu?',
                            'Apakah ada layanan survey gratis dan dibawakan contoh bahan fisik?',
                            'Bagaimana ketentuan garansi karpet dan penanganan komplain?'
                          ].map((promptText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSimulateAiWithText(promptText)}
                              className="text-left text-xs px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group shadow-sm"
                            >
                              <span className="truncate pr-2">{promptText}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {simHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                            {item.role === 'user' ? (
                              <span>Simulasi Pelanggan • {item.time}</span>
                            ) : (
                              <>
                                <span className={`font-semibold ${item.provider === 'groq' ? 'text-amber-400' : 'text-purple-400'}`}>
                                  Sultan Carpet AI ({item.provider === 'groq' ? '⚡ Groq' : '🔮 Gemini'})
                                </span>
                                <span>• {item.time}</span>
                              </>
                            )}
                          </div>
                          <div className="relative group max-w-[85%]">
                            <div
                              className={`rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                                item.role === 'user'
                                  ? 'bg-slate-800 text-slate-100 rounded-tr-none'
                                  : item.provider === 'groq'
                                  ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 text-amber-50 border border-amber-500/30 rounded-tl-none'
                                  : 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 text-purple-50 border border-purple-500/30 rounded-tl-none'
                              }`}
                              dangerouslySetInnerHTML={{ __html: formatWaText(item.text) }}
                            />
                            {item.role === 'ai' && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.text);
                                  showToastMsg('Balasan disalin!', 'success');
                                }}
                                title="Salin balasan"
                                className="absolute right-2 -top-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-sm"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {simulating && (
                        <div className="flex items-center gap-2 text-xs text-purple-400 italic py-2">
                          <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                          <span>{aiProvider === 'groq' ? 'Groq LPU sedang memproses (~300ms)...' : 'Gemini sedang menyusun balasan...'}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={handleSimulateAi}
                  className="p-3 border-t border-slate-800 bg-slate-900/60 shrink-0 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={simPrompt}
                      onChange={(e) => setSimPrompt(e.target.value)}
                      placeholder="Ketik pertanyaan uji AI (contoh: 'Apakah ada survey gratis dan pasang karpet malam hari?')..."
                      className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={simulating || !simPrompt.trim()}
                      className={`p-2.5 rounded-xl text-white transition disabled:opacity-50 shrink-0 shadow-md ${
                        aiProvider === 'groq'
                          ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                      }`}
                      title="Kirim Pertanyaan Simulasi"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                    <span>Tekan Enter ↵ untuk mengirim</span>
                    <span>Simulasi langsung menggunakan data katalog resmi</span>
                  </div>
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
          {activeTab === 'tickets' && (() => {
            // Summary counts
            const totalCount = tickets.length;
            const openCount = tickets.filter((t) => (t.status || 'Open').toLowerCase() === 'open').length;
            const inProgressCount = tickets.filter((t) => (t.status || '').toLowerCase().includes('progress')).length;
            const resolvedCount = tickets.filter((t) => {
              const s = (t.status || '').toLowerCase();
              return s === 'resolved' || s === 'closed';
            }).length;
            const urgentCount = tickets.filter((t) => {
              const p = (t.priority || '').toLowerCase();
              return p.includes('urgent') || p.includes('tinggi');
            }).length;

            const categoriesList = [
              { id: 'Semua', label: 'Semua Tiket' },
              { id: 'Pembelian Produk', label: 'Pembelian Produk' },
              { id: 'Klaim Garansi', label: 'Klaim Garansi' },
              { id: 'Pengaduan Produk', label: 'Pengaduan Produk' },
              { id: 'Layanan Umum', label: 'Layanan Umum' },
            ];

            // Filtered & Sorted Tickets
            const seen = new Set();
            let displayTickets = tickets.filter((t) => {
              if (!t || !t.id || seen.has(t.id)) return false;
              seen.add(t.id);
              return true;
            });

            // 1. Category Filter
            if (ticketCategoryFilter !== 'Semua') {
              displayTickets = displayTickets.filter((t) => {
                const cat = (t.category || 'Layanan Umum').toLowerCase();
                return cat.includes(ticketCategoryFilter.toLowerCase().slice(0, 5));
              });
            }

            // 2. Status Filter
            if (ticketStatusFilter !== 'Semua') {
              displayTickets = displayTickets.filter((t) => {
                const s = (t.status || 'Open').toLowerCase();
                if (ticketStatusFilter.toLowerCase() === 'in progress') return s.includes('progress');
                if (ticketStatusFilter.toLowerCase() === 'resolved') return s === 'resolved' || s === 'closed';
                return s === ticketStatusFilter.toLowerCase();
              });
            }

            // 3. Priority Filter
            if (ticketPriorityFilter !== 'Semua') {
              displayTickets = displayTickets.filter((t) => {
                const p = (t.priority || 'Normal').toLowerCase();
                if (ticketPriorityFilter.toLowerCase() === 'urgent') return p.includes('urgent');
                if (ticketPriorityFilter.toLowerCase() === 'tinggi') return p.includes('tinggi') || p.includes('high');
                if (ticketPriorityFilter.toLowerCase() === 'normal') return p.includes('normal') || p.includes('sedang');
                return true;
              });
            }

            // 4. Search Query (Ticket ID, Name, Contact, Description, Notes)
            if (ticketSearchQuery.trim()) {
              const q = ticketSearchQuery.toLowerCase().trim();
              displayTickets = displayTickets.filter((t) => {
                const idMatch = (t.id || '').toLowerCase().includes(q);
                const nameMatch = (t.name || '').toLowerCase().includes(q);
                const contactMatch = (t.contact || t.sender || '').toLowerCase().includes(q);
                const descMatch = (t.description || '').toLowerCase().includes(q);
                const notesMatch = (t.notes || '').toLowerCase().includes(q);
                return idMatch || nameMatch || contactMatch || descMatch || notesMatch;
              });
            }

            // 5. Sorting
            displayTickets.sort((a, b) => {
              if (ticketSortOrder === 'oldest') {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
              }
              if (ticketSortOrder === 'priority') {
                const weight = (p) => {
                  const lp = String(p || '').toLowerCase();
                  if (lp.includes('urgent')) return 3;
                  if (lp.includes('tinggi') || lp.includes('high')) return 2;
                  return 1;
                };
                return weight(b.priority) - weight(a.priority);
              }
              if (ticketSortOrder === 'status') {
                const sWeight = (s) => {
                  const ls = String(s || '').toLowerCase();
                  if (ls === 'open') return 4;
                  if (ls.includes('progress')) return 3;
                  if (ls === 'resolved') return 2;
                  return 1;
                };
                return sWeight(b.status) - sWeight(a.status);
              }
              // newest default
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            const hasActiveFilter = ticketSearchQuery.trim() !== '' || ticketStatusFilter !== 'Semua' || ticketPriorityFilter !== 'Semua' || ticketCategoryFilter !== 'Semua';

            const resetAllFilters = () => {
              setTicketSearchQuery('');
              setTicketStatusFilter('Semua');
              setTicketPriorityFilter('Semua');
              setTicketCategoryFilter('Semua');
            };

            return (
              <div className="space-y-4">
                {/* 1. Header with Title & Action Buttons */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-white">Tiket Layanan & Pemesanan Pelanggan</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                        {totalCount} Total
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelola pesanan karpet, klaim garansi presisi, dan komplain pelanggan secara fleksibel & terintegrasi WhatsApp
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCreateTicketModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Buat Tiket Manual</span>
                    </button>
                    <button
                      onClick={handleExportTicketsCsv}
                      title="Download Laporan Tiket (CSV/Excel)"
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button
                      onClick={fetchTickets}
                      title="Segarkan data tiket"
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>

                {/* 2. Interactive Metrics / Statistics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Total */}
                  <button
                    onClick={() => { resetAllFilters(); }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'Semua' && ticketPriorityFilter === 'Semua' && ticketCategoryFilter === 'Semua'
                        ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-slate-500/50'
                        : 'bg-[#0f172a]/70 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Semua Tiket</span>
                      <Ticket className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white">{totalCount}</span>
                      <span className="text-[11px] text-slate-500">tiket</span>
                    </div>
                  </button>

                  {/* Open */}
                  <button
                    onClick={() => { setTicketStatusFilter('Open'); setTicketPriorityFilter('Semua'); }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'Open'
                        ? 'bg-sky-500/20 border-sky-500/60 shadow-md ring-1 ring-sky-500/50'
                        : 'bg-[#0f172a]/70 border-slate-800/80 hover:bg-sky-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sky-400 font-medium">Menunggu (Open)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-sky-300">{openCount}</span>
                      <span className="text-[11px] text-sky-400/70">perlu respon</span>
                    </div>
                  </button>

                  {/* In Progress */}
                  <button
                    onClick={() => { setTicketStatusFilter('In Progress'); setTicketPriorityFilter('Semua'); }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'In Progress'
                        ? 'bg-amber-500/20 border-amber-500/60 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-[#0f172a]/70 border-slate-800/80 hover:bg-amber-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-medium">Diproses</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-amber-300">{inProgressCount}</span>
                      <span className="text-[11px] text-amber-400/70">tindak lanjut</span>
                    </div>
                  </button>

                  {/* Resolved */}
                  <button
                    onClick={() => { setTicketStatusFilter('Resolved'); setTicketPriorityFilter('Semua'); }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'Resolved'
                        ? 'bg-emerald-500/20 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-[#0f172a]/70 border-slate-800/80 hover:bg-emerald-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-medium">Selesai</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-emerald-300">{resolvedCount}</span>
                      <span className="text-[11px] text-emerald-400/70">tuntas</span>
                    </div>
                  </button>

                  {/* Urgent / Prioritas Tinggi */}
                  <button
                    onClick={() => { setTicketPriorityFilter('Tinggi'); setTicketStatusFilter('Semua'); }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer ${
                      ticketPriorityFilter === 'Tinggi' || ticketPriorityFilter === 'Urgent'
                        ? 'bg-rose-500/20 border-rose-500/60 shadow-md ring-1 ring-rose-500/50'
                        : 'bg-[#0f172a]/70 border-slate-800/80 hover:bg-rose-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-400 font-medium">Prioritas Tinggi</span>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-rose-300">{urgentCount}</span>
                      <span className="text-[11px] text-rose-400/70">butuh atensi</span>
                    </div>
                  </button>
                </div>

                {/* 3. Search Bar, Dropdown Filters, Sort & Category Pills */}
                <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-xl shadow-lg space-y-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        placeholder="Cari ID tiket, nama pelanggan, kontak WhatsApp, atau kendala..."
                        className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition"
                      />
                      {ticketSearchQuery && (
                        <button
                          onClick={() => setTicketSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Filter */}
                      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                        <select
                          value={ticketStatusFilter}
                          onChange={(e) => setTicketStatusFilter(e.target.value)}
                          className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1"
                        >
                          <option value="Semua" className="bg-[#0f172a]">Semua</option>
                          <option value="Open" className="bg-[#0f172a]">Open</option>
                          <option value="In Progress" className="bg-[#0f172a]">In Progress</option>
                          <option value="Resolved" className="bg-[#0f172a]">Resolved</option>
                          <option value="Closed" className="bg-[#0f172a]">Closed</option>
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Prioritas:</span>
                        <select
                          value={ticketPriorityFilter}
                          onChange={(e) => setTicketPriorityFilter(e.target.value)}
                          className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1"
                        >
                          <option value="Semua" className="bg-[#0f172a]">Semua</option>
                          <option value="Urgent" className="bg-[#0f172a]">Urgent</option>
                          <option value="Tinggi" className="bg-[#0f172a]">Tinggi</option>
                          <option value="Normal" className="bg-[#0f172a]">Normal</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Urutan:</span>
                        <select
                          value={ticketSortOrder}
                          onChange={(e) => setTicketSortOrder(e.target.value)}
                          className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1"
                        >
                          <option value="newest" className="bg-[#0f172a]">Terbaru</option>
                          <option value="oldest" className="bg-[#0f172a]">Terlama</option>
                          <option value="priority" className="bg-[#0f172a]">Prioritas Tertinggi</option>
                          <option value="status" className="bg-[#0f172a]">Status Terbuka</option>
                        </select>
                      </div>

                      {hasActiveFilter && (
                        <button
                          onClick={resetAllFilters}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-medium border border-rose-500/20 transition flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Pills Row */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1 text-xs border-t border-slate-800/80">
                    {categoriesList.map((item) => {
                      const count = item.id === 'Semua'
                        ? tickets.length
                        : tickets.filter((t) => (t.category || 'Layanan Umum').toLowerCase().includes(item.id.toLowerCase().slice(0, 5))).length;
                      const isSelected = ticketCategoryFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setTicketCategoryFilter(item.id)}
                          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 border whitespace-nowrap cursor-pointer ${
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
                </div>

                {/* 4. DESKTOP TABLE VIEW (Responsive with Horizontal Scrollbar) */}
                <div className="hidden md:block rounded-2xl border border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-xl overflow-x-auto shadow-xl">
                  <table className="w-full min-w-[1050px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                        <th className="p-3.5 w-28">ID Tiket</th>
                        <th className="p-3.5 w-40">Pelanggan</th>
                        <th className="p-3.5 w-36">Kontak / WA</th>
                        <th className="p-3.5 w-44">Kategori & Tanda</th>
                        <th className="p-3.5 min-w-[220px]">Rincian Permohonan</th>
                        <th className="p-3.5 w-36">Status</th>
                        <th className="p-3.5 w-28">Prioritas</th>
                        <th className="p-3.5 w-48 text-right pr-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {displayTickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-500">
                            <Ticket className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                            <p className="font-medium text-slate-400">
                              {hasActiveFilter 
                                ? 'Tidak ada tiket yang sesuai dengan pencarian atau filter yang dipilih.'
                                : 'Belum ada tiket layanan yang terdaftar.'}
                            </p>
                            {hasActiveFilter && (
                              <button
                                onClick={resetAllFilters}
                                className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs inline-flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Semua Filter</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        displayTickets.map((t, idx) => {
                          const cat = (t.category || 'Layanan Umum').toLowerCase();
                          const cleanPhone = String(t.contact || t.sender || '').replace(/\D/g, '');
                          const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

                          return (
                            <tr key={`${t.id || 'ticket'}_${idx}`} className="hover:bg-slate-800/30 transition group">
                              {/* ID Tiket */}
                              <td className="p-3.5">
                                <span className="font-mono font-bold text-emerald-400 block">{t.id}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{dateStr}</span>
                              </td>

                              {/* Pelanggan */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px] uppercase shrink-0">
                                    {(t.name || 'P').charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-200 truncate">{t.name || 'Pelanggan'}</p>
                                    {t.notes && (
                                      <span className="text-[9px] text-emerald-400/80 block truncate">Ada Catatan</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Kontak / WA */}
                              <td className="p-3.5 font-mono">
                                {cleanPhone ? (
                                  <button
                                    onClick={() => openWhatsAppChat(t.contact || t.sender, t.id, t.name)}
                                    className="text-slate-300 hover:text-emerald-400 flex items-center gap-1 group-hover:underline text-left cursor-pointer"
                                    title="Klik untuk chat di WhatsApp"
                                  >
                                    <MessageSquare className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="truncate">+{cleanPhone}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              {/* Kategori & Tanda */}
                              <td className="p-3.5">
                                {cat.includes('beli') || cat.includes('order') || cat.includes('pembelian') ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Pembelian Produk</span>
                                  </span>
                                ) : cat.includes('garansi') || cat.includes('klaim') ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>Klaim Garansi</span>
                                  </span>
                                ) : cat.includes('pengaduan') || cat.includes('komplain') || cat.includes('rusak') || cat.includes('keluhan') ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                                    <span>Pengaduan Produk</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                    <span>{t.category || 'Layanan Umum'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Rincian Permohonan */}
                              <td className="p-3.5 text-slate-300 max-w-xs">
                                <p className="line-clamp-2 leading-relaxed" title={t.description}>
                                  {t.description}
                                </p>
                              </td>

                              {/* Status (Interactive Inline Dropdown) */}
                              <td className="p-3.5">
                                <select
                                  value={t.status || 'Open'}
                                  onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border outline-none transition ${
                                    t.status === 'Open'
                                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25'
                                      : t.status === 'Resolved' || t.status === 'Closed'
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                  }`}
                                  title="Ubah status tiket secara instan"
                                >
                                  <option value="Open" className="bg-[#0f172a] text-sky-400">Open</option>
                                  <option value="In Progress" className="bg-[#0f172a] text-amber-400">In Progress</option>
                                  <option value="Resolved" className="bg-[#0f172a] text-emerald-400">Resolved</option>
                                  <option value="Closed" className="bg-[#0f172a] text-slate-400">Closed</option>
                                </select>
                              </td>

                              {/* Prioritas */}
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

                              {/* Aksi */}
                              <td className="p-3.5 text-right pr-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  {cleanPhone && (
                                    <button
                                      onClick={() => openWhatsAppChat(t.contact || t.sender, t.id, t.name)}
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                                      title="Hubungi di WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedTicket(t);
                                      setTicketStatusUpdate(t.status || 'Open');
                                      setTicketNotesUpdate(t.notes || '');
                                      setTicketCategoryUpdate(t.category || 'Layanan Umum');
                                      setTicketPriorityUpdate(t.priority || 'Normal');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                    title="Kelola & Detail Tiket"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-400" />
                                    <span>Kelola</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTicket(t.id)}
                                    disabled={deletingTicketId === t.id}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition cursor-pointer"
                                    title="Hapus Tiket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. MOBILE CARDS VIEW (md:hidden) */}
                <div className="md:hidden space-y-3">
                  {displayTickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 rounded-2xl bg-[#0f172a]/60 border border-slate-800 space-y-2">
                      <Ticket className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                      <p className="font-medium text-slate-400">
                        {hasActiveFilter 
                          ? 'Tidak ada tiket yang sesuai dengan filter.'
                          : 'Belum ada tiket layanan yang terdaftar.'}
                      </p>
                      {hasActiveFilter && (
                        <button
                          onClick={resetAllFilters}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs inline-flex items-center gap-1.5 border border-slate-700 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    displayTickets.map((t, idx) => {
                      const cat = (t.category || 'Layanan Umum').toLowerCase();
                      const cleanPhone = String(t.contact || t.sender || '').replace(/\D/g, '');
                      const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

                      return (
                        <div
                          key={`${t.id || 'm_ticket'}_${idx}`}
                          className="p-4 rounded-2xl border border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-xl shadow-lg space-y-3"
                        >
                          {/* Header: ID + Date + Status + Priority */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono font-bold text-xs text-emerald-400">#{t.id}</span>
                              <span className="text-[10px] text-slate-500 block">{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={t.status || 'Open'}
                                onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border outline-none ${
                                  t.status === 'Open'
                                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                    : t.status === 'Resolved' || t.status === 'Closed'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                <option value="Open" className="bg-[#0f172a]">Open</option>
                                <option value="In Progress" className="bg-[#0f172a]">In Progress</option>
                                <option value="Resolved" className="bg-[#0f172a]">Resolved</option>
                                <option value="Closed" className="bg-[#0f172a]">Closed</option>
                              </select>

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
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-100">{t.name || 'Pelanggan'}</h4>
                              <p className="text-xs text-slate-400 font-mono">+{cleanPhone || t.contact || t.sender}</p>
                            </div>
                            {cleanPhone && (
                              <button
                                onClick={() => openWhatsAppChat(t.contact || t.sender, t.id, t.name)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Chat WA</span>
                              </button>
                            )}
                          </div>

                          {/* Category Badge */}
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

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setTicketStatusUpdate(t.status || 'Open');
                                setTicketNotesUpdate(t.notes || '');
                                setTicketCategoryUpdate(t.category || 'Layanan Umum');
                                setTicketPriorityUpdate(t.priority || 'Normal');
                              }}
                              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Kelola Tiket</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(t.id)}
                              disabled={deletingTicketId === t.id}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                              title="Hapus Tiket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 5: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">

              {/* Header with Title, Search, and Tambah Produk Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white">Koleksi Karpet Eksklusif Sultan Carpet Gallery</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                      {config?.catalog?.length || 0} Produk Karpet
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Koleksi karpet masjid, permadani persia, dan karpet modern yang terintegrasi otomatis dengan bot WhatsApp dan memori AI
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Cari karpet..."
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
                        Klik tombol di bawah untuk menambahkan produk karpet baru ke katalog Anda.
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
                      const cleanImg = (item.image || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '');
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
                                e.target.src = '/catalog/karpet-masjid-turki.jpg';
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

          
          {/* TAB: STORE PROFILE & OWNER */}
          {activeTab === 'store_profile' && (
            <div className="space-y-6">

              {/* Hero Banner with Store Showroom Image */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                <div className="absolute inset-0 z-0">
                  <img
                    src="/images/toko-karpet-showroom.jpg"
                    alt="Sultan Carpet Gallery Showroom"
                    className="w-full h-full object-cover opacity-30 filter saturate-150"
                    onError={(e) => { e.currentTarget.src = '/catalog/karpet-masjid-turki.jpg'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/90 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 p-6 sm:p-10 space-y-4 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                    <Award className="w-3.5 h-3.5" />
                    <span>GALERI KARPET PREMIUM SEJAK 2012</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Sultan Carpet Gallery
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Pusat distribusi karpet masjid impor Turki & permadani klasik Persia nomor satu di Indonesia.
                    Didirikan dan dipimpin langsung oleh <strong className="text-emerald-400 font-bold">{ownerSettings.owner_name}</strong> ({ownerSettings.role}).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                      <p className="text-emerald-400 font-bold text-lg sm:text-xl font-mono">12+ Thn</p>
                      <p className="text-slate-400 text-xs">Pengalaman Melayani</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                      <p className="text-emerald-400 font-bold text-lg sm:text-xl font-mono">1.500+</p>
                      <p className="text-slate-400 text-xs">Masjid Terpasang</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                      <p className="text-emerald-400 font-bold text-lg sm:text-xl font-mono">10.000+</p>
                      <p className="text-slate-400 text-xs">Pelanggan Puas</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                      <p className="text-emerald-400 font-bold text-lg sm:text-xl font-mono">100%</p>
                      <p className="text-slate-400 text-xs">Benang Asli Grade A</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column: Owner Story & Direct Live Editor Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Story & Direct Details */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Story Card */}
                  <div className="p-6 sm:p-7 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">Sejarah & Filosofi Pendiri</h3>
                        <p className="text-xs text-slate-400">Dedikasi menghadirkan kemuliaan sajadah & kehangatan hunian</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {ownerSettings.story}
                    </p>
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Komitmen Manajemen:</span>
                      </p>
                      <p>{ownerSettings.commitment}</p>
                    </div>
                  </div>

                  {/* Highlights / Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-semibold text-xs">
                        🕌
                      </div>
                      <h4 className="font-bold text-white text-sm">Spesialis Karpet Masjid</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Layanan survey gratis, pembawaan sampel bahan fisik, dan pengukuran presisi dengan akurasi arah kiblat.
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-semibold text-xs">
                        👑
                      </div>
                      <h4 className="font-bold text-white text-sm">Permadani Klasik Persia</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Koleksi eksklusif sutra alami dan wool Tabriz bernilai seni tinggi, tahan puluhan tahun dengan sertifikat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Direct Contact & Live Settings Form */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Contact Owner Quick Card */}
                  <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>Kontak Pemilik & Kantor Pusat</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-mono">Telepon / WhatsApp</p>
                          <p className="font-bold text-white font-mono">{ownerSettings.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyText(ownerSettings.phone, 'Telepon Pemilik')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Salin Nomor"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('sender');
                              setManualMessage(`Halo Bapak/Ibu ${ownerSettings.owner_name}, saya ingin berkonsultasi seputar pesanan karpet.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            Chat WA
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-mono">Email Resmi</p>
                          <p className="font-bold text-white">{ownerSettings.email}</p>
                        </div>
                        <button
                          onClick={() => handleCopyText(ownerSettings.email, 'Email Pemilik')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Salin Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Edit Store & Owner Info Form */}
                  <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span>Edit Profil Toko & Pemilik</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Nama Pemilik / Founder</label>
                        <input
                          type="text"
                          value={ownerSettings.owner_name}
                          onChange={(e) => setOwnerSettings((prev) => ({ ...prev, owner_name: e.target.value }))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Jabatan / Role</label>
                        <input
                          type="text"
                          value={ownerSettings.role}
                          onChange={(e) => setOwnerSettings((prev) => ({ ...prev, role: e.target.value }))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Nomor WhatsApp</label>
                          <input
                            type="text"
                            value={ownerSettings.phone}
                            onChange={(e) => setOwnerSettings((prev) => ({ ...prev, phone: e.target.value }))}
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Email Resmi</label>
                          <input
                            type="text"
                            value={ownerSettings.email}
                            onChange={(e) => setOwnerSettings((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Sejarah & Kisah Toko</label>
                        <textarea
                          rows={3}
                          value={ownerSettings.story}
                          onChange={(e) => setOwnerSettings((prev) => ({ ...prev, story: e.target.value }))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Komitmen Pelayanan</label>
                        <textarea
                          rows={2}
                          value={ownerSettings.commitment}
                          onChange={(e) => setOwnerSettings((prev) => ({ ...prev, commitment: e.target.value }))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveStoreSection('owner_info', ownerSettings, 'Profil toko & pemilik berhasil disimpan!')}
                        disabled={savingStoreInfo}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {savingStoreInfo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>{savingStoreInfo ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SCHEDULE & WORKING HOURS */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">

              {/* Status Header */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg">Jadwal & Jam Operasional Toko</h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Showroom Buka Hari Ini
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pelayanan konsultasi, survey pengukuran gratis, pengiriman kargo, dan pemasangan karpet 24 jam.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('sender');
                    setManualMessage('Halo Sultan Carpet Gallery, saya ingin membuat janji survey dan pengukuran karpet ke lokasi kami.');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center gap-2 shrink-0 shadow-lg shadow-sky-600/20"
                >
                  <Clock className="w-4 h-4" />
                  <span>Jadwalkan Survey Gratis</span>
                </button>
              </div>

              {/* 4 Working Hours Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Jam Showroom */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">1. Jam Buka Showroom & Galeri</h4>
                      <p className="text-xs text-slate-400">Kunjungan langsung, melihat motif, & cek ketebalan benang</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Senin - Sabtu:</span>
                      <span className="font-bold text-emerald-400 font-mono">08:30 - 20:00 WIB</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Minggu & Hari Libur:</span>
                      <span className="font-bold text-emerald-400 font-mono">09:00 - 18:00 WIB</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Showroom kami siap menyambut Anda dengan ribuan gulungan sampel karpet fisik dan katalog motif terlengkap.
                  </p>
                </div>

                {/* 2. Jam Survey */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">2. Jam Layanan Survey & Bawa Sampel</h4>
                      <p className="text-xs text-slate-400">GRATIS area Jabodetabek tanpa dipungut biaya apapun</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Setiap Hari (Senin - Minggu):</span>
                      <span className="font-bold text-sky-400 font-mono">08:00 - 21:00 WIB</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Termasuk hari Minggu dan hari libur nasional (jadwal disesuaikan dengan janji temu).
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Konsultan teknis kami datang membawa meteran laser digital presisi dan contoh potongan bahan karpet grade A hingga premium.
                  </p>
                </div>

                {/* 3. Jam Pasang & Obras 24 Jam */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">3. Instalasi, Pasang & Obras 24 Jam</h4>
                      <p className="text-xs text-slate-400">Jadwal fleksibel tanpa mengganggu jadwal ibadah / kerja</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Layanan Teknisi:</span>
                      <span className="font-bold text-purple-400 font-mono">24 Jam (By Appointment)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Khusus masjid, pemasangan biasa dilakukan malam hari setelah salat Isya hingga menjelang Subuh.
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Menggunakan mesin obras portabel heavy duty untuk menjahit sambungan karpet dan lekukan tiang pilar secara presisi di tempat.
                  </p>
                </div>

                {/* 4. Jadwal Pengiriman */}
                <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">4. Jadwal Ekspedisi & Pengiriman Kargo</h4>
                      <p className="text-xs text-slate-400">Armada internal & ekspedisi kargo resmi ke seluruh Nusantara</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Jabodetabek:</span>
                      <span className="font-bold text-amber-400 font-mono">Setiap Hari Kerja</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Luar Kota / Pulau:</span>
                      <span className="font-bold text-amber-400 font-mono">Indah, Dakota, Baraka</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Setiap gulungan karpet dipacking rapat 2 lapis plastik tebal tahan air dan karung pengaman untuk perlindungan maksimal selama perjalanan.
                  </p>
                </div>
              </div>

              {/* Live Form Editor for Schedules */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  <span>Edit Data Jadwal & Jam Kerja</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Jam Operasional Showroom</label>
                    <textarea
                      rows={2}
                      value={scheduleSettings.store_hours}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, store_hours: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Jadwal Survey Lokasi</label>
                    <textarea
                      rows={2}
                      value={scheduleSettings.survey_hours}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, survey_hours: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Jadwal Pasang & Obras</label>
                    <textarea
                      rows={2}
                      value={scheduleSettings.installation_hours}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, installation_hours: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Jadwal Pengiriman Kargo</label>
                    <textarea
                      rows={2}
                      value={scheduleSettings.shipping_schedule}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, shipping_schedule: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSaveStoreSection('schedule_info', scheduleSettings, 'Jadwal operasional berhasil disimpan!')}
                    disabled={savingStoreInfo}
                    className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                  >
                    {savingStoreInfo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{savingStoreInfo ? 'Menyimpan...' : 'Simpan Perubahan Jadwal'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOCATION & ADDRESS */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              {/* Header with Title, Search, and Tambah Lokasi Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span>Lokasi Alamat Showroom & Gudang Sultan Carpet Gallery</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                      {(locationSettings.items || []).length} Lokasi Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola showroom resmi, gudang, workshop obras, dan galeri cabang Sultan Carpet Gallery
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={locationSettings.main_showroom?.maps_url || 'https://maps.google.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition border border-slate-700 flex items-center gap-1.5 shrink-0"
                  >
                    <Map className="w-4 h-4 text-amber-400" />
                    <span>Peta Utama</span>
                  </a>
                  <button
                    onClick={handleOpenAddLocation}
                    className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-600/20 flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Lokasi Baru</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Location Cards Grid */}
              {(() => {
                const locationsList = (locationSettings.items && locationSettings.items.length > 0)
                  ? locationSettings.items
                  : [
                      {
                        id: 'loc-1',
                        type: 'Showroom Utama',
                        title: locationSettings.main_showroom?.title || 'Showroom Utama Fatmawati',
                        address: locationSettings.main_showroom?.address || 'Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan 12430',
                        landmark: locationSettings.main_showroom?.landmark || '500 meter dari Stasiun MRT Cipete Raya',
                        hours: locationSettings.main_showroom?.hours || 'Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB',
                        phone: locationSettings.main_showroom?.phone || '0812-9876-5432',
                        maps_url: locationSettings.main_showroom?.maps_url || 'https://maps.google.com/?q=Fatmawati+Jakarta+Selatan'
                      }
                    ];

                if (locationsList.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                      <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="font-semibold text-slate-400 text-sm">
                        Belum ada lokasi showroom atau cabang tersimpan
                      </p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Klik tombol di bawah untuk menambahkan alamat showroom atau workshop baru.
                      </p>
                      <button
                        onClick={handleOpenAddLocation}
                        className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Lokasi Sekarang</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locationsList.map((loc, idx) => {
                      const typeStr = loc.type || 'Showroom';
                      const badgeClass = typeStr.includes('Utama')
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : typeStr.includes('Gudang') || typeStr.includes('Obras')
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

                      return (
                        <div
                          key={loc.id || idx}
                          className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badgeClass}`}>
                                {loc.type || 'Showroom'}
                              </span>
                              <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleOpenEditLocation(loc, idx)}
                                  title="Edit Lokasi & Alamat"
                                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(idx, loc.title)}
                                  title="Hapus Lokasi"
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-white text-base leading-snug group-hover:text-amber-300 transition">
                              {loc.title}
                            </h4>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {loc.address}
                            </p>

                            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5">
                              {loc.landmark && (
                                <p className="text-slate-400">
                                  <strong className="text-slate-300">Landmark:</strong> {loc.landmark}
                                </p>
                              )}
                              {loc.hours && (
                                <p className="text-slate-400">
                                  <strong className="text-slate-300">Jam Buka:</strong> {loc.hours}
                                </p>
                              )}
                              {loc.phone && (
                                <p className="text-slate-400">
                                  <strong className="text-slate-300">Telepon/WA:</strong>{' '}
                                  <span className="font-mono text-emerald-400 font-semibold">{loc.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleCopyText(loc.address, `Alamat ${loc.title}`)}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedField === `Alamat ${loc.title}` ? 'Tersalin!' : 'Salin Alamat'}</span>
                            </button>

                            {loc.maps_url && (
                              <a
                                href={loc.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition shrink-0"
                                title="Buka di Google Maps"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              onClick={() => {
                                setActiveTab('sender');
                                setManualMessage(`Halo Sultan Carpet, saya ingin berkunjung ke ${loc.title} (${loc.address}). Apakah hari ini buka?`);
                              }}
                              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shrink-0"
                              title="Hubungi WhatsApp Cabang"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-6">

              {/* Certificate-Style Header */}
              <div className="relative rounded-3xl overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-[#0f172a] to-[#0f172a] p-6 sm:p-8 shadow-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>GARANSI RESMI RESELLER UTAMA</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white">
                  {warrantySettings.title || 'Jaminan Kualitas & Garansi Resmi Sultan Carpet'}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {warrantySettings.summary}
                </p>
              </div>

              {/* 4 Warranty Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(warrantySettings.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-3 hover:border-indigo-500/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono">
                        0{idx + 1}
                      </div>
                      <h4 className="font-bold text-white text-sm sm:text-base">{item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-13">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Procedure & Quick Claim CTA */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-white text-base">Tata Cara Klaim Garansi Cepat</h4>
                    <p className="text-xs text-slate-400">Tim teknisi kami siap merespons laporan Anda dalam 1x24 jam</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowComplaintModal(true)}
                      className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Ajukan Klaim Garansi</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('sender');
                        setManualMessage('Halo Tim Garansi Sultan Carpet, saya ingin mengajukan klaim garansi untuk produk karpet kami.');
                      }}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Konsultasi WA</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <p className="font-bold text-indigo-400">Langkah 1: Dokumentasi</p>
                    <p className="text-slate-300">Ambil foto atau video bagian jahitan obras / benang yang ingin diklaim.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <p className="font-bold text-indigo-400">Langkah 2: Lapor & Tiket</p>
                    <p className="text-slate-300">Kirim laporan melalui formulir klaim atau WhatsApp. Nomor tiket resmi langsung terbit.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <p className="font-bold text-indigo-400">Langkah 3: Perbaikan Teknisi</p>
                    <p className="text-slate-300">Teknisi berkunjung ke lokasi untuk obras ulang atau proses tukar baru tanpa dipungut biaya.</p>
                  </div>
                </div>
              </div>

              {/* Live Form Editor for Warranty */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Edit Kebijakan Garansi</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Judul Dokumen Garansi</label>
                    <input
                      type="text"
                      value={warrantySettings.title}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Ringkasan Garansi</label>
                    <textarea
                      rows={2}
                      value={warrantySettings.summary}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, summary: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Panduan Langkah Klaim</label>
                    <textarea
                      rows={3}
                      value={warrantySettings.claim_steps}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, claim_steps: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveStoreSection('warranty_info', warrantySettings, 'Ketentuan garansi berhasil disimpan!')}
                      disabled={savingStoreInfo}
                      className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {savingStoreInfo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{savingStoreInfo ? 'Menyimpan...' : 'Simpan Ketentuan Garansi'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROMO & DISCOUNTS */}
          {activeTab === 'promo' && (
            <div className="space-y-6">

              {/* Header with Tambah Promo button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-rose-400" />
                      <span>{promoSettings.title || 'Promo & Penawaran Spesial Karpet'}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold text-xs">
                      {(promoSettings.active_promos || []).length} Promo Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Daftar potongan harga, cashback, dan bonus aksesoris yang otomatis terhubung dengan balasan bot WhatsApp
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingPromoIndex(null);
                    setPromoForm({
                      id: '',
                      title: '',
                      discount: '',
                      desc: '',
                      badge: 'Spesial',
                      valid_until: 'Akhir Bulan'
                    });
                    setShowPromoModal(true);
                  }}
                  className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-lg shadow-rose-600/20 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Promo Baru</span>
                </button>
              </div>

              {/* Active Promos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(promoSettings.active_promos || []).map((promo, idx) => (
                  <div
                    key={promo.id || idx}
                    className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-rose-500/30 transition group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs">
                          {promo.badge || 'Promo'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Masa Berlaku: <strong className="text-slate-300">{promo.valid_until || 'Tersedia'}</strong>
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-rose-300 transition">
                        {promo.title}
                      </h4>
                      <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-rose-300 font-bold text-sm">
                        🎉 {promo.discount}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {promo.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const text = `🔥 *${promo.title}*\n${promo.discount}\n\n${promo.desc}\n\n*Berlaku:* ${promo.valid_until}\nInfo pemesanan: Hubungi Sultan Carpet Gallery`;
                            handleCopyText(text, `Promo ${promo.id || idx}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedField === `Promo ${promo.id || idx}` ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('sender');
                            setManualMessage(`Halo! Saya tertarik dengan penawaran: *${promo.title}* (${promo.discount}). Mohon rincian lengkapnya.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 transition flex items-center gap-1"
                        >
                          <span>Kirim via WA</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPromoIndex(idx);
                            setPromoForm(promo);
                            setShowPromoModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Edit Promo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(idx)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50"
                          title="Hapus Promo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: COMPLAINT & SERVICE CENTER */}
          {activeTab === 'complaint' && (
            <div className="space-y-6">

              {/* SLA & CS Hotline Header */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg">Pusat Layanan Komplain & Pengaduan Pelanggan</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-semibold">
                        SLA 1x24 Jam
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hotline Manajer CS: <strong className="text-white font-mono">{complaintSettings.contact_manager}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Laporan Komplain Baru</span>
                </button>
              </div>

              {/* 5-Step Workflow Cards */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                <h4 className="font-bold text-white text-sm">Alur & Standar Operasional Penanganan Keluhan (SOP)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {(complaintSettings.workflow || []).map((step, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 flex flex-col justify-between">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold font-mono text-xs flex items-center justify-center">
                        {i + 1}
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrated Complaint Tickets Table */}
              <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span>Daftar Tiket Pengaduan & Layanan Aktif</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    Total {tickets.length} Tiket Terdaftar
                  </span>
                </div>

                {tickets.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                    Belum ada tiket komplain aktif. Semua layanan berjalan lancar!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">No. Tiket</th>
                          <th className="py-2.5 px-3">Pelanggan</th>
                          <th className="py-2.5 px-3">Kategori & Masalah</th>
                          <th className="py-2.5 px-3">Prioritas</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {tickets.slice(0, 10).map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                              #{ticket.id}
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-white">{ticket.name || ticket.sender || '-'}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{ticket.contact || ticket.sender || '-'}</p>
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium inline-block mb-0.5">
                                {ticket.category || 'Komplain'}
                              </span>
                              <p className="text-slate-300 truncate" title={ticket.description}>
                                {ticket.description}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                ticket.priority === 'Tinggi' || ticket.priority === 'High'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {ticket.priority || 'Normal'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                ticket.status === 'Open'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : ticket.status === 'In Progress'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveTab('tickets');
                                  setSelectedTicket(ticket);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Kelola Tiket #{selectedTicket.id}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('id-ID') : 'Tiket Aktif'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Customer & Quick WA Action */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pelanggan</span>
                  <p className="font-bold text-slate-100 text-sm mt-0.5">{selectedTicket.name || 'Pelanggan'}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{selectedTicket.contact || selectedTicket.sender || '-'}</p>
                </div>
                {(selectedTicket.contact || selectedTicket.sender) && (
                  <button
                    type="button"
                    onClick={() => openWhatsAppChat(selectedTicket.contact || selectedTicket.sender, selectedTicket.id, selectedTicket.name)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat WA</span>
                  </button>
                )}
              </div>

              {/* Rincian Permohonan */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-300">Rincian Permohonan / Keluhan</span>
                <p className="text-slate-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Status & Priority Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Status Tiket</label>
                  <select
                    value={ticketStatusUpdate}
                    onChange={(e) => setTicketStatusUpdate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Open">Open (Menunggu Penanganan)</option>
                    <option value="In Progress">In Progress (Sedang Diproses)</option>
                    <option value="Resolved">Resolved (Selesai Tuntas)</option>
                    <option value="Closed">Closed (Ditutup)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prioritas</label>
                  <select
                    value={ticketPriorityUpdate}
                    onChange={(e) => setTicketPriorityUpdate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Kategori Layanan */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Kategori Layanan</label>
                <select
                  value={ticketCategoryUpdate}
                  onChange={(e) => setTicketCategoryUpdate(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Pembelian Produk">Pembelian Produk (Order / Beli)</option>
                  <option value="Klaim Garansi">Klaim Garansi (Ganti Baru / Pecah)</option>
                  <option value="Pengaduan Produk">Pengaduan Produk (Komplain / Kendala)</option>
                  <option value="Layanan Umum">Layanan Umum (Pertanyaan / Informasi)</option>
                </select>
              </div>

              {/* Catatan Petugas */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Catatan Petugas / Tindak Lanjut</label>
                <textarea
                  rows={3}
                  value={ticketNotesUpdate}
                  onChange={(e) => setTicketNotesUpdate(e.target.value)}
                  placeholder="Tuliskan catatan tindak lanjut, solusi, atau kontak CS..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleUpdateTicket}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition cursor-pointer"
              >
                Simpan Pembaruan
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Hapus Tiket Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT TIKET MANUAL BARU */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Buat Tiket Layanan Baru</h3>
                  <p className="text-[11px] text-slate-400">Input permohonan pelanggan via walk-in, panggilan, atau chat</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTicketModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Nama Pelanggan <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: H. Ahmad Subardjo"
                    value={newTicketForm.name}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">No. WhatsApp / Kontak</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={newTicketForm.contact}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Kategori</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Pembelian Produk">Pembelian Produk</option>
                    <option value="Klaim Garansi">Klaim Garansi</option>
                    <option value="Pengaduan Produk">Pengaduan Produk</option>
                    <option value="Layanan Umum">Layanan Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prioritas</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Status Awal</label>
                  <select
                    value={newTicketForm.status}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Deskripsi Permohonan / Pesanan <span className="text-rose-400">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan kebutuhan karpet, ukuran masjid, atau keluhan barang..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Catatan Internal Petugas (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan penanganan untuk tim survey atau teknisi obras..."
                  value={newTicketForm.notes}
                  onChange={(e) => setNewTicketForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submittingNewTicket}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingNewTicket ? 'Menyimpan Tiket...' : 'Terbitkan Tiket Layanan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
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
                      src={imagePreview || '/catalog/karpet-masjid-turki.jpg'}
                      alt="Preview"
                      onError={(e) => {
                        e.target.src = '/catalog/karpet-masjid-turki.jpg';
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
                      Mendukung format JPG, PNG, WEBP (maks. 5MB). Atau pilih preset foto karpet di bawah:
                    </p>
                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        { label: 'Karpet Masjid', path: 'catalog/karpet-masjid-turki.jpg' },
                        { label: 'Permadani Persia', path: 'catalog/karpet-persia-mewah.jpg' },
                        { label: 'Nordic Scandi', path: 'catalog/karpet-scandi-modern.jpg' },
                        { label: 'Bulu Shaggy', path: 'catalog/karpet-shaggy-bulu.jpg' },
                        { label: 'Karpet Tile Kantor', path: 'catalog/karpet-kantor-tile.jpg' },
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
                    placeholder="Contoh: Tersedia Hijau Emerald, Merah Ruby, & Sapphire."
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
                  placeholder="Contoh: Karpet masjid grade A benang polypropylene heattwist lembut, tebal 15mm dengan motif mihrab mewah."
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
                  placeholder="https://sultancarpet.co.id/koleksi/..."
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
      {showProfileModal && profileTarget && (() => {
        const rawModalName = profileTarget.senderName && !/^\+?\d{10,}$/.test(profileTarget.senderName.trim())
          ? profileTarget.senderName.trim()
          : null;
        const modalHasRealPhone = profileTarget.phone && !/^\d{14,}$/.test(profileTarget.phone) && !profileTarget.phone.includes('@lid');
        const modalFormattedPhone = profileTarget.formattedPhone && !profileTarget.formattedPhone.includes('LID')
          ? profileTarget.formattedPhone
          : (modalHasRealPhone
              ? (profileTarget.phone.startsWith('+') ? profileTarget.phone : `+${profileTarget.phone}`)
              : 'WhatsApp ID (LID)');
        const modalDisplayName = rawModalName || (modalHasRealPhone ? modalFormattedPhone : 'Pelanggan');
        const modalInitials = (rawModalName || 'Pelanggan')
          .split(' ')
          .filter(Boolean)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'PL';

        return (
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
                  {modalInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-base text-white truncate">
                      {modalDisplayName}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold shrink-0">
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs font-mono text-emerald-400 mb-1 font-semibold truncate">
                    {modalFormattedPhone}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {profileTarget.messages?.length || 0} pesan tercatat dalam obrolan
                  </p>
                </div>
              </div>

              {/* Quick Action Shortcuts */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={modalHasRealPhone ? `https://wa.me/${profileTarget.phone.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                    modalHasRealPhone
                      ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                      : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka WhatsApp</span>
                </a>

                <button
                  type="button"
                  disabled={!modalHasRealPhone}
                  onClick={() => modalHasRealPhone && handleCopyText(profileTarget.phone, 'Nomor Telepon')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                    modalHasRealPhone
                      ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
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
        );
      })()}

      {/* COMPLAINT SUBMISSION MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Formulir Pengaduan & Klaim Garansi</h3>
                  <p className="text-[11px] text-slate-400">Nomor tiket otomatis terbit & diteruskan ke CS Manager</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaintTicket} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Nama Pelapor / Pemesan *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.name}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: DKM Masjid Al-Ikhlas / Bpk Rudi"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Nomor WhatsApp / Kontak *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.phone}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0812xxxxxxxx"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Kategori Pengaduan</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Pengaduan Produk">Pengaduan Produk / Karpet</option>
                    <option value="Klaim Garansi Obras">Klaim Garansi Obras & Jahitan</option>
                    <option value="Pengiriman & Logistik">Pengiriman & Logistik Kargo</option>
                    <option value="Lainnya">Pertanyaan & Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Jenis Kendala</label>
                  <select
                    value={complaintForm.issueType}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, issueType: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Kualitas / Obras Karpet">Kualitas / Obras Karpet</option>
                    <option value="Ukuran / Kemiringan Kiblat">Ukuran / Potongan Kemiringan Kiblat</option>
                    <option value="Cacat Benang Impor">Cacat Benang / Tenun Pabrik</option>
                    <option value="Jadwal Pasang Terlambat">Keterlambatan Teknisi Pasang</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Detail Keluhan / Rincian Kendala *</label>
                <textarea
                  rows={3}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ceritakan kendala yang dihadapi secara detail..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {submittingComplaint ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{submittingComplaint ? 'Menerbitkan...' : 'Kirim Laporan Komplain'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCATION FORM MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {editingLocationIndex !== null ? 'Edit Lokasi & Alamat' : 'Tambah Lokasi Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Data showroom otomatis sinkron dengan WhatsApp bot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Nama / Judul Lokasi *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.title}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: Showroom Fatmawati Jakarta Selatan"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Tipe / Kategori Lokasi</label>
                  <select
                    value={locationForm.type}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Showroom Utama">Showroom Utama</option>
                    <option value="Gudang & Obras">Gudang & Workshop Obras</option>
                    <option value="Cabang Gallery">Cabang Gallery Resmi</option>
                    <option value="Workshop Jahit">Workshop Jahit & Obras</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Alamat Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Contoh: Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan 12430"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Petunjuk / Landmark</label>
                  <input
                    type="text"
                    value={locationForm.landmark}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, landmark: e.target.value }))}
                    placeholder="Contoh: 500m dari Stasiun MRT Cipete Raya"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Telepon / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.phone}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 0812-9876-5432"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Jam Operasional</label>
                  <input
                    type="text"
                    value={locationForm.hours}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, hours: e.target.value }))}
                    placeholder="Contoh: Senin - Sabtu: 08:30 - 20:00 WIB"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Tautan Google Maps</label>
                  <input
                    type="text"
                    value={locationForm.maps_url}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, maps_url: e.target.value }))}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Lokasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMO FORM MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {editingPromoIndex !== null ? 'Edit Promo Karpet' : 'Tambah Promo Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Promo langsung aktif di dashboard & bot WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Judul Promo *</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Promo Gebyar Karpet Masjid Berkah"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Potongan / Diskon / Benefit *</label>
                  <input
                    type="text"
                    required
                    value={promoForm.discount}
                    onChange={(e) => setPromoForm((prev) => ({ ...prev, discount: e.target.value }))}
                    placeholder="Contoh: Diskon 20% + Gratis Obras"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Badge Label</label>
                  <select
                    value={promoForm.badge}
                    onChange={(e) => setPromoForm((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Terpopuler">Terpopuler</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Spesial B2B">Spesial B2B</option>
                    <option value="Gratis 100%">Gratis 100%</option>
                    <option value="Diskon Akbar">Diskon Akbar</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Masa Berlaku</label>
                <input
                  type="text"
                  value={promoForm.valid_until}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, valid_until: e.target.value }))}
                  placeholder="Contoh: Akhir Bulan Ini / Stok Terbatas"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Deskripsi Syarat & Ketentuan</label>
                <textarea
                  rows={3}
                  value={promoForm.desc}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder="Keterangan lengkap promo dan syarat pemesanan..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Promo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
