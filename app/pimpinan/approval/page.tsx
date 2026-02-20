'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAlertModal } from '@/app/components/AlertModal';
import { 
  LuClipboardCheck,
  LuSearch,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuUser,
  LuChartBar,
  LuUsers,
  LuHourglass,
  LuPaperclip
} from 'react-icons/lu';

interface ValidasiKuantitas {
  id: number;
  kegiatan_id: number;
  kegiatan_nama: string;
  satuan_output: string;
  target_output: number;
  pelaksana_nama: string;
  koordinator_nama?: string;
  tim_nama: string;
  jumlah_output: number;
  bukti_path?: string;
  keterangan?: string;
  catatan_koordinator?: string;
  status: 'draft' | 'menunggu' | 'disahkan' | 'ditolak';
  status_kesubag: 'pending' | 'valid' | 'tidak_valid';
  status_pimpinan: 'pending' | 'valid' | 'tidak_valid';
  created_at: string;
  validated_kesubag_at?: string;
}

export default function PimpinanApprovalPage() {
  const [loading, setLoading] = useState(true);
  const [validasiKuantitas, setValidasiKuantitas] = useState<ValidasiKuantitas[]>([]);
  const [filteredValidasi, setFilteredValidasi] = useState<ValidasiKuantitas[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { showSuccess, showError, AlertModal } = useAlertModal();

  useEffect(() => {
    fetchValidasiKuantitas();
  }, []);

  useEffect(() => {
    filterValidasi();
  }, [validasiKuantitas, searchQuery, statusFilter]);

  const fetchValidasiKuantitas = async () => {
    try {
      const res = await fetch('/api/pimpinan/validasi-kuantitas');
      if (res.ok) {
        const data = await res.json();
        setValidasiKuantitas(data.validasi || []);
      }
    } catch (error) {
      console.error('Error fetching validasi kuantitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterValidasi = () => {
    let filtered = [...validasiKuantitas];

    if (statusFilter === 'pending') {
      // Menunggu validasi pimpinan = sudah disetujui koordinator, belum divalidasi pimpinan
      filtered = filtered.filter(v => v.status_kesubag === 'valid' && v.status_pimpinan === 'pending');
    } else if (statusFilter === 'disahkan') {
      filtered = filtered.filter(v => v.status === 'disahkan');
    } else if (statusFilter === 'ditolak') {
      filtered = filtered.filter(v => v.status === 'ditolak');
    }

    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.kegiatan_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.pelaksana_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tim_nama?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredValidasi(filtered);
  };

  const handleValidasiKuantitas = async (id: number, action: 'approve' | 'reject', catatan?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/pimpinan/validasi-kuantitas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, catatan })
      });

      if (res.ok) {
        showSuccess('Berhasil', action === 'approve' ? 'Validasi berhasil disetujui' : 'Validasi berhasil ditolak');
        fetchValidasiKuantitas();
      } else {
        const data = await res.json();
        showError('Gagal', data.error || 'Gagal memproses validasi');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Gagal', 'Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = validasiKuantitas.filter(v => 
    v.status_kesubag === 'valid' && v.status_pimpinan === 'pending'
  ).length;

  const disahkanCount = validasiKuantitas.filter(v => v.status === 'disahkan').length;
  const ditolakCount = validasiKuantitas.filter(v => v.status === 'ditolak').length;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validasi Output Kuantitas</h1>
          <p className="text-gray-600">Review dan sahkan output yang telah disetujui koordinator</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-700 font-medium">
              {pendingCount} output menunggu validasi Anda
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <LuClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              <p className="text-sm text-yellow-600">Menunggu Validasi</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <LuCircleCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{disahkanCount}</p>
              <p className="text-sm text-green-600">Disahkan</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <LuCircleX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{ditolakCount}</p>
              <p className="text-sm text-red-600">Ditolak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kegiatan, pelaksana, atau tim..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Menunggu ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('disahkan')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'disahkan'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Disahkan
          </button>
          <button
            onClick={() => setStatusFilter('ditolak')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'ditolak'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Ditolak
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Validasi List */}
      <div className="space-y-4">
        {filteredValidasi.length > 0 ? (
          filteredValidasi.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-6 hover:shadow-md transition-shadow ${
                item.status_kesubag === 'valid' && item.status_pimpinan === 'pending' 
                  ? 'border-yellow-200 bg-yellow-50/30' 
                  : item.status === 'disahkan' 
                    ? 'border-green-200' 
                    : item.status === 'ditolak' 
                      ? 'border-red-200' 
                      : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.kegiatan_nama}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <LuUser className="w-3 h-3" /> {item.pelaksana_nama}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <LuUsers className="w-3 h-3" /> Tim: {item.tim_nama}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      item.status_kesubag === 'valid' && item.status_pimpinan === 'pending'
                        ? 'bg-yellow-100 text-yellow-700' 
                        : item.status === 'disahkan' 
                          ? 'bg-green-100 text-green-700' 
                          : item.status === 'ditolak' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status_kesubag === 'valid' && item.status_pimpinan === 'pending'
                        ? <><LuHourglass className="w-3 h-3" /> Menunggu Validasi Anda</> 
                        : item.status === 'disahkan' 
                          ? <><LuCircleCheck className="w-3 h-3" /> Disahkan</> 
                          : item.status === 'ditolak' 
                            ? <><LuCircleX className="w-3 h-3" /> Ditolak</> 
                            : item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">Jumlah Output</p>
                      <p className="font-bold text-blue-700">{Math.round(Number(item.jumlah_output))} {item.satuan_output}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="font-medium text-gray-900">{Math.round(Number(item.target_output))} {item.satuan_output}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Divalidasi Koordinator</p>
                      <p className="font-medium text-gray-900">{item.koordinator_nama || '-'}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Tanggal Submit</p>
                      <p className="font-medium text-gray-900">{formatDate(item.created_at)}</p>
                    </div>
                  </div>

                  {item.keterangan && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <span className="font-medium">Keterangan Pelaksana:</span> {item.keterangan}
                    </p>
                  )}

                  {item.catatan_koordinator && (
                    <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium">Catatan Koordinator:</span> {item.catatan_koordinator}
                    </p>
                  )}

                  {item.bukti_path && (
                    <a
                      href={item.bukti_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <LuPaperclip className="w-4 h-4" /> Lihat Bukti Dukung
                    </a>
                  )}
                </div>

                {item.status_kesubag === 'valid' && item.status_pimpinan === 'pending' && (
                  <div className="flex flex-col gap-2 lg:items-end">
                    <button
                      onClick={() => handleValidasiKuantitas(item.id, 'approve')}
                      disabled={processingId === item.id}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <LuCircleCheck className="w-4 h-4" />
                      Sahkan
                    </button>
                    <button
                      onClick={() => {
                        const catatan = prompt('Masukkan alasan penolakan:');
                        if (catatan) handleValidasiKuantitas(item.id, 'reject', catatan);
                      }}
                      disabled={processingId === item.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <LuCircleX className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <LuChartBar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada validasi output</h3>
            <p className="text-gray-500">
              {statusFilter === 'pending'
                ? 'Belum ada output kuantitas yang menunggu validasi Anda'
                : 'Tidak ditemukan data dengan filter yang dipilih'}
            </p>
          </div>
        )}
      </div>

      <AlertModal />
    </div>
  );
}
