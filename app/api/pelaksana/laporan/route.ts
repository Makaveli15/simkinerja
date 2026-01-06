import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface AuthData {
  id: number;
  role: string;
  tim_id?: number;
}

async function getAuthFromCookie(): Promise<AuthData | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  
  if (!authCookie) return null;
  
  try {
    const auth = JSON.parse(authCookie.value) as AuthData;
    return auth;
  } catch {
    return null;
  }
}

// GET - List laporan
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun') || new Date().getFullYear().toString();

    const [laporan] = await pool.query<RowDataPacket[]>(
      `SELECT id, judul, periode_bulan, periode_tahun, file_path, file_name, keterangan, created_at
       FROM upload_laporan
       WHERE user_id = ? AND periode_tahun = ?
       ORDER BY periode_bulan DESC, created_at DESC`,
      [auth.id, tahun]
    );

    return NextResponse.json(laporan);
  } catch (error) {
    console.error('Error fetching laporan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload laporan
export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const judul = formData.get('judul') as string;
    const periode_bulan = formData.get('periode_bulan') as string;
    const periode_tahun = formData.get('periode_tahun') as string;
    const keterangan = formData.get('keterangan') as string;

    if (!file || !judul || !periode_bulan || !periode_tahun) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'laporan');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const timestamp = Date.now();
    const uniqueFilename = `laporan_${auth.id}_${timestamp}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const publicPath = `/uploads/laporan/${uniqueFilename}`;
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO upload_laporan (user_id, judul, periode_bulan, periode_tahun, file_path, file_name, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [auth.id, judul, periode_bulan, periode_tahun, publicPath, file.name, keterangan || null]
    );

    return NextResponse.json({ 
      message: 'Laporan berhasil diupload',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error uploading laporan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete laporan
export async function DELETE(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
    }

    // Get file path before deleting
    const [laporan] = await pool.query<RowDataPacket[]>(
      'SELECT file_path FROM upload_laporan WHERE id = ? AND user_id = ?',
      [id, auth.id]
    );

    if (laporan.length === 0) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    // Delete from database
    await pool.query('DELETE FROM upload_laporan WHERE id = ? AND user_id = ?', [id, auth.id]);

    // Delete file from storage
    const filePath = path.join(process.cwd(), 'public', laporan[0].file_path);
    try {
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    return NextResponse.json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting laporan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
