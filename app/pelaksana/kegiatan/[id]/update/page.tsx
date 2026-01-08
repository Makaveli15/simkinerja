'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

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
  tim_nama: string;
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
  tingkat_prioritas: string;
  status: string;
  tindak_lanjut?: TindakLanjut[];
}

interface TindakLanjut {
  id: number;
  kendala_id: number;
  tanggal_tindak_lanjut?: string;
  created_at?: string;
  deskripsi: string;
  batas_waktu?: string;
  status: string;
}

type TabType = 'progres' | 'realisasi-fisik' | 'realisasi-anggaran' | 'kendala';

export default function UpdateKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kegiatanId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('progres');
  
  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [progres, setProgres] = useState<Progres[]>([]);
  const [realisasiFisik, setRealisasiFisik] = useState<RealisasiFisik[]>([]);
  const [realisasiAnggaran, setRealisasiAnggaran] = useState<RealisasiAnggaran[]>([]);
  const [kendala, setKendala] = useState<Kendala[]>([]);

  // Form states
  const today = new Date().toISOString().split('T')[0];
  const [progresForm, setProgresForm] = useState({
    tanggal: today,
    capaian_output: '',
    ketepatan_waktu: '',
    kualitas_output: '',
    keterangan: ''
  });
  const [fisikForm, setFisikForm] = useState({
    tanggal: today,
    persentase: '',
    keterangan: ''
  });
  const [anggaranForm, setAnggaranForm] = useState({
    tanggal: today,
    jumlah: '',
    keterangan: ''
  });
  const [kendalaForm, setKendalaForm] = useState({
    deskripsi: '',
    tingkat_prioritas: 'sedang'
  });
  const [tindakLanjutForm, setTindakLanjutForm] = useState({
    kendala_id: '',
    deskripsi: '',
    batas_waktu: '',
    status: 'pending'
  });

  // Modal states
  const [showTindakLanjutModal, setShowTindakLanjutModal] = useState(false);
  const [selectedKendalaForTL, setSelectedKendalaForTL] = useState<Kendala | null>(null);

  useEffect(() => {
    fetchData();
  }, [kegiatanId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`);
      if (!res.ok) {
        if (res.status === 404) setError('Kegiatan tidak ditemukan');
        else if (res.status === 403) setError('Anda tidak memiliki akses');
        else setError('Gagal memuat data');
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setKegiatan(data.kegiatan);
      setCurrentStatus(data.kegiatan?.status || '');
      setProgres(data.progres || []);
      setRealisasiFisik(data.realisasi_fisik || []);
      setRealisasiAnggaran(data.realisasi_anggaran || []);
      setKendala(data.kendala || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setUpdatingStatus(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: kegiatan?.nama,
          tanggal_mulai: kegiatan?.tanggal_mulai,
          status: newStatus
        })
      });

      if (res.ok) {
        setCurrentStatus(newStatus);
        setKegiatan(prev => prev ? { ...prev, status: newStatus } : null);
        setSuccess('Status berhasil diperbarui');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat mengupdate status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitProgres = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/pelaksana/progres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(kegiatanId),
          capaian_output: parseFloat(progresForm.capaian_output) || 0,
          ketepatan_waktu: parseFloat(progresForm.ketepatan_waktu) || 0,
          kualitas_output: parseFloat(progresForm.kualitas_output) || 0,
          keterangan: progresForm.keterangan
        })
      });

      if (res.ok) {
        setSuccess('Progres berhasil ditambahkan');
        setProgresForm({ tanggal: today, capaian_output: '', ketepatan_waktu: '', kualitas_output: '', keterangan: '' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan progres');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFisik = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/pelaksana/realisasi-fisik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(kegiatanId),
          persentase: parseFloat(fisikForm.persentase) || 0,
          keterangan: fisikForm.keterangan
        })
      });

      if (res.ok) {
        setSuccess('Realisasi fisik berhasil ditambahkan');
        setFisikForm({ tanggal: today, persentase: '', keterangan: '' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan realisasi fisik');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/pelaksana/realisasi-anggaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(kegiatanId),
          jumlah: parseFloat(anggaranForm.jumlah.replace(/[^\d]/g, '')) || 0,
          keterangan: anggaranForm.keterangan
        })
      });

      if (res.ok) {
        setSuccess('Realisasi anggaran berhasil ditambahkan');
        setAnggaranForm({ tanggal: today, jumlah: '', keterangan: '' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan realisasi anggaran');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitKendala = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (!kendalaForm.deskripsi.trim()) {
      setError('Deskripsi kendala harus diisi');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/pelaksana/kendala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(kegiatanId),
          deskripsi: kendalaForm.deskripsi,
          tingkat_prioritas: kendalaForm.tingkat_prioritas
        })
      });

      if (res.ok) {
        setSuccess('Kendala berhasil ditambahkan');
        setKendalaForm({ deskripsi: '', tingkat_prioritas: 'sedang' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan kendala');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTindakLanjut = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (!tindakLanjutForm.deskripsi.trim()) {
      setError('Deskripsi tindak lanjut harus diisi');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/pelaksana/tindak-lanjut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kendala_id: parseInt(tindakLanjutForm.kendala_id),
          deskripsi: tindakLanjutForm.deskripsi,
          batas_waktu: tindakLanjutForm.batas_waktu || null,
          update_status_kendala: tindakLanjutForm.status === 'done' ? 'resolved' : null
        })
      });

      if (res.ok) {
        setSuccess('Tindak lanjut berhasil ditambahkan');
        setTindakLanjutForm({ kendala_id: '', deskripsi: '', batas_waktu: '', status: 'pending' });
        setShowTindakLanjutModal(false);
        setSelectedKendalaForTL(null);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan tindak lanjut');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateKendalaStatus = async (kendalaId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/pelaksana/kendala/${kendalaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setSuccess('Status kendala berhasil diupdate');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mengupdate status');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    }
  };

  const openTindakLanjutModal = (k: Kendala) => {
    setSelectedKendalaForTL(k);
    setTindakLanjutForm({
      kendala_id: k.id.toString(),
      deskripsi: '',
      batas_waktu: '',
      status: 'pending'
    });
    setShowTindakLanjutModal(true);
    setError('');
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const formatDate = (dateStr?: string) => !dateStr ? '-' : new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatCurrencyInput = (value: string) => {
    const num = parseFloat(value.replace(/[^\d]/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'tinggi': return 'bg-red-100 text-red-700';
      case 'sedang': return 'bg-yellow-100 text-yellow-700';
      case 'rendah': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'open': return 'bg-red-100 text-red-700';
      case 'done': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Selesai';
      case 'in_progress': return 'Proses';
      case 'open': return 'Terbuka';
      case 'done': return 'Selesai';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const isOverdue = (batasWaktu?: string) => {
    if (!batasWaktu) return false;
    return new Date(batasWaktu) < new Date();
  };

  // Calculate totals
  const totalRealisasiAnggaran = realisasiAnggaran.reduce((sum, r) => sum + parseFloat(String(r.jumlah || 0)), 0);
  const latestFisik = Number(realisasiFisik[0]?.persentase) || 0;
  const paguAnggaran = Number(kegiatan?.anggaran_pagu) || 0;
  const persenAnggaran = paguAnggaran > 0 ? (totalRealisasiAnggaran / paguAnggaran) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!kegiatan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error || 'Kegiatan tidak ditemukan'}</p>
          <Link href="/pelaksana/kegiatan" className="text-blue-600 hover:underline">Kembali ke Daftar Kegiatan</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'progres' as TabType, label: 'Progres', icon: '📊', count: progres.length },
    { id: 'realisasi-fisik' as TabType, label: 'Realisasi Fisik', icon: '🏗️', count: realisasiFisik.length },
    { id: 'realisasi-anggaran' as TabType, label: 'Realisasi Anggaran', icon: '💰', count: realisasiAnggaran.length },
    { id: 'kendala' as TabType, label: 'Kendala & Tindak Lanjut', icon: '⚠️', count: kendala.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/pelaksana/kegiatan/${kegiatanId}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Detail Kegiatan
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Update Progres Kegiatan</h1>
            <p className="text-gray-600 mb-4">{kegiatan.nama}</p>
            
            {/* Status Update Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Status Kegiatan</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'belum_mulai', label: 'Belum Mulai', color: 'gray', icon: '⏳' },
                  { value: 'berjalan', label: 'Berjalan', color: 'blue', icon: '🔄' },
                  { value: 'tertunda', label: 'Tertunda', color: 'yellow', icon: '⚠️' },
                  { value: 'selesai', label: 'Selesai', color: 'green', icon: '✅' }
                ].map(status => (
                  <button
                    key={status.value}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(status.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                      currentStatus === status.value
                        ? status.color === 'gray'
                          ? 'border-gray-500 bg-gray-100 text-gray-700'
                          : status.color === 'blue' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : status.color === 'yellow'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>{status.icon}</span>
                    {status.label}
                    {currentStatus === status.value && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
                {updatingStatus && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Menyimpan...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Realisasi Fisik</p>
                <p className="text-2xl font-bold text-blue-700">{latestFisik.toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Realisasi Anggaran</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(totalRealisasiAnggaran)}</p>
                <p className="text-xs text-green-600">{persenAnggaran.toFixed(1)}% dari target</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Target Anggaran</p>
                <p className="text-lg font-bold text-purple-700">{formatCurrency(paguAnggaran)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Kendala Aktif</p>
                <p className="text-2xl font-bold text-orange-700">{kendala.filter(k => k.status !== 'resolved').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Tab: Progres */}
            {activeTab === 'progres' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Progres Baru</h3>
                  <form onSubmit={handleSubmitProgres} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capaian Output (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={progresForm.capaian_output}
                          onChange={(e) => setProgresForm({ ...progresForm, capaian_output: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ketepatan Waktu (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={progresForm.ketepatan_waktu}
                          onChange={(e) => setProgresForm({ ...progresForm, ketepatan_waktu: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kualitas Output (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={progresForm.kualitas_output}
                          onChange={(e) => setProgresForm({ ...progresForm, kualitas_output: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                      <textarea
                        value={progresForm.keterangan}
                        onChange={(e) => setProgresForm({ ...progresForm, keterangan: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Catatan tentang progres..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Menyimpan...' : 'Simpan Progres'}
                    </button>
                  </form>
                </div>

                {/* History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Progres</h3>
                  {progres.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada data progres</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {progres.map((p) => (
                        <div key={p.id} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-500">{formatDate(p.tanggal_update)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Capaian:</span>
                              <span className="font-medium ml-1">{p.capaian_output}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Waktu:</span>
                              <span className="font-medium ml-1">{p.ketepatan_waktu}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Kualitas:</span>
                              <span className="font-medium ml-1">{p.kualitas_output}%</span>
                            </div>
                          </div>
                          {p.keterangan && <p className="text-sm text-gray-600 mt-2">{p.keterangan}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Realisasi Fisik */}
            {activeTab === 'realisasi-fisik' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Realisasi Fisik</h3>
                  <form onSubmit={handleSubmitFisik} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Persentase Realisasi (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={fisikForm.persentase}
                        onChange={(e) => setFisikForm({ ...fisikForm, persentase: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Persentase penyelesaian pekerjaan fisik</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                      <textarea
                        value={fisikForm.keterangan}
                        onChange={(e) => setFisikForm({ ...fisikForm, keterangan: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Deskripsi pekerjaan yang sudah diselesaikan..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Menyimpan...' : 'Simpan Realisasi Fisik'}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Realisasi Fisik</h3>
                  {realisasiFisik.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada data realisasi fisik</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {realisasiFisik.map((r) => (
                        <div key={r.id} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">{formatDate(r.tanggal_realisasi)}</span>
                            <span className="text-lg font-bold text-blue-600">{r.persentase}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(r.persentase, 100)}%` }}></div>
                          </div>
                          {r.keterangan && <p className="text-sm text-gray-600">{r.keterangan}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Realisasi Anggaran */}
            {activeTab === 'realisasi-anggaran' && (
              <div className="space-y-6">
                {/* Ringkasan Serapan Anggaran */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Serapan Anggaran</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Target Anggaran</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(paguAnggaran)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Total Realisasi</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(totalRealisasiAnggaran)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Sisa Anggaran</p>
                      <p className={`text-xl font-bold ${paguAnggaran - totalRealisasiAnggaran >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(paguAnggaran - totalRealisasiAnggaran)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Persentase Serapan</span>
                      <span className={`font-bold ${persenAnggaran > 100 ? 'text-red-600' : 'text-green-600'}`}>
                        {persenAnggaran.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all ${persenAnggaran > 100 ? 'bg-red-500' : persenAnggaran > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(persenAnggaran, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {persenAnggaran > 100 
                        ? '⚠️ Anggaran melebihi target!' 
                        : persenAnggaran > 80 
                          ? '⚠️ Serapan mendekati batas target'
                          : '✓ Serapan dalam batas normal'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Realisasi Anggaran</h3>
                    <form onSubmit={handleSubmitAnggaran} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Realisasi (Rp)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                          <input
                            type="text"
                            value={formatCurrencyInput(anggaranForm.jumlah)}
                            onChange={(e) => setAnggaranForm({ ...anggaranForm, jumlah: e.target.value.replace(/[^\d]/g, '') })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sisa: {formatCurrency(paguAnggaran - totalRealisasiAnggaran)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                        <textarea
                          value={anggaranForm.keterangan}
                          onChange={(e) => setAnggaranForm({ ...anggaranForm, keterangan: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Keterangan penggunaan anggaran..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                      >
                        {submitting ? 'Menyimpan...' : 'Simpan Realisasi Anggaran'}
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Realisasi Anggaran</h3>
                    {realisasiAnggaran.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Belum ada data realisasi anggaran</p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {realisasiAnggaran.map((r, index) => (
                          <div key={r.id} className="bg-white border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm text-gray-500">{formatDate(r.tanggal_realisasi)}</span>
                                <span className="text-xs text-gray-400 ml-2">#{realisasiAnggaran.length - index}</span>
                              </div>
                              <span className="text-lg font-bold text-green-600">{formatCurrency(r.jumlah)}</span>
                            </div>
                            {r.keterangan && <p className="text-sm text-gray-600">{r.keterangan}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Kendala & Tindak Lanjut */}
            {activeTab === 'kendala' && (
              <div className="space-y-6">
                {/* Form Kendala */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Kendala Baru</h3>
                  <form onSubmit={handleSubmitKendala} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Kendala</label>
                        <textarea
                          value={kendalaForm.deskripsi}
                          onChange={(e) => setKendalaForm({ ...kendalaForm, deskripsi: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Jelaskan kendala yang dihadapi..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                        <select
                          value={kendalaForm.tingkat_prioritas}
                          onChange={(e) => setKendalaForm({ ...kendalaForm, tingkat_prioritas: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="rendah">Rendah</option>
                          <option value="sedang">Sedang</option>
                          <option value="tinggi">Tinggi</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                    >
                      {submitting ? 'Menyimpan...' : 'Tambah Kendala'}
                    </button>
                  </form>
                </div>

                {/* Daftar Kendala */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Kendala & Tindak Lanjut</h3>
                  {kendala.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 bg-white rounded-lg border">Belum ada kendala tercatat</p>
                  ) : (
                    <div className="space-y-4">
                      {kendala.map((k) => (
                        <div key={k.id} className="bg-white border rounded-lg overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(k.tingkat_prioritas)}`}>
                                    {k.tingkat_prioritas?.toUpperCase() || 'SEDANG'}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(k.status)}`}>
                                    {getStatusLabel(k.status)}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatDate(k.tanggal_kendala || k.created_at)}</span>
                                </div>
                                <p className="text-gray-900">{k.deskripsi}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {k.status !== 'resolved' && (
                                  <>
                                    <button
                                      onClick={() => openTindakLanjutModal(k)}
                                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                                    >
                                      + Tindak Lanjut
                                    </button>
                                    <button
                                      onClick={() => handleUpdateKendalaStatus(k.id, 'resolved')}
                                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                                    >
                                      Selesai
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Tindak Lanjut List */}
                            {k.tindak_lanjut && k.tindak_lanjut.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium text-gray-700 mb-3">Tindak Lanjut:</p>
                                <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                                  {k.tindak_lanjut.map((tl) => (
                                    <div key={tl.id} className={`bg-gray-50 p-3 rounded-lg ${isOverdue(tl.batas_waktu) && tl.status !== 'done' ? 'border-2 border-red-300' : ''}`}>
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(tl.status)}`}>
                                            {getStatusLabel(tl.status)}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatDate(tl.tanggal_tindak_lanjut || tl.created_at)}
                                          </span>
                                        </div>
                                        {tl.batas_waktu && (
                                          <div className={`text-xs ${isOverdue(tl.batas_waktu) && tl.status !== 'done' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                            {isOverdue(tl.batas_waktu) && tl.status !== 'done' ? '⚠️ ' : ''}
                                            Batas: {formatDate(tl.batas_waktu)}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-800">{tl.deskripsi}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tindak Lanjut */}
      {showTindakLanjutModal && selectedKendalaForTL && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Tindak Lanjut</h3>
            <div className="bg-orange-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-orange-800"><strong>Kendala:</strong> {selectedKendalaForTL.deskripsi}</p>
            </div>
            
            <form onSubmit={handleSubmitTindakLanjut} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Tindak Lanjut <span className="text-red-500">*</span></label>
                <textarea
                  value={tindakLanjutForm.deskripsi}
                  onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Jelaskan tindakan yang akan/sudah dilakukan..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batas Waktu</label>
                  <input
                    type="date"
                    value={tindakLanjutForm.batas_waktu}
                    onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, batas_waktu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={today}
                  />
                  <p className="text-xs text-gray-500 mt-1">Target penyelesaian</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={tindakLanjutForm.status}
                    onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Belum Selesai</option>
                    <option value="done">Selesai (Tutup Kendala)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Pilih selesai untuk menutup kendala terkait</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTindakLanjutModal(false);
                    setSelectedKendalaForTL(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
