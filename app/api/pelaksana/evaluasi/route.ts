import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Get evaluasi (pimpinan & kesubag) untuk kegiatan pelaksana (read-only)
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
      FROM kegiatan ko
      WHERE ko.id = ? AND (ko.tim_id = ? OR ko.created_by = ?)
    `, [kegiatan_id, timId, payload.id]);

    if (kegiatanCheck.length === 0) {
      return NextResponse.json({ error: 'Kegiatan not found or not accessible' }, { status: 404 });
    }

    // Get ALL evaluasi (pimpinan & kesubag) for this kegiatan
    const [evaluasi] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.id,
        e.kegiatan_id,
        e.role_pemberi,
        e.jenis_evaluasi,
        e.isi,
        e.created_at,
        COALESCE(u.nama_lengkap, u.username) as pemberi_nama,
        u.username as pemberi_username,
        u.role as pemberi_role
      FROM evaluasi e
      JOIN users u ON e.user_id = u.id
      WHERE e.kegiatan_id = ?
      ORDER BY e.created_at DESC
    `, [kegiatan_id]);

    // Separate by role for summary
    const pimpinanEvaluasi = evaluasi.filter((e: RowDataPacket) => e.role_pemberi === 'pimpinan');
    const kesubagEvaluasi = evaluasi.filter((e: RowDataPacket) => e.role_pemberi === 'kesubag');

    return NextResponse.json({
      evaluasi,
      summary: {
        total: evaluasi.length,
        pimpinan: {
          total: pimpinanEvaluasi.length,
          catatan: pimpinanEvaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'catatan').length,
          arahan: pimpinanEvaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'arahan').length,
          rekomendasi: pimpinanEvaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'rekomendasi').length
        },
        kesubag: {
          total: kesubagEvaluasi.length,
          catatan: kesubagEvaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'catatan').length,
          arahan: kesubagEvaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'arahan').length,
          rekomendasi: kesubagEvaluasi.filter((e: RowDataPacket) => e.jenis_evaluasi === 'rekomendasi').length
        },
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
