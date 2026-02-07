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
  LuTriangleAlert
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Koordinator</h1>
          {tim && (
            <p className="text-gray-600">Monitoring kinerja {tim.nama}</p>
          )}
        </div>
        <Link
          href="/koordinator/kegiatan/approval"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <LuClipboardCheck className="w-5 h-5" />
          Approval Kegiatan
          {statistics.menunggu_approval > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {statistics.menunggu_approval}
            </span>
          )}
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <LuClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_kegiatan}</p>
              <p className="text-sm text-gray-500">Total Kegiatan</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <LuClock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.menunggu_approval}</p>
              <p className="text-sm text-gray-500">Menunggu Approval</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <LuTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.rata_rata_kinerja}%</p>
              <p className="text-sm text-gray-500">Rata-rata Kinerja</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <LuUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_pelaksana}</p>
              <p className="text-sm text-gray-500">Pelaksana Tim</p>
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
            <Link href="/koordinator/kegiatan/approval" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
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
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <LuClipboardCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Approval Kegiatan</h3>
            <p className="text-sm text-gray-500">Review dan setujui kegiatan</p>
          </div>
          <LuArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
        </Link>

        <Link
          href="/koordinator/kegiatan"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
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
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
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
