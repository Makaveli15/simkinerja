'use client';

import { useState, useEffect } from 'react';
import Pagination from '../../components/Pagination';

interface Laporan {
  id: number;
  judul: string;
  periode_bulan: number;
  periode_tahun: number;
  file_path: string;
  file_name: string;
  keterangan: string | null;
  created_at: string;
  user_id: number;
  user_nama: string;
  tim_nama: string | null;
}

interface Tim {
  id: number;
  nama: string;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function PimpinanLaporanPage() {
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [timList, setTimList] = useState<Tim[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterBulan, setFilterBulan] = useState<number | ''>('');
  const [filterTim, setFilterTim] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Generate years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchLaporan();
    fetchTim();
  }, [filterTahun, filterBulan, filterTim]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      let url = `/api/pimpinan/laporan-pelaksana?tahun=${filterTahun}`;
      if (filterBulan) {
        url += `&bulan=${filterBulan}`;
      }
      if (filterTim) {
        url += `&tim_id=${filterTim}`;
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

  const fetchTim = async () => {
    try {
      const response = await fetch('/api/pimpinan/kegiatan');
      if (response.ok) {
        const data = await response.json();
        if (data.filters?.tim_list) {
          setTimList(data.filters.tim_list);
        }
      }
    } catch (error) {
      console.error('Error fetching tim:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (ext === 'doc' || ext === 'docx') {
      return (
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (ext === 'xls' || ext === 'xlsx') {
      return (
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  // Filter by search term
  const filteredLaporan = laporanList.filter(l =>
    l.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.tim_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalItems = filteredLaporan.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLaporan = filteredLaporan.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Pelaksana</h1>
          <p className="text-gray-500 mt-1">Lihat laporan yang diunggah oleh pelaksana</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-semibold text-blue-600">{filteredLaporan.length}</span> laporan
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari judul, pelaksana, tim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tahun Filter */}
          <select
            value={filterTahun}
            onChange={(e) => {
              setFilterTahun(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Bulan Filter */}
          <select
            value={filterBulan}
            onChange={(e) => {
              setFilterBulan(e.target.value ? Number(e.target.value) : '');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Bulan</option>
            {BULAN_NAMES.map((bulan, index) => (
              <option key={index} value={index + 1}>{bulan}</option>
            ))}
          </select>

          {/* Tim Filter */}
          <select
            value={filterTim}
            onChange={(e) => {
              setFilterTim(e.target.value ? Number(e.target.value) : '');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Tim</option>
            {timList.map(tim => (
              <option key={tim.id} value={tim.id}>{tim.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      ) : filteredLaporan.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada laporan</h3>
          <p className="text-gray-500">Tidak ditemukan laporan sesuai filter yang dipilih</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Laporan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pelaksana</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tim</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Periode</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Upload</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLaporan.map((laporan) => (
                  <tr key={laporan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(laporan.file_name)}
                        <div>
                          <p className="font-medium text-gray-900">{laporan.judul}</p>
                          <p className="text-xs text-gray-500">{laporan.file_name}</p>
                          {laporan.keterangan && (
                            <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{laporan.keterangan}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{laporan.user_nama}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{laporan.tim_nama || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {BULAN_NAMES[laporan.periode_bulan - 1]} {laporan.periode_tahun}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-gray-500">{formatDate(laporan.created_at)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <a
                        href={laporan.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                totalItems={totalItems}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
