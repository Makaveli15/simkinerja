'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LuSearch, LuClipboard, LuEye, LuActivity } from 'react-icons/lu';

interface Kegiatan {
  id: number;
  nama: string;
  deskripsi: string;
  tim_id: number;
  tim_nama: string;
  kro_id: number;
  kro_kode: string;
  kro_nama: string;
  pelaksana_nama: string;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  total_realisasi_anggaran: number;
  status: string;
  status_verifikasi: string;
  skor_kinerja: number;
  status_kinerja: string;
  capaian_output_persen: number;
  realisasi_anggaran_persen: number;
  total_kendala?: number;
  dokumen_disahkan?: number;
}

interface FilterData {
  kro_list: Array<{ id: number; kode: string; nama: string }>;
}

export default function MonitoringKegiatanPage() {
  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [filters, setFilters] = useState<FilterData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [selectedKro, setSelectedKro] = useState('');
  const [selectedStatusKinerja, setSelectedStatusKinerja] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('monitoring', 'true'); // Only show fully approved kegiatan (disetujui)
      if (selectedKro) params.append('kro_id', selectedKro);
      if (selectedStatusKinerja) params.append('status_kinerja', selectedStatusKinerja);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`/api/koordinator/kegiatan?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan || []);
        setFilters(data.filters || { kro_list: [] });
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKro, selectedStatusKinerja, selectedStatus]);

  // Filter by search term
  const filteredKegiatan = kegiatan.filter(k => 
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.tim_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kro_kode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.pelaksana_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusKinerjaBadge = (status: string) => {
    switch (status) {
      case 'Sukses':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Sukses</span>;
      case 'Perlu Perhatian':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Perlu Perhatian</span>;
      case 'Bermasalah':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Bermasalah</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Belum Dinilai</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Selesai</span>;
      case 'berjalan':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Berjalan</span>;
      case 'tertunda':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Tertunda</span>;
      case 'bermasalah':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Bermasalah</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Belum Mulai</span>;
    }
  };

  const getVerifikasiBadge = (kg: Kegiatan) => {
    const disahkan = kg.dokumen_disahkan || 0;
    const target = Math.round(kg.target_output) || 0;
    
    if (target > 0) {
      const isAllValid = disahkan >= target;
      const hasProgress = disahkan > 0;
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          isAllValid ? 'bg-green-100 text-green-700' :
          hasProgress ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {isAllValid ? '✓ ' : ''}{disahkan}/{target} Valid
        </span>
      );
    }
    
    switch (kg.status_verifikasi) {
      case 'valid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">✓ Valid</span>;
      case 'revisi':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">⚠ Revisi</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Pending</span>;
    }
  };

  const getSkorColor = (skor: number) => {
    if (skor >= 80) return 'text-green-600';
    if (skor >= 60) return 'text-amber-600';
    if (skor > 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuActivity className="w-6 h-6" />
              </div>
              Monitoring Kegiatan
            </h1>
            <p className="text-blue-100 mt-2">Pantau seluruh kegiatan dari tim Anda</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Cari kegiatan, pelaksana, KRO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={selectedKro}
            onChange={(e) => setSelectedKro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            suppressHydrationWarning
          >
            <option value="">Semua KRO</option>
            {filters?.kro_list.map(kro => (
              <option key={kro.id} value={kro.id}>{kro.kode} - {kro.nama}</option>
            ))}
          </select>

          <select
            value={selectedStatusKinerja}
            onChange={(e) => setSelectedStatusKinerja(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            suppressHydrationWarning
          >
            <option value="">Semua Status Kinerja</option>
            <option value="Sukses">Sukses</option>
            <option value="Perlu Perhatian">Perlu Perhatian</option>
            <option value="Bermasalah">Bermasalah</option>
            <option value="Belum Dinilai">Belum Dinilai</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredKegiatan.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <LuClipboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada kegiatan</h3>
          <p className="text-gray-500">Tidak ditemukan kegiatan sesuai filter yang dipilih</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">KRO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pelaksana</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kegiatan</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Kendala</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Capaian</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Kinerja</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Skor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Verifikasi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredKegiatan.map((kg) => (
                  <tr key={kg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700">
                        {kg.kro_kode || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{kg.pelaksana_nama || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{kg.nama}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(kg.tanggal_mulai)} - {formatDate(kg.tanggal_selesai)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(kg.status)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {kg.total_kendala && kg.total_kendala > 0 ? (
                        <span className="text-sm text-gray-700">{kg.total_kendala} kendala</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {kg.capaian_output_persen !== undefined ? `${kg.capaian_output_persen}%` : 
                            kg.target_output > 0 ? `${Math.round((kg.output_realisasi || 0) / kg.target_output * 100)}%` : '0%'}
                        </span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ 
                              width: `${Math.min(
                                kg.capaian_output_persen !== undefined ? kg.capaian_output_persen : 
                                kg.target_output > 0 ? Math.round((kg.output_realisasi || 0) / kg.target_output * 100) : 0, 
                                100
                              )}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusKinerjaBadge(kg.status_kinerja)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xl font-bold ${getSkorColor(kg.skor_kinerja || 0)}`}>
                        {kg.skor_kinerja || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getVerifikasiBadge(kg)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/koordinator/kegiatan/${kg.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <LuEye className="w-4 h-4" />
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
