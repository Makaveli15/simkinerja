'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LuArrowLeft,
  LuCalendar,
  LuUser,
  LuFileText,
  LuTrendingUp,
  LuWallet,
  LuTarget,
  LuCircleCheck,
  LuTriangleAlert,
  LuClock,
  LuDownload,
  LuHistory,
  LuBuilding
} from 'react-icons/lu';

interface KegiatanDetail {
  id: number;
  nama: string;
  deskripsi: string;
  tim_nama: string;
  kro_kode: string;
  kro_nama: string;
  pelaksana_id: number;
  pelaksana_nama: string;
  status: string;
  status_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  anggaran_realisasi: number;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  skor_kinerja: number;
  status_kinerja: string;
  catatan_koordinator: string;
  catatan_ppk: string;
  catatan_pimpinan: string;
}

interface ApprovalHistory {
  id: number;
  level: string;
  status: string;
  catatan: string;
  approver_nama: string;
  created_at: string;
}

interface Dokumen {
  id: number;
  nama_file: string;
  path_file: string;
  keterangan: string;
  status_validasi: string;
  created_at: string;
}

export default function PPKKegiatanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [dokumen, setDokumen] = useState<Dokumen[]>([]);

  useEffect(() => {
    fetchKegiatan();
  }, [id]);

  const fetchKegiatan = async () => {
    try {
      const res = await fetch(`/api/ppk/kegiatan/${id}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan);
        setApprovalHistory(data.approval_history || []);
        setDokumen(data.dokumen || []);
      } else {
        router.push('/ppk/kegiatan');
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
      router.push('/ppk/kegiatan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'bg-green-100 text-green-700';
      case 'Perlu Perhatian': return 'bg-yellow-100 text-yellow-700';
      case 'Bermasalah': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      berjalan: 'bg-blue-100 text-blue-700',
      selesai: 'bg-green-100 text-green-700',
      dibatalkan: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusPengajuan = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
      diajukan: { label: 'Diajukan', color: 'bg-blue-100 text-blue-700' },
      review_koordinator: { label: 'Review Koordinator', color: 'bg-yellow-100 text-yellow-700' },
      review_ppk: { label: 'Review PPK', color: 'bg-orange-100 text-orange-700' },
      review_kepala: { label: 'Review Kepala', color: 'bg-purple-100 text-purple-700' },
      disetujui: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
      ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
      revisi: { label: 'Perlu Revisi', color: 'bg-yellow-100 text-yellow-700' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!kegiatan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kegiatan tidak ditemukan</p>
        <Link href="/ppk/kegiatan" className="text-blue-600 hover:underline mt-2 inline-block">
          Kembali ke daftar kegiatan
        </Link>
      </div>
    );
  }

  const statusPengajuan = getStatusPengajuan(kegiatan.status_pengajuan);
  const progressOutput = kegiatan.target_output > 0 
    ? Math.round((kegiatan.output_realisasi || 0) / kegiatan.target_output * 100) 
    : 0;
  const progressAnggaran = kegiatan.anggaran_pagu > 0 
    ? Math.round((kegiatan.anggaran_realisasi || 0) / kegiatan.anggaran_pagu * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <LuArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{kegiatan.nama}</h1>
          <p className="text-gray-600">{kegiatan.kro_kode} - {kegiatan.kro_nama}</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(kegiatan.status)}`}>
          Status: {kegiatan.status}
        </span>
        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${statusPengajuan.color}`}>
          Pengajuan: {statusPengajuan.label}
        </span>
        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusKinerjaColor(kegiatan.status_kinerja)}`}>
          Kinerja: {kegiatan.status_kinerja}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deskripsi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuFileText className="w-5 h-5 text-blue-600" />
              Deskripsi
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">{kegiatan.deskripsi || 'Tidak ada deskripsi'}</p>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Output Progress */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <LuTarget className="w-5 h-5 text-blue-600" />
                  Progress Output
                </h3>
                <span className="text-2xl font-bold text-blue-600">{progressOutput}%</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progressOutput}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Realisasi: {kegiatan.output_realisasi || 0}</span>
                  <span>Target: {kegiatan.target_output} {kegiatan.satuan_output}</span>
                </div>
              </div>
            </div>

            {/* Budget Progress */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <LuWallet className="w-5 h-5 text-blue-600" />
                  Progress Anggaran
                </h3>
                <span className="text-2xl font-bold text-blue-600">{progressAnggaran}%</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progressAnggaran}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Realisasi: {formatCurrency(kegiatan.anggaran_realisasi || 0)}</span>
                  <span>Pagu: {formatCurrency(kegiatan.anggaran_pagu)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skor Kinerja */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuTrendingUp className="w-5 h-5 text-purple-600" />
              Skor Kinerja
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="64" cy="64" r="56" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    strokeWidth="12"
                  />
                  <circle 
                    cx="64" cy="64" r="56" 
                    fill="none" 
                    stroke={kegiatan.skor_kinerja >= 90 ? '#22c55e' : kegiatan.skor_kinerja >= 70 ? '#eab308' : '#ef4444'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${kegiatan.skor_kinerja * 3.52} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{kegiatan.skor_kinerja}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusKinerjaColor(kegiatan.status_kinerja)}`}>
                  {kegiatan.status_kinerja}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Skor kinerja dihitung berdasarkan perbandingan progres output terhadap target waktu kegiatan.
                </p>
              </div>
            </div>
          </div>

          {/* Dokumen Output */}
          {dokumen.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dokumen Output</h2>
              <div className="space-y-3">
                {dokumen.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <LuFileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.nama_file}</p>
                        <p className="text-xs text-gray-500">{doc.keterangan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        doc.status_validasi === 'valid' ? 'bg-green-100 text-green-700' :
                        doc.status_validasi === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {doc.status_validasi}
                      </span>
                      <a 
                        href={doc.path_file} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <LuDownload className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval History */}
          {approvalHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LuHistory className="w-5 h-5 text-gray-600" />
                Riwayat Approval
              </h2>
              <div className="space-y-4">
                {approvalHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        history.status === 'approved' ? 'bg-green-100' :
                        history.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {history.status === 'approved' ? (
                          <LuCircleCheck className="w-4 h-4 text-green-600" />
                        ) : history.status === 'rejected' ? (
                          <LuTriangleAlert className="w-4 h-4 text-red-600" />
                        ) : (
                          <LuClock className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      {index < approvalHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 capitalize">{history.level}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          history.status === 'approved' ? 'bg-green-100 text-green-700' :
                          history.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {history.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        oleh {history.approver_nama} • {formatDateTime(history.created_at)}
                      </p>
                      {history.catatan && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">{history.catatan}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Pelaksana Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuUser className="w-5 h-5 text-blue-600" />
              Pelaksana
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-medium text-gray-900">{kegiatan.pelaksana_nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tim</p>
                <p className="font-medium text-gray-900">{kegiatan.tim_nama}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuCalendar className="w-5 h-5 text-blue-600" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Tanggal Mulai</p>
                <p className="font-medium text-gray-900">{formatDate(kegiatan.tanggal_mulai)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Selesai</p>
                <p className="font-medium text-gray-900">{formatDate(kegiatan.tanggal_selesai)}</p>
              </div>
            </div>
          </div>

          {/* Catatan Approval */}
          {(kegiatan.catatan_koordinator || kegiatan.catatan_ppk || kegiatan.catatan_pimpinan) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Catatan Approval</h2>
              <div className="space-y-4">
                {kegiatan.catatan_koordinator && (
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-1">Koordinator</p>
                    <p className="text-sm text-gray-700">{kegiatan.catatan_koordinator}</p>
                  </div>
                )}
                {kegiatan.catatan_ppk && (
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <p className="text-xs text-orange-600 font-medium mb-1">PPK</p>
                    <p className="text-sm text-gray-700">{kegiatan.catatan_ppk}</p>
                  </div>
                )}
                {kegiatan.catatan_pimpinan && (
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-medium mb-1">Kepala</p>
                    <p className="text-sm text-gray-700">{kegiatan.catatan_pimpinan}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button for Pending Approval */}
          {kegiatan.status_pengajuan === 'review_ppk' && (
            <Link
              href={`/ppk/kegiatan/approval/${kegiatan.id}`}
              className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Review & Approval
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
