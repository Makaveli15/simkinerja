import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get all evaluasi pimpinan (read-only)
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');
    const tim_id = searchParams.get('tim_id');
    const jenis = searchParams.get('jenis'); // catatan, arahan, rekomendasi

    let query = `
      SELECT 
        ep.*,
        u.nama_lengkap as pimpinan_nama,
        u.username as pimpinan_username,
        ko.nama as kegiatan_nama,
        ko.status as kegiatan_status,
        t.nama as tim_nama
      FROM evaluasi_pimpinan ep
      JOIN users u ON ep.user_id = u.id
      JOIN kegiatan_operasional ko ON ep.kegiatan_id = ko.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];

    if (kegiatan_id) {
      query += ' AND ep.kegiatan_id = ?';
      queryParams.push(kegiatan_id);
    }

    if (tim_id) {
      query += ' AND ko.tim_id = ?';
      queryParams.push(tim_id);
    }

    if (jenis) {
      query += ' AND ep.jenis_evaluasi = ?';
      queryParams.push(jenis);
    }

    query += ' ORDER BY ep.created_at DESC';

    const [evaluasi] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Get kegiatan list for filter
    const [kegiatanList] = await pool.query<RowDataPacket[]>(`
      SELECT ko.id, ko.nama, t.nama as tim_nama 
      FROM kegiatan_operasional ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      ORDER BY ko.nama
    `);

    // Get tim list for filter
    const [timList] = await pool.query<RowDataPacket[]>('SELECT id, nama FROM tim ORDER BY nama');

    // Summary statistics
    const [stats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        jenis_evaluasi,
        COUNT(*) as total
      FROM evaluasi_pimpinan
      GROUP BY jenis_evaluasi
    `);

    const summary = {
      total: evaluasi.length,
      catatan: stats.find((s: RowDataPacket) => s.jenis_evaluasi === 'catatan')?.total || 0,
      arahan: stats.find((s: RowDataPacket) => s.jenis_evaluasi === 'arahan')?.total || 0,
      rekomendasi: stats.find((s: RowDataPacket) => s.jenis_evaluasi === 'rekomendasi')?.total || 0
    };

    return NextResponse.json({
      evaluasi,
      filters: {
        kegiatan_list: kegiatanList,
        tim_list: timList
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching evaluasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new evaluasi (catatan/arahan/rekomendasi) - cannot be edited after saved
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Verify kegiatan exists
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kegiatan_operasional WHERE id = ?',
      [kegiatan_id]
    );

    if (kegiatanRows.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Insert evaluasi - cannot be edited after saved
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO evaluasi_pimpinan (kegiatan_id, user_id, jenis_evaluasi, isi) VALUES (?, ?, ?, ?)',
      [kegiatan_id, payload.id, jenis_evaluasi, isi.trim()]
    );

    // Get the created evaluasi
    const [newEvaluasi] = await pool.query<RowDataPacket[]>(
      `SELECT ep.*, u.nama_lengkap as pimpinan_nama, ko.nama as kegiatan_nama
       FROM evaluasi_pimpinan ep
       JOIN users u ON ep.user_id = u.id
       JOIN kegiatan_operasional ko ON ep.kegiatan_id = ko.id
       WHERE ep.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      message: 'Evaluasi berhasil disimpan',
      evaluasi: newEvaluasi[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Block PUT - evaluasi cannot be edited after saved
export async function PUT() {
  return NextResponse.json({ 
    error: 'Forbidden - Evaluasi pimpinan tidak dapat diubah setelah disimpan' 
  }, { status: 403 });
}

// Block DELETE - evaluasi cannot be deleted
export async function DELETE() {
  return NextResponse.json({ 
    error: 'Forbidden - Evaluasi pimpinan tidak dapat dihapus' 
  }, { status: 403 });
}
