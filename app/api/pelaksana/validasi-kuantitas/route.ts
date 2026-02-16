import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET - Ambil data validasi kuantitas untuk kegiatan tertentu
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

    if (!payload || !['pelaksana', 'pimpinan', 'koordinator', 'admin', 'kesubag', 'ppk'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatan_id');

    if (!kegiatanId) {
      return NextResponse.json({ error: 'kegiatan_id diperlukan' }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT vk.*, 
              u_koordinator.nama_lengkap as nama_koordinator,
              u_pimpinan.nama_lengkap as nama_pimpinan
       FROM validasi_kuantitas vk
       LEFT JOIN users u_koordinator ON vk.koordinator_id = u_koordinator.id
       LEFT JOIN users u_pimpinan ON vk.pimpinan_id = u_pimpinan.id
       WHERE vk.kegiatan_id = ?
       ORDER BY vk.created_at DESC`,
      [kegiatanId]
    );

    return NextResponse.json({ validasi: rows });
  } catch (error) {
    console.error('Error fetching validasi kuantitas:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Buat validasi kuantitas baru dengan bukti dukung
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      // Decode URL-encoded cookie value
      const decodedValue = decodeURIComponent(authCookie.value);
      payload = JSON.parse(decodedValue);
    } catch {
      return NextResponse.json({ error: 'Invalid auth cookie' }, { status: 401 });
    }

    if (!payload || payload.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Hanya pelaksana yang dapat membuat catatan kuantitas' }, { status: 403 });
    }

    // Handle FormData
    const formData = await request.formData();
    const kegiatan_id = formData.get('kegiatan_id');
    const jumlah_output = formData.get('jumlah_output');
    const keterangan = formData.get('keterangan');
    const bukti_file = formData.get('bukti_file') as File | null;

    console.log('POST validasi-kuantitas:', { kegiatan_id, jumlah_output, keterangan, user_id: payload.id, has_file: !!bukti_file });

    if (!kegiatan_id || jumlah_output === undefined || jumlah_output === null) {
      return NextResponse.json({ error: 'kegiatan_id dan jumlah_output diperlukan' }, { status: 400 });
    }

    const jumlahOutputNum = parseFloat(jumlah_output as string);
    if (isNaN(jumlahOutputNum) || jumlahOutputNum <= 0) {
      return NextResponse.json({ error: 'jumlah_output harus lebih dari 0' }, { status: 400 });
    }

    // Verifikasi kegiatan ada dan user memiliki akses (berdasarkan created_by ATAU tim_id sama)
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [payload.id]
    );
    const userTimId = userRows.length > 0 ? userRows[0].tim_id : null;

    const [kegiatanRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, created_by, tim_id 
       FROM kegiatan
       WHERE id = ? AND (created_by = ? OR tim_id = ?)`,
      [kegiatan_id, payload.id, userTimId]
    );

    console.log('Kegiatan rows found:', kegiatanRows.length, 'userTimId:', userTimId);

    if (kegiatanRows.length === 0) {
      // Get kegiatan info for debugging
      const [kegiatanInfo] = await pool.query<RowDataPacket[]>(
        'SELECT id, created_by FROM kegiatan WHERE id = ?',
        [kegiatan_id]
      );
      console.log('Kegiatan info:', kegiatanInfo[0], 'User trying:', payload.id);
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan atau Anda tidak memiliki akses' }, { status: 403 });
    }

    // Upload bukti file jika ada
    let bukti_path: string | null = null;
    if (bukti_file && bukti_file.size > 0) {
      // Validasi ukuran file (max 10MB)
      if (bukti_file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 });
      }

      // Validasi tipe file
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'application/zip',
        'application/x-rar-compressed'
      ];
      
      if (!allowedTypes.includes(bukti_file.type)) {
        return NextResponse.json({ error: 'Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, ZIP, atau RAR' }, { status: 400 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = bukti_file.name.split('.').pop();
      const filename = `bukti_kuantitas_${kegiatan_id}_${timestamp}.${ext}`;
      
      // Simpan file
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bukti_kuantitas');
      await mkdir(uploadDir, { recursive: true });
      
      const bytes = await bukti_file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(path.join(uploadDir, filename), buffer);
      
      bukti_path = `/uploads/bukti_kuantitas/${filename}`;
    }

    // Insert validasi kuantitas baru dengan status draft
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO validasi_kuantitas (kegiatan_id, jumlah_output, bukti_path, keterangan, status, created_at)
       VALUES (?, ?, ?, ?, 'draft', NOW())`,
      [kegiatan_id, jumlahOutputNum, bukti_path, keterangan || null]
    );

    console.log('Insert successful, ID:', result.insertId);

    return NextResponse.json({ 
      success: true, 
      message: 'Output kuantitas berhasil dicatat',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating validasi kuantitas:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE - Hapus validasi kuantitas (hanya jika status draft)
export async function DELETE(request: NextRequest) {
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

    if (!payload || payload.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Hanya pelaksana yang dapat menghapus catatan kuantitas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });
    }

    // Verifikasi validasi ada, milik user, dan masih draft
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT vk.*, k.created_by
       FROM validasi_kuantitas vk
       JOIN kegiatan k ON vk.kegiatan_id = k.id
       WHERE vk.id = ? AND k.created_by = ?`,
      [id, payload.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Validasi tidak ditemukan atau Anda tidak memiliki akses' }, { status: 403 });
    }

    if (rows[0].status !== 'draft') {
      return NextResponse.json({ error: 'Hanya validasi dengan status draft yang dapat dihapus' }, { status: 400 });
    }

    await pool.query('DELETE FROM validasi_kuantitas WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Validasi kuantitas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting validasi kuantitas:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Update status validasi (minta validasi)
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

    if (!payload || payload.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Hanya pelaksana yang dapat mengajukan validasi' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });
    }

    // Verifikasi validasi ada dan milik user
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT vk.*, k.created_by
       FROM validasi_kuantitas vk
       JOIN kegiatan k ON vk.kegiatan_id = k.id
       WHERE vk.id = ? AND k.created_by = ?`,
      [id, payload.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Validasi tidak ditemukan atau Anda tidak memiliki akses' }, { status: 403 });
    }

    if (action === 'minta_validasi') {
      if (rows[0].status !== 'draft') {
        return NextResponse.json({ error: 'Hanya validasi dengan status draft yang dapat diajukan' }, { status: 400 });
      }

      await pool.query(
        'UPDATE validasi_kuantitas SET status = ?, updated_at = NOW() WHERE id = ?',
        ['menunggu', id]
      );

      return NextResponse.json({ success: true, message: 'Validasi berhasil diajukan' });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Error updating validasi kuantitas:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
