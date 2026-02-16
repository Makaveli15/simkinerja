import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// POST - Create new evaluasi from koordinator
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get koordinator's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ 
        error: 'Koordinator belum ditugaskan ke tim manapun' 
      }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

    const body = await req.json();
    const { kegiatan_id, jenis_evaluasi, isi } = body;

    // Validate required fields
    if (!kegiatan_id) {
      return NextResponse.json({ error: 'Kegiatan ID wajib diisi' }, { status: 400 });
    }

    if (!jenis_evaluasi || !['catatan', 'arahan', 'rekomendasi'].includes(jenis_evaluasi)) {
      return NextResponse.json({ 
        error: 'Jenis evaluasi tidak valid. Gunakan: catatan, arahan, atau rekomendasi' 
      }, { status: 400 });
    }

    if (!isi || isi.trim().length === 0) {
      return NextResponse.json({ error: 'Isi evaluasi wajib diisi' }, { status: 400 });
    }

    // Verify kegiatan exists and belongs to koordinator's tim
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nama, tim_id FROM kegiatan WHERE id = ? AND tim_id = ?',
      [kegiatan_id, timId]
    );

    if (kegiatanRows.length === 0) {
      return NextResponse.json({ 
        error: 'Kegiatan tidak ditemukan atau bukan bagian dari tim Anda' 
      }, { status: 404 });
    }

    // Insert evaluasi with role_pemberi = 'koordinator'
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO evaluasi (kegiatan_id, user_id, role_pemberi, jenis_evaluasi, isi) VALUES (?, ?, ?, ?, ?)',
      [kegiatan_id, payload.id, 'koordinator', jenis_evaluasi, isi.trim()]
    );

    // Get the newly created evaluasi
    const [newEvaluasi] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.*,
        COALESCE(u.nama_lengkap, u.username) as pemberi_nama,
        u.role as pemberi_role
      FROM evaluasi e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      message: 'Evaluasi berhasil ditambahkan',
      evaluasi: newEvaluasi[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
