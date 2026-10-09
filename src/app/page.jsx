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
  Brain,
  Lightbulb,
  BookOpen,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  ChevronDown,
  ChevronUp,
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
  CheckCircle,
  Headphones,
  ToggleLeft,
  ToggleRight,
  Power,
  Globe,
  Link as LinkIcon
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'gemini' | 'qr' | 'tickets' | 'catalog' | 'store_profile' | 'schedule' | 'location' | 'warranty' | 'promo' | 'complaint' | 'settings'

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
  const [restartingConn, setRestartingConn] = useState(false);

  // Data States
  const [chatLogs, setChatLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

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
  const [aiStudioMobileView, setAiStudioMobileView] = useState('simulator'); // 'simulator' | 'config'
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

  // Q&A & Customer Behavior Knowledge States (Pembelajaran AI)
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('Semua');
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    id: '',
    q: '',
    a: '',
    category: 'Karpet Masjid & Musholla',
    source: 'Input Admin'
  });
  const [customerQuestions, setCustomerQuestions] = useState([]);
  const [loadingCustomerQuestions, setLoadingCustomerQuestions] = useState(false);
  const [faqSubTab, setFaqSubTab] = useState('qa_list'); // 'qa_list' | 'customer_insights' | 'web_crawler'
  const [syncingFaqsToAi, setSyncingFaqsToAi] = useState(false);

  // Web Crawler / Scraper States
  const [crawledPages, setCrawledPages] = useState([]);
  const [loadingCrawledPages, setLoadingCrawledPages] = useState(false);
  const [crawlUrlInput, setCrawlUrlInput] = useState('');
  const [crawlMaxPages, setCrawlMaxPages] = useState(1);
  const [crawlFollowLinks, setCrawlFollowLinks] = useState(false);
  const [crawlingWeb, setCrawlingWeb] = useState(false);
  const [viewingCrawlPage, setViewingCrawlPage] = useState(null);

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

  // Product Catalog & Category State & Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryCards, setShowCategoryCards] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('Semua');
  const [productForm, setProductForm] = useState({
    category: 'Karpet Masjid & Musholla',
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

  // Send Product to WhatsApp Chat State & Modal
  const [showSendProductModal, setShowSendProductModal] = useState(false);
  const [selectedProductToSend, setSelectedProductToSend] = useState(null);
  const [selectedChatRecipient, setSelectedChatRecipient] = useState(null);
  const [sendProductMessageText, setSendProductMessageText] = useState('');
  const [sendProductChatSearch, setSendProductChatSearch] = useState('');
  const [manualPhoneInput, setManualPhoneInput] = useState('');
  const [includeProductImage, setIncludeProductImage] = useState(true);
  const [isSendingProductMessage, setIsSendingProductMessage] = useState(false);

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

  // Hands-Off (Human Handoff & CS Takeover) State
  const [handoffConfig, setHandoffConfig] = useState({
    enabled: true,
    keywords: ['cs', 'admin', 'operator', 'manusia', 'orang', 'live agent', 'bantuan manusia'],
    release_keywords: ['!bot', 'aktifkan bot', 'kembali ke bot', 'bot', 'menu', 'selesai'],
    auto_expire_hours: 2,
    takeover_notice: 'Halo! Permintaan Anda telah kami teruskan ke Customer Service Sultan Carpet. Tim kami akan segera merespons Anda.',
    release_notice: 'Bot asisten Sultan Carpet telah aktif kembali. Silakan ketik pertanyaan atau konsultasi karpet Anda.'
  });
  const [savingHandoffConfig, setSavingHandoffConfig] = useState(false);
  const [handoffSubTab, setHandoffSubTab] = useState('contacts'); // 'contacts' | 'rules' | 'tester'
  const [handoffSearch, setHandoffSearch] = useState('');
  const [handoffFilter, setHandoffFilter] = useState('all'); // 'all' | 'handoff' | 'ai'
  const [newHandoffKeyword, setNewHandoffKeyword] = useState('');
  const [newReleaseKeyword, setNewReleaseKeyword] = useState('');
  const [manualHandoffPhone, setManualHandoffPhone] = useState('');
  const [manualHandoffReason, setManualHandoffReason] = useState('Takeover manual oleh admin');
  const [testHandoffQuery, setTestHandoffQuery] = useState('');
  const [testHandoffResult, setTestHandoffResult] = useState(null);

  const activeHandoffCount = React.useMemo(() => {
    return (conversations || []).filter((c) => Boolean(c.isHumanHandoff)).length;
  }, [conversations]);

  // Protections & Anti-Spam Settings State
  const [protectionsConfig, setProtectionsConfig] = useState({
    cooldown: {
      enabled: true,
      min_delay_ms: 2500,
      max_delay_ms: 4000,
      jitter_ms: 1000,
      typing_simulation: true,
      typing_speed_cpm: 300,
      global_max_per_minute: 25,
    },
    deduplication: {
      enabled: true,
      id_ttl_seconds: 300,
      content_window_ms: 3000,
      outbound_window_ms: 4000,
    },
    conversation_buffer: {
      enabled: true,
      debounce_ms: 2000,
      max_buffer_items: 10,
      max_context_turns: 6,
    },
    retry_limit: {
      max_retries: 2,
      backoff_base_ms: 1000,
      circuit_breaker_threshold: 3,
      circuit_breaker_timeout_ms: 60000,
    },
    opt_in: {
      enabled: true,
      default_opted_in: true,
      opt_out_keywords: ['stop', 'berhenti', 'unsubscribe', 'jangan chat', 'off', 'keluar'],
      opt_in_keywords: ['mulai', 'start', 'optin', 'aktifkan', 'on', 'lanjut', 'ya'],
    },
    flood_protection: {
      enabled: true,
      max_messages_per_minute: 15,
      cooldown_seconds: 60,
      warning_message: '⚠️ Mohon maaf, Anda mengirim pesan terlalu cepat. Silakan tunggu 1 menit sebelum mengirim pesan kembali agar layanan kami dapat memproses pertanyaan Anda dengan baik.',
    },
  });

  const [protectionsStats, setProtectionsStats] = useState({
    totalInboundProcessed: 0,
    duplicatesBlocked: 0,
    burstsAggregated: 0,
    globalRateLimitWaits: 0,
    floodsBlocked: 0,
    retriesAttempted: 0,
    circuitTrips: 0,
    humanHandoffsActive: 0,
    optOutUsers: 0,
    blockedUsersCount: 0,
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingProtections, setLoadingProtections] = useState(false);
  const [savingProtections, setSavingProtections] = useState(false);
  const [protectionsSubTab, setProtectionsSubTab] = useState('cooldown'); // 'cooldown' | 'flood' | 'dedup' | 'global_rate' | 'compliance' | 'tester'
  const [newOptOutKeyword, setNewOptOutKeyword] = useState('');
  const [newOptInKeyword, setNewOptInKeyword] = useState('');
  const [simAntiSpamCount, setSimAntiSpamCount] = useState(0);
  const [simAntiSpamLogs, setSimAntiSpamLogs] = useState([]);
  const [isSimulatingSpam, setIsSimulatingSpam] = useState(false);

  const chatContainerRef = useRef(null);
  const simScrollRef = useRef(null);

  // Show Toast Notification
  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Custom In-App Confirmation Pop-up (Replaces native browser localhost alerts)
  const askConfirmation = ({
    title = 'Konfirmasi Tindakan',
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'warning'
  }) => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        }
      });
    });
  };

  // Fetch initial config & status
  useEffect(() => {
    // Detect tab from URL parameter, hash, or pathname (e.g. /handoff, /?tab=handoff, /#handoff)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const pathname = window.location.pathname.replace(/^\/+/g, '').toLowerCase();

        if (tabParam) {
          setActiveTab(tabParam);
        } else if (hash === 'handoff' || hash === 'hands-off' || hash === 'cs') {
          setActiveTab('handoff');
        } else if (hash === 'settings' || hash === 'anti-spam' || hash === 'antispam' || hash === 'protections') {
          setActiveTab('settings');
        } else if (hash) {
          setActiveTab(hash);
        } else if (pathname === 'handoff' || pathname === 'hands-off' || pathname === 'cs') {
          setActiveTab('handoff');
        } else if (pathname === 'settings' || pathname === 'anti-spam') {
          setActiveTab('settings');
        }
      } catch (err) {}
    }

    fetchStatus();
    fetchConfig();
    fetchProtections();
    fetchTickets();
    fetchChats();
    fetchDbStatus();
    fetchFaqs();
    fetchCustomerQuestions();
    fetchCrawledPages();

    // Setup SSE for real-time events
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('protections_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data) {
          setProtectionsConfig((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {}
    });

    eventSource.addEventListener('rag_updated', () => {
      fetchCrawledPages();
    });

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
          return {
            ...prev,
            ...data,
            qrDataUrl: data.qrDataUrl !== undefined ? data.qrDataUrl : prev.qrDataUrl,
            user: data.user !== undefined ? data.user : prev.user
          };
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
          user: null
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

    eventSource.addEventListener('categories_updated', (e) => {
      try {
        const newCats = JSON.parse(e.data);
        setConfig((prev) => prev ? { ...prev, carpet_categories: newCats } : prev);
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

    eventSource.addEventListener('faqs_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) setFaqs(data);
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

  // Auto scroll AI simulator chat to bottom
  const scrollSimToBottom = () => {
    if (simScrollRef.current) {
      simScrollRef.current.scrollTop = simScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (activeTab === 'gemini') {
      scrollSimToBottom();
      const t1 = setTimeout(scrollSimToBottom, 40);
      const t2 = setTimeout(scrollSimToBottom, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeTab, simHistory, simulating, aiStudioMobileView]);

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchChats();
    }
  }, [activeTab]);

  // Polling fallback super responsif agar QR Code langsung muncul seketika jika SSE jeda
  useEffect(() => {
    if (activeTab === 'qr' && botStatus.status !== 'connected') {
      fetchStatus();
      const interval = setInterval(() => {
        fetchStatus();
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [activeTab, botStatus.status]);

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
      if (data.faqs && Array.isArray(data.faqs)) {
        setFaqs(data.faqs);
      }
      if (data.protections) {
        setProtectionsConfig((prev) => ({
          ...prev,
          ...data.protections,
        }));
      }
      if (data.protections?.human_handoff) {
        setHandoffConfig((prev) => ({
          ...prev,
          ...data.protections.human_handoff,
        }));
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchProtections = async () => {
    try {
      setLoadingProtections(true);
      const res = await fetch('/api/protections');
      const data = await res.json();
      if (data.success) {
        if (data.config) setProtectionsConfig((prev) => ({ ...prev, ...data.config }));
        if (data.stats) setProtectionsStats(data.stats);
        if (Array.isArray(data.blockedUsers)) setBlockedUsers(data.blockedUsers);
      }
    } catch (err) {
      console.warn('Gagal memuat proteksi:', err.message);
    } finally {
      setLoadingProtections(false);
    }
  };

  const handleSaveProtections = async (newCfg = null) => {
    setSavingProtections(true);
    const payload = newCfg || protectionsConfig;
    try {
      const res = await fetch('/api/protections/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setProtectionsConfig(data.protections);
        showToastMsg('Pengaturan proteksi & anti-spam berhasil disimpan!', 'success');
      } else {
        showToastMsg(data.error || 'Gagal menyimpan proteksi', 'error');
      }
    } catch (err) {
      showToastMsg('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setSavingProtections(false);
    }
  };

  const handleResetProtectionsStats = async () => {
    const ok = await askConfirmation({
      title: 'Reset Statistik Proteksi?',
      message: 'Semua hitungan pesan terblokir, debounce, dan rate limit akan dikembalikan ke angka 0.',
      confirmText: 'Ya, Reset Statistik',
      cancelText: 'Batal',
      type: 'warning'
    });
    if (!ok) return;
    try {
      const res = await fetch('/api/protections/reset-stats', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProtectionsStats(data.stats);
        showToastMsg('Statistik proteksi berhasil direset ke nol', 'success');
      }
    } catch (err) {
      showToastMsg('Gagal reset statistik: ' + err.message, 'error');
    }
  };

  const handleUnblockUser = async (jid) => {
    try {
      const res = await fetch('/api/protections/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid })
      });
      const data = await res.json();
      if (data.success) {
        setBlockedUsers((prev) => prev.filter(u => u.jid !== jid));
        showToastMsg(`Nomor ${jid} berhasil dibuka blokirnya!`, 'success');
        fetchProtections();
      }
    } catch (err) {
      showToastMsg('Gagal membuka blokir: ' + err.message, 'error');
    }
  };

  const handleLoadProtectionsDefaults = async () => {
    const ok = await askConfirmation({
      title: 'Terapkan Rekomendasi Standar Anti-Spam?',
      message: 'Sistem akan mengatur delay minimum 2.5s, delay max 4.0s, jitter 1.0s, typing presence aktif, limit global 25 pesan/menit, dan proteksi flood 15 pesan/menit.',
      confirmText: 'Terapkan Standar Aman',
      cancelText: 'Batal',
      type: 'info'
    });
    if (!ok) return;

    const recommended = {
      cooldown: {
        enabled: true,
        min_delay_ms: 2500,
        max_delay_ms: 4000,
        jitter_ms: 1000,
        typing_simulation: true,
        typing_speed_cpm: 300,
        global_max_per_minute: 25
      },
      deduplication: {
        enabled: true,
        id_ttl_seconds: 300,
        content_window_ms: 3000,
        outbound_window_ms: 4000
      },
      conversation_buffer: {
        enabled: true,
        debounce_ms: 2000,
        max_buffer_items: 10,
        max_context_turns: 6
      },
      retry_limit: {
        max_retries: 2,
        backoff_base_ms: 1000,
        circuit_breaker_threshold: 3,
        circuit_breaker_timeout_ms: 60000
      },
      opt_in: {
        enabled: true,
        default_opted_in: true,
        opt_out_keywords: ['stop', 'berhenti', 'unsubscribe', 'jangan chat', 'batal langganan', 'off', 'keluar'],
        opt_in_keywords: ['mulai', 'start', 'optin', 'aktifkan', 'on', 'lanjut', 'ya']
      },
      flood_protection: {
        enabled: true,
        max_messages_per_minute: 15,
        cooldown_seconds: 60,
        warning_message: '⚠️ Mohon maaf, Anda mengirim pesan terlalu cepat. Silakan tunggu 1 menit sebelum mengirim pesan kembali agar layanan kami dapat memproses pertanyaan Anda dengan baik.'
      }
    };

    setProtectionsConfig(recommended);
    await handleSaveProtections(recommended);
  };

  const handleSimulateAntiSpamSend = () => {
    setIsSimulatingSpam(true);
    const newCount = simAntiSpamCount + 1;
    setSimAntiSpamCount(newCount);

    const now = new Date().toLocaleTimeString('id-ID');
    const floodLimit = protectionsConfig.flood_protection?.max_messages_per_minute || 15;
    const isFlood = newCount > floodLimit;
    const minDelay = protectionsConfig.cooldown?.min_delay_ms || 2500;
    const jitter = protectionsConfig.cooldown?.jitter_ms || 1000;
    const estimatedTotal = (minDelay + Math.floor(Math.random() * jitter)) / 1000;

    let logEntry;
    if (isFlood) {
      logEntry = {
        time: now,
        count: newCount,
        status: 'BLOCKED_FLOOD',
        text: `🚫 [BLOKIR FLOOD SPAM] Pesan ke-${newCount} terdeteksi spam! Sistem otomatis memblokir nomor selama ${protectionsConfig.flood_protection?.cooldown_seconds || 60}s dan mengirim pesan peringatan.`
      };
    } else if (newCount > 1 && newCount <= 3) {
      logEntry = {
        time: now,
        count: newCount,
        status: 'BUFFERED',
        text: `🔄 [CONVERSATION BUFFER] Pesan ke-${newCount} digabungkan (Debounce ${protectionsConfig.conversation_buffer?.debounce_ms || 2000}ms). Bot tidak mengirim double-bubble chat.`
      };
    } else {
      logEntry = {
        time: now,
        count: newCount,
        status: 'COOLDOWN_ACTIVE',
        text: `✓ [DELAY & TYPING] Pesan ke-${newCount} diproses. Mengetik aktif ~1.5s, delay acak ${estimatedTotal.toFixed(1)}s sebelum terkirim ke WhatsApp.`
      };
    }

    setSimAntiSpamLogs((prev) => [logEntry, ...prev.slice(0, 14)]);
    setTimeout(() => setIsSimulatingSpam(false), 300);
  };

  const updateNestedProtections = (section, key, value) => {
    setProtectionsConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value,
      },
    }));
  };

  const handleAddOptOutKeyword = () => {
    if (!newOptOutKeyword.trim()) return;
    const kw = newOptOutKeyword.trim().toLowerCase();
    const current = protectionsConfig.opt_in?.opt_out_keywords || [];
    if (!current.includes(kw)) {
      updateNestedProtections('opt_in', 'opt_out_keywords', [...current, kw]);
    }
    setNewOptOutKeyword('');
  };

  const handleRemoveOptOutKeyword = (kwToRemove) => {
    const current = protectionsConfig.opt_in?.opt_out_keywords || [];
    updateNestedProtections('opt_in', 'opt_out_keywords', current.filter((k) => k !== kwToRemove));
  };

  const handleAddOptInKeyword = () => {
    if (!newOptInKeyword.trim()) return;
    const kw = newOptInKeyword.trim().toLowerCase();
    const current = protectionsConfig.opt_in?.opt_in_keywords || [];
    if (!current.includes(kw)) {
      updateNestedProtections('opt_in', 'opt_in_keywords', [...current, kw]);
    }
    setNewOptInKeyword('');
  };

  const handleRemoveOptInKeyword = (kwToRemove) => {
    const current = protectionsConfig.opt_in?.opt_in_keywords || [];
    updateNestedProtections('opt_in', 'opt_in_keywords', current.filter((k) => k !== kwToRemove));
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
    const ok = await askConfirmation({
      title: 'Hapus Promo Ini?',
      message: 'Promo ini akan dihapus dari daftar penawaran aktif dan AI tidak akan lagi menawarkannya ke pelanggan.',
      confirmText: 'Hapus Promo',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
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
    const ok = await askConfirmation({
      title: `Hapus Lokasi "${locTitle || 'ini'}"?`,
      message: 'Data showroom/gudang ini akan dihapus dari daftar lokasi resmi toko.',
      confirmText: 'Hapus Lokasi',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
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
    if (restartingConn) return;
    const ok = await askConfirmation({
      title: 'Mulai Ulang Koneksi WhatsApp?',
      message: 'Sistem akan memuat ulang socket WhatsApp dan menyegarkan koneksi bot secara otomatis.',
      confirmText: 'Mulai Ulang',
      cancelText: 'Batal',
      type: 'info'
    });
    if (!ok) return;
    setRestartingConn(true);
    try {
      showToastMsg('Memulai ulang koneksi WhatsApp...', 'info');
      setBotStatus((prev) => ({
        ...prev,
        status: 'connecting',
        qrDataUrl: null
      }));
      const res = await fetch('/api/restart', { method: 'POST' });
      const data = await res.json();
      showToastMsg(data.message || 'Restart terkirim', 'success');
      // Polling beruntun cepat agar QR Code langsung tampil seketika
      setTimeout(fetchStatus, 300);
      setTimeout(fetchStatus, 700);
      setTimeout(fetchStatus, 1400);
      setTimeout(fetchStatus, 2400);
    } catch (err) {
      showToastMsg('Gagal restart: ' + err.message, 'error');
    } finally {
      setTimeout(() => setRestartingConn(false), 1200);
    }
  };

  const handleLogout = async () => {
    if (restartingConn) return;
    const ok = await askConfirmation({
      title: 'Logout Sesi WhatsApp?',
      message: 'Sesi WhatsApp aktif akan dihapus dari server dan Anda perlu melakukan scan QR ulang untuk menghubungkan kembali.',
      confirmText: 'Logout & Reset QR',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
    setRestartingConn(true);
    try {
      showToastMsg('Menghapus sesi & menyiapkan QR baru...', 'info');
      // Reset status secara optimis agar layar tidak menampilkan akun lama
      setBotStatus({
        status: 'connecting',
        user: null,
        qrDataUrl: null,
        connectedAt: null
      });
      setActiveTab('qr');
      const res = await fetch('/api/logout', { method: 'POST' });
      const data = await res.json();
      showToastMsg(data.message || 'Sesi dihapus. Menyiapkan QR Code baru...', 'success');
      // Polling beruntun cepat agar QR Code langsung tampil seketika
      setTimeout(fetchStatus, 300);
      setTimeout(fetchStatus, 700);
      setTimeout(fetchStatus, 1400);
      setTimeout(fetchStatus, 2400);
    } catch (err) {
      showToastMsg('Gagal logout: ' + err.message, 'error');
    } finally {
      setTimeout(() => setRestartingConn(false), 1200);
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
        "Anda adalah Sultan Carpet Assistant, konsultan karpet dan asisten customer service resmi dari Sultan Carpet Gallery. Pemilik galeri adalah H. Ahmad Fauzi dan Hj. Maryam, berdiri sejak tahun 2012 dengan pengalaman lebih dari 12 tahun melayani lebih dari 1.500 masjid di seluruh Indonesia serta ribuan hunian mewah dan kantor korporat. Anda terintegrasi langsung dengan mesin pencarian RAG (Retrieval-Augmented Generation) yang mengindeks data faktual dari seluruh 11 halaman sistem kami: Profil Toko, Katalog Produk & Spesifikasi, Kategori, Layanan Resmi, Jadwal Operasional, Lokasi Showroom & Cabang, Ketentuan Garansi Resmi, Promo & Diskon Aktif, Pusat Komplain & Tiket CS, Hands-Off Alih Kendali Manusia, dan Basis Pengetahuan FAQ. Selalu jadikan data hasil penelusuran RAG sebagai kebenaran mutlak dalam menjawab pertanyaan pelanggan. ATURAN FOTO PRODUK: Bila pelanggan bertanya produk tanpa meminta foto, berikan penjelasan ringkas dan tawarkan konfirmasi: 'Bila Kakak ingin melihat foto fisik dan spesifikasinya, silakan balas dengan FOTO atau DETAIL'. Bila pelanggan secara eksplisit meminta atau menanyakan foto fisik karpet (misal: 'kirim foto', 'lihat foto', 'spill fotonya', 'ada fotonya?'), berikan deskripsi ringkas dan WAJIB sertakan tag otomatis [KIRIM_FOTO: KODE_PRODUK] di akhir pesan. ATURAN HANDS-OFF CS: Jika pelanggan ingin berbicara dengan operator manusia (kata kunci: cs, operator, admin manusia, bantuan staf), sampaikan dengan sopan bahwa percakapan diteruskan ke tim Customer Service manusia dan sistem akan mengambil alih kendali. ATURAN ANTI-SPAM MUTLAK: Jawab selalu dalam tepat 1 pesan tunggal yang ringkas (maksimal 2 paragraf singkat). DILARANG KERAS menggunakan tanda bintang (*) untuk menebalkan teks maupun untuk simbol apapun. Tulis teks polos tanpa simbol bintang (*). DILARANG KERAS menggunakan icon emoji apapun dalam balasan Anda. DILARANG KERAS menyuruh pelanggan mengetik format kaku seperti Ketik ORDER, Ketik MENU, atau Ketik CS. Berinteraksilah secara hangat, santun, luwes, dan solutif."
      );
      showToastMsg('Preset RAG Seluruh Halaman diterapkan!', 'success');
    } else if (type === 'survey') {
      setSystemPrompt(
        "Anda adalah Konsultan Teknis Sultan Carpet Gallery spesialis karpet masjid & hunian mewah terintegrasi RAG. Fokus utama Anda adalah mengarahkan pelanggan untuk menjadwalkan SURVEY LOKASI GRATIS, pengukuran kiblat & luas masjid, pembawaan sampel bahan fisik karpet Turki ke lokasi pemesan, dan estimasi waktu potong sambung obras di tempat. Berikan penjelasan yang meyakinkan, santun, dan tanpa simbol bintang (*) maupun emoji."
      );
      showToastMsg('Preset Fokus Survey diterapkan!', 'success');
    } else if (type === 'concise') {
      setSystemPrompt(
        "Anda adalah CS Sultan Carpet Gallery yang efisien, to-the-point, dan ramah terintegrasi RAG. Berikan jawaban cepat, padat, dan jelas mengenai harga karpet per roll/meter, stok katalog, dan kontak CS resmi. Tanpa basa-basi berlebih, tanpa simbol bintang (*), dan tanpa emoji."
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
            ragDocs: data.ragDocs || [],
          },
        ]);
      } else {
        setSimHistory((prev) => [
          ...prev,
          { role: 'ai', text: `⚠️ Error: ${data.error || 'Gagal mendapatkan balasan AI.'}`, time: 'Sekarang' },
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

  const fetchFaqs = async () => {
    try {
      setFaqLoading(true);
      const res = await fetch('/api/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Gagal memuat FAQs:', e.message);
    } finally {
      setFaqLoading(false);
    }
  };

  const fetchCustomerQuestions = async () => {
    try {
      setLoadingCustomerQuestions(true);
      const res = await fetch('/api/customer-questions');
      if (res.ok) {
        const data = await res.json();
        setCustomerQuestions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Gagal memuat pertanyaan pelanggan:', e.message);
    } finally {
      setLoadingCustomerQuestions(false);
    }
  };

  const fetchCrawledPages = async () => {
    try {
      setLoadingCrawledPages(true);
      const res = await fetch('/api/crawler/pages');
      if (res.ok) {
        const data = await res.json();
        setCrawledPages(data.pages || []);
      }
    } catch (e) {
      console.warn('Gagal memuat crawled pages:', e.message);
    } finally {
      setLoadingCrawledPages(false);
    }
  };

  const handleStartCrawl = async (e) => {
    if (e) e.preventDefault();
    const url = (crawlUrlInput || '').trim();
    if (!url || !url.startsWith('http')) {
      showToastMsg('Masukkan URL website yang valid (wajib diawali http:// atau https://)', 'error');
      return;
    }

    setCrawlingWeb(true);
    try {
      const res = await fetch('/api/crawler/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          maxPages: crawlMaxPages,
          followLinks: crawlFollowLinks
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Berhasil mengekstrak ${data.totalCrawled || 1} halaman web ke dalam RAG!`, 'success');
        setCrawlUrlInput('');
        fetchCrawledPages();
      } else {
        showToastMsg(data.error || 'Gagal melakukan scraping pada website tersebut.', 'error');
      }
    } catch (err) {
      showToastMsg('Terjadi kesalahan jaringan saat crawling website.', 'error');
    } finally {
      setCrawlingWeb(false);
    }
  };

  const handleDeleteCrawledPage = async (pageId) => {
    const ok = await askConfirmation({
      title: 'Hapus Halaman Web?',
      message: 'Apakah Anda yakin ingin menghapus data website ini dari basis pengetahuan RAG AI?',
      type: 'danger'
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/crawler/pages/${pageId}`, { method: 'DELETE' });
      if (res.ok) {
        showToastMsg('Halaman web dihapus dari memori RAG.', 'success');
        fetchCrawledPages();
      } else {
        showToastMsg('Gagal menghapus halaman.', 'error');
      }
    } catch (err) {
      showToastMsg('Kesalahan jaringan saat menghapus.', 'error');
    }
  };

  const handleOpenAddFaq = (prefill = null) => {
    if (prefill) {
      setFaqForm({
        id: '',
        q: prefill.q || prefill.text || '',
        a: prefill.a || '',
        category: prefill.category || 'Karpet Masjid & Musholla',
        source: prefill.source || (prefill.senderName ? `WhatsApp: ${prefill.senderName}` : 'Chat WhatsApp Pelanggan')
      });
      setEditingFaq(null);
    } else {
      setFaqForm({
        id: '',
        q: '',
        a: '',
        category: 'Karpet Masjid & Musholla',
        source: 'Input Admin'
      });
      setEditingFaq(null);
    }
    setShowFaqModal(true);
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      id: faq.id || '',
      q: faq.q || '',
      a: faq.a || '',
      category: faq.category || 'Karpet Masjid & Musholla',
      source: faq.source || 'Input Admin'
    });
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!faqForm.q.trim() || !faqForm.a.trim()) {
      showToastMsg('Pertanyaan dan jawaban wajib diisi!', 'error');
      return;
    }
    setFaqSaving(true);
    try {
      let res;
      if (editingFaq) {
        res = await fetch(`/api/faqs/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(faqForm)
        });
      } else {
        res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(faqForm)
        });
      }
      const data = await res.json();
      if (data.success) {
        showToastMsg(editingFaq ? 'Tanya-Jawab berhasil diperbarui!' : 'Tanya-Jawab berhasil dipelajari AI!', 'success');
        setShowFaqModal(false);
        setEditingFaq(null);
        if (data.faqs) setFaqs(data.faqs);
        fetchCustomerQuestions();
      } else {
        showToastMsg(data.error || 'Gagal menyimpan Tanya-Jawab', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setFaqSaving(false);
    }
  };

  const handleDeleteFaq = async (id) => {
    const ok = await askConfirmation({
      title: 'Hapus Tanya-Jawab AI?',
      message: 'Apakah Anda yakin ingin menghapus Tanya-Jawab ini dari Knowledge Base memori AI?',
      confirmText: 'Hapus Tanya-Jawab',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/faqs/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Tanya-Jawab berhasil dihapus dari memori AI.', 'success');
        if (data.faqs) setFaqs(data.faqs);
        fetchCustomerQuestions();
      } else {
        showToastMsg(data.error || 'Gagal menghapus', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    }
  };

  const handleSyncFaqsToAi = async () => {
    setSyncingFaqsToAi(true);
    try {
      await fetchFaqs();
      showToastMsg('Data Tanya-Jawab 100% tersinkron ke Groq & Gemini!', 'success');
    } catch (err) {
      showToastMsg('Gagal sinkron: ' + err.message, 'error');
    } finally {
      setSyncingFaqsToAi(false);
    }
  };

  const sendDirectWaMessage = (phone, text) => {
    let targetPhone = phone || ownerSettings?.phone || businessSettings?.phone || '6281298765432';
    let clean = String(targetPhone).replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const message = encodeURIComponent(text || '');
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
  };


  // Dynamic Carpet Categories (Without Icons & 100% Flexible)
  const carpetCategoriesList = React.useMemo(() => {
    const configuredCategories = (config?.carpet_categories && config.carpet_categories.length > 0)
      ? config.carpet_categories
      : [
          { id: "kat-masjid", slug: "karpet-masjid", name: "Karpet Masjid & Musholla", description: "Karpet shaf impor Turki Grade A+, tebal 14-16mm, motif mihrab rapi, empuk & nyaman untuk ibadah berjamaah." },
          { id: "kat-persia", slug: "karpet-persia", name: "Karpet Klasik & Permadani Persia", description: "Koleksi permadani rajutan tangan autentik Persia & oriental klasik bermutu seni tinggi, benang sutra & wol." },
          { id: "kat-minimalis", slug: "karpet-minimalis", name: "Karpet Ruang Tamu Minimalis Modern", description: "Karpet kontemporer konsep Skandinavia & modern aesthetic, anti-slip backing untuk ruang tamu & keluarga." },
          { id: "kat-shaggy", slug: "karpet-shaggy", name: "Karpet Bulu & Shaggy Mewah", description: "Karpet bulu halus ekstra empuk dengan busa memory foam untuk kamar tidur dan ruang santai keluarga." },
          { id: "kat-kantor", slug: "karpet-kantor", name: "Karpet Tile & Kantor Komersial", description: "Karpet modular tile 50x50cm heavy duty, tahan api & gesekan roda kursi untuk kantor, hotel, dan ballroom." }
        ];

    const extraCategories = (config?.catalog || [])
      .map((p) => (p.category || '').trim())
      .filter((catName) => catName && !configuredCategories.some((c) => c.name.toLowerCase() === catName.toLowerCase()))
      .filter((val, idx, arr) => arr.indexOf(val) === idx)
      .map((catName, idx) => ({
        id: `extra-cat-${idx}`,
        slug: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: catName,
        description: `Koleksi karpet pilihan untuk ${catName}.`
      }));

    return [...configuredCategories, ...extraCategories];
  }, [config?.carpet_categories, config?.catalog]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    const defaultCat = selectedCatalogCategory !== 'Semua' ? selectedCatalogCategory : (carpetCategoriesList[0]?.name || 'Karpet Masjid & Musholla');
    setProductForm({
      category: defaultCat,
      title: '',
      code: '',
      price: '',
      subtitle: '',
      footer: '',
      url: '',
      image: 'catalog/karpet-masjid-turki.jpg',
      imageBase64: '',
    });
    setImagePreview(null);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    const cleanImg = (product.image || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '');
    setProductForm({
      category: product.category || (carpetCategoriesList[0]?.name || 'Karpet Masjid & Musholla'),
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

  const processImageFile = (file) => {
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

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
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
    const ok = await askConfirmation({
      title: `Hapus Produk "${productTitle}"?`,
      message: 'Produk ini akan dihapus permanen dari katalog dan bot AI tidak akan merekomendasikannya lagi.',
      confirmText: 'Hapus Produk',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
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

  const handleOpenAddCategory = () => {
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToastMsg('Nama kategori wajib diisi!', 'error');
      return;
    }

    setSavingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || `Koleksi karpet pilihan ${categoryForm.name.trim()} Sultan Carpet Gallery.`
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Kategori "${categoryForm.name.trim()}" berhasil ditambahkan!`, 'success');
        setShowCategoryModal(false);
        if (data.categories) {
          setConfig((prev) => prev ? { ...prev, carpet_categories: data.categories } : prev);
        }
        if (showProductModal) {
          setProductForm((prev) => ({ ...prev, category: categoryForm.name.trim() }));
        }
      } else {
        showToastMsg(data.error || 'Gagal menyimpan kategori', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    const ok = await askConfirmation({
      title: `Hapus Kategori "${catName}"?`,
      message: 'Kategori ini akan dihapus dari pilihan katalog. Produk yang menggunakan kategori ini tidak akan terhapus.',
      confirmText: 'Hapus Kategori',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Kategori "${catName}" berhasil dihapus`, 'success');
        if (data.categories) {
          setConfig((prev) => prev ? { ...prev, carpet_categories: data.categories } : prev);
        }
        if (selectedCatalogCategory === catName) {
          setSelectedCatalogCategory('Semua');
        }
      } else {
        showToastMsg(data.error || 'Gagal menghapus kategori', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    }
  };

  const handleOpenSendProductModal = (product) => {
    if (!product) return;
    setSelectedProductToSend(product);

    const storeName = businessSettings?.name || ownerSettings?.business_name || 'Sultan Carpet';
    const lines = [
      `Halo! Berikut informasi detail produk karpet dari *${storeName}*:`,
      '',
      `🕌 *${product.title || 'Produk Karpet'}*`,
      product.price ? `💰 *Harga:* ${product.price}` : '',
      product.code ? `📌 *Kode SKU:* ${product.code}` : '',
      product.category ? `✨ *Kategori:* ${product.category}` : '',
      product.subtitle ? `📝 *Deskripsi:* ${product.subtitle}` : '',
      product.footer ? `🎨 *Keunggulan / Motif:* ${product.footer}` : '',
      product.url ? `🔗 *Link Katalog:* ${product.url}` : '',
      '',
      `Bila Anda berminat atau ingin konsultasi ukuran, survei motif, dan jadwal pemasangan, silakan balas pesan ini ya! Terima kasih. 🙏`
    ].filter((line) => line !== null && line !== undefined && line !== '').join('\n');

    setSendProductMessageText(lines);
    setIncludeProductImage(Boolean(product.image));
    setSendProductChatSearch('');
    setManualPhoneInput('');

    // Preselect current active chat conversation if any, else first in history
    const activeConv = conversations.find(
      (c) => (c.jid && c.jid === selectedChatJid) || c.phone === selectedChatJid
    );
    setSelectedChatRecipient(activeConv || (conversations.length > 0 ? conversations[0] : null));

    setShowSendProductModal(true);
  };

  const handleSendProductToChat = async () => {
    let recipientJid = selectedChatRecipient?.jid;
    let recipientPhone = selectedChatRecipient?.phone;

    // Handle manual phone number if typed
    if (!recipientJid && !recipientPhone && manualPhoneInput.trim()) {
      let clean = manualPhoneInput.replace(/\D/g, '');
      if (clean.startsWith('0')) clean = '62' + clean.slice(1);
      recipientPhone = clean;
      recipientJid = `${clean}@s.whatsapp.net`;
    }

    if (!recipientJid && !recipientPhone) {
      showToastMsg('Silakan pilih salah satu riwayat chat pelanggan atau masukkan nomor telepon tujuan.', 'warning');
      return;
    }

    if (!sendProductMessageText.trim()) {
      showToastMsg('Pesan tidak boleh kosong.', 'warning');
      return;
    }

    const rawName = selectedChatRecipient?.senderName && !/^\+?\d{10,}$/.test(selectedChatRecipient.senderName.trim())
      ? selectedChatRecipient.senderName.trim()
      : null;
    const targetRecipientName = rawName || selectedChatRecipient?.formattedPhone || recipientPhone || 'Pelanggan';

    // If bot is offline, fallback gracefully to direct wa.me link
    if (!isConnected) {
      showToastMsg('WhatsApp bot offline. Membuka pengiriman langsung melalui WhatsApp Web...', 'info');
      sendDirectWaMessage(recipientPhone, sendProductMessageText);
      setShowSendProductModal(false);
      return;
    }

    setIsSendingProductMessage(true);
    const clientMsgId = `prod_${Date.now()}`;
    const targetKey = recipientJid || recipientPhone;

    // Optimistically update conversation in local state
    const optimisticMsg = {
      id: clientMsgId,
      text: sendProductMessageText,
      sender: 'Admin (Katalog)',
      senderName: 'Admin (Katalog Produk)',
      direction: 'out',
      timestamp: new Date().toISOString(),
      status: 'pending',
      mediaType: (includeProductImage && selectedProductToSend?.image) ? 'image' : 'text'
    };

    setConversations((prev) =>
      prev.map((c) => {
        if ((c.jid && c.jid === recipientJid) || (c.phone && c.phone === recipientPhone) || (c.jid || c.phone) === targetKey) {
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
          jid: recipientJid,
          phone: recipientPhone,
          message: sendProductMessageText,
          senderName: 'Admin (Katalog Produk)',
          clientMessageId: clientMsgId,
          image: (includeProductImage && selectedProductToSend?.image) ? selectedProductToSend.image : null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToastMsg('Gagal mengirim ke WhatsApp: ' + (data.error || 'Terjadi kesalahan'), 'error');
      } else {
        showToastMsg(`Pesan produk berhasil dikirim ke ${targetRecipientName}!`, 'success');
        setShowSendProductModal(false);
      }
    } catch (err) {
      showToastMsg('Error saat mengirim pesan: ' + err.message, 'error');
    } finally {
      setIsSendingProductMessage(false);
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
    const ok = await askConfirmation({
      title: `Hapus Obrolan "${targetName}"?`,
      message: 'Seluruh riwayat pesan obrolan dengan pelanggan ini akan dihapus secara permanen dari server.',
      confirmText: 'Hapus Obrolan',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;

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
    const ok = await askConfirmation({
      title: 'Kosongkan Seluruh Riwayat Obrolan?',
      message: 'Semua riwayat obrolan pelanggan akan dihapus secara permanen dari server. Tindakan ini tidak dapat dibatalkan!',
      confirmText: 'Kosongkan Semua Chat',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
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

  // HANDS-OFF MANAGEMENT HANDLERS
  const handleSaveHandoffConfig = async (overrideConfig = null) => {
    try {
      setSavingHandoffConfig(true);
      const payload = overrideConfig || handoffConfig;
      const res = await fetch('/api/handoffs/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Konfigurasi Hands-Off berhasil disimpan!', 'success');
        if (data.human_handoff) {
          setHandoffConfig((prev) => ({ ...prev, ...data.human_handoff }));
          setConfig((prev) =>
            prev
              ? {
                  ...prev,
                  protections: {
                    ...(prev.protections || {}),
                    human_handoff: data.human_handoff,
                  },
                }
              : prev
          );
        }
      } else {
        throw new Error(data.error || 'Gagal menyimpan konfigurasi');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingHandoffConfig(false);
    }
  };

  const handleAddHandoffKeyword = () => {
    const kw = newHandoffKeyword.trim().toLowerCase();
    if (!kw) return;
    if ((handoffConfig.keywords || []).includes(kw)) {
      showToastMsg('Kata kunci sudah terdaftar', 'info');
      return;
    }
    const updated = {
      ...handoffConfig,
      keywords: [...(handoffConfig.keywords || []), kw],
    };
    setHandoffConfig(updated);
    setNewHandoffKeyword('');
  };

  const handleRemoveHandoffKeyword = (kw) => {
    const updated = {
      ...handoffConfig,
      keywords: (handoffConfig.keywords || []).filter((k) => k !== kw),
    };
    setHandoffConfig(updated);
  };

  const handleAddReleaseKeyword = () => {
    const kw = newReleaseKeyword.trim().toLowerCase();
    if (!kw) return;
    if ((handoffConfig.release_keywords || []).includes(kw)) {
      showToastMsg('Kata kunci rilis sudah terdaftar', 'info');
      return;
    }
    const updated = {
      ...handoffConfig,
      release_keywords: [...(handoffConfig.release_keywords || []), kw],
    };
    setHandoffConfig(updated);
    setNewReleaseKeyword('');
  };

  const handleRemoveReleaseKeyword = (kw) => {
    const updated = {
      ...handoffConfig,
      release_keywords: (handoffConfig.release_keywords || []).filter((k) => k !== kw),
    };
    setHandoffConfig(updated);
  };

  const handleLoadDefaultHandoffPresets = (type) => {
    if (type === 'trigger') {
      const presets = ['cs', 'admin', 'operator', 'manusia', 'orang', 'live agent', 'bantuan manusia', 'staf', 'bicara orang', 'hubungi admin'];
      const merged = Array.from(new Set([...(handoffConfig.keywords || []), ...presets]));
      setHandoffConfig((prev) => ({ ...prev, keywords: merged }));
      showToastMsg('Rekomendasi kata kunci CS berhasil ditambahkan', 'success');
    } else if (type === 'release') {
      const presets = ['!bot', 'aktifkan bot', 'kembali ke bot', 'bot', 'menu', 'selesai', 'nyalakan bot', 'tanya bot'];
      const merged = Array.from(new Set([...(handoffConfig.release_keywords || []), ...presets]));
      setHandoffConfig((prev) => ({ ...prev, release_keywords: merged }));
      showToastMsg('Rekomendasi kata kunci rilis bot berhasil ditambahkan', 'success');
    }
  };

  const handleManualHandoffTakeover = async (e) => {
    if (e) e.preventDefault();
    const phone = manualHandoffPhone.trim().replace(/\D/g, '');
    if (!phone) {
      showToastMsg('Silakan masukkan nomor WhatsApp yang valid', 'error');
      return;
    }
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const targetJid = `${cleanPhone}@s.whatsapp.net`;

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(targetJid)}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true, reason: manualHandoffReason || 'Takeover manual oleh admin' }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Mode CS Manusia aktif untuk +${cleanPhone}. Bot AI dinonaktifkan.`, 'success');
        setConversations((prev) => {
          const exists = prev.some((c) => c.jid === targetJid || c.phone === cleanPhone);
          if (exists) {
            return prev.map((c) =>
              c.jid === targetJid || c.phone === cleanPhone
                ? { ...c, isHumanHandoff: true, aiEnabled: false }
                : c
            );
          } else {
            return [
              {
                jid: targetJid,
                phone: cleanPhone,
                formattedPhone: `+${cleanPhone}`,
                senderName: `+${cleanPhone}`,
                lastMessage: '(Diambil alih manual oleh CS)',
                lastTimestamp: Date.now(),
                isHumanHandoff: true,
                aiEnabled: false,
                unreadCount: 0,
              },
              ...prev,
            ];
          }
        });
        setManualHandoffPhone('');
      } else {
        throw new Error(data.error || 'Gagal mengambil alih chat');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    }
  };

  const handleTestHandoffMessage = () => {
    const q = testHandoffQuery.trim().toLowerCase();
    if (!q) {
      setTestHandoffResult(null);
      return;
    }

    const releaseKws = handoffConfig.release_keywords || [];
    const triggerKws = handoffConfig.keywords || [];

    const matchedRelease = releaseKws.find((kw) => q === kw || q.startsWith(`${kw} `) || q.includes(kw));
    const matchedTrigger = triggerKws.find((kw) => q === kw || q.startsWith(`${kw} `) || q.includes(kw));

    if (matchedRelease) {
      setTestHandoffResult({
        type: 'RELEASE',
        matched: matchedRelease,
        title: 'Kembali ke Bot AI (RELEASE)',
        message: `Pesan customer cocok dengan kata kunci rilis: "${matchedRelease}". Bot AI akan otomatis diaktifkan kembali.`,
      });
    } else if (matchedTrigger) {
      setTestHandoffResult({
        type: 'TRIGGER',
        matched: matchedTrigger,
        title: 'Hands-Off Dipicu (CS Manusia)',
        message: `Pesan customer cocok dengan kata kunci pemicu: "${matchedTrigger}". Bot AI otomatis berhenti membalas dan percakapan dialihkan ke CS manusia.`,
      });
    } else {
      setTestHandoffResult({
        type: 'AI_REPLY',
        matched: null,
        title: 'Dijawab Normal oleh Bot AI',
        message: 'Tidak ada kata kunci hands-off yang terdeteksi. Pesan akan dijawab oleh Bot AI Sultan Carpet menggunakan AI Knowledge Base.',
      });
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
    const ok = await askConfirmation({
      title: `Hapus Tiket #${ticketId}?`,
      message: 'Data tiket komplain / penanganan CS ini akan dihapus secara permanen.',
      confirmText: 'Hapus Tiket',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;
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
  const activeSavedAiProvider = config?.ai?.provider || aiProvider || 'gemini';
  const isAiActive = config?.ai ? Boolean(config.ai.enabled) : geminiEnabled;
  const activeSavedModel = activeSavedAiProvider === 'groq'
    ? (config?.ai?.groq_model || groqModel || 'openai/gpt-oss-120b')
    : (config?.ai?.model || geminiModel || 'gemini-3.5-flash-lite');

  const getModelDisplayName = (provider, modelKey) => {
    if (provider === 'gemini') {
      if (modelKey?.includes('3.5-flash-lite')) return 'Gemini 3.5 Flash Lite';
      if (modelKey?.includes('3.1-flash-lite')) return 'Gemini 3.1 Flash Lite';
      if (modelKey?.includes('3.5-flash')) return 'Gemini 3.5 Flash';
      if (modelKey?.includes('flash-latest')) return 'Gemini Flash Latest';
      return modelKey || 'Gemini 3.5 Flash';
    } else {
      if (modelKey?.includes('gpt-oss-120b')) return 'GPT-OSS 120B';
      if (modelKey?.includes('qwen3.8-27b')) return 'Qwen 3.8 27B';
      if (modelKey?.includes('gpt-oss-20b')) return 'GPT-OSS 20B';
      if (modelKey?.includes('allam-2-7b')) return 'Allam 2 7B';
      return modelKey || 'Groq LPU Fast';
    }
  };

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

      {/* Custom In-App Confirmation Modal Pop-up (Replaces native browser localhost confirm/alerts) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0f172a] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/90 flex flex-col gap-5 transform animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl flex-shrink-0 border ${
                confirmModal.type === 'danger'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : confirmModal.type === 'info'
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}>
                {confirmModal.type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.type === 'info' ? (
                  <RotateCcw className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={confirmModal.onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition"
              >
                {confirmModal.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-lg ${
                  confirmModal.type === 'danger'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                    : confirmModal.type === 'info'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-sky-600/30'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30'
                }`}
              >
                {confirmModal.confirmText || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-white font-bold text-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-base text-white">Dashboard Chatbot</h1>
                    <p className="text-[11px] text-slate-400">WhatsApp AI & Customer Service</p>
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
                    <span className="text-sm">💬</span>
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
                    <span className="text-sm">✨</span>
                    <span>AI Studio</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    activeSavedAiProvider === 'groq' ? 'bg-amber-500/30 text-amber-200' : 'bg-purple-500/30 text-purple-200'
                  }`}>
                    {activeSavedAiProvider === 'groq' ? '⚡ Groq' : '🔮 Gemini'}
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
                    <span className="text-sm font-mono">▦</span>
                    <span>Koneksi WhatsApp</span>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                </button>

                <div className="pt-2 pb-1 px-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">INFORMASI TOKO</p>
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
                  <span className="text-sm">♙</span>
                  <span>Profil & Pemilik Toko</span>
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
                    <span className="text-sm">🛍️</span>
                    <span>Katalog Produk</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {config?.catalog?.length || 5}
                  </span>
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
                  <span className="text-sm">🕐</span>
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
                  <span className="text-sm">📍</span>
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
                  <span className="text-sm">🛡️</span>
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
                  <span className="text-sm">🏷️</span>
                  <span>Promo & Diskon</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'tickets' || activeTab === 'complaint'
                      ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">⚙️</span>
                    <span>Pusat Komplain & CS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tickets.filter(t => (t.priority || '').toLowerCase().includes('urgent') || (t.status || '').toLowerCase() === 'open').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {tickets.length}
                    </span>
                  </div>
                </button>

                <div className="pt-2 pb-1 px-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">AI KNOWLEDGE</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('qna');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'qna'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">🧠</span>
                    <span>Knowledge Base</span>
                  </div>
                  {faqs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      {faqs.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('handoff');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'handoff'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">🎧</span>
                    <span>Hands-Off CS & AI</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {activeHandoffCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      activeHandoffCount > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {activeHandoffCount}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'settings'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">🛡️</span>
                    <span>Anti-Spam & Delay</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Proteksi
                  </span>
                </button>
              </nav>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              {/* Active AI Engine Indicator Card (Mobile) */}
              <div
                onClick={() => {
                  setActiveTab('gemini');
                  setMobileDrawerOpen(false);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer group select-none ${
                  !isAiActive
                    ? 'bg-slate-900/60 border-slate-800'
                    : activeSavedAiProvider === 'gemini'
                      ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-900/90 border-purple-500/40 shadow-sm shadow-purple-900/20'
                      : 'bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-slate-900/90 border-amber-500/40 shadow-sm shadow-amber-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      {isAiActive && (
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            activeSavedAiProvider === 'gemini' ? 'bg-purple-400' : 'bg-amber-400'
                          }`}
                        />
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          !isAiActive
                            ? 'bg-slate-500'
                            : activeSavedAiProvider === 'gemini'
                              ? 'bg-purple-400'
                              : 'bg-amber-400'
                        }`}
                      />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Mesin AI Chatbot
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${
                      !isAiActive
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : activeSavedAiProvider === 'gemini'
                          ? 'bg-purple-500/25 text-purple-200 border-purple-500/40'
                          : 'bg-amber-500/25 text-amber-200 border-amber-500/40'
                    }`}
                  >
                    {!isAiActive ? 'OFF' : activeSavedAiProvider === 'gemini' ? '🔮 GEMINI' : '⚡ GROQ LPU'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      !isAiActive
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : activeSavedAiProvider === 'gemini'
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {!isAiActive ? (
                      <Bot className="w-3.5 h-3.5" />
                    ) : activeSavedAiProvider === 'gemini' ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {!isAiActive
                        ? 'AI Dinonaktifkan'
                        : activeSavedAiProvider === 'gemini'
                          ? 'Google Gemini AI'
                          : 'Groq LPU Engine'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {!isAiActive
                        ? 'Mode Manual'
                        : getModelDisplayName(activeSavedAiProvider, activeSavedModel)}
                    </p>
                  </div>
                </div>
              </div>
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
          <div className="flex items-center gap-3.5 px-3 py-3 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 shrink-0 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-white font-bold text-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-wide text-white">Dashboard Chatbot</h1>
              </div>
              <p className="text-xs text-slate-400">WhatsApp AI & Customer Service</p>
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
                <span className="text-sm">💬</span>
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
                <span className="text-sm">✨</span>
                <span>AI Studio</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                activeSavedAiProvider === 'groq' ? 'bg-amber-500/30 text-amber-200' : 'bg-purple-500/30 text-purple-200'
              }`}>
                {activeSavedAiProvider === 'groq' ? '⚡ Groq' : '🔮 Gemini'}
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
                <span className="text-sm font-mono">▦</span>
                <span>Koneksi WhatsApp</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </button>

            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">INFORMASI TOKO</p>
            </div>

            <button
              onClick={() => setActiveTab('store_profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'store_profile'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="text-sm">♙</span>
              <span>Profil & Pemilik Toko</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🛍️</span>
                <span>Katalog Produk</span>
              </div>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {config?.catalog?.length || 5}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="text-sm">🕐</span>
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
              <span className="text-sm">📍</span>
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
              <span className="text-sm">🛡️</span>
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
              <span className="text-sm">🏷️</span>
              <span>Promo & Diskon</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'tickets' || activeTab === 'complaint'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">⚙️</span>
                <span>Pusat Komplain & CS</span>
              </div>
              <div className="flex items-center gap-1.5">
                {tickets.filter(t => (t.priority || '').toLowerCase().includes('urgent') || (t.status || '').toLowerCase() === 'open').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  {tickets.length}
                </span>
              </div>
            </button>

            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">AI KNOWLEDGE</p>
            </div>

            <button
              onClick={() => setActiveTab('qna')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'qna'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🧠</span>
                <span>Knowledge Base</span>
              </div>
              {faqs.length > 0 && (
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {faqs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('handoff')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'handoff'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🎧</span>
                <span>Hands-Off CS & AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                {activeHandoffCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                )}
                <span className={`text-[11px] px-2 py-0.2 rounded-full font-semibold ${
                  activeHandoffCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {activeHandoffCount}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🛡️</span>
                <span>Anti-Spam & Delay</span>
              </div>
              <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Proteksi
              </span>
            </button>
          </nav>
        </div>

        {/* Status Pill in Footer */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
          {/* Active AI Engine Indicator Card (Desktop) */}
          <div
            onClick={() => setActiveTab('gemini')}
            title="Klik untuk membuka AI Studio & ganti mesin AI"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer group select-none ${
              !isAiActive
                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                : activeSavedAiProvider === 'gemini'
                  ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-900/90 border-purple-500/40 hover:border-purple-400/80 shadow-sm shadow-purple-900/20'
                  : 'bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-slate-900/90 border-amber-500/40 hover:border-amber-400/80 shadow-sm shadow-amber-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isAiActive && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        activeSavedAiProvider === 'gemini' ? 'bg-purple-400' : 'bg-amber-400'
                      }`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      !isAiActive
                        ? 'bg-slate-500'
                        : activeSavedAiProvider === 'gemini'
                          ? 'bg-purple-400'
                          : 'bg-amber-400'
                    }`}
                  />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Mesin AI Chatbot
                </span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${
                  !isAiActive
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : activeSavedAiProvider === 'gemini'
                      ? 'bg-purple-500/25 text-purple-200 border-purple-500/40'
                      : 'bg-amber-500/25 text-amber-200 border-amber-500/40'
                }`}
              >
                {!isAiActive ? 'OFF' : activeSavedAiProvider === 'gemini' ? '🔮 GEMINI' : '⚡ GROQ LPU'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                  !isAiActive
                    ? 'bg-slate-800 border-slate-700 text-slate-400'
                    : activeSavedAiProvider === 'gemini'
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                {!isAiActive ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : activeSavedAiProvider === 'gemini' ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition">
                  {!isAiActive
                    ? 'AI Dinonaktifkan'
                    : activeSavedAiProvider === 'gemini'
                      ? 'Google Gemini AI'
                      : 'Groq LPU Engine'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {!isAiActive
                    ? 'Mode Manual'
                    : getModelDisplayName(activeSavedAiProvider, activeSavedModel)}
                </p>
              </div>
            </div>
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
              <Bot className="w-4 h-4 text-emerald-400" />
              <h1 className="font-bold text-sm text-white">Dashboard Chatbot</h1>
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
              {(activeTab === 'tickets' || activeTab === 'complaint') && 'Pusat Komplain & Customer Service (CS)'}
              {activeTab === 'catalog' && 'Katalog Karpet Sultan & Koleksi Lengkap'}
              {activeTab === 'store_profile' && 'Profil Toko & Pemilik Karpet'}
              {activeTab === 'schedule' && 'Jadwal & Jam Operasional Toko'}
              {activeTab === 'location' && 'Alamat & Lokasi Showroom'}
              {activeTab === 'warranty' && 'Garansi & Kebijakan Klaim Karpet'}
              {activeTab === 'promo' && 'Promo & Penawaran Diskon Aktif'}
              {activeTab === 'qna' && 'Basis Tanya Jawab AI (Knowledge Base)'}
              {activeTab === 'handoff' && 'Hands-Off Customer Service & AI Takeover'}
              {activeTab === 'settings' && 'Pengaturan Anti-Spam, Cooldown & Delay Chat'}
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
        <div className={`flex-1 min-h-0 flex flex-col ${['chats', 'gemini'].includes(activeTab) ? 'p-2 sm:p-4 lg:p-5 h-full overflow-hidden' : 'overflow-y-auto p-4 sm:p-6'}`}>
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
                          <div className="relative shrink-0">
                            <div
                              className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-xs shadow hover:scale-105 transition`}
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
                              {conv.formattedPhone && !conv.formattedPhone.includes('LID') && conv.formattedPhone !== '-'
                                ? conv.formattedPhone
                                : (conv.phone && !conv.phone.includes('@lid') ? `+${conv.phone}` : '-')}
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

                          {/* Actions: Delete Chat */}
                          <div className="flex items-center gap-0.5 shrink-0">
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
                const activeSubtitle = (activeFormattedPhone && !activeFormattedPhone.includes('LID') && activeFormattedPhone !== '-')
                  ? activeFormattedPhone
                  : (activeConversation.phone && !activeConversation.phone.includes('@lid') ? `+${activeConversation.phone}` : '-');

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
          {/* TAB 2: AI STUDIO (GROQ & GEMINI ENGINE + SIMULATOR) */}
          {activeTab === 'gemini' && (
            <div className="flex flex-col h-full min-h-0">
              {/* MOBILE SEGMENTED VIEW SWITCHER (< lg) */}
              <div className="lg:hidden flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0 mb-2.5 gap-1 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setAiStudioMobileView('simulator')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    aiStudioMobileView === 'simulator'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulator Chat</span>
                  {simHistory.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/35 text-purple-200 font-mono font-semibold">
                      {simHistory.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAiStudioMobileView('config')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    aiStudioMobileView === 'config'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-300" />
                  <span>Pengaturan AI</span>
                  <span className={`w-2 h-2 rounded-full ${geminiEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                </button>
              </div>

              {/* MAIN CONTENT AREA: Grid on Desktop, Single Active Panel on Mobile */}
              <div className="flex-1 min-h-0 lg:grid lg:grid-cols-12 gap-5 h-full">
                {/* Left Column: AI Configuration Control Center */}
                <div
                  className={`lg:col-span-5 xl:col-span-5 flex-col h-full min-h-0 rounded-3xl border border-slate-800 bg-[#0f172a]/85 backdrop-blur-xl shadow-2xl overflow-hidden ${
                    aiStudioMobileView === 'config' ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {/* Panel Header */}
                  <div className="p-3.5 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-xs sm:text-base">Konfigurasi AI Layanan</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400">Pilih mesin & persona bot</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800">
                      <span className={`text-[11px] sm:text-xs font-semibold ${geminiEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {geminiEnabled ? 'AI Aktif' : 'Nonaktif'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={geminiEnabled}
                          onChange={(e) => setGeminiEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 sm:w-9 sm:h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 sm:after:h-4 sm:after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Panel Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 min-h-0 custom-scrollbar">
                    {/* Card 1: Engine & Model Selection */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 sm:space-y-3.5 shadow-sm">
                      {/* Provider Toggle Tabs */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Penyedia AI Utama (Primary Engine)</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Pilih Mesin</span>
                        </div>
                        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAiProvider('groq')}
                            className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                              aiProvider === 'groq'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span>Groq LPU</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/25 text-white/95 font-mono hidden xs:inline">~300ms</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiProvider('gemini')}
                            className={`py-2 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                              aiProvider === 'gemini'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Gemini AI</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/25 text-white/95 font-mono hidden xs:inline">Flash</span>
                          </button>
                        </div>
                      </div>

                      {/* Model Dropdown */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300">
                            {aiProvider === 'groq' ? 'Model Groq LPU' : 'Model Google Gemini'}
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {aiProvider === 'groq' ? '⚡ LPU Ultra-Speed' : '🔮 Google DeepMind'}
                          </span>
                        </div>
                        {aiProvider === 'groq' ? (
                          <select
                            value={groqModel}
                            onChange={(e) => setGroqModel(e.target.value)}
                            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                          >
                            <option value="openai/gpt-oss-120b">OpenAI GPT-OSS 120B (Sangat Cerdas ~750ms - Rekomendasi)</option>
                            <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Ultra Cepat ~500ms)</option>
                            <option value="openai/gpt-oss-20b">OpenAI GPT-OSS 20B (Ringan & Cepat ~580ms)</option>
                            <option value="allam-2-7b">Allam 2 7B</option>
                          </select>
                        ) : (
                          <select
                            value={geminiModel}
                            onChange={(e) => setGeminiModel(e.target.value)}
                            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                          >
                            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Super Cepat ~1.8s - Rekomendasi)</option>
                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Sangat Ringan & Cepat)</option>
                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Stabil)</option>
                            <option value="gemini-flash-latest">Gemini Flash Latest</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Card 2: System Instruction / Persona Editor */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                          <span>Instruksi Sistem & Persona Karakter</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {systemPrompt.length} karakter
                        </span>
                      </div>

                      {/* Textarea */}
                      <textarea
                        rows={8}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Tuliskan instruksi sistem, persona, dan aturan khusus balasan AI..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-sans resize-y min-h-[160px] sm:min-h-[200px]"
                      />

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        💡 Instruksi ini memandu gaya bicara, etika, dan pengetahuan katalog produk yang dipakai AI saat membalas pesan WhatsApp pelanggan.
                      </p>
                    </div>
                  </div>

                  {/* Panel Footer: Action Buttons */}
                  <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSaveAiSettings}
                      className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Pengaturan AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiStudioMobileView('simulator')}
                      className="lg:hidden py-3 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                      title="Uji langsung balasan AI di simulator chat"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Uji Chat →</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Live AI Simulator / Playground */}
                <div
                  className={`lg:col-span-7 xl:col-span-7 flex-col h-full min-h-0 rounded-3xl border border-slate-800/80 bg-[#0f172a]/85 backdrop-blur-xl shadow-2xl overflow-hidden ${
                    aiStudioMobileView === 'simulator' ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {/* Simulator Header */}
                  <div className="p-3.5 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          aiProvider === 'groq' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-xs sm:text-base text-white truncate">
                            Simulator Percakapan AI
                          </h3>
                          <button
                            type="button"
                            onClick={() => setAiStudioMobileView('config')}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition flex items-center gap-1 cursor-pointer ${
                              aiProvider === 'groq'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                            }`}
                            title="Klik untuk ubah model atau persona AI"
                          >
                            <span>{aiProvider === 'groq' ? '⚡ Groq LPU' : '🔮 Google Gemini'}</span>
                            <span className="lg:hidden text-[9px] opacity-75 underline">(Ganti)</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                          Uji respons langsung dengan pengetahuan katalog karpet & showroom Sultan Carpet Gallery
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimHistory([])}
                      className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer border border-transparent hover:border-slate-800 shrink-0"
                      title="Bersihkan riwayat obrolan simulasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Chat</span>
                    </button>
                  </div>

                  {/* Simulator Message Stream */}
                  <div
                    ref={simScrollRef}
                    className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 min-h-0 custom-scrollbar"
                  >
                    {simHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-3xl flex items-center justify-center mb-3 shadow-xl ${
                            aiProvider === 'groq'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/10'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-purple-500/10'
                          }`}
                        >
                          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">
                          Simulator Percakapan AI Sultan Carpet
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mb-4 sm:mb-6 leading-relaxed">
                          Ketik pertanyaan atau klik salah satu topik pengujian di bawah untuk menguji kecerdasan balasan AI secara instan.
                        </p>

                        <div className="w-full max-w-lg space-y-2">
                          <p className="text-xs font-semibold text-slate-300 text-left px-1 flex items-center gap-1.5">
                            <span>💡 Klik Cepat untuk Menguji Skenario:</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                className="text-left text-xs p-2.5 sm:p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group shadow-sm cursor-pointer"
                              >
                                <span className="line-clamp-2 pr-2">{promptText}</span>
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
                            <div className="relative group max-w-[92%] sm:max-w-[85%]">
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
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
                                  className="absolute right-2 -top-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-sm cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {item.role === 'ai' && item.ragDocs && item.ragDocs.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                                  <Brain className="w-3 h-3 text-purple-400" />
                                  <span>RAG:</span>
                                </span>
                                {item.ragDocs.map((doc, docIdx) => (
                                  <span
                                    key={docIdx}
                                    className="text-[9px] px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200"
                                    title={doc.title}
                                  >
                                    {doc.page}
                                  </span>
                                ))}
                              </div>
                            )}
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

                  {/* Quick Prompts Bar (Always Available Above Input) */}
                  <div className="px-2.5 sm:px-4 py-2 border-t border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="hidden xs:inline">Uji Cepat:</span>
                    </span>
                    {[
                      'Apakah bisa survey & pasang di tempat?',
                      'Berapa harga karpet masjid grade A+ per roll?',
                      'Lokasi showroom & jadwal buka?',
                      'Bagaimana ketentuan garansi karpet?'
                    ].map((chipText, chipIdx) => (
                      <button
                        key={chipIdx}
                        type="button"
                        onClick={() => handleSimulateAiWithText(chipText)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 transition shrink-0 cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        {chipText}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={handleSimulateAi}
                    className="p-2.5 sm:p-4 border-t border-slate-800 bg-slate-900/70 shrink-0 space-y-1 sm:space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={simPrompt}
                        onChange={(e) => setSimPrompt(e.target.value)}
                        placeholder="Ketik pertanyaan uji AI (misal: 'Apakah ada survey gratis?')..."
                        className="flex-1 rounded-2xl bg-slate-950 border border-slate-700/80 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-inner"
                      />
                      <button
                        type="submit"
                        disabled={simulating || !simPrompt.trim()}
                        className={`p-2.5 sm:p-3 rounded-2xl text-white transition disabled:opacity-50 shrink-0 shadow-lg cursor-pointer ${
                          aiProvider === 'groq'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25'
                        }`}
                        title="Kirim Pertanyaan Simulasi"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-1.5 text-[10px] text-slate-500">
                      <span>Tekan Enter ↵ untuk mengirim</span>
                      <span className="hidden sm:inline">Simulasi langsung menggunakan data katalog resmi & RAG</span>
                    </div>
                  </form>
                </div>
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
                    disabled={restartingConn}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${restartingConn ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{restartingConn ? 'Memproses...' : 'Muat Ulang Koneksi'}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={restartingConn}
                    className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/40 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset Sesi / Scan Ulang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PUSAT KOMPLAIN & CS (CUSTOMER SERVICE) */}
          {(activeTab === 'tickets' || activeTab === 'complaint') && (() => {
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
              { id: 'Pengaduan Produk', label: 'Pengaduan Produk' },
              { id: 'Klaim Garansi', label: 'Klaim Garansi' },
              { id: 'Pembelian Produk', label: 'Pembelian Produk' },
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
                const q = ticketCategoryFilter.toLowerCase();
                if (q.includes('pengaduan') || q.includes('komplain')) {
                  return cat.includes('pengaduan') || cat.includes('komplain') || cat.includes('keluhan') || cat.includes('rusak');
                }
                if (q.includes('garansi') || q.includes('klaim')) {
                  return cat.includes('garansi') || cat.includes('klaim');
                }
                if (q.includes('pembelian') || q.includes('beli') || q.includes('pesan')) {
                  return cat.includes('beli') || cat.includes('pesan') || cat.includes('order');
                }
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
                      <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-white">Pusat Komplain & Layanan Pelanggan (CS)</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-xs">
                          {totalCount} Total Pengaduan & Layanan
                        </span>
                        {urgentCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs animate-pulse">
                            {urgentCount} Butuh Atensi Segera
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Pusat kendali penanganan komplain, keluhan kualitas, klaim garansi presisi, dan respon cepat layanan pelanggan (CS) terintegrasi WhatsApp
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateTicketModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-900/30 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Tiket Komplain / CS</span>
                    </button>
                    <button
                      onClick={fetchTickets}
                      title="Segarkan data tiket & komplain"
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
                      <span className="text-xs text-slate-400 font-medium">Semua Tiket & Komplain</span>
                      <Ticket className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white">{totalCount}</span>
                      <span className="text-[11px] text-slate-500">laporan</span>
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
                      <span className="text-xs text-sky-400 font-medium">Menunggu Respon (Open)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-sky-300">{openCount}</span>
                      <span className="text-[11px] text-sky-400/70">perlu respon CS</span>
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
                      <span className="text-xs text-amber-400 font-medium">Sedang Ditindaklanjuti</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-amber-300">{inProgressCount}</span>
                      <span className="text-[11px] text-amber-400/70">penanganan CS</span>
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
                      <span className="text-xs text-emerald-400 font-medium">Selesai & Tuntas</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-emerald-300">{resolvedCount}</span>
                      <span className="text-[11px] text-emerald-400/70">terselesaikan</span>
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
                      <span className="text-xs text-rose-400 font-medium">Prioritas Mendesak</span>
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
          {activeTab === 'catalog' && (() => {
            const filteredCatalog = (config?.catalog || []).filter((item) => {
              if (selectedCatalogCategory !== 'Semua') {
                const itemCat = (item.category || '').trim().toLowerCase();
                const targetCat = selectedCatalogCategory.trim().toLowerCase();
                if (itemCat !== targetCat) return false;
              }

              if (!catalogSearch.trim()) return true;
              const q = catalogSearch.toLowerCase();
              return (
                item.title.toLowerCase().includes(q) ||
                (item.code && item.code.toLowerCase().includes(q)) ||
                (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
                (item.footer && item.footer.toLowerCase().includes(q)) ||
                (item.category && item.category.toLowerCase().includes(q)) ||
                (item.price && item.price.toLowerCase().includes(q))
              );
            });

            return (
              <div className="space-y-5">

                {/* Header with Title, Badges, and Primary Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl font-bold text-white tracking-tight">Katalog Produk Karpet</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                        {config?.catalog?.length || 0} Total Produk
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold text-xs">
                        {carpetCategoriesList.length} Kategori
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      Kelola katalog karpet, harga, kategori produk, dan pemesanan WhatsApp otomatis Sultan Carpet.
                    </p>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="py-2 px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      title="Tambah Kategori Baru"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Kategori</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAddProduct}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Produk Baru</span>
                    </button>
                  </div>
                </div>

                {/* Control Toolbar: Search & View Options */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Cari nama karpet, kode, warna, harga..."
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                        title="Hapus pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right Toolbar Controls: Toggle Category Cards & Reset Filter */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCategoryCards(!showCategoryCards)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                        showCategoryCards
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title="Tampilkan / Sembunyikan ringkasan kartu kategori"
                    >
                      <span>{showCategoryCards ? 'Sembunyikan Kartu' : 'Detail Kategori'}</span>
                      {showCategoryCards ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {(selectedCatalogCategory !== 'Semua' || catalogSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCatalogCategory('Semua');
                          setCatalogSearch('');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Filter</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills Navigation with Inline Add */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-thin scrollbar-thumb-slate-800">
                  {/* 'Semua Koleksi' Pill */}
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogCategory('Semua')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-2 cursor-pointer ${
                      selectedCatalogCategory === 'Semua'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>Semua Koleksi</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedCatalogCategory === 'Semua' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {config?.catalog?.length || 0}
                    </span>
                  </button>

                  {/* Category Pills */}
                  {carpetCategoriesList.map((cat) => {
                    const isSelected = selectedCatalogCategory === cat.name;
                    const count = (config?.catalog || []).filter(p => {
                      const pCat = (p.category || '').trim().toLowerCase();
                      return pCat === cat.name.trim().toLowerCase();
                    }).length;
                    const isCustomCat = cat.id && !['kat-masjid', 'kat-persia', 'kat-minimalis', 'kat-shaggy', 'kat-kantor'].includes(cat.id);

                    return (
                      <div key={cat.id || cat.name} className="relative group shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCatalogCategory(isSelected ? 'Semua' : cat.name)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          } ${isCustomCat ? 'pr-7' : ''}`}
                        >
                          <span>{cat.name}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {count}
                          </span>
                        </button>

                        {/* Quick Delete icon for custom categories */}
                        {isCustomCat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat.id, cat.name);
                            }}
                            title={`Hapus kategori "${cat.name}"`}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Quick Add Category Pill */}
                  <button
                    type="button"
                    onClick={handleOpenAddCategory}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/40 shrink-0 transition flex items-center gap-1.5 cursor-pointer"
                    title="Tambah Kategori Baru"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kategori</span>
                  </button>
                </div>

                {/* Collapsible Category Overview Cards Shelf */}
                {showCategoryCards && (
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Detail & Deskripsi Kategori Karpet ({carpetCategoriesList.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCategoryCards(false)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Tutup</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {carpetCategoriesList.map((cat) => {
                        const isSelected = selectedCatalogCategory === cat.name;
                        const count = (config?.catalog || []).filter(p => {
                          const pCat = (p.category || '').trim().toLowerCase();
                          return pCat === cat.name.trim().toLowerCase();
                        }).length;
                        const isCustom = cat.id && !['kat-masjid', 'kat-persia', 'kat-minimalis', 'kat-shaggy', 'kat-kantor'].includes(cat.id);

                        return (
                          <div
                            key={cat.id || cat.name}
                            onClick={() => setSelectedCatalogCategory(isSelected ? 'Semua' : cat.name)}
                            className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group relative cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10'
                                : 'bg-[#0f172a]/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md border ${
                                  isSelected 
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                                }`}>
                                  Kategori
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isSelected 
                                      ? 'bg-emerald-500 text-slate-950' 
                                      : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {count} Produk
                                  </span>
                                  {isCustom && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(cat.id, cat.name);
                                      }}
                                      title="Hapus Kategori"
                                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h5 className={`font-bold text-sm mb-1 leading-snug ${
                                isSelected ? 'text-emerald-300' : 'text-white'
                              }`}>
                                {cat.name}
                              </h5>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {cat.description || `Koleksi karpet pilihan ${cat.name}.`}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                              <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-500 group-hover:text-slate-300'}>
                                {isSelected ? '✓ Sedang Difilter' : 'Filter Kategori'}
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Summary & Filter Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Menampilkan <strong className="text-white font-semibold">{filteredCatalog.length}</strong> produk</span>
                    {selectedCatalogCategory !== 'Semua' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px]">
                        <span>Kategori: <strong>{selectedCatalogCategory}</strong></span>
                        <button
                          type="button"
                          onClick={() => setSelectedCatalogCategory('Semua')}
                          className="hover:text-white p-0.5 rounded transition cursor-pointer"
                          title="Hapus filter kategori"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {catalogSearch && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px]">
                        <span>Pencarian: <strong>"{catalogSearch}"</strong></span>
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          className="hover:text-white p-0.5 rounded transition cursor-pointer"
                          title="Hapus kata kunci pencarian"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>

                  {(selectedCatalogCategory !== 'Semua' || catalogSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCatalogCategory('Semua');
                        setCatalogSearch('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Reset Semua Filter</span>
                    </button>
                  )}
                </div>

                {/* Product Cards Responsive Grid */}
                {filteredCatalog.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="font-semibold text-slate-400 text-sm">
                      {catalogSearch || selectedCatalogCategory !== 'Semua'
                        ? 'Tidak ada produk karpet yang cocok dengan filter atau pencarian'
                        : 'Belum ada produk di katalog'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      {selectedCatalogCategory !== 'Semua'
                        ? `Belum ada produk dalam kategori "${selectedCatalogCategory}". Klik Tambah Produk untuk mengisi kategori ini.`
                        : 'Klik tombol di bawah untuk menambahkan produk karpet baru ke katalog Anda.'}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {(selectedCatalogCategory !== 'Semua' || catalogSearch) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCatalogCategory('Semua');
                            setCatalogSearch('');
                          }}
                          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
                        >
                          Tampilkan Semua Karpet
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenAddProduct}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk Sekarang</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
                    {filteredCatalog.map((item) => {
                      const cleanImg = (item.image || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '');
                      const imgSrc = cleanImg.startsWith('http') || cleanImg.startsWith('data:') ? cleanImg : `/${cleanImg}`;

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 hover:shadow-2xl hover:shadow-emerald-950/10 transition-all duration-300"
                        >
                          {/* Image Container */}
                          <div className="h-48 sm:h-52 bg-slate-900 relative overflow-hidden flex items-center justify-center shrink-0">
                            <img
                              src={imgSrc}
                              alt={item.title}
                              onError={(e) => {
                                e.target.src = '/catalog/karpet-masjid-turki.jpg';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            {/* Price Badge */}
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-emerald-400 font-bold text-xs border border-emerald-500/30 shadow">
                              {item.price}
                            </span>
                            {/* Category Badge on Bottom Left of Image */}
                            <div className="absolute bottom-3 left-3">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md text-emerald-300 font-medium text-[11px] border border-emerald-500/30 shadow flex items-center">
                                <span className="truncate max-w-[180px]">{item.category || 'Semua Kategori'}</span>
                              </span>
                            </div>
                            {/* Actions on Card Image (Edit & Delete) */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(item)}
                                title="Edit Produk"
                                className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(item.id, item.title)}
                                disabled={deletingProductId === item.id}
                                title="Hapus Produk"
                                className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/80 border border-rose-900/50 transition cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Content Container */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-emerald-300 transition" title={item.title}>
                                  {item.title}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono shrink-0">
                                  #{item.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                {item.subtitle}
                              </p>
                              {item.footer && (
                                <p className="text-[11px] text-purple-300 font-medium line-clamp-1">
                                  🎨 {item.footer}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: SKU Code & Action Buttons */}
                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                              <span className="text-slate-500 font-mono text-[11px] truncate max-w-[100px]" title={item.code || `PROD-${item.id}`}>
                                {item.code || `PROD-${item.id}`}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSendProductModal(item)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 font-semibold border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                                  title="Kirim pesan produk ini ke riwayat chat pelanggan WhatsApp"
                                >
                                  <Send className="w-3 h-3 text-emerald-400" />
                                  <span>Kirim Pesan</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          
          {/* TAB: STORE PROFILE & OWNER */}
          {activeTab === 'store_profile' && (
            <div className="space-y-6">

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
                              sendDirectWaMessage(
                                ownerSettings.phone,
                                `Halo Bapak/Ibu ${ownerSettings.owner_name || 'Owner'}, saya ingin berkonsultasi seputar pesanan karpet.`
                              );
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
              {/* Form Editor for Schedules */}
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-sky-400" />
                    <span>Jadwal Operasional & Jam Kerja Toko</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola jadwal operasional showroom, survey lokasi, teknisi pasang karpet, dan pengiriman kargo
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <label className="text-slate-300 font-semibold flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      <span>1. Jam Buka Showroom & Galeri</span>
                    </label>
                    <textarea
                      rows={3}
                      value={scheduleSettings.store_hours}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, store_hours: e.target.value }))}
                      placeholder="Contoh: Senin - Sabtu: 08:30 - 20:00 WIB | Minggu: 09:00 - 18:00 WIB"
                      className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Waktu kunjungan langsung untuk memilih motif dan mengecek ketebalan benang.</p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <label className="text-slate-300 font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      <span>2. Jam Layanan Survey & Bawa Sampel</span>
                    </label>
                    <textarea
                      rows={3}
                      value={scheduleSettings.survey_hours}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, survey_hours: e.target.value }))}
                      placeholder="Contoh: Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB (Gratis Jabodetabek)"
                      className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Jadwal konsultan teknis datang membawa meteran laser dan sampel bahan gratis.</p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <label className="text-slate-300 font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>3. Instalasi, Pasang & Obras 24 Jam</span>
                    </label>
                    <textarea
                      rows={3}
                      value={scheduleSettings.installation_hours}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, installation_hours: e.target.value }))}
                      placeholder="Contoh: Layanan Teknisi 24 Jam (By Appointment), bisa malam hari setelah Isya."
                      className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Jadwal pengerjaan obras portabel di tempat dan pasang presisi mengikuti kontur masjid.</p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <label className="text-slate-300 font-semibold flex items-center gap-2">
                      <Send className="w-4 h-4 text-amber-400" />
                      <span>4. Jadwal Ekspedisi & Pengiriman Kargo</span>
                    </label>
                    <textarea
                      rows={3}
                      value={scheduleSettings.shipping_schedule}
                      onChange={(e) => setScheduleSettings((prev) => ({ ...prev, shipping_schedule: e.target.value }))}
                      placeholder="Contoh: Jabodetabek setiap hari kerja. Luar kota: Indah, Dakota, Baraka Kargo."
                      className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Armada internal dan ekspedisi pengiriman resmi ke seluruh Nusantara.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-400">
                    💡 Perubahan jadwal otomatis tersinkronisasi ke bot WhatsApp dan simulator AI.
                  </p>
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
                                sendDirectWaMessage(
                                  loc.phone || ownerSettings?.phone || businessSettings?.phone,
                                  `Halo Sultan Carpet, saya ingin berkunjung ke ${loc.title} (${loc.address}). Apakah hari ini buka?`
                                );
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
              {/* Live Form Editor for Warranty */}
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>{warrantySettings.title || 'Jaminan Kualitas & Garansi Resmi Sultan Carpet'}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold text-xs">
                      Resmi Reseller Utama
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    {warrantySettings.summary}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">Judul Dokumen Garansi</label>
                    <input
                      type="text"
                      value={warrantySettings.title}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">Ringkasan Garansi</label>
                    <textarea
                      rows={2}
                      value={warrantySettings.summary}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, summary: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">Panduan Langkah Klaim</label>
                    <textarea
                      rows={3}
                      value={warrantySettings.claim_steps}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, claim_steps: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-800">
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
                            sendDirectWaMessage(
                              ownerSettings?.phone || businessSettings?.phone,
                              `Halo Sultan Carpet! Saya tertarik dengan promo penawaran: *${promo.title}* (${promo.discount}). Mohon informasi lengkapnya.`
                            );
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


          {/* TAB: TANYA JAWAB AI (AI KNOWLEDGE) */}
          {activeTab === 'qna' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
              {/* Header Hero Banner */}
              <div className="p-6 md:p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0f172a] via-[#111c35] to-[#0a1224] backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold tracking-wide">
                      <Brain className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Basis Pengetahuan Tanya Jawab (AI Knowledge Base)</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                      Daftar Pertanyaan & Jawaban AI
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                      Kelola pertanyaan dan jawaban resmi toko agar AI (Groq & Gemini) otomatis mempelajari dan menjawab pelanggan secara cepat, tepat, dan profesional.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleOpenAddFaq()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Tanya Jawab</span>
                    </button>

                    <button
                      onClick={() => fetchCustomerQuestions()}
                      disabled={loadingCustomerQuestions}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 font-medium text-xs transition border border-sky-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      title="Pindai pesan chat masuk yang berupa pertanyaan dari customer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomerQuestions ? 'animate-spin' : ''}`} />
                      <span>{loadingCustomerQuestions ? 'Memindai...' : 'Pindai Chat Nyata'}</span>
                    </button>

                    <button
                      onClick={handleSyncFaqsToAi}
                      disabled={syncingFaqsToAi}
                      className="px-3.5 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-medium text-xs transition border border-purple-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      title="Sinkronkan pembaruan ke AI Studio"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${syncingFaqsToAi ? 'animate-spin' : ''}`} />
                      <span>{syncingFaqsToAi ? 'Sinkron...' : 'Sinkron ke AI'}</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80 relative z-10">
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Total Tanya-Jawab</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white font-mono">{faqs.length}</span>
                      <span className="text-[10px] text-emerald-400">Aktif Dipelajari</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kategori Topik</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white font-mono">
                        {new Set(faqs.map(f => f.category || 'Umum')).size}
                      </span>
                      <span className="text-[10px] text-amber-300">Kategori</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>Pertanyaan Chat Asli</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white font-mono">{customerQuestions.length}</span>
                      <span className="text-[10px] text-sky-300">Terdeteksi</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Engine AI</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-white font-mono uppercase">
                        {aiProvider === 'groq' ? 'Groq Llama' : 'Gemini'}
                      </span>
                      <span className="text-[10px] text-emerald-400">● Grounded</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFaqSubTab('qa_list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      faqSubTab === 'qa_list'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daftar Tanya Jawab AI</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                      {faqs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setFaqSubTab('customer_insights');
                      fetchCustomerQuestions();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      faqSubTab === 'customer_insights'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>Pola Pertanyaan dari Chat Pelanggan</span>
                    {customerQuestions.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-[10px] font-mono text-sky-300">
                        {customerQuestions.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setFaqSubTab('web_crawler');
                      fetchCrawledPages();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      faqSubTab === 'web_crawler'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>Website Crawling / Scraping</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-purple-300">
                      {crawledPages.length}
                    </span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AI otomatis mempelajari data ini</span>
                </div>
              </div>

              {/* TAB 1: QA LIST & KNOWLEDGE BASE */}
              {faqSubTab === 'qa_list' && (
                <div className="space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={faqSearchQuery}
                          onChange={(e) => setFaqSearchQuery(e.target.value)}
                          placeholder="Cari pertanyaan atau jawaban..."
                          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        {faqSearchQuery && (
                          <button
                            onClick={() => setFaqSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {faqCategoryFilter !== 'Semua' && (
                        <button
                          onClick={() => setFaqCategoryFilter('Semua')}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                      {[
                        'Semua',
                        'Karpet Masjid & Musholla',
                        'Pemasangan & Obras',
                        'Survey & Sampel',
                        'Promo & Diskon',
                        'Garansi & Keaslian',
                        'Nego & Pembayaran',
                        'Ketersediaan Stok',
                        'Komplain & Retur'
                      ].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFaqCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition cursor-pointer ${
                            faqCategoryFilter === cat
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Cards List */}
                  {(() => {
                    const filtered = faqs.filter((f) => {
                      const matchCat =
                        faqCategoryFilter === 'Semua' ||
                        (f.category || 'Umum').toLowerCase().includes(faqCategoryFilter.toLowerCase());
                      const qLower = faqSearchQuery.toLowerCase();
                      const matchQuery =
                        !qLower ||
                        (f.q && f.q.toLowerCase().includes(qLower)) ||
                        (f.a && f.a.toLowerCase().includes(qLower)) ||
                        (f.category && f.category.toLowerCase().includes(qLower));
                      return matchCat && matchQuery;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-12 rounded-3xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-xl">
                            🔍
                          </div>
                          <h4 className="text-sm font-semibold text-white">Tidak ada Tanya-Jawab yang cocok</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            {faqSearchQuery || faqCategoryFilter !== 'Semua'
                              ? 'Coba ganti kata kunci pencarian atau reset filter kategori di atas.'
                              : 'Belum ada data tanya-jawab. Klik tombol di bawah untuk menambah pertanyaan pertama.'}
                          </p>
                          <button
                            onClick={() => handleOpenAddFaq()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Tanya Jawab Baru</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {filtered.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-5 rounded-2xl border border-slate-800/90 bg-[#0f172a]/80 backdrop-blur-md hover:border-slate-700 transition space-y-3.5 shadow-lg relative group"
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                                  🏷️ {item.category || 'Umum'}
                                </span>
                                {item.source && (
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-medium">
                                    Sumber: {item.source}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleEditFaq(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
                                  title="Edit Pertanyaan & Jawaban"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(item.id || idx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                                  title="Hapus dari memori AI"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Question */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                Q
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] text-slate-400 font-medium">Pertanyaan Pelanggan:</p>
                                <h3 className="text-sm font-semibold text-white leading-snug">
                                  {item.q}
                                </h3>
                              </div>
                            </div>

                            {/* AI Official Answer */}
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                                <Bot className="w-3.5 h-3.5" />
                                <span>Jawaban Resmi AI & CS:</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-emerald-500/40">
                                {item.a}
                              </p>
                            </div>

                            {/* Footer Status */}
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aktif diajarkan ke AI (Groq & Gemini)</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSimPrompt(item.q);
                                  setActiveTab('gemini');
                                }}
                                className="text-slate-400 hover:text-purple-300 flex items-center gap-1 transition cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                <span>Uji di Simulator AI</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: REAL CUSTOMER QUESTIONS FROM WHATSAPP */}
              {faqSubTab === 'customer_insights' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span>Pertanyaan Nyata Terdeteksi dari Obrolan WhatsApp</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Sistem memindai pesan masuk dari riwayat WhatsApp untuk mendeteksi pertanyaan aktual. Anda bisa langsung mengajari AI jawaban idealnya.
                      </p>
                    </div>

                    <button
                      onClick={() => fetchCustomerQuestions()}
                      disabled={loadingCustomerQuestions}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomerQuestions ? 'animate-spin' : ''}`} />
                      <span>{loadingCustomerQuestions ? 'Memindai Ulang...' : 'Pindai Ulang'}</span>
                    </button>
                  </div>

                  {customerQuestions.length === 0 ? (
                    <div className="p-12 rounded-3xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-xl">
                        💬
                      </div>
                      <h4 className="text-sm font-semibold text-white">Belum Ada Pertanyaan Terdeteksi</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Ketika pelanggan WhatsApp mengirim pesan yang mengandung pertanyaan (misal: "apakah ada karpet polos?", "berapa harga?"), pertanyaan tersebut akan otomatis muncul di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {customerQuestions.map((cq, idx) => (
                        <div
                          key={cq.id || idx}
                          className="p-4 rounded-2xl border border-slate-800 bg-[#0f172a]/70 hover:border-slate-700 transition space-y-3 shadow-md flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{cq.senderName || 'Pelanggan'}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {cq.timestamp ? new Date(cq.timestamp).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                              </span>
                            </div>

                            <p className="text-xs text-white font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-850 leading-relaxed">
                              "{cq.text}"
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            {cq.isLearned ? (
                              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Sudah Masuk Q&A</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Belum Masuk Q&A</span>
                              </span>
                            )}

                            <button
                              onClick={() => handleOpenAddFaq({
                                text: cq.text,
                                senderName: cq.senderName,
                                category: 'Karpet Masjid & Musholla'
                              })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                cq.isLearned
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{cq.isLearned ? 'Perbarui Jawaban' : 'Ajari AI Jawaban Ini'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB: WEBSITE CRAWLER / SCRAPER */}
              {faqSubTab === 'web_crawler' && (
                <div className="space-y-6">
                  {/* Hero / Input Crawl Card */}
                  <div className="p-6 sm:p-7 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-950/80 backdrop-blur-xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                            <Globe className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-white tracking-tight">Website Crawler & Scraping Engine</h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                RAG Sync Otomatis
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Pindai halaman web/landing page produk, katalog online, artikel, atau FAQ website. Teks otomatis diolah menjadi potongan semantik RAG agar AI dapat menjawab langsung dari materi website.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => fetchCrawledPages()}
                          disabled={loadingCrawledPages}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium border border-slate-700 flex items-center gap-2 self-start sm:self-center transition disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingCrawledPages ? 'animate-spin' : ''}`} />
                          <span>{loadingCrawledPages ? 'Menyegarkan...' : 'Segarkan Data'}</span>
                        </button>
                      </div>

                      {/* URL Crawler Form */}
                      <form onSubmit={handleStartCrawl} className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Target URL Website:</span>
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="url"
                              value={crawlUrlInput}
                              onChange={(e) => setCrawlUrlInput(e.target.value)}
                              placeholder="https://sultancarpet.com/katalog atau https://toko-anda.com/faq"
                              required
                              disabled={crawlingWeb}
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Masukkan URL publik (HTTP/HTTPS). Bot akan otomatis membersihkan tag HTML, iklan, dan script agar menyisakan teks informatif murni.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                              <label className="text-slate-400">Maks. Halaman:</label>
                              <select
                                value={crawlMaxPages}
                                onChange={(e) => setCrawlMaxPages(Number(e.target.value))}
                                disabled={crawlingWeb}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value={1}>1 Halaman Saja</option>
                                <option value={3}>3 Halaman Terkait</option>
                                <option value={5}>5 Halaman Terkait</option>
                                <option value={10}>10 Halaman Terkait</option>
                              </select>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={crawlFollowLinks}
                                onChange={(e) => setCrawlFollowLinks(e.target.checked)}
                                disabled={crawlingWeb || crawlMaxPages <= 1}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                              />
                              <span className="text-slate-300">Jelajahi Sub-link Internal domain yang sama</span>
                            </label>
                          </div>

                          <button
                            type="submit"
                            disabled={crawlingWeb || !crawlUrlInput.trim()}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                          >
                            {crawlingWeb ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Sedang Scraping & Ekstraksi...</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4" />
                                <span>Mulai Crawling Sekarang</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Stat summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <p className="text-[11px] text-slate-400 font-medium">Halaman Terkumpul</p>
                          <p className="text-lg font-bold text-white mt-0.5">{crawledPages.length} Halaman</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <p className="text-[11px] text-slate-400 font-medium">Total Chunk RAG</p>
                          <p className="text-lg font-bold text-indigo-400 mt-0.5">
                            {crawledPages.reduce((acc, p) => acc + (p.chunks?.length || 0), 0)} Chunk
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <p className="text-[11px] text-slate-400 font-medium">Karakter Bersih</p>
                          <p className="text-lg font-bold text-sky-400 mt-0.5">
                            {(crawledPages.reduce((acc, p) => acc + (p.content?.length || 0), 0)).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <p className="text-[11px] text-slate-400 font-medium">Status Pengetahuan</p>
                          <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Aktif di Otak AI
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* List of Crawled Pages */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span>Daftar Halaman Website Terindeks ({crawledPages.length})</span>
                      </h4>
                      {crawledPages.length > 0 && (
                        <p className="text-xs text-slate-400">
                          Data ini otomatis disinkronkan ke Vector RAG untuk referensi tanya jawab pelanggan
                        </p>
                      )}
                    </div>

                    {loadingCrawledPages ? (
                      <div className="p-12 text-center text-slate-400 text-xs">Memuat daftar scraping...</div>
                    ) : crawledPages.length === 0 ? (
                      <div className="p-12 rounded-3xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center text-xl">
                          🌐
                        </div>
                        <h4 className="text-sm font-semibold text-white">Belum Ada Website Yang Di-crawl</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Ketikkan alamat website toko, landing page, atau katalog Anda di formulir atas lalu klik "Mulai Crawling Sekarang". AI akan langsung membaca dan memahami isinya.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {crawledPages.map((page) => (
                          <div
                            key={page.id}
                            className="p-5 rounded-2xl border border-slate-800 bg-[#0f172a]/70 hover:border-slate-700 transition space-y-3 shadow-md flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <h5 className="text-sm font-bold text-white truncate" title={page.title || page.url}>
                                    {page.title || 'Halaman Web'}
                                  </h5>
                                  <a
                                    href={page.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 truncate"
                                  >
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{page.url}</span>
                                  </a>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 shrink-0">
                                  {page.chunks?.length || 0} Chunks
                                </span>
                              </div>

                              {page.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  {page.description}
                                </p>
                              )}

                              <div className="text-[11px] text-slate-500 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 line-clamp-3 leading-relaxed">
                                {page.content ? page.content.slice(0, 220) + '...' : 'Tidak ada konten teks.'}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="text-[10px] text-slate-500">
                                {page.crawledAt ? new Date(page.crawledAt).toLocaleString('id-ID') : 'Baru saja'}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingCrawlPage(page)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Lihat Chunk</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteCrawledPage(page.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                                  title="Hapus dari RAG"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: HANDS-OFF CS & AI TAKEOVER */}
          {activeTab === 'handoff' && (() => {
            const activeHandoffs = (conversations || []).filter((c) => Boolean(c?.isHumanHandoff));
            const filteredConversations = (conversations || []).filter((c) => {
              if (!c) return false;
              if (handoffFilter === 'handoff' && !c.isHumanHandoff) return false;
              if (handoffFilter === 'ai' && c.isHumanHandoff) return false;
              if (!handoffSearch.trim()) return true;
              const q = handoffSearch.toLowerCase();
              const sName = c.senderName && typeof c.senderName === 'string' ? c.senderName.toLowerCase() : '';
              const sPhone = c.phone ? String(c.phone).toLowerCase() : '';
              const sFormatted = c.formattedPhone ? String(c.formattedPhone).toLowerCase() : '';
              let sLastMsg = '';
              if (typeof c.lastMessage === 'string') {
                sLastMsg = c.lastMessage.toLowerCase();
              } else if (c.lastMessage && typeof c.lastMessage === 'object') {
                sLastMsg = String(c.lastMessage.text || c.lastMessage.caption || '').toLowerCase();
              }
              return (
                sName.includes(q) ||
                sPhone.includes(q) ||
                sFormatted.includes(q) ||
                sLastMsg.includes(q)
              );
            });

            return (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="p-6 sm:p-7 rounded-3xl border border-slate-800 bg-[#0f172a]/70 backdrop-blur-xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Sistem Alih Kendali AI ke CS Manusia</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Hands-Off Customer Service & AI Takeover
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                        Kelola intervensi staf CS manusia saat pelanggan membutuhkan negosiasi harga, komplain mendesak, atau konsultasi khusus. Bot AI otomatis berhenti membalas pada kontak yang diambil alih.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Global Handoff Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const newStatus = !handoffConfig.enabled;
                          handleSaveHandoffConfig({ ...handoffConfig, enabled: newStatus });
                        }}
                        disabled={savingHandoffConfig}
                        className={`py-2 px-4 rounded-xl font-semibold text-xs border flex items-center gap-2 transition cursor-pointer ${
                          handoffConfig.enabled
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-950/60'
                        }`}
                        title="Klik untuk mengaktifkan atau menonaktifkan fitur hands-off otomatis"
                      >
                        <span className={`w-2 h-2 rounded-full ${handoffConfig.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>Hands-Off Otomatis: {handoffConfig.enabled ? 'AKTIF' : 'NONAKTIF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('chats')}
                        className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Buka Obrolan WA</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Sedang Hands-Off (CS)</span>
                        <Headphones className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>{activeHandoffs.length}</span>
                        {activeHandoffs.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            Ditangani CS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Kontak dengan AI dimatikan</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Mode Bot AI Aktif</span>
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {Math.max(0, (conversations?.length || 0) - activeHandoffs.length)}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Dijawab otomatis oleh AI</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Auto-Expire Sesi</span>
                        <Clock className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {handoffConfig.auto_expire_hours || 2} <span className="text-sm font-normal text-slate-400">Jam</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Otomatis kembali ke bot AI</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Kata Kunci Pemicu</span>
                        <Tag className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {handoffConfig.keywords?.length || 0} <span className="text-sm font-normal text-slate-400">Pemicu</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Kata panggil CS manusia</p>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs Navigation */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setHandoffSubTab('contacts')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                      handoffSubTab === 'contacts'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                    <span>Kontak & Live Takeover</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px]">
                      {conversations?.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoffSubTab('rules')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                      handoffSubTab === 'rules'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Aturan & Kata Kunci Pemicu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoffSubTab('tester')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                      handoffSubTab === 'tester'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Uji Pemicu Hands-Off</span>
                  </button>
                </div>

                {/* SUBTAB 1: KONTAK & LIVE TAKEOVER */}
                {handoffSubTab === 'contacts' && (
                  <div className="space-y-4">
                    {/* Manual Takeover Form Bar */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-[#0f172a]/70">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Ambil Alih Obrolan Manual (By Phone)
                        </h4>
                      </div>
                      <form onSubmit={handleManualHandoffTakeover} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <input
                          type="text"
                          value={manualHandoffPhone}
                          onChange={(e) => setManualHandoffPhone(e.target.value)}
                          placeholder="Nomor WhatsApp (contoh: 08123456789 atau 62812...)"
                          className="flex-1 rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="text"
                          value={manualHandoffReason}
                          onChange={(e) => setManualHandoffReason(e.target.value)}
                          placeholder="Alasan takeover (contoh: Negosiasi Harga Khusus)"
                          className="w-full sm:w-64 rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Headphones className="w-4 h-4" />
                          <span>Ambil Alih ke CS</span>
                        </button>
                      </form>
                    </div>

                    {/* Filter & Search Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                          type="button"
                          onClick={() => setHandoffFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                            handoffFilter === 'all'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Semua ({conversations?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setHandoffFilter('handoff')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                            handoffFilter === 'handoff'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Sedang Hands-Off / CS</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
                            {activeHandoffs.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHandoffFilter('ai')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                            handoffFilter === 'ai'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Aktif Bot AI</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px]">
                            {Math.max(0, (conversations?.length || 0) - activeHandoffs.length)}
                          </span>
                        </button>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={handoffSearch}
                          onChange={(e) => setHandoffSearch(e.target.value)}
                          placeholder="Cari nama, nomor, atau pesan..."
                          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        {handoffSearch && (
                          <button
                            type="button"
                            onClick={() => setHandoffSearch('')}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contacts List */}
                    {filteredConversations.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
                        <Headphones className="w-12 h-12 text-slate-600 mx-auto" />
                        <h4 className="font-semibold text-slate-300 text-sm">Tidak ada kontak yang cocok</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {handoffFilter === 'handoff'
                            ? 'Saat ini belum ada kontak yang dalam mode CS Manusia (Hands-off). Semua obrolan dijawab otomatis oleh Bot AI.'
                            : 'Belum ada data obrolan yang sesuai dengan filter pencarian.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredConversations.map((c, idx) => {
                          const isHandoff = Boolean(c.isHumanHandoff);
                          const rawName = c.senderName && typeof c.senderName === 'string' ? c.senderName.trim() : '';
                          const contactName = rawName && !/^\+?\d{10,}$/.test(rawName)
                            ? rawName
                            : (c.formattedPhone || (c.phone ? `+${c.phone}` : 'Pelanggan'));
                          const initialChar = (contactName ? String(contactName).trim().charAt(0) : 'P').toUpperCase() || 'P';

                          let lastMsgText = '(Belum ada pesan teks)';
                          if (typeof c.lastMessage === 'string') {
                            lastMsgText = c.lastMessage || '(Belum ada pesan teks)';
                          } else if (c.lastMessage && typeof c.lastMessage === 'object') {
                            lastMsgText = c.lastMessage.text || c.lastMessage.caption || c.lastMessage.content || (c.lastMessage.type ? `[${c.lastMessage.type}]` : '(Pesan media/pesan masuk)');
                          }

                          const rawTimestamp = c.updatedAt || c.lastMessage?.timestamp || c.lastTimestamp;
                          const formattedTime = rawTimestamp
                            ? new Date(rawTimestamp).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : 'Terbaru';

                          return (
                            <div
                              key={c.jid || c.phone || `conv_${idx}`}
                              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                                isHandoff
                                  ? 'bg-[#1a1505]/70 border-amber-500/40 ring-1 ring-amber-500/20 shadow-lg shadow-amber-950/20'
                                  : 'bg-[#0f172a]/70 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                      isHandoff ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {initialChar}
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-white text-sm line-clamp-1">{contactName}</h5>
                                      <p className="text-[11px] text-slate-400 font-mono">{c.formattedPhone || (c.phone ? `+${c.phone}` : '')}</p>
                                    </div>
                                  </div>

                                  {/* Status Badge */}
                                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 shrink-0 ${
                                    isHandoff
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                  }`}>
                                    {isHandoff ? (
                                      <>
                                        <Headphones className="w-3 h-3 text-amber-400" />
                                        <span>Mode CS Manusia</span>
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="w-3 h-3 text-emerald-400" />
                                        <span>Bot AI Aktif</span>
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs text-slate-300">
                                  <p className="line-clamp-2 leading-relaxed">
                                    {lastMsgText}
                                  </p>
                                </div>
                              </div>

                              {/* Action Row */}
                              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-slate-500">
                                  {formattedTime}
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleContactAi(c)}
                                    disabled={togglingAiJid === (c.jid || c.phone)}
                                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                      isHandoff
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
                                        : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {isHandoff ? (
                                      <>
                                        <Bot className="w-3.5 h-3.5" />
                                        <span>Kembalikan ke Bot</span>
                                      </>
                                    ) : (
                                      <>
                                        <Headphones className="w-3.5 h-3.5" />
                                        <span>Ambil Alih CS</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChatJid(c.jid || c.phone);
                                      setActiveTab('chats');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Chat</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: ATURAN & KATA KUNCI PEMICU */}
                {handoffSubTab === 'rules' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 space-y-6">
                      {/* Section 1: Trigger Keywords */}
                      <div className="space-y-3 pb-6 border-b border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <Tag className="w-4 h-4 text-amber-400" />
                              <span>Kata Kunci Pemicu Alih ke CS (Trigger Keywords)</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Jika pelanggan mengetik salah satu kata kunci di bawah, AI otomatis berhenti membalas dan mode CS Manusia aktif.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLoadDefaultHandoffPresets('trigger')}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                          >
                            + Muat Rekomendasi CS
                          </button>
                        </div>

                        {/* Keyword Chips */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(handoffConfig.keywords || []).map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveHandoffKeyword(kw)}
                                className="text-amber-400 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                                title="Hapus kata kunci"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Keyword Input */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={newHandoffKeyword}
                            onChange={(e) => setNewHandoffKeyword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddHandoffKeyword();
                              }
                            }}
                            placeholder="Ketik kata kunci baru (contoh: 'bicara orang', 'agen live')..."
                            className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddHandoffKeyword}
                            className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>

                      {/* Section 2: Release Keywords */}
                      <div className="space-y-3 pb-6 border-b border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <Bot className="w-4 h-4 text-emerald-400" />
                              <span>Kata Kunci Pengembalian ke Bot AI (Release Keywords)</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Kata kunci yang mengetikkan perintah untuk mengaktifkan kembali bot AI setelah sesi dengan CS manusia selesai.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLoadDefaultHandoffPresets('release')}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                          >
                            + Muat Rekomendasi Bot
                          </button>
                        </div>

                        {/* Release Chips */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(handoffConfig.release_keywords || []).map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveReleaseKeyword(kw)}
                                className="text-emerald-400 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                                title="Hapus kata kunci rilis"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Release Keyword Input */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={newReleaseKeyword}
                            onChange={(e) => setNewReleaseKeyword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddReleaseKeyword();
                              }
                            }}
                            placeholder="Ketik kata rilis baru (contoh: '!bot', 'kembali ke bot')..."
                            className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddReleaseKeyword}
                            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>

                      {/* Section 3: Durations & Auto Messages */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6 border-b border-slate-800">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>Auto-Expire Sesi CS</span>
                          </label>
                          <select
                            value={handoffConfig.auto_expire_hours || 2}
                            onChange={(e) => setHandoffConfig((prev) => ({ ...prev, auto_expire_hours: Number(e.target.value) }))}
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value={1}>1 Jam (Cepat)</option>
                            <option value={2}>2 Jam (Standar)</option>
                            <option value={4}>4 Jam</option>
                            <option value={8}>8 Jam</option>
                            <option value={24}>24 Jam (1 Hari)</option>
                          </select>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Jika CS tidak aktif merespons selama durasi ini, bot AI otomatis aktif kembali.
                          </p>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Pesan Otomatis Saat Alih CS (Hand-off Notice)
                          </label>
                          <textarea
                            rows={3}
                            value={handoffConfig.takeover_notice || ''}
                            onChange={(e) => setHandoffConfig((prev) => ({ ...prev, takeover_notice: e.target.value }))}
                            placeholder="Pesan yang dikirim ke pelanggan saat tangan dialihkan ke CS manusia..."
                            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleSaveHandoffConfig()}
                          disabled={savingHandoffConfig}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {savingHandoffConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                          <span>{savingHandoffConfig ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Hands-Off'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: TESTER */}
                {handoffSubTab === 'tester' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl border border-slate-800 bg-[#0f172a]/70 space-y-5">
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Simulasi & Uji Kata Kunci Hands-Off</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Uji bagaimana sistem merespons pesan teks dari pelanggan. Anda dapat memastikan kata kunci pemicu CS atau kata kunci rilis bot berfungsi sesuai ekspektasi.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <textarea
                            rows={3}
                            value={testHandoffQuery}
                            onChange={(e) => setTestHandoffQuery(e.target.value)}
                            placeholder="Ketik contoh pesan pelanggan, misal: 'Halo saya ingin bicara dengan admin manusia mengenai karpet masjid 10 roll'..."
                            className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Contoh cepat:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setTestHandoffQuery('Bisa bicara dengan admin manusia?');
                              }}
                              className="text-amber-400 hover:underline"
                            >
                              "Bicara admin manusia"
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => {
                                setTestHandoffQuery('Kembali ke bot asisten');
                              }}
                              className="text-emerald-400 hover:underline"
                            >
                              "Kembali ke bot"
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleTestHandoffMessage}
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/20"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Uji Pesan Ini</span>
                          </button>
                        </div>
                      </div>

                      {/* Test Result Display */}
                      {testHandoffResult && (
                        <div className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                          testHandoffResult.type === 'TRIGGER'
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : testHandoffResult.type === 'RELEASE'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                            : 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                        }`}>
                          <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                            {testHandoffResult.type === 'TRIGGER' && <Headphones className="w-4 h-4 text-amber-400" />}
                            {testHandoffResult.type === 'RELEASE' && <Bot className="w-4 h-4 text-emerald-400" />}
                            {testHandoffResult.type === 'AI_REPLY' && <Sparkles className="w-4 h-4 text-blue-400" />}
                            <span>{testHandoffResult.title}</span>
                          </div>
                          <p className="text-xs leading-relaxed opacity-90">
                            {testHandoffResult.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 12: SETTINGS (ANTI-SPAM, DELAY & PROTECTIONS) */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SISTEM ANTI-BANNED & PENCEGAHAN SPAM WHATSAPP</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                      <span>Pengaturan Delay & Anti-Spam</span>
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Kelola jeda pengiriman pesan (cooldown), simulasi mengetik manusiawi, batas anti-flood pelanggan, deduplikasi pesan kembar, dan circuit breaker agar nomor WhatsApp Anda tetap sehat dan terhindar dari pemblokiran resmi.
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={fetchProtections}
                      disabled={loadingProtections}
                      className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                      title="Muat ulang data statistik & konfigurasi proteksi"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingProtections ? 'animate-spin' : ''}`} />
                      <span>{loadingProtections ? 'Memuat...' : 'Sinkronkan'}</span>
                    </button>

                    <button
                      onClick={handleResetProtectionsStats}
                      className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-rose-300 text-xs font-medium border border-rose-500/20 transition-all flex items-center gap-2 shadow-sm"
                      title="Reset angka metrik statistik ke 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Metrik</span>
                    </button>

                    <button
                      onClick={handleLoadProtectionsDefaults}
                      className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-all flex items-center gap-2 shadow-sm"
                      title="Gunakan konfigurasi delay dan proteksi yang paling direkomendasikan"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Standar Aman</span>
                    </button>

                    <button
                      onClick={() => handleSaveProtections()}
                      disabled={savingProtections}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                    >
                      {savingProtections ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Pengaturan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5 Real-Time KPI Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Total Diproses</span>
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {(protectionsStats?.totalInboundProcessed || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Pesan masuk dievaluasi</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Spam Ditangkal</span>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-rose-400">
                      {(protectionsStats?.floodsBlocked || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Pesan flood di-cooldown</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Duplikat Dicegah</span>
                      <Copy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-amber-400">
                      {(protectionsStats?.duplicatesBlocked || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Pesan identik kembar</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Debounce Buffer</span>
                      <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-cyan-400">
                      {(protectionsStats?.burstsAggregated || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Pesan beruntun digabung</div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Opt-Out / Stop</span>
                      <UserCheck className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-400">
                      {(protectionsStats?.optOutUsers || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Pengguna berhenti pesan</div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs Pill Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
                {[
                  { id: 'cooldown', label: 'Delay & Cooldown', icon: Clock },
                  { id: 'flood', label: 'Proteksi Spam (Flood)', icon: ShieldAlert, badge: blockedUsers.length > 0 ? `${blockedUsers.length} Diblokir` : null },
                  { id: 'dedup', label: 'Anti-Pesan Kembar & Debounce', icon: Copy },
                  { id: 'global_rate', label: 'Batas Global & Anti-Ban', icon: Zap },
                  { id: 'compliance', label: 'Kata Kunci Stop / Opt-Out', icon: UserCheck },
                  { id: 'tester', label: 'Simulator & Uji Delay', icon: Sliders },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = protectionsSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setProtectionsSubTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: DELAY & COOLDOWN */}
              {protectionsSubTab === 'cooldown' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                          <Clock className="w-5 h-5 text-emerald-400" />
                          <span>Delay Pengiriman & Simulasi Mengetik Alami</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Memberikan jeda waktu acak sebelum bot membalas pesan dan menampilkan status "sedang mengetik..." di WhatsApp agar terkesan manusiawi.
                        </p>
                      </div>

                      {/* Enable Switch */}
                      <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/60">
                        <span className="text-xs font-medium text-slate-300">Status Delay:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(protectionsConfig.cooldown?.enabled)}
                          onChange={(e) => updateNestedProtections('cooldown', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                        <span className={`text-xs font-bold ${protectionsConfig.cooldown?.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {protectionsConfig.cooldown?.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Min Delay */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Delay Minimum (Waktu Tunggu Tercepat)</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {((protectionsConfig.cooldown?.min_delay_ms || 2500) / 1000).toFixed(1)} detik ({protectionsConfig.cooldown?.min_delay_ms || 2500} ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="10000"
                          step="250"
                          value={protectionsConfig.cooldown?.min_delay_ms || 2500}
                          onChange={(e) => updateNestedProtections('cooldown', 'min_delay_ms', parseInt(e.target.value) || 2500)}
                          className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Cepat (0.5s)</span>
                          <span>Rekomendasi (2.5s)</span>
                          <span>Lambat (10s)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Waktu minimum bot menahan balasan sebelum dikirim ke pengguna. Hindari nilai di bawah 1 detik pada nomor baru.
                        </p>
                      </div>

                      {/* Max Delay */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Delay Maksimum (Batas Atas)</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {((protectionsConfig.cooldown?.max_delay_ms || 4000) / 1000).toFixed(1)} detik ({protectionsConfig.cooldown?.max_delay_ms || 4000} ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1000"
                          max="15000"
                          step="250"
                          value={protectionsConfig.cooldown?.max_delay_ms || 4000}
                          onChange={(e) => updateNestedProtections('cooldown', 'max_delay_ms', parseInt(e.target.value) || 4000)}
                          className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>1 detik</span>
                          <span>Rekomendasi (4.0s)</span>
                          <span>15 detik</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Batas terlama jeda pengiriman sehingga respons pelanggan tetap cepat dan tidak merasa diabaikan.
                        </p>
                      </div>

                      {/* Jitter (Random Variation) */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Jitter Acak (Variasi Waktu)</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            + 0 ~ {((protectionsConfig.cooldown?.jitter_ms || 1000) / 1000).toFixed(1)} detik ({protectionsConfig.cooldown?.jitter_ms || 1000} ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="4000"
                          step="200"
                          value={protectionsConfig.cooldown?.jitter_ms || 1000}
                          onChange={(e) => updateNestedProtections('cooldown', 'jitter_ms', parseInt(e.target.value) || 0)}
                          className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>0s (Tetap)</span>
                          <span>Rekomendasi (+1.0s)</span>
                          <span>+4.0s</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Memberikan tambahan waktu acak di setiap balasan agar jeda tidak selalu bernilai sama persis (menghindari deteksi bot statis oleh algoritma Meta).
                        </p>
                      </div>

                      {/* Typing Simulation */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-semibold text-slate-200 block">Simulasi Mengetik (Typing Presence)</label>
                            <span className="text-[11px] text-slate-400">Kirim status "sedang mengetik..." di WA</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(protectionsConfig.cooldown?.typing_simulation)}
                            onChange={(e) => updateNestedProtections('cooldown', 'typing_simulation', e.target.checked)}
                            className="w-4 h-4 accent-emerald-500 rounded bg-slate-800 cursor-pointer"
                          />
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">Kecepatan Mengetik (CPM)</span>
                            <span className="text-xs font-bold text-emerald-400">{protectionsConfig.cooldown?.typing_speed_cpm || 300} Karakter/menit</span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="800"
                            step="50"
                            disabled={!protectionsConfig.cooldown?.typing_simulation}
                            value={protectionsConfig.cooldown?.typing_speed_cpm || 300}
                            onChange={(e) => updateNestedProtections('cooldown', 'typing_speed_cpm', parseInt(e.target.value) || 300)}
                            className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer disabled:opacity-40"
                          />
                          <p className="text-[10px] text-slate-500">
                            Durasi mengetik otomatis dihitung sesuai panjang teks jawaban AI (misal pesan 150 karakter akan mengetik selama ~3 detik).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Safety Alert Note */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-emerald-200 block">Rekomendasi Keamanan WhatsApp:</strong>
                        Nilai delay minimum 2.500 ms (2.5 detik) dengan jitter 1.000 ms dan simulasi mengetik aktif terbukti paling aman untuk penggunaan nomor bot operasional toko karpet, meminimalisir risiko pelaporan spam oleh pelanggan.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: FLOOD PROTECTION & TEMP BLOCK */}
              {protectionsSubTab === 'flood' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                          <ShieldAlert className="w-5 h-5 text-rose-400" />
                          <span>Proteksi Anti-Flood & Pemblokiran Spammer Otomatis</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Mencegah pelanggan nakal atau bot spammer yang membombardir pesan ke nomor Anda dalam hitungan detik.
                        </p>
                      </div>

                      {/* Enable Switch */}
                      <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/60">
                        <span className="text-xs font-medium text-slate-300">Status Anti-Flood:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(protectionsConfig.flood_protection?.enabled)}
                          onChange={(e) => updateNestedProtections('flood_protection', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 relative"></div>
                        <span className={`text-xs font-bold ${protectionsConfig.flood_protection?.enabled ? 'text-rose-400' : 'text-slate-500'}`}>
                          {protectionsConfig.flood_protection?.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Max Messages / Minute */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Maksimal Pesan per Menit per Nomor</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {protectionsConfig.flood_protection?.max_messages_per_minute || 15} pesan / menit
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="40"
                          step="1"
                          value={protectionsConfig.flood_protection?.max_messages_per_minute || 15}
                          onChange={(e) => updateNestedProtections('flood_protection', 'max_messages_per_minute', parseInt(e.target.value) || 15)}
                          className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Ketat (5 pesan)</span>
                          <span>Standar (15 pesan)</span>
                          <span>Longgar (40 pesan)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Jika satu nomor mengirim pesan melebihi batas ini dalam jendela 60 detik, sistem langsung mengaktifkan cooldown sementara.
                        </p>
                      </div>

                      {/* Cooldown Duration */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Durasi Blokir Cooldown Sementara</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {protectionsConfig.flood_protection?.cooldown_seconds || 60} detik ({Math.round((protectionsConfig.flood_protection?.cooldown_seconds || 60) / 60)} menit)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="300"
                          step="15"
                          value={protectionsConfig.flood_protection?.cooldown_seconds || 60}
                          onChange={(e) => updateNestedProtections('flood_protection', 'cooldown_seconds', parseInt(e.target.value) || 60)}
                          className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>15 detik</span>
                          <span>1 menit</span>
                          <span>5 menit</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Selama durasi ini, pesan tambahan dari pengirim spam akan diabaikan tanpa membebani kuota API AI / database Anda.
                        </p>
                      </div>
                    </div>

                    {/* Warning Message Template */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200">
                          Pesan Peringatan Otomatis ke Pengirim Flood (Dikirim 1x saat terdeteksi)
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {(protectionsConfig.flood_protection?.warning_message || '').length} karakter
                        </span>
                      </div>
                      <textarea
                        rows="3"
                        value={protectionsConfig.flood_protection?.warning_message || ''}
                        onChange={(e) => updateNestedProtections('flood_protection', 'warning_message', e.target.value)}
                        placeholder="Masukkan pesan peringatan sopan saat pelanggan mengirim chat terlalu cepat..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500/50 resize-none"
                      />
                      <p className="text-[11px] text-slate-400">
                        Pesan ini akan dikirim otomatis satu kali ke pelanggan ketika mereka pertama kali memicu batas flood agar mereka memahami alasan bot memberi jeda.
                      </p>
                    </div>

                    {/* Blocked Users Table */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          <span>Daftar Nomor Sedang Di-Cooldown Spam ({blockedUsers.length})</span>
                        </h4>
                        {blockedUsers.length > 0 && (
                          <span className="text-[11px] text-rose-400 font-medium">
                            Auto-unblock setelah sisa waktu habis
                          </span>
                        )}
                      </div>

                      {blockedUsers.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                          <p className="text-xs font-medium text-slate-300">Tidak ada nomor yang sedang terblokir spam saat ini.</p>
                          <p className="text-[11px] text-slate-500">Semua aktivitas obrolan pengguna berjalan tertib dan aman.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                              <tr>
                                <th className="p-3.5">Nomor WhatsApp / JID</th>
                                <th className="p-3.5">Waktu Terdeteksi</th>
                                <th className="p-3.5">Sisa Cooldown</th>
                                <th className="p-3.5 text-right">Tindakan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                              {blockedUsers.map((user) => (
                                <tr key={user.jid} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="p-3.5 font-medium text-slate-200">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                      <span>{user.jid.replace('@s.whatsapp.net', '').replace('@lid', '')}</span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-slate-400">
                                    {new Date(user.blockedAt).toLocaleTimeString('id-ID')}
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                                      {user.remainingSeconds} detik lagi
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      onClick={() => handleUnblockUser(user.jid)}
                                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 text-[11px] transition-all"
                                    >
                                      Buka Blokir
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
                </div>
              )}

              {/* SUB-TAB 3: DEDUPLICATION & DEBOUNCE BUFFER */}
              {protectionsSubTab === 'dedup' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                          <Copy className="w-5 h-5 text-amber-400" />
                          <span>Anti-Pesan Kembar & Debounce Penggabungan Chat</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Menghilangkan pengiriman berulang karena klik dobel WhatsApp dan menggabungkan chat kalimat terpotong dari pelanggan.
                        </p>
                      </div>

                      {/* Enable Switch */}
                      <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/60">
                        <span className="text-xs font-medium text-slate-300">Status Deduplikasi:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(protectionsConfig.deduplication?.enabled)}
                          onChange={(e) => updateNestedProtections('deduplication', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 relative"></div>
                        <span className={`text-xs font-bold ${protectionsConfig.deduplication?.enabled ? 'text-amber-400' : 'text-slate-500'}`}>
                          {protectionsConfig.deduplication?.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inbound Window */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Jendela Filter Pesan Masuk Kembar</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {((protectionsConfig.deduplication?.content_window_ms || 3000) / 1000).toFixed(1)} detik ({protectionsConfig.deduplication?.content_window_ms || 3000} ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1000"
                          max="8000"
                          step="500"
                          value={protectionsConfig.deduplication?.content_window_ms || 3000}
                          onChange={(e) => updateNestedProtections('deduplication', 'content_window_ms', parseInt(e.target.value) || 3000)}
                          className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-400">
                          Jika pelanggan secara tidak sengaja menekan tombol kirim 2x untuk pesan yang sama persis, bot hanya akan menjawab 1 kali.
                        </p>
                      </div>

                      {/* Outbound Window */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Jendela Filter Pesan Keluar Kembar</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {((protectionsConfig.deduplication?.outbound_window_ms || 4000) / 1000).toFixed(1)} detik ({protectionsConfig.deduplication?.outbound_window_ms || 4000} ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1000"
                          max="10000"
                          step="500"
                          value={protectionsConfig.deduplication?.outbound_window_ms || 4000}
                          onChange={(e) => updateNestedProtections('deduplication', 'outbound_window_ms', parseInt(e.target.value) || 4000)}
                          className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-400">
                          Mencegah bot mengirim pesan jawaban yang persis sama ke nomor yang sama dalam waktu berdekatan.
                        </p>
                      </div>
                    </div>

                    {/* Section: Conversation Buffer / Debounce */}
                    <div className="pt-6 border-t border-slate-800 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span>Conversation Buffer (Debounce Penggabungan Pesan)</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Pelanggan di Indonesia sering mengetik terputus-putus seperti: "Halo min" (kirim), "karpet masjid ready?" (kirim), "bisa kirim hari ini?" (kirim).
                          </p>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/60">
                          <span className="text-xs font-medium text-slate-300">Status Buffer:</span>
                          <input
                            type="checkbox"
                            checked={Boolean(protectionsConfig.conversation_buffer?.enabled)}
                            onChange={(e) => updateNestedProtections('conversation_buffer', 'enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 relative"></div>
                          <span className={`text-xs font-bold ${protectionsConfig.conversation_buffer?.enabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {protectionsConfig.conversation_buffer?.enabled ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-200">Waktu Tunggu Debounce</label>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {((protectionsConfig.conversation_buffer?.debounce_ms || 2000) / 1000).toFixed(1)} detik ({protectionsConfig.conversation_buffer?.debounce_ms || 2000} ms)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1000"
                            max="5000"
                            step="500"
                            value={protectionsConfig.conversation_buffer?.debounce_ms || 2000}
                            onChange={(e) => updateNestedProtections('conversation_buffer', 'debounce_ms', parseInt(e.target.value) || 2000)}
                            className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                          />
                          <p className="text-[11px] text-slate-400">
                            Bot akan menunggu selama durasi ini setelah pesan terakhir sebelum meracik jawaban AI lengkap.
                          </p>
                        </div>

                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-200">Maksimum Item yang Ditampung</label>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {protectionsConfig.conversation_buffer?.max_buffer_items || 10} pesan berurutan
                            </span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="20"
                            step="1"
                            value={protectionsConfig.conversation_buffer?.max_buffer_items || 10}
                            onChange={(e) => updateNestedProtections('conversation_buffer', 'max_buffer_items', parseInt(e.target.value) || 10)}
                            className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                          />
                          <p className="text-[11px] text-slate-400">
                            Batas maksimal rentetan potongan chat yang digabungkan menjadi 1 prompt utuh untuk dijawab AI.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: GLOBAL RATE & CIRCUIT BREAKER */}
              {protectionsSubTab === 'global_rate' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="pb-4 border-b border-slate-800">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                        <Zap className="w-5 h-5 text-emerald-400" />
                        <span>Batas Pengiriman Global & Keamanan Circuit Breaker</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Menjaga volume kumulatif semua pesan keluar WhatsApp dari seluruh chat agar tidak memicu deteksi spam Meta dan menyediakan mekanisme penghentian otomatis saat terjadi kegagalan jaringan.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Global Rate Limit */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Batas Maksimal Pengiriman Global per Menit</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {protectionsConfig.cooldown?.global_max_per_minute || 25} pesan / menit
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="80"
                          step="5"
                          value={protectionsConfig.cooldown?.global_max_per_minute || 25}
                          onChange={(e) => updateNestedProtections('cooldown', 'global_max_per_minute', parseInt(e.target.value) || 25)}
                          className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Sangat Aman (10)</span>
                          <span>Standar Toko (25)</span>
                          <span>Tinggi (80)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Batas maksimal total pesan keluar WhatsApp dari bot ke seluruh nomor pelanggan dalam 1 menit. Jika melebihi batas ini, pengiriman berikutnya akan diantrikan otomatis.
                        </p>
                      </div>

                      {/* Retry Count */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Maksimal Percobaan Kirim Ulang (Retry)</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                            {protectionsConfig.retry_limit?.max_retries || 2} kali percobaan
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={protectionsConfig.retry_limit?.max_retries || 2}
                          onChange={(e) => updateNestedProtections('retry_limit', 'max_retries', parseInt(e.target.value) || 2)}
                          className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Jika socket WhatsApp terputus mendadak saat bot hendak membalas, bot akan mencoba mengulang kirim sesuai angka ini.
                        </p>
                      </div>

                      {/* Circuit Breaker Fail Threshold */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Ambang Batas Gagal Beruntun (Circuit Breaker)</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {protectionsConfig.retry_limit?.circuit_breaker_threshold || 3} kegagalan beruntun
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="10"
                          step="1"
                          value={protectionsConfig.retry_limit?.circuit_breaker_threshold || 3}
                          onChange={(e) => updateNestedProtections('retry_limit', 'circuit_breaker_threshold', parseInt(e.target.value) || 3)}
                          className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Jika pengiriman gagal berturut-turut hingga mencapai ambang batas ini, sistem akan memutus sirkuit untuk menghindari spamming socket yang rusak.
                        </p>
                      </div>

                      {/* Circuit Breaker Timeout */}
                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Durasi Istirahat Pemutus Sirkuit</label>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {Math.round((protectionsConfig.retry_limit?.circuit_breaker_timeout_ms || 60000) / 1000)} detik
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="180000"
                          step="10000"
                          value={protectionsConfig.retry_limit?.circuit_breaker_timeout_ms || 60000}
                          onChange={(e) => updateNestedProtections('retry_limit', 'circuit_breaker_timeout_ms', parseInt(e.target.value) || 60000)}
                          className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Waktu tunggu sebelum sistem mencoba mengalirkan kembali pesan setelah sirkuit terputus akibat kegagalan beruntun.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: COMPLIANCE & OPT-OUT KEYWORDS */}
              {protectionsSubTab === 'compliance' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                          <UserCheck className="w-5 h-5 text-purple-400" />
                          <span>Kepatuhan WhatsApp & Kata Kunci Stop (Opt-Out)</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Memberikan opsi kepada pelanggan untuk berhenti menerima pesan otomatis, memenuhi ketentuan resmi WhatsApp Commerce Policy.
                        </p>
                      </div>

                      {/* Enable Switch */}
                      <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/60">
                        <span className="text-xs font-medium text-slate-300">Status Kepatuhan:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(protectionsConfig.opt_in?.enabled)}
                          onChange={(e) => updateNestedProtections('opt_in', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 relative"></div>
                        <span className={`text-xs font-bold ${protectionsConfig.opt_in?.enabled ? 'text-purple-400' : 'text-slate-500'}`}>
                          {protectionsConfig.opt_in?.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    {/* Opt-Out Keywords */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-slate-200 block">
                            Kata Kunci Stop / Berhenti Chat (Opt-Out)
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Jika pelanggan mengirim salah satu kata ini, bot berhenti mengirim pesan otomatis.
                          </span>
                        </div>
                        <span className="text-xs font-bold text-purple-400">
                          {(protectionsConfig.opt_in?.opt_out_keywords || []).length} Kata Kunci
                        </span>
                      </div>

                      {/* Chips List */}
                      <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-slate-900 border border-slate-800">
                        {(protectionsConfig.opt_in?.opt_out_keywords || []).map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium"
                          >
                            <span>{keyword}</span>
                            <button
                              onClick={() => handleRemoveOptOutKeyword(keyword)}
                              className="text-rose-400 hover:text-rose-200 transition-colors p-0.5"
                              title="Hapus kata kunci"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tambah kata kunci baru (contoh: jangan kirim, unsub)..."
                          value={newOptOutKeyword}
                          onChange={(e) => setNewOptOutKeyword(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptOutKeyword(); } }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                        />
                        <button
                          onClick={handleAddOptOutKeyword}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>

                    {/* Opt-In Keywords */}
                    <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-slate-200 block">
                            Kata Kunci Mulai / Aktifkan Kembali (Opt-In)
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Mengizinkan pelanggan yang sebelumnya berhenti untuk kembali berinteraksi dengan bot.
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">
                          {(protectionsConfig.opt_in?.opt_in_keywords || []).length} Kata Kunci
                        </span>
                      </div>

                      {/* Chips List */}
                      <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-slate-900 border border-slate-800">
                        {(protectionsConfig.opt_in?.opt_in_keywords || []).map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium"
                          >
                            <span>{keyword}</span>
                            <button
                              onClick={() => handleRemoveOptInKeyword(keyword)}
                              className="text-emerald-400 hover:text-emerald-200 transition-colors p-0.5"
                              title="Hapus kata kunci"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tambah kata kunci mulai (contoh: halo lagi, aktifkan)..."
                          value={newOptInKeyword}
                          onChange={(e) => setNewOptInKeyword(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptInKeyword(); } }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        />
                        <button
                          onClick={handleAddOptInKeyword}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: SIMULATOR & TESTER */}
              {protectionsSubTab === 'tester' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                          <Sliders className="w-5 h-5 text-emerald-400" />
                          <span>Live Simulator & Pengujian Logika Anti-Spam</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Uji bagaimana sistem menghitung delay acak, simulasi mengetik, buffer penggabungan pesan, dan pemblokiran otomatis saat pelanggan melakukan klik spam beruntun.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSimAntiSpamCount(0); setSimAntiSpamLogs([]); }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Test</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Interactive Trigger Button */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Frekuensi Klik Pengujian</span>
                            <span className="font-bold text-emerald-400">{simAntiSpamCount} Pesan</span>
                          </div>
                          <div className="text-sm font-semibold text-white">
                            Simulasi Chat Pelanggan Masuk
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Klik tombol di bawah ini beberapa kali secara cepat untuk melihat bagaimana algoritma bereaksi saat menerima pesan beruntun dari satu pengguna.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={handleSimulateAntiSpamSend}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
                              isSimulatingSpam
                                ? 'bg-emerald-400 text-slate-950 scale-95'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                            }`}
                          >
                            <Send className="w-4 h-4" />
                            <span>Kirim Chat Uji Coba (+1)</span>
                          </button>
                          
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 text-center">
                            Batas flood saat ini: <strong className="text-rose-400 font-semibold">{protectionsConfig.flood_protection?.max_messages_per_minute || 15} pesan/menit</strong>
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Feed Log */}
                      <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-3 min-h-[320px]">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Log Respon Anti-Spam Real-Time</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {simAntiSpamLogs.length} event tercatat
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                          {simAntiSpamLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-500">
                              <Sliders className="w-8 h-8 opacity-40 text-emerald-400" />
                              <p className="text-xs font-medium text-slate-400">Belum ada pengujian simulasi yang dijalankan.</p>
                              <p className="text-[11px]">Klik tombol "Kirim Chat Uji Coba" di sebelah kiri untuk melihat evaluasi delay & proteksi secara langsung.</p>
                            </div>
                          ) : (
                            simAntiSpamLogs.map((log, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border text-xs font-mono transition-all animate-in fade-in duration-150 ${
                                  log.status === 'BLOCKED_FLOOD'
                                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                                    : log.status === 'BUFFERED'
                                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold opacity-80 mb-1">
                                  <span>{log.time}</span>
                                  <span className="uppercase tracking-wider">#{log.count} - {log.status}</span>
                                </div>
                                <div className="text-slate-200 font-sans text-xs">{log.text}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sticky Footer Bar with Save Actions */}
              <div className="sticky bottom-4 z-30 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sinkronisasi Perlindungan WhatsApp</h4>
                    <p className="text-[11px] text-slate-400">
                      Perubahan konfigurasi tersimpan langsung ke server backend & proteksi runtime.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleLoadProtectionsDefaults}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                  >
                    Pulihkan Standar Aman
                  </button>

                  <button
                    onClick={() => handleSaveProtections()}
                    disabled={savingProtections}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                  >
                    {savingProtections ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Semua Pengaturan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* ADD / EDIT FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingFaq ? 'Edit Tanya Jawab AI' : 'Tambah Tanya Jawab AI'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Data ini akan langsung diserap ke dalam memori sistem AI Groq & Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFaqModal(false);
                  setEditingFaq(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pertanyaan dari Pelanggan (Question)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={faqForm.q}
                  onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                  placeholder="Contoh: Apakah karpet polos ready stock dan bisa langsung dikirim?"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Kategori Topik</label>
                  <select
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Karpet Masjid & Musholla">🕌 Karpet Masjid & Musholla</option>
                    <option value="Pemasangan & Obras">✂️ Pemasangan & Obras</option>
                    <option value="Survey & Sampel">📏 Survey & Sampel</option>
                    <option value="Promo & Diskon">🏷️ Promo & Diskon</option>
                    <option value="Garansi & Keaslian">🛡️ Garansi & Keaslian</option>
                    <option value="Nego & Pembayaran">💳 Nego & Pembayaran</option>
                    <option value="Ketersediaan Stok">📦 Ketersediaan Stok</option>
                    <option value="Komplain & Retur">⚠️ Komplain & Retur</option>
                    <option value="Umum">📌 Pertanyaan Umum</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Sumber Informasi</label>
                  <input
                    type="text"
                    value={faqForm.source}
                    onChange={(e) => setFaqForm({ ...faqForm, source: e.target.value })}
                    placeholder="Contoh: Input Admin / Chat WhatsApp Pelanggan"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jawaban Rekomendasi Resmi AI & CS (Answer)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.a}
                  onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                  placeholder="Tuliskan jawaban yang ramah, sopan, jelas, dan solutif yang akan disampaikan AI kepada pelanggan..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowFaqModal(false);
                    setEditingFaq(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={faqSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {faqSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  <span>{faqSaving ? 'Menyimpan...' : 'Simpan & Ajari AI'}</span>
                </button>
              </div>
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
                activeTab === 'tickets' || activeTab === 'complaint' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <ShieldAlert className="w-5 h-5" />
                {tickets.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-purple-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {tickets.length}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Komplain & CS</span>
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
              onClick={() => setActiveTab('qna')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                activeTab === 'qna' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="text-[10px]">Q&A AI</span>
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
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Kelola Komplain & Layanan CS #{selectedTicket.id}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('id-ID') : 'Laporan Aktif'}
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
      {/* MODAL: BUAT TIKET KOMPLAIN & CS */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Buat Tiket Komplain & Layanan CS</h3>
                  <p className="text-[11px] text-slate-400">Input keluhan atau permohonan layanan via WhatsApp, telepon, atau walk-in</p>
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
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">No. WhatsApp / Kontak</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={newTicketForm.contact}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Kategori Layanan</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Pengaduan Produk">🚨 Pengaduan & Komplain</option>
                    <option value="Klaim Garansi">🛡️ Klaim Garansi</option>
                    <option value="Pembelian Produk">🛒 Konsultasi / Pesanan</option>
                    <option value="Layanan Umum">💬 Layanan CS Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prioritas</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Mendesak (Urgent)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Status Awal</label>
                  <select
                    value={newTicketForm.status}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Open">Open (Menunggu CS)</option>
                    <option value="In Progress">In Progress (Diproses)</option>
                    <option value="Resolved">Resolved (Tuntas)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Rincian Keluhan / Permohonan Layanan <span className="text-rose-400">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan secara detail keluhan karpet, jahitan obras, klaim garansi, atau permohonan pelanggan..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Catatan Internal Petugas CS (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan penanganan untuk tim survey, admin CS, atau teknisi obras..."
                  value={newTicketForm.notes}
                  onChange={(e) => setNewTicketForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submittingNewTicket}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-900/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingNewTicket ? 'Menyimpan Tiket...' : 'Terbitkan Tiket Komplain / CS'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto transform animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">
                    {editingProduct ? `Edit Produk: ${editingProduct.title}` : 'Tambah Produk Baru ke Katalog'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Otomatis tersinkronisasi ke Bot WhatsApp & memori AI Gemini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Tempat Upload Foto Produk */}
              <div className="space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Foto Produk</span>
                  </label>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WEBP (Maks. 5MB)</span>
                </div>

                {imagePreview ? (
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 relative shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Preview Foto Produk"
                        onError={(e) => {
                          e.target.src = '/catalog/karpet-masjid-turki.jpg';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {productForm.imageBase64 ? 'Foto Baru Berhasil Dipilih' : 'Foto Produk Aktif'}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Foto ini akan ditampilkan pada pesan WhatsApp bot & katalog web.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Ganti Foto</span>
                        </button>
                        {productForm.imageBase64 && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm((prev) => ({ ...prev, imageBase64: '' }));
                              setImagePreview(editingProduct?.image ? (editingProduct.image.startsWith('http') ? editingProduct.image : `/${editingProduct.image.replace(/^assets\//, '')}`) : null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-[11px] font-medium transition cursor-pointer"
                          >
                            Batal Ganti
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer?.files?.[0];
                      if (file) processImageFile(file);
                    }}
                    className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/70 rounded-2xl p-4 bg-slate-900/50 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-3.5 text-center sm:text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition shrink-0 shadow-sm">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                        Klik untuk upload foto atau seret file gambar ke sini
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mendukung format JPG, PNG, atau WEBP hingga 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kategori Karpet <span className="text-rose-400">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAddCategory}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Kategori Baru</span>
                  </button>
                </div>
                <select
                  value={productForm.category || (carpetCategoriesList[0]?.name || 'Karpet Masjid & Musholla')}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition cursor-pointer"
                >
                  {carpetCategoriesList.map((c) => (
                    <option key={c.name} value={c.name} className="bg-slate-900 text-white py-1">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Title (Full Width) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <span>Nama Produk Karpet</span>
                  <span className="text-rose-400">*</span>
                </label>
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
                  placeholder="Contoh: Karpet Minimalis Scandinavia Nordic Line"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              {/* Grid 2 Cols: Price & SKU Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Harga Produk</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="Contoh: Rp 1.450.000"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-xs text-emerald-400 font-semibold placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Kode SKU Produk</label>
                    <span className="text-[10px] text-slate-500">(Opsional)</span>
                  </div>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: NORDIC-SCANDI"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Color & Size Variants (Full Width) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Pilihan Warna & Ukuran (Varian)</label>
                  <span className="text-[10px] text-slate-500">Info varian untuk bot</span>
                </div>
                <input
                  type="text"
                  value={productForm.footer}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, footer: e.target.value }))}
                  placeholder="Contoh: Warna: Warm Beige, Ivory Cream & Charcoal | Ukuran: 160x230cm, 200x300cm"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              {/* Subtitle / Description (Full Width) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Deskripsi Singkat / Spesifikasi</label>
                  <span className="text-[10px] text-slate-500">Pengetahuan produk AI</span>
                </div>
                <textarea
                  rows={3}
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Contoh: Karpet ruang tamu modern minimalis bertekstur lembut, anti-slip backing, motif geometris kontemporer chic. Sangat nyaman untuk ruang keluarga."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700/80 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 leading-relaxed font-sans transition resize-none"
                />
              </div>

              {/* Product Web URL (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link URL Produk (Opsional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Tautan website/marketplace</span>
                </div>
                <input
                  type="text"
                  value={productForm.url}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://sultancarpet.co.id/products/karpet-nordic-scandi"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono text-[11px] transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer border border-slate-700/50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-950/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{savingProduct ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Simpan Produk Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KATEGORI BARU */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-slate-700/80 p-6 shadow-2xl space-y-5 transform animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Tambah Kategori Baru</h3>
                  <p className="text-xs text-slate-400">Klasifikasi produk karpet untuk katalog & bot AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Karpet Hotel & Ballroom"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Deskripsi Kategori</label>
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Tuliskan keterangan singkat mengenai jenis atau karakteristik karpet dalam kategori ini..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingCategory ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Kategori</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KIRIM PESAN PRODUK KE RIWAYAT CHAT */}
      {showSendProductModal && selectedProductToSend && (() => {
        const prod = selectedProductToSend;
        const cleanImg = (prod.image || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '');
        const imgSrc = cleanImg.startsWith('http') || cleanImg.startsWith('data:') ? cleanImg : `/${cleanImg}`;

        // Deduplicate and filter conversations
        const filteredRecipients = [];
        const seenRecipients = new Set();
        const searchQ = (sendProductChatSearch || '').trim().toLowerCase();

        for (const conv of conversations) {
          const key = conv.jid || conv.phone;
          if (!key || seenRecipients.has(key)) continue;

          if (searchQ) {
            const name = (conv.senderName || '').toLowerCase();
            const phone = (conv.phone || '').toLowerCase();
            const formatted = (conv.formattedPhone || '').toLowerCase();
            if (!name.includes(searchQ) && !phone.includes(searchQ) && !formatted.includes(searchQ)) {
              continue;
            }
          }

          seenRecipients.add(key);
          filteredRecipients.push(conv);
        }

        const activeRecipientName = selectedChatRecipient
          ? ((selectedChatRecipient.senderName && !/^\+?\d{10,}$/.test(selectedChatRecipient.senderName.trim()))
              ? selectedChatRecipient.senderName.trim()
              : (selectedChatRecipient.formattedPhone || (selectedChatRecipient.phone ? `+${selectedChatRecipient.phone}` : 'Nomor Pelanggan')))
          : (manualPhoneInput.trim() ? manualPhoneInput.trim() : null);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl bg-[#0f172a] border border-slate-700/80 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Kirim Pesan Produk</h3>
                    <p className="text-xs text-slate-400">Pilih riwayat chat pelanggan WhatsApp untuk mengirim informasi produk ini</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSendProductModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {/* 1. Selected Product Preview Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0">
                      <img
                        src={imgSrc}
                        alt={prod.title}
                        onError={(e) => { e.target.src = '/catalog/karpet-masjid-turki.jpg'; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate">{prod.title}</h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                          {prod.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{prod.subtitle || prod.category}</p>
                      <span className="font-mono text-[10px] text-slate-500">{prod.code || `PROD-${prod.id}`}</span>
                    </div>
                  </div>

                  {prod.image && (
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/70 hover:bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 transition shrink-0">
                      <input
                        type="checkbox"
                        checked={includeProductImage}
                        onChange={(e) => setIncludeProductImage(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium">Sertakan foto produk</span>
                    </label>
                  )}
                </div>

                {/* 2. Chat Recipient Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pilih Riwayat Chat Pelanggan ({conversations.length} Tersedia)</span>
                    </label>
                    {activeRecipientName && (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="truncate max-w-[200px]">Terpilih: {activeRecipientName}</span>
                      </span>
                    )}
                  </div>

                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={sendProductChatSearch}
                      onChange={(e) => setSendProductChatSearch(e.target.value)}
                      placeholder="Cari nama kontak pelanggan atau nomor HP..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {sendProductChatSearch && (
                      <button
                        type="button"
                        onClick={() => setSendProductChatSearch('')}
                        className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Conversation List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-800/80 rounded-2xl p-2 bg-slate-900/40">
                    {filteredRecipients.length === 0 ? (
                      <div className="p-5 text-center text-slate-500 space-y-1">
                        <MessageSquare className="w-6 h-6 mx-auto text-slate-600 opacity-60" />
                        <p className="text-xs text-slate-400 font-medium">
                          {sendProductChatSearch ? 'Kontak riwayat chat tidak ditemukan' : 'Belum ada riwayat chat pelanggan'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Anda dapat memasukkan nomor WhatsApp tujuan secara manual pada kolom di bawah.
                        </p>
                      </div>
                    ) : (
                      filteredRecipients.map((c, idx) => {
                        const isSelected = selectedChatRecipient && !manualPhoneInput.trim() && (
                          (selectedChatRecipient.jid && selectedChatRecipient.jid === c.jid) ||
                          (selectedChatRecipient.phone && selectedChatRecipient.phone === c.phone)
                        );
                        const rawName = c.senderName && !/^\+?\d{10,}$/.test(c.senderName.trim()) ? c.senderName.trim() : null;
                        const contactName = rawName || (c.formattedPhone && !c.formattedPhone.includes('LID') ? c.formattedPhone : 'Pelanggan');
                        const phoneLabel = c.formattedPhone && !c.formattedPhone.includes('LID') ? c.formattedPhone : (c.phone ? `+${c.phone}` : '');
                        const initialChar = (contactName ? contactName.charAt(0) : 'P').toUpperCase();

                        let snippet = '';
                        if (typeof c.lastMessage === 'string') {
                          snippet = c.lastMessage;
                        } else if (c.lastMessage && typeof c.lastMessage === 'object') {
                          snippet = c.lastMessage.text || c.lastMessage.caption || (c.lastMessage.type ? `[${c.lastMessage.type}]` : '');
                        }

                        return (
                          <div
                            key={c.jid || c.phone || `rcpt_${idx}`}
                            onClick={() => {
                              setSelectedChatRecipient(c);
                              setManualPhoneInput('');
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {initialChar}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-white text-xs truncate">{contactName}</h5>
                                  {phoneLabel && (
                                    <span className="text-[10px] text-slate-400 font-mono">{phoneLabel}</span>
                                  )}
                                </div>
                                {snippet && (
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{snippet}</p>
                                )}
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-700 bg-slate-800/50'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Fallback Manual Phone Input */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 shrink-0">Atau ke nomor baru:</span>
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2" />
                      <input
                        type="text"
                        value={manualPhoneInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualPhoneInput(val);
                          if (val.trim()) {
                            let clean = val.replace(/\D/g, '');
                            if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                            setSelectedChatRecipient({
                              phone: clean,
                              senderName: 'Nomor WhatsApp Baru',
                              formattedPhone: val
                            });
                          }
                        }}
                        placeholder="Contoh: 081298765432..."
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Message Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">Isi Pesan WhatsApp (Dapat Diedit)</label>
                    <span className="text-[10px] text-slate-500 font-mono">{sendProductMessageText.length} karakter</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sendProductMessageText}
                    onChange={(e) => setSendProductMessageText(e.target.value)}
                    placeholder="Tulis pesan detail produk..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-y"
                  />
                </div>

                {/* 4. WhatsApp Bot Connection Status */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                      {isConnected
                        ? `Bot WhatsApp Terhubung (+${botStatus.user?.id || 'Aktif'})`
                        : 'Bot WhatsApp offline (pengiriman akan dibuka via WhatsApp Web)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSendProductModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const phone = selectedChatRecipient?.phone || manualPhoneInput;
                      if (!phone) {
                        showToastMsg('Pilih riwayat chat atau masukkan nomor telepon terlebih dahulu', 'warning');
                        return;
                      }
                      sendDirectWaMessage(phone, sendProductMessageText);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    title="Kirim secara manual melalui tautan WhatsApp Web (wa.me)"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp Web</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendProductToChat}
                    disabled={isSendingProductMessage || (!selectedChatRecipient && !manualPhoneInput.trim())}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingProductMessage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOMER PROFILE MODAL */}
      {showProfileModal && profileTarget && (() => {
        const rawModalName = profileTarget.senderName && !/^\+?\d{10,}$/.test(profileTarget.senderName.trim())
          ? profileTarget.senderName.trim()
          : null;
        const modalHasRealPhone = profileTarget.phone && !/^\d{14,}$/.test(profileTarget.phone) && !profileTarget.phone.includes('@lid');
        const modalFormattedPhone = profileTarget.formattedPhone && !profileTarget.formattedPhone.includes('LID') && profileTarget.formattedPhone !== '-'
          ? profileTarget.formattedPhone
          : (modalHasRealPhone
              ? (profileTarget.phone.startsWith('+') ? profileTarget.phone : `+${profileTarget.phone}`)
              : '-');
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

      {/* MODAL: DETAIL & CHUNKS WEBSITE CRAWLER */}
      {viewingCrawlPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1329] border border-slate-700/80 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate" title={viewingCrawlPage.title}>
                    {viewingCrawlPage.title || 'Detail Halaman Scraping'}
                  </h3>
                  <a
                    href={viewingCrawlPage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{viewingCrawlPage.url}</span>
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCrawlPage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Chunks */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
                <span>
                  Total <strong>{viewingCrawlPage.chunks?.length || 0}</strong> Potongan Semantik (RAG Chunks)
                </span>
                <span className="text-[11px]">
                  Terakhir discraping: {viewingCrawlPage.crawledAt ? new Date(viewingCrawlPage.crawledAt).toLocaleString('id-ID') : '-'}
                </span>
              </div>

              {(!viewingCrawlPage.chunks || viewingCrawlPage.chunks.length === 0) ? (
                <div className="p-8 text-center text-slate-500">
                  Tidak ada potongan teks tersimpan.
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingCrawlPage.chunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-300">
                          Chunk #{idx + 1} {chunk.heading ? `• ${chunk.heading}` : ''}
                        </span>
                        <span className="text-slate-500">{chunk.content?.length || 0} karakter</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-sans whitespace-pre-wrap bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <button
                onClick={() => {
                  const id = viewingCrawlPage.id;
                  setViewingCrawlPage(null);
                  handleDeleteCrawledPage(id);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Halaman Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingCrawlPage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
