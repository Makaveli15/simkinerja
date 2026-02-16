'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  LuChevronRight
} from 'react-icons/lu';

interface Statistics {
  total_kegiatan: number;
  menunggu_approval: number;
  rata_rata_kinerja: number;
  total_pelaksana: number;
}

interface StatusKinerja {
  sukses: number;
  perlu_perhatian: number;
  bermasalah: number;
  belum_mulai: number;
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
}

export default function KoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [tim, setTim] = useState<Tim | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    total_kegiatan: 0,
    menunggu_approval: 0,
    rata_rata_kinerja: 0,
    total_pelaksana: 0
  });
  const [statusKinerja, setStatusKinerja] = useState<StatusKinerja>({
    sukses: 0,
    perlu_perhatian: 0,
    bermasalah: 0,
    belum_mulai: 0
  });
  const [recentActivities, setRecentActivities] = useState<Kegiatan[]>([]);

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
        setStatistics(data.statistics);
        setStatusKinerja(data.status_kinerja);
        setRecentActivities(data.recent_activities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'text-green-600 bg-green-100';
      case 'Perlu Perhatian': return 'text-yellow-600 bg-yellow-100';
      case 'Bermasalah': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuClipboardCheck className="w-6 h-6" />
              </div>
              Dashboard Koordinator
            </h1>
            {tim && (
              <p className="text-blue-100 mt-2">Monitoring kinerja {tim.nama}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
              <LuCalendar className="w-4 h-4" />
              {mounted ? new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </div>
            {statistics.menunggu_approval > 0 && (
              <Link
                href="/koordinator/kegiatan/approval"
                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-sm"
              >
                <LuClock className="w-4 h-4" />
                {statistics.menunggu_approval} Menunggu
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_kegiatan}</p>
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
              <p className="text-sm text-gray-500 font-medium">Menunggu Approval</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.menunggu_approval}</p>
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                perlu review
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <LuClock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Rata-rata Kinerja</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.rata_rata_kinerja}%</p>
              <p className="text-xs text-green-600 mt-1">skor kinerja</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LuTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pelaksana Tim</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_pelaksana}</p>
              <p className="text-xs text-gray-400 mt-1">anggota aktif</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <LuUsers className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Kinerja Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Status Kinerja</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Sukses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${statistics.total_kegiatan > 0 ? (statusKinerja.sukses / statistics.total_kegiatan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{statusKinerja.sukses}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-700">Perlu Perhatian</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${statistics.total_kegiatan > 0 ? (statusKinerja.perlu_perhatian / statistics.total_kegiatan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{statusKinerja.perlu_perhatian}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-700">Bermasalah</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${statistics.total_kegiatan > 0 ? (statusKinerja.bermasalah / statistics.total_kegiatan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{statusKinerja.bermasalah}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-700">Belum Mulai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-400 rounded-full"
                    style={{ width: `${statistics.total_kegiatan > 0 ? (statusKinerja.belum_mulai / statistics.total_kegiatan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{statusKinerja.belum_mulai}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kegiatan Menunggu Approval */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kegiatan Menunggu Approval</h2>
            <Link href="/koordinator/kegiatan/approval" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              Lihat Semua <LuArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((kegiatan) => (
                <Link 
                  key={kegiatan.id}
                  href={`/koordinator/kegiatan/approval/${kegiatan.id}`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{kegiatan.nama}</h3>
                      <p className="text-sm text-gray-500">oleh {kegiatan.pelaksana_nama}</p>
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
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
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
