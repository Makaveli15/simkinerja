import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData } from '@/lib/services/kinerjaCalculator';

// Helper function to get mitra list for a kegiatan
async function getMitraForKegiatan(kegiatanId: number): Promise<RowDataPacket[]> {
  try {
    // Try to get from kegiatan_mitra table first (many-to-many)
    try {
      const [mitraRows] = await pool.query<RowDataPacket[]>(
        `SELECT m.id, m.nama, m.sobat_id, m.alamat, m.no_telp, m.posisi
         FROM kegiatan_mitra km
         JOIN mitra m ON km.mitra_id = m.id
         WHERE km.kegiatan_id = ?
         ORDER BY m.nama`,
        [kegiatanId]
      );
      
      if (mitraRows.length > 0) {
        return mitraRows;
      }
    } catch (e) {
      // kegiatan_mitra table might not exist, continue to fallback
    }
    
    // Fallback to legacy mitra_id column in kegiatan (kegiatan_operasional)
    const [legacyMitra] = await pool.query<RowDataPacket[]>(
      `SELECT m.id, m.nama, m.sobat_id, m.alamat, m.no_telp, m.posisi
       FROM kegiatan ko
       JOIN mitra m ON ko.mitra_id = m.id
       WHERE ko.id = ?`,
      [kegiatanId]
    );
    
    return legacyMitra;
  } catch (error) {
    // Table might not exist yet, return empty array
    console.log('Could not fetch mitra list:', error);
    return [];
  }
}

