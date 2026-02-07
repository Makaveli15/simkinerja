'use client';

import { useEffect, useState } from 'react';
import Pagination from '../../components/Pagination';
import { LuPlus, LuFileText, LuSearch, LuSquarePen, LuTrash2, LuX } from 'react-icons/lu';

interface KRO {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  created_at: string;
}

export default function KROPage() {
  const [kroList, setKroList] = useState<KRO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKRO, setEditingKRO] = useState<KRO | null>(null);
  const [formData, setFormData] = useState({ kode: '', nama: '', deskripsi: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchKRO = async () => {
    try {
      const res = await fetch('/api/admin/kro');
      if (res.ok) {
        const data = await res.json();
        setKroList(data);
      }
    } catch (err) {
      console.error('Error fetching KRO:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKRO();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = '/api/admin/kro';
      const method = editingKRO ? 'PUT' : 'POST';
      const body = editingKRO 
        ? { id: editingKRO.id, ...formData }
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
      setEditingKRO(null);
      setFormData({ kode: '', nama: '', deskripsi: '' });
      fetchKRO();
    } catch (err) {
      console.error('Error saving KRO:', err);
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (kro: KRO) => {
    setEditingKRO(kro);
    setFormData({ kode: kro.kode, nama: kro.nama, deskripsi: kro.deskripsi || '' });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus KRO "${nama}"?`)) return;

    try {
      const res = await fetch(`/api/admin/kro?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKRO();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus KRO');
      }
    } catch (err) {
      console.error('Error deleting KRO:', err);
    }
  };

  const openAddModal = () => {
    setEditingKRO(null);
    setFormData({ kode: '', nama: '', deskripsi: '' });
    setShowModal(true);
    setError('');
  };

  const filteredKRO = kroList.filter(kro => 
    kro.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kro.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kro.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredKRO.length / itemsPerPage);
  const paginatedKRO = filteredKRO.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
                <LuFileText className="w-6 h-6" />
              </div>
              Manajemen KRO
            </h1>
            <p className="text-blue-100 mt-2">Kelola Klasifikasi Rincian Output</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all shadow-lg font-medium"
          >
            <LuPlus className="w-5 h-5" />
            Tambah KRO
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <LuFileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">{kroList.length}</p>
            <p className="text-gray-500">Total KRO Terdaftar</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Cari kode, nama, atau deskripsi KRO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama KRO</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedKRO.map((kro) => (
                <tr key={kro.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1.5 text-sm font-mono font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                      {kro.kode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{kro.nama}</p>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {kro.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                      {kro.deskripsi || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(kro)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <LuSquarePen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(kro.id, kro.nama)}
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
        {filteredKRO.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredKRO.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        )}
        
        {filteredKRO.length === 0 && (
          <div className="text-center py-12">
            <LuFileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">Tidak ada KRO ditemukan</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingKRO ? 'Edit KRO' : 'Tambah KRO Baru'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode KRO</label>
                <input
                  type="text"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  placeholder="Contoh: KRO001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama KRO</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Nama Klasifikasi Rincian Output"
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
                  placeholder="Deskripsi KRO (opsional)"
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
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingKRO ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
