'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LuChevronLeft, 
  LuSquarePen, 
  LuTrash2, 
  LuInfo, 
  LuTimer, 
  LuFileText, 
  LuPlus, 
  LuX, 
  LuCalendar,
  LuCheck,
  LuDownload,
  LuUpload,
  LuShieldCheck,
  LuLoader,
  LuCircleAlert,
  LuUser,
  LuSearch,
  LuTrendingUp,
  LuWallet,
  LuTriangleAlert,
  LuCircleCheck,
  LuClock,
  LuMessageSquare,
  LuTarget,
  LuWrench,
  LuChartBar,
  LuFileSpreadsheet,
  LuImage,
  LuPaperclip,
  LuCircleX,
  LuHourglass,
  LuTrophy,
  LuPackage,
  LuPin,
  LuLightbulb,
  LuFilePen,
  LuClipboardList,
  LuBriefcase,
  LuFolderOpen,
  LuChartNoAxesCombined,
  LuScrollText
} from 'react-icons/lu';

interface MitraItem {
  id: number;
  nama: string;
  posisi?: string;
  alamat?: string;
  no_telp?: string;
  sobat_id?: string;
}

interface KegiatanDetail {
  id: number;
  nama: string;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_realisasi_selesai?: string;
  target_output: number;
  output_realisasi?: number;
  output_tervalidasi?: number;
  satuan_output: string;
  jenis_validasi?: 'dokumen' | 'kuantitas';
  anggaran_pagu: number;
  status: string;
  status_verifikasi?: 'belum_verifikasi' | 'menunggu' | 'valid' | 'ditolak';
  tim_id: number;
  tim_nama: string;
  created_by: number;
  created_by_nama: string;
  kro_id?: number;
  kro_kode?: string;
  kro_nama?: string;
  mitra_id?: number;
  mitra_nama?: string;
  mitra_list?: MitraItem[];
  total_mitra?: number;
  // Pengajuan dan Approval fields
  status_pengajuan?: string;
  tanggal_pengajuan?: string;
  catatan_koordinator?: string;
  tanggal_approval_koordinator?: string;
  approved_by_koordinator?: number;
  catatan_ppk?: string;
  tanggal_approval_ppk?: string;
  approved_by_ppk?: number;
  catatan_kepala?: string;
  tanggal_approval_kepala?: string;
  approved_by_kepala?: number;
}

interface Progres {
  id: number;
  tanggal_update: string;
  capaian_output: number;
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
  output_realisasi?: number;
  target_output?: number;
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
  deviasi?: {
    output: number;
    waktu: number;
    anggaran: number;
  };
}

interface KRO {
  id: number;
  kode: string;
  nama: string;
  deskripsi?: string;
}

interface Mitra {
  id: number;
  nama: string;
  posisi: string;
  alamat: string;
  no_telp?: string;
  sobat_id?: string;
}

interface IndikatorConfigItem {
  kode: string;
  nama: string;
  bobot: number;
  deskripsi: string;
  urutan: number;
}

type TabType = 'evaluasi' | 'progres' | 'realisasi-anggaran' | 'kendala' | 'verifikasi' | 'waktu' | 'catatan';

interface Evaluasi {
  id: number;
  kegiatan_id: number;
  role_pemberi: 'pimpinan' | 'kesubag';
  jenis_evaluasi: 'catatan' | 'arahan' | 'rekomendasi';
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
  uploaded_by_nama?: string;
  // Draft review by kesubag (after migration)
  draft_status_kesubag?: 'pending' | 'diterima' | 'ditolak';
  draft_feedback_kesubag?: string;
  draft_reviewed_by_kesubag?: number;
  draft_reviewed_at_kesubag?: string;
  // Draft feedback by pimpinan
  draft_feedback_pimpinan?: string;
  draft_reviewed_by_pimpinan?: number;
  draft_reviewed_at_pimpinan?: string;
  // Final validation workflow
  minta_validasi?: number; // 0 or 1
  minta_validasi_at?: string;
  validasi_kesubag?: 'pending' | 'valid' | 'tidak_valid';
  validasi_feedback_kesubag?: string;
  validasi_by_kesubag?: number;
  validasi_at_kesubag?: string;
  validasi_pimpinan?: 'pending' | 'valid' | 'tidak_valid';
  validasi_feedback_pimpinan?: string;
  validasi_by_pimpinan?: number;
  validasi_at_pimpinan?: string;
  status_final?: 'draft' | 'menunggu_kesubag' | 'menunggu_pimpinan' | 'ditolak' | 'disahkan';
  // Joined names
  validated_by_kesubag_nama?: string;
  validated_by_pimpinan_nama?: string;
}

interface ValidasiKuantitas {
  id: number;
  kegiatan_id: number;
  jumlah_output: number;
  bukti_path?: string;
  keterangan?: string;
  status: 'draft' | 'menunggu' | 'disahkan' | 'ditolak';
  status_kesubag: 'pending' | 'valid' | 'tidak_valid';
  status_pimpinan: 'pending' | 'valid' | 'tidak_valid';
  feedback_kesubag?: string;
  feedback_pimpinan?: string;
  koordinator_id?: number;
  pimpinan_id?: number;
  nama_koordinator?: string;
  nama_pimpinan?: string;
  created_at: string;
  updated_at?: string;
}

