import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { HuzleOhTradingEngine } from './src/server/tradingEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const engine = new HuzleOhTradingEngine();

async function startServer() {
  const app = express();
  app.use(express.json());

  // === REST API ROUTES FIRST ===

  // System Health
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

  // Toggle Live vs Paper Mode
  app.post('/api/account/switch-mode', (req, res) => {
    const { isLive } = req.body;
    engine.account.isLive = Boolean(isLive);
    engine.addAgentEvent('HEAD_OF_DESK', 'WARNING', `Trading mode switched to: ${engine.account.isLive ? 'EXNESS LIVE' : 'PAPER SIMULATION'}`);
    res.json({ success: true, isLive: engine.account.isLive });
  });

  // Real Exness MT5 Connect Endpoint
  app.post('/api/broker/connect', async (req, res) => {
    const { accountNumber, server, password, isLive } = req.body;
    const result = await engine.exnessConnector.connectAccount({
      accountNumber,
      server,
      password,
      isLive: Boolean(isLive),
    });

    if (result.success && result.account) {
      engine.account = { ...engine.account, ...result.account };
      engine.addAgentEvent('HEAD_OF_DESK', 'EXECUTE', `Connected to Exness MT5 (${engine.account.server} · ${engine.account.accountNumber})`);
      res.json({
        success: true,
        message: result.message,
        account: engine.account,
        availableSymbols: result.availableSymbols,
      });
    } else {
      engine.account.connected = false;
      engine.account.accountStatus = 'INVALID_CREDENTIALS';
      engine.addAgentEvent('AEGIS_GUARDIAN', 'WARNING', `Exness MT5 connection failed: ${result.message}`);
      res.status(400).json({
        success: false,
        message: result.message,
        errorCode: result.errorCode,
      });
    }
  });

  // 04:00 Daily Market Briefing Manual/Immediate Trigger
  app.post('/api/briefing/trigger', async (req, res) => {
    const brief = await engine.generateAndSendDailyBriefing();
    res.json({ success: true, brief });
  });

  // Symbols & Real-time Ticks
  app.get('/api/symbols', (req, res) => {
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
