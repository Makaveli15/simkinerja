'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface KegiatanDetail {
  id: number;
  nama: string;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  target_output: number;
  satuan_output: string;
  anggaran_pagu: number;
  status: string;
  tim_id: number;
  tim_nama: string;
  created_by: number;
  created_by_nama: string;
  kro_id?: number;
  kro_kode?: string;
  kro_nama?: string;
  mitra_id?: number;
  mitra_nama?: string;
}

interface Progres {
  id: number;
  tanggal_update: string;
  capaian_output: number;
  ketepatan_waktu: number;
  kualitas_output: number;
  keterangan: string;
}

interface RealisasiFisik {
  id: number;
  tanggal_realisasi: string;
  persentase: number;
  keterangan: string;
}

interface RealisasiAnggaran {
  id: number;
  tanggal_realisasi: string;
  jumlah: number;
  keterangan: string;
}

interface Kendala {
  id: number;
  tanggal_kendala?: string;
  created_at?: string;
  deskripsi: string;
  status: string;
  tindak_lanjut?: TindakLanjut[];
}

interface TindakLanjut {
  id: number;
  kendala_id: number;
  tanggal_tindak_lanjut: string;
  deskripsi: string;
  status: string;
}

interface Summary {
  realisasi_fisik_persen: number;
  realisasi_anggaran_nominal: number;
  realisasi_anggaran_persen: string;
  total_kendala: number;
  kendala_resolved: number;
  kendala_pending: number;
  penyelesaian_kendala_persen: string;
  skor_kinerja: number;
  status_kinerja: string;
  indikator: {
    capaian_output: number;
    ketepatan_waktu: number;
    serapan_anggaran: number;
    kualitas_output: number;
    penyelesaian_kendala: number;
  };
}

interface KRO {
  id: number;
  kode: string;
  nama: string;
}

interface Mitra {
  id: number;
  nama: string;
  posisi: string;
  alamat: string;
}

type TabType = 'ringkasan' | 'progres' | 'realisasi-fisik' | 'realisasi-anggaran' | 'kendala';

