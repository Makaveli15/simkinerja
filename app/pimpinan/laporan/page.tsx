'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

type JenisLaporan = 'kro' | 'tim' | 'anggaran' | 'bermasalah';

interface LaporanData {
  laporan: {
    judul: string;
    data: unknown[];
    summary: Record<string, number>;
  };
  generated_at: string;
  periode: {
    mulai: string;
    selesai: string;
  };
}

export default function PimpinanLaporanPage() {
  const [loading, setLoading] = useState(false);
  const [jenisLaporan, setJenisLaporan] = useState<JenisLaporan>('kro');
  const [data, setData] = useState<LaporanData | null>(null);
  const [periodeMulai, setPeriodeMulai] = useState('');
  const [periodeSelesai, setPeriodeSelesai] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('jenis', jenisLaporan);
      if (periodeMulai) params.append('periode_mulai', periodeMulai);
      if (periodeSelesai) params.append('periode_selesai', periodeSelesai);

      const res = await fetch(`/api/pimpinan/laporan?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [jenisLaporan, periodeMulai, periodeSelesai]);

  const handleExportExcel = () => {
    if (!data) return;
    
    let csv = '';
    const laporan = data.laporan;
    
    if (jenisLaporan === 'kro') {
      csv = 'KRO Kode,KRO Nama,Total Kegiatan,Sukses,Perlu Perhatian,Bermasalah,Rata-rata Skor,Target Anggaran,Total Realisasi,Serapan %\n';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (laporan.data as any[]).forEach((row: any) => {
        csv += `"${row.kro_kode}","${row.kro_nama}",${row.total_kegiatan},${row.kegiatan_sukses},${row.kegiatan_perlu_perhatian},${row.kegiatan_bermasalah},${row.rata_rata_skor},${row.total_pagu},${row.total_realisasi},${row.serapan_persen}\n`;
      });
    } else if (jenisLaporan === 'tim') {
      csv = 'Tim,Total Kegiatan,Sukses,Perlu Perhatian,Bermasalah,Rata-rata Skor,Target Anggaran,Total Realisasi,Serapan %\n';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (laporan.data as any[]).forEach((row: any) => {
        csv += `"${row.tim_nama}",${row.total_kegiatan},${row.kegiatan_sukses},${row.kegiatan_perlu_perhatian},${row.kegiatan_bermasalah},${row.rata_rata_skor},${row.total_pagu},${row.total_realisasi},${row.serapan_persen}\n`;
      });
    } else if (jenisLaporan === 'anggaran') {
      csv = 'KRO Kode,KRO Nama,Total Kegiatan,Target Anggaran,Realisasi Anggaran,Sisa Anggaran,Serapan %\n';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (laporan.data as any[]).forEach((row: any) => {
        csv += `"${row.kro_kode}","${row.kro_nama}",${row.total_kegiatan},${row.pagu_anggaran},${row.realisasi_anggaran},${row.sisa_anggaran},${row.serapan_persen}\n`;
      });
    } else if (jenisLaporan === 'bermasalah') {
      csv = 'Kegiatan,Tim,KRO,Status,Status Kinerja,Skor,Masalah Utama,Capaian %,Serapan %\n';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (laporan.data as any[]).forEach((row: any) => {
        csv += `"${row.nama}","${row.tim_nama || '-'}","${row.kro_kode}","${row.status}","${row.status_kinerja}",${row.skor_kinerja},"${row.masalah_utama}",${row.capaian_output_persen},${row.serapan_anggaran_persen}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_${jenisLaporan}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getSkorColor = (skor: number) => {
    if (skor >= 80) return '#10B981';
    if (skor >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const laporanTabs = [
    { key: 'kro', label: 'Kinerja per KRO', icon: '📊' },
    { key: 'tim', label: 'Kinerja per Tim', icon: '👥' },
    { key: 'anggaran', label: 'Realisasi Anggaran', icon: '💰' },
    { key: 'bermasalah', label: 'Kegiatan Bermasalah', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Kinerja</h1>
          <p className="text-gray-500 mt-1">Lihat dan export laporan capaian kinerja</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!data || loading}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak
          </button>
        </div>
      </div>

      {/* Laporan Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {laporanTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setJenisLaporan(tab.key as JenisLaporan)}
              className={`flex-1 min-w-[150px] px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                jenisLaporan === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Periode Mulai</label>
            <input
              type="date"
              value={periodeMulai}
              onChange={(e) => setPeriodeMulai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Periode Selesai</label>
            <input
              type="date"
              value={periodeSelesai}
              onChange={(e) => setPeriodeSelesai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {(periodeMulai || periodeSelesai) && (
            <button
              onClick={() => { setPeriodeMulai(''); setPeriodeSelesai(''); }}
              className="self-end px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {data.laporan.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(data.laporan.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {typeof value === 'number' && key.includes('pagu') || key.includes('realisasi')
                          ? formatCurrency(value)
                          : typeof value === 'number' && key.includes('persen')
                          ? `${Math.round(value)}%`
                          : value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart */}
              {(jenisLaporan === 'kro' || jenisLaporan === 'tim') && data.laporan.data.length > 0 && (
                <div className="mb-6 bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Grafik Skor Kinerja {jenisLaporan === 'kro' ? 'per KRO' : 'per Tim'}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.laporan.data as any[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={jenisLaporan === 'kro' ? 'kro_kode' : 'tim_nama'} 
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${Math.round(Number(value || 0))}%`, 'Skor']}
                        labelFormatter={(label) => {
                          if (jenisLaporan === 'kro') {
                            const item = (data.laporan.data as any[]).find(k => k.kro_kode === label);
                            return item ? `${label} - ${item.kro_nama}` : label;
                          }
                          return label;
                        }}
                      />
                      <Bar dataKey="rata_rata_skor" name="Rata-rata Skor" radius={[4, 4, 0, 0]}>
                        {(data.laporan.data as any[]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getSkorColor(entry.rata_rata_skor)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Anggaran Chart */}
              {jenisLaporan === 'anggaran' && data.laporan.data.length > 0 && (
                <div className="mb-6 bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Grafik Serapan Anggaran per KRO
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.laporan.data as any[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="kro_kode" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'serapan_persen' ? `${Math.round(Number(value || 0))}%` : formatCurrency(Number(value || 0)),
                          name === 'pagu_anggaran' ? 'Target Anggaran' : name === 'realisasi_anggaran' ? 'Realisasi' : 'Serapan'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="pagu_anggaran" name="Target Anggaran" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realisasi_anggaran" name="Realisasi" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {jenisLaporan === 'kro' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">KRO</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Kegiatan</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Sukses</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Perhatian</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Bermasalah</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Skor</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Serapan</th>
                        </>
                      )}
                      {jenisLaporan === 'tim' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tim</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Kegiatan</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Sukses</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Perhatian</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Bermasalah</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Skor</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Serapan</th>
                        </>
                      )}
                      {jenisLaporan === 'anggaran' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">KRO</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Kegiatan</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Target Anggaran</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Realisasi</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sisa</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Serapan</th>
                        </>
                      )}
                      {jenisLaporan === 'bermasalah' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kegiatan</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tim</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Skor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Masalah</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.laporan.data as any[]).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                        {jenisLaporan === 'kro' && (
                          <>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{row.kro_kode}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.kro_nama}</p>
                            </td>
                            <td className="py-3 px-4 text-center">{row.total_kegiatan}</td>
                            <td className="py-3 px-4 text-center text-green-600">{row.kegiatan_sukses}</td>
                            <td className="py-3 px-4 text-center text-amber-600">{row.kegiatan_perlu_perhatian}</td>
                            <td className="py-3 px-4 text-center text-red-600">{row.kegiatan_bermasalah}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                row.rata_rata_skor >= 80 ? 'bg-green-100 text-green-700' :
                                row.rata_rata_skor >= 60 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {Math.round(row.rata_rata_skor)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">{Math.round(row.serapan_persen)}%</td>
                          </>
                        )}
                        {jenisLaporan === 'tim' && (
                          <>
                            <td className="py-3 px-4 font-medium text-gray-900">{row.tim_nama}</td>
                            <td className="py-3 px-4 text-center">{row.total_kegiatan}</td>
                            <td className="py-3 px-4 text-center text-green-600">{row.kegiatan_sukses}</td>
                            <td className="py-3 px-4 text-center text-amber-600">{row.kegiatan_perlu_perhatian}</td>
                            <td className="py-3 px-4 text-center text-red-600">{row.kegiatan_bermasalah}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                row.rata_rata_skor >= 80 ? 'bg-green-100 text-green-700' :
                                row.rata_rata_skor >= 60 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {Math.round(row.rata_rata_skor)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">{Math.round(row.serapan_persen)}%</td>
                          </>
                        )}
                        {jenisLaporan === 'anggaran' && (
                          <>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{row.kro_kode}</p>
                              <p className="text-xs text-gray-500">{row.kro_nama}</p>
                            </td>
                            <td className="py-3 px-4 text-center">{row.total_kegiatan}</td>
                            <td className="py-3 px-4 text-right text-sm">{formatCurrency(row.pagu_anggaran)}</td>
                            <td className="py-3 px-4 text-right text-sm">{formatCurrency(row.realisasi_anggaran)}</td>
                            <td className="py-3 px-4 text-right text-sm">{formatCurrency(row.sisa_anggaran)}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${Math.min(row.serapan_persen, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{Math.round(row.serapan_persen)}%</span>
                              </div>
                            </td>
                          </>
                        )}
                        {jenisLaporan === 'bermasalah' && (
                          <>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{row.nama}</p>
                              <p className="text-xs text-gray-500">{row.kro_kode}</p>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{row.tim_nama || '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {row.status_kinerja}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-red-600">{Math.round(row.skor_kinerja)}%</td>
                            <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[200px]">{row.masalah_utama || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <Link 
                                href={`/pimpinan/kegiatan/${row.id}`}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Detail
                              </Link>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {data.laporan.data.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Tidak ada data untuk ditampilkan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
