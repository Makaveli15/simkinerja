'use client';

import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { useAlertModal } from '@/app/components/AlertModal';
import { 
  LuTrendingUp, 
  LuUsers, 
  LuClipboardList,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuCircleX,
  LuWallet,
  LuTarget,
  LuTriangleAlert,
  LuActivity,
  LuArrowUp,
  LuArrowDown,
  LuTimer,
  LuPartyPopper,
  LuDownload,
  LuFilter,
  LuRefreshCw,
  LuShieldCheck,
  LuFileCheck,
  LuClipboardCheck
} from 'react-icons/lu';

interface TimInfo {
  id: number;
  nama: string;
}

interface Ringkasan {
  total_kegiatan: number;
  kegiatan_selesai: number;
  kegiatan_berjalan: number;
  kegiatan_draft: number;
  kegiatan_dibatalkan: number;
  kegiatan_approved_final?: number;
  rata_rata_kinerja: number;
  total_pelaksana: number;
}

interface Anggaran {
  total: number;
  realisasi: number;
  sisa: number;
  persentase_serapan: number;
  total_all?: number;
  realisasi_all?: number;
}

interface Output {
  total_target: number;
  total_realisasi: number;
  total_tervalidasi: number;
  persentase_capaian: number;
  persentase_validasi: number;
}

interface Kendala {
  total: number;
  resolved: number;
  open: number;
}

interface DistribusiKinerja {
  sukses: number;
  perlu_perhatian: number;
  bermasalah: number;
  belum_dinilai: number;
}

interface DistribusiPengajuan {
  draft: number;
  diajukan: number;
  review_koordinator: number;
  approved_koordinator: number;
  review_ppk: number;
  approved_ppk: number;
  review_pimpinan: number;
  approved: number;
  ditolak: number;
}

interface RataRataIndikator {
  capaian_output: number;
  ketepatan_waktu: number;
  serapan_anggaran: number;
  kualitas_output: number;
}

interface IndikatorDetail {
  capaian_output: number;
  ketepatan_waktu: number;
  serapan_anggaran: number;
  kualitas_output: number;
}

interface PelaksanaStats {
  id: number;
  nama: string;
  email: string;
  total_kegiatan: number;
  kegiatan_selesai: number;
  kegiatan_berjalan: number;
  rata_rata_kinerja: number;
}

interface TrendBulanan {
  bulan: string;
  total_kegiatan: number;
  kegiatan_selesai: number;
  total_anggaran: number;
  total_realisasi: number;
}

interface TopKegiatan {
  id: number;
  nama: string;
  pelaksana: string;
  skor_kinerja: number;
  status_kinerja: string;
  status: string;
}

interface TopAnggaran {
  id: number;
  nama: string;
  pelaksana: string;
  anggaran: number;
  realisasi: number;
  serapan: number;
}

interface KegiatanDeadline {
  id: number;
  nama: string;
  pelaksana: string;
  tanggal_selesai: string;
  sisa_hari: number;
}

interface KegiatanTerlambat {
  id: number;
  nama: string;
  pelaksana: string;
  tanggal_selesai: string;
  hari_terlambat: number;
}

interface KegiatanBermasalah {
  id: number;
  nama: string;
  pelaksana: string;
  status: string;
  status_kinerja: string;
  skor_kinerja: number;
  masalah_utama: string;
  indikator: IndikatorDetail | null;
}

interface StatistikData {
  tim: TimInfo | null;
  ringkasan: Ringkasan;
  anggaran: Anggaran;
  output: Output;
  kendala: Kendala;
  distribusi_kinerja: DistribusiKinerja;
  distribusi_pengajuan: DistribusiPengajuan;
  rata_rata_indikator: RataRataIndikator | null;
  pelaksana: PelaksanaStats[];
  trend_bulanan: TrendBulanan[];
  top_kinerja: TopKegiatan[];
  bottom_kinerja: TopKegiatan[];
  top_anggaran: TopAnggaran[];
  kegiatan_deadline: KegiatanDeadline[];
  kegiatan_terlambat: KegiatanTerlambat[];
  kegiatan_bermasalah: KegiatanBermasalah[];
}

