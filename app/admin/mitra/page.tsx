'use client';

import { useEffect, useState } from 'react';
import Pagination from '../../components/Pagination';
import { useAlertModal } from '@/app/components/AlertModal';
import { LuPlus, LuUsers, LuUser, LuSearch, LuPhone, LuMail, LuSquarePen, LuTrash2, LuX } from 'react-icons/lu';

interface Mitra {
  id: number;
  nama: string;
  posisi: string;
  alamat: string | null;
  jk: 'L' | 'P';
  no_telp: string | null;
  sobat_id: string | null;
  email: string | null;
  created_at: string;
}

export default function MitraPage() {
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMitra, setEditingMitra] = useState<Mitra | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    posisi: '',
    alamat: '',
    jk: 'L' as 'L' | 'P',
    no_telp: '',
    sobat_id: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJK, setFilterJK] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Alert Modal hook
  const { showConfirm, showSuccess, showError, AlertModal } = useAlertModal();

  const fetchMitra = async () => {
    try {
      const res = await fetch('/api/admin/mitra');
      if (res.ok) {
        const data = await res.json();
        setMitraList(data);
      }
    } catch (err) {
      console.error('Error fetching Mitra:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitra();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = '/api/admin/mitra';
      const method = editingMitra ? 'PUT' : 'POST';
      const body = editingMitra 
        ? { id: editingMitra.id, ...formData }
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
      setEditingMitra(null);
      setFormData({ nama: '', posisi: '', alamat: '', jk: 'L', no_telp: '', sobat_id: '', email: '' });
      fetchMitra();
    } catch (err) {
      console.error('Error saving Mitra:', err);
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mitra: Mitra) => {
    setEditingMitra(mitra);
    setFormData({
      nama: mitra.nama,
      posisi: mitra.posisi,
      alamat: mitra.alamat || '',
      jk: mitra.jk,
      no_telp: mitra.no_telp || '',
      sobat_id: mitra.sobat_id || '',
      email: mitra.email || '',
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (id: number, nama: string) => {
    showConfirm({
      title: 'Hapus Mitra',
      message: `Apakah Anda yakin ingin menghapus mitra "${nama}"?`,
      type: 'warning',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/mitra?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            showSuccess('Berhasil', 'Mitra berhasil dihapus');
            fetchMitra();
          } else {
            const data = await res.json();
            showError('Gagal', data.error || 'Gagal menghapus mitra');
          }
        } catch (err) {
          console.error('Error deleting Mitra:', err);
          showError('Gagal', 'Terjadi kesalahan saat menghapus mitra');
        }
      }
    });
  };

  const openAddModal = () => {
    setEditingMitra(null);
    setFormData({ nama: '', posisi: '', alamat: '', jk: 'L', no_telp: '', sobat_id: '', email: '' });
    setShowModal(true);
    setError('');
  };

  const filteredMitra = mitraList.filter(mitra => {
    const matchSearch = mitra.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mitra.posisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mitra.sobat_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mitra.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJK = filterJK === '' || mitra.jk === filterJK;
    return matchSearch && matchJK;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMitra.length / itemsPerPage);
  const paginatedMitra = filteredMitra.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterJK]);

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
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuUsers className="w-6 h-6" />
              </div>
              Manajemen Mitra
            </h1>
            <p className="text-blue-100 mt-2">Kelola data mitra statistik</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all shadow-lg font-medium"
          >
            <LuPlus className="w-5 h-5" />
            Tambah Mitra
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <LuUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{mitraList.length}</p>
              <p className="text-sm text-gray-500">Total Mitra</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <LuUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{mitraList.filter(m => m.jk === 'L').length}</p>
              <p className="text-sm text-gray-500">Laki-laki</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <LuUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{mitraList.filter(m => m.jk === 'P').length}</p>
              <p className="text-sm text-gray-500">Perempuan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Cari nama, posisi, SOBAT ID, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <select
            suppressHydrationWarning
            value={filterJK}
            onChange={(e) => setFilterJK(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
          >
            <option value="">Semua Jenis Kelamin</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mitra</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Posisi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">JK</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SOBAT ID</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMitra.map((mitra) => (
                <tr key={mitra.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${
                        mitra.jk === 'L' 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-pink-500 to-rose-600'
                      }`}>
                        {mitra.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mitra.nama}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{mitra.alamat || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                      {mitra.posisi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                      mitra.jk === 'L' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-pink-100 text-pink-700'
                    }`}>
                      {mitra.jk === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {mitra.no_telp && (
                        <p className="text-gray-600 flex items-center gap-1">
                          <LuPhone className="w-3.5 h-3.5" />
                          {mitra.no_telp}
                        </p>
                      )}
                      {mitra.email && (
                        <p className="text-gray-500 flex items-center gap-1 text-xs mt-0.5">
                          <LuMail className="w-3 h-3" />
                          {mitra.email}
                        </p>
                      )}
                      {!mitra.no_telp && !mitra.email && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {mitra.sobat_id ? (
                      <span className="inline-flex px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-gray-100 text-gray-700">
                        {mitra.sobat_id}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(mitra)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <LuSquarePen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mitra.id, mitra.nama)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredMitra.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMitra.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        )}
        
        {filteredMitra.length === 0 && (
          <div className="text-center py-12">
            <LuUsers className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">Tidak ada mitra ditemukan</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMitra ? 'Edit Mitra' : 'Tambah Mitra Baru'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LuX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Posisi</label>
                  <input
                    type="text"
                    value={formData.posisi}
                    onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Contoh: Pencacah"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Kelamin</label>
                  <select
                    value={formData.jk}
                    onChange={(e) => setFormData({ ...formData, jk: e.target.value as 'L' | 'P' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    required
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    rows={2}
                    placeholder="Alamat lengkap (opsional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
                  <input
                    type="tel"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SOBAT ID</label>
                  <input
                    type="text"
                    value={formData.sobat_id}
                    onChange={(e) => setFormData({ ...formData, sobat_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="ID SOBAT"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="email@example.com"
                  />
                </div>
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
                  {saving ? 'Menyimpan...' : editingMitra ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
