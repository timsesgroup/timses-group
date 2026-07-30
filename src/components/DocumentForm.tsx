import { WebsiteLogo } from './WebsiteLogo';
import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  Mail, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Trash2,
  Paperclip,
  Calendar,
  User,
  Bookmark,
  Share2,
  Tag,
  Link2,
  FileText,
  Globe
} from 'lucide-react';
import { FormSubmissionPayload, ContentCategory, PlatformType, PostStatus, SyncResponse, AppSettings } from '../types';

interface DocumentFormProps {
  settings: AppSettings;
  selectedWeb?: string;
  onSubmitSuccess: (res: SyncResponse) => void;
  onNavigateDashboard: () => void;
}

const CONTENT_TYPES: ContentCategory[] = [
  'BRANDING',
  'OVERLAY'
];

const PLATFORMS: PlatformType[] = [
  'INSTAGRAM',
  'TIKTOK',
  'FANSPAGE FB',
  'FACEBOOK PRO'
];

const SAMPLE_ID_REFFS = [
  'miya0812',
  'ojolkeras',
  'zamcuyy',
  'iyan77',
  'cuangki78'
];

export const DocumentForm: React.FC<DocumentFormProps> = ({ settings, selectedWeb, onSubmitSuccess, onNavigateDashboard }) => {
  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const defaultWeb = selectedWeb && selectedWeb !== 'ALL' ? selectedWeb : 'studiobet78';

  const initialFormState: FormSubmissionPayload = {
    konten: '' as any,
    platform: '' as any,
    idReff: '',
    status: '',
    tanggalPostingan: '',
    linkKonten: '',
    catatan: '',
    website: defaultWeb,
    notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
  };

  const [formData, setFormData] = useState<FormSubmissionPayload>(() => {
    return initialFormState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<SyncResponse | null>(null);

  const handleChange = (field: keyof FormSubmissionPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatIsoToDateStr = (rawDate: string) => {
    if (!rawDate) return getTodayFormatted();
    if (rawDate.includes('/')) return rawDate;
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return rawDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idReff.trim()) {
      alert('Mohon isi ID REFF / Nama Pengguna.');
      return;
    }

    setIsSubmitting(true);
    setLastResponse(null);

    try {
      const rawText = formData.linkKonten || '';
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      let links = rawText.match(urlRegex) || [];
      
      if (links.length === 0) {
        links = rawText.split('\n').map(l => l.trim()).filter(l => l);
      }
      if (links.length === 0) links.push(''); // Minimal satu entri kalau kosong

      let finalResData: SyncResponse | null = null;
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const link of links) {
        const payload: FormSubmissionPayload = {
          ...formData,
          linkKonten: link,
          konten: formData.konten || 'BRANDING',
          platform: formData.platform || 'INSTAGRAM',
          status: formData.status || 'Dipublikasikan',
          tanggalPostingan: formatIsoToDateStr(formData.tanggalPostingan),
          notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
        };

        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data: SyncResponse = await res.json();
        finalResData = data;
        
        if (data.success) {
           totalSuccess++;
        } else {
           totalFailed++;
        }
      }

      if (finalResData) {
        if (links.length > 1) {
          finalResData.message = `Berhasil menyimpan ${totalSuccess} link sebagai entri terpisah.${totalFailed > 0 ? ` (${totalFailed} gagal)` : ''}`;
          if (totalSuccess > 0) finalResData.success = true;
        }
        
        setLastResponse(finalResData);

        if (finalResData.success) {
          localStorage.removeItem('content_form_draft');
          onSubmitSuccess(finalResData);

          setFormData({
            ...initialFormState,
            website: formData.website,
            notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
          });
        }
      }
    } catch (err: any) {
      setLastResponse({
        success: false,
        message: err.message || 'Gagal mengirim data akun ke server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-10">
      
      {/* Header Banner */}
      <div className="mb-6 bg-gradient-to-r from-[#0A0B0D] via-slate-900 to-[#0052FF]/90 text-white p-6 rounded-3xl shadow-xl shadow-blue-950/20 border border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-[#0052FF]/30 text-sky-300 border border-[#0052FF]/50 flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3 text-sky-400" /> Web Input to Google Sheet (7 Kolom)
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">Input Akun Real-Time</h2>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            Formulir otomatis disesuaikan dengan struktur Google Sheet: Konten, PLATFORM, ID REFF, Status, Tanggal akun, LINK PROFIL, &amp; CATATAN.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {lastResponse && (
        <div className={`mb-6 p-5 rounded-3xl border ${
          lastResponse.success 
            ? 'bg-blue-50/90 border-blue-200 text-[#0052FF]' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start gap-3">
            {lastResponse.success ? (
              <CheckCircle2 className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-bold text-sm">{lastResponse.message}</h4>
              
              {lastResponse.success && lastResponse.entry && (
                <div className="mt-2 pt-2 border-t border-blue-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">ID System:</span>{' '}
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-300 font-bold text-[#0052FF]">
                      {lastResponse.entry.id}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Google Sheet:</span>{' '}
                    {lastResponse.sheetSynced ? (
                      <span className="text-[#0052FF] font-bold">
                        ✓ Terkait pada Baris #{lastResponse.sheetRow || 'Terbaru'}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold">Dalam antrean sync</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Notifikasi Email:</span>{' '}
                    {lastResponse.emailSent ? (
                      <span className="text-[#0052FF] font-bold">
                        ✓ Email terkirim ke {lastResponse.entry.notificationEmail}
                      </span>
                    ) : (
                      <span className="text-slate-600">Email diabaikan / belum dikirim</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-[#0052FF] hover:underline"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#0052FF]" />
                      Buka Google Sheet Target
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {lastResponse.errors?.sheetError && (
                <div className="mt-2 p-3 rounded-2xl bg-amber-100/80 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold">⚠️ Google Sheet Notice:</p>
                  <p className="mt-0.5">{lastResponse.errors.sheetError}</p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    <strong>Saran:</strong> Jika OAuth belum terhubung, buka tab <strong>"Integrasi Apps Script"</strong> dan tempelkan Web App URL Google Apps Script Anda untuk sinkronisasi otomatis.
                  </p>
                </div>
              )}

              {lastResponse.errors?.emailError && (
                <div className="mt-2 p-3 rounded-2xl bg-amber-100/80 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold">📧 Notifikasi Email Notice:</p>
                  <p className="mt-0.5">{lastResponse.errors.emailError}</p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    <strong>Saran:</strong> Pastikan Web App URL Apps Script dipasang di menu Integrasi Apps Script, atau terhubung ke Google OAuth dengan izin Gmail.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-blue-100 overflow-hidden">
        
        <div className="p-6 sm:p-8 space-y-6">

          {/* Website Selection Bar */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <label className="block text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#0052FF]" />
              Target Website / Tab Google Sheet <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {['studiobet78', 'bigbet78', 'piala45', 'bambu189'].map(web => (
                <button
                  key={web}
                  type="button"
                  onClick={() => handleChange('website', web)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black border transition-all ${
                    formData.website === web
                      ? 'bg-[#0052FF] border-[#0052FF] text-white shadow-md shadow-[#0052FF]/25 scale-[1.02]'
                      : 'bg-white border-blue-200/80 text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <WebsiteLogo website={web} className="h-5 object-contain" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Data akan dicatat ke tab sheet <strong className="text-[#0052FF] font-mono">'{formData.website || 'studiobet78'}'</strong> di Google Sheet.
            </p>
          </div>

          {/* Row 1: Konten & PLATFORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#0052FF]" />
                Jenis Konten <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.konten || ''}
                onChange={e => handleChange('konten', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-bold text-slate-900 outline-none transition bg-white"
              >
                <option value="">-- Pilih Jenis Konten --</option>
                {CONTENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom A di Google Sheet (mis. BRANDING, PROMOSI).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-[#0052FF]" />
                PLATFORM <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.platform || ''}
                onChange={e => handleChange('platform', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-bold text-slate-900 outline-none transition bg-white"
              >
                <option value="">-- Pilih PLATFORM --</option>
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom B di Google Sheet (mis. INSTAGRAM, TIKTOK).</p>
            </div>

          </div>

          {/* Row 2: ID REFF & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ID REFF / User Referensi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.idReff}
                onChange={e => handleChange('idReff', e.target.value)}
                placeholder="Masukkan ID REFF..."
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-bold text-slate-900 outline-none transition bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Status Publikasi
              </label>
              <select
                value={formData.status || ''}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-bold text-slate-900 outline-none transition bg-white"
              >
                <option value="">-- Pilih Status --</option>
                <option value="Dipublikasikan">✅ Dipublikasikan</option>
                <option value="Ditangguhkan">⏸️ Ditangguhkan</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom D di Google Sheet.</p>
            </div>

          </div>

          {/* Row 3: Tanggal Akun & LINK PROFIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal Akun (Pilih Kalender)
              </label>
              <input
                type="date"
                value={formData.tanggalPostingan}
                onChange={e => handleChange('tanggalPostingan', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-mono font-bold text-slate-900 outline-none transition bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Pilih tanggal akun dari kalender.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-[#0052FF]" />
                LINK PROFIL (URL)
              </label>
              <textarea
                rows={3}
                value={formData.linkKonten}
                onChange={e => handleChange('linkKonten', e.target.value)}
                placeholder="https://...&#10;https://... (Pisahkan dengan Enter untuk input multi-link)"
                className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm font-semibold text-slate-900 outline-none transition bg-white resize-y"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom F. Input banyak link akan otomatis dibuatkan baris/entri terpisah.</p>
            </div>

          </div>

          {/* Row 4: CATATAN */}
          <div className="pt-2 border-t border-blue-100">
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              CATATAN / Tanggal Mulai
            </label>
            <textarea
              rows={3}
              value={formData.catatan}
              onChange={e => handleChange('catatan', e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              className="w-full px-4 py-3 rounded-2xl border border-blue-200/80 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 text-sm text-slate-900 outline-none transition resize-none bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Kolom G di Google Sheet.</p>
          </div>

        </div>

        {/* Action Footer Bar */}
        <div className="bg-blue-50/50 px-6 py-5 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-[#0052FF]" />
            <span>Target Sheet ID: <strong className="text-slate-800 font-mono text-[11px]">1YOdn-LDDY...</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-5 py-3 rounded-2xl border border-blue-200 bg-white text-slate-700 text-xs font-bold hover:bg-blue-50 transition w-full sm:w-auto text-center"
            >
              Lihat Dasbor Statistik
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-2xl bg-[#0052FF] hover:bg-[#0045E0] text-white text-sm font-extrabold shadow-lg shadow-[#0052FF]/25 transition flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim
                </>
              )}
            </button>
          </div>

        </div>

      </form>

    </div>
  );
};