// GET - Get kegiatan list for PPK
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const tim_id = searchParams.get('tim_id');
    const kro_id = searchParams.get('kro_id');
    const status_pengajuan = searchParams.get('status_pengajuan');
    const status_kinerja = searchParams.get('status_kinerja');
    const status = searchParams.get('status');
    const periode_mulai = searchParams.get('periode_mulai');
    const periode_selesai = searchParams.get('periode_selesai');
    const monitoring = searchParams.get('monitoring'); // Filter for monitoring page - only show fully approved kegiatan

    // Build query - PPK sees kegiatan based on context
    // If monitoring=true, only show fully approved (disetujui)
    // Otherwise, show all kegiatan that passed koordinator approval
    let query = `
      SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tim_id,
        ko.kro_id,
        ko.created_by,
        ko.mitra_id,
        ko.target_output,
        ko.output_realisasi,
        ko.satuan_output,
        ko.jenis_validasi,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.tanggal_realisasi_selesai,
        ko.anggaran_pagu,
        ko.status,
        ko.status_pengajuan,
        ko.status_verifikasi,
        ko.catatan_koordinator,
        ko.tanggal_approval_koordinator,
        ko.catatan_ppk,
        ko.tanggal_approval_ppk,
        ko.approved_by_ppk,
        ko.created_at,
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        u.nama_lengkap as pelaksana_nama,
        u.email as pelaksana_email,
        koordinator.nama_lengkap as koordinator_nama,
        m.nama as mitra_nama,
        m.posisi as mitra_posisi,
        m.alamat as mitra_alamat,
        m.no_telp as mitra_no_telp,
        m.sobat_id as mitra_sobat_id,
        COALESCE(ko.tanggal_pengajuan, ko.created_at) as tanggal_pengajuan,
        COALESCE(ko.tanggal_approval_koordinator, ko.tanggal_approval_ppk) as tanggal_approval,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved,
        COALESCE((SELECT SUM(jumlah_output) FROM validasi_kuantitas WHERE kegiatan_id = ko.id AND status = 'disahkan'), 0) as output_tervalidasi,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final' AND status_final = 'disahkan'), 0) as dokumen_disahkan,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final'), 0) as total_dokumen_final,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final' AND status_final = 'menunggu'), 0) as dokumen_menunggu,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final' AND status_final = 'revisi'), 0) as dokumen_revisi
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN users koordinator ON ko.approved_by_koordinator = koordinator.id
      LEFT JOIN mitra m ON ko.mitra_id = m.id
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];

    // If monitoring=true, only show kegiatan that are fully approved (disetujui)
    if (monitoring === 'true') {
      query += ' AND ko.status_pengajuan = ?';
      queryParams.push('disetujui');
    } else {
      // For approval page, show kegiatan that:
      // 1. Status review_ppk (menunggu approval PPK)
      // 2. Status review_kepala, disetujui (sudah diproses PPK, diteruskan)
      // 3. Status ditolak DAN tanggal_approval_ppk IS NOT NULL (ditolak oleh PPK, bukan koordinator)
      // 4. Status revisi
      query += ` AND (
        ko.status_pengajuan IN ('review_ppk', 'review_kepala', 'disetujui', 'revisi')
        OR (ko.status_pengajuan = 'ditolak' AND ko.tanggal_approval_ppk IS NOT NULL)
      )`;
    }

    if (tim_id) {
      query += ' AND ko.tim_id = ?';
      queryParams.push(tim_id);
    }

    if (kro_id) {
      query += ' AND ko.kro_id = ?';
      queryParams.push(kro_id);
    }

    // Only apply status_pengajuan filter if not in monitoring mode
    if (status_pengajuan && monitoring !== 'true') {
      query += ' AND ko.status_pengajuan = ?';
      queryParams.push(status_pengajuan);
    }

    if (periode_mulai) {
      query += ' AND ko.tanggal_mulai >= ?';
      queryParams.push(periode_mulai);
    }

    if (periode_selesai) {
      query += ' AND ko.tanggal_selesai <= ?';
      queryParams.push(periode_selesai);
    }

    query += ' ORDER BY CASE WHEN ko.status_pengajuan = "review_ppk" THEN 0 ELSE 1 END, ko.created_at DESC';

    const [kegiatanRows] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Calculate kinerja for each kegiatan and get mitra list
    const kegiatanWithKinerja = await Promise.all(kegiatanRows.map(async (kg) => {
      // Determine output tervalidasi based on jenis_validasi
      const jenisValidasi = kg.jenis_validasi || 'dokumen';
      const outputTervalidasi = jenisValidasi === 'kuantitas' 
        ? parseFloat(kg.output_tervalidasi) || 0 
        : parseInt(kg.dokumen_disahkan) || 0;
      
      // Build dokumen_stats for jenis_validasi dokumen
      const dokumenStats = jenisValidasi === 'dokumen' ? {
        total_final: parseInt(kg.total_dokumen_final) || 0,
        final_disahkan: parseInt(kg.dokumen_disahkan) || 0,
        final_menunggu: parseInt(kg.dokumen_menunggu) || 0,
        final_revisi: parseInt(kg.dokumen_revisi) || 0
      } : undefined;

      const kegiatanData: KegiatanData = {
        target_output: parseFloat(kg.target_output) || 0,
        tanggal_mulai: kg.tanggal_mulai,
        tanggal_selesai: kg.tanggal_selesai,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        output_tervalidasi: outputTervalidasi,
        tanggal_realisasi_selesai: kg.tanggal_realisasi_selesai,
        status_verifikasi: kg.status_verifikasi || 'belum_verifikasi',
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        total_kendala: parseInt(kg.total_kendala) || 0,
        kendala_resolved: parseInt(kg.kendala_resolved) || 0,
        jenis_validasi: jenisValidasi as 'kuantitas' | 'dokumen',
        dokumen_stats: dokumenStats
      };

      const kinerjaResult = await hitungKinerjaKegiatanAsync(kegiatanData);
      
      // Get mitra list for this kegiatan
      const mitraList = await getMitraForKegiatan(kg.id);

      return {
        ...kg,
        target_output: parseFloat(kg.target_output) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        indikator: kinerjaResult.indikator,
        mitra_list: mitraList,
        total_mitra: mitraList.length,
        realisasi_anggaran_persen: kg.anggaran_pagu > 0 
          ? Math.round((parseFloat(kg.total_realisasi_anggaran) / parseFloat(kg.anggaran_pagu)) * 100 * 100) / 100 
          : 0,
        capaian_output_persen: kg.target_output > 0 
          ? Math.round((parseFloat(kg.output_realisasi) / parseFloat(kg.target_output)) * 100 * 100) / 100 
          : 0
      };
    }));

    // Filter by status_kinerja if provided
    let filteredKegiatan = kegiatanWithKinerja;
    if (status_kinerja) {
      filteredKegiatan = kegiatanWithKinerja.filter(k => k.status_kinerja === status_kinerja);
    }

    // Get Tim list for filter dropdown
    const [timList] = await pool.query<RowDataPacket[]>('SELECT id, nama FROM tim ORDER BY nama');
    
    // Get KRO list for filter dropdown
    const [kroList] = await pool.query<RowDataPacket[]>('SELECT id, kode, nama FROM kro ORDER BY kode');

    return NextResponse.json({
      kegiatan: filteredKegiatan,
      filters: {
        tim_list: timList,
        kro_list: kroList
      }
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
