import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotificationForKegiatanTeam } from '@/lib/services/notificationService';

// GET - Get all evaluasi kesubag
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    let query = `
      SELECT 
        ek.*,
        u.nama_lengkap as kesubag_nama,
        u.username as kesubag_username,
        ko.nama as kegiatan_nama,
        ko.status as kegiatan_status,
        t.nama as tim_nama
      FROM evaluasi_kesubag ek
      JOIN users u ON ek.user_id = u.id
      JOIN kegiatan_operasional ko ON ek.kegiatan_id = ko.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];

    if (kegiatan_id) {
      query += ' AND ek.kegiatan_id = ?';
      queryParams.push(kegiatan_id);
    }

    query += ' ORDER BY ek.created_at DESC';

    const [evaluasi] = await pool.query<RowDataPacket[]>(query, queryParams);

    return NextResponse.json({ evaluasi });
  } catch (error) {
    console.error('Error fetching evaluasi kesubag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new evaluasi kesubag
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'kesubag') {
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

    // Check if table exists, if not create it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS evaluasi_kesubag (
          id INT AUTO_INCREMENT PRIMARY KEY,
          kegiatan_id INT NOT NULL,
          user_id INT NOT NULL,
          jenis_evaluasi ENUM('catatan', 'arahan', 'rekomendasi') NOT NULL,
          isi TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (kegiatan_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    } catch {
      // Table might already exist, ignore
    }

    // Insert evaluasi
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO evaluasi_kesubag (kegiatan_id, user_id, jenis_evaluasi, isi) VALUES (?, ?, ?, ?)',
      [kegiatan_id, payload.id, jenis_evaluasi, isi.trim()]
    );

    // Get the created evaluasi
    const [newEvaluasi] = await pool.query<RowDataPacket[]>(
      `SELECT ek.*, u.nama_lengkap as kesubag_nama, ko.nama as kegiatan_nama
       FROM evaluasi_kesubag ek
       JOIN users u ON ek.user_id = u.id
       JOIN kegiatan_operasional ko ON ek.kegiatan_id = ko.id
       WHERE ek.id = ?`,
      [result.insertId]
    );

    // Create notification for pelaksana team
    const jenisLabel = jenis_evaluasi === 'catatan' ? 'Catatan' : 
                       jenis_evaluasi === 'arahan' ? 'Arahan' : 'Rekomendasi';
    
    await createNotificationForKegiatanTeam(kegiatan_id, {
      title: `${jenisLabel} Baru dari Kesubag`,
      message: `Kesubag memberikan ${jenis_evaluasi} untuk kegiatan: ${newEvaluasi[0].kegiatan_nama}`,
      type: 'evaluasi',
      referenceId: kegiatan_id,
      referenceType: 'kegiatan'
    });

    return NextResponse.json({
      message: 'Evaluasi berhasil disimpan',
      evaluasi: newEvaluasi[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluasi kesubag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Block PUT - evaluasi cannot be edited after saved
export async function PUT() {
  return NextResponse.json({ 
    error: 'Forbidden - Evaluasi kesubag tidak dapat diubah setelah disimpan' 
  }, { status: 403 });
}

// Block DELETE - evaluasi cannot be deleted
export async function DELETE() {
  return NextResponse.json({ 
    error: 'Forbidden - Evaluasi kesubag tidak dapat dihapus' 
  }, { status: 403 });
}
