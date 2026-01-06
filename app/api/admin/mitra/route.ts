import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

// GET - List all Mitra
export async function GET() {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM mitra ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create new Mitra
export async function POST(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nama, posisi, alamat, jk, no_telp, sobat_id, email } = body;

    if (!nama) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO mitra (nama, posisi, alamat, jk, no_telp, sobat_id, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama, posisi || null, alamat || null, jk || null, no_telp || null, sobat_id || null, email || null]
    );

    return NextResponse.json({ id: result.insertId, message: 'Mitra berhasil dibuat' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT - Update Mitra
export async function PUT(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, nama, posisi, alamat, jk, no_telp, sobat_id, email } = body;

    if (!id || !nama) {
      return NextResponse.json({ error: 'ID dan nama wajib diisi' }, { status: 400 });
    }

    await pool.execute(
      'UPDATE mitra SET nama = ?, posisi = ?, alamat = ?, jk = ?, no_telp = ?, sobat_id = ?, email = ? WHERE id = ?',
      [nama, posisi || null, alamat || null, jk || null, no_telp || null, sobat_id || null, email || null, id]
    );

    return NextResponse.json({ message: 'Mitra berhasil diupdate' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete Mitra
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

    await pool.execute('DELETE FROM mitra WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Mitra berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
