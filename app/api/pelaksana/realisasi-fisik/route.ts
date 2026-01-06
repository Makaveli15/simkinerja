import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper to verify access
async function verifyAccess(authId: number, kegiatanId: number): Promise<boolean> {
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT tim_id FROM users WHERE id = ?',
    [authId]
  );

  if (userRows.length === 0 || !userRows[0].tim_id) {
    return false;
  }

  const timId = userRows[0].tim_id;

  const [kegiatan] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM kegiatan_operasional WHERE id = ? AND tim_id = ?',
    [kegiatanId, timId]
  );

  return kegiatan.length > 0;
}

// POST - Add realisasi fisik entry
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { kegiatan_id, persentase, keterangan } = await request.json();

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'Kegiatan ID diperlukan' }, { status: 400 });
    }

    if (persentase === undefined || persentase < 0 || persentase > 100) {
      return NextResponse.json({ error: 'Persentase harus antara 0-100' }, { status: 400 });
    }

    const hasAccess = await verifyAccess(auth.id, kegiatan_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO realisasi_fisik 
       (kegiatan_operasional_id, user_id, persentase, keterangan, tanggal_realisasi)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [kegiatan_id, auth.id, persentase, keterangan || null]
    );

    return NextResponse.json({ message: 'Realisasi fisik berhasil disimpan', id: result.insertId });
  } catch (error) {
    console.error('Error creating realisasi fisik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get realisasi fisik history for a kegiatan
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatan_id');

    if (!kegiatanId) {
      return NextResponse.json({ error: 'Kegiatan ID diperlukan' }, { status: 400 });
    }

    const hasAccess = await verifyAccess(auth.id, parseInt(kegiatanId));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const [realisasi] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM realisasi_fisik 
       WHERE kegiatan_operasional_id = ? 
       ORDER BY tanggal_realisasi DESC`,
      [kegiatanId]
    );

    return NextResponse.json(realisasi);
  } catch (error) {
    console.error('Error fetching realisasi fisik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete realisasi fisik entry
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const realisasiId = searchParams.get('id');

    if (!realisasiId) {
      return NextResponse.json({ error: 'Realisasi ID diperlukan' }, { status: 400 });
    }

    // Get kegiatan_id first
    const [realisasiRow] = await pool.query<RowDataPacket[]>(
      'SELECT kegiatan_operasional_id FROM realisasi_fisik WHERE id = ?',
      [realisasiId]
    );

    if (realisasiRow.length === 0) {
      return NextResponse.json({ error: 'Realisasi tidak ditemukan' }, { status: 404 });
    }

    const hasAccess = await verifyAccess(auth.id, realisasiRow[0].kegiatan_operasional_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    await pool.query('DELETE FROM realisasi_fisik WHERE id = ?', [realisasiId]);

    return NextResponse.json({ message: 'Realisasi fisik berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting realisasi fisik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
