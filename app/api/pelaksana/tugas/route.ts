import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pt.id,
        pt.kegiatan_id,
        pt.status,
        pt.prioritas,
        pt.deadline,
        pt.tanggal_mulai,
        pt.tanggal_selesai,
        pt.catatan,
        k.kode as kode_kegiatan,
        k.nama as nama_kegiatan
      FROM penugasan_tim pt
      JOIN kegiatan k ON pt.kegiatan_id = k.id
      WHERE pt.user_id = ?
      ORDER BY 
        CASE pt.status 
          WHEN 'berjalan' THEN 1 
          WHEN 'belum' THEN 2 
          WHEN 'selesai' THEN 3 
        END,
        CASE pt.prioritas 
          WHEN 'tinggi' THEN 1 
          WHEN 'sedang' THEN 2 
          WHEN 'rendah' THEN 3 
        END,
        pt.deadline ASC`,
      [auth.id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching tugas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const { id, status } = await request.json();

    // Verify the task belongs to this user
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM penugasan_tim WHERE id = ? AND user_id = ?',
      [id, auth.id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };
    
    if (status === 'berjalan') {
      updateData.tanggal_mulai = new Date();
    } else if (status === 'selesai') {
      updateData.tanggal_selesai = new Date();
    }

    const fields = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updateData);

    await pool.query(
      `UPDATE penugasan_tim SET ${fields} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
