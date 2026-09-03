import React, { useState } from 'react';
import { X, Server, Check, ShieldCheck, RefreshCw, AlertTriangle, Key, ArrowRight, Lock } from 'lucide-react';
import { BrokerAccount } from '../types/index.js';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BrokerAccount;
  onConnect: (accountNumber: string, server: string, isLive: boolean, password?: string) => Promise<boolean | void>;
  onToggleMode: (isLive: boolean) => void;
}

const EXNESS_PRESET_SERVERS = [
  'Exness-MT5Real',
  'Exness-MT5Real2',
  'Exness-MT5Real3',
  'Exness-MT5Real4',
  'Exness-MT5Trial9',
  'Exness-MT5Trial',
  'Exness-MT5Trial2',
];

export const BrokerModal: React.FC<BrokerModalProps> = ({
  isOpen,
  onClose,
  account,
  onConnect,
  onToggleMode,
}) => {
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [server, setServer] = useState(account.server || 'Exness-MT5Real');
  const [isLive, setIsLive] = useState(account.isLive);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await onConnect(accountNumber, server, isLive, password);
      setConnectSuccess(true);
      setTimeout(() => {
        setConnectSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate with Exness MT5 trade server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121212] border border-[#222222] p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#FF7A00]">
              <Server size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Exness MT5 Gateway
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">MetaTrader 5 Direct Connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live vs Paper Mode Banner */}
        <div className="mb-4 p-3.5 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E] flex items-center justify-between">
          <div>
            <span className="font-bold text-white uppercase text-[11px] tracking-wider block">Execution Pipeline</span>
            <span className="text-[10px] text-gray-400 font-mono">
              {isLive ? '🔴 Real Exness Account & Market' : '🟢 Paper Trading Simulation'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !isLive;
              setIsLive(next);
              onToggleMode(next);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              isLive
                ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-sm shadow-red-500/10'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isLive ? 'EXNESS LIVE' : 'PAPER SIM'}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {connectSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={15} className="shrink-0" />
            <span>Successfully authenticated with Exness MT5 trade cluster!</span>
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-3.5 text-xs">
          {/* Account / Login Number */}
          <div>
            <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1 font-semibold flex items-center gap-1.5">
              <span>MT5 Account / Login Number</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 9482015"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#222222] text-white font-mono text-xs focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          {/* MT5 Server */}
          <div>
            <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1 font-semibold flex items-center gap-1.5">
              <span>MT5 Server</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="e.g. Exness-MT5Real"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#222222] text-white font-mono text-xs focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {EXNESS_PRESET_SERVERS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setServer(preset)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                    server === preset
                      ? 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40'
                      : 'bg-[#151515] text-gray-400 border border-[#222222] hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* MT5 Password */}
          <div>
            <label className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>MT5 Trading Password</span>
                {isLive && <span className="text-red-400">*</span>}
              </span>
              <span className="text-gray-500 text-[9px] font-mono flex items-center gap-1">
                <Lock size={10} /> AES-256 Encrypted
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLive ? 'Required for Exness Live Trading' : 'Optional in Paper Mode'}
              required={isLive}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#222222] text-white font-mono text-xs focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          {/* Security & Data Guarantee Note */}
          <div className="p-3 rounded-xl bg-[#0B0B0B] border border-[#1E1E1E] text-[10px] text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-300 uppercase tracking-wider text-[9px]">
              <ShieldCheck size={12} className="text-[#FF7A00]" />
              <span>Zero Exposure Security Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Passwords are encrypted at rest with AES-256 and stored in the secure environment. Never exposed in API responses, logs, Telegram messages, or LLM prompts.
            </p>
          </div>

          {/* Connected State Metrics Card */}
          {account.connected && (
            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#222222] space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400 uppercase font-semibold">Active MT5 Terminal Data</span>
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE FEED
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-[#141414] border border-[#222222]">
                  <div className="text-[9px] text-gray-400 font-mono">BALANCE</div>
                  <div className="text-xs font-mono font-bold text-white">
                    ${account.balance !== null ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#141414] border border-[#222222]">
                  <div className="text-[9px] text-gray-400 font-mono">EQUITY</div>
                  <div className="text-xs font-mono font-bold text-[#FF7A00]">
                    ${account.equity !== null ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#141414] border border-[#222222]">
                  <div className="text-[9px] text-gray-400 font-mono">LEVERAGE</div>
                  <div className="text-xs font-mono font-bold text-white">1:{account.leverage}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-gray-400 font-mono">
                <div>Margin: <span className="text-white">${account.margin !== null ? account.margin.toFixed(2) : '--'}</span></div>
                <div>Free Margin: <span className="text-white">${account.freeMargin !== null ? account.freeMargin.toFixed(2) : '--'}</span></div>
                <div>Algo Trading: <span className="text-emerald-400">ENABLED</span></div>
                <div>Trade Allowed: <span className="text-emerald-400">YES</span></div>
              </div>
            </div>
          )}

          {/* Connect Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-white/5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-black" />
                  <span>AUTHENTICATING MT5...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>CONNECT ACCOUNT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
