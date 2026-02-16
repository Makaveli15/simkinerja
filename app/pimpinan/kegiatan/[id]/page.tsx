'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { LuCircleAlert, LuChevronLeft, LuCircleCheck, LuPlus, LuCheck } from 'react-icons/lu';

interface KegiatanDetail {
  id: number;
  nama: string;
  deskripsi: string;
  tim_nama: string;
  kro_kode: string;
  kro_nama: string;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  jenis_validasi?: 'dokumen' | 'kuantitas';
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_realisasi_mulai: string | null;
  tanggal_realisasi_selesai: string | null;
  anggaran_pagu: number;
  status: string;
  status_verifikasi: string;
  created_by_nama: string;
}

interface Summary {
  total_realisasi_anggaran: number;
  realisasi_anggaran_persen: number;
  capaian_output_persen: number;
  total_kendala: number;
  kendala_resolved: number;
  skor_kinerja: number;
  status_kinerja: string;
  indikator: {
    capaian_output: number;
    ketepatan_waktu: number;
    serapan_anggaran: number;
    kualitas_output: number;
    penyelesaian_kendala: number;
  };
  deviasi: {
    output: number;
    waktu: number;
    anggaran: number;
  };
}

interface Progres {
  id: number;
  tanggal_update: string;
  capaian_output: number;
  keterangan: string;
}

interface RealisasiAnggaran {
  id: number;
  tanggal_realisasi: string;
  jumlah: number;
  keterangan: string;
}

interface TindakLanjut {
  id: number;
  deskripsi: string;
  batas_waktu: string;
  status: string;
  created_at: string;
}

interface Kendala {
  id: number;
  deskripsi: string;
  tingkat_prioritas: string;
  status: string;
  created_at: string;
  tindak_lanjut: TindakLanjut[];
}

interface Evaluasi {
  id: number;
  kegiatan_id: number;
  role_pemberi: 'pimpinan' | 'kesubag';
  jenis_evaluasi: string;
  isi: string;
  created_at: string;
  pemberi_nama: string;
  pemberi_username: string;
  pemberi_role: string;
}

interface DokumenOutput {
  id: number;
  kegiatan_id: number;
  nama_file: string;
  path_file: string;
  tipe_dokumen: 'draft' | 'final';
  deskripsi?: string;
  ukuran_file: number;
  tipe_file: string;
  uploaded_at: string;
  uploaded_by_nama: string;
  // Draft review status (Kesubag)
  draft_status_kesubag?: 'pending' | 'reviewed' | 'revisi' | null;
  draft_feedback_kesubag?: string;
  draft_reviewed_at_kesubag?: string;
  validated_by_kesubag_nama?: string;
  // Draft review status (Pimpinan)
  draft_feedback_pimpinan?: string;
  draft_reviewed_at_pimpinan?: string;
  // Final validation workflow
  minta_validasi?: number; // 0 or 1
  validasi_kesubag?: 'pending' | 'valid' | 'tidak_valid' | null;
  validasi_feedback_kesubag?: string;
  validasi_pimpinan?: 'pending' | 'valid' | 'tidak_valid' | null;
  validasi_feedback_pimpinan?: string;
  status_final?: 'draft' | 'menunggu_kesubag' | 'menunggu_pimpinan' | 'revisi' | 'disahkan' | null;
  tanggal_disahkan?: string;
}

interface Mitra {
  id: number;
  nama: string;
  nik?: string;
  alamat?: string;
  no_hp?: string;
  email?: string;
  jenis_kelamin?: string;
  pekerjaan?: string;
}

interface ValidasiKuantitas {
  id: number;
  kegiatan_id: number;
  jumlah_output: number;
  bukti_path?: string;
  keterangan?: string;
  status_kesubag: 'pending' | 'valid' | 'tidak_valid';
  status_pimpinan: 'pending' | 'valid' | 'tidak_valid';
  feedback_kesubag?: string;
  feedback_pimpinan?: string;
  created_at: string;
  validated_kesubag_at?: string;
  validated_pimpinan_at?: string;
}

