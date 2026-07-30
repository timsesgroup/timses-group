import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  FileSpreadsheet, 
  Code2, 
  Mail, 
  Copy, 
  Check, 
  Save, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Globe,
  RefreshCw
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'script' | 'email'>('config');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [scriptCode, setScriptCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testEmail, setTestEmail] = useState(settings.defaultNotificationEmail || 'geminitimses@gmail.com');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; success?: boolean } | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/apps-script-code')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.code) {
            setScriptCode(data.code);
          }
        })
        .catch(err => console.error('Failed to fetch GAS code:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert('Masukkan alamat email untuk tes.');
      return;
    }

    setTestStatus({ loading: true, message: 'Mengirim email uji coba...' });

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          konten: 'BRANDING',
          platform: 'INSTAGRAM',
          idReff: 'tes_email',
          status: 'Dipublikasikan',
          tanggalPostingan: new Date().toLocaleDateString('id-ID'),
          linkKonten: 'https://instagram.com',
          catatan: 'Tes koneksi notifikasi email dari Ex TIMSES.',
          notificationEmail: testEmail
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestStatus({
          loading: false,
          success: true,
          message: `Email tes berhasil terkirim / diproses untuk ${testEmail}!`
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: data.errors?.emailError || 'Gagal mengirim email tes.'
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Gagal mengirim email tes.'
      });
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${localSettings.spreadsheetId}/edit`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pengaturan Integrasi Google Sheet &amp; Web App</h3>
              <p className="text-xs text-slate-400">Konfigurasi spreadsheet, URL Web App Apps Script, &amp; notifikasi email</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'config'
                ? 'bg-white border-slate-200 text-emerald-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Target Google Sheet &amp; Web App</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'script'
                ? 'bg-white border-slate-200 text-emerald-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kode Generator Apps Script</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'email'
                ? 'bg-white border-slate-200 text-emerald-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Notifikasi Email</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Configuration */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-5">
              
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengaturan berhasil disimpan! Sistem akan otomatis mensinkronkan data.</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={localSettings.spreadsheetId}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    placeholder="Contoh: 1YOdn-LDDYayVTqhb2KeXJ2OPnZdwhi4mrDZRKeK_FtY"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ID unik file Google Sheet Anda (diambil dari URL antara `/d/` dan `/edit`).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Apps Script Web App URL (Rekomendasi Utama)
                  </label>
                  <input
                    type="url"
                    value={localSettings.appsScriptUrl || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, appsScriptUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dapatkan URL ini setelah mendeploy kode Apps Script sebagai <em>Web App (Anyone)</em> pada Google Sheet Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={localSettings.autoSyncToSheet}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, autoSyncToSheet: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="autoSync" className="text-xs font-medium text-slate-800 cursor-pointer">
                      Sinkronkan Otomatis Setiap 5 Detik
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <input
                      type="checkbox"
                      id="enableEmail"
                      checked={localSettings.enableAutoEmail}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, enableAutoEmail: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="enableEmail" className="text-xs font-medium text-slate-800 cursor-pointer">
                      Aktifkan Notifikasi Email Otomatis
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Buka Google Sheet Target</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: Apps Script Code Generator */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Kode Apps Script (.gs)</h4>
                  <p className="text-xs text-slate-500">Salin kode ini dan pasang pada Google Sheets Extensions &gt; Apps Script</p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-2xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Kode
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-[11px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-72 select-all">
                  {scriptCode || '// Loading script generator...'}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold">📋 Langkah Mudah Deploy:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-blue-800">
                  <li>Buka Google Sheet Anda &gt; Menu <strong>Extensions / Ekstensi</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Hapus kode bawaan dan tempelkan kode di atas.</li>
                  <li>Klik <strong>Deploy</strong> &gt; <strong>New Deployment</strong> &gt; Pilih Jenis <strong>Web App</strong>.</li>
                  <li>Atur <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong>.</li>
                  <li>Klik <strong>Deploy</strong> dan salin Web App URL ke tab Pengaturan di atas.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Email Notification Setup */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Receiver Default
                </label>
                <input
                  type="email"
                  value={localSettings.defaultNotificationEmail || ''}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultNotificationEmail: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  placeholder="geminitimses@gmail.com"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Uji Coba Pengiriman Email Notifikasi</h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    placeholder="Masukkan email tujuan tes"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={testStatus?.loading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shrink-0 disabled:opacity-50"
                  >
                    {testStatus?.loading ? 'Mengirim...' : 'Kirim Email Tes'}
                  </button>
                </div>

                {testStatus && (
                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    testStatus.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {testStatus.message}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
