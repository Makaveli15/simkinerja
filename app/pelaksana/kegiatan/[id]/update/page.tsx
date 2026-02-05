'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  LuTriangleAlert,
  LuChevronLeft,
  LuCheck,
  LuX,
  LuCircleX,
  LuCircleCheck,
  LuInfo,
  LuFileText
} from 'react-icons/lu';

// Helper function untuk format angka (hilangkan desimal jika tidak perlu)
const formatNumber = (num: number | string | undefined): string => {
  const n = parseFloat(String(num)) || 0;
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');
};

interface KegiatanDetail {
  id: number;
  nama: string;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_realisasi_selesai: string | null;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  anggaran_pagu: number;
  status: string;
  status_verifikasi: 'belum_verifikasi' | 'menunggu' | 'valid' | 'revisi';
  tim_nama: string;
}

interface Summary {
  realisasi_fisik_persen: number;
  realisasi_anggaran_nominal: number;
  realisasi_anggaran_persen: string;
  output_realisasi: number;
  target_output: number;
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
  status_review: 'pending' | 'diterima' | 'ditolak';
  catatan_reviewer?: string;
  reviewed_at?: string;
}

type TabType = 'progres' | 'waktu' | 'realisasi-anggaran' | 'kendala' | 'evaluasi' | 'dokumen';

interface IndikatorConfigItem {
  kode: string;
  nama: string;
  bobot: number;
  deskripsi: string;
  urutan: number;
}

