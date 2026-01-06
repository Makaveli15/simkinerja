import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Verify kegiatan belongs to user's tim
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kegiatan_operasional WHERE id = ? AND tim_id = ?',
      [id, timId]
    );

    if (kegiatan.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { kendala_id, tanggal_tindak_lanjut, deskripsi, status } = body;

    if (!kendala_id || !tanggal_tindak_lanjut || !deskripsi) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Verify kendala belongs to this kegiatan
    const [kendala] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kendala_kegiatan WHERE id = ? AND kegiatan_operasional_id = ?',
      [kendala_id, id]
    );

    if (kendala.length === 0) {
      return NextResponse.json({ error: 'Kendala tidak ditemukan' }, { status: 404 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tindak_lanjut (kendala_id, tanggal_tindak_lanjut, deskripsi, status)
       VALUES (?, ?, ?, ?)`,
      [kendala_id, tanggal_tindak_lanjut, deskripsi, status || 'pending']
    );

    // If tindak lanjut is done, update kendala status to resolved
    if (status === 'done') {
      await pool.query(
        `UPDATE kendala_kegiatan SET status = 'resolved' WHERE id = ?`,
        [kendala_id]
      );
    }

    return NextResponse.json({ 
      message: 'Tindak lanjut berhasil ditambahkan',
      id: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding tindak lanjut:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
