import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  ExternalLink, 
  FileSpreadsheet, 
  Mail, 
  Settings, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Save,
  Globe
} from 'lucide-react';
import { AppSettings } from '../types';

interface AppsScriptStudioProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const AppsScriptStudio: React.FC<AppsScriptStudioProps> = ({ settings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [scriptCode, setScriptCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testEmail, setTestEmail] = useState(settings.defaultNotificationEmail || 'geminitimses@gmail.com');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; success?: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/apps-script-code')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.code) {
          setScriptCode(data.code);
        }
      })
      .catch(err => console.error('Failed to fetch GAS code:', err));
  }, []);

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
          title: 'Email Uji Coba Integrasi Ex TIMSES',
          category: 'Memorandum',
          refNumber: 'TEST/NOTIF/001',
          submitter: 'Ex TIMSES System Test',
          recipient: 'Penerima Uji Coba',
          amount: 100000,
          priority: 'Sedang',
          docDate: new Date().toISOString().split('T')[0],
          status: 'Disetujui',
          notes: 'Ini adalah tes otomatis notifikasi email dari Ex TIMSES.',
          notificationEmail: testEmail
        })
      });

      const data = await res.json();
      if (data.success && data.emailSent) {
        setTestStatus({
          loading: false,
          success: true,
          message: `Email tes berhasil terkirim ke ${testEmail}!`
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: data.errors?.emailError || 'Email tidak dapat terkirim via Gmail API.'
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
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Google Apps Script Hub
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Integrasi Google Apps Script &amp; Notifikasi Email</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Kelola konfigurasi target Google Sheets, kode Apps Script otomatis, dan notifikasi email real-time.
          </p>
        </div>

        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Buka Google Sheet Target</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid: Instructions & Code Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Apps Script Code Generator */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Kode Google Apps Script (.gs)
              </h3>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Kode Script
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Salin kode Apps Script di bawah ini lalu tempelkan ke Google Sheets Anda untuk mengaktifkan Web App Endpoint.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[11px] font-mono leading-relaxed h-72 overflow-y-auto border border-slate-800">
                {scriptCode}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>✓ Pre-configured dengan Sheet Name: <strong>{localSettings.sheetName || 'Sheet1'}</strong></span>
            <span>Trigger: doPost(e) &amp; MailApp</span>
          </div>
        </div>

        {/* Step-by-step tutorial */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            Panduan Cara Memasang Google Apps Script (5 Langkah Cepat)
          </h3>

          <ol className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                1
              </span>
              <div>
                <strong className="text-slate-900 block">Buka Google Sheets Target</strong>
                Buka file Google Sheet Anda di browser, lalu klik menu <strong className="text-emerald-700">Extensions / Ekstensi</strong> &rarr; <strong className="text-emerald-700">Apps Script</strong>.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                2
              </span>
              <div>
                <strong className="text-slate-900 block">Tempelkan Kode Script</strong>
                Hapus semua kode bawaan di editor `Code.gs`, lalu <strong>Salin Kode Script</strong> dari kotak sebelah kiri dan tempelkan.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                3
              </span>
              <div>
                <strong className="text-slate-900 block">Deploy sebagai Web App</strong>
                Klik tombol <strong className="text-emerald-700">Deploy &rarr; New Deployment</strong>. Pilih jenis <strong>Web App</strong>.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                4
              </span>
              <div>
                <strong className="text-slate-900 block">Atur Akses "Anyone" / Siapa Saja</strong>
                Pada bagian <i>Who has access</i>, pilih <strong className="text-emerald-700">Anyone (Siapa saja)</strong>. Lalu klik Deploy dan izinkan hak akses.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                5
              </span>
              <div>
                <strong className="text-slate-900 block">Salin Web App URL Ke Aplikasi Ini</strong>
                Salin Web App URL hasil deployment dan masukkan ke formulir pengaturan di bawah untuk sinkronisasi 2-arah.
              </div>
            </li>
          </ol>
        </div>

      </div>

      {/* Settings Form Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Pengaturan Google Workspace &amp; Email Notifikasi
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasikan spreadsheet target dan alamat email pengiriman notifikasi.
            </p>
          </div>

          {saveSuccess && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pengaturan Tersimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Spreadsheet ID Target
            </label>
            <input
              type="text"
              required
              value={localSettings.spreadsheetId}
              onChange={e => setLocalSettings({ ...localSettings, spreadsheetId: e.target.value })}
              placeholder="1d_wduqWGfFZqj2i2tc9X2UCLO2Cac5Rjy0bhMngcZXk"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[11px] text-slate-500 mt-1">ID spreadsheet dari URL Google Sheet Anda.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Sheet / Tab Target
            </label>
            <input
              type="text"
              value={localSettings.sheetName}
              onChange={e => setLocalSettings({ ...localSettings, sheetName: e.target.value })}
              placeholder="Sheet1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default tab nama sheet (mis. Sheet1 / DataDokumen).</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Default Notifikasi Otomatis
            </label>
            <input
              type="email"
              value={localSettings.defaultNotificationEmail}
              onChange={e => setLocalSettings({ ...localSettings, defaultNotificationEmail: e.target.value })}
              placeholder="geminitimses@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Google Apps Script Web App URL (Opsional)
            </label>
            <input
              type="url"
              value={localSettings.appsScriptUrl}
              onChange={e => setLocalSettings({ ...localSettings, appsScriptUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableEmail"
              checked={localSettings.enableAutoEmail}
              onChange={e => setLocalSettings({ ...localSettings, enableAutoEmail: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="enableEmail" className="text-xs font-semibold text-slate-800">
              Aktifkan Notifikasi Email Otomatis Setiap Data Berhasil Dikirim
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 self-end sm:self-auto"
          >
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </button>

        </div>
      </form>

      {/* Test Email Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Mail className="w-4 h-4 text-cyan-600" />
          Uji Coba Pengiriman Notifikasi Email
        </h3>
        <p className="text-xs text-slate-500">
          Kirim sampel email notifikasi ke alamat tujuan untuk menguji fungsionalitas email.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-lg">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="masukkan@email.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSendTestEmail}
            disabled={testStatus?.loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim Tes Email
          </button>
        </div>

        {testStatus && (
          <div className={`mt-2 p-3 rounded-xl border text-xs ${
            testStatus.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : testStatus.loading
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {testStatus.message}
          </div>
        )}
      </div>

    </div>
  );
};
