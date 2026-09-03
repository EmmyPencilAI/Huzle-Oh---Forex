export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export type TradeDirection = 'BUY' | 'SELL';

export type AgentRole =
  | 'QUANTUM_SCOUT'
  | 'SETUP_HUNTER'
  | 'MARKET_SENTINEL'
  | 'AEGIS_GUARDIAN'
  | 'HEAD_OF_DESK';

export type AgentStatusType = 'ONLINE' | 'SCANNING' | 'EVALUATING' | 'RESTRICTED' | 'OFFLINE';

export interface BrokerAccount {
  accountNumber: string;
  server: string;
  broker: string;
  balance: number | null;
  equity: number | null;
  freeMargin: number | null;
  margin: number | null;
  marginLevel: number | null;
  currency: string;
  leverage: number;
  connected: boolean;
  isLive: boolean; // Always true for active Exness MT5 execution (all mock/paper simulation removed)
  lastPingMs: number;
  tradingPermissions: {
    algoTrading: boolean;
    investorMode: boolean;
    tradeAllowed: boolean;
  };
  pendingOrdersCount: number;
  accountStatus: 'CONNECTED' | 'DISCONNECTED' | 'INVALID_CREDENTIALS' | 'CONNECTING' | 'READ_ONLY' | 'ERROR';
  connectionHealth: 'HEALTHY' | 'DISCONNECTED' | 'ERROR' | 'RECONNECTING';
  lastSyncTime?: number;
  errorMessage?: string;
}

export interface BrokerSymbolSpec {
  symbol: string;
  brokerSymbol: string;
  description: string;
  digits: number;
  point: number;
  tradeTickSize: number;
  tradeTickValue: number;
  volumeMin: number;
  volumeMax: number;
  volumeStep: number;
  tradeContractSize: number;
  tradeStopsLevel: number;
  tradeFreezeLevel: number;
  tradable: boolean;
}

export interface MT5Tick {
  symbol: string;
  brokerSymbol: string;
  bid: number;
  ask: number;
  last: number;
  spread: number;
  spreadPips: number;
  volume: number;
  timestamp: string;
  timestampMs: number;
  dataAgeMs: number;
  source: string;
  status: 'LIVE' | 'STALE' | 'OFFLINE';
}

export interface SymbolPrice {
  symbol: string;
  brokerSymbol?: string;
  bid: number | null;
  ask: number | null;
  last?: number | null;
  spreadPips: number | null;
  spread?: number | null;
  change24h: number;
  high24h?: number | null;
  low24h?: number | null;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH';
  session: 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'LONDON_NY_OVERLAP';
  aiConfidence: number;
  lastUpdated: number;
  dataAgeMs?: number;
  source?: string;
  status?: 'LIVE' | 'STALE' | 'OFFLINE';
  digits?: number;
  point?: number;
  contractSize?: number;
  minLot?: number;
  maxLot?: number;
  lotStep?: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuantumScoutObservation {
  symbol: string;
  timeframe: Timeframe;
  price: number;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  structure: 'BREAKOUT' | 'TREND_CONTINUATION' | 'REVERSAL' | 'MOMENTUM_ACCEL' | 'VOLATILITY_EXPANSION' | 'CONSOLIDATION';
  indicators: {
    ema9: number;
    ema21: number;
    ema50: number;
    rsi: number;
    macd: { value: number; signal: number; hist: number };
    atr: number;
    vwap: number;
    adx: number;
    bollingerBands: { upper: number; middle: number; lower: number };
    support: number;
    resistance: number;
  };
  volatilityScore: number;
  timestamp: number;
}

export interface SetupHunterEvaluation {
  symbol: string;
  hasSetup: boolean;
  direction?: TradeDirection;
  strategy?: 'MOMENTUM_SCALPING' | 'BREAKOUT_SCALP' | 'TREND_CONTINUATION' | 'REVERSAL_CONFIRMATION';
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: number;
  suggestedLot?: number;
  confidence?: number;
  timeframe?: Timeframe;
  expectedDurationMin?: number;
  invalidationCondition?: string;
  reason?: string;
  timestamp: number;
}

export interface MarketSentinelCondition {
  usdStrengthIndex: number; // 0 - 100
  marketRegime: 'TRENDING' | 'RANGING' | 'CHOPPY' | 'HIGH_VOLATILITY';
  session: 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'LONDON_NY_OVERLAP';
  liquidityScore: number; // 0 - 100
  correlationMatrix: { [pair: string]: number };
  newsRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  activeEvents: string[];
  safeToTrade: boolean;
  statusNote: string;
  timestamp: number;
}

export interface AegisRiskAudit {
  approved: boolean;
  symbol: string;
  direction: TradeDirection;
  maxRiskAmount: number;
  allowedLot: number;
  expectedLoss: number;
  expectedNetProfit: number;
  riskReward: number;
  currentDailyDrawdownPct: number;
  rejectionReason?: string;
  adaptiveRiskMultiplier: number;
  timestamp: number;
}

export interface HeadOfDeskDecision {
  status: 'TRADE_CANDIDATE' | 'WAIT' | 'REJECT';
  symbol: string;
  consensusScore: number; // e.g. 5/5 or 4/5
  aiModelConfidence: number;
  llmReasoning: string;
  summaryReason: string;
  timestamp: number;
}

export interface TradeProposal {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskPercentage: number;
  riskAmount: number;
  expectedProfit: number;
  riskReward: number;
  strategy: string;
  timeframe: Timeframe;
  expectedDurationMinutes: number;
  aiConfidence: number;
  agentConsensus: string; // "5/5"
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'INVALIDATED';
  expiresAt: number; // countdown timestamp (30s)
  createdAt: number;
  scoutSummary: string;
  hunterSummary: string;
  sentinelSummary: string;
  guardianSummary: string;
  headOfDeskSummary: string;
}

export interface ActivePosition {
  id: string;
  ticket: number;
  symbol: string;
  direction: TradeDirection;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPips: number;
  openTime: number;
  durationMinutes: number;
  strategy: string;
  aiConfidence: number;
  isPaper: boolean;
  trailingStopActive: boolean;
  trailingDistancePips?: number;
}

export interface HistoricalTrade {
  id: string;
  ticket: number;
  symbol: string;
  direction: TradeDirection;
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  durationMinutes: number;
  openTime: number;
  closeTime: number;
  strategy: string;
  aiConfidence: number;
  result: 'PROFIT' | 'LOSS' | 'BREAKEVEN';
  audit: {
    scoutSignal: string;
    hunterStrategy: string;
    guardianRisk: string;
    headOfDeskVerdict: string;
    aiConfidenceScore: number;
  };
}

export interface RiskSettings {
  maxRiskPerTradePct: number; // e.g. 1.5%
  maxDailyLossPct: number; // e.g. 4.0%
  maxSimultaneousTrades: number; // e.g. 3
  maxSpreadPips: number; // e.g. 2.5 pips
  maxSlippagePips: number; // e.g. 1.5 pips
  maxDrawdownPct: number; // e.g. 10%
  killSwitchActive: boolean;
  killSwitchAction: 'STOP_NEW_ONLY' | 'CLOSE_ALL_POSITIONS';
  dailyObjectivePct: number; // 30-50% target setting
  trailingStopEnabled: boolean;

