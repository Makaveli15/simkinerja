'use client';

import { useState, useEffect } from 'react';
import { 
  LuTrendingUp, 
  LuUsers, 
  LuClipboardList,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuCircleX,
  LuWallet
} from 'react-icons/lu';

interface StatistikData {
  total_kegiatan: number;
  kegiatan_pending: number;
  kegiatan_approved: number;
  kegiatan_rejected: number;
  kegiatan_bulan_ini: number;
  rata_rata_waktu_approval: number;
  total_anggaran: number;
  total_realisasi: number;
}

interface KegiatanPerBulan {
  bulan: string;
  total: number;
  approved: number;
  rejected: number;
}

export default function StatistikKinerjaPage() {
  const [loading, setLoading] = useState(true);
  const [statistik, setStatistik] = useState<StatistikData | null>(null);
  const [kegiatanPerBulan, setKegiatanPerBulan] = useState<KegiatanPerBulan[]>([]);

  useEffect(() => {
    fetchStatistik();
  }, []);

  const fetchStatistik = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ppk/statistik');
      if (response.ok) {
        const data = await response.json();
        setStatistik(data.statistik);
        setKegiatanPerBulan(data.kegiatan_per_bulan || []);
      }
    } catch (error) {
      console.error('Error fetching statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuTrendingUp className="w-6 h-6" />
              </div>
              Statistik Kinerja
            </h1>
            <p className="text-blue-100 mt-2">Ringkasan performa approval dan anggaran kegiatan</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
            <LuCalendar className="w-4 h-4" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistik?.total_kegiatan || 0}</p>
              <p className="text-xs text-gray-400 mt-1">kegiatan diproses</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LuClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Menunggu Approval</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistik?.kegiatan_pending || 0}</p>
              <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                pending
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
              <LuClock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Disetujui</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistik?.kegiatan_approved || 0}</p>
              <p className="text-xs text-green-600 mt-1">diteruskan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <LuCircleCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ditolak/Revisi</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistik?.kegiatan_rejected || 0}</p>
              <p className="text-xs text-red-600 mt-1">dikembalikan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <LuCircleX className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Anggaran Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuWallet className="w-5 h-5 text-blue-600" />
            Ringkasan Anggaran
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700 font-medium">Total Pagu Anggaran</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(statistik?.total_anggaran || 0)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700 font-medium">Total Realisasi</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(statistik?.total_realisasi || 0)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Serapan Anggaran</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full" 
                    style={{ 
                      width: `${statistik?.total_anggaran ? (statistik.total_realisasi / statistik.total_anggaran * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-700">
                  {statistik?.total_anggaran ? Math.round(statistik.total_realisasi / statistik.total_anggaran * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kegiatan Per Bulan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTrendingUp className="w-5 h-5 text-blue-600" />
            Kegiatan Per Bulan
          </h2>
          <div className="space-y-3">
            {kegiatanPerBulan.length > 0 ? (
              kegiatanPerBulan.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">{item.bulan}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Total: {item.total}</span>
                    <span className="text-sm text-green-600">✓ {item.approved}</span>
                    <span className="text-sm text-red-600">✗ {item.rejected}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LuUsers className="w-5 h-5 text-blue-600" />
          Ringkasan Approval
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700 font-medium">Kegiatan Bulan Ini</p>
            <p className="text-3xl font-bold text-blue-800">{statistik?.kegiatan_bulan_ini || 0}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-700 font-medium">Rata-rata Waktu Approval</p>
            <p className="text-3xl font-bold text-blue-800">{statistik?.rata_rata_waktu_approval || 0} <span className="text-lg font-normal">hari</span></p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-green-700 font-medium">Tingkat Persetujuan</p>
            <p className="text-3xl font-bold text-green-800">
              {statistik?.total_kegiatan ? Math.round(statistik.kegiatan_approved / statistik.total_kegiatan * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
