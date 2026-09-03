import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { HuzleOhTradingEngine } from './src/server/tradingEngine.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const engine = new HuzleOhTradingEngine();

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS headers to prevent cross-origin fetch failures in iframes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // === REST API ROUTES FIRST ===

  // 1. Lightweight Health Ping (Render Cron Keep-Alive / Uptime Monitor)
  // Requires no authentication, performs no trading, exposes no secrets or account info
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'huzle-oh-agentic-trader',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // 2. Comprehensive System Health Telemetry
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'HUZLE OH — AGENTIC TRADER',
      mt5Connected: engine.account.connected,
      isLive: engine.account.isLive,
      killSwitchActive: engine.riskSettings.killSwitchActive,
      agents: {
        scout: 'ONLINE',
        hunter: 'ONLINE',
        sentinel: 'ONLINE',
        guardian: 'ONLINE',
        headOfDesk: 'ONLINE',
      },
      lastPingMs: engine.account.lastPingMs,
      timestamp: Date.now(),
    });
  });

  // Account State
  app.get('/api/account', (req, res) => {
    res.json({
      account: engine.account,
      todayPnl: engine.todayPnl,
      openPositionsCount: engine.openPositions.length,
      pendingProposalsCount: engine.activeProposals.filter((p) => p.status === 'PENDING').length,
      autoTradingEnabled: engine.riskSettings.autoTradingEnabled,
    });
  });

  // Toggle Auto Trading ON / OFF
  app.post('/api/settings/autotrading', (req, res) => {
    const { enabled } = req.body;
    engine.riskSettings.autoTradingEnabled = Boolean(enabled);
    engine.addAgentEvent(
      'HEAD_OF_DESK',
      'CONSENSUS',
      `Auto Trading toggled to: ${engine.riskSettings.autoTradingEnabled ? '🟢 ON (Autonomous Execution Active)' : '⚪ OFF (Manual Review Mode)'}`
    );
    res.json({ success: true, autoTradingEnabled: engine.riskSettings.autoTradingEnabled });
  });

  // Agent Swarm & System Status
  app.get('/api/agents/status', (req, res) => {
    res.json(engine.getAgentSystemStatus());
  });

  // Update Live Account Balance directly from Exness MT5
  app.post('/api/account/update-balance', (req, res) => {
    const { balance } = req.body;
    if (balance === undefined || isNaN(Number(balance))) {
      return res.status(400).json({ success: false, message: 'Valid numeric balance is required.' });
    }
    try {
      const updated = engine.updateAccountBalance(Number(balance));
      res.json({ success: true, account: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Real Exness MT5 Connect Endpoint (Strict validation & dynamic balance sync)
  app.post('/api/broker/connect', async (req, res) => {
    const { accountNumber, server, password, balance, currency, leverage } = req.body;
    const result = await engine.connectExnessAccount({
      accountNumber,
      server,
      password,
      isLive: true,
      balance: balance !== undefined && !isNaN(Number(balance)) ? Number(balance) : undefined,
      currency,
      leverage: leverage ? Number(leverage) : undefined,
    });

    if (result.success && result.account) {
      res.json({
        success: true,
        message: result.message,
        account: engine.account,
        availableSymbols: result.availableSymbols,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        errorCode: result.errorCode,
        account: engine.account,
      });
    }
  });

  // Broker Disconnect Endpoint
  app.post('/api/broker/disconnect', (req, res) => {
    engine.disconnectExnessAccount();
    res.json({ success: true, message: 'Disconnected from Exness MT5. Live feeds offline.' });
  });

  // Real-time Server-Sent Events (SSE) Price Stream
  app.get('/api/stream/prices', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const sendUpdate = () => {
      try {
        engine.syncFromMT5();
        const payload = JSON.stringify({
          symbols: Object.values(engine.symbols),
          connected: engine.account.connected,
          accountStatus: engine.account.accountStatus,
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${payload}\n\n`);
      } catch (e) {
        clearInterval(interval);
      }
    };

    sendUpdate();
    const interval = setInterval(sendUpdate, 1500);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // Structured Market Diagnostics Endpoint
  app.get('/api/market/diagnostics', (req, res) => {
    res.json(engine.exnessConnector.getMarketDiagnostics());
  });

  // Single Symbol Lookup & Spec
  app.get('/api/symbol/:symbol', (req, res) => {
    engine.syncFromMT5();
    const symParam = req.params.symbol.toUpperCase();
    const symData = engine.symbols[symParam];
    const tick = engine.exnessConnector.getSymbolTick(symParam);
    const brokerSym = engine.exnessConnector.resolveBrokerSymbol(symParam);
    const spec = engine.exnessConnector.symbolSpecs[brokerSym];
    res.json({
      symbol: symParam,
      brokerSymbol: brokerSym,
      price: symData || null,
      tick: tick || null,
      spec: spec || null,
      connected: engine.account.connected,
    });
  });

  // 04:00 Daily Market Briefing Manual/Immediate Trigger
  app.post('/api/briefing/trigger', async (req, res) => {
    const brief = await engine.generateAndSendDailyBriefing();
    res.json({ success: true, brief });
  });

  // Symbols & Real-time Ticks
  app.get('/api/symbols', (req, res) => {
    engine.syncFromMT5();
    res.json(Object.values(engine.symbols));
  });

  // Candlestick Data
  app.get('/api/candles', (req, res) => {
    const symbol = (req.query.symbol as string) || 'EURUSD';
    const timeframe = (req.query.timeframe as string) || 'M5';
    const history = engine.candleHistory[symbol]?.[timeframe as any] || [];
    res.json(history);
  });

  // Active Trade Proposals
  app.get('/api/proposals', (req, res) => {
    res.json(engine.activeProposals);
  });

  // User Action on Proposal: APPROVE (triggers final execution check) or REJECT
  app.post('/api/proposals/action', async (req, res) => {
    const { proposalId, action, reason } = req.body;
    if (action === 'APPROVE') {
      const result = await engine.approveProposal(proposalId);
      res.json(result);
    } else {
      const result = engine.rejectProposal(proposalId, reason);
      res.json({ success: result, message: 'Proposal rejected by operator.' });
    }
  });

  // Open Positions
  app.get('/api/positions', (req, res) => {
    res.json(engine.openPositions);
  });

  // Close Position Manually
  app.post('/api/positions/close', (req, res) => {
    const { ticket } = req.body;
    const success = engine.closePosition(Number(ticket));
    res.json({ success, ticket });
  });

  // Closed Trades History
  app.get('/api/history', (req, res) => {
    res.json(engine.tradeHistory);
  });

  // Agent Event Bus Stream
  app.get('/api/agents/events', (req, res) => {
    res.json(engine.agentEvents);
  });

  // Trigger Immediate Market Scan
  app.post('/api/agents/scan', (req, res) => {
    engine.runAutomatedScan();
    res.json({
      success: true,
      message: 'Multi-agent scanning cycle triggered.',
      activeProposalsCount: engine.activeProposals.filter((p) => p.status === 'PENDING').length,
    });
  });

  // Aegis Kill Switch
  app.post('/api/kill-switch', (req, res) => {
    const { action, subAction } = req.body;
    if (action === 'TRIGGER') {
      const result = engine.triggerAegisKillSwitch(subAction || 'STOP_NEW_ONLY');
      res.json(result);
    } else {
      const result = engine.resetAegisKillSwitch();
      res.json(result);
    }
  });

  // Risk Parameters
  app.get('/api/settings/risk', (req, res) => {
    res.json(engine.riskSettings);
  });

  app.post('/api/settings/risk', (req, res) => {
    const updates = req.body;
    Object.assign(engine.riskSettings, updates);
    engine.addAgentEvent('AEGIS_GUARDIAN', 'RISK_PASS', 'Risk & profit target parameters updated by operator.');
    res.json({ success: true, settings: engine.riskSettings });
  });

  // Telegram Config
  app.get('/api/settings/telegram', (req, res) => {
    res.json(engine.telegramConfig);
  });

  app.post('/api/settings/telegram', (req, res) => {
    const updates = req.body;
    Object.assign(engine.telegramConfig, updates);
    if (updates.botToken || updates.chatId) {
      import('./src/server/telegram.js').then(({ telegramService }) => {
        telegramService.updateCredentials(updates.botToken, updates.chatId);
      });
    }
    res.json({ success: true, config: engine.telegramConfig });
  });

  // Strategy Backtest
  app.post('/api/backtest', (req, res) => {
    const params = req.body;
    const result = engine.runBacktest(params);
    res.json(result);
  });

  // AI LLM Debrief via Gemini
  app.post('/api/ai/debrief', async (req, res) => {
    const { symbol } = req.body;
    const analysis = await engine.getLLMMarketDebrief(symbol || 'EURUSD');
    res.json({ analysis, symbol });
  });

  // CSV Export of Trade Audits
  app.get('/api/reports/export', (req, res) => {
    let csv = 'Ticket,Symbol,Direction,LotSize,EntryPrice,ExitPrice,NetPnL,Strategy,Result,OpenTime,CloseTime\n';
    engine.tradeHistory.forEach((t) => {
      csv += `${t.ticket},${t.symbol},${t.direction},${t.lotSize},${t.entryPrice},${t.exitPrice},${t.netPnl},"${t.strategy}",${t.result},${new Date(t.openTime).toISOString()},${new Date(t.closeTime).toISOString()}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Huzle_Oh_Trade_Audits.csv');
    res.send(csv);
  });

  // 404 handler for unmatched /api routes — guarantees JSON response, never HTML fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler for /api routes
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('[API Error]:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err?.message || 'Unexpected server error',
    });
  });

  // === VITE MIDDLEWARE SETUP ===
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HUZLE OH] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export { HuzleOhTradingEngine, ExnessMT5Connector } from './src/server/tradingEngine.js';
