'use client';

import { useState, useEffect } from 'react';
import { LuSearch, LuClipboard, LuEye, LuCheck, LuX, LuClock, LuBadgeCheck, LuBan, LuClipboardCheck, LuUser, LuMapPin, LuPhone } from 'react-icons/lu';

interface MitraItem {
  id: number;
  nama: string;
  posisi?: string;
  alamat?: string;
  no_telp?: string;
  sobat_id?: string;
}

interface Kegiatan {
  id: number;
  nama: string;
  deskripsi: string;
  tim_id: number;
  tim_nama: string;
  kro_id: number;
  kro_kode: string;
  kro_nama: string;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  total_realisasi_anggaran: number;
  status: string;
  status_pengajuan?: string;
  tanggal_pengajuan?: string;
  tanggal_approval?: string;
  catatan_approval?: string;
  pelaksana_nama?: string;
  approved_by_nama?: string;
  created_by_nama?: string;
  // Mitra info (legacy single mitra)
  mitra_id?: number;
  mitra_nama?: string;
  mitra_posisi?: string;
  mitra_alamat?: string;
  mitra_no_telp?: string;
  mitra_sobat_id?: string;
  // Multi mitra
  mitra_list?: MitraItem[];
  total_mitra?: number;
}

interface ApprovalSummary {
  review_kepala: number;
  disetujui: number;
  ditolak: number;
}

