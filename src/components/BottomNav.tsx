import React from 'react';
import { PlusCircle, BarChart3, FileText, Settings } from 'lucide-react';

export type TabType = 'form' | 'dashboard' | 'documents' | 'apps-script';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCount?: number;
  onOpenSettings: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, pendingCount = 0, onOpenSettings }) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Statistik',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'form' as TabType,
      label: 'Input Akun',
      icon: PlusCircle,
      badge: null
    },
    {
      id: 'documents' as TabType,
      label: 'Daftar Akun',
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : null
    }
  ];

  return (
    <>
      {/* Desktop Sub-Header Navigation */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-md border-b border-blue-100/80 sticky top-16 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#0052FF] text-white shadow-md shadow-[#0052FF]/25 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-extrabold ${
                        isActive ? 'bg-white text-[#0052FF]' : 'bg-blue-100 text-[#0052FF]'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-[#0052FF] text-xs font-bold border border-blue-200/80 transition"
            >
              <Settings className="w-3.5 h-3.5 text-[#0052FF]" />
              <span>Setingan Sheet</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-blue-100 px-3 py-2 shadow-2xl">
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'text-[#0052FF] bg-blue-50/90 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#0052FF]' : 'text-slate-400'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-bold shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 leading-tight text-center truncate max-w-full font-bold">
                  {tab.label.replace('Daftar ', '').replace('Akun', 'Post')}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};


