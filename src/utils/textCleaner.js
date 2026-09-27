/**
 * Utility to clean bot messages:
 * 1. Remove all asterisks (*) used for bolding
 * 2. Remove all emoji characters and symbols
 * 3. Remove robotic "Ketik ..." commands if any slip through
 */

function stripStarsAndEmojis(text) {
  if (!text || typeof text !== 'string') return text || '';

  // 1. Remove asterisks (*)
  let cleaned = text.replace(/\*/g, '');

  // 2. Remove emojis and pictographs
  cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F000}-\u{1F2FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2B50}\u{231A}-\u{231B}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}]/gu, '');
  cleaned = cleaned.replace(/[0-9]\uFE0F?\u20E3/gu, '');

  // 3. Remove leftover repeated whitespace and clean line starts
  cleaned = cleaned.replace(/^[ \t]+/gm, '').replace(/[ \t]+$/gm, '');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // 4. Remove leading dashes or bullets that might be left orphaned by stripped emoji
  cleaned = cleaned.replace(/^[•\-\*]\s*$/gm, '');

  return cleaned.trim();
}

module.exports = {
  stripStarsAndEmojis
};
