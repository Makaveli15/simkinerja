'use client';

import { useState, useEffect } from 'react';
import { 
  LuPlus, 
  LuPencil, 
  LuTrash2, 
  LuCheck, 
  LuX, 
  LuCircleAlert,
  LuGauge,
  LuArrowUp,
  LuArrowDown,
  LuRefreshCw,
  LuInfo
} from 'react-icons/lu';

interface Indikator {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  bobot: number;
  urutan: number;
  rumus_perhitungan: string | null;
  satuan: string;
  nilai_min: number;
  nilai_max: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  kode: string;
  nama: string;
  deskripsi: string;
  bobot: string;
  urutan: string;
  rumus_perhitungan: string;
  satuan: string;
  nilai_min: string;
  nilai_max: string;
  is_active: boolean;
}

const initialFormData: FormData = {
  kode: '',
  nama: '',
  deskripsi: '',
  bobot: '',
  urutan: '',
  rumus_perhitungan: '',
  satuan: '%',
  nilai_min: '0',
  nilai_max: '100',
  is_active: true
};

export default function IndikatorKinerjaPage() {
  const [indikator, setIndikator] = useState<Indikator[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBobot, setTotalBobot] = useState(0);
  const [isValid, setIsValid] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchIndikator();
  }, []);

  const fetchIndikator = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/indikator');
      if (res.ok) {
        const data = await res.json();
        setIndikator(data.indikator || []);
        setTotalBobot(data.totalBobot || 0);
        setIsValid(data.isValid || false);
      }
    } catch (error) {
      console.error('Error fetching indikator:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (item: Indikator) => {
    setFormData({
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi || '',
      bobot: item.bobot.toString(),
      urutan: item.urutan.toString(),
      rumus_perhitungan: item.rumus_perhitungan || '',
      satuan: item.satuan,
      nilai_min: item.nilai_min.toString(),
      nilai_max: item.nilai_max.toString(),
      is_active: item.is_active
    });
    setEditingId(item.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/admin/indikator', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }

      setSuccess(data.message);
      setShowModal(false);
      fetchIndikator();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/indikator?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        fetchIndikator();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = indikator.findIndex(i => i.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= indikator.length) return;

    const currentItem = indikator[currentIndex];
    const targetItem = indikator[targetIndex];

    // Swap urutan values
    try {
      await Promise.all([
        fetch('/api/admin/indikator', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentItem.id, urutan: targetItem.urutan })
        }),
        fetch('/api/admin/indikator', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetItem.id, urutan: currentItem.urutan })
        })
      ]);
      fetchIndikator();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const activeIndikator = indikator.filter(i => i.is_active);
  const inactiveIndikator = indikator.filter(i => !i.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat data indikator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuGauge className="w-6 h-6" />
              </div>
              Master Indikator Kinerja
            </h1>
            <p className="text-purple-100 mt-2">Kelola indikator dan bobot perhitungan kinerja kegiatan</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            <LuPlus className="w-5 h-5" />
            Tambah Indikator
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <LuCheck className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <LuCircleAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Total Bobot Summary */}
      <div className={`p-4 rounded-xl border ${isValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isValid ? (
              <LuCheck className="w-6 h-6 text-green-600" />
            ) : (
              <LuCircleAlert className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <p className={`font-semibold ${isValid ? 'text-green-700' : 'text-amber-700'}`}>
                Total Bobot: {totalBobot}%
              </p>
              <p className={`text-sm ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
                {isValid ? 'Total bobot sudah tepat 100%' : 'Total bobot harus tepat 100% untuk perhitungan yang akurat'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchIndikator}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <LuRefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Indikator Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Indikator Aktif ({activeIndikator.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Urutan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Indikator</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Bobot</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeIndikator.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada indikator aktif
                  </td>
                </tr>
              ) : (
                activeIndikator.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReorder(item.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          <LuArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(item.id, 'down')}
                          disabled={index === activeIndikator.length - 1}
                          className={`p-1 rounded ${index === activeIndikator.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          <LuArrowDown className="w-4 h-4" />
                        </button>
                        <span className="text-gray-600 font-medium ml-1">{item.urutan}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm">
                        {item.kode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.nama}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                        {item.bobot}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.deskripsi || ''}>
                      {item.deskripsi || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Konfirmasi hapus"
                            >
                              <LuCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                              title="Batal"
                            >
                              <LuX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Nonaktifkan"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Indikator */}
      {inactiveIndikator.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden opacity-75">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Indikator Nonaktif ({inactiveIndikator.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {inactiveIndikator.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded font-mono text-sm">
                        {item.kode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.nama}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full">
                        {item.bobot}%
                      </span>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Aktifkan kembali
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <LuInfo className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Tentang Indikator Kinerja</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Total bobot semua indikator aktif harus tepat 100%</li>
              <li>Setiap indikator memiliki rumus perhitungan yang digunakan untuk menghitung skor</li>
              <li>Urutan indikator dapat diubah dengan tombol panah atas/bawah</li>
              <li>Indikator yang dihapus akan dinonaktifkan dan dapat diaktifkan kembali</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Indikator' : 'Tambah Indikator Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Indikator <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="contoh: capaian_output"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bobot (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.bobot}
                    onChange={(e) => setFormData({ ...formData, bobot: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0 - 100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Indikator <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nama indikator kinerja"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Penjelasan tentang indikator ini"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rumus Perhitungan
                </label>
                <textarea
                  value={formData.rumus_perhitungan}
                  onChange={(e) => setFormData({ ...formData, rumus_perhitungan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  placeholder="Contoh: (output_realisasi / target_output) * 100"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nilai Min
                  </label>
                  <input
                    type="number"
                    value={formData.nilai_min}
                    onChange={(e) => setFormData({ ...formData, nilai_min: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nilai Max
                  </label>
                  <input
                    type="number"
                    value={formData.nilai_max}
                    onChange={(e) => setFormData({ ...formData, nilai_max: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Indikator aktif (digunakan dalam perhitungan)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <LuCheck className="w-4 h-4" />
                      {editingId ? 'Simpan Perubahan' : 'Tambah Indikator'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