  // Autonomous Trading & Profit Targets
  autoTradingEnabled: boolean;
  normalProfitTargetMin: number; // $3.00
  normalProfitTargetMax: number; // $5.00
  extendedProfitTargetMin: number; // $5.00
  extendedProfitTargetMax: number; // $8.00

  // Dynamic Profit Management
  breakevenThresholdUsd: number; // e.g. $2.50
  breakevenThresholdPips: number; // e.g. 4.0 pips
  partialClosePct: number; // e.g. 50%
  trailingStopDistancePips: number; // e.g. 6.0 pips
  allowMomentumExtension: boolean; // allow trade to push for extended target if momentum is strong
  invalidationExitEnabled: boolean; // close immediately if setup invalidates

  // 04:00 Daily Briefing
  briefingTime: string; // "04:00"
  briefingTimezone: string; // "Africa/Lagos (GMT+1)"
}

export interface AgentSystemStatus {
  scout: 'ACTIVE' | 'SCANNING' | 'PAUSED';
  hunter: 'ACTIVE' | 'EVALUATING' | 'PAUSED';
  sentinel: 'ACTIVE' | 'MONITORING' | 'ALERT';
  guardian: 'ACTIVE' | 'ARMED' | 'HALTED';
  headOfDesk: 'AUTONOMOUS' | 'MANUAL' | 'HALTED';
  autoTrading: boolean;
  mt5Status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  lastHealthPing: number;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  sendProposals: boolean;
  sendTradeUpdates: boolean;
  morningReportTime: string; // "04:00"
  timezone: string;
  lastReportSentAt?: number;
}

export interface LLMConfig {
  provider: 'gemini' | 'grok' | 'local' | 'openai';
  model: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
}

export interface AgentEvent {
  id: string;
  agent: AgentRole;
  type: 'SCAN' | 'SETUP' | 'RISK_PASS' | 'RISK_FAIL' | 'CONSENSUS' | 'WARNING' | 'EXECUTE';
  symbol?: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface BacktestParams {
  symbol: string;
  timeframe: Timeframe;
  days: number;
  initialBalance: number;
  riskPerTradePct: number;
  strategy: string;
  spreadPips: number;
  slippagePips: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdownPct: number;
  averageProfit: number;
  averageLoss: number;
  equityCurve: { time: string; balance: number; equity: number }[];
  summary: string;
}
