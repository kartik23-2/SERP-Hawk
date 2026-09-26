'use client';

import React from 'react';
import { PhoneCall, UserPlus, Cpu, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenCustomerModal: () => void;
  activeTab: 'calls' | 'customers';
  setActiveTab: (tab: 'calls' | 'customers') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCustomerModal,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <PhoneCall className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                HawkAI
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Agentic Calling v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous AI Voice Calling & Commercial RO Lead Qualification Engine
            </p>
          </div>
        </div>

        {/* Navigation & Action */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'calls'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Call History
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Customer Directory
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>GenAI Voice Active</span>
          </div>

          <button
            onClick={onOpenCustomerModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

      </div>
    </header>
  );
};
