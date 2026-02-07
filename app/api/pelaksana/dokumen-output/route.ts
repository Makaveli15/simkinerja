import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { createNotificationForAllPimpinan, createNotificationForAllKoordinator, createNotification } from '@/lib/services/notificationService';

// GET - Get dokumen output for a kegiatan
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || !['pelaksana', 'pimpinan', 'admin', 'kesubag'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    // Get dokumen with uploader info and validation status
    // Compatible with both old and new schema
    const [dokumen] = await pool.query<RowDataPacket[]>(`
      SELECT 
        d.*,
        u.nama_lengkap as uploaded_by_nama,
        u.username as uploaded_by_username
      FROM dokumen_output d
      JOIN users u ON d.uploaded_by = u.id
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
      'SELECT id FROM kegiatan WHERE id = ?',
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
    // Alur validasi:
    // - Draft: Otomatis masuk ke kesubag untuk review (draft_status_kesubag = 'pending', status_final = 'menunggu_kesubag')
    // - Final: Belum masuk validasi sampai pelaksana klik "Minta Validasi" (status_final = 'draft')
    const isDraft = tipe_dokumen === 'draft';
    
    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO dokumen_output 
      (kegiatan_id, uploaded_by, nama_file, path_file, tipe_dokumen, tipe_file, ukuran_file, deskripsi, draft_status_kesubag, status_final)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kegiatan_id,
      payload.id,
      file.name,
      publicPath,
      tipe_dokumen,
      file.type,
      file.size,
      deskripsi,
      isDraft ? 'pending' : null,  // Draft: pending untuk kesubag, Final: null
      isDraft ? 'menunggu_kesubag' : 'draft'  // Draft: langsung masuk kesubag, Final: tunggu minta validasi
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
      'SELECT nama FROM kegiatan WHERE id = ?',
      [kegiatan_id]
    );
    const kegiatanNama = kegiatanInfo[0]?.nama || 'Kegiatan';

    // Get uploader name
    const [uploaderInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama_lengkap FROM users WHERE id = ?',
      [payload.id]
    );
    const uploaderNama = uploaderInfo[0]?.nama_lengkap || 'Pelaksana';

    // Notifikasi berdasarkan tipe dokumen:
    // - Draft: Notifikasi ke koordinator untuk review
    // - Final: Hanya notifikasi upload, validasi setelah pelaksana klik "Minta Validasi"
    if (isDraft) {
      // Draft otomatis masuk ke koordinator untuk review
      await createNotificationForAllKoordinator({
        title: '📝 Draft Dokumen Baru',
        message: `${uploaderNama} mengupload draft "${file.name}" untuk kegiatan "${kegiatanNama}". Silakan review.`,
        type: 'permintaan_validasi',
        referenceId: parseInt(kegiatan_id),
        referenceType: 'kegiatan'
      });
    } else {
      // Final: Hanya info, validasi setelah minta validasi
      await createNotificationForAllKoordinator({
        title: '📄 Dokumen Final Diupload',
        message: `${uploaderNama} mengupload dokumen final "${file.name}" untuk kegiatan "${kegiatanNama}". Menunggu permintaan validasi dari pelaksana.`,
        type: 'kegiatan',
        referenceId: parseInt(kegiatan_id),
        referenceType: 'kegiatan'
      });
    }

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

    const dokumen = dokumenCheck[0];

    // Cek berdasarkan tipe dokumen
    if (dokumen.tipe_dokumen === 'draft') {
      // Untuk draft: cek apakah sudah direview oleh kesubag
      if (dokumen.draft_status_kesubag && dokumen.draft_status_kesubag !== 'pending') {
        return NextResponse.json({ 
          error: 'Tidak dapat menghapus draft yang sudah direview oleh kesubag' 
        }, { status: 400 });
      }
    } else {
      // Untuk final: cek apakah sudah diminta validasi atau sudah diproses
      if (dokumen.minta_validasi === 1) {
        return NextResponse.json({ 
          error: 'Tidak dapat menghapus dokumen yang sudah diminta validasi' 
        }, { status: 400 });
      }
      
      // Cek status final - jika sudah diproses, tidak boleh dihapus
      if (dokumen.status_final && dokumen.status_final !== 'draft') {
        return NextResponse.json({ 
          error: 'Tidak dapat menghapus dokumen yang sudah dalam proses validasi' 
        }, { status: 400 });
      }
    }

    // Try to delete the physical file
    try {
      const filePath = path.join(process.cwd(), 'public', dokumen.path_file);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await pool.query('DELETE FROM dokumen_output WHERE id = ?', [dokumen_id]);

    return NextResponse.json({ message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Request validation for final document (pelaksana only)
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { dokumenId, action } = body;

    if (!dokumenId) {
      return NextResponse.json({ error: 'dokumenId is required' }, { status: 400 });
    }

    // Check if dokumen exists and belongs to user
    const [dokumenCheck] = await pool.query<RowDataPacket[]>(
      'SELECT d.*, ko.nama as kegiatan_nama FROM dokumen_output d LEFT JOIN kegiatan ko ON d.kegiatan_id = ko.id WHERE d.id = ? AND d.uploaded_by = ?',
      [dokumenId, payload.id]
    );

    if (dokumenCheck.length === 0) {
      return NextResponse.json({ 
        error: 'Dokumen tidak ditemukan atau Anda tidak memiliki akses' 
      }, { status: 404 });
    }

    const dokumen = dokumenCheck[0];

    if (action === 'minta_validasi') {
      // Only final documents can request validation
      if (dokumen.tipe_dokumen !== 'final') {
        return NextResponse.json({ 
          error: 'Hanya dokumen final yang dapat diminta validasi' 
        }, { status: 400 });
      }

      // Check if already requested
      if (dokumen.minta_validasi === 1) {
        return NextResponse.json({ 
          error: 'Dokumen sudah dalam proses validasi' 
        }, { status: 400 });
      }

      // Update minta_validasi flag with correct column names
      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET minta_validasi = 1, 
            minta_validasi_at = NOW(),
            validasi_kesubag = 'pending', 
            validasi_pimpinan = 'pending',
            status_final = 'menunggu_kesubag'
        WHERE id = ?
      `, [dokumenId]);

      // Update kegiatan status_verifikasi to menunggu
      await pool.query(
        'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
        ['menunggu', dokumen.kegiatan_id]
      );

      // Notify koordinator
      const [koordinatorRows] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE role = 'koordinator' AND status = 'aktif'"
      );
      
      for (const koordinator of koordinatorRows) {
        await createNotification({
          userId: koordinator.id,
          title: '📄 Permintaan Validasi Dokumen',
          message: `${payload.nama_lengkap || 'Pelaksana'} mengajukan dokumen "${dokumen.nama_file}" untuk kegiatan "${dokumen.kegiatan_nama}" untuk divalidasi.`,
          type: 'permintaan_validasi',
          referenceId: dokumen.kegiatan_id,
          referenceType: 'dokumen'
        });
      }

      return NextResponse.json({ 
        success: true,
        message: 'Permintaan validasi berhasil dikirim ke Koordinator' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error requesting validation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
