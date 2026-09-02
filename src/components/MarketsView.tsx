import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  BarChart2,
  Shield,
  Bot,
} from 'lucide-react';
import { SymbolPrice, Candle, Timeframe } from '../types/index.js';

interface MarketsViewProps {
  symbols: SymbolPrice[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  candles: Candle[];
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  onScanSymbol: (symbol: string) => void;
  isScanning: boolean;
}

export const MarketsView: React.FC<MarketsViewProps> = ({
  symbols,
  selectedSymbol,
  onSelectSymbol,
  candles,
  timeframe,
  onSelectTimeframe,
  onScanSymbol,
  isScanning,
}) => {
  const [llmDebrief, setLlmDebrief] = useState<string | null>(null);
  const [loadingDebrief, setLoadingDebrief] = useState(false);

  const activeSymbolData = symbols.find((s) => s.symbol === selectedSymbol) || symbols[0];
  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  const fetchAiDebrief = async () => {
    if (!activeSymbolData) return;
    setLoadingDebrief(true);
    try {
      const res = await fetch('/api/ai/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: activeSymbolData.symbol }),
      });
      const data = await res.json();
      setLlmDebrief(data.analysis);
    } catch (e) {
      setLlmDebrief(
        `${activeSymbolData.symbol} momentum is consistent with ${activeSymbolData.trend} continuation. Aegis risk protocols require tight stop allocation before taking exposure.`
      );
    } finally {
      setLoadingDebrief(false);
    }
  };

  useEffect(() => {
    setLlmDebrief(null);
  }, [selectedSymbol]);

  // Format chart data
  const chartData = candles.map((c) => ({
    time: new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: c.close,
    open: c.open,
    high: c.high,
    low: c.low,
  }));

  const isPositive = (activeSymbolData?.change24h || 0) >= 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* 1. Watchlist Strip (Horizontal scrolling on mobile) */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {symbols.map((s) => {
          const isSelected = s.symbol === selectedSymbol;
          const pos = s.change24h >= 0;
          return (
            <button
              key={s.symbol}
              onClick={() => onSelectSymbol(s.symbol)}
              className={`flex-shrink-0 px-3.5 py-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#1a1715] border-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.15)]'
                  : 'bg-[#151515] border-[#1A1A1A] hover:border-[#333]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-xs text-white tracking-tight">{s.symbol}</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    pos ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {pos ? '+' : ''}{s.change24h}%
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-white mt-1">
                {s.bid}
              </div>
              <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span>{s.spreadPips}p</span>
                <span>·</span>
                <span className="text-[#FF7A00] font-semibold">{s.aiConfidence}% AI</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Interactive Chart Card */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Symbol Meta & Price */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-white">{activeSymbolData.symbol}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isPositive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}
              >
                {isPositive ? '+' : ''}{activeSymbolData.change24h}%
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B0B0B] border border-[#1A1A1A] text-gray-400 font-mono">
                SPREAD {activeSymbolData.spreadPips} PIPS
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {activeSymbolData.bid}
              </span>
              <span className="text-xs text-gray-500">/ {activeSymbolData.ask}</span>
            </div>
          </div>

          <button
            onClick={() => onScanSymbol(activeSymbolData.symbol)}
            disabled={isScanning}
            className="px-3.5 py-1.5 rounded-xl bg-[#0B0B0B] hover:bg-[#1f1a16] border border-[#FF7A00]/40 text-[#FF7A00] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
            <span>SCAN SETUP</span>
          </button>
        </div>

        {/* Timeframe selector pills */}
        <div className="flex items-center justify-between gap-1 p-1 bg-[#0B0B0B] rounded-xl border border-[#1A1A1A] mb-4">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#FF7A00] text-black shadow-md'
                  : 'text-gray-500 hover:text-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Price Chart */}
        <div className="h-60 w-full -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF7A00" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#333" fontSize={10} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#333"
                fontSize={10}
                tickLine={false}
                orientation="right"
                tickFormatter={(v) => v.toFixed(activeSymbolData.symbol.includes('JPY') || activeSymbolData.symbol.includes('XAU') ? 2 : 4)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0B0B',
                  borderColor: '#1A1A1A',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#FF7A00"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* High / Low / Session metrics */}
        <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-[#1A1A1A] text-center text-xs">
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">24h High</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">{activeSymbolData.high24h}</span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">24h Low</span>
            <span className="font-mono font-bold text-gray-300 text-sm mt-0.5 block">{activeSymbolData.low24h}</span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">Session</span>
            <span className="font-bold text-[#FF7A00] text-xs mt-1 block">LONDON / NY</span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">Regime</span>
            <span className="font-bold text-green-500 text-xs mt-1 block uppercase">{activeSymbolData.volatility}</span>
          </div>
        </div>
      </div>

      {/* 3. Gemini LLM Market Intelligence Debrief */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0B0B0B] border border-[#222] text-[#FF7A00] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-white block">
                Desk Synthesis Intelligence
              </span>
              <p className="text-[10px] text-gray-500 font-mono">Gemini Quantitative Macro Model</p>
            </div>
          </div>

          <button
            onClick={fetchAiDebrief}
            disabled={loadingDebrief}
            className="px-3 py-1.5 rounded-xl bg-[#0B0B0B] hover:bg-[#1a1a1a] border border-[#222] text-[10px] font-bold uppercase tracking-widest text-gray-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={11} className={loadingDebrief ? 'animate-spin text-[#FF7A00]' : ''} />
            <span>DEBRIEF</span>
          </button>
        </div>

        {llmDebrief ? (
          <div className="mt-2 text-xs leading-relaxed text-gray-300 bg-[#0B0B0B] p-4 rounded-xl border border-[#1A1A1A] font-mono">
            {llmDebrief}
          </div>
        ) : (
          <div className="mt-2 text-xs text-gray-500 bg-[#0B0B0B] p-4 rounded-xl border border-[#1A1A1A] text-center font-mono">
            Tap <strong className="text-[#FF7A00]">DEBRIEF</strong> to query Gemini for real-time order-flow and momentum synthesis on {activeSymbolData.symbol}.
          </div>
        )}
      </div>
    </div>
  );
};