export default function DetailKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kegiatanId = resolvedParams.id;
  const router = useRouter();

  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
  const [progres, setProgres] = useState<Progres[]>([]);
  const [realisasiFisik, setRealisasiFisik] = useState<RealisasiFisik[]>([]);
  const [realisasiAnggaran, setRealisasiAnggaran] = useState<RealisasiAnggaran[]>([]);
  const [kendala, setKendala] = useState<Kendala[]>([]);
  const [dokumenOutput, setDokumenOutput] = useState<DokumenOutput[]>([]);
  const [validasiKuantitas, setValidasiKuantitas] = useState<ValidasiKuantitas[]>([]);
  const [evaluasiList, setEvaluasiList] = useState<Evaluasi[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [kroList, setKroList] = useState<KRO[]>([]);
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [indikatorConfig, setIndikatorConfig] = useState<IndikatorConfigItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('evaluasi');
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingDokumenId, setDeletingDokumenId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // KRO search states for edit modal
  const [editSelectedKRO, setEditSelectedKRO] = useState<KRO | null>(null);
  const [editKroSearch, setEditKroSearch] = useState('');
  const [showEditKroDropdown, setShowEditKroDropdown] = useState(false);
  const editKroDropdownRef = useRef<HTMLDivElement>(null);
  
  // Multi-select mitra states for edit modal
  const [editSelectedMitra, setEditSelectedMitra] = useState<Mitra[]>([]);
  const [editMitraSearch, setEditMitraSearch] = useState('');
  const [showEditMitraDropdown, setShowEditMitraDropdown] = useState(false);
  const editMitraDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editKroDropdownRef.current && !editKroDropdownRef.current.contains(event.target as Node)) {
        setShowEditKroDropdown(false);
      }
      if (editMitraDropdownRef.current && !editMitraDropdownRef.current.contains(event.target as Node)) {
        setShowEditMitraDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchKegiatan();
    fetchKROList();
    fetchMitraList();
    fetchDokumenOutput();
    fetchEvaluasi();
    fetchIndikatorConfig();
    fetchValidasiKuantitas();
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

  const fetchEvaluasi = async () => {
    try {
      const res = await fetch(`/api/pelaksana/evaluasi?kegiatan_id=${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluasiList(data.evaluasi || []);
      }
    } catch (error) {
      console.error('Error fetching evaluasi:', error);
    }
  };

  const fetchValidasiKuantitas = async () => {
    try {
      const res = await fetch(`/api/pelaksana/validasi-kuantitas?kegiatan_id=${kegiatanId}`);
      if (res.ok) {
        const data = await res.json();
        setValidasiKuantitas(data.validasi || []);
      }
    } catch (error) {
      console.error('Error fetching validasi kuantitas:', error);
    }
  };

  const handleDeleteKuantitas = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data kuantitas ini?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/validasi-kuantitas?id=${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setSuccess('Data kuantitas berhasil dihapus');
        fetchValidasiKuantitas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menghapus data kuantitas');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting kuantitas:', error);
      setError('Terjadi kesalahan saat menghapus data');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMintaValidasi = async (dokumenId: number) => {
    if (!confirm('Apakah Anda yakin ingin mengajukan dokumen ini untuk validasi? Dokumen akan direview oleh Koordinator dan kemudian Pimpinan.')) {
      return;
    }
    
    try {
      setSubmitting(true);
      const res = await fetch('/api/pelaksana/dokumen-output', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dokumenId, action: 'minta_validasi' })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Permintaan validasi berhasil dikirim ke Koordinator');
        fetchDokumenOutput(); // Refresh dokumen list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Gagal mengirim permintaan validasi');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error requesting validation:', error);
      setError('Terjadi kesalahan saat mengirim permintaan');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete dokumen
  const handleDeleteDokumen = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

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
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting dokumen:', error);
      setError('Terjadi kesalahan saat menghapus dokumen');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingDokumenId(null);
    }
  };

  // Hitung status verifikasi berdasarkan dokumen
  const hitungStatusVerifikasiBerdasarkanDokumen = () => {
    // Filter dokumen final yang sudah minta validasi
    const dokumenFinalValidasi = dokumenOutput.filter(
      d => d.tipe_dokumen === 'final' && d.minta_validasi === 1
    );
    
    // Hitung jumlah yang sudah disahkan
    const jumlahDisahkan = dokumenFinalValidasi.filter(d => d.status_final === 'disahkan').length;
    const jumlahDitolak = dokumenFinalValidasi.filter(
      d => d.validasi_kesubag === 'tidak_valid' || d.validasi_pimpinan === 'tidak_valid' || d.status_final === 'ditolak'
    ).length;
    const totalValidasi = dokumenFinalValidasi.length;
    
    // Gunakan target_output jika tersedia, jika tidak gunakan total dokumen
    const targetOutput = kegiatan?.target_output || totalValidasi;
    
    if (totalValidasi === 0) {
      return { status: 'belum_verifikasi', disahkan: 0, target: targetOutput };
    }
    
    if (jumlahDisahkan === targetOutput && jumlahDisahkan > 0) {
      return { status: 'valid', disahkan: jumlahDisahkan, target: targetOutput };
    }
    
    if (jumlahDitolak > 0) {
      return { status: 'ditolak', disahkan: jumlahDisahkan, target: targetOutput, ditolak: jumlahDitolak };
    }
    
    return { status: 'menunggu', disahkan: jumlahDisahkan, target: targetOutput };
  };

  // Status verifikasi yang dihitung dari dokumen
  const statusVerifikasiDokumen = hitungStatusVerifikasiBerdasarkanDokumen();

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
          // Parse anggaran_pagu properly - convert to integer string if it has decimals
          let anggaranStr = '';
          if (k.anggaran_pagu) {
            // Convert to number and then to string to handle scientific notation and decimals
            const anggaranNum = parseFloat(k.anggaran_pagu);
            anggaranStr = Math.round(anggaranNum).toString();
          }
          
          // Helper function to parse date string to YYYY-MM-DD format correctly
          // This handles timezone issues by parsing the date components directly
          const parseDateForInput = (dateStr: string | null): string => {
            if (!dateStr) return '';
            // If already in YYYY-MM-DD format (10 chars), return as is
            if (dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return dateStr;
            }
            // Parse ISO string and extract date part correctly
            // Use substring to get YYYY-MM-DD part to avoid timezone conversion
            if (dateStr.includes('T')) {
              return dateStr.substring(0, 10);
            }
            // For other formats, create date and format properly
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          setEditForm({
            nama: k.nama || '',
            deskripsi: k.deskripsi || '',
            tanggal_mulai: parseDateForInput(k.tanggal_mulai),
            tanggal_selesai: parseDateForInput(k.tanggal_selesai),
            target_output: k.target_output?.toString() || '',
            satuan_output: k.satuan_output || 'dokumen',
            anggaran_pagu: anggaranStr,
            status: k.status || 'berjalan',
            kro_id: k.kro_id?.toString() || '',
            mitra_id: k.mitra_id?.toString() || ''
          });
          
          // Set selected KRO if exists
          if (k.kro_id && k.kro_kode && k.kro_nama) {
            setEditSelectedKRO({
              id: k.kro_id,
              kode: k.kro_kode,
              nama: k.kro_nama
            });
          } else {
            setEditSelectedKRO(null);
          }
          
          // Set selected Mitra list if exists
          if (k.mitra_list && k.mitra_list.length > 0) {
            setEditSelectedMitra(k.mitra_list.map((m: MitraItem) => ({
              id: m.id,
              nama: m.nama,
              posisi: m.posisi || '',
              alamat: m.alamat || '',
              no_telp: m.no_telp || '',
              sobat_id: m.sobat_id || ''
            })));
          } else {
            setEditSelectedMitra([]);
          }
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

  // KRO selection handlers for edit modal
  const handleEditSelectKRO = (kro: KRO) => {
    setEditSelectedKRO(kro);
    setEditForm(prev => ({ ...prev, kro_id: kro.id.toString() }));
    setEditKroSearch('');
    setShowEditKroDropdown(false);
  };

  const handleEditClearKRO = () => {
    setEditSelectedKRO(null);
    setEditForm(prev => ({ ...prev, kro_id: '' }));
  };

  // Filter KRO based on search for edit modal
  const filteredEditKRO = kroList.filter(kro => {
    const searchLower = editKroSearch.toLowerCase();
    return (
      kro.kode.toLowerCase().includes(searchLower) ||
      kro.nama.toLowerCase().includes(searchLower) ||
      (kro.deskripsi && kro.deskripsi.toLowerCase().includes(searchLower))
    );
  });

  // Mitra selection handlers for edit modal
  const handleEditAddMitra = (mitra: Mitra) => {
    if (!editSelectedMitra.find(m => m.id === mitra.id)) {
      setEditSelectedMitra(prev => [...prev, mitra]);
    }
    setEditMitraSearch('');
    setShowEditMitraDropdown(false);
  };

  const handleEditRemoveMitra = (mitraId: number) => {
    setEditSelectedMitra(prev => prev.filter(m => m.id !== mitraId));
  };

  // Filter mitra based on search for edit modal
  const filteredEditMitra = mitraList.filter(mitra => {
    const searchLower = editMitraSearch.toLowerCase();
    const matchesSearch = 
      mitra.nama.toLowerCase().includes(searchLower) ||
      (mitra.posisi && mitra.posisi.toLowerCase().includes(searchLower)) ||
      (mitra.alamat && mitra.alamat.toLowerCase().includes(searchLower)) ||
      (mitra.sobat_id && mitra.sobat_id.toLowerCase().includes(searchLower));
    const notSelected = !editSelectedMitra.find(m => m.id === mitra.id);
    return matchesSearch && notSelected;
  });

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
      // Parse anggaran properly - handle both formatted and raw numbers
      let anggaranValue = null;
      if (editForm.anggaran_pagu) {
        // Remove non-digit characters except for decimal point
        const cleanValue = editForm.anggaran_pagu.replace(/[^\d.]/g, '');
        anggaranValue = parseFloat(cleanValue) || null;
      }

      const res = await fetch(`/api/pelaksana/kegiatan-operasional/${kegiatanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: editForm.nama.trim(),
          deskripsi: editForm.deskripsi?.trim() || null,
          tanggal_mulai: editForm.tanggal_mulai || undefined,
          tanggal_selesai: editForm.tanggal_selesai || undefined,
          target_output: editForm.target_output ? parseFloat(editForm.target_output) : undefined,
          satuan_output: editForm.satuan_output || undefined,
          anggaran_pagu: anggaranValue,
          status: editForm.status || undefined,
          kro_id: editForm.kro_id ? parseInt(editForm.kro_id) : null,
          mitra_ids: editSelectedMitra.map(m => m.id) // Send array of mitra IDs
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
      case 'selesai': return 'bg-green-100 text-green-700';
      case 'berjalan': return 'bg-blue-100 text-blue-700';
      case 'tertunda': return 'bg-amber-100 text-amber-700';
      case 'bermasalah': return 'bg-red-100 text-red-700';
      case 'belum_mulai': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
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
  const getScoreColor = (score: number) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  const getStatusKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'bg-green-100 text-green-700';
      case 'Perlu Perhatian': return 'bg-amber-100 text-amber-700';
      case 'Bermasalah': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'evaluasi' as TabType, label: 'Evaluasi Kinerja', icon: <LuChartBar className="w-4 h-4" /> },
    { id: 'progres' as TabType, label: 'Progres', icon: <LuTrendingUp className="w-4 h-4" />, count: progres.length },
    { id: 'realisasi-anggaran' as TabType, label: 'Realisasi Anggaran', icon: <LuWallet className="w-4 h-4" />, count: realisasiAnggaran.length },
    { id: 'kendala' as TabType, label: 'Kendala', icon: <LuTriangleAlert className="w-4 h-4" />, count: kendala.length },
    { id: 'verifikasi' as TabType, label: 'Verifikasi Kualitas Output', icon: <LuCircleCheck className="w-4 h-4" />, count: kegiatan?.jenis_validasi === 'kuantitas' ? validasiKuantitas.length : dokumenOutput.length },
    { id: 'waktu' as TabType, label: 'Waktu Penyelesaian', icon: <LuClock className="w-4 h-4" /> },
    { id: 'catatan' as TabType, label: 'Evaluasi', icon: <LuMessageSquare className="w-4 h-4" />, count: evaluasiList.length },
  ];

  // Helper functions for dokumen
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (tipeFile: string): React.ReactNode => {
    if (tipeFile.includes('pdf')) return <LuFileText className="w-5 h-5 text-red-500" />;
    if (tipeFile.includes('word') || tipeFile.includes('document')) return <LuFileText className="w-5 h-5 text-blue-500" />;
    if (tipeFile.includes('excel') || tipeFile.includes('spreadsheet')) return <LuFileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (tipeFile.includes('image')) return <LuImage className="w-5 h-5 text-purple-500" />;
    return <LuPaperclip className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/pelaksana/kegiatan" className="hover:text-blue-600">Kegiatan</Link>
            <span>/</span>
            <span className="text-gray-900">Detail</span>
          </div>

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
                  <LuSquarePen className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                  <LuTrash2 className="w-4 h-4" />
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
              {/* Multiple Mitra Display */}
              {kegiatan.mitra_list && kegiatan.mitra_list.length > 0 && (
                <div className="col-span-2 md:col-span-4">
                  <span className="text-gray-500">Mitra ({kegiatan.total_mitra}):</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {kegiatan.mitra_list.map((mitra) => (
                      <span key={mitra.id} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-sm border border-blue-200">
                        <LuUser className="w-3.5 h-3.5" />
                        {mitra.nama}
                        {mitra.posisi && <span className="text-blue-500">- {mitra.posisi}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabel KRO */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <LuFileText className="w-4 h-4 text-blue-600" />
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
                            <LuCheck className="w-3 h-3 mr-1" />
                            Terkait
                          </span>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center">
                          <div className="flex flex-col items-center text-gray-500">
                            <LuFileText className="w-8 h-8 text-gray-300 mb-2" />
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

            {/* Status Pengajuan & Catatan Approval */}
            {kegiatan.status_pengajuan && kegiatan.status_pengajuan !== 'draft' && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <LuShieldCheck className="w-4 h-4 text-purple-600" />
                  Status Pengajuan & Catatan Approval
                </h3>
                
                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    kegiatan.status_pengajuan === 'disetujui' ? 'bg-green-100 text-green-800' :
                    kegiatan.status_pengajuan === 'ditolak' ? 'bg-red-100 text-red-800' :
                    kegiatan.status_pengajuan === 'review_kepala' ? 'bg-purple-100 text-purple-800' :
                    kegiatan.status_pengajuan === 'review_ppk' ? 'bg-orange-100 text-orange-800' :
                    kegiatan.status_pengajuan === 'review_koordinator' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {kegiatan.status_pengajuan === 'disetujui' ? <><LuCircleCheck className="w-4 h-4 mr-1 inline" /> Disetujui</> :
                     kegiatan.status_pengajuan === 'ditolak' ? <><LuCircleX className="w-4 h-4 mr-1 inline" /> Ditolak</> :
                     kegiatan.status_pengajuan === 'review_kepala' ? <><LuHourglass className="w-4 h-4 mr-1 inline" /> Menunggu Persetujuan Pimpinan</> :
                     kegiatan.status_pengajuan === 'review_ppk' ? <><LuHourglass className="w-4 h-4 mr-1 inline" /> Menunggu Persetujuan PPK</> :
                     kegiatan.status_pengajuan === 'review_koordinator' ? <><LuHourglass className="w-4 h-4 mr-1 inline" /> Menunggu Persetujuan Koordinator</> :
                     kegiatan.status_pengajuan}
                  </span>
                  {kegiatan.tanggal_pengajuan && (
                    <span className="ml-3 text-sm text-gray-500">
                      Diajukan: {formatDate(kegiatan.tanggal_pengajuan)}
                    </span>
                  )}
                </div>

                {/* Timeline Catatan */}
                <div className="space-y-4">
                  {/* Catatan Koordinator */}
                  {(kegiatan.catatan_koordinator || kegiatan.tanggal_approval_koordinator) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <LuUser className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-blue-900">Koordinator</span>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Tahap 1</span>
                          </div>
                          {kegiatan.tanggal_approval_koordinator && (
                            <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                              <LuCalendar className="w-3 h-3" /> {formatDate(kegiatan.tanggal_approval_koordinator)}
                            </p>
                          )}
                          {kegiatan.catatan_koordinator ? (
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{kegiatan.catatan_koordinator}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-blue-600 italic">Tidak ada catatan</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Catatan PPK */}
                  {(kegiatan.catatan_ppk || kegiatan.tanggal_approval_ppk) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <LuClipboardList className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-orange-900">PPK (Pejabat Pembuat Komitmen)</span>
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">Tahap 2</span>
                          </div>
                          {kegiatan.tanggal_approval_ppk && (
                            <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                              <LuCalendar className="w-3 h-3" /> {formatDate(kegiatan.tanggal_approval_ppk)}
                            </p>
                          )}
                          {kegiatan.catatan_ppk ? (
                            <div className="bg-white rounded-lg p-3 border border-orange-100">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{kegiatan.catatan_ppk}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-orange-600 italic">Tidak ada catatan</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Catatan Pimpinan/Kepala */}
                  {(kegiatan.catatan_kepala || kegiatan.tanggal_approval_kepala) && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <LuBriefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-purple-900">Pimpinan / Kepala</span>
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Tahap 3 (Final)</span>
                          </div>
                          {kegiatan.tanggal_approval_kepala && (
                            <p className="text-xs text-purple-600 mb-2 flex items-center gap-1">
                              <LuCalendar className="w-3 h-3" /> {formatDate(kegiatan.tanggal_approval_kepala)}
                            </p>
                          )}
                          {kegiatan.catatan_kepala ? (
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{kegiatan.catatan_kepala}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-purple-600 italic">Tidak ada catatan</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Jika belum ada catatan sama sekali */}
                  {!kegiatan.catatan_koordinator && !kegiatan.tanggal_approval_koordinator &&
                   !kegiatan.catatan_ppk && !kegiatan.tanggal_approval_ppk &&
                   !kegiatan.catatan_kepala && !kegiatan.tanggal_approval_kepala && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <LuCircleAlert className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Belum ada catatan dari approver</p>
                      <p className="text-xs text-gray-400 mt-1">Catatan akan muncul setelah kegiatan diproses oleh Koordinator, PPK, atau Pimpinan</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex flex-wrap lg:flex-nowrap">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}>
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
                        ? Math.round(validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0))
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
                        ? Math.round(validasiKuantitas.filter(v => v.status === 'menunggu').reduce((sum, v) => sum + Number(v.jumlah_output), 0))
                        : dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.minta_validasi === 1 && d.status_final !== 'disahkan' && d.status_final !== 'ditolak').length}
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
                          ? (Math.round((validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0) / kegiatan.target_output) * 100 * 100) / 100).toFixed(2)
                          : (Math.round((dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length / kegiatan.target_output) * 100 * 100) / 100).toFixed(2)
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
                        ? `${Math.round(validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0))} / ${Math.round(kegiatan?.target_output || 0)} ${kegiatan?.satuan_output} tervalidasi`
                        : `${dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length} / ${Math.round(kegiatan?.target_output || 0)} tervalidasi`}
                    </span>
                  </div>
                  {(() => {
                    const progres = kegiatan?.target_output && kegiatan.target_output > 0 
                      ? kegiatan?.jenis_validasi === 'kuantitas'
                        ? Math.min((validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0) / kegiatan.target_output) * 100, 100)
                        : Math.min((dokumenOutput.filter(d => d.tipe_dokumen === 'final' && d.status_final === 'disahkan').length / kegiatan.target_output) * 100, 100)
                      : 0;
                    return (
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full transition-all duration-500 ${progres >= 70 ? 'bg-green-500' : progres >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${progres}%` }}
                        ></div>
                      </div>
                    );
                  })()}
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
                {progres.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada data progres</p> : (
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
                            <td className="px-4 py-3 font-medium">{p.capaian_output}%</td>
                            <td className="px-4 py-3">{p.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verifikasi' && (
              <div>
                {/* Conditional rendering based on jenis_validasi */}
                {(kegiatan?.jenis_validasi === 'kuantitas') ? (
                  /* ==================== KUANTITAS VALIDATION UI ==================== */
                  <div>
                    {/* Kuantitas Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-gray-600">Target Output</p>
                        <p className="text-2xl font-bold text-gray-900">{Math.round(kegiatan?.target_output || 0)}</p>
                        <p className="text-sm text-gray-500">{kegiatan?.satuan_output}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-sm text-gray-600">Tervalidasi</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round(validasiKuantitas.filter(v => v.status_pimpinan === 'valid').reduce((sum, v) => sum + Number(v.jumlah_output), 0))}
                        </p>
                        <p className="text-sm text-gray-500">{kegiatan?.satuan_output} disahkan</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-xl">
                        <p className="text-sm text-gray-600">Menunggu Validasi</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {Math.round(validasiKuantitas.filter(v => v.status_kesubag === 'pending' || v.status_pimpinan === 'pending').reduce((sum, v) => sum + Number(v.jumlah_output), 0))}
                        </p>
                        <p className="text-sm text-gray-500">{kegiatan?.satuan_output} diproses</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-sm text-gray-600">Progres</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {kegiatan?.target_output && kegiatan.target_output > 0
                            ? (Math.round((validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0) / kegiatan.target_output) * 100 * 100) / 100).toFixed(2)
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
                          {Math.round(validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0))} / {Math.round(kegiatan?.target_output || 0)} {kegiatan?.satuan_output}
                        </span>
                      </div>
                      {(() => {
                        const progres = kegiatan?.target_output && kegiatan.target_output > 0 
                          ? Math.min((validasiKuantitas.filter(v => v.status === 'disahkan').reduce((sum, v) => sum + Number(v.jumlah_output), 0) / kegiatan.target_output) * 100, 100)
                          : 0;
                        return (
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className={`h-4 rounded-full transition-all duration-500 ${progres >= 70 ? 'bg-green-500' : progres >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${progres}%` }}
                            ></div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Kuantitas List */}
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><LuClipboardList className="w-5 h-5" /> Riwayat Validasi Kuantitas</h3>
                    {validasiKuantitas.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <div className="text-4xl mb-2"><LuChartBar className="w-10 h-10 mx-auto text-gray-400" /></div>
                        <p className="text-gray-500">Belum ada data kuantitas yang disubmit</p>
                        <p className="text-sm text-gray-400 mt-1">Gunakan halaman Update untuk menambah data output</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {validasiKuantitas.map((val) => {
                          const isDisahkan = val.status_pimpinan === 'valid';
                          const isDitolak = val.status_kesubag === 'tidak_valid' || val.status_pimpinan === 'tidak_valid';
                          
                          return (
                            <div key={val.id} className={`p-4 rounded-xl border ${isDisahkan ? 'bg-green-50 border-green-200' : isDitolak ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDisahkan ? 'bg-green-100' : isDitolak ? 'bg-red-100' : 'bg-blue-100'}`}>
                                    {isDisahkan ? <LuCircleCheck className="w-5 h-5 text-green-600" /> : isDitolak ? <LuCircleX className="w-5 h-5 text-red-600" /> : <LuChartBar className="w-5 h-5 text-blue-600" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-lg">
                                      {Math.round(Number(val.jumlah_output))} {kegiatan?.satuan_output}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatDate(val.created_at)}
                                    </p>
                                    {val.keterangan && (
                                      <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded flex items-start gap-1">
                                        <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> {val.keterangan}
                                      </p>
                                    )}
                                    
                                    {/* Validation Status Flow */}
                                    <div className="mt-3 p-3 bg-white rounded-lg border">
                                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><LuCircleCheck className="w-3 h-3" /> Alur Validasi:</p>
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                          val.status_kesubag === 'valid' ? 'bg-green-100 text-green-700' :
                                          val.status_kesubag === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          <span>Koordinator:</span>
                                          <span className="font-medium flex items-center gap-0.5">
                                            {val.status_kesubag === 'valid' ? <><LuCircleCheck className="w-3 h-3" /> Valid</> :
                                             val.status_kesubag === 'tidak_valid' ? <><LuCircleX className="w-3 h-3" /> Ditolak</> : <><LuHourglass className="w-3 h-3" /> Menunggu</>}
                                          </span>
                                        </div>
                                        {val.status_kesubag === 'valid' && (
                                          <>
                                            <span className="text-gray-400">→</span>
                                            <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                              val.status_pimpinan === 'valid' ? 'bg-green-100 text-green-700' :
                                              val.status_pimpinan === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                                              'bg-yellow-100 text-yellow-700'
                                            }`}>
                                              <span>Pimpinan:</span>
                                              <span className="font-medium flex items-center gap-0.5">
                                                {val.status_pimpinan === 'valid' ? <><LuCircleCheck className="w-3 h-3" /> Valid</> :
                                                 val.status_pimpinan === 'tidak_valid' ? <><LuCircleX className="w-3 h-3" /> Ditolak</> : <><LuHourglass className="w-3 h-3" /> Menunggu</>}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                        {isDisahkan && (
                                          <>
                                            <span className="text-gray-400">→</span>
                                            <span className="px-2 py-1 bg-green-600 text-white rounded font-medium flex items-center gap-1"><LuTrophy className="w-3 h-3" /> Disahkan</span>
                                          </>
                                        )}
                                      </div>
                                      {val.feedback_kesubag && (
                                        <p className="mt-2 text-sm text-teal-700 bg-teal-50 p-2 rounded flex items-start gap-1">
                                          <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> <strong>Koordinator:</strong> {val.feedback_kesubag}
                                        </p>
                                      )}
                                      {val.feedback_pimpinan && (
                                        <p className="mt-2 text-sm text-purple-700 bg-purple-50 p-2 rounded flex items-start gap-1">
                                          <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> <strong>Pimpinan:</strong> {val.feedback_pimpinan}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                  {val.bukti_path && (
                                    <a
                                      href={val.bukti_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
                                    >
                                      Lihat Bukti
                                    </a>
                                  )}
                                  {val.status_kesubag === 'pending' && (
                                    <button
                                      onClick={() => handleDeleteKuantitas(val.id)}
                                      className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                                    >
                                      <LuTrash2 className="w-4 h-4" /> Hapus
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Statistik Kuantitas */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-blue-600">{validasiKuantitas.length}</div>
                        <div className="text-sm text-gray-600">Total Submit</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {validasiKuantitas.filter(v => v.status_kesubag === 'pending').length}
                        </div>
                        <div className="text-sm text-gray-600">Menunggu</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {validasiKuantitas.filter(v => v.status_pimpinan === 'valid').length}
                        </div>
                        <div className="text-sm text-gray-600">Tervalidasi</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {validasiKuantitas.filter(v => v.status_kesubag === 'tidak_valid' || v.status_pimpinan === 'tidak_valid').length}
                        </div>
                        <div className="text-sm text-gray-600">Ditolak</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ==================== DOKUMEN VALIDATION UI ==================== */
                  <div>
                {/* Status Verifikasi */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">Status Verifikasi</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium ${
                        statusVerifikasiDokumen.status === 'valid' ? 'bg-green-100 text-green-800' :
                        statusVerifikasiDokumen.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                        statusVerifikasiDokumen.status === 'menunggu' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statusVerifikasiDokumen.status === 'valid' && <LuCircleCheck className="w-4 h-4" />}
                        {statusVerifikasiDokumen.status === 'ditolak' && <LuCircleX className="w-4 h-4" />}
                        {statusVerifikasiDokumen.status === 'menunggu' && <LuHourglass className="w-4 h-4" />}
                        {statusVerifikasiDokumen.status === 'belum_verifikasi' && <LuClock className="w-4 h-4" />}
                        {statusVerifikasiDokumen.status === 'valid' ? 'Semua Valid' :
                         statusVerifikasiDokumen.status === 'ditolak' ? 'Ada yang Perlu Revisi' :
                         statusVerifikasiDokumen.status === 'menunggu' ? 'Menunggu Validasi' :
                         'Belum Ada Dokumen'}
                      </span>
                      {statusVerifikasiDokumen.target > 0 && (
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {statusVerifikasiDokumen.disahkan}/{statusVerifikasiDokumen.target} Disahkan
                        </span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    {statusVerifikasiDokumen.target > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            statusVerifikasiDokumen.status === 'valid' ? 'bg-green-500' :
                            statusVerifikasiDokumen.status === 'ditolak' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min((statusVerifikasiDokumen.disahkan / statusVerifikasiDokumen.target) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daftar Dokumen Output */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Dokumen Output</h3>
                  {dokumenOutput.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <LuFolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Belum ada dokumen yang diupload</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dokumenOutput.map((doc) => {
                        const isDraft = doc.tipe_dokumen === 'draft';
                        const isFinal = doc.tipe_dokumen === 'final';
                        const mintaValidasi = doc.minta_validasi === 1;
                        const isDisahkan = doc.status_final === 'disahkan';
                        
                        return (
                          <div key={doc.id} className={`p-4 rounded-xl border ${isDisahkan ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDisahkan ? 'bg-green-100' : 'bg-blue-100'}`}>
                                  {isDisahkan ? <LuCircleCheck className="w-5 h-5 text-green-600" /> : <LuFileText className="w-5 h-5 text-blue-600" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{doc.nama_file}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                                    <span>{formatDate(doc.uploaded_at)}</span>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      isFinal ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {isFinal ? 'Final' : 'Draft'}
                                    </span>
                                    {isDisahkan && (
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white flex items-center gap-1">
                                        <LuTrophy className="w-3 h-3" /> DISAHKAN
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Validation Status Flow for Final Documents */}
                                  {isFinal && mintaValidasi && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border">
                                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><LuCircleCheck className="w-3 h-3" /> Alur Validasi Dokumen Final:</p>
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {/* Koordinator Validation Status */}
                                        <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                          doc.validasi_kesubag === 'valid' ? 'bg-green-100 text-green-700' :
                                          doc.validasi_kesubag === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          <span>Koordinator:</span>
                                          <span className="font-medium flex items-center gap-0.5">
                                            {doc.validasi_kesubag === 'valid' ? <><LuCircleCheck className="w-3 h-3" /> Valid</> :
                                             doc.validasi_kesubag === 'tidak_valid' ? <><LuCircleX className="w-3 h-3" /> Revisi</> : <><LuHourglass className="w-3 h-3" /> Menunggu</>}
                                          </span>
                                        </div>
                                        {doc.validasi_kesubag === 'valid' && (
                                          <>
                                            <span className="text-gray-400">→</span>
                                            {/* Pimpinan Validation Status */}
                                            <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                              doc.validasi_pimpinan === 'valid' ? 'bg-green-100 text-green-700' :
                                              doc.validasi_pimpinan === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                                              'bg-yellow-100 text-yellow-700'
                                            }`}>
                                              <span>Pimpinan:</span>
                                              <span className="font-medium flex items-center gap-0.5">
                                                {doc.validasi_pimpinan === 'valid' ? <><LuCircleCheck className="w-3 h-3" /> Valid</> :
                                                 doc.validasi_pimpinan === 'tidak_valid' ? <><LuCircleX className="w-3 h-3" /> Revisi</> : <><LuHourglass className="w-3 h-3" /> Menunggu</>}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                        {isDisahkan && (
                                          <>
                                            <span className="text-gray-400">→</span>
                                            <span className="px-2 py-1 bg-green-600 text-white rounded font-medium flex items-center gap-1"><LuTrophy className="w-3 h-3" /> Disahkan</span>
                                          </>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                                        {doc.validasi_kesubag === 'tidak_valid'
                                          ? <><LuTriangleAlert className="w-3 h-3 text-yellow-500" /> Dokumen ditolak koordinator, silakan upload ulang dokumen perbaikan</>
                                          : doc.validasi_kesubag === 'valid' && doc.validasi_pimpinan === 'tidak_valid'
                                          ? <><LuTriangleAlert className="w-3 h-3 text-yellow-500" /> Dokumen ditolak pimpinan, silakan upload ulang dokumen perbaikan</>
                                          : doc.validasi_kesubag === 'valid' && doc.validasi_pimpinan === 'valid'
                                          ? <><LuTrophy className="w-3 h-3 text-green-600" /> Dokumen telah disahkan!</>
                                          : doc.validasi_kesubag === 'valid'
                                          ? <><LuHourglass className="w-3 h-3 text-gray-500" /> Menunggu validasi dari pimpinan</>
                                          : <><LuHourglass className="w-3 h-3 text-gray-500" /> Menunggu validasi dari koordinator</>}
                                      </p>
                                      {doc.validasi_feedback_kesubag && (
                                        <p className="mt-2 text-sm text-teal-700 bg-teal-50 p-2 rounded flex items-start gap-1">
                                          <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> <strong>Koordinator:</strong> {doc.validasi_feedback_kesubag}
                                        </p>
                                      )}
                                      {doc.validasi_feedback_pimpinan && (
                                        <p className="mt-2 text-sm text-purple-700 bg-purple-50 p-2 rounded flex items-start gap-1">
                                          <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> <strong>Pimpinan:</strong> {doc.validasi_feedback_pimpinan}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Final document not yet requested validation */}
                                  {isFinal && !mintaValidasi && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><LuUpload className="w-3 h-3" /> Belum Diminta Validasi</p>
                                      <p className="text-xs text-blue-600">
                                        Klik tombol "Minta Validasi" untuk mengajukan dokumen ini ke koordinator dan pimpinan untuk divalidasi.
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Draft Review Status */}
                                  {isDraft && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border">
                                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><LuFilePen className="w-3 h-3" /> Alur Review Draft:</p>
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                          doc.draft_status_kesubag === 'diterima' ? 'bg-green-100 text-green-700' :
                                          doc.draft_status_kesubag === 'ditolak' ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          <span>Koordinator:</span>
                                          <span className="font-medium flex items-center gap-0.5">
                                            {doc.draft_status_kesubag === 'diterima' ? <><LuCircleCheck className="w-3 h-3" /> Diterima</> :
                                             doc.draft_status_kesubag === 'ditolak' ? <><LuCircleX className="w-3 h-3" /> Revisi</> : <><LuHourglass className="w-3 h-3" /> Menunggu</>}
                                          </span>
                                        </div>
                                        {doc.draft_status_kesubag === 'diterima' && (
                                          <>
                                            <span className="text-gray-400">→</span>
                                            <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                                              doc.draft_feedback_pimpinan ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                              <span>Pimpinan:</span>
                                              <span className="font-medium flex items-center gap-0.5">
                                                {doc.draft_feedback_pimpinan ? <><LuCircleCheck className="w-3 h-3" /> Reviewed</> : <><LuHourglass className="w-3 h-3" /> Menunggu</>}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                                        {doc.draft_status_kesubag === 'ditolak' 
                                          ? <><LuTriangleAlert className="w-3 h-3 text-yellow-500" /> Draft ditolak, silakan upload ulang dokumen perbaikan</>
                                          : doc.draft_status_kesubag === 'diterima'
                                          ? <><LuCircleCheck className="w-3 h-3 text-green-500" /> Draft diterima koordinator, menunggu review pimpinan</>
                                          : <><LuHourglass className="w-3 h-3 text-gray-500" /> Draft sedang direview oleh koordinator</>}
                                      </p>
                                      {doc.draft_feedback_kesubag && (
                                        <p className="mt-2 text-sm text-teal-700 bg-teal-50 p-2 rounded flex items-start gap-1">
                                          <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> <strong>Koordinator:</strong> {doc.draft_feedback_kesubag}
                                        </p>
                                      )}
                                      {doc.draft_feedback_pimpinan && (
                                        <p className="mt-2 text-sm text-purple-700 bg-purple-50 p-2 rounded flex items-start gap-1">
                                          <LuMessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /> <strong>Pimpinan:</strong> {doc.draft_feedback_pimpinan}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                <a
                                  href={doc.path_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
                                >
                                  Lihat
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Statistik Dokumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{dokumenOutput.length}</div>
                    <div className="text-sm text-gray-600">Total Dokumen</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {dokumenOutput.filter(d => d.tipe_dokumen === 'draft').length}
                    </div>
                    <div className="text-sm text-gray-600">Draft</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dokumenOutput.filter(d => d.tipe_dokumen === 'final').length}
                    </div>
                    <div className="text-sm text-gray-600">Final</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {dokumenOutput.filter(d => d.status_final === 'disahkan').length}
                    </div>
                    <div className="text-sm text-gray-600">Disahkan</div>
                  </div>
                </div>
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
                                      {tl.status === 'done' ? 'Selesai' : tl.status === 'in_progress' ? 'Proses' : 'Menunggu'}
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

            {/* Tab: Waktu Penyelesaian */}
            {activeTab === 'waktu' && (
              <div className="space-y-6">
                {/* Info Waktu Kegiatan */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LuClock className="w-5 h-5 text-purple-600" /> Informasi Waktu Kegiatan
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
                        {kegiatan.tanggal_realisasi_selesai ? formatDate(kegiatan.tanggal_realisasi_selesai) : 'Belum selesai'}
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
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      {!kegiatan.tanggal_selesai 
                        ? 'Target tanggal selesai belum ditentukan'
                        : !kegiatan.tanggal_realisasi_selesai && new Date() > new Date(kegiatan.tanggal_selesai)
                          ? <><LuTriangleAlert className="w-3 h-3 text-yellow-500" /> Deadline sudah lewat dan kegiatan belum selesai</>
                          : !kegiatan.tanggal_realisasi_selesai
                            ? <><LuClipboardList className="w-3 h-3 text-blue-500" /> Kegiatan masih dalam proses</>
                            : new Date(kegiatan.tanggal_realisasi_selesai) <= new Date(kegiatan.tanggal_selesai)
                              ? <><LuCircleCheck className="w-3 h-3 text-green-500" /> Selesai tepat waktu</>
                              : <><LuTriangleAlert className="w-3 h-3 text-yellow-500" /> Selesai melewati target waktu</>}
                    </p>
                  </div>
                </div>

                {/* Info Output */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LuPackage className="w-5 h-5 text-blue-600" /> Informasi Output
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Target Output</p>
                      <p className="text-lg font-bold text-gray-900">
                        {Math.round(kegiatan.target_output)} {kegiatan.satuan_output}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Output Realisasi</p>
                      <p className="text-lg font-bold text-blue-600">
                        {Math.round(kegiatan.output_realisasi || 0)} {kegiatan.satuan_output}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Capaian Output</p>
                      <p className="text-lg font-bold text-blue-600">
                        {kegiatan.target_output > 0 
                          ? Math.min(((kegiatan.output_realisasi || 0) / kegiatan.target_output) * 100, 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Panduan Pengisian */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <LuInfo className="w-5 h-5" />
                    Panduan Perhitungan Ketepatan Waktu
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1.5 ml-7">
                    <li><strong>Saat kegiatan belum selesai:</strong> Skor dihitung prorata berdasarkan waktu yang sudah berjalan</li>
                    <li><strong>Selesai tepat waktu:</strong> Skor 100%</li>
                    <li><strong>Terlambat 1-7 hari:</strong> Skor 80%</li>
                    <li><strong>Terlambat 8-14 hari:</strong> Skor 60%</li>
                    <li><strong>Terlambat 15-30 hari:</strong> Skor 40%</li>
                    <li><strong>Terlambat lebih dari 30 hari:</strong> Skor 20%</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Evaluasi Kinerja */}
            {activeTab === 'evaluasi' && summary && (
              <div className="space-y-6">
                {/* Skor Kinerja Utama - Compact */}
                <div className={`rounded-lg p-5 ${
                  summary?.status_kinerja === 'Sukses' ? 'bg-green-50 border border-green-200' :
                  summary?.status_kinerja === 'Perlu Perhatian' ? 'bg-yellow-50 border border-yellow-200' :
                  summary?.status_kinerja === 'Bermasalah' ? 'bg-red-50 border border-red-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        summary?.status_kinerja === 'Sukses' ? 'bg-green-100' :
                        summary?.status_kinerja === 'Perlu Perhatian' ? 'bg-yellow-100' :
                        summary?.status_kinerja === 'Bermasalah' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <LuTrophy className={`w-6 h-6 ${
                          summary?.status_kinerja === 'Sukses' ? 'text-green-600' :
                          summary?.status_kinerja === 'Perlu Perhatian' ? 'text-yellow-600' :
                          summary?.status_kinerja === 'Bermasalah' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Skor Kinerja</h3>
                        <span className={`text-sm ${
                          summary?.status_kinerja === 'Sukses' ? 'text-green-700' :
                          summary?.status_kinerja === 'Perlu Perhatian' ? 'text-yellow-700' :
                          summary?.status_kinerja === 'Bermasalah' ? 'text-red-700' : 'text-gray-600'
                        }`}>{summary?.status_kinerja || 'Belum Dinilai'}</span>
                      </div>
                    </div>
                    <p className={`text-4xl font-bold ${
                      (summary?.skor_kinerja || 0) >= 80 ? 'text-green-600' :
                      (summary?.skor_kinerja || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{summary?.skor_kinerja || 0}</p>
                  </div>
                </div>

                {/* Breakdown Indikator - Compact Table */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <LuChartBar className="w-4 h-4 text-indigo-600" /> Indikator Kinerja
                    </h3>
                  </div>
                  <div className="divide-y">
                    {(() => {
                      const getBobot = (kode: string) => {
                        const config = indikatorConfig.find(i => i.kode.toLowerCase() === kode.toLowerCase());
                        return config ? config.bobot : 0;
                      };

                      const items = [
                        { kode: 'capaian_output', label: 'Capaian Output', value: summary.indikator.capaian_output, color: 'blue', icon: <LuTarget className="w-4 h-4" /> },
                        { kode: 'ketepatan_waktu', label: 'Ketepatan Waktu', value: summary.indikator.ketepatan_waktu, color: 'green', icon: <LuClock className="w-4 h-4" /> },
                        { kode: 'serapan_anggaran', label: 'Serapan Anggaran', value: summary.indikator.serapan_anggaran, color: 'yellow', icon: <LuWallet className="w-4 h-4" /> },
                        { kode: 'kualitas_output', label: 'Kualitas Output', value: summary.indikator.kualitas_output, color: 'purple', icon: <LuCircleCheck className="w-4 h-4" /> },
                        { kode: 'penyelesaian_kendala', label: 'Penyelesaian Kendala', value: summary.indikator.penyelesaian_kendala, color: 'orange', icon: <LuWrench className="w-4 h-4" /> },
                      ].map(item => ({ ...item, bobot: getBobot(item.kode) }));

                      return items.map((item, i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-4">
                          <div className={`p-1.5 rounded ${
                            item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                            item.color === 'green' ? 'bg-green-100 text-green-600' :
                            item.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                            item.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                          }`}>{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              <span className="text-sm font-bold text-gray-700">{item.value.toFixed(0)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${
                                item.color === 'blue' ? 'bg-blue-500' :
                                item.color === 'green' ? 'bg-green-500' :
                                item.color === 'yellow' ? 'bg-yellow-500' :
                                item.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                              }`} style={{ width: `${Math.min(item.value, 100)}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{item.bobot}%</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Deviasi - Compact */}
                {summary.deviasi && (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <LuChartNoAxesCombined className="w-4 h-4 text-blue-600" /> Analisis Deviasi
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 divide-x">
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Output</p>
                        <p className={`text-lg font-bold ${summary.deviasi.output >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {summary.deviasi.output >= 0 ? '+' : ''}{summary.deviasi.output}
                        </p>
                        <p className="text-xs text-gray-400">{kegiatan.satuan_output}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Waktu</p>
                        <p className={`text-lg font-bold ${summary.deviasi.waktu >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {summary.deviasi.waktu >= 0 ? summary.deviasi.waktu : Math.abs(summary.deviasi.waktu)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {kegiatan.tanggal_realisasi_selesai 
                            ? (summary.deviasi.waktu >= 0 ? 'hari lebih awal' : 'hari terlambat')
                            : (summary.deviasi.waktu >= 0 ? 'hari tersisa' : 'hari terlambat')}
                        </p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Anggaran</p>
                        <p className={`text-lg font-bold ${
                          summary.deviasi.anggaran <= 0 ? 'text-green-600' : 
                          summary.deviasi.anggaran <= 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {summary.deviasi.anggaran >= 0 ? '+' : ''}{summary.deviasi.anggaran.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-400">dari pagu</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Kendala - Compact */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <LuTriangleAlert className="w-4 h-4 text-orange-500" /> Status Kendala
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Penyelesaian</span>
                          <span className="font-medium">
                            {summary.kendala_resolved}/{summary.total_kendala} kendala
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${summary.total_kendala > 0 ? (summary.kendala_resolved / summary.total_kendala * 100) : 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-700">
                          {summary.total_kendala > 0 ? Math.round(summary.kendala_resolved / summary.total_kendala * 100) : 100}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Threshold Info - Inline */}
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span className="text-gray-600">≥80 Sukses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span className="text-gray-600">60-79 Perlu Perhatian</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span className="text-gray-600">&lt;60 Bermasalah</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Tab: Evaluasi */}
            {activeTab === 'catatan' && (
              <div>
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Evaluasi</h3>
                  <p className="text-sm text-gray-600">Evaluasi, arahan, dan rekomendasi dari pimpinan dan koordinator untuk kegiatan ini.</p>
                </div>

                {evaluasiList.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <LuScrollText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Belum ada evaluasi</p>
                    <p className="text-sm text-gray-400">Evaluasi akan muncul di sini ketika pimpinan atau koordinator memberikan evaluasi</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evaluasiList.map((ev) => (
                      <div key={ev.id} className={`p-5 rounded-xl border-l-4 ${
                        ev.jenis_evaluasi === 'arahan' 
                          ? 'bg-blue-50 border-blue-500' 
                          : ev.jenis_evaluasi === 'rekomendasi'
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-400'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              ev.jenis_evaluasi === 'arahan' 
                                ? 'bg-blue-100 text-blue-700' 
                                : ev.jenis_evaluasi === 'rekomendasi'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ev.jenis_evaluasi === 'arahan' ? <><LuPin className="w-3 h-3 mr-0.5 inline" /> Arahan</> :
                               ev.jenis_evaluasi === 'rekomendasi' ? <><LuLightbulb className="w-3 h-3 mr-0.5 inline" /> Rekomendasi</> :
                               <><LuFilePen className="w-3 h-3 mr-0.5 inline" /> Catatan</>}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ev.role_pemberi === 'pimpinan' 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {ev.role_pemberi === 'pimpinan' ? 'Pimpinan' : 'Koordinator'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(ev.created_at)}
                          </span>
                        </div>
                        
                        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {ev.isi}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                              ev.role_pemberi === 'pimpinan' 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                                : 'bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}>
                              <span className="text-white font-semibold text-sm">
                                {ev.pemberi_nama?.charAt(0)?.toUpperCase() || (ev.role_pemberi === 'pimpinan' ? 'P' : 'K')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {ev.pemberi_nama || (ev.role_pemberi === 'pimpinan' ? 'Pimpinan' : 'Koordinator')}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <LuShieldCheck className="w-3 h-3" />
                                {ev.role_pemberi === 'pimpinan' ? 'Pimpinan' : 'Koordinator Tim'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            Diberikan pada {formatDate(ev.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {evaluasiList.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-blue-800 mb-3">Ringkasan Catatan</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                          {evaluasiList.filter(e => e.role_pemberi === 'pimpinan').length}
                        </p>
                        <p className="text-xs text-gray-500">Dari Pimpinan</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          {evaluasiList.filter(e => e.role_pemberi === 'kesubag').length}
                        </p>
                        <p className="text-xs text-gray-500">Dari Koordinator</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-700">
                          {evaluasiList.filter(e => e.jenis_evaluasi === 'catatan').length}
                        </p>
                        <p className="text-xs text-gray-500">Catatan</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {evaluasiList.filter(e => e.jenis_evaluasi === 'arahan').length}
                        </p>
                        <p className="text-xs text-gray-500">Arahan</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {evaluasiList.filter(e => e.jenis_evaluasi === 'rekomendasi').length}
                        </p>
                        <p className="text-xs text-gray-500">Rekomendasi</p>
                      </div>
                    </div>
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
                  <LuSquarePen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Edit Kegiatan</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowEditModal(false); setError(''); setSuccess(''); }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
                  <div className="p-1 bg-green-100 rounded-full">
                    <LuCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium">{success}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                  <div className="p-1 bg-red-100 rounded-full">
                    <LuCircleAlert className="w-5 h-5 text-red-600" />
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
                      <option value="publikasi">Publikasi</option>
                      <option value="layanan">Layanan</option>
                      <option value="wilayah">Wilayah</option>
                      <option value="data">Data</option>
                      <option value="peta">Peta</option>
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

                {/* KRO with Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    KRO <span className="text-xs text-gray-400 font-normal">(Klasifikasi Rincian Output)</span>
                  </label>

                  {/* Selected KRO Display */}
                  {editSelectedKRO ? (
                    <div className="border border-green-300 bg-green-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-green-100 rounded">
                            <LuFileText className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {editSelectedKRO.kode}
                              </span>
                              <LuCheck className="w-3 h-3 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1">{editSelectedKRO.nama}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleEditClearKRO}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Hapus pilihan"
                        >
                          <LuX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* KRO Search Dropdown */
                    <div className="relative" ref={editKroDropdownRef}>
                      <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={editKroSearch}
                          onChange={(e) => setEditKroSearch(e.target.value)}
                          onFocus={() => setShowEditKroDropdown(true)}
                          placeholder="Cari KRO berdasarkan kode atau nama..."
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* KRO Dropdown List */}
                      {showEditKroDropdown && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredEditKRO.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              {editKroSearch ? 'Tidak ada KRO yang cocok' : 'Tidak ada KRO tersedia'}
                            </div>
                          ) : (
                            filteredEditKRO.map(kro => (
                              <button
                                key={kro.id}
                                type="button"
                                onClick={() => handleEditSelectKRO(kro)}
                                className="w-full px-3 py-2.5 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="p-1 bg-blue-100 rounded">
                                    <LuFileText className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      {kro.kode}
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{kro.nama}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Multi-Select Mitra with Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mitra <span className="text-xs text-gray-400 font-normal">(Penanggung Jawab)</span>
                  </label>

                  {/* Selected Mitra Tags */}
                  {editSelectedMitra.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editSelectedMitra.map(mitra => (
                        <div
                          key={mitra.id}
                          className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1.5 rounded-lg text-sm"
                        >
                          <LuUser className="w-3.5 h-3.5" />
                          <span className="font-medium">{mitra.nama}</span>
                          {mitra.posisi && <span className="text-blue-500 text-xs">({mitra.posisi})</span>}
                          <button
                            type="button"
                            onClick={() => handleEditRemoveMitra(mitra.id)}
                            className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                          >
                            <LuX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mitra Search Input */}
                  <div className="relative" ref={editMitraDropdownRef}>
                    <div className="relative">
                      <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={editMitraSearch}
                        onChange={(e) => setEditMitraSearch(e.target.value)}
                        onFocus={() => setShowEditMitraDropdown(true)}
                        placeholder="Cari dan tambah mitra..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Mitra Dropdown List */}
                    {showEditMitraDropdown && (
                      <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredEditMitra.length === 0 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            {editMitraSearch ? 'Tidak ada mitra yang cocok' : 
                             editSelectedMitra.length === mitraList.length ? 'Semua mitra sudah dipilih' : 'Tidak ada mitra tersedia'}
                          </div>
                        ) : (
                          filteredEditMitra.map(mitra => (
                            <button
                              key={mitra.id}
                              type="button"
                              onClick={() => handleEditAddMitra(mitra)}
                              className="w-full px-3 py-2.5 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-gray-100 rounded-full">
                                  <LuUser className="w-3 h-3 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{mitra.nama}</p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {mitra.posisi && `${mitra.posisi}`}
                                    {mitra.posisi && mitra.alamat && ' • '}
                                    {mitra.alamat && `${mitra.alamat}`}
                                  </p>
                                </div>
                                <LuPlus className="w-4 h-4 text-blue-500" />
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {editSelectedMitra.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {editSelectedMitra.length} mitra dipilih
                    </p>
                  )}
                </div>

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
                        <LuLoader className="animate-spin h-4 w-4 text-white" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <LuCheck className="w-4 h-4" />
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

