'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SkeletonDashboard } from '@/app/components/Skeleton';
import { 
  LuClipboardList,
  LuClipboardCheck, 
  LuUsers,
  LuTrendingUp,
  LuArrowRight,
  LuClock,
  LuCircleCheck,
  LuTriangleAlert,
  LuCalendar,
  LuChevronRight,
  LuWallet,
  LuHand
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
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface Statistics {
  total_kegiatan: number;
  menunggu_approval: number;
  rata_rata_kinerja: number;
  total_pelaksana: number;
  total_pagu: number;
  total_realisasi_anggaran: number;
  total_kendala: number;
  kendala_resolved: number;
}

interface StatusKinerja {
  sukses: number;
  perlu_perhatian: number;
  bermasalah: number;
  belum_mulai: number;
}

interface StatusKegiatan {
  berjalan: number;
  selesai: number;
  draft: number;
  dibatalkan: number;
}

interface Tim {
  id: number;
  nama: string;
}

interface Kegiatan {
  id: number;
  nama: string;
  status: string;
  status_pengajuan: string;
  pelaksana_nama: string;
  skor_kinerja: number;
  status_kinerja: string;
  anggaran_pagu: number;
  total_realisasi_anggaran: number;
  total_kendala?: number;
  kendala_resolved?: number;
  kro_kode?: string;
  kro_nama?: string;
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

export default function KoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [tim, setTim] = useState<Tim | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    total_kegiatan: 0,
    menunggu_approval: 0,
    rata_rata_kinerja: 0,
    total_pelaksana: 0,
    total_pagu: 0,
    total_realisasi_anggaran: 0,
    total_kendala: 0,
    kendala_resolved: 0
  });
  const [statusKinerja, setStatusKinerja] = useState<StatusKinerja>({
    sukses: 0,
    perlu_perhatian: 0,
    bermasalah: 0,
    belum_mulai: 0
  });
  const [statusKegiatan, setStatusKegiatan] = useState<StatusKegiatan>({
    berjalan: 0,
    selesai: 0,
    draft: 0,
    dibatalkan: 0
  });
  const [recentActivities, setRecentActivities] = useState<Kegiatan[]>([]);
  const [allKegiatan, setAllKegiatan] = useState<Kegiatan[]>([]);
  const [progresData, setProgresData] = useState<ProgresData[]>([]);
  const [anggaranData, setAnggaranData] = useState<AnggaranData[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/koordinator/dashboard');
      if (res.ok) {
        const data = await res.json();
        setTim(data.tim);
        
        // Calculate totals from kegiatan
        const kegiatan = data.kegiatan || [];
        const totalPagu = kegiatan.reduce((sum: number, k: Kegiatan) => sum + (parseFloat(String(k.anggaran_pagu)) || 0), 0);
        const totalRealisasi = kegiatan.reduce((sum: number, k: Kegiatan) => sum + (parseFloat(String(k.total_realisasi_anggaran)) || 0), 0);
        const totalKendala = kegiatan.reduce((sum: number, k: Kegiatan) => sum + (k.total_kendala || 0), 0);
        const kendalaResolved = kegiatan.reduce((sum: number, k: Kegiatan) => sum + (k.kendala_resolved || 0), 0);

        setStatistics({
          ...data.statistics,
          total_pagu: totalPagu,
          total_realisasi_anggaran: totalRealisasi,
          total_kendala: totalKendala,
          kendala_resolved: kendalaResolved
        });
        setStatusKinerja(data.status_kinerja);
        setStatusKegiatan(data.status_kegiatan || { berjalan: 0, selesai: 0, draft: 0, dibatalkan: 0 });
        setRecentActivities(data.recent_activities || []);
        setAllKegiatan(kegiatan);

        // Generate chart data
        generateChartData(kegiatan, totalPagu, totalRealisasi);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (kegiatan: Kegiatan[], totalPagu: number, totalRealisasi: number) => {
    // Generate monthly data for charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonth = new Date().getMonth();
    
    // Progress data (monthly progression)
    const progres: ProgresData[] = [];
    const anggaran: AnggaranData[] = [];
    
    for (let i = 0; i <= currentMonth; i++) {
      const progress = totalPagu > 0 
        ? Math.min(100, Math.round((i / Math.max(currentMonth, 1)) * (totalRealisasi / totalPagu * 100)))
        : 0;
      progres.push({
        bulan: months[i],
        progres: progress,
        target: Math.round((i + 1) / 12 * 100)
      });
      
      anggaran.push({
        bulan: months[i],
        pagu: Math.round(totalPagu / 12 * (i + 1)),
        realisasi: Math.round(totalRealisasi / Math.max(currentMonth + 1, 1) * (i + 1))
      });
    }
    
    setProgresData(progres);
    setAnggaranData(anggaran);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'text-green-600 bg-green-100';
      case 'Perlu Perhatian': return 'text-yellow-600 bg-yellow-100';
      case 'Bermasalah': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-100 text-green-700';
      case 'berjalan': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'dibatalkan': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'berjalan': return 'Berjalan';
      case 'draft': return 'Draft';
      case 'dibatalkan': return 'Dibatalkan';
      default: return status;
    }
  };

  // Prepare pie chart data
  const statusData = [
    { name: 'Selesai', value: statusKegiatan.selesai, color: '#10B981' },
    { name: 'Berjalan', value: statusKegiatan.berjalan, color: '#3B82F6' },
    { name: 'Draft', value: statusKegiatan.draft, color: '#9CA3AF' },
    { name: 'Dibatalkan', value: statusKegiatan.dibatalkan, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const serapanPersen = statistics.total_pagu > 0 
    ? ((statistics.total_realisasi_anggaran / statistics.total_pagu) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner with User Info */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              Dashboard Koordinator <LuHand className="w-6 h-6" />
            </h1>
            <p className="text-blue-100">
              Tim: <span className="font-semibold text-white">{tim?.nama || '-'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-blue-100">Rata-rata Skor Kinerja</p>
              <p className="text-3xl font-bold">{statistics.rata_rata_kinerja}%</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              statistics.rata_rata_kinerja >= 80 ? 'bg-green-100 text-green-700' :
              statistics.rata_rata_kinerja >= 60 ? 'bg-amber-100 text-amber-700' :
              statistics.rata_rata_kinerja > 0 ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {statistics.rata_rata_kinerja >= 80 ? 'Sukses' :
               statistics.rata_rata_kinerja >= 60 ? 'Perlu Perhatian' :
               statistics.rata_rata_kinerja > 0 ? 'Bermasalah' : 'Belum Dinilai'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <LuClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kegiatan</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_kegiatan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <LuClock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Menunggu Approval</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.menunggu_approval}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <LuCircleCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kegiatan Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{statusKegiatan.selesai}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <LuUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pelaksana</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_pelaksana}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <LuWallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Serapan Anggaran</p>
              <p className="text-2xl font-bold text-gray-900">{serapanPersen}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Progres Realisasi (%)</h3>
          {progresData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={progresData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="progres" stroke="#3B82F6" strokeWidth={2} name="Realisasi (%)" dot={{ fill: '#3B82F6' }} />
                <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Target (%)" dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Belum ada data progres
            </div>
          )}
        </div>

        {/* Anggaran Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Realisasi Anggaran</h3>
          {anggaranData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={anggaranData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}Jt`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => typeof value === 'number' ? formatCurrency(value) : '-'}
                />
                <Legend />
                <Bar dataKey="pagu" fill="#E5E7EB" name="Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realisasi" fill="#3B82F6" name="Realisasi" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Belum ada data anggaran
            </div>
          )}
        </div>
      </div>

      {/* Status & Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Kegiatan Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Status Kegiatan</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Belum ada data
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan Anggaran */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Anggaran</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Target Anggaran</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(statistics.total_pagu)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-500">Total Realisasi</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(statistics.total_realisasi_anggaran)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-gray-500">Sisa Anggaran</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(statistics.total_pagu - statistics.total_realisasi_anggaran)}</p>
            </div>
          </div>
        </div>

        {/* Status Kendala */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Status Kendala</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_kendala}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{statistics.kendala_resolved}</p>
              </div>
            </div>
            {statistics.total_kendala > 0 && (
              <>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(statistics.kendala_resolved / statistics.total_kendala) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  {Math.round((statistics.kendala_resolved / statistics.total_kendala) * 100)}% kendala telah diselesaikan
                </p>
              </>
            )}
            <div className="p-4 bg-yellow-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Menunggu</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.total_kendala - statistics.kendala_resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribusi Status Kinerja */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Status Kinerja</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="font-medium text-gray-700">Sukses</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{statusKinerja.sukses}</p>
            <p className="text-sm text-gray-500 mt-1">
              {statistics.total_kegiatan > 0 ? Math.round((statusKinerja.sukses / statistics.total_kegiatan) * 100) : 0}% dari total
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="font-medium text-gray-700">Perlu Perhatian</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{statusKinerja.perlu_perhatian}</p>
            <p className="text-sm text-gray-500 mt-1">
              {statistics.total_kegiatan > 0 ? Math.round((statusKinerja.perlu_perhatian / statistics.total_kegiatan) * 100) : 0}% dari total
            </p>
          </div>

          <div className="p-4 bg-red-50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="font-medium text-gray-700">Bermasalah</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{statusKinerja.bermasalah}</p>
            <p className="text-sm text-gray-500 mt-1">
              {statistics.total_kegiatan > 0 ? Math.round((statusKinerja.bermasalah / statistics.total_kegiatan) * 100) : 0}% dari total
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span className="font-medium text-gray-700">Belum Dinilai</span>
            </div>
            <p className="text-3xl font-bold text-gray-600">{statusKinerja.belum_mulai}</p>
            <p className="text-sm text-gray-500 mt-1">
              {statistics.total_kegiatan > 0 ? Math.round((statusKinerja.belum_mulai / statistics.total_kegiatan) * 100) : 0}% dari total
            </p>
          </div>
        </div>
      </div>

      {/* Kegiatan Menunggu Approval & Kegiatan Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kegiatan Menunggu Approval */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Menunggu Approval</h2>
            <Link href="/koordinator/kegiatan/approval" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua <LuArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((kegiatan) => (
                <Link 
                  key={kegiatan.id}
                  href={`/koordinator/kegiatan/approval/${kegiatan.id}`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{kegiatan.nama}</h3>
                      <p className="text-sm text-gray-500">oleh {kegiatan.pelaksana_nama}</p>
                      {kegiatan.kro_kode && (
                        <p className="text-xs text-gray-400 mt-1">{kegiatan.kro_kode}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusKinerjaColor(kegiatan.status_kinerja)}`}>
                      {kegiatan.status_kinerja}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <LuCircleCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada kegiatan menunggu approval</p>
            </div>
          )}
        </div>

        {/* Kegiatan Terbaru */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kegiatan Terbaru</h2>
            <Link href="/koordinator/kegiatan" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua <LuArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {allKegiatan.length > 0 ? (
            <div className="space-y-3">
              {allKegiatan.slice(0, 5).map((kegiatan) => (
                <Link 
                  key={kegiatan.id}
                  href={`/koordinator/kegiatan/${kegiatan.id}`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{kegiatan.nama}</h3>
                      <p className="text-sm text-gray-500">{kegiatan.pelaksana_nama}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(kegiatan.status)}`}>
                      {getStatusLabel(kegiatan.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <LuClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada kegiatan</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/koordinator/kegiatan/approval"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <LuClipboardCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Approval Kegiatan</h3>
            <p className="text-sm text-gray-500">Review dan setujui kegiatan</p>
          </div>
          <LuArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/koordinator/kegiatan"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <LuClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Monitoring Kegiatan</h3>
            <p className="text-sm text-gray-500">Lihat semua kegiatan tim</p>
          </div>
          <LuArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/koordinator/statistik"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <LuTrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Statistik Tim</h3>
            <p className="text-sm text-gray-500">Analisis kinerja tim</p>
          </div>
          <LuArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
