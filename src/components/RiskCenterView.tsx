import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Send,
  Zap,
  Check,
} from 'lucide-react';
import { RiskSettings, BrokerAccount } from '../types/index.js';

interface RiskCenterViewProps {
  account: BrokerAccount;
  riskSettings: RiskSettings;
  onUpdateRiskSettings: (settings: Partial<RiskSettings>) => void;
  onOpenKillSwitchModal: () => void;
  onTriggerBriefing?: () => void;
  onToggleAutoTrading?: (enabled: boolean) => void;
}

export const RiskCenterView: React.FC<RiskCenterViewProps> = ({
  account,
  riskSettings,
  onUpdateRiskSettings,
  onOpenKillSwitchModal,
  onTriggerBriefing,
  onToggleAutoTrading,
}) => {
  const [localAutoTrading, setLocalAutoTrading] = useState(riskSettings.autoTradingEnabled ?? true);
  const [localRisk, setLocalRisk] = useState(riskSettings.maxRiskPerTradePct);
  const [localDailyLoss, setLocalDailyLoss] = useState(riskSettings.maxDailyLossPct);
  const [localMaxTrades, setLocalMaxTrades] = useState(riskSettings.maxSimultaneousTrades);
  const [localMaxSpread, setLocalMaxSpread] = useState(riskSettings.maxSpreadPips);
  const [trailingStop, setTrailingStop] = useState(riskSettings.trailingStopEnabled);

  // Profit targets & dynamic management
  const [normalMin, setNormalMin] = useState(riskSettings.normalProfitTargetMin || 3.0);
  const [normalMax, setNormalMax] = useState(riskSettings.normalProfitTargetMax || 5.0);
  const [extendedMin, setExtendedMin] = useState(riskSettings.extendedProfitTargetMin || 5.0);
  const [extendedMax, setExtendedMax] = useState(riskSettings.extendedProfitTargetMax || 8.0);
  const [beThresholdUsd, setBeThresholdUsd] = useState(riskSettings.breakevenThresholdUsd || 2.5);
  const [partialClosePct, setPartialClosePct] = useState(riskSettings.partialClosePct || 50);
  const [trailingPips, setTrailingPips] = useState(riskSettings.trailingStopDistancePips || 6.0);

  const [briefingTime, setBriefingTime] = useState(riskSettings.briefingTime || '04:00');
  const [briefingTz, setBriefingTz] = useState(riskSettings.briefingTimezone || 'Africa/Lagos (GMT+1)');
  const [isBriefingSent, setIsBriefingSent] = useState(false);

  const handleSave = () => {
    onUpdateRiskSettings({
      autoTradingEnabled: localAutoTrading,
      maxRiskPerTradePct: localRisk,
      maxDailyLossPct: localDailyLoss,
      maxSimultaneousTrades: localMaxTrades,
      maxSpreadPips: localMaxSpread,
      trailingStopEnabled: trailingStop,
      normalProfitTargetMin: normalMin,
      normalProfitTargetMax: normalMax,
      extendedProfitTargetMin: extendedMin,
      extendedProfitTargetMax: extendedMax,
      breakevenThresholdUsd: beThresholdUsd,
      partialClosePct,
      trailingStopDistancePips: trailingPips,
      briefingTime,
      briefingTimezone: briefingTz,
    });
  };

  const handleTriggerBriefing = () => {
    onTriggerBriefing?.();
    setIsBriefingSent(true);
    setTimeout(() => setIsBriefingSent(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 text-xs">
      {/* 1. Autonomous Execution & Aegis Status Banner */}
      <div
        className={`rounded-2xl border p-5 shadow-2xl transition-all relative overflow-hidden ${
          riskSettings.killSwitchActive
            ? 'bg-red-950/20 border-red-900/50 text-red-400'
            : 'bg-[#151515] border-[#1A1A1A] text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                riskSettings.killSwitchActive
                  ? 'bg-red-900/20 border-red-900/50 text-red-500'
                  : 'bg-[#0B0B0B] border-[#1A1A1A] text-[#FF7A00]'
              }`}
            >
              {riskSettings.killSwitchActive ? <ShieldAlert size={24} /> : <Zap size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">
                  {riskSettings.killSwitchActive ? 'AEGIS KILL SWITCH ACTIVE' : 'AUTONOMOUS DESK DECISION'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    localAutoTrading ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {localAutoTrading ? 'AUTO TRADING: ON' : 'MANUAL APPROVAL'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                {localAutoTrading
                  ? 'Head of Desk executes approved agent consensus automatically without operator clicks.'
                  : 'Proposals require 30-second manual operator review and confirmation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Direct Auto-Trading Switch */}
        <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between">
          <span className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
            Autonomous Execution Engine
          </span>
          <button
            onClick={() => {
              const next = !localAutoTrading;
              setLocalAutoTrading(next);
              onToggleAutoTrading?.(next);
              onUpdateRiskSettings({ autoTradingEnabled: next });
            }}
            className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              localAutoTrading
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-[#222] text-gray-400 border-[#333]'
            }`}
          >
            {localAutoTrading ? '🟢 AUTONOMOUS: ACTIVE' : '⚪ MANUAL: PAUSED'}
          </button>
        </div>
      </div>

      {/* 2. Monetary Profit Targets & Dynamic Profit Management */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              Dynamic Profit Management
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
            $3 - $8 Targets
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Normal Profit Target ($3 - $5) */}
          <div className="p-3 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Normal Target
            </div>
            <div className="text-base font-mono font-bold text-emerald-400">
              ${normalMin.toFixed(2)} - ${normalMax.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-1">
              Locks partial profit or closes on stalled momentum
            </div>
          </div>

          {/* Extended Profit Target ($5 - $8) */}
          <div className="p-3 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E]">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Extended Target
            </div>
            <div className="text-base font-mono font-bold text-[#FF7A00]">
              ${extendedMin.toFixed(2)} - ${extendedMax.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-1">
              Dynamic trailing stop rides strong trend expansions
            </div>
          </div>
        </div>

        {/* Breakeven Trigger */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
              Move SL to Breakeven at
            </span>
            <span className="font-mono font-bold text-white">+${beThresholdUsd.toFixed(2)} Profit</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.5"
            value={beThresholdUsd}
            onChange={(e) => setBeThresholdUsd(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
            <span>+$1.00</span>
            <span>+$2.50 (Recommended)</span>
            <span>+$4.00</span>
          </div>
        </div>

        {/* Partial Close at Normal Target */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
              Partial Close Ratio at Normal Target
            </span>
            <span className="font-mono font-bold text-white">{partialClosePct}% of lot</span>
          </div>
          <input
            type="range"
            min="25"
            max="100"
            step="25"
            value={partialClosePct}
            onChange={(e) => setPartialClosePct(parseInt(e.target.value))}
            className="w-full accent-[#FF7A00] h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
            <span>25%</span>
            <span>50% (Lock Half & Run)</span>
            <span>100% (Close All)</span>
          </div>
        </div>

        {/* Trailing Stop Distance */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
              Trailing Distance (Pips)
            </span>
            <span className="font-mono font-bold text-white">{trailingPips} Pips</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="12.0"
            step="1.0"
            value={trailingPips}
            onChange={(e) => setTrailingPips(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Hard Risk Limits (Aegis Guardian Enforced) */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-[#FF7A00]" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              Hard Capital Guardrails
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Guardian Absolute Veto
          </span>
        </div>

        {/* Max Risk Per Trade */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Max Risk Per Trade</span>
            <span className="font-mono font-bold text-[#FF7A00] text-sm">{localRisk}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={localRisk}
            onChange={(e) => setLocalRisk(parseFloat(e.target.value))}
            className="w-full accent-[#FF7A00] h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
        </div>

        {/* Max Daily Loss */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Max Daily Loss</span>
            <span className="font-mono font-bold text-red-500 text-sm">{localDailyLoss}%</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.5"
            value={localDailyLoss}
            onChange={(e) => setLocalDailyLoss(parseFloat(e.target.value))}
            className="w-full accent-red-500 h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
        </div>

        {/* Max Simultaneous Trades */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Max Simultaneous Trades</span>
            <span className="font-mono font-bold text-white text-sm">{localMaxTrades} Positions</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={localMaxTrades}
            onChange={(e) => setLocalMaxTrades(parseInt(e.target.value))}
            className="w-full accent-green-500 h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
        </div>

        {/* Max Spread Pips */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Max Acceptable Spread</span>
            <span className="font-mono font-bold text-white text-sm">{localMaxSpread} Pips</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.5"
            value={localMaxSpread}
            onChange={(e) => setLocalMaxSpread(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-[#222] rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-gray-200 text-xs transition-all active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
        >
          Save All Parameters
        </button>
      </div>

      {/* 4. 04:00 Daily Market Briefing Schedule */}
      <div className="rounded-2xl bg-[#151515] border border-[#1A1A1A] p-5 sm:p-6 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#FF7A00]" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              04:00 Daily Market Briefing
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            {briefingTz}
          </span>
        </div>

        <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
          The multi-agent swarm scans 8 forex & metal pairs at 04:00 AM every morning and sends an institutional market briefing to your Telegram with strong setups, watchlist, high-risk conditions, and the top setup candidate.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleTriggerBriefing}
            disabled={isBriefingSent}
            className="w-full py-3 bg-[#0B0B0B] border border-[#2A2A2A] hover:border-[#FF7A00] text-gray-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isBriefingSent ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>BRIEFING SENT TO TELEGRAM</span>
              </>
            ) : (
              <>
                <Send size={14} className="text-[#FF7A00]" />
                <span>SEND 04:00 BRIEFING NOW</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Emergency Kill Switch */}
      <div className="rounded-2xl bg-[#151515] border border-red-900/50 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 text-red-500 mb-2">
          <AlertOctagon size={18} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-400">
            Aegis Emergency Kill Switch
          </h3>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mb-4 font-mono">
          Immediately halts all multi-agent trade proposals. Liquidates active MT5 positions in a single tap to shield account balance from black swan market shocks.
        </p>

        <button
          onClick={onOpenKillSwitchModal}
          className="w-full py-3.5 bg-red-900/20 text-red-500 border border-red-900/50 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <AlertOctagon size={16} />
          <span>
            {riskSettings.killSwitchActive ? 'MANAGE OR RESET KILL SWITCH' : 'TRIGGER AEGIS KILL SWITCH'}
          </span>
        </button>
      </div>
    </div>
  );
};
