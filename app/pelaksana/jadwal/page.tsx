'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function JadwalPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('semua');

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pelaksana/kegiatan-operasional');
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-100 text-green-800 border-green-200';
      case 'berjalan': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tertunda': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-500';
      case 'berjalan': return 'bg-blue-500';
      case 'tertunda': return 'bg-yellow-500';
      default: return 'bg-gray-500';
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
        {/* Header */}
        <div className="mb-6">
          <Link href="/pelaksana/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jadwal Kegiatan</h1>
              <p className="text-gray-600">Kelola dan pantau jadwal kegiatan operasional</p>
            </div>
            <Link
              href="/pelaksana/kegiatan/tambah"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Tambah Kegiatan
            </Link>
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

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="semua">Semua</option>
                <option value="berjalan">Berjalan</option>
                <option value="selesai">Selesai</option>
                <option value="tertunda">Tertunda</option>
              </select>
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

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Berjalan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Selesai</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Tertunda</span>
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
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Progres</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedKegiatan.map(kg => {
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
                          <td className="px-4 py-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${kg.progres_persen}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{kg.progres_persen}%</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(kg.status)}`}>
                              {kg.status.charAt(0).toUpperCase() + kg.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/pelaksana/kegiatan/${kg.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