export default function UpdateKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kegiatanId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('progres');
  
  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [indikatorConfig, setIndikatorConfig] = useState<IndikatorConfigItem[]>([]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [progres, setProgres] = useState<Progres[]>([]);
  const [realisasiFisik, setRealisasiFisik] = useState<RealisasiFisik[]>([]);
  const [realisasiAnggaran, setRealisasiAnggaran] = useState<RealisasiAnggaran[]>([]);
  const [kendala, setKendala] = useState<Kendala[]>([]);
  const [dokumenOutput, setDokumenOutput] = useState<DokumenOutput[]>([]);

  // Dokumen Output Form
  const [dokumenForm, setDokumenForm] = useState({
    file: null as File | null,
    tipe_dokumen: 'draft' as 'draft' | 'final',
    deskripsi: ''
  });
  const [uploadingDokumen, setUploadingDokumen] = useState(false);
  const [deletingDokumenId, setDeletingDokumenId] = useState<number | null>(null);

  // Raw Data Input Form (data mentah yang diinput pengguna)
  const [rawDataForm, setRawDataForm] = useState({
    output_realisasi: '',
    tanggal_realisasi_selesai: ''
  });
  const [updatingRawData, setUpdatingRawData] = useState(false);
  const [requestingValidation, setRequestingValidation] = useState(false);

  // Progres Form (input progres baru dengan keterangan)
  const [progresForm, setProgresForm] = useState({
    keterangan: ''
  });
  const [submittingProgres, setSubmittingProgres] = useState(false);

  // Form states
  const today = new Date().toISOString().split('T')[0];
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
    fetchDokumenOutput();
    fetchIndikatorConfig();
  }, [kegiatanId]);

  const fetchIndikatorConfig = async () => {
    try {
      const res = await fetch('/api/indikator-config');
      if (res.ok) {
        const data = await res.json();
        setIndikatorConfig(data.indikator || []);
      }
    } catch (error) {
      console.error('Error fetching indikator config:', error);
    }
  };

  const fetchDokumenOutput = async () => {
    try {
      const res = await fetch(`/api/pelaksana/dokumen-output?kegiatan_id=${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setDokumenOutput(data.dokumen || []);
      }
    } catch (error) {
      console.error('Error fetching dokumen:', error);
    }
  };

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
      setSummary(data.summary);
      setCurrentStatus(data.kegiatan?.status || '');
      setProgres(data.progres || []);
      setRealisasiFisik(data.realisasi_fisik || []);
      setRealisasiAnggaran(data.realisasi_anggaran || []);
      setKendala(data.kendala || []);
      
      // Set raw data form with existing values
      if (data.kegiatan) {
        setRawDataForm({
          output_realisasi: formatNumber(data.kegiatan.output_realisasi),
          tanggal_realisasi_selesai: data.kegiatan.tanggal_realisasi_selesai 
            ? data.kegiatan.tanggal_realisasi_selesai.split('T')[0] 
            : ''
        });
      }
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
        fetchData(); // Refresh to recalculate kinerja
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

  // Handle update raw data (data mentah monitoring)
  const handleUpdateRawData = async () => {
    setUpdatingRawData(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: kegiatan?.nama,
          tanggal_mulai: kegiatan?.tanggal_mulai,
          output_realisasi: parseFloat(rawDataForm.output_realisasi) || 0,
          tanggal_realisasi_selesai: rawDataForm.tanggal_realisasi_selesai || null
        })
      });

      if (res.ok) {
        setSuccess('Data monitoring berhasil diperbarui. Skor kinerja akan dihitung ulang.');
        fetchData(); // Refresh to get updated kinerja calculation
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan data monitoring');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setUpdatingRawData(false);
    }
  };

  // Handle upload dokumen output
  const handleUploadDokumen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dokumenForm.file) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    setUploadingDokumen(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', dokumenForm.file);
      formData.append('kegiatan_id', kegiatanId);
      formData.append('tipe_dokumen', dokumenForm.tipe_dokumen);
      formData.append('deskripsi', dokumenForm.deskripsi);

      const res = await fetch('/api/pelaksana/dokumen-output', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSuccess('Dokumen berhasil diupload');
        setDokumenForm({ file: null, tipe_dokumen: 'draft', deskripsi: '' });
        // Reset file input
        const fileInput = document.getElementById('dokumen-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchDokumenOutput();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mengupload dokumen');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat mengupload dokumen');
    } finally {
      setUploadingDokumen(false);
    }
  };

  // Handle delete dokumen
  const handleDeleteDokumen = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;

    setDeletingDokumenId(id);
    setError('');

    try {
      const res = await fetch(`/api/pelaksana/dokumen-output?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Dokumen berhasil dihapus');
        fetchDokumenOutput();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menghapus dokumen');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat menghapus dokumen');
    } finally {
      setDeletingDokumenId(null);
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

  // Handle submit progres gabungan (data monitoring + keterangan progres)
  const handleSubmitProgresGabungan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProgres(true);
    setError('');
    setSuccess('');

    try {
      // 1. Update data monitoring dulu (tanpa status_verifikasi)
      const resMonitoring = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: kegiatan?.nama,
          tanggal_mulai: kegiatan?.tanggal_mulai,
          output_realisasi: parseFloat(rawDataForm.output_realisasi) || 0,
          tanggal_realisasi_selesai: rawDataForm.tanggal_realisasi_selesai || null
        })
      });

      if (!resMonitoring.ok) {
        const data = await resMonitoring.json();
        setError(data.error || 'Gagal menyimpan data monitoring');
        return;
      }

      // 2. Hitung capaian output dari data monitoring
      const capaianOutput = kegiatan?.target_output 
        ? Math.min((parseFloat(rawDataForm.output_realisasi) || 0) / kegiatan.target_output * 100, 100)
        : 0;

      // Ambil nilai dari summary jika ada
      const ketepatanWaktu = summary?.indikator?.ketepatan_waktu || 0;
      const kualitasOutput = summary?.indikator?.kualitas_output || 0;

      // 3. Simpan progres dengan keterangan
      const resProgres = await fetch('/api/pelaksana/progres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(kegiatanId),
          capaian_output: capaianOutput,
          ketepatan_waktu: ketepatanWaktu,
          kualitas_output: kualitasOutput,
          keterangan: progresForm.keterangan
        })
      });

      if (resProgres.ok) {
        setSuccess('✅ Progres berhasil disimpan! Data monitoring dan keterangan telah dicatat.');
        setProgresForm({ keterangan: '' });
        fetchData(); // Refresh untuk update riwayat dan skor kinerja
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await resProgres.json();
        setError(data.error || 'Gagal menyimpan progres');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat menyimpan progres');
    } finally {
      setSubmittingProgres(false);
    }
  };

  // Fungsi untuk meminta validasi dari pimpinan
  const handleRequestValidation = async () => {
    setRequestingValidation(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: kegiatan?.nama,
          tanggal_mulai: kegiatan?.tanggal_mulai,
          status_verifikasi: 'menunggu'
        })
      });

      if (res.ok) {
        setSuccess('✅ Permintaan validasi berhasil dikirim ke pimpinan!');
        fetchData();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mengirim permintaan validasi');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan saat mengirim permintaan validasi');
    } finally {
      setRequestingValidation(false);
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
        setSuccess('⚠️ Kendala berhasil ditambahkan. Selesaikan kendala untuk meningkatkan skor kinerja.');
        setKendalaForm({ deskripsi: '', tingkat_prioritas: 'sedang' });
        fetchData(); // Refresh untuk update skor kinerja
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
        if (newStatus === 'resolved') {
          setSuccess('✅ Kendala berhasil diselesaikan! Skor Penyelesaian Kendala akan diperbarui.');
        } else {
          setSuccess('Status kendala berhasil diupdate');
        }
        fetchData(); // Refresh untuk update skor kinerja
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
      case 'sedang': return 'bg-amber-100 text-amber-700';
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
      case 'pending': return 'bg-amber-100 text-amber-700';
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
            <LuTriangleAlert className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 mb-4">{error || 'Kegiatan tidak ditemukan'}</p>
          <Link href="/pelaksana/kegiatan" className="text-blue-600 hover:underline">Kembali ke Daftar Kegiatan</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'progres' as TabType, label: 'Progres', icon: '📊', count: progres.length },
    { id: 'realisasi-anggaran' as TabType, label: 'Realisasi Anggaran', icon: '💰', count: realisasiAnggaran.length },
    { id: 'kendala' as TabType, label: 'Kendala & Tindak Lanjut', icon: '⚠️', count: kendala.length },
    { id: 'dokumen' as TabType, label: 'Verifikasi Kualitas Output', icon: '✅', count: dokumenOutput.length },
    { id: 'waktu' as TabType, label: 'Waktu Penyelesaian', icon: '⏰', count: null },
    { id: 'evaluasi' as TabType, label: 'Evaluasi Kinerja', icon: '📈', count: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/pelaksana/kegiatan/${kegiatanId}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
            <LuChevronLeft className="w-5 h-5" />
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
                        ? status.color === 'blue' 
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
                      <LuCheck className="w-4 h-4" />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Capaian Output</p>
                <p className="text-xl font-bold text-blue-700">
                  {summary?.indikator?.capaian_output?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-blue-600 truncate">
                  {formatNumber(rawDataForm.output_realisasi)} / {formatNumber(kegiatan.target_output)} {kegiatan.satuan_output}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Realisasi Anggaran</p>
                <p className="text-base font-bold text-green-700">{formatCurrency(totalRealisasiAnggaran)}</p>
                <p className="text-xs text-green-600">{persenAnggaran.toFixed(1)}% dari target</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Target Anggaran</p>
                <p className="text-base font-bold text-purple-700">{formatCurrency(paguAnggaran)}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                summary?.status_kinerja === 'Sukses' ? 'bg-green-50' :
                summary?.status_kinerja === 'Perlu Perhatian' ? 'bg-yellow-50' :
                summary?.status_kinerja === 'Bermasalah' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <p className={`text-xs font-medium ${
                  summary?.status_kinerja === 'Sukses' ? 'text-green-600' :
                  summary?.status_kinerja === 'Perlu Perhatian' ? 'text-yellow-600' :
                  summary?.status_kinerja === 'Bermasalah' ? 'text-red-600' : 'text-gray-600'
                }`}>Skor Kinerja</p>
                <p className={`text-xl font-bold ${
                  summary?.status_kinerja === 'Sukses' ? 'text-green-700' :
                  summary?.status_kinerja === 'Perlu Perhatian' ? 'text-yellow-700' :
                  summary?.status_kinerja === 'Bermasalah' ? 'text-red-700' : 'text-gray-700'
                }`}>{summary?.skor_kinerja || 0}</p>
                <p className={`text-xs ${
                  summary?.status_kinerja === 'Sukses' ? 'text-green-600' :
                  summary?.status_kinerja === 'Perlu Perhatian' ? 'text-yellow-600' :
                  summary?.status_kinerja === 'Bermasalah' ? 'text-red-600' : 'text-gray-600'
                }`}>{summary?.status_kinerja || 'Belum Dinilai'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
            <LuCircleX className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
            <LuCircleCheck className="w-5 h-5 flex-shrink-0" />
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex flex-wrap lg:flex-nowrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Tab: Progres - Input Data Monitoring */}
            {activeTab === 'progres' && (
              <div className="space-y-6">
                {/* Form Catat Progres Terpadu */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>📝</span> Catat Progres Kegiatan
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Masukkan data monitoring dan keterangan aktivitas, skor kinerja akan dihitung otomatis oleh sistem</p>
                  
                  <form onSubmit={handleSubmitProgresGabungan} className="space-y-6">
                    {/* Data Monitoring */}
                    <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                        Data Monitoring
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Output Realisasi */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Output Realisasi
                            <span className="text-xs text-gray-500 ml-1">({kegiatan.satuan_output})</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={rawDataForm.output_realisasi}
                              onChange={(e) => setRawDataForm({...rawDataForm, output_realisasi: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />
                            <span className="px-3 py-2 bg-gray-50 border text-gray-600 rounded-lg text-sm">
                              / {formatNumber(kegiatan.target_output)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Target: {formatNumber(kegiatan.target_output)} {kegiatan.satuan_output}</p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Skor */}
                    <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                        Preview Skor (dihitung otomatis)
                      </h4>
                      <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                        <p className="text-xs text-gray-600 mb-1">Capaian Output</p>
                        <p className="text-xl font-bold text-blue-600">
                          {kegiatan.target_output 
                            ? Math.min((parseFloat(rawDataForm.output_realisasi) || 0) / kegiatan.target_output * 100, 100).toFixed(1)
                            : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(parseFloat(rawDataForm.output_realisasi) || 0)} / {formatNumber(kegiatan.target_output)} {kegiatan.satuan_output}
                        </p>
                      </div>
                    </div>

                    {/* Keterangan Progres */}
                    <div className="bg-white/70 rounded-lg p-4 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                        Keterangan Aktivitas <span className="text-red-500">*</span>
                      </h4>
                      <textarea
                        value={progresForm.keterangan}
                        onChange={(e) => setProgresForm({ keterangan: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Jelaskan aktivitas atau progres yang sudah dilakukan..."
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Contoh: Telah menyelesaikan pengumpulan data dari 5 kecamatan, melakukan verifikasi lapangan, dll.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingProgres || !progresForm.keterangan.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                      >
                        {submittingProgres ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <LuCheck className="w-4 h-4" />
                            Simpan Progres
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Riwayat Progres */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>📜</span> Riwayat Update Progres
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{progres.length} catatan</span>
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Catatan historis progres kegiatan yang telah diinput</p>
                  
                  {progres.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <LuFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Belum ada riwayat progres</p>
                      <p className="text-sm text-gray-400 mt-1">Gunakan form di atas untuk mencatat progres pertama</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {progres.map((p, index) => (
                        <div key={p.id} className="bg-gray-50 border rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                                {progres.length - index}
                              </span>
                              <span className="text-sm font-medium text-gray-700">{formatDate(p.tanggal_update)}</span>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="bg-white rounded-lg p-2 text-center border">
                              <p className="text-xs text-gray-500">Capaian Output</p>
                              <p className="text-lg font-bold text-blue-600">{Math.round(Number(p.capaian_output || 0))}%</p>
                            </div>
                          </div>
                          
                          {p.keterangan && (
                            <div className="bg-white border rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Keterangan:</p>
                              <p className="text-sm text-gray-700">{p.keterangan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Waktu Penyelesaian */}
            {activeTab === 'waktu' && (
              <div className="space-y-6">
                {/* Info Waktu Kegiatan */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>⏰</span> Informasi Waktu Kegiatan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <p className="text-sm text-gray-600 mb-1">Tanggal Mulai</p>
                      <p className="text-lg font-bold text-gray-900">
                        {kegiatan.tanggal_mulai ? formatDate(kegiatan.tanggal_mulai) : '-'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <p className="text-sm text-gray-600 mb-1">Target Selesai</p>
                      <p className="text-lg font-bold text-gray-900">
                        {kegiatan.tanggal_selesai ? formatDate(kegiatan.tanggal_selesai) : '-'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                      <p className="text-sm text-gray-600 mb-1">Tanggal Selesai Aktual</p>
                      <p className={`text-lg font-bold ${kegiatan.tanggal_realisasi_selesai ? 'text-green-600' : 'text-gray-400'}`}>
                        {kegiatan.tanggal_realisasi_selesai ? formatDate(kegiatan.tanggal_realisasi_selesai) : 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Ketepatan Waktu */}
                  <div className="mt-4 bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Skor Ketepatan Waktu</span>
                      <span className={`text-lg font-bold ${
                        (summary?.indikator?.ketepatan_waktu || 0) >= 80 ? 'text-green-600' :
                        (summary?.indikator?.ketepatan_waktu || 0) >= 60 ? 'text-yellow-600' :
                        (summary?.indikator?.ketepatan_waktu || 0) >= 40 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {(summary?.indikator?.ketepatan_waktu || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (summary?.indikator?.ketepatan_waktu || 0) >= 80 ? 'bg-green-500' :
                          (summary?.indikator?.ketepatan_waktu || 0) >= 60 ? 'bg-yellow-500' :
                          (summary?.indikator?.ketepatan_waktu || 0) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(summary?.indikator?.ketepatan_waktu || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {!kegiatan.tanggal_selesai 
                        ? 'Target tanggal selesai belum ditentukan'
                        : !kegiatan.tanggal_realisasi_selesai && new Date() > new Date(kegiatan.tanggal_selesai)
                          ? '⚠️ Deadline sudah lewat dan kegiatan belum selesai'
                          : !kegiatan.tanggal_realisasi_selesai
                            ? '📋 Kegiatan masih dalam proses'
                            : kegiatan.tanggal_realisasi_selesai <= kegiatan.tanggal_selesai
                              ? '✅ Selesai tepat waktu'
                              : '⚠️ Selesai melewati target waktu'}
                    </p>
                  </div>
                </div>

                {/* Form Update Tanggal Selesai */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>✏️</span> Update Tanggal Selesai Aktual
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Isi tanggal ini saat kegiatan sudah benar-benar selesai dilaksanakan
                  </p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatan.id}/update-raw-data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          tanggal_realisasi_selesai: rawDataForm.tanggal_realisasi_selesai || null
                        })
                      });
                      
                      if (res.ok) {
                        alert('Tanggal selesai berhasil disimpan');
                        fetchData();
                      } else {
                        const data = await res.json();
                        alert(data.error || 'Gagal menyimpan');
                      }
                    } catch {
                      alert('Terjadi kesalahan');
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Selesai Aktual
                      </label>
                      <input
                        type="date"
                        value={rawDataForm.tanggal_realisasi_selesai}
                        onChange={(e) => setRawDataForm({...rawDataForm, tanggal_realisasi_selesai: e.target.value})}
                        className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Target selesai: {kegiatan.tanggal_selesai ? formatDate(kegiatan.tanggal_selesai) : 'Belum ditentukan'}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <LuCheck className="w-4 h-4" />
                        Simpan Tanggal
                      </button>
                      
                      {rawDataForm.tanggal_realisasi_selesai && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('Hapus tanggal selesai aktual?')) {
                              setRawDataForm({...rawDataForm, tanggal_realisasi_selesai: ''});
                              try {
                                await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatan.id}/update-raw-data`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    tanggal_realisasi_selesai: null
                                  })
                                });
                                fetchData();
                              } catch {
                                alert('Gagal menghapus');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <LuX className="w-4 h-4" />
                          Hapus
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Panduan Pengisian */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <LuInfo className="w-5 h-5" />
                    Panduan Perhitungan Ketepatan Waktu
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1.5 ml-7">
                    <li><strong>Saat kegiatan belum selesai:</strong> Skor dihitung prorata dari 0% berdasarkan waktu yang sudah berjalan</li>
                    <li><strong>Selesai tepat waktu:</strong> Skor 100%</li>
                    <li><strong>Terlambat 1-7 hari:</strong> Skor 80%</li>
                    <li><strong>Terlambat 8-14 hari:</strong> Skor 60%</li>
                    <li><strong>Terlambat 15-30 hari:</strong> Skor 40%</li>
                    <li><strong>Terlambat lebih dari 30 hari:</strong> Skor 20%</li>
                  </ul>
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
                {/* Info Box - Penjelasan Skor Penyelesaian Kendala */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <LuTriangleAlert className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-800">Penyelesaian Kendala Mempengaruhi Skor Kinerja</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Indikator <strong>Penyelesaian Kendala</strong> berkontribusi <strong>10%</strong> terhadap skor kinerja keseluruhan.
                        Semakin banyak kendala yang diselesaikan, semakin tinggi skor yang didapat.
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                          <p className="text-2xl font-bold text-gray-900">{summary?.total_kendala || 0}</p>
                          <p className="text-xs text-gray-600">Total Kendala</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                          <p className="text-2xl font-bold text-green-600">{summary?.kendala_resolved || 0}</p>
                          <p className="text-xs text-gray-600">Terselesaikan</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
                          <p className="text-2xl font-bold text-orange-600">{summary?.kendala_pending || 0}</p>
                          <p className="text-xs text-gray-600">Pending</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-amber-700">Skor Penyelesaian Kendala</span>
                          <span className="font-bold text-amber-800">{summary?.indikator?.penyelesaian_kendala?.toFixed(1) || 0} / 100</span>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(summary?.indikator?.penyelesaian_kendala || 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-amber-600 mt-1">
                          Kontribusi ke skor akhir: <strong>{((summary?.indikator?.penyelesaian_kendala || 0) * 0.1).toFixed(1)} poin</strong> (dari maksimal 10 poin)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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

            {/* Tab: Verifikasi Kualitas Output */}
            {activeTab === 'dokumen' && (
              <div className="space-y-6">
                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <span>📁</span> Dokumen Output Kegiatan
                  </h4>
                  <p className="text-sm text-blue-700">
                    Upload dokumen draft atau output final kegiatan untuk direview oleh pimpinan. 
                    Pimpinan akan memvalidasi dokumen sebagai bukti penyelesaian kegiatan.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Upload */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>⬆️</span> Upload Dokumen
                    </h3>
                    <form onSubmit={handleUploadDokumen} className="space-y-4">
                      {/* Tipe Dokumen */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipe Dokumen <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setDokumenForm({ ...dokumenForm, tipe_dokumen: 'draft' })}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                              dokumenForm.tipe_dokumen === 'draft'
                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-lg mb-1">📝</span>
                            Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => setDokumenForm({ ...dokumenForm, tipe_dokumen: 'final' })}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                              dokumenForm.tipe_dokumen === 'final'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-lg mb-1">✅</span>
                            Final
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {dokumenForm.tipe_dokumen === 'draft' 
                            ? 'Draft: Dokumen yang masih dalam proses atau perlu review'
                            : 'Final: Dokumen output akhir yang siap divalidasi'}
                        </p>
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          File Dokumen <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                          <input
                            type="file"
                            id="dokumen-file"
                            onChange={(e) => setDokumenForm({ ...dokumenForm, file: e.target.files?.[0] || null })}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                          />
                          {dokumenForm.file && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <span>{getFileIcon(dokumenForm.file.type)}</span>
                              <span className="truncate">{dokumenForm.file.name}</span>
                              <span className="text-gray-400">({formatFileSize(dokumenForm.file.size)})</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Max 10MB. Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, ZIP, RAR
                        </p>
                      </div>

                      {/* Deskripsi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deskripsi Dokumen
                        </label>
                        <textarea
                          value={dokumenForm.deskripsi}
                          onChange={(e) => setDokumenForm({ ...dokumenForm, deskripsi: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          rows={3}
                          placeholder="Jelaskan isi atau tujuan dokumen ini..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={uploadingDokumen || !dokumenForm.file}
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                      >
                        {uploadingDokumen ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <span>⬆️</span> Upload Dokumen
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Daftar Dokumen */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📋</span> Daftar Dokumen ({dokumenOutput.length})
                    </h3>

                    {dokumenOutput.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">📁</span>
                        </div>
                        <p className="text-gray-500 mb-2">Belum ada dokumen diupload</p>
                        <p className="text-sm text-gray-400">Upload dokumen draft atau final untuk direview pimpinan</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {dokumenOutput.map((dok) => (
                          <div key={dok.id} className={`border rounded-lg p-4 ${
                            dok.status_review === 'diterima' ? 'bg-green-50 border-green-200' :
                            dok.status_review === 'ditolak' ? 'bg-red-50 border-red-200' :
                            'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{getFileIcon(dok.tipe_file)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 truncate">{dok.nama_file}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    dok.tipe_dokumen === 'final' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {dok.tipe_dokumen === 'final' ? 'Final' : 'Draft'}
                                  </span>
                                </div>
                                {dok.deskripsi && (
                                  <p className="text-sm text-gray-600 mb-2">{dok.deskripsi}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{formatFileSize(dok.ukuran_file)}</span>
                                  <span>•</span>
                                  <span>{new Date(dok.uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>

                                {/* Status Review */}
                                <div className="mt-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    dok.status_review === 'diterima' 
                                      ? 'bg-green-100 text-green-700' 
                                      : dok.status_review === 'ditolak'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {dok.status_review === 'diterima' && '✅ Diterima'}
                                    {dok.status_review === 'ditolak' && '❌ Ditolak'}
                                    {dok.status_review === 'pending' && '⏳ Menunggu Review'}
                                  </span>
                                  {dok.catatan_reviewer && (
                                    <p className={`mt-2 text-sm p-2 rounded ${
                                      dok.status_review === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      <strong>Catatan Reviewer:</strong> {dok.catatan_reviewer}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                <a
                                  href={dok.path_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-center"
                                >
                                  👁️ Lihat
                                </a>
                                {dok.status_review === 'pending' && (
                                  <button
                                    onClick={() => handleDeleteDokumen(dok.id)}
                                    disabled={deletingDokumenId === dok.id}
                                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                                  >
                                    {deletingDokumenId === dok.id ? '...' : '🗑️ Hapus'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-gray-700">{dokumenOutput.filter(d => d.status_review === 'pending').length}</p>
                    <p className="text-sm text-gray-500">Menunggu Review</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{dokumenOutput.filter(d => d.status_review === 'diterima').length}</p>
                    <p className="text-sm text-green-600">Diterima</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{dokumenOutput.filter(d => d.status_review === 'ditolak').length}</p>
                    <p className="text-sm text-red-600">Ditolak</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Evaluasi Kinerja */}
            {activeTab === 'evaluasi' && (
              <div className="space-y-6">
                {/* Skor Kinerja Utama */}
                <div className={`rounded-xl p-6 ${
                  summary?.status_kinerja === 'Sukses' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' :
                  summary?.status_kinerja === 'Perlu Perhatian' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' :
                  summary?.status_kinerja === 'Bermasalah' ? 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Skor Kinerja Keseluruhan</h3>
                      <p className="text-sm text-gray-600">Dihitung otomatis berdasarkan 5 indikator berbobot</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${
                        (summary?.skor_kinerja || 0) >= 80 ? 'text-green-600' :
                        (summary?.skor_kinerja || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{summary?.skor_kinerja || 0}</p>
                      <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                        summary?.status_kinerja === 'Sukses' ? 'bg-green-100 text-green-700' :
                        summary?.status_kinerja === 'Perlu Perhatian' ? 'bg-yellow-100 text-yellow-700' :
                        summary?.status_kinerja === 'Bermasalah' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {summary?.status_kinerja || 'Belum Dinilai'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakdown Indikator */}
                {summary && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📊</span> Breakdown Indikator Kinerja
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Skor kinerja dihitung berdasarkan {indikatorConfig.length || 5} indikator dengan bobot berbeda. Nilai dihitung secara otomatis berdasarkan data monitoring yang diinput.
                    </p>

                    <div className="space-y-5">
                      {(() => {
                        // Helper function to get bobot from config
                        const getBobot = (kode: string) => {
                          const config = indikatorConfig.find(i => i.kode.toLowerCase() === kode.toLowerCase());
                          return config ? config.bobot : 0;
                        };
                        
                        const getDesc = (kode: string, defaultDesc: string) => {
                          const config = indikatorConfig.find(i => i.kode.toLowerCase() === kode.toLowerCase());
                          return config?.deskripsi || defaultDesc;
                        };

                        const items = [
                          { kode: 'capaian_output', label: 'Capaian Output', value: summary.indikator.capaian_output, color: 'blue', icon: '🎯', defaultDesc: 'Perbandingan output realisasi dengan target output' },
                          { kode: 'ketepatan_waktu', label: 'Ketepatan Waktu', value: summary.indikator.ketepatan_waktu, color: 'green', icon: '⏱️', defaultDesc: 'Penyelesaian tepat waktu atau lebih cepat dari jadwal' },
                          { kode: 'serapan_anggaran', label: 'Serapan Anggaran', value: summary.indikator.serapan_anggaran, color: 'yellow', icon: '💰', defaultDesc: 'Efisiensi penggunaan anggaran sesuai target' },
                          { kode: 'kualitas_output', label: 'Kualitas Output', value: summary.indikator.kualitas_output, color: 'purple', icon: '✅', defaultDesc: 'Status verifikasi kualitas hasil pekerjaan' },
                          { kode: 'penyelesaian_kendala', label: 'Penyelesaian Kendala', value: summary.indikator.penyelesaian_kendala, color: 'orange', icon: '🔧', defaultDesc: 'Rasio kendala yang berhasil diselesaikan' },
                        ].map(item => ({
                          ...item,
                          bobot: getBobot(item.kode),
                          desc: getDesc(item.kode, item.defaultDesc)
                        }));

                        return items.map((item, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{item.icon}</span>
                                <div>
                                  <span className="font-medium text-gray-900">{item.label}</span>
                                  <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Bobot {item.bobot}%</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-2xl font-bold ${
                                  item.color === 'blue' ? 'text-blue-600' :
                                  item.color === 'green' ? 'text-green-600' :
                                  item.color === 'yellow' ? 'text-yellow-600' :
                                  item.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                                }`}>{item.value.toFixed(1)}</span>
                                <span className="text-gray-500 text-sm"> / 100</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{item.desc}</p>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all ${
                                  item.color === 'blue' ? 'bg-blue-500' :
                                  item.color === 'green' ? 'bg-green-500' :
                                  item.color === 'yellow' ? 'bg-yellow-500' :
                                  item.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                                }`} 
                                style={{ width: `${Math.min(item.value, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              Kontribusi: <strong>{(item.value * item.bobot / 100).toFixed(1)} poin</strong>
                            </p>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Total */}
                    <div className="border-t mt-6 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Skor Kinerja</span>
                        <span className={`text-3xl font-bold ${
                          summary.skor_kinerja >= 80 ? 'text-green-600' :
                          summary.skor_kinerja >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{summary.skor_kinerja}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deviasi & Ringkasan */}
                {summary && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Deviasi */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>📉</span> Analisis Deviasi
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Deviasi Output</p>
                            <p className="text-xs text-gray-500">Selisih output realisasi vs target</p>
                          </div>
                          <span className={`text-lg font-bold ${
                            summary.deviasi.output >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {summary.deviasi.output >= 0 ? '+' : ''}{summary.deviasi.output} {kegiatan.satuan_output}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Deviasi Waktu</p>
                            <p className="text-xs text-gray-500">Selisih waktu penyelesaian</p>
                          </div>
                          <span className={`text-lg font-bold ${
                            summary.deviasi.waktu >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {summary.deviasi.waktu >= 0 
                              ? `${summary.deviasi.waktu} hari tersisa` 
                              : `Terlambat ${Math.abs(summary.deviasi.waktu)} hari`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Deviasi Anggaran</p>
                            <p className="text-xs text-gray-500">Selisih realisasi vs target anggaran</p>
                          </div>
                          <span className={`text-lg font-bold ${
                            summary.deviasi.anggaran <= 0 ? 'text-green-600' : 
                            summary.deviasi.anggaran <= 10 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {summary.deviasi.anggaran >= 0 ? '+' : ''}{summary.deviasi.anggaran.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan Kendala */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Status Kendala
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">Total Kendala</p>
                          <span className="text-lg font-bold text-gray-700">{summary.total_kendala}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <p className="font-medium text-green-700">Terselesaikan</p>
                          <span className="text-lg font-bold text-green-600">{summary.kendala_resolved}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <p className="font-medium text-orange-700">Pending</p>
                          <span className="text-lg font-bold text-orange-600">{summary.kendala_pending}</span>
                        </div>
                      </div>
                      {summary.total_kendala > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Tingkat Penyelesaian:</p>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-500 h-3 rounded-full" 
                              style={{ width: `${summary.total_kendala > 0 ? (summary.kendala_resolved / summary.total_kendala * 100) : 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {summary.total_kendala > 0 ? (summary.kendala_resolved / summary.total_kendala * 100).toFixed(0) : 0}% kendala terselesaikan
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Threshold Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Panduan Penilaian Kinerja</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                      <p className="font-bold text-green-600">≥ 80</p>
                      <p className="text-xs text-gray-600">Sukses</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-yellow-200">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-yellow-600 font-bold">!</span>
                      </div>
                      <p className="font-bold text-yellow-600">60 - 79</p>
                      <p className="text-xs text-gray-600">Perlu Perhatian</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-red-600 font-bold">✗</span>
                      </div>
                      <p className="font-bold text-red-600">&lt; 60</p>
                      <p className="text-xs text-gray-600">Bermasalah</p>
                    </div>
                  </div>
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
