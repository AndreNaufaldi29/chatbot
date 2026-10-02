const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const OPT_IN_FILE = path.join(__dirname, '../../data/opt_in.json');
const HANDOFF_FILE = path.join(__dirname, '../../data/handoff.json');

class ProtectionService extends EventEmitter {
  constructor() {
    super();

    // 1. Cooldown & Rate Limiting State
    this.lastUserReplyTimes = new Map(); // jid -> timestamp ms
    this.globalMessageTimestamps = []; // array of timestamp ms

    // 2. Message Deduplication State
    this.inboundMessageIds = new Map(); // msgId -> timestamp ms
    this.inboundContentHashes = new Map(); // hash -> timestamp ms
    this.outboundContentHashes = new Map(); // hash -> timestamp ms

    // 3. Conversation Buffer State
    this.pendingBuffers = new Map(); // jid -> { texts: [], lastMsg, mediaType, timer, startTime }

    // 4. Retry Limit & Circuit Breaker State
    this.circuitBreakers = new Map(); // serviceName -> { state, failureCount, nextAttemptTime }

    // 5. Opt-in / Consent State
    this.optInRegistry = new Map(); // jid -> { optedIn: boolean, timestamp: string, reason: string }
    this.loadOptInData();

    // 6. Human Handoff State
    this.handoffRegistry = new Map(); // jid -> { active: boolean, requestedAt: number, reason: string }
    this.loadHandoffData();

    // 7. Session Inactivity State
    this.userLastActivityTimes = new Map(); // jid -> timestamp ms

    // Metrics / Statistics
    this.stats = {
      totalInboundProcessed: 0,
      duplicatesBlocked: 0,
      burstsAggregated: 0,
      globalRateLimitWaits: 0,
      retriesAttempted: 0,
      circuitTrips: 0,
      humanHandoffsActive: 0,
      optOutUsers: 0
    };

    // Periodic Garbage Collection (Every 10 minutes)
    this.gcTimer = setInterval(() => {
      this.runGarbageCollection();
    }, 10 * 60 * 1000);
    if (this.gcTimer.unref) this.gcTimer.unref();
  }

  // Helper: Retrieve protections config dynamically
  getConfig() {
    try {
      const configPath = path.join(__dirname, '../../config/config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const cfg = JSON.parse(raw);
        return cfg.protections || {};
      }
    } catch (e) {}

    return {
      cooldown: { enabled: true, min_delay_ms: 2500, max_delay_ms: 4000, jitter_ms: 1000, typing_simulation: true, global_max_per_minute: 25 },
      deduplication: { enabled: true, id_ttl_seconds: 300, content_window_ms: 3000, outbound_window_ms: 4000 },
      conversation_buffer: { enabled: true, debounce_ms: 2000, max_buffer_items: 10, max_context_turns: 6 },
      retry_limit: { max_retries: 2, backoff_base_ms: 1000, circuit_breaker_threshold: 3, circuit_breaker_timeout_ms: 60000 },
      opt_in: { enabled: true, default_opted_in: true, opt_out_keywords: ['stop', 'berhenti', 'unsubscribe', 'jangan chat', 'off', 'keluar'], opt_in_keywords: ['mulai', 'start', 'optin', 'aktifkan', 'on', 'lanjut', 'ya'] },
      human_handoff: { enabled: true, keywords: ['cs', 'admin', 'operator', 'manusia', 'orang', 'live agent', 'bantuan manusia'], release_keywords: ['!bot', 'aktifkan bot', 'kembali ke bot', 'bot', 'menu', 'selesai'], auto_expire_hours: 2 },
      session_timeout: { inactivity_minutes: 20, gc_interval_minutes: 10 }
    };
  }

  // =========================================================================
  // 1. COOLDOWN & ANTI-SPAM RATE LIMITING
  // =========================================================================

  /**
   * Enforces global rate limit across all outgoing messages to protect bot number from blast bans.
   */
  async waitForGlobalRateLimit() {
    const config = this.getConfig().cooldown || {};
    if (config.enabled === false) return;

    const maxPerMinute = config.global_max_per_minute || 25;
    const now = Date.now();

    // Prune entries older than 60 seconds
    this.globalMessageTimestamps = this.globalMessageTimestamps.filter(t => now - t < 60000);

    if (this.globalMessageTimestamps.length >= maxPerMinute) {
      this.stats.globalRateLimitWaits++;
      const oldest = this.globalMessageTimestamps[0];
      const waitTime = Math.max(500, 60000 - (now - oldest) + 200);
      console.log(`[Protection:RateLimit] Global rate limit tercapai (${this.globalMessageTimestamps.length}/${maxPerMinute} pesan/menit). Menahan pengiriman selama ${waitTime}ms`);
      await new Promise(r => setTimeout(r, waitTime));
    }

    this.globalMessageTimestamps.push(Date.now());
  }

