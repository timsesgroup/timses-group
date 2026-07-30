import { WebsiteLogo } from './WebsiteLogo';
import React, { useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  X,
  FileText,
  Calendar,
  Tag,
  User,
  Link2,
  Users,
  List,
  ChevronDown,
  ChevronRight,
  Globe,
  Edit3,
  Save,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { DocumentEntry, AppSettings, PostStatus } from '../types';

interface DocumentListProps {
  entries: DocumentEntry[];
  settings: AppSettings;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  entries,
  settings,
  onRefresh,
  isRefreshing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWebsiteFilter, setSelectedWebsiteFilter] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedKonten, setSelectedKonten] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedIdReffFilter, setSelectedIdReffFilter] = useState<string>('ALL');
  const [groupByReff, setGroupByReff] = useState<boolean>(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedDoc, setSelectedDoc] = useState<DocumentEntry | null>(null);

  // Edit state
  const [editingDoc, setEditingDoc] = useState<DocumentEntry | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(prev => prev?.text === text ? null : prev);
    }, 3500);
  };

  const confirmAndDeleteDoc = async (doc: DocumentEntry) => {
    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Akun berhasil dihapus!');
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc(null);
        }
        setDeleteConfirmDoc(null);
        onRefresh();
      } else {
        showToast(data.message || 'Gagal menghapus akun.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghubungi server untuk menghapus akun.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (doc: DocumentEntry) => {
    setEditingDoc({ ...doc });
    setEditMessage(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    if (!editingDoc.idReff.trim()) {
      setEditMessage({ type: 'error', text: 'ID REFF tidak boleh kosong.' });
      return;
    }

    setIsSavingEdit(true);
    setEditMessage(null);

    try {
      const res = await fetch(`/api/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDoc)
      });

      const data = await res.json();
      if (data.success) {
        setEditMessage({ type: 'success', text: data.message || 'Akun berhasil diperbarui & disinkronkan ke Google Sheet!' });
        setTimeout(() => {
          setEditingDoc(null);
          setEditMessage(null);
          onRefresh();
        }, 1200);
      } else {
        setEditMessage({ type: 'error', text: data.message || 'Gagal memperbarui akun.' });
      }
    } catch (err: any) {
      setEditMessage({ type: 'error', text: err.message || 'Gagal menghubungi server untuk update.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Extract unique ID REFF list and Website list for filter dropdowns
  const idReffList = Array.from(new Set(entries.map(e => e.idReff).filter(Boolean))).sort();
  const knownWebsites = ['studiobet78', 'bigbet78', 'piala45', 'bambu189'];
  const discoveredWebs = Array.from(new Set(entries.map(e => e.website).filter(Boolean))) as string[];
  const websiteList = Array.from(new Set([...knownWebsites, ...discoveredWebs]));

  const filteredEntries = entries.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      e.idReff.toLowerCase().includes(term) ||
      e.konten.toLowerCase().includes(term) ||
      e.platform.toLowerCase().includes(term) ||
      e.catatan.toLowerCase().includes(term) ||
      e.linkKonten.toLowerCase().includes(term) ||
      (e.website || '').toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(term);

    const matchesWebsite = selectedWebsiteFilter === 'ALL' || (e.website || 'studiobet78').toLowerCase() === selectedWebsiteFilter.toLowerCase();
    const matchesPlatform = selectedPlatform === 'ALL' || e.platform === selectedPlatform;
    const matchesKonten = selectedKonten === 'ALL' || e.konten === selectedKonten;
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
    const matchesIdReff = selectedIdReffFilter === 'ALL' || e.idReff === selectedIdReffFilter;

    return matchesSearch && matchesWebsite && matchesPlatform && matchesKonten && matchesStatus && matchesIdReff;
  });

  // Group entries by ID REFF
  const groupedEntries: Record<string, DocumentEntry[]> = {};
  filteredEntries.forEach(entry => {
    const key = entry.idReff || 'Lainnya';
    if (!groupedEntries[key]) {
      groupedEntries[key] = [];
    }
    groupedEntries[key].push(entry);
  });

  const toggleGroupCollapse = (reff: string) => {
    setCollapsedGroups(prev => ({ ...prev, [reff]: !prev[reff] }));
  };

  const getWebsiteBadge = (website?: string) => {
    const web = (website || 'studiobet78').toLowerCase();
    return (
      <span className="px-2 py-1 rounded-md border border-slate-200 bg-white shadow-sm flex items-center justify-center w-24">
        <WebsiteLogo website={web} className="h-4 object-contain" />
      </span>
    );
  };

  const getStatusBadge = (status: PostStatus | string) => {
    switch (status) {
      case 'Dipublikasikan':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dipublikasikan</span>;
      case 'Ditangguhkan':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit"><Clock className="w-3 h-3 text-amber-600" /> Ditangguhkan</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 flex items-center gap-1 w-fit">{status}</span>;
    }
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
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-4">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Riwayat Entri Akun
            </h2>
            <p className="text-xs text-slate-500">
              Total <strong className="text-slate-800">{filteredEntries.length}</strong> entri akun ({Object.keys(groupedEntries).length} ID REFF)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setGroupByReff(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  groupByReff ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kelompokkan berdasarkan ID REFF"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Group ID REFF</span>
              </button>
              <button
                onClick={() => setGroupByReff(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  !groupByReff ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan daftar lurus"
              >
                <List className="w-3.5 h-3.5" />
                <span>Daftar Lurus</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Sheet</span>
            </button>

            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheet</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </a>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari ID REFF, link..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
          </div>

          {/* Filter Website */}
          <select
            value={selectedWebsiteFilter}
            onChange={e => setSelectedWebsiteFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-800 bg-emerald-50/50 focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">🌐 Semua Web</option>
            {websiteList.map(web => (
              <option key={web} value={web}>🌐 {web}</option>
            ))}
          </select>

          {/* Filter ID REFF */}
          <select
            value={selectedIdReffFilter}
            onChange={e => setSelectedIdReffFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua ID REFF ({idReffList.length})</option>
            {idReffList.map(reff => (
              <option key={reff} value={reff}>{reff}</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua Platform</option>
            <option value="INSTAGRAM">INSTAGRAM</option>
            <option value="TIKTOK">TIKTOK</option>
            <option value="FANSPAGE FB">FANSPAGE FB</option>
            <option value="FACEBOOK PRO">FACEBOOK PRO</option>
          </select>

          {/* Akun Filter */}
          <select
            value={selectedKonten}
            onChange={e => setSelectedKonten(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua Jenis Akun</option>
            <option value="BRANDING">BRANDING</option>
            <option value="OVERLAY">OVERLAY</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua Status</option>
            <option value="Dipublikasikan">Dipublikasikan</option>
            <option value="Ditangguhkan">Ditangguhkan</option>
          </select>

        </div>

      </div>

      {/* Main Content Area */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
          Tidak ada data akun yang sesuai kriteria pencarian atau filter.
        </div>
      ) : groupByReff ? (
        /* GROUPED BY ID REFF VIEW */
        <div className="space-y-4">
          {Object.entries(groupedEntries).map(([reff, groupItems]) => {
            const isCollapsed = collapsedGroups[reff];
            const platforms = Array.from(new Set(groupItems.map(i => i.platform)));

            return (
              <div key={reff} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition">
                {/* Group Header */}
                <div 
                  onClick={() => toggleGroupCollapse(reff)}
                  className="bg-slate-50 hover:bg-slate-100/80 p-4 border-b border-slate-200 flex items-center justify-between gap-3 cursor-pointer select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-white border border-slate-200">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono text-base font-extrabold text-slate-900">{reff}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                      {groupItems.length} Akun
                    </span>
                  </div>

                  {/* Platforms Summary Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {platforms.map(p => (
                      <span key={p} className="text-[10px]">
                        {getPlatformBadge(p)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Group Body Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Akun (Kolom A)</th>
                          <th className="py-2.5 px-4">Platform (Kolom B)</th>
                          <th className="py-2.5 px-4">Status (Kolom D)</th>
                          <th className="py-2.5 px-4">Tanggal Akun</th>
                          <th className="py-2.5 px-4">Link & Catatan</th>
                          <th className="py-2.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {groupItems.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{entry.konten}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getPlatformBadge(entry.platform)}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(entry.status)}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {entry.tanggalPostingan || '-'}
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                              <div className="truncate font-medium text-slate-800">{entry.catatan || '-'}</div>
                              {entry.linkKonten && (
                                <a
                                  href={entry.linkKonten}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-cyan-600 hover:underline flex items-center gap-1 truncate mt-0.5"
                                >
                                  <Link2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{entry.linkKonten}</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedDoc(entry)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStartEdit(entry)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition"
                                  title="Edit Akun"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD STRAIGHT TABLE VIEW */
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Akun (Kolom A)</th>
                    <th className="py-3 px-4">Platform (Kolom B)</th>
                    <th className="py-3 px-4">ID REFF (Kolom C)</th>
                    <th className="py-3 px-4">Status (Kolom D)</th>
                    <th className="py-3 px-4">Tanggal Akun</th>
                    <th className="py-3 px-4">Link / Catatan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{entry.konten}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getPlatformBadge(entry.platform)}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-800">
                        {entry.idReff}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(entry.status)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {entry.tanggalPostingan || '-'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        <div className="truncate font-medium">{entry.catatan || '-'}</div>
                        {entry.linkKonten && (
                          <a
                            href={entry.linkKonten}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-cyan-600 hover:underline flex items-center gap-0.5 truncate"
                          >
                            <Link2 className="w-3 h-3" /> {entry.linkKonten}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDoc(entry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition"
                            title="Edit Akun"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {getPlatformBadge(entry.platform)}
                      <span className="font-mono text-xs font-bold text-slate-900">{entry.idReff}</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1">{entry.konten}</h3>
                  </div>
                  {getStatusBadge(entry.status)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Akun:</span>
                    <span className="font-mono font-medium text-slate-800">{entry.tanggalPostingan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Catatan:</span>
                    <p className="text-slate-800 line-clamp-2">{entry.catatan || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  {entry.linkKonten ? (
                    <a
                      href={entry.linkKonten}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 hover:underline truncate max-w-[120px]"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" /> Link
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Tanpa Link</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDoc(entry)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                    <button
                      onClick={() => handleStartEdit(entry)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 text-xs font-bold hover:bg-cyan-100 transition flex items-center gap-1"
                      title="Edit Akun"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Entry Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedDoc.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDoc.konten} - {selectedDoc.platform}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Jenis Akun (Kolom A)</span>
                  <span className="font-bold text-slate-900">{selectedDoc.konten}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">PLATFORM (Kolom B)</span>
                  <span className="font-bold text-slate-900">{selectedDoc.platform}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">ID REFF (Kolom C)</span>
                  <span className="font-mono font-extrabold text-emerald-800">{selectedDoc.idReff}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Status (Kolom D)</span>
                  {getStatusBadge(selectedDoc.status)}
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tanggal Akun (Kolom E)</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedDoc.tanggalPostingan}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">LINK PROFIL (Kolom F)</span>
                {selectedDoc.linkKonten ? (
                  <a
                    href={selectedDoc.linkKonten}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-medium break-all flex items-center gap-1.5 hover:underline"
                  >
                    <Link2 className="w-4 h-4 shrink-0 text-cyan-700" />
                    {selectedDoc.linkKonten}
                  </a>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada link profil.</p>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">CATATAN / Tanggal Mulai (Kolom G)</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                  {selectedDoc.catatan || 'Tidak ada catatan.'}
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div>• Waktu Input Web: <strong className="text-slate-800">{selectedDoc.timestamp}</strong></div>
                <div>• Email Notifikasi: <strong className="text-slate-800">{selectedDoc.notificationEmail || '-'}</strong> ({selectedDoc.emailSent ? '✓ Terkirim' : 'Belum/Batal'})</div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Buka di Google Sheet
              </a>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const docToEdit = selectedDoc;
                    setSelectedDoc(null);
                    handleStartEdit(docToEdit);
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Akun
                </button>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  {editingDoc.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-600" /> Edit &amp; Update Data Akun
                </h3>
                <p className="text-xs text-slate-500">
                  Perubahan akan langsung disimpan dan disinkronkan ke Google Sheet &amp; Database Local.
                </p>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Alert Feedback */}
            {editMessage && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                editMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' 
                  : 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
              }`}>
                {editMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{editMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Target Website */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Website / Tab Sheet
                </label>
                <select
                  value={editingDoc.website || 'studiobet78'}
                  onChange={e => setEditingDoc(prev => prev ? ({ ...prev, website: e.target.value }) : null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 bg-white"
                >
                  <option value="studiobet78">🌐 studiobet78</option>
                  <option value="bigbet78">🌐 bigbet78</option>
                  <option value="piala45">🌐 piala45</option>
                  <option value="bambu189">🌐 bambu189</option>
                </select>
              </div>

              {/* Grid 2 Cols: Konten & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Akun (Kolom A)
                  </label>
                  <select
                    value={editingDoc.konten}
                    onChange={e => setEditingDoc(prev => prev ? ({ ...prev, konten: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 bg-white"
                  >
                    <option value="BRANDING">BRANDING</option>
                    <option value="OVERLAY">OVERLAY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PLATFORM (Kolom B)
                  </label>
                  <select
                    value={editingDoc.platform}
                    onChange={e => setEditingDoc(prev => prev ? ({ ...prev, platform: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 bg-white"
                  >
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="TIKTOK">TIKTOK</option>
                    <option value="FANSPAGE FB">FANSPAGE FB</option>
                    <option value="FACEBOOK PRO">FACEBOOK PRO</option>
                  </select>
                </div>
              </div>

              {/* Grid 2 Cols: ID REFF & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID REFF (Kolom C)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDoc.idReff}
                    onChange={e => setEditingDoc(prev => prev ? ({ ...prev, idReff: e.target.value }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status (Kolom D)
                  </label>
                  <select
                    value={editingDoc.status}
                    onChange={e => setEditingDoc(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 bg-white"
                  >
                    <option value="Dipublikasikan">✅ Dipublikasikan</option>
                    <option value="Ditangguhkan">⏸️ Ditangguhkan</option>
                  </select>
                </div>
              </div>

              {/* Grid 2 Cols: Tanggal Akun & Link Profil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Akun (Kolom E)
                  </label>
                  <input
                    type="text"
                    value={editingDoc.tanggalPostingan}
                    onChange={e => setEditingDoc(prev => prev ? ({ ...prev, tanggalPostingan: e.target.value }) : null)}
                    placeholder="26/07/2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    LINK PROFIL (Kolom F)
                  </label>
                  <input
                    type="url"
                    value={editingDoc.linkKonten}
                    onChange={e => setEditingDoc(prev => prev ? ({ ...prev, linkKonten: e.target.value }) : null)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Catatan (Kolom G) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  CATATAN / Tanggal Mulai (Kolom G)
                </label>
                <textarea
                  rows={3}
                  value={editingDoc.catatan}
                  onChange={e => setEditingDoc(prev => prev ? ({ ...prev, catatan: e.target.value }) : null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan &amp; Update ke Sheet
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-slide-up ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
            : 'bg-rose-900 text-rose-100 border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Toast Notification */}

    </div>
  );
};
