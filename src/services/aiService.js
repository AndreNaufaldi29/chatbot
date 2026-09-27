const geminiService = require('./geminiService');
const groqService = require('./groqService');
const menuHandler = require('../handlers/menuHandler');

class AiService {
  getActiveProvider() {
    const config = menuHandler.getConfig();
    const configured = config?.ai?.provider;
    if (configured === 'groq' || configured === 'gemini') {
      return configured;
    }
    if (groqService.isAiEnabled()) return 'groq';
    if (geminiService.isAiEnabled()) return 'gemini';
    return 'gemini';
  }

  isAiEnabled() {
    const config = menuHandler.getConfig();
    if (config?.ai?.enabled === false) return false;
    return groqService.isAiEnabled() || geminiService.isAiEnabled();
  }

  async generateReply(jid, userText, senderName = 'Kak') {
    const provider = this.getActiveProvider();

    if (provider === 'groq') {
      if (groqService.isAiEnabled()) {
        try {
          const reply = await groqService.generateReply(jid, userText, senderName);
          if (reply) return reply;
        } catch (err) {
          console.warn('[AiService] Groq gagal, mencoba failover ke Gemini:', err.message);
        }
      }
      // Failover to Gemini
      if (geminiService.isAiEnabled()) {
        return await geminiService.generateReply(jid, userText, senderName);
      }
    } else {
      // Gemini preferred
      if (geminiService.isAiEnabled()) {
        try {
          const reply = await geminiService.generateReply(jid, userText, senderName);
          if (reply) return reply;
        } catch (err) {
          console.warn('[AiService] Gemini gagal, mencoba failover ke Groq:', err.message);
        }
      }
      // Failover to Groq
      if (groqService.isAiEnabled()) {
        return await groqService.generateReply(jid, userText, senderName);
      }
    }

    return null;
  }

  async testConnection(provider, apiKey, model) {
    if (provider === 'groq') {
      return await groqService.testConnection(apiKey, model);
    } else {
      return await geminiService.testConnection(apiKey, model);
    }
  }

  syncConfig(aiConfig) {
    if (aiConfig.gemini_api_key !== undefined || aiConfig.model !== undefined) {
      geminiService.syncApiKey(aiConfig.gemini_api_key, aiConfig.model);
    }
    if (aiConfig.groq_api_key !== undefined || aiConfig.groq_model !== undefined) {
      groqService.syncApiKey(aiConfig.groq_api_key, aiConfig.groq_model);
    }
  }

  clearHistory(jid) {
    geminiService.clearHistory(jid);
    groqService.clearHistory(jid);
  }
}

module.exports = new AiService();