export default function StatistikKinerjaPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StatistikData | null>(null);
  const [periodeMulai, setPeriodeMulai] = useState('');
  const [periodeSelesai, setPeriodeSelesai] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const { showError, AlertModal } = useAlertModal();

  useEffect(() => {
    setMounted(true);
    fetchStatistik();
  }, []);

  const fetchStatistik = async () => {
    try {
      setLoading(true);
      let url = '/api/koordinator/statistik';
      const params = new URLSearchParams();
      if (periodeMulai) params.append('periode_mulai', periodeMulai);
      if (periodeSelesai) params.append('periode_selesai', periodeSelesai);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    fetchStatistik();
    setShowFilter(false);
  };

  const handleFilterReset = () => {
    setPeriodeMulai('');
    setPeriodeSelesai('');
    setTimeout(() => fetchStatistik(), 0);
    setShowFilter(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const formatBulan = (bulan: string) => {
    const [year, month] = bulan.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const getKinerjaColor = (status: string) => {
    switch (status) {
      case 'Sukses': return 'text-emerald-600 bg-emerald-50';
      case 'Perlu Perhatian': return 'text-amber-600 bg-amber-50';
      case 'Bermasalah': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!data) return;
    
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SimKinerja';
      workbook.created = new Date();

      // Sheet 1: Ringkasan
      const ringkasanSheet = workbook.addWorksheet('Ringkasan');
      ringkasanSheet.mergeCells('A1:D1');
      ringkasanSheet.getCell('A1').value = `STATISTIK KINERJA TIM ${data.tim?.nama?.toUpperCase() || ''}`;
      ringkasanSheet.getCell('A1').font = { bold: true, size: 16 };
      ringkasanSheet.getCell('A1').alignment = { horizontal: 'center' };
      
      ringkasanSheet.mergeCells('A2:D2');
      ringkasanSheet.getCell('A2').value = `Digenerate: ${new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`;
      ringkasanSheet.getCell('A2').alignment = { horizontal: 'center' };
      ringkasanSheet.getCell('A2').font = { size: 10, italic: true };
      
      ringkasanSheet.addRow([]);
      
      // Ringkasan kegiatan
      const ringkasanHeaderRow = ringkasanSheet.addRow(['Indikator', 'Nilai']);
      ringkasanHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ringkasanHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      
      ringkasanSheet.addRow(['Total Kegiatan', data.ringkasan.total_kegiatan]);
      ringkasanSheet.addRow(['Kegiatan Selesai', data.ringkasan.kegiatan_selesai]);
      ringkasanSheet.addRow(['Kegiatan Berjalan', data.ringkasan.kegiatan_berjalan]);
      ringkasanSheet.addRow(['Kegiatan Draft', data.ringkasan.kegiatan_draft]);
      ringkasanSheet.addRow(['Rata-rata Kinerja', data.ringkasan.rata_rata_kinerja]);
      ringkasanSheet.addRow(['Total Pelaksana', data.ringkasan.total_pelaksana]);
      ringkasanSheet.addRow([]);
      ringkasanSheet.addRow(['Total Anggaran', formatCurrency(data.anggaran.total)]);
      ringkasanSheet.addRow(['Realisasi Anggaran', formatCurrency(data.anggaran.realisasi)]);
      ringkasanSheet.addRow(['Sisa Anggaran', formatCurrency(data.anggaran.sisa)]);
      ringkasanSheet.addRow(['Persentase Serapan', `${data.anggaran.persentase_serapan}%`]);
      ringkasanSheet.addRow([]);
      ringkasanSheet.addRow(['Target Output', formatNumber(data.output.total_target)]);
      ringkasanSheet.addRow(['Realisasi Output', formatNumber(data.output.total_realisasi)]);
      ringkasanSheet.addRow(['Output Tervalidasi', formatNumber(data.output.total_tervalidasi)]);
      ringkasanSheet.addRow(['Capaian Output', `${data.output.persentase_capaian}%`]);
      ringkasanSheet.addRow(['Persentase Validasi', `${data.output.persentase_validasi}%`]);
      
      // Rata-rata indikator
      if (data.rata_rata_indikator) {
        ringkasanSheet.addRow([]);
        ringkasanSheet.addRow(['RATA-RATA INDIKATOR']);
        ringkasanSheet.getRow(ringkasanSheet.rowCount).font = { bold: true };
        ringkasanSheet.addRow(['Capaian Output', `${data.rata_rata_indikator.capaian_output}%`]);
        ringkasanSheet.addRow(['Ketepatan Waktu', `${data.rata_rata_indikator.ketepatan_waktu}%`]);
        ringkasanSheet.addRow(['Serapan Anggaran', `${data.rata_rata_indikator.serapan_anggaran}%`]);
        ringkasanSheet.addRow(['Kualitas Output', `${data.rata_rata_indikator.kualitas_output}%`]);
      }
      
      ringkasanSheet.getColumn(1).width = 25;
      ringkasanSheet.getColumn(2).width = 25;

      // Sheet 2: Kinerja Pelaksana
      if (data.pelaksana.length > 0) {
        const pelaksanaSheet = workbook.addWorksheet('Kinerja Pelaksana');
        const pelaksanaHeaderRow = pelaksanaSheet.addRow(['No', 'Nama Pelaksana', 'Email', 'Total Kegiatan', 'Berjalan', 'Selesai', 'Rata-rata Kinerja']);
        pelaksanaHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        pelaksanaHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        
        data.pelaksana.forEach((p, idx) => {
          pelaksanaSheet.addRow([idx + 1, p.nama, p.email, p.total_kegiatan, p.kegiatan_berjalan, p.kegiatan_selesai, p.rata_rata_kinerja]);
        });
        
        pelaksanaSheet.getColumn(1).width = 5;
        pelaksanaSheet.getColumn(2).width = 25;
        pelaksanaSheet.getColumn(3).width = 30;
        pelaksanaSheet.getColumn(4).width = 15;
        pelaksanaSheet.getColumn(5).width = 12;
        pelaksanaSheet.getColumn(6).width = 12;
        pelaksanaSheet.getColumn(7).width = 18;
      }

      // Sheet 3: Top & Bottom Kinerja
      if (data.top_kinerja.length > 0 || data.bottom_kinerja.length > 0) {
        const kinerjaSheet = workbook.addWorksheet('Top Bottom Kinerja');
        
        if (data.top_kinerja.length > 0) {
          kinerjaSheet.addRow(['TOP 5 KINERJA TERTINGGI']);
          kinerjaSheet.getRow(kinerjaSheet.rowCount).font = { bold: true };
          const topHeaderRow = kinerjaSheet.addRow(['No', 'Nama Kegiatan', 'Pelaksana', 'Status', 'Skor Kinerja', 'Status Kinerja']);
          topHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          topHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
          
          data.top_kinerja.forEach((k, idx) => {
            kinerjaSheet.addRow([idx + 1, k.nama, k.pelaksana, k.status, k.skor_kinerja, k.status_kinerja]);
          });
          kinerjaSheet.addRow([]);
        }
        
        if (data.bottom_kinerja.length > 0) {
          kinerjaSheet.addRow(['TOP 5 KINERJA TERENDAH']);
          kinerjaSheet.getRow(kinerjaSheet.rowCount).font = { bold: true };
          const bottomHeaderRow = kinerjaSheet.addRow(['No', 'Nama Kegiatan', 'Pelaksana', 'Status', 'Skor Kinerja', 'Status Kinerja']);
          bottomHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          bottomHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
          
          data.bottom_kinerja.forEach((k, idx) => {
            kinerjaSheet.addRow([idx + 1, k.nama, k.pelaksana, k.status, k.skor_kinerja, k.status_kinerja]);
          });
        }
        
        kinerjaSheet.getColumn(1).width = 5;
        kinerjaSheet.getColumn(2).width = 35;
        kinerjaSheet.getColumn(3).width = 25;
        kinerjaSheet.getColumn(4).width = 15;
        kinerjaSheet.getColumn(5).width = 15;
        kinerjaSheet.getColumn(6).width = 18;
      }

      // Sheet 4: Top Anggaran
      if (data.top_anggaran.length > 0) {
        const anggaranSheet = workbook.addWorksheet('Top Anggaran');
        const anggaranHeaderRow = anggaranSheet.addRow(['No', 'Nama Kegiatan', 'Pelaksana', 'Anggaran', 'Realisasi', 'Serapan (%)']);
        anggaranHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        anggaranHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        
        data.top_anggaran.forEach((k, idx) => {
          anggaranSheet.addRow([idx + 1, k.nama, k.pelaksana, formatCurrency(k.anggaran), formatCurrency(k.realisasi), `${k.serapan}%`]);
        });
        
        anggaranSheet.getColumn(1).width = 5;
        anggaranSheet.getColumn(2).width = 35;
        anggaranSheet.getColumn(3).width = 25;
        anggaranSheet.getColumn(4).width = 20;
        anggaranSheet.getColumn(5).width = 20;
        anggaranSheet.getColumn(6).width = 15;
      }

      // Sheet 5: Deadline & Terlambat
      if (data.kegiatan_deadline.length > 0 || data.kegiatan_terlambat.length > 0) {
        const deadlineSheet = workbook.addWorksheet('Deadline & Terlambat');
        
        if (data.kegiatan_deadline.length > 0) {
          deadlineSheet.addRow(['KEGIATAN MENDEKATI DEADLINE']);
          deadlineSheet.getRow(deadlineSheet.rowCount).font = { bold: true };
          const deadlineHeaderRow = deadlineSheet.addRow(['No', 'Nama Kegiatan', 'Pelaksana', 'Tanggal Selesai', 'Sisa Hari']);
          deadlineHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          deadlineHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
          
          data.kegiatan_deadline.forEach((k, idx) => {
            deadlineSheet.addRow([idx + 1, k.nama, k.pelaksana, new Date(k.tanggal_selesai).toLocaleDateString('id-ID'), `${k.sisa_hari} hari`]);
          });
          deadlineSheet.addRow([]);
        }
        
        if (data.kegiatan_terlambat.length > 0) {
          deadlineSheet.addRow(['KEGIATAN TERLAMBAT']);
          deadlineSheet.getRow(deadlineSheet.rowCount).font = { bold: true };
          const terlambatHeaderRow = deadlineSheet.addRow(['No', 'Nama Kegiatan', 'Pelaksana', 'Tanggal Selesai', 'Hari Terlambat']);
          terlambatHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          terlambatHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
          
          data.kegiatan_terlambat.forEach((k, idx) => {
            deadlineSheet.addRow([idx + 1, k.nama, k.pelaksana, new Date(k.tanggal_selesai).toLocaleDateString('id-ID'), `${k.hari_terlambat} hari`]);
          });
        }
        
        deadlineSheet.getColumn(1).width = 5;
        deadlineSheet.getColumn(2).width = 35;
        deadlineSheet.getColumn(3).width = 25;
        deadlineSheet.getColumn(4).width = 18;
        deadlineSheet.getColumn(5).width = 15;
      }

      // Sheet 6: Trend Bulanan
      if (data.trend_bulanan.length > 0) {
        const trendSheet = workbook.addWorksheet('Trend Bulanan');
        const trendHeaderRow = trendSheet.addRow(['Bulan', 'Total Kegiatan', 'Kegiatan Selesai', 'Total Anggaran', 'Total Realisasi']);
        trendHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        trendHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
        
        data.trend_bulanan.forEach((t) => {
          trendSheet.addRow([formatBulan(t.bulan), t.total_kegiatan, t.kegiatan_selesai, formatCurrency(t.total_anggaran), formatCurrency(t.total_realisasi)]);
        });
        
        trendSheet.getColumn(1).width = 20;
        trendSheet.getColumn(2).width = 15;
        trendSheet.getColumn(3).width = 18;
        trendSheet.getColumn(4).width = 20;
        trendSheet.getColumn(5).width = 20;
      }

      // Sheet 7: Kegiatan Bermasalah
      if (data.kegiatan_bermasalah && data.kegiatan_bermasalah.length > 0) {
        const bermasalahSheet = workbook.addWorksheet('Kegiatan Bermasalah');
        const bermasalahHeaderRow = bermasalahSheet.addRow(['No', 'Nama Kegiatan', 'Pelaksana', 'Status', 'Status Kinerja', 'Skor', 'Masalah Utama']);
        bermasalahHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        bermasalahHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
        
        data.kegiatan_bermasalah.forEach((k, idx) => {
          bermasalahSheet.addRow([idx + 1, k.nama, k.pelaksana, k.status, k.status_kinerja, k.skor_kinerja, k.masalah_utama]);
        });
        
        bermasalahSheet.getColumn(1).width = 5;
        bermasalahSheet.getColumn(2).width = 35;
        bermasalahSheet.getColumn(3).width = 25;
        bermasalahSheet.getColumn(4).width = 15;
        bermasalahSheet.getColumn(5).width = 18;
        bermasalahSheet.getColumn(6).width = 10;
        bermasalahSheet.getColumn(7).width = 40;
      }

      // Sheet 8: Status Pengajuan
      const pengajuanSheet = workbook.addWorksheet('Status Pengajuan');
      const pengajuanHeaderRow = pengajuanSheet.addRow(['Status Pengajuan', 'Jumlah']);
      pengajuanHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      pengajuanHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      
      pengajuanSheet.addRow(['Draft', data.distribusi_pengajuan.draft]);
      pengajuanSheet.addRow(['Diajukan', data.distribusi_pengajuan.diajukan]);
      pengajuanSheet.addRow(['Review Koordinator', data.distribusi_pengajuan.review_koordinator]);
      pengajuanSheet.addRow(['Approved Koordinator', data.distribusi_pengajuan.approved_koordinator]);
      pengajuanSheet.addRow(['Review PPK', data.distribusi_pengajuan.review_ppk]);
      pengajuanSheet.addRow(['Approved PPK', data.distribusi_pengajuan.approved_ppk]);
      pengajuanSheet.addRow(['Disetujui (Final)', data.distribusi_pengajuan.approved]);
      pengajuanSheet.addRow(['Ditolak', data.distribusi_pengajuan.ditolak]);
      
      pengajuanSheet.getColumn(1).width = 25;
      pengajuanSheet.getColumn(2).width = 15;

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Statistik_Tim_${data.tim?.nama || 'Koordinator'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      showError('Gagal', 'Gagal mengexport data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Gagal memuat data statistik</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuTrendingUp className="w-6 h-6" />
              </div>
              Statistik Kinerja Tim
            </h1>
            <p className="text-blue-100 mt-2">
              {data.tim ? `Tim ${data.tim.nama}` : 'Data statistik tim Anda'}
              {(periodeMulai || periodeSelesai) && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                  {periodeMulai && periodeSelesai 
                    ? `${new Date(periodeMulai).toLocaleDateString('id-ID')} - ${new Date(periodeSelesai).toLocaleDateString('id-ID')}`
                    : periodeMulai 
                      ? `Mulai: ${new Date(periodeMulai).toLocaleDateString('id-ID')}`
                      : `Sampai: ${new Date(periodeSelesai).toLocaleDateString('id-ID')}`
                  }
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl font-medium hover:bg-white/30 transition-all"
            >
              <LuFilter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button
              onClick={() => fetchStatistik()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl font-medium hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportToExcel}
              disabled={exporting || !data}
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
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm">
              <LuCalendar className="w-4 h-4" />
              {mounted ? new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="mt-4 p-4 bg-white/10 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-blue-100 mb-1">Periode Mulai</label>
                <input
                  type="date"
                  value={periodeMulai}
                  onChange={(e) => setPeriodeMulai(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-100 mb-1">Periode Selesai</label>
                <input
                  type="date"
                  value={periodeSelesai}
                  onChange={(e) => setPeriodeSelesai(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <button
                  onClick={handleFilterApply}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-blue-50 transition-all"
                >
                  Terapkan Filter
                </button>
                <button
                  onClick={handleFilterReset}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards - Row 1: Kegiatan & Kinerja */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.total_kegiatan}</p>
              <p className="text-xs text-gray-400 mt-1">kegiatan tim</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LuClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Rata-rata Kinerja</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.rata_rata_kinerja}</p>
              <p className="text-xs text-gray-400 mt-1">skor tim</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <LuTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Kegiatan Selesai</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.kegiatan_selesai}</p>
              <p className="text-xs text-gray-400 mt-1">dari {data.ringkasan.total_kegiatan} kegiatan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <LuCircleCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Pelaksana</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.ringkasan.total_pelaksana}</p>
              <p className="text-xs text-gray-400 mt-1">anggota tim</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <LuUsers className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2: Anggaran & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Anggaran Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <LuWallet className="w-5 h-5 text-blue-600" />
            Statistik Anggaran
          </h3>
          {/* Info banner untuk kegiatan disetujui final */}
          <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 flex items-center gap-1.5">
              <LuShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Data anggaran hanya dari kegiatan yang sudah disetujui final (Tahap 3: Kepala)</span>
            </p>
            {data.ringkasan.kegiatan_approved_final !== undefined && (
              <p className="text-xs text-blue-600 mt-1 ml-5">
                <strong>{data.ringkasan.kegiatan_approved_final}</strong> dari {data.ringkasan.total_kegiatan} kegiatan sudah disetujui final
              </p>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Anggaran</span>
              <span className="font-semibold text-gray-900">{formatCurrency(data.anggaran.total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Realisasi</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(data.anggaran.realisasi)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sisa Anggaran</span>
              <span className="font-semibold text-amber-600">{formatCurrency(data.anggaran.sisa)}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Serapan Anggaran</span>
                <span className="font-semibold text-blue-600">{data.anggaran.persentase_serapan}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.anggaran.persentase_serapan, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTarget className="w-5 h-5 text-emerald-600" />
            Statistik Output
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Target Output</span>
              <span className="font-semibold text-gray-900">{formatNumber(data.output.total_target)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Realisasi Output</span>
              <span className="font-semibold text-emerald-600">{formatNumber(data.output.total_realisasi)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <LuShieldCheck className="w-4 h-4 text-blue-500" />
                Output Tervalidasi
              </span>
              <span className="font-semibold text-blue-600">{formatNumber(data.output.total_tervalidasi)}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Capaian Output</span>
                <span className="font-semibold text-emerald-600">{data.output.persentase_capaian}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.output.persentase_capaian, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 flex items-center gap-1">
                  <LuFileCheck className="w-4 h-4 text-blue-500" />
                  Validasi Output
                </span>
                <span className="font-semibold text-blue-600">{data.output.persentase_validasi}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.output.persentase_validasi, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600">Total Kendala</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-red-600">{data.kendala.open} open</span>
                <span className="text-sm text-emerald-600">{data.kendala.resolved} resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribusi Kinerja & Status Kegiatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribusi Kinerja */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuActivity className="w-5 h-5 text-indigo-600" />
            Distribusi Status Kinerja
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-emerald-700 font-medium">Sukses</span>
              </div>
              <span className="font-bold text-emerald-700">{data.distribusi_kinerja.sukses}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-amber-700 font-medium">Perlu Perhatian</span>
              </div>
              <span className="font-bold text-amber-700">{data.distribusi_kinerja.perlu_perhatian}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-red-700 font-medium">Bermasalah</span>
              </div>
              <span className="font-bold text-red-700">{data.distribusi_kinerja.bermasalah}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-700 font-medium">Belum Dinilai</span>
              </div>
              <span className="font-bold text-gray-700">{data.distribusi_kinerja.belum_dinilai}</span>
            </div>
          </div>
        </div>

        {/* Status Kegiatan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuClipboardList className="w-5 h-5 text-blue-600" />
            Status Kegiatan
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuClock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Berjalan</span>
              </div>
              <span className="font-bold text-blue-700">{data.ringkasan.kegiatan_berjalan}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuCircleCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Selesai</span>
              </div>
              <span className="font-bold text-emerald-700">{data.ringkasan.kegiatan_selesai}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuClipboardList className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Draft</span>
              </div>
              <span className="font-bold text-gray-700">{data.ringkasan.kegiatan_draft}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <LuCircleX className="w-4 h-4 text-red-600" />
                <span className="text-red-700 font-medium">Dibatalkan</span>
              </div>
              <span className="font-bold text-red-700">{data.ringkasan.kegiatan_dibatalkan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rata-rata Indikator Tim & Status Pengajuan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rata-rata Indikator Tim */}
        {data.rata_rata_indikator && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuTrendingUp className="w-5 h-5 text-purple-600" />
              Rata-rata Indikator Tim
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Capaian Output</span>
                  <span className={`font-semibold ${data.rata_rata_indikator.capaian_output >= 80 ? 'text-emerald-600' : data.rata_rata_indikator.capaian_output >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {data.rata_rata_indikator.capaian_output}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${data.rata_rata_indikator.capaian_output >= 80 ? 'bg-emerald-500' : data.rata_rata_indikator.capaian_output >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(data.rata_rata_indikator.capaian_output, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Ketepatan Waktu</span>
                  <span className={`font-semibold ${data.rata_rata_indikator.ketepatan_waktu >= 80 ? 'text-emerald-600' : data.rata_rata_indikator.ketepatan_waktu >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {data.rata_rata_indikator.ketepatan_waktu}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${data.rata_rata_indikator.ketepatan_waktu >= 80 ? 'bg-emerald-500' : data.rata_rata_indikator.ketepatan_waktu >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(data.rata_rata_indikator.ketepatan_waktu, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Serapan Anggaran</span>
                  <span className={`font-semibold ${data.rata_rata_indikator.serapan_anggaran >= 80 ? 'text-emerald-600' : data.rata_rata_indikator.serapan_anggaran >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {data.rata_rata_indikator.serapan_anggaran}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${data.rata_rata_indikator.serapan_anggaran >= 80 ? 'bg-emerald-500' : data.rata_rata_indikator.serapan_anggaran >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(data.rata_rata_indikator.serapan_anggaran, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Kualitas Output</span>
                  <span className={`font-semibold ${data.rata_rata_indikator.kualitas_output >= 80 ? 'text-emerald-600' : data.rata_rata_indikator.kualitas_output >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {data.rata_rata_indikator.kualitas_output}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${data.rata_rata_indikator.kualitas_output >= 80 ? 'bg-emerald-500' : data.rata_rata_indikator.kualitas_output >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(data.rata_rata_indikator.kualitas_output, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Pengajuan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuClipboardCheck className="w-5 h-5 text-blue-600" />
            Status Pengajuan Kegiatan
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">Draft</p>
              <p className="text-xl font-bold text-gray-700">{data.distribusi_pengajuan.draft}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600">Diajukan</p>
              <p className="text-xl font-bold text-blue-700">{data.distribusi_pengajuan.diajukan}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-600">Review Koordinator</p>
              <p className="text-xl font-bold text-amber-700">{data.distribusi_pengajuan.review_koordinator}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <p className="text-xs text-indigo-600">Approved Koordinator</p>
              <p className="text-xl font-bold text-indigo-700">{data.distribusi_pengajuan.approved_koordinator}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <p className="text-xs text-purple-600">Review PPK</p>
              <p className="text-xl font-bold text-purple-700">{data.distribusi_pengajuan.review_ppk}</p>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl">
              <p className="text-xs text-cyan-600">Approved PPK</p>
              <p className="text-xl font-bold text-cyan-700">{data.distribusi_pengajuan.approved_ppk}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <p className="text-xs text-emerald-600">Disetujui</p>
              <p className="text-xl font-bold text-emerald-700">{data.distribusi_pengajuan.approved}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600">Ditolak</p>
              <p className="text-xl font-bold text-red-700">{data.distribusi_pengajuan.ditolak}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kegiatan Bermasalah */}
      {data.kegiatan_bermasalah && data.kegiatan_bermasalah.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTriangleAlert className="w-5 h-5 text-red-600" />
            Kegiatan Perlu Perhatian
            <span className="text-sm font-normal text-gray-500">({data.kegiatan_bermasalah.length} kegiatan)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kegiatan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Pelaksana</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Skor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Masalah</th>
                </tr>
              </thead>
              <tbody>
                {data.kegiatan_bermasalah.slice(0, 10).map((k) => (
                  <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{k.pelaksana}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKinerjaColor(k.status_kinerja)}`}>
                        {k.status_kinerja}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${k.skor_kinerja >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {k.skor_kinerja}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{k.masalah_utama || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend Bulanan */}
      {data.trend_bulanan.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuCalendar className="w-5 h-5 text-purple-600" />
            Trend 6 Bulan Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Bulan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Total Kegiatan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Selesai</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Anggaran</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Realisasi</th>
                </tr>
              </thead>
              <tbody>
                {data.trend_bulanan.map((trend, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{formatBulan(trend.bulan)}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{trend.total_kegiatan}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        {trend.kegiatan_selesai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(trend.total_anggaran)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(trend.total_realisasi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kinerja Pelaksana */}
      {data.pelaksana.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuUsers className="w-5 h-5 text-blue-600" />
            Kinerja Pelaksana
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nama Pelaksana</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Total Kegiatan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Berjalan</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Selesai</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Rata-rata Kinerja</th>
                </tr>
              </thead>
              <tbody>
                {data.pelaksana.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{p.nama}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-700">{p.total_kegiatan}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {p.kegiatan_berjalan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        {p.kegiatan_selesai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        p.rata_rata_kinerja >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        p.rata_rata_kinerja >= 60 ? 'bg-amber-100 text-amber-700' :
                        p.rata_rata_kinerja > 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.rata_rata_kinerja}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top & Bottom Kinerja */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Kinerja Tertinggi */}
        {data.top_kinerja.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuArrowUp className="w-5 h-5 text-emerald-600" />
              Top 5 Kinerja Tertinggi
            </h3>
            <div className="space-y-3">
              {data.top_kinerja.map((k, idx) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                      <p className="text-xs text-gray-500">{k.pelaksana}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getKinerjaColor(k.status_kinerja)}`}>
                    {k.skor_kinerja}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Kinerja Terendah */}
        {data.bottom_kinerja.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LuArrowDown className="w-5 h-5 text-red-600" />
              Top 5 Kinerja Terendah
            </h3>
            <div className="space-y-3">
              {data.bottom_kinerja.map((k, idx) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                      <p className="text-xs text-gray-500">{k.pelaksana}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getKinerjaColor(k.status_kinerja)}`}>
                    {k.skor_kinerja}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Anggaran Terbesar */}
      {data.top_anggaran.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuWallet className="w-5 h-5 text-blue-600" />
            Top 5 Kegiatan dengan Anggaran Terbesar
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kegiatan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Pelaksana</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Anggaran</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Realisasi</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Serapan</th>
                </tr>
              </thead>
              <tbody>
                {data.top_anggaran.map((k) => (
                  <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{k.nama}</td>
                    <td className="py-3 px-4 text-gray-600">{k.pelaksana}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(k.anggaran)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(k.realisasi)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        k.serapan >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        k.serapan >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {k.serapan}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kegiatan Deadline & Terlambat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kegiatan Mendekati Deadline */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTimer className="w-5 h-5 text-amber-600" />
            Mendekati Deadline (7 Hari)
          </h3>
          {data.kegiatan_deadline.length > 0 ? (
            <div className="space-y-3">
              {data.kegiatan_deadline.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                    <p className="text-xs text-gray-500">{k.pelaksana}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                      {k.sisa_hari} hari lagi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Tidak ada kegiatan mendekati deadline</p>
          )}
        </div>

        {/* Kegiatan Terlambat */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LuTriangleAlert className="w-5 h-5 text-red-600" />
            Kegiatan Terlambat
          </h3>
          {data.kegiatan_terlambat.length > 0 ? (
            <div className="space-y-3">
              {data.kegiatan_terlambat.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{k.nama}</p>
                    <p className="text-xs text-gray-500">{k.pelaksana}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                      {k.hari_terlambat} hari
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 flex items-center justify-center gap-2">Tidak ada kegiatan terlambat <LuPartyPopper className="w-5 h-5 text-emerald-500" /></p>
          )}
        </div>
      </div>

      <AlertModal />
    </div>
  );
}
