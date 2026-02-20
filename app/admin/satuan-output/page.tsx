'use client';

import { useEffect, useState } from 'react';
import Pagination from '../../components/Pagination';
import { useAlertModal } from '@/app/components/AlertModal';
import { LuPlus, LuRuler, LuSearch, LuSquarePen, LuTrash2, LuX, LuCheck, LuCircleX } from 'react-icons/lu';

interface SatuanOutput {
  id: number;
  nama: string;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SatuanOutputPage() {
  const [satuanList, setSatuanList] = useState<SatuanOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSatuan, setEditingSatuan] = useState<SatuanOutput | null>(null);
  const [formData, setFormData] = useState({ nama: '', deskripsi: '', is_active: true });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Alert Modal hook
  const { showConfirm, showSuccess, showError, AlertModal } = useAlertModal();

  const fetchSatuan = async () => {
    try {
      const res = await fetch('/api/admin/satuan-output');
      if (res.ok) {
        const data = await res.json();
        setSatuanList(data.satuan || []);
      }
    } catch (err) {
      console.error('Error fetching satuan output:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSatuan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = '/api/admin/satuan-output';
      const method = editingSatuan ? 'PUT' : 'POST';
      const body = editingSatuan 
        ? { id: editingSatuan.id, ...formData }
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
      setEditingSatuan(null);
      setFormData({ nama: '', deskripsi: '', is_active: true });
      fetchSatuan();
    } catch (err) {
      console.error('Error saving satuan output:', err);
      setError('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (satuan: SatuanOutput) => {
    setEditingSatuan(satuan);
    setFormData({ 
      nama: satuan.nama, 
      deskripsi: satuan.deskripsi || '', 
      is_active: satuan.is_active 
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (id: number, nama: string) => {
    showConfirm({
      title: 'Hapus Satuan Output',
      message: `Apakah Anda yakin ingin menghapus satuan output "${nama}"?`,
      type: 'warning',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/satuan-output?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            showSuccess('Berhasil', 'Satuan output berhasil dihapus');
            fetchSatuan();
          } else {
            showError('Gagal', data.error || 'Gagal menghapus satuan output');
          }
        } catch (err) {
          console.error('Error deleting satuan output:', err);
          showError('Gagal', 'Terjadi kesalahan saat menghapus satuan output');
        }
      }
    });
  };

  const handleToggleActive = async (satuan: SatuanOutput) => {
    try {
      const res = await fetch('/api/admin/satuan-output', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: satuan.id, 
          nama: satuan.nama, 
          deskripsi: satuan.deskripsi,
          is_active: !satuan.is_active 
        }),
      });

      if (res.ok) {
        fetchSatuan();
      } else {
        const data = await res.json();
        showError('Gagal', data.error || 'Gagal mengubah status');
      }
    } catch (err) {
      console.error('Error toggling satuan status:', err);
    }
  };

  const openAddModal = () => {
    setEditingSatuan(null);
    setFormData({ nama: '', deskripsi: '', is_active: true });
    setShowModal(true);
    setError('');
  };

  const filteredSatuan = satuanList
    .filter(satuan => {
      if (showActiveOnly && !satuan.is_active) return false;
      return satuan.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
             satuan.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Pagination
  const totalPages = Math.ceil(filteredSatuan.length / itemsPerPage);
  const paginatedSatuan = filteredSatuan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showActiveOnly]);

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

  const activeCount = satuanList.filter(s => s.is_active).length;
  const inactiveCount = satuanList.filter(s => !s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuRuler className="w-6 h-6" />
              </div>
              Manajemen Satuan Output
            </h1>
            <p className="text-purple-100 mt-2">Kelola master data satuan output kegiatan</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all shadow-lg font-medium"
          >
            <LuPlus className="w-5 h-5" />
            Tambah Satuan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <LuRuler className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{satuanList.length}</p>
              <p className="text-gray-500">Total Satuan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <LuCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-gray-500">Satuan Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/30">
              <LuCircleX className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{inactiveCount}</p>
              <p className="text-gray-500">Satuan Nonaktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Cari nama atau deskripsi satuan output..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Tampilkan aktif saja</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Satuan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSatuan.map((satuan, index) => (
                <tr key={satuan.id} className={`hover:bg-gray-50/50 transition-colors ${!satuan.is_active ? 'bg-gray-50/30' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className={`font-medium ${satuan.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{satuan.nama}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm line-clamp-2 max-w-md ${satuan.is_active ? 'text-gray-600' : 'text-gray-400'}`}>
                      {satuan.deskripsi || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(satuan)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        satuan.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {satuan.is_active ? (
                        <>
                          <LuCheck className="w-3.5 h-3.5" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <LuCircleX className="w-3.5 h-3.5" />
                          Nonaktif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(satuan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <LuSquarePen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(satuan.id, satuan.nama)}
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
        {filteredSatuan.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSatuan.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        )}
        
        {filteredSatuan.length === 0 && (
          <div className="text-center py-12">
            <LuRuler className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">Tidak ada satuan output ditemukan</p>
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
                  {editingSatuan ? 'Edit Satuan Output' : 'Tambah Satuan Output Baru'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Satuan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Contoh: Dokumen, Unit, Orang"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                  rows={3}
                  placeholder="Deskripsi satuan output (opsional)"
                />
              </div>
              {editingSatuan && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Satuan aktif (dapat digunakan)</span>
                  </label>
                </div>
              )}
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
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30 font-medium disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingSatuan ? 'Update' : 'Simpan'}
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
