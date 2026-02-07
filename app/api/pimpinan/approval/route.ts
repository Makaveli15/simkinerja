import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
      whereClause += ` AND ko.status_pengajuan = 'disetujui'`;
    } else if (status === 'ditolak') {
      whereClause += ` AND ko.status_pengajuan = 'ditolak'`;
    } else if (status === 'all') {
      // Show all that have reached or passed kepala review stage
      whereClause += ` AND ko.status_pengajuan IN ('review_kepala', 'disetujui', 'ditolak')`;
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

    // Get counts by status for summary (only statuses relevant to Kepala)
    const [statusCounts] = await pool.query<RowDataPacket[]>(
      `SELECT 
        status_pengajuan,
        COUNT(*) as count
       FROM kegiatan 
       WHERE status_pengajuan IN ('review_kepala', 'disetujui', 'ditolak')
       GROUP BY status_pengajuan`
    );

    const summary = {
      review_kepala: 0,
      disetujui: 0,
      ditolak: 0,
    };

    statusCounts.forEach((row) => {
      if (row.status_pengajuan in summary) {
        summary[row.status_pengajuan as keyof typeof summary] = row.count;
      }
    });

    return NextResponse.json({
      data: kegiatan,
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