  /**
   * Enforces per-user cooldown with human-like randomized jitter.
   */
  async waitForUserCooldown(jid) {
    const config = this.getConfig().cooldown || {};
    if (config.enabled === false || !jid) return;

    const minDelay = config.min_delay_ms || 2500;
    const jitter = config.jitter_ms || 1000;
    const randomizedDelay = minDelay + Math.floor(Math.random() * jitter);

    const now = Date.now();
    const lastReply = this.lastUserReplyTimes.get(jid) || 0;
    const elapsed = now - lastReply;

    if (elapsed < randomizedDelay) {
      const waitTime = randomizedDelay - elapsed;
      await new Promise(r => setTimeout(r, waitTime));
    }

    this.lastUserReplyTimes.set(jid, Date.now());
  }

  /**
   * Simulates natural human typing presence ('composing') based on message length.
   */
  async simulateTypingPresence(sock, jid, textLength = 50) {
    const config = this.getConfig().cooldown || {};
    if (config.enabled === false || config.typing_simulation === false || !sock || !jid) return;

    try {
      await sock.sendPresenceUpdate('composing', jid).catch(() => {});
      // Calculate realistic reading/typing delay: ~30ms per character, clamped between 800ms and 3000ms
      const baseDelay = Math.min(3000, Math.max(800, textLength * 25));
      const jitter = Math.floor(Math.random() * 400);
      await new Promise(r => setTimeout(r, baseDelay + jitter));
      await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    } catch (e) {}
  }

  recordUserReply(jid) {
    this.lastUserReplyTimes.set(jid, Date.now());
    this.touchActivity(jid);
  }

  // =========================================================================
  // 2. MESSAGE DEDUPLICATION (INBOUND & OUTBOUND)
  // =========================================================================

  _generateContentHash(prefix, jid, text) {
    const clean = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto.createHash('md5').update(`${prefix}:${jid}:${clean}`).digest('hex');
  }

  /**
   * Checks if an inbound message is a duplicate by key ID or content fingerprint.
   */
  isDuplicateInbound(msgId, jid, rawText) {
    const config = this.getConfig().deduplication || {};
    if (config.enabled === false) return false;

    const now = Date.now();
    const idTtl = (config.id_ttl_seconds || 300) * 1000;
    const contentWindow = config.content_window_ms || 3000;

    // 1. Check Message ID
    if (msgId && this.inboundMessageIds.has(msgId)) {
      const recordedAt = this.inboundMessageIds.get(msgId);
      if (now - recordedAt < idTtl) {
        this.stats.duplicatesBlocked++;
        return true;
      }
    }

    // 2. Check Content Fingerprint within rapid window
    if (jid && rawText) {
      const hash = this._generateContentHash('in', jid, rawText);
      if (this.inboundContentHashes.has(hash)) {
        const recordedAt = this.inboundContentHashes.get(hash);
        if (now - recordedAt < contentWindow) {
          this.stats.duplicatesBlocked++;
          return true;
        }
      }
    }

    return false;
  }

  recordInbound(msgId, jid, rawText) {
    const now = Date.now();
    if (msgId) {
      this.inboundMessageIds.set(msgId, now);
      if (this.inboundMessageIds.size > 5000) {
        const firstKey = this.inboundMessageIds.keys().next().value;
        this.inboundMessageIds.delete(firstKey);
      }
    }
    if (jid && rawText) {
      const hash = this._generateContentHash('in', jid, rawText);
      this.inboundContentHashes.set(hash, now);
      if (this.inboundContentHashes.size > 2000) {
        const firstKey = this.inboundContentHashes.keys().next().value;
        this.inboundContentHashes.delete(firstKey);
      }
    }
    this.stats.totalInboundProcessed++;
    this.touchActivity(jid);
  }

  /**
   * Checks if an outbound message is an exact duplicate of a recently sent message.
   */
  isDuplicateOutbound(jid, text) {
    const config = this.getConfig().deduplication || {};
    if (config.enabled === false || !jid || !text) return false;

    const windowMs = config.outbound_window_ms || 4000;
    const hash = this._generateContentHash('out', jid, text);
    const now = Date.now();

    if (this.outboundContentHashes.has(hash)) {
      const recordedAt = this.outboundContentHashes.get(hash);
      if (now - recordedAt < windowMs) {
        this.stats.duplicatesBlocked++;
        return true;
      }
    }

    return false;
  }

