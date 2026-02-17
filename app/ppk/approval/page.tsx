'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LuClipboardCheck,
  LuSearch,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuCalendar,
  LuUser,
  LuArrowRight,
  LuClipboardList
} from 'react-icons/lu';

interface Kegiatan {
  id: number;
  nama: string;
  tim_nama: string;
  pelaksana_nama: string;
  koordinator_nama: string;
  status_pengajuan: string;
  anggaran_pagu: number;
  tanggal_approval_koordinator: string;
  tanggal_approval_ppk: string;
  approved_by_ppk: number | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
}

export default function PPKApprovalPage() {
  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = async () => {
    try {
      const res = await fetch('/api/ppk/kegiatan');
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan || []);
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'review_ppk':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <LuClock className="w-3 h-3" /> Menunggu Review
          </span>
        );
      case 'review_kepala':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <LuArrowRight className="w-3 h-3" /> Diteruskan ke Kepala
          </span>
        );
      case 'disetujui':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
            <LuCircleCheck className="w-3 h-3" /> Disetujui
          </span>
        );
      case 'ditolak':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
            <LuCircleX className="w-3 h-3" /> Ditolak
          </span>
        );
      case 'revisi':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
            <LuClock className="w-3 h-3" /> Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const filteredKegiatan = kegiatan.filter(k => {
    // Filter by status
    if (statusFilter === 'pending' && k.status_pengajuan !== 'review_ppk') return false;
    if (statusFilter === 'approved' && !['review_kepala', 'disetujui'].includes(k.status_pengajuan)) return false;
    // Untuk rejected, hanya tampilkan yang ditolak oleh PPK (ada tanggal_approval_ppk)
    if (statusFilter === 'rejected' && !(
      (k.status_pengajuan === 'ditolak' && k.tanggal_approval_ppk) || 
      k.status_pengajuan === 'revisi'
    )) return false;
    
    // Filter by search
    if (searchQuery) {
      return k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
             k.pelaksana_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             k.tim_nama?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const counts = {
    pending: kegiatan.filter(k => k.status_pengajuan === 'review_ppk').length,
    approved: kegiatan.filter(k => ['review_kepala', 'disetujui'].includes(k.status_pengajuan)).length,
    // Hanya hitung yang ditolak oleh PPK (ada tanggal_approval_ppk)
    rejected: kegiatan.filter(k => 
      (k.status_pengajuan === 'ditolak' && k.tanggal_approval_ppk) || 
      k.status_pengajuan === 'revisi'
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <LuClipboardCheck className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Approval Kegiatan</h1>
        </div>
        <p className="text-blue-100">Kelola persetujuan kegiatan dari pelaksana</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'pending'
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-yellow-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Menunggu Persetujuan</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.pending}</p>
            </div>
            <LuClock className="w-8 h-8 text-yellow-500" />
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'approved'
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Disetujui</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.approved}</p>
            </div>
            <LuCircleCheck className="w-8 h-8 text-green-500" />
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'rejected'
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 bg-white hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Ditolak</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.rejected}</p>
            </div>
            <LuCircleX className="w-8 h-8 text-red-500" />
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari kegiatan, tim, atau pelaksana..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Kegiatan List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredKegiatan.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredKegiatan.map((item) => (
              <Link
                key={item.id}
                href={`/ppk/kegiatan/approval/${item.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.nama}</h3>
                      {getStatusBadge(item.status_pengajuan)}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <LuUser className="w-4 h-4" />
                        <span>{item.pelaksana_nama}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span>Tim: {item.tim_nama}</span>
                      {item.koordinator_nama && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>Koordinator: {item.koordinator_nama}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Anggaran</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(item.anggaran_pagu || 0)}</p>
                    </div>
                    {item.tanggal_approval_koordinator && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                          <LuCalendar className="w-3 h-3" />
                          Review Koordinator
                        </p>
                        <p className="text-sm text-gray-700">{formatDate(item.tanggal_approval_koordinator)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <LuClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada kegiatan</h3>
            <p className="text-gray-500">
              {statusFilter === 'pending' && 'Tidak ada kegiatan yang menunggu persetujuan'}
              {statusFilter === 'approved' && 'Belum ada kegiatan yang disetujui'}
              {statusFilter === 'rejected' && 'Tidak ada kegiatan yang ditolak'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
