'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Store,
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
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  X,
  Upload,
  Image as ImageIcon,
  CheckCheck,  Reply,  MessageCircle,
  Mic,
  Video as VideoIcon,
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
  Palette,
  Link as LinkIcon
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'gemini' | 'qr' | 'tickets' | 'catalog' | 'store_profile' | 'schedule' | 'location' | 'warranty' | 'promo' | 'complaint' | 'settings'

  // Mobile Navigation & View States
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Desktop Collapsible Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [openSidebarGroups, setOpenSidebarGroups] = useState({
    store: true,
    settings: true,
  });

  const toggleSidebarGroup = (groupKey) => {
    setOpenSidebarGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  useEffect(() => {
    if (['store_profile', 'catalog', 'schedule', 'location', 'warranty', 'promo'].includes(activeTab)) {
      setOpenSidebarGroups((prev) => ({ ...prev, store: true }));
    } else if (['gemini', 'qna', 'handoff', 'settings'].includes(activeTab)) {
      setOpenSidebarGroups((prev) => ({ ...prev, settings: true }));
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboard_sidebar_collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch (e) {}
  }, []);

  const toggleSidebar = () => {
    setHoveredNav(null);
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dashboard_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

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
      text: 'Halo Kak, ya tentu saja. Teknisi Rumah Indah Carpet Gallery membawa mesin obras portable ke lokasi masjid Anda sehingga pemotongan presisi mengikuti sudut pilar dan arah shaf kiblat dengan sangat rapi. Ada yang dapat kami bantu untuk survey lokasi atau sampel karpet?',
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
    name: 'Rumah Indah Carpet Gallery',
    owner: 'H. Ahmad Fauzi & Hj. Maryam',
    tagline: 'Pusat Karpet Masjid Turki, Karpet Ruang Tamu Mewah & Karpet Kantor Elegan',
    phone: '0812-9876-5432',
    phone_cs: '0811-2345-6789',
    email: 'info@rumahindahcarpet.co.id',
    website: 'https://rumahindahcarpet.co.id',
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
  const [faqImporting, setFaqImporting] = useState(false);
  const excelFileInputRef = useRef(null);
  const [faqCustomCategories, setFaqCustomCategories] = useState([]);
  const [showFaqCategoryModal, setShowFaqCategoryModal] = useState(false);
  const [editingFaqCategory, setEditingFaqCategory] = useState(null);
  const [faqCategoryNameInput, setFaqCategoryNameInput] = useState('');
  const [savingFaqCategory, setSavingFaqCategory] = useState(false);

  const defaultFaqCategories = [
    'Karpet Masjid & Musholla',
    'Pemasangan & Obras',
    'Survey & Sampel',
    'Promo & Diskon',
    'Garansi & Keaslian',
    'Nego & Pembayaran',
    'Ketersediaan Stok',
    'Komplain & Retur',
    'Umum'
  ];

  const allFaqCategories = React.useMemo(() => {
    const baseCats = (Array.isArray(faqCustomCategories) && faqCustomCategories.length > 0)
      ? faqCustomCategories
      : (Array.isArray(config?.faq_categories) && config.faq_categories.length > 0)
      ? config.faq_categories
      : defaultFaqCategories;
    const set = new Set(baseCats);
    (faqs || []).forEach((f) => {
      if (f.category && f.category.trim()) set.add(f.category.trim());
    });
    return Array.from(set);
  }, [config?.faq_categories, faqCustomCategories, faqs]);

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
    story: 'Didirikan pada tahun 2012 oleh H. Ahmad Fauzi dan Hj. Maryam, berawal dari kecintaan terhadap keindahan seni rajut karpet Turki dan Persia. Kini Rumah Indah Carpet Gallery telah melayani lebih dari 1.500 masjid di seluruh Indonesia, ribuan hunian mewah, serta ratusan kantor korporat multinasional.',
    phone: '0812-9876-5432',
    email: 'owner@rumahindahcarpet.co.id',
    commitment: 'Kami berkomitmen menghadirkan produk karpet 100% original berkualitas grade A dengan harga transparan, diiringi layanan purnajual terbaik, survey gratis, dan garansi penuh.'
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    store_hours: 'Senin - Sabtu: 08:30 - 20:00 WIB\nMinggu & Hari Libur: 09:00 - 18:00 WIB',
    cs_hours: 'Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB\n(Chat di luar jam kerja admin dilayani otomatis oleh AI Chatbot 24 jam nonstop)',
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
        title: 'Galeri Rumah Indah Carpet Bandung',
        address: 'Jl. L.L.R.E. Martadinata (Riau) No. 82, Citarum, Bandung 40115',
        landmark: 'Samping Heritage Factory Outlet, seberang Bank Mandiri',
        hours: 'Senin - Minggu: 09:00 - 20:00 WIB',
        phone: '0813-2233-4455',
        maps_url: 'https://maps.google.com/?q=Bandung+Riau'
      },
      {
        id: 'loc-4',
        type: 'Cabang Gallery',
        title: 'Galeri Rumah Indah Carpet Surabaya',
        address: 'Jl. Mayjen HR. Muhammad No. 102, Pradahkalikendal, Dukuhpakis, Surabaya 60226',
        landmark: 'Dekat bundaran HR Muhammad, seberang Mayapada Hospital',
        hours: 'Senin - Minggu: 09:00 - 20:00 WIB',
        phone: '0821-3344-5566',
        maps_url: 'https://maps.google.com/?q=Surabaya+HR+Muhammad'
      }
    ]
  });

  const [warrantySettings, setWarrantySettings] = useState({
    title: 'Jaminan Kualitas & Garansi Resmi Rumah Indah Carpet',
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
        valid_until: '01/11/2026 sampai 30/11/2026'
      },
      {
        id: 'PROMO-RUMAH',
        title: 'Promo Gebyar Karpet Rumah Minimalis',
        discount: 'Cashback Rp 200.000 + Free Keset Mewah',
        desc: 'Beli karpet ruang tamu Nordic Scandinavia atau Bulu Shaggy, gratis keset kaki memory foam microfiber anti-slip premium.',
        valid_until: '01/11/2026 sampai 15/12/2026'
      },
      {
        id: 'PROMO-KANTOR',
        title: 'Paket Renovasi Karpet Kantor & Komersial',
        discount: 'Gratis Pemasangan untuk Luas > 100 m²',
        desc: 'Pemesanan karpet tile komersial heavy duty diatas 100 m² mendapatkan gratis lem khusus karpet dan jasa pasang teknisi berpengalaman.',
        valid_until: '01/11/2026 sampai 31/12/2026'
      },
      {
        id: 'PROMO-SURVEY',
        title: 'Layanan Survey & Bawa Sampel GRATIS',
        discount: 'Gratis 100% Tanpa Syarat',
        desc: 'Bingung memilih motif dan mengukur ruangan? Tim kami siap datang membawakan contoh bahan karpet fisik dan melakukan pengukuran langsung ke lokasi Anda (Jabodetabek).',
        valid_until: '01/11/2026 sampai 31/12/2026'
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
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');

  // Helper: parse "DD/MM/YYYY" to "YYYY-MM-DD"
  const parseDMYtoYMD = (dmy) => {
    if (!dmy) return '';
    const match = String(dmy).trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  // Helper: format "YYYY-MM-DD" to "DD/MM/YYYY"
  const formatYMDtoDMY = (ymd) => {
    if (!ymd) return '';
    const parts = String(ymd).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  // Helper to update promoForm.valid_until from start and end dates
  const handlePromoDateRangeChange = (startYMD, endYMD) => {
    setPromoStartDate(startYMD);
    setPromoEndDate(endYMD);
    if (startYMD && endYMD) {
      const startDMY = formatYMDtoDMY(startYMD);
      const endDMY = formatYMDtoDMY(endYMD);
      setPromoForm((prev) => ({ ...prev, valid_until: `${startDMY} sampai ${endDMY}` }));
    } else if (startYMD) {
      setPromoForm((prev) => ({ ...prev, valid_until: formatYMDtoDMY(startYMD) }));
    }
  };

  const [promoForm, setPromoForm] = useState({
    id: '',
    title: '',
    discount: '',
    desc: '',
    valid_until: '01/11/2026 sampai 30/11/2026'
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
  const [showCategoryCards, setShowCategoryCards] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
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
    images: [],
    imageBase64: '',
  });
  const [imagePreview, setImagePreview] = useState('/catalog/karpet-masjid-turki.jpg');
  const [activeUploadSlot, setActiveUploadSlot] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const fileInputRef = useRef(null);

  // Send Product to WhatsApp Chat State & Modal
  const [showSendProductModal, setShowSendProductModal] = useState(false);
  const [selectedProductToSend, setSelectedProductToSend] = useState(null);
  const [selectedPromoToSend, setSelectedPromoToSend] = useState(null);
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

  // Customer Specific Ticket Process & Menu States
  const [ticketMenuOpen, setTicketMenuOpen] = useState(false);
  const [showCustomerTicketsModal, setShowCustomerTicketsModal] = useState(false);
  const [customerTicketFilter, setCustomerTicketFilter] = useState('all'); // 'all' | 'process' | 'resolved'
  const ticketDropdownRef = useRef(null);

  // Close ticket dropdown when clicking outside
  useEffect(() => {
    function handleClickOutsideTicketDropdown(event) {
      if (ticketDropdownRef.current && !ticketDropdownRef.current.contains(event.target)) {
        setTicketMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideTicketDropdown);
    return () => document.removeEventListener('mousedown', handleClickOutsideTicketDropdown);
  }, []);

  // Compute tickets belonging specifically to the active conversation customer
  const activeCustomerTickets = React.useMemo(() => {
    if (!activeConversation) return [];
    const cleanPhone = String(activeConversation.phone || '').replace(/\D/g, '');
    const jid = activeConversation.jid;
    const name = (activeConversation.senderName || '').trim().toLowerCase();

    return (tickets || []).filter((t) => {
      const tSenderClean = String(t.sender || '').replace(/\D/g, '');
      const tContactClean = String(t.contact || '').replace(/\D/g, '');

      const isPhoneMatch = cleanPhone && (
        tSenderClean === cleanPhone ||
        tContactClean === cleanPhone ||
        (cleanPhone.length >= 8 && tSenderClean.endsWith(cleanPhone.slice(-8))) ||
        (cleanPhone.length >= 8 && tContactClean.endsWith(cleanPhone.slice(-8))) ||
        (tSenderClean.length >= 8 && cleanPhone.endsWith(tSenderClean.slice(-8))) ||
        (tContactClean.length >= 8 && cleanPhone.endsWith(tContactClean.slice(-8)))
      );
      const isJidMatch = jid && (t.sender === jid || t.contact === jid);
      const isNameMatch = name && name !== 'pelanggan' && t.name && t.name.toLowerCase() === name;

      return isPhoneMatch || isJidMatch || isNameMatch;
    });
  }, [tickets, activeConversation]);

  const inProgressCustomerTickets = React.useMemo(() => {
    return activeCustomerTickets.filter((t) => {
      const s = (t.status || 'Open').toLowerCase();
      return s === 'open' || s.includes('progress') || s.includes('menunggu');
    });
  }, [activeCustomerTickets]);

  const resolvedCustomerTickets = React.useMemo(() => {
    return activeCustomerTickets.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'resolved' || s === 'closed' || s === 'selesai';
    });
  }, [activeCustomerTickets]);

  const filteredCustomerTickets = React.useMemo(() => {
    return activeCustomerTickets.filter((t) => {
      if (customerTicketFilter === 'process') {
        const s = (t.status || 'Open').toLowerCase();
        return s === 'open' || s.includes('progress') || s.includes('menunggu');
      }
      if (customerTicketFilter === 'resolved') {
        const s = (t.status || '').toLowerCase();
        return s === 'resolved' || s === 'closed' || s === 'selesai';
      }
      return true;
    });
  }, [activeCustomerTickets, customerTicketFilter]);

  // Customer Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingAiJid, setTogglingAiJid] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Hands-Off (Human Handoff & CS Takeover) State
  const [handoffConfig, setHandoffConfig] = useState({
    enabled: true,
    keywords: ['cs', 'admin', 'operator', 'manusia', 'orang', 'live agent', 'bantuan manusia'],
    release_keywords: ['!bot', 'aktifkan bot', 'kembali ke bot', 'bot', 'menu', 'selesai'],
    auto_expire_hours: 2,
    takeover_notice: 'Halo! Permintaan Anda telah kami teruskan ke Customer Service Rumah Indah Carpet. Tim kami akan segera merespons Anda.',
    release_notice: 'Bot asisten Rumah Indah Carpet telah aktif kembali. Silakan ketik pertanyaan atau konsultasi karpet Anda.'
  });
  const [savingHandoffConfig, setSavingHandoffConfig] = useState(false);
  const [handoffSubTab, setHandoffSubTab] = useState('rules'); // 'rules' | 'tester'
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
      normal_delay_ms: 60000,
      long_delay_ms: 75000,
      min_delay_ms: 60000,
      max_delay_ms: 75000,
      long_threshold: 160,
      jitter_ms: 3000,
      typing_simulation: true,
      typing_speed_cpm: 300,
      global_max_per_minute: 20,
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
    fetchFaqCategories();
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

    eventSource.addEventListener('faq_categories_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) setFaqCustomCategories(data);
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
          if (!item || !Array.isArray(item.messages) || item.messages.length === 0) continue;
          const hasRealMessage = item.messages.some(
            (m) => m && m.id && !m.id.startsWith('sync_init_') && !m.id.startsWith('contact_init_')
          );
          if (!hasRealMessage) continue;
          const k = item.jid || item.phone;
          if (k && !seen.has(k)) {
            seen.add(k);
            unique.push(item);
          }
        }
        setConversations(unique);
        if (unique.length > 0 && (!selectedChatJid || !unique.some(c => c.jid === selectedChatJid || c.phone === selectedChatJid))) {
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
        setBusinessSettings({
          ...data.business,
          phone: (data.business.phone || '').replace(/\D/g, '')
        });
      }
      if (data.owner_info) {
        setOwnerSettings(data.owner_info);
      }
      if (data.schedule_info) {
        setScheduleSettings((prev) => ({
          ...prev,
          ...data.schedule_info,
          cs_hours: data.schedule_info.cs_hours || prev.cs_hours || 'Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB\n(Chat di luar jam kerja admin dilayani otomatis oleh AI Chatbot 24 jam nonstop)'
        }));
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
      if (data.faq_categories && Array.isArray(data.faq_categories)) {
        setFaqCustomCategories(data.faq_categories);
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
        min_delay_ms: 55000,
        max_delay_ms: 65000,
        jitter_ms: 8000,
        typing_simulation: true,
        typing_speed_cpm: 300,
        global_max_per_minute: 20
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

  const handleSaveStoreProfile = async () => {
    if (!config) return;

    // Validasi Nomor WhatsApp: Hanya boleh angka & minimal 9 digit
    const cleanPhone = (businessSettings.phone || '').trim().replace(/\D/g, '');
    if (!cleanPhone) {
      showToastMsg('Nomor WhatsApp wajib diisi hanya dengan angka!', 'error');
      return;
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      showToastMsg('Nomor WhatsApp harus terdiri dari 9 hingga 15 digit angka!', 'error');
      return;
    }

    // Validasi Email: Wajib format email yang valid
    const cleanEmail = (businessSettings.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      showToastMsg('Email toko wajib diisi!', 'error');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      showToastMsg('Format email tidak valid! Harap masukkan email yang benar (contoh: info@rumahindahcarpet.co.id)', 'error');
      return;
    }

    const updatedBusiness = {
      ...(config.business || {}),
      name: (businessSettings.name || '').trim(),
      phone: cleanPhone,
      email: cleanEmail,
      description: (businessSettings.description || '').trim()
    };
    const updatedOwner = {
      ...(config.owner_info || {}),
      owner_name: (businessSettings.name || '').trim() || config.owner_info?.owner_name,
      phone: cleanPhone,
      email: cleanEmail,
      story: (businessSettings.description || '').trim()
    };
    const updated = {
      ...config,
      business: updatedBusiness,
      owner_info: updatedOwner
    };
    setSavingStoreInfo(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(updated);
        setBusinessSettings(updatedBusiness);
        setOwnerSettings(updatedOwner);
        showToastMsg('Profil toko berhasil disimpan!', 'success');
      } else {
        showToastMsg(data.error || 'Gagal menyimpan profil toko', 'error');
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
    let validUntil = promoForm.valid_until;
    if (promoStartDate && promoEndDate) {
      validUntil = `${formatYMDtoDMY(promoStartDate)} sampai ${formatYMDtoDMY(promoEndDate)}`;
    } else if (promoStartDate) {
      validUntil = formatYMDtoDMY(promoStartDate);
    }
    const dataToSave = { ...promoForm, valid_until: validUntil || 'Tersedia' };
    const currentPromos = [...(promoSettings.active_promos || [])];
    if (editingPromoIndex !== null) {
      currentPromos[editingPromoIndex] = dataToSave;
    } else {
      const newId = `PROMO-${Date.now().toString().slice(-4)}`;
      currentPromos.push({ ...dataToSave, id: promoForm.id || newId });
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
        "Anda adalah Rumah Indah Carpet Assistant, asisten resmi Rumah Indah Carpet Gallery yang terintegrasi dengan data RAG. Tugas Anda menjawab pertanyaan pelanggan secara ringkas, ramah, dan fokus HANYA pada data RAG yang tersedia. Jawab selalu dalam 1 paragraf pendek (maksimal 2-3 kalimat) to-the-point. DILARANG KERAS menyebutkan kode produk internal (seperti MASJID-TURKI-A, NORDIC-SCANDI, dll.) atau meminta kode produk kepada pelanggan karena katalog toko kita tidak memakai kode produk; selalu gunakan nama produk secara alami. DILARANG KERAS memuat informasi tambahan yang tidak ditanyakan (jangan sebut nomor telepon, promo, survey gratis, garansi, atau jam buka kecuali jika pelanggan menanyakannya secara spesifik). DILARANG KERAS menggunakan simbol bintang (*) atau emoji apapun. DILARANG menyuruh pelanggan mengetik format kaku seperti 'Ketik CS' atau 'Ketik ORDER'. Jika pelanggan meminta berbicara dengan staf manusia, sampaikan dengan santun bahwa percakapan dialihkan ke Customer Service. Jika pelanggan secara eksplisit meminta foto fisik karpet, berikan penjelasan singkat dan sertakan tag [KIRIM_FOTO: KODE_PRODUK] di akhir pesan."
      );
      showToastMsg('Preset Simple & RAG Fokus diterapkan!', 'success');
    } else if (type === 'survey') {
      setSystemPrompt(
        "Anda adalah Konsultan Teknis Rumah Indah Carpet Gallery spesialis karpet masjid & hunian mewah terintegrasi RAG. Fokus utama Anda adalah mengarahkan pelanggan untuk menjadwalkan SURVEY LOKASI GRATIS, pengukuran kiblat & luas masjid, pembawaan sampel bahan fisik karpet Turki ke lokasi pemesan, dan estimasi waktu potong sambung obras di tempat. Berikan penjelasan yang meyakinkan, santun, dan tanpa simbol bintang (*) maupun emoji."
      );
      showToastMsg('Preset Fokus Survey diterapkan!', 'success');
    } else if (type === 'concise') {
      setSystemPrompt(
        "Anda adalah CS Rumah Indah Carpet Gallery yang efisien, to-the-point, dan ramah terintegrasi RAG. Berikan jawaban cepat, padat, dan jelas mengenai harga karpet per roll/meter, stok katalog, dan kontak CS resmi. Tanpa basa-basi berlebih, tanpa simbol bintang (*), dan tanpa emoji."
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
        category: prefill.category || '',
        source: prefill.source || (prefill.senderName ? `WhatsApp: ${prefill.senderName}` : 'Chat WhatsApp Pelanggan')
      });
      setEditingFaq(null);
    } else {
      setFaqForm({
        id: '',
        q: '',
        a: '',
        category: '',
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
      category: faq.category || '',
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
    const cleanCategory = (faqForm.category || '').trim() || 'Umum';
    const payload = {
      ...faqForm,
      category: cleanCategory,
      q: faqForm.q.trim(),
      a: faqForm.a.trim(),
      source: (faqForm.source || '').trim() || 'Input Admin'
    };
    setFaqSaving(true);
    try {
      let res;
      if (editingFaq) {
        res = await fetch(`/api/faqs/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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

  const handleDownloadFaqTemplate = () => {
    try {
      const templateData = [
        {
          'Pertanyaan': 'Apakah karpet masjid bisa dipotong dan diobras langsung di lokasi masjid?',
          'Jawaban': 'Ya, betul. Tim teknisi Rumah Indah Carpet membawa mesin obras portable langsung ke lokasi masjid Anda sehingga pemotongan dan obras dilakukan presisi mengikuti pilar dan arah shaf kiblat.',
          'Kategori': 'Pemasangan & Obras'
        },
        {
          'Pertanyaan': 'Bagaimana ketentuan garansi karpet di Rumah Indah Carpet Gallery?',
          'Jawaban': 'Kami memberikan garansi keaslian 100% serat benang import Turki dan garansi kerapian jahitan obras selama 1 tahun. Jika ada sambungan obras lepas, tim kami siap servis gratis.',
          'Kategori': 'Garansi & Keaslian'
        },
        {
          'Pertanyaan': 'Apakah melayani survey lokasi dan membawakan sampel karpet?',
          'Jawaban': 'Tentu! Kami menyediakan layanan survey gratis untuk wilayah Jabodetabek. Tim kami membawakan sampel ketebalan karpet dan mengukur luas ruangan masjid secara presisi.',
          'Kategori': 'Survey & Sampel'
        },
        {
          'Pertanyaan': 'Berapa minimal pemesanan karpet custom roll di Rumah Indah Carpet?',
          'Jawaban': 'Minimal pemesanan karpet custom roll adalah 1 roll (panjang 6 meter x lebar 1.2 meter). Untuk ukuran ruangan khusus dapat dikonsultasikan langsung bersama tim CS kami.',
          'Kategori': 'Karpet Masjid & Musholla'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      worksheet['!cols'] = [
        { wch: 45 },
        { wch: 65 },
        { wch: 25 }
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Tanya Jawab AI');
      XLSX.writeFile(workbook, 'template_tanya_jawab_ai.xlsx');
      showToastMsg('Template Excel berhasil diunduh! Silakan isi lalu upload kembali.', 'success');
    } catch (err) {
      console.warn('Client-side Excel generation fallback:', err);
      window.location.href = '/api/faqs/template';
    }
  };

  const handleUploadExcelFaq = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar dapat memilih file yang sama jika user mengeditnya
    e.target.value = '';

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      showToastMsg('Format file tidak didukung. Harap upload file Excel .xlsx, .xls, atau .csv', 'error');
      return;
    }

    setFaqImporting(true);
    showToastMsg('Membaca & memproses file Excel...', 'info');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        showToastMsg('File Excel kosong atau tidak memiliki baris data.', 'error');
        setFaqImporting(false);
        return;
      }

      const parsedItems = [];
      for (const row of rawRows) {
        let q = '';
        let a = '';
        let category = 'Karpet Masjid & Musholla';

        for (const [key, val] of Object.entries(row)) {
          const cleanKey = String(key || '').trim().toLowerCase();
          const strVal = String(val !== undefined && val !== null ? val : '').trim();

          if (
            cleanKey.includes('pertanyaan') ||
            cleanKey.includes('tanya') ||
            cleanKey.includes('soal') ||
            cleanKey === 'q' ||
            cleanKey === 'question'
          ) {
            if (!q) q = strVal;
          } else if (
            cleanKey.includes('jawaban') ||
            cleanKey.includes('jawab') ||
            cleanKey.includes('balasan') ||
            cleanKey === 'a' ||
            cleanKey === 'answer'
          ) {
            if (!a) a = strVal;
          } else if (
            cleanKey.includes('kategori') ||
            cleanKey.includes('category') ||
            cleanKey.includes('topik') ||
            cleanKey.includes('topic')
          ) {
            if (strVal) category = strVal;
          }
        }

        // Fallback jika nama kolom tidak cocok tapi ada data di baris
        if (!q && !a && Object.values(row).length >= 2) {
          const values = Object.values(row).map((v) => String(v || '').trim());
          if (values[0] && values[1]) {
            q = values[0];
            a = values[1];
            if (values[2]) category = values[2];
          }
        }

        if (q && a) {
          parsedItems.push({
            q,
            a,
            category: category || 'Umum',
            source: `Import Excel: ${file.name}`
          });
        }
      }

      if (parsedItems.length === 0) {
        showToastMsg('Tidak ditemukan data Tanya & Jawab valid. Pastikan kolom "Pertanyaan" dan "Jawaban" terisi.', 'error');
        setFaqImporting(false);
        return;
      }

      // Simpan ke database/sistem: coba batch endpoint lebih dulu
      let savedSuccessfully = false;
      let finalFaqs = null;
      let addedCount = 0;
      let updatedCount = 0;

      try {
        const batchRes = await fetch('/api/faqs/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: parsedItems })
        });
        if (batchRes.ok) {
          const batchData = await batchRes.json();
          if (batchData.success) {
            savedSuccessfully = true;
            finalFaqs = batchData.faqs;
            addedCount = batchData.addedCount;
            updatedCount = batchData.updatedCount;
          }
        }
      } catch (e) {
        // Fallback jika batch belum respons
      }

      // Fallback: simpan berurutan via POST /api/faqs jika batch belum tersedia
      if (!savedSuccessfully) {
        for (const item of parsedItems) {
          try {
            const res = await fetch('/api/faqs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
            const data = await res.json();
            if (data.success && data.faqs) {
              finalFaqs = data.faqs;
              addedCount++;
            }
          } catch (err) {}
        }
        if (addedCount > 0) savedSuccessfully = true;
      }

      if (savedSuccessfully) {
        if (finalFaqs) {
          setFaqs(finalFaqs);
        } else {
          fetchFaqs();
        }
        showToastMsg(
          `🎉 Sukses! ${addedCount} Tanya-Jawab baru berhasil ditambahkan${updatedCount > 0 ? ` & ${updatedCount} diperbarui` : ''} dari file Excel!`,
          'success'
        );
        fetchCustomerQuestions();
      } else {
        showToastMsg('Gagal menyimpan data Tanya-Jawab ke server.', 'error');
      }
    } catch (err) {
      console.error('Error importing Excel FAQ:', err);
      showToastMsg('Gagal memproses file Excel: ' + err.message, 'error');
    } finally {
      setFaqImporting(false);
    }
  };

  const handleOpenAddFaqCategory = () => {
    setEditingFaqCategory(null);
    setFaqCategoryNameInput('');
    setShowFaqCategoryModal(true);
  };

  const handleSaveFaqCategory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanName = (faqCategoryNameInput || '').trim();
    if (!cleanName) {
      showToastMsg('Nama kategori wajib diisi!', 'error');
      return;
    }
    setSavingFaqCategory(true);
    try {
      let saved = false;
      let newCats = [...allFaqCategories];
      let newFaqs = [...faqs];

      if (editingFaqCategory) {
        const oldName = editingFaqCategory;
        try {
          const res = await fetch(`/api/faqs/categories/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName: cleanName })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data.success) {
              saved = true;
              if (data.categories) setFaqCustomCategories(data.categories);
              if (data.faqs) setFaqs(data.faqs);
            }
          }
        } catch (_) {}

        if (!saved) {
          newCats = newCats.map((c) => (c.toLowerCase() === oldName.toLowerCase() ? cleanName : c));
          if (!newCats.some((c) => c.toLowerCase() === cleanName.toLowerCase())) newCats.push(cleanName);
          newFaqs = newFaqs.map((f) => (f.category && f.category.toLowerCase() === oldName.toLowerCase() ? { ...f, category: cleanName } : f));

          const cfgRes = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...config, faq_categories: newCats, faqs: newFaqs })
          });
          const cfgData = await cfgRes.json();
          if (cfgData.success) {
            saved = true;
            setFaqCustomCategories(newCats);
            setFaqs(newFaqs);
            setConfig((prev) => ({ ...prev, faq_categories: newCats, faqs: newFaqs }));
          }
        }
      } else {
        try {
          const res = await fetch('/api/faqs/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: cleanName })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data.success) {
              saved = true;
              if (data.categories) setFaqCustomCategories(data.categories);
            }
          }
        } catch (_) {}

        if (!saved) {
          if (!newCats.some((c) => c.toLowerCase() === cleanName.toLowerCase())) newCats.push(cleanName);
          const cfgRes = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...config, faq_categories: newCats })
          });
          const cfgData = await cfgRes.json();
          if (cfgData.success) {
            saved = true;
            setFaqCustomCategories(newCats);
            setConfig((prev) => ({ ...prev, faq_categories: newCats }));
          }
        }
      }

      if (saved) {
        showToastMsg(
          editingFaqCategory 
            ? `Kategori "${cleanName}" berhasil diperbarui!` 
            : `Kategori "${cleanName}" berhasil ditambahkan!`,
          'success'
        );
        setShowFaqCategoryModal(false);
        setEditingFaqCategory(null);
        if (editingFaqCategory && faqCategoryFilter.toLowerCase() === editingFaqCategory.toLowerCase()) {
          setFaqCategoryFilter(cleanName);
        }
      } else {
        showToastMsg('Gagal menyimpan kategori', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingFaqCategory(false);
    }
  };

  const handleDeleteFaqCategory = async (catName) => {
    const ok = await askConfirmation({
      title: `Hapus Kategori "${catName}"?`,
      message: 'Kategori ini akan dihapus dari Knowledge Base. Tanya-jawab yang ada di kategori ini akan dialihkan ke kategori "Umum".',
      confirmText: 'Hapus Kategori',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;

    try {
      let deleted = false;
      try {
        const res = await fetch(`/api/faqs/categories/${encodeURIComponent(catName)}`, {
          method: 'DELETE'
        });
        if (res && res.ok) {
          const data = await res.json();
          if (data.success) {
            deleted = true;
            if (data.categories) setFaqCustomCategories(data.categories);
            if (data.faqs) setFaqs(data.faqs);
          }
        }
      } catch (_) {}

      if (!deleted) {
        const newCats = allFaqCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
        const newFaqs = faqs.map((f) => (f.category && f.category.toLowerCase() === catName.toLowerCase() ? { ...f, category: 'Umum' } : f));

        const cfgRes = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...config, faq_categories: newCats, faqs: newFaqs })
        });
        const cfgData = await cfgRes.json();
        if (cfgData.success) {
          deleted = true;
          setFaqCustomCategories(newCats);
          setFaqs(newFaqs);
          setConfig((prev) => ({ ...prev, faq_categories: newCats, faqs: newFaqs }));
        }
      }

      if (deleted) {
        showToastMsg(`Kategori "${catName}" berhasil dihapus`, 'success');
        if (faqCategoryFilter.toLowerCase() === catName.toLowerCase()) {
          setFaqCategoryFilter('Semua');
        }
      } else {
        showToastMsg('Gagal menghapus kategori', 'error');
      }
    } catch (err) {
      showToastMsg('Error: ' + err.message, 'error');
    }
  };

  const fetchFaqCategories = async () => {
    try {
      const res = await fetch('/api/faqs/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.customCategories)) {
          setFaqCustomCategories(data.customCategories);
        } else if (Array.isArray(data.categories)) {
          setFaqCustomCategories(data.categories);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat kategori faq:', e.message);
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
    const configuredCategories = Array.isArray(config?.carpet_categories)
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
      .filter((catName) => catName && catName !== 'Umum' && !configuredCategories.some((c) => c.name.toLowerCase() === catName.toLowerCase()))
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
      image: '',
      images: [],
      imageBase64: '',
    });
    setImagePreview(null);
    setActiveUploadSlot(null);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    let initialImages = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      initialImages = product.images.slice(0, 6);
    } else if (product.image) {
      initialImages = [product.image];
    }
    const cleanImg = (product.image || initialImages[0] || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '');
    setProductForm({
      category: product.category || (carpetCategoriesList[0]?.name || 'Karpet Masjid & Musholla'),
      title: product.title || '',
      code: product.code || '',
      price: product.price || '',
      subtitle: product.subtitle || '',
      footer: product.footer || '',
      url: product.url || '',
      image: product.image || initialImages[0] || 'catalog/karpet-masjid-turki.jpg',
      images: initialImages,
      imageBase64: '',
    });
    setImagePreview(cleanImg.startsWith('http') || cleanImg.startsWith('data:') ? cleanImg : `/${cleanImg}`);
    setActiveUploadSlot(null);
    setShowProductModal(true);
  };

  const handleTriggerUpload = (slotIndex = null) => {
    setActiveUploadSlot(slotIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const processImageFiles = (files, slotIndex = null) => {
    if (!files || files.length === 0) return;

    // Filter by max 5MB
    const validFiles = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        showToastMsg(`Foto "${f.name}" melebihi ukuran maksimal 5MB`, 'error');
      } else {
        validFiles.push(f);
      }
    }
    if (validFiles.length === 0) return;

    // If a specific slot is targeted and only 1 file is selected: replace that slot
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < 6 && validFiles.length === 1) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm((prev) => {
          const newImages = [...(prev.images || [])];
          newImages[slotIndex] = reader.result;
          const finalImgs = newImages.slice(0, 6);
          return {
            ...prev,
            images: finalImgs,
            image: finalImgs[0] || ''
          };
        });
        showToastMsg(`Foto ke-${slotIndex + 1} berhasil diperbarui`, 'success');
      };
      reader.readAsDataURL(validFiles[0]);
      return;
    }

    // Otherwise, append to existing images up to max 6
    let readersFinished = 0;
    const readResults = [];

    validFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        readResults[i] = reader.result;
        readersFinished++;
        if (readersFinished === validFiles.length) {
          setProductForm((prev) => {
            const currentImages = [...(prev.images || [])];
            const combined = [...currentImages, ...readResults.filter(Boolean)].slice(0, 6);
            if (combined.length === 6 && (currentImages.length + validFiles.length) > 6) {
              showToastMsg('Maksimal 6 foto produk telah tercapai', 'info');
            } else {
              showToastMsg(`${readResults.filter(Boolean).length} foto berhasil ditambahkan`, 'success');
            }
            return {
              ...prev,
              images: combined,
              image: combined[0] || ''
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processImageFiles(files, activeUploadSlot);
    }
  };

  const handleRemoveProductImage = (indexToRemove) => {
    setProductForm((prev) => {
      const filtered = (prev.images || []).filter((_, i) => i !== indexToRemove);
      return {
        ...prev,
        images: filtered,
        image: filtered[0] || ''
      };
    });
    showToastMsg('Foto berhasil dihapus', 'info');
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    setProductForm((prev) => {
      const current = [...(prev.images || [])];
      if (indexToPrimary < 0 || indexToPrimary >= current.length) return prev;
      const [selected] = current.splice(indexToPrimary, 1);
      const reordered = [selected, ...current];
      return {
        ...prev,
        images: reordered,
        image: reordered[0] || ''
      };
    });
    showToastMsg('Foto utama berhasil diubah (★ Utama)', 'success');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const rawPriceDigits = String(productForm.price || '').replace(/\D/g, '');
    if (!productForm.title.trim()) {
      showToastMsg('Nama produk wajib diisi!', 'error');
      return;
    }
    if (!rawPriceDigits || Number(rawPriceDigits) <= 0) {
      showToastMsg('Harga produk wajib diisi hanya dengan angka yang valid (lebih dari 0)!', 'error');
      return;
    }

    const formattedPrice = `Rp ${Number(rawPriceDigits).toLocaleString('id-ID')}`;
    setSavingProduct(true);
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/catalog/${editingProduct.id}` : '/api/catalog';
      const method = isEdit ? 'PUT' : 'POST';

      const imagesPayload = productForm.images && productForm.images.length > 0
        ? productForm.images
        : (productForm.image ? [productForm.image] : ['catalog/karpet-masjid-turki.jpg']);

      const payload = {
        ...productForm,
        price: formattedPrice,
        image: imagesPayload[0] || 'catalog/karpet-masjid-turki.jpg',
        images: imagesPayload
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || ''
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const cleanName = categoryForm.name.trim();
    if (!cleanName) {
      showToastMsg('Nama kategori wajib diisi!', 'error');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        name: cleanName,
        description: categoryForm.description.trim() || `Koleksi karpet pilihan ${cleanName} Rumah Indah Carpet Gallery.`
      };
      if (editingCategory?.id) {
        payload.id = editingCategory.id;
      }

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(
          editingCategory 
            ? `Kategori "${cleanName}" berhasil diperbarui!` 
            : `Kategori "${cleanName}" berhasil ditambahkan!`, 
          'success'
        );
        setShowCategoryModal(false);
        setEditingCategory(null);
        if (data.categories) {
          setConfig((prev) => prev ? { 
            ...prev, 
            carpet_categories: data.categories,
            catalog: data.catalog || prev.catalog
          } : prev);
        }
        if (editingCategory && selectedCatalogCategory === editingCategory.name) {
          setSelectedCatalogCategory(cleanName);
        }
        if (showProductModal) {
          setProductForm((prev) => ({ ...prev, category: cleanName }));
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
      message: 'Kategori ini akan dihapus dari sistem. Produk yang sebelumnya menggunakan kategori ini akan dialihkan ke kategori "Umum".',
      confirmText: 'Hapus Kategori',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/categories/${catId}?name=${encodeURIComponent(catName || '')}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Kategori "${catName}" berhasil dihapus`, 'success');
        if (data.categories) {
          setConfig((prev) => prev ? { 
            ...prev, 
            carpet_categories: data.categories,
            catalog: data.catalog || prev.catalog
          } : prev);
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

  const handleOpenSendPromoModal = (promo) => {
    if (!promo) return;
    setSelectedPromoToSend(promo);
    setSelectedProductToSend(null);

    const storeName = businessSettings?.name || ownerSettings?.business_name || 'Rumah Indah Carpet';
    const lines = [
      `Halo! Berikut informasi penawaran promo spesial dari *${storeName}*:`,
      '',
      `🔥 *${promo.title || 'Promo Spesial'}*`,
      promo.discount ? `🎁 *Penawaran:* ${promo.discount}` : '',
      promo.desc ? `📝 *Keterangan:* ${promo.desc}` : '',
      promo.valid_until ? `⏰ *Masa Berlaku:* ${promo.valid_until}` : '',
      '',
      `Bila Anda berminat memanfaatkan promo ini atau ingin konsultasi pemesanan, silakan balas pesan ini ya! Terima kasih. 🙏`
    ].filter((line) => line !== null && line !== undefined && line !== '').join('\n');

    setSendProductMessageText(lines);
    setIncludeProductImage(false);
    setSendProductChatSearch('');
    setManualPhoneInput('');

    const activeConv = conversations.find(
      (c) => (c.jid && c.jid === selectedChatJid) || c.phone === selectedChatJid
    );
    setSelectedChatRecipient(activeConv || (conversations.length > 0 ? conversations[0] : null));

    setShowSendProductModal(true);
  };

  const handleOpenSendProductModal = (product) => {
    if (!product) return;
    setSelectedProductToSend(product);
    setSelectedPromoToSend(null);

    const storeName = businessSettings?.name || ownerSettings?.business_name || 'Rumah Indah Carpet';
    const lines = [
      `Halo! Berikut informasi detail produk karpet dari *${storeName}*:`,
      '',
      `🕌 *${product.title || 'Produk Karpet'}*`,
      product.price ? `💰 *Harga:* ${product.price}` : '',
      product.category ? `✨ *Kategori:* ${product.category}` : '',
      product.subtitle ? `📝 *Deskripsi:* ${product.subtitle}` : '',
      product.footer ? `🎨 *Keunggulan / Motif:* ${product.footer}` : '',
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
    const isPromo = Boolean(selectedPromoToSend);
    const senderTitle = isPromo ? 'Admin (Promo & Diskon)' : 'Admin (Katalog Produk)';
    const senderShort = isPromo ? 'Admin (Promo)' : 'Admin (Katalog)';
    const clientMsgId = `prod_${Date.now()}`;
    const targetKey = recipientJid || recipientPhone;

    // Optimistically update conversation in local state
    const optimisticMsg = {
      id: clientMsgId,
      text: sendProductMessageText,
      sender: senderShort,
      senderName: senderTitle,
      direction: 'out',
      timestamp: new Date().toISOString(),
      status: 'pending',
      mediaType: (!isPromo && includeProductImage && selectedProductToSend?.image) ? 'image' : 'text'
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
          senderName: senderTitle,
          clientMessageId: clientMsgId,
          image: (!isPromo && includeProductImage && selectedProductToSend?.image) ? selectedProductToSend.image : null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToastMsg('Gagal mengirim ke WhatsApp: ' + (data.error || 'Terjadi kesalahan'), 'error');
      } else {
        showToastMsg(
          isPromo
            ? `Pesan promo berhasil dikirim ke ${targetRecipientName}!`
            : `Pesan produk berhasil dikirim ke ${targetRecipientName}!`,
          'success'
        );
        setShowSendProductModal(false);
        setSelectedProductToSend(null);
        setSelectedPromoToSend(null);
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
        message: 'Tidak ada kata kunci hands-off yang terdeteksi. Pesan akan dijawab oleh Bot AI Rumah Indah Carpet menggunakan AI Knowledge Base.',
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
            description: selectedTicket.description || 'Rincian tiket',
            status: selectedTicket.status || 'Open',
            notes: selectedTicket.notes || '',
            category: ticketCategoryUpdate || 'Layanan Umum',
            priority: ticketPriorityUpdate || 'Normal',
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
          description: selectedTicket.description,
          category: ticketCategoryUpdate,
          priority: ticketPriorityUpdate,
        }),
      });
      const updated = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(null);
      showToastMsg('Rincian tiket berhasil disimpan!', 'success');
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
    let clean = String(contact || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }

    // Cari percakapan di daftar riwayat chat yang cocok dengan nomor atau nama
    const found = conversations.find((c) => {
      const cJidClean = (c.jid || '').replace(/\D/g, '');
      const cPhoneClean = (c.phone || '').replace(/\D/g, '');
      const matchPhone = clean && (cJidClean.includes(clean) || clean.includes(cJidClean) || cPhoneClean.includes(clean) || clean.includes(cPhoneClean));
      const matchName = name && c.name && c.name.toLowerCase().trim() === String(name).toLowerCase().trim();
      return matchPhone || matchName;
    });

    if (found) {
      setSelectedChatJid(found.jid || found.phone);
    } else if (clean) {
      const targetJid = clean.includes('@') ? clean : `${clean}@s.whatsapp.net`;
      setSelectedChatJid(targetJid);
    }

    // Arahkan ke tab Obrolan WhatsApp (riwayat chat)
    setActiveTab('chats');
    setMobileChatOpen(true);
    showToastMsg(`Membuka riwayat chat ${name || contact || ''}...`, 'success');
  };

  // Helper to format WhatsApp markdown and media tags into HTML
  const formatWaText = (text) => {
    if (!text) return '';
    let s = String(text);

    // Hapus seluruh teks placeholder foto atau pelanggan tanpa konten
    if (
      /^\[Foto(\s+pelanggan)?\]$/i.test(s.trim()) ||
      s.trim().toLowerCase() === 'pelanggan' ||
      s.trim().toLowerCase() === '[foto terkirim]'
    ) {
      return '';
    }

    // Ekstrak hanya caption foto jika ada, hapus badge "Foto Diterima" dan kata "pelanggan"
    s = s.replace(/\[Foto(?::\s*([^\]]*)|(\s+pelanggan)?)\]/gi, (match, caption) => {
      const cap = (caption || '').trim();
      if (!cap || cap.toLowerCase() === 'pelanggan') return '';
      return cap;
    });

    s = s.replace(/\[Foto Terkirim\]/gi, '');
    s = s.trim();
    if (!s || s.toLowerCase() === 'pelanggan') return '';

    s = s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format media indicators (videos, stickers, docs, voice)
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

    s = s.replace(/\*([^*\n]+)\*/g, '<strong class="font-bold">$1</strong>');
    s = s.replace(/_([^_\n]+)_/g, '<em class="italic opacity-90">$1</em>');
    s = s.replace(/~([^~\n]+)~/g, '<del class="line-through opacity-75">$1</del>');
    return s.trim();
  };

  // Helper to format conversation list preview snippets (cleanly showing photos, videos, voice notes)
  const formatSnippet = (msg) => {
    if (!msg) return 'Mulai percakapan';
    const text = typeof msg === 'string' ? msg : (msg.text || '');
    const isVideo = typeof msg === 'object' && Boolean(msg.video || msg.mediaType === 'video' || (text && text.includes('[Video')));
    const isAudio = typeof msg === 'object' && Boolean(msg.audio || msg.mediaType === 'audio' || (text && text.includes('[Pesan Suara]')));
    const hasImage = typeof msg === 'object' && Boolean(msg.image || msg.mediaType === 'image' || (text && text.includes('[Foto')));

    let cleanText = text
      .replace(/^\[Foto(?::\s*|\s+pelanggan\]?|\]?)/i, '')
      .replace(/^\[Video(?::\s*|\s+pelanggan\]?|\]?)/i, '')
      .replace(/^\[Pesan Suara\]/i, '')
      .replace(/\]$/, '')
      .trim();
    if (
      cleanText.toLowerCase() === 'pelanggan' ||
      cleanText.toLowerCase() === '[foto pelanggan]' ||
      cleanText.toLowerCase() === '[foto]' ||
      cleanText.toLowerCase() === '[foto terkirim]' ||
      cleanText.toLowerCase() === '[video]' ||
      cleanText.toLowerCase() === '[video pelanggan]' ||
      cleanText.toLowerCase() === '[pesan suara]'
    ) {
      cleanText = '';
    }

    if (isVideo) {
      return cleanText ? `🎬 ${cleanText}` : '🎬 Video';
    }
    if (isAudio) {
      return '🎙️ Pesan Suara';
    }
    if (hasImage) {
      return cleanText ? `📷 ${cleanText}` : '📷 Foto';
    }
    return cleanText || 'Mulai percakapan';
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

  const storeSubItems = [
    { id: 'store_profile', label: 'Profil Toko', icon: Store, iconColor: 'text-purple-400', dotColor: 'bg-[#7C3AED]' },
    { id: 'catalog', label: 'Katalog Produk', icon: ShoppingBag, iconColor: 'text-pink-400', dotColor: 'bg-[#EC4899]', count: config?.catalog?.length || 5 },
    { id: 'schedule', label: 'Jadwal & Jam Kerja', icon: Clock, iconColor: 'text-sky-400', dotColor: 'bg-[#38BDF8]' },
    { id: 'location', label: 'Lokasi & Alamat', icon: MapPin, iconColor: 'text-rose-400', dotColor: 'bg-[#EF4444]' },
    { id: 'warranty', label: 'Ketentuan Garansi', icon: ShieldCheck, iconColor: 'text-indigo-400', dotColor: 'bg-[#6366F1]' },
    { id: 'promo', label: 'Promo & Diskon', icon: Tag, iconColor: 'text-amber-400', dotColor: 'bg-[#F59E0B]' },
  ];

  const settingsSubItems = [
    { id: 'gemini', label: 'AI Studio', icon: Bot, iconColor: 'text-purple-400', dotColor: 'bg-[#7C3AED]' },
    { id: 'qna', label: 'Knowledge Base', icon: BookOpen, iconColor: 'text-pink-400', dotColor: 'bg-[#EC4899]', count: faqs.length > 0 ? faqs.length : null },
    { id: 'handoff', label: 'Hands-Off', icon: UserCheck, iconColor: 'text-amber-400', dotColor: 'bg-[#F59E0B]', count: activeHandoffCount > 0 ? activeHandoffCount : null },
    { id: 'settings', label: 'Anti-Spam', icon: ShieldAlert, iconColor: 'text-rose-400', dotColor: 'bg-[#EF4444]' },
  ];

  const isStoreGroupActive = storeSubItems.some((s) => s.id === activeTab);
  const isSettingsGroupActive = settingsSubItems.some((s) => s.id === activeTab);

  const navigationSections = [
    {
      title: 'MENU',
      items: [
        {
          id: 'chats',
          label: 'Obrolan WhatsApp',
          icon: MessageSquare,
          isActive: activeTab === 'chats',
        },
        {
          id: 'store_group',
          groupKey: 'store',
          label: 'Informasi Toko',
          icon: Building,
          isActive: isStoreGroupActive,
          children: storeSubItems,
        },
        {
          id: 'qr',
          label: 'Koneksi WhatsApp',
          icon: QrCode,
          isActive: activeTab === 'qr',
          statusDot: isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse',
        },
        {
          id: 'tickets',
          label: 'Pusat Komplain & CS',
          icon: Headphones,
          isActive: activeTab === 'tickets' || activeTab === 'complaint',
          countBadge: tickets.length > 0 ? tickets.length : null,
        },
      ]
    },
    {
      title: 'OTHER',
      items: [
        {
          id: 'settings_group',
          groupKey: 'settings',
          label: 'Pengaturan',
          icon: Settings,
          isActive: isSettingsGroupActive,
          countBadge: activeHandoffCount > 0 ? activeHandoffCount : null,
          children: settingsSubItems,
        },
      ]
    }
  ];

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-[#0E0F12] text-slate-100 relative antialiased font-sans">
      {/* Ambient Radial Lights in Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7C3AED]/[0.04] rounded-full blur-[130px]" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#EC4899]/[0.03] rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[350px] bg-white/[0.02] rounded-full blur-[140px]" />
      </div>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 border ${
            toast.type === 'success'
              ? 'bg-emerald-600 border-emerald-500/50 text-white shadow-lg shadow-black/40'
              : toast.type === 'error'
              ? 'bg-rose-600 border-rose-500/50 text-white shadow-lg shadow-rose-950/50'
              : toast.type === 'warning' || toast.type === 'process'
              ? 'bg-amber-500 border-amber-500/50 text-white shadow-lg shadow-amber-950/50'
              : 'bg-sky-600 border-sky-500/50 text-white shadow-lg shadow-sky-950/50'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
          {toast.type === 'info' && <Zap className="w-5 h-5 text-white" />}
          {(toast.type === 'warning' || toast.type === 'process') && <Clock className="w-5 h-5 text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Custom In-App Confirmation Modal Pop-up (Replaces native browser localhost confirm/alerts) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#141518] border border-white/[0.07] rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 shadow-black/90 flex flex-col gap-5 transform animate-in zoom-in-95 duration-200"
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
                <h3 className="text-lg font-bold text-slate-100 tracking-tight leading-snug">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mt-1.5 font-medium">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={confirmModal.onCancel}
                className="px-4 py-2.5 rounded-xl border border-white/[0.07] bg-[#181A1F] hover:bg-[#22242A] text-slate-100 font-semibold text-sm transition cursor-pointer"
              >
                {confirmModal.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-lg ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                    : confirmModal.type === 'info'
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-950/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-950/50'
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
          <div className="w-4/5 max-w-xs bg-[#141518] border-r border-white/[0.06] shadow-2xl flex flex-col h-[100dvh] max-h-screen animate-in slide-in-from-left duration-200 z-50">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] shrink-0 bg-[#141518]">
              <div className="flex items-center gap-2.5">
                <Bot className="w-6 h-6 text-white" />
                <h1 className="font-bold text-sm text-white tracking-tight">Dashboard Chatbot</h1>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <span className="text-sm font-mono tracking-tighter font-bold">&laquo;</span>
              </button>
            </div>

            {/* Scrollable Drawer Body: Nav + Footer */}
            <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] overscroll-contain flex flex-col justify-between">
              <nav className="space-y-1">
                {navigationSections.map((sec, sIdx) => (
                  <div key={sIdx} className={sIdx > 0 ? 'mt-3 pt-3 border-t border-white/[0.06]' : ''}>
                    {sec.title && (
                      <div className="px-6 pt-2 pb-2">
                        <p className="text-[10px] uppercase font-semibold tracking-[0.16em] text-zinc-500">{sec.title}</p>
                      </div>
                    )}
                    <div className="px-3 space-y-1">
                      {sec.items.map((item) => {
                        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                        const isGroupOpen = hasChildren && openSidebarGroups[item.groupKey];
                        const isCurrent = item.isActive;

                        return (
                          <div key={item.id} className="space-y-1">
                            <button
                              onClick={() => {
                                if (hasChildren) {
                                  toggleSidebarGroup(item.groupKey);
                                } else {
                                  setActiveTab(item.id);
                                  setMobileDrawerOpen(false);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] transition-all cursor-pointer ${
                                isCurrent || isGroupOpen
                                  ? 'bg-[#22242A] text-white font-semibold'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isCurrent || isGroupOpen ? 'text-white' : 'text-zinc-500'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.statusDot && <span className={`w-2 h-2 rounded-full ${item.statusDot}`} />}
                                {item.countBadge && (
                                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-[#141518] text-xs font-extrabold flex items-center justify-center shadow-sm">
                                    {item.countBadge}
                                  </span>
                                )}
                                {hasChildren && (
                                  isGroupOpen ? (
                                    <ChevronUp className="w-4 h-4 text-zinc-300" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                  )
                                )}
                              </div>
                            </button>

                            {/* Sub-items with Icons */}
                            {hasChildren && isGroupOpen && (
                              <div className="space-y-0.5 py-1">
                                {item.children.map((sub) => {
                                  const isSubCurrent = activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setActiveTab(sub.id);
                                        setMobileDrawerOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between pl-9 pr-4 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer ${
                                        isSubCurrent
                                          ? 'text-white font-semibold bg-white/[0.06]'
                                          : 'text-zinc-400 hover:text-white font-normal'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        {sub.icon ? (
                                          <sub.icon className={`w-4 h-4 shrink-0 ${sub.iconColor || 'text-zinc-400'}`} />
                                        ) : (
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${sub.dotColor}`} />
                                        )}
                                        <span className="truncate">{sub.label}</span>
                                      </div>
                                      {sub.count && (
                                        <span className="text-[11px] font-mono text-zinc-500 font-semibold">
                                          {sub.count}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Mobile Drawer Footer: AI Model & WhatsApp Connection Status */}
              <div className="px-3.5 pt-3.5 border-t border-white/[0.06] space-y-2 pb-6 shrink-0 mt-4">
                {/* 1. Model AI yang Dipakai */}
                <div
                  onClick={() => {
                    setActiveTab('gemini');
                    setMobileDrawerOpen(false);
                  }}
                  className="p-3 rounded-2xl bg-[#1C1E23] hover:bg-[#22242A] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !isAiActive
                            ? 'bg-zinc-600'
                            : activeSavedAiProvider === 'gemini'
                            ? 'bg-[#7C3AED]'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span className="text-[10px] uppercase font-semibold tracking-[0.14em] text-zinc-500">
                        Model AI
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#22242A] text-zinc-200 border border-white/[0.08]">
                      {!isAiActive ? 'OFF' : activeSavedAiProvider === 'gemini' ? 'Gemini' : 'Groq'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    {activeSavedAiProvider === 'gemini' ? (
                      <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                    ) : (
                      <Zap className="w-4 h-4 text-zinc-300 shrink-0" />
                    )}
                    <p className="text-xs font-semibold text-white truncate">
                      {!isAiActive
                        ? 'AI Dinonaktifkan'
                        : getModelDisplayName(activeSavedAiProvider, activeSavedModel)}
                    </p>
                  </div>
                </div>

                {/* 2. Koneksi WhatsApp */}
                <div
                  onClick={() => {
                    setActiveTab('qr');
                    setMobileDrawerOpen(false);
                  }}
                  className="p-3 rounded-2xl bg-[#1C1E23] hover:bg-[#22242A] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      {isConnected && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {isConnected ? 'WhatsApp Terhubung' : 'WhatsApp Terputus'}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate font-mono">
                        {isConnected
                          ? botStatus.user?.name || botStatus.user?.id || 'Sesi Aktif'
                          : 'Klik untuk pindai QR'}
                      </p>
                    </div>
                  </div>
                  <QrCode className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>

                {/* Restart & Logout */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-2.5 rounded-xl bg-[#22242A] hover:bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restart</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION (Minimalist Matte Dark #141518 with Dot Sub-Menus & White Badge/Tooltip) */}
      <aside
        className={`hidden md:flex ${
          sidebarCollapsed ? 'md:w-[76px]' : 'md:w-64'
        } shrink-0 border-r border-white/[0.06] bg-[#141518] shadow-2xl flex-col justify-between transition-all duration-300 ease-in-out select-none relative z-30`}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Top Header with Brand & Double Chevron (« / ») */}
          {!sidebarCollapsed ? (
            <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Bot className="w-6 h-6 text-white shrink-0" />
                <h1 className="font-semibold text-[15px] tracking-tight text-white truncate">
                  Dashboard Chatbot
                </h1>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer shrink-0"
                title="Perkecil Sidebar"
              >
                <span className="text-base font-mono leading-none tracking-tighter font-bold">&laquo;</span>
              </button>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center border-b border-white/[0.06] shrink-0">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                title="Perluas Sidebar"
              >
                <span className="text-base font-mono leading-none tracking-tighter font-bold">&raquo;</span>
              </button>
            </div>
          )}

          {/* Navigation Sections */}
          <nav
            onScroll={() => setHoveredNav(null)}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-visible py-2 [scrollbar-width:none] no-scrollbar flex flex-col justify-between"
          >
            <div className="space-y-0.5">
              {navigationSections.map((sec, sIdx) => (
                <div
                  key={sIdx}
                  className={sIdx > 0 ? 'mt-2.5 pt-2.5 border-t border-white/[0.06]' : ''}
                >
                  {sec.title && (
                    !sidebarCollapsed ? (
                      <div className="px-6 pt-1.5 pb-1.5">
                        <p className="text-[10px] uppercase font-semibold tracking-[0.16em] text-zinc-500">
                          {sec.title}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-1.5 pb-1.5 text-center">
                        <p className="text-[9px] uppercase font-semibold tracking-[0.14em] text-zinc-500">
                          {sec.title}
                        </p>
                      </div>
                    )
                  )}

                  <div className={sidebarCollapsed ? 'space-y-1 flex flex-col items-center' : 'px-3.5 space-y-0.5'}>
                    {sec.items.map((item) => {
                      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                      const isGroupOpen = hasChildren && openSidebarGroups[item.groupKey];
                      const isCurrent = item.isActive;

                      if (!sidebarCollapsed) {
                        return (
                          <div key={item.id} className="space-y-0.5">
                            <button
                              onClick={() => {
                                if (hasChildren) {
                                  toggleSidebarGroup(item.groupKey);
                                } else {
                                  setActiveTab(item.id);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] transition-all cursor-pointer ${
                                isCurrent || isGroupOpen
                                  ? 'bg-[#22242A] text-white font-medium shadow-xs'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] font-normal'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <item.icon
                                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                                    isCurrent || isGroupOpen ? 'text-white' : 'text-zinc-500'
                                  }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.statusDot && (
                                  <span className={`w-2 h-2 rounded-full ${item.statusDot}`} />
                                )}
                                {item.countBadge && (
                                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-[#141518] text-xs font-extrabold flex items-center justify-center shadow-sm">
                                    {item.countBadge}
                                  </span>
                                )}
                                {hasChildren && (
                                  isGroupOpen ? (
                                    <ChevronUp className="w-4 h-4 text-zinc-300" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                  )
                                )}
                              </div>
                            </button>

                            {/* Colored Dot Sub-Items (Expanded View) */}
                            {hasChildren && isGroupOpen && (
                              <div className="space-y-0.5 py-0.5">
                                {item.children.map((sub) => {
                                  const isSubCurrent = activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => setActiveTab(sub.id)}
                                      className={`w-full flex items-center justify-between pl-9 pr-3.5 py-1.5 rounded-xl text-[12.5px] transition-all cursor-pointer group ${
                                        isSubCurrent
                                          ? 'text-white font-medium'
                                          : 'text-zinc-400 hover:text-zinc-200 font-normal'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {sub.icon ? (
                                          <sub.icon
                                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${sub.iconColor || 'text-zinc-400'}`}
                                          />
                                        ) : (
                                          <span
                                            className={`w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${sub.dotColor}`}
                                          />
                                        )}
                                        <span className="truncate">{sub.label}</span>
                                      </div>
                                      {sub.count && (
                                        <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">
                                          {sub.count}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        /* COLLAPSED SIDEBAR MODE */
                        return (
                          <div key={item.id} className="flex flex-col items-center w-full space-y-1.5">
                            <div className="relative flex justify-center w-full">
                              <button
                                onClick={() => {
                                  if (hasChildren) {
                                    toggleSidebarGroup(item.groupKey);
                                  } else {
                                    setActiveTab(item.id);
                                    setHoveredNav(null);
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredNav({
                                    label: item.label,
                                    top: rect.top + rect.height / 2,
                                  });
                                }}
                                onMouseLeave={() => setHoveredNav(null)}
                                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all relative cursor-pointer shrink-0 ${
                                  isCurrent || isGroupOpen
                                    ? 'bg-[#22242A] text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                                }`}
                              >
                                <item.icon className="w-[18px] h-[18px] shrink-0" />
                                {item.statusDot && (
                                  <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${item.statusDot}`} />
                                )}
                              </button>

                              {/* White Circular Badge on Right Edge (like "3" on Users in reference) */}
                              {item.countBadge && (
                                <span className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 min-w-[22px] h-[22px] px-1 rounded-full bg-white text-[#141518] text-[11px] font-extrabold flex items-center justify-center shadow-lg z-20">
                                  {item.countBadge}
                                </span>
                              )}
                            </div>

                            {/* Colored Dot Sub-Items in Collapsed Mode */}
                            {hasChildren && isGroupOpen && (
                              <div className="flex flex-col items-center space-y-1 py-0.5 w-full">
                                {item.children.map((sub) => {
                                  const isSubCurrent = activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setActiveTab(sub.id);
                                        setHoveredNav(null);
                                      }}
                                      onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredNav({
                                          label: sub.label,
                                          top: rect.top + rect.height / 2,
                                        });
                                      }}
                                      onMouseLeave={() => setHoveredNav(null)}
                                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                        isSubCurrent
                                          ? 'border border-white/15 bg-white/[0.04]'
                                          : 'border border-transparent hover:border-white/15 hover:bg-white/[0.03]'
                                      }`}
                                    >
                                      {sub.icon ? (
                                        <sub.icon className={`w-4 h-4 ${sub.iconColor || 'text-zinc-400'}`} />
                                      ) : (
                                        <span className={`w-2 h-2 rounded-full ${sub.dotColor}`} />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom Footer: Active AI Model & WhatsApp Connection Status */}
        <div className="shrink-0 border-t border-white/[0.06] p-2.5 space-y-1.5 bg-[#141518]">
          {!sidebarCollapsed ? (
            <>
              {/* 1. Model AI yang Dipakai */}
              <div
                onClick={() => setActiveTab('gemini')}
                title="Klik untuk membuka pengaturan AI Studio"
                className="px-3 py-2 rounded-xl bg-[#181A1F] hover:bg-[#22242A] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      !isAiActive
                        ? 'bg-zinc-600'
                        : activeSavedAiProvider === 'gemini'
                        ? 'bg-[#7C3AED]'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 leading-none mb-0.5">
                      Model AI
                    </p>
                    <p className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                      {!isAiActive
                        ? 'AI Dinonaktifkan'
                        : getModelDisplayName(activeSavedAiProvider, activeSavedModel)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#22242A] text-zinc-200 border border-white/[0.08] shrink-0">
                  {!isAiActive ? 'OFF' : activeSavedAiProvider === 'gemini' ? 'Gemini' : 'Groq'}
                </span>
              </div>

              {/* 2. Koneksi WhatsApp Terhubung / Tidak */}
              <div
                onClick={() => setActiveTab('qr')}
                title="Klik untuk melihat status koneksi & QR WhatsApp"
                className="px-3 py-2 rounded-xl bg-[#181A1F] hover:bg-[#22242A] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    {isConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate leading-tight">
                      {isConnected ? 'WhatsApp Terhubung' : 'WhatsApp Terputus'}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate font-mono leading-tight">
                      {isConnected
                        ? botStatus.user?.name || botStatus.user?.id || 'Sesi Aktif'
                        : 'Belum Terhubung'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestart();
                  }}
                  title="Muat Ulang Koneksi WhatsApp"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Sidebar Footer */
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Collapsed AI Model Indicator */}
              <button
                onClick={() => {
                  setActiveTab('gemini');
                  setHoveredNav(null);
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredNav({
                    label: !isAiActive
                      ? 'Model AI: Nonaktif'
                      : `Model AI: ${getModelDisplayName(activeSavedAiProvider, activeSavedModel)}`,
                    top: rect.top + rect.height / 2,
                  });
                }}
                onMouseLeave={() => setHoveredNav(null)}
                className="w-11 h-11 rounded-2xl bg-[#1C1E23] hover:bg-[#22242A] border border-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-center relative transition cursor-pointer shrink-0"
              >
                {activeSavedAiProvider === 'gemini' ? (
                  <Sparkles className="w-[18px] h-[18px]" />
                ) : (
                  <Zap className="w-[18px] h-[18px]" />
                )}
                <span
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    !isAiActive
                      ? 'bg-zinc-600'
                      : activeSavedAiProvider === 'gemini'
                      ? 'bg-[#7C3AED]'
                      : 'bg-emerald-400'
                  }`}
                />
              </button>

              {/* Collapsed WhatsApp Connection Indicator */}
              <button
                onClick={() => {
                  setActiveTab('qr');
                  setHoveredNav(null);
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredNav({
                    label: isConnected
                      ? `WhatsApp Terhubung (${botStatus.user?.name || botStatus.user?.id || 'Aktif'})`
                      : 'WhatsApp Terputus (Klik untuk pindai QR)',
                    top: rect.top + rect.height / 2,
                  });
                }}
                onMouseLeave={() => setHoveredNav(null)}
                className="w-11 h-11 rounded-2xl bg-[#1C1E23] hover:bg-[#22242A] border border-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-center relative transition cursor-pointer shrink-0"
              >
                <QrCode className="w-[18px] h-[18px]" />
                <span
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating White Pill Tooltip Portal for Collapsed Sidebar */}
      {sidebarCollapsed && hoveredNav && (
        <div
          style={{ top: hoveredNav.top }}
          className="fixed left-[76px] ml-2.5 -translate-y-1/2 px-4 py-2 rounded-2xl bg-white text-[#141518] text-xs font-semibold shadow-2xl pointer-events-none whitespace-nowrap z-[9999] flex items-center animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rotate-45 rounded-[2px]" />
          <span className="relative z-10">{hoveredNav.label}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col min-w-0 bg-[#181A1F] overflow-hidden ${!mobileChatOpen ? 'pb-16 md:pb-0' : ''}`}>
        {/* MOBILE TOPBAR (Hidden on md+) */}
        <header className="h-14 md:hidden shrink-0 border-b border-white/[0.08] bg-[#141518] backdrop-blur-md px-3.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-[#22242A] transition"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#22242A] hover:bg-[#22242A] border border-white/20 text-xs text-white cursor-pointer transition"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
              <span>{isConnected ? 'WA Terhubung' : 'Pindai QR'}</span>
            </div>

            {/* Quick Restart */}
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-xl bg-[#22242A] hover:bg-[#22242A] text-white border border-white/20 transition cursor-pointer"
              title="Restart Bot"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* DESKTOP TOPBAR */}
        <header className="hidden md:flex h-16 shrink-0 border-b border-white/[0.08] bg-[#141518] backdrop-blur-md px-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white capitalize">
              {activeTab === 'chats' && 'Live Chat Log Real-Time'}
              {activeTab === 'qr' && 'Koneksi & QR Code WhatsApp'}
              {(activeTab === 'tickets' || activeTab === 'complaint') && 'Pusat Komplain & Customer Service (CS)'}
              {activeTab === 'catalog' && 'Katalog Karpet Rumah Indah & Koleksi Lengkap'}
              {activeTab === 'store_profile' && 'Profil Toko'}
              {activeTab === 'schedule' && 'Jadwal & Jam Operasional Toko'}
              {activeTab === 'location' && 'Alamat & Lokasi Showroom'}
              {activeTab === 'warranty' && 'Garansi & Kebijakan Klaim Karpet'}
              {activeTab === 'promo' && 'Promo & Penawaran Diskon Aktif'}
              {activeTab === 'gemini' && 'Pengaturan • AI Studio'}
              {activeTab === 'qna' && 'Pengaturan • Knowledge Base'}
              {activeTab === 'handoff' && 'Pengaturan • Hands-Off'}
              {activeTab === 'settings' && 'Pengaturan • Anti-Spam'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22242A] hover:bg-[#22242A] text-xs font-medium text-white transition border border-white/20 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-xs font-medium transition border border-rose-500/35 cursor-pointer shadow-sm"
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
            <div className="h-full flex-1 flex flex-col md:flex-row rounded-2xl border border-white/[0.07] bg-[#141518] overflow-hidden shadow-sm">
              {/* LEFT COLUMN: LIST OF CONVERSATIONS (1 User 1 Chat) */}
              <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-white/[0.07] bg-[#141518] shrink-0 h-full ${
                mobileChatOpen ? 'hidden md:flex' : 'flex'
              }`}>
                {/* Left Header */}
                <div className="p-4 border-b border-white/[0.07] bg-[#181A1F] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#22242A] text-white border border-white/15 flex items-center justify-center font-bold text-sm shadow-sm">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{ color: '#FFFFFF' }}
                          className="font-bold text-white !text-white text-sm tracking-tight"
                        >
                          Obrolan WhatsApp
                        </span>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 font-medium">
                        {conversations.length} kontak pelanggan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={fetchChats}
                      title="Perbarui Obrolan"
                      className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-[#22242A]/15 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {conversations.length > 0 && (
                      <button
                        onClick={handleClearAllChats}
                        title="Bersihkan Semua Obrolan"
                        className="p-2 rounded-xl text-white/80 hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="p-3 border-b border-white/[0.07] space-y-2.5 bg-[#141518]">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Cari kontak, nomor atau isi obrolan..."
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition shadow-inner font-medium"
                    />
                    {chatSearch && (
                      <button
                        onClick={() => setChatSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter chips - Consistent Slate Blue #5A7194 active & Lavender Grey #A6AFC1 border */}
                  <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setChatFilter('all')}
                      className={`px-3.5 py-1.5 rounded-full transition-all duration-150 font-semibold cursor-pointer shrink-0 border ${
                        chatFilter === 'all'
                          ? 'bg-[#22242A] text-white border-white/[0.12] shadow-xs'
                          : 'bg-[#141518] text-slate-400 border-white/[0.07] hover:bg-[#22242A] hover:text-white'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setChatFilter('unread')}
                      className={`px-3.5 py-1.5 rounded-full transition-all duration-150 font-semibold cursor-pointer shrink-0 border ${
                        chatFilter === 'unread'
                          ? 'bg-[#22242A] text-white border-white/[0.12] shadow-xs'
                          : 'bg-[#141518] text-slate-400 border-white/[0.07] hover:bg-[#22242A] hover:text-white'
                      }`}
                    >
                      Pesan Masuk
                    </button>
                    <button
                      onClick={() => setChatFilter('ai')}
                      className={`px-3.5 py-1.5 rounded-full transition-all duration-150 font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                        chatFilter === 'ai'
                          ? 'bg-[#22242A] text-white border-white/[0.12] shadow-xs'
                          : 'bg-[#141518] text-slate-400 border-white/[0.07] hover:bg-[#22242A] hover:text-white'
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${chatFilter === 'ai' ? 'text-white' : 'text-slate-400'}`} />
                      <span>AI Aktif</span>
                    </button>
                    <button
                      onClick={() => setChatFilter('cs')}
                      className={`px-3.5 py-1.5 rounded-full transition-all duration-150 font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                        chatFilter === 'cs'
                          ? 'bg-[#22242A] text-white border-white/[0.12] shadow-xs'
                          : 'bg-[#141518] text-slate-400 border-white/[0.07] hover:bg-[#22242A] hover:text-white'
                      }`}
                    >
                      <UserCheck className={`w-3.5 h-3.5 ${chatFilter === 'cs' ? 'text-white' : 'text-slate-400'}`} />
                      <span>CS Manusia</span>
                    </button>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06]/25 pb-12 custom-scrollbar">
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
                        (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q)) ||
                        (c.messages || []).some((m) => m.text && m.text.toLowerCase().includes(q))
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
                        <div className="p-8 text-center text-slate-500 space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] flex items-center justify-center mx-auto text-slate-400">
                            <MessageSquare className="w-6 h-6 opacity-60" />
                          </div>
                          <p className="text-xs text-slate-400 font-semibold">
                            {chatSearch ? 'Kontak tidak ditemukan' : 'Belum ada obrolan'}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
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
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200 relative group border-l-[3px] ${
                            isSelected
                              ? 'bg-[#22242A] border-white/[0.08] shadow-sm'
                              : 'hover:bg-[#181A1F] border-transparent'
                          }`}
                        >
                          {/* Avatar with initials & online dot */}
                          <div className="relative shrink-0">
                            <div
                              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-xs shadow-md transition-transform duration-200 group-hover:scale-105 ${
                                isSelected ? 'ring-2 ring-emerald-400/60 shadow-black/40' : ''
                              }`}
                            >
                              {initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-sm" />
                          </div>

                          {/* Contact Info & Snippet */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className={`font-semibold text-xs truncate transition-colors ${
                                isSelected ? 'text-slate-100 font-bold' : 'text-slate-100 font-semibold group-hover:text-white'
                              }`}>
                                {displayName}
                              </h4>
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono font-medium">
                                {lastMsgTime}
                              </span>
                            </div>

                            <p
                              className="text-xs font-mono mb-1 truncate font-medium text-slate-400"
                            >
                              {conv.formattedPhone && !conv.formattedPhone.includes('LID') && conv.formattedPhone !== '-'
                                ? conv.formattedPhone
                                : (conv.phone && !conv.phone.includes('@lid') ? `+${conv.phone}` : '-')}
                            </p>

                            {(() => {
                              const lastInbound = (conv.messages || [])
                                .slice()
                                .reverse()
                                .find((m) => m.direction === 'in');

                              if (isAi && lastInbound) {
                                return (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 min-w-0 text-xs">
                                        <span
                                          className="truncate text-xs text-slate-200 font-semibold"
                                        >
                                          {formatSnippet(lastInbound)}
                                        </span>
                                      </div>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 font-semibold shrink-0 flex items-center gap-0.5" title="Dibalas Otomatis oleh AI">
                                        <Sparkles className="w-2 h-2 text-purple-400" />
                                        <span>AI</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 min-w-0 text-[11px] text-slate-400">
                                      <CheckCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate italic">
                                        {formatSnippet(conv.lastMessage)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0 text-xs">
                                    {isOutbound && (
                                      <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                    <span
                                      className="truncate text-xs text-slate-200 font-semibold"
                                    >
                                      {formatSnippet(conv.lastMessage)}
                                    </span>
                                  </div>

                                  {conv.isHumanHandoff ? (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold shrink-0 flex items-center gap-1 shadow-sm" title="Mode CS Manusia Aktif (Chat AI nonaktif)">
                                      <UserCheck className="w-2.5 h-2.5" />
                                      <span>CS</span>
                                    </span>
                                  ) : isAi ? (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 font-semibold shrink-0 flex items-center gap-0.5">
                                      <Sparkles className="w-2 h-2 text-purple-400" />
                                      <span>AI</span>
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Actions: Delete Chat */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv)}
                              title={`Hapus obrolan dengan ${displayName}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#181A1F] text-slate-400">
                      <div className="w-16 h-16 rounded-3xl bg-[#22242A] border border-white/[0.07] flex items-center justify-center mb-4 shadow-xl">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="font-bold text-base text-slate-200 mb-1.5">
                        WhatsApp Web Layanan Pelanggan Rumah Indah Carpet
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
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
                  <div className={`flex-1 flex flex-col bg-[#181A1F] min-w-0 h-full relative ${
                    mobileChatOpen ? 'flex' : 'hidden md:flex'
                  }`}>
                    {/* Active Chat Topbar */}
                    <div className="h-16 px-4 md:px-6 border-b border-white/[0.07] bg-[#181A1F] flex items-center justify-between shrink-0 shadow-sm z-10 text-white">
                      <div className="flex items-center gap-2 md:gap-3.5 min-w-0">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setMobileChatOpen(false)}
                          className="md:hidden p-2 -ml-1 text-white hover:text-white rounded-xl hover:bg-[#22242A] transition shrink-0 cursor-pointer"
                          title="Kembali ke daftar kontak"
                        >
                          <ArrowLeft className="w-5 h-5 text-white" />
                        </button>

                        <div
                          onClick={() => handleOpenProfileModal(activeConversation)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer p-1.5 rounded-2xl hover:bg-[#22242A] transition group select-none"
                          title="Klik untuk melihat & ubah profil pelanggan"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 group-hover:ring-2 group-hover:ring-emerald-400/50 group-hover:scale-105 transition-all">
                            {activeInitials}
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div
                                className="font-bold text-sm text-slate-100 truncate transition flex items-center gap-1.5"
                              >
                                <span className="text-slate-100 font-bold">{activeDisplayName}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition shrink-0" />
                              </div>
                              {activeSubtitle && activeSubtitle !== '-' && activeSubtitle !== activeDisplayName && (
                                <span
                                  className="text-xs font-mono font-medium text-slate-400 group-hover:text-slate-200 transition"
                                >
                                  ({activeSubtitle})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* ON/OFF AI per Contact Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleContactAi(activeConversation)}
                          disabled={togglingAiJid === (activeConversation.jid || activeConversation.phone)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer ${
                            activeConversation.isHumanHandoff
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 hover:border-amber-500/60'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 hover:border-white/[0.18]'
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

                        {/* Tombol Menu Tiket (Dropdown: Buat Tiket atau Proses Tiket Customer) */}
                        <div className="relative" ref={ticketDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setTicketMenuOpen((prev) => !prev)}
                            className="px-3 py-1.5 rounded-xl bg-[#22242A] hover:bg-[#22242A] text-white border border-white/20 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Menu Tiket Customer"
                          >
                            <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tiket</span>
                            {activeCustomerTickets.length > 0 && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                inProgressCustomerTickets.length > 0
                                  ? 'bg-amber-400 text-slate-900 animate-pulse'
                                  : 'bg-emerald-400 text-slate-900'
                              }`}>
                                {activeCustomerTickets.length}
                              </span>
                            )}
                            <ChevronDown className={`w-3 h-3 text-white/70 transition-transform ${ticketMenuOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Dropdown Menu Tiket */}
                          {ticketMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#141518] border border-white/[0.07] shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
                              {/* 1. Buat Tiket */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTicketMenuOpen(false);
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
                                className="w-full text-left p-2.5 rounded-xl hover:bg-[#22242A] text-slate-100 text-xs font-semibold flex items-center gap-3 transition cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                  <Plus className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-100">Buat Tiket</div>
                                  <div className="text-[11px] text-slate-400 font-normal leading-tight">Buat tiket baru untuk customer ini</div>
                                </div>
                              </button>

                              {/* 2. Proses Tiket Customer */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTicketMenuOpen(false);
                                  setShowCustomerTicketsModal(true);
                                }}
                                className="w-full text-left p-2.5 rounded-xl hover:bg-[#22242A] text-slate-100 text-xs font-semibold flex items-center gap-3 transition cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-slate-100 flex items-center justify-between gap-1">
                                    <span>Proses Tiket Customer</span>
                                    {inProgressCustomerTickets.length > 0 && (
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-normal leading-tight">
                                    {activeCustomerTickets.length > 0
                                      ? `${inProgressCustomerTickets.length} proses, ${resolvedCustomerTickets.length} selesai`
                                      : 'Lihat status masih proses atau selesai'}
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleDeleteConversation(e, activeConversation)}
                          className="p-2 rounded-xl text-white/80 hover:text-rose-400 hover:bg-rose-500/20 border border-white/10 transition cursor-pointer"
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
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-semibold transition ml-2 shrink-0 cursor-pointer"
                        >
                          Nyalakan AI Kembali
                        </button>
                      </div>
                    )}

                    {/* Messages Canvas */}
                    <div
                      ref={activeChatScrollRef}
                      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 font-sans text-sm bg-chat-mesh custom-scrollbar"
                    >
                      {/* Centered Date Badge */}
                      <div className="flex justify-center my-2">
                        <span className="px-3.5 py-1 rounded-full bg-[#181A1F] text-slate-400 text-[11px] font-medium border border-white/[0.07] shadow-md backdrop-blur-md">
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
                        .map((msg, idx, arr) => {
                        const isUser = msg.direction === 'in';
                        const isAi = msg.isAi || msg.senderName?.includes('Gemini') || msg.senderName?.includes('Groq') || msg.senderName?.includes('AI');
                        const isAdmin = msg.senderName?.includes('Admin') || msg.senderName?.includes('Manual');
                        const prevCustomerMsg = !isUser
                          ? arr.slice(0, idx).reverse().find((m) => m.direction === 'in')
                          : null;

                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed relative group transition-all duration-200 ${
                                isUser
                                  ? 'bg-[#181A1F] text-zinc-100 rounded-tl-xs border border-white/[0.07] shadow-sm'
                                  : 'bg-[#22242A] text-white rounded-tr-xs border border-white/[0.1] shadow-md'
                              }`}
                            >
                              {/* Message Header Tag */}
                              {!isUser && (
                                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-white/15 text-[11px] font-semibold">
                                  {isAi ? (
                                    <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>{msg.senderName || 'Rumah Indah Carpet AI'}</span>
                                    </span>
                                  ) : isAdmin ? (
                                    <span className="text-sky-300 flex items-center gap-1.5 font-bold">
                                      <User className="w-3.5 h-3.5 text-sky-400" />
                                      <span>Admin (Balasan Manual)</span>
                                    </span>
                                  ) : (
                                    <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Rumah Indah Carpet Bot</span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* WhatsApp-Style Quoted Customer Message (Membalas Pesan Pelanggan) */}
                              {!isUser && prevCustomerMsg && prevCustomerMsg.text && (
                                <div className="mb-2 p-2 rounded-xl bg-[#22242A] border-l-3 border-emerald-400 text-xs">
                                  <div className="text-[10px] text-emerald-300 font-semibold mb-0.5 flex items-center gap-1">
                                    <Reply className="w-3 h-3 text-emerald-400" />
                                    <span>Membalas {activeConversation.senderName || 'Pelanggan'}:</span>
                                  </div>
                                  <p className="line-clamp-2 text-white/90 text-xs italic font-normal">
                                    &ldquo;{prevCustomerMsg.text}&rdquo;
                                  </p>
                                </div>
                              )}

                              {/* Video Player for customer or bot message */}
                              {(msg.video || (msg.mediaType === 'video' && (msg.mediaUrl || msg.image))) && (() => {
                                const rawVideo = msg.video || msg.mediaUrl || msg.image;
                                const resolvedVideoSrc = rawVideo.startsWith('/') || rawVideo.startsWith('http') || rawVideo.startsWith('data:')
                                  ? rawVideo
                                  : `/${rawVideo}`;
                                return (
                                  <div className="mb-2.5 rounded-2xl overflow-hidden border border-white/[0.07] bg-black/90 max-w-sm shadow-md">
                                    <video
                                      src={resolvedVideoSrc}
                                      controls
                                      playsInline
                                      preload="metadata"
                                      className="w-full max-h-64 object-contain rounded-2xl bg-black"
                                    >
                                      Browser Anda tidak mendukung pemutar video.
                                    </video>
                                  </div>
                                );
                              })()}

                              {/* Voice Note / Audio Player for customer or bot message */}
                              {(msg.audio || (msg.mediaType === 'audio' && (msg.mediaUrl || msg.image))) && (() => {
                                const rawAudio = msg.audio || msg.mediaUrl || msg.image;
                                const resolvedAudioSrc = rawAudio.startsWith('/') || rawAudio.startsWith('http') || rawAudio.startsWith('data:')
                                  ? rawAudio
                                  : `/${rawAudio}`;
                                return (
                                  <div className={`mb-2.5 p-3 rounded-2xl border flex flex-col gap-2 max-w-xs sm:max-w-sm shadow-xs ${
                                    isUser ? 'bg-[#181A1F] border-white/[0.07] text-slate-100' : 'bg-[#22242A] border-white/20 text-white'
                                  }`}>
                                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <span className="text-[11px] font-bold">Pesan Suara WhatsApp</span>
                                      </div>
                                      <a
                                        href={resolvedAudioSrc}
                                        download={`audio_${msg.id || Date.now()}.ogg`}
                                        className="p-1 rounded-lg hover:bg-[#22242A] text-emerald-400 transition cursor-pointer"
                                        title="Unduh Voice Note"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                    <audio
                                      src={resolvedAudioSrc}
                                      controls
                                      preload="metadata"
                                      className="w-full h-8 rounded-lg"
                                    >
                                      Browser Anda tidak mendukung pemutar audio.
                                    </audio>
                                  </div>
                                );
                              })()}

                              {/* Photo / Image preview for customer or bot message */}
                              {msg.image && msg.mediaType !== 'video' && msg.mediaType !== 'audio' && (() => {
                                const resolvedImgSrc = msg.image.startsWith('/') || msg.image.startsWith('http') || msg.image.startsWith('data:')
                                  ? msg.image
                                  : `/${msg.image}`;
                                return (
                                  <div
                                    onClick={() => {
                                      const rawCap = (msg.text || '').replace(/^\[Foto(?::\s*|\s+pelanggan\]?)/i, '').replace(/\]$/, '').trim();
                                      const cleanCap = (rawCap.toLowerCase() === 'pelanggan' || rawCap.toLowerCase() === '[foto pelanggan]' || rawCap.toLowerCase() === '[foto]' || rawCap.toLowerCase() === '[foto terkirim]') ? '' : rawCap;
                                      setPreviewImageModal({
                                        url: resolvedImgSrc,
                                        title: msg.senderName || 'Foto Lampiran',
                                        caption: cleanCap
                                      });
                                    }}
                                    className="mb-2 rounded-2xl overflow-hidden border border-white/[0.07] bg-[#181A1F]/80 max-w-xs shadow-md cursor-pointer group/img relative"
                                    title="Klik untuk memperbesar gambar"
                                  >
                                    <img
                                      src={resolvedImgSrc}
                                      alt="Foto Lampiran"
                                      className="w-full max-h-56 object-cover group-hover/img:scale-105 transition-transform duration-300"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
                                      <Eye className="w-4 h-4 text-emerald-400" />
                                      <span>Perbesar Foto</span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Message Content */}
                              {Boolean(formatWaText(msg.text)) && (
                                <div
                                  className={`text-[13px] leading-relaxed ${isUser ? 'text-slate-100 font-normal' : 'text-slate-50 font-normal'}`}
                                  dangerouslySetInnerHTML={{ __html: formatWaText(msg.text) }}
                                />
                              )}

                              {/* Timestamp & Status */}
                              <div className={`flex items-center justify-end gap-1 mt-1.5 pt-0.5 text-[10px] font-mono ${
                                isUser ? 'text-slate-400' : 'text-white/80'
                              }`}>
                                <span>
                                  {msg.timestamp
                                    ? new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                                {!isUser && (
                                  <CheckCheck className="w-3.5 h-3.5 text-white/90 ml-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Chat Composer (Direct Reply to WhatsApp) */}
                    <div className="p-3.5 md:p-4 border-t border-white/[0.07] bg-[#141518] shrink-0">
                      <form onSubmit={handleSendDirectReply} className="flex items-center gap-2.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            placeholder={`Ketik balasan WhatsApp untuk ${activeDisplayName}...`}
                            className="w-full rounded-2xl bg-[#181A1F] focus:bg-[#1C1E23] border border-white/[0.07] px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition shadow-xs font-medium"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!chatInputText.trim() || sendingDirectReply || !isConnected}
                          className="py-3 px-5 rounded-2xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] border border-emerald-500/50 font-semibold text-xs transition shadow-md shadow-black/40 disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          title="Kirim Pesan WhatsApp"
                        >
                          {sendingDirectReply ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span className="hidden sm:inline">Kirim</span>
                            </>
                          )}
                        </button>
                      </form>
                      {!isConnected && (
                        <p className="text-[11px] text-amber-400 mt-1.5 text-center flex items-center justify-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Bot WhatsApp belum terhubung. Silakan pindai QR code terlebih dahulu di tab Koneksi WhatsApp.</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: AI STUDIO (GROQ & GEMINI ENGINE + SIMULATOR) */}
          {activeTab === 'gemini' && (
            <div className="flex flex-col flex-1 h-full min-h-0">
              {/* MOBILE SEGMENTED VIEW SWITCHER (< lg) */}
              <div className="lg:hidden flex items-center p-1 bg-[#141518] rounded-xl border border-white/[0.07] shrink-0 mb-3 gap-1">
                <button
                  type="button"
                  onClick={() => setAiStudioMobileView('simulator')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    aiStudioMobileView === 'simulator'
                      ? 'bg-[#22242A] text-white border border-white/[0.1] shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-[#181A1F]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulator Chat</span>
                  {simHistory.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-[#141518] font-mono font-extrabold">
                      {simHistory.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAiStudioMobileView('config')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    aiStudioMobileView === 'config'
                      ? 'bg-[#22242A] text-white border border-white/[0.1] shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-[#181A1F]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Pengaturan AI</span>
                  <span className={`w-2 h-2 rounded-full ${geminiEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                </button>
              </div>

              {/* MAIN CONTENT AREA: 2 Balanced Columns on Desktop */}
              <div className="flex-1 min-h-0 lg:grid lg:grid-cols-12 gap-4 h-full">
                {/* Left Column: AI Configuration Control Center (No Double Scrollbar) */}
                <div
                  className={`lg:col-span-5 flex-col h-full min-h-0 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm overflow-hidden ${
                    aiStudioMobileView === 'config' ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {/* Panel Header */}
                  <div className="px-4 py-3.5 border-b border-white/[0.06] bg-[#141518] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#181A1F] text-zinc-200 border border-white/[0.07] flex items-center justify-center shrink-0">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">Konfigurasi AI Layanan</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Pilih mesin AI & instruksi karakter bot</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#181A1F] px-3 py-1.5 rounded-xl border border-white/[0.07]">
                      <span className={`text-xs font-semibold ${geminiEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {geminiEnabled ? 'AI Aktif' : 'Nonaktif'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={geminiEnabled}
                          onChange={(e) => setGeminiEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Panel Content: Flex Column without Double Scrollbars */}
                  <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
                    {/* Section 1: Provider & Model Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 shrink-0">
                      {/* Provider Switcher */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Penyedia AI Utama</span>
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">Primary Engine</span>
                        </div>
                        <div className="grid grid-cols-2 p-1 bg-[#181A1F] rounded-xl border border-white/[0.07] gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAiProvider('groq')}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              aiProvider === 'groq'
                                ? 'bg-[#22242A] text-white border border-white/[0.14] shadow-xs'
                                : 'text-zinc-400 hover:text-white border border-transparent'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span>Groq LPU</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiProvider('gemini')}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              aiProvider === 'gemini'
                                ? 'bg-[#22242A] text-white border border-white/[0.14] shadow-xs'
                                : 'text-zinc-400 hover:text-white border border-transparent'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Gemini AI</span>
                          </button>
                        </div>
                      </div>

                      {/* Model Dropdown */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-200">
                            {aiProvider === 'groq' ? 'Model Groq LPU' : 'Model Google Gemini'}
                          </label>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {aiProvider === 'groq' ? '⚡ Ultra-Speed' : '🔮 DeepMind'}
                          </span>
                        </div>
                        {aiProvider === 'groq' ? (
                          <select
                            value={groqModel}
                            onChange={(e) => setGroqModel(e.target.value)}
                            className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white/25 font-medium cursor-pointer"
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
                            className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white/25 font-medium cursor-pointer"
                          >
                            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Super Cepat ~1.8s - Rekomendasi)</option>
                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Sangat Ringan & Cepat)</option>
                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Stabil)</option>
                            <option value="gemini-flash-latest">Gemini Flash Latest</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Section 2: System Instruction / Persona Editor (Fills Remaining Height Cleanly) */}
                    <div className="flex-1 flex flex-col min-h-[160px] pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between shrink-0">
                        <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Instruksi Sistem & Persona Karakter</span>
                        </label>
                        <span className="text-[10px] text-zinc-300 font-mono font-semibold bg-[#181A1F] px-2 py-0.5 rounded-md border border-white/[0.07]">
                          {systemPrompt.length} karakter
                        </span>
                      </div>

                      <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Tuliskan instruksi sistem, persona, dan aturan khusus balasan AI..."
                        className="flex-1 w-full min-h-[120px] rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 leading-relaxed font-sans resize-none custom-scrollbar"
                      />

                      <p className="text-[11px] text-zinc-400 leading-snug shrink-0">
                        💡 Memandu gaya bicara, etika, dan pengetahuan katalog produk saat AI membalas WhatsApp pelanggan.
                      </p>
                    </div>
                  </div>

                  {/* Panel Footer: Primary Save Action */}
                  <div className="px-4 py-3 border-t border-white/[0.06] bg-[#141518] shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAiSettings}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4 text-[#141518]" />
                      <span>Simpan Pengaturan AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiStudioMobileView('simulator')}
                      className="lg:hidden py-2.5 px-3.5 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-200 font-semibold text-xs border border-white/[0.07] transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Uji Chat →</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Live AI Simulator / Playground */}
                <div
                  className={`lg:col-span-7 flex-col h-full min-h-0 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm overflow-hidden ${
                    aiStudioMobileView === 'simulator' ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {/* Simulator Header */}
                  <div className="px-4 py-3.5 border-b border-white/[0.06] bg-[#141518] flex items-center justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#181A1F] text-emerald-400 border border-white/[0.07] flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-white truncate">Simulator Percakapan AI</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#22242A] text-zinc-200 border border-white/[0.08]">
                            {aiProvider === 'groq' ? '⚡ Groq LPU' : '🔮 Google Gemini'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate hidden sm:block mt-0.5">
                          Uji respons langsung dengan pengetahuan katalog karpet & showroom Rumah Indah Carpet Gallery
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimHistory([])}
                      className="text-xs font-semibold text-zinc-300 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181A1F] hover:bg-rose-500/15 transition cursor-pointer border border-white/[0.07] hover:border-rose-500/30 shrink-0"
                      title="Bersihkan riwayat obrolan simulasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Chat</span>
                    </button>
                  </div>

                  {/* Simulator Message Stream */}
                  <div
                    ref={simScrollRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-0 custom-scrollbar"
                  >
                    {simHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#181A1F] text-emerald-400 border border-white/[0.07] flex items-center justify-center mb-3">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Simulator Percakapan AI Rumah Indah Carpet</h4>
                        <p className="text-xs text-zinc-400 max-w-md mb-5 leading-relaxed">
                          Ketik pertanyaan atau klik salah satu topik pengujian di bawah untuk menguji kecerdasan balasan AI secara instan.
                        </p>

                        <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'Halo, apakah karpet masjid Turki bisa dipasang dan diobras di tempat?',
                            'Berapa harga karpet masjid grade A+ per roll dan minimal pemesanan?',
                            'Dimana lokasi showroom utama dan apakah buka di hari libur/Minggu?',
                            'Bagaimana ketentuan garansi karpet dan penanganan komplain?'
                          ].map((promptText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSimulateAiWithText(promptText)}
                              className="text-left text-xs p-3 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-200 border border-white/[0.07] hover:border-white/[0.15] transition flex items-center justify-between group cursor-pointer"
                            >
                              <span className="line-clamp-2 pr-2">{promptText}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 shrink-0 transition" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {simHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div className="text-[10px] text-zinc-500 mb-1 px-1 flex items-center gap-1.5">
                              {item.role === 'user' ? (
                                <span>Simulasi Pelanggan • {item.time}</span>
                              ) : (
                                <>
                                  <span className="font-semibold text-zinc-400">
                                    Rumah Indah Carpet AI ({item.provider === 'groq' ? '⚡ Groq' : '🔮 Gemini'})
                                  </span>
                                  <span>• {item.time}</span>
                                </>
                              )}
                            </div>
                            <div className="relative group max-w-[90%] sm:max-w-[82%]">
                              <div
                                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                                  item.role === 'user'
                                    ? 'bg-[#22242A] text-white border border-white/[0.1] rounded-tr-xs'
                                    : 'bg-[#181A1F] text-zinc-100 border border-white/[0.07] rounded-tl-xs'
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
                                  className="absolute right-2 -top-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-md bg-[#141518] hover:bg-[#22242A] text-zinc-400 hover:text-white border border-white/[0.07] cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {item.role === 'ai' && item.ragDocs && item.ragDocs.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                                  <Brain className="w-3 h-3 text-zinc-400" />
                                  <span>RAG:</span>
                                </span>
                                {item.ragDocs.map((doc, docIdx) => (
                                  <span
                                    key={docIdx}
                                    className="text-[9px] px-2 py-0.5 rounded-full bg-[#22242A] border border-white/[0.07] text-zinc-200 font-medium"
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
                          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium italic py-2">
                            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                            <span>{aiProvider === 'groq' ? 'Groq LPU sedang memproses (~300ms)...' : 'Gemini sedang menyusun balasan...'}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Single-Row Quick Prompts Strip */}
                  <div className="px-4 py-2 border-t border-white/[0.06] bg-[#141518] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-[10px] text-zinc-400 font-semibold shrink-0 flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-zinc-400" />
                      <span>Uji Cepat:</span>
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
                        className="text-[11px] px-3 py-1 rounded-full bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.07] hover:border-white/[0.15] transition shrink-0 cursor-pointer whitespace-nowrap font-medium"
                      >
                        {chipText}
                      </button>
                    ))}
                  </div>

                  {/* Compact Input Form */}
                  <form
                    onSubmit={handleSimulateAi}
                    className="p-3 border-t border-white/[0.06] bg-[#141518] shrink-0"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={simPrompt}
                        onChange={(e) => setSimPrompt(e.target.value)}
                        placeholder="Ketik pertanyaan uji AI (misal: 'Apakah ada survey gratis?')..."
                        className="flex-1 rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 focus:bg-[#1C1E23] font-medium transition"
                      />
                      <button
                        type="submit"
                        disabled={simulating || !simPrompt.trim()}
                        className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs transition disabled:opacity-40 shrink-0 flex items-center gap-1.5 cursor-pointer"
                        title="Kirim Pertanyaan Simulasi"
                      >
                        <Send className="w-3.5 h-3.5 text-[#141518]" />
                        <span className="hidden sm:inline">Uji</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE & CONNECTION */}
          {activeTab === 'qr' && (
            <div className="w-full max-w-lg mx-auto py-4 sm:py-6 px-3 sm:px-4">
              <div className="rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${
                      isConnected
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/35'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-600' : 'bg-amber-500 animate-ping'
                      }`}
                    />
                    {isConnected ? 'WhatsApp Terhubung' : 'Menunggu Pindai QR'}
                  </span>
                </div>

                {/* QR Code Frame or Connected State */}
                {isConnected ? (
                  <div className="p-6 rounded-2xl bg-[#181A1F] border border-white/[0.07] shadow-inner max-w-sm w-full text-center space-y-3.5 my-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center mx-auto shadow-md shadow-black/40">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Koneksi Berhasil</p>
                      <h4 className="font-bold text-lg text-slate-100 truncate">{botStatus.user?.name || 'Rumah Indah Carpet Bot'}</h4>
                      <p className="font-mono text-sm text-slate-400 font-semibold mt-0.5">+{botStatus.user?.id || 'Aktif'}</p>
                    </div>
                    <div className="pt-2 border-t border-white/[0.07] text-xs text-slate-400">
                      Sesi WhatsApp siap melayani calon pembeli secara otomatis.
                    </div>
                  </div>
                ) : botStatus.qrDataUrl ? (
                  <div className="p-4 bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/30 my-3 transition-transform duration-300 hover:scale-[1.02] relative group">
                    <img
                      src={botStatus.qrDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 rounded-3xl border border-emerald-500/35 pointer-events-none" />
                  </div>
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-[#181A1F] flex flex-col items-center justify-center gap-3 border border-white/[0.07] my-3 shadow-inner p-4 text-center">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                    <p className="text-xs text-slate-300 font-medium">
                      {botStatus.status === 'disconnected'
                        ? 'Menyiapkan browser WhatsApp...'
                        : 'Sedang memuat QR Code WhatsApp...'}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {botStatus.engine || 'whatsapp-web.js (Chrome)'}
                    </p>
                  </div>
                )}

                {/* QR Caption / Hint */}
                <p className="text-xs text-slate-400 font-medium mt-1 mb-5 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isConnected ? 'Sesi terhubung & aktif' : 'Arahkan kamera WhatsApp ke barcode di atas'}</span>
                </p>

                {/* Action Buttons Row */}
                <div className="w-full pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-center gap-3">
                  {isConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('chats')}
                        className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Buka Live Chat WhatsApp Sekarang →</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={restartingConn}
                        className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-xs border border-rose-500/35 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Putuskan Sesi</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleRestart}
                        disabled={restartingConn}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${restartingConn ? 'animate-spin' : ''}`} />
                        <span>{restartingConn ? 'Memproses...' : 'Muat Ulang Koneksi'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={restartingConn}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-xs border border-rose-500/35 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Reset Sesi / Scan Ulang</span>
                      </button>
                    </>
                  )}
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
                const queueMatch = (t.queueNumber || '').toLowerCase().includes(q);
                const nameMatch = (t.name || '').toLowerCase().includes(q);
                const contactMatch = (t.contact || t.sender || '').toLowerCase().includes(q);
                const descMatch = (t.description || '').toLowerCase().includes(q);
                const notesMatch = (t.notes || '').toLowerCase().includes(q);
                return idMatch || queueMatch || nameMatch || contactMatch || descMatch || notesMatch;
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
                      <div className="p-2 rounded-xl bg-emerald-500/15 border border-white/[0.08] text-slate-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-100">Pusat Komplain & Layanan Pelanggan (CS)</h3>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-white/[0.08] text-slate-100 font-bold text-xs shadow-xs">
                          {totalCount} Total Pengaduan & Layanan
                        </span>
                        {urgentCount > 0 && (
                          <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-400 font-bold text-xs shadow-xs animate-pulse">
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
                      className="px-3.5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs shadow-md shadow-black/40 transition flex items-center gap-1.5 cursor-pointer border border-emerald-500/50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Tiket Komplain / CS</span>
                    </button>
                    <button
                      onClick={fetchTickets}
                      title="Segarkan data tiket & komplain"
                      className="px-3.5 py-2 rounded-xl bg-[#141518] hover:bg-[#22242A] text-slate-100 border border-white/[0.07] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'Semua' && ticketPriorityFilter === 'Semua' && ticketCategoryFilter === 'Semua'
                        ? 'border-2 border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-[#141518] border-white/[0.07] shadow-xs hover:border-white/[0.18] hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-semibold">Semua Tiket & Komplain</span>
                      <Ticket className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-100 font-mono">{totalCount}</span>
                      <span className="text-[11px] text-slate-400 font-medium">laporan</span>
                    </div>
                  </button>

                  {/* Open */}
                  <button
                    onClick={() => { setTicketStatusFilter('Open'); setTicketPriorityFilter('Semua'); }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'Open'
                        ? 'border-2 border-sky-500/50 bg-sky-500/10 ring-2 ring-sky-500/20 shadow-md'
                        : 'bg-[#141518] border-white/[0.07] shadow-xs hover:border-sky-500/60 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sky-400 font-semibold">Menunggu Respon (Open)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-sky-400 font-mono">{openCount}</span>
                      <span className="text-[11px] text-sky-400/80 font-medium">perlu respon CS</span>
                    </div>
                  </button>

                  {/* In Progress */}
                  <button
                    onClick={() => { setTicketStatusFilter('In Progress'); setTicketPriorityFilter('Semua'); }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'In Progress'
                        ? 'border-2 border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-md'
                        : 'bg-[#141518] border-white/[0.07] shadow-xs hover:border-amber-500/60 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-semibold">Sedang Ditindaklanjuti</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-amber-400 font-mono">{inProgressCount}</span>
                      <span className="text-[11px] text-amber-400/80 font-medium">penanganan CS</span>
                    </div>
                  </button>

                  {/* Resolved */}
                  <button
                    onClick={() => { setTicketStatusFilter('Resolved'); setTicketPriorityFilter('Semua'); }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      ticketStatusFilter === 'Resolved'
                        ? 'border-2 border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-[#141518] border-white/[0.07] shadow-xs hover:border-white/[0.18] hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-semibold">Selesai & Tuntas</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-emerald-400 font-mono">{resolvedCount}</span>
                      <span className="text-[11px] text-emerald-400/80 font-medium">terselesaikan</span>
                    </div>
                  </button>

                  {/* Urgent / Prioritas Tinggi */}
                  <button
                    onClick={() => { setTicketPriorityFilter('Tinggi'); setTicketStatusFilter('Semua'); }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer ${
                      ticketPriorityFilter === 'Tinggi' || ticketPriorityFilter === 'Urgent'
                        ? 'border-2 border-rose-500/50 bg-rose-500/10 ring-2 ring-rose-500/20 shadow-md'
                        : 'bg-[#141518] border-white/[0.07] shadow-xs hover:border-rose-500/60 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-400 font-semibold">Prioritas Mendesak</span>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-rose-400 font-mono">{urgentCount}</span>
                      <span className="text-[11px] text-rose-400/80 font-medium">butuh atensi</span>
                    </div>
                  </button>
                </div>

                {/* 3. Search Bar, Dropdown Filters, Sort & Category Pills */}
                <div className="p-3.5 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        placeholder="Cari ID tiket, nama pelanggan, kontak WhatsApp, atau kendala..."
                        className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#141518] border border-white/[0.07] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 shadow-xs transition"
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
                      <div className="flex items-center gap-1.5 bg-[#181A1F] border border-white/[0.07] rounded-xl px-2.5 py-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                        <select
                          value={ticketStatusFilter}
                          onChange={(e) => setTicketStatusFilter(e.target.value)}
                          className="bg-transparent text-xs text-slate-100 font-semibold outline-none cursor-pointer pr-1"
                        >
                          <option value="Semua" className="bg-[#141518] text-slate-100">Semua</option>
                          <option value="Open" className="bg-[#141518] text-slate-100">Open</option>
                          <option value="In Progress" className="bg-[#141518] text-slate-100">In Progress</option>
                          <option value="Resolved" className="bg-[#141518] text-slate-100">Resolved</option>
                          <option value="Closed" className="bg-[#141518] text-slate-100">Closed</option>
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div className="flex items-center gap-1.5 bg-[#181A1F] border border-white/[0.07] rounded-xl px-2.5 py-1">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Prioritas:</span>
                        <select
                          value={ticketPriorityFilter}
                          onChange={(e) => setTicketPriorityFilter(e.target.value)}
                          className="bg-transparent text-xs text-slate-100 font-semibold outline-none cursor-pointer pr-1"
                        >
                          <option value="Semua" className="bg-[#141518] text-slate-100">Semua</option>
                          <option value="Urgent" className="bg-[#141518] text-slate-100">Urgent</option>
                          <option value="Tinggi" className="bg-[#141518] text-slate-100">Tinggi</option>
                          <option value="Normal" className="bg-[#141518] text-slate-100">Normal</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div className="flex items-center gap-1.5 bg-[#181A1F] border border-white/[0.07] rounded-xl px-2.5 py-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Urutan:</span>
                        <select
                          value={ticketSortOrder}
                          onChange={(e) => setTicketSortOrder(e.target.value)}
                          className="bg-transparent text-xs text-slate-100 font-semibold outline-none cursor-pointer pr-1"
                        >
                          <option value="newest" className="bg-[#141518] text-slate-100">Terbaru</option>
                          <option value="oldest" className="bg-[#141518] text-slate-100">Terlama</option>
                          <option value="priority" className="bg-[#141518] text-slate-100">Prioritas Tertinggi</option>
                          <option value="status" className="bg-[#141518] text-slate-100">Status Terbuka</option>
                        </select>
                      </div>

                      {hasActiveFilter && (
                        <button
                          onClick={resetAllFilters}
                          className="px-2.5 py-1 rounded-xl bg-[#22242A] hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-medium border border-rose-500/20 transition flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Pills Row */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1 text-xs border-t border-white/[0.07]">
                    {categoriesList.map((item) => {
                      const count = item.id === 'Semua'
                        ? tickets.length
                        : tickets.filter((t) => (t.category || 'Layanan Umum').toLowerCase().includes(item.id.toLowerCase().slice(0, 5))).length;
                      const isSelected = ticketCategoryFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setTicketCategoryFilter(item.id)}
                          className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 border whitespace-nowrap cursor-pointer shadow-xs active:scale-95 ${
                            isSelected
                              ? 'bg-[#22242A] text-white border-white/[0.12]'
                              : 'bg-[#181A1F] hover:bg-[#22242A] text-slate-100 border-white/[0.07] hover:border-white/[0.18]'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                            isSelected ? 'bg-white text-[#141518]' : 'bg-[#22242A] text-slate-300'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. DESKTOP TABLE VIEW (Flexible & Responsive Table) */}
                <div className="hidden md:block rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto border-collapse text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/[0.07] bg-[#181A1F] text-slate-100 font-bold">
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 whitespace-nowrap">ID Tiket</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 whitespace-nowrap">No. Antrian</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 min-w-[150px]">Pelanggan</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 whitespace-nowrap">Kontak / WA</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 whitespace-nowrap">Kategori & Tanda</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 min-w-[180px]">Rincian Permohonan</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 whitespace-nowrap">Status</th>
                          <th className="py-3.5 px-4 text-left font-bold text-slate-100 whitespace-nowrap">Prioritas</th>
                          <th className="py-3.5 px-4 text-center font-bold text-slate-100 whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {displayTickets.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-16 px-4 text-center">
                              <div className="max-w-md mx-auto space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#181A1F] border border-white/[0.07] flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                                  <Ticket className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-slate-100 text-sm">
                                  {hasActiveFilter 
                                    ? 'Tidak ada tiket yang sesuai dengan filter atau pencarian'
                                    : 'Belum ada tiket layanan yang terdaftar'}
                                </p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {hasActiveFilter
                                    ? 'Coba ubah kata kunci pencarian atau reset filter untuk melihat tiket lainnya.'
                                    : 'Tiket antrian komplain dan layanan customer service akan tercatat otomatis di sini.'}
                                </p>
                                {hasActiveFilter ? (
                                  <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#181A1F] hover:bg-emerald-500/15 text-slate-100 font-semibold text-xs inline-flex items-center gap-1.5 border border-white/[0.07] transition cursor-pointer shadow-xs"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Reset Semua Filter</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setShowCreateTicketModal(true)}
                                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-white" />
                                    <span>Buat Tiket Baru</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayTickets.map((t, idx) => {
                            const cat = (t.category || 'Layanan Umum').toLowerCase();
                            const cleanPhone = String(t.contact || t.sender || '').replace(/\D/g, '');
                            const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

                            return (
                              <tr key={`${t.id || 'ticket'}_${idx}`} className="hover:bg-[#22242A]/60 transition group">
                                {/* ID Tiket */}
                                <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                                  <span className="font-mono font-bold text-slate-300">{t.id}</span>
                                </td>

                                {/* No. Antrian */}
                                <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                                  {t.queueNumber ? (
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      #{String(t.queueNumber).replace(/^#+/, '')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-mono text-xs">-</span>
                                  )}
                                </td>

                                {/* Pelanggan */}
                                <td className="py-3.5 px-4 align-middle text-left">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-white/[0.08] text-slate-100 font-bold flex items-center justify-center text-[11px] uppercase shrink-0">
                                      {(t.name || 'P').charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-slate-100 truncate" title={t.name}>{t.name || 'Pelanggan'}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Kontak / WA */}
                                <td className="py-3.5 px-4 align-middle text-left font-mono whitespace-nowrap">
                                  {cleanPhone ? (
                                    <button
                                      type="button"
                                      onClick={() => openWhatsAppChat(t.contact || t.sender, t.id, t.name)}
                                      className="text-slate-100 hover:text-emerald-400 font-medium flex items-center gap-1.5 group-hover:underline text-left cursor-pointer truncate max-w-full"
                                      title="Klik untuk chat di WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="truncate">+{cleanPhone}</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>

                                {/* Kategori & Tanda */}
                                <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                                  {cat.includes('beli') || cat.includes('order') || cat.includes('pembelian') ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-xs whitespace-nowrap">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                      <span>Pembelian Produk</span>
                                    </span>
                                  ) : cat.includes('garansi') || cat.includes('klaim') ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/35 shadow-xs whitespace-nowrap">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                      <span>Klaim Garansi</span>
                                    </span>
                                  ) : cat.includes('pengaduan') || cat.includes('komplain') || cat.includes('rusak') || cat.includes('keluhan') ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/35 shadow-xs whitespace-nowrap">
                                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                                      <span>Pengaduan Produk</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/35 shadow-xs whitespace-nowrap">
                                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                      <span>{t.category || 'Layanan Umum'}</span>
                                    </span>
                                  )}
                                </td>

                                {/* Rincian Permohonan */}
                                <td className="py-3.5 px-4 align-middle text-left text-slate-100">
                                  <p className="line-clamp-2 leading-relaxed break-words text-xs text-slate-100" title={t.description}>
                                    {t.description}
                                  </p>
                                </td>

                                {/* Status (Interactive Inline Dropdown) */}
                                <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                                  <div className="flex justify-start">
                                    <select
                                      value={t.status || 'Open'}
                                      onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border outline-none transition text-left ${
                                        t.status === 'Open'
                                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/35 hover:bg-sky-500/25'
                                          : t.status === 'In Progress'
                                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 hover:bg-amber-500/25'
                                          : t.status === 'Resolved'
                                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25'
                                          : 'bg-[#22242A] text-slate-500 border-white/[0.1] hover:bg-[#22242A]'
                                      }`}
                                      title="Ubah status tiket secara instan"
                                    >
                                      <option value="Open" className="bg-[#141518] text-slate-100">Open</option>
                                      <option value="In Progress" className="bg-[#141518] text-slate-100">In Progress</option>
                                      <option value="Resolved" className="bg-[#141518] text-slate-100">Resolved</option>
                                      <option value="Closed" className="bg-[#141518] text-slate-100">Closed</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Prioritas */}
                                <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                                  <div className="flex justify-start">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-left ${
                                      (t.priority || '').toLowerCase() === 'urgent'
                                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/35'
                                        : (t.priority || '').toLowerCase() === 'tinggi' || (t.priority || '').toLowerCase() === 'high'
                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35'
                                        : 'bg-[#22242A] text-slate-500 border border-white/[0.1]'
                                    }`}>
                                      {t.priority || 'Normal'}
                                    </span>
                                  </div>
                                </td>

                                {/* Aksi */}
                                <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">

                                    {cleanPhone && (
                                      <button
                                        type="button"
                                        onClick={() => openWhatsAppChat(t.contact || t.sender, t.id, t.name)}
                                        className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 transition cursor-pointer shadow-2xs shrink-0"
                                        title="Buka Riwayat Chat WhatsApp"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedTicket(t);
                                        setTicketStatusUpdate(t.status || 'Open');
                                        setTicketNotesUpdate(t.notes || '');
                                        setTicketCategoryUpdate(t.category || 'Layanan Umum');
                                        setTicketPriorityUpdate(t.priority || 'Normal');
                                      }}
                                      className="px-2 py-1 rounded-lg bg-[#181A1F] hover:bg-emerald-500/15 text-slate-100 text-[10px] font-semibold border border-white/[0.07] transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                                      title="Kelola & Detail Tiket"
                                    >
                                      <Edit3 className="w-3 h-3 text-slate-400" />
                                      <span>Kelola</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTicket(t.id)}
                                      disabled={deletingTicketId === t.id}
                                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/35 transition cursor-pointer shadow-2xs shrink-0"
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
                </div>

                {/* 5. MOBILE CARDS VIEW (md:hidden) */}
                <div className="md:hidden space-y-3">
                  {displayTickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 rounded-2xl bg-[#141518] border border-white/[0.07] space-y-2.5 shadow-sm">
                      <Ticket className="w-8 h-8 mx-auto text-slate-400/50" />
                      <p className="font-bold text-slate-100 text-sm">
                        {hasActiveFilter 
                          ? 'Tidak ada tiket yang sesuai dengan filter.'
                          : 'Belum ada tiket layanan yang terdaftar.'}
                      </p>
                      {hasActiveFilter ? (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-[#181A1F] hover:bg-emerald-500/15 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 border border-white/[0.07] transition cursor-pointer shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                          <span>Reset Filter</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCreateTicketModal(true)}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" />
                          <span>Buat Tiket Baru</span>
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
                          className="p-4 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm space-y-3"
                        >
                          {/* Header: ID + Date + Status + Priority */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-xs text-emerald-400">#{t.id}</span>
                                {t.queueNumber && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    Antrian #{t.queueNumber}
                                  </span>
                                )}
                              </div>
                              
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
                                <option value="Open" className="bg-[#141518] text-slate-100">Open</option>
                                <option value="In Progress" className="bg-[#141518] text-slate-100">In Progress</option>
                                <option value="Resolved" className="bg-[#141518] text-slate-100">Resolved</option>
                                <option value="Closed" className="bg-[#141518] text-slate-100">Closed</option>
                              </select>

                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                (t.priority || '').toLowerCase() === 'urgent'
    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/35'
    : (t.priority || '').toLowerCase() === 'tinggi' || (t.priority || '').toLowerCase() === 'high'
    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35'
    : 'bg-[#22242A] text-slate-500 border border-white/[0.1]'
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
                          <p className="text-xs text-slate-100 bg-[#181A1F] p-2.5 rounded-xl border border-white/[0.07] line-clamp-3">
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
                              className="flex-1 py-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/[0.1] transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
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

            const activeCategoryObj =
              selectedCatalogCategory !== 'Semua'
                ? carpetCategoriesList.find(
                    (c) => c.name.trim().toLowerCase() === selectedCatalogCategory.trim().toLowerCase()
                  )
                : null;

            return (
              <div className="space-y-4">
                {/* UNIFIED HEADER, SEARCH & CATEGORY CARDS PANEL */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141518] border border-white/[0.07] shadow-sm space-y-4">
                  {/* Row 1: Title, Summary Badges & Primary Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#181A1F] border border-white/[0.07] text-zinc-200 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Katalog Produk Karpet
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#22242A] border border-white/[0.08] text-zinc-200 text-[11px] font-mono font-bold">
                            {config?.catalog?.length || 0} Produk
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#181A1F] border border-white/[0.07] text-zinc-400 text-[11px] font-mono font-medium">
                            {carpetCategoriesList.length} Kategori
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                          Kelola katalog karpet, harga, kategori produk, dan pemesanan WhatsApp otomatis Rumah Indah Carpet.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleOpenAddCategory}
                        className="py-2 px-3 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white font-semibold text-xs border border-white/[0.07] hover:border-white/[0.14] flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                        title="Tambah Kategori Baru"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Tambah Kategori</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAddProduct}
                        className="py-2 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#141518]" />
                        <span>Tambah Produk Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Search Input & Active Filter Reset */}
                  <div className="pt-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Cari nama karpet, kode, warna, harga..."
                        className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] pl-9 pr-8 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 focus:bg-[#1C1E23] transition"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                          title="Hapus pencarian"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {(selectedCatalogCategory !== 'Semua' || catalogSearch) && (
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedCatalogCategory !== 'Semua' && (
                          <span className="px-3 py-2 rounded-xl bg-[#22242A] border border-white/[0.1] text-zinc-200 text-xs font-medium flex items-center gap-2">
                            <Tag className="w-3 h-3 text-zinc-400" />
                            <span>{selectedCatalogCategory}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCatalogCategory('Semua')}
                              className="text-zinc-400 hover:text-white cursor-pointer"
                              title="Tampilkan semua kategori"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCatalogCategory('Semua');
                            setCatalogSearch('');
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filter</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Category Cards (Always Open) */}
                  <div className="pt-3.5 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    {carpetCategoriesList.map((cat) => {
                      const isSelected = selectedCatalogCategory === cat.name;
                      const catCount = (config?.catalog || []).filter(
                        (p) => (p.category || '').trim().toLowerCase() === cat.name.trim().toLowerCase()
                      ).length;

                      return (
                        <div
                          key={cat.id || cat.name}
                          onClick={() => setSelectedCatalogCategory(isSelected ? 'Semua' : cat.name)}
                          className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer ${
                            isSelected
                              ? 'bg-[#22242A] border-white/[0.2] shadow-sm'
                              : 'bg-[#181A1F] hover:bg-[#22242A]/70 border-white/[0.07] hover:border-white/[0.14]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                  isSelected
                                    ? 'bg-white text-[#141518] border-white'
                                    : 'bg-[#141518] text-zinc-300 border-white/[0.06]'
                                }`}
                              >
                                {catCount} Produk
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditCategory(cat);
                                  }}
                                  title={`Edit kategori "${cat.name}"`}
                                  className="p-1 rounded-md bg-[#141518] hover:bg-[#2C2F36] text-zinc-400 hover:text-white border border-white/[0.07] transition cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(cat.id, cat.name);
                                  }}
                                  title={`Hapus kategori "${cat.name}"`}
                                  className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <h5
                              className="font-bold text-xs text-white mb-1 leading-snug line-clamp-1"
                              title={cat.name}
                            >
                              {cat.name}
                            </h5>
                            <p
                              className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed"
                              title={cat.description}
                            >
                              {cat.description || `Koleksi karpet pilihan ${cat.name} Rumah Indah Carpet Gallery.`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PRODUCT CARDS GRID */}
                {filteredCatalog.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-[#141518]">
                    <ShoppingBag className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                    <p className="font-bold text-zinc-100 text-sm">
                      {catalogSearch || selectedCatalogCategory !== 'Semua'
                        ? 'Tidak ada produk karpet yang cocok dengan filter atau pencarian'
                        : 'Belum ada produk di katalog'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 mb-4">
                      {selectedCatalogCategory !== 'Semua'
                        ? `Belum ada produk dalam kategori "${selectedCatalogCategory}". Klik Tambah Produk untuk mengisi kategori ini.`
                        : 'Klik tombol di bawah untuk menambahkan produk karpet baru ke katalog Anda.'}
                    </p>
                    <div className="flex items-center justify-center gap-2.5">
                      {(selectedCatalogCategory !== 'Semua' || catalogSearch) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCatalogCategory('Semua');
                            setCatalogSearch('');
                          }}
                          className="py-2 px-4 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-200 border border-white/[0.07] font-semibold text-xs transition cursor-pointer"
                        >
                          Tampilkan Semua Karpet
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenAddProduct}
                        className="py-2 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk Sekarang</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {filteredCatalog.map((item) => {
                      const allImages =
                        Array.isArray(item.images) && item.images.length > 0
                          ? item.images
                          : item.image
                          ? [item.image]
                          : [];
                      const cleanImg = (item.image || allImages[0] || 'catalog/karpet-masjid-turki.jpg').replace(
                        /^assets\//,
                        ''
                      );
                      const imgSrc =
                        cleanImg.startsWith('http') || cleanImg.startsWith('data:') ? cleanImg : `/${cleanImg}`;

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/[0.07] bg-[#141518] overflow-hidden flex flex-col justify-between group hover:border-white/[0.16] transition-all duration-200 shadow-sm"
                        >
                          {/* Image Container */}
                          <div className="h-44 bg-[#181A1F] relative overflow-hidden flex items-center justify-center shrink-0">
                            <img
                              src={imgSrc}
                              alt={item.title}
                              onError={(e) => {
                                e.target.src = '/catalog/karpet-masjid-turki.jpg';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141518] via-black/20 to-black/25 pointer-events-none" />

                            {/* Top Left: Category Badge */}
                            <div className="absolute top-3 left-3 max-w-[70%]">
                              <span className="px-2.5 py-1 rounded-lg bg-[#141518]/85 backdrop-blur-md text-zinc-200 font-semibold text-[10px] border border-white/[0.1] flex items-center gap-1.5 truncate">
                                <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{item.category || 'Semua Kategori'}</span>
                              </span>
                            </div>

                            {/* Top Right: ID & Multi-Photo Badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              {allImages.length > 1 && (
                                <span className="px-2 py-0.5 rounded-md bg-[#141518]/85 backdrop-blur-md text-zinc-200 font-semibold text-[10px] border border-white/[0.1] flex items-center gap-1">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>{allImages.length}</span>
                                </span>
                              )}

                            </div>

                            {/* Bottom Right: Price Badge */}
                            <div className="absolute bottom-2.5 right-3">
                              <span className="px-2.5 py-1 rounded-lg bg-[#141518]/90 backdrop-blur-md text-emerald-400 font-bold text-xs border border-emerald-500/30 shadow-md">
                                {item.price}
                              </span>
                            </div>
                          </div>

                          {/* Content Container */}
                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div className="space-y-1.5">
                              <h4
                                className="font-bold text-zinc-100 text-sm leading-snug line-clamp-1 group-hover:text-white transition-colors"
                                title={item.title}
                              >
                                {item.title}
                              </h4>
                              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                                {item.subtitle}
                              </p>
                              {item.footer && (
                                <div className="pt-0.5">
                                  <p className="text-[11px] text-zinc-300 font-medium line-clamp-1 flex items-center gap-1.5 bg-[#181A1F] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                                    <Palette className="w-3 h-3 text-zinc-400 shrink-0" />
                                    <span className="truncate">{item.footer}</span>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Action Buttons */}
                            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-200 hover:text-white text-xs font-medium transition cursor-pointer border border-white/[0.07] flex items-center gap-1 active:scale-95"
                                  title="Edit Produk"
                                >
                                  <Edit3 className="w-3 h-3 text-zinc-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(item.id, item.title)}
                                  disabled={deletingProductId === item.id}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer disabled:opacity-50 active:scale-95"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenSendProductModal(item)}
                                className="px-3 py-1.5 rounded-lg bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.12] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Kirim pesan produk ini ke WhatsApp pelanggan"
                              >
                                <Send className="w-3 h-3 text-emerald-400" />
                                <span>Kirim WA</span>
                              </button>
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

          {/* TAB: STORE PROFILE */}
          {activeTab === 'store_profile' && (
            <div className="space-y-6">



              {/* 2-Column: Store Profile Preview & Live Editor Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Ringkasan Profil Toko */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Nama Toko & Deskripsi Card */}
                  <div className="p-6 sm:p-7 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm backdrop-blur-xl shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-base">Identitas Toko</h3>
                          <p className="text-xs text-slate-400">Profil resmi yang digunakan bot & customer</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Profil Aktif
                      </span>
                    </div>

                    {/* Nama Toko Display */}
                    <div className="p-4 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Nama Toko</p>
                      <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span>{businessSettings.name || 'Nama Toko Belum Diatur'}</span>
                      </h4>
                    </div>

                    {/* Deskripsi Toko Display */}
                    <div className="p-4 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] space-y-1.5">
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Deskripsi Toko</p>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {businessSettings.description || 'Belum ada deskripsi toko.'}
                      </p>
                    </div>
                  </div>

                  {/* Kontak Toko: WhatsApp & Email Card */}
                  <div className="p-6 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm backdrop-blur-xl shadow-xl space-y-4">
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>Kontak Resmi Toko</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      {/* WhatsApp Row */}
                      <div className="p-3.5 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Nomor WhatsApp</p>
                          <p className="font-bold text-slate-100 font-mono text-sm">{businessSettings.phone || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyText(businessSettings.phone, 'Nomor WhatsApp Toko')}
                            className="p-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 transition"
                            title="Salin Nomor WhatsApp"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              sendDirectWaMessage(
                                businessSettings.phone,
                                `Halo ${businessSettings.name || 'Admin Toko'}, saya ingin berkonsultasi seputar pemesanan produk.`
                              );
                            }}
                            className="px-3 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs flex items-center gap-1.5 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat WA</span>
                          </button>
                        </div>
                      </div>

                      {/* Email Row */}
                      <div className="p-3.5 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Email Toko</p>
                          <p className="font-bold text-slate-100 text-sm">{businessSettings.email || '-'}</p>
                        </div>
                        <button
                          onClick={() => handleCopyText(businessSettings.email, 'Email Toko')}
                          className="p-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 transition"
                          title="Salin Email Toko"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Form Editor */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="p-6 sm:p-7 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm backdrop-blur-xl shadow-xl space-y-5">
                    <div className="pb-4 border-b border-white/[0.07]">
                      <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-emerald-400" />
                        <span>Edit Profil Toko</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Perbarui 4 data utama toko Anda untuk identitas bot WhatsApp & informasi pelanggan
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* 1. Nama Toko */}
                      <div>
                        <label className="text-slate-100 font-semibold font-semibold block mb-1.5 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Nama Toko</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan nama toko..."
                          value={businessSettings.name || ''}
                          onChange={(e) => setBusinessSettings((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-slate-100 text-xs focus:border-white/30 focus:outline-none transition shadow-inner"
                        />
                      </div>

                      {/* 2. Nomor WhatsApp & 3. Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-100 font-semibold block mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Nomor WhatsApp</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">Hanya angka</span>
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Contoh: 081298765432"
                            value={businessSettings.phone || ''}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, '');
                              setBusinessSettings((prev) => ({ ...prev, phone: digitsOnly }));
                            }}
                            onKeyDown={(e) => {
                              if (
                                !/^[0-9]$/.test(e.key) &&
                                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-slate-100 text-xs font-mono focus:border-white/30 focus:outline-none transition shadow-inner"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Hanya menerima angka (0-9) tanpa spasi atau strip.
                          </p>
                        </div>
                        <div>
                          <label className="text-slate-100 font-semibold block mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Email</span>
                            </span>
                            {businessSettings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessSettings.email) ? (
                              <span className="text-[10px] text-red-400 font-medium">Format tidak valid</span>
                            ) : businessSettings.email ? (
                              <span className="text-[10px] text-emerald-400 font-medium">Format valid</span>
                            ) : null}
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="Contoh: info@rumahindahcarpet.co.id"
                            value={businessSettings.email || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\s/g, '');
                              setBusinessSettings((prev) => ({ ...prev, email: val }));
                            }}
                            className={`w-full rounded-xl bg-[#181A1F] border px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none transition shadow-inner ${
                              businessSettings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessSettings.email)
                                ? 'border-red-500/50 focus:border-red-500'
                                : 'border-white/[0.07] focus:border-white/30'
                            }`}
                          />
                          {businessSettings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessSettings.email) ? (
                            <p className="text-[11px] text-red-400 mt-1">
                              Wajib format email yang benar (contoh: info@rumahindahcarpet.co.id)
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Hanya bisa diisi dengan format alamat email yang valid.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 4. Deskripsi Toko */}
                      <div>
                        <label className="text-slate-100 font-semibold font-semibold block mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Deskripsi Toko</span>
                        </label>
                        <textarea
                          rows={6}
                          placeholder="Tuliskan deskripsi profil, produk utama, spesifikasi layanan, atau keunggulan toko Anda..."
                          value={businessSettings.description || ''}
                          onChange={(e) => setBusinessSettings((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-slate-100 text-xs focus:border-white/30 focus:outline-none leading-relaxed transition resize-y shadow-inner"
                        />

                      </div>

                      {/* Tombol Simpan */}
                      <button
                        onClick={handleSaveStoreProfile}
                        disabled={savingStoreInfo}
                        className="w-full py-3 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 mt-2"
                      >
                        {savingStoreInfo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>{savingStoreInfo ? 'Menyimpan...' : 'Simpan Profil Toko'}</span>
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
              {/* TOP HEADER */}
              <div className="p-5 sm:p-6 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-black/40 shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                      <span>Jadwal Operasional Toko & Pelayanan Admin CS</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola jam buka showroom fisik dan jadwal respons aktif customer service WhatsApp
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveStoreSection('schedule_info', scheduleSettings, 'Jadwal operasional & jam admin CS berhasil disimpan!')}
                  disabled={savingStoreInfo}
                  className="py-2.5 px-5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {savingStoreInfo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{savingStoreInfo ? 'Menyimpan...' : 'Simpan Perubahan Jadwal'}</span>
                </button>
              </div>

              {/* 2 KARTU UTAMA: 1. JAM OPERASIONAL TOKO & 2. JAM PELAYANAN ADMIN CS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KARTU 1: Jam Operasional Toko (Fisik) */}
                <div className="p-6 sm:p-7 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm space-y-4 hover:border-white/[0.18] transition-colors flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            <span>1. Jam Operasional Toko (Showroom & Galeri)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Waktu kunjungan langsung pelanggan ke galeri fisik untuk memilih motif karpet
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        Toko Fisik
                      </span>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Jadwal & Jam Buka Showroom:
                      </label>
                      <textarea
                        rows={6}
                        value={scheduleSettings.store_hours || ''}
                        onChange={(e) => setScheduleSettings((prev) => ({ ...prev, store_hours: e.target.value }))}
                        placeholder="Contoh:&#10;Senin - Sabtu: 08:30 - 20:00 WIB&#10;Minggu & Hari Libur: 09:00 - 18:00 WIB"
                        className="w-full rounded-2xl bg-[#181A1F] border border-white/[0.07] p-3.5 text-slate-100 text-xs font-medium focus:bg-[#1C1E23] focus:border-white/30 focus:ring-2 focus:ring-white/10 focus:outline-none transition leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#181A1F] border border-white/[0.07] text-[11px] text-slate-400 flex items-center gap-2 mt-2">
                    <span className="text-sm">💡</span>
                    <span>Informasi ini otomatis disebutkan AI saat pelanggan bertanya alamat atau jam buka toko.</span>
                  </div>
                </div>

                {/* KARTU 2: Jam Pelayanan Admin Customer Service (CS WhatsApp) */}
                <div className="p-6 sm:p-7 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm space-y-4 hover:border-sky-500/50 transition-colors flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                          <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            <span>2. Jam Pelayanan Admin Customer Service</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Waktu aktif staf admin manusia melayani chat WhatsApp & konfirmasi pesanan
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        Chat WhatsApp
                      </span>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Jadwal & Jam Pelayanan Admin CS:
                      </label>
                      <textarea
                        rows={6}
                        value={scheduleSettings.cs_hours || ''}
                        onChange={(e) => setScheduleSettings((prev) => ({ ...prev, cs_hours: e.target.value }))}
                        placeholder="Contoh:&#10;Setiap Hari (Senin - Minggu): 08:00 - 21:00 WIB&#10;(Chat di luar jam admin dilayani otomatis oleh AI Chatbot 24 jam nonstop)"
                        className="w-full rounded-2xl bg-[#181A1F] border border-white/[0.07] p-3.5 text-slate-100 text-xs font-medium focus:bg-[#1C1E23] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#181A1F] border border-white/[0.07] text-[11px] text-slate-400 flex items-center gap-2 mt-2">
                    <span className="text-sm">💬</span>
                    <span>Di luar jam kerja admin, percakapan otomatis dijawab ramah oleh AI Chatbot 24 jam nonstop.</span>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* TAB: LOCATION & ADDRESS */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              {/* Header with Title, Search, and Tambah Lokasi Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span>Lokasi Alamat Showroom & Gudang Rumah Indah Carpet Gallery</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                      {(locationSettings.items || []).length} Lokasi Terdaftar
                    </span>
                  </div>

                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenAddLocation}
                    className="py-2 px-4 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-lg shadow-amber-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
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
                    <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.07] bg-[#181A1F]/30">
                      <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="font-semibold text-slate-400 text-sm">
                        Belum ada lokasi showroom atau cabang tersimpan
                      </p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Klik tombol di bawah untuk menambahkan alamat showroom atau workshop baru.
                      </p>
                      <button
                        onClick={handleOpenAddLocation}
                        className="py-2 px-4 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs inline-flex items-center gap-1.5 transition"
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
                      return (
                        <div
                          key={loc.id || idx}
                          className="p-5 sm:p-6 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm flex flex-col justify-between space-y-4 hover:border-white/[0.15] transition-all group"
                        >
                          <div className="space-y-3.5">
                            {/* Card Top: Icon, Title & Edit/Delete Actions */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-[#181A1F] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-zinc-100 text-sm sm:text-base leading-snug group-hover:text-white transition-colors truncate" title={loc.title}>
                                    {loc.title}
                                  </h4>

                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLocation(loc, idx)}
                                  title="Edit Lokasi"
                                  className="p-1.5 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-400 hover:text-white border border-white/[0.07] transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLocation(idx, loc.title)}
                                  title="Hapus Lokasi"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Address Text */}
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {loc.address}
                            </p>

                            {/* Info Box: Landmark, Hours, Phone */}
                            <div className="p-3.5 rounded-xl bg-[#181A1F] border border-white/[0.06] text-xs space-y-2">
                              {loc.landmark && (
                                <div className="flex items-start gap-2 text-zinc-400 text-[11px]">
                                  <Map className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                                  <span>{loc.landmark}</span>
                                </div>
                              )}
                              {loc.hours && (
                                <div className="flex items-start gap-2 text-zinc-400 text-[11px]">
                                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                                  <span className="text-zinc-300">{loc.hours}</span>
                                </div>
                              )}
                              {loc.phone && (
                                <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  <span className="font-mono text-emerald-400 font-semibold">{loc.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions: Salin Alamat & Buka Google Maps */}
                          <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyText(loc.address, `Alamat ${loc.title}`)}
                              className="flex-1 py-2 px-3 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-white/[0.07] transition cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{copiedField === `Alamat ${loc.title}` ? 'Tersalin!' : 'Salin Alamat'}</span>
                            </button>

                            {loc.maps_url && (
                              <a
                                href={loc.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2 px-3 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-zinc-200 hover:text-white font-semibold text-xs border border-white/[0.1] transition flex items-center justify-center gap-1.5 shrink-0"
                                title="Buka di Google Maps"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                                <span>Buka Maps</span>
                              </a>
                            )}
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
              <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.07] bg-[#141518] shadow-sm backdrop-blur-xl shadow-xl space-y-6">
                <div className="pb-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-black text-slate-100 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-slate-400" /><span>{warrantySettings.title || 'Jaminan Kualitas & Garansi Resmi Rumah Indah Carpet'}</span></h3>
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
                    <label className="text-slate-100 font-semibold font-semibold block mb-1.5">Judul Dokumen Garansi</label>
                    <input
                      type="text"
                      value={warrantySettings.title}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2.5 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-100 font-semibold font-semibold block mb-1.5">Ringkasan Garansi</label>
                    <textarea
                      rows={2}
                      value={warrantySettings.summary}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, summary: e.target.value }))}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-100 font-semibold font-semibold block mb-1.5">Panduan Langkah Klaim</label>
                    <textarea
                      rows={3}
                      value={warrantySettings.claim_steps}
                      onChange={(e) => setWarrantySettings((prev) => ({ ...prev, claim_steps: e.target.value }))}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end pt-2 border-t border-white/[0.07]">
                    <button
                      onClick={() => handleSaveStoreSection('warranty_info', warrantySettings, 'Ketentuan garansi berhasil disimpan!')}
                      disabled={savingStoreInfo}
                      className="py-2.5 px-6 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
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
                    setPromoStartDate('2026-11-01');
                    setPromoEndDate('2026-11-30');
                    setPromoForm({
                      id: '',
                      title: '',
                      discount: '',
                      desc: '',
                      valid_until: '01/11/2026 sampai 30/11/2026'
                    });
                    setShowPromoModal(true);
                  }}
                  className="py-2 px-4 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
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
                    className="p-5 sm:p-6 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm flex flex-col justify-between space-y-4 hover:border-white/[0.15] transition-all group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-zinc-100 text-base leading-snug group-hover:text-white transition-colors flex-1" title={promo.title}>
                          {promo.title}
                        </h4>
                        <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                          Masa Berlaku: <strong className="text-zinc-200 font-semibold">{promo.valid_until || 'Tersedia'}</strong>
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#181A1F] border border-white/[0.08] text-zinc-100 font-semibold text-sm shadow-xs">
                        {promo.discount}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                        {promo.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const text = `🔥 *${promo.title}*\n${promo.discount}\n\n${promo.desc}\n\n*Berlaku:* ${promo.valid_until}\nInfo pemesanan: Hubungi Rumah Indah Carpet Gallery`;
                            handleCopyText(text, `Promo ${promo.id || idx}`);
                          }}
                          className="py-2 px-3 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.07] transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{copiedField === `Promo ${promo.id || idx}` ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSendPromoModal(promo)}
                          className="py-2 px-3.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.12] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Kirim promo ini ke riwayat chat WhatsApp pelanggan"
                        >
                          <Send className="w-3 h-3 text-emerald-400" />
                          <span>Kirim via WA</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPromoIndex(idx);
                            setPromoForm(promo);
                            const parts = (promo.valid_until || '').split(/\s*(?:sampai|-|s\/d)\s*/i);
                            setPromoStartDate(parseDMYtoYMD(parts[0]) || '');
                            setPromoEndDate(parseDMYtoYMD(parts[1]) || '');
                            setShowPromoModal(true);
                          }}
                          className="p-2 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-400 hover:text-white border border-white/[0.07] transition cursor-pointer"
                          title="Edit Promo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePromo(idx)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
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
            <div className="w-full space-y-4 animate-in fade-in duration-200">
              {/* UNIFIED HEADER, SEARCH & CATEGORY FILTER PANEL */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141518] border border-white/[0.07] shadow-sm space-y-4">
                {/* Row 1: Title, Badges & Action Toolbar */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#181A1F] border border-white/[0.07] text-zinc-200 flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          Basis Tanya Jawab AI (Knowledge Base)
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#22242A] border border-white/[0.08] text-zinc-200 text-[11px] font-mono font-bold">
                          {faqs.length} Q&A Aktif
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#181A1F] border border-white/[0.07] text-zinc-400 text-[11px] font-mono font-medium">
                          {new Set(faqs.map((f) => f.category || 'Umum')).size} Topik
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        Kelola bank pertanyaan dan jawaban resmi toko agar AI menjawab chat WhatsApp pelanggan secara konsisten dan akurat.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={excelFileInputRef}
                      onChange={handleUploadExcelFaq}
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                    />

                    <button
                      onClick={handleDownloadFaqTemplate}
                      title="Unduh format template Excel (.xlsx) untuk mengisi pertanyaan & jawaban secara massal"
                      className="py-2 px-3 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.07] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Template Excel</span>
                    </button>

                    <button
                      onClick={() => excelFileInputRef.current?.click()}
                      disabled={faqImporting}
                      title="Upload file Excel (.xlsx / .csv) untuk otomatis menambah Q&A ke memori AI"
                      className="py-2 px-3 rounded-xl bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.07] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Upload className={'w-3.5 h-3.5 text-zinc-400 ' + (faqImporting ? 'animate-bounce' : '')} />
                      <span>{faqImporting ? 'Mengimpor...' : 'Upload Excel'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddFaq()}
                      className="py-2 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#141518]" />
                      <span>Tambah Tanya Jawab</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Search Input & Category Filter Pills */}
                <div className="pt-3.5 border-t border-white/[0.06] space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={faqSearchQuery}
                        onChange={(e) => setFaqSearchQuery(e.target.value)}
                        placeholder="Cari pertanyaan atau jawaban..."
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#181A1F] border border-white/[0.07] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 focus:bg-[#1C1E23] transition"
                      />
                      {faqSearchQuery && (
                        <button
                          onClick={() => setFaqSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {(faqCategoryFilter !== 'Semua' || faqSearchQuery) && (
                      <button
                        onClick={() => {
                          setFaqCategoryFilter('Semua');
                          setFaqSearchQuery('');
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Filter</span>
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills (Clean, Sleek & Deletable - No Edit) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {/* Pill: Semua */}
                    <button
                      type="button"
                      onClick={() => setFaqCategoryFilter('Semua')}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        faqCategoryFilter === 'Semua'
                          ? 'bg-[#22242A] text-white border border-white/[0.18]'
                          : 'bg-[#181A1F] text-zinc-400 hover:text-white hover:bg-[#22242A] border border-white/[0.06]'
                      }`}
                    >
                      <span>Semua</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        faqCategoryFilter === 'Semua' ? 'bg-white text-[#141518]' : 'bg-[#22242A] text-zinc-400'
                      }`}>
                        {faqs.length}
                      </span>
                    </button>

                    {/* Pills: Per Category with Delete Button */}
                    {allFaqCategories.map((cat) => {
                      const isSelected = faqCategoryFilter.toLowerCase() === cat.toLowerCase();
                      const count = faqs.filter(
                        (f) => (f.category || 'Umum').trim().toLowerCase() === cat.trim().toLowerCase()
                      ).length;

                      return (
                        <div
                          key={cat}
                          onClick={() => setFaqCategoryFilter(isSelected ? 'Semua' : cat)}
                          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold transition cursor-pointer shadow-xs ${
                            isSelected
                              ? 'bg-[#22242A] text-white border border-white/[0.18]'
                              : 'bg-[#181A1F] text-zinc-400 hover:text-white hover:bg-[#22242A] border border-white/[0.06]'
                          }`}
                        >
                          <span>{cat}</span>
                          {count > 0 && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected ? 'bg-white text-[#141518]' : 'bg-[#22242A] text-zinc-400'
                            }`}>
                              {count}
                            </span>
                          )}

                          {cat.toLowerCase() !== 'umum' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFaqCategory(cat);
                              }}
                              title={`Hapus kategori "${cat}"`}
                              className="p-0.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer ml-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Category Pill Button */}
                    <button
                      type="button"
                      onClick={handleOpenAddFaqCategory}
                      className="px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold transition cursor-pointer border border-dashed border-white/[0.15] bg-[#181A1F]/50 text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 flex items-center gap-1.5"
                      title="Tambah Kategori Baru"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Tambah Kategori</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FAQ Cards Grid */}
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
                    <div className="p-12 rounded-2xl border border-dashed border-white/[0.08] bg-[#141518] text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#181A1F] border border-white/[0.07] text-zinc-400 mx-auto flex items-center justify-center">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Tidak ada Tanya-Jawab yang cocok</h4>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        {faqSearchQuery || faqCategoryFilter !== 'Semua'
                          ? 'Coba ganti kata kunci pencarian atau reset filter kategori di atas.'
                          : 'Belum ada data tanya-jawab. Klik tombol di bawah untuk menambah pertanyaan pertama.'}
                      </p>
                      <button
                        onClick={() => handleOpenAddFaq()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Tanya Jawab Baru</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filtered.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-4 sm:p-5 rounded-2xl border border-white/[0.07] bg-[#141518] hover:border-white/[0.15] transition space-y-3.5 flex flex-col justify-between shadow-sm"
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-[#22242A] border border-white/[0.08] text-zinc-100 text-[11px] font-semibold">
                                🏷️ {item.category || 'Umum'}
                              </span>

                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleEditFaq(item)}
                                className="p-1.5 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-400 hover:text-white border border-white/[0.07] transition cursor-pointer"
                                title="Edit Pertanyaan & Jawaban"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFaq(item.id || idx)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition cursor-pointer"
                                title="Hapus dari memori AI"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Question */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-[#22242A] border border-white/[0.08] text-zinc-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                              Q
                            </div>
                            <h3 className="text-sm font-bold text-white leading-snug">
                              {item.q}
                            </h3>
                          </div>

                          {/* AI Official Answer */}
                          <div className="p-3.5 rounded-xl bg-[#181A1F] border border-white/[0.06] space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold">
                              <Bot className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Jawaban Resmi AI & CS:</span>
                            </div>
                            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line pl-3 border-l-2 border-emerald-500/50">
                              {item.a}
                            </p>
                          </div>
                        </div>

                        {/* Footer Status */}
                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Tersinkronisasi ke Memori AI</span>
                          </div>
                          <button
                            onClick={() => {
                              setSimPrompt(item.q);
                              setActiveTab('gemini');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.07] text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-zinc-400" />
                            <span>Uji di Simulator</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: HANDS-OFF CS & AI TAKEOVER */}
          {activeTab === 'handoff' && (() => {
            return (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* UNIFIED HEADER, SUB-TABS & ACTIONS BAR */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141518] border border-white/[0.07] shadow-sm space-y-4">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#181A1F] border border-white/[0.07] text-zinc-200 flex items-center justify-center shrink-0">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Hands-Off Customer Service & AI Takeover
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                          Atur pengalihan obrolan otomatis dari bot AI ke CS manusia saat pelanggan membutuhkan bantuan khusus.
                        </p>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <label className="flex items-center gap-2.5 cursor-pointer bg-[#181A1F] px-3.5 py-2 rounded-xl border border-white/[0.07] select-none shadow-xs">
                        <span className="text-xs font-semibold text-zinc-300">Status Hands-Off:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(handoffConfig.enabled)}
                          onChange={() => {
                            const newStatus = !handoffConfig.enabled;
                            handleSaveHandoffConfig({ ...handoffConfig, enabled: newStatus });
                          }}
                          disabled={savingHandoffConfig}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#141518] after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                        <span className={"text-xs font-bold " + (handoffConfig.enabled ? 'text-emerald-400' : 'text-zinc-500')}>
                          {handoffConfig.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleSaveHandoffConfig()}
                        disabled={savingHandoffConfig}
                        className="py-2 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        {savingHandoffConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>{savingHandoffConfig ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Tabs + Quick Metrics Row */}
                  <div className="pt-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHandoffSubTab('rules')}
                        className={
                          'px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ' +
                          (handoffSubTab === 'rules'
                            ? 'bg-[#22242A] text-white border border-white/[0.14] shadow-xs'
                            : 'bg-[#181A1F] text-zinc-400 hover:text-white border border-white/[0.06]')
                        }
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Aturan & Kata Kunci</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHandoffSubTab('tester')}
                        className={
                          'px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ' +
                          (handoffSubTab === 'tester'
                            ? 'bg-[#22242A] text-white border border-white/[0.14] shadow-xs'
                            : 'bg-[#181A1F] text-zinc-400 hover:text-white border border-white/[0.06]')
                        }
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Uji Pemicu Hands-Off</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#181A1F] border border-white/[0.06] text-zinc-300 font-mono text-[11px]">
                        Pemicu CS: <strong className="text-white">{handoffConfig.keywords?.length || 0} kata</strong>
                      </span>
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#181A1F] border border-white/[0.06] text-zinc-300 font-mono text-[11px]">
                        Rilis Bot: <strong className="text-emerald-400">{handoffConfig.release_keywords?.length || 0} kata</strong>
                      </span>
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#181A1F] border border-white/[0.06] text-zinc-300 font-mono text-[11px]">
                        Expire: <strong className="text-white">{handoffConfig.auto_expire_hours || 2} Jam</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* SUBTAB 1: ATURAN & KATA KUNCI PEMICU (2-Column Balanced Grid) */}
                {handoffSubTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left Card: Trigger Keywords */}
                      <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.06]">
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Tag className="w-4 h-4 text-amber-400" />
                                <span>Kata Kunci Pemicu Alih ke CS</span>
                              </h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Saat pelanggan mengetik kata ini, AI berhenti dan dialihkan ke CS manusia.
                              </p>
                            </div>

                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(handoffConfig.keywords || []).map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181A1F] border border-white/[0.08] text-zinc-100 text-xs font-semibold"
                              >
                                <span>{kw}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHandoffKeyword(kw)}
                                  className="text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                                  title="Hapus kata kunci"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
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
                            placeholder="Tambah kata pemicu CS (misal: 'admin', 'bicara cs')..."
                            className="flex-1 rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 transition"
                          />
                          <button
                            type="button"
                            onClick={handleAddHandoffKeyword}
                            className="py-2 px-3.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Card: Release Keywords */}
                      <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.06]">
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Bot className="w-4 h-4 text-emerald-400" />
                                <span>Kata Kunci Kembali ke Bot AI</span>
                              </h4>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Perintah untuk mengaktifkan kembali bot AI setelah sesi CS manusia selesai.
                              </p>
                            </div>

                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(handoffConfig.release_keywords || []).map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                              >
                                <span>{kw}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReleaseKeyword(kw)}
                                  className="text-emerald-400 hover:text-rose-400 transition cursor-pointer"
                                  title="Hapus kata kunci rilis"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
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
                            placeholder="Tambah kata rilis bot (misal: '!bot', 'selesai')..."
                            className="flex-1 rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 transition"
                          />
                          <button
                            type="button"
                            onClick={handleAddReleaseKeyword}
                            className="py-2 px-3.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card: Auto-Expire & Takeover Notice */}
                    <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Auto-Expire Sesi CS</span>
                        </label>
                        <select
                          value={handoffConfig.auto_expire_hours || 2}
                          onChange={(e) => setHandoffConfig((prev) => ({ ...prev, auto_expire_hours: Number(e.target.value) }))}
                          className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-white/25 font-medium transition cursor-pointer"
                        >
                          <option value={1}>1 Jam (Cepat)</option>
                          <option value={2}>2 Jam (Standar)</option>
                          <option value={4}>4 Jam</option>
                          <option value={8}>8 Jam</option>
                          <option value={24}>24 Jam (1 Hari)</option>
                        </select>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Jika CS tidak aktif merespons selama durasi ini, bot AI otomatis aktif kembali.
                        </p>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-white block">
                          Pesan Otomatis Saat Dialihkan ke CS (Hand-Off Notice)
                        </label>
                        <textarea
                          rows={2}
                          value={handoffConfig.takeover_notice || ''}
                          onChange={(e) => setHandoffConfig((prev) => ({ ...prev, takeover_notice: e.target.value }))}
                          placeholder="Pesan yang dikirim ke pelanggan saat percakapan dialihkan ke CS manusia..."
                          className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 leading-relaxed font-medium transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: TESTER */}
                {handoffSubTab === 'tester' && (
                  <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#141518] shadow-sm space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-zinc-400" />
                        <span>Simulasi & Uji Kata Kunci Hands-Off</span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Ketik contoh pesan pelanggan untuk memastikan kata kunci pemicu CS atau rilis bot berfungsi sesuai aturan.
                      </p>
                    </div>

                    <textarea
                      rows={3}
                      value={testHandoffQuery}
                      onChange={(e) => setTestHandoffQuery(e.target.value)}
                      placeholder="Ketik contoh pesan pelanggan, misal: 'Halo saya ingin bicara dengan admin manusia'..."
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/25 leading-relaxed font-medium transition"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>Contoh cepat:</span>
                        <button
                          type="button"
                          onClick={() => setTestHandoffQuery('Bisa bicara dengan admin manusia?')}
                          className="text-zinc-300 hover:text-white font-semibold underline cursor-pointer"
                        >
                          "Bicara admin manusia"
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setTestHandoffQuery('Kembali ke bot asisten')}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                        >
                          "Kembali ke bot"
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestHandoffMessage}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Uji Pesan Ini</span>
                      </button>
                    </div>

                    {testHandoffResult && (
                      <div
                        className={
                          'p-4 rounded-xl border transition-all ' +
                          (testHandoffResult.type === 'TRIGGER'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : testHandoffResult.type === 'RELEASE'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-[#181A1F] border-white/[0.1] text-zinc-100')
                        }
                      >
                        <div className="flex items-center gap-2 font-bold text-xs mb-1">
                          {testHandoffResult.type === 'TRIGGER' && <Headphones className="w-4 h-4 text-amber-400" />}
                          {testHandoffResult.type === 'RELEASE' && <Bot className="w-4 h-4 text-emerald-400" />}
                          {testHandoffResult.type === 'AI_REPLY' && <Sparkles className="w-4 h-4 text-zinc-300" />}
                          <span>{testHandoffResult.title}</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">{testHandoffResult.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 12: SETTINGS (ANTI-SPAM, DELAY & PROTECTIONS) */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* UNIFIED HEADER & SUB-TABS CONTROL CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141518] border border-white/[0.07] shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#181A1F] border border-white/[0.07] text-zinc-200 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          Pengaturan Anti-Spam, Cooldown & Proteksi Akun
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#22242A] border border-white/[0.08] text-zinc-200 text-[11px] font-mono font-bold">
                          Meta Anti-Ban
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        Kelola jeda waktu acak (delay), simulasi mengetik, proteksi flood spam, dan batas global agar akun WhatsApp aman.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSaveProtections()}
                      disabled={savingProtections}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-[#141518] text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
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

                {/* Sub-Tabs Navigation Merged Inside Top Card */}
                <div className="pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'cooldown', label: 'Delay & Cooldown', icon: Clock },
                    { id: 'dedup', label: 'Anti-Pesan Kembar', icon: Copy },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = protectionsSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setProtectionsSubTab(tab.id)}
                        className={
                          'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ' +
                          (isActive
                            ? 'bg-[#22242A] text-white border border-white/[0.14] shadow-xs'
                            : 'bg-[#181A1F] text-zinc-400 hover:text-white hover:bg-[#22242A] border border-white/[0.06]')
                        }
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SUB-TAB 1: DELAY & COOLDOWN */}
              {protectionsSubTab === 'cooldown' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-[#141518] border border-white/[0.07] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.07] gap-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2.5">
                          <Clock className="w-5 h-5 text-slate-400" />
                          <span>Delay Pengiriman & Simulasi Mengetik Alami</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Memberikan jeda waktu acak sebelum bot membalas pesan dan menampilkan status "sedang mengetik..." di WhatsApp agar terkesan manusiawi.
                        </p>
                      </div>

                      {/* Enable Switch */}
                      <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-[#181A1F] px-4 py-2 rounded-xl border border-white/[0.07] shadow-xs">
                        <span className="text-xs font-bold text-slate-100">Status Delay:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(protectionsConfig.cooldown?.enabled)}
                          onChange={(e) => updateNestedProtections('cooldown', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#141518] after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                        <span className={"text-xs font-bold " + (protectionsConfig.cooldown?.enabled ? 'text-emerald-400' : 'text-slate-400')}>
                          {protectionsConfig.cooldown?.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    {(() => {
                        const normalSec = Math.round((protectionsConfig.cooldown?.normal_delay_ms ?? protectionsConfig.cooldown?.min_delay_ms ?? 2500) / 1000);
                        const longSec = Math.round((protectionsConfig.cooldown?.long_delay_ms ?? protectionsConfig.cooldown?.max_delay_ms ?? 4000) / 1000);
                        const jitterMs = protectionsConfig.cooldown?.jitter_ms ?? 1500;
                        const jitterSec = (jitterMs / 1000).toFixed(1);
                        const typingEnabled = Boolean(protectionsConfig.cooldown?.typing_simulation);
                        const typingCpm = protectionsConfig.cooldown?.typing_speed_cpm || 300;

                        const setNormalSec = (sec) => {
                          const val = Math.max(1, Math.min(300, parseInt(sec) || 1));
                          updateNestedProtections('cooldown', 'normal_delay_ms', val * 1000);
                          updateNestedProtections('cooldown', 'min_delay_ms', val * 1000);
                        };

                        const setLongSec = (sec) => {
                          const val = Math.max(1, Math.min(600, parseInt(sec) || 1));
                          updateNestedProtections('cooldown', 'long_delay_ms', val * 1000);
                          updateNestedProtections('cooldown', 'max_delay_ms', val * 1000);
                        };

                        const setJitterSec = (sec) => {
                          const val = Math.max(0, Math.min(15000, Math.round((parseFloat(sec) || 0) * 1000)));
                          updateNestedProtections('cooldown', 'jitter_ms', val);
                        };

                        const setCpm = (cpm) => {
                          const val = Math.max(50, Math.min(1200, parseInt(cpm) || 300));
                          updateNestedProtections('cooldown', 'typing_speed_cpm', val);
                        };

                        return (
                          <div className="space-y-4">
                            {/* UNIFIED SETTINGS LIST */}
                            <div className="bg-[#181A1F] border border-white/[0.07] rounded-2xl divide-y divide-white/[0.07] shadow-xs">
                              
                              {/* ROW 1: DELAY BALASAN SINGKAT */}
                              <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5 max-w-md">
                                  <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-emerald-400 shrink-0">
                                    <Clock className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">Delay Balasan Singkat</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                      Jeda sebelum bot membalas pesan sapaan, menu, atau chat pendek (&lt; 160 karakter).
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center">
                                  {/* Compact Fine-Tuning Stepper */}
                                  <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setNormalSec(normalSec - 1)}
                                      disabled={normalSec <= 1}
                                      title="Kurangi 1 detik"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="px-2 text-center">
                                      <span className="font-mono font-bold text-xs text-white">{normalSec}</span>
                                      <span className="text-[10px] text-zinc-500 ml-1">dtk</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setNormalSec(normalSec + 1)}
                                      disabled={normalSec >= 300}
                                      title="Tambah 1 detik"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* ROW 2: DELAY BALASAN PANJANG */}
                              <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5 max-w-md">
                                  <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-sky-400 shrink-0">
                                    <Bot className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">Delay Balasan Panjang (AI)</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                      Jeda untuk jawaban mendalam AI, konsultasi karpet, spesifikasi, atau katalog (&gt; 160 karakter).
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center">
                                  {/* Compact Fine-Tuning Stepper */}
                                  <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setLongSec(longSec - 1)}
                                      disabled={longSec <= 2}
                                      title="Kurangi 1 detik"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="px-2 text-center">
                                      <span className="font-mono font-bold text-xs text-white">{longSec}</span>
                                      <span className="text-[10px] text-zinc-500 ml-1">dtk</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setLongSec(longSec + 1)}
                                      disabled={longSec >= 600}
                                      title="Tambah 1 detik"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* ROW 3: VARIASI WAKTU ACAK (JITTER) */}
                              <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5 max-w-md">
                                  <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">Variasi Waktu Acak (Jitter)</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                      Memberikan variasi acak agar jeda balasan tidak berulang kaku pada milidetik yang sama.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center">
                                  {/* Compact Fine-Tuning Stepper */}
                                  <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setJitterSec((parseFloat(jitterSec) - 0.5).toFixed(1))}
                                      disabled={parseFloat(jitterSec) <= 0}
                                      title="Kurangi 0.5 detik"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="px-2 text-center">
                                      <span className="font-mono font-bold text-xs text-white">±{jitterSec}</span>
                                      <span className="text-[10px] text-zinc-500 ml-1">dtk</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setJitterSec((parseFloat(jitterSec) + 0.5).toFixed(1))}
                                      disabled={parseFloat(jitterSec) >= 15}
                                      title="Tambah 0.5 detik"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* ROW 4: SIMULASI MENGETIK */}
                              <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5 max-w-md">
                                  <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-purple-400 shrink-0">
                                    <MessageSquare className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">Simulasi Mengetik (Typing Presence)</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                      Menampilkan status "sedang mengetik..." sesaat sebelum balasan dikirim agar terasa manusiawi.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 self-start xl:self-center">
                                  {/* Toggle Switch */}
                                  <label className="flex items-center gap-2.5 cursor-pointer bg-[#141518] px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
                                    <span className="text-xs font-semibold text-zinc-300">Status Mengetik:</span>
                                    <input
                                      type="checkbox"
                                      checked={typingEnabled}
                                      onChange={(e) => updateNestedProtections('cooldown', 'typing_simulation', e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#141518] after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                                    <span className={`text-xs font-bold ${typingEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                      {typingEnabled ? 'Aktif' : 'Off'}
                                    </span>
                                  </label>

                                  {/* Stepper for Typing CPM */}
                                  {typingEnabled && (
                                    <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5 animate-in fade-in duration-150">
                                      <button
                                        type="button"
                                        onClick={() => setCpm(typingCpm - 25)}
                                        disabled={typingCpm <= 100}
                                        title="Kurangi 25 CPM"
                                        className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="px-2 text-center">
                                        <span className="font-mono font-bold text-xs text-white">{typingCpm}</span>
                                        <span className="text-[10px] text-zinc-500 ml-1">CPM</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setCpm(typingCpm + 25)}
                                        disabled={typingCpm >= 1000}
                                        title="Tambah 25 CPM"
                                        className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              )}

              {/* SUB-TAB 3: DEDUPLICATION & DEBOUNCE BUFFER */}
              {protectionsSubTab === 'dedup' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-[#141518] border border-white/[0.07] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    {/* HEADER & MASTER DEDUP SWITCH */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.07] gap-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2.5">
                          <Copy className="w-5 h-5 text-slate-400" />
                          <span>Anti-Pesan Kembar & Debounce Penggabungan Chat</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Menghilangkan pengiriman berulang karena klik dobel WhatsApp dan menggabungkan chat kalimat terpotong dari pelanggan.
                        </p>
                      </div>

                      {/* Enable Switch */}
                      <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-[#181A1F] px-4 py-2 rounded-xl border border-white/[0.07] shadow-xs">
                        <span className="text-xs font-bold text-slate-100">Status Deduplikasi:</span>
                        <input
                          type="checkbox"
                          checked={Boolean(protectionsConfig.deduplication?.enabled !== false)}
                          onChange={(e) => updateNestedProtections('deduplication', 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#141518] after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                        <span className={"text-xs font-bold " + (protectionsConfig.deduplication?.enabled !== false ? 'text-emerald-400' : 'text-slate-400')}>
                          {protectionsConfig.deduplication?.enabled !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    {(() => {
                      const inboundSec = Number(((protectionsConfig.deduplication?.content_window_ms || 3000) / 1000).toFixed(1));
                      const outboundSec = Number(((protectionsConfig.deduplication?.outbound_window_ms || 4000) / 1000).toFixed(1));
                      const debounceSec = Number(((protectionsConfig.conversation_buffer?.debounce_ms || 3000) / 1000).toFixed(1));
                      const bufferMaxItems = protectionsConfig.conversation_buffer?.max_buffer_items || 10;
                      const bufferEnabled = Boolean(protectionsConfig.conversation_buffer?.enabled !== false);

                      const setInboundSec = (sec) => {
                        const val = Math.max(1, Math.min(20, parseFloat(sec) || 1));
                        updateNestedProtections('deduplication', 'content_window_ms', Math.round(val * 1000));
                      };

                      const setOutboundSec = (sec) => {
                        const val = Math.max(1, Math.min(30, parseFloat(sec) || 1));
                        updateNestedProtections('deduplication', 'outbound_window_ms', Math.round(val * 1000));
                      };

                      const setDebounceSec = (sec) => {
                        const val = Math.max(0.5, Math.min(10, parseFloat(sec) || 0.5));
                        updateNestedProtections('conversation_buffer', 'debounce_ms', Math.round(val * 1000));
                      };

                      const setBufferMaxItems = (items) => {
                        const val = Math.max(2, Math.min(50, parseInt(items) || 10));
                        updateNestedProtections('conversation_buffer', 'max_buffer_items', val);
                      };

                      return (
                        <div className="space-y-4">
                          {/* UNIFIED SETTINGS LIST */}
                          <div className="bg-[#181A1F] border border-white/[0.07] rounded-2xl divide-y divide-white/[0.07] shadow-xs">

                            {/* ROW 1: JENDELA FILTER PESAN MASUK KEMBAR */}
                            <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5 max-w-md">
                                <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-emerald-400 shrink-0">
                                  <Copy className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">Filter Pesan Masuk Kembar</h4>
                                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                    Jika pelanggan tidak sengaja menekan tombol kirim 2x untuk pesan sama persis, bot hanya merespons 1 kali.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center">
                                {/* Compact Fine-Tuning Stepper */}
                                <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setInboundSec(Number((inboundSec - 0.5).toFixed(1)))}
                                    disabled={inboundSec <= 1}
                                    title="Kurangi 0.5 detik"
                                    className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="px-2 text-center">
                                    <span className="font-mono font-bold text-xs text-white">{inboundSec}</span>
                                    <span className="text-[10px] text-zinc-500 ml-1">dtk</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setInboundSec(Number((inboundSec + 0.5).toFixed(1)))}
                                    disabled={inboundSec >= 20}
                                    title="Tambah 0.5 detik"
                                    className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* ROW 2: JENDELA FILTER PESAN KELUAR KEMBAR */}
                            <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5 max-w-md">
                                <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-sky-400 shrink-0">
                                  <Send className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">Filter Pesan Keluar Kembar</h4>
                                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                    Mencegah bot mengirim pesan jawaban yang persis sama ke nomor pelanggan dalam waktu berdekatan.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center">
                                {/* Compact Fine-Tuning Stepper */}
                                <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setOutboundSec(Number((outboundSec - 0.5).toFixed(1)))}
                                    disabled={outboundSec <= 1}
                                    title="Kurangi 0.5 detik"
                                    className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="px-2 text-center">
                                    <span className="font-mono font-bold text-xs text-white">{outboundSec}</span>
                                    <span className="text-[10px] text-zinc-500 ml-1">dtk</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setOutboundSec(Number((outboundSec + 0.5).toFixed(1)))}
                                    disabled={outboundSec >= 30}
                                    title="Tambah 0.5 detik"
                                    className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* ROW 3: WAKTU TUNGGU DEBOUNCE */}
                            <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5 max-w-md">
                                <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0">
                                  <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">Waktu Tunggu Debounce (Buffer)</h4>
                                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                    Jeda menunggu chat lanjutan saat pelanggan mengetik pesan kalimat terpotong-potong sebelum diracik AI.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-center">
                                {/* Compact Fine-Tuning Stepper */}
                                <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setDebounceSec(Number((debounceSec - 0.5).toFixed(1)))}
                                    disabled={debounceSec <= 0.5}
                                    title="Kurangi 0.5 detik"
                                    className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="px-2 text-center">
                                    <span className="font-mono font-bold text-xs text-white">{debounceSec}</span>
                                    <span className="text-[10px] text-zinc-500 ml-1">dtk</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setDebounceSec(Number((debounceSec + 0.5).toFixed(1)))}
                                    disabled={debounceSec >= 10}
                                    title="Tambah 0.5 detik"
                                    className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* ROW 4: KAPASITAS BUFFER ITEM */}
                            <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex items-start gap-3.5 max-w-md">
                                <div className="w-10 h-10 rounded-xl bg-[#141518] border border-white/[0.08] flex items-center justify-center text-purple-400 shrink-0">
                                  <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white">Kapasitas Penampungan Pesan</h4>
                                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                                    Batas maksimal rentetan potongan chat yang digabungkan menjadi 1 prompt sebelum langsung dijawab AI.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 self-start xl:self-center">
                                {/* Toggle Switch Buffer */}
                                <label className="flex items-center gap-2.5 cursor-pointer bg-[#141518] px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
                                  <span className="text-xs font-semibold text-zinc-300">Status Buffer:</span>
                                  <input
                                    type="checkbox"
                                    checked={bufferEnabled}
                                    onChange={(e) => updateNestedProtections('conversation_buffer', 'enabled', e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#141518] after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                                  <span className={`text-xs font-bold ${bufferEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {bufferEnabled ? 'Aktif' : 'Off'}
                                  </span>
                                </label>

                                {/* Stepper (Only when enabled) */}
                                {bufferEnabled && (
                                  <div className="inline-flex items-center bg-[#141518] border border-white/[0.08] rounded-xl p-1 gap-1.5 animate-in fade-in duration-150">
                                    <button
                                      type="button"
                                      onClick={() => setBufferMaxItems(bufferMaxItems - 1)}
                                      disabled={bufferMaxItems <= 2}
                                      title="Kurangi 1 pesan"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="px-2 text-center">
                                      <span className="font-mono font-bold text-xs text-white">{bufferMaxItems}</span>
                                      <span className="text-[10px] text-zinc-500 ml-1">item</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setBufferMaxItems(bufferMaxItems + 1)}
                                      disabled={bufferMaxItems >= 50}
                                      title="Tambah 1 pesan"
                                      className="w-7 h-7 rounded-lg bg-[#181A1F] hover:bg-[#22242A] text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition disabled:opacity-30 cursor-pointer active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>

                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

                          </div>
          )}

          {/* ADD / EDIT FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#141518] border border-white/[0.07] text-slate-100 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#181A1F] border border-white/[0.07] text-slate-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] border border-transparent hover:border-white/[0.07] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-100 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pertanyaan dari Pelanggan (Question)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={faqForm.q}
                  onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                  placeholder="Contoh: Apakah karpet polos ready stock dan bisa langsung dikirim?"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:bg-[#1C1E23] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kategori Topik</span>
                </label>
                <input
                  type="text"
                  value={faqForm.category || ''}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  placeholder="Ketik kategori (contoh: Promo, Garansi, dll)..."
                  autoComplete="off"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:bg-[#1C1E23] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jawaban Rekomendasi Resmi AI & CS (Answer)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.a}
                  onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                  placeholder="Tuliskan jawaban yang ramah, sopan, jelas, dan solutif yang akan disampaikan AI kepada pelanggan..."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:bg-[#1C1E23] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    setShowFaqModal(false);
                    setEditingFaq(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#141518] hover:bg-[#22242A] text-slate-100 border border-white/[0.08] font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={faqSaving}
                  className="px-5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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

        {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) - PERMANENTLY FIXED AT BOTTOM */}
        {!mobileChatOpen && (
          <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden h-16 bg-[#181A1F] border-t border-white/[0.08] backdrop-blur-xl px-1.5 flex items-center justify-around shadow-2xl select-none">
            {[
              {
                id: 'chats',
                label: 'Chat',
                icon: MessageSquare,
                badge: conversations.length > 0 ? conversations.length : null,
                badgeBg: 'bg-white !text-[#141518]',
                isActive: activeTab === 'chats',
              },
              {
                id: 'tickets',
                label: 'Komplain & CS',
                icon: ShieldAlert,
                badge: tickets.filter((t) => (t.status || 'Open').toLowerCase() === 'open').length || (tickets.length > 0 ? tickets.length : null),
                badgeBg: 'bg-white !text-[#141518]',
                isActive: activeTab === 'tickets' || activeTab === 'complaint',
              },
              {
                id: 'catalog',
                label: 'Katalog',
                icon: ShoppingBag,
                badge: null,
                isActive: activeTab === 'catalog',
              },
              {
                id: 'gemini',
                label: 'Pengaturan',
                icon: Settings,
                badge: activeHandoffCount > 0 ? activeHandoffCount : null,
                badgeBg: 'bg-white !text-[#141518]',
                isActive: ['gemini', 'qna', 'handoff', 'settings'].includes(activeTab),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
                    item.isActive
                      ? 'text-white bg-[#22242A] border border-white/[0.08] shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#22242A]'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 text-white' : 'text-slate-400'}`} />
                    {item.badge && (
                      <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 ${item.badgeBg} text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1 shadow-sm`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] tracking-tight transition-colors ${item.isActive ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </main>

      {/* MODAL PROSES TIKET CUSTOMER (Melihat Tiket Masih Proses atau Selesai) */}
      {showCustomerTicketsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#141518] border border-white/[0.07] text-slate-100 rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/[0.07] flex items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-[#0F172A]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                  <Ticket className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-100 text-base sm:text-lg truncate">
                    Proses Tiket Customer
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {activeConversation?.senderName || 'Pelanggan'} • {activeConversation?.phone || activeConversation?.jid || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerTicketsModal(false);
                    setSelectedTicket({
                      id: 'NEW',
                      name: activeConversation?.senderName || 'Pelanggan',
                      contact: activeConversation?.phone || activeConversation?.jid || '',
                      sender: activeConversation?.jid || activeConversation?.phone || '',
                      description: activeConversation?.lastMessage?.text || 'Permohonan bantuan via WhatsApp',
                      category: 'Layanan Umum',
                      priority: 'Normal',
                    });
                    setTicketStatusUpdate('Open');
                    setTicketNotesUpdate('');
                    setTicketCategoryUpdate('Layanan Umum');
                    setTicketPriorityUpdate('Normal');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buat Tiket Baru</span>
                  <span className="sm:hidden">Buat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustomerTicketsModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#22242A] border border-transparent hover:border-white/[0.07] transition cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Metric Overview Cards */}
            <div className="p-4 sm:p-5 bg-[#181A1F]/60 border-b border-white/[0.07]">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Total */}
                <button
                  type="button"
                  onClick={() => setCustomerTicketFilter('all')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    customerTicketFilter === 'all'
                      ? 'bg-[#141518] border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-[#141518]/90 border-white/[0.07] hover:bg-[#22242A] hover:border-white/[0.18]'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Total Tiket</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5">
                    {activeCustomerTickets.length}
                  </div>
                </button>

                {/* Masih Proses */}
                <button
                  type="button"
                  onClick={() => setCustomerTicketFilter('process')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    customerTicketFilter === 'process'
                      ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-[#141518]/90 border-white/[0.07] hover:bg-amber-500/10 hover:border-amber-400'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Masih Proses</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                    {inProgressCustomerTickets.length}
                  </div>
                </button>

                {/* Selesai */}
                <button
                  type="button"
                  onClick={() => setCustomerTicketFilter('resolved')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    customerTicketFilter === 'resolved'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-[#141518]/90 border-white/[0.07] hover:bg-emerald-500/10 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Selesai</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                    {resolvedCustomerTickets.length}
                  </div>
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.07] text-xs">
                <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {[
                  { id: 'all', label: `Semua (${activeCustomerTickets.length})` },
                  { id: 'process', label: `Masih Proses (${inProgressCustomerTickets.length})` },
                  { id: 'resolved', label: `Selesai (${resolvedCustomerTickets.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCustomerTicketFilter(tab.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      customerTicketFilter === tab.id
                        ? 'bg-[#181A1F] text-white shadow-xs'
                        : 'bg-[#141518] text-slate-400 border border-white/[0.07] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets Scrollable List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 max-h-[50vh]">
              {filteredCustomerTickets.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#181A1F] border border-white/[0.07] text-slate-400 flex items-center justify-center mx-auto">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-100">
                      {activeCustomerTickets.length === 0
                        ? 'Belum Ada Tiket untuk Customer Ini'
                        : customerTicketFilter === 'process'
                        ? 'Tidak Ada Tiket yang Masih Proses'
                        : 'Belum Ada Tiket yang Selesai'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {activeCustomerTickets.length === 0
                        ? 'Customer ini belum memiliki laporan komplain, klaim garansi, ataupun pesanan antrian tiket.'
                        : 'Coba ubah filter di atas untuk melihat semua riwayat tiket pelanggan ini.'}
                    </p>
                  </div>
                  {activeCustomerTickets.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerTicketsModal(false);
                        setSelectedTicket({
                          id: 'NEW',
                          name: activeConversation?.senderName || 'Pelanggan',
                          contact: activeConversation?.phone || activeConversation?.jid || '',
                          sender: activeConversation?.jid || activeConversation?.phone || '',
                          description: activeConversation?.lastMessage?.text || 'Permohonan bantuan via WhatsApp',
                          category: 'Layanan Umum',
                          priority: 'Normal',
                        });
                        setTicketStatusUpdate('Open');
                        setTicketNotesUpdate('');
                        setTicketCategoryUpdate('Layanan Umum');
                        setTicketPriorityUpdate('Normal');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Tiket Sekarang</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredCustomerTickets.map((t, idx) => {
                  const statusRaw = (t.status || 'Open').toLowerCase();
                  const isResolved = statusRaw === 'resolved' || statusRaw === 'closed' || statusRaw === 'selesai';
                  const isInProgress = statusRaw.includes('progress');
                  const isOpen = statusRaw === 'open' || (!isResolved && !isInProgress);
                  const createdDate = t.createdAt
                    ? new Date(t.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <div
                      key={t.id || idx}
                      className="p-4 rounded-2xl bg-[#141518] border border-white/[0.07] hover:border-white/[0.18] transition-all shadow-xs space-y-3"
                    >
                      {/* Ticket Header: ID + Queue + Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-100 bg-[#181A1F] px-2 py-0.5 rounded-lg border border-white/[0.07]">
                            #{t.id}
                          </span>
                          {t.queueNumber && (
                            <span className="font-bold text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Antrian #{t.queueNumber}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-slate-400 bg-[#181A1F] px-2 py-0.5 rounded-lg border border-white/[0.07]">
                            {t.category || 'Layanan Umum'}
                          </span>
                        </div>

                        {/* Status Badge: Masih Proses vs Selesai */}
                        <div>
                          {isResolved ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 flex items-center gap-1.5 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Selesai</span>
                            </span>
                          ) : isInProgress ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/35 flex items-center gap-1.5 shadow-xs">
                              <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                              <span>Masih Proses (Ditangani)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 flex items-center gap-1.5 shadow-xs">
                              <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span>Masih Proses (Antrian Open)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-[#181A1F] p-3 rounded-xl border border-white/[0.07] text-xs text-slate-100 leading-relaxed">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Keluhan / Rincian Permohonan:
                        </div>
                        <p className="whitespace-pre-wrap">{t.description || '-'}</p>
                      </div>

                      {/* Admin Notes if any */}
                      {t.notes && (
                        <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                          <span className="font-bold text-[10px] text-amber-300 block uppercase mb-0.5">Catatan Petugas:</span>
                          <p className="italic">{t.notes}</p>
                        </div>
                      )}

                      {/* Footer Info & Quick Actions */}
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.07] text-xs flex-wrap">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Dibuat: {createdDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Quick Action: Start Process / Mark Resolved / Reopen */}
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(t.id, 'In Progress')}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-bold border border-sky-400/40 transition flex items-center gap-1 cursor-pointer"
                              title="Mulai tangani tiket ini"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Mulai Proses</span>
                            </button>
                          )}

                          {!isResolved ? (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(t.id, 'Resolved')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-400/40 transition flex items-center gap-1 cursor-pointer"
                              title="Tandai tiket ini sudah selesai tuntas"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Tandai Selesai</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(t.id, 'In Progress')}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-400/40 transition flex items-center gap-1 cursor-pointer"
                              title="Buka kembali tiket ini"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-300" />
                              <span>Buka Kembali</span>
                            </button>
                          )}

                          {/* Full Manage Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicket(t);
                              setTicketStatusUpdate(t.status || 'Open');
                              setTicketNotesUpdate(t.notes || '');
                              setTicketCategoryUpdate(t.category || 'Pengaduan Produk');
                              setTicketPriorityUpdate(t.priority || 'Normal');
                              setShowCustomerTicketsModal(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            title="Kelola tiket & edit catatan rincian"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Kelola</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.07] bg-[#181A1F] flex items-center justify-between text-xs text-slate-400">
              <span>
                Menampilkan <b>{filteredCustomerTickets.length}</b> dari <b>{activeCustomerTickets.length}</b> tiket pelanggan ini
              </span>
              <button
                type="button"
                onClick={() => setShowCustomerTicketsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#141518] hover:bg-[#22242A] text-slate-100 border border-white/[0.08] font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET EDIT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#141518] border border-white/[0.07] text-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Kelola Komplain & Layanan CS #{selectedTicket.id}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('id-ID') : 'Laporan Aktif'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] border border-transparent hover:border-white/[0.07] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Customer & Quick WA Action */}
              <div className="p-3 rounded-2xl bg-[#181A1F] border border-white/[0.07] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pelanggan</span>
                  <p className="font-bold text-slate-100 text-sm mt-0.5">{selectedTicket.name || 'Pelanggan'}</p>
                  <p className="text-slate-400 font-mono text-[11px] font-semibold">{selectedTicket.contact || selectedTicket.sender || '-'}</p>
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

              {/* Rincian Tiket (Bisa diisi / diedit oleh Admin) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-100">Rincian Tiket</label>
                <textarea
                  rows={4}
                  value={selectedTicket.description || ''}
                  onChange={(e) => setSelectedTicket({ ...selectedTicket, description: e.target.value })}
                  placeholder="Tuliskan rincian tiket, kebutuhan pelanggan, atau kendala..."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-xs text-slate-100 outline-none focus:border-white/30 focus:bg-[#1C1E23] transition resize-none leading-relaxed"
                />
              </div>

              {/* Kategori Layanan & Prioritas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-100">Kategori Layanan</label>
                  <select
                    value={ticketCategoryUpdate}
                    onChange={(e) => setTicketCategoryUpdate(e.target.value)}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="Pembelian Produk">Pembelian Produk (Order / Beli)</option>
                    <option value="Klaim Garansi">Klaim Garansi (Ganti Baru / Pecah)</option>
                    <option value="Pengaduan Produk">Pengaduan Produk (Komplain / Kendala)</option>
                    <option value="Layanan Umum">Layanan Umum (Pertanyaan / Informasi)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-100">Prioritas</label>
                  <select
                    value={ticketPriorityUpdate}
                    onChange={(e) => setTicketPriorityUpdate(e.target.value)}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.07]">
              <button
                type="button"
                onClick={handleUpdateTicket}
                className="flex-1 py-2.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs shadow-lg shadow-emerald-900/30 transition cursor-pointer"
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
                className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-emerald-500/15 text-slate-100 border border-white/[0.07] text-xs font-semibold transition cursor-pointer shadow-xs"
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
          <div className="bg-[#141518] border border-white/[0.07] text-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Buat Tiket Komplain & Layanan CS</h3>
                  <p className="text-[11px] text-slate-400">Input keluhan atau permohonan layanan via WhatsApp, telepon, atau walk-in</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTicketModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] border border-transparent hover:border-white/[0.07] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-100">Nama Pelanggan <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: H. Ahmad Subardjo"
                    value={newTicketForm.name}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-100">No. WhatsApp / Kontak</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={newTicketForm.contact}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-100">Kategori Layanan</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2 text-xs text-slate-100 outline-none focus:border-white/30 cursor-pointer font-medium"
                  >
                    <option value="Pengaduan Produk">🚨 Pengaduan & Komplain</option>
                    <option value="Klaim Garansi">🛡️ Klaim Garansi</option>
                    <option value="Pembelian Produk">🛒 Konsultasi / Pesanan</option>
                    <option value="Layanan Umum">💬 Layanan CS Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-100">Prioritas</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2 text-xs text-slate-100 outline-none focus:border-white/30 cursor-pointer font-medium"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Urgent">Mendesak (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-100">Rincian Keluhan / Permohonan Layanan <span className="text-rose-400">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="Jelaskan secara detail keluhan karpet, jahitan obras, klaim garansi, atau permohonan pelanggan..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-white/30 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.07]">
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
                  className="px-4 py-2.5 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
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
          <div className="w-full max-w-2xl rounded-3xl bg-[#141518] border border-white/[0.07] text-slate-100 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto transform animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base leading-snug">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Tempat Upload Foto Produk - 6 Foto */}
              <div className="space-y-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upload Foto Produk</span>
                    <span className="text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-white/[0.08]">
                      {(productForm.images || []).length}/6 Foto
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 hidden sm:inline">JPG, PNG, WEBP (Maks. 5MB)</span>
                    {(productForm.images || []).length < 6 && (
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(null)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-white/[0.08] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Pilih Foto</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid 6 Slot Foto */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
                  {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                    const imgItem = (productForm.images || [])[slotIdx];
                    const isFilled = Boolean(imgItem);
                    const isPrimary = slotIdx === 0;

                    if (isFilled) {
                      const displaySrc = imgItem.startsWith('data:') || imgItem.startsWith('http')
                        ? imgItem
                        : `/${imgItem.replace(/^assets\//, '').replace(/^public\//, '')}`;

                      return (
                        <div
                          key={slotIdx}
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-white/[0.07] bg-[#181A1F] shadow-2xs hover:border-white/[0.18] hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <img
                            src={displaySrc}
                            alt={`Foto ${slotIdx + 1}`}
                            onError={(e) => {
                              e.target.src = '/catalog/karpet-masjid-turki.jpg';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Top Badges & Remove */}
                          <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between pointer-events-none">
                            {isPrimary ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#181A1F] text-white text-[9px] font-bold shadow-sm pointer-events-auto">
                                ★ Utama
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-semibold shadow-sm pointer-events-auto">
                                #{slotIdx + 1}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProductImage(slotIdx);
                              }}
                              className="p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition pointer-events-auto cursor-pointer"
                              title="Hapus foto ini"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetPrimaryImage(slotIdx);
                                }}
                                className="px-1.5 py-0.5 rounded bg-[#181A1F] hover:bg-[#22242A] text-slate-100 border border-white/[0.1] text-[9px] font-bold shadow transition cursor-pointer"
                                title="Jadikan foto utama (sampul)"
                              >
                                Utama
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerUpload(slotIdx);
                              }}
                              className="px-1.5 py-0.5 rounded bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] text-[9px] font-semibold shadow transition cursor-pointer"
                              title="Ganti foto ini"
                            >
                              Ganti
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Slot Kosong
                    return (
                      <div
                        key={slotIdx}
                        onClick={() => handleTriggerUpload(slotIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer?.files || []);
                          if (files.length > 0) processImageFiles(files, slotIdx);
                        }}
                        className="aspect-square rounded-2xl border-2 border-dashed border-white/[0.07] hover:border-white/[0.18] hover:bg-[#22242A] transition-all cursor-pointer flex flex-col items-center justify-center p-1.5 text-center group bg-[#181A1F]/30"
                        title={`Upload foto ke-${slotIdx + 1}`}
                      >
                        <div className="w-7 h-7 rounded-xl bg-[#141518] border border-white/[0.07] flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-white transition mt-1 line-clamp-1">
                          + Foto {slotIdx + 1}
                        </span>
                        {isPrimary && (
                          <span className="text-[8px] text-slate-400 font-medium">Utama</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Mendukung hingga 6 foto produk. Klik slot kosong atau tombol <b>Pilih Foto</b> untuk menambah foto sekaligus. Foto bertanda <b>★ Utama</b> akan dijadikan gambar sampul di WhatsApp bot dan katalog web.
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-100 font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kategori Karpet <span className="text-rose-400">*</span></span>
                </label>
                <select
                  value={productForm.category || (carpetCategoriesList[0]?.name || 'Karpet Masjid & Musholla')}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition cursor-pointer"
                >
                  {carpetCategoriesList.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#181A1F] text-slate-100 py-1">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Title (Full Width) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-100 font-semibold flex items-center gap-1">
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
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition"
                />
              </div>

              {/* Product Price (Hanya Angka) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-100 font-semibold flex items-center gap-1">
                    <span>Harga Produk</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Hanya angka</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold font-mono text-xs select-none pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={
                      (productForm.price || '').replace(/\D/g, '')
                        ? Number((productForm.price || '').replace(/\D/g, '')).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setProductForm((prev) => ({
                        ...prev,
                        price: digits ? `Rp ${Number(digits).toLocaleString('id-ID')}` : '',
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (
                        !/^[0-9]$/.test(e.key) &&
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Contoh: 1.450.000"
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] pl-10 pr-3.5 py-2.5 text-xs text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hanya menerima angka (0-9). Format Rupiah otomatis diterapkan.
                </p>
              </div>

              {/* Color & Size Variants (Full Width) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-100">Pilihan Warna & Ukuran (Varian)</label>
                  <span className="text-[10px] text-slate-500">Info varian untuk bot</span>
                </div>
                <input
                  type="text"
                  value={productForm.footer}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, footer: e.target.value }))}
                  placeholder="Contoh: Warna: Warm Beige, Ivory Cream & Charcoal | Ukuran: 160x230cm, 200x300cm"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition"
                />
              </div>

              {/* Subtitle / Description (Full Width) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-100">Deskripsi Singkat / Spesifikasi</label>
                  <span className="text-[10px] text-slate-500">Pengetahuan produk AI</span>
                </div>
                <textarea
                  rows={3}
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Contoh: Karpet ruang tamu modern minimalis bertekstur lembut, anti-slip backing, motif geometris kontemporer chic. Sangat nyaman untuk ruang keluarga."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 leading-relaxed font-sans transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-emerald-500/15 text-slate-100 font-semibold text-xs transition cursor-pointer border border-white/[0.07] shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-lg shadow-black/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{savingProduct ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Simpan Produk Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT KATEGORI KNOWLEDGE BASE */}
      {showFaqCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#141518] border border-white/[0.07] text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/[0.07] bg-[#181A1F]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    'Tambah Kategori Topik Baru'
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kategori digunakan untuk mengelompokkan bank tanya jawab AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFaqCategoryModal(false);
                  setEditingFaqCategory(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#22242A] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaqCategory} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Nama Kategori</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={faqCategoryNameInput}
                  onChange={(e) => setFaqCategoryNameInput(e.target.value)}
                  placeholder="Contoh: Perawatan Karpet, Metode Pembayaran, dll"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    setShowFaqCategoryModal(false);
                    setEditingFaqCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFaqCategory || !faqCategoryNameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {savingFaqCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Tambah Kategori</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT KATEGORI */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#141518] border border-white/[0.07] text-slate-100 p-6 shadow-2xl space-y-5 transform animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    {editingCategory ? 'Edit Kategori Karpet' : 'Tambah Kategori Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCategory 
                      ? `Perbarui nama dan deskripsi kategori "${editingCategory.name}"`
                      : 'Klasifikasi produk karpet untuk katalog & bot AI'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-100">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Karpet Hotel & Ballroom"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-100">Deskripsi Kategori</label>
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Tuliskan keterangan singkat mengenai jenis atau karakteristik karpet dalam kategori ini..."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingCategory ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KIRIM PESAN PRODUK KE RIWAYAT CHAT */}
      {showSendProductModal && (selectedProductToSend || selectedPromoToSend) && (() => {
        const isPromo = Boolean(selectedPromoToSend);
        const prod = selectedProductToSend;
        const promo = selectedPromoToSend;
        const cleanImg = prod ? (prod.image || 'catalog/karpet-masjid-turki.jpg').replace(/^assets\//, '') : '';
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
            <div className="w-full max-w-2xl rounded-3xl bg-[#141518] border border-white/[0.07] text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-white/[0.07] bg-[#181A1F]/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">
                      {isPromo ? 'Kirim Penawaran Promo' : 'Kirim Pesan Produk'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isPromo
                        ? 'Pilih riwayat chat pelanggan WhatsApp untuk mengirim informasi promo ini'
                        : 'Pilih riwayat chat pelanggan WhatsApp untuk mengirim informasi produk ini'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSendProductModal(false);
                    setSelectedProductToSend(null);
                    setSelectedPromoToSend(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {/* 1. Selected Item (Product or Promo) Preview Card */}
                {isPromo ? (
                  <div className="p-3.5 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] flex items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center font-bold shrink-0">
                        <Tag className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm truncate">{promo.title}</h4>
                          {promo.discount && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                              {promo.discount}
                            </span>
                          )}
                        </div>
                        {promo.desc && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{promo.desc}</p>
                        )}
                        <span className="font-mono text-[10px] text-slate-500">
                          Masa Berlaku: {promo.valid_until || 'Stok Terbatas'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#181A1F]/80 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#181A1F] border border-white/[0.07] shrink-0">
                        <img
                          src={imgSrc}
                          alt={prod.title}
                          onError={(e) => { e.target.src = '/catalog/karpet-masjid-turki.jpg'; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm truncate">{prod.title}</h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                            {prod.price}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{prod.subtitle || prod.category}</p>
                        <span className="font-mono text-[10px] text-slate-500">{prod.code || `PROD-${prod.id}`}</span>
                      </div>
                    </div>

                    {prod.image && (
                      <label className="flex items-center gap-2 text-xs text-slate-100 font-semibold cursor-pointer select-none bg-[#181A1F]/70 hover:bg-[#22242A] px-3 py-2 rounded-xl border border-white/[0.07] transition shrink-0">
                        <input
                          type="checkbox"
                          checked={includeProductImage}
                          onChange={(e) => setIncludeProductImage(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 bg-[#22242A] border-white/[0.1] focus:ring-emerald-500"
                        />
                        <span className="text-[11px] font-medium">Sertakan foto produk</span>
                      </label>
                    )}
                  </div>
                )}

                {/* 2. Chat Recipient Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-100 font-semibold flex items-center gap-1.5">
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
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] pl-8 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30"
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
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-white/[0.07] rounded-2xl p-2 bg-[#181A1F]/40">
                    {filteredRecipients.length === 0 ? (
                      <div className="p-5 text-center text-slate-500 space-y-1">
                        <MessageSquare className="w-6 h-6 mx-auto text-slate-400 opacity-60" />
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
                          snippet = formatSnippet(c.lastMessage);
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
                                : 'bg-[#181A1F] border-white/[0.07] hover:border-white/[0.1] hover:bg-[#22242A]0'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-[#22242A] text-slate-300'
                              }`}>
                                {initialChar}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-slate-100 text-xs truncate">{contactName}</h5>
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
                                : 'border-white/[0.1] bg-[#22242A]'
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
                        className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Message Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-100">Isi Pesan WhatsApp (Dapat Diedit)</label>
                    <span className="text-[10px] text-slate-500 font-mono">{sendProductMessageText.length} karakter</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sendProductMessageText}
                    onChange={(e) => setSendProductMessageText(e.target.value)}
                    placeholder="Tulis pesan detail produk..."
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 font-sans leading-relaxed resize-y"
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
              <div className="p-4 sm:p-5 border-t border-white/[0.07] bg-[#181A1F]/60 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendProductModal(false);
                    setSelectedProductToSend(null);
                    setSelectedPromoToSend(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-emerald-500/15 text-slate-100 font-semibold text-xs transition cursor-pointer border border-white/[0.07] shadow-xs"
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
                    className="px-3.5 py-2.5 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    title="Kirim secara manual melalui tautan WhatsApp Web (wa.me)"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp Web</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendProductToChat}
                    disabled={isSendingProductMessage || (!selectedChatRecipient && !manualPhoneInput.trim())}
                    className="px-5 py-2.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <div className="w-full max-w-md rounded-3xl bg-[#141518] border border-white/[0.07] text-slate-100 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">Profil Kontak Pelanggan</h3>
                    <p className="text-xs text-slate-400">Kelola nomor telepon & informasi kontak WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Avatar Card */}
              <div className="p-4 rounded-2xl bg-[#181A1F] border border-white/[0.07] flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-4 ring-emerald-500/20 shrink-0">
                  {modalInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-base text-slate-100 truncate">
                      {modalDisplayName}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-semibold shrink-0">
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mb-1 font-semibold truncate">
                    {modalFormattedPhone}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {profileTarget.messages?.length || 0} pesan tercatat dalam obrolan
                  </p>
                </div>
              </div>

              {/* Quick Action Shortcuts */}
              <div>
                <button
                  type="button"
                  disabled={!modalHasRealPhone}
                  onClick={() => modalHasRealPhone && handleCopyText(profileTarget.phone, 'Nomor Telepon')}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-xs ${
                    modalHasRealPhone
                      ? 'bg-[#141518] hover:bg-[#22242A] border-white/[0.08] text-slate-100'
                      : 'bg-[#181A1F] border-white/[0.07] text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {copiedField === 'Nomor Telepon' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{copiedField === 'Nomor Telepon' ? 'Tersalin!' : 'Salin Nomor Telepon'}</span>
                </button>
              </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>Nama Pelanggan</span>
                  <span className="text-[10px] text-slate-400">Tampil di dashboard</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="Contoh: Kharisma Alung P"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>Nomor Telepon (WhatsApp)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-time sync</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    +
                  </span>
                  <input
                    type="text"
                    required
                    value={editProfilePhone.startsWith('+') ? editProfilePhone.slice(1) : editProfilePhone}
                    onChange={(e) => setEditProfilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="6281216526150"
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] pl-7 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Gunakan kode negara tanpa spasi atau tanda strip (contoh: <span className="font-mono text-slate-100 font-bold">6281216526150</span>).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#141518] hover:bg-[#22242A] text-slate-100 border border-white/[0.07] text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A1F]/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.07] bg-[#141518] text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Formulir Pengaduan & Klaim Garansi</h3>
                  <p className="text-[11px] text-slate-400">Nomor tiket otomatis terbit & diteruskan ke CS Manager</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaintTicket} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-100 font-semibold font-semibold">Nama Pelapor / Pemesan *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.name}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: DKM Masjid Al-Ikhlas / Bpk Rudi"
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-100 font-semibold font-semibold">Nomor WhatsApp / Kontak *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.phone}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0812xxxxxxxx"
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-100 font-semibold font-semibold">Kategori Pengaduan</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 focus:outline-none focus:border-white/30"
                  >
                    <option value="Pengaduan Produk">Pengaduan Produk / Karpet</option>
                    <option value="Klaim Garansi Obras">Klaim Garansi Obras & Jahitan</option>
                    <option value="Pengiriman & Logistik">Pengiriman & Logistik Kargo</option>
                    <option value="Lainnya">Pertanyaan & Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-100 font-semibold font-semibold">Jenis Kendala</label>
                  <select
                    value={complaintForm.issueType}
                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, issueType: e.target.value }))}
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 focus:outline-none focus:border-white/30"
                  >
                    <option value="Kualitas / Obras Karpet">Kualitas / Obras Karpet</option>
                    <option value="Ukuran / Kemiringan Kiblat">Ukuran / Potongan Kemiringan Kiblat</option>
                    <option value="Cacat Benang Impor">Cacat Benang / Tenun Pabrik</option>
                    <option value="Jadwal Pasang Terlambat">Keterlambatan Teknisi Pasang</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Detail Keluhan / Rincian Kendala *</label>
                <textarea
                  rows={3}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ceritakan kendala yang dihadapi secara detail..."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A1F]/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.07] bg-[#141518] text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    {editingLocationIndex !== null ? 'Edit Lokasi & Alamat' : 'Tambah Lokasi Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Data showroom otomatis sinkron dengan WhatsApp bot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Nama / Judul Lokasi *</label>
                <input
                  type="text"
                  required
                  value={locationForm.title}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Showroom Fatmawati Jakarta Selatan"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Alamat Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Contoh: Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan 12430"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-100 font-semibold font-semibold">Telepon / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.phone}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 0812-9876-5432"
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-100 font-semibold font-semibold">Jam Operasional</label>
                  <input
                    type="text"
                    value={locationForm.hours}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, hours: e.target.value }))}
                    placeholder="Contoh: Senin - Sabtu: 08:30 - 20:00 WIB"
                    className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Tautan Google Maps</label>
                <input
                  type="text"
                  value={locationForm.maps_url}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, maps_url: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A1F]/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.07] bg-[#141518] text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    {editingPromoIndex !== null ? 'Edit Promo Karpet' : 'Tambah Promo Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Promo langsung aktif di dashboard & bot WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#22242A] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Judul Promo *</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Promo Gebyar Karpet Masjid Berkah"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-100 font-semibold">Potongan / Diskon / Benefit *</label>
                <input
                  type="text"
                  required
                  value={promoForm.discount}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, discount: e.target.value }))}
                  placeholder="Contoh: Diskon 20% + Gratis Obras"
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-100 font-semibold text-xs">
                  Masa Berlaku Promo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Dari Tanggal (Mulai):</span>
                    <input
                      type="date"
                      value={promoStartDate}
                      onChange={(e) => handlePromoDateRangeChange(e.target.value, promoEndDate)}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Sampai Tanggal (Berakhir):</span>
                    <input
                      type="date"
                      value={promoEndDate}
                      onChange={(e) => handlePromoDateRangeChange(promoStartDate, e.target.value)}
                      className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-100 font-semibold font-semibold">Deskripsi Syarat & Ketentuan</label>
                <textarea
                  rows={3}
                  value={promoForm.desc}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder="Keterangan lengkap promo dan syarat pemesanan..."
                  className="w-full rounded-xl bg-[#181A1F] border border-white/[0.07] p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#22242A] hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2F36] text-white border border-white/[0.1] font-semibold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Promo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* LIGHTBOX IMAGE PREVIEW MODAL (FULLSCREEN) */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageModal(null)}
        >
          {/* Header bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm truncate">{previewImageModal.title || 'Foto WhatsApp'}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewImageModal.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-3.5 py-1.5 rounded-xl bg-[#22242A] hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 border border-white/[0.1] transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka Ukuran Asli</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-xl bg-[#22242A] hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Frame */}
          <div
            className="relative max-w-4xl max-h-[78vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/[0.07] bg-[#181A1F] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageModal.url}
              alt="Preview"
              className="max-h-[75vh] max-w-full object-contain rounded-xl select-none"
            />
          </div>

          {/* Optional Caption */}
          {previewImageModal.caption && (
            <div
              className="mt-3 max-w-2xl text-center text-xs text-slate-100 bg-[#181A1F] px-4 py-2.5 rounded-xl border border-white/[0.07] shadow-md whitespace-pre-wrap leading-relaxed"
              onClick={(e) => e.stopPropagation()}
            >
              {previewImageModal.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
