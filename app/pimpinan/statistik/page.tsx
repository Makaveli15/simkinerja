'use client';

import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { 
  LuTrendingUp, 
  LuUsers, 
  LuCircleDollarSign, 
  LuTriangleAlert, 
  LuCalendar, 
  LuDownload,
  LuFileText
} from 'react-icons/lu';

interface KroData {
  kro_id: number;
  kro_kode: string;
  kro_nama: string;
  total_kegiatan: number;
  kegiatan_sukses: number;
  kegiatan_perlu_perhatian: number;
  kegiatan_bermasalah: number;
  kegiatan_selesai: number;
  rata_rata_skor: number;
  total_pagu: number;
  total_realisasi: number;
  serapan_persen: number;
}

interface TimData {
  tim_id: number;
  tim_nama: string;
  total_kegiatan: number;
  kegiatan_sukses: number;
  kegiatan_perlu_perhatian: number;
  kegiatan_bermasalah: number;
  kegiatan_selesai: number;
  rata_rata_skor: number;
  indikator?: {
    capaian_output: number;
    ketepatan_waktu: number;
    serapan_anggaran: number;
    kualitas_output: number;
  };
  total_pagu: number;
  total_realisasi: number;
  serapan_persen: number;
}

interface AnggaranData {
  kro_kode: string;
  kro_nama: string;
  total_kegiatan: number;
  pagu_anggaran: number;
  realisasi_anggaran: number;
  sisa_anggaran: number;
  serapan_persen: number;
}

interface BermasalahData {
  id: number;
  nama: string;
  tim_nama: string;
  kro_kode: string;
  kro_nama: string;
  status: string;
  status_kinerja: string;
  skor_kinerja: number;
  masalah_utama: string;
  capaian_output_persen: number;
  serapan_anggaran_persen: number;
  tanggal_selesai: string;
}

interface LaporanResponse {
  laporan: {
    judul: string;
    data: KroData[] | TimData[] | AnggaranData[] | BermasalahData[];
    summary: Record<string, number>;
  };
  generated_at: string;
  periode: {
    mulai: string;
    selesai: string;
  };
}

type TampilkanData = 'kro' | 'tim' | 'anggaran' | 'bermasalah';

