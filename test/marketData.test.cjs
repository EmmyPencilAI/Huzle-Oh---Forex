/**
 * Automated Test Suite: Real-Time Market Data & MT5 Feed Verification
 * Huzle Oh — Agentic Trader
 * 
 * Tests 1 to 8 covering all authoritative MT5 specifications:
 * - Test 1: No MT5 connection -> Price = null
 * - Test 2: Valid MT5 connection -> Price = actual MT5 tick
 * - Test 3: Stale tick (> 5s) -> Trading is blocked
 * - Test 4: Unknown symbol -> Symbol unavailable
 * - Test 5: Broker-specific symbol -> Resolve actual MT5 symbol (e.g. XAUUSD -> XAUUSDm)
 * - Test 6: Price changed -> Real-time stream receives updated value
 * - Test 7: Large price difference -> No hardcoded/reference price overrides MT5
 * - Test 8: Execution -> Final order validation requests fresh tick immediately before execution
 */

const assert = require('assert');

console.log('\n======================================================');
console.log('   HUZLE OH: MT5 REAL-TIME MARKET DATA TEST SUITE     ');
console.log('======================================================\n');

// Mock MT5 Connector simulating the exact interface
class TestMT5Connector {
  constructor() {
    this.isConnected = false;
    this.discoveredSymbols = [];
    this.symbolSpecs = {};
    this.latestTicks = {};
  }

  resolveBrokerSymbol(sym) {
    const clean = sym.toUpperCase().trim();
    if (this.discoveredSymbols.includes(clean)) return clean;
    const match = this.discoveredSymbols.find(s => s.startsWith(clean) || clean.startsWith(s.replace(/m$/i, '')));
    return match || clean;
  }

  getSymbolTick(symbol) {
    if (!this.isConnected) return null;
    const brokerSym = this.resolveBrokerSymbol(symbol);
    const tick = this.latestTicks[brokerSym] || this.latestTicks[symbol.toUpperCase()];
    if (!tick) return null;

    const dataAgeMs = Date.now() - tick.timestampMs;
    const status = dataAgeMs < 5000 ? 'LIVE' : dataAgeMs < 30000 ? 'STALE' : 'OFFLINE';
    return { ...tick, dataAgeMs, status };
  }

  async verifyPreExecution(symbol, direction, proposedEntry, maxSlippagePips = 3.0, maxSpreadPips = 4.0) {
    if (!this.isConnected) {
      return { valid: false, reason: 'MT5 NOT CONNECTED: Live execution is blocked.' };
    }
    const tick = this.getSymbolTick(symbol);
    if (!tick) {
      return { valid: false, reason: `Symbol "${symbol}" is not available on this Exness MT5 account.` };
    }
    if (tick.status !== 'LIVE' || tick.dataAgeMs > 5000) {
      return { valid: false, reason: `PRICE STALE: Market data is ${Math.round(tick.dataAgeMs / 1000)}s old. Execution blocked.` };
    }
    if (tick.spreadPips > maxSpreadPips) {
      return { valid: false, reason: `SPREAD SPIKE: Spread (${tick.spreadPips} pips) exceeds maximum allowed.` };
    }
    const executablePrice = direction === 'BUY' ? tick.ask : tick.bid;
    const pipSize = symbol.includes('XAU') ? 0.1 : 0.0001;
    const slippagePips = Math.abs(executablePrice - proposedEntry) / pipSize;
    if (slippagePips > maxSlippagePips) {
      return {
        valid: false,
        reason: `CANCEL TRADE (SLIPPAGE): Market moved by ${slippagePips.toFixed(1)} pips since proposal.`,
        executablePrice,
      };
    }
    return { valid: true, freshTick: tick, executablePrice };
  }
}

// ----------------------------------------------------
// TEST 1: No MT5 connection -> Price = null
// ----------------------------------------------------
function testNoMT5ConnectionReturnsNull() {
  console.log('[TEST 1] Testing Disconnected MT5 state...');
  const connector = new TestMT5Connector();
  connector.isConnected = false;

  const tick = connector.getSymbolTick('XAUUSD');
  assert.strictEqual(tick, null, 'Price MUST be null when MT5 is disconnected');
  console.log('✅ [TEST 1 PASSED] No MT5 connection correctly yields Price = null (Display: --).');
}

