'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LuChevronLeft, LuFileText, LuSearch, LuFilter } from 'react-icons/lu';

interface DokumenOutput {
  id: number;
  nama_file: string;
  path_file: string;
  tipe_dokumen: 'draft' | 'final';
  deskripsi?: string;
  ukuran_file: number;
  tipe_file: string;
  uploaded_at: string;
  uploaded_by: number;
  uploaded_by_nama: string;
  kegiatan_id: number;
  kegiatan_nama: string;
  tim_nama?: string;
  minta_validasi: number;
  minta_validasi_at?: string;
  status_final?: 'draft' | 'menunggu_kesubag' | 'menunggu_pimpinan' | 'revisi' | 'disahkan';
  // Draft review
  draft_status_kesubag?: 'pending' | 'reviewed' | 'revisi' | null;
  draft_feedback_kesubag?: string;
  draft_reviewed_by_kesubag?: number;
  draft_reviewed_at_kesubag?: string;
  draft_feedback_pimpinan?: string;
  // Final validation
  validasi_kesubag?: 'pending' | 'valid' | 'tidak_valid' | null;
  validasi_feedback_kesubag?: string;
  validasi_by_kesubag?: number;
  validasi_at_kesubag?: string;
  validasi_pimpinan?: 'pending' | 'valid' | 'tidak_valid' | null;
  validasi_feedback_pimpinan?: string;
  validated_by_kesubag_nama?: string;
  validated_by_pimpinan_nama?: string;
}

