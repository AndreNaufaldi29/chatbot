const protectionService = require('../src/services/protectionService');
const sessionManager = require('../src/services/sessionManager');

async function runTests() {
  console.log('🧪 Starting Protections Verification Test...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // 1. DEDUPLICATION TEST
  console.log('--- 1. Testing Message Deduplication ---');
  const testJid = 'test_user_123@s.whatsapp.net';
  const msgId = 'TEST_MSG_001';
  const text = 'Halo, mau tanya harga';

  assert(!protectionService.isDuplicateInbound(msgId, testJid, text), 'First message is not duplicate');
  protectionService.recordInbound(msgId, testJid, text);
  assert(protectionService.isDuplicateInbound(msgId, testJid, text), 'Same message ID is detected as duplicate');
  assert(protectionService.isDuplicateInbound('DIFFERENT_ID', testJid, text), 'Same content in short window is detected as duplicate');

  // Outbound Dedup
  assert(!protectionService.isDuplicateOutbound(testJid, 'Selamat datang'), 'First outbound is not duplicate');
  protectionService.recordOutbound(testJid, 'Selamat datang');
  assert(protectionService.isDuplicateOutbound(testJid, 'Selamat datang'), 'Duplicate outbound is detected');

  // 2. OPT-IN / OPT-OUT TEST
  console.log('\n--- 2. Testing Opt-in & Consent Management ---');
  const optJid = 'opt_test_user@s.whatsapp.net';
  assert(protectionService.isOptedIn(optJid), 'Default is opted-in for new inbound user');

  const optOutRes = protectionService.checkOptInOut(optJid, 'STOP');
  assert(optOutRes.handled && !protectionService.isOptedIn(optJid), 'User successfully opted out with STOP command');

  const ignoredRes = protectionService.checkOptInOut(optJid, 'Mau order dong');
  assert(ignoredRes.handled && ignoredRes.shouldIgnore, 'Subsequent message from opted-out user is safely ignored');

  const optInRes = protectionService.checkOptInOut(optJid, 'MULAI');
  assert(optInRes.handled && protectionService.isOptedIn(optJid), 'User successfully opted in again with MULAI');

  // 3. HUMAN HANDOFF TEST
  console.log('\n--- 3. Testing Human Handoff ---');
  const handoffJid = 'cs_test_user@s.whatsapp.net';
  assert(!protectionService.isHumanHandoff(handoffJid), 'Initially not in handoff');

  const trigger = protectionService.checkHandoffKeywords('mau bicara dengan CS manusia');
  assert(trigger === 'TRIGGER', 'Keyword "cs manusia" triggers handoff');
  sessionManager.setHumanMode(handoffJid, true, 'User requested human CS');
  assert(sessionManager.isHumanMode(handoffJid), 'Session is in HUMAN_CS mode');
  assert(protectionService.isHumanHandoff(handoffJid), 'Protection recognizes human handoff active');

  const release = protectionService.checkHandoffKeywords('aktifkan bot kembali');
  assert(release === 'RELEASE', 'Keyword "aktifkan bot" triggers release');
  sessionManager.setHumanMode(handoffJid, false);
  assert(!sessionManager.isHumanMode(handoffJid), 'Session returned to bot mode');

  // 4. RETRY LIMIT & CIRCUIT BREAKER TEST
  console.log('\n--- 4. Testing Retry Limit & Circuit Breaker ---');
  let attemptCount = 0;
  try {
    await protectionService.withRetry(async () => {
      attemptCount++;
      throw new Error('Simulated network error');
    }, { maxRetries: 2, baseDelayMs: 50, context: 'Test Retry' });
  } catch (err) {
    assert(attemptCount === 3, 'Retry executed initial attempt + 2 retries (total 3)');
  }

  // Circuit breaker test
  assert(!protectionService.isCircuitOpen('test_ai'), 'Circuit breaker is initially CLOSED');
  protectionService.recordCircuitFailure('test_ai', new Error('Fail 1'));
  protectionService.recordCircuitFailure('test_ai', new Error('Fail 2'));
  protectionService.recordCircuitFailure('test_ai', new Error('Fail 3'));
  assert(protectionService.isCircuitOpen('test_ai'), 'Circuit breaker TRIPPED (OPEN) after 3 failures');
  protectionService.recordCircuitSuccess('test_ai');
  assert(!protectionService.isCircuitOpen('test_ai'), 'Circuit breaker resets to CLOSED on success');

  // 5. CONVERSATION BUFFER TEST
  console.log('\n--- 5. Testing Inbound Conversation Buffer ---');
  const bufferJid = 'buffer_user_999@s.whatsapp.net';
  let bufferFlushed = false;
  let aggregatedResult = null;

  protectionService.bufferInboundMessage(bufferJid, { key: { id: 'm1' } }, 'Halo', 'text', (res) => {
    bufferFlushed = true;
    aggregatedResult = res;
  });

  protectionService.bufferInboundMessage(bufferJid, { key: { id: 'm2' } }, 'Mau tanya harga karpet masjid', 'text', (res) => {
    bufferFlushed = true;
    aggregatedResult = res;
  });

  // Wait 2.2 seconds for debounce to flush
  await new Promise(r => setTimeout(r, 2200));
  assert(bufferFlushed, 'Buffer timer flushed after debounce');
  assert(aggregatedResult && aggregatedResult.texts.length === 2, 'Buffer aggregated both messages');
  assert(aggregatedResult && aggregatedResult.texts.join(' \n ').includes('Halo \n Mau tanya harga karpet masjid'), 'Merged text is properly formatted');

  // 6. SESSION TIMEOUT TEST
  console.log('\n--- 6. Testing Session Timeout ---');
  const sessionJid = 'timeout_user_888@s.whatsapp.net';
  sessionManager.setState(sessionJid, 'TICKET_NAME', { name: 'Budi' });
  let s = sessionManager.getSession(sessionJid);
  assert(s.state === 'TICKET_NAME', 'Session state set to TICKET_NAME');

  // Simulate timeout: set lastActivity to 35 minutes ago
  s.lastActivity = Date.now() - (35 * 60 * 1000);
  let sAfterTimeout = sessionManager.getSession(sessionJid);
  assert(sAfterTimeout.state === 'IDLE', 'Session automatically resets to IDLE after timeout');

  // 7. COOLDOWN & GLOBAL RATE LIMIT TEST
  console.log('\n--- 7. Testing Cooldown & Rate Limiter ---');
  const cooldownJid = 'cooldown_user_777@s.whatsapp.net';
  const start = Date.now();
  protectionService.recordUserReply(cooldownJid);
  await protectionService.waitForUserCooldown(cooldownJid);
  const elapsed = Date.now() - start;
  assert(elapsed >= 2000, `User cooldown enforced (~${elapsed}ms delay)`);

  console.log(`\n========================================`);
  console.log(`🏁 TESTS COMPLETED: ${passed}/${total} PASSED!`);
  console.log(`========================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
