import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Generate monthly chart data
function generateMonthlyData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((bulan, index) => ({
    bulan,
    monthIndex: index
  }));
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({
        stats: {
          totalKegiatan: 0,
          kegiatanSelesai: 0,
          kegiatanBerjalan: 0,
          kegiatanBelum: 0,
          kegiatanBermasalah: 0,
          persentaseSelesai: 0,
          totalKendala: 0,
          kendalaResolved: 0,
          skorKinerja: 0,
          totalPagu: 0,
          totalRealisasiAnggaran: 0,
        },
        kegiatanTerbaru: [],
        progresChart: [],
        anggaranChart: [],
      });
    }

    const timId = userRows[0].tim_id;

    // Get kegiatan operasional for the team with KRO info
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.status,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.anggaran_pagu,
        ko.kro_id,
        kro.nama as kro_nama
      FROM kegiatan_operasional ko
      LEFT JOIN kro ON ko.kro_id = kro.id
      WHERE ko.tim_id = ?
      ORDER BY ko.created_at DESC`,
      [timId]
    );

    const totalKegiatan = kegiatan.length;
    const kegiatanSelesai = kegiatan.filter(k => k.status === 'selesai').length;
    const kegiatanBerjalan = kegiatan.filter(k => k.status === 'berjalan').length;
    const kegiatanBelum = kegiatan.filter(k => k.status === 'belum_mulai').length;
    const kegiatanBermasalah = kegiatan.filter(k => k.status === 'bermasalah' || k.status === 'tertunda').length;
    const persentaseSelesai = totalKegiatan > 0 ? Math.round((kegiatanSelesai / totalKegiatan) * 100) : 0;

    // Calculate total pagu and realisasi
    const totalPagu = kegiatan.reduce((sum, k) => sum + (parseFloat(k.anggaran_pagu) || 0), 0);
    
    const [realisasiTotal] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(ra.jumlah), 0) as total
       FROM realisasi_anggaran ra
       JOIN kegiatan_operasional ko ON ra.kegiatan_operasional_id = ko.id
       WHERE ko.tim_id = ?`,
      [timId]
    );
    const totalRealisasiAnggaran = parseFloat(realisasiTotal[0]?.total) || 0;

    // Get kendala stats
    const [kendalaStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN kk.status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM kendala_kegiatan kk
      JOIN kegiatan_operasional ko ON kk.kegiatan_operasional_id = ko.id
      WHERE ko.tim_id = ?`,
      [timId]
    );

    // Calculate average kinerja score
    let totalSkor = 0;
    let countWithSkor = 0;

    for (const k of kegiatan) {
      const [progres] = await pool.query<RowDataPacket[]>(
        `SELECT capaian_output, ketepatan_waktu, kualitas_output 
         FROM progres_kegiatan 
         WHERE kegiatan_operasional_id = ? 
         ORDER BY tanggal_update DESC LIMIT 1`,
        [k.id]
      );

      if (progres.length > 0) {
        const [anggaranTotal] = await pool.query<RowDataPacket[]>(
          `SELECT COALESCE(SUM(jumlah), 0) as total FROM realisasi_anggaran WHERE kegiatan_operasional_id = ?`,
          [k.id]
        );

        const [kendala] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved 
           FROM kendala_kegiatan WHERE kegiatan_operasional_id = ?`,
          [k.id]
        );

        const p = progres[0];
        const realisasiAnggaran = k.anggaran_pagu > 0 
          ? (parseFloat(anggaranTotal[0].total) / parseFloat(k.anggaran_pagu)) * 100 
          : 0;
        const penyelesaianKendala = kendala[0].total > 0 
          ? (kendala[0].resolved / kendala[0].total) * 100 
          : 100;

        const skor = 
          (p.capaian_output * 0.30) +
          (p.ketepatan_waktu * 0.20) +
          (Math.min(realisasiAnggaran, 100) * 0.20) +
          (p.kualitas_output * 0.20) +
          (penyelesaianKendala * 0.10);

        totalSkor += skor;
        countWithSkor++;
      }
    }

    const avgSkor = countWithSkor > 0 ? Math.round(totalSkor / countWithSkor) : 0;

    // Generate chart data
    const monthlyData = generateMonthlyData();
    const currentYear = new Date().getFullYear();
    
    // Progres chart - monthly average progress
    const progresChart = await Promise.all(monthlyData.map(async ({ bulan, monthIndex }) => {
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);
      
      const [progresData] = await pool.query<RowDataPacket[]>(
        `SELECT AVG(rf.persentase) as avg_progres
         FROM realisasi_fisik rf
         JOIN kegiatan_operasional ko ON rf.kegiatan_operasional_id = ko.id
         WHERE ko.tim_id = ? AND rf.tanggal_realisasi BETWEEN ? AND ?`,
        [timId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
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
         JOIN kegiatan_operasional ko ON ra.kegiatan_operasional_id = ko.id
         WHERE ko.tim_id = ? AND ra.tanggal_realisasi BETWEEN ? AND ?`,
        [timId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
      
      const realisasi = parseFloat(anggaranData[0]?.realisasi) || 0;
      const monthlyPagu = totalPagu / 12; // Distribute pagu evenly

      return {
        bulan,
        pagu: Math.round(monthlyPagu),
        realisasi: Math.round(realisasi)
      };
    }));

    return NextResponse.json({
      stats: {
        totalKegiatan,
        kegiatanSelesai,
        kegiatanBerjalan,
        kegiatanBelum,
        kegiatanBermasalah,
        persentaseSelesai,
        totalKendala: parseInt(kendalaStats[0]?.total) || 0,
        kendalaResolved: parseInt(kendalaStats[0]?.resolved) || 0,
        skorKinerja: avgSkor,
        totalPagu,
        totalRealisasiAnggaran,
      },
      kegiatanTerbaru: kegiatan.slice(0, 5),
      progresChart,
      anggaranChart,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
