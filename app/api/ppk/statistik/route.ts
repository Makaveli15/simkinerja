import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get kegiatan statistics - semua kegiatan untuk overview
    const [kegiatanStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_kegiatan,
        SUM(CASE WHEN status_pengajuan = 'review_ppk' THEN 1 ELSE 0 END) as kegiatan_pending,
        SUM(CASE WHEN status_pengajuan IN ('approved_ppk', 'approved', 'review_pimpinan', 'approved_pimpinan', 'disetujui', 'approved_koordinator') THEN 1 ELSE 0 END) as kegiatan_approved,
        SUM(CASE WHEN status_pengajuan IN ('rejected_ppk', 'ditolak', 'revisi', 'rejected_koordinator') THEN 1 ELSE 0 END) as kegiatan_rejected,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as kegiatan_bulan_ini
      FROM kegiatan
    `);

    // Get anggaran statistics - total dari semua kegiatan
    const [anggaranStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(anggaran_pagu), 0) as total_anggaran,
        COALESCE(SUM(CASE WHEN status_pengajuan IN ('approved_ppk', 'approved', 'review_pimpinan', 'approved_pimpinan', 'disetujui', 'approved_koordinator') THEN anggaran_pagu ELSE 0 END), 0) as anggaran_approved,
        COALESCE(SUM(CASE WHEN status_pengajuan = 'review_ppk' THEN anggaran_pagu ELSE 0 END), 0) as anggaran_pending,
        COALESCE(SUM(CASE WHEN status_pengajuan IN ('rejected_ppk', 'ditolak', 'revisi', 'rejected_koordinator') THEN anggaran_pagu ELSE 0 END), 0) as anggaran_rejected
      FROM kegiatan
    `);

    // Get realisasi anggaran dari tabel realisasi_anggaran
    const [realisasiStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(jumlah), 0) as total_realisasi
      FROM realisasi_anggaran
    `);

    // Get anggaran per tim - semua kegiatan
    const [anggaranPerTim] = await pool.query<RowDataPacket[]>(`
      SELECT 
        t.nama as tim_nama,
        COALESCE(SUM(k.anggaran_pagu), 0) as target_anggaran,
        COALESCE(SUM(ra.jumlah_realisasi), 0) as realisasi_anggaran
      FROM tim t
      LEFT JOIN kegiatan k ON t.id = k.tim_id
      LEFT JOIN (
        SELECT kegiatan_id, SUM(jumlah) as jumlah_realisasi 
        FROM realisasi_anggaran 
        GROUP BY kegiatan_id
      ) ra ON k.id = ra.kegiatan_id
      GROUP BY t.id, t.nama
      HAVING target_anggaran > 0
      ORDER BY target_anggaran DESC
      LIMIT 10
    `);

    // Get anggaran per bulan berdasarkan tanggal_mulai kegiatan
    const [anggaranPerBulan] = await pool.query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(COALESCE(k.tanggal_mulai, k.created_at), '%Y-%m') as bulan_key,
        CONCAT(
          CASE MONTH(COALESCE(k.tanggal_mulai, k.created_at))
            WHEN 1 THEN 'Januari'
            WHEN 2 THEN 'Februari'
            WHEN 3 THEN 'Maret'
            WHEN 4 THEN 'April'
            WHEN 5 THEN 'Mei'
            WHEN 6 THEN 'Juni'
            WHEN 7 THEN 'Juli'
            WHEN 8 THEN 'Agustus'
            WHEN 9 THEN 'September'
            WHEN 10 THEN 'Oktober'
            WHEN 11 THEN 'November'
            WHEN 12 THEN 'Desember'
          END, ' ', YEAR(COALESCE(k.tanggal_mulai, k.created_at))
        ) as bulan,
        COALESCE(SUM(k.anggaran_pagu), 0) as target_anggaran,
        COALESCE(SUM(ra.jumlah_realisasi), 0) as realisasi_anggaran
      FROM kegiatan k
      LEFT JOIN (
        SELECT kegiatan_id, SUM(jumlah) as jumlah_realisasi 
        FROM realisasi_anggaran 
        GROUP BY kegiatan_id
      ) ra ON k.id = ra.kegiatan_id
      WHERE COALESCE(k.tanggal_mulai, k.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY bulan_key, bulan
      ORDER BY bulan_key ASC
    `);

    // Get top 5 kegiatan dengan anggaran terbesar
    const [topKegiatan] = await pool.query<RowDataPacket[]>(`
      SELECT 
        k.id,
        k.nama,
        k.anggaran_pagu as target_anggaran,
        COALESCE(SUM(ra.jumlah), 0) as realisasi_anggaran,
        k.status_pengajuan,
        t.nama as tim_nama
      FROM kegiatan k
      LEFT JOIN realisasi_anggaran ra ON k.id = ra.kegiatan_id
      LEFT JOIN tim t ON k.tim_id = t.id
      GROUP BY k.id, k.nama, k.anggaran_pagu, k.status_pengajuan, t.nama
      ORDER BY k.anggaran_pagu DESC
      LIMIT 5
    `);

    // Get kegiatan per bulan untuk chart
    const [kegiatanPerBulan] = await pool.query<RowDataPacket[]>(`
      SELECT 
        CONCAT(
          CASE MONTH(created_at)
            WHEN 1 THEN 'Januari'
            WHEN 2 THEN 'Februari'
            WHEN 3 THEN 'Maret'
            WHEN 4 THEN 'April'
            WHEN 5 THEN 'Mei'
            WHEN 6 THEN 'Juni'
            WHEN 7 THEN 'Juli'
            WHEN 8 THEN 'Agustus'
            WHEN 9 THEN 'September'
            WHEN 10 THEN 'Oktober'
            WHEN 11 THEN 'November'
            WHEN 12 THEN 'Desember'
          END, ' ', YEAR(created_at)
        ) as bulan,
        COUNT(*) as total,
        SUM(CASE WHEN status_pengajuan IN ('approved_ppk', 'approved', 'review_pimpinan', 'approved_pimpinan', 'disetujui', 'approved_koordinator') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status_pengajuan IN ('rejected_ppk', 'ditolak', 'revisi', 'rejected_koordinator') THEN 1 ELSE 0 END) as rejected
      FROM kegiatan
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), bulan
      ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
    `);

    // Calculate rata-rata waktu approval (hanya kegiatan yang sudah di-approve PPK)
    const [waktuApproval] = await pool.query<RowDataPacket[]>(`
      SELECT 
        AVG(DATEDIFF(tanggal_approval_ppk, tanggal_approval_koordinator)) as rata_rata_hari
      FROM kegiatan
      WHERE tanggal_approval_ppk IS NOT NULL AND tanggal_approval_koordinator IS NOT NULL
    `);

    // Jika tidak ada data dengan approval PPK, coba cari dengan tanggal_approval lama
    let rataRataHari = waktuApproval[0]?.rata_rata_hari;
    if (!rataRataHari) {
      const [waktuApprovalFallback] = await pool.query<RowDataPacket[]>(`
        SELECT 
          AVG(DATEDIFF(tanggal_approval, created_at)) as rata_rata_hari
        FROM kegiatan
        WHERE tanggal_approval IS NOT NULL
      `);
      rataRataHari = waktuApprovalFallback[0]?.rata_rata_hari || 0;
    }

    // Get sisa anggaran (target - realisasi)
    const totalAnggaran = anggaranStats[0]?.total_anggaran || 0;
    const totalRealisasi = realisasiStats[0]?.total_realisasi || 0;
    const sisaAnggaran = totalAnggaran - totalRealisasi;
    const persentaseSerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran * 100) : 0;

    return NextResponse.json({
      statistik: {
        // Kegiatan stats
        total_kegiatan: Number(kegiatanStats[0]?.total_kegiatan) || 0,
        kegiatan_pending: Number(kegiatanStats[0]?.kegiatan_pending) || 0,
        kegiatan_approved: Number(kegiatanStats[0]?.kegiatan_approved) || 0,
        kegiatan_rejected: Number(kegiatanStats[0]?.kegiatan_rejected) || 0,
        kegiatan_bulan_ini: Number(kegiatanStats[0]?.kegiatan_bulan_ini) || 0,
        rata_rata_waktu_approval: Math.round(rataRataHari || 0),
        
        // Anggaran stats
        total_anggaran: Number(totalAnggaran) || 0,
        total_realisasi: Number(totalRealisasi) || 0,
        sisa_anggaran: Number(sisaAnggaran) || 0,
        persentase_serapan: Math.round(persentaseSerapan * 100) / 100,
        
        // Anggaran per status
        anggaran_approved: Number(anggaranStats[0]?.anggaran_approved) || 0,
        anggaran_pending: Number(anggaranStats[0]?.anggaran_pending) || 0,
        anggaran_rejected: Number(anggaranStats[0]?.anggaran_rejected) || 0,
      },
      anggaran_per_tim: anggaranPerTim,
      anggaran_per_bulan: anggaranPerBulan,
      top_kegiatan: topKegiatan,
      kegiatan_per_bulan: kegiatanPerBulan,
    });
  } catch (error) {
    console.error('Error fetching PPK statistik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
