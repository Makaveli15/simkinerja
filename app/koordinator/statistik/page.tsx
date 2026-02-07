'use client';

import { useState, useEffect } from 'react';
import { 
  LuTrendingUp, 
  LuUsers, 
  LuClipboardList,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuCircleX
} from 'react-icons/lu';

interface StatistikData {
  total_kegiatan: number;
  kegiatan_pending: number;
  kegiatan_approved: number;
  kegiatan_rejected: number;
  kegiatan_bulan_ini: number;
  rata_rata_waktu_approval: number;
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
      const response = await fetch('/api/koordinator/statistik');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistik Kinerja</h1>
          <p className="text-gray-600">Ringkasan performa approval kegiatan tim Anda</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LuCalendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <LuClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kegiatan</p>
              <p className="text-2xl font-bold text-gray-900">{statistik?.total_kegiatan || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <LuClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Menunggu Approval</p>
              <p className="text-2xl font-bold text-gray-900">{statistik?.kegiatan_pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <LuCircleCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-gray-900">{statistik?.kegiatan_approved || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <LuCircleX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ditolak/Revisi</p>
              <p className="text-2xl font-bold text-gray-900">{statistik?.kegiatan_rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts/Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kegiatan Per Bulan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTrendingUp className="w-5 h-5 text-green-600" />
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

        {/* Info Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuUsers className="w-5 h-5 text-green-600" />
            Ringkasan Approval
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700 font-medium">Kegiatan Bulan Ini</p>
              <p className="text-3xl font-bold text-green-800">{statistik?.kegiatan_bulan_ini || 0}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700 font-medium">Rata-rata Waktu Approval</p>
              <p className="text-3xl font-bold text-blue-800">{statistik?.rata_rata_waktu_approval || 0} <span className="text-lg font-normal">hari</span></p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Tingkat Persetujuan</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full" 
                    style={{ 
                      width: `${statistik?.total_kegiatan ? (statistik.kegiatan_approved / statistik.total_kegiatan * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-700">
                  {statistik?.total_kegiatan ? Math.round(statistik.kegiatan_approved / statistik.total_kegiatan * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
