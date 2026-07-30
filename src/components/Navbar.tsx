import React from 'react';
import { FileSpreadsheet, Mail, CheckCircle2, RefreshCw, Settings, Zap } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  settings: AppSettings;
  health: { oauthConnected: boolean; hasAppsScriptUrl: boolean } | null;
  onSyncSheet: () => void;
  isSyncing: boolean;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ settings, health, onSyncSheet, isSyncing, onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0A0B0D]/90 backdrop-blur-xl text-white border-b border-blue-900/30 shadow-lg shadow-blue-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-[#0052FF]/30 font-bold text-xl transition-transform hover:scale-105 overflow-hidden">
            <img src="/logo.png" alt="Ex TIMSES Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-none">
                Ex TIMSES
              </h1>
            </div>
            {/* 
               
             */}
          </div>
        </div>

        {/* Sync Status & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Live Auto-Sync Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-[11px] text-sky-300 font-medium shadow-inner">
            <Zap className="w-3 h-3 text-[#0052FF] animate-pulse" />
            <span>Auto-Sync 5s</span>
          </div>

          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
            {health?.oauthConnected ? (
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                OAuth Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Sheet Sync Active
              </span>
            )}
            
            <span className="text-slate-700">|</span>

            {settings.enableAutoEmail ? (
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <Mail className="w-3.5 h-3.5" />
                Auto Email
              </span>
            ) : (
              <span className="text-slate-400">Email OFF</span>
            )}
          </div>

          {/* Manual Sync Button */}
          <button
            onClick={onSyncSheet}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition shadow-2xs disabled:opacity-50 active:scale-95"
            title="Tarik data terbaru sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Sync</span>
          </button>

          {/* Dedicated Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#0052FF] hover:bg-[#0045E0] text-white shadow-md shadow-[#0052FF]/30 transition active:scale-95"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};


