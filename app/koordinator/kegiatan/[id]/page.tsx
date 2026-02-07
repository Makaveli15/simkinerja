'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LuChevronLeft, 
  LuCircleCheck, 
  LuCircleX, 
  LuClock, 
  LuCalendar, 
  LuUser,
  LuTrendingUp,
  LuWallet,
  LuTarget,
  LuTriangleAlert
} from 'react-icons/lu';

interface KegiatanDetail {
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
  output_realisasi: number;
  satuan_output: string;
  skor_kinerja: number;
  status_kinerja: string;
  total_realisasi_anggaran: number;
  total_kendala: number;
  kendala_resolved: number;
  approved_by_koordinator_nama: string | null;
  approved_by_ppk_nama: string | null;
  approved_by_kepala_nama: string | null;
  approved_at_koordinator: string | null;
  approved_at_ppk: string | null;
  approved_at_kepala: string | null;
  rejection_reason: string | null;
  catatan_koordinator: string | null;
  catatan_ppk: string | null;
  catatan_kepala: string | null;
  created_at: string;
}

interface ApprovalHistory {
  id: number;
  kegiatan_id: number;
  user_id: number;
  action: string;
  catatan: string | null;
  level: string;
  created_at: string;
  approver_nama: string;
  approver_role: string;
}

