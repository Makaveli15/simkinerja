import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SatuanOutput extends RowDataPacket {
  id: number;
  nama: string;
  deskripsi: string;
  jenis_validasi: 'dokumen' | 'kuantitas';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

async function getAuth(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  if (!authCookie) return null;
  try {
    return JSON.parse(decodeURIComponent(authCookie)) as AuthUser;
  } catch {
    return null;
  }
}

// GET - Fetch all satuan output (dapat diakses oleh semua role untuk dropdown)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = 'SELECT * FROM satuan_output';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY nama ASC';

    const [rows] = await pool.query<SatuanOutput[]>(query);

    return NextResponse.json({ satuan: rows });
  } catch (error) {
    console.error('Error fetching satuan output:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new satuan output (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { nama, deskripsi, jenis_validasi } = body;

    if (!nama || nama.trim() === '') {
      return NextResponse.json({ error: 'Nama satuan output harus diisi' }, { status: 400 });
    }

    // Check if nama already exists
    const [existing] = await pool.query<SatuanOutput[]>(
      'SELECT id FROM satuan_output WHERE nama = ?',
      [nama.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Satuan output dengan nama tersebut sudah ada' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO satuan_output (nama, deskripsi, jenis_validasi) VALUES (?, ?, ?)',
      [nama.trim(), deskripsi?.trim() || null, jenis_validasi || 'kuantitas']
    );

    return NextResponse.json({ 
      message: 'Satuan output berhasil ditambahkan',
      id: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating satuan output:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update satuan output (admin only)
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nama, deskripsi, jenis_validasi, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID satuan output harus diisi' }, { status: 400 });
    }

    if (!nama || nama.trim() === '') {
      return NextResponse.json({ error: 'Nama satuan output harus diisi' }, { status: 400 });
    }

    // Check if nama already exists (excluding current id)
    const [existing] = await pool.query<SatuanOutput[]>(
      'SELECT id FROM satuan_output WHERE nama = ? AND id != ?',
      [nama.trim(), id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Satuan output dengan nama tersebut sudah ada' }, { status: 400 });
    }

    await pool.query(
      'UPDATE satuan_output SET nama = ?, deskripsi = ?, jenis_validasi = ?, is_active = ? WHERE id = ?',
      [nama.trim(), deskripsi?.trim() || null, jenis_validasi || 'kuantitas', is_active ?? true, id]
    );

    return NextResponse.json({ message: 'Satuan output berhasil diupdate' });
  } catch (error) {
    console.error('Error updating satuan output:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete satuan output (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID satuan output harus diisi' }, { status: 400 });
    }

    // Check if satuan is being used in kegiatan
    const [usageCheck] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM kegiatan WHERE satuan_output = (SELECT nama FROM satuan_output WHERE id = ?)',
      [id]
    );

    if (usageCheck[0].count > 0) {
      return NextResponse.json({ 
        error: `Satuan output ini sedang digunakan oleh ${usageCheck[0].count} kegiatan. Nonaktifkan saja atau hapus kegiatan terkait terlebih dahulu.` 
      }, { status: 400 });
    }

    await pool.query('DELETE FROM satuan_output WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Satuan output berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting satuan output:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
