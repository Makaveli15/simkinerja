'use client';

import { useState, useEffect } from 'react';
import Pagination from '../../components/Pagination';
import { LuFileText, LuSearch, LuDownload, LuCalendar } from 'react-icons/lu';

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
  tim_nama: string;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function PPKLaporanPage() {
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterBulan, setFilterBulan] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Generate years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchLaporan();
  }, [filterTahun, filterBulan]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      let url = `/api/ppk/laporan?tahun=${filterTahun}`;
      if (filterBulan) {
        url += `&bulan=${filterBulan}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLaporanList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setLoading(false);
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

  // Filter laporan by search term
  const filteredLaporan = laporanList.filter(laporan =>
    laporan.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laporan.user_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laporan.tim_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate
  const totalPages = Math.ceil(filteredLaporan.length / itemsPerPage);
  const paginatedLaporan = filteredLaporan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-600">Daftar laporan kegiatan dari semua tim</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value ? Number(e.target.value) : '')}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Semua Bulan</option>
            {BULAN_NAMES.map((bulan, index) => (
              <option key={index} value={index + 1}>{bulan}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Laporan List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat laporan...</p>
          </div>
        ) : paginatedLaporan.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Judul</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pelaksana</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tim</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Periode</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Upload</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLaporan.map((laporan) => (
                    <tr key={laporan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <LuFileText className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{laporan.judul}</p>
                            <p className="text-sm text-gray-500">{laporan.file_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{laporan.user_nama}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">{laporan.tim_nama}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LuCalendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{BULAN_NAMES[laporan.periode_bulan - 1]} {laporan.periode_tahun}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {formatDate(laporan.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a
                          href={laporan.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <LuDownload className="w-4 h-4" />
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
              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  totalItems={filteredLaporan.length}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <LuFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada laporan</h3>
            <p className="text-gray-500">Laporan dari pelaksana akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  );
}
