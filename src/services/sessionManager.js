const protectionService = require('./protectionService');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.messageStore = new Map();
    // Default session timeout: 30 minutes of inactivity resets state to IDLE
    this.SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  }

  storeMessage(id, message) {
    if (!id || !message) return;
    this.messageStore.set(id, message);
    if (this.messageStore.size > 1000) {
      const first = this.messageStore.keys().next().value;
      this.messageStore.delete(first);
    }
  }

  getMessage(id) {
    if (!id) return undefined;
    return this.messageStore.get(id);
  }

  getSessionTimeoutMs() {
    try {
      const config = protectionService.getConfig();
      const minutes = config.session_timeout?.inactivity_minutes || 20;
      return minutes * 60 * 1000;
    } catch (e) {
      return this.SESSION_TIMEOUT_MS;
    }
  }

  getSession(jid) {
    const now = Date.now();
    let session = this.sessions.get(jid);
    const timeoutMs = this.getSessionTimeoutMs();

    if (!session) {
      session = {
        jid,
        state: 'IDLE', // IDLE, CHECK_TICKET, TICKET_NAME, TICKET_CONTACT, TICKET_DESC, HUMAN_CS
        data: {},
        lastActivity: now,
        lastReplyTime: 0
      };
      this.sessions.set(jid, session);
    } else {
      // Check if session timed out from inactivity (excluding active HUMAN_CS mode)
      if (session.state !== 'HUMAN_CS' && now - session.lastActivity > timeoutMs) {
        console.log(`[SessionManager] Sesi ${jid} kedaluwarsa setelah ${Math.round((now - session.lastActivity) / 60000)} menit tidak aktif. Mengembalikan ke IDLE.`);
        session.state = 'IDLE';
        session.data = {};
      }
      session.lastActivity = now;
    }

    protectionService.touchActivity(jid);
    return session;
  }

  setState(jid, state, data = {}) {
    const session = this.getSession(jid);
    session.state = state;
    session.data = { ...session.data, ...data };
    session.lastActivity = Date.now();
    protectionService.touchActivity(jid);
    return session;
  }

  resetSession(jid) {
    const session = this.getSession(jid);
    session.state = 'IDLE';
    session.data = {};
    session.lastActivity = Date.now();
    protectionService.touchActivity(jid);
    return session;
  }

  isCooldown(jid, cooldownSeconds = 1) {
    if (cooldownSeconds <= 0) return false;
    const session = this.getSession(jid);
    const now = Date.now();
    if (session.lastReplyTime && (now - session.lastReplyTime) < cooldownSeconds * 1000) {
      return true;
    }
    return false;
  }

  updateReplyTime(jid) {
    const session = this.getSession(jid);
    session.lastReplyTime = Date.now();
    protectionService.recordUserReply(jid);
  }

  setHumanMode(jid, enabled = true, reason = 'CS requested') {
    const session = this.getSession(jid);
    if (enabled) {
      session.state = 'HUMAN_CS';
      session.humanModeStartedAt = Date.now();
      protectionService.setHumanHandoff(jid, true, reason);
    } else {
      session.state = 'IDLE';
      session.data = {};
      protectionService.setHumanHandoff(jid, false);
    }
    return session;
  }

  isHumanMode(jid) {
    const session = this.getSession(jid);
    // Double check with protectionService handoff status
    if (protectionService.isHumanHandoff(jid)) {
      session.state = 'HUMAN_CS';
      return true;
    }

    if (session.state === 'HUMAN_CS') {
      const now = Date.now();
      const config = protectionService.getConfig();
      const maxAgeMs = (config.human_handoff?.auto_expire_hours || 2) * 60 * 60 * 1000;
      if (session.humanModeStartedAt && (now - session.humanModeStartedAt) > maxAgeMs) {
        session.state = 'IDLE';
        protectionService.setHumanHandoff(jid, false);
        return false;
      }
      return true;
    }
    return false;
  }
}

module.exports = new SessionManager();
