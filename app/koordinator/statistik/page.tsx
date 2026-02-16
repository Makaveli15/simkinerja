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
  LuWallet,
  LuTarget,
  LuTriangleAlert,
  LuActivity,
  LuArrowUp,
  LuArrowDown,
  LuTimer
} from 'react-icons/lu';

interface TimInfo {
  id: number;
  nama: string;
}

interface Ringkasan {
  total_kegiatan: number;
  kegiatan_selesai: number;
  kegiatan_berjalan: number;
  kegiatan_draft: number;
  kegiatan_dibatalkan: number;
  rata_rata_kinerja: number;
  total_pelaksana: number;
}

interface Anggaran {
  total: number;
  realisasi: number;
  sisa: number;
  persentase_serapan: number;
}

interface Output {
  total_target: number;
  total_realisasi: number;
  persentase_capaian: number;
}

interface Kendala {
  total: number;
  resolved: number;
  open: number;
}

interface DistribusiKinerja {
  sukses: number;
  perlu_perhatian: number;
  bermasalah: number;
  belum_dinilai: number;
}

interface PelaksanaStats {
  id: number;
  nama: string;
  email: string;
  total_kegiatan: number;
  kegiatan_selesai: number;
  kegiatan_berjalan: number;
  rata_rata_kinerja: number;
}

interface TrendBulanan {
  bulan: string;
  total_kegiatan: number;
  kegiatan_selesai: number;
  total_anggaran: number;
  total_realisasi: number;
}

interface TopKegiatan {
  id: number;
  nama: string;
  pelaksana: string;
  skor_kinerja: number;
  status_kinerja: string;
  status: string;
}

interface TopAnggaran {
  id: number;
  nama: string;
  pelaksana: string;
  anggaran: number;
  realisasi: number;
  serapan: number;
}

interface KegiatanDeadline {
  id: number;
  nama: string;
  pelaksana: string;
  tanggal_selesai: string;
  sisa_hari: number;
}

interface KegiatanTerlambat {
  id: number;
  nama: string;
  pelaksana: string;
  tanggal_selesai: string;
  hari_terlambat: number;
}

interface StatistikData {
  tim: TimInfo | null;
  ringkasan: Ringkasan;
  anggaran: Anggaran;
  output: Output;
  kendala: Kendala;
  distribusi_kinerja: DistribusiKinerja;
  pelaksana: PelaksanaStats[];
  trend_bulanan: TrendBulanan[];
  top_kinerja: TopKegiatan[];
  bottom_kinerja: TopKegiatan[];
  top_anggaran: TopAnggaran[];
  kegiatan_deadline: KegiatanDeadline[];
  kegiatan_terlambat: KegiatanTerlambat[];
}