  recordOutbound(jid, text) {
    if (!jid || !text) return;
    const hash = this._generateContentHash('out', jid, text);
    this.outboundContentHashes.set(hash, Date.now());
    if (this.outboundContentHashes.size > 2000) {
      const firstKey = this.outboundContentHashes.keys().next().value;
      this.outboundContentHashes.delete(firstKey);
    }
  }

  // =========================================================================
  // 3. CONVERSATION BUFFER (INBOUND AGGREGATOR & CONTEXT BUFFER)
  // =========================================================================

  /**
   * Aggregates rapid consecutive messages from the same user into a unified context buffer.
   */
  bufferInboundMessage(jid, msg, rawText, mediaType, onFlush) {
    const config = this.getConfig().conversation_buffer || {};
    if (config.enabled === false) {
      onFlush({ texts: [rawText], lastMsg: msg, mediaType: mediaType || 'text' });
      return;
    }

    const debounceMs = config.debounce_ms || 2000;
    const maxItems = config.max_buffer_items || 10;
    const now = Date.now();

    let record = this.pendingBuffers.get(jid);

    if (record) {
      clearTimeout(record.timer);
      record.texts.push(rawText);
      record.lastMsg = msg;
      if (mediaType && mediaType !== 'text') {
        record.mediaType = mediaType;
      }
      this.stats.burstsAggregated++;

      // Force flush if user sent too many bursts or buffer exceeded 6 seconds
      const bufferAge = now - (record.startTime || now);
      if (record.texts.length >= maxItems || bufferAge > 6000) {
        this.pendingBuffers.delete(jid);
        onFlush(record);
        return;
      }

      record.timer = setTimeout(() => {
        this.pendingBuffers.delete(jid);
        onFlush(record);
      }, debounceMs);

    } else {
      record = {
        texts: [rawText],
        lastMsg: msg,
        mediaType: mediaType || 'text',
        startTime: now,
        timer: null
      };

      record.timer = setTimeout(() => {
        this.pendingBuffers.delete(jid);
        onFlush(record);
      }, debounceMs);

      this.pendingBuffers.set(jid, record);
    }
  }

  trimContextHistory(history = []) {
    const config = this.getConfig().conversation_buffer || {};
    const maxTurns = config.max_context_turns || 6;
    if (history.length > maxTurns * 2) {
      return history.slice(-maxTurns * 2);
    }
    return history;
  }

  // =========================================================================
  // 4. RETRY LIMIT & CIRCUIT BREAKER
  // =========================================================================