export default function StatistikKinerjaPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tampilkan, setTampilkan] = useState<TampilkanData>('kro');
  const [periodeMulai, setPeriodeMulai] = useState('');
  const [periodeSelesai, setPeriodeSelesai] = useState('');
  const [laporanData, setLaporanData] = useState<LaporanResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, [tampilkan, periodeMulai, periodeSelesai]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `/api/pimpinan/laporan?jenis=${tampilkan}`;
      if (periodeMulai) url += `&periode_mulai=${periodeMulai}`;
      if (periodeSelesai) url += `&periode_selesai=${periodeSelesai}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLaporanData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSkorColor = (skor: number) => {
    if (skor >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (skor >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (skor >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getStatusKinerjaStyle = (status: string) => {
    switch (status) {
      case 'Sukses': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Perlu Perhatian': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Bermasalah': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getTabTitle = () => {
    switch (tampilkan) {
      case 'kro': return 'Statistik per KRO';
      case 'tim': return 'Statistik per Tim';
      case 'anggaran': return 'Realisasi Anggaran';
      case 'bermasalah': return 'Kegiatan Bermasalah';
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!laporanData) return;
    
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SimKinerja';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Statistik Kinerja');
      
      // Title
      sheet.mergeCells('A1:L1');
      sheet.getCell('A1').value = getTabTitle().toUpperCase();
      sheet.getCell('A1').font = { bold: true, size: 16 };
      sheet.getCell('A1').alignment = { horizontal: 'center' };
      
      sheet.mergeCells('A2:L2');
      sheet.getCell('A2').value = `Digenerate: ${new Date(laporanData.generated_at).toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`;
      sheet.getCell('A2').alignment = { horizontal: 'center' };
      sheet.getCell('A2').font = { size: 10, italic: true };
      
      sheet.addRow([]);

      // Data based on type
      if (tampilkan === 'kro') {
        const data = laporanData.laporan.data as KroData[];
        
        const headerRow = sheet.addRow(['No', 'Kode KRO', 'Nama KRO', 'Kegiatan', 'Selesai', 'Sukses', 'Perlu Perhatian', 'Bermasalah', 'Skor Rata-rata', 'Target Anggaran', 'Realisasi', 'Serapan']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        headerRow.alignment = { horizontal: 'center' };
        
        data.forEach((item, idx) => {
          sheet.addRow([
            idx + 1,
            item.kro_kode,
            item.kro_nama,
            item.total_kegiatan,
            item.kegiatan_selesai,
            item.kegiatan_sukses,
            item.kegiatan_perlu_perhatian,
            item.kegiatan_bermasalah,
            `${item.rata_rata_skor}%`,
            formatCurrency(item.total_pagu),
            formatCurrency(item.total_realisasi),
            `${item.serapan_persen}%`
          ]);
        });

        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 12;
        sheet.getColumn(3).width = 40;
        sheet.getColumn(4).width = 10;
        sheet.getColumn(5).width = 10;
        sheet.getColumn(6).width = 10;
        sheet.getColumn(7).width = 16;
        sheet.getColumn(8).width = 12;
        sheet.getColumn(9).width = 14;
        sheet.getColumn(10).width = 20;
        sheet.getColumn(11).width = 20;
        sheet.getColumn(12).width = 12;

      } else if (tampilkan === 'tim') {
        const data = laporanData.laporan.data as TimData[];
        
        const headerRow = sheet.addRow(['No', 'Nama Tim', 'Kegiatan', 'Selesai', 'Sukses', 'Perlu Perhatian', 'Bermasalah', 'Skor Rata-rata', 'Capaian Output', 'Ketepatan Waktu', 'Serapan Anggaran', 'Kualitas']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        headerRow.alignment = { horizontal: 'center' };
        
        data.forEach((item, idx) => {
          sheet.addRow([
            idx + 1,
            item.tim_nama,
            item.total_kegiatan,
            item.kegiatan_selesai,
            item.kegiatan_sukses,
            item.kegiatan_perlu_perhatian,
            item.kegiatan_bermasalah,
            `${item.rata_rata_skor}%`,
            `${item.indikator?.capaian_output ?? 0}%`,
            `${item.indikator?.ketepatan_waktu ?? 0}%`,
            `${item.indikator?.serapan_anggaran ?? 0}%`,
            `${item.indikator?.kualitas_output ?? 0}%`
          ]);
        });

        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 30;
        sheet.getColumn(3).width = 10;
        sheet.getColumn(4).width = 10;
        sheet.getColumn(5).width = 10;
        sheet.getColumn(6).width = 16;
        sheet.getColumn(7).width = 12;
        sheet.getColumn(8).width = 14;
        sheet.getColumn(9).width = 15;
        sheet.getColumn(10).width = 16;
        sheet.getColumn(11).width = 17;
        sheet.getColumn(12).width = 12;

      } else if (tampilkan === 'anggaran') {
        const data = laporanData.laporan.data as AnggaranData[];
        
        const headerRow = sheet.addRow(['No', 'Kode KRO', 'Nama KRO', 'Kegiatan', 'Target Anggaran', 'Realisasi', 'Sisa', 'Serapan']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        headerRow.alignment = { horizontal: 'center' };
        
        data.forEach((item, idx) => {
          sheet.addRow([
            idx + 1,
            item.kro_kode,
            item.kro_nama,
            item.total_kegiatan,
            formatCurrency(item.pagu_anggaran),
            formatCurrency(item.realisasi_anggaran),
            formatCurrency(item.sisa_anggaran),
            `${item.serapan_persen}%`
          ]);
        });

        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 12;
        sheet.getColumn(3).width = 40;
        sheet.getColumn(4).width = 10;
        sheet.getColumn(5).width = 22;
        sheet.getColumn(6).width = 22;
        sheet.getColumn(7).width = 22;
        sheet.getColumn(8).width = 12;

      } else if (tampilkan === 'bermasalah') {
        const data = laporanData.laporan.data as BermasalahData[];
        
        const headerRow = sheet.addRow(['No', 'Nama Kegiatan', 'Tim', 'KRO', 'Status Kinerja', 'Skor', 'Capaian Output', 'Serapan Anggaran', 'Masalah Utama', 'Deadline']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
        headerRow.alignment = { horizontal: 'center' };
        
        data.forEach((item, idx) => {
          sheet.addRow([
            idx + 1,
            item.nama,
            item.tim_nama,
            item.kro_kode,
            item.status_kinerja,
            `${item.skor_kinerja}%`,
            `${item.capaian_output_persen}%`,
            `${item.serapan_anggaran_persen}%`,
            item.masalah_utama,
            item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-'
          ]);
        });

        sheet.getColumn(1).width = 5;
        sheet.getColumn(2).width = 35;
        sheet.getColumn(3).width = 20;
        sheet.getColumn(4).width = 12;
        sheet.getColumn(5).width = 15;
        sheet.getColumn(6).width = 10;
        sheet.getColumn(7).width = 15;
        sheet.getColumn(8).width = 17;
        sheet.getColumn(9).width = 35;
        sheet.getColumn(10).width = 12;
      }

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Statistik_${tampilkan}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Gagal mengexport data');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { value: 'kro', label: 'Per KRO', icon: (
      <LuTrendingUp className="w-4 h-4" />
    ), color: 'blue' },
    { value: 'tim', label: 'Per Tim', icon: (
      <LuUsers className="w-4 h-4" />
    ), color: 'emerald' },
    { value: 'anggaran', label: 'Anggaran', icon: (
      <LuCircleDollarSign className="w-4 h-4" />
    ), color: 'amber' },
    { value: 'bermasalah', label: 'Bermasalah', icon: (
      <LuTriangleAlert className="w-4 h-4" />
    ), color: 'red' },
  ];

  const getTabStyle = (tab: typeof tabs[0], isActive: boolean) => {
    if (!isActive) return 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200';
    switch (tab.color) {
      case 'blue': return 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200';
      case 'emerald': return 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200';
      case 'amber': return 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200';
      case 'red': return 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200';
      default: return 'bg-blue-600 text-white border-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuTrendingUp className="w-6 h-6" />
              </div>
              Statistik Kinerja
            </h1>
            <p className="text-blue-100 mt-2">Rekap capaian kinerja kegiatan berdasarkan berbagai kategori</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={exporting || !laporanData}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Mengexport...</span>
              </>
            ) : (
              <>
                <LuDownload className="w-5 h-5" />
                <span>Export Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setTampilkan(tab.value as TampilkanData)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${getTabStyle(tab, tampilkan === tab.value)}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Period Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <LuCalendar className="w-4 h-4" />
              <span>Periode:</span>
            </div>
            <input
              type="date"
              value={periodeMulai}
              onChange={(e) => setPeriodeMulai(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={periodeSelesai}
              onChange={(e) => setPeriodeSelesai(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {laporanData && laporanData.laporan.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(laporanData.laporan.summary).map(([key, value], index) => {
            const isMonetary = key.includes('pagu') || key.includes('realisasi') || key.includes('sisa');
            const isPercentage = key.includes('persen') || key.includes('skor');
            const label = key.replace(/_/g, ' ').replace('pagu', 'target anggaran');
            
            return (
              <div key={`summary-${key}-${index}`} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 capitalize font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {isMonetary
                    ? formatCurrency(value as number)
                    : isPercentage
                      ? `${value}%`
                      : String(value)
                  }
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Memuat data...</p>
          </div>
        </div>
      ) : !laporanData || laporanData.laporan.data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuFileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data</h3>
          <p className="text-gray-500">Tidak ada data kinerja untuk periode yang dipilih</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-bold text-gray-900">{getTabTitle()}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Terakhir diperbarui: {new Date(laporanData.generated_at).toLocaleDateString('id-ID', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          <div className="overflow-x-auto">
            {/* KRO Table */}
            {tampilkan === 'kro' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">No</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Kode</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Nama KRO</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-800 uppercase tracking-wider">Kegiatan</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-800 uppercase tracking-wider">Selesai</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-800 uppercase tracking-wider">Status Kinerja</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-800 uppercase tracking-wider">Skor</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-blue-800 uppercase tracking-wider">Target Anggaran</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-blue-800 uppercase tracking-wider">Realisasi</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-800 uppercase tracking-wider">Serapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(laporanData.laporan.data as KroData[]).map((item, idx) => (
                    <tr key={item.kro_id || idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">{item.kro_kode}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.kro_nama}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{item.total_kegiatan}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-gray-600">{item.kegiatan_selesai}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium" title="Sukses">{item.kegiatan_sukses}</span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium" title="Perlu Perhatian">{item.kegiatan_perlu_perhatian}</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium" title="Bermasalah">{item.kegiatan_bermasalah}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getSkorColor(item.rata_rata_skor)}`}>
                          {item.rata_rata_skor}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700 font-medium">{formatCurrency(item.total_pagu)}</td>
                      <td className="px-4 py-4 text-right text-sm text-emerald-600 font-semibold">{formatCurrency(item.total_realisasi)}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${item.serapan_persen >= 80 ? 'bg-emerald-500' : item.serapan_persen >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(item.serapan_persen, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{item.serapan_persen}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tim Table */}
            {tampilkan === 'tim' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <th className="px-4 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">No</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Nama Tim</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Kegiatan</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Status Kinerja</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Skor</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Capaian Output</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Ketepatan Waktu</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Serapan Anggaran</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Kualitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(laporanData.laporan.data as TimData[]).map((item, idx) => (
                    <tr key={item.tim_id || idx} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <LuUsers className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-sm text-gray-900 font-medium">{item.tim_nama}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{item.total_kegiatan}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium" title="Sukses">{item.kegiatan_sukses}</span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium" title="Perlu Perhatian">{item.kegiatan_perlu_perhatian}</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium" title="Bermasalah">{item.kegiatan_bermasalah}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getSkorColor(item.rata_rata_skor)}`}>
                          {item.rata_rata_skor}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-semibold text-gray-700">{item.indikator?.capaian_output ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{item.indikator?.ketepatan_waktu ?? 0}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{item.indikator?.serapan_anggaran ?? 0}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{item.indikator?.kualitas_output ?? 0}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Anggaran Table */}
            {tampilkan === 'anggaran' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                    <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">No</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Kode</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Nama KRO</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-amber-800 uppercase tracking-wider">Kegiatan</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-amber-800 uppercase tracking-wider">Target Anggaran</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-amber-800 uppercase tracking-wider">Realisasi</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-amber-800 uppercase tracking-wider">Sisa</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-amber-800 uppercase tracking-wider">Serapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(laporanData.laporan.data as AnggaranData[]).map((item, idx) => (
                    <tr key={`${item.kro_kode}-${idx}`} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">{item.kro_kode}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.kro_nama}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{item.total_kegiatan}</span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900 font-semibold">{formatCurrency(item.pagu_anggaran)}</td>
                      <td className="px-4 py-4 text-right text-sm text-emerald-600 font-semibold">{formatCurrency(item.realisasi_anggaran)}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600">{formatCurrency(item.sisa_anggaran)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${item.serapan_persen >= 80 ? 'bg-emerald-500' : item.serapan_persen >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(item.serapan_persen, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{item.serapan_persen}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Bermasalah Table */}
            {tampilkan === 'bermasalah' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                    <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">No</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Nama Kegiatan</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Tim</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">KRO</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Skor</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Capaian</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Serapan</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Masalah</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-red-800 uppercase tracking-wider">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(laporanData.laporan.data as BermasalahData[]).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 font-medium line-clamp-2">{item.nama}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{item.tim_nama}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{item.kro_kode}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusKinerjaStyle(item.status_kinerja)}`}>
                          {item.status_kinerja}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getSkorColor(item.skor_kinerja)}`}>
                          {item.skor_kinerja}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">{item.capaian_output_persen}%</td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">{item.serapan_anggaran_persen}%</td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-red-600 font-medium line-clamp-2">{item.masalah_utama}</span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-600">
                        {item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
