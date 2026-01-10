'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Pagination from '../../components/Pagination';

interface Kegiatan {
  id: number;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  kro_kode: string;
  kro_nama: string;
  progres_persen: number;
}

type ViewMode = 'table' | 'calendar';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const HARI_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Interval refresh dalam milidetik (30 detik)
const REFRESH_INTERVAL = 30000;

export default function JadwalPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('semua');
  const [filterBulan, setFilterBulan] = useState<string>('semua');
  const [filterTahun, setFilterTahun] = useState<number>(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Real-time state
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const prevKegiatanRef = useRef<Kegiatan[]>([]);

  // Generate tahun options (5 tahun terakhir hingga tahun depan)
  const tahunOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Fetch kegiatan dengan silent mode untuk auto-refresh
  const fetchKegiatan = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      // Build URL dengan filter
      const params = new URLSearchParams();
      if (filterBulan !== 'semua') {
        params.append('bulan', filterBulan);
      }
      params.append('tahun', filterTahun.toString());
      
      const url = `/api/pelaksana/kegiatan-operasional${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        
        // Check for changes dan tampilkan notifikasi
        if (silent && prevKegiatanRef.current.length > 0) {
          const changes = detectChanges(prevKegiatanRef.current, data);
          if (changes.length > 0) {
            setNotification(changes[0]);
            setTimeout(() => setNotification(null), 5000);
          }
        }
        
        prevKegiatanRef.current = data;
        setKegiatan(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterBulan, filterTahun]);

  // Deteksi perubahan data
  const detectChanges = (oldData: Kegiatan[], newData: Kegiatan[]): string[] => {
    const changes: string[] = [];
    
    // Check for new kegiatan
    const oldIds = new Set(oldData.map(k => k.id));
    const newKegiatan = newData.filter(k => !oldIds.has(k.id));
    if (newKegiatan.length > 0) {
      changes.push(`${newKegiatan.length} kegiatan baru ditambahkan`);
    }
    
    // Check for status changes
    newData.forEach(newK => {
      const oldK = oldData.find(k => k.id === newK.id);
      if (oldK && oldK.status !== newK.status) {
        changes.push(`"${newK.nama}" status berubah: ${oldK.status} → ${newK.status}`);
      }
      if (oldK && oldK.progres_persen !== newK.progres_persen) {
        changes.push(`"${newK.nama}" progres: ${oldK.progres_persen}% → ${newK.progres_persen}%`);
      }
    });
    
    return changes;
  };

  // Initial fetch
  useEffect(() => {
    fetchKegiatan();
  }, [fetchKegiatan]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchKegiatan(true);
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchKegiatan]);

  // Manual refresh
  const handleManualRefresh = () => {
    fetchKegiatan(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-100 text-green-700 border-green-200';
      case 'berjalan': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'belum_mulai': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'tertunda': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'bermasalah': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-500';
      case 'berjalan': return 'bg-blue-500';
      case 'belum_mulai': return 'bg-gray-400';
      case 'tertunda': return 'bg-amber-500';
      case 'bermasalah': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'berjalan': return 'Berjalan';
      case 'belum_mulai': return 'Belum Mulai';
      case 'tertunda': return 'Tertunda';
      default: return status;
    }
  };

  const filteredKegiatan = kegiatan.filter(kg => {
    if (statusFilter === 'semua') return true;
    return kg.status === statusFilter;
  });

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0);
    return date >= start && date <= end;
  };

  const getKegiatanForDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return filteredKegiatan.filter(kg => isDateInRange(date, kg.tanggal_mulai, kg.tanggal_selesai));
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };

  // Calculate days to deadline
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Sort kegiatan by tanggal_mulai for table view
  const sortedKegiatan = [...filteredKegiatan].sort((a, b) => 
    new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime()
  );

  // Pagination for table view
  const totalPages = Math.ceil(sortedKegiatan.length / itemsPerPage);
  const paginatedKegiatan = sortedKegiatan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filterBulan, filterTahun]);

  // Generate calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      const dayKegiatan = getKegiatanForDate(day);

      days.push(
        <div 
          key={day} 
          className={`h-24 border border-gray-100 p-1 overflow-hidden ${isToday ? 'bg-blue-50' : 'bg-white'}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-16">
            {dayKegiatan.slice(0, 3).map(kg => (
              <Link
                key={kg.id}
                href={`/pelaksana/kegiatan/${kg.id}`}
                className={`block text-xs px-1 py-0.5 rounded truncate ${getStatusBgColor(kg.status)} text-white hover:opacity-80`}
                title={kg.nama}
              >
                {kg.nama}
              </Link>
            ))}
            {dayKegiatan.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">+{dayKegiatan.length - 3} lainnya</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{notification}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link href="/pelaksana/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jadwal Kegiatan</h1>
            <p className="text-gray-600">Pantau jadwal kegiatan</p>
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Auto-refresh Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Memperbarui...' : 'Refresh'}
              </button>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-gray-600">
                {lastUpdated ? (
                  <>Terakhir diperbarui: <span className="font-medium text-gray-800">{formatTime(lastUpdated)}</span></>
                ) : (
                  'Memuat data...'
                )}
              </span>
              {autoRefresh && (
                <span className="text-xs text-gray-500">(auto setiap 30 detik)</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Tabel
                </span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Kalender
                </span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Filter Bulan */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Bulan:</label>
                <select
                  value={filterBulan}
                  onChange={e => setFilterBulan(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="semua">Semua Bulan</option>
                  {BULAN_NAMES.map((nama, index) => (
                    <option key={index} value={index + 1}>{nama}</option>
                  ))}
                </select>
              </div>

              {/* Filter Tahun */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Tahun:</label>
                <select
                  value={filterTahun}
                  onChange={e => setFilterTahun(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {tahunOptions.map(tahun => (
                    <option key={tahun} value={tahun}>{tahun}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Status:</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="semua">Semua</option>
                  <option value="belum_mulai">Belum Mulai</option>
                  <option value="berjalan">Berjalan</option>
                  <option value="selesai">Selesai</option>
                  <option value="tertunda">Tertunda</option>
                </select>
              </div>
            </div>

            {/* Calendar Navigation (only for calendar view) */}
            {viewMode === 'calendar' && (
              <div className="flex items-center gap-4">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-medium text-gray-900 min-w-[150px] text-center">
                  {BULAN_NAMES[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hari Ini
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Kegiatan</p>
                <p className="text-xl font-bold text-gray-900">{kegiatan.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Berjalan</p>
                <p className="text-xl font-bold text-blue-600">{kegiatan.filter(k => k.status === 'berjalan').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-xl font-bold text-green-600">{kegiatan.filter(k => k.status === 'selesai').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tertunda</p>
                <p className="text-xl font-bold text-yellow-600">{kegiatan.filter(k => k.status === 'tertunda').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {sortedKegiatan.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Tidak ada kegiatan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Kegiatan</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">KRO</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal Mulai</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal Selesai</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Durasi</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Sisa Hari</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedKegiatan.map(kg => {
                      const daysRemaining = getDaysRemaining(kg.tanggal_selesai);
                      const startDate = new Date(kg.tanggal_mulai);
                      const endDate = new Date(kg.tanggal_selesai);
                      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                        <tr key={kg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link href={`/pelaksana/kegiatan/${kg.id}`} className="font-medium text-blue-600 hover:underline">
                              {kg.nama}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="text-blue-600">[{kg.kro_kode}]</span>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(kg.tanggal_mulai)}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(kg.tanggal_selesai)}</td>
                          <td className="px-4 py-3 text-center text-sm">{duration} hari</td>
                          <td className="px-4 py-3 text-center">
                            {kg.status === 'selesai' ? (
                              <span className="text-green-600 text-sm">-</span>
                            ) : daysRemaining < 0 ? (
                              <span className="text-red-600 text-sm font-medium">Lewat {Math.abs(daysRemaining)} hari</span>
                            ) : daysRemaining === 0 ? (
                              <span className="text-orange-600 text-sm font-medium">Hari ini!</span>
                            ) : daysRemaining <= 7 ? (
                              <span className="text-orange-600 text-sm font-medium">{daysRemaining} hari</span>
                            ) : (
                              <span className="text-gray-600 text-sm">{daysRemaining} hari</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(kg.status)}`}>
                              {getStatusLabel(kg.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {sortedKegiatan.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedKegiatan.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
              />
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gray-100">
              {HARI_NAMES.map(day => (
                <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Deadline Mendatang</h3>
          <div className="space-y-3">
            {filteredKegiatan
              .filter(kg => kg.status !== 'selesai')
              .sort((a, b) => new Date(a.tanggal_selesai).getTime() - new Date(b.tanggal_selesai).getTime())
              .slice(0, 5)
              .map(kg => {
                const daysRemaining = getDaysRemaining(kg.tanggal_selesai);
                return (
                  <div key={kg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Link href={`/pelaksana/kegiatan/${kg.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {kg.nama}
                      </Link>
                      <p className="text-sm text-gray-500">Deadline: {formatDate(kg.tanggal_selesai)}</p>
                    </div>
                    <div className="text-right">
                      {daysRemaining < 0 ? (
                        <span className="text-red-600 font-medium">Lewat {Math.abs(daysRemaining)} hari</span>
                      ) : daysRemaining === 0 ? (
                        <span className="text-orange-600 font-medium">Hari ini!</span>
                      ) : (
                        <span className={`font-medium ${daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {daysRemaining} hari lagi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            {filteredKegiatan.filter(kg => kg.status !== 'selesai').length === 0 && (
              <p className="text-gray-500 text-center py-4">Tidak ada deadline mendatang</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
