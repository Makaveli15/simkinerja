import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear();
    const month = searchParams.get('month') || new Date().getMonth() + 1;

    // Get jadwal kegiatan for the month
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pt.id,
        pt.kegiatan_id,
        pt.status,
        pt.prioritas,
        pt.deadline as tanggal_selesai,
        pt.tanggal_mulai,
        k.kode as kode_kegiatan,
        k.nama as nama_kegiatan
      FROM penugasan_tim pt
      JOIN kegiatan k ON pt.kegiatan_id = k.id
      WHERE pt.user_id = ?
        AND (
          (YEAR(pt.tanggal_mulai) = ? AND MONTH(pt.tanggal_mulai) = ?)
          OR (YEAR(pt.deadline) = ? AND MONTH(pt.deadline) = ?)
          OR (pt.tanggal_mulai <= LAST_DAY(?) AND pt.deadline >= ?)
        )
      ORDER BY pt.tanggal_mulai ASC`,
      [
        auth.id, 
        year, month, 
        year, month,
        `${year}-${String(month).padStart(2, '0')}-01`,
        `${year}-${String(month).padStart(2, '0')}-01`
      ]
    );

    // Set default tanggal_mulai if null
    const jadwal = rows.map(r => ({
      ...r,
      tanggal_mulai: r.tanggal_mulai || r.tanggal_selesai,
    }));

    return NextResponse.json(jadwal);
  } catch (error) {
    console.error('Error fetching jadwal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
