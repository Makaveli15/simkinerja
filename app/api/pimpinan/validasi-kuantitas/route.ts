import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Ambil data validasi kuantitas untuk pimpinan (yang sudah divalidasi koordinator)
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

    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Hanya pimpinan yang dapat mengakses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatan_id');
    const status = searchParams.get('status');
    const pendingOnly = searchParams.get('pending_only');

    let query = `
      SELECT vk.*, 
             k.nama as kegiatan_nama,
             k.satuan_output,
             k.target_output,
             u.nama_lengkap as pelaksana_nama,
             uk.nama_lengkap as koordinator_nama,
             t.nama as tim_nama
      FROM validasi_kuantitas vk
      JOIN kegiatan k ON vk.kegiatan_id = k.id
      LEFT JOIN users u ON k.created_by = u.id
      LEFT JOIN users uk ON vk.koordinator_id = uk.id
      LEFT JOIN tim t ON k.tim_id = t.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    // Jika pendingOnly, ambil yang sudah divalidasi koordinator tapi belum pimpinan
    if (pendingOnly === 'true') {
      query += ' AND vk.status_kesubag = ? AND vk.status_pimpinan = ?';
      params.push('valid', 'pending');
    }

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

// PUT - Pimpinan validasi kuantitas (approve/reject) - validasi final
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

    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Hanya pimpinan yang dapat memvalidasi' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, catatan } = body;

    if (!id || !status || !['valid', 'tidak_valid'].includes(status)) {
      return NextResponse.json({ error: 'id dan status (valid/tidak_valid) diperlukan' }, { status: 400 });
    }

    // Verify validasi exists
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM validasi_kuantitas WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Validasi tidak ditemukan' }, { status: 404 });
    }

    const validasi = rows[0];

    // Verify status sudah divalidasi koordinator
    if (validasi.status_kesubag !== 'valid') {
      return NextResponse.json({ error: 'Validasi belum disetujui oleh Koordinator' }, { status: 400 });
    }

    // Verify belum divalidasi pimpinan
    if (validasi.status_pimpinan !== 'pending') {
      return NextResponse.json({ error: 'Validasi sudah diproses oleh Pimpinan' }, { status: 400 });
    }

    if (status === 'valid') {
      // Approve -> status jadi disahkan
      await pool.query<ResultSetHeader>(`
        UPDATE validasi_kuantitas 
        SET status = 'disahkan',
            status_pimpinan = 'valid',
            pimpinan_id = ?,
            catatan_pimpinan = ?,
            feedback_pimpinan = ?,
            validated_pimpinan_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `, [payload.id, catatan || null, catatan || null, id]);

      return NextResponse.json({ 
        success: true, 
        message: 'Validasi kuantitas disahkan' 
      });
    } else {
      // Reject -> status jadi ditolak
      await pool.query<ResultSetHeader>(`
        UPDATE validasi_kuantitas 
        SET status = 'ditolak',
            status_pimpinan = 'tidak_valid',
            pimpinan_id = ?,
            catatan_pimpinan = ?,
            feedback_pimpinan = ?,
            validated_pimpinan_at = NOW(),
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
