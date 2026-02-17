'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { LuCircleAlert, LuChevronLeft, LuCircleCheck, LuDownload, LuClipboardList, LuPin, LuTarget, LuCalendar, LuWallet, LuRefreshCw, LuClock, LuHourglass, LuChartBar, LuTrendingUp, LuTriangleAlert, LuFilePen, LuWrench, LuPackage, LuBanknote, LuFileText } from 'react-icons/lu';

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
  role_pemberi: string;
  jenis_evaluasi: string;
  isi: string;
  created_at: string;
  pemberi_nama: string;
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
  status_final?: string;
  tanggal_disahkan?: string;
}

interface ValidasiKuantitas {
  id: number;
  kegiatan_id: number;
  jumlah_output: number;
  bukti_path?: string;
  keterangan?: string;
  status: string;
  created_at: string;
}

export default function PPKKegiatanDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [validasiKuantitas, setValidasiKuantitas] = useState<ValidasiKuantitas[]>([]);
  
  const [activeTab, setActiveTab] = useState<'evaluasi-kinerja' | 'progres' | 'anggaran' | 'kendala' | 'dokumen' | 'waktu' | 'evaluasi'>('evaluasi-kinerja');

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
      const res = await fetch(`/api/ppk/kegiatan/${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan);
        setSummary(data.summary);
        setProgres(data.progres || []);
        setRealisasiAnggaran(data.realisasi_anggaran || []);
        setKendala(data.kendala || []);
        setEvaluasi(data.evaluasi || []);
        setDokumenOutput(data.dokumen_output || []);
        setValidasiKuantitas(data.validasi_kuantitas || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kegiatanId]);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
        <Link href="/ppk/kegiatan/monitoring" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
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
            <Link href="/ppk/kegiatan/monitoring" className="hover:text-blue-600">Monitoring Kegiatan</Link>
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

      {/* Informasi Detail Kegiatan */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <LuClipboardList className="w-5 h-5" /> Informasi Detail Kegiatan
          </h2>
        </div>
        <div className="p-6">
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
                <LuPin className="w-4 h-4 text-blue-500" /> Informasi Dasar
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
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  kegiatan.status === 'selesai' ? 'bg-green-100 text-green-700' :
                  kegiatan.status === 'berjalan' ? 'bg-blue-100 text-blue-700' :
                  kegiatan.status === 'tertunda' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {kegiatan.status === 'selesai' ? <><LuCircleCheck className="w-3 h-3" /> Selesai</> :
                   kegiatan.status === 'berjalan' ? <><LuRefreshCw className="w-3 h-3" /> Berjalan</> :
                   kegiatan.status === 'tertunda' ? <><LuClock className="w-3 h-3" /> Tertunda</> :
                   kegiatan.status === 'belum_mulai' ? <><LuHourglass className="w-3 h-3" /> Belum Mulai</> : kegiatan.status}
                </span>
              </div>
            </div>

            {/* Kolom 2: KRO */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <LuTarget className="w-4 h-4 text-green-500" /> Klasifikasi Rincian Output
              </h3>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Kode KRO</p>
                <span className="inline-block mt-1 px-3 py-1 text-sm font-medium rounded bg-blue-50 text-blue-700">{kegiatan.kro_kode}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Nama KRO</p>
                <p className="font-medium text-gray-900">{kegiatan.kro_nama || '-'}</p>
              </div>
            </div>

            {/* Kolom 3: Jadwal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <LuCalendar className="w-4 h-4 text-purple-500" /> Jadwal Pelaksanaan
              </h3>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Mulai</p>
                <p className="font-medium text-gray-900">{formatDate(kegiatan.tanggal_mulai)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal Selesai (Rencana)</p>
                <p className="font-medium text-gray-900">{formatDate(kegiatan.tanggal_selesai)}</p>
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
                <LuWallet className="w-4 h-4 text-yellow-500" /> Target & Anggaran
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
              { id: 'evaluasi-kinerja', label: 'Ringkasan Performa', icon: <LuChartBar className="w-4 h-4" /> },
              { id: 'progres', label: 'Progres', icon: <LuTrendingUp className="w-4 h-4" />, count: progres.length },
              { id: 'anggaran', label: 'Realisasi Anggaran', icon: <LuWallet className="w-4 h-4" />, count: realisasiAnggaran.length },
              { id: 'kendala', label: 'Kendala', icon: <LuTriangleAlert className="w-4 h-4" />, count: kendala.length },
              { id: 'dokumen', label: 'Verifikasi Kualitas Output', icon: <LuCircleCheck className="w-4 h-4" />, count: kegiatan?.jenis_validasi === 'kuantitas' ? validasiKuantitas.length : dokumenOutput.length },
              { id: 'waktu', label: 'Waktu Penyelesaian', icon: <LuClock className="w-4 h-4" /> },
              { id: 'evaluasi', label: 'Evaluasi', icon: <LuFilePen className="w-4 h-4" />, count: evaluasi.length },
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
                    <LuTarget className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Capaian Output</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${summary.capaian_output_persen >= 70 ? 'text-green-600' : summary.capaian_output_persen >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {Math.round(summary.capaian_output_persen)}%
                  </p>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${summary.capaian_output_persen >= 70 ? 'bg-green-500' : summary.capaian_output_persen >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(summary.capaian_output_persen, 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* 2. Serapan Anggaran */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <LuWallet className="w-6 h-6 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Serapan Anggaran</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${summary.realisasi_anggaran_persen >= 70 ? 'text-green-600' : summary.realisasi_anggaran_persen >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {summary.realisasi_anggaran_persen}%
                  </p>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${summary.realisasi_anggaran_persen >= 70 ? 'bg-green-500' : summary.realisasi_anggaran_persen >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(summary.realisasi_anggaran_persen, 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* 3. Ketepatan Waktu */}
                <div className={`rounded-xl p-5 border ${summary.indikator.ketepatan_waktu >= 70 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' : summary.indikator.ketepatan_waktu >= 40 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <LuClock className={`w-6 h-6 ${summary.indikator.ketepatan_waktu >= 70 ? 'text-emerald-600' : summary.indikator.ketepatan_waktu >= 40 ? 'text-yellow-600' : 'text-red-600'}`} />
                    <span className={`text-sm font-medium ${summary.indikator.ketepatan_waktu >= 70 ? 'text-emerald-700' : summary.indikator.ketepatan_waktu >= 40 ? 'text-yellow-700' : 'text-red-700'}`}>Ketepatan Waktu</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${summary.indikator.ketepatan_waktu >= 70 ? 'text-emerald-600' : summary.indikator.ketepatan_waktu >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {Math.round(summary.indikator.ketepatan_waktu)}%
                  </p>
                </div>

                {/* 4. Kualitas Output */}
                <div className={`rounded-xl p-5 border ${summary.indikator.kualitas_output >= 80 ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <LuCircleCheck className={`w-6 h-6 ${summary.indikator.kualitas_output >= 80 ? 'text-purple-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium text-purple-700">Kualitas Output</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${summary.indikator.kualitas_output >= 80 ? 'text-purple-600' : 'text-gray-500'}`}>
                    {Math.round(summary.indikator.kualitas_output)}%
                  </p>
                </div>

                {/* 5. Penyelesaian Kendala */}
                <div className={`rounded-xl p-5 border ${summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <LuWrench className={`w-6 h-6 ${summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className="text-sm font-medium">Kendala</span>
                  </div>
                  <p className={`text-4xl font-bold mb-2 ${summary.total_kendala === 0 || summary.kendala_resolved === summary.total_kendala ? 'text-green-600' : 'text-orange-600'}`}>
                    {summary.kendala_resolved}/{summary.total_kendala}
                  </p>
                </div>

                {/* 6. Skor Kinerja Total */}
                <div className={`rounded-xl p-5 border ${summary.skor_kinerja >= 80 ? 'bg-gradient-to-br from-green-100 to-emerald-200 border-green-300' : summary.skor_kinerja >= 60 ? 'bg-gradient-to-br from-yellow-100 to-amber-200 border-yellow-300' : 'bg-gradient-to-br from-red-100 to-rose-200 border-red-300'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <LuChartBar className={`w-6 h-6 ${getSkorColor(summary.skor_kinerja)}`} />
                    <span className={`text-sm font-medium ${getSkorColor(summary.skor_kinerja)}`}>Skor Kinerja</span>
                  </div>
                  <p className={`text-5xl font-bold mb-2 ${getSkorColor(summary.skor_kinerja)}`}>
                    {summary.skor_kinerja}
                  </p>
                  <span className={`inline-block w-full text-center px-3 py-1.5 rounded-full text-xs font-bold ${summary.status_kinerja === 'Sukses' ? 'bg-green-500 text-white' : summary.status_kinerja === 'Perlu Perhatian' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                    {summary.status_kinerja}
                  </span>
                </div>
              </div>

              {/* Analisis Deviasi */}
              {summary.deviasi && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-5 border ${summary.deviasi.output >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <LuPackage className="w-5 h-5" />
                      <span className="font-medium text-gray-900">Deviasi Output</span>
                    </div>
                    <p className={`text-3xl font-bold ${summary.deviasi.output >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.deviasi.output >= 0 ? '+' : ''}{summary.deviasi.output} {kegiatan.satuan_output}
                    </p>
                  </div>
                  
                  <div className={`rounded-xl p-5 border ${summary.deviasi.waktu >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <LuCalendar className="w-5 h-5" />
                      <span className="font-medium text-gray-900">Deviasi Waktu</span>
                    </div>
                    <p className={`text-3xl font-bold ${summary.deviasi.waktu >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.deviasi.waktu >= 0 ? `${summary.deviasi.waktu} hari tersisa` : `Terlambat ${Math.abs(summary.deviasi.waktu)} hari`}
                    </p>
                  </div>
                  
                  <div className={`rounded-xl p-5 border ${summary.deviasi.anggaran <= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <LuBanknote className="w-5 h-5" />
                      <span className="font-medium text-gray-900">Deviasi Anggaran</span>
                    </div>
                    <p className={`text-3xl font-bold ${summary.deviasi.anggaran <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.deviasi.anggaran >= 0 ? '+' : ''}{summary.deviasi.anggaran.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Progres */}
          {activeTab === 'progres' && (
            <div>
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
                      {kegiatan?.tanggal_realisasi_selesai ? formatDate(kegiatan.tanggal_realisasi_selesai) : <span className="text-gray-400">Belum selesai</span>}
                    </p>
                  </div>
                </div>
              </div>

              {progres.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada riwayat progres</p>
                </div>
              ) : (
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
                  <div key={k.id} className={`border rounded-lg p-4 ${k.status === 'selesai' || k.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${k.tingkat_prioritas === 'tinggi' ? 'bg-red-100 text-red-700' : k.tingkat_prioritas === 'sedang' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        Prioritas {k.tingkat_prioritas}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${k.status === 'selesai' || k.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {k.status === 'selesai' || k.status === 'resolved' ? '✓ Selesai' : 'Menunggu'}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{k.deskripsi}</p>
                    <p className="text-xs text-gray-500">Dilaporkan: {formatDate(k.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Dokumen */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              {dokumenOutput.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada dokumen output</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {dokumenOutput.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <LuFileText className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.nama_file}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.ukuran_file)} • {doc.tipe_dokumen === 'final' ? 'Final' : 'Draft'} • {formatDate(doc.uploaded_at)}
                          </p>
                          {doc.status_final === 'disahkan' && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700"><LuCircleCheck className="w-3 h-3" /> Disahkan</span>
                          )}
                        </div>
                      </div>
                      <a href={doc.path_file} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <LuDownload className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Waktu Penyelesaian */}
          {activeTab === 'waktu' && kegiatan && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <LuClock className="w-5 h-5 text-blue-600" /> Analisis Waktu Penyelesaian
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
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><LuCalendar className="w-4 h-4" /></span>
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
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600"><LuCircleCheck className="w-4 h-4" /></span>
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
                
                let status: 'tepat' | 'lebih_cepat' | 'terlambat' | 'berjalan';
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
                          {status === 'tepat' && <LuCircleCheck className="w-8 h-8" />}
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

          {/* Tab: Evaluasi */}
          {activeTab === 'evaluasi' && (
            <div className="space-y-4">
              {evaluasi.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Belum ada evaluasi</p>
                </div>
              ) : (
                evaluasi.map((e) => (
                  <div key={e.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${e.jenis_evaluasi === 'arahan' ? 'bg-blue-100 text-blue-700' : e.jenis_evaluasi === 'rekomendasi' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {e.jenis_evaluasi}
                        </span>
                        <span className="text-sm text-gray-600">oleh {e.pemberi_nama}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(e.created_at)}</span>
                    </div>
                    <p className="text-gray-900">{e.isi}</p>
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
