'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

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
  jenis_evaluasi: string;
  isi: string;
  created_at: string;
  pimpinan_nama: string;
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
  status_review: 'pending' | 'diterima' | 'ditolak';
  catatan_reviewer?: string;
  reviewed_at?: string;
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

  useEffect(() => {
    fetchData();
    fetchDokumen();
  }, [kegiatanId]);

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

  const handleReviewDokumen = async (dokumenId: number, status: 'diterima' | 'ditolak', catatan: string) => {
    setReviewingDokumenId(dokumenId);
    setError('');

    try {
      const res = await fetch('/api/pimpinan/dokumen-output', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dokumenId,
          status_review: status,
          catatan_reviewer: catatan
        })
      });

      if (res.ok) {
        setSuccess(`Dokumen berhasil ${status === 'diterima' ? 'diterima' : 'ditolak'}`);
        setReviewForm({ status: '', catatan: '' });
        fetchDokumen();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mereview dokumen');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mereview dokumen');
    } finally {
      setReviewingDokumenId(null);
    }
  };

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
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kegiatan tidak ditemukan</h3>
        <p className="text-gray-500 mb-4">Kegiatan dengan ID {kegiatanId} tidak ada atau sudah dihapus.</p>
        <Link href="/pimpinan/kegiatan" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
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
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  kegiatan.status_verifikasi === 'valid' ? 'bg-green-100 text-green-700' :
                  kegiatan.status_verifikasi === 'menunggu' ? 'bg-blue-100 text-blue-700' :
                  kegiatan.status_verifikasi === 'revisi' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {kegiatan.status_verifikasi === 'valid' ? '✅ Valid' :
                   kegiatan.status_verifikasi === 'menunggu' ? '⏳ Menunggu Validasi' :
                   kegiatan.status_verifikasi === 'revisi' ? '📝 Revisi' :
                   'Belum Diverifikasi'}
                </span>
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
              { id: 'evaluasi', label: 'Catatan Pimpinan', icon: '📝', count: evaluasi.length },
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
                        kegiatan.status_verifikasi === 'valid' ? 'text-green-600' :
                        kegiatan.status_verifikasi === 'revisi' ? 'text-orange-600' :
                        kegiatan.status_verifikasi === 'menunggu' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {kegiatan.status_verifikasi === 'valid' ? '✓ Valid' :
                         kegiatan.status_verifikasi === 'revisi' ? '⚠ Revisi' :
                         kegiatan.status_verifikasi === 'menunggu' ? '⏳ Menunggu' : 'Belum'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Dokumen</span>
                      <span className="font-medium text-gray-700">{dokumenOutput.length} file</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Diterima</span>
                      <span className="font-medium text-green-600">{dokumenOutput.filter(d => d.status_review === 'diterima').length} file</span>
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
              {/* Info Output dari Kegiatan */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Target Output</p>
                    <p className="font-semibold text-gray-900">{Math.round(kegiatan?.target_output || 0)} {kegiatan?.satuan_output}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Output Realisasi</p>
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
                  <svg className="w-12 h-12 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
              {/* Info Box */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                  <span>📁</span> Review Dokumen Output
                </h4>
                <p className="text-sm text-indigo-700">
                  Review dokumen yang diupload oleh pelaksana. Terima jika sesuai atau tolak dengan catatan jika perlu revisi.
                </p>
              </div>

              {/* Status Verifikasi Kegiatan - untuk pimpinan memvalidasi */}
              <div className={`rounded-xl p-6 ${
                kegiatan.status_verifikasi === 'valid' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                  : kegiatan.status_verifikasi === 'revisi'
                  ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                  : kegiatan.status_verifikasi === 'menunggu'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span>✅</span> Status Verifikasi Kualitas Output
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {kegiatan.status_verifikasi === 'valid' && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                          ✅ VALID - Output telah diverifikasi
                        </span>
                      )}
                      {kegiatan.status_verifikasi === 'menunggu' && (
                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                          📤 MENUNGGU VALIDASI - Pelaksana meminta validasi
                        </span>
                      )}
                      {kegiatan.status_verifikasi === 'revisi' && (
                        <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium">
                          ⚠️ REVISI - Perlu perbaikan
                        </span>
                      )}
                      {kegiatan.status_verifikasi === 'belum_verifikasi' && (
                        <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                          ⏳ Belum Ada Permintaan Validasi
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {kegiatan.status_verifikasi === 'menunggu'
                        ? 'Pelaksana telah mengupload dokumen final dan meminta validasi. Review dokumen dan berikan keputusan.'
                        : kegiatan.status_verifikasi === 'valid'
                        ? 'Kegiatan telah divalidasi. Skor kualitas output: 100 poin.'
                        : kegiatan.status_verifikasi === 'revisi'
                        ? 'Kegiatan memerlukan revisi. Skor kualitas output: 50 poin.'
                        : 'Pelaksana belum meminta validasi untuk kegiatan ini.'}
                    </p>
                  </div>
                  
                  {/* Tombol Validasi - hanya tampil jika status menunggu atau revisi */}
                  {(kegiatan.status_verifikasi === 'menunggu' || kegiatan.status_verifikasi === 'revisi') && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleVerifikasi('valid')}
                        disabled={updatingVerifikasi}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
                      >
                        {updatingVerifikasi ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>✅</span>
                        )}
                        Validasi Output
                      </button>
                      <button
                        onClick={() => handleVerifikasi('revisi')}
                        disabled={updatingVerifikasi || kegiatan.status_verifikasi === 'revisi'}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium flex items-center gap-2"
                      >
                        {updatingVerifikasi ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>⚠️</span>
                        )}
                        Minta Revisi
                      </button>
                    </div>
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
                  <p className="text-2xl font-bold text-amber-600">{dokumenOutput.filter(d => d.status_review === 'pending').length}</p>
                  <p className="text-sm text-amber-600">Menunggu Review</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{dokumenOutput.filter(d => d.status_review === 'diterima').length}</p>
                  <p className="text-sm text-green-600">Diterima</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{dokumenOutput.filter(d => d.status_review === 'ditolak').length}</p>
                  <p className="text-sm text-red-600">Ditolak</p>
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
                  {dokumenOutput.map((dok) => (
                    <div key={dok.id} className={`border rounded-xl p-5 ${
                      dok.status_review === 'diterima' ? 'bg-green-50 border-green-200' :
                      dok.status_review === 'ditolak' ? 'bg-red-50 border-red-200' :
                      'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start gap-4">
                        {/* File Icon */}
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{getFileIcon(dok.tipe_file)}</span>
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">{dok.nama_file}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              dok.tipe_dokumen === 'final' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {dok.tipe_dokumen === 'final' ? '✅ Final' : '📝 Draft'}
                            </span>
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

                          {/* Current Status */}
                          <div className="mb-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              dok.status_review === 'diterima' 
                                ? 'bg-green-100 text-green-700' 
                                : dok.status_review === 'ditolak'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {dok.status_review === 'diterima' && '✅ Diterima'}
                              {dok.status_review === 'ditolak' && '❌ Ditolak'}
                              {dok.status_review === 'pending' && '⏳ Menunggu Review'}
                            </span>
                            {dok.reviewed_at && (
                              <span className="text-xs text-gray-500 ml-2">
                                {formatDate(dok.reviewed_at)}
                              </span>
                            )}
                          </div>

                          {dok.catatan_reviewer && (
                            <div className={`p-3 rounded-lg text-sm ${
                              dok.status_review === 'ditolak' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              <strong>Catatan:</strong> {dok.catatan_reviewer}
                            </div>
                          )}

                          {/* Review Actions */}
                          {dok.status_review === 'pending' && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                              <p className="text-sm font-medium text-gray-700 mb-3">Review Dokumen:</p>
                              <div className="space-y-3">
                                <textarea
                                  placeholder="Catatan untuk pelaksana (opsional untuk terima, wajib untuk tolak)..."
                                  value={reviewingDokumenId === dok.id ? reviewForm.catatan : ''}
                                  onChange={(e) => {
                                    setReviewingDokumenId(dok.id);
                                    setReviewForm({ ...reviewForm, catatan: e.target.value });
                                  }}
                                  onFocus={() => setReviewingDokumenId(dok.id)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReviewDokumen(dok.id, 'diterima', reviewingDokumenId === dok.id ? reviewForm.catatan : '')}
                                    disabled={reviewingDokumenId === dok.id && reviewForm.status !== ''}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
                                      handleReviewDokumen(dok.id, 'ditolak', catatan);
                                    }}
                                    disabled={reviewingDokumenId === dok.id && reviewForm.status !== ''}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
                  ))}
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Simpan Evaluasi
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Evaluasi List */}
              {evaluasi.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada evaluasi dari pimpinan</p>
                </div>
              ) : (
                evaluasi.map((e) => (
                  <div key={e.id} className={`border rounded-lg p-4 ${
                    e.jenis_evaluasi === 'catatan' ? 'bg-blue-50 border-blue-200' :
                    e.jenis_evaluasi === 'arahan' ? 'bg-orange-50 border-orange-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        e.jenis_evaluasi === 'catatan' ? 'bg-blue-100 text-blue-700' :
                        e.jenis_evaluasi === 'arahan' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {e.jenis_evaluasi === 'catatan' ? '📝 Catatan' :
                         e.jenis_evaluasi === 'arahan' ? '👉 Arahan' :
                         '💡 Rekomendasi'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(e.created_at)}</span>
                    </div>
                    <p className="text-gray-900 mb-2">{e.isi}</p>
                    <p className="text-xs text-gray-600">Oleh: {e.pimpinan_nama}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
