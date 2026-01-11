import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { createNotificationForAllPimpinan } from '@/lib/services/notificationService';

// GET - Get dokumen output for a kegiatan
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || !['pelaksana', 'pimpinan', 'admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    // Get dokumen with uploader info
    const [dokumen] = await pool.query<RowDataPacket[]>(`
      SELECT 
        d.*,
        u.nama_lengkap as uploaded_by_nama,
        u.username as uploaded_by_username,
        r.nama_lengkap as reviewed_by_nama
      FROM dokumen_output d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users r ON d.reviewed_by = r.id
      WHERE d.kegiatan_id = ?
      ORDER BY d.uploaded_at DESC
    `, [kegiatan_id]);

    return NextResponse.json({ dokumen });
  } catch (error) {
    console.error('Error fetching dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload dokumen output (pelaksana only)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden - Only pelaksana can upload' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const kegiatan_id = formData.get('kegiatan_id') as string;
    const tipe_dokumen = formData.get('tipe_dokumen') as string || 'draft';
    const deskripsi = formData.get('deskripsi') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipe file tidak diizinkan. Gunakan PDF, Word, Excel, PowerPoint, gambar, atau ZIP.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Ukuran file terlalu besar. Maksimal 10MB.' 
      }, { status: 400 });
    }

    // Verify kegiatan exists and belongs to user's assignments
    const [kegiatanCheck] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kegiatan_operasional WHERE id = ?',
      [kegiatan_id]
    );

    if (kegiatanCheck.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'dokumen-output');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const timestamp = Date.now();
    const uniqueFilename = `kegiatan_${kegiatan_id}_${timestamp}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    const publicPath = `/uploads/dokumen-output/${uniqueFilename}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Insert into database
    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO dokumen_output 
      (kegiatan_id, uploaded_by, nama_file, path_file, tipe_dokumen, tipe_file, ukuran_file, deskripsi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kegiatan_id,
      payload.id,
      file.name,
      publicPath,
      tipe_dokumen,
      file.type,
      file.size,
      deskripsi
    ]);

    // Get the created dokumen
    const [newDokumen] = await pool.query<RowDataPacket[]>(`
      SELECT d.*, u.nama_lengkap as uploaded_by_nama
      FROM dokumen_output d
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [result.insertId]);

    // Get kegiatan name for notification
    const [kegiatanInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama FROM kegiatan_operasional WHERE id = ?',
      [kegiatan_id]
    );
    const kegiatanNama = kegiatanInfo[0]?.nama || 'Kegiatan';

    // Get uploader name
    const [uploaderInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama_lengkap FROM users WHERE id = ?',
      [payload.id]
    );
    const uploaderNama = uploaderInfo[0]?.nama_lengkap || 'Pelaksana';

    // Create notification for all pimpinan
    await createNotificationForAllPimpinan({
      title: '📄 Permintaan Validasi Dokumen',
      message: `${uploaderNama} mengajukan dokumen "${file.name}" untuk kegiatan "${kegiatanNama}" yang perlu divalidasi`,
      type: 'permintaan_validasi',
      referenceId: parseInt(kegiatan_id),
      referenceType: 'kegiatan'
    });

    return NextResponse.json({
      message: 'Dokumen berhasil diupload',
      dokumen: newDokumen[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete dokumen (pelaksana only, own uploads)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dokumen_id = searchParams.get('id');

    if (!dokumen_id) {
      return NextResponse.json({ error: 'Dokumen ID is required' }, { status: 400 });
    }

    // Check if dokumen exists and belongs to user
    const [dokumenCheck] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM dokumen_output WHERE id = ? AND uploaded_by = ?',
      [dokumen_id, payload.id]
    );

    if (dokumenCheck.length === 0) {
      return NextResponse.json({ 
        error: 'Dokumen tidak ditemukan atau Anda tidak memiliki akses' 
      }, { status: 404 });
    }

    // Don't allow delete if already reviewed
    if (dokumenCheck[0].status_review !== 'pending') {
      return NextResponse.json({ 
        error: 'Tidak dapat menghapus dokumen yang sudah direview' 
      }, { status: 400 });
    }

    // Delete from database (file will remain for audit trail)
    await pool.query('DELETE FROM dokumen_output WHERE id = ?', [dokumen_id]);

    return NextResponse.json({ message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
