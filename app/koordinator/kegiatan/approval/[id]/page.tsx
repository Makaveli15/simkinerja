'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LuArrowLeft,
  LuCircleCheck,
  LuCircleX,
  LuMessageSquare,
  LuCalendar,
  LuUser,
  LuTarget,
  LuWallet,
  LuClock,
  LuTriangleAlert
} from 'react-icons/lu';

interface Kegiatan {
  id: number;
  nama: string;
  deskripsi: string;
  tim_nama: string;
  kro_kode: string;
  kro_nama: string;
  pelaksana_nama: string;
  pelaksana_email: string;
  status: string;
  status_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  target_output: number;
  satuan_output: string;
  output_realisasi: number;
  skor_kinerja: number;
  status_kinerja: string;
  created_at: string;
}

interface ApprovalHistory {
  id: number;
  role_approver: string;
  action: string;
  catatan: string;
  created_at: string;
  approver_nama: string;
}

export default function KoordinatorApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kegiatan, setKegiatan] = useState<Kegiatan | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [catatan, setCatatan] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisiModal, setShowRevisiModal] = useState(false);

  useEffect(() => {
    fetchKegiatanDetail();
  }, [resolvedParams.id]);

  const fetchKegiatanDetail = async () => {
    try {
      const res = await fetch(`/api/koordinator/kegiatan/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan);
        setApprovalHistory(data.approval_history || []);
      } else {
        router.push('/koordinator/kegiatan/approval');
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (action: 'approve' | 'reject' | 'revisi') => {
    if ((action === 'reject' || action === 'revisi') && !catatan.trim()) {
      alert('Catatan wajib diisi untuk menolak atau meminta revisi');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/koordinator/kegiatan/${resolvedParams.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatan })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        router.push('/koordinator/kegiatan/approval');
      } else {
        const error = await res.json();
        alert(error.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
      setShowRevisiModal(false);
    }
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

  const canApprove = kegiatan && 
    (kegiatan.status_pengajuan === 'diajukan' || kegiatan.status_pengajuan === 'review_koordinator');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!kegiatan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kegiatan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/koordinator/kegiatan/approval"
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <LuArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Kegiatan</h1>
          <p className="text-gray-600">Periksa dan berikan keputusan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kegiatan Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {kegiatan.kro_kode}
                </span>
                <h2 className="text-xl font-semibold text-gray-900 mt-2">{kegiatan.nama}</h2>
              </div>
              {kegiatan.status_pengajuan === 'diajukan' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <LuClock className="w-4 h-4" /> Menunggu Review Anda
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-6">{kegiatan.deskripsi || 'Tidak ada deskripsi'}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <LuUser className="w-4 h-4" />
                  Pelaksana
                </div>
                <p className="font-medium text-gray-900">{kegiatan.pelaksana_nama}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <LuCalendar className="w-4 h-4" />
                  Periode
                </div>
                <p className="font-medium text-gray-900 text-sm">
                  {formatDate(kegiatan.tanggal_mulai)} - {formatDate(kegiatan.tanggal_selesai)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <LuTarget className="w-4 h-4" />
                  Target
                </div>
                <p className="font-medium text-gray-900">{kegiatan.target_output} {kegiatan.satuan_output}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <LuWallet className="w-4 h-4" />
                  Anggaran
                </div>
                <p className="font-medium text-gray-900">{formatCurrency(kegiatan.anggaran_pagu)}</p>
              </div>
            </div>
          </div>

          {/* Approval History */}
          {approvalHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Riwayat Approval</h3>
              <div className="space-y-3">
                {approvalHistory.map((history) => (
                  <div key={history.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      history.action === 'approve' ? 'bg-green-100' : 
                      history.action === 'reject' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {history.action === 'approve' ? (
                        <LuCircleCheck className="w-4 h-4 text-green-600" />
                      ) : history.action === 'reject' ? (
                        <LuCircleX className="w-4 h-4 text-red-600" />
                      ) : (
                        <LuMessageSquare className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {history.approver_nama} ({history.role_approver})
                      </p>
                      <p className="text-sm text-gray-500">
                        {history.action === 'approve' ? 'Menyetujui' : 
                         history.action === 'reject' ? 'Menolak' : 'Meminta Revisi'}
                      </p>
                      {history.catatan && (
                        <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded-lg">
                          &quot;{history.catatan}&quot;
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(history.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Approval Actions */}
          {canApprove && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Keputusan Anda</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan (opsional untuk approval)
                  </label>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Tambahkan catatan..."
                  />
                </div>

                <button
                  onClick={() => handleApproval('approve')}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <LuCircleCheck className="w-5 h-5" />
                  Setujui & Teruskan ke PPK
                </button>

                <button
                  onClick={() => setShowRevisiModal(true)}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <LuMessageSquare className="w-5 h-5" />
                  Minta Revisi
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <LuCircleX className="w-5 h-5" />
                  Tolak
                </button>
              </div>
            </div>
          )}

          {/* Alur Approval Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Alur Persetujuan</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-blue-800">Pelaksana mengajukan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  canApprove ? 'bg-yellow-500 text-white animate-pulse' : 'bg-blue-500 text-white'
                }`}>2</div>
                <span className={canApprove ? 'text-yellow-800 font-semibold' : 'text-blue-800'}>
                  Koordinator {canApprove ? '(Anda)' : 'menyetujui'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-gray-600">PPK memvalidasi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold">4</div>
                <span className="text-gray-600">Kepala menyetujui akhir</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tolak Kegiatan</h3>
            <p className="text-gray-600 mb-4">
              Masukkan alasan penolakan untuk pelaksana:
            </p>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
              placeholder="Alasan penolakan..."
              required
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleApproval('reject')}
                disabled={submitting || !catatan.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisi Modal */}
      {showRevisiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Minta Revisi</h3>
            <p className="text-gray-600 mb-4">
              Masukkan catatan revisi yang diperlukan:
            </p>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none mb-4"
              placeholder="Catatan revisi..."
              required
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevisiModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleApproval('revisi')}
                disabled={submitting || !catatan.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Kirim Permintaan Revisi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
