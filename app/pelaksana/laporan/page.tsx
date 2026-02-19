'use client';

import { useState, useEffect, useRef } from 'react';
import Pagination from '../../components/Pagination';
import { 
  LuUpload, 
  LuFileText, 
  LuDownload, 
  LuTrash2, 
  LuX,
  LuCloudUpload,
  LuFileSpreadsheet,
  LuPaperclip,
  LuFilePen,
  LuCheck
} from 'react-icons/lu';

interface Laporan {
  id: number;
  judul: string;
  periode_bulan: number;
  periode_tahun: number;
  file_path: string;
  file_name: string;
  keterangan: string | null;
  created_at: string;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LaporanPage() {
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter state
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterBulan, setFilterBulan] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Form state for upload
  const [judul, setJudul] = useState('');
  const [periodeBulan, setPeriodeBulan] = useState(new Date().getMonth() + 1);
  const [periodeTahun, setPeriodeTahun] = useState(new Date().getFullYear());
  const [keterangan, setKeterangan] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchLaporan();
  }, [filterTahun, filterBulan]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      let url = `/api/pelaksana/laporan?tahun=${filterTahun}`;
      if (filterBulan) {
        url += `&bulan=${filterBulan}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLaporanList(data);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Pilih file laporan terlebih dahulu');
      return;
    }
    
    if (!judul.trim()) {
      setError('Judul laporan harus diisi');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('judul', judul);
      formData.append('periode_bulan', periodeBulan.toString());
      formData.append('periode_tahun', periodeTahun.toString());
      formData.append('keterangan', keterangan);
      
      const response = await fetch('/api/pelaksana/laporan', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setSuccess('Laporan berhasil diupload');
        setShowModal(false);
        resetForm();
        fetchLaporan();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal mengupload laporan');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengupload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLaporan) return;
    
    try {
      const response = await fetch(`/api/pelaksana/laporan?id=${selectedLaporan.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Laporan berhasil dihapus');
        setShowDeleteModal(false);
        setSelectedLaporan(null);
        fetchLaporan();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal menghapus laporan');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menghapus');
    }
  };

  const resetForm = () => {
    setJudul('');
    setPeriodeBulan(new Date().getMonth() + 1);
    setPeriodeTahun(new Date().getFullYear());
    setKeterangan('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openDeleteModal = (laporan: Laporan) => {
    setSelectedLaporan(laporan);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <LuFileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <LuFilePen className="w-5 h-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <LuFileSpreadsheet className="w-5 h-5 text-green-500" />;
      default:
        return <LuPaperclip className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuFileText className="w-6 h-6" />
              </div>
              Laporan
            </h1>
            <p className="text-blue-100 mt-2">Kelola dan upload laporan kegiatan</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg"
          >
            <LuUpload className="h-5 w-5" />
            Upload Laporan
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Bulan:</label>
            <select
              suppressHydrationWarning
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Bulan</option>
              {BULAN_NAMES.map((bulan, index) => (
                <option key={index} value={index + 1}>{bulan}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tahun:</label>
            <select
              suppressHydrationWarning
              value={filterTahun}
              onChange={(e) => setFilterTahun(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Laporan List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        ) : laporanList.length === 0 ? (
          <div className="p-8 text-center">
            <LuFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Belum ada laporan untuk {filterBulan ? `${BULAN_NAMES[filterBulan - 1]} ` : ''}{filterTahun}
            </p>
            <div className="mt-4">
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Upload laporan manual
              </button>
            </div>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Upload</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {laporanList
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((laporan) => (
                  <tr key={laporan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{laporan.judul}</div>
                      {laporan.keterangan && (
                        <div className="text-sm text-gray-500">{laporan.keterangan}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {BULAN_NAMES[laporan.periode_bulan - 1]} {laporan.periode_tahun}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={laporan.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-xl">{getFileIcon(laporan.file_name)}</span>
                        <span className="text-sm truncate max-w-[200px]">{laporan.file_name}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(laporan.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={laporan.file_path}
                          download
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Download"
                        >
                          <LuDownload className="h-5 w-5" />
                        </a>
                        <button
                          onClick={() => openDeleteModal(laporan)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Hapus"
                        >
                          <LuTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {laporanList.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(laporanList.length / itemsPerPage)}
              totalItems={laporanList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          )}
        </>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <LuUpload className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Upload Laporan</h3>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); setError(''); }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Laporan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan judul laporan"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode Bulan</label>
                  <select
                    value={periodeBulan}
                    onChange={(e) => setPeriodeBulan(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BULAN_NAMES.map((bulan, index) => (
                      <option key={index} value={index + 1}>{bulan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode Tahun</label>
                  <select
                    value={periodeTahun}
                    onChange={(e) => setPeriodeTahun(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Keterangan tambahan (opsional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Laporan <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <LuCloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Pilih file</span>
                        <input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX (Maks. 10MB)</p>
                    {file && (
                      <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                        <LuCheck className="w-4 h-4" /> {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); setError(''); }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengupload...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLaporan && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <LuTrash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Hapus Laporan?</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus laporan &quot;{selectedLaporan.judul}&quot;? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedLaporan(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
