'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Pagination from '@/app/components/Pagination';
import {
  LuFileSpreadsheet,
  LuFileText,
  LuPlus,
  LuSearch,
  LuFolderOpen,
  LuClipboard
} from 'react-icons/lu';

interface KendalaItem {
  id: number;
  deskripsi: string;
  kategori?: string;
  tingkat_keparahan?: string;
  status: string;
  tanggal_kendala?: string;
  solusi?: string;
  created_at?: string;
}

interface Kegiatan {
  id: number;
  nama: string;
  deskripsi: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  anggaran_pagu: number;
  kro_id: number;
  kro_nama: string;
  kro_kode: string;
  mitra_id: number;
  mitra_nama: string;
  skor_kinerja: number;
  status_kinerja: string;
  realisasi_fisik: number;
  realisasi_anggaran: number;
  kendala_total: number;
  kendala_resolved: number;
  kendala_open: number;
  kendala_list: KendalaItem[];
  // New fields for progress calculation
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
}

interface KRO {
  id: number;
  kode: string;
  nama: string;
}

export default function KegiatanPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [kroList, setKroList] = useState<KRO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterKro, setFilterKro] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [exportPeriode, setExportPeriode] = useState('all');
  const [exportTahun, setExportTahun] = useState(new Date().getFullYear().toString());
  const [exportBulan, setExportBulan] = useState((new Date().getMonth() + 1).toString());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Generate years list (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Month names
  const bulanList = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kegiatanRes, kroRes] = await Promise.all([
        fetch('/api/pelaksana/kegiatan-operasional'),
        fetch('/api/pelaksana/kro')
      ]);
      
      if (kegiatanRes.ok) {
        const data = await kegiatanRes.json();
        setKegiatan(data);
      }
      
      if (kroRes.ok) {
        const data = await kroRes.json();
        setKroList(data);
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'bg-green-100 text-green-700';
      case 'berjalan':
        return 'bg-blue-100 text-blue-700';
      case 'belum_mulai':
        return 'bg-gray-100 text-gray-700';
      case 'tertunda':
        return 'bg-amber-100 text-amber-700';
      case 'bermasalah':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'berjalan': return 'Berjalan';
      case 'belum_mulai': return 'Belum Mulai';
      case 'bermasalah': return 'Bermasalah';
      case 'tertunda': return 'Tertunda';
      default: return status;
    }
  };

  const getKinerjaBadge = (skor: number) => {
    if (skor >= 80) return 'bg-green-100 text-green-700';
    if (skor >= 60) return 'bg-amber-100 text-amber-700';
    if (skor > 0) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Helper function to generate kendala section for PDF
  const generateKendalaSection = (kegiatanList: Kegiatan[], formatDateFn: (d: string) => string) => {
    const allKendala: { kegiatan: string; kro: string; deskripsi: string; severity: string; status: string; tanggal: string; }[] = [];
    
    kegiatanList.forEach(k => {
      (k.kendala_list || []).forEach(kd => {
        // tingkat_keparahan values: rendah, sedang, tinggi (from tingkat_dampak)
        const severityLabel = kd.tingkat_keparahan === 'tinggi' ? 'Tinggi' : kd.tingkat_keparahan === 'sedang' ? 'Sedang' : kd.tingkat_keparahan === 'rendah' ? 'Rendah' : '-';
        // status values: open, resolved
        const statusLabel = kd.status === 'resolved' ? 'Selesai' : 'Terbuka';
        
        allKendala.push({
          kegiatan: k.nama,
          kro: k.kro_kode || '-',
          deskripsi: kd.deskripsi || '-',
          severity: severityLabel,
          status: statusLabel,
          tanggal: kd.tanggal_kendala ? formatDateFn(kd.tanggal_kendala) : (kd.created_at ? formatDateFn(kd.created_at) : '-'),
        });
      });
    });

    if (allKendala.length === 0) {
      return '<div class="section-title">DAFTAR KENDALA</div><p style="color: #666; font-style: italic;">Tidak ada kendala yang tercatat.</p>';
    }

    const kendalaRows = allKendala.map((kd, idx) => {
      const severityColor = kd.severity === 'Tinggi' ? '#dc2626' : kd.severity === 'Sedang' ? '#ca8a04' : '#16a34a';
      const statusColor = kd.status === 'Selesai' ? '#16a34a' : '#dc2626';
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${kd.kegiatan}</td>
          <td>${kd.kro}</td>
          <td>${kd.deskripsi}</td>
          <td><span style="color: ${severityColor}; font-weight: bold;">${kd.severity}</span></td>
          <td><span style="color: ${statusColor}; font-weight: bold;">${kd.status}</span></td>
          <td>${kd.tanggal}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="section-title" style="page-break-before: always;">DAFTAR KENDALA DETAIL</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25px;">No</th>
            <th style="width: 120px;">Kegiatan</th>
            <th style="width: 50px;">KRO</th>
            <th style="width: 200px;">Deskripsi Kendala</th>
            <th style="width: 60px;">Tingkat Dampak</th>
            <th style="width: 60px;">Status</th>
            <th style="width: 70px;">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          ${kendalaRows}
        </tbody>
      </table>
    `;
  };

  // Helper function for kendala status label
  const getKendalaStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Selesai';
      case 'open': return 'Belum Selesai';
      case 'in_progress': return 'Sedang Ditangani';
      default: return status || 'Belum Selesai';
    }
  };

  // Helper function for kendala severity label
  const getKendalaSeverityLabel = (severity?: string) => {
    switch (severity) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return severity || '-';
    }
  };

  // Get period label for export filename
  const getPeriodLabel = () => {
    if (exportPeriode === 'bulan') {
      const bulanNama = bulanList.find(b => b.value === exportBulan)?.label || '';
      return `_${bulanNama}_${exportTahun}`;
    } else if (exportPeriode === 'tahun') {
      return `_Tahun_${exportTahun}`;
    }
    return '';
  };

  // Get period text for report header
  const getPeriodText = () => {
    if (exportPeriode === 'bulan') {
      const bulanNama = bulanList.find(b => b.value === exportBulan)?.label || '';
      return `Periode: ${bulanNama} ${exportTahun}`;
    } else if (exportPeriode === 'tahun') {
      return `Periode: Tahun ${exportTahun}`;
    }
    return `Periode: Semua Data`;
  };

  // Export to Excel
  const exportToExcel = (dataForExport: Kegiatan[]) => {
    setExporting(true);
    try {
      // Calculate realisasi anggaran amount
      const dataToExport = dataForExport.map((k, index) => {
        const pagu = parseFloat(String(k.anggaran_pagu)) || 0;
        const realisasiAnggaranPersen = parseFloat(String(k.realisasi_anggaran)) || 0;
        const realisasiAnggaranNominal = (pagu * realisasiAnggaranPersen) / 100;
        const sisaAnggaran = pagu - realisasiAnggaranNominal;
        
        // Calculate duration in days
        const tanggalMulai = k.tanggal_mulai ? new Date(k.tanggal_mulai) : null;
        const tanggalSelesai = k.tanggal_selesai ? new Date(k.tanggal_selesai) : null;
        const durasiHari = tanggalMulai && tanggalSelesai 
          ? Math.ceil((tanggalSelesai.getTime() - tanggalMulai.getTime()) / (1000 * 60 * 60 * 24))
          : '-';

        // Compile kendala list as text
        const kendalaDetail = (k.kendala_list || []).map((kd, idx) => {
          const statusLabel = kd.status === 'resolved' ? 'Selesai' : 'Terbuka';
          const dampakLabel = kd.tingkat_keparahan === 'tinggi' ? 'Tinggi' : kd.tingkat_keparahan === 'sedang' ? 'Sedang' : 'Rendah';
          return `${idx + 1}. [${statusLabel}] ${kd.deskripsi || '-'} (Dampak: ${dampakLabel})`;
        }).join('\n') || '-';

        return {
          'No': index + 1,
          'Kode KRO': k.kro_kode || '-',
          'Nama KRO': k.kro_nama || 'Tanpa KRO',
          'Nama Kegiatan': k.nama,
          'Deskripsi': k.deskripsi || '-',
          'Status': getStatusLabel(k.status),
          'Tanggal Mulai': formatDate(k.tanggal_mulai),
          'Tanggal Selesai': formatDate(k.tanggal_selesai),
          'Durasi (Hari)': durasiHari,
          'Target Anggaran (Rp)': pagu,
          'Realisasi Anggaran (Rp)': realisasiAnggaranNominal,
          'Realisasi Anggaran (%)': realisasiAnggaranPersen,
          'Sisa Anggaran (Rp)': sisaAnggaran,
          'Target Output': k.target_output || 0,
          'Output Realisasi': k.output_realisasi || 0,
          'Satuan Output': k.satuan_output || '-',
          'Progres Output (%)': k.target_output > 0 ? Math.round(Math.min((k.output_realisasi || 0) / k.target_output * 100, 100)) : 0,
          'Kendala Total': k.kendala_total || 0,
          'Kendala Selesai': k.kendala_resolved || 0,
          'Kendala Belum Selesai': k.kendala_open || 0,
          'Daftar Kendala': kendalaDetail,
          'Skor Kinerja': k.skor_kinerja || 0,
          'Status Kinerja': k.status_kinerja || '-',
          'Mitra': k.mitra_nama || '-',
        };
      });

      // Create CSV content for main sheet
      const headers = Object.keys(dataToExport[0] || {});
      const mainCsvContent = [
        headers.join(';'),
        ...dataToExport.map(row => 
          headers.map(h => {
            const value = row[h as keyof typeof row];
            // Handle numbers and strings
            if (typeof value === 'number') return value;
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(';')
        )
      ].join('\n');

      // Create separate Kendala Detail sheet
      const allKendala: {
        'No': number;
        'Nama Kegiatan': string;
        'Kode KRO': string;
        'Deskripsi Kendala': string;
        'Tingkat Dampak': string;
        'Status': string;
        'Tanggal Kejadian': string;
      }[] = [];
      
      let kendalaNo = 1;
      dataForExport.forEach(k => {
        (k.kendala_list || []).forEach(kd => {
          const dampakLabel = kd.tingkat_keparahan === 'tinggi' ? 'Tinggi' : kd.tingkat_keparahan === 'sedang' ? 'Sedang' : 'Rendah';
          const statusLabel = kd.status === 'resolved' ? 'Selesai' : 'Terbuka';
          allKendala.push({
            'No': kendalaNo++,
            'Nama Kegiatan': k.nama,
            'Kode KRO': k.kro_kode || '-',
            'Deskripsi Kendala': kd.deskripsi || '-',
            'Tingkat Dampak': dampakLabel,
            'Status': statusLabel,
            'Tanggal Kejadian': kd.tanggal_kendala ? formatDate(kd.tanggal_kendala) : (kd.created_at ? formatDate(kd.created_at) : '-'),
          });
        });
      });

      // Create kendala CSV content
      const kendalaHeaders = allKendala.length > 0 ? Object.keys(allKendala[0]) : [];
      const kendalaCsvContent = allKendala.length > 0 ? [
        kendalaHeaders.join(';'),
        ...allKendala.map(row => 
          kendalaHeaders.map(h => {
            const value = row[h as keyof typeof row];
            if (typeof value === 'number') return value;
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(';')
        )
      ].join('\n') : '';

      // Combine both sheets with separator
      const combinedContent = mainCsvContent + 
        '\n\n\n=== DAFTAR KENDALA DETAIL ===\n\n' + 
        (kendalaCsvContent || 'Tidak ada kendala');

      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + combinedContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kegiatan${getPeriodLabel()}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Gagal mengekspor data ke Excel');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  // Export to PDF
  const exportToPDF = (dataForExport: Kegiatan[]) => {
    setExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Popup diblokir. Izinkan popup untuk mengekspor PDF.');
        setExporting(false);
        return;
      }

      const totalPagu = dataForExport.reduce((sum, k) => sum + (parseFloat(String(k.anggaran_pagu)) || 0), 0);
      const totalRealisasiAnggaran = dataForExport.reduce((sum, k) => {
        const pagu = parseFloat(String(k.anggaran_pagu)) || 0;
        const realisasiPersen = parseFloat(String(k.realisasi_anggaran)) || 0;
        return sum + (pagu * realisasiPersen / 100);
      }, 0);
      const avgKinerja = dataForExport.length > 0 
        ? (dataForExport.reduce((sum, k) => sum + (k.skor_kinerja || 0), 0) / dataForExport.length).toFixed(1)
        : 0;
      const avgProgres = dataForExport.length > 0 
        ? (dataForExport.reduce((sum, k) => {
            const progres = k.target_output > 0 ? Math.min((k.output_realisasi || 0) / k.target_output * 100, 100) : 0;
            return sum + progres;
          }, 0) / dataForExport.length).toFixed(1)
        : 0;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Laporan Kegiatan</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 10px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .header h1 { font-size: 16px; margin-bottom: 5px; }
            .header h2 { font-size: 12px; font-weight: normal; margin-bottom: 5px; }
            .header p { color: #666; font-size: 10px; }
            .summary { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 20px; gap: 8px; }
            .summary-item { flex: 1; min-width: 100px; background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; border-left: 3px solid #2563eb; }
            .summary-item.green { border-left-color: #16a34a; }
            .summary-item.yellow { border-left-color: #ca8a04; }
            .summary-item.red { border-left-color: #dc2626; }
            .summary-item .label { font-size: 9px; color: #666; text-transform: uppercase; }
            .summary-item .value { font-size: 14px; font-weight: bold; color: #333; margin-top: 2px; }
            .summary-item .subvalue { font-size: 9px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 5px 6px; text-align: left; font-size: 9px; }
            th { background: #2563eb; color: white; font-weight: bold; }
            tr:nth-child(even) { background: #f9f9f9; }
            .status { padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; white-space: nowrap; }
            .status-berjalan { background: #dbeafe; color: #1d4ed8; }
            .status-selesai { background: #dcfce7; color: #15803d; }
            .status-tertunda { background: #fef3c7; color: #b45309; }
            .status-bermasalah { background: #fee2e2; color: #b91c1c; }
            .status-belum_mulai { background: #f3f4f6; color: #4b5563; }
            .kinerja { padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; }
            .kinerja-sukses { background: #dcfce7; color: #15803d; }
            .kinerja-perhatian { background: #fef3c7; color: #b45309; }
            .kinerja-bermasalah { background: #fee2e2; color: #b91c1c; }
            .section-title { font-size: 12px; font-weight: bold; margin: 15px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
            .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 9px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .highlight { background: #fef3c7 !important; }
            .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
            .progress-fill { height: 100%; background: #2563eb; }
            .totals-row { background: #1e40af !important; color: white; font-weight: bold; }
            .totals-row td { border-color: #1e40af; }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN KEGIATAN</h1>
            <h2>Sistem Informasi Manajemen Kinerja (SIMKINERJA)</h2>
            <p>${getPeriodText()}</p>
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div class="section-title">RINGKASAN KINERJA</div>
          <div class="summary">
            <div class="summary-item">
              <div class="label">Total Kegiatan</div>
              <div class="value">${dataForExport.length}</div>
            </div>
            <div class="summary-item green">
              <div class="label">Selesai</div>
              <div class="value">${dataForExport.filter(k => k.status === 'selesai').length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Berjalan</div>
              <div class="value">${dataForExport.filter(k => k.status === 'berjalan').length}</div>
            </div>
            <div class="summary-item yellow">
              <div class="label">Belum Mulai</div>
              <div class="value">${dataForExport.filter(k => k.status === 'belum_mulai').length}</div>
            </div>
            <div class="summary-item red">
              <div class="label">Tertunda</div>
              <div class="value">${dataForExport.filter(k => k.status === 'tertunda').length}</div>
            </div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="label">Rata-rata Kinerja</div>
              <div class="value">${avgKinerja}</div>
            </div>
            <div class="summary-item">
              <div class="label">Rata-rata Progres Output</div>
              <div class="value">${avgProgres}%</div>
            </div>
            <div class="summary-item">
              <div class="label">Total Target</div>
              <div class="value">${formatCurrency(totalPagu)}</div>
            </div>
            <div class="summary-item green">
              <div class="label">Total Realisasi</div>
              <div class="value">${formatCurrency(totalRealisasiAnggaran)}</div>
              <div class="subvalue">${totalPagu > 0 ? ((totalRealisasiAnggaran / totalPagu) * 100).toFixed(1) : 0}% dari target</div>
            </div>
            <div class="summary-item">
              <div class="label">Sisa Anggaran</div>
              <div class="value">${formatCurrency(totalPagu - totalRealisasiAnggaran)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="label">Total Kendala</div>
              <div class="value">${dataForExport.reduce((sum, k) => sum + (k.kendala_total || 0), 0)}</div>
            </div>
            <div class="summary-item green">
              <div class="label">Kendala Selesai</div>
              <div class="value">${dataForExport.reduce((sum, k) => sum + (k.kendala_resolved || 0), 0)}</div>
            </div>
            <div class="summary-item red">
              <div class="label">Kendala Belum Selesai</div>
              <div class="value">${dataForExport.reduce((sum, k) => sum + (k.kendala_open || 0), 0)}</div>
            </div>
          </div>

          <div class="section-title">DETAIL KEGIATAN</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">No</th>
                <th style="width: 55px;">Kode KRO</th>
                <th style="width: 130px;">Nama Kegiatan</th>
                <th style="width: 50px;">Status</th>
                <th style="width: 65px;">Periode</th>
                <th style="width: 80px;" class="text-right">Target (Rp)</th>
                <th style="width: 80px;" class="text-right">Realisasi (Rp)</th>
                <th style="width: 50px;" class="text-center">Progres</th>
                <th style="width: 55px;" class="text-center">Kendala</th>
                <th style="width: 50px;" class="text-center">Kinerja</th>
                <th style="width: 70px;">Mitra</th>
              </tr>
            </thead>
            <tbody>
              ${dataForExport.map((k, index) => {
                const pagu = parseFloat(String(k.anggaran_pagu)) || 0;
                const realisasiPersen = parseFloat(String(k.realisasi_anggaran)) || 0;
                const realisasiNominal = (pagu * realisasiPersen) / 100;
                const kinerjaBg = k.skor_kinerja >= 80 ? 'sukses' : k.skor_kinerja >= 60 ? 'perhatian' : k.skor_kinerja > 0 ? 'bermasalah' : '';
                const hasKendala = (k.kendala_open || 0) > 0;
                const progresOutput = k.target_output > 0 ? Math.round(Math.min((k.output_realisasi || 0) / k.target_output * 100, 100)) : 0;
                return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${k.kro_kode || '-'}</td>
                  <td>${k.nama}</td>
                  <td><span class="status status-${k.status}">${getStatusLabel(k.status)}</span></td>
                  <td>${formatDate(k.tanggal_mulai)}<br><small style="color:#666">s/d ${formatDate(k.tanggal_selesai)}</small></td>
                  <td class="text-right">${formatCurrency(pagu)}</td>
                  <td class="text-right">${formatCurrency(realisasiNominal)}<br><small style="color:#666">(${realisasiPersen}%)</small></td>
                  <td class="text-center">${progresOutput}%<br><small style="color:#666">${Math.round(k.output_realisasi || 0)}/${Math.round(k.target_output || 0)}</small></td>
                  <td class="text-center">${k.kendala_total > 0 ? `<span style="color: ${hasKendala ? '#dc2626' : '#16a34a'}; font-weight: bold;">${k.kendala_resolved || 0}/${k.kendala_total}</span>` : '-'}</td>
                  <td class="text-center"><span class="kinerja ${kinerjaBg ? 'kinerja-' + kinerjaBg : ''}">${k.skor_kinerja || 0}</span><br><small style="color:#666">${k.status_kinerja || '-'}</small></td>
                  <td>${k.mitra_nama || '-'}</td>
                </tr>
              `}).join('')}
              <tr class="totals-row">
                <td colspan="5" class="text-right"><strong>TOTAL</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalPagu)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalRealisasiAnggaran)}</strong></td>
                <td class="text-center"><strong>${avgProgres}%</strong></td>
                <td class="text-center"><strong>${dataForExport.reduce((sum, k) => sum + (k.kendala_resolved || 0), 0)}/${dataForExport.reduce((sum, k) => sum + (k.kendala_total || 0), 0)}</strong></td>
                <td class="text-center"><strong>${avgKinerja}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">KETERANGAN</div>
          <table style="width: auto;">
            <tr>
              <td><span class="status status-selesai">Selesai</span></td>
              <td>Kegiatan telah selesai dilaksanakan</td>
              <td style="padding-left: 20px;"><span class="kinerja kinerja-sukses">≥80</span></td>
              <td>Kinerja Sukses</td>
            </tr>
            <tr>
              <td><span class="status status-berjalan">Berjalan</span></td>
              <td>Kegiatan sedang dalam pelaksanaan</td>
              <td style="padding-left: 20px;"><span class="kinerja kinerja-perhatian">60-79</span></td>
              <td>Perlu Perhatian</td>
            </tr>
            <tr>
              <td><span class="status status-belum_mulai">Belum Mulai</span></td>
              <td>Kegiatan belum dimulai</td>
              <td style="padding-left: 20px;"><span class="kinerja kinerja-bermasalah">&lt;60</span></td>
              <td>Bermasalah</td>
            </tr>
            <tr>
              <td><span class="status status-tertunda">Tertunda</span></td>
              <td>Kegiatan ditunda pelaksanaannya</td>
              <td></td>
              <td></td>
            </tr>
          </table>

          ${generateKendalaSection(dataForExport, formatDate)}

          <div class="footer">
            <p>Dokumen ini digenerate secara otomatis oleh SIMKINERJA</p>
            <p style="margin-top: 5px;">© ${new Date().getFullYear()} - Sistem Informasi Manajemen Kinerja</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Gagal mengekspor data ke PDF');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  // Filter kegiatan berdasarkan periode untuk export
  const getExportData = () => {
    let dataToFilter = filteredKegiatan;
    
    if (exportPeriode === 'bulan') {
      const targetYear = parseInt(exportTahun);
      const targetMonth = parseInt(exportBulan);
      
      dataToFilter = filteredKegiatan.filter(k => {
        // Filter berdasarkan tanggal mulai atau tanggal selesai dalam periode
        const tanggalMulai = k.tanggal_mulai ? new Date(k.tanggal_mulai) : null;
        const tanggalSelesai = k.tanggal_selesai ? new Date(k.tanggal_selesai) : null;
        
        // Kegiatan masuk periode jika:
        // 1. Tanggal mulai dalam bulan tersebut, ATAU
        // 2. Tanggal selesai dalam bulan tersebut, ATAU
        // 3. Kegiatan berjalan meliputi bulan tersebut (mulai sebelum, selesai setelah)
        const periodeStart = new Date(targetYear, targetMonth - 1, 1);
        const periodeEnd = new Date(targetYear, targetMonth, 0); // Last day of month
        
        if (tanggalMulai && tanggalSelesai) {
          return (tanggalMulai <= periodeEnd && tanggalSelesai >= periodeStart);
        } else if (tanggalMulai) {
          return (tanggalMulai.getFullYear() === targetYear && tanggalMulai.getMonth() + 1 === targetMonth);
        } else if (tanggalSelesai) {
          return (tanggalSelesai.getFullYear() === targetYear && tanggalSelesai.getMonth() + 1 === targetMonth);
        }
        return false;
      });
    } else if (exportPeriode === 'tahun') {
      const targetYear = parseInt(exportTahun);
      
      dataToFilter = filteredKegiatan.filter(k => {
        const tanggalMulai = k.tanggal_mulai ? new Date(k.tanggal_mulai) : null;
        const tanggalSelesai = k.tanggal_selesai ? new Date(k.tanggal_selesai) : null;
        
        if (tanggalMulai && tanggalSelesai) {
          const periodeStart = new Date(targetYear, 0, 1);
          const periodeEnd = new Date(targetYear, 11, 31);
          return (tanggalMulai <= periodeEnd && tanggalSelesai >= periodeStart);
        } else if (tanggalMulai) {
          return tanggalMulai.getFullYear() === targetYear;
        } else if (tanggalSelesai) {
          return tanggalSelesai.getFullYear() === targetYear;
        }
        return false;
      });
    }
    
    return dataToFilter;
  };

  // Handle export with period filter
  const handleExport = () => {
    const exportData = getExportData();
    if (exportData.length === 0) {
      alert('Tidak ada data untuk periode yang dipilih');
      return;
    }
    
    if (exportType === 'excel') {
      exportToExcel(exportData);
    } else {
      exportToPDF(exportData);
    }
  };

  // Open export modal
  const openExportModal = (type: 'excel' | 'pdf') => {
    setExportType(type);
    setShowExportModal(true);
  };

  const filteredKegiatan = kegiatan.filter(k => {
    const matchSearch = k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (k.kro_nama && k.kro_nama.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === 'all' || k.status === filterStatus;
    const matchKro = filterKro === 'all' || k.kro_id === parseInt(filterKro);
    return matchSearch && matchStatus && matchKro;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterKro]);

  // Pagination
  const totalPages = Math.ceil(filteredKegiatan.length / itemsPerPage);
  const paginatedKegiatan = filteredKegiatan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Group kegiatan by KRO (using paginated data)
  const kegiatanByKro = paginatedKegiatan.reduce((acc, k) => {
    const kroKey = k.kro_id ? `${k.kro_kode} - ${k.kro_nama}` : 'Tanpa KRO';
    if (!acc[kroKey]) {
      acc[kroKey] = [];
    }
    acc[kroKey].push(k);
    return acc;
  }, {} as Record<string, Kegiatan[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Memuat data kegiatan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className={`px-6 py-4 ${exportType === 'excel' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
              <h3 className="text-lg font-semibold text-white">
                Export ke {exportType === 'excel' ? 'Excel' : 'PDF'}
              </h3>
              <p className="text-white/80 text-sm">Pilih periode data yang akan diekspor</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Periode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
                <select
                  value={exportPeriode}
                  onChange={(e) => setExportPeriode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Data</option>
                  <option value="bulan">Per Bulan</option>
                  <option value="tahun">Per Tahun</option>
                </select>
              </div>

              {/* Year Selection */}
              {(exportPeriode === 'bulan' || exportPeriode === 'tahun') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                  <select
                    value={exportTahun}
                    onChange={(e) => setExportTahun(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {yearsList.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month Selection */}
              {exportPeriode === 'bulan' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                  <select
                    value={exportBulan}
                    onChange={(e) => setExportBulan(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {bulanList.map(bulan => (
                      <option key={bulan.value} value={bulan.value}>{bulan.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preview info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Data yang akan diekspor:</span><br/>
                  {getPeriodText()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Jumlah kegiatan: <span className="font-medium text-gray-900">{getExportData().length}</span> kegiatan
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || getExportData().length === 0}
                className={`px-4 py-2 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  exportType === 'excel' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {exporting ? 'Mengekspor...' : `Export ${exportType === 'excel' ? 'Excel' : 'PDF'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <LuClipboard className="w-6 h-6" />
              </div>
              Daftar Kegiatan
            </h1>
            <p className="text-blue-100 mt-2">Kelola kegiatan tim Anda</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            <button
              onClick={() => openExportModal('excel')}
              disabled={exporting || filteredKegiatan.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export ke Excel"
            >
              <LuFileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => openExportModal('pdf')}
              disabled={exporting || filteredKegiatan.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export ke PDF"
            >
              <LuFileText className="w-5 h-5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <Link
              href="/pelaksana/kegiatan/tambah"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium shadow-lg"
            >
              <LuPlus className="w-5 h-5" />
              Tambah Kegiatan
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter KRO */}
          <select
            value={filterKro}
            onChange={(e) => setFilterKro(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua KRO</option>
            {kroList.map((kro) => (
              <option key={kro.id} value={kro.id}>
                {kro.kode} - {kro.nama}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="belum_mulai">Belum Mulai</option>
            <option value="berjalan">Berjalan</option>
            <option value="selesai">Selesai</option>
            <option value="tertunda">Tertunda</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Kegiatan</p>
          <p className="text-2xl font-bold text-gray-900">{kegiatan.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Berjalan</p>
          <p className="text-2xl font-bold text-blue-600">{kegiatan.filter(k => k.status === 'berjalan').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Selesai</p>
          <p className="text-2xl font-bold text-green-600">{kegiatan.filter(k => k.status === 'selesai').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Target</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(kegiatan.reduce((sum, k) => sum + (parseFloat(String(k.anggaran_pagu)) || 0), 0))}</p>
        </div>
      </div>

      {/* Kegiatan List by KRO */}
      {Object.keys(kegiatanByKro).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(kegiatanByKro).map(([kroName, kegiatanList]) => (
            <div key={kroName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* KRO Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <LuFolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{kroName}</h3>
                    <p className="text-sm text-gray-500">{kegiatanList.length} kegiatan</p>
                  </div>
                </div>
              </div>

              {/* Kegiatan Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kode KRO</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kegiatan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Periode</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progres</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kinerja</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {kegiatanList.map((k) => (
                      <tr key={k.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {k.kro_kode ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs font-medium">
                              {k.kro_kode}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{k.nama}</p>
                            {k.mitra_nama && (
                              <p className="text-xs text-gray-500">Mitra: {k.mitra_nama}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(k.status)}`}>
                            {getStatusLabel(k.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <p>{formatDate(k.tanggal_mulai)}</p>
                            <p className="text-xs text-gray-400">s/d {formatDate(k.tanggal_selesai)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(k.anggaran_pagu || 0)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-28">
                            {(() => {
                              const progres = k.target_output > 0 
                                ? Math.min((k.output_realisasi || 0) / k.target_output * 100, 100) 
                                : 0;
                              return (
                                <>
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-500">Output</span>
                                    <span className="font-medium">{Math.round(progres)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        progres >= 100 ? 'bg-green-500' : 
                                        progres >= 75 ? 'bg-blue-500' : 
                                        progres >= 50 ? 'bg-yellow-500' : 
                                        progres >= 25 ? 'bg-orange-500' : 'bg-red-400'
                                      }`}
                                      style={{ width: `${progres}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {Math.round(k.output_realisasi || 0)}/{Math.round(k.target_output || 0)} {k.satuan_output || ''}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getKinerjaBadge(k.skor_kinerja || 0)}`}>
                            {k.skor_kinerja || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/pelaksana/kegiatan/${k.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Detail
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link
                              href={`/pelaksana/kegiatan/${k.id}/update`}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Update
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {filteredKegiatan.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredKegiatan.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuClipboard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Kegiatan</h3>
          <p className="text-gray-500 mb-6">Mulai dengan menambahkan kegiatan pertama Anda</p>
          <Link
            href="/pelaksana/kegiatan/tambah"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <LuPlus className="w-4 h-4" />
            Tambah Kegiatan
          </Link>
        </div>
      )}
    </div>
  );
}
