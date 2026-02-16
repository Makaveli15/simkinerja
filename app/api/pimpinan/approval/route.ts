import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
    
    // Fallback to legacy mitra_id column in kegiatan
    const [legacyMitra] = await pool.query<RowDataPacket[]>(
      `SELECT m.id, m.nama, m.sobat_id, m.alamat, m.no_telp, m.posisi
       FROM kegiatan ko
       JOIN mitra m ON ko.mitra_id = m.id
       WHERE ko.id = ?`,
      [kegiatanId]
    );
    
    return legacyMitra;
  } catch (error) {
    console.log('Could not fetch mitra list:', error);
    return [];
  }
}

// GET - Get list of kegiatan pending Kepala approval (status: review_kepala)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'review_kepala'; // default to pending kepala review
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build WHERE clause based on status filter
    let whereClause = 'WHERE 1=1';
    const queryParams: (string | number)[] = [];

    if (status === 'review_kepala') {
      whereClause += ` AND ko.status_pengajuan = 'review_kepala'`;
    } else if (status === 'disetujui') {
      whereClause += ` AND ko.status_pengajuan = 'disetujui' AND ko.approved_by_kepala IS NOT NULL`;
    } else if (status === 'ditolak') {
      // Hanya tampilkan yang ditolak oleh pimpinan (sudah melewati PPK)
      whereClause += ` AND ko.status_pengajuan = 'ditolak' AND ko.approved_by_ppk IS NOT NULL AND ko.tanggal_approval_kepala IS NOT NULL`;
    } else if (status === 'all') {
      // Show all that have reached kepala review stage (harus sudah disetujui PPK)
      whereClause += ` AND ko.approved_by_ppk IS NOT NULL AND (ko.status_pengajuan IN ('review_kepala', 'disetujui') OR (ko.status_pengajuan = 'ditolak' AND ko.tanggal_approval_kepala IS NOT NULL))`;
    }

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM kegiatan ko ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get kegiatan list with pagination
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.target_output,
        ko.satuan_output,
        ko.anggaran_pagu,
        ko.status,
        ko.status_pengajuan,
        ko.tanggal_pengajuan,
        ko.tanggal_approval,
        ko.catatan_koordinator,
        ko.tanggal_approval_koordinator,
        ko.catatan_ppk,
        ko.tanggal_approval_ppk,
        ko.catatan_kepala,
        ko.tanggal_approval_kepala,
        ko.created_at,
        t.nama as tim_nama,
        u.username as created_by_nama,
        u.nama_lengkap as pelaksana_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        koordinator.nama_lengkap as approved_by_koordinator_nama,
        ppk.nama_lengkap as approved_by_ppk_nama,
        kepala.nama_lengkap as approved_by_kepala_nama
      FROM kegiatan ko
      JOIN tim t ON ko.tim_id = t.id
      JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users koordinator ON ko.approved_by_koordinator = koordinator.id
      LEFT JOIN users ppk ON ko.approved_by_ppk = ppk.id
      LEFT JOIN users kepala ON ko.approved_by_kepala = kepala.id
      ${whereClause}
      ORDER BY 
        CASE ko.status_pengajuan 
          WHEN 'review_kepala' THEN 1 
          WHEN 'disetujui' THEN 2 
          WHEN 'ditolak' THEN 3 
          ELSE 4 
        END,
        ko.tanggal_pengajuan DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Enrich kegiatan with mitra data
    const kegiatanWithMitra = await Promise.all(
      kegiatan.map(async (kg) => {
        const mitraList = await getMitraForKegiatan(kg.id);
        return {
          ...kg,
          mitra_list: mitraList,
          total_mitra: mitraList.length,
          // Also set legacy mitra fields if available
          mitra_nama: mitraList.length > 0 ? mitraList[0].nama : null,
          mitra_posisi: mitraList.length > 0 ? mitraList[0].posisi : null,
          mitra_alamat: mitraList.length > 0 ? mitraList[0].alamat : null,
          mitra_no_telp: mitraList.length > 0 ? mitraList[0].no_telp : null,
          mitra_sobat_id: mitraList.length > 0 ? mitraList[0].sobat_id : null,
        };
      })
    );

    // Get counts by status for summary (only statuses relevant to Kepala)
    // Hanya hitung yang sudah melewati PPK (approved_by_ppk IS NOT NULL)
    const [statusCounts] = await pool.query<RowDataPacket[]>(
      `SELECT 
        CASE 
          WHEN status_pengajuan = 'review_kepala' THEN 'review_kepala'
          WHEN status_pengajuan = 'disetujui' AND approved_by_kepala IS NOT NULL THEN 'disetujui'
          WHEN status_pengajuan = 'ditolak' AND approved_by_ppk IS NOT NULL AND tanggal_approval_kepala IS NOT NULL THEN 'ditolak'
          ELSE 'other'
        END as status_group,
        COUNT(*) as count
       FROM kegiatan 
       WHERE approved_by_ppk IS NOT NULL
         AND (status_pengajuan = 'review_kepala' 
              OR (status_pengajuan = 'disetujui' AND approved_by_kepala IS NOT NULL)
              OR (status_pengajuan = 'ditolak' AND tanggal_approval_kepala IS NOT NULL))
       GROUP BY status_group`
    );

    const summary = {
      review_kepala: 0,
      disetujui: 0,
      ditolak: 0,
    };

    statusCounts.forEach((row) => {
      if (row.status_group in summary) {
        summary[row.status_group as keyof typeof summary] = row.count;
      }
    });

    return NextResponse.json({
      data: kegiatanWithMitra,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    console.error('Error fetching approval list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
