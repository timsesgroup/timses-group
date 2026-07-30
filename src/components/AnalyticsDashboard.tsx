import { WebsiteLogo } from './WebsiteLogo';
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  RefreshCw,
  Share2,
  Tag,
  UserCheck,
  Globe,
  User,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { DashboardSummary, DocumentEntry } from '../types';

interface AnalyticsDashboardProps {
  summary: DashboardSummary | null;
  entries?: DocumentEntry[];
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateForm: () => void;
}

const PLATFORM_COLORS = [
  '#e1306c', // Instagram Pink
  '#0f172a', // TikTok Dark
  '#2563eb', // FANSPAGE FB / Blue
  '#4f46e5', // FACEBOOK PRO / Indigo
  '#10b981', // Emerald / Other
  '#8b5cf6'  // Purple
];

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES_ID[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summary,
  entries = [],
  isLoading,
  onRefresh,
  onNavigateForm
}) => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const todayStr = now.toISOString().split('T')[0];
  
  // Filter mode: 'month' | 'custom'
  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Custom date range inputs
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Helper to extract YYYY-MM-DD from entry
  const getEntryDateStr = (e: DocumentEntry): string => {
    const dateStr = (e.tanggalPostingan || e.docDate || '').trim();
    if (dateStr) {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    if (e.timestamp) {
      const d = new Date(e.timestamp);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
    return '';
  };

  // Helper to extract YYYY-MM from entry
  const getEntryMonthKey = (e: DocumentEntry): string => {
    const dStr = getEntryDateStr(e);
    if (dStr && dStr.length >= 7) {
      return dStr.substring(0, 7);
    }
    return currentMonthKey;
  };

  // Build unique list of available months from entries
  const discoveredMonths = Array.from(new Set(entries.map(e => getEntryMonthKey(e))));
  if (!discoveredMonths.includes(currentMonthKey)) {
    discoveredMonths.push(currentMonthKey);
  }
  const availableMonths = discoveredMonths.sort((a, b) => b.localeCompare(a));

  // Navigation handlers for prev / next month
  const handlePrevMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1 && idx !== -1) {
      setSelectedMonth(availableMonths[idx + 1]);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(prevKey);
    }
  };

  const handleNextMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(y, m, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextKey);
    }
  };

  // Presets for Custom Tanggal
  const setPresetDays = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setPresetThisMonth = () => {
    setStartDate(firstDayOfMonth);
    setEndDate(todayStr);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat Statistik &amp; Grafik Entri Harian...</p>
      </div>
    );
  }

  // Filter entries based on active filterMode
  const filteredEntries = entries.filter(e => {
    if (filterMode === 'month') {
      return getEntryMonthKey(e) === selectedMonth;
    } else {
      const eDate = getEntryDateStr(e);
      if (!eDate) return false;
      if (startDate && eDate < startDate) return false;
      if (endDate && eDate > endDate) return false;
      return true;
    }
  });

  // Filtered statistics calculations
  const totalPeriodEntries = filteredEntries.length;
  const publishedCount = filteredEntries.filter(e => e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai').length;
  const pendingCount = filteredEntries.filter(e => e.status !== 'Dipublikasikan' && e.status !== 'Disetujui' && e.status !== 'Selesai').length;
  const publishedRate = totalPeriodEntries > 0 ? Math.round((publishedCount / totalPeriodEntries) * 100) : 0;

  // Akun Hari Ini
  const totalToday = filteredEntries.filter(e => getEntryDateStr(e) === todayStr).length;

  // Build daily stats chart based on filterMode
  let dailyChartStats: Array<{
    date: string;
    formattedDate: string;
    count: number;
    publishedCount: number;
    pendingCount: number;
  }> = [];

  if (filterMode === 'month') {
    const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const dailyMap = new Map<number, { count: number; publishedCount: number; pendingCount: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap.set(d, { count: 0, publishedCount: 0, pendingCount: 0 });
    }

    filteredEntries.forEach(e => {
      const eDate = getEntryDateStr(e);
      if (eDate) {
        const parts = eDate.split('-');
        if (parts.length === 3) {
          const dayVal = parseInt(parts[2], 10);
          if (dailyMap.has(dayVal)) {
            const item = dailyMap.get(dayVal)!;
            item.count += 1;
            if (e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai') {
              item.publishedCount += 1;
            } else {
              item.pendingCount += 1;
            }
          }
        }
      }
    });

    dailyChartStats = Array.from(dailyMap.entries()).map(([dNum, val]) => ({
      date: `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
      formattedDate: `${dNum} ${MONTH_NAMES_ID[monthNum - 1]?.substring(0, 3) || ''}`,
      count: val.count,
      publishedCount: val.publishedCount,
      pendingCount: val.pendingCount
    }));
  } else {
    // Custom date range chart
    const dailyMap = new Map<string, { count: number; publishedCount: number; pendingCount: number }>();

    if (startDate && endDate && startDate <= endDate) {
      let curr = new Date(startDate);
      const last = new Date(endDate);
      let iterations = 0;
      while (curr <= last && iterations < 365) {
        const dateKey = curr.toISOString().split('T')[0];
        dailyMap.set(dateKey, { count: 0, publishedCount: 0, pendingCount: 0 });
        curr.setDate(curr.getDate() + 1);
        iterations++;
      }
    }

    filteredEntries.forEach(e => {
      const eDate = getEntryDateStr(e);
      if (eDate && dailyMap.has(eDate)) {
        const item = dailyMap.get(eDate)!;
        item.count += 1;
        if (e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai') {
          item.publishedCount += 1;
        } else {
          item.pendingCount += 1;
        }
      }
    });

    dailyChartStats = Array.from(dailyMap.entries()).map(([dateKey, val]) => {
      const parts = dateKey.split('-');
      const dNum = parseInt(parts[2] || '1', 10);
      const mNum = parseInt(parts[1] || '1', 10);
      return {
        date: dateKey,
        formattedDate: `${dNum} ${MONTH_NAMES_ID[mNum - 1]?.substring(0, 3) || ''}`,
        count: val.count,
        publishedCount: val.publishedCount,
        pendingCount: val.pendingCount
      };
    });
  }

  // Per-Website Statistics (Total ID and Total Sosmed within filtered period)
  const knownWebsites = ['studiobet78', 'bigbet78', 'piala45', 'bambu189'];
  const discoveredWebs = Array.from(new Set(filteredEntries.map(e => e.website).filter(Boolean))) as string[];
  const websiteList = Array.from(new Set([...knownWebsites, ...discoveredWebs]));

  const perWebsiteStats = websiteList.map(webName => {
    const webEntries = filteredEntries.filter(e => (e.website || 'studiobet78').toLowerCase() === webName.toLowerCase());
    const totalSosmed = webEntries.length;
    const totalId = new Set(webEntries.map(e => e.idReff).filter(Boolean)).size;
    const publishedWebCount = webEntries.filter(e => e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai').length;
    return {
      website: webName,
      totalSosmed,
      totalId,
      publishedCount: publishedWebCount
    };
  });

  // Distributions for filtered period
  const platformCounts: Record<string, number> = {};
  const contentTypeCounts: Record<string, number> = {};
  const idReffCounts: Record<string, number> = {};

  filteredEntries.forEach(e => {
    const plat = e.platform || 'INSTAGRAM';
    platformCounts[plat] = (platformCounts[plat] || 0) + 1;

    const kont = e.konten || 'BRANDING';
    contentTypeCounts[kont] = (contentTypeCounts[kont] || 0) + 1;

    const ref = e.idReff || '-';
    if (ref && ref !== '-') {
      idReffCounts[ref] = (idReffCounts[ref] || 0) + 1;
    }
  });

  const platformStats = Object.entries(platformCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalPeriodEntries > 0 ? Math.round((count / totalPeriodEntries) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  const contentTypeStats = Object.entries(contentTypeCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalPeriodEntries > 0 ? Math.round((count / totalPeriodEntries) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  const topAccounts = Object.entries(idReffCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalPeriodEntries > 0 ? Math.round((count / totalPeriodEntries) * 100) : 0
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  // Formatted date label for header
  const filterLabel = filterMode === 'month' 
    ? `📊 BULAN: ${formatMonthLabel(selectedMonth).toUpperCase()}`
    : `📅 CUSTOM: ${startDate || '...'} s/d ${endDate || '...'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      
      {/* Top Banner & Control Row */}
      <div className="glass-jelly-card p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Dasbor Statistik Akun</h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#0052FF]/10 text-[#0052FF] border border-[#0052FF]/20">
                {filterLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {filterMode === 'month' ? (
                <>Data dilaporkan khusus untuk bulan <strong className="text-slate-900">{formatMonthLabel(selectedMonth)}</strong>.</>
              ) : (
                <>Data dilaporkan untuk rentang tanggal <strong className="text-slate-900">{startDate}</strong> s/d <strong className="text-slate-900">{endDate}</strong>.</>
              )}
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="p-3 rounded-2xl border border-blue-200/80 bg-white hover:bg-blue-50/80 text-[#0052FF] transition shadow-2xs shrink-0 self-end md:self-auto active:scale-95"
            title="Perbarui Data"
          >
            <RefreshCw className="w-4 h-4 text-[#0052FF]" />
          </button>
        </div>

        {/* Filter Mode Selector & Controls */}
        <div className="pt-4 border-t border-blue-100/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-blue-50/80 p-1.5 rounded-2xl text-xs font-bold shrink-0 border border-blue-100">
            <button
              onClick={() => setFilterMode('month')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                filterMode === 'month' 
                  ? 'bg-[#0052FF] text-white shadow-md shadow-[#0052FF]/25 font-black scale-[1.02]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Per Bulan</span>
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                filterMode === 'custom' 
                  ? 'bg-[#0052FF] text-white shadow-md shadow-[#0052FF]/25 font-black scale-[1.02]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Custom Tanggal</span>
            </button>
          </div>

          {/* Conditional Controls based on Mode */}
          {filterMode === 'month' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Pilih Bulan:</span>
              <div className="flex items-center bg-white border border-blue-200/80 p-1 rounded-2xl shadow-2xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-[#0052FF] hover:bg-blue-50 transition"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 px-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer py-1"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>
                        {formatMonthLabel(m)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-[#0052FF] hover:bg-blue-50 transition"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto flex-wrap">
              {/* Date Inputs */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-blue-200 px-3 py-2 rounded-2xl text-xs shadow-2xs">
                  <span className="text-slate-500 font-bold">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-900 font-extrabold focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-blue-200 px-3 py-2 rounded-2xl text-xs shadow-2xs">
                  <span className="text-slate-500 font-bold">Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-900 font-extrabold focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setPresetDays(7)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] text-[11px] font-bold transition border border-blue-200/60"
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setPresetDays(14)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] text-[11px] font-bold transition border border-blue-200/60"
                >
                  14 Hari
                </button>
                <button
                  onClick={() => setPresetDays(30)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052FF] text-[11px] font-bold transition border border-blue-200/60"
                >
                  30 Hari
                </button>
                <button
                  onClick={setPresetThisMonth}
                  className="px-3 py-1.5 rounded-xl bg-[#0052FF] hover:bg-[#0045E0] text-white text-[11px] font-bold transition shadow-2xs"
                >
                  Bulan Ini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Total Akun Periode Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akun Periode Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPeriodEntries}</span>
            <span className="text-xs text-slate-500 font-medium">konten</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            Hari ini: <strong className="text-slate-800">{totalToday}</strong> akun
          </div>
        </div>

        {/* KPI 2: Total Publikasi Periode Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telah Dipublikasi</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{publishedCount}</span>
            <span className="text-xs text-slate-500 font-medium">konten</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-medium">
            Tingkat Sukses: <strong>{publishedRate}%</strong>
          </div>
        </div>

        {/* KPI 3: Ditangguhkan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ditangguhkan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-slate-500 font-medium">konten</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-medium">
            Status pending / ditangguhkan
          </div>
        </div>

        {/* KPI 4: Total Rekam Datapoint */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entri Filter</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPeriodEntries}</span>
            <span className="text-xs text-slate-500 font-medium">baris</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Sesuai kriteria filter aktif
          </div>
        </div>

      </div>

      {/* Per-Website Breakdown Cards */}
      <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0052FF]" />
            <h3 className="text-base font-black text-slate-900">
              Statistik Per Website (Total ID &amp; Total Sosmed)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Rincian Sesuai Filter
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {perWebsiteStats.map(stat => (
            <div 
              key={stat.website}
              className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/80 hover:border-[#0052FF]/40 hover:shadow-md transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#0052FF]/10 text-[#0052FF] border border-[#0052FF]/20 flex items-center gap-1.5">
                  <WebsiteLogo website={stat.website} className="h-4 object-contain" />
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {stat.publishedCount} dipublikasi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Total ID</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-slate-900">{stat.totalId}</span>
                    <span className="text-[10px] text-slate-500 font-bold">ID REFF</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Total Sosmed</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-[#0052FF]">{stat.totalSosmed}</span>
                    <span className="text-[10px] text-slate-500 font-bold">konten</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Entry Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0052FF]" />
                Grafik Entri Akun Harian
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {filterMode === 'month' 
                  ? `Grafik pergerakan harian bulan ${formatMonthLabel(selectedMonth)}`
                  : `Grafik pergerakan harian tanggal ${startDate} s/d ${endDate}`}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0A0B0D',  
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [value, 'Total Akun']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  name="count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution Pie Chart for Selected Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-cyan-600" />
              Distribusi Platform ({formatMonthLabel(selectedMonth)})
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Persentase akun berdasarkan media sosial di bulan terpilih
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              {platformStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformStats}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {platformStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '8px', 
                        border: 'none', 
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(val: any) => [`${val} akun`, 'Jumlah']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">Belum ada data platform di bulan ini</p>
              )}
            </div>
          </div>

          {/* Platform Legend List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-40 overflow-y-auto pr-1">
            {platformStats.map((plat, idx) => (
              <div key={plat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: PLATFORM_COLORS[idx % PLATFORM_COLORS.length] }} 
                  />
                  <span className="text-slate-700 font-semibold truncate">{plat.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 font-semibold shrink-0">
                  <span>{plat.count}</span>
                  <span className="text-slate-400">({plat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Row 2: Content Types & Top Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Content Types Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Breakdown Jenis Konten - {formatMonthLabel(selectedMonth)}
          </h3>
          <div className="space-y-2">
            {contentTypeStats.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 italic">Belum ada akun di bulan ini.</p>
            ) : (
              contentTypeStats.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{item.name}</span>
                    <span className="font-mono text-emerald-700">{item.count} akun ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top ID REFF Accounts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            Top ID REFF Teraktif - {formatMonthLabel(selectedMonth)}
          </h3>
          {topAccounts.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 italic">Belum ada akun di bulan ini.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {topAccounts.map(acc => (
                <div key={acc.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-900 block">{acc.name}</span>
                    <span className="text-[10px] text-slate-500">{acc.percentage}% dari bulan ini</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-cyan-100 text-cyan-800 font-extrabold text-xs">
                    {acc.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white">Ingin menginput akun baru sekarang?</h4>
          <p className="text-xs text-emerald-100 mt-0.5">
            Gunakan web form otomatis yang tersinkron langsung ke Google Sheet &amp; email penerima.
          </p>
        </div>
        <button
          onClick={onNavigateForm}
          className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-xs transition shrink-0"
        >
          + Input Akun
        </button>
      </div>

    </div>
  );
};
