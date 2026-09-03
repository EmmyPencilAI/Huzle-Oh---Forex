import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Sliders,
  XCircle,
  Lock,
  Send,
  Check,
  AlertTriangle,
  Link,
  ShieldAlert,
} from 'lucide-react';
import { BrokerAccount, ActivePosition, TradeProposal, RiskSettings } from '../types/index.js';
import { ProposalCard } from './ProposalCard.js';

interface WalletViewProps {
  account: BrokerAccount;
  todayPnl: number;
  openPositions: ActivePosition[];
  pendingProposals: TradeProposal[];
  riskSettings: RiskSettings;
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
  onClosePosition: (ticket: number) => void;
  onTriggerScan: () => void;
  onToggleAutoTrading?: (enabled: boolean) => void;
  onTriggerBriefing?: () => void;
  isScanning: boolean;
  isProcessingAction: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenBrokerModal?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  account,
  todayPnl,
  openPositions,
  pendingProposals,
  riskSettings,
  onApproveProposal,
  onRejectProposal,
  onClosePosition,
  onTriggerScan,
  onToggleAutoTrading,
  onTriggerBriefing,
  isScanning,
  isProcessingAction,
  onNavigateTab,
  onOpenBrokerModal,
}) => {
  const isPositiveToday = todayPnl >= 0;
  const isConnected = account.connected && account.connectionHealth === 'HEALTHY' && account.balance !== null;
  const isError = account.accountStatus === 'ERROR' || account.connectionHealth === 'ERROR';
  const hasBalance = account.balance !== null;
  const currentBalance = account.balance ?? 0;
  const todayPnlPct = hasBalance && currentBalance > 0 ? (todayPnl / currentBalance) * 100 : 0;
  const targetProgress = hasBalance ? Math.min(100, Math.max(0, (todayPnlPct / riskSettings.dailyObjectivePct) * 100)) : 0;
  const isAuto = riskSettings.autoTradingEnabled ?? true;
  const [briefingSent, setBriefingSent] = useState(false);

  const [intBalance, decBalance] = hasBalance
    ? account.balance!
        .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .split('.')
    : ['--', '--'];

  const handleSendBriefing = () => {
    onTriggerBriefing?.();
    setBriefingSent(true);
    setTimeout(() => setBriefingSent(false), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 text-xs">
      {/* 1. Auto-Trading Mode & Swarm Agents Status Bar */}
      <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#1E1E1E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0B0B0B] border border-[#222] flex items-center justify-center text-[#FF7A00]">
            <Zap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Autonomous Head of Desk
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isAuto ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isAuto ? 'AUTONOMOUS' : 'MANUAL REVIEW'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              {isAuto
                ? 'Trades execute on MT5 immediately upon 5/5 agent consensus.'
                : 'Proposals paused for operator confirmation.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleAutoTrading?.(!isAuto)}
          className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            isAuto
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-[#222] text-gray-400 border-[#333] hover:text-white'
          }`}
        >
          {isAuto ? 'AUTO TRADING: ON' : 'AUTO TRADING: OFF'}
        </button>
      </div>

      {/* 2. Main Wallet Balance Card (Verification & Real Data Enforcement) */}
      {isError ? (
        <div className="bg-[#151515] p-5 sm:p-6 rounded-2xl border border-red-500/30 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-400" />
              🔴 MT5 CONNECTION FAILED
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold border bg-red-500/10 text-red-400 border-red-500/20">
              TERMINAL UNREACHABLE
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white mb-2">
            Unable to retrieve your Exness account.
          </div>
          <p className="text-xs text-gray-400 mb-2 font-mono">
            Balance unavailable. The system will never display estimated or unverified balances in Live Trading mode.
          </p>

          {account.errorMessage && (
            <div className="p-3 my-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 font-mono text-[11px] whitespace-pre-line leading-relaxed">
              {account.errorMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onOpenBrokerModal}
              className="px-4 py-2.5 rounded-xl bg-[#FF7A00] text-black hover:bg-[#FFA040] font-mono font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-[#FF7A00]/20 transition-all"
            >
              Re-enter Exness Credentials
            </button>
            <span className="text-[10px] text-gray-500 font-mono">
              Securely encrypted at rest • No passwords in logs
            </span>
          </div>
        </div>
      ) : !isConnected ? (
        <div className="bg-[#151515] p-5 sm:p-6 rounded-2xl border border-[#1E1E1E] relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
              Exness MetaTrader 5 Terminal
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold border bg-[#222] text-gray-400 border-[#333]">
              ⚪ DISCONNECTED
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white mb-2">
            Balance Unavailable
          </div>
          <p className="text-xs text-gray-400 mb-4 max-w-md font-mono leading-relaxed">
            Connect your Exness MT5 account to verify and stream real-time balance, equity, and margin directly from the trading terminal.
          </p>

          {/* Verification Pipeline Diagram */}
          <div className="p-3 mb-4 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-[9px] text-gray-500 font-mono uppercase mb-2">Strict Verification Protocol</div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-gray-300">
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] text-[#FF7A00]">Credentials</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A]">MT5 Terminal</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A]">Authentication</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A]">Retrieval</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">Live Balance</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenBrokerModal}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A00] text-black hover:bg-[#FFA040] font-mono font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-[#FF7A00]/20 transition-all flex items-center gap-2"
            >
              <Link size={14} />
              Connect Exness MT5
            </button>
            <span className="text-[10px] text-gray-500 font-mono">
              Exness MT5 Real Live Connection
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[#151515] p-5 sm:p-6 rounded-2xl border border-[#1A1A1A] relative overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* Ambient Orange Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF7A00] opacity-10 blur-[60px] pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest block">
                  Total Equity
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                  <Check size={11} /> Verified via Exness MT5
                  {account.lastSyncTime ? ` · ${new Date(account.lastSyncTime).toLocaleTimeString()}` : ''}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                  isPositiveToday
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
              >
                {isPositiveToday ? '+' : ''}
                {todayPnlPct.toFixed(2)}% TODAY (${todayPnl.toFixed(2)})
              </span>
            </div>

            {/* Big Monospace Balance Display */}
            <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white mb-2">
              ${intBalance}
              <span className="opacity-50 text-2xl sm:text-3xl">.{decBalance || '00'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-mono">
              <p>
                Server: <span className="text-white">{account.server}</span>
              </p>
              <span className="text-[#333]">·</span>
              <p>
                Leverage: <span className="text-white">1:{account.leverage}</span>
              </p>
              <span className="text-[#333]">·</span>
              <p>
                Free Margin:{' '}
                <span className="text-emerald-400">
                  ${account.freeMargin !== null ? account.freeMargin.toFixed(2) : '--'}
                </span>
              </p>
            </div>
          </div>

          {/* Dynamic Targets Status */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#1A1A1A]">
            <div className="p-2 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E]">
              <div className="text-[9px] text-gray-500 font-mono uppercase">NORMAL TARGET</div>
              <div className="text-xs font-mono font-bold text-emerald-400">$3.00 - $5.00</div>
            </div>
            <div className="p-2 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E]">
              <div className="text-[9px] text-gray-500 font-mono uppercase">EXTENDED TARGET</div>
              <div className="text-xs font-mono font-bold text-[#FF7A00]">$5.00 - $8.00</div>
            </div>
          </div>

          {/* Daily Objective Progress */}
          <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
            <div className="flex justify-between text-xs mb-2 font-mono">
              <span className="text-gray-500">
                Daily Target ({riskSettings.dailyObjectivePct}% · $
                {hasBalance ? (account.balance! * (riskSettings.dailyObjectivePct / 100)).toFixed(2) : '0.00'})
              </span>
              <span className="text-[#FF7A00] font-bold">{targetProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A00] to-[#FFA040] rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Swarm Agents Health Strip */}
      <div className="p-3 rounded-2xl bg-[#151515] border border-[#1A1A1A]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
            Multi-Agent Swarm Intelligence
          </span>
          <button
            onClick={handleSendBriefing}
            disabled={briefingSent}
            className="text-[10px] font-mono text-[#FF7A00] hover:text-[#FFA040] flex items-center gap-1 cursor-pointer"
          >
            {briefingSent ? <Check size={11} className="text-emerald-400" /> : <Send size={11} />}
            <span>{briefingSent ? 'BRIEFING SENT' : 'SEND 04:00 BRIEF'}</span>
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-mono">
          <div className="p-1.5 rounded-lg bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-gray-500">SCOUT</div>
            <div className="text-emerald-400 font-bold mt-0.5">🟢 ACTIVE</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-gray-500">HUNTER</div>
            <div className="text-emerald-400 font-bold mt-0.5">🟢 ACTIVE</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-gray-500">SENTINEL</div>
            <div className="text-emerald-400 font-bold mt-0.5">🟢 ACTIVE</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-gray-500">GUARDIAN</div>
            <div className="text-emerald-400 font-bold mt-0.5">🟢 ARMED</div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-gray-500">DESK</div>
            <div className="text-[#FF7A00] font-bold mt-0.5">
              {isAuto ? '🟢 AUTO' : '🟡 MANUAL'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Pending Proposals Section (Visible if Auto Trading is OFF or Proposal pending) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Active Trade Proposals
            </span>
            {pendingProposals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF7A00] text-black text-[10px] font-black animate-pulse">
                {pendingProposals.length} REQUIRING APPROVAL
              </span>
            )}
          </div>
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="text-[10px] uppercase tracking-widest text-[#FF7A00] hover:text-[#FFA040] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
            <span>SCAN SWARM</span>
          </button>
        </div>

        {pendingProposals.length > 0 ? (
          <div className="space-y-3">
            {pendingProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onApprove={onApproveProposal}
                onReject={onRejectProposal}
                isProcessing={isProcessingAction}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1A1A1A] bg-[#151515] p-5 text-center">
            <div className="w-9 h-9 rounded-full bg-[#0B0B0B] border border-[#222] text-[#FF7A00] flex items-center justify-center mx-auto mb-2">
              <ShieldCheck size={18} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-white">
              {isAuto ? 'Autonomous Swarm Scanning Active' : 'Multi-Agent Radar Scanning'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto font-mono">
              {isAuto
                ? 'Quantum Scout & Setup Hunter continuously identify 1:2+ R:R setups. Aegis Guardian validates risk and Head of Desk executes automatically.'
                : 'Decision hierarchy: GOOD MARKET -> VALID SETUP -> AGENT CONSENSUS -> OPERATOR APPROVAL -> EXECUTE.'}
            </p>
          </div>
        )}
      </div>

      {/* 5. Open Positions Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Open Positions ({openPositions.length})
          </span>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
            Breakeven & Trailing Active
          </span>
        </div>

        {openPositions.length > 0 ? (
          <div className="space-y-3">
            {openPositions.map((pos) => {
              const isProfit = pos.pnl >= 0;
              const isBreakevenLocked = pos.direction === 'BUY'
                ? pos.stopLoss >= pos.entryPrice
                : pos.stopLoss <= pos.entryPrice;

              return (
                <div
                  key={pos.id}
                  className="rounded-2xl border border-[#1A1A1A] bg-[#151515] p-4 hover:border-[#333] transition-all shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base tracking-tight">{pos.symbol}</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                            pos.direction === 'BUY'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {pos.direction} {pos.lotSize}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">#{pos.ticket}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 font-mono">
                        <span>Entry: {pos.entryPrice}</span>
                        <span>·</span>
                        <span>Now: {pos.currentPrice}</span>
                      </div>
                    </div>

                    {/* Live P/L */}
                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono ${
                          isProfit ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {isProfit ? '+' : ''}${pos.pnl.toFixed(2)}
                      </div>
                      <div
                        className={`text-[11px] font-semibold font-mono ${
                          isProfit ? 'text-green-500/80' : 'text-red-500/80'
                        }`}
                      >
                        {isProfit ? '+' : ''}{pos.pnlPips} pips
                      </div>
                    </div>
                  </div>

                  {/* Badges: Breakeven / Partial Closed */}
                  <div className="flex items-center gap-2 mt-2">
                    {isBreakevenLocked && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1">
                        <Lock size={9} /> BREAKEVEN LOCKED (0 Risk)
                      </span>
                    )}
                    {pos.trailingStopActive && (
                      <span className="px-2 py-0.5 rounded bg-[#FF7A00]/15 border border-[#FF7A00]/30 text-[#FF7A00] text-[9px] font-mono font-bold">
                        TRAILING EXTENDED ($5-$8)
                      </span>
                    )}
                  </div>

                  {/* SL / TP & Close button */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1A1A1A] text-xs">
                    <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                      <span>
                        SL: <strong className="text-red-400 font-semibold">{pos.stopLoss}</strong>
                      </span>
                      <span>
                        TP: <strong className="text-green-400 font-semibold">{pos.takeProfit}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onClosePosition(pos.ticket)}
                      className="px-3 py-1 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-400 font-bold text-[10px] uppercase tracking-wider transition-all border border-red-900/40 flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle size={12} />
                      <span>CLOSE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1A1A1A] bg-[#151515] p-4 text-center">
            <p className="text-xs text-gray-500 font-mono">No active positions open in Exness MT5.</p>
          </div>
        )}
      </div>

      {/* 6. Quick Navigation Banners */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => onNavigateTab('markets')}
          className="p-4 rounded-2xl border border-[#1A1A1A] bg-[#151515] hover:border-[#333] text-left transition-all active:scale-95 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#FF7A00] mb-2">
            <Zap size={16} />
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-white block">Market Radar</span>
          <span className="text-[10px] text-gray-500 font-mono">8 FX Pairs + Gold (XAUUSD)</span>
        </button>

        <button
          onClick={() => onNavigateTab('risk')}
          className="p-4 rounded-2xl border border-[#1A1A1A] bg-[#151515] hover:border-[#333] text-left transition-all active:scale-95 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-green-500 mb-2">
            <Sliders size={16} />
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-white block">Aegis Guardian</span>
          <span className="text-[10px] text-gray-500 font-mono">Hard Risk Guardrails</span>
        </button>
      </div>
    </div>
  );
};
