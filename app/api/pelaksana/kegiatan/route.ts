import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Get kegiatan assigned to user or all kegiatan for laporan
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

    // Get kegiatan assigned to user
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT k.id, k.kode, k.nama
       FROM kegiatan k
       JOIN penugasan_tim pt ON k.id = pt.kegiatan_id
       WHERE pt.user_id = ?
       ORDER BY k.kode`,
      [auth.id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
