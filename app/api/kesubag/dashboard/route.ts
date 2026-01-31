import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData } from '@/lib/services/kinerjaCalculator';

// Generate monthly chart data
function generateMonthlyData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((bulan, index) => ({
    bulan,
    monthIndex: index
  }));
}

// GET - Dashboard data for kesubag
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all kegiatan with related data
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.id,
        ko.nama,
        ko.tim_id,
        ko.kro_id,
        ko.target_output,
        COALESCE(ko.output_realisasi, 0) as output_realisasi,
        ko.satuan_output,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.tanggal_realisasi_selesai,
        ko.anggaran_pagu,
        ko.status,
        COALESCE(ko.status_verifikasi, 'belum_verifikasi') as status_verifikasi,
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      ORDER BY ko.created_at DESC
    `);

    // Calculate kinerja for each kegiatan
    const kegiatanWithKinerja = kegiatanRows.map((kg: RowDataPacket) => {
      const kegiatanData: KegiatanData = {
        target_output: parseFloat(kg.target_output) || 0,
        tanggal_mulai: kg.tanggal_mulai,
        tanggal_selesai: kg.tanggal_selesai,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        tanggal_realisasi_selesai: kg.tanggal_realisasi_selesai,
        status_verifikasi: kg.status_verifikasi || 'belum_verifikasi',
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        total_kendala: parseInt(kg.total_kendala) || 0,
        kendala_resolved: parseInt(kg.kendala_resolved) || 0
      };

      const kinerjaResult = hitungKinerjaKegiatan(kegiatanData);

      return {
        id: kg.id,
        nama: kg.nama,
        tim_id: kg.tim_id,
        kro_id: kg.kro_id,
        tim_nama: kg.tim_nama,
        kro_kode: kg.kro_kode,
        kro_nama: kg.kro_nama,
        status: kg.status,
        status_verifikasi: kg.status_verifikasi,
        anggaran_pagu: kg.anggaran_pagu,
        total_realisasi_anggaran: kg.total_realisasi_anggaran,
        total_kendala: kg.total_kendala,
        kendala_resolved: kg.kendala_resolved,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja
      };
    });

    // Calculate statistics
    const totalKegiatan = kegiatanWithKinerja.length;
    
    // Status Kinerja Distribution
    const statusKinerja = {
      sukses: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Sukses').length,
      perlu_perhatian: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
      bermasalah: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Bermasalah').length,
      belum_dinilai: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Belum Dinilai').length
    };

    // Status Proses Distribution
    const statusProses = {
      berjalan: kegiatanWithKinerja.filter(k => k.status === 'berjalan').length,
      selesai: kegiatanWithKinerja.filter(k => k.status === 'selesai').length,
      belum_mulai: kegiatanWithKinerja.filter(k => k.status === 'belum_mulai').length,
      tertunda: kegiatanWithKinerja.filter(k => k.status === 'tertunda').length
    };

    // Anggaran Summary
    const totalPagu = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.anggaran_pagu) || 0), 0);
    const totalRealisasi = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.total_realisasi_anggaran) || 0), 0);
    const serapanPersen = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    // Tim Performance Summary
    const [timRows] = await pool.query<RowDataPacket[]>(`SELECT id, nama FROM tim`);
    
    const timPerformance = timRows.map(tim => {
      const timKegiatan = kegiatanWithKinerja.filter(k => k.tim_id === tim.id);
      const avgSkor = timKegiatan.length > 0 
        ? timKegiatan.reduce((sum, k) => sum + k.skor_kinerja, 0) / timKegiatan.length 
        : 0;
      const timPagu = timKegiatan.reduce((sum, k) => sum + (parseFloat(k.anggaran_pagu) || 0), 0);
      const timRealisasi = timKegiatan.reduce((sum, k) => sum + (parseFloat(k.total_realisasi_anggaran) || 0), 0);
      
      return {
        tim_id: tim.id,
        tim_nama: tim.nama,
        total_kegiatan: timKegiatan.length,
        kegiatan_selesai: timKegiatan.filter(k => k.status === 'selesai').length,
        rata_rata_skor: Math.round(avgSkor * 100) / 100,
        total_pagu: timPagu,
        total_realisasi: timRealisasi,
        sukses: timKegiatan.filter(k => k.status_kinerja === 'Sukses').length,
        bermasalah: timKegiatan.filter(k => k.status_kinerja === 'Bermasalah').length
      };
    });

    // KRO Performance Summary  
    const [kroRows] = await pool.query<RowDataPacket[]>(`SELECT id, kode, nama FROM kro`);
    
    const kroPerformance = kroRows.map(kro => {
      const kroKegiatan = kegiatanWithKinerja.filter(k => k.kro_id === kro.id);
      const avgSkor = kroKegiatan.length > 0 
        ? kroKegiatan.reduce((sum, k) => sum + k.skor_kinerja, 0) / kroKegiatan.length 
        : 0;
      
      return {
        kro_id: kro.id,
        kro_kode: kro.kode,
        kro_nama: kro.nama,
        total_kegiatan: kroKegiatan.length,
        rata_rata_skor: Math.round(avgSkor * 100) / 100
      };
    });

    // Get kegiatan bermasalah (low score or with pending issues)
    const kegiatanBermasalah = kegiatanWithKinerja
      .filter(k => k.skor_kinerja < 60 || k.status_kinerja === 'Bermasalah' || k.status_kinerja === 'Perlu Perhatian')
      .slice(0, 5)
      .map(k => ({
        id: k.id,
        nama: k.nama,
        tim_nama: k.tim_nama,
        status: k.status,
        skor: k.skor_kinerja,
        kendala: k.total_kendala > 0 ? `${k.total_kendala} kendala` : '-',
        jumlah_kendala: parseInt(k.total_kendala) || 0
      }));

    // Calculate overall average score
    const ratarataSkor = totalKegiatan > 0 
      ? kegiatanWithKinerja.reduce((sum, k) => sum + k.skor_kinerja, 0) / totalKegiatan 
      : 0;

    // Generate monthly chart data
    const monthlyData = generateMonthlyData();
    const currentYear = new Date().getFullYear();

    // Progres chart - monthly realisasi output percentage
    const progresChart = await Promise.all(monthlyData.map(async ({ bulan, monthIndex }) => {
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);
      
      const [progresData] = await pool.query<RowDataPacket[]>(
        `SELECT 
          AVG(CASE WHEN ko.target_output > 0 THEN (ko.output_realisasi / ko.target_output) * 100 ELSE 0 END) as avg_progres
         FROM kegiatan ko
         WHERE ko.updated_at BETWEEN ? AND ?`,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
      
      const progres = progresData[0]?.avg_progres || 0;
      const target = ((monthIndex + 1) / 12) * 100; // Linear target

      return {
        bulan,
        progres: Math.round(progres),
        target: Math.round(target)
      };
    }));

    // Anggaran chart - monthly pagu vs realisasi
    const anggaranChart = await Promise.all(monthlyData.map(async ({ bulan, monthIndex }) => {
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);
      
      const [anggaranData] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(ra.jumlah), 0) as realisasi
         FROM realisasi_anggaran ra
         WHERE ra.tanggal_realisasi BETWEEN ? AND ?`,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
      
      const realisasi = parseFloat(anggaranData[0]?.realisasi) || 0;
      const monthlyPagu = totalPagu / 12; // Distribute pagu evenly

      return {
        bulan,
        pagu: Math.round(monthlyPagu),
        realisasi: Math.round(realisasi)
      };
    }));

    // Get total kendala stats
    const [kendalaTotal] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM kendala_kegiatan
    `);

    return NextResponse.json({
      stats: {
        totalKegiatan: totalKegiatan,
        kegiatanSelesai: statusProses.selesai,
        kegiatanBerjalan: statusProses.berjalan,
        kegiatanBelum: statusProses.belum_mulai,
        kegiatanTertunda: statusProses.tertunda,
        kegiatanBermasalah: statusKinerja.bermasalah,
        totalTim: timRows.length,
        totalPagu: totalPagu,
        totalRealisasiAnggaran: totalRealisasi,
        persentaseRealisasi: serapanPersen,
        ratarataSkor: ratarataSkor,
        totalKendala: parseInt(kendalaTotal[0]?.total) || 0,
        kendalaResolved: parseInt(kendalaTotal[0]?.resolved) || 0
      },
      timPerformance: timPerformance.map(t => ({
        tim_nama: t.tim_nama,
        total_kegiatan: t.total_kegiatan,
        kegiatan_selesai: t.kegiatan_selesai,
        rata_skor: t.rata_rata_skor,
        total_pagu: t.total_pagu,
        total_realisasi: t.total_realisasi
      })),
      kroPerformance: kroPerformance.map(k => ({
        kro_kode: k.kro_kode,
        kro_nama: k.kro_nama,
        total_kegiatan: k.total_kegiatan,
        rata_skor: k.rata_rata_skor
      })),
      kegiatanBermasalah: kegiatanBermasalah,
      progresChart,
      anggaranChart
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
