import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Target,
  Shield,
  Eye,
  Radio,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { AgentEvent } from '../types/index.js';

interface AgentsViewProps {
  agentEvents: AgentEvent[];
  onTriggerScan: () => void;
  isScanning: boolean;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agentEvents,
  onTriggerScan,
  isScanning,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SCAN' | 'RISK' | 'EXECUTE'>('ALL');

  const filteredEvents = agentEvents.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'SCAN') return e.type === 'SCAN' || e.type === 'SETUP';
    if (filter === 'RISK') return e.type === 'RISK_PASS' || e.type === 'WARNING';
    if (filter === 'EXECUTE') return e.type === 'EXECUTE' || e.type === 'CONSENSUS';
    return true;
  });

  const agents = [
    {
      name: 'QUANTUM SCOUT',
      role: 'Continuous Market Scanner',
      icon: <Eye size={18} className="text-[#FF7A00]" />,
      badge: 'ACTIVE',
      metrics: 'EMA 9/21/50 · RSI 14 · ATR · Bollinger Bands',
      duty: 'Calculates technical momentum and structure expansion across M1, M5, H1 timeframes.',
    },
    {
      name: 'SETUP HUNTER',
      role: 'Opportunity Screener',
      icon: <Target size={18} className="text-blue-400" />,
      badge: 'ACTIVE',
      metrics: 'Min 1:2.0 R:R · Breakout / Scalp Criteria',
      duty: 'Identifies high-probability setups with entry, SL, TP. Permitted to output NO TRADE.',
    },
    {
      name: 'MARKET SENTINEL',
      role: 'Macro & Liquidity Guard',
      icon: <Radio size={18} className="text-purple-400" />,
      badge: 'ACTIVE',
      metrics: 'USD Index · Session Liquidity · Spread Spike Filter',
      duty: 'Monitors London/NY liquidity, news windows, and prevents trading in choppy illiquid regimes.',
    },
    {
      name: 'AEGIS GUARDIAN',
      role: 'Hard Risk & Execution Gatekeeper',
      icon: <Shield size={18} className="text-green-500" />,
      badge: 'ARMED',
      metrics: 'Max 1.5% Risk · Max 4% Daily Loss · Kill Switch',
      duty: 'Absolute veto power over all proposals. Rejects any trade violating account equity limits.',
    },
    {
      name: 'HEAD OF DESK',
      role: 'Consensus & Dispatcher',
      icon: <Cpu size={18} className="text-amber-400" />,
      badge: 'ACTIVE',
      metrics: '4/5 or 5/5 Consensus · LLM Synthesis',
      duty: 'Synthesizes agent reports into actionable 30s proposals. Cannot override Aegis Guardian.',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* Top Banner with Run Scan */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7A00] opacity-5 blur-[60px] pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-white">
              5-Agent Neural Swarm
            </h2>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
            Decoupled multi-agent architecture for 24/7 Exness MT5 execution
          </p>
        </div>

        <button
          onClick={onTriggerScan}
          disabled={isScanning}
          className="px-4 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-white/5 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:bg-gray-200 cursor-pointer"
        >
          <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
          <span>{isScanning ? 'SCANNING...' : 'RUN SWARM'}</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="space-y-3">
        {agents.map((ag) => (
          <div
            key={ag.name}
            className="rounded-2xl border border-[#1A1A1A] bg-[#151515] p-4 sm:p-5 hover:border-[#333] transition-all shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                  {ag.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs tracking-wider">
                      {ag.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0B0B0B] border border-[#222] text-green-400 uppercase">
                      {ag.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono block mt-0.5">{ag.role}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-300 mt-3 leading-relaxed font-sans">{ag.duty}</p>

            <div className="mt-3 pt-2.5 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>{ag.metrics}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Event Bus Live Terminal */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-[#FF7A00]" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              Agent Event Bus
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-[#0B0B0B] rounded-xl border border-[#1A1A1A]">
            {(['ALL', 'SCAN', 'RISK', 'EXECUTE'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-[#FF7A00] text-black shadow-md'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar font-mono text-xs pr-1">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A] text-[11px] leading-snug"
              >
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1 font-mono">
                  <span className="text-[#FF7A00] font-bold uppercase">{evt.agent}</span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-300 font-mono">{evt.message}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center py-4 font-mono">No events in this category yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
