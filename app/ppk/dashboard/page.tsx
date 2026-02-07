'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LuClipboardList,
  LuClipboardCheck,
  LuClock,
  LuCircleX,
  LuTrendingUp,
  LuCalendar,
  LuArrowRight,
  LuWallet,
  LuChevronRight
} from 'react-icons/lu';

interface DashboardStats {
  total_kegiatan: number;
  menunggu_review: number;
  disetujui: number;
  ditolak: number;
  total_anggaran: number;
  rata_rata_kinerja: number;
}

interface PendingApproval {
  id: number;
  nama: string;
  tim_nama: string;
  pelaksana_nama: string;
  koordinator_nama: string;
  anggaran_pagu: number;
  tanggal_approval_koordinator: string;
}

interface StatusDistribution {
  status: string;
  jumlah: number;
}

export default function PPKDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/ppk/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setPendingApprovals(data.pending_approvals || []);
        setStatusDistribution(data.status_distribution || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
                <LuWallet className="w-6 h-6" />
              </div>
              Dashboard PPK
            </h1>
            <p className="text-blue-100 mt-2">Validasi kegiatan setelah review koordinator</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
              <LuCalendar className="w-4 h-4" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {(stats?.menunggu_review || 0) > 0 && (
              <Link
                href="/ppk/kegiatan/approval"
                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-sm"
              >
                <LuClock className="w-4 h-4" />
                {stats?.menunggu_review} Menunggu
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_kegiatan || 0}</p>
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
              <p className="text-sm text-gray-500 font-medium">Menunggu Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.menunggu_review || 0}</p>
              <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                perlu validasi
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
              <LuClock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Disetujui</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.disetujui || 0}</p>
              <p className="text-xs text-green-600 mt-1">diteruskan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <LuClipboardCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ditolak</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.ditolak || 0}</p>
              <p className="text-xs text-red-600 mt-1">dikembalikan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <LuCircleX className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Anggaran Kegiatan</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(stats?.total_anggaran || 0)}</p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <LuClipboardList className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Rata-rata Kinerja</p>
              <p className="text-3xl font-bold mt-2">{stats?.rata_rata_kinerja || 0}%</p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <LuTrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Menunggu Review</h2>
            <Link href="/ppk/kegiatan/approval" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              Lihat Semua <LuArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/ppk/kegiatan/approval/${item.id}`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.nama}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.tim_nama} • Pelaksana: {item.pelaksana_nama}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Disetujui Koordinator: {item.koordinator_nama}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.anggaran_pagu)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                        <LuCalendar className="w-3 h-3" />
                        {formatDate(item.tanggal_approval_koordinator)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LuClipboardCheck className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">Tidak ada kegiatan yang perlu direview</p>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Status</h2>
          <div className="space-y-4">
            {statusDistribution.map((item, index) => {
              const colors: Record<string, { bg: string; bar: string; text: string }> = {
                'Menunggu Review': { bg: 'bg-orange-50', bar: 'bg-orange-500', text: 'text-orange-600' },
                'Diteruskan ke Kepala': { bg: 'bg-purple-50', bar: 'bg-purple-500', text: 'text-purple-600' },
                'Disetujui': { bg: 'bg-green-50', bar: 'bg-green-500', text: 'text-green-600' },
                'Ditolak/Revisi': { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-600' }
              };
              const color = colors[item.status] || { bg: 'bg-gray-50', bar: 'bg-gray-500', text: 'text-gray-600' };
              const total = statusDistribution.reduce((sum, s) => sum + s.jumlah, 0);
              const percentage = total > 0 ? Math.round((item.jumlah / total) * 100) : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${color.text}`}>
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-500">{item.jumlah}</span>
                  </div>
                  <div className={`h-2 rounded-full ${color.bg}`}>
                    <div 
                      className={`h-full rounded-full ${color.bar}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {statusDistribution.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
