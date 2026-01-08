'use client';

import { useEffect, useState } from 'react';
import Pagination from '../../components/Pagination';

interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  foto?: string;
}

interface Tim {
  id: number;
  nama: string;
  deskripsi: string | null;
  created_at: string;
  members: Member[];
  memberCount: number;
}

export default function TimPage() {
  const [timList, setTimList] = useState<Tim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTim, setSelectedTim] = useState<Tim | null>(null);
  const [editingTim, setEditingTim] = useState<Tim | null>(null);
  const [formData, setFormData] = useState({ nama: '', deskripsi: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchTim = async () => {
    try {
      const res = await fetch('/api/admin/tim');
      if (res.ok) {
        const data = await res.json();
        setTimList(data);
      }
    } catch (err) {
      console.error('Error fetching tim:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTim();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = '/api/admin/tim';
      const method = editingTim ? 'PUT' : 'POST';
      const body = editingTim 
        ? { id: editingTim.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }

      setShowModal(false);
      setEditingTim(null);
      setFormData({ nama: '', deskripsi: '' });
      fetchTim();
    } catch (err) {
      console.error('Error saving tim:', err);
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tim: Tim) => {
    setEditingTim(tim);
    setFormData({ nama: tim.nama, deskripsi: tim.deskripsi || '' });
    setShowModal(true);
    setError('');
  };

  const handleViewMembers = (tim: Tim) => {
    setSelectedTim(tim);
    setShowMembersModal(true);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tim "${nama}"?`)) return;

    try {
      const res = await fetch(`/api/admin/tim?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTim();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus tim');
      }
    } catch (err) {
      console.error('Error deleting tim:', err);
    }
  };

  const openAddModal = () => {
    setEditingTim(null);
    setFormData({ nama: '', deskripsi: '' });
    setShowModal(true);
    setError('');
  };

  const filteredTim = timList.filter(tim => 
    tim.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tim.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredTim.length / itemsPerPage);
  const paginatedTim = filteredTim.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Generate random gradient colors for tim cards
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
    'from-teal-500 to-green-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Tim</h1>
          <p className="text-gray-500 mt-1">Kelola tim kerja dalam sistem</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Tim
        </button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{timList.length}</p>
              <p className="text-sm text-gray-500">Total Tim</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <div className="flex items-center gap-3 h-full">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 mb-1">Tim Aktif</p>
              <div className="flex flex-wrap gap-2">
                {timList.slice(0, 5).map((tim, idx) => (
                  <span key={tim.id} className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${gradients[idx % gradients.length]} text-white`}>
                    {tim.nama}
                  </span>
                ))}
                {timList.length > 5 && (
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-600">
                    +{timList.length - 5} lainnya
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau deskripsi tim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Tim Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedTim.map((tim, index) => (
          <div key={tim.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
            <div className={`h-2 bg-gradient-to-r ${gradients[index % gradients.length]}`}></div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {tim.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tim.nama}</h3>
                    <p className="text-sm text-gray-500">Tim #{tim.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(tim)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tim.id, tim.nama)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {tim.deskripsi || 'Tidak ada deskripsi'}
              </p>
              
              {/* Member Avatars */}
              <div className="mt-4">
                <button
                  onClick={() => handleViewMembers(tim)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {tim.members.slice(0, 4).map((member, idx) => (
                        <div
                          key={member.id}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradients[(index + idx) % gradients.length]} flex items-center justify-center text-white text-xs font-medium border-2 border-white`}
                          title={member.username}
                        >
                          {member.foto ? (
                            <img src={member.foto} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.username.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {tim.memberCount > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                          +{tim.memberCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {tim.memberCount} Anggota
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Dibuat: {new Date(tim.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredTim.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTim.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {filteredTim.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-4 text-gray-500">Tidak ada tim ditemukan</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTim ? 'Edit Tim' : 'Tambah Tim Baru'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Tim</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Contoh: Tim Distribusi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  rows={3}
                  placeholder="Deskripsi tim (opsional)"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingTim ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedTim && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className={`px-6 py-4 bg-gradient-to-r ${gradients[timList.findIndex(t => t.id === selectedTim.id) % gradients.length]} rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-lg font-semibold">Anggota {selectedTim.nama}</h3>
                  <p className="text-sm text-white/80">{selectedTim.memberCount} anggota terdaftar</p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedTim.members.length > 0 ? (
                <div className="space-y-3">
                  {selectedTim.members.map((member, idx) => (
                    <div key={member.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center text-white font-medium shadow-lg overflow-hidden`}>
                        {member.foto ? (
                          <img src={member.foto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          member.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{member.username}</p>
                        <p className="text-sm text-gray-500 truncate">{member.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                          member.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : member.role === 'pimpinan'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {member.role}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.status === 'active' ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1" />
                  </svg>
                  <p className="mt-4 text-gray-500">Belum ada anggota di tim ini</p>
                  <p className="text-sm text-gray-400">Tambahkan user dan tetapkan ke tim ini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
