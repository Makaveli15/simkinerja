'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface DashboardStats {
  totalKegiatan: number;
  kegiatanSelesai: number;
  kegiatanBerjalan: number;
  kegiatanBelum: number;
  kegiatanTertunda: number;
  kegiatanBermasalah: number;
  totalTim: number;
  totalPagu: number;
  totalRealisasiAnggaran: number;
  persentaseRealisasi: number;
  ratarataSkor: number;
  pendingVerifikasi: number;
  totalKendala: number;
  kendalaResolved: number;
}

interface TimPerformance {
  tim_nama: string;
  total_kegiatan: number;
  rata_skor: number;
}

interface KroPerformance {
  kro_kode: string;
  kro_nama: string;
  total_kegiatan: number;
  rata_skor: number;
}

interface KegiatanBermasalah {
  id: number;
  nama: string;
  tim_nama: string;
  status: string;
  skor: number;
  kendala: string;
}

interface ProgresData {
  bulan: string;
  progres: number;
  target: number;
}

interface AnggaranData {
  bulan: string;
  pagu: number;
  realisasi: number;
}

export default function PimpinanDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalKegiatan: 0,
    kegiatanSelesai: 0,
    kegiatanBerjalan: 0,
    kegiatanBelum: 0,
    kegiatanTertunda: 0,
    kegiatanBermasalah: 0,
    totalTim: 0,
    totalPagu: 0,
    totalRealisasiAnggaran: 0,
    persentaseRealisasi: 0,
    ratarataSkor: 0,
    pendingVerifikasi: 0,
    totalKendala: 0,
    kendalaResolved: 0,
  });
  const [timPerformance, setTimPerformance] = useState<TimPerformance[]>([]);
  const [kroPerformance, setKroPerformance] = useState<KroPerformance[]>([]);
  const [kegiatanBermasalah, setKegiatanBermasalah] = useState<KegiatanBermasalah[]>([]);
  const [statusData, setStatusData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [progresData, setProgresData] = useState<ProgresData[]>([]);
  const [anggaranData, setAnggaranData] = useState<AnggaranData[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/pimpinan/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTimPerformance(data.timPerformance || []);
        setKroPerformance(data.kroPerformance || []);
        setKegiatanBermasalah(data.kegiatanBermasalah || []);
        setProgresData(data.progresChart || []);
        setAnggaranData(data.anggaranChart || []);
        
        // Set status chart data
        setStatusData([
          { name: 'Selesai', value: data.stats.kegiatanSelesai || 0, color: '#10B981' },
          { name: 'Berjalan', value: data.stats.kegiatanBerjalan || 0, color: '#3B82F6' },
          { name: 'Belum Mulai', value: data.stats.kegiatanBelum || 0, color: '#9CA3AF' },
          { name: 'Tertunda', value: data.stats.kegiatanTertunda || 0, color: '#F59E0B' },
        ].filter(d => d.value > 0));
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSkorColor = (skor: number) => {
    if (skor >= 80) return 'text-green-600 bg-green-100';
    if (skor >= 60) return 'text-blue-600 bg-blue-100';
    if (skor >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getSkorLabel = (skor: number) => {
    if (skor >= 80) return 'Sangat Baik';
    if (skor >= 60) return 'Baik';
    if (skor >= 40) return 'Cukup';
    return 'Kurang';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Kegiatan',
      value: stats.totalKegiatan,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Total Tim',
      value: stats.totalTim,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Rata-rata Skor',
      value: Math.round(stats.ratarataSkor),
      suffix: '%',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Kendala',
      value: `${stats.kendalaResolved}/${stats.totalKendala}`,
      subLabel: 'terselesaikan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      label: 'Pending Verifikasi',
      value: stats.pendingVerifikasi,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-red-500 to-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Pimpinan</h1>
          <p className="text-gray-500 mt-1">Monitoring capaian kinerja seluruh tim</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}{card.suffix || ''}
                </p>
                {card.subLabel && <p className="text-xs text-gray-400">{card.subLabel}</p>}
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Anggaran Summary */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Anggaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-600 font-medium">Target Anggaran</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(stats.totalPagu)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-green-600 font-medium">Total Realisasi</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(stats.totalRealisasiAnggaran)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-600 font-medium">Persentase Realisasi</p>
            <p className="text-xl font-bold text-purple-700">{Math.round(stats.persentaseRealisasi)}%</p>
            <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(stats.persentaseRealisasi, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Kegiatan Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Kegiatan</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Belum ada data kegiatan
            </div>
          )}
        </div>

        {/* Tim Performance Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kinerja per Tim</h2>
          {timPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timPerformance} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="tim_nama" width={80} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${Math.round(Number(value || 0))}%`, 'Skor']}
                />
                <Bar dataKey="rata_skor" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Belum ada data tim
            </div>
          )}
        </div>
      </div>

      {/* Charts Row - Progres & Anggaran Bulanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progres Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tren Progres Bulanan</h2>
          {progresData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progresData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, '']}
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="progres" 
                  name="Progres Aktual"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  name="Target"
                  stroke="#EF4444" 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Belum ada data progres
            </div>
          )}
        </div>

        {/* Anggaran Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Realisasi Anggaran Bulanan</h2>
          {anggaranData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={anggaranData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Legend />
                <Bar dataKey="pagu" name="Target Anggaran" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realisasi" name="Realisasi" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Belum ada data anggaran
            </div>
          )}
        </div>
      </div>

      {/* KRO Performance */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kinerja per KRO</h2>
        {kroPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kroPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kro_kode" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'rata_skor' ? `${Math.round(Number(value || 0))}%` : value,
                  name === 'rata_skor' ? 'Skor' : 'Jumlah Kegiatan'
                ]}
                labelFormatter={(label) => {
                  const kro = kroPerformance.find(k => k.kro_kode === label);
                  return kro ? `${label} - ${kro.kro_nama}` : label;
                }}
              />
              <Legend />
              <Bar dataKey="rata_skor" name="Skor Kinerja" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_kegiatan" name="Jumlah Kegiatan" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            Belum ada data KRO
          </div>
        )}
      </div>

      {/* Kegiatan Bermasalah */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kegiatan Perlu Perhatian</h2>
          <Link 
            href="/pimpinan/kegiatan?status=bermasalah" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Lihat Semua →
          </Link>
        </div>
        {kegiatanBermasalah.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kegiatan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tim</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Skor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kendala</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kegiatanBermasalah.map((kegiatan) => (
                  <tr key={kegiatan.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{kegiatan.nama}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{kegiatan.tim_nama || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        {kegiatan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSkorColor(kegiatan.skor)}`}>
                        {Math.round(kegiatan.skor)}% - {getSkorLabel(kegiatan.skor)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600 truncate max-w-[200px]">{kegiatan.kendala || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/pimpinan/kegiatan/${kegiatan.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tidak ada kegiatan bermasalah
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/pimpinan/kegiatan" 
          className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <div>
              <p className="font-semibold">Monitoring Kegiatan</p>
              <p className="text-sm text-white/80">Lihat dan verifikasi kegiatan</p>
            </div>
            <svg className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        <Link 
          href="/pimpinan/laporan" 
          className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="font-semibold">Laporan Kinerja</p>
              <p className="text-sm text-white/80">Lihat dan export laporan</p>
            </div>
            <svg className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        <Link 
          href="/pimpinan/evaluasi" 
          className="p-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <p className="font-semibold">Evaluasi</p>
              <p className="text-sm text-white/80">Berikan arahan & rekomendasi</p>
            </div>
            <svg className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
