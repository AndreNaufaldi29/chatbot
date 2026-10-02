const geminiService = require('./geminiService');
const groqService = require('./groqService');
const menuHandler = require('../handlers/menuHandler');
const protectionService = require('./protectionService');

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
    // 1. Circuit Breaker Check: if AI service is tripping/rate-limited, avoid API hammering
    if (protectionService.isCircuitOpen('ai')) {
      console.warn('[AiService] Circuit breaker AI sedang OPEN (terpicu error beruntun). Menggunakan fallback respons rule-based.');
      return null;
    }

    const provider = this.getActiveProvider();
    let reply = null;

    try {
      if (provider === 'groq') {
        if (groqService.isAiEnabled()) {
          try {
            reply = await protectionService.withRetry(
              () => groqService.generateReply(jid, userText, senderName),
              { maxRetries: 1, baseDelayMs: 800, context: 'Groq AI' }
            );
          } catch (err) {
            console.warn('[AiService] Groq gagal setelah retry, mencoba failover ke Gemini:', err.message);
          }
        }
        // Failover to Gemini
        if (!reply && geminiService.isAiEnabled()) {
          try {
            reply = await protectionService.withRetry(
              () => geminiService.generateReply(jid, userText, senderName),
              { maxRetries: 1, baseDelayMs: 800, context: 'Gemini Failover' }
            );
          } catch (err) {
            console.warn('[AiService] Gemini failover gagal:', err.message);
          }
        }
      } else {
        // Gemini preferred
        if (geminiService.isAiEnabled()) {
          try {
            reply = await protectionService.withRetry(
              () => geminiService.generateReply(jid, userText, senderName),
              { maxRetries: 1, baseDelayMs: 800, context: 'Gemini AI' }
            );
          } catch (err) {
            console.warn('[AiService] Gemini gagal setelah retry, mencoba failover ke Groq:', err.message);
          }
        }
        // Failover to Groq
        if (!reply && groqService.isAiEnabled()) {
          try {
            reply = await protectionService.withRetry(
              () => groqService.generateReply(jid, userText, senderName),
              { maxRetries: 1, baseDelayMs: 800, context: 'Groq Failover' }
            );
          } catch (err) {
            console.warn('[AiService] Groq failover gagal:', err.message);
          }
        }
      }

      if (reply) {
        protectionService.recordCircuitSuccess('ai');
        return reply;
      } else {
        protectionService.recordCircuitFailure('ai', new Error('Semua provider AI tidak menghasilkan balasan'));
      }
    } catch (err) {
      protectionService.recordCircuitFailure('ai', err);
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
