import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Ambil semua tim dengan anggota
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all tim
    const [timRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM tim ORDER BY nama ASC'
    );

    // Get members for each tim - try with foto column first
    const timWithMembers = await Promise.all(
      timRows.map(async (tim) => {
        let members;
        try {
          [members] = await pool.query<RowDataPacket[]>(
            'SELECT id, username, email, role, status, foto FROM users WHERE tim_id = ? ORDER BY username ASC',
            [tim.id]
          );
        } catch {
          // If foto column doesn't exist
          [members] = await pool.query<RowDataPacket[]>(
            'SELECT id, username, email, role, status FROM users WHERE tim_id = ? ORDER BY username ASC',
            [tim.id]
          );
        }
        return {
          ...tim,
          members,
          memberCount: members.length,
        };
      })
    );

    return NextResponse.json(timWithMembers);
  } catch (error) {
    console.error('Error fetching tim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Tambah tim baru
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { nama, deskripsi } = await request.json();

    if (!nama) {
      return NextResponse.json({ error: 'Nama tim wajib diisi' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO tim (nama, deskripsi) VALUES (?, ?)',
      [nama, deskripsi || null]
    );

    return NextResponse.json({ 
      message: 'Tim berhasil ditambahkan',
      id: result.insertId 
    });
  } catch (error: unknown) {
    console.error('Error creating tim:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Nama tim sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update tim
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, nama, deskripsi } = await request.json();

    if (!id || !nama) {
      return NextResponse.json({ error: 'ID dan nama tim wajib diisi' }, { status: 400 });
    }

    await pool.query(
      'UPDATE tim SET nama = ?, deskripsi = ? WHERE id = ?',
      [nama, deskripsi || null, id]
    );

    return NextResponse.json({ message: 'Tim berhasil diupdate' });
  } catch (error: unknown) {
    console.error('Error updating tim:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Nama tim sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Hapus tim
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tim wajib diisi' }, { status: 400 });
    }

    await pool.query('DELETE FROM tim WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Tim berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting tim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