  /**
   * Executes an async operation with exponential backoff and a hard retry limit.
   */
  async withRetry(operation, options = {}) {
    const config = this.getConfig().retry_limit || {};
    const maxRetries = options.maxRetries ?? (config.max_retries || 2);
    const baseDelay = options.baseDelayMs ?? (config.backoff_base_ms || 1000);
    const context = options.context || 'Operation';

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        this.stats.retriesAttempted++;

        if (attempt < maxRetries) {
          const backoff = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
          console.warn(`[Protection:Retry] Percobaan ${attempt + 1}/${maxRetries} gagal untuk [${context}]. Mencoba lagi dalam ${backoff}ms. Error: ${err.message}`);
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    throw lastError;
  }

  /**
   * Circuit Breaker: Prevents repeated API hammer when external AI service is down or rate-limited.
   */
  isCircuitOpen(serviceName = 'ai') {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return false;

    if (breaker.state === 'OPEN') {
      const now = Date.now();
      if (now >= breaker.nextAttemptTime) {
        breaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    return false;
  }

  recordCircuitSuccess(serviceName = 'ai') {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
    }
  }

  recordCircuitFailure(serviceName = 'ai', err) {
    const config = this.getConfig().retry_limit || {};
    const threshold = config.circuit_breaker_threshold || 3;
    const timeoutMs = config.circuit_breaker_timeout_ms || 60000;

    let breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      breaker = { state: 'CLOSED', failureCount: 0, nextAttemptTime: 0 };
      this.circuitBreakers.set(serviceName, breaker);
    }

    breaker.failureCount++;
    console.warn(`[Protection:CircuitBreaker] Layanan '${serviceName}' gagal (${breaker.failureCount}/${threshold}):`, err?.message || err);

    if (breaker.failureCount >= threshold) {
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = Date.now() + timeoutMs;
      this.stats.circuitTrips++;
      console.error(`[Protection:CircuitBreaker] ⚠️ Circuit Breaker untuk '${serviceName}' AKTIF (TRIPPED). Permintaan AI dibekukan selama ${timeoutMs / 1000}s untuk mencegah pemblokiran rate limit.`);
    }
  }

  // =========================================================================
  // 5. OPT-IN & CONSENT MANAGEMENT (0PT-IN)
  // =========================================================================

  ensureDataDirectory() {
    const dir = path.dirname(OPT_IN_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadOptInData() {
    try {
      this.ensureDataDirectory();
      if (fs.existsSync(OPT_IN_FILE)) {
        const raw = fs.readFileSync(OPT_IN_FILE, 'utf8');
        const data = JSON.parse(raw || '{}');
        for (const [jid, val] of Object.entries(data)) {
          this.optInRegistry.set(jid, val);
          if (val.optedIn === false) this.stats.optOutUsers++;
        }
      }
    } catch (e) {
      console.warn('[Protection:OptIn] Gagal memuat data opt-in:', e.message);
    }
  }

  saveOptInData() {
    try {
      this.ensureDataDirectory();
      const obj = {};
      let optOutCount = 0;
      for (const [jid, val] of this.optInRegistry.entries()) {
        obj[jid] = val;
        if (val.optedIn === false) optOutCount++;
      }
      this.stats.optOutUsers = optOutCount;
      fs.writeFileSync(OPT_IN_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Protection:OptIn] Gagal menyimpan data opt-in:', e.message);
    }
  }

  isOptedIn(jid) {
    const config = this.getConfig().opt_in || {};
    if (config.enabled === false) return true;
    if (!jid) return true;

    const record = this.optInRegistry.get(jid);
    if (!record) {
      return config.default_opted_in !== false;
    }
    return record.optedIn !== false;
  }

  /**
   * Processes opt-in or opt-out keywords.
   * Returns: { handled: boolean, shouldIgnore: boolean, reply: string | null }
   */
  checkOptInOut(jid, text) {
    const config = this.getConfig().opt_in || {};
    if (config.enabled === false || !text) {
      return { handled: false, shouldIgnore: false, reply: null };
    }

    const textClean = String(text).trim().toLowerCase();
    const optOutKeywords = config.opt_out_keywords || ['stop', 'berhenti', 'unsubscribe', 'jangan chat', 'off', 'keluar'];
    const optInKeywords = config.opt_in_keywords || ['mulai', 'start', 'optin', 'aktifkan', 'on', 'lanjut', 'ya'];

    const currentlyOptedIn = this.isOptedIn(jid);

    // Case 1: User explicitly opts out
    if (optOutKeywords.some(kw => textClean === kw || textClean.startsWith(`${kw} `))) {
      this.optInRegistry.set(jid, {
        optedIn: false,
        timestamp: new Date().toISOString(),
        reason: 'User command: ' + textClean
      });
      this.saveOptInData();
      console.log(`[Protection:OptIn] Pengguna ${jid} memilih OPT-OUT (berhenti menerima bot).`);

      const reply = `Baik, layanan pesan otomatis telah dinonaktifkan untuk nomor Anda.\n\nAnda tidak akan menerima pesan dari asisten kami lagi. Bila sewaktu-waktu Kakak ingin mengaktifkan kembali, cukup balas dengan 'MULAI' atau 'START'. Terima kasih.`;
      return { handled: true, shouldIgnore: false, reply };
    }

    // Case 2: User was opted out and now wants to opt in again
    if (!currentlyOptedIn) {
      if (optInKeywords.some(kw => textClean === kw || textClean.startsWith(`${kw} `))) {
        this.optInRegistry.set(jid, {
          optedIn: true,
          timestamp: new Date().toISOString(),
          reason: 'User command: ' + textClean
        });
        this.saveOptInData();
        console.log(`[Protection:OptIn] Pengguna ${jid} memilih OPT-IN kembali.`);

        const reply = `Terima kasih! Layanan asisten otomatis telah aktif kembali untuk nomor Anda.\n\nAda yang dapat kami bantu terkait produk karpet atau layanan kami hari ini?`;
        return { handled: true, shouldIgnore: false, reply };
      }

      // If opted out and text is NOT an opt-in keyword, silently ignore!
      // This is crucial: NEVER reply to users who opted out to prevent spam complaints!
      console.log(`[Protection:OptIn] Mengabaikan pesan dari ${jid} karena berstatus Opt-Out.`);
      return { handled: true, shouldIgnore: true, reply: null };
    }

    // Case 3: First time user - record implicit opt-in
    if (!this.optInRegistry.has(jid)) {
      this.optInRegistry.set(jid, {
        optedIn: true,
        timestamp: new Date().toISOString(),
        reason: 'First interaction'
      });
      this.saveOptInData();
    }

    return { handled: false, shouldIgnore: false, reply: null };
  }

  setOptIn(jid, status = true, reason = 'Admin update') {
    this.optInRegistry.set(jid, {
      optedIn: Boolean(status),
      timestamp: new Date().toISOString(),
      reason
    });
    this.saveOptInData();
  }

  loadHandoffData() {
    try {
      const dir = path.dirname(HANDOFF_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(HANDOFF_FILE)) {
        const raw = fs.readFileSync(HANDOFF_FILE, 'utf8');
        const data = JSON.parse(raw || '{}');
        for (const [k, v] of Object.entries(data)) {
          this.handoffRegistry.set(k, v);
        }
      }
    } catch (e) {
      console.warn('[Protection:HumanHandoff] Gagal memuat data handoff.json:', e.message);
    }
  }

  saveHandoffData() {
    try {
      const dir = path.dirname(HANDOFF_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const obj = {};
      for (const [k, v] of this.handoffRegistry.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(HANDOFF_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Protection:HumanHandoff] Gagal menyimpan data handoff.json:', e.message);
    }
  }

  // =========================================================================
  // 6. HUMAN HANDOFF MANAGEMENT (PER-CONTACT AI CONTROL)
  // =========================================================================

  isHumanHandoff(jid) {
    const config = this.getConfig().human_handoff || {};
    if (config.enabled === false || !jid) return false;

    const raw = String(jid).trim();
    const shortKey = raw.split('@')[0];
    const phoneService = require('./phoneService');
    const mappedPhone = phoneService.getPhone ? phoneService.getPhone(raw) : null;

    const keysToCheck = [raw, shortKey];
    if (mappedPhone) {
      keysToCheck.push(mappedPhone, `${mappedPhone}@s.whatsapp.net`);
    }

    for (const k of keysToCheck) {
      const record = this.handoffRegistry.get(k);
      if (record && record.active) {
        // Check Auto-Expiry
        const maxAgeHours = config.auto_expire_hours || 2;
        const now = Date.now();
        if (record.requestedAt && (now - record.requestedAt) > maxAgeHours * 60 * 60 * 1000) {
          record.active = false;
          this.saveHandoffData();
          this.stats.humanHandoffsActive = Math.max(0, this.stats.humanHandoffsActive - 1);
          console.log(`[Protection:HumanHandoff] Sesi CS manusia untuk ${k} kedaluwarsa setelah ${maxAgeHours} jam. Bot aktif kembali.`);
          return false;
        }
        return true;
      }
    }

    return false;
  }

  setHumanHandoff(jid, active = true, reason = 'CS requested') {
    if (!jid) return;
    const raw = String(jid).trim();
    const shortKey = raw.split('@')[0];
    const phoneService = require('./phoneService');
    const mappedPhone = phoneService.getPhone ? phoneService.getPhone(raw) : null;

    const keysToSet = [raw, shortKey];
    if (mappedPhone) {
      keysToSet.push(mappedPhone, `${mappedPhone}@s.whatsapp.net`);
    }

    const wasActive = this.isHumanHandoff(raw);
    const now = Date.now();

    for (const k of keysToSet) {
      this.handoffRegistry.set(k, {
        active: Boolean(active),
        requestedAt: active ? now : 0,
        reason
      });
    }
    this.saveHandoffData();

    if (active && !wasActive) {
      this.stats.humanHandoffsActive++;
      this.emit('human_handoff_started', { jid: raw, reason, timestamp: new Date().toISOString() });
    } else if (!active && wasActive) {
      this.stats.humanHandoffsActive = Math.max(0, this.stats.humanHandoffsActive - 1);
      this.emit('human_handoff_ended', { jid: raw, timestamp: new Date().toISOString() });
    }

    return { active: Boolean(active), reason };
  }

  isAiEnabledForContact(jid) {
    return !this.isHumanHandoff(jid);
  }

  setAiEnabledForContact(jid, enabled, reason = 'Admin toggled AI') {
    return this.setHumanHandoff(jid, !enabled, reason);
  }

  checkHandoffKeywords(text) {
    const config = this.getConfig().human_handoff || {};
    if (config.enabled === false || !text) return null;

    const textClean = String(text).trim().toLowerCase();
    const releaseKeywords = config.release_keywords || ['!bot', 'aktifkan bot', 'kembali ke bot', 'bot', 'menu', 'selesai', 'nyalakan bot'];

    if (releaseKeywords.some(kw => textClean === kw || textClean.startsWith(`${kw} `))) {
      return 'RELEASE';
    }

    // Comprehensive detection for customer asking for CS / Human assistance
    const triggerPhrases = [
      'cs', 'chat cs', 'mau cs', 'minta cs', 'bicara cs', 'hubungi cs', 'hubungkan cs', 'kontak cs',
      'admin', 'operator', 'manusia', 'orang', 'live agent', 'bantuan manusia', 'customer service',
      'bicara dengan cs', 'bicara dengan admin', 'bicara dengan manusia', 'chat dengan cs', 'chat dengan admin',
      'mau bicara dengan cs', 'mau bicara sama orang', 'staff cs', 'butuh cs', 'panggil cs', 'tolong cs',
      'chat dengan orang', 'bisa bicara dengan orang', 'bisa bicara dengan admin'
    ];

    for (const kw of triggerPhrases) {
      if (textClean === kw) return 'TRIGGER';
      if (kw.length > 2 && textClean.includes(kw)) return 'TRIGGER';
      // Word boundary regex for 2-letter 'cs' to avoid false positives (e.g. 'access', 'process')
      if (kw === 'cs' && /\bcs\b/i.test(textClean)) return 'TRIGGER';
    }

    return null;
  }

  // =========================================================================
  // 7. SESSION TIMEOUT & INACTIVITY RECOVERY
  // =========================================================================

  touchActivity(jid) {
    if (jid) {
      this.userLastActivityTimes.set(jid, Date.now());
    }
  }

  isSessionTimedOut(jid, timeoutMinutes = null) {
    const config = this.getConfig().session_timeout || {};
    const minutes = timeoutMinutes || config.inactivity_minutes || 20;
    const now = Date.now();
    const last = this.userLastActivityTimes.get(jid);

    if (!last) return false;
    return (now - last) > minutes * 60 * 1000;
  }

  // =========================================================================
  // 8. GARBAGE COLLECTION & HEALTH METRICS
  // =========================================================================

  runGarbageCollection() {
    const now = Date.now();

    // 1. Prune Inbound IDs older than 10 minutes
    for (const [id, time] of this.inboundMessageIds.entries()) {
      if (now - time > 10 * 60 * 1000) this.inboundMessageIds.delete(id);
    }

    // 2. Prune Content Hashes older than 10 minutes
    for (const [hash, time] of this.inboundContentHashes.entries()) {
      if (now - time > 10 * 60 * 1000) this.inboundContentHashes.delete(hash);
    }
    for (const [hash, time] of this.outboundContentHashes.entries()) {
      if (now - time > 10 * 60 * 1000) this.outboundContentHashes.delete(hash);
    }

    // 3. Prune Inactive Activity Timestamps older than 24 hours
    for (const [jid, time] of this.userLastActivityTimes.entries()) {
      if (now - time > 24 * 60 * 60 * 1000) this.userLastActivityTimes.delete(jid);
    }

    // 4. Prune Expired Handoffs
    for (const [jid, rec] of this.handoffRegistry.entries()) {
      if (rec.active && (now - rec.requestedAt) > 2 * 60 * 60 * 1000) {
        rec.active = false;
      }
    }

    // 5. Prune Global Message Timestamps older than 60 seconds
    this.globalMessageTimestamps = this.globalMessageTimestamps.filter(t => now - t < 60000);
  }

  getStats() {
    return {
      ...this.stats,
      inboundCacheSize: this.inboundMessageIds.size,
      activePendingBuffers: this.pendingBuffers.size,
      circuitBreakerState: this.circuitBreakers.get('ai')?.state || 'CLOSED',
      activeHandoffsCount: Array.from(this.handoffRegistry.values()).filter(r => r.active).length,
      optOutCount: Array.from(this.optInRegistry.values()).filter(r => r.optedIn === false).length,
      uptimeSeconds: Math.floor(process.uptime())
    };
  }
}

module.exports = new ProtectionService();
