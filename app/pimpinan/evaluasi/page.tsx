'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Evaluasi {
  id: number;
  kegiatan_id: number;
  jenis_evaluasi: 'catatan' | 'arahan' | 'rekomendasi';
  isi: string;
  created_at: string;
  pimpinan_nama: string;
  pimpinan_username: string;
  kegiatan_nama: string;
  kegiatan_status: string;
  tim_nama: string;
}

interface FilterData {
  kegiatan_list: Array<{ id: number; nama: string; tim_nama: string }>;
  tim_list: Array<{ id: number; nama: string }>;
}

interface Summary {
  total: number;
  catatan: number;
  arahan: number;
  rekomendasi: number;
}

export default function PimpinanEvaluasiPage() {
  const [loading, setLoading] = useState(true);
  const [evaluasi, setEvaluasi] = useState<Evaluasi[]>([]);
  const [filters, setFilters] = useState<FilterData | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  // Filter states
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [selectedTim, setSelectedTim] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    kegiatan_id: '',
    jenis_evaluasi: 'catatan' as 'catatan' | 'arahan' | 'rekomendasi',
    isi: ''
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedKegiatan) params.append('kegiatan_id', selectedKegiatan);
      if (selectedTim) params.append('tim_id', selectedTim);
      if (selectedJenis) params.append('jenis', selectedJenis);

      const res = await fetch(`/api/pimpinan/evaluasi?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluasi(data.evaluasi);
        setFilters(data.filters);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching evaluasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKegiatan, selectedTim, selectedJenis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/pimpinan/evaluasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatan_id: parseInt(formData.kegiatan_id),
          jenis_evaluasi: formData.jenis_evaluasi,
          isi: formData.isi
        })
      });

      if (res.ok) {
        setSuccess('Evaluasi berhasil disimpan');
        setFormData({ kegiatan_id: '', jenis_evaluasi: 'catatan', isi: '' });
        setShowForm(false);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan evaluasi');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by search term
  const filteredEvaluasi = evaluasi.filter(e => 
    e.kegiatan_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.isi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tim_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getJenisIcon = (jenis: string) => {
    switch (jenis) {
      case 'catatan': return '📝';
      case 'arahan': return '👉';
      case 'rekomendasi': return '💡';
      default: return '📄';
    }
  };

  const getJenisColor = (jenis: string) => {
    switch (jenis) {
      case 'catatan': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'arahan': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'rekomendasi': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluasi & Tindak Lanjut</h1>
          <p className="text-gray-600 mt-1">Berikan catatan, arahan, dan rekomendasi untuk kegiatan</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Evaluasi
        </button>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📋</div>
              <div>
                <p className="text-sm text-gray-500">Total Evaluasi</p>
                <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📝</div>
              <div>
                <p className="text-sm text-gray-500">Catatan</p>
                <p className="text-2xl font-bold text-blue-600">{summary.catatan}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">👉</div>
              <div>
                <p className="text-sm text-gray-500">Arahan</p>
                <p className="text-2xl font-bold text-orange-600">{summary.arahan}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">💡</div>
              <div>
                <p className="text-sm text-gray-500">Rekomendasi</p>
                <p className="text-2xl font-bold text-green-600">{summary.rekomendasi}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Evaluasi Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Tambah Evaluasi Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kegiatan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.kegiatan_id}
                  onChange={(e) => setFormData({...formData, kegiatan_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Pilih Kegiatan --</option>
                  {filters?.kegiatan_list.map(kg => (
                    <option key={kg.id} value={kg.id}>
                      {kg.nama} {kg.tim_nama ? `(${kg.tim_nama})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Evaluasi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.jenis_evaluasi}
                  onChange={(e) => setFormData({...formData, jenis_evaluasi: e.target.value as 'catatan' | 'arahan' | 'rekomendasi'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="catatan">📝 Catatan</option>
                  <option value="arahan">👉 Arahan</option>
                  <option value="rekomendasi">💡 Rekomendasi</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Isi Evaluasi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.isi}
                onChange={(e) => setFormData({...formData, isi: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Tulis catatan, arahan, atau rekomendasi untuk kegiatan ini..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Evaluasi tidak dapat diubah atau dihapus setelah disimpan (read-only bagi pelaksana)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.kegiatan_id || !formData.isi.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari evaluasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Jenis Filter */}
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Jenis</option>
            <option value="catatan">📝 Catatan</option>
            <option value="arahan">👉 Arahan</option>
            <option value="rekomendasi">💡 Rekomendasi</option>
          </select>

          {/* Tim Filter */}
          <select
            value={selectedTim}
            onChange={(e) => setSelectedTim(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tim</option>
            {filters?.tim_list.map(tim => (
              <option key={tim.id} value={tim.id}>{tim.nama}</option>
            ))}
          </select>

          {/* Kegiatan Filter */}
          <select
            value={selectedKegiatan}
            onChange={(e) => setSelectedKegiatan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kegiatan</option>
            {filters?.kegiatan_list.map(kg => (
              <option key={kg.id} value={kg.id}>{kg.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Evaluasi List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredEvaluasi.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada evaluasi</h3>
          <p className="text-gray-500 mb-4">Mulai dengan menambahkan catatan, arahan, atau rekomendasi</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Tambah Evaluasi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvaluasi.map((e) => (
            <div key={e.id} className={`bg-white rounded-xl shadow-sm border p-6 border-l-4 ${getJenisColor(e.jenis_evaluasi)}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getJenisColor(e.jenis_evaluasi)}`}>
                      {getJenisIcon(e.jenis_evaluasi)} {e.jenis_evaluasi.charAt(0).toUpperCase() + e.jenis_evaluasi.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(e.created_at)}</span>
                  </div>
                  
                  <div className="mb-3">
                    <Link 
                      href={`/pimpinan/kegiatan/${e.kegiatan_id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {e.kegiatan_nama}
                    </Link>
                    {e.tim_nama && (
                      <p className="text-sm text-gray-500">Tim: {e.tim_nama}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-gray-800 whitespace-pre-wrap">{e.isi}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Oleh: {e.pimpinan_nama}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/pimpinan/kegiatan/${e.kegiatan_id}`}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Lihat Kegiatan
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
