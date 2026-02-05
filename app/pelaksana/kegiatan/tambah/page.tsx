'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuChevronLeft, LuLoader, LuPlus, LuSearch, LuX, LuUser, LuFileText, LuCheck } from 'react-icons/lu';

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
  
  // KRO search states
  const [selectedKRO, setSelectedKRO] = useState<KRO | null>(null);
  const [kroSearch, setKroSearch] = useState('');
  const [showKroDropdown, setShowKroDropdown] = useState(false);
  const kroDropdownRef = useRef<HTMLDivElement>(null);
  
  // Multi-select mitra states
  const [selectedMitra, setSelectedMitra] = useState<Mitra[]>([]);
  const [mitraSearch, setMitraSearch] = useState('');
  const [showMitraDropdown, setShowMitraDropdown] = useState(false);
  const mitraDropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    kro_id: '',
    nama: '',
    deskripsi: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    target_output: '',
    satuan_output: 'dokumen',
    anggaran_pagu: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kroDropdownRef.current && !kroDropdownRef.current.contains(event.target as Node)) {
        setShowKroDropdown(false);
      }
      if (mitraDropdownRef.current && !mitraDropdownRef.current.contains(event.target as Node)) {
        setShowMitraDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        // Remove unavailable mitra from selection
        setSelectedMitra(prev => prev.filter(m => {
          const updated = data.find((d: Mitra) => d.id === m.id);
          return updated?.available !== false;
        }));
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

  // KRO selection handler
  const handleSelectKRO = (kro: KRO) => {
    setSelectedKRO(kro);
    setFormData(prev => ({ ...prev, kro_id: kro.id.toString() }));
    setKroSearch('');
    setShowKroDropdown(false);
  };

  const handleClearKRO = () => {
    setSelectedKRO(null);
    setFormData(prev => ({ ...prev, kro_id: '' }));
  };

  // Filter KRO based on search
  const filteredKRO = kroList.filter(kro => {
    const searchLower = kroSearch.toLowerCase();
    return (
      kro.kode.toLowerCase().includes(searchLower) ||
      kro.nama.toLowerCase().includes(searchLower) ||
      (kro.deskripsi && kro.deskripsi.toLowerCase().includes(searchLower))
    );
  });

  // Mitra selection handlers
  const handleAddMitra = (mitra: Mitra) => {
    if (!selectedMitra.find(m => m.id === mitra.id)) {
      setSelectedMitra(prev => [...prev, mitra]);
    }
    setMitraSearch('');
    setShowMitraDropdown(false);
  };

  const handleRemoveMitra = (mitraId: number) => {
    setSelectedMitra(prev => prev.filter(m => m.id !== mitraId));
  };

  // Filter mitra based on search
  const filteredMitra = mitraList.filter(mitra => {
    const searchLower = mitraSearch.toLowerCase();
    const matchesSearch = 
      mitra.nama.toLowerCase().includes(searchLower) ||
      (mitra.posisi && mitra.posisi.toLowerCase().includes(searchLower)) ||
      (mitra.alamat && mitra.alamat.toLowerCase().includes(searchLower)) ||
      (mitra.sobat_id && mitra.sobat_id.toLowerCase().includes(searchLower));
    const notSelected = !selectedMitra.find(m => m.id === mitra.id);
    return matchesSearch && notSelected;
  });

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
          kro_id: parseInt(formData.kro_id),
          mitra_ids: selectedMitra.map(m => m.id), // Send array of mitra IDs
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
            <p className="text-blue-100 mt-2">Kegiatan akan disimpan sebagai draft dan perlu diajukan ke Pimpinan untuk disetujui</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* KRO Selection with Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Result Output (KRO) <span className="text-red-500">*</span>
            </label>

            {/* Selected KRO Display */}
            {selectedKRO ? (
              <div className="border border-green-300 bg-green-50 rounded-lg p-4 mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <LuFileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {selectedKRO.kode}
                        </span>
                        <LuCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="font-medium text-gray-900 mt-1">{selectedKRO.nama}</p>
                      {selectedKRO.deskripsi && (
                        <p className="text-sm text-gray-500 mt-1">{selectedKRO.deskripsi}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearKRO}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Hapus pilihan"
                  >
                    <LuX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* KRO Search Dropdown */
              <div className="relative" ref={kroDropdownRef}>
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={kroSearch}
                    onChange={(e) => setKroSearch(e.target.value)}
                    onFocus={() => setShowKroDropdown(true)}
                    placeholder="Cari KRO berdasarkan kode atau nama..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* KRO Dropdown List */}
                {showKroDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {filteredKRO.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {kroSearch ? 'Tidak ada KRO yang cocok' : 'Tidak ada KRO tersedia'}
                      </div>
                    ) : (
                      filteredKRO.map(kro => (
                        <button
                          key={kro.id}
                          type="button"
                          onClick={() => handleSelectKRO(kro)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <LuFileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {kro.kode}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900 mt-1 truncate">{kro.nama}</p>
                              {kro.deskripsi && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{kro.deskripsi}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
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

          {/* Multi-Select Mitra with Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mitra Terkait (Opsional)
              {loadingMitra && <span className="ml-2 text-blue-500 text-xs">Memuat ketersediaan...</span>}
            </label>
            
            {(!formData.tanggal_mulai || !formData.tanggal_selesai) && (
              <p className="text-xs text-amber-600 mb-2">
                💡 Pilih tanggal mulai dan selesai terlebih dahulu untuk melihat ketersediaan mitra
              </p>
            )}

            {/* Selected Mitra Tags */}
            {selectedMitra.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMitra.map(mitra => (
                  <div
                    key={mitra.id}
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-200"
                  >
                    <LuUser className="w-4 h-4" />
                    <span className="font-medium">{mitra.nama}</span>
                    {mitra.posisi && <span className="text-blue-500">- {mitra.posisi}</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveMitra(mitra.id)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <LuX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input with Dropdown */}
            <div className="relative" ref={mitraDropdownRef}>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={mitraSearch}
                  onChange={(e) => {
                    setMitraSearch(e.target.value);
                    setShowMitraDropdown(true);
                  }}
                  onFocus={() => setShowMitraDropdown(true)}
                  placeholder="Cari mitra berdasarkan nama, posisi, alamat, atau SOBAT ID..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingMitra}
                />
              </div>

              {/* Dropdown List */}
              {showMitraDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredMitra.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      {mitraSearch ? 'Tidak ada mitra yang cocok' : 'Semua mitra sudah dipilih atau ketik untuk mencari'}
                    </div>
                  ) : (
                    filteredMitra.slice(0, 20).map(mitra => (
                      <button
                        key={mitra.id}
                        type="button"
                        onClick={() => mitra.available !== false && handleAddMitra(mitra)}
                        disabled={mitra.available === false}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                          mitra.available === false ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {mitra.nama}
                              {mitra.available === false && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Tidak Tersedia</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mitra.posisi && <span>{mitra.posisi}</span>}
                              {mitra.posisi && mitra.alamat && <span> • </span>}
                              {mitra.alamat && <span>{mitra.alamat}</span>}
                            </div>
                            {mitra.sobat_id && (
                              <div className="text-xs text-gray-400 font-mono">SOBAT: {mitra.sobat_id}</div>
                            )}
                            {mitra.busy_info && (
                              <div className="text-xs text-red-500 mt-1">
                                Sedang di kegiatan &quot;{mitra.busy_info.kegiatan}&quot;
                              </div>
                            )}
                          </div>
                          {mitra.available !== false && (
                            <LuPlus className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                  {filteredMitra.length > 20 && (
                    <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
                      Menampilkan 20 dari {filteredMitra.length} mitra. Ketik untuk mempersempit pencarian.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected count */}
            <p className="mt-2 text-sm text-gray-500">
              {selectedMitra.length === 0 
                ? 'Belum ada mitra yang dipilih' 
                : `${selectedMitra.length} mitra dipilih`}
            </p>
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
                'Simpan sebagai Draft'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">Informasi Penting</h3>
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <strong>Setelah Kegiatan Disetujui:</strong>
              <ul className="mt-1 space-y-1 ml-4 list-disc">
                <li>Kegiatan akan muncul di halaman Monitoring Pimpinan</li>
                <li>Anda dapat mengupdate progres dan realisasi</li>
                <li>Skor kinerja akan dihitung otomatis</li>
              </ul>
            </div>
            <div>
              <strong>Komponen Penilaian Kinerja:</strong>
              <ul className="mt-1 space-y-1 ml-4 list-disc text-blue-700">
                <li><strong>Capaian Output (30%):</strong> Persentase penyelesaian kegiatan</li>
                <li><strong>Ketepatan Waktu (20%):</strong> Kesesuaian dengan jadwal</li>
                <li><strong>Serapan Anggaran (20%):</strong> Efisiensi penggunaan anggaran</li>
                <li><strong>Kualitas Output (20%):</strong> Rating kualitas hasil</li>
                <li><strong>Penyelesaian Kendala (10%):</strong> Kemampuan mengatasi kendala</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
