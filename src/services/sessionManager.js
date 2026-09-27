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

  getSession(jid) {
    const now = Date.now();
    let session = this.sessions.get(jid);

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
      // If inactive for too long and not in HUMAN_CS mode, reset to IDLE
      if (session.state !== 'HUMAN_CS' && now - session.lastActivity > this.SESSION_TIMEOUT_MS) {
        session.state = 'IDLE';
        session.data = {};
      }
      session.lastActivity = now;
    }

    return session;
  }

  setState(jid, state, data = {}) {
    const session = this.getSession(jid);
    session.state = state;
    session.data = { ...session.data, ...data };
    session.lastActivity = Date.now();
    return session;
  }

  resetSession(jid) {
    const session = this.getSession(jid);
    session.state = 'IDLE';
    session.data = {};
    session.lastActivity = Date.now();
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
  }

  setHumanMode(jid, enabled = true) {
    const session = this.getSession(jid);
    if (enabled) {
      session.state = 'HUMAN_CS';
      session.humanModeStartedAt = Date.now();
    } else {
      session.state = 'IDLE';
      session.data = {};
    }
    return session;
  }

  isHumanMode(jid) {
    const session = this.getSession(jid);
    if (session.state === 'HUMAN_CS') {
      // Check if human mode expired (e.g. 2 hours)
      const now = Date.now();
      if (session.humanModeStartedAt && (now - session.humanModeStartedAt) > 2 * 60 * 60 * 1000) {
        session.state = 'IDLE';
        return false;
      }
      return true;
    }
    return false;
  }
}

module.exports = new SessionManager();
