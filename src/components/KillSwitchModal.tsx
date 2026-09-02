import React, { useState } from 'react';
import { X, AlertOctagon, ShieldCheck } from 'lucide-react';
import { RiskSettings } from '../types/index.js';

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskSettings: RiskSettings;
  onTriggerKillSwitch: (action: 'STOP_NEW_ONLY' | 'CLOSE_ALL_POSITIONS') => void;
  onResetKillSwitch: () => void;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  onClose,
  riskSettings,
  onTriggerKillSwitch,
  onResetKillSwitch,
}) => {
  const [selectedAction, setSelectedAction] = useState<'STOP_NEW_ONLY' | 'CLOSE_ALL_POSITIONS'>('STOP_NEW_ONLY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#151515] border border-red-900/50 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-red-500">
            <div className="w-8 h-8 rounded-lg bg-[#0B0B0B] border border-red-900/40 flex items-center justify-center">
              <AlertOctagon size={16} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-400">
              Emergency Kill Switch
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0B0B0B] border border-[#1A1A1A] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {riskSettings.killSwitchActive ? (
          /* Reset Flow */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0B0B0B] border border-red-900/40 text-red-400 text-xs font-mono">
              <p className="font-bold uppercase tracking-wider">Kill Switch is ACTIVE</p>
              <p className="text-[11px] text-gray-400 mt-1">
                New multi-agent trade proposals are halted. Resetting will re-arm Aegis Guardian for normal execution.
              </p>
            </div>

            <button
              onClick={() => {
                onResetKillSwitch();
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-green-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>RESUME TRADING</span>
            </button>
          </div>
        ) : (
          /* Trigger Flow */
          <div className="space-y-4 text-xs">
            <p className="text-gray-400 leading-relaxed font-mono text-[11px]">
              Select containment severity level. This action immediately overrides all automated AI agent trading logic.
            </p>

            <div className="space-y-2.5">
              <label
                onClick={() => setSelectedAction('STOP_NEW_ONLY')}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedAction === 'STOP_NEW_ONLY'
                    ? 'bg-[#0B0B0B] border-[#FF7A00]'
                    : 'bg-[#0B0B0B] border-[#1A1A1A]'
                }`}
              >
                <input
                  type="radio"
                  name="killAction"
                  checked={selectedAction === 'STOP_NEW_ONLY'}
                  onChange={() => setSelectedAction('STOP_NEW_ONLY')}
                  className="mt-0.5 accent-[#FF7A00]"
                />
                <div>
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider block">Halt New Trades Only</span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block leading-normal">
                    Existing positions remain open managed by trailing stops. No new proposals will be created.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setSelectedAction('CLOSE_ALL_POSITIONS')}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedAction === 'CLOSE_ALL_POSITIONS'
                    ? 'bg-[#0B0B0B] border-red-500'
                    : 'bg-[#0B0B0B] border-[#1A1A1A]'
                }`}
              >
                <input
                  type="radio"
                  name="killAction"
                  checked={selectedAction === 'CLOSE_ALL_POSITIONS'}
                  onChange={() => setSelectedAction('CLOSE_ALL_POSITIONS')}
                  className="mt-0.5 accent-red-500"
                />
                <div>
                  <span className="font-bold text-red-400 text-[11px] uppercase tracking-wider block">Emergency Full Liquidation</span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block leading-normal">
                    Immediately close all open MT5 market positions at current bid/ask and halt all trading.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-[#0B0B0B] hover:bg-[#1f1f1f] text-gray-400 border border-[#1A1A1A] font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  onTriggerKillSwitch(selectedAction);
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer"
              >
                CONFIRM HALT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
