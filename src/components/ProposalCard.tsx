import React, { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, Zap, Clock, TrendingUp, TrendingDown, Target, ShieldCheck } from 'lucide-react';
import { TradeProposal } from '../types/index.js';

interface ProposalCardProps {
  proposal: TradeProposal;
  onApprove: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
  isProcessing: boolean;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(Math.max(0, proposal.expiresAt - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, proposal.expiresAt - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [proposal.expiresAt]);

  const progressPct = Math.min(100, Math.max(0, (timeLeftMs / 30000) * 100));
  const isBuy = proposal.direction === 'BUY';
  const isExpired = timeLeftMs <= 0 || proposal.status === 'EXPIRED';
  const symbolInitials = proposal.symbol.slice(0, 2);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#151515] border border-[#1A1A1A] shadow-2xl transition-all">
      {/* 30s Countdown Progress Bar */}
      <div className="w-full h-1 bg-[#222] overflow-hidden">
        <div
          className={`h-full transition-all duration-150 ${
            progressPct < 25 ? 'bg-red-500' : progressPct < 55 ? 'bg-amber-400' : 'bg-[#FF7A00]'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-[#1A1A1A] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Active Trade Proposal
          </h3>
          <span className="text-[10px] font-mono text-[#FF7A00] font-semibold">
            {proposal.strategy} · {proposal.timeframe}
          </span>
        </div>
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
            isExpired
              ? 'bg-gray-800 text-gray-400'
              : progressPct < 30
              ? 'bg-red-500/10 text-red-500 animate-pulse'
              : 'bg-green-500/10 text-green-500'
          }`}
        >
          {isExpired ? 'EXPIRED' : `Expires in ${(timeLeftMs / 1000).toFixed(0)}s`}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Col: Symbol and Core Metrics */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0B0B0B] rounded-xl flex items-center justify-center border border-[#1A1A1A] shrink-0">
              <span className="text-[#FF7A00] font-bold text-sm tracking-tight">{symbolInitials}</span>
            </div>
            <div>
              <h4 className="text-xl font-bold tracking-tight text-white">{proposal.symbol}</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                {proposal.symbol === 'XAUUSD' ? 'Gold / US Dollar' : `${proposal.symbol} Forex Spot`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B0B0B] p-3 rounded-xl border border-[#1A1A1A]">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Direction</p>
              <p
                className={`text-sm font-black uppercase italic ${
                  isBuy ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {isBuy ? 'Buy Long' : 'Sell Short'}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Lot Size</p>
              <p className="text-sm font-mono font-bold text-white">{proposal.lotSize}</p>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Entry Price</p>
              <p className="text-sm font-mono text-white">{proposal.entryPrice}</p>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Take Profit</p>
              <p className="text-sm font-mono text-green-500 font-bold">{proposal.takeProfit}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 text-gray-400">
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Risk Limit</span>
              <span className="text-red-400 font-mono font-semibold">
                -${proposal.riskAmount.toFixed(2)} ({proposal.riskPercentage}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Stop Loss</span>
              <span className="text-red-400 font-mono font-semibold">{proposal.stopLoss}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Target R:R</span>
              <span className="text-green-400 font-mono font-semibold">1:{proposal.riskReward}</span>
            </div>
          </div>
        </div>

        {/* Right Col: AI Consensus Summary */}
        <div className="md:col-span-5 bg-[#0B0B0B] rounded-2xl p-4 border border-[#1A1A1A] flex flex-col justify-between gap-2.5">
          <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">AI Confidence</span>
            <span className="text-base font-mono font-bold text-[#FF7A00]">{proposal.aiConfidence}%</span>
          </div>

          <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Risk Score</span>
            <span className="text-xs font-mono font-bold text-green-500 uppercase">
              {proposal.riskPercentage <= 1.5 ? 'AEGIS VERIFIED' : 'ELEVATED'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Consensus</span>
            <span className="text-xs font-mono text-blue-400 font-bold">{proposal.agentConsensus}</span>
          </div>

          <p className="text-[10px] text-gray-400 italic leading-relaxed bg-[#151515] p-2.5 rounded-lg border border-[#1A1A1A]">
            "{proposal.reason}"
          </p>
        </div>
      </div>

      {/* Expandable Agent Debate */}
      <div className="px-4 sm:px-5 pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Agent Intelligence Audit</span>
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="my-2 space-y-2 text-[11px] bg-[#0B0B0B] rounded-xl p-3 border border-[#1A1A1A]">
            <div>
              <span className="font-bold text-[#FF7A00] uppercase text-[10px]">Quantum Scout: </span>
              <span className="text-gray-300">{proposal.scoutSummary}</span>
            </div>
            <div>
              <span className="font-bold text-blue-400 uppercase text-[10px]">Setup Hunter: </span>
              <span className="text-gray-300">{proposal.hunterSummary}</span>
            </div>
            <div>
              <span className="font-bold text-purple-400 uppercase text-[10px]">Market Sentinel: </span>
              <span className="text-gray-300">{proposal.sentinelSummary}</span>
            </div>
            <div>
              <span className="font-bold text-green-500 uppercase text-[10px]">Aegis Guardian: </span>
              <span className="text-gray-300">{proposal.guardianSummary}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 sm:p-5 pt-1 flex gap-3">
        <button
          onClick={() => onApprove(proposal.id)}
          disabled={isProcessing || isExpired}
          className="flex-1 py-3.5 sm:py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-white/5 disabled:opacity-40 cursor-pointer"
        >
          <Check size={16} strokeWidth={3} />
          <span>{isProcessing ? 'SENDING MT5...' : 'APPROVE TRADE'}</span>
        </button>

        <button
          onClick={() => onReject(proposal.id)}
          disabled={isProcessing || isExpired}
          className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#1A1A1A] text-gray-400 font-bold uppercase tracking-widest rounded-xl hover:bg-[#222] border border-[#222] active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <X size={15} />
          <span>REJECT</span>
        </button>
      </div>

      {isExpired && (
        <div className="absolute inset-0 bg-[#0B0B0B]/85 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="text-center p-4">
            <Clock size={24} className="text-gray-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold uppercase tracking-widest text-white">Proposal Expired</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Execution window timed out.</p>
          </div>
        </div>
      )}
    </div>
  );
};
