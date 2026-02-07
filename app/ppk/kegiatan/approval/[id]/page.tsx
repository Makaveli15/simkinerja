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
  LuCircleX,
  LuClock,
  LuDownload,
  LuHistory,
  LuTriangleAlert,
  LuPencil,
  LuSend
} from 'react-icons/lu';

interface KegiatanDetail {
  id: number;
  nama: string;
  deskripsi: string;
  tim_id: number;
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
  approved_by_koordinator: number;
  koordinator_nama: string;
  tanggal_approval_koordinator: string;
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

export default function PPKApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [dokumen, setDokumen] = useState<Dokumen[]>([]);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisiModal, setShowRevisiModal] = useState(false);
  const [catatan, setCatatan] = useState('');

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
        router.push('/ppk/kegiatan/approval');
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
      router.push('/ppk/kegiatan/approval');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (action: 'approve' | 'reject' | 'revisi') => {
    if ((action === 'reject' || action === 'revisi') && !catatan.trim()) {
      alert('Catatan harus diisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/ppk/kegiatan/${id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatan: catatan.trim() })
      });

      if (res.ok) {
        const actionMessages: Record<string, string> = {
          approve: 'Kegiatan berhasil diteruskan ke Kepala untuk persetujuan akhir',
          reject: 'Kegiatan berhasil ditolak',
          revisi: 'Kegiatan dikembalikan untuk revisi'
        };
        alert(actionMessages[action]);
        router.push('/ppk/kegiatan/approval');
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal memproses approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
      setShowRevisiModal(false);
      setCatatan('');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!kegiatan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kegiatan tidak ditemukan</p>
        <Link href="/ppk/kegiatan/approval" className="text-orange-600 hover:underline mt-2 inline-block">
          Kembali ke daftar approval
        </Link>
      </div>
    );
  }

  const statusPengajuan = getStatusPengajuan(kegiatan.status_pengajuan);
  const isPending = kegiatan.status_pengajuan === 'review_ppk';
  const progressOutput = kegiatan.target_output > 0 
    ? Math.round((kegiatan.output_realisasi || 0) / kegiatan.target_output * 100) 
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
        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${statusPengajuan.color}`}>
          Status: {statusPengajuan.label}
        </span>
        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusKinerjaColor(kegiatan.status_kinerja)}`}>
          Kinerja: {kegiatan.status_kinerja} ({kegiatan.skor_kinerja}%)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deskripsi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuFileText className="w-5 h-5 text-orange-600" />
              Deskripsi
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">{kegiatan.deskripsi || 'Tidak ada deskripsi'}</p>
          </div>

          {/* Catatan Koordinator - Important for PPK */}
          {kegiatan.catatan_koordinator && (
            <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <LuCircleCheck className="w-5 h-5 text-green-600" />
                Catatan dari Koordinator
              </h2>
              <p className="text-green-700">{kegiatan.catatan_koordinator}</p>
              <div className="mt-3 pt-3 border-t border-green-200 text-sm text-green-600">
                <p>Disetujui oleh: {kegiatan.koordinator_nama}</p>
                <p>Tanggal: {formatDateTime(kegiatan.tanggal_approval_koordinator)}</p>
              </div>
            </div>
          )}

          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Output Progress */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <LuTarget className="w-5 h-5 text-orange-600" />
                  Progress Output
                </h3>
                <span className="text-2xl font-bold text-orange-600">{progressOutput}%</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${progressOutput}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Realisasi: {kegiatan.output_realisasi || 0}</span>
                  <span>Target: {kegiatan.target_output} {kegiatan.satuan_output}</span>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <LuWallet className="w-5 h-5 text-blue-600" />
                Anggaran
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pagu</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(kegiatan.anggaran_pagu)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Realisasi</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(kegiatan.anggaran_realisasi || 0)}</span>
                </div>
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
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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
                          <LuCircleX className="w-4 h-4 text-red-600" />
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

        {/* Right Column - Info & Actions */}
        <div className="space-y-6">
          {/* Pelaksana Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuUser className="w-5 h-5 text-orange-600" />
              Informasi
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Pelaksana</p>
                <p className="font-medium text-gray-900">{kegiatan.pelaksana_nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tim</p>
                <p className="font-medium text-gray-900">{kegiatan.tim_nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Periode</p>
                <p className="font-medium text-gray-900">
                  {formatDate(kegiatan.tanggal_mulai)} - {formatDate(kegiatan.tanggal_selesai)}
                </p>
              </div>
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alur Persetujuan</h2>
            <div className="space-y-3">
              {/* Pelaksana */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <LuCircleCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">Pelaksana</p>
                  <p className="text-xs text-gray-500">Mengajukan kegiatan</p>
                </div>
              </div>
              
              {/* Koordinator */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <LuCircleCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">Koordinator</p>
                  <p className="text-xs text-green-600">{kegiatan.koordinator_nama}</p>
                </div>
              </div>
              
              {/* PPK */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isPending ? 'bg-orange-100' : 
                  ['review_kepala', 'disetujui'].includes(kegiatan.status_pengajuan) ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isPending ? (
                    <LuClock className="w-4 h-4 text-orange-600" />
                  ) : ['review_kepala', 'disetujui'].includes(kegiatan.status_pengajuan) ? (
                    <LuCircleCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <LuCircleX className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">PPK</p>
                  <p className="text-xs text-gray-500">
                    {isPending ? 'Menunggu review' : 
                     ['review_kepala', 'disetujui'].includes(kegiatan.status_pengajuan) ? 'Disetujui' : 'Ditolak/Revisi'}
                  </p>
                </div>
              </div>
              
              {/* Kepala */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  kegiatan.status_pengajuan === 'disetujui' ? 'bg-green-100' :
                  kegiatan.status_pengajuan === 'review_kepala' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  {kegiatan.status_pengajuan === 'disetujui' ? (
                    <LuCircleCheck className="w-4 h-4 text-green-600" />
                  ) : kegiatan.status_pengajuan === 'review_kepala' ? (
                    <LuClock className="w-4 h-4 text-purple-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">Kepala</p>
                  <p className="text-xs text-gray-500">
                    {kegiatan.status_pengajuan === 'disetujui' ? 'Disetujui' :
                     kegiatan.status_pengajuan === 'review_kepala' ? 'Menunggu review' : 'Belum sampai tahap ini'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="space-y-3">
              <button
                onClick={() => handleApproval('approve')}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <LuSend className="w-5 h-5" />
                <span>{submitting ? 'Memproses...' : 'Setujui & Teruskan ke Kepala'}</span>
              </button>
              <button
                onClick={() => setShowRevisiModal(true)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <LuPencil className="w-5 h-5" />
                <span>Minta Revisi</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <LuCircleX className="w-5 h-5" />
                <span>Tolak</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LuCircleX className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tolak Kegiatan</h3>
            </div>
            
            <div className="mb-4 p-3 bg-red-50 rounded-xl">
              <p className="text-sm text-red-700 flex items-start gap-2">
                <LuTriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Kegiatan yang ditolak tidak dapat diajukan ulang. Pastikan alasan penolakan sudah sesuai.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Jelaskan alasan penolakan..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setCatatan('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleApproval('reject')}
                disabled={submitting || !catatan.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Tolak Kegiatan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisi Modal */}
      {showRevisiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <LuPencil className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Minta Revisi</h3>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-50 rounded-xl">
              <p className="text-sm text-yellow-700">
                Kegiatan akan dikembalikan ke pelaksana untuk diperbaiki sesuai catatan.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Revisi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                placeholder="Jelaskan apa yang perlu diperbaiki..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRevisiModal(false);
                  setCatatan('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleApproval('revisi')}
                disabled={submitting || !catatan.trim()}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Minta Revisi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
