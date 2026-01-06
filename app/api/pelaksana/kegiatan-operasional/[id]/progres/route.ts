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
    const { tanggal_update, capaian_output, ketepatan_waktu, kualitas_output, keterangan } = body;

    if (!tanggal_update || capaian_output === undefined || ketepatan_waktu === undefined || kualitas_output === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO progres_kegiatan (kegiatan_operasional_id, tanggal_update, capaian_output, ketepatan_waktu, kualitas_output, keterangan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tanggal_update, capaian_output, ketepatan_waktu, kualitas_output, keterangan || null]
    );

    return NextResponse.json({ 
      message: 'Progres berhasil ditambahkan',
      id: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding progres:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
