import { WebsiteLogo } from './WebsiteLogo';
import React, { useState } from 'react';
import { 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Link2, 
  AlertTriangle,
  X,
  Save,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Globe
} from 'lucide-react';
import { DocumentEntry, AppSettings } from '../types';

interface IdReffManagerProps {
  entries: DocumentEntry[];
  settings: AppSettings;
  selectedWeb?: string;
  onRefreshAll: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const IdReffManager: React.FC<IdReffManagerProps> = ({
  entries,
  settings,
  selectedWeb,
  onRefreshAll,
  showToast
}) => {
  // Website Filter State
  const [selectedWebFilter, setSelectedWebFilter] = useState<string>(selectedWeb && selectedWeb !== 'ALL' ? selectedWeb : 'ALL');

  // Form State for Adding New ID REFF
  const [newIdReff, setNewIdReff] = useState('');
  const [newWebsite, setNewWebsite] = useState('studiobet78');
  const [newPlatform, setNewPlatform] = useState('INSTAGRAM');
  const [newKonten, setNewKonten] = useState('BRANDING');
  const [newNotes, setNewNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Edit ID REFF Modal/State
  const [editingOldId, setEditingOldId] = useState<string | null>(null);
  const [editingNewId, setEditingNewId] = useState('');
  const [isSubmittingEditId, setIsSubmittingEditId] = useState(false);

  // Delete ID REFF Modal/State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState(false);

  // Edit Single Post Entry Modal/State
  const [editingEntry, setEditingEntry] = useState<DocumentEntry | null>(null);
  const [isSavingEntry, setIsSavingEntry] = useState(false);

  // Delete Single Post Entry State
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<DocumentEntry | null>(null);

  // Expanded ID REFF cards - Default to expanded so users immediately see content, platform, edit & delete buttons
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const isIdExpanded = (id: string) => expandedIds[id] !== false;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !isIdExpanded(id) }));
  };

  // Websites list
  const knownWebsites = ['studiobet78', 'bigbet78', 'piala45', 'bambu189'];
  const discoveredWebs = Array.from(new Set(entries.map(e => e.website).filter(Boolean))) as string[];
  const websiteList = Array.from(new Set([...knownWebsites, ...discoveredWebs]));

  // Filter entries by website first
  const filteredEntriesByWeb = selectedWebFilter === 'ALL'
    ? entries
    : entries.filter(e => (e.website || 'studiobet78').toLowerCase() === selectedWebFilter.toLowerCase());

  // Group entries by ID REFF
  const idReffMap: Record<string, DocumentEntry[]> = {};
  filteredEntriesByWeb.forEach(e => {
    const id = e.idReff ? e.idReff.trim() : 'Unassigned';
    if (!idReffMap[id]) {
      idReffMap[id] = [];
    }
    idReffMap[id].push(e);
  });

  const allIds = Object.keys(idReffMap).sort();

  const filteredIds = allIds.filter(id => 
    id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idReffMap[id].some(item => 
      item.konten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.catatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.website || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle Add ID REFF
  const handleAddIdReff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdReff.trim()) {
      showToast('Mohon masukkan nama ID REFF!', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/id-reff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idReff: newIdReff.trim(),
          website: newWebsite,
          platform: newPlatform,
          konten: newKonten,
          notes: newNotes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `ID REFF "${newIdReff}" berhasil ditambahkan!`);
        setNewIdReff('');
        setNewNotes('');
        onRefreshAll();
      } else {
        showToast(data.message || 'Gagal menambahkan ID REFF.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke server.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Submit Edit ID REFF
  const handleSaveEditIdReff = async () => {
    if (!editingOldId || !editingNewId.trim()) {
      showToast('Mohon isi nama ID REFF baru!', 'error');
      return;
    }

    setIsSubmittingEditId(true);
    try {
      const res = await fetch(`/api/id-reff/${encodeURIComponent(editingOldId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newIdReff: editingNewId.trim() })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setEditingOldId(null);
        setEditingNewId('');
        onRefreshAll();
      } else {
        showToast(data.message || 'Gagal mengubah ID REFF.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses perubahan ID REFF.', 'error');
    } finally {
      setIsSubmittingEditId(false);
    }
  };

  // Handle Confirm Delete ID REFF
  const handleConfirmDeleteIdReff = async () => {
    if (!deletingId) return;

    setIsDeletingId(true);
    try {
      const res = await fetch(`/api/id-reff/${encodeURIComponent(deletingId)}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setDeletingId(null);
        onRefreshAll();
      } else {
        showToast(data.message || 'Gagal menghapus ID REFF.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke server.', 'error');
    } finally {
      setIsDeletingId(false);
    }
  };

  // Handle Update Single Document Entry
  const handleSaveEntryEdit = async () => {
    if (!editingEntry) return;

    setIsSavingEntry(true);
    try {
      const res = await fetch(`/api/documents/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEntry)
      });

      const data = await res.json();
      if (data.success) {
        showToast('Data akun berhasil diperbarui!');
        setEditingEntry(null);
        onRefreshAll();
      } else {
        showToast(data.message || 'Gagal menyimpan perubahan akun.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui akun.', 'error');
    } finally {
      setIsSavingEntry(false);
    }
  };

  // Handle Delete Single Document Entry
  const handleDeleteSingleEntry = async (entry: DocumentEntry) => {
    setDeletingEntryId(entry.id);
    try {
      const res = await fetch(`/api/documents/${entry.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        showToast('Akun berhasil dihapus!');
        setDeleteConfirmEntry(null);
        onRefreshAll();
      } else {
        showToast(data.message || 'Gagal menghapus akun.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke server.', 'error');
    } finally {
      setDeletingEntryId(null);
    }
  };

  const getWebsiteBadge = (website?: string) => {
    const web = (website || 'studiobet78').toLowerCase();
    return (
      <span className="px-2 py-1 rounded-md border border-slate-200 bg-white shadow-sm flex items-center justify-center w-24">
        <WebsiteLogo website={web} className="h-4 object-contain" />
      </span>
    );
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200">INSTAGRAM</span>;
      case 'TIKTOK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">TIKTOK</span>;
      case 'FANSPAGE FB':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">FANSPAGE FB</span>;
      case 'FACEBOOK PRO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">FACEBOOK PRO</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{platform}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wide">
              Manajemen ID REFF &amp; Akun
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 flex items-center gap-2.5">
              <User className="w-7 h-7 text-emerald-400" />
              Kelola ID REFF &amp; Sosial Media Per Web
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl mt-1">
              Filter data berdasarkan website/tab (studiobet78, bigbet78, piala45, bambu189), tambahkan ID REFF baru, atau kelola akun sosial media.
            </p>
          </div>

          <button
            onClick={onRefreshAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition shrink-0"
          >
            <RefreshCw className="w-4 h-4 text-emerald-300" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Website Filter Switcher */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-extrabold uppercase text-slate-800">Kelompokkan &amp; Filter Per Web:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedWebFilter('ALL')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              selectedWebFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🌐 Semua Website</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              {entries.length}
            </span>
          </button>

          {websiteList.map(web => {
            const count = entries.filter(e => (e.website || 'studiobet78').toLowerCase() === web.toLowerCase()).length;
            return (
              <button
                key={web}
                onClick={() => setSelectedWebFilter(web)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedWebFilter.toLowerCase() === web.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <WebsiteLogo website={web} className="h-5 object-contain" />
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  selectedWebFilter.toLowerCase() === web.toLowerCase() ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Card: Tambah ID REFF Baru */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3">
          <Plus className="w-5 h-5 text-emerald-600" />
          <h2>Tambah ID REFF Baru</h2>
        </div>

        <form onSubmit={handleAddIdReff} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Target Website */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Pilih Target Website <span className="text-rose-500">*</span>
            </label>
            <select
              value={newWebsite}
              onChange={e => setNewWebsite(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-emerald-800 bg-emerald-50/50 focus:border-emerald-500 outline-none transition"
            >
              {websiteList.map(web => (
                <option key={web} value={web}>🌐 {web}</option>
              ))}
            </select>
          </div>

          {/* Input ID REFF */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Input ID REFF <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newIdReff}
              onChange={e => setNewIdReff(e.target.value)}
              placeholder="Contoh: miya0812, albert_pro"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              required
            />
          </div>

          {/* Button Submit */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Menambahkan...' : 'Tambah ID REFF'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* List / Search Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Daftar ID REFF Terdaftar ({filteredIds.length} ID)
          </h3>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama ID REFF / akun..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-500 outline-none transition"
          />
        </div>
      </div>

      {/* List Cards for Each ID REFF */}
      {filteredIds.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <User className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Belum ada ID REFF yang cocok.</p>
          <p className="text-xs text-slate-400">Gunakan form di atas untuk menambahkan ID REFF baru.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIds.map(id => {
            const items = idReffMap[id] || [];
            const isExpanded = isIdExpanded(id);
            const platforms = Array.from(new Set(items.map(i => i.platform)));

            return (
              <div key={id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition">
                
                {/* ID Card Header */}
                <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(id)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs transition flex items-center gap-1 text-xs font-bold"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className="hidden sm:inline">{isExpanded ? 'Sembunyikan' : 'Tampilkan Detail'}</span>
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-extrabold text-slate-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">{id}</span>
                        {Array.from(new Set(items.map(i => i.website || 'studiobet78'))).map(w => (
                          <span key={w}>{getWebsiteBadge(w)}</span>
                        ))}
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                          {items.length} Akun
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {platforms.map(p => (
                          <span key={p}>{getPlatformBadge(p)}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ID Action Buttons (Edit ID REFF) */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setEditingOldId(id);
                        setEditingNewId(id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-2xs"
                      title="Ubah nama ID REFF ini"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit ID REFF</span>
                    </button>
                  </div>

                </div>

                {/* Sub-List / Cards of Postings for this ID REFF */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/30 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        Daftar Akun ({items.length}) untuk ID: <span className="text-slate-900 font-mono text-xs font-bold">{id}</span>
                      </h4>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 italic bg-white rounded-2xl border border-slate-200">Belum ada akun terdaftar untuk ID REFF ini.</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            
                            {/* Details Column */}
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                  {item.konten || 'BRANDING'}
                                </span>
                                {getPlatformBadge(item.platform || 'INSTAGRAM')}
                                {getWebsiteBadge(item.website)}
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  item.status === 'Dipublikasikan' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {item.status || 'Dipublikasikan'}
                                </span>
                                {item.tanggalPostingan && (
                                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                    📅 {item.tanggalPostingan}
                                  </span>
                                )}
                              </div>

                              {/* Notes & Link */}
                              <div className="space-y-1">
                                {item.catatan && (
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                    <strong className="text-slate-900">Catatan:</strong> {item.catatan}
                                  </p>
                                )}
                                {item.linkKonten && (
                                  <a 
                                    href={item.linkKonten} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 font-bold underline truncate max-w-full"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{item.linkKonten}</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons for this posting entry */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end">
                              <button
                                onClick={() => setEditingEntry(item)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
                                title="Edit Akun"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                <span>Edit Akun</span>
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Edit ID REFF */}
      {editingOldId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" /> Edit ID REFF
              </h3>
              <button onClick={() => setEditingOldId(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Mengubah nama ID REFF dari <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{editingOldId}</strong> akan otomatis memperbarui seluruh data akun yang terkait dengannya.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Nama ID REFF Baru</label>
              <input
                type="text"
                value={editingNewId}
                onChange={e => setEditingNewId(e.target.value)}
                placeholder="Masukkan nama ID REFF baru..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingOldId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditIdReff}
                disabled={isSubmittingEditId}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmittingEditId ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Edit Single Document Entry */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" /> Edit Data Akun
              </h3>
              <button onClick={() => setEditingEntry(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ID REFF</label>
                  <input
                    type="text"
                    value={editingEntry.idReff}
                    onChange={e => setEditingEntry({ ...editingEntry, idReff: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Platform</label>
                  <select
                    value={editingEntry.platform}
                    onChange={e => setEditingEntry({ ...editingEntry, platform: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-emerald-500 outline-none"
                  >
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="TIKTOK">TIKTOK</option>
                    <option value="FANSPAGE FB">FANSPAGE FB</option>
                    <option value="FACEBOOK PRO">FACEBOOK PRO</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Akun</label>
                  <select
                    value={editingEntry.konten}
                    onChange={e => setEditingEntry({ ...editingEntry, konten: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-emerald-500 outline-none"
                  >
                    <option value="BRANDING">BRANDING</option>
                    <option value="OVERLAY">OVERLAY</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingEntry.status}
                    onChange={e => setEditingEntry({ ...editingEntry, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-emerald-500 outline-none"
                  >
                    <option value="Dipublikasikan">Dipublikasikan</option>
                    <option value="Ditangguhkan">Ditangguhkan</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Akun</label>
                <input
                  type="text"
                  value={editingEntry.tanggalPostingan}
                  onChange={e => setEditingEntry({ ...editingEntry, tanggalPostingan: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Link Profil</label>
                <input
                  type="url"
                  value={editingEntry.linkKonten}
                  onChange={e => setEditingEntry({ ...editingEntry, linkKonten: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan</label>
                <textarea
                  rows={3}
                  value={editingEntry.catatan}
                  onChange={e => setEditingEntry({ ...editingEntry, catatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEntryEdit}
                disabled={isSavingEntry}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingEntry ? 'Menyimpan...' : 'Simpan Akun'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
