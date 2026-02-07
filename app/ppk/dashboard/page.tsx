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
  LuArrowRight
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard PPK</h1>
        <p className="text-gray-600">Validasi kegiatan setelah review koordinator</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <LuClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kegiatan</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_kegiatan || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <LuClock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Menunggu Review</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.menunggu_review || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <LuClipboardCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">{stats?.disetujui || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <LuCircleX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{stats?.ditolak || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total Anggaran Kegiatan</p>
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
            <Link href="/ppk/kegiatan/approval" className="text-orange-600 text-sm hover:underline flex items-center gap-1">
              Lihat Semua <LuArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/ppk/kegiatan/approval/${item.id}`}
                  className="block p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
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
