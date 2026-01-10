import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Get evaluasi pimpinan untuk kegiatan pelaksana (read-only)
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'User not in any team' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Verify that the kegiatan belongs to the user's tim or created by user
    const [kegiatanCheck] = await pool.query<RowDataPacket[]>(`
      SELECT ko.id 
      FROM kegiatan_operasional ko
      WHERE ko.id = ? AND (ko.tim_id = ? OR ko.created_by = ?)
    `, [kegiatan_id, timId, payload.id]);

    if (kegiatanCheck.length === 0) {
      return NextResponse.json({ error: 'Kegiatan not found or not accessible' }, { status: 404 });
    }

    // Get evaluasi for this kegiatan
    const [evaluasi] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ep.id,
        ep.kegiatan_id,
        ep.jenis_evaluasi,
        ep.isi,
        ep.created_at,
        u.nama_lengkap as pimpinan_nama
      FROM evaluasi_pimpinan ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.kegiatan_id = ?
      ORDER BY ep.created_at DESC
    `, [kegiatan_id]);

    return NextResponse.json({
      evaluasi,
      summary: {
        total: evaluasi.length,
        catatan: evaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'catatan').length,
        arahan: evaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'arahan').length,
        rekomendasi: evaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'rekomendasi').length
      }
    });
  } catch (error) {
    console.error('Error fetching evaluasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
