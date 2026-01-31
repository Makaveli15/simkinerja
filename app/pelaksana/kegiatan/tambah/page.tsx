'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuChevronLeft, LuLoader, LuPlus } from 'react-icons/lu';

interface KRO {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
}

interface Mitra {
  id: number;
  nama: string;
  posisi: string;
  alamat: string;
  no_telp: string;
  sobat_id: string;
  available?: boolean;
  busy_info?: {
    kegiatan: string;
    mulai: string;
    selesai: string;
  } | null;
}

export default function TambahKegiatanPage() {
  const router = useRouter();
  const [kroList, setKroList] = useState<KRO[]>([]);
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMitra, setLoadingMitra] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    kro_id: '',
    mitra_id: '',
    nama: '',
    deskripsi: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    target_output: '',
    satuan_output: 'dokumen',
    anggaran_pagu: '',
    status: 'berjalan'
  });

  useEffect(() => {
    fetchKRO();
    fetchMitra();
  }, []);

  // Fetch mitra with availability when dates change
  useEffect(() => {
    if (formData.tanggal_mulai && formData.tanggal_selesai) {
      fetchMitraWithAvailability();
    }
  }, [formData.tanggal_mulai, formData.tanggal_selesai]);

  const fetchKRO = async () => {
    try {
      const res = await fetch('/api/pelaksana/kro');
      if (res.ok) {
        const data = await res.json();
        setKroList(data);
      }
    } catch (error) {
      console.error('Error fetching KRO:', error);
    }
  };

  const fetchMitra = async () => {
    try {
      const res = await fetch('/api/pelaksana/mitra');
      if (res.ok) {
        const data = await res.json();
        setMitraList(data);
      }
    } catch (error) {
      console.error('Error fetching Mitra:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMitraWithAvailability = async () => {
    setLoadingMitra(true);
    try {
      const params = new URLSearchParams({
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai
      });
      const res = await fetch(`/api/pelaksana/mitra?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMitraList(data);
        // Reset mitra selection if currently selected mitra is not available
        const selectedMitra = data.find((m: Mitra) => m.id.toString() === formData.mitra_id);
        if (selectedMitra && selectedMitra.available === false) {
          setFormData(prev => ({ ...prev, mitra_id: '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching Mitra:', error);
    } finally {
      setLoadingMitra(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation
    if (!formData.kro_id) {
      setError('KRO wajib dipilih');
      setSubmitting(false);
      return;
    }

    if (!formData.nama.trim()) {
      setError('Nama kegiatan wajib diisi');
      setSubmitting(false);
      return;
    }

    if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
      setError('Tanggal mulai dan selesai wajib diisi');
      setSubmitting(false);
      return;
    }

    if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
      setError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
      setSubmitting(false);
      return;
    }

    if (!formData.target_output || parseFloat(formData.target_output) <= 0) {
      setError('Target output wajib diisi dan harus lebih dari 0');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/pelaksana/kegiatan-operasional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama: formData.nama,
          deskripsi: formData.deskripsi || null,
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai || null,
          target_output: parseFloat(formData.target_output) || null,
          satuan_output: formData.satuan_output || 'dokumen',
          // Use Math.round to avoid floating-point precision issues (e.g., 10000000 becoming 9999999)
          anggaran_pagu: formData.anggaran_pagu ? Math.round(Number(formData.anggaran_pagu) * 100) / 100 : 0,
          status: formData.status,
          kro_id: parseInt(formData.kro_id),
          mitra_id: formData.mitra_id ? parseInt(formData.mitra_id) : null,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan kegiatan');
      }

      router.push('/pelaksana/kegiatan');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedKRO = kroList.find(k => k.id.toString() === formData.kro_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/pelaksana/kegiatan"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <LuChevronLeft className="w-5 h-5" />
            Kembali ke Daftar Kegiatan
          </Link>
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuPlus className="w-6 h-6" />
              </div>
              Tambah Kegiatan Baru
            </h1>
            <p className="text-blue-100 mt-2">Buat kegiatan baru dengan memilih KRO terkait</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* KRO Selection */}
          <div>
            <label htmlFor="kro_id" className="block text-sm font-medium text-gray-700 mb-2">
              Key Result Output (KRO) <span className="text-red-500">*</span>
            </label>
            <select
              id="kro_id"
              name="kro_id"
              value={formData.kro_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Pilih KRO --</option>
              {kroList.map((kro) => (
                <option key={kro.id} value={kro.id}>
                  [{kro.kode}] {kro.nama}
                </option>
              ))}
            </select>
            {selectedKRO && selectedKRO.deskripsi && (
              <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Deskripsi:</strong> {selectedKRO.deskripsi}
              </p>
            )}
          </div>

          {/* Nama Kegiatan */}
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Masukkan nama kegiatan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Detail Kegiatan */}
          <div>
            <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Kegiatan
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              rows={4}
              placeholder="Jelaskan detail kegiatan, tujuan, dan output yang diharapkan..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="tanggal_mulai"
                name="tanggal_mulai"
                value={formData.tanggal_mulai}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="tanggal_selesai"
                name="tanggal_selesai"
                value={formData.tanggal_selesai}
                onChange={handleChange}
                min={formData.tanggal_mulai}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Target Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="target_output" className="block text-sm font-medium text-gray-700 mb-2">
                Target Output <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="target_output"
                name="target_output"
                value={formData.target_output}
                onChange={handleChange}
                placeholder="Contoh: 100"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="satuan_output" className="block text-sm font-medium text-gray-700 mb-2">
                Satuan Output <span className="text-red-500">*</span>
              </label>
              <select
                id="satuan_output"
                name="satuan_output"
                value={formData.satuan_output}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="dokumen">Dokumen</option>
                <option value="publikasi">Publikasi</option>
                <option value="layanan">Layanan</option>
                <option value="wilayah">Wilayah</option>
                <option value="data">Data</option>
                <option value="peta">Peta</option>
              </select>
            </div>
          </div>

          {/* Target Anggaran */}
          <div>
            <label htmlFor="anggaran_pagu" className="block text-sm font-medium text-gray-700 mb-2">
              Target Anggaran (Rp)
            </label>
            <input
              type="number"
              id="anggaran_pagu"
              name="anggaran_pagu"
              value={formData.anggaran_pagu}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.anggaran_pagu && (
              <p className="mt-2 text-sm text-gray-500">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(formData.anggaran_pagu) || 0)}
              </p>
            )}
          </div>

          {/* Mitra Selection */}
          <div>
            <label htmlFor="mitra_id" className="block text-sm font-medium text-gray-700 mb-2">
              Mitra Terkait (Opsional)
              {loadingMitra && <span className="ml-2 text-blue-500 text-xs">Memuat ketersediaan...</span>}
            </label>
            {(!formData.tanggal_mulai || !formData.tanggal_selesai) && (
              <p className="text-xs text-amber-600 mb-2">
                💡 Pilih tanggal mulai dan selesai terlebih dahulu untuk melihat ketersediaan mitra
              </p>
            )}
            <select
              id="mitra_id"
              name="mitra_id"
              value={formData.mitra_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingMitra}
            >
              <option value="">-- Tanpa Mitra --</option>
              {mitraList.map((mitra) => (
                <option 
                  key={mitra.id} 
                  value={mitra.id}
                  disabled={mitra.available === false}
                  className={mitra.available === false ? 'text-gray-400' : ''}
                >
                  {mitra.nama} {mitra.posisi && `- ${mitra.posisi}`} {mitra.alamat && `(${mitra.alamat})`}
                  {mitra.available === false && ' [Tidak Tersedia]'}
                </option>
              ))}
            </select>
            {formData.mitra_id && (() => {
              const selectedMitra = mitraList.find(m => m.id.toString() === formData.mitra_id);
              if (selectedMitra?.busy_info) {
                return (
                  <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ Mitra ini sedang ditugaskan pada &quot;{selectedMitra.busy_info.kegiatan}&quot; 
                    ({new Date(selectedMitra.busy_info.mulai).toLocaleDateString('id-ID')} - {new Date(selectedMitra.busy_info.selesai).toLocaleDateString('id-ID')})
                  </p>
                );
              }
              return null;
            })()}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status Awal
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="belum_mulai">Belum Dimulai</option>
              <option value="berjalan">Berjalan</option>
              <option value="tertunda">Tertunda</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Link
              href="/pelaksana/kegiatan"
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-center transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LuLoader className="animate-spin h-5 w-5" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan Kegiatan'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">Informasi Penilaian Kinerja</h3>
          <p className="text-sm text-blue-800 mb-3">
            Setelah kegiatan dibuat, Anda dapat memperbarui progres dan realisasi untuk menghitung skor kinerja:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Capaian Output (30%):</strong> Persentase penyelesaian kegiatan</li>
            <li>• <strong>Ketepatan Waktu (20%):</strong> Kesesuaian dengan jadwal</li>
            <li>• <strong>Serapan Anggaran (20%):</strong> Efisiensi penggunaan anggaran</li>
            <li>• <strong>Kualitas Output (20%):</strong> Rating kualitas hasil</li>
            <li>• <strong>Penyelesaian Kendala (10%):</strong> Kemampuan mengatasi kendala</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
