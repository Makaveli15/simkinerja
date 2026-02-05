import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get list of kegiatan pending approval
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
    const status = searchParams.get('status') || 'diajukan'; // default to pending
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build WHERE clause based on status filter
    let whereClause = 'WHERE 1=1';
    const queryParams: (string | number)[] = [];

    if (status === 'diajukan') {
      whereClause += ` AND k.status_pengajuan = 'diajukan'`;
    } else if (status === 'disetujui') {
      whereClause += ` AND k.status_pengajuan = 'disetujui'`;
    } else if (status === 'ditolak') {
      whereClause += ` AND k.status_pengajuan = 'ditolak'`;
    } else if (status === 'all') {
      whereClause += ` AND k.status_pengajuan IN ('diajukan', 'disetujui', 'ditolak')`;
    }

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM kegiatan k ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get kegiatan list with pagination
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT 
        k.id,
        k.nama,
        k.deskripsi,
        k.tanggal_mulai,
        k.tanggal_selesai,
        k.target_output,
        k.satuan_output,
        k.anggaran_pagu,
        k.status,
        k.status_pengajuan,
        k.tanggal_pengajuan,
        k.tanggal_approval,
        k.catatan_approval,
        k.created_at,
        t.nama as tim_nama,
        u.username as created_by_nama,
        u.nama_lengkap as pelaksana_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        m.id as mitra_id,
        m.nama as mitra_nama,
        m.posisi as mitra_posisi,
        m.alamat as mitra_alamat,
        m.no_telp as mitra_no_telp,
        m.sobat_id as mitra_sobat_id,
        approver.nama_lengkap as approved_by_nama
      FROM kegiatan k
      JOIN tim t ON k.tim_id = t.id
      JOIN users u ON k.created_by = u.id
      LEFT JOIN kro ON k.kro_id = kro.id
      LEFT JOIN mitra m ON k.mitra_id = m.id
      LEFT JOIN users approver ON k.approved_by = approver.id
      ${whereClause}
      ORDER BY 
        CASE k.status_pengajuan 
          WHEN 'diajukan' THEN 1 
          WHEN 'disetujui' THEN 2 
          WHEN 'ditolak' THEN 3 
          ELSE 4 
        END,
        k.tanggal_pengajuan DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get counts by status for summary
    const [statusCounts] = await pool.query<RowDataPacket[]>(
      `SELECT 
        status_pengajuan,
        COUNT(*) as count
       FROM kegiatan 
       WHERE status_pengajuan IN ('diajukan', 'disetujui', 'ditolak')
       GROUP BY status_pengajuan`
    );

    const summary = {
      diajukan: 0,
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
