'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LuClipboardList,
  LuSearch,
  LuFilter,
  LuCalendar,
  LuUser,
  LuTrendingUp
} from 'react-icons/lu';

interface Kegiatan {
  id: number;
  nama: string;
  tim_nama: string;
  kro_id: number;
  kro_kode: string;
  kro_nama: string;
  pelaksana_nama: string;
  status: string;
  status_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  skor_kinerja: number;
  status_kinerja: string;
}

interface KROFilter {
  id: number;
  kode: string;
  nama: string;
}

export default function KoordinatorKegiatanPage() {
  const [loading, setLoading] = useState(true);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [filteredKegiatan, setFilteredKegiatan] = useState<Kegiatan[]>([]);
  const [kroList, setKroList] = useState<KROFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kroFilter, setKroFilter] = useState<string>('all');

  useEffect(() => {
    fetchKegiatan();
  }, []);

  useEffect(() => {
    filterKegiatan();
  }, [kegiatan, searchQuery, statusFilter, kroFilter]);

  const fetchKegiatan = async () => {
    try {
      const res = await fetch('/api/koordinator/kegiatan');
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data.kegiatan || []);
        setKroList(data.filters?.kro_list || []);
      }
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterKegiatan = () => {
    let filtered = [...kegiatan];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(k => k.status === statusFilter);
    }

    if (kroFilter !== 'all') {
      filtered = filtered.filter(k => String(k.kro_id) === kroFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(k =>
        k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.pelaksana_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.kro_kode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredKegiatan(filtered);
  };

  const getStatusKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'bg-green-100 text-green-700';
      case 'Perlu Perhatian': return 'bg-yellow-100 text-yellow-700';
      case 'Bermasalah': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      berjalan: 'bg-blue-100 text-blue-700',
      selesai: 'bg-green-100 text-green-700',
      dibatalkan: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Kegiatan</h1>
        <p className="text-gray-600">Pantau semua kegiatan tim Anda</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kegiatan, pelaksana, atau KRO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="berjalan">Berjalan</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
        <select
          value={kroFilter}
          onChange={(e) => setKroFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">Semua KRO</option>
          {kroList.map(kro => (
            <option key={kro.id} value={kro.id}>{kro.kode} - {kro.nama}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{kegiatan.length}</p>
          <p className="text-sm text-gray-500">Total Kegiatan</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-blue-600">{kegiatan.filter(k => k.status === 'berjalan').length}</p>
          <p className="text-sm text-gray-500">Sedang Berjalan</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-green-600">{kegiatan.filter(k => k.status === 'selesai').length}</p>
          <p className="text-sm text-gray-500">Selesai</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-yellow-600">{kegiatan.filter(k => k.status_kinerja === 'Perlu Perhatian').length}</p>
          <p className="text-sm text-gray-500">Perlu Perhatian</p>
        </div>
      </div>

      {/* Kegiatan List */}
      <div className="space-y-4">
        {filteredKegiatan.length > 0 ? (
          filteredKegiatan.map((item) => (
            <Link
              key={item.id}
              href={`/koordinator/kegiatan/${item.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-lg flex-1">{item.nama}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusKinerjaColor(item.status_kinerja)}`}>
                      {item.status_kinerja}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">
                    {item.kro_kode} - {item.kro_nama}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LuUser className="w-4 h-4" />
                      <span>{item.pelaksana_nama}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <LuCalendar className="w-4 h-4" />
                      <span>{formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <LuTrendingUp className="w-4 h-4" />
                      <span>Skor: {item.skor_kinerja}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Progress Output</p>
                    <p className="font-semibold text-gray-900">
                      {item.output_realisasi || 0} / {item.target_output} {item.satuan_output}
                    </p>
                  </div>
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min((item.output_realisasi || 0) / item.target_output * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <LuClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada kegiatan</h3>
            <p className="text-gray-500">Belum ada kegiatan yang sesuai dengan filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