export default function DetailKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kegiatanId = resolvedParams.id;
  const router = useRouter();

  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [progres, setProgres] = useState<Progres[]>([]);
  const [realisasiFisik, setRealisasiFisik] = useState<RealisasiFisik[]>([]);
  const [realisasiAnggaran, setRealisasiAnggaran] = useState<RealisasiAnggaran[]>([]);
  const [kendala, setKendala] = useState<Kendala[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [kroList, setKroList] = useState<KRO[]>([]);
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    nama: '',
    deskripsi: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    target_output: '',
    satuan_output: '',
    anggaran_pagu: '',
    status: '',
    kro_id: '',
    mitra_id: ''
  });

  useEffect(() => {
    fetchKegiatan();
    fetchKROList();
    fetchMitraList();
  }, [kegiatanId]);

  const fetchKegiatan = async () => {
    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan);
        setProgres(data.progres || []);
        setRealisasiFisik(data.realisasi_fisik || []);
        setRealisasiAnggaran(data.realisasi_anggaran || []);
        setKendala(data.kendala || []);
        setSummary(data.summary);
        
        if (data.kegiatan) {
          const k = data.kegiatan;
          setEditForm({
            nama: k.nama || '',
            deskripsi: k.deskripsi || '',
            tanggal_mulai: k.tanggal_mulai ? k.tanggal_mulai.split('T')[0] : '',
            tanggal_selesai: k.tanggal_selesai ? k.tanggal_selesai.split('T')[0] : '',
            target_output: k.target_output?.toString() || '',
            satuan_output: k.satuan_output || 'dokumen',
            anggaran_pagu: k.anggaran_pagu?.toString() || '',
            status: k.status || 'berjalan',
            kro_id: k.kro_id?.toString() || '',
            mitra_id: k.mitra_id?.toString() || ''
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKROList = async () => {
    try {
      const res = await fetch('/api/pelaksana/kro');
      if (res.ok) setKroList(await res.json());
    } catch (error) {
      console.error('Error fetching KRO:', error);
    }
  };

  const fetchMitraList = async () => {
    try {
      const res = await fetch('/api/pelaksana/mitra');
      if (res.ok) setMitraList(await res.json());
    } catch (error) {
      console.error('Error fetching Mitra:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validasi
    if (!editForm.nama.trim()) {
      setError('Nama kegiatan harus diisi');
      setSubmitting(false);
      return;
    }
    if (!editForm.tanggal_mulai) {
      setError('Tanggal mulai harus diisi');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: editForm.nama.trim(),
          deskripsi: editForm.deskripsi?.trim() || null,
          tanggal_mulai: editForm.tanggal_mulai,
          tanggal_selesai: editForm.tanggal_selesai || null,
          target_output: editForm.target_output ? parseFloat(editForm.target_output) : null,
          satuan_output: editForm.satuan_output || 'dokumen',
          anggaran_pagu: editForm.anggaran_pagu ? parseFloat(editForm.anggaran_pagu.replace(/[^\d]/g, '')) : 0,
          status: editForm.status,
          kro_id: editForm.kro_id ? parseInt(editForm.kro_id) : null,
          mitra_id: editForm.mitra_id ? parseInt(editForm.mitra_id) : null
        })
      });

      if (res.ok) {
        setSuccess('Data kegiatan berhasil diperbarui');
        setTimeout(() => {
          setShowEditModal(false);
          setSuccess('');
          fetchKegiatan();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency input
  const formatCurrencyInput = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    return num ? new Intl.NumberFormat('id-ID').format(parseInt(num)) : '';
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini? Semua data terkait akan ikut terhapus.')) return;
    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, { method: 'DELETE' });
      if (res.ok) router.push('/pelaksana/kegiatan');
      else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const formatDate = (dateStr: string) => !dateStr ? '-' : new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return 'bg-green-100 text-green-800';
      case 'berjalan': return 'bg-blue-100 text-blue-800';
      case 'tertunda': return 'bg-red-100 text-red-800';
      case 'bermasalah': return 'bg-yellow-100 text-yellow-800';
      case 'belum_mulai': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'berjalan': return 'Berjalan';
      case 'tertunda': return 'Tertunda';
      case 'belum_mulai': return 'Belum Mulai';
      default: return status;
    }
  };
  const getScoreColor = (score: number) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const getStatusKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'bg-green-100 text-green-800';
      case 'Perlu Perhatian': return 'bg-yellow-100 text-yellow-800';
      case 'Bermasalah': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!kegiatan) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Kegiatan tidak ditemukan</p>
        <Link href="/pelaksana/kegiatan" className="text-blue-600 hover:underline">Kembali</Link>
      </div>
    </div>
  );

  const tabs = [
    { id: 'ringkasan' as TabType, label: 'Ringkasan' },
    { id: 'progres' as TabType, label: `Progres (${progres.length})` },
    { id: 'realisasi-fisik' as TabType, label: `Realisasi Fisik (${realisasiFisik.length})` },
    { id: 'realisasi-anggaran' as TabType, label: `Realisasi Anggaran (${realisasiAnggaran.length})` },
    { id: 'kendala' as TabType, label: `Kendala (${kendala.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/pelaksana/kegiatan" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Kegiatan
          </Link>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{kegiatan.nama}</h1>
                {kegiatan.deskripsi && <p className="text-gray-600 mt-2">{kegiatan.deskripsi}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(kegiatan.status)}`}>
                  {getStatusLabel(kegiatan.status)}
                </span>
                
                <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Tim:</span><span className="ml-2 font-medium">{kegiatan.tim_nama}</span></div>
              <div><span className="text-gray-500">Mulai:</span><span className="ml-2 font-medium">{formatDate(kegiatan.tanggal_mulai)}</span></div>
              <div><span className="text-gray-500">Selesai:</span><span className="ml-2 font-medium">{formatDate(kegiatan.tanggal_selesai)}</span></div>
              <div><span className="text-gray-500">Target Anggaran:</span><span className="ml-2 font-medium">{formatCurrency(kegiatan.anggaran_pagu)}</span></div>
              {kegiatan.target_output && <div><span className="text-gray-500">Target Output:</span><span className="ml-2 font-medium">{kegiatan.target_output} {kegiatan.satuan_output}</span></div>}
              {kegiatan.mitra_nama && <div><span className="text-gray-500">Mitra:</span><span className="ml-2 font-medium">{kegiatan.mitra_nama}</span></div>}
            </div>

            {/* Tabel KRO */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Klasifikasi Rincian Output (KRO)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Kode KRO</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama KRO</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kegiatan.kro_kode ? (
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-sm font-medium">
                            {kegiatan.kro_kode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{kegiatan.kro_nama}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Terkait
                          </span>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center">
                          <div className="flex flex-col items-center text-gray-500">
                            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm">Belum ada KRO yang terkait</p>
                            <p className="text-xs text-gray-400 mt-1">Klik tombol Edit untuk menambahkan KRO</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b overflow-x-auto">
            <div className="flex">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'ringkasan' && summary && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div>
                      <p className="text-blue-600 font-medium">Realisasi Fisik</p>
                      <p className="text-2xl font-bold text-blue-700">{(Number(summary.realisasi_fisik_persen) || 0).toFixed(1)}%</p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{(Number(summary.realisasi_fisik_persen) || 0).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div>
                      <p className="text-green-600 font-medium">Realisasi Anggaran</p>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(Number(summary.realisasi_anggaran_nominal) || 0)}</p>
                      <p className="text-sm text-green-600">{summary.realisasi_anggaran_persen}% dari target</p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">{summary.realisasi_anggaran_persen}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div>
                      <p className="text-purple-600 font-medium">Status Kinerja</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusKinerjaColor(summary.status_kinerja)}`}>
                        {summary.status_kinerja}
                      </span>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(Number(summary.skor_kinerja) || 0)}`}>{summary.skor_kinerja}</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-orange-600 font-medium">Kendala</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-2xl font-bold text-orange-700">{summary.kendala_resolved}/{summary.total_kendala}</span>
                      <span className="text-sm text-orange-600">terselesaikan</span>
                    </div>
                    <p className="text-sm text-orange-600">dari {summary.total_kendala} kendala belum diselesaikan</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Breakdown Indikator Kinerja</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Capaian Output (30%)', value: Number(summary.indikator.capaian_output) || 0, color: 'bg-blue-500' },
                      { label: 'Ketepatan Waktu (20%)', value: Number(summary.indikator.ketepatan_waktu) || 0, color: 'bg-green-500' },
                      { label: 'Serapan Anggaran (20%)', value: Number(summary.indikator.serapan_anggaran) || 0, color: 'bg-yellow-500' },
                      { label: 'Kualitas Output (20%)', value: Number(summary.indikator.kualitas_output) || 0, color: 'bg-purple-500' },
                      { label: 'Penyelesaian Kendala (10%)', value: Number(summary.indikator.penyelesaian_kendala) || 0, color: 'bg-red-500' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{item.value.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${Math.min(item.value, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total Skor Kinerja</span>
                      <span className={`font-bold text-2xl ${getScoreColor(Number(summary.skor_kinerja) || 0)}`}>{summary.skor_kinerja}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progres' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Riwayat Progres</h3>
                {progres.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada data progres</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Capaian Output</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ketepatan Waktu</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Kualitas Output</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {progres.map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">{formatDate(p.tanggal_update)}</td>
                            <td className="px-4 py-3 font-medium">{p.capaian_output}%</td>
                            <td className="px-4 py-3 font-medium">{p.ketepatan_waktu}%</td>
                            <td className="px-4 py-3 font-medium">{p.kualitas_output}%</td>
                            <td className="px-4 py-3">{p.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'realisasi-fisik' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Realisasi Fisik</h3>
                {realisasiFisik.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada data realisasi fisik</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Persentase</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {realisasiFisik.map(r => (
                          <tr key={r.id}>
                            <td className="px-4 py-3">{formatDate(r.tanggal_realisasi)}</td>
                            <td className="px-4 py-3 font-medium">{r.persentase}%</td>
                            <td className="px-4 py-3">{r.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'realisasi-anggaran' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Realisasi Anggaran</h3>
                {realisasiAnggaran.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada data realisasi anggaran</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Jumlah</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {realisasiAnggaran.map(r => (
                          <tr key={r.id}>
                            <td className="px-4 py-3">{formatDate(r.tanggal_realisasi)}</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(r.jumlah)}</td>
                            <td className="px-4 py-3">{r.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {realisasiAnggaran.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Realisasi:</span>
                      <span className="font-bold text-lg">{formatCurrency(summary?.realisasi_anggaran_nominal || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kendala' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Daftar Kendala</h3>
                {kendala.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada kendala tercatat</p> : (
                  <div className="space-y-4">
                    {kendala.map(k => (
                      <div key={k.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm text-gray-500">{formatDate(k.tanggal_kendala || k.created_at || '')}</p>
                            <p className="text-gray-900 mt-1 font-medium">{k.deskripsi}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${k.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {k.status === 'resolved' ? 'Selesai' : 'Terbuka'}
                          </span>
                        </div>
                        {k.tindak_lanjut && k.tindak_lanjut.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Tindak Lanjut:</p>
                            <div className="space-y-2 pl-4">
                              {k.tindak_lanjut.map(tl => (
                                <div key={tl.id} className="bg-gray-50 p-3 rounded text-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-gray-500 text-xs">{formatDate(tl.tanggal_tindak_lanjut)}</p>
                                      <p className="text-gray-800">{tl.deskripsi}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs ${tl.status === 'done' ? 'bg-green-100 text-green-800' : tl.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                      {tl.status === 'done' ? 'Selesai' : tl.status === 'in_progress' ? 'Proses' : 'Pending'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Edit Kegiatan */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Edit Kegiatan</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowEditModal(false); setError(''); setSuccess(''); }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
                  <div className="p-1 bg-green-100 rounded-full">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">{success}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                  <div className="p-1 bg-red-100 rounded-full">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-5">
                {/* Nama Kegiatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={editForm.nama} 
                    onChange={e => setEditForm({...editForm, nama: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    placeholder="Masukkan nama kegiatan"
                    required 
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
                  <textarea 
                    value={editForm.deskripsi} 
                    onChange={e => setEditForm({...editForm, deskripsi: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none" 
                    rows={3}
                    placeholder="Deskripsi kegiatan (opsional)"
                  />
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      value={editForm.tanggal_mulai} 
                      onChange={e => setEditForm({...editForm, tanggal_mulai: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Selesai</label>
                    <input 
                      type="date" 
                      value={editForm.tanggal_selesai} 
                      onChange={e => setEditForm({...editForm, tanggal_selesai: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      min={editForm.tanggal_mulai} 
                    />
                  </div>
                </div>

                {/* Target Output & Satuan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Output</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={editForm.target_output} 
                      onChange={e => setEditForm({...editForm, target_output: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Satuan Output</label>
                    <select 
                      value={editForm.satuan_output} 
                      onChange={e => setEditForm({...editForm, satuan_output: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="dokumen">Dokumen</option>
                      <option value="laporan">Laporan</option>
                      <option value="kegiatan">Kegiatan</option>
                      <option value="orang">Orang</option>
                      <option value="unit">Unit</option>
                      <option value="paket">Paket</option>
                      <option value="kali">Kali</option>
                      <option value="buah">Buah</option>
                      <option value="responden">Responden</option>
                      <option value="kuesioner">Kuesioner</option>
                    </select>
                  </div>
                </div>

                {/* Target Anggaran */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Anggaran</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input 
                      type="text" 
                      value={formatCurrencyInput(editForm.anggaran_pagu)} 
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setEditForm({...editForm, anggaran_pagu: value});
                      }} 
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      placeholder="0"
                    />
                  </div>
                  {editForm.anggaran_pagu && Number(editForm.anggaran_pagu) > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Terbilang: Rp {Number(editForm.anggaran_pagu).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                {/* KRO */}
                {kroList.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      KRO <span className="text-xs text-gray-400 font-normal">(Klasifikasi Rincian Output)</span>
                    </label>
                    <select 
                      value={editForm.kro_id} 
                      onChange={e => setEditForm({...editForm, kro_id: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="">-- Tidak ada KRO --</option>
                      {kroList.map(k => (
                        <option key={k.id} value={k.id}>[{k.kode}] {k.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mitra */}
                {mitraList.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mitra <span className="text-xs text-gray-400 font-normal">(Penanggung Jawab)</span>
                    </label>
                    <select 
                      value={editForm.mitra_id} 
                      onChange={e => setEditForm({...editForm, mitra_id: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="">-- Tanpa Mitra --</option>
                      {mitraList.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nama} {m.posisi && `- ${m.posisi}`} {m.alamat && `(${m.alamat})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => { setShowEditModal(false); setError(''); setSuccess(''); }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
