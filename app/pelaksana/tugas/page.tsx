'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tugas {
  id: number;
  kegiatan_id: number;
  kode_kegiatan: string;
  nama_kegiatan: string;
  deskripsi: string;
  status: 'belum' | 'berjalan' | 'selesai';
  prioritas: 'rendah' | 'sedang' | 'tinggi';
  deadline: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  catatan: string | null;
}

export default function TugasSayaPage() {
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPrioritas, setFilterPrioritas] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTugas();
  }, []);

  const fetchTugas = async () => {
    try {
      const res = await fetch('/api/pelaksana/tugas');
      if (res.ok) {
        const data = await res.json();
        setTugas(data);
      }
    } catch (error) {
      console.error('Error fetching tugas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/pelaksana/tugas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchTugas();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'berjalan':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'belum':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getPrioritasBadge = (prioritas: string) => {
    switch (prioritas) {
      case 'tinggi':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'sedang':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'rendah':
        return 'bg-green-100 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'selesai') return false;
    return new Date(deadline) < new Date();
  };

  const filteredTugas = tugas.filter((t) => {
    const matchSearch = t.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.kode_kegiatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchPrioritas = !filterPrioritas || t.prioritas === filterPrioritas;
    return matchSearch && matchStatus && matchPrioritas;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat tugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tugas Saya</h1>
        <p className="text-gray-500 mt-1">Kelola dan pantau tugas yang ditugaskan kepada Anda</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari kegiatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="belum">Belum Mulai</option>
              <option value="berjalan">Berjalan</option>
              <option value="selesai">Selesai</option>
            </select>
            <select
              value={filterPrioritas}
              onChange={(e) => setFilterPrioritas(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Semua Prioritas</option>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      {filteredTugas.length > 0 ? (
        <div className="grid gap-4">
          {filteredTugas.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                isOverdue(t.deadline, t.status) ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
              }`}
              onClick={() => {
                setSelectedTugas(t);
                setShowModal(true);
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {t.kode_kegiatan}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(t.status)}`}>
                      {t.status === 'belum' ? 'Belum Mulai' : t.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getPrioritasBadge(t.prioritas)}`}>
                      {t.prioritas}
                    </span>
                    {isOverdue(t.deadline, t.status) && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                        Terlambat
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.nama_kegiatan}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{t.deskripsi || 'Tidak ada deskripsi'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Deadline: {formatDate(t.deadline)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTugas(t);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Lihat Detail →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada tugas</h3>
          <p className="text-gray-500">Belum ada tugas yang ditugaskan kepada Anda</p>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Detail Tugas</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {selectedTugas.kode_kegiatan}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTugas.nama_kegiatan}</h3>
                <p className="text-gray-600 mt-2">{selectedTugas.deskripsi || 'Tidak ada deskripsi'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(selectedTugas.status)}`}>
                    {selectedTugas.status === 'belum' ? 'Belum Mulai' : selectedTugas.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prioritas</p>
                  <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getPrioritasBadge(selectedTugas.prioritas)}`}>
                    {selectedTugas.prioritas}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Mulai</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedTugas.tanggal_mulai)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className={`font-medium ${isOverdue(selectedTugas.deadline, selectedTugas.status) ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(selectedTugas.deadline)}
                  </p>
                </div>
              </div>
              {selectedTugas.catatan && (
                <div>
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="text-gray-700 mt-1">{selectedTugas.catatan}</p>
                </div>
              )}
              
              {/* Update Status */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Ubah Status</p>
                <div className="flex gap-2">
                  {selectedTugas.status !== 'belum' && (
                    <button
                      onClick={() => updateStatus(selectedTugas.id, 'belum')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      Belum Mulai
                    </button>
                  )}
                  {selectedTugas.status !== 'berjalan' && (
                    <button
                      onClick={() => updateStatus(selectedTugas.id, 'berjalan')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      Mulai Kerjakan
                    </button>
                  )}
                  {selectedTugas.status !== 'selesai' && (
                    <button
                      onClick={() => updateStatus(selectedTugas.id, 'selesai')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
