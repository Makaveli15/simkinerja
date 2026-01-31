'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LuClipboard,
  LuUsers,
  LuTrendingUp,
  LuTriangleAlert,
  LuCircleCheck,
  LuCalendar,
  LuClipboardList,
  LuFileText,
  LuChevronRight,
  LuLoader,
  LuChartBar
} from 'react-icons/lu';
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
  pendingValidasi: number;
  dokumenDiterima: number;
  dokumenDitolak: number;
  totalDokumen: number;
  totalKendala: number;
  kendalaResolved: number;
}

interface DokumenPending {
  id: number;
  nama_file: string;
  kegiatan_nama: string;
  tim_nama: string;
  uploaded_at: string;
  uploaded_by_nama: string;
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
  jumlah_kendala: number;
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

export default function KesubagDashboard() {
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
    pendingValidasi: 0,
    dokumenDiterima: 0,
    dokumenDitolak: 0,
    totalDokumen: 0,
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
      const res = await fetch('/api/kesubag/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTimPerformance(data.timPerformance || []);
        setKroPerformance(data.kroPerformance || []);
        setKegiatanBermasalah(data.kegiatanBermasalah || []);
        setProgresData(data.progresChart || []);
        setAnggaranData(data.anggaranChart || []);
        
        // Set status kegiatan chart data
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
    if (skor >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'selesai':
        return 'bg-green-100 text-green-700';
      case 'berjalan':
        return 'bg-blue-100 text-blue-700';
      case 'belum_dimulai':
      case 'belum dimulai':
      case 'belum_mulai':
        return 'bg-gray-100 text-gray-700';
      case 'tertunda':
        return 'bg-amber-100 text-amber-700';
      case 'bermasalah':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <LuLoader className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Kegiatan',
      value: stats.totalKegiatan,
      icon: <LuClipboard className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Total Tim',
      value: stats.totalTim,
      icon: <LuUsers className="w-6 h-6" />,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Rata-rata Skor',
      value: Math.round(stats.ratarataSkor),
      suffix: '%',
      icon: <LuTrendingUp className="w-6 h-6" />,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Kendala',
      value: `${stats.kendalaResolved}/${stats.totalKendala}`,
      subLabel: 'terselesaikan',
      icon: <LuTriangleAlert className="w-6 h-6" />,
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      label: 'Perlu Perhatian',
      value: stats.kegiatanBermasalah,
      icon: <LuCircleCheck className="w-6 h-6" />,
      gradient: 'from-red-500 to-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuTrendingUp className="w-6 h-6" />
              </div>
              Dashboard Kesubag
            </h1>
            <p className="text-blue-100 mt-2">Monitoring capaian kinerja seluruh tim</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
            <LuCalendar className="w-4 h-4" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
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

      {/* Charts Row - Status & Tim Performance */}
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
      {kegiatanBermasalah.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <LuTriangleAlert className="w-5 h-5 text-red-500" />
              Kegiatan Perlu Perhatian
            </h2>
            <Link 
              href="/kesubag/kegiatan"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Lihat Semua <LuChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kegiatan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tim</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Kendala</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Skor</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kegiatanBermasalah.map((kegiatan) => (
                  <tr key={kegiatan.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{kegiatan.nama}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{kegiatan.tim_nama}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kegiatan.status)}`}>
                        {kegiatan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {kegiatan.jumlah_kendala}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getSkorColor(kegiatan.skor)}`}>
                        {Math.round(kegiatan.skor)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/kesubag/kegiatan/${kegiatan.id}`}
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
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/kesubag/kegiatan" 
          className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <LuClipboardList className="w-8 h-8" />
            <div>
              <p className="font-semibold">Monitoring Kegiatan</p>
              <p className="text-sm text-white/80">Lihat dan pantau kegiatan</p>
            </div>
            <LuChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link 
          href="/kesubag/laporan" 
          className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <LuFileText className="w-8 h-8" />
            <div>
              <p className="font-semibold">Laporan Kinerja</p>
              <p className="text-sm text-white/80">Lihat dan export laporan</p>
            </div>
            <LuChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link 
          href="/kesubag/statistik" 
          className="p-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <LuChartBar className="w-8 h-8" />
            <div>
              <p className="font-semibold">Statistik</p>
              <p className="text-sm text-white/80">Analisis kinerja tim</p>
            </div>
            <LuChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
