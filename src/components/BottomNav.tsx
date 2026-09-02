import React from 'react';
import { Wallet, LineChart, Cpu, Shield, Clock } from 'lucide-react';

export type TabType = 'wallet' | 'markets' | 'agents' | 'risk' | 'history';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingProposalsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingProposalsCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={18} />, badge: pendingProposalsCount },
    { id: 'markets', label: 'Markets', icon: <LineChart size={18} /> },
    { id: 'agents', label: 'Agents', icon: <Cpu size={18} /> },
    { id: 'risk', label: 'Aegis Risk', icon: <Shield size={18} /> },
    { id: 'history', label: 'History', icon: <Clock size={18} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 sm:h-20 border-t border-[#1A1A1A] bg-[#0B0B0B]/95 backdrop-blur-xl px-4 sm:px-10 flex items-center justify-between pb-safe">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-around sm:justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 relative py-1 px-2 ${
                isActive
                  ? 'opacity-100'
                  : 'opacity-40 hover:opacity-100'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-1.5 h-1.5 rounded-full mb-0.5 transition-all ${
                    isActive
                      ? 'bg-[#FF7A00] shadow-[0_0_8px_#FF7A00]'
                      : 'bg-white group-hover:bg-[#FF7A00]'
                  }`}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-3 min-w-[14px] h-3.5 px-1 rounded-full bg-[#FF7A00] text-black text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_#FF7A00] animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest">
                <span className={isActive ? 'text-[#FF7A00]' : 'text-white'}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
