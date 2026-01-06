import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

// GET - List all Kegiatan with KRO info
export async function GET() {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute(`
      SELECT k.*, kro.kode as kro_kode, kro.nama as kro_nama 
      FROM kegiatan k 
      LEFT JOIN kro ON k.kro_id = kro.id 
      ORDER BY k.id DESC
    `);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create new Kegiatan
export async function POST(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { kode, nama, kro_id, anggaran } = body;

    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama wajib diisi' }, { status: 400 });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO kegiatan (kode, nama, kro_id, anggaran) VALUES (?, ?, ?, ?)',
      [kode, nama, kro_id || null, anggaran || 0]
    );

    return NextResponse.json({ id: result.insertId, message: 'Kegiatan berhasil dibuat' }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kode kegiatan sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT - Update Kegiatan
export async function PUT(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, kode, nama, kro_id, anggaran } = body;

    if (!id || !kode || !nama) {
      return NextResponse.json({ error: 'ID, kode, dan nama wajib diisi' }, { status: 400 });
    }

    await pool.execute(
      'UPDATE kegiatan SET kode = ?, nama = ?, kro_id = ?, anggaran = ? WHERE id = ?',
      [kode, nama, kro_id || null, anggaran || 0, id]
    );

    return NextResponse.json({ message: 'Kegiatan berhasil diupdate' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Kode kegiatan sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete Kegiatan
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

    await pool.execute('DELETE FROM kegiatan WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
