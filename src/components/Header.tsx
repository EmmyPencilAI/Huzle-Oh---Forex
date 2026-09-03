import React from 'react';
import { Shield, ShieldAlert, RefreshCw, Zap } from 'lucide-react';
import { BrokerAccount, RiskSettings } from '../types/index.js';

interface HeaderProps {
  account: BrokerAccount;
  riskSettings: RiskSettings;
  pendingProposalsCount: number;
  onOpenBrokerModal: () => void;
  onOpenKillSwitchModal: () => void;
  onTriggerScan: () => void;
  onToggleAutoTrading?: (enabled: boolean) => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  riskSettings,
  pendingProposalsCount,
  onOpenBrokerModal,
  onOpenKillSwitchModal,
  onTriggerScan,
  onToggleAutoTrading,
  isScanning,
}) => {
  const isAuto = riskSettings.autoTradingEnabled ?? true;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#1A1A1A] bg-[#0B0B0B]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand & Broker Status */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FF7A00] rounded-sm flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(255,122,0,0.3)] shrink-0">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black -rotate-45" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold tracking-tighter text-white">
              HUZLE <span className="text-[#FF7A00]">OH</span>
            </span>
            <span className={`hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded font-mono border font-semibold ${account.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#151515] text-gray-400 border-[#222]'}`}>
              {account.connected ? 'EXNESS MT5 LIVE' : 'MT5 OFFLINE'}
            </span>
          </div>
        </div>

        {/* Status Chips & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Auto Trading Toggle Chip */}
          <button
            onClick={() => onToggleAutoTrading?.(!isAuto)}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
              isAuto
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-[#151515] border-[#222] text-gray-400 hover:text-white'
            }`}
            title={`Toggle Auto-Trading (${isAuto ? 'Autonomous Active' : 'Manual Review'})`}
          >
            <Zap size={11} className={isAuto ? 'text-emerald-400' : 'text-gray-500'} />
            <span className="text-[10px] font-mono font-bold uppercase hidden xs:inline">
              {isAuto ? 'AUTO ON' : 'MANUAL'}
            </span>
          </button>

          {/* Exness MT5 Status */}
          <button
            onClick={onOpenBrokerModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#151515] rounded-full border border-[#222] hover:border-[#333] transition-colors cursor-pointer"
            title="Configure Exness MT5"
          >
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold hidden md:inline">
              Exness
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                account.connected
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[10px] font-mono text-green-500 uppercase font-semibold">
              {account.connected ? 'MT5' : 'OFFLINE'}
            </span>
          </button>

          {/* AI Engine Status & Scan Trigger */}
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#151515] rounded-full border border-[#222] hover:border-[#333] transition-colors active:scale-95 cursor-pointer"
            title="Trigger Multi-Agent Swarm Scan"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold flex items-center gap-1">
              <RefreshCw size={10} className={isScanning ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isScanning ? 'SCANNING' : 'SWARM'}</span>
            </span>
          </button>

          {/* Aegis Guardian Kill Switch Status */}
          <button
            onClick={onOpenKillSwitchModal}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 cursor-pointer ${
              riskSettings.killSwitchActive
                ? 'bg-red-900/20 text-red-500 border-red-900/50 animate-pulse'
                : 'bg-[#151515] border-[#222] text-gray-400 hover:text-white'
            }`}
          >
            {riskSettings.killSwitchActive ? (
              <>
                <ShieldAlert size={12} className="text-red-500" />
                <span>HALTED</span>
              </>
            ) : (
              <>
                <Shield size={12} className="text-green-500" />
                <span className="text-gray-300">AEGIS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
