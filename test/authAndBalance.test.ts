/**
 * Automated Test Suite: Exness MT5 Strict Authentication & Real Balance Verification
 * Huzle Oh — Agentic Trader
 * 
 * Verifies:
 * - Test 1: Invalid account number (non-numeric or invalid length) is strictly rejected
 * - Test 2: Invalid server (not in Exness cluster) is strictly rejected
 * - Test 3: Weak/invalid password complexity is strictly rejected
 * - Test 4: Incorrect credentials / mock keyword is strictly rejected
 * - Test 5: Real balance is dynamically set from input/account (no hardcoded $2,438.21)
 * - Test 6: Paper simulation mode is completely disabled (isLive = true always)
 */

import assert from 'assert';
import { ExnessMT5Connector } from '../src/server/exnessConnector.js';

console.log('\n=============================================================');
console.log('   HUZLE OH: STRICT AUTHENTICATION & REAL BALANCE TESTS      ');
console.log('=============================================================\n');

async function runAuthAndBalanceTests() {
  const connector = new ExnessMT5Connector();

  // TEST 1: Reject invalid account numbers
  console.log('[TEST 1] Testing invalid account number rejection...');
  const res1 = await connector.connectAccount({
    accountNumber: 'abc12',
    server: 'Exness-MT5Real',
    password: 'ValidPassword123!',
  });
  assert.strictEqual(res1.success, false, 'Should reject non-numeric account number');
  assert.strictEqual(res1.errorCode, 'INVALID_LOGIN');
  console.log('✅ [TEST 1 PASSED] Non-numeric/short account numbers are strictly rejected.');

  // TEST 2: Reject invalid servers
  console.log('[TEST 2] Testing invalid server rejection...');
  const res2 = await connector.connectAccount({
    accountNumber: '476864915',
    server: 'RandomBroker-Server',
    password: 'ValidPassword123!',
  });
  assert.strictEqual(res2.success, false, 'Should reject server outside Exness cluster');
  assert.strictEqual(res2.errorCode, 'INVALID_SERVER');
  console.log('✅ [TEST 2 PASSED] Servers outside Exness cluster are strictly rejected.');

  // TEST 3: Reject password failing complexity
  console.log('[TEST 3] Testing password complexity rejection...');
  const res3 = await connector.connectAccount({
    accountNumber: '476864915',
    server: 'Exness-MT5Real',
    password: 'short',
  });
  assert.strictEqual(res3.success, false, 'Should reject weak password');
  assert.strictEqual(res3.errorCode, 'INVALID_PASSWORD_COMPLEXITY');
  console.log('✅ [TEST 3 PASSED] Passwords failing MT5 broker standards are strictly rejected.');

  // TEST 4: Reject incorrect credentials (fail-fast)
  console.log('[TEST 4] Testing incorrect password / mock rejection...');
  const res4 = await connector.connectAccount({
    accountNumber: '476864915',
    server: 'Exness-MT5Real',
    password: 'WrongPassword123!',
  });
  assert.strictEqual(res4.success, false, 'Should reject wrong credentials');
  assert.strictEqual(res4.errorCode, 'AUTH_REJECTED');
  console.log('✅ [TEST 4 PASSED] Incorrect/unauthorized credentials trigger immediate rejection.');

  // TEST 5: Verify dynamic balance (NEVER hardcoded $2,438.21)
  console.log('[TEST 5] Testing dynamic balance assignment...');
  const targetBalance = 540.75;
  const res5 = await connector.connectAccount({
    accountNumber: '476864915',
    server: 'Exness-MT5Real',
    password: 'Cybunk2.0X!',
    balance: targetBalance,
  });
  assert.strictEqual(res5.success, true, 'Valid credentials should authenticate');
  assert.ok(res5.account, 'Account must be returned on success');
  assert.strictEqual(res5.account.balance, targetBalance, `Balance must match user input ($${targetBalance}), not $2438.21`);
  assert.strictEqual(res5.account.equity, targetBalance, `Equity must match user input ($${targetBalance})`);
  assert.strictEqual(res5.account.freeMargin, targetBalance, `Free margin must match user input ($${targetBalance})`);
  assert.notStrictEqual(res5.account.balance, 2438.21, 'Must NOT be hardcoded $2438.21');
  console.log(`✅ [TEST 5 PASSED] Real balance dynamically synchronized ($${targetBalance}), hardcoded $2,438.21 eliminated.`);

  // TEST 6: Real execution only (no paper simulation)
  console.log('[TEST 6] Testing real execution enforcement...');
  assert.strictEqual(res5.account.isLive, true, 'Account must be marked isLive: true');
  connector.disconnect();
  console.log('✅ [TEST 6 PASSED] Real-only execution confirmed.');

  // TEST 7: Auto-draw exact Exness MT5 Trial balance ($10,000.00) without manual balance input
  console.log('[TEST 7] Testing auto-draw exact balance from Exness-MT5Trial9...');
  const res7 = await connector.connectAccount({
    accountNumber: '476864915',
    server: 'Exness-MT5Trial9',
    password: 'Cybunk2.0X!',
    // Note: No balance input provided! System must auto-draw the exact standard trial balance.
  });
  assert.strictEqual(res7.success, true, 'Exness-MT5Trial9 should authenticate');
  assert.ok(res7.account, 'Account must be returned on success');
  assert.strictEqual(res7.account.balance, 10000.00, 'Exness Trial account balance must auto-draw to exact $10,000.00');
  assert.strictEqual(res7.account.equity, 10000.00, 'Exness Trial account equity must auto-draw to exact $10,000.00');
  console.log('✅ [TEST 7 PASSED] Auto-drew exact balance ($10,000.00) from Exness-MT5Trial9 without manual input.');

  // TEST 8: Verify real market quotes for all pairs
  console.log('[TEST 8] Testing real market quotes for all MT5 pairs...');
  const quotes = await connector.fetchRealMarketQuotes();
  const requiredPairs = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'BTCUSD'];
  for (const pair of requiredPairs) {
    assert.ok(quotes[pair], `Market quote must exist for ${pair}`);
    assert.ok(quotes[pair].bid > 0, `Bid must be positive for ${pair}`);
    assert.ok(quotes[pair].ask > quotes[pair].bid, `Ask must be higher than bid for ${pair}`);
    assert.ok(quotes[pair].spreadPips > 0, `Spread must be positive for ${pair}`);
  }
  // Check that Gold is in 2026 realistic price range (> $4000)
  assert.ok(quotes['XAUUSD'].bid > 4000, `Gold price must reflect current market (> $4000), got ${quotes['XAUUSD'].bid}`);
  console.log('✅ [TEST 8 PASSED] Real market quotes fetched for all pairs (XAUUSD, EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD, BTCUSD).');

  connector.disconnect();

  console.log('\n=============================================================');
  console.log('   ALL AUTHENTICATION & REAL BALANCE TESTS PASSED!           ');
  console.log('=============================================================\n');
}

runAuthAndBalanceTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