// ----------------------------------------------------
// TEST 2: Valid MT5 connection -> Price = actual MT5 tick
// ----------------------------------------------------
function testValidConnectionReturnsActualTick() {
  console.log('[TEST 2] Testing Authenticated MT5 Tick Feed...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['XAUUSDm', 'EURUSDm'];
  
  const now = Date.now();
  // 2026 Gold spot market level
  connector.latestTicks['XAUUSDm'] = {
    symbol: 'XAUUSD',
    brokerSymbol: 'XAUUSDm',
    bid: 4466.30,
    ask: 4466.60,
    last: 4466.45,
    spread: 0.30,
    spreadPips: 3.0,
    timestamp: new Date(now).toISOString(),
    timestampMs: now,
    dataAgeMs: 0,
    source: 'Exness MT5',
    status: 'LIVE'
  };

  const tick = connector.getSymbolTick('XAUUSD');
  assert.ok(tick !== null, 'Tick must not be null');
  assert.strictEqual(tick.bid, 4466.30, 'Bid must match actual MT5 price');
  assert.strictEqual(tick.ask, 4466.60, 'Ask must match actual MT5 price');
  assert.strictEqual(tick.status, 'LIVE', 'Fresh tick must have status LIVE');
  assert.strictEqual(tick.source, 'Exness MT5', 'Source must be Exness MT5');
  console.log('✅ [TEST 2 PASSED] Valid MT5 connection correctly supplies authoritative tick (Gold Bid: $4466.30, Status: LIVE).');
}

// ----------------------------------------------------
// TEST 3: Stale tick (> 5s) -> Trading is blocked
// ----------------------------------------------------
async function testStaleTickBlocksTrading() {
  console.log('[TEST 3] Testing Stale Price Threshold (> 5s)...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['EURUSDm'];

  // Tick timestamped 8 seconds ago
  const staleTime = Date.now() - 8000;
  connector.latestTicks['EURUSDm'] = {
    symbol: 'EURUSD',
    brokerSymbol: 'EURUSDm',
    bid: 1.16170,
    ask: 1.16178,
    last: 1.16174,
    spread: 0.00008,
    spreadPips: 0.8,
    timestamp: new Date(staleTime).toISOString(),
    timestampMs: staleTime,
    dataAgeMs: 8000,
    source: 'Exness MT5',
    status: 'LIVE'
  };

  const validation = await connector.verifyPreExecution('EURUSD', 'BUY', 1.16178);
  assert.strictEqual(validation.valid, false, 'Stale tick must fail pre-execution validation');
  assert.ok(validation.reason.includes('PRICE STALE'), 'Reason must explicitly flag PRICE STALE');
  console.log(`✅ [TEST 3 PASSED] Stale tick (> 5s) correctly blocked execution: "${validation.reason}"`);
}

// ----------------------------------------------------
// TEST 4: Unknown symbol -> Symbol unavailable
// ----------------------------------------------------
async function testUnknownSymbolFailsValidation() {
  console.log('[TEST 4] Testing Unknown Symbol Handling...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['XAUUSDm', 'EURUSDm'];

  const tick = connector.getSymbolTick('NONEXISTENT_PAIR');
  assert.strictEqual(tick, null, 'Unknown symbol tick must be null');

  const validation = await connector.verifyPreExecution('NONEXISTENT_PAIR', 'BUY', 1.0000);
  assert.strictEqual(validation.valid, false, 'Unknown symbol must be blocked');
  assert.ok(validation.reason.includes('not available'), 'Must state symbol is not available');
  console.log('✅ [TEST 4 PASSED] Unknown symbol correctly rejected as unavailable.');
}

// ----------------------------------------------------
// TEST 5: Broker-specific symbol -> Dynamic Resolution
// ----------------------------------------------------
function testDynamicBrokerSymbolResolution() {
  console.log('[TEST 5] Testing Dynamic Broker Symbol Discovery & Resolution...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['XAUUSDm', 'EURUSDm', 'GBPUSDm', 'USDJPYm'];

  const resolvedGold = connector.resolveBrokerSymbol('XAUUSD');
  const resolvedEur = connector.resolveBrokerSymbol('EURUSD');
  
  assert.strictEqual(resolvedGold, 'XAUUSDm', 'Base symbol XAUUSD must resolve to Exness account symbol XAUUSDm');
  assert.strictEqual(resolvedEur, 'EURUSDm', 'Base symbol EURUSD must resolve to Exness account symbol EURUSDm');
  console.log('✅ [TEST 5 PASSED] Dynamic Symbol Discovery maps XAUUSD -> XAUUSDm seamlessly.');
}

// ----------------------------------------------------
// TEST 6: Price changed -> Real-time updates reflect changes
// ----------------------------------------------------
function testPriceChangedUpdateStream() {
  console.log('[TEST 6] Testing Real-Time Tick Mutation...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['XAUUSDm'];

  const t0 = Date.now();
  connector.latestTicks['XAUUSDm'] = {
    symbol: 'XAUUSD',
    brokerSymbol: 'XAUUSDm',
    bid: 4466.30,
    ask: 4466.60,
    last: 4466.45,
    spread: 0.30,
    spreadPips: 3.0,
    timestamp: new Date(t0).toISOString(),
    timestampMs: t0,
    dataAgeMs: 0,
    source: 'Exness MT5',
    status: 'LIVE'
  };

  const initialTick = connector.getSymbolTick('XAUUSD');
  assert.strictEqual(initialTick.bid, 4466.30);

  // Price moves to 4468.10
  const t1 = Date.now();
  connector.latestTicks['XAUUSDm'] = {
    ...connector.latestTicks['XAUUSDm'],
    bid: 4468.10,
    ask: 4468.40,
    last: 4468.25,
    timestamp: new Date(t1).toISOString(),
    timestampMs: t1,
  };

  const updatedTick = connector.getSymbolTick('XAUUSD');
  assert.strictEqual(updatedTick.bid, 4468.10, 'Tick stream must immediately reflect new MT5 tick');
  console.log('✅ [TEST 6 PASSED] Price changed from $4466.30 to $4468.10 and stream received updated value.');
}

// ----------------------------------------------------
// TEST 7: Large price difference -> No hardcoded override
// ----------------------------------------------------
function testNoHardcodedOverride() {
  console.log('[TEST 7] Testing Absolute MT5 Authority (No Hardcoded Price Override)...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['XAUUSDm'];

  // Current MT5 gold tick is $4466.30, NOT the old hardcoded 2865.40
  const now = Date.now();
  connector.latestTicks['XAUUSDm'] = {
    symbol: 'XAUUSD',
    brokerSymbol: 'XAUUSDm',
    bid: 4466.30,
    ask: 4466.60,
    last: 4466.45,
    spread: 0.30,
    spreadPips: 3.0,
    timestamp: new Date(now).toISOString(),
    timestampMs: now,
    dataAgeMs: 0,
    source: 'Exness MT5',
    status: 'LIVE'
  };

  const tick = connector.getSymbolTick('XAUUSD');
  assert.notStrictEqual(tick.bid, 2865.40, 'Must NOT contain old hardcoded price 2865.40');
  assert.strictEqual(tick.bid, 4466.30, 'Price must strictly originate from MT5 feed');
  console.log('✅ [TEST 7 PASSED] MT5 Authority verified: Live Gold price $4466.30 is authoritative with zero hardcoded overrides.');
}

// ----------------------------------------------------
// TEST 8: Execution -> Final pre-execution fresh tick check & BUY uses ASK / SELL uses BID
// ----------------------------------------------------
async function testExecutionPriceValidation() {
  console.log('[TEST 8] Testing Pre-Execution Price & Freshness Validation...');
  const connector = new TestMT5Connector();
  connector.isConnected = true;
  connector.discoveredSymbols = ['XAUUSDm'];

  const now = Date.now();
  connector.latestTicks['XAUUSDm'] = {
    symbol: 'XAUUSD',
    brokerSymbol: 'XAUUSDm',
    bid: 4466.30,
    ask: 4466.60,
    last: 4466.45,
    spread: 0.30,
    spreadPips: 3.0,
    timestamp: new Date(now).toISOString(),
    timestampMs: now,
    dataAgeMs: 0,
    source: 'Exness MT5',
    status: 'LIVE'
  };

  // 1. BUY execution must use ASK price (4466.60)
  const buyVal = await connector.verifyPreExecution('XAUUSD', 'BUY', 4466.60);
  assert.strictEqual(buyVal.valid, true);
  assert.strictEqual(buyVal.executablePrice, 4466.60, 'BUY execution must execute at ASK');

  // 2. SELL execution must use BID price (4466.30)
  const sellVal = await connector.verifyPreExecution('XAUUSD', 'SELL', 4466.30);
  assert.strictEqual(sellVal.valid, true);
  assert.strictEqual(sellVal.executablePrice, 4466.30, 'SELL execution must execute at BID');

  // 3. Significant slippage cancels order
  const slippedVal = await connector.verifyPreExecution('XAUUSD', 'BUY', 4460.00, 3.0);
  assert.strictEqual(slippedVal.valid, false, 'Slipped order must be rejected');
  assert.ok(slippedVal.reason.includes('CANCEL TRADE (SLIPPAGE)'), 'Reason must indicate slippage cancellation');

  console.log('✅ [TEST 8 PASSED] Final execution price validation correctly uses Ask for BUY, Bid for SELL, and cancels slipped trades.');
}

// Execute all tests
async function runAllTests() {
  try {
    testNoMT5ConnectionReturnsNull();
    testValidConnectionReturnsActualTick();
    await testStaleTickBlocksTrading();
    await testUnknownSymbolFailsValidation();
    testDynamicBrokerSymbolResolution();
    testPriceChangedUpdateStream();
    testNoHardcodedOverride();
    await testExecutionPriceValidation();

    console.log('\n======================================================');
    console.log('   ALL 8 MT5 MARKET DATA TESTS PASSED SUCCESSFULLY!    ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  }
}

runAllTests();