export default function ApprovalKegiatanPage() {
  const [loading, setLoading] = useState(true);
  const [approvalList, setApprovalList] = useState<Kegiatan[]>([]);
  const [approvalSummary, setApprovalSummary] = useState<ApprovalSummary>({ review_kepala: 0, disetujui: 0, ditolak: 0 });
  const [approvalFilter, setApprovalFilter] = useState<'review_kepala' | 'disetujui' | 'ditolak' | 'all'>('review_kepala');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedKegiatan, setSelectedKegiatan] = useState<Kegiatan | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    if (!value) return '-';
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
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fetch approval data
  const fetchApprovalData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pimpinan/approval?status=${approvalFilter}`);
      if (res.ok) {
        const data = await res.json();
        setApprovalList(data.data);
        setApprovalSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching approval list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalData();
  }, [approvalFilter]);

  // Handle approval action
  const handleApproval = async () => {
    if (!selectedKegiatan) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pimpinan/approval/${selectedKegiatan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalAction,
          catatan: catatan.trim() || null,
        }),
      });

      if (res.ok) {
        setShowApprovalModal(false);
        setSelectedKegiatan(null);
        setCatatan('');
        fetchApprovalData();
      } else {
        const data = await res.json();
        alert(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by search term
  const filteredApprovalList = approvalList.filter(k =>
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.tim_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.pelaksana_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusPengajuanBadge = (status: string) => {
    const styles = {
      review_kepala: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      disetujui: 'bg-green-100 text-green-800 border-green-200',
      ditolak: 'bg-red-100 text-red-800 border-red-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons = {
      review_kepala: <LuClock className="w-3 h-3" />,
      disetujui: <LuBadgeCheck className="w-3 h-3" />,
      ditolak: <LuBan className="w-3 h-3" />,
      draft: <LuClock className="w-3 h-3" />,
    };

    const labels = {
      review_kepala: 'Menunggu Persetujuan',
      disetujui: 'Disetujui',
      ditolak: 'Ditolak',
      draft: 'Draft',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.draft}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuClipboardCheck className="w-6 h-6" />
              </div>
              Approval Kegiatan
            </h1>
            <p className="text-blue-100 mt-2">Kelola persetujuan kegiatan dari pelaksana</p>
          </div>
          {approvalSummary.review_kepala > 0 && (
            <div className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-medium">
              {approvalSummary.review_kepala} kegiatan menunggu persetujuan
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setApprovalFilter('review_kepala')}
          className={`p-4 rounded-xl cursor-pointer transition-all ${
            approvalFilter === 'review_kepala' 
              ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md' 
              : 'bg-white border border-gray-200 hover:border-yellow-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Menunggu Persetujuan</p>
              <p className="text-2xl font-bold text-yellow-800">{approvalSummary.review_kepala}</p>
            </div>
            <LuClock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div 
          onClick={() => setApprovalFilter('disetujui')}
          className={`p-4 rounded-xl cursor-pointer transition-all ${
            approvalFilter === 'disetujui' 
              ? 'bg-green-100 border-2 border-green-400 shadow-md' 
              : 'bg-white border border-gray-200 hover:border-green-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Disetujui</p>
              <p className="text-2xl font-bold text-green-800">{approvalSummary.disetujui}</p>
            </div>
            <LuBadgeCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div 
          onClick={() => setApprovalFilter('ditolak')}
          className={`p-4 rounded-xl cursor-pointer transition-all ${
            approvalFilter === 'ditolak' 
              ? 'bg-red-100 border-2 border-red-400 shadow-md' 
              : 'bg-white border border-gray-200 hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Ditolak</p>
              <p className="text-2xl font-bold text-red-800">{approvalSummary.ditolak}</p>
            </div>
            <LuBan className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Cari kegiatan, tim, atau pelaksana..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredApprovalList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <LuClipboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada kegiatan</h3>
          <p className="text-gray-500">
            {approvalFilter === 'review_kepala' 
              ? 'Tidak ada kegiatan yang menunggu persetujuan'
              : `Tidak ada kegiatan dengan status ${approvalFilter}`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kegiatan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tim / Pelaksana</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Periode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Anggaran</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal Pengajuan</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApprovalList.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{k.nama}</div>
                      {k.kro_kode && (
                        <div className="text-xs text-gray-500 mt-1">KRO: {k.kro_kode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{k.tim_nama}</div>
                      <div className="text-xs text-gray-500">{k.pelaksana_nama || k.created_by_nama}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(k.tanggal_mulai)} - {formatDate(k.tanggal_selesai)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(k.anggaran_pagu)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusPengajuanBadge(k.status_pengajuan || 'draft')}
                      {k.catatan_approval && (
                        <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={k.catatan_approval}>
                          {k.catatan_approval}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(k.tanggal_pengajuan || '')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedKegiatan(k);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <LuEye className="w-4 h-4" />
                        </button>
                        {k.status_pengajuan === 'review_kepala' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedKegiatan(k);
                                setApprovalAction('approve');
                                setCatatan('');
                                setShowApprovalModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Setujui"
                            >
                              <LuCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedKegiatan(k);
                                setApprovalAction('reject');
                                setCatatan('');
                                setShowApprovalModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Tolak"
                            >
                              <LuX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedKegiatan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detail Kegiatan</h2>
                  <p className="text-sm text-gray-500 mt-1">Review informasi kegiatan sebelum memberikan keputusan</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div>
                  <label className="text-sm text-gray-500">Status Pengajuan</label>
                  <div className="mt-1">{getStatusPengajuanBadge(selectedKegiatan.status_pengajuan || 'draft')}</div>
                </div>
                <div className="text-right">
                  <label className="text-sm text-gray-500">Tanggal Pengajuan</label>
                  <p className="font-medium text-gray-900">{formatDateTime(selectedKegiatan.tanggal_pengajuan || '')}</p>
                </div>
              </div>

              {/* Informasi Utama */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                  Informasi Kegiatan
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-blue-700">Nama Kegiatan</label>
                    <p className="font-semibold text-gray-900 text-lg">{selectedKegiatan.nama}</p>
                  </div>
                  <div>
                    <label className="text-sm text-blue-700">Deskripsi</label>
                    <p className="text-gray-800 bg-white p-3 rounded-lg border border-blue-100">
                      {selectedKegiatan.deskripsi || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tim & Pelaksana */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                  Tim & Pelaksana
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-green-100">
                    <label className="text-sm text-green-700">Tim</label>
                    <p className="font-medium text-gray-900">{selectedKegiatan.tim_nama || '-'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-100">
                    <label className="text-sm text-green-700">Pelaksana (Pengaju)</label>
                    <p className="font-medium text-gray-900">{selectedKegiatan.pelaksana_nama || selectedKegiatan.created_by_nama || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Mitra */}
              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
                <h3 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                  Informasi Mitra
                  {selectedKegiatan.total_mitra && selectedKegiatan.total_mitra > 0 && (
                    <span className="ml-auto bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                      {selectedKegiatan.total_mitra} mitra
                    </span>
                  )}
                </h3>
                {selectedKegiatan.mitra_list && selectedKegiatan.mitra_list.length > 0 ? (
                  <div className="space-y-3">
                    {selectedKegiatan.mitra_list.map((mitra, index) => (
                      <div key={mitra.id} className="bg-white p-3 rounded-lg border border-cyan-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <LuUser className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{mitra.nama}</p>
                              {mitra.posisi && (
                                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">{mitra.posisi}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                              {mitra.alamat && <p className="flex items-center gap-1"><LuMapPin className="w-3 h-3" /> {mitra.alamat}</p>}
                              {mitra.no_telp && <p className="flex items-center gap-1"><LuPhone className="w-3 h-3" /> {mitra.no_telp}</p>}
                              {mitra.sobat_id && <p className="font-mono text-xs">SOBAT: {mitra.sobat_id}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedKegiatan.mitra_nama ? (
                  // Legacy single mitra display
                  <div className="bg-white p-3 rounded-lg border border-cyan-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <LuUser className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{selectedKegiatan.mitra_nama}</p>
                          {selectedKegiatan.mitra_posisi && (
                            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">{selectedKegiatan.mitra_posisi}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                          {selectedKegiatan.mitra_alamat && <p className="flex items-center gap-1"><LuMapPin className="w-3 h-3" /> {selectedKegiatan.mitra_alamat}</p>}
                          {selectedKegiatan.mitra_no_telp && <p className="flex items-center gap-1"><LuPhone className="w-3 h-3" /> {selectedKegiatan.mitra_no_telp}</p>}
                          {selectedKegiatan.mitra_sobat_id && <p className="font-mono text-xs">SOBAT: {selectedKegiatan.mitra_sobat_id}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-cyan-100">
                    <p className="text-gray-400 italic">Tidak ada mitra yang ditugaskan</p>
                  </div>
                )}
              </div>

              {/* KRO */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">4</span>
                  Key Result Output (KRO)
                </h3>
                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  {selectedKegiatan.kro_kode ? (
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono text-sm font-medium">
                        {selectedKegiatan.kro_kode}
                      </span>
                      <p className="font-medium text-gray-900 mt-1">{selectedKegiatan.kro_nama}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Tidak terkait KRO</p>
                  )}
                </div>
              </div>

              {/* Periode & Target */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs">5</span>
                  Periode & Target
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-amber-100">
                    <label className="text-sm text-amber-700">Tanggal Mulai</label>
                    <p className="font-medium text-gray-900">{formatDate(selectedKegiatan.tanggal_mulai)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-100">
                    <label className="text-sm text-amber-700">Tanggal Selesai</label>
                    <p className="font-medium text-gray-900">{formatDate(selectedKegiatan.tanggal_selesai)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-100">
                    <label className="text-sm text-amber-700">Target Output</label>
                    <p className="font-medium text-gray-900">
                      <span className="text-2xl font-bold text-amber-600">{selectedKegiatan.target_output || 0}</span>
                      <span className="text-gray-500 ml-1">{selectedKegiatan.satuan_output || 'unit'}</span>
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-100">
                    <label className="text-sm text-amber-700">Durasi</label>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        if (selectedKegiatan.tanggal_mulai && selectedKegiatan.tanggal_selesai) {
                          const start = new Date(selectedKegiatan.tanggal_mulai);
                          const end = new Date(selectedKegiatan.tanggal_selesai);
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return `${diffDays} hari`;
                        }
                        return '-';
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Anggaran */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs">5</span>
                  Anggaran
                </h3>
                <div className="bg-white p-4 rounded-lg border border-emerald-100">
                  <label className="text-sm text-emerald-700">Pagu Anggaran</label>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedKegiatan.anggaran_pagu)}</p>
                </div>
              </div>

              {/* Riwayat Approval (jika ada) */}
              {(selectedKegiatan.catatan_approval || selectedKegiatan.tanggal_approval) && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">!</span>
                    Riwayat Approval Sebelumnya
                  </h3>
                  <div className="space-y-3">
                    {selectedKegiatan.tanggal_approval && (
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <label className="text-sm text-red-700">Tanggal Keputusan</label>
                        <p className="font-medium text-gray-900">{formatDateTime(selectedKegiatan.tanggal_approval)}</p>
                      </div>
                    )}
                    {selectedKegiatan.approved_by_nama && (
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <label className="text-sm text-red-700">Diproses Oleh</label>
                        <p className="font-medium text-gray-900">{selectedKegiatan.approved_by_nama}</p>
                      </div>
                    )}
                    {selectedKegiatan.catatan_approval && (
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <label className="text-sm text-red-700">Catatan</label>
                        <p className="text-gray-900">{selectedKegiatan.catatan_approval}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              {selectedKegiatan.status_pengajuan === 'review_kepala' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setApprovalAction('reject');
                      setCatatan('');
                      setShowApprovalModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <LuX className="w-4 h-4" />
                    Tolak
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setApprovalAction('approve');
                      setCatatan('');
                      setShowApprovalModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <LuCheck className="w-4 h-4" />
                    Setujui
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedKegiatan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {approvalAction === 'approve' ? 'Setujui Kegiatan' : 'Tolak Kegiatan'}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {approvalAction === 'approve' 
                  ? `Apakah Anda yakin ingin menyetujui kegiatan "${selectedKegiatan.nama}"?`
                  : `Apakah Anda yakin ingin menolak kegiatan "${selectedKegiatan.nama}"?`
                }
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan {approvalAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder={approvalAction === 'approve' 
                    ? 'Catatan tambahan (opsional)...'
                    : 'Berikan alasan penolakan...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={approvalAction === 'reject'}
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleApproval}
                disabled={submitting || (approvalAction === 'reject' && !catatan.trim())}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    {approvalAction === 'approve' ? <LuCheck className="w-4 h-4" /> : <LuX className="w-4 h-4" />}
                    {approvalAction === 'approve' ? 'Setujui' : 'Tolak'}
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