export default function KoordinatorKegiatanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kegiatanId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);
  const [showCatatanForm, setShowCatatanForm] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchData();
  }, [kegiatanId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/koordinator/kegiatan/${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan);
        setApprovalHistory(data.approval_history || []);
      } else {
        setError('Kegiatan tidak ditemukan atau bukan bagian dari tim Anda');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !catatan.trim()) {
      setError('Catatan wajib diisi untuk penolakan');
      return;
    }

    setProcessingApproval(true);
    setError('');

    try {
      const res = await fetch(`/api/koordinator/kegiatan/${kegiatanId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan: catatan.trim() || null
        })
      });

      if (res.ok) {
        setSuccess(action === 'approve' ? 'Kegiatan berhasil disetujui' : 'Kegiatan ditolak');
        setShowCatatanForm(false);
        setCatatan('');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal memproses approval');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setProcessingApproval(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusPengajuanBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      'diajukan': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Menunggu Koordinator' },
      'review_koordinator': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Review Koordinator' },
      'approved_koordinator': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Disetujui Koordinator' },
      'review_ppk': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Review PPK' },
      'approved_ppk': { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Disetujui PPK' },
      'review_kepala': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Review Pimpinan' },
      'disetujui': { bg: 'bg-green-100', text: 'text-green-700', label: 'Disetujui' },
      'ditolak': { bg: 'bg-red-100', text: 'text-red-700', label: 'Ditolak' }
    };
    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getStatusKinerjaBadge = (status: string) => {
    switch (status) {
      case 'Sukses':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">✓ Sukses</span>;
      case 'Perlu Perhatian':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-700">⚠ Perlu Perhatian</span>;
      case 'Bermasalah':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">✗ Bermasalah</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">Belum Dinilai</span>;
    }
  };

  const getSkorColor = (skor: number) => {
    if (skor >= 80) return 'text-green-600';
    if (skor >= 60) return 'text-amber-600';
    if (skor > 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const canApprove = kegiatan && (
    kegiatan.status_pengajuan === 'diajukan' || 
    kegiatan.status_pengajuan === 'review_koordinator'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !kegiatan) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LuTriangleAlert className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kegiatan tidak ditemukan</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/koordinator/kegiatan/approval" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
          <LuChevronLeft className="w-4 h-4" />
          Kembali ke daftar kegiatan
        </Link>
      </div>
    );
  }

  if (!kegiatan) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/koordinator/kegiatan/approval" className="hover:text-green-600">Approval Kegiatan</Link>
            <span>/</span>
            <span className="text-gray-900">Detail</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{kegiatan.nama}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700">
              {kegiatan.kro_kode}
            </span>
            <span className="text-sm text-gray-600">Tim: {kegiatan.tim_nama || '-'}</span>
            {getStatusPengajuanBadge(kegiatan.status_pengajuan)}
          </div>
        </div>
        {kegiatan.skor_kinerja > 0 && (
          <div className="flex items-center gap-2">
            {getStatusKinerjaBadge(kegiatan.status_kinerja)}
            <span className={`text-3xl font-bold ${getSkorColor(kegiatan.skor_kinerja)}`}>
              {kegiatan.skor_kinerja}
            </span>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <LuCircleCheck className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && kegiatan && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <LuTriangleAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Kegiatan Info Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kegiatan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Deskripsi</label>
              <p className="text-gray-900">{kegiatan.deskripsi || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">KRO</label>
              <p className="text-gray-900">{kegiatan.kro_kode} - {kegiatan.kro_nama}</p>
            </div>
            <div className="flex items-center gap-2">
              <LuUser className="w-4 h-4 text-gray-400" />
              <div>
                <label className="text-sm text-gray-500">Pelaksana</label>
                <p className="text-gray-900">{kegiatan.pelaksana_nama}</p>
                <p className="text-sm text-gray-500">{kegiatan.pelaksana_email}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LuCalendar className="w-4 h-4 text-gray-400" />
              <div>
                <label className="text-sm text-gray-500">Periode Kegiatan</label>
                <p className="text-gray-900">{formatDate(kegiatan.tanggal_mulai)} - {formatDate(kegiatan.tanggal_selesai)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LuWallet className="w-4 h-4 text-gray-400" />
              <div>
                <label className="text-sm text-gray-500">Anggaran Pagu</label>
                <p className="text-gray-900">{formatCurrency(kegiatan.anggaran_pagu)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LuTarget className="w-4 h-4 text-gray-400" />
              <div>
                <label className="text-sm text-gray-500">Target Output</label>
                <p className="text-gray-900">{kegiatan.target_output} {kegiatan.satuan_output}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Realisasi Output</p>
              <p className="text-xl font-bold text-gray-900">
                {kegiatan.output_realisasi || 0} <span className="text-sm font-normal">/ {kegiatan.target_output}</span>
              </p>
              <p className="text-xs text-gray-500">{kegiatan.satuan_output}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Realisasi Anggaran</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(kegiatan.total_realisasi_anggaran || 0)}</p>
              <p className="text-xs text-gray-500">dari {formatCurrency(kegiatan.anggaran_pagu)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Kendala</p>
              <p className="text-xl font-bold text-gray-900">{kegiatan.total_kendala || 0}</p>
              <p className="text-xs text-green-600">{kegiatan.kendala_resolved || 0} terselesaikan</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Skor Kinerja</p>
              <p className={`text-xl font-bold ${getSkorColor(kegiatan.skor_kinerja || 0)}`}>
                {kegiatan.skor_kinerja || 0}
              </p>
              <p className="text-xs text-gray-500">{kegiatan.status_kinerja || 'Belum Dinilai'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Actions */}
      {canApprove && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Approval</h2>
          
          {!showCatatanForm ? (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionType('approve');
                  setShowCatatanForm(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <LuCircleCheck className="w-5 h-5" />
                Setujui
              </button>
              <button
                onClick={() => {
                  setActionType('reject');
                  setShowCatatanForm(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LuCircleX className="w-5 h-5" />
                Tolak
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan {actionType === 'reject' ? '(Wajib)' : '(Opsional)'}
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={actionType === 'reject' ? 'Berikan alasan penolakan...' : 'Berikan catatan jika diperlukan...'}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproval(actionType)}
                  disabled={processingApproval}
                  className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors ${
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {processingApproval ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      {actionType === 'approve' ? <LuCircleCheck className="w-5 h-5" /> : <LuCircleX className="w-5 h-5" />}
                      {actionType === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCatatanForm(false);
                    setCatatan('');
                  }}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval History */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Approval</h2>
        
        {approvalHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <LuClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada riwayat approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvalHistory.map((history) => (
              <div key={history.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  history.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {history.action === 'approve' ? (
                    <LuCircleCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <LuCircleX className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{history.approver_nama}</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-600">
                      {history.approver_role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {history.action === 'approve' ? 'Menyetujui' : 'Menolak'} pada level {history.level}
                  </p>
                  {history.catatan && (
                    <p className="mt-2 text-sm text-gray-700 bg-white p-3 rounded border border-gray-100">
                      {history.catatan}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(history.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Approval Notes */}
      {(kegiatan.catatan_koordinator || kegiatan.catatan_ppk || kegiatan.catatan_kepala || kegiatan.rejection_reason) && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Catatan Approval</h2>
          <div className="space-y-4">
            {kegiatan.catatan_koordinator && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Catatan Koordinator:</p>
                <p className="text-gray-900">{kegiatan.catatan_koordinator}</p>
              </div>
            )}
            {kegiatan.catatan_ppk && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Catatan PPK:</p>
                <p className="text-gray-900">{kegiatan.catatan_ppk}</p>
              </div>
            )}
            {kegiatan.catatan_kepala && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Catatan Pimpinan:</p>
                <p className="text-gray-900">{kegiatan.catatan_kepala}</p>
              </div>
            )}
            {kegiatan.rejection_reason && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-700">Alasan Penolakan:</p>
                <p className="text-red-900">{kegiatan.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-4">
        <Link
          href="/koordinator/kegiatan/approval"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
        >
          <LuChevronLeft className="w-4 h-4" />
          Kembali ke daftar kegiatan
        </Link>
      </div>
    </div>
  );
}
