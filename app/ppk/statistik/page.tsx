'use client';

import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { 
  LuTrendingUp, 
  LuTrendingDown,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuCircleX,
  LuWallet,
  LuActivity,
  LuCircle,
  LuArrowUpRight,
  LuArrowDownRight,
  LuBanknote,
  LuReceipt,
  LuBuilding2,
  LuDownload
} from 'react-icons/lu';

interface StatistikData {
  total_kegiatan: number;
  kegiatan_pending: number;
  kegiatan_approved: number;
  kegiatan_rejected: number;
  kegiatan_bulan_ini: number;
  rata_rata_waktu_approval: number;
  total_anggaran: number;
  total_realisasi: number;
  sisa_anggaran: number;
  persentase_serapan: number;
  anggaran_approved: number;
  anggaran_pending: number;
  anggaran_rejected: number;
}

interface AnggaranPerTim {
  tim_nama: string;
  target_anggaran: number;
  realisasi_anggaran: number;
}

interface AnggaranPerBulan {
  bulan: string;
  target_anggaran: number;
  realisasi_anggaran: number;
}

interface TopKegiatan {
  id: number;
  nama: string;
  target_anggaran: number;
  realisasi_anggaran: number;
  status_pengajuan: string;
  tim_nama: string;
}

export default function StatistikAnggaranPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statistik, setStatistik] = useState<StatistikData | null>(null);
  const [anggaranPerTim, setAnggaranPerTim] = useState<AnggaranPerTim[]>([]);
  const [anggaranPerBulan, setAnggaranPerBulan] = useState<AnggaranPerBulan[]>([]);
  const [topKegiatan, setTopKegiatan] = useState<TopKegiatan[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStatistik();
  }, []);

  const fetchStatistik = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ppk/statistik');
      if (response.ok) {
        const data = await response.json();
        setStatistik(data.statistik);
        setAnggaranPerTim(data.anggaran_per_tim || []);
        setAnggaranPerBulan(data.anggaran_per_bulan || []);
        setTopKegiatan(data.top_kegiatan || []);
      }
    } catch (error) {
      console.error('Error fetching statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!mounted) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    if (!mounted) return 'Rp 0';
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}Rb`;
    }
    return formatCurrency(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'approved_ppk':
      case 'approved_pimpinan':
      case 'disetujui':
        return 'bg-green-100 text-green-700';
      case 'review_ppk':
      case 'review_pimpinan':
      case 'approved_koordinator':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
      case 'rejected_ppk':
      case 'revisi':
      case 'ditolak':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
      case 'approved_ppk':
      case 'approved_pimpinan':
      case 'disetujui':
        return 'Disetujui';
      case 'review_ppk':
        return 'Menunggu PPK';
      case 'review_pimpinan':
        return 'Menunggu Pimpinan';
      case 'approved_koordinator':
        return 'Disetujui Koordinator';
      case 'rejected':
      case 'rejected_ppk':
      case 'ditolak':
        return 'Ditolak';
      case 'revisi':
        return 'Revisi';
      default:
        return status;
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!statistik) return;
    
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SimKinerja';
      workbook.created = new Date();

      // Sheet 1: Ringkasan
      const ringkasanSheet = workbook.addWorksheet('Ringkasan Anggaran');
      ringkasanSheet.mergeCells('A1:D1');
      ringkasanSheet.getCell('A1').value = 'STATISTIK ANGGARAN PPK';
      ringkasanSheet.getCell('A1').font = { bold: true, size: 16 };
      ringkasanSheet.getCell('A1').alignment = { horizontal: 'center' };
      
      ringkasanSheet.mergeCells('A2:D2');
      ringkasanSheet.getCell('A2').value = `Digenerate: ${new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`;
      ringkasanSheet.getCell('A2').alignment = { horizontal: 'center' };
      ringkasanSheet.getCell('A2').font = { size: 10, italic: true };
      
      ringkasanSheet.addRow([]);
      
      const ringkasanHeaderRow = ringkasanSheet.addRow(['Indikator', 'Nilai']);
      ringkasanHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ringkasanHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      
      ringkasanSheet.addRow(['Total Target Anggaran', formatCurrency(statistik.total_anggaran)]);
      ringkasanSheet.addRow(['Total Realisasi', formatCurrency(statistik.total_realisasi)]);
      ringkasanSheet.addRow(['Sisa Anggaran', formatCurrency(statistik.sisa_anggaran)]);
      ringkasanSheet.addRow(['Persentase Serapan', `${statistik.persentase_serapan.toFixed(1)}%`]);
      ringkasanSheet.addRow([]);
      ringkasanSheet.addRow(['Total Kegiatan', statistik.total_kegiatan]);
      ringkasanSheet.addRow(['Kegiatan Disetujui', statistik.kegiatan_approved]);
      ringkasanSheet.addRow(['Kegiatan Pending', statistik.kegiatan_pending]);
      ringkasanSheet.addRow(['Kegiatan Ditolak', statistik.kegiatan_rejected]);
      ringkasanSheet.addRow(['Kegiatan Bulan Ini', statistik.kegiatan_bulan_ini]);
      ringkasanSheet.addRow([]);
      ringkasanSheet.addRow(['Anggaran Disetujui', formatCurrency(statistik.anggaran_approved)]);
      ringkasanSheet.addRow(['Anggaran Pending', formatCurrency(statistik.anggaran_pending)]);
      ringkasanSheet.addRow(['Anggaran Ditolak/Revisi', formatCurrency(statistik.anggaran_rejected)]);
      ringkasanSheet.addRow([]);
      ringkasanSheet.addRow(['Rata-rata Waktu Approval', `${statistik.rata_rata_waktu_approval} hari`]);
      
      ringkasanSheet.getColumn(1).width = 30;
      ringkasanSheet.getColumn(2).width = 30;

      // Sheet 2: Anggaran Per Tim
      if (anggaranPerTim.length > 0) {
        const timSheet = workbook.addWorksheet('Anggaran Per Tim');
        const timHeaderRow = timSheet.addRow(['No', 'Nama Tim', 'Target Anggaran', 'Realisasi', 'Serapan (%)']);
        timHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        timHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        
        anggaranPerTim.forEach((item, idx) => {
          const serapan = item.target_anggaran > 0 ? (item.realisasi_anggaran / item.target_anggaran * 100) : 0;
          timSheet.addRow([idx + 1, item.tim_nama, formatCurrency(item.target_anggaran), formatCurrency(item.realisasi_anggaran), `${serapan.toFixed(1)}%`]);
        });
        
        timSheet.getColumn(1).width = 5;
        timSheet.getColumn(2).width = 30;
        timSheet.getColumn(3).width = 25;
        timSheet.getColumn(4).width = 25;
        timSheet.getColumn(5).width = 15;
      }

      // Sheet 3: Tren Bulanan
      if (anggaranPerBulan.length > 0) {
        const bulanSheet = workbook.addWorksheet('Tren Bulanan');
        const bulanHeaderRow = bulanSheet.addRow(['Bulan', 'Target Anggaran', 'Realisasi', 'Serapan (%)']);
        bulanHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        bulanHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
        
        anggaranPerBulan.forEach((item) => {
          const serapan = item.target_anggaran > 0 ? (item.realisasi_anggaran / item.target_anggaran * 100) : 0;
          bulanSheet.addRow([item.bulan, formatCurrency(item.target_anggaran), formatCurrency(item.realisasi_anggaran), `${serapan.toFixed(1)}%`]);
        });
        
        bulanSheet.getColumn(1).width = 20;
        bulanSheet.getColumn(2).width = 25;
        bulanSheet.getColumn(3).width = 25;
        bulanSheet.getColumn(4).width = 15;
      }

      // Sheet 4: Top Kegiatan
      if (topKegiatan.length > 0) {
        const topSheet = workbook.addWorksheet('Top Kegiatan');
        const topHeaderRow = topSheet.addRow(['No', 'Nama Kegiatan', 'Tim', 'Target Anggaran', 'Realisasi', 'Serapan (%)', 'Status']);
        topHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        topHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        
        topKegiatan.forEach((item, idx) => {
          const serapan = item.target_anggaran > 0 ? (item.realisasi_anggaran / item.target_anggaran * 100) : 0;
          topSheet.addRow([idx + 1, item.nama, item.tim_nama || '-', formatCurrency(item.target_anggaran), formatCurrency(item.realisasi_anggaran), `${serapan.toFixed(1)}%`, getStatusLabel(item.status_pengajuan)]);
        });
        
        topSheet.getColumn(1).width = 5;
        topSheet.getColumn(2).width = 40;
        topSheet.getColumn(3).width = 25;
        topSheet.getColumn(4).width = 25;
        topSheet.getColumn(5).width = 25;
        topSheet.getColumn(6).width = 15;
        topSheet.getColumn(7).width = 18;
      }

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Statistik_Anggaran_PPK_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Gagal mengexport data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat statistik anggaran...</p>
        </div>
      </div>
    );
  }

  const serapanPersen = statistik?.persentase_serapan || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuWallet className="w-6 h-6" />
              </div>
              Statistik Anggaran
            </h1>
            <p className="text-blue-100 mt-2">Monitoring dan analisis pengelolaan anggaran kegiatan</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              disabled={exporting || !statistik}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengexport...</span>
                </>
              ) : (
                <>
                  <LuDownload className="w-5 h-5" />
                  <span>Export Excel</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
              <LuCalendar className="w-4 h-4" />
              {mounted ? new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Anggaran Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target Anggaran */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Target Anggaran</p>
              <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(statistik?.total_anggaran || 0)}</p>
              <p className="text-xs text-gray-400 mt-1">dari {statistik?.total_kegiatan || 0} kegiatan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <LuBanknote className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Realisasi */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Realisasi</p>
              <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(statistik?.total_realisasi || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                {serapanPersen >= 50 ? (
                  <LuArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <LuArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-400">{serapanPersen.toFixed(1)}% serapan</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <LuReceipt className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Sisa Anggaran */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Sisa Anggaran</p>
              <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(statistik?.sisa_anggaran || 0)}</p>
              <p className="text-xs text-gray-400 mt-1">{(100 - serapanPersen).toFixed(1)}% tersisa</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <LuWallet className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Persentase Serapan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Persentase Serapan</p>
              <p className={`text-3xl font-bold mt-2 ${serapanPersen >= 80 ? 'text-green-600' : serapanPersen >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{serapanPersen.toFixed(1)}%</p>
              <p className={`text-xs mt-1 ${serapanPersen >= 80 ? 'text-green-500' : serapanPersen >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {serapanPersen >= 80 ? 'Sangat Baik' : serapanPersen >= 50 ? 'Cukup' : 'Perlu Perhatian'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${serapanPersen >= 80 ? 'bg-green-50' : serapanPersen >= 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
              <LuActivity className={`w-6 h-6 ${serapanPersen >= 80 ? 'text-green-600' : serapanPersen >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Anggaran by Status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LuActivity className="w-5 h-5 text-blue-600" />
          Anggaran Berdasarkan Status Approval
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                <LuCircleCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Anggaran Disetujui</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(statistik?.anggaran_approved || 0)}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-green-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${statistik?.total_anggaran ? (statistik.anggaran_approved / statistik.total_anggaran * 100) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {statistik?.total_anggaran ? Math.round(statistik.anggaran_approved / statistik.total_anggaran * 100) : 0}% dari total anggaran
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white">
                <LuClock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-yellow-700 font-medium">Anggaran Menunggu</p>
                <p className="text-xl font-bold text-yellow-800">{formatCurrency(statistik?.anggaran_pending || 0)}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-yellow-200 rounded-full">
                <div 
                  className="h-2 bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${statistik?.total_anggaran ? (statistik.anggaran_pending / statistik.total_anggaran * 100) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                {statistik?.total_anggaran ? Math.round(statistik.anggaran_pending / statistik.total_anggaran * 100) : 0}% menunggu approval
              </p>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
                <LuCircleX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Anggaran Ditolak/Revisi</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(statistik?.anggaran_rejected || 0)}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-red-200 rounded-full">
                <div 
                  className="h-2 bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${statistik?.total_anggaran ? (statistik.anggaran_rejected / statistik.total_anggaran * 100) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-red-600 mt-1">
                {statistik?.total_anggaran ? Math.round(statistik.anggaran_rejected / statistik.total_anggaran * 100) : 0}% perlu revisi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anggaran Per Tim */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuBuilding2 className="w-5 h-5 text-blue-600" />
            Anggaran Per Tim
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {anggaranPerTim.length > 0 ? (
              anggaranPerTim.map((item, index) => {
                const serapanTim = item.target_anggaran > 0 ? (item.realisasi_anggaran / item.target_anggaran * 100) : 0;
                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 text-sm">{item.tim_nama}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        serapanTim >= 80 ? 'bg-green-100 text-green-700' : 
                        serapanTim >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {serapanTim.toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <span className="font-semibold text-gray-800 ml-1">{formatCurrencyShort(item.target_anggaran)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Realisasi:</span>
                        <span className="font-semibold text-green-600 ml-1">{formatCurrencyShort(item.realisasi_anggaran)}</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          serapanTim >= 80 ? 'bg-green-500' : 
                          serapanTim >= 50 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(serapanTim, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada data tim</p>
            )}
          </div>
        </div>

        {/* Realisasi Per Bulan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTrendingUp className="w-5 h-5 text-blue-600" />
            Tren Anggaran 6 Bulan Terakhir
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {anggaranPerBulan.length > 0 ? (
              anggaranPerBulan.map((item, index) => {
                const serapanBulan = item.target_anggaran > 0 ? (item.realisasi_anggaran / item.target_anggaran * 100) : 0;
                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 text-sm">{item.bulan}</span>
                      <div className="flex items-center gap-1">
                        {serapanBulan >= 50 ? (
                          <LuTrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <LuTrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs font-semibold ${
                          serapanBulan >= 50 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {serapanBulan.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <span className="text-blue-600 block">Target</span>
                        <span className="font-semibold text-blue-800">{formatCurrencyShort(item.target_anggaran)}</span>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg">
                        <span className="text-green-600 block">Realisasi</span>
                        <span className="font-semibold text-green-800">{formatCurrencyShort(item.realisasi_anggaran)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada data bulanan</p>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Kegiatan dengan Anggaran Terbesar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LuActivity className="w-5 h-5 text-blue-600" />
          Top 5 Kegiatan dengan Anggaran Terbesar
        </h2>
        {topKegiatan.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">#</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kegiatan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tim</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Target Anggaran</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Realisasi</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Serapan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {topKegiatan.map((item, index) => {
                  const serapan = item.target_anggaran > 0 ? (item.realisasi_anggaran / item.target_anggaran * 100) : 0;
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 text-sm">{item.nama}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{item.tim_nama || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-semibold text-blue-600 text-sm">{formatCurrency(item.target_anggaran)}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-semibold text-green-600 text-sm">{formatCurrency(item.realisasi_anggaran)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className={`h-2 rounded-full ${
                                serapan >= 80 ? 'bg-green-500' :
                                serapan >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(serapan, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{serapan.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status_pengajuan)}`}>
                          {getStatusLabel(item.status_pengajuan)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Belum ada data kegiatan</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <LuClock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Kegiatan Bulan Ini</p>
              <p className="text-2xl font-bold text-blue-800">{statistik?.kegiatan_bulan_ini || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <LuCalendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Rata-rata Waktu Approval</p>
              <p className="text-2xl font-bold text-purple-800">{statistik?.rata_rata_waktu_approval || 0} <span className="text-sm font-normal">hari</span></p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <LuCircleCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Tingkat Persetujuan</p>
              <p className="text-2xl font-bold text-green-800">
                {statistik?.total_kegiatan ? Math.round(statistik.kegiatan_approved / statistik.total_kegiatan * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
