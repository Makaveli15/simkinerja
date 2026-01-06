import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

// GET - List all KRO
export async function GET() {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM kro ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create new KRO
export async function POST(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { kode, nama, deskripsi } = body;

    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama wajib diisi' }, { status: 400 });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO kro (kode, nama, deskripsi) VALUES (?, ?, ?)',
      [kode, nama, deskripsi || null]
    );

    return NextResponse.json({ id: result.insertId, message: 'KRO berhasil dibuat' }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kode KRO sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT - Update KRO
export async function PUT(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, kode, nama, deskripsi } = body;

    if (!id || !kode || !nama) {
      return NextResponse.json({ error: 'ID, kode, dan nama wajib diisi' }, { status: 400 });
    }

    await pool.execute(
      'UPDATE kro SET kode = ?, nama = ?, deskripsi = ? WHERE id = ?',
      [kode, nama, deskripsi || null, id]
    );

    return NextResponse.json({ message: 'KRO berhasil diupdate' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kode KRO sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete KRO
export async function DELETE(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    await pool.execute('DELETE FROM kro WHERE id = ?', [id]);

    return NextResponse.json({ message: 'KRO berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