export default function StatistikKinerjaPage() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StatistikData | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchStatistik();
  }, []);

  const fetchStatistik = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/koordinator/statistik');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const formatBulan = (bulan: string) => {
    const [year, month] = bulan.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const getKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'text-emerald-600 bg-emerald-50';
      case 'Perlu Perhatian': return 'text-amber-600 bg-amber-50';
      case 'Bermasalah': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Gagal memuat data statistik</p>
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
              Statistik Kinerja Tim
            </h1>
            <p className="text-blue-100 mt-2">
              {data.tim ? `Tim ${data.tim.nama}` : 'Data statistik tim Anda'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
            <LuCalendar className="w-4 h-4" />
            {mounted ? new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 1: Kegiatan & Kinerja */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.total_kegiatan}</p>
              <p className="text-xs text-gray-400 mt-1">kegiatan tim</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LuClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Rata-rata Kinerja</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.rata_rata_kinerja}</p>
              <p className="text-xs text-gray-400 mt-1">skor tim</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <LuTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Kegiatan Selesai</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.kegiatan_selesai}</p>
              <p className="text-xs text-gray-400 mt-1">dari {data.ringkasan.total_kegiatan} kegiatan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <LuCircleCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Pelaksana</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.total_pelaksana}</p>
              <p className="text-xs text-gray-400 mt-1">anggota tim</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <LuUsers className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2: Anggaran & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Anggaran Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuWallet className="w-5 h-5 text-blue-600" />
            Statistik Anggaran
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Anggaran</span>
              <span className="font-semibold text-gray-900">{formatCurrency(data.anggaran.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Realisasi</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(data.anggaran.realisasi)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sisa Anggaran</span>
              <span className="font-semibold text-amber-600">{formatCurrency(data.anggaran.sisa)}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Serapan Anggaran</span>
                <span className="font-semibold text-blue-600">{data.anggaran.persentase_serapan}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.anggaran.persentase_serapan, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTarget className="w-5 h-5 text-emerald-600" />
            Statistik Output
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Target Output</span>
              <span className="font-semibold text-gray-900">{formatNumber(data.output.total_target)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Realisasi Output</span>
              <span className="font-semibold text-emerald-600">{formatNumber(data.output.total_realisasi)}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Capaian Output</span>
                <span className="font-semibold text-emerald-600">{data.output.persentase_capaian}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.output.persentase_capaian, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600">Total Kendala</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-600">{data.kendala.open} open</span>
                <span className="text-sm text-emerald-600">{data.kendala.resolved} resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribusi Kinerja & Status Kegiatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribusi Kinerja */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuActivity className="w-5 h-5 text-indigo-600" />
            Distribusi Status Kinerja
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-emerald-700 font-medium">Sukses</span>
              </div>
              <span className="font-bold text-emerald-700">{data.distribusi_kinerja.sukses}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-amber-700 font-medium">Perlu Perhatian</span>
              </div>
              <span className="font-bold text-amber-700">{data.distribusi_kinerja.perlu_perhatian}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-red-700 font-medium">Bermasalah</span>
              </div>
              <span className="font-bold text-red-700">{data.distribusi_kinerja.bermasalah}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-700 font-medium">Belum Dinilai</span>
              </div>
              <span className="font-bold text-gray-700">{data.distribusi_kinerja.belum_dinilai}</span>
            </div>
          </div>
        </div>

        {/* Status Kegiatan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuClipboardList className="w-5 h-5 text-blue-600" />
            Status Kegiatan
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuClock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Berjalan</span>
              </div>
              <span className="font-bold text-blue-700">{data.ringkasan.kegiatan_berjalan}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuCircleCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Selesai</span>
              </div>
              <span className="font-bold text-emerald-700">{data.ringkasan.kegiatan_selesai}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuClipboardList className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Draft</span>
              </div>
              <span className="font-bold text-gray-700">{data.ringkasan.kegiatan_draft}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuCircleX className="w-4 h-4 text-red-600" />
                <span className="text-red-700 font-medium">Dibatalkan</span>
              </div>
              <span className="font-bold text-red-700">{data.ringkasan.kegiatan_dibatalkan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Bulanan */}
      {data.trend_bulanan.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuCalendar className="w-5 h-5 text-purple-600" />
            Trend 6 Bulan Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Bulan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Total Kegiatan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Selesai</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Anggaran</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Realisasi</th>
                </tr>
              </thead>
              <tbody>
                {data.trend_bulanan.map((trend, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{formatBulan(trend.bulan)}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{trend.total_kegiatan}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        {trend.kegiatan_selesai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(trend.total_anggaran)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(trend.total_realisasi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kinerja Pelaksana */}
      {data.pelaksana.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuUsers className="w-5 h-5 text-blue-600" />
            Kinerja Pelaksana
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nama Pelaksana</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Total Kegiatan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Berjalan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Selesai</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Rata-rata Kinerja</th>
                </tr>
              </thead>
              <tbody>
                {data.pelaksana.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{p.nama}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-700">{p.total_kegiatan}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {p.kegiatan_berjalan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        {p.kegiatan_selesai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        p.rata_rata_kinerja >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        p.rata_rata_kinerja >= 60 ? 'bg-amber-100 text-amber-700' :
                        p.rata_rata_kinerja > 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.rata_rata_kinerja}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top & Bottom Kinerja */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Kinerja Tertinggi */}
        {data.top_kinerja.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuArrowUp className="w-5 h-5 text-emerald-600" />
              Top 5 Kinerja Tertinggi
            </h3>
            <div className="space-y-3">
              {data.top_kinerja.map((k, idx) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                      <p className="text-xs text-gray-500">{k.pelaksana}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getKinerjaColor(k.status_kinerja)}`}>
                    {k.skor_kinerja}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Kinerja Terendah */}
        {data.bottom_kinerja.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuArrowDown className="w-5 h-5 text-red-600" />
              Top 5 Kinerja Terendah
            </h3>
            <div className="space-y-3">
              {data.bottom_kinerja.map((k, idx) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                      <p className="text-xs text-gray-500">{k.pelaksana}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getKinerjaColor(k.status_kinerja)}`}>
                    {k.skor_kinerja}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Anggaran Terbesar */}
      {data.top_anggaran.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuWallet className="w-5 h-5 text-blue-600" />
            Top 5 Kegiatan dengan Anggaran Terbesar
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kegiatan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Pelaksana</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Anggaran</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Realisasi</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Serapan</th>
                </tr>
              </thead>
              <tbody>
                {data.top_anggaran.map((k) => (
                  <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{k.nama}</td>
                    <td className="py-3 px-4 text-gray-600">{k.pelaksana}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(k.anggaran)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(k.realisasi)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        k.serapan >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        k.serapan >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {k.serapan}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kegiatan Deadline & Terlambat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kegiatan Mendekati Deadline */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTimer className="w-5 h-5 text-amber-600" />
            Mendekati Deadline (7 Hari)
          </h3>
          {data.kegiatan_deadline.length > 0 ? (
            <div className="space-y-3">
              {data.kegiatan_deadline.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                    <p className="text-xs text-gray-500">{k.pelaksana}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                      {k.sisa_hari} hari lagi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Tidak ada kegiatan mendekati deadline</p>
          )}
        </div>

        {/* Kegiatan Terlambat */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTriangleAlert className="w-5 h-5 text-red-600" />
            Kegiatan Terlambat
          </h3>
          {data.kegiatan_terlambat.length > 0 ? (
            <div className="space-y-3">
              {data.kegiatan_terlambat.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                    <p className="text-xs text-gray-500">{k.pelaksana}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                      {k.hari_terlambat} hari
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Tidak ada kegiatan terlambat 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
