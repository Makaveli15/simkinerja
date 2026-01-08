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
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface UserInfo {
  id: number;
  username: string;
  nama_lengkap: string;
  tim_nama: string;
  tim_id: number;
}

interface DashboardStats {
  totalKegiatan: number;
  kegiatanSelesai: number;
  kegiatanBerjalan: number;
  kegiatanBelum: number;
  kegiatanBermasalah: number;
  persentaseSelesai: number;
  totalKendala: number;
  kendalaResolved: number;
  skorKinerja: number;
  totalPagu: number;
  totalRealisasiAnggaran: number;
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

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface Kegiatan {
  id: number;
  nama: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  kro_nama?: string;
}

export default function PelaksanaDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalKegiatan: 0,
    kegiatanSelesai: 0,
    kegiatanBerjalan: 0,
    kegiatanBelum: 0,
    kegiatanBermasalah: 0,
    persentaseSelesai: 0,
    totalKendala: 0,
    kendalaResolved: 0,
    skorKinerja: 0,
    totalPagu: 0,
    totalRealisasiAnggaran: 0,
  });
  const [progresData, setProgresData] = useState<ProgresData[]>([]);
  const [anggaranData, setAnggaranData] = useState<AnggaranData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [kegiatanTerbaru, setKegiatanTerbaru] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Fetch user info
      const profileRes = await fetch('/api/pelaksana/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserInfo(profileData);
      }

      // Fetch dashboard data
      const res = await fetch('/api/pelaksana/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setKegiatanTerbaru(data.kegiatanTerbaru || []);
        setProgresData(data.progresChart || []);
        setAnggaranData(data.anggaranChart || []);
        
        // Set status chart data
        setStatusData([
          { name: 'Selesai', value: data.stats.kegiatanSelesai, color: '#10B981' },
          { name: 'Berjalan', value: data.stats.kegiatanBerjalan, color: '#3B82F6' },
          { name: 'Belum Mulai', value: data.stats.kegiatanBelum, color: '#9CA3AF' },
          { name: 'Bermasalah', value: data.stats.kegiatanBermasalah, color: '#EF4444' },
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'bg-green-100 text-green-700';
      case 'berjalan':
        return 'bg-blue-100 text-blue-700';
      case 'belum_mulai':
        return 'bg-gray-100 text-gray-700';
      case 'bermasalah':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'berjalan': return 'Berjalan';
      case 'belum_mulai': return 'Belum Mulai';
      case 'bermasalah': return 'Bermasalah';
      default: return status;
    }
  };

  const getSkorKinerjaBadge = (skor: number) => {
    if (skor >= 80) return { bg: 'bg-green-100 text-green-700', label: 'Sukses' };
    if (skor >= 60) return { bg: 'bg-yellow-100 text-yellow-700', label: 'Perlu Perhatian' };
    if (skor > 0) return { bg: 'bg-red-100 text-red-700', label: 'Bermasalah' };
    return { bg: 'bg-gray-100 text-gray-700', label: 'Belum Dinilai' };
  };

  const serapanPersen = stats.totalPagu > 0 
    ? ((stats.totalRealisasiAnggaran / stats.totalPagu) * 100).toFixed(1) 
    : '0';

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

  const skorKinerja = getSkorKinerjaBadge(stats.skorKinerja);

  return (
    <div className="space-y-6">
      {/* Welcome Banner with User Info */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Selamat Datang, {userInfo?.nama_lengkap || userInfo?.username}! 👋</h1>
            <p className="text-blue-100">
              Tim: <span className="font-semibold text-white">{userInfo?.tim_nama || '-'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-blue-100">Skor Kinerja Tim</p>
              <p className="text-3xl font-bold">{stats.skorKinerja}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${skorKinerja.bg}`}>
              {skorKinerja.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kegiatan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalKegiatan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{stats.kegiatanSelesai}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Berjalan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.kegiatanBerjalan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bermasalah</p>
              <p className="text-2xl font-bold text-gray-900">{stats.kegiatanBermasalah}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Serapan</p>
              <p className="text-2xl font-bold text-gray-900">{serapanPersen}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Progres Kegiatan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Grafik Progres Kegiatan</h3>
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
                <Line 
                  type="monotone" 
                  dataKey="progres" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  name="Realisasi (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10B981', strokeWidth: 2 }}
                  name="Target (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Belum ada data progres
            </div>
          )}
        </div>

        {/* Grafik Serapan Anggaran */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Grafik Serapan Anggaran</h3>
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
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : '-'}
                />
                <Legend />
                <Bar dataKey="pagu" fill="#E5E7EB" name="Pagu" radius={[4, 4, 0, 0]} />
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
        {/* Status Kinerja Pie Chart */}
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
              <p className="text-sm text-gray-500">Total Pagu</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalPagu)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-500">Total Realisasi</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalRealisasiAnggaran)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-gray-500">Sisa Anggaran</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPagu - stats.totalRealisasiAnggaran)}</p>
            </div>
          </div>
        </div>

        {/* Ringkasan Kendala */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Status Kendala</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalKendala}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.kendalaResolved}</p>
              </div>
            </div>
            {stats.totalKendala > 0 && (
              <>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.kendalaResolved / stats.totalKendala) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  {Math.round((stats.kendalaResolved / stats.totalKendala) * 100)}% kendala telah diselesaikan
                </p>
              </>
            )}
            <div className="p-4 bg-yellow-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalKendala - stats.kendalaResolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Kegiatan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Kegiatan Terbaru</h3>
          <Link 
            href="/pelaksana/kegiatan"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {kegiatanTerbaru.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kegiatan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">KRO</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Periode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pagu</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kegiatanTerbaru.map((kegiatan) => (
                  <tr key={kegiatan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{kegiatan.nama}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{kegiatan.kro_nama || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(kegiatan.status)}`}>
                        {getStatusLabel(kegiatan.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(kegiatan.tanggal_mulai)} - {formatDate(kegiatan.tanggal_selesai)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatCurrency(kegiatan.anggaran_pagu || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/pelaksana/kegiatan/${kegiatan.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">Belum ada kegiatan</p>
              <Link
                href="/pelaksana/kegiatan/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Kegiatan
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
