import React, { useState } from 'react';
import {
  Download,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { HistoricalTrade, BacktestResult } from '../types/index.js';

interface HistoryViewProps {
  trades: HistoricalTrade[];
  onExportCsv: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ trades, onExportCsv }) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'BACKTEST'>('AUDIT');
  const [selectedTrade, setSelectedTrade] = useState<HistoricalTrade | null>(null);

  // Backtest simulation state
  const [backtestSymbol, setBacktestSymbol] = useState('EURUSD');
  const [backtestDays, setBacktestDays] = useState(30);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);

  // Performance calculations
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.result === 'PROFIT').length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const netTotalPnl = trades.reduce((acc, t) => acc + t.netPnl, 0);

  const runBacktest = async () => {
    setIsRunningBacktest(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          symbol: backtestSymbol,
          days: backtestDays,
          initialBalance: 2400.0,
          riskPerTradePct: 1.5,
          timeframe: 'M5',
        }),
      });
      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        setBacktestResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningBacktest(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-[#0B0B0B] rounded-xl border border-[#1A1A1A]">
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'bg-[#FF7A00] text-black shadow-md'
              : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          Trade Audits & Log
        </button>
        <button
          onClick={() => setActiveTab('BACKTEST')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'BACKTEST'
              ? 'bg-[#FF7A00] text-black shadow-md'
              : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          Strategy Backtester
        </button>
      </div>

      {activeTab === 'AUDIT' ? (
        <>
          {/* Performance Summary Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#1A1A1A] text-center shadow-lg">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">Win Rate</span>
              <span className="text-base sm:text-lg font-bold text-green-500 font-mono mt-0.5 block">
                {winRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">{winningTrades}/{totalTrades} Trades</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#1A1A1A] text-center shadow-lg">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">Net P/L</span>
              <span
                className={`text-base sm:text-lg font-bold font-mono mt-0.5 block ${
                  netTotalPnl >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {netTotalPnl >= 0 ? '+' : ''}${netTotalPnl.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Exness MT5</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#1A1A1A] text-center shadow-lg">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">Profit Factor</span>
              <span className="text-base sm:text-lg font-bold text-[#FF7A00] font-mono mt-0.5 block">2.34</span>
              <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Aegis Guarded</span>
            </div>
          </div>

          {/* Export CSV row */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              Institutional Trade Records
            </span>
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-xl bg-[#151515] hover:bg-[#202020] text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 border border-[#1A1A1A] cursor-pointer"
            >
              <Download size={12} />
              <span>EXPORT CSV</span>
            </button>
          </div>

          {/* Trades List */}
          <div className="space-y-2.5">
            {trades.map((t) => {
              const isWin = t.result === 'PROFIT';
              const isSelected = selectedTrade?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrade(isSelected ? null : t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1715] border-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.1)]'
                      : 'bg-[#151515] border-[#1A1A1A] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-tight">{t.symbol}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            t.direction === 'BUY'
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}
                        >
                          {t.direction} {t.lotSize}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">#{t.ticket}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-1.5 flex items-center gap-2">
                        <span>ENTRY: {t.entryPrice}</span>
                        <span>·</span>
                        <span>EXIT: {t.exitPrice}</span>
                        <span>·</span>
                        <span>{t.durationMinutes}m</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-bold font-mono ${
                          isWin ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {isWin ? '+' : ''}${t.netPnl.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                        {new Date(t.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Trade Audit Breakdown */}
                  {isSelected && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#1A1A1A] text-xs space-y-2 bg-[#0B0B0B] p-3.5 rounded-xl border border-[#1A1A1A] font-mono">
                      <div>
                        <span className="font-bold text-[#FF7A00]">SCOUT SIGNAL: </span>
                        <span className="text-gray-300">{t.audit.scoutSignal}</span>
                      </div>
                      <div>
                        <span className="font-bold text-blue-400">HUNTER STRATEGY: </span>
                        <span className="text-gray-300">{t.audit.hunterStrategy}</span>
                      </div>
                      <div>
                        <span className="font-bold text-green-500">AEGIS GUARDIAN: </span>
                        <span className="text-gray-300">{t.audit.guardianRisk}</span>
                      </div>
                      <div>
                        <span className="font-bold text-white">DESK VERDICT: </span>
                        <span className="text-gray-300">{t.audit.headOfDeskVerdict}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Backtester View */
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Strategy Backtester Simulation
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Run quantitative historical simulation on 5-agent rules over 30 to 90 days.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Symbol</label>
                <select
                  value={backtestSymbol}
                  onChange={(e) => setBacktestSymbol(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A] text-white font-mono text-xs focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value="EURUSD">EURUSD</option>
                  <option value="XAUUSD">XAUUSD (Gold)</option>
                  <option value="USDJPY">USDJPY</option>
                  <option value="GBPUSD">GBPUSD</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Time Horizon</label>
                <select
                  value={backtestDays}
                  onChange={(e) => setBacktestDays(parseInt(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A] text-white font-mono text-xs focus:outline-none focus:border-[#FF7A00]"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            </div>

            <button
              onClick={runBacktest}
              disabled={isRunningBacktest}
              className="w-full py-3.5 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
            >
              <Play size={14} className={isRunningBacktest ? 'animate-spin' : ''} />
              <span>{isRunningBacktest ? 'SIMULATING...' : 'RUN SIMULATION'}</span>
            </button>
          </div>

          {backtestResult && (
            <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white">SIMULATION RESULTS</span>
                <span className="text-[10px] text-gray-500 font-mono">1.5% RISK SIZING</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A]">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Win Rate</span>
                  <span className="font-bold text-green-500 font-mono text-sm mt-0.5 block">{backtestResult.winRate}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A]">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Net Profit</span>
                  <span className="font-bold text-green-500 font-mono text-sm mt-0.5 block">+${backtestResult.netProfit}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A]">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Profit Factor</span>
                  <span className="font-bold text-[#FF7A00] font-mono text-sm mt-0.5 block">{backtestResult.profitFactor}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A]">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Max DD</span>
                  <span className="font-bold text-red-500 font-mono text-sm mt-0.5 block">{backtestResult.maxDrawdownPct}%</span>
                </div>
              </div>

              {/* Equity Curve Chart */}
              <div className="h-48 w-full -ml-2 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={backtestResult.equityCurve}>
                    <XAxis dataKey="time" stroke="#333" fontSize={9} />
                    <YAxis stroke="#333" fontSize={9} orientation="right" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B0B0B',
                        borderColor: '#1A1A1A',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#fff',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#FF7A00"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-300 font-mono leading-relaxed bg-[#0B0B0B] p-3.5 rounded-xl border border-[#1A1A1A]">
                {backtestResult.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