export default function KesubagValidasiDokumenPage() {
  const [loading, setLoading] = useState(true);
  const [dokumen, setDokumen] = useState<DokumenOutput[]>([]);
  const [filteredDokumen, setFilteredDokumen] = useState<DokumenOutput[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'draft' | 'final' | 'pending'>('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewingDokumenId, setReviewingDokumenId] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({ catatan: '' });

  const fetchDokumen = async () => {
    try {
      const res = await fetch('/api/kesubag/validasi-dokumen');
      if (res.ok) {
        const data = await res.json();
        setDokumen(data.dokumen || []);
      } else {
        setError('Gagal mengambil data dokumen');
      }
    } catch {
      setError('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDokumen();
  }, []);

  useEffect(() => {
    let result = dokumen;

    // Filter by type
    if (filterType === 'draft') {
      result = result.filter(d => d.tipe_dokumen === 'draft');
    } else if (filterType === 'final') {
      result = result.filter(d => d.tipe_dokumen === 'final');
    } else if (filterType === 'pending') {
      result = result.filter(d => {
        const needsDraftReview = d.tipe_dokumen === 'draft' && 
          (!d.draft_status_kesubag || d.draft_status_kesubag === 'pending');
        const needsFinalValidation = d.tipe_dokumen === 'final' && 
          d.minta_validasi === 1 && 
          (!d.validasi_kesubag || d.validasi_kesubag === 'pending');
        return needsDraftReview || needsFinalValidation;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.nama_file.toLowerCase().includes(term) ||
        d.kegiatan_nama?.toLowerCase().includes(term) ||
        d.uploaded_by_nama?.toLowerCase().includes(term)
      );
    }

    setFilteredDokumen(result);
  }, [dokumen, filterType, searchTerm]);

  const handleValidateDokumen = async (dokumenId: number, action: string, catatan: string) => {
    setReviewingDokumenId(dokumenId);
    setError('');

    try {
      const res = await fetch('/api/kesubag/validasi-dokumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dokumenId, action, catatan })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Dokumen berhasil diproses');
        setReviewForm({ catatan: '' });
        fetchDokumen();
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📕';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📄';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  };

  // Count statistics
  const stats = {
    total: dokumen.length,
    pendingDraft: dokumen.filter(d => 
      d.tipe_dokumen === 'draft' && 
      (!d.draft_status_kesubag || d.draft_status_kesubag === 'pending')
    ).length,
    pendingFinal: dokumen.filter(d => 
      d.tipe_dokumen === 'final' && 
      d.minta_validasi === 1 && 
      (!d.validasi_kesubag || d.validasi_kesubag === 'pending')
    ).length,
    reviewed: dokumen.filter(d => 
      d.draft_status_kesubag === 'reviewed' || d.validasi_kesubag === 'valid'
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/kesubag/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Validasi Dokumen</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LuFileText className="text-blue-600" />
            Validasi Dokumen Output
          </h1>
          <p className="text-gray-600 mt-1">Review dan validasi dokumen dari pelaksana</p>
        </div>
        <Link
          href="/kesubag/kegiatan"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <LuChevronLeft className="w-4 h-4" />
          Lihat per Kegiatan
        </Link>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-3xl font-bold text-gray-700">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Dokumen</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-3xl font-bold text-amber-600">{stats.pendingDraft}</p>
          <p className="text-sm text-amber-600">Draft Pending</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-3xl font-bold text-blue-600">{stats.pendingFinal}</p>
          <p className="text-sm text-blue-600">Final Pending</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-3xl font-bold text-green-600">{stats.reviewed}</p>
          <p className="text-sm text-green-600">Sudah Direview</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama file, kegiatan, atau uploader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <LuFilter className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">⏳ Pending Review</option>
            <option value="all">📁 Semua Dokumen</option>
            <option value="draft">📝 Draft Saja</option>
            <option value="final">✅ Final Saja</option>
          </select>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filteredDokumen.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📁</span>
            </div>
            <p className="text-gray-500 mb-2">Tidak ada dokumen</p>
            <p className="text-sm text-gray-400">
              {filterType === 'pending' 
                ? 'Tidak ada dokumen yang memerlukan review' 
                : 'Tidak ada dokumen yang sesuai dengan filter'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredDokumen.map((dok) => {
              const isDraft = dok.tipe_dokumen === 'draft';
              const isFinal = dok.tipe_dokumen === 'final';
              const mintaValidasi = dok.minta_validasi === 1;
              
              const needsDraftReview = isDraft && 
                (!dok.draft_status_kesubag || dok.draft_status_kesubag === 'pending');
              const needsFinalValidation = isFinal && mintaValidasi && 
                (!dok.validasi_kesubag || dok.validasi_kesubag === 'pending');
              const needsAction = needsDraftReview || needsFinalValidation;
              
              return (
                <div 
                  key={dok.id} 
                  className={`p-4 ${needsAction ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      needsAction ? 'bg-amber-200' : 'bg-gray-100'
                    }`}>
                      <span className="text-2xl">{getFileIcon(dok.tipe_file)}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{dok.nama_file}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isFinal ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isFinal ? '✅ Final' : '📝 Draft'}
                        </span>
                        {mintaValidasi && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            📤 Minta Validasi
                          </span>
                        )}
                        {needsAction && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-600 text-white animate-pulse">
                            ⏳ Perlu Tindakan
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        Kegiatan: <Link href={`/kesubag/kegiatan/${dok.kegiatan_id}`} className="text-blue-600 hover:underline">{dok.kegiatan_nama}</Link>
                        {dok.tim_nama && <span className="text-gray-400"> • Tim: {dok.tim_nama}</span>}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span>{formatFileSize(dok.ukuran_file)}</span>
                        <span>•</span>
                        <span>Diupload: {formatDate(dok.uploaded_at)}</span>
                        <span>•</span>
                        <span>Oleh: {dok.uploaded_by_nama}</span>
                      </div>

                      {/* Status display for already reviewed/validated */}
                      {!needsAction && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {isDraft && dok.draft_status_kesubag && (
                            <span className={`px-2 py-1 rounded ${
                              dok.draft_status_kesubag === 'reviewed' ? 'bg-green-100 text-green-700' :
                              dok.draft_status_kesubag === 'revisi' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              Kesubag: {dok.draft_status_kesubag === 'reviewed' ? '✅ Diterima' :
                                       dok.draft_status_kesubag === 'revisi' ? '❌ Ditolak' : '⏳ Pending'}
                            </span>
                          )}
                          {isFinal && mintaValidasi && dok.validasi_kesubag && (
                            <span className={`px-2 py-1 rounded ${
                              dok.validasi_kesubag === 'valid' ? 'bg-green-100 text-green-700' :
                              dok.validasi_kesubag === 'tidak_valid' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              Validasi: {dok.validasi_kesubag === 'valid' ? '✅ Valid' :
                                        dok.validasi_kesubag === 'tidak_valid' ? '❌ Tidak Valid' : '⏳ Pending'}
                            </span>
                          )}
                          {dok.status_final && (
                            <span className={`px-2 py-1 rounded ${
                              dok.status_final === 'disahkan' ? 'bg-green-600 text-white' :
                              dok.status_final === 'menunggu_pimpinan' ? 'bg-blue-100 text-blue-700' :
                              dok.status_final === 'revisi' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {dok.status_final === 'disahkan' ? '🏆 Disahkan' :
                               dok.status_final === 'menunggu_pimpinan' ? '⏳ Menunggu Pimpinan' :
                               dok.status_final === 'menunggu_kesubag' ? '⏳ Menunggu Kesubag' :
                               dok.status_final === 'revisi' ? '📝 Revisi' : dok.status_final}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Validation Form for Draft Review */}
                      {needsDraftReview && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-700 mb-3">📝 Review Draft:</p>
                          <div className="space-y-3">
                            <textarea
                              placeholder="Catatan untuk pelaksana (opsional untuk terima, wajib untuk tolak)..."
                              value={reviewingDokumenId === dok.id ? reviewForm.catatan : ''}
                              onChange={(e) => {
                                setReviewingDokumenId(dok.id);
                                setReviewForm({ catatan: e.target.value });
                              }}
                              onFocus={() => setReviewingDokumenId(dok.id)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleValidateDokumen(dok.id, 'diterima', reviewingDokumenId === dok.id ? reviewForm.catatan : '')}
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
                                  handleValidateDokumen(dok.id, 'ditolak', catatan);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                              >
                                <span>❌</span> Tolak
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Validation Form for Final Document */}
                      {needsFinalValidation && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-700 mb-3">✅ Validasi Dokumen Final:</p>
                          <p className="text-xs text-blue-600 mb-3">Jika valid, dokumen akan diteruskan ke Pimpinan untuk validasi akhir.</p>
                          <div className="space-y-3">
                            <textarea
                              placeholder="Catatan validasi (opsional untuk valid, wajib untuk invalid)..."
                              value={reviewingDokumenId === dok.id ? reviewForm.catatan : ''}
                              onChange={(e) => {
                                setReviewingDokumenId(dok.id);
                                setReviewForm({ catatan: e.target.value });
                              }}
                              onFocus={() => setReviewingDokumenId(dok.id)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleValidateDokumen(dok.id, 'valid', reviewingDokumenId === dok.id ? reviewForm.catatan : '')}
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
                                  handleValidateDokumen(dok.id, 'tidak_valid', catatan);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                              >
                                <span>❌</span> Invalid
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Button */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a
                        href={dok.path_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 text-center"
                      >
                        👁️ Lihat
                      </a>
                      <Link
                        href={`/kesubag/kegiatan/${dok.kegiatan_id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-center text-sm"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
