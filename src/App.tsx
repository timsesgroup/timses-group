import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { DocumentForm } from './components/DocumentForm';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DocumentList } from './components/DocumentList';
import { AppsScriptStudio } from './components/AppsScriptStudio';
import { SettingsModal } from './components/SettingsModal';
import { DocumentEntry, AppSettings, DashboardSummary, SyncResponse } from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    spreadsheetId: '1YOdn-LDDYayVTqhb2KeXJ2OPnZdwhi4mrDZRKeK_FtY',
    sheetName: 'Sheet1',
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbykk73yuNeZxdyPNjW_B0cbXD1wY5tEpP_DfvMc4IYX-k5EMQUOZ9uMx3YqR5wpokmYHA/exec',
    defaultNotificationEmail: 'geminitimses@gmail.com',
    enableAutoEmail: true,
    emailSubjectTemplate: '[Ex TIMSES] Akun Baru: {title} ({category})',
    emailBodyTemplate: 'Notifikasi otomatis akun.',
    autoSyncToSheet: true,
    senderName: 'Ex TIMSES'
  });

  const [health, setHealth] = useState<{ oauthConnected: boolean; hasAppsScriptUrl: boolean } | null>(null);
  const [entries, setEntries] = useState<DocumentEntry[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [selectedWeb, setSelectedWeb] = useState<string>('ALL');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth({
        oauthConnected: data.oauthConnected,
        hasAppsScriptUrl: data.hasAppsScriptUrl
      });
    } catch (e) {
      console.warn('Health check error:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) setSettings(data);
    } catch (e) {
      console.warn('Settings fetch error:', e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (e) {
      console.warn('Documents fetch error:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success && data.summary) {
        setDashboardSummary(data.summary);
      }
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchHealth(), fetchSettings(), fetchDocuments(), fetchStats()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();

    // Auto-sync from Google Sheet every 5 seconds
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/documents/sync-sheet', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.entries) {
          setEntries(data.entries);
        }
        fetchStats();
        fetchHealth();
      } catch (err) {
        console.debug('5s auto sync tick:', err);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/documents/sync-sheet', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.entries) setEntries(data.entries);
        await fetchStats();
        showToast(data.message || 'Data berhasil disinkronkan dari Google Sheets!');
      } else {
        showToast(data.message || 'Gagal sinkronisasi data dari Google Sheet.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Gagal sinkronisasi data.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFormSubmitSuccess = (res: SyncResponse) => {
    if (res.entry) {
      setEntries(prev => [res.entry!, ...prev]);
    }
    fetchStats();
    showToast(`Dokumen "${res.entry?.title || 'Baru'}" berhasil dikirim & dicatat!`);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast('Pengaturan berhasil diperbarui!');
      }
    } catch (e: any) {
      showToast('Gagal menyimpan pengaturan.', 'error');
    }
  };

  const pendingCount = entries.filter(e => e.status === 'Ditangguhkan').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Toast Notification Bar */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-bounce-short">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-start justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}>
            <div className="flex items-center gap-2 text-xs font-semibold">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        settings={settings}
        health={health}
        onSyncSheet={handleSyncSheet}
        isSyncing={isSyncing}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Navigation Tabs Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'form' && (
          <DocumentForm
            settings={settings}
            selectedWeb={selectedWeb}
            onSubmitSuccess={handleFormSubmitSuccess}
            onNavigateDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            summary={dashboardSummary}
            entries={entries}
            isLoading={isLoading}
            onRefresh={fetchStats}
            onNavigateForm={() => setActiveTab('form')}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentList
            entries={entries}
            settings={settings}
            onRefresh={handleSyncSheet}
            isRefreshing={isSyncing}
          />
        )}

        {activeTab === 'apps-script' && (
          <AppsScriptStudio
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <span>Ex TIMSES &copy; {new Date().getFullYear()} - Web Data Input &amp; Real-Time Engine</span>
        </div>
      </footer>

    </div>
  );
}

