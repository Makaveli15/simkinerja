'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LuClipboardCheck,
  LuSearch,
  LuFilter,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuArrowLeft,
  LuCalendar,
  LuUser,
  LuFileText,
  LuChartBar,
  LuHourglass,
  LuPaperclip
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
  skor_kinerja: number;
  status_kinerja: string;
  created_at: string;
}

interface ValidasiKuantitas {
  id: number;
  kegiatan_id: number;
  kegiatan_nama: string;
  satuan_output: string;
  target_output: number;
  pelaksana_nama: string;
  jumlah_output: number;
  bukti_path?: string;
  keterangan?: string;
  status: 'draft' | 'menunggu' | 'disahkan' | 'ditolak';
  status_kesubag: 'pending' | 'valid' | 'tidak_valid';
  created_at: string;
}

type TabType = 'kegiatan' | 'kuantitas';

export default function KoordinatorApprovalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('kegiatan');
  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [filteredKegiatan, setFilteredKegiatan] = useState<Kegiatan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  
  // Validasi Kuantitas state
  const [validasiKuantitas, setValidasiKuantitas] = useState<ValidasiKuantitas[]>([]);
  const [filteredValidasi, setFilteredValidasi] = useState<ValidasiKuantitas[]>([]);
  const [validasiStatusFilter, setValidasiStatusFilter] = useState<string>('menunggu');
  const [validasiSearchQuery, setValidasiSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchKegiatan();
    fetchValidasiKuantitas();
  }, []);

  useEffect(() => {
    filterKegiatan();
  }, [kegiatan, searchQuery, statusFilter]);

  useEffect(() => {
    filterValidasi();
  }, [validasiKuantitas, validasiSearchQuery, validasiStatusFilter]);

  const fetchKegiatan = async () => {
    try {
      const res = await fetch('/api/koordinator/kegiatan');
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan || []);
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchValidasiKuantitas = async () => {
    try {
      const res = await fetch('/api/koordinator/validasi-kuantitas');
      if (res.ok) {
        const data = await res.json();
        setValidasiKuantitas(data.validasi || []);
      }
    } catch (error) {
      console.error('Error fetching validasi kuantitas:', error);
    }
  };

  const filterValidasi = () => {
    let filtered = [...validasiKuantitas];

    if (validasiStatusFilter === 'menunggu') {
      // Menunggu validasi koordinator = status 'menunggu' DAN status_kesubag 'pending'
      filtered = filtered.filter(v => v.status === 'menunggu' && v.status_kesubag === 'pending');
    } else if (validasiStatusFilter === 'disahkan') {
      // Sudah disetujui koordinator (menunggu pimpinan atau sudah disahkan)
      filtered = filtered.filter(v => v.status_kesubag === 'valid');
    } else if (validasiStatusFilter === 'ditolak') {
      filtered = filtered.filter(v => v.status === 'ditolak');
    }
    // 'all' = tampilkan semua

    if (validasiSearchQuery) {
      filtered = filtered.filter(v =>
        v.kegiatan_nama?.toLowerCase().includes(validasiSearchQuery.toLowerCase()) ||
        v.pelaksana_nama?.toLowerCase().includes(validasiSearchQuery.toLowerCase())
      );
    }

    setFilteredValidasi(filtered);
  };

  const handleValidasiKuantitas = async (id: number, action: 'approve' | 'reject', catatan?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/koordinator/validasi-kuantitas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, catatan })
      });

      if (res.ok) {
        fetchValidasiKuantitas();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal memproses validasi');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const filterKegiatan = () => {
    let filtered = [...kegiatan];

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(k => 
        k.status_pengajuan === 'diajukan' || k.status_pengajuan === 'review_koordinator'
      );
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(k => 
        ['review_ppk', 'approved_ppk', 'review_kepala', 'disetujui'].includes(k.status_pengajuan)
      );
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(k => k.status_pengajuan === 'ditolak');
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(k =>
        k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.pelaksana_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.kro_kode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredKegiatan(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'diajukan':
      case 'review_koordinator':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <LuClock className="w-3 h-3" /> Menunggu Review
          </span>
        );
      case 'review_ppk':
      case 'approved_ppk':
      case 'review_kepala':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <LuCircleCheck className="w-3 h-3" /> Disetujui
          </span>
        );
      case 'disetujui':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
            <LuCircleCheck className="w-3 h-3" /> Final Disetujui
          </span>
        );
      case 'ditolak':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
            <LuCircleX className="w-3 h-3" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
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

  const pendingCount = kegiatan.filter(k => 
    k.status_pengajuan === 'diajukan' || k.status_pengajuan === 'review_koordinator'
  ).length;

  const pendingValidasiCount = validasiKuantitas.filter(v => v.status === 'menunggu' && v.status_kesubag === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval</h1>
          <p className="text-gray-600">Review dan setujui pengajuan dari pelaksana</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-700 font-medium text-sm">
                {pendingCount} kegiatan menunggu
              </p>
            </div>
          )}
          {pendingValidasiCount > 0 && (
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-700 font-medium text-sm">
                {pendingValidasiCount} output menunggu validasi
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('kegiatan')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'kegiatan'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LuFileText className="w-4 h-4" />
          Approval Kegiatan
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('kuantitas')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'kuantitas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
            <LuChartBar className="w-4 h-4" />
          Validasi Output Kuantitas
          {pendingValidasiCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{pendingValidasiCount}</span>
          )}
        </button>
      </div>

      {/* Tab Content: Kegiatan */}
      {activeTab === 'kegiatan' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Cari kegiatan, pelaksana, atau KRO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Menunggu ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  statusFilter === 'approved'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Disetujui
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  statusFilter === 'rejected'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Ditolak
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Kegiatan List */}
          <div className="space-y-4">
            {filteredKegiatan.length > 0 ? (
              filteredKegiatan.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{item.nama}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.kro_kode} - {item.kro_nama}
                          </p>
                        </div>
                        {getStatusBadge(item.status_pengajuan)}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <LuUser className="w-4 h-4" />
                          <span>{item.pelaksana_nama}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <LuCalendar className="w-4 h-4" />
                          <span>{formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Target Output</p>
                          <p className="font-medium text-gray-900">{item.target_output} {item.satuan_output}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Anggaran</p>
                          <p className="font-medium text-gray-900">{formatCurrency(item.anggaran_pagu)}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Skor Kinerja</p>
                          <p className="font-medium text-gray-900">{item.skor_kinerja}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      {(item.status_pengajuan === 'diajukan' || item.status_pengajuan === 'review_koordinator') && (
                        <Link
                          href={`/koordinator/approval/${item.id}`}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-center font-medium"
                        >
                          Review & Approval
                        </Link>
                      )}
                      <Link
                        href={`/koordinator/kegiatan/${item.id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-center"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <LuClipboardCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada kegiatan</h3>
                <p className="text-gray-500">
                  {statusFilter === 'pending'
                    ? 'Belum ada kegiatan yang menunggu persetujuan Anda'
                    : 'Tidak ditemukan kegiatan dengan filter yang dipilih'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab Content: Validasi Output Kuantitas */}
      {activeTab === 'kuantitas' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kegiatan atau pelaksana..."
                value={validasiSearchQuery}
                onChange={(e) => setValidasiSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setValidasiStatusFilter('menunggu')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  validasiStatusFilter === 'menunggu'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Menunggu ({pendingValidasiCount})
              </button>
              <button
                onClick={() => setValidasiStatusFilter('disahkan')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  validasiStatusFilter === 'disahkan'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Disahkan
              </button>
              <button
                onClick={() => setValidasiStatusFilter('ditolak')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  validasiStatusFilter === 'ditolak'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Ditolak
              </button>
              <button
                onClick={() => setValidasiStatusFilter('all')}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  validasiStatusFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Validasi Kuantitas List */}
          <div className="space-y-4">
            {filteredValidasi.length > 0 ? (
              filteredValidasi.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-6 hover:shadow-md transition-shadow ${
                    item.status === 'menunggu' ? 'border-yellow-200' :
                    item.status === 'disahkan' ? 'border-green-200' :
                    item.status === 'ditolak' ? 'border-red-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.kegiatan_nama}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Pelaksana: {item.pelaksana_nama}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          item.status === 'menunggu' ? 'bg-yellow-100 text-yellow-700' :
                          item.status === 'disahkan' ? 'bg-green-100 text-green-700' :
                          item.status === 'ditolak' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status === 'menunggu' ? <><LuHourglass className="w-3 h-3" /> Menunggu</> :
                           item.status === 'disahkan' ? <><LuCircleCheck className="w-3 h-3" /> Disahkan</> :
                           item.status === 'ditolak' ? <><LuCircleX className="w-3 h-3" /> Ditolak</> : item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-500">Jumlah Output</p>
                          <p className="font-bold text-blue-700">{Math.round(Number(item.jumlah_output))} {item.satuan_output}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="font-medium text-gray-900">{Math.round(Number(item.target_output))} {item.satuan_output}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Tanggal Submit</p>
                          <p className="font-medium text-gray-900">{formatDate(item.created_at)}</p>
                        </div>
                      </div>

                      {item.keterangan && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium">Keterangan:</span> {item.keterangan}
                        </p>
                      )}

                      {item.bukti_path && (
                        <a
                          href={item.bukti_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <LuPaperclip className="w-4 h-4" /> Lihat Bukti Dukung
                        </a>
                      )}
                    </div>

                    {item.status === 'menunggu' && item.status_kesubag === 'pending' && (
                      <div className="flex flex-col gap-2 lg:items-end">
                        <button
                          onClick={() => handleValidasiKuantitas(item.id, 'approve')}
                          disabled={processingId === item.id}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          <LuCircleCheck className="w-4 h-4" />
                          Setujui
                        </button>
                        <button
                          onClick={() => {
                            const catatan = prompt('Masukkan alasan penolakan:');
                            if (catatan) handleValidasiKuantitas(item.id, 'reject', catatan);
                          }}
                          disabled={processingId === item.id}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          <LuCircleX className="w-4 h-4" />
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <LuChartBar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada validasi output</h3>
                <p className="text-gray-500">
                  {validasiStatusFilter === 'menunggu'
                    ? 'Belum ada output kuantitas yang menunggu validasi'
                    : 'Tidak ditemukan data dengan filter yang dipilih'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
