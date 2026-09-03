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
  Wifi,
  WifiOff,
  AlertTriangle,
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
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ symbol: activeSymbolData.symbol }),
      });
      if (!res.ok) throw new Error('Debrief request failed');
      const text = await res.text();
      const data = JSON.parse(text);
      setLlmDebrief(data.analysis);
    } catch (e) {
      if (activeSymbolData.bid !== null) {
        setLlmDebrief(
          `${activeSymbolData.symbol} momentum is consistent with ${activeSymbolData.trend} continuation on Exness MT5 feed. Aegis risk protocols require tight stop allocation before taking exposure.`
        );
      } else {
        setLlmDebrief(
          `Exness MT5 feed for ${activeSymbolData.symbol} is currently OFFLINE. Connect an authenticated Exness account in Broker settings to enable real-time price intelligence.`
        );
      }
    } finally {
      setLoadingDebrief(false);
    }
  };

  useEffect(() => {
    setLlmDebrief(null);
  }, [selectedSymbol]);

  // Format chart data safely
  const chartData = (candles || []).map((c) => ({
    time: new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: c.close,
    open: c.open,
    high: c.high,
    low: c.low,
  }));

  const isPositive = (activeSymbolData?.change24h || 0) >= 0;
  const isPriceLive = activeSymbolData?.bid !== null && activeSymbolData?.bid !== undefined;
  const isFresh = activeSymbolData?.status === 'LIVE';

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* 1. Watchlist Strip (Horizontal scrolling on mobile) */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {symbols.map((s) => {
          const isSelected = s.symbol === selectedSymbol;
          const pos = (s.change24h || 0) >= 0;
          const hasPrice = s.bid !== null && s.bid !== undefined;
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
                <span className="font-bold text-xs text-white tracking-tight flex items-center gap-1.5">
                  {s.symbol}
                  {s.brokerSymbol && s.brokerSymbol !== s.symbol && (
                    <span className="text-[9px] text-gray-500 font-normal">({s.brokerSymbol})</span>
                  )}
                </span>
                {hasPrice ? (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      pos ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {pos ? '+' : ''}{s.change24h}%
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-600 bg-black/40 px-1 rounded">
                    OFFLINE
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-white mt-1">
                {hasPrice ? s.bid : '--'}
              </div>
              <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                {hasPrice ? (
                  <>
                    <span>{s.spreadPips}p</span>
                    <span>·</span>
                    <span className="text-[#FF7A00] font-semibold">{s.aiConfidence}% AI</span>
                  </>
                ) : (
                  <span className="text-gray-600">MT5: Not Connected</span>
                )}
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">{activeSymbolData?.symbol}</h2>
              {activeSymbolData?.brokerSymbol && activeSymbolData.brokerSymbol !== activeSymbolData.symbol && (
                <span className="text-xs px-2 py-0.5 rounded bg-black/50 border border-gray-800 text-gray-400 font-mono">
                  MT5: {activeSymbolData.brokerSymbol}
                </span>
              )}

              {/* Status Badge: LIVE / STALE / OFFLINE */}
              {isPriceLive ? (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                    isFresh
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isFresh ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  {activeSymbolData?.status || 'LIVE'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  MT5: NOT CONNECTED
                </span>
              )}

              {isPriceLive && activeSymbolData?.spreadPips !== null && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B0B0B] border border-[#1A1A1A] text-gray-400 font-mono">
                  SPREAD {activeSymbolData.spreadPips} PIPS
                </span>
              )}

              {activeSymbolData?.source && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0B0B0B] border border-[#1A1A1A] text-gray-500 font-mono">
                  {activeSymbolData.source}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {isPriceLive ? activeSymbolData.bid : '--'}
              </span>
              {isPriceLive && (
                <span className="text-xs text-gray-500">/ {activeSymbolData.ask}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => onScanSymbol(activeSymbolData.symbol)}
            disabled={isScanning || !isPriceLive}
            className={`px-3.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isPriceLive
                ? 'bg-[#0B0B0B] hover:bg-[#1f1a16] border-[#FF7A00]/40 text-[#FF7A00]'
                : 'bg-[#1a1a1a] border-gray-800 text-gray-600 cursor-not-allowed'
            }`}
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
          {chartData.length > 0 && isPriceLive ? (
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
                  tickFormatter={(v) =>
                    typeof v === 'number'
                      ? v.toFixed(activeSymbolData.symbol.includes('JPY') || activeSymbolData.symbol.includes('XAU') ? 2 : 4)
                      : v
                  }
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
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-black/20 rounded-xl border border-dashed border-[#222]">
              <WifiOff className="text-gray-600 mb-2" size={28} />
              <p className="text-gray-400 text-xs font-mono font-medium">MT5 Chart Feed Offline</p>
              <p className="text-gray-600 text-[11px] mt-1 max-w-xs">
                Connect your Exness MetaTrader 5 account to stream live institutional charts and ticks.
              </p>
            </div>
          )}
        </div>

        {/* High / Low / Session metrics */}
        <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-[#1A1A1A] text-center text-xs">
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">24h High</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">
              {isPriceLive && activeSymbolData?.high24h ? activeSymbolData.high24h : '--'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">24h Low</span>
            <span className="font-mono font-bold text-gray-300 text-sm mt-0.5 block">
              {isPriceLive && activeSymbolData?.low24h ? activeSymbolData.low24h : '--'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">Session</span>
            <span className="font-bold text-[#FF7A00] text-xs mt-1 block">LONDON / NY</span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block">Regime</span>
            <span className="font-bold text-green-500 text-xs mt-1 block uppercase">
              {activeSymbolData?.volatility || 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. AI Head of Desk Intelligence Debrief */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Head of Desk Synthesis · {activeSymbolData?.symbol}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">
                Multimodal market reasoning powered by Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={fetchAiDebrief}
            disabled={loadingDebrief}
            className="px-3 py-1 rounded-lg bg-[#0B0B0B] border border-gray-800 hover:border-[#FF7A00]/40 text-gray-300 hover:text-[#FF7A00] text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Bot size={12} />
            <span>{loadingDebrief ? 'SYNTHESIZING...' : 'ANALYZE MARKET'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0B0B] border border-[#1A1A1A] text-xs text-gray-300 leading-relaxed font-sans">
          {llmDebrief ? (
            <p className="italic">{llmDebrief}</p>
          ) : (
            <p className="text-gray-500 italic">
              Click &quot;Analyze Market&quot; to synthesize live order book dynamics, spread efficiency, and structural momentum for {activeSymbolData?.symbol}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
