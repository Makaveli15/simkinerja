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
    
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pt.id,
        pt.user_id,
        pt.kegiatan_id,
        pt.status,
        pt.prioritas,
        pt.deadline,
        pt.catatan,
        pt.created_at,
        u.username,
        k.kode as kode_kegiatan,
        k.nama as nama_kegiatan
      FROM penugasan_tim pt
      JOIN users u ON pt.user_id = u.id
      JOIN kegiatan k ON pt.kegiatan_id = k.id
      ORDER BY pt.created_at DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching penugasan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id, kegiatan_id, prioritas, deadline, catatan } = await request.json();

    if (!user_id || !kegiatan_id || !deadline) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Check if already assigned
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM penugasan_tim WHERE user_id = ? AND kegiatan_id = ?',
      [user_id, kegiatan_id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Kegiatan sudah ditugaskan ke pelaksana ini' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO penugasan_tim (user_id, kegiatan_id, prioritas, deadline, catatan)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, kegiatan_id, prioritas || 'sedang', deadline, catatan || null]
    );

    return NextResponse.json({ message: 'Penugasan berhasil dibuat', id: result.insertId });
  } catch (error) {
    console.error('Error creating penugasan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
    }

    await pool.query('DELETE FROM penugasan_tim WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Penugasan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting penugasan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