export default function PimpinanKegiatanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kegiatanId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [progres, setProgres] = useState<Progres[]>([]);
  const [realisasiAnggaran, setRealisasiAnggaran] = useState<RealisasiAnggaran[]>([]);
  const [kendala, setKendala] = useState<Kendala[]>([]);
  const [evaluasi, setEvaluasi] = useState<Evaluasi[]>([]);
  const [dokumenOutput, setDokumenOutput] = useState<DokumenOutput[]>([]);
  const [mitra, setMitra] = useState<Mitra[]>([]);
  const [validasiKuantitas, setValidasiKuantitas] = useState<ValidasiKuantitas[]>([]);
  
  const [activeTab, setActiveTab] = useState<'evaluasi-kinerja' | 'progres' | 'anggaran' | 'kendala' | 'dokumen' | 'waktu' | 'evaluasi'>('evaluasi-kinerja');
  const [updatingVerifikasi, setUpdatingVerifikasi] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Evaluasi form
  const [showEvaluasiForm, setShowEvaluasiForm] = useState(false);
  const [evaluasiForm, setEvaluasiForm] = useState({
    jenis_evaluasi: 'catatan' as 'catatan' | 'arahan' | 'rekomendasi',
    isi: ''
  });
  const [submittingEvaluasi, setSubmittingEvaluasi] = useState(false);

  // Dokumen Review State
  const [reviewingDokumenId, setReviewingDokumenId] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: '' as 'diterima' | 'ditolak' | '',
    catatan: ''
  });

  // Bulk validation states
  const [bulkValidating, setBulkValidating] = useState(false);
  const [showBulkValidationModal, setShowBulkValidationModal] = useState(false);
  const [bulkValidationType, setBulkValidationType] = useState<'valid' | 'draft_feedback'>('valid');
  const [bulkCatatan, setBulkCatatan] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/pimpinan/kegiatan/${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan);
        setSummary(data.summary);
        setProgres(data.progres);
        setRealisasiAnggaran(data.realisasi_anggaran);
        setKendala(data.kendala);
        setEvaluasi(data.evaluasi);
        setMitra(data.mitra || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDokumen = async () => {
    try {
      const res = await fetch(`/api/pimpinan/dokumen-output?kegiatan_id=${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setDokumenOutput(data.dokumen || []);
      }
    } catch (error) {
      console.error('Error fetching dokumen:', error);
    }
  };

  const fetchValidasiKuantitas = async () => {
    try {
      const res = await fetch(`/api/pimpinan/validasi-kuantitas?kegiatan_id=${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setValidasiKuantitas(data.validasi || []);
      }
    } catch (error) {
      console.error('Error fetching validasi kuantitas:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDokumen();
    fetchValidasiKuantitas();
  }, [kegiatanId]);

  // Hitung status verifikasi berdasarkan jenis validasi (dokumen atau kuantitas)
  const hitungStatusVerifikasi = () => {
    const targetOutput = kegiatan?.target_output || 0;
    
    // Jika jenis_validasi adalah kuantitas, hitung dari validasiKuantitas
    if (kegiatan?.jenis_validasi === 'kuantitas') {
      // Hitung total output yang sudah disahkan (status_pimpinan = 'valid')
      const totalDisahkan = validasiKuantitas
        .filter(v => v.status_pimpinan === 'valid')
        .reduce((sum, v) => sum + Number(v.jumlah_output), 0);
      
      // Hitung jumlah yang ditolak
      const jumlahDitolak = validasiKuantitas.filter(v => v.status_pimpinan === 'tidak_valid').length;
      
      // Hitung jumlah yang menunggu validasi pimpinan
      const jumlahMenunggu = validasiKuantitas.filter(v => v.status_kesubag === 'valid' && v.status_pimpinan === 'pending').length;
      
      if (validasiKuantitas.length === 0) {
        return { status: 'belum_verifikasi', disahkan: 0, target: targetOutput };
      }
      
      if (totalDisahkan >= targetOutput && totalDisahkan > 0) {
        return { status: 'valid', disahkan: Math.round(totalDisahkan), target: targetOutput };
      }
      
      if (jumlahDitolak > 0) {
        return { status: 'revisi', disahkan: Math.round(totalDisahkan), target: targetOutput, ditolak: jumlahDitolak };
      }
      
      if (jumlahMenunggu > 0) {
        return { status: 'menunggu', disahkan: Math.round(totalDisahkan), target: targetOutput };
      }
      
      return { status: 'menunggu', disahkan: Math.round(totalDisahkan), target: targetOutput };
    }
    
    // Jika jenis_validasi adalah dokumen, hitung dari dokumenOutput
    const dokumenFinalValidasi = dokumenOutput.filter(
      d => d.tipe_dokumen === 'final' && d.minta_validasi === 1
    );
    
    // Hitung jumlah yang sudah disahkan
    const jumlahDisahkan = dokumenFinalValidasi.filter(d => d.status_final === 'disahkan').length;
    const jumlahDitolak = dokumenFinalValidasi.filter(
      d => d.validasi_kesubag === 'tidak_valid' || d.validasi_pimpinan === 'tidak_valid' || d.status_final === 'revisi'
    ).length;
    const totalValidasi = dokumenFinalValidasi.length;
    
    if (totalValidasi === 0) {
      return { status: 'belum_verifikasi', disahkan: 0, target: targetOutput || totalValidasi };
    }
    
    if (jumlahDisahkan === targetOutput && jumlahDisahkan > 0) {
      return { status: 'valid', disahkan: jumlahDisahkan, target: targetOutput || totalValidasi };
    }
    
    if (jumlahDitolak > 0) {
      return { status: 'revisi', disahkan: jumlahDisahkan, target: targetOutput || totalValidasi, ditolak: jumlahDitolak };
    }
    
    return { status: 'menunggu', disahkan: jumlahDisahkan, target: targetOutput || totalValidasi };
  };

  // Status verifikasi yang dihitung
  const statusVerifikasiDokumen = hitungStatusVerifikasi();

  const handleVerifikasi = async (newStatus: 'valid' | 'revisi') => {
    setUpdatingVerifikasi(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/pimpinan/kegiatan/${kegiatanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_verifikasi: newStatus })
      });

      if (res.ok) {
        setSuccess(`Status verifikasi berhasil diubah menjadi ${newStatus.toUpperCase()}`);
        fetchData(); // Refresh data
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mengubah status verifikasi');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setUpdatingVerifikasi(false);
    }
  };

  // Handle draft feedback (for drafts already reviewed by kesubag)
  // Now supports action: 'diterima' or 'ditolak'
  const handleDraftFeedback = async (dokumenId: number, catatan: string, action: 'diterima' | 'ditolak' = 'diterima') => {
    setReviewingDokumenId(dokumenId);
    setError('');

    try {
      const res = await fetch('/api/pimpinan/dokumen-output', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dokumenId,
          action,
          catatan
        })
      });

      if (res.ok) {
        setSuccess(action === 'diterima' ? 'Draft berhasil diterima' : 'Draft ditolak');
        setReviewForm({ status: '', catatan: '' });
        fetchDokumen();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal memberikan feedback');
      }
    } catch {
      setError('Terjadi kesalahan saat memberikan feedback');
    } finally {
      setReviewingDokumenId(null);
    }
  };

  // Handle validate dokumen final (for new validation workflow)
  const handleValidateDokumenFinal = async (dokumenId: number, action: 'valid' | 'tidak_valid', catatan: string) => {
    setReviewingDokumenId(dokumenId);
    setError('');

    try {
      const res = await fetch('/api/pimpinan/dokumen-output', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dokumenId,
          action,
          catatan
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || `Dokumen berhasil ${action === 'valid' ? 'divalidasi' : 'ditolak'}`);
        setReviewForm({ status: '', catatan: '' });
        fetchDokumen();
        fetchData(); // Refresh kegiatan data for status_verifikasi
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal memvalidasi dokumen');
      }
    } catch {
      setError('Terjadi kesalahan saat memvalidasi dokumen');
    } finally {
      setReviewingDokumenId(null);
    }
  };

  // Handle sahkan dokumen
  const handleSahkanDokumen = async (dokumenId: number) => {
    if (!confirm('Apakah Anda yakin ingin mengesahkan dokumen ini? Dokumen yang telah disahkan tidak dapat diubah.')) {
      return;
    }

    setReviewingDokumenId(dokumenId);
    setError('');

    try {
      const res = await fetch('/api/pimpinan/dokumen-output', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dokumenId,
          action: 'sahkan'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('🏆 Dokumen berhasil disahkan!');
        setReviewForm({ status: '', catatan: '' });
        fetchDokumen();
        fetchData(); // Refresh kegiatan data for status_verifikasi
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal mengesahkan dokumen');
      }
    } catch {
      setError('Terjadi kesalahan saat mengesahkan dokumen');
    } finally {
      setReviewingDokumenId(null);
    }
  };

  // Handle validasi kuantitas
  const handleValidasiKuantitas = async (id: number, status: 'valid' | 'tidak_valid', feedback?: string) => {
    try {
      const res = await fetch('/api/pimpinan/validasi-kuantitas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          catatan: feedback
        })
      });

      if (res.ok) {
        setSuccess(`Data kuantitas berhasil ${status === 'valid' ? 'disahkan' : 'ditolak'}`);
        fetchValidasiKuantitas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Gagal memvalidasi');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error validating kuantitas:', err);
      setError('Terjadi kesalahan');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle bulk validation
  const handleBulkValidation = async () => {
    setBulkValidating(true);
    try {
      const res = await fetch('/api/pimpinan/dokumen-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: kegiatanId,
          action: bulkValidationType,
          catatan: bulkCatatan || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`${data.count} dokumen berhasil ${bulkValidationType === 'valid' ? 'divalidasi dan disahkan' : 'direview'}`);
        setShowBulkValidationModal(false);
        setBulkCatatan('');
        fetchDokumen();
        fetchData(); // Refresh data
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Gagal melakukan validasi massal');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error bulk validating:', err);
      setError('Terjadi kesalahan');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBulkValidating(false);
    }
  };

  // Count pending documents for bulk validation
  const pendingFinalDocs = dokumenOutput.filter(d => 
    d.tipe_dokumen === 'final' && 
    d.minta_validasi === 1 && 
    d.validasi_kesubag === 'valid' && 
    (!d.validasi_pimpinan || d.validasi_pimpinan === 'pending')
  ).length;
  
  const pendingDraftDocs = dokumenOutput.filter(d => 
    d.tipe_dokumen === 'draft' && 
    d.draft_status_kesubag === 'reviewed' && 
    !d.draft_feedback_pimpinan
  ).length;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Get file icon based on type
  const getFileIcon = (tipeFile: string): string => {
    if (tipeFile.includes('pdf')) return '📄';
    if (tipeFile.includes('word') || tipeFile.includes('document')) return '📝';
    if (tipeFile.includes('excel') || tipeFile.includes('spreadsheet')) return '📊';
    if (tipeFile.includes('powerpoint') || tipeFile.includes('presentation')) return '📽️';
    if (tipeFile.includes('image')) return '🖼️';
    return '📎';
  };

  const handleSubmitEvaluasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEvaluasi(true);
    setError('');

    try {
      const res = await fetch('/api/pimpinan/evaluasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(kegiatanId),
          jenis_evaluasi: evaluasiForm.jenis_evaluasi,
          isi: evaluasiForm.isi
        })
      });

      if (res.ok) {
        setSuccess('Evaluasi berhasil disimpan');
        setEvaluasiForm({ jenis_evaluasi: 'catatan', isi: '' });
        setShowEvaluasiForm(false);
        fetchData(); // Refresh
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan evaluasi');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmittingEvaluasi(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!kegiatan || !summary) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LuCircleAlert className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kegiatan tidak ditemukan</h3>
        <p className="text-gray-500 mb-4">Kegiatan dengan ID {kegiatanId} tidak ada atau sudah dihapus.</p>
        <Link href="/pimpinan/kegiatan" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <LuChevronLeft className="w-4 h-4" />
          Kembali ke daftar kegiatan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/pimpinan/kegiatan" className="hover:text-blue-600">Monitoring Kegiatan</Link>
            <span>/</span>
            <span className="text-gray-900">Detail</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{kegiatan.nama}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700">
              {kegiatan.kro_kode}
            </span>
            <span className="text-sm text-gray-600">Tim: {kegiatan.tim_nama || '-'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusKinerjaBadge(summary.status_kinerja)}
          <span className={`text-3xl font-bold ${getSkorColor(summary.skor_kinerja)}`}>
            {summary.skor_kinerja}
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Informasi Detail Kegiatan */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📋</span> Informasi Detail Kegiatan
          </h2>
        </div>
        <div className="p-6">
          {/* Deskripsi */}
          {kegiatan.deskripsi && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-1">Deskripsi Kegiatan</p>
              <p className="text-gray-900">{kegiatan.deskripsi}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Kolom 1: Informasi Dasar */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <span className="text-blue-500">📌</span> Informasi Dasar
              </h3>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tim Pelaksana</p>
                <p className="font-medium text-gray-900">{kegiatan.tim_nama || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dibuat Oleh</p>
                <p className="font-medium text-gray-900">{kegiatan.created_by_nama || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status Kegiatan</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  kegiatan.status === 'selesai' ? 'bg-green-100 text-green-700' :
                  kegiatan.status === 'berjalan' ? 'bg-blue-100 text-blue-700' :
                  kegiatan.status === 'tertunda' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {kegiatan.status === 'selesai' ? '✅ Selesai' :
                   kegiatan.status === 'berjalan' ? '🔄 Berjalan' :
                   kegiatan.status === 'tertunda' ? '⏸️ Tertunda' :
                   kegiatan.status === 'belum_mulai' ? '⏳ Belum Mulai' : kegiatan.status}
                </span>
              </div>
            </div>

            {/* Kolom 2: KRO */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <span className="text-green-500">🎯</span> Klasifikasi Rincian Output
              </h3>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Kode KRO</p>
                <span className="inline-block mt-1 px-3 py-1 text-sm font-medium rounded bg-blue-50 text-blue-700">{kegiatan.kro_kode}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Nama KRO</p>
                <p className="font-medium text-gray-900">{kegiatan.kro_nama || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status Verifikasi</p>
                <div className="mt-1 space-y-2">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    statusVerifikasiDokumen.status === 'valid' ? 'bg-green-100 text-green-700' :
                    statusVerifikasiDokumen.status === 'menunggu' ? 'bg-blue-100 text-blue-700' :
                    statusVerifikasiDokumen.status === 'revisi' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {statusVerifikasiDokumen.status === 'valid' ? '✅ Valid' :
                     statusVerifikasiDokumen.status === 'menunggu' ? '⏳ Menunggu' :
                     statusVerifikasiDokumen.status === 'revisi' ? '📝 Revisi' :
                     'Belum Ada'}
                  </span>
                  {statusVerifikasiDokumen.target > 0 && (
                    <p className="text-sm font-semibold text-blue-600">
                      {statusVerifikasiDokumen.disahkan}/{statusVerifikasiDokumen.target} Disahkan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Kolom 3: Jadwal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <span className="text-purple-500">📅</span> Jadwal Pelaksanaan
              </h3>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Mulai (Rencana)</p>
                <p className="font-medium text-gray-900">{formatDate(kegiatan.tanggal_mulai)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Selesai (Rencana)</p>
                <p className="font-medium text-gray-900">{formatDate(kegiatan.tanggal_selesai)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Durasi Rencana</p>
                <p className="font-medium text-gray-900">
                  {Math.ceil((new Date(kegiatan.tanggal_selesai).getTime() - new Date(kegiatan.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24))} hari
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Selesai Aktual</p>
                <p className={`font-medium ${kegiatan.tanggal_realisasi_selesai ? 'text-green-600' : 'text-gray-400'}`}>
                  {kegiatan.tanggal_realisasi_selesai ? formatDate(kegiatan.tanggal_realisasi_selesai) : 'Belum Selesai'}
                </p>
              </div>
            </div>

            {/* Kolom 4: Target & Anggaran */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <span className="text-yellow-500">💰</span> Target & Anggaran
              </h3>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Target Output</p>
                <p className="font-medium text-gray-900">{Math.round(kegiatan.target_output)} {kegiatan.satuan_output}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Output Realisasi</p>
                <p className="font-medium text-blue-600">{Math.round(kegiatan.output_realisasi || 0)} {kegiatan.satuan_output}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Target Anggaran</p>
                <p className="font-medium text-gray-900">{formatCurrency(kegiatan.anggaran_pagu)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Realisasi Anggaran</p>
                <p className="font-medium text-green-600">{formatCurrency(summary.total_realisasi_anggaran)}</p>
              </div>
            </div>
          </div>

          {/* Section Mitra */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">👥</span> Mitra yang Ditugaskan
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {mitra.length} orang
              </span>
            </h3>
            {mitra.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm">Belum ada mitra yang ditugaskan untuk kegiatan ini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {mitra.map((m, index) => (
                  <div key={m.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {m.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{m.nama}</p>
                      {m.pekerjaan && <p className="text-xs text-gray-500 truncate">{m.pekerjaan}</p>}
                      {m.no_hp && <p className="text-xs text-gray-400">{m.no_hp}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b">
          <div className="flex flex-wrap lg:flex-nowrap">
            {[
              { id: 'evaluasi-kinerja', label: 'Ringkasan Performa', icon: '📊' },
              { id: 'progres', label: 'Progres', icon: '📈', count: progres.length },
              { id: 'anggaran', label: 'Realisasi Anggaran', icon: '💰', count: realisasiAnggaran.length },
              { id: 'kendala', label: 'Kendala', icon: '⚠️', count: kendala.length },
              { id: 'dokumen', label: 'Verifikasi Kualitas Output', icon: '✅', count: dokumenOutput.length },
              { id: 'waktu', label: 'Waktu Penyelesaian', icon: '⏰' },
              { id: 'evaluasi', label: 'Evaluasi', icon: '📝', count: evaluasi.filter(e => e.role_pemberi === 'pimpinan').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Evaluasi Kinerja */}
          {activeTab === 'evaluasi-kinerja' && summary && (
            <div className="space-y-6">
              {/* Ringkasan Performa - 6 Kartu Utama */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Capaian Output */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🎯</span>
                    <span className="text-sm font-medium text-blue-700">Capaian Output</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${
                    (kegiatan.target_output > 0 ? (kegiatan.output_realisasi || 0) / kegiatan.target_output * 100 : 0) >= 80 
                      ? 'text-green-600' 
                      : (kegiatan.target_output > 0 ? (kegiatan.output_realisasi || 0) / kegiatan.target_output * 100 : 0) >= 60 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {kegiatan.target_output > 0 
                      ? Math.round((kegiatan.output_realisasi || 0) / kegiatan.target_output * 100)
                      : 0}%
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Realisasi</span>
                      <span className="font-medium text-blue-700">{Math.round(kegiatan.output_realisasi || 0)} {kegiatan.satuan_output}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Target</span>
                      <span className="font-medium text-gray-700">{Math.round(kegiatan.target_output)} {kegiatan.satuan_output}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Selisih</span>
                      <span className={`font-medium ${summary.deviasi.output >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.deviasi.output >= 0 ? '+' : ''}{summary.deviasi.output} {kegiatan.satuan_output}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((kegiatan.output_realisasi || 0) / kegiatan.target_output * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Serapan Anggaran */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💰</span>
                    <span className="text-sm font-medium text-green-700">Serapan Anggaran</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${
                    summary.realisasi_anggaran_persen >= 80 ? 'text-green-600' :
                    summary.realisasi_anggaran_persen >= 50 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {summary.realisasi_anggaran_persen}%
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Realisasi</span>
                      <span className="font-medium text-green-700">{formatCurrency(summary.total_realisasi_anggaran)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Target</span>
                      <span className="font-medium text-gray-700">{formatCurrency(kegiatan.anggaran_pagu)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Sisa</span>
                      <span className="font-medium text-blue-600">{formatCurrency(kegiatan.anggaran_pagu - summary.total_realisasi_anggaran)}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(summary.realisasi_anggaran_persen, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Ketepatan Waktu */}
                <div className={`rounded-xl p-5 border ${
                  summary.indikator.ketepatan_waktu >= 80 
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' 
                    : summary.indikator.ketepatan_waktu >= 60 
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⏱️</span>
                    <span className={`text-sm font-medium ${
                      summary.indikator.ketepatan_waktu >= 80 ? 'text-emerald-700' :
                      summary.indikator.ketepatan_waktu >= 60 ? 'text-yellow-700' : 'text-red-700'
                    }`}>Ketepatan Waktu</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${
                    summary.indikator.ketepatan_waktu >= 80 ? 'text-emerald-600' :
                    summary.indikator.ketepatan_waktu >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(summary.indikator.ketepatan_waktu)}%
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Rencana Selesai</span>
                      <span className="font-medium text-gray-700">{formatDate(kegiatan.tanggal_selesai)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Aktual Selesai</span>
                      <span className={`font-medium ${kegiatan.tanggal_realisasi_selesai ? 'text-green-600' : 'text-gray-400'}`}>
                        {kegiatan.tanggal_realisasi_selesai ? formatDate(kegiatan.tanggal_realisasi_selesai) : 'Belum'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${summary.deviasi.waktu >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.deviasi.waktu >= 0 ? `${summary.deviasi.waktu} hari tersisa` : `Terlambat ${Math.abs(summary.deviasi.waktu)} hari`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className={`w-full rounded-full h-2 ${
                      summary.indikator.ketepatan_waktu >= 80 ? 'bg-emerald-200' :
                      summary.indikator.ketepatan_waktu >= 60 ? 'bg-yellow-200' : 'bg-red-200'
                    }`}>
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          summary.indikator.ketepatan_waktu >= 80 ? 'bg-emerald-600' :
                          summary.indikator.ketepatan_waktu >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(summary.indikator.ketepatan_waktu, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Kualitas Output */}
                <div className={`rounded-xl p-5 border ${
                  summary.indikator.kualitas_output >= 80 
                    ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' 
                    : summary.indikator.kualitas_output >= 50 
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">✅</span>
                    <span className={`text-sm font-medium ${
                      summary.indikator.kualitas_output >= 80 ? 'text-purple-700' :
                      summary.indikator.kualitas_output >= 50 ? 'text-yellow-700' : 'text-gray-600'
                    }`}>Kualitas Output</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${
                    summary.indikator.kualitas_output >= 80 ? 'text-purple-600' :
                    summary.indikator.kualitas_output >= 50 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {Math.round(summary.indikator.kualitas_output)}%
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Status Verifikasi</span>
                      <span className={`font-medium ${
                        statusVerifikasiDokumen.status === 'valid' ? 'text-green-600' :
                        statusVerifikasiDokumen.status === 'revisi' ? 'text-orange-600' :
                        statusVerifikasiDokumen.status === 'menunggu' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {statusVerifikasiDokumen.target > 0 
                          ? `${statusVerifikasiDokumen.disahkan}/${statusVerifikasiDokumen.target} Valid`
                          : (statusVerifikasiDokumen.status === 'valid' ? '✓ Valid' :
                             statusVerifikasiDokumen.status === 'revisi' ? '⚠ Revisi' :
                             statusVerifikasiDokumen.status === 'menunggu' ? '⏳ Menunggu' : 'Belum')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Dokumen</span>
                      <span className="font-medium text-gray-700">{dokumenOutput.length} file</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Disahkan</span>
                      <span className="font-medium text-green-600">{dokumenOutput.filter(d => d.tanggal_disahkan || d.status_final === 'disahkan').length} file</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className={`w-full rounded-full h-2 ${
                      summary.indikator.kualitas_output >= 80 ? 'bg-purple-200' :
                      summary.indikator.kualitas_output >= 50 ? 'bg-yellow-200' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          summary.indikator.kualitas_output >= 80 ? 'bg-purple-600' :
                          summary.indikator.kualitas_output >= 50 ? 'bg-yellow-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(summary.indikator.kualitas_output, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Penyelesaian Kendala */}
                <div className={`rounded-xl p-5 border ${
                  summary.total_kendala === 0 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    : summary.kendala_resolved === summary.total_kendala 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔧</span>
                    <span className={`text-sm font-medium ${
                      summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala 
                        ? 'text-green-700' : 'text-orange-700'
                    }`}>Kendala</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${
                    summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala 
                      ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {summary.kendala_resolved}/{summary.total_kendala}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium text-gray-700">{summary.total_kendala} kendala</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Selesai</span>
                      <span className="font-medium text-green-600">{summary.kendala_resolved} kendala</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Pending</span>
                      <span className={`font-medium ${summary.total_kendala - summary.kendala_resolved > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {summary.total_kendala - summary.kendala_resolved} kendala
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className={`w-full rounded-full h-2 ${
                      summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala 
                        ? 'bg-green-200' : 'bg-orange-200'
                    }`}>
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala 
                            ? 'bg-green-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${summary.total_kendala > 0 ? (summary.kendala_resolved / summary.total_kendala * 100) : 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Skor Kinerja Total */}
                <div className={`rounded-xl p-5 border ${
                  summary.skor_kinerja >= 80 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-200 border-green-300' 
                    : summary.skor_kinerja >= 60 
                    ? 'bg-gradient-to-br from-yellow-100 to-amber-200 border-yellow-300'
                    : summary.skor_kinerja > 0
                    ? 'bg-gradient-to-br from-red-100 to-rose-200 border-red-300'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📊</span>
                    <span className={`text-sm font-medium ${getSkorColor(summary.skor_kinerja)}`}>Skor Kinerja</span>
                  </div>
                  <p className={`text-5xl font-bold mb-2 ${getSkorColor(summary.skor_kinerja)}`}>
                    {summary.skor_kinerja}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-bold ${
                        summary.status_kinerja === 'Sukses' ? 'text-green-600' :
                        summary.status_kinerja === 'Perlu Perhatian' ? 'text-yellow-600' :
                        summary.status_kinerja === 'Bermasalah' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {summary.status_kinerja}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Threshold</span>
                      <span className="font-medium text-gray-700">≥80 Sukses</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <span className={`inline-block w-full text-center px-3 py-1.5 rounded-full text-xs font-bold ${
                      summary.status_kinerja === 'Sukses' ? 'bg-green-500 text-white' :
                      summary.status_kinerja === 'Perlu Perhatian' ? 'bg-yellow-500 text-white' :
                      summary.status_kinerja === 'Bermasalah' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                      {summary.status_kinerja === 'Sukses' ? '✓ KINERJA BAIK' :
                       summary.status_kinerja === 'Perlu Perhatian' ? '! PERLU PERHATIAN' :
                       summary.status_kinerja === 'Bermasalah' ? '✗ BERMASALAH' : 'BELUM DINILAI'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analisis Deviasi */}
              {summary.deviasi && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-5 border ${summary.deviasi.output >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📦</span>
                      <span className="font-medium text-gray-900">Deviasi Output</span>
                    </div>
                    <p className={`text-3xl font-bold ${summary.deviasi.output >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.deviasi.output >= 0 ? '+' : ''}{summary.deviasi.output} {kegiatan.satuan_output}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {summary.deviasi.output >= 0 ? 'Melebihi target' : 'Di bawah target'}
                    </p>
                  </div>
                  
                  <div className={`rounded-xl p-5 border ${summary.deviasi.waktu >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📅</span>
                      <span className="font-medium text-gray-900">Deviasi Waktu</span>
                    </div>
                    <p className={`text-3xl font-bold ${summary.deviasi.waktu >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.deviasi.waktu >= 0 ? `${summary.deviasi.waktu} hari` : `${Math.abs(summary.deviasi.waktu)} hari`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {summary.deviasi.waktu >= 0 ? 'Sisa waktu tersedia' : 'Terlambat dari jadwal'}
                    </p>
                  </div>
                  
                  <div className={`rounded-xl p-5 border ${
                    summary.deviasi.anggaran <= 0 ? 'bg-green-50 border-green-200' : 
                    summary.deviasi.anggaran <= 10 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💵</span>
                      <span className="font-medium text-gray-900">Deviasi Anggaran</span>
                    </div>
                    <p className={`text-3xl font-bold ${
                      summary.deviasi.anggaran <= 0 ? 'text-green-600' : 
                      summary.deviasi.anggaran <= 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {summary.deviasi.anggaran >= 0 ? '+' : ''}{summary.deviasi.anggaran.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {summary.deviasi.anggaran <= 0 ? 'Di bawah anggaran' : 'Melebihi anggaran'}
                    </p>
                  </div>
                </div>
              )}

              {/* Panduan Penilaian */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <span>📋</span> Panduan Interpretasi Skor Kinerja
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">✓</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">≥ 80</p>
                    <p className="font-semibold text-green-700">SUKSES</p>
                    <p className="text-xs text-gray-600 mt-1">Kinerja sangat baik, target tercapai</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200 text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">!</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">60 - 79</p>
                    <p className="font-semibold text-yellow-700">PERLU PERHATIAN</p>
                    <p className="text-xs text-gray-600 mt-1">Ada aspek yang perlu diperbaiki</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-200 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">✗</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">&lt; 60</p>
                    <p className="font-semibold text-red-700">BERMASALAH</p>
                    <p className="text-xs text-gray-600 mt-1">Perlu tindakan korektif segera</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Progres */}
          {activeTab === 'progres' && (
            <div>
              {/* Summary Cards - Berdasarkan jenis_validasi */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600">Target Output</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(kegiatan?.target_output || 0)}</p>
                  <p className="text-sm text-gray-500">{kegiatan?.satuan_output}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600">Output Tervalidasi</p>
                  <p className="text-2xl font-bold text-green-600">
                    {kegiatan?.jenis_validasi === 'kuantitas'
                      ? Math.round(validasiKuantitas.filter(v => v.status_pimpinan === 'valid').reduce((sum, v) => sum + Number(v.jumlah_output), 0))
                      : dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length}
                  </p>
                  <p className="text-sm text-gray-500">
                    {kegiatan?.jenis_validasi === 'kuantitas' ? `${kegiatan?.satuan_output} disahkan` : 'Dokumen disahkan'}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-gray-600">Menunggu Validasi</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {kegiatan?.jenis_validasi === 'kuantitas'
                      ? Math.round(validasiKuantitas.filter(v => v.status_kesubag === 'valid' && v.status_pimpinan === 'pending').reduce((sum, v) => sum + Number(v.jumlah_output), 0))
                      : dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.minta_validasi === 1 && d.status_final !== 'disahkan' && d.status_final !== 'revisi').length}
                  </p>
                  <p className="text-sm text-gray-500">
                    {kegiatan?.jenis_validasi === 'kuantitas' ? `${kegiatan?.satuan_output} diproses` : 'Dokumen diproses'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-gray-600">Progres Validasi</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {kegiatan?.target_output && kegiatan.target_output > 0
                      ? kegiatan?.jenis_validasi === 'kuantitas'
                        ? Math.round((validasiKuantitas.filter(v => v.status_pimpinan === 'valid').reduce((sum, v) => sum + Number(v.jumlah_output), 0) / kegiatan.target_output) * 100)
                        : Math.round((dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length / kegiatan.target_output) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">dari target</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 p-4 bg-white border rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progres Validasi Output</span>
                  <span className="text-sm font-bold text-blue-600">
                    {kegiatan?.jenis_validasi === 'kuantitas'
                      ? `${Math.round(validasiKuantitas.filter(v => v.status_pimpinan === 'valid').reduce((sum, v) => sum + Number(v.jumlah_output), 0))} / ${Math.round(kegiatan?.target_output || 0)} ${kegiatan?.satuan_output} tervalidasi`
                      : `${dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length} / ${Math.round(kegiatan?.target_output || 0)} tervalidasi`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${kegiatan?.target_output && kegiatan.target_output > 0 
                        ? kegiatan?.jenis_validasi === 'kuantitas'
                          ? Math.min((validasiKuantitas.filter(v => v.status_pimpinan === 'valid').reduce((sum, v) => sum + Number(v.jumlah_output), 0) / kegiatan.target_output) * 100, 100)
                          : Math.min((dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length / kegiatan.target_output) * 100, 100)
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Riwayat Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Output Realisasi (Manual)</p>
                    <p className="font-semibold text-gray-900">{Math.round(kegiatan?.output_realisasi || 0)} {kegiatan?.satuan_output}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Selesai Aktual</p>
                    <p className="font-semibold text-gray-900">
                      {kegiatan?.tanggal_realisasi_selesai 
                        ? formatDate(kegiatan.tanggal_realisasi_selesai) 
                        : <span className="text-gray-400">Belum selesai</span>}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Riwayat Progres</h3>
              {progres.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada riwayat progres</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal Update</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Capaian Output (%)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {progres.map(p => (
                        <tr key={p.id}>
                          <td className="px-4 py-3">{formatDate(p.tanggal_update)}</td>
                          <td className="px-4 py-3 font-medium">{Math.round(p.capaian_output)}%</td>
                          <td className="px-4 py-3">{p.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Anggaran */}
          {activeTab === 'anggaran' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-600">Total Realisasi</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.total_realisasi_anggaran)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">dari Target</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(kegiatan.anggaran_pagu)}</p>
                    <p className="text-sm text-green-600">{summary.realisasi_anggaran_persen}% terserap</p>
                  </div>
                </div>
              </div>

              {realisasiAnggaran.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada realisasi anggaran</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tanggal</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Jumlah</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {realisasiAnggaran.map((ra) => (
                      <tr key={ra.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(ra.tanggal_realisasi)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(ra.jumlah)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ra.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab: Kendala */}
          {activeTab === 'kendala' && (
            <div className="space-y-4">
              {kendala.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg">
                  <LuCircleCheck className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Tidak ada kendala</p>
                </div>
              ) : (
                kendala.map((k) => (
                  <div key={k.id} className={`border rounded-lg p-4 ${
                    k.status === 'selesai' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        k.tingkat_prioritas === 'tinggi' ? 'bg-red-100 text-red-700' :
                        k.tingkat_prioritas === 'sedang' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        Prioritas {k.tingkat_prioritas}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        k.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {k.status === 'selesai' ? '✓ Selesai' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{k.deskripsi}</p>
                    <p className="text-xs text-gray-500">Dilaporkan: {formatDate(k.created_at)}</p>
                    
                    {k.tindak_lanjut && k.tindak_lanjut.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-300 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Tindak Lanjut:</p>
                        {k.tindak_lanjut.map((tl) => (
                          <div key={tl.id} className="text-sm">
                            <p className="text-gray-700">{tl.deskripsi}</p>
                            <p className="text-xs text-gray-500">
                              {tl.batas_waktu && `Batas: ${formatDate(tl.batas_waktu)} | `}
                              Status: {tl.status}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Dokumen Output */}
          {activeTab === 'dokumen' && (
            <div className="space-y-6">
              {/* Conditional rendering based on jenis_validasi */}
              {(kegiatan?.jenis_validasi === 'kuantitas') ? (
                /* ==================== KUANTITAS VALIDATION UI ==================== */
                <div>
                  {/* Info Box for Kuantitas */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                      <span>📊</span> Validasi & Pengesahan Kuantitas Output
                    </h4>
                    <p className="text-sm text-indigo-700">
                      Validasi data kuantitas output yang sudah divalidasi oleh Koordinator. Satuan output: <strong>{kegiatan?.satuan_output}</strong>
                    </p>
                  </div>

                  {/* Kuantitas Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{Math.round(kegiatan?.target_output || 0)}</p>
                      <p className="text-sm text-blue-600">Target Output</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {validasiKuantitas.filter(v => v.status_kesubag === 'valid' && v.status_pimpinan === 'pending').length}
                      </p>
                      <p className="text-sm text-yellow-600">Menunggu Validasi</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(validasiKuantitas.filter(v => v.status_pimpinan === 'valid').reduce((sum, v) => sum + Number(v.jumlah_output), 0))}
                      </p>
                      <p className="text-sm text-green-600">Disahkan ({kegiatan?.satuan_output})</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {validasiKuantitas.filter(v => v.status_pimpinan === 'tidak_valid').length}
                      </p>
                      <p className="text-sm text-red-600">Ditolak</p>
                    </div>
                  </div>

                  {/* Kuantitas List */}
                  {validasiKuantitas.filter(v => v.status_kesubag === 'valid').length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📊</span>
                      </div>
                      <p className="text-gray-500 mb-2">Belum ada data kuantitas yang siap divalidasi</p>
                      <p className="text-sm text-gray-400">Data kuantitas akan muncul setelah divalidasi oleh Koordinator</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {validasiKuantitas.filter(v => v.status_kesubag === 'valid').map((val) => {
                        const needsValidation = val.status_pimpinan === 'pending';
                        const isValidated = val.status_pimpinan === 'valid';
                        const isRejected = val.status_pimpinan === 'tidak_valid';
                        
                        return (
                          <div key={val.id} className={`p-4 border rounded-xl ${
                            isValidated ? 'bg-green-50 border-green-200' : 
                            isRejected ? 'bg-red-50 border-red-200' : 
                            'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  isValidated ? 'bg-green-100' : 
                                  isRejected ? 'bg-red-100' : 
                                  'bg-indigo-100'
                                }`}>
                                  <span className="text-2xl">{isValidated ? '🏆' : isRejected ? '❌' : '📊'}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-xl font-bold text-gray-900">
                                    {Math.round(Number(val.jumlah_output))} <span className="text-sm font-normal text-gray-500">{kegiatan?.satuan_output}</span>
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Disubmit: {formatDate(val.created_at)}
                                  </p>
                                  {val.keterangan && (
                                    <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded">
                                      💬 {val.keterangan}
                                    </p>
                                  )}
                                  
                                  {/* Validation Status */}
                                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                    <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                                      Koordinator: ✅ Valid
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className={`px-2 py-1 rounded ${
                                      isValidated ? 'bg-green-100 text-green-700' :
                                      isRejected ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      Pimpinan: {isValidated ? '🏆 Disahkan' : isRejected ? '❌ Ditolak' : '⏳ Pending'}
                                    </span>
                                  </div>

                                  {val.feedback_kesubag && (
                                    <p className="mt-2 text-sm text-teal-700 bg-teal-50 p-2 rounded">
                                      💬 <strong>Koordinator:</strong> {val.feedback_kesubag}
                                    </p>
                                  )}
                                  {val.feedback_pimpinan && (
                                    <p className="mt-2 text-sm text-purple-700 bg-purple-50 p-2 rounded">
                                      💬 <strong>Anda:</strong> {val.feedback_pimpinan}
                                    </p>
                                  )}

                                  {/* Validation Form */}
                                  {needsValidation && (
                                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                      <p className="text-sm font-medium text-indigo-700 mb-3">🏆 Validasi & Sahkan Data Kuantitas:</p>
                                      <div className="space-y-3">
                                        <textarea
                                          placeholder="Catatan (opsional untuk valid, wajib untuk tolak)..."
                                          id={`catatan-kuantitas-pimpinan-${val.id}`}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                          rows={2}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              const textarea = document.getElementById(`catatan-kuantitas-pimpinan-${val.id}`) as HTMLTextAreaElement;
                                              handleValidasiKuantitas(val.id, 'valid', textarea?.value || '');
                                            }}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                          >
                                            <span>🏆</span> Valid & Sahkan
                                          </button>
                                          <button
                                            onClick={() => {
                                              const textarea = document.getElementById(`catatan-kuantitas-pimpinan-${val.id}`) as HTMLTextAreaElement;
                                              const catatan = textarea?.value || '';
                                              if (!catatan.trim()) {
                                                setError('Harap berikan catatan alasan penolakan');
                                                return;
                                              }
                                              handleValidasiKuantitas(val.id, 'tidak_valid', catatan);
                                            }}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                                          >
                                            <span>❌</span> Tidak Valid
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bukti Button */}
                              {val.bukti_path && (
                                <a 
                                  href={val.bukti_path} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 inline-flex items-center gap-2 flex-shrink-0"
                                >
                                  👁️ Lihat Bukti
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ==================== DOKUMEN VALIDATION UI ==================== */
                <div>
              {/* Info Box */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                      <span>📁</span> Review Dokumen Output
                    </h4>
                    <p className="text-sm text-indigo-700">
                      Review dokumen yang diupload oleh pelaksana. Validasi dokumen final setelah Koordinator menyetujui.
                    </p>
                  </div>
                  
                  {/* Bulk Validation Button */}
                  {(pendingFinalDocs > 0 || pendingDraftDocs > 0) && (
                    <button
                      onClick={() => setShowBulkValidationModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
                    >
                      <LuCheck className="w-4 h-4" />
                      <span>Validasi Semua</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{pendingFinalDocs + pendingDraftDocs}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-700">{dokumenOutput.length}</p>
                  <p className="text-sm text-gray-500">Total Dokumen</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{dokumenOutput.filter(d => d.minta_validasi === 1 && d.validasi_pimpinan === 'pending').length}</p>
                  <p className="text-sm text-amber-600">Menunggu Validasi</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{dokumenOutput.filter(d => d.tanggal_disahkan || d.status_final === 'disahkan').length}</p>
                  <p className="text-sm text-green-600">Disahkan</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{dokumenOutput.filter(d => d.validasi_pimpinan === 'tidak_valid').length}</p>
                  <p className="text-sm text-red-600">Tidak Valid</p>
                </div>
              </div>

              {/* Daftar Dokumen */}
              {dokumenOutput.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📁</span>
                  </div>
                  <p className="text-gray-500 mb-2">Belum ada dokumen diupload</p>
                  <p className="text-sm text-gray-400">Pelaksana belum mengupload dokumen output</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dokumenOutput.map((dok) => {
                    const isDraft = dok.tipe_dokumen === 'draft';
                    const isFinal = dok.tipe_dokumen === 'final';
                    const mintaValidasi = dok.minta_validasi === 1;
                    const isDisahkan = !!dok.tanggal_disahkan || dok.status_final === 'disahkan';
                    
                    // For final validation: kesubag must approve first
                    const kesubagApproved = dok.validasi_kesubag === 'valid';
                    const needsFinalValidation = isFinal && mintaValidasi && kesubagApproved && 
                      (!dok.validasi_pimpinan || dok.validasi_pimpinan === 'pending');
                    const canSahkan = isFinal && mintaValidasi && dok.validasi_pimpinan === 'valid' && !isDisahkan;
                    
                    // For draft: kesubag must review first
                    const kesubagReviewedDraft = dok.draft_status_kesubag === 'reviewed';
                    const needsDraftFeedback = isDraft && kesubagReviewedDraft && !dok.draft_feedback_pimpinan;
                    
                    return (
                      <div key={dok.id} className={`border rounded-xl p-5 ${
                        isDisahkan ? 'bg-green-50 border-green-300' :
                        dok.validasi_pimpinan === 'valid' || dok.draft_feedback_pimpinan ? 'bg-green-50 border-green-200' :
                        dok.validasi_pimpinan === 'tidak_valid' || dok.draft_status_kesubag === 'revisi' ? 'bg-red-50 border-red-200' :
                        (needsFinalValidation || needsDraftFeedback) ? 'bg-blue-50 border-blue-200' :
                        'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-start gap-4">
                          {/* File Icon */}
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDisahkan ? 'bg-green-200' : 'bg-gray-100'
                          }`}>
                            <span className="text-2xl">{isDisahkan ? '🏆' : getFileIcon(dok.tipe_file)}</span>
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">{dok.nama_file}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isFinal ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {isFinal ? '✅ Final' : '📝 Draft'}
                              </span>
                              {mintaValidasi && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                  📤 Minta Validasi
                                </span>
                              )}
                              {isDisahkan && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                                  🏆 DISAHKAN
                                </span>
                              )}
                              {needsFinalValidation && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white animate-pulse">
                                  ⏳ Menunggu Validasi Anda
                                </span>
                              )}
                            </div>
                            
                            {dok.deskripsi && (
                              <p className="text-sm text-gray-600 mb-2">{dok.deskripsi}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                              <span>{formatFileSize(dok.ukuran_file)}</span>
                              <span>•</span>
                              <span>Diupload: {formatDate(dok.uploaded_at)}</span>
                              <span>•</span>
                              <span>Oleh: {dok.uploaded_by_nama}</span>
                            </div>

                            {/* For Final documents with minta_validasi - Show validation flow */}
                            {isFinal && mintaValidasi && (
                              <div className="mb-4 p-3 bg-white rounded-lg border">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Status Validasi Dokumen Final:</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                                  {/* Koordinator Validation */}
                                  <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                    dok.validasi_kesubag === 'valid' ? 'bg-green-100 text-green-700' :
                                    dok.validasi_kesubag === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    <span>Koordinator:</span>
                                    <span className="font-medium">
                                      {dok.validasi_kesubag === 'valid' ? '✅ Valid' :
                                       dok.validasi_kesubag === 'tidak_valid' ? '❌ Tidak Valid' : '⏳ Pending'}
                                    </span>
                                  </div>
                                  <span className="text-gray-400">→</span>
                                  {/* Pimpinan Validation */}
                                  <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                    dok.validasi_pimpinan === 'valid' ? 'bg-green-100 text-green-700' :
                                    dok.validasi_pimpinan === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    <span>Pimpinan:</span>
                                    <span className="font-medium">
                                      {dok.validasi_pimpinan === 'valid' ? '✅ Valid' :
                                       dok.validasi_pimpinan === 'tidak_valid' ? '❌ Tidak Valid' : '⏳ Pending'}
                                    </span>
                                  </div>
                                  {isDisahkan && (
                                    <>
                                      <span className="text-gray-400">→</span>
                                      <span className="px-2 py-1 bg-green-600 text-white rounded font-medium">🏆 Disahkan</span>
                                    </>
                                  )}
                                </div>
                                {dok.validasi_feedback_kesubag && (
                                  <p className="text-sm text-teal-700 bg-teal-50 p-2 rounded mt-2">
                                    💬 <strong>Koordinator:</strong> {dok.validasi_feedback_kesubag}
                                  </p>
                                )}
                                {dok.validasi_feedback_pimpinan && (
                                  <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded mt-2">
                                    💬 <strong>Pimpinan:</strong> {dok.validasi_feedback_pimpinan}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* For Final documents WITHOUT minta_validasi - Show waiting status */}
                            {isFinal && !mintaValidasi && (
                              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 mb-2">📄 Status Dokumen Final:</p>
                                <p className="text-sm text-gray-600 italic">
                                  ⏳ Menunggu pelaksana mengajukan permintaan validasi. Dokumen ini belum dapat divalidasi.
                                </p>
                              </div>
                            )}

                            {/* For Final documents with minta_validasi but koordinator not approved yet */}
                            {isFinal && mintaValidasi && !kesubagApproved && dok.validasi_kesubag !== 'tidak_valid' && (
                              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs font-semibold text-amber-700 mb-2">⏳ Menunggu Validasi Koordinator:</p>
                                <p className="text-sm text-amber-600 italic">
                                  Dokumen ini sedang menunggu validasi dari Koordinator. Anda dapat memvalidasi setelah Koordinator menyetujui.
                                </p>
                              </div>
                            )}

                            {/* For Draft documents - Show review flow */}
                            {isDraft && (
                              <div className="mb-4 p-3 bg-white rounded-lg border">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Status Review Draft:</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                                  {/* Koordinator Review */}
                                  <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                    dok.draft_status_kesubag === 'reviewed' ? 'bg-green-100 text-green-700' :
                                    dok.draft_status_kesubag === 'revisi' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    <span>Koordinator:</span>
                                    <span className="font-medium">
                                      {dok.draft_status_kesubag === 'reviewed' ? '✅ Reviewed' :
                                       dok.draft_status_kesubag === 'revisi' ? '❌ Revisi' : '⏳ Pending'}
                                    </span>
                                  </div>
                                  <span className="text-gray-400">→</span>
                                  {/* Pimpinan Review */}
                                  <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                    dok.draft_feedback_pimpinan ? 'bg-green-100 text-green-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    <span>Pimpinan:</span>
                                    <span className="font-medium">
                                      {dok.draft_feedback_pimpinan ? '✅ Reviewed' : '⏳ Pending'}
                                    </span>
                                  </div>
                                </div>
                                {dok.draft_feedback_kesubag && (
                                  <p className="text-sm text-teal-700 bg-teal-50 p-2 rounded mt-2">
                                    💬 <strong>Koordinator:</strong> {dok.draft_feedback_kesubag}
                                  </p>
                                )}
                                {dok.draft_feedback_pimpinan && (
                                  <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded mt-2">
                                    💬 <strong>Pimpinan:</strong> {dok.draft_feedback_pimpinan}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Final Validation Form - only if kesubag approved */}
                            {needsFinalValidation && (
                              <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                <p className="text-sm font-medium text-indigo-700 mb-3">✅ Validasi Dokumen Final (Koordinator telah memvalidasi):</p>
                                <div className="space-y-3">
                                  <textarea
                                    placeholder="Catatan validasi (opsional untuk valid, wajib untuk invalid)..."
                                    value={reviewingDokumenId === dok.id ? reviewForm.catatan : ''}
                                    onChange={(e) => {
                                      setReviewingDokumenId(dok.id);
                                      setReviewForm({ ...reviewForm, catatan: e.target.value });
                                    }}
                                    onFocus={() => setReviewingDokumenId(dok.id)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleValidateDokumenFinal(dok.id, 'valid', reviewingDokumenId === dok.id ? reviewForm.catatan : '')}
                                      className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                      <span>✅</span> Valid
                                    </button>
                                    <button
                                      onClick={() => {
                                        const catatan = reviewingDokumenId === dok.id ? reviewForm.catatan : '';
                                        if (!catatan.trim()) {
                                          setError('Harap berikan catatan alasan penolakan');
                                          return;
                                        }
                                        handleValidateDokumenFinal(dok.id, 'tidak_valid', catatan);
                                      }}
                                      className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                                    >
                                      <span>❌</span> Tidak Valid
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Sahkan Button - only if validated by pimpinan */}
                            {canSahkan && (
                              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm font-medium text-green-700 mb-3">🏆 Dokumen telah divalidasi dan siap disahkan:</p>
                                <button
                                  onClick={() => handleSahkanDokumen(dok.id)}
                                  className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                  <span>🏆</span> Sahkan Dokumen
                                </button>
                              </div>
                            )}

                            {/* Draft Feedback Form - only if kesubag reviewed */}
                            {needsDraftFeedback && (
                              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-sm font-medium text-purple-700 mb-3">📝 Review Draft:</p>
                                <div className="space-y-3">
                                  <textarea
                                    placeholder="Catatan untuk pelaksana (opsional untuk terima, wajib untuk tolak)..."
                                    value={reviewingDokumenId === dok.id ? reviewForm.catatan : ''}
                                    onChange={(e) => {
                                      setReviewingDokumenId(dok.id);
                                      setReviewForm({ ...reviewForm, catatan: e.target.value });
                                    }}
                                    onFocus={() => setReviewingDokumenId(dok.id)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDraftFeedback(dok.id, reviewingDokumenId === dok.id ? reviewForm.catatan : '', 'diterima')}
                                      className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                      <span>✅</span> Terima
                                    </button>
                                    <button
                                      onClick={() => {
                                        const catatan = reviewingDokumenId === dok.id ? reviewForm.catatan : '';
                                        if (!catatan.trim()) {
                                          setError('Harap berikan catatan alasan penolakan');
                                          return;
                                        }
                                        handleDraftFeedback(dok.id, catatan, 'ditolak');
                                      }}
                                      className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                                    >
                                      <span>❌</span> Tolak
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* View Button */}
                          <div className="flex-shrink-0">
                            <a
                              href={dok.path_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 inline-flex items-center gap-2"
                            >
                              👁️ Lihat File
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Waktu Penyelesaian */}
          {activeTab === 'waktu' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>⏰</span> Analisis Waktu Penyelesaian
                </h3>
                <p className="text-sm text-gray-600">
                  Perbandingan waktu rencana dengan realisasi penyelesaian kegiatan
                </p>
              </div>

              {/* Timeline Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Waktu Rencana */}
                <div className="bg-white border rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">📅</span>
                    Waktu Rencana
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-600">Tanggal Mulai</span>
                      <span className="font-semibold text-gray-900">{formatDate(kegiatan.tanggal_mulai)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-600">Tanggal Selesai</span>
                      <span className="font-semibold text-gray-900">{formatDate(kegiatan.tanggal_selesai)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg">
                      <span className="text-gray-700 font-medium">Durasi Rencana</span>
                      <span className="font-bold text-blue-700">
                        {Math.ceil((new Date(kegiatan.tanggal_selesai).getTime() - new Date(kegiatan.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24))} hari
                      </span>
                    </div>
                  </div>
                </div>

                {/* Waktu Realisasi */}
                <div className="bg-white border rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✅</span>
                    Waktu Realisasi
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-600">Tanggal Mulai Aktual</span>
                      <span className="font-semibold text-gray-900">
                        {kegiatan.tanggal_realisasi_mulai 
                          ? formatDate(kegiatan.tanggal_realisasi_mulai) 
                          : <span className="text-gray-400">Belum dimulai</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-600">Tanggal Selesai Aktual</span>
                      <span className="font-semibold text-gray-900">
                        {kegiatan.tanggal_realisasi_selesai 
                          ? formatDate(kegiatan.tanggal_realisasi_selesai)
                          : <span className="text-gray-400">Belum selesai</span>}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      kegiatan.tanggal_realisasi_mulai && kegiatan.tanggal_realisasi_selesai
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      <span className="text-gray-700 font-medium">Durasi Aktual</span>
                      <span className={`font-bold ${
                        kegiatan.tanggal_realisasi_mulai && kegiatan.tanggal_realisasi_selesai
                          ? 'text-green-700'
                          : 'text-gray-400'
                      }`}>
                        {kegiatan.tanggal_realisasi_mulai && kegiatan.tanggal_realisasi_selesai
                          ? `${Math.ceil((new Date(kegiatan.tanggal_realisasi_selesai).getTime() - new Date(kegiatan.tanggal_realisasi_mulai).getTime()) / (1000 * 60 * 60 * 24))} hari`
                          : 'Belum selesai'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Ketepatan Waktu */}
              {(() => {
                const deadline = new Date(kegiatan.tanggal_selesai);
                const today = new Date();
                const realisasiSelesai = kegiatan.tanggal_realisasi_selesai ? new Date(kegiatan.tanggal_realisasi_selesai) : null;
                
                let status: 'tepat' | 'lebih_cepat' | 'terlambat' | 'belum_selesai' | 'berjalan';
                let selisihHari = 0;
                
                if (realisasiSelesai) {
                  selisihHari = Math.ceil((deadline.getTime() - realisasiSelesai.getTime()) / (1000 * 60 * 60 * 24));
                  if (selisihHari > 0) status = 'lebih_cepat';
                  else if (selisihHari < 0) status = 'terlambat';
                  else status = 'tepat';
                } else {
                  selisihHari = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  if (selisihHari < 0) status = 'terlambat';
                  else status = 'berjalan';
                }

                return (
                  <div className={`rounded-xl p-6 ${
                    status === 'tepat' || status === 'lebih_cepat' 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                      : status === 'terlambat'
                      ? 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Status Ketepatan Waktu</h4>
                        <p className="text-sm text-gray-600">
                          {status === 'tepat' && 'Kegiatan selesai tepat pada waktunya'}
                          {status === 'lebih_cepat' && `Kegiatan selesai ${Math.abs(selisihHari)} hari lebih cepat dari jadwal`}
                          {status === 'terlambat' && realisasiSelesai && `Kegiatan selesai ${Math.abs(selisihHari)} hari terlambat dari jadwal`}
                          {status === 'terlambat' && !realisasiSelesai && `Kegiatan sudah melewati deadline ${Math.abs(selisihHari)} hari`}
                          {status === 'berjalan' && `${selisihHari} hari lagi menuju deadline`}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className={`text-4xl font-bold ${
                          status === 'tepat' || status === 'lebih_cepat' ? 'text-green-600' :
                          status === 'terlambat' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {status === 'tepat' && '✓'}
                          {status === 'lebih_cepat' && `+${Math.abs(selisihHari)}`}
                          {status === 'terlambat' && `-${Math.abs(selisihHari)}`}
                          {status === 'berjalan' && selisihHari}
                        </span>
                        <p className="text-sm text-gray-600">
                          {status === 'tepat' && 'Tepat Waktu'}
                          {status === 'lebih_cepat' && 'Hari Lebih Cepat'}
                          {status === 'terlambat' && 'Hari Terlambat'}
                          {status === 'berjalan' && 'Hari Tersisa'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab: Evaluasi Pimpinan */}
          {activeTab === 'evaluasi' && (
            <div className="space-y-4">
              {/* Add Evaluasi Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEvaluasiForm(!showEvaluasiForm)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <LuPlus className="w-4 h-4" />
                  Tambah Evaluasi
                </button>
              </div>

              {/* Evaluasi Form */}
              {showEvaluasiForm && (
                <div className="bg-blue-50 border border-indigo-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Tambah Evaluasi Baru</h4>
                  <form onSubmit={handleSubmitEvaluasi} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Evaluasi
                      </label>
                      <select
                        value={evaluasiForm.jenis_evaluasi}
                        onChange={(e) => setEvaluasiForm({...evaluasiForm, jenis_evaluasi: e.target.value as 'catatan' | 'arahan' | 'rekomendasi'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="catatan">📝 Catatan</option>
                        <option value="arahan">👉 Arahan</option>
                        <option value="rekomendasi">💡 Rekomendasi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Isi Evaluasi <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={evaluasiForm.isi}
                        onChange={(e) => setEvaluasiForm({...evaluasiForm, isi: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Tulis catatan, arahan, atau rekomendasi..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ⚠️ Evaluasi tidak dapat diubah setelah disimpan
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEvaluasiForm(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submittingEvaluasi || !evaluasiForm.isi.trim()}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {submittingEvaluasi ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <LuCheck className="w-4 h-4" />
                        )}
                        Simpan Evaluasi
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Evaluasi List - Hanya tampilkan evaluasi dari pimpinan */}
              {evaluasi.filter(e => e.role_pemberi === 'pimpinan').length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada evaluasi dari pimpinan</p>
                </div>
              ) : (
                evaluasi.filter(e => e.role_pemberi === 'pimpinan').map((e) => (
                  <div key={e.id} className={`border rounded-lg p-4 ${
                    e.jenis_evaluasi === 'catatan' ? 'bg-blue-50 border-blue-200' :
                    e.jenis_evaluasi === 'arahan' ? 'bg-orange-50 border-orange-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          e.jenis_evaluasi === 'catatan' ? 'bg-blue-100 text-blue-700' :
                          e.jenis_evaluasi === 'arahan' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {e.jenis_evaluasi === 'catatan' ? '📝 Catatan' :
                           e.jenis_evaluasi === 'arahan' ? '👉 Arahan' :
                           '💡 Rekomendasi'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(e.created_at)}</span>
                    </div>
                    <p className="text-gray-900 mb-2">{e.isi}</p>
                    <p className="text-xs text-gray-600">Oleh: {e.pemberi_nama}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Validation Modal */}
      {showBulkValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <LuCheck className="w-6 h-6" />
                Validasi Massal Dokumen
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Validasi dan sahkan semua dokumen yang menunggu dalam satu kali proses
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{pendingFinalDocs}</p>
                  <p className="text-xs text-indigo-700">Dokumen Final Menunggu</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{pendingDraftDocs}</p>
                  <p className="text-xs text-amber-700">Draft Menunggu Feedback</p>
                </div>
              </div>

              {/* Validation Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Jenis Validasi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBulkValidationType('valid')}
                    disabled={pendingFinalDocs === 0}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bulkValidationType === 'valid' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${pendingFinalDocs === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-medium text-gray-900">🏆 Validasi & Sahkan</p>
                    <p className="text-xs text-gray-500">{pendingFinalDocs} dokumen</p>
                  </button>
                  <button
                    onClick={() => setBulkValidationType('draft_feedback')}
                    disabled={pendingDraftDocs === 0}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bulkValidationType === 'draft_feedback' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-amber-300'
                    } ${pendingDraftDocs === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-medium text-gray-900">💬 Feedback Draft</p>
                    <p className="text-xs text-gray-500">{pendingDraftDocs} dokumen</p>
                  </button>
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="text-sm font-medium text-gray-700">Catatan (opsional):</label>
                <textarea
                  value={bulkCatatan}
                  onChange={(e) => setBulkCatatan(e.target.value)}
                  placeholder="Tambahkan catatan untuk semua dokumen..."
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                />
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Tindakan ini akan memproses <strong>{bulkValidationType === 'valid' ? pendingFinalDocs : pendingDraftDocs}</strong> dokumen sekaligus. 
                  {bulkValidationType === 'valid' && ' Dokumen akan langsung disahkan.'}
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowBulkValidationModal(false);
                  setBulkCatatan('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleBulkValidation}
                disabled={bulkValidating || (bulkValidationType === 'valid' ? pendingFinalDocs === 0 : pendingDraftDocs === 0)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {bulkValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <LuCheck className="w-4 h-4" />
                    {bulkValidationType === 'valid' ? 'Validasi & Sahkan Semua' : 'Feedback Semua'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
