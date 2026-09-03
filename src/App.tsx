import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { BottomNav, TabType } from './components/BottomNav.js';
import { WalletView } from './components/WalletView.js';
import { MarketsView } from './components/MarketsView.js';
import { AgentsView } from './components/AgentsView.js';
import { RiskCenterView } from './components/RiskCenterView.js';
import { HistoryView } from './components/HistoryView.js';
import { BrokerModal } from './components/BrokerModal.js';
import { KillSwitchModal } from './components/KillSwitchModal.js';
import {
  BrokerAccount,
  SymbolPrice,
  Candle,
  ActivePosition,
  TradeProposal,
  HistoricalTrade,
  AgentEvent,
  RiskSettings,
  Timeframe,
} from './types/index.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('wallet');
  const [account, setAccount] = useState<BrokerAccount>({
    accountNumber: '',
    server: '',
    broker: 'Exness MT5',
    balance: null,
    equity: null,
    freeMargin: null,
    margin: null,
    marginLevel: null,
    currency: 'USD',
    leverage: 500,
    connected: false,
    isLive: false,
    lastPingMs: 0,
    tradingPermissions: {
      algoTrading: false,
      investorMode: false,
      tradeAllowed: false,
    },
    pendingOrdersCount: 0,
    accountStatus: 'DISCONNECTED',
    connectionHealth: 'DISCONNECTED',
    lastSyncTime: 0,
  });

  const [todayPnl, setTodayPnl] = useState(0.00);
  const [symbols, setSymbols] = useState<SymbolPrice[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [openPositions, setOpenPositions] = useState<ActivePosition[]>([]);
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [history, setHistory] = useState<HistoricalTrade[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    maxRiskPerTradePct: 1.5,
    maxDailyLossPct: 4.0,
    maxSimultaneousTrades: 3,
    maxSpreadPips: 2.5,
    maxSlippagePips: 1.5,
    maxDrawdownPct: 10.0,
    killSwitchActive: false,
    killSwitchAction: 'STOP_NEW_ONLY',
    dailyObjectivePct: 35.0,
    trailingStopEnabled: true,
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Resilient JSON fetch helper to prevent Safari/WebKit DOMException: "The string did not match the expected pattern"
  const safeFetchJson = async <T,>(url: string, fallback: T): Promise<T> => {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return fallback;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return fallback;
      const text = await res.text();
      if (!text || !text.trim()) return fallback;
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  };

  // Poll state from fullstack server
  const fetchState = useCallback(async () => {
    try {
      const [acctRes, symsRes, posRes, propsRes, eventsRes, riskRes] = await Promise.all([
        safeFetchJson<{ account?: BrokerAccount; todayPnl?: number }>('/api/account', {}),
        safeFetchJson<SymbolPrice[]>('/api/symbols', []),
        safeFetchJson<ActivePosition[]>('/api/positions', []),
        safeFetchJson<TradeProposal[]>('/api/proposals', []),
        safeFetchJson<AgentEvent[]>('/api/agents/events', []),
        safeFetchJson<RiskSettings | null>('/api/settings/risk', null),
      ]);

      if (acctRes?.account) {
        setAccount(acctRes.account);
        if (typeof acctRes.todayPnl === 'number') {
          setTodayPnl(acctRes.todayPnl);
        }
      }
      if (Array.isArray(symsRes) && symsRes.length > 0) setSymbols(symsRes);
      if (Array.isArray(posRes)) setOpenPositions(posRes);
      if (Array.isArray(propsRes)) setProposals(propsRes);
      if (Array.isArray(eventsRes) && eventsRes.length > 0) setAgentEvents(eventsRes);
      if (riskRes) setRiskSettings(riskRes);
    } catch (e) {
      // Non-fatal polling recovery
      console.warn('State poll recovered from network delay:', e);
    }
  }, []);

  // Fetch Candlestick History
  const fetchCandles = useCallback(async (sym: string, tf: Timeframe) => {
    try {
      const data = await safeFetchJson<Candle[]>(`/api/candles?symbol=${sym}&timeframe=${tf}`, []);
      if (Array.isArray(data) && data.length > 0) setCandles(data);
    } catch (e) {
      console.warn('Candles fetch recovered:', e);
    }
  }, []);

  // Fetch Closed History
  const fetchHistory = useCallback(async () => {
    try {
      const data = await safeFetchJson<HistoricalTrade[]>('/api/history', []);
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.warn('History fetch recovered:', e);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchCandles(selectedSymbol, timeframe);
    fetchHistory();

    const interval = setInterval(() => {
      fetchState();
    }, 2800);

    return () => clearInterval(interval);
  }, [fetchState, fetchCandles, fetchHistory, selectedSymbol, timeframe]);

  // Actions
  const handleApproveProposal = async (proposalId: string) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/proposals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action: 'APPROVE' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
      } else {
        showToast(`⚠️ ${data.message}`, 'warning');
      }
      fetchState();
      fetchHistory();
    } catch (e) {
      showToast('Execution error', 'warning');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    setIsProcessingAction(true);
    try {
      await fetch('/api/proposals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action: 'REJECT' }),
      });
      showToast('Trade proposal rejected.', 'info');
      fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleClosePosition = async (ticket: number) => {
    try {
      const res = await fetch('/api/positions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Closed Position #${ticket}`, 'info');
        fetchState();
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/agents/scan', { method: 'POST' });
      const data = await res.json();
      showToast('Quantum Scout & Setup Hunter scanned markets.', 'info');
      fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  const handleUpdateRiskSettings = async (newSettings: Partial<RiskSettings>) => {
    try {
      const res = await fetch('/api/settings/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setRiskSettings(data.settings);
        showToast('Aegis risk parameters saved.', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerKillSwitch = async (action: 'STOP_NEW_ONLY' | 'CLOSE_ALL_POSITIONS') => {
    try {
      const res = await fetch('/api/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRIGGER', subAction: action }),
      });
      const data = await res.json();
      showToast(`🚨 AEGIS KILL SWITCH ACTIVATED (${action})`, 'warning');
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetKillSwitch = async () => {
    try {
      await fetch('/api/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' }),
      });
      showToast('Aegis Kill Switch deactivated. Trading resumed.', 'success');
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectBroker = async (accountNumber: string, server: string, isLive: boolean, password?: string) => {
    try {
      const res = await fetch('/api/broker/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, server, isLive, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Exness MT5 authentication failed.');
      }

      await fetch('/api/account/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive }),
      });

      showToast(`Connected to Exness MT5 (${server} · ${isLive ? 'LIVE' : 'PAPER'})`, 'success');
      fetchState();
    } catch (e: any) {
      showToast(e?.message || 'Connection error', 'warning');
      throw e;
    }
  };

  const handleToggleAutoTrading = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/settings/autotrading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setRiskSettings((prev) => ({ ...prev, autoTradingEnabled: enabled }));
        showToast(
          enabled
            ? '🟢 Auto-Trading ACTIVATED: Head of Desk executing autonomously'
            : '⚪ Auto-Trading PAUSED: Manual operator review required',
          enabled ? 'success' : 'info'
        );
      }
    } catch (e) {
      console.error('Failed to toggle auto trading:', e);
    }
  };

  const handleTriggerDailyBriefing = async () => {
    try {
      const res = await fetch('/api/briefing/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('📊 04:00 Daily Market Briefing dispatched to Telegram', 'success');
      }
    } catch (e) {
      console.error('Failed to dispatch briefing:', e);
    }
  };

  const handleToggleMode = async (isLive: boolean) => {
    try {
      await fetch('/api/account/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive }),
      });
      showToast(`Switched to ${isLive ? 'EXNESS LIVE' : 'PAPER SIMULATION'}`, 'info');
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports/export', '_blank');
  };

  const pendingProposals = proposals.filter((p) => p.status === 'PENDING');

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white font-sans selection:bg-[#FF7A00] selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4">
          <div
            className={`py-3 px-4 rounded-xl shadow-2xl text-xs font-mono border backdrop-blur-md text-center transition-all ${
              notification.type === 'success'
                ? 'bg-[#151515] border-green-500/40 text-green-400'
                : notification.type === 'warning'
                ? 'bg-[#151515] border-red-500/40 text-red-400'
                : 'bg-[#151515] border-[#FF7A00]/40 text-[#FF7A00]'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Sticky App Header */}
      <Header
        account={account}
        riskSettings={riskSettings}
        pendingProposalsCount={pendingProposals.length}
        onOpenBrokerModal={() => setBrokerModalOpen(true)}
        onOpenKillSwitchModal={() => setKillSwitchModalOpen(true)}
        onTriggerScan={handleTriggerScan}
        onToggleAutoTrading={handleToggleAutoTrading}
        isScanning={isScanning}
      />

      {/* Main View Container (Mobile-first Android Width) */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {activeTab === 'wallet' && (
          <WalletView
            account={account}
            todayPnl={todayPnl}
            openPositions={openPositions}
            pendingProposals={pendingProposals}
            riskSettings={riskSettings}
            onApproveProposal={handleApproveProposal}
            onRejectProposal={handleRejectProposal}
            onClosePosition={handleClosePosition}
            onTriggerScan={handleTriggerScan}
            onToggleAutoTrading={handleToggleAutoTrading}
            onTriggerBriefing={handleTriggerDailyBriefing}
            isScanning={isScanning}
            isProcessingAction={isProcessingAction}
            onNavigateTab={setActiveTab}
            onOpenBrokerModal={() => setBrokerModalOpen(true)}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsView
            symbols={symbols}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => {
              setSelectedSymbol(sym);
              fetchCandles(sym, timeframe);
            }}
            candles={candles}
            timeframe={timeframe}
            onSelectTimeframe={(tf) => {
              setTimeframe(tf);
              fetchCandles(selectedSymbol, tf);
            }}
            onScanSymbol={() => handleTriggerScan()}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'agents' && (
          <AgentsView
            agentEvents={agentEvents}
            onTriggerScan={handleTriggerScan}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'risk' && (
          <RiskCenterView
            account={account}
            riskSettings={riskSettings}
            onUpdateRiskSettings={handleUpdateRiskSettings}
            onOpenKillSwitchModal={() => setKillSwitchModalOpen(true)}
            onTriggerBriefing={handleTriggerDailyBriefing}
            onToggleAutoTrading={handleToggleAutoTrading}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView trades={history} onExportCsv={handleExportCsv} />
        )}
      </main>

      {/* Android Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingProposalsCount={pendingProposals.length}
      />

      {/* Broker Account Connect Modal */}
      <BrokerModal
        isOpen={brokerModalOpen}
        onClose={() => setBrokerModalOpen(false)}
        account={account}
        onConnect={handleConnectBroker}
        onToggleMode={handleToggleMode}
      />

      {/* Aegis Emergency Kill Switch Modal */}
      <KillSwitchModal
        isOpen={killSwitchModalOpen}
        onClose={() => setKillSwitchModalOpen(false)}
        riskSettings={riskSettings}
        onTriggerKillSwitch={handleTriggerKillSwitch}
        onResetKillSwitch={handleResetKillSwitch}
      />
    </div>
  );
}
