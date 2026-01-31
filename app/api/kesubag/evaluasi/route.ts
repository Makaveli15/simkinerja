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
        e.*,
        u.nama_lengkap as pemberi_nama,
        u.username as pemberi_username,
        u.role as pemberi_role,
        ko.nama as kegiatan_nama,
        ko.status as kegiatan_status,
        t.nama as tim_nama
      FROM evaluasi e
      JOIN users u ON e.user_id = u.id
      JOIN kegiatan ko ON e.kegiatan_id = ko.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE e.role_pemberi = 'kesubag'
    `;

    const queryParams: (string | number)[] = [];

    if (kegiatan_id) {
      query += ' AND e.kegiatan_id = ?';
      queryParams.push(kegiatan_id);
    }

    query += ' ORDER BY e.created_at DESC';

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
      'SELECT id, nama FROM kegiatan WHERE id = ?',
      [kegiatan_id]
    );

    if (kegiatanRows.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Insert evaluasi with role_pemberi = 'kesubag'
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO evaluasi (kegiatan_id, user_id, role_pemberi, jenis_evaluasi, isi) VALUES (?, ?, ?, ?, ?)',
      [kegiatan_id, payload.id, 'kesubag', jenis_evaluasi, isi.trim()]
    );

    // Get the created evaluasi
    const [newEvaluasi] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, u.nama_lengkap as pemberi_nama, ko.nama as kegiatan_nama
       FROM evaluasi e
       JOIN users u ON e.user_id = u.id
       JOIN kegiatan ko ON e.kegiatan_id = ko.id
       WHERE e.id = ?`,
      [result.insertId]
    );

    // Create notification for pelaksana team
    const jenisLabel = jenis_evaluasi === 'catatan' ? 'Catatan' : 
                       jenis_evaluasi === 'arahan' ? 'Arahan' : 'Rekomendasi';
    
    await createNotificationForKegiatanTeam(kegiatan_id, {
      title: `${jenisLabel} Baru dari Kesubag`,
      message: `Kesubag memberikan ${jenis_evaluasi} untuk kegiatan: ${kegiatanRows[0].nama}`,
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
