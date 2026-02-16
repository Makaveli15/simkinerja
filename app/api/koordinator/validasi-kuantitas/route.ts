import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Ambil data validasi kuantitas untuk kegiatan di tim koordinator
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      const decodedValue = decodeURIComponent(authCookie.value);
      payload = JSON.parse(decodedValue);
    } catch {
      return NextResponse.json({ error: 'Invalid auth cookie' }, { status: 401 });
    }

    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Hanya koordinator yang dapat mengakses' }, { status: 403 });
    }

    // Get koordinator's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Koordinator belum ditugaskan ke tim' }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatan_id');
    const status = searchParams.get('status');

    let query = `
      SELECT vk.*, 
             k.nama as kegiatan_nama,
             k.satuan_output,
             k.target_output,
             u.nama_lengkap as pelaksana_nama
      FROM validasi_kuantitas vk
      JOIN kegiatan k ON vk.kegiatan_id = k.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.tim_id = ?
    `;
    const params: (string | number)[] = [timId];

    if (kegiatanId) {
      query += ' AND vk.kegiatan_id = ?';
      params.push(kegiatanId);
    }

    if (status) {
      query += ' AND vk.status = ?';
      params.push(status);
    }

    query += ' ORDER BY vk.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({ validasi: rows });
  } catch (error) {
    console.error('Error fetching validasi kuantitas:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Koordinator validasi kuantitas (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      const decodedValue = decodeURIComponent(authCookie.value);
      payload = JSON.parse(decodedValue);
    } catch {
      return NextResponse.json({ error: 'Invalid auth cookie' }, { status: 401 });
    }

    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Hanya koordinator yang dapat memvalidasi' }, { status: 403 });
    }

    // Get koordinator's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id, nama_lengkap FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Koordinator belum ditugaskan ke tim' }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

    const body = await request.json();
    const { id, status, catatan } = body;

    if (!id || !status || !['valid', 'tidak_valid'].includes(status)) {
      return NextResponse.json({ error: 'id dan status (valid/tidak_valid) diperlukan' }, { status: 400 });
    }

    // Verify validasi exists and belongs to tim koordinator
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT vk.*, k.tim_id
      FROM validasi_kuantitas vk
      JOIN kegiatan k ON vk.kegiatan_id = k.id
      WHERE vk.id = ? AND k.tim_id = ?
    `, [id, timId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Validasi tidak ditemukan atau bukan bagian dari tim Anda' }, { status: 404 });
    }

    const validasi = rows[0];

    // Verify status is menunggu (submitted by pelaksana)
    if (validasi.status !== 'menunggu') {
      return NextResponse.json({ error: 'Validasi tidak dalam status menunggu' }, { status: 400 });
    }

    if (status === 'valid') {
      // Approve -> status_kesubag jadi valid, status tetap menunggu untuk pimpinan
      // Pimpinan akan melihat data dengan status_kesubag = 'valid'
      await pool.query<ResultSetHeader>(`
        UPDATE validasi_kuantitas 
        SET status_kesubag = 'valid',
            koordinator_id = ?,
            catatan_koordinator = ?,
            feedback_kesubag = ?,
            validated_kesubag_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `, [payload.id, catatan || null, catatan || null, id]);

      return NextResponse.json({ 
        success: true, 
        message: 'Validasi kuantitas disetujui, menunggu validasi Pimpinan' 
      });
    } else {
      // Reject -> status jadi ditolak
      await pool.query<ResultSetHeader>(`
        UPDATE validasi_kuantitas 
        SET status = 'ditolak',
            status_kesubag = 'tidak_valid',
            koordinator_id = ?,
            catatan_koordinator = ?,
            feedback_kesubag = ?,
            validated_kesubag_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `, [payload.id, catatan || null, catatan || null, id]);

      return NextResponse.json({ 
        success: true, 
        message: 'Validasi kuantitas ditolak' 
      });
    }
  } catch (error) {
    console.error('Error updating validasi kuantitas:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
