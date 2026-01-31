import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper to verify access
async function verifyAccess(authId: number, kegiatanId: number): Promise<{ valid: boolean; timId?: number }> {
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT tim_id FROM users WHERE id = ?',
    [authId]
  );

  if (userRows.length === 0 || !userRows[0].tim_id) {
    return { valid: false };
  }

  const timId = userRows[0].tim_id;

  const [kegiatan] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM kegiatan WHERE id = ? AND tim_id = ?',
    [kegiatanId, timId]
  );

  if (kegiatan.length === 0) {
    return { valid: false };
  }

  return { valid: true, timId };
}

// POST - Add progres entry
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

    const { kegiatan_id, capaian_output, ketepatan_waktu, kualitas_output, keterangan } = await request.json();

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'Kegiatan ID diperlukan' }, { status: 400 });
    }

    const access = await verifyAccess(auth.id, kegiatan_id);
    if (!access.valid) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO progres_kegiatan 
       (kegiatan_id, user_id, capaian_output, ketepatan_waktu, kualitas_output, keterangan, tanggal_update)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [kegiatan_id, auth.id, capaian_output || 0, ketepatan_waktu || 0, kualitas_output || 0, keterangan || null]
    );

    return NextResponse.json({ message: 'Progres berhasil disimpan', id: result.insertId });
  } catch (error) {
    console.error('Error creating progres:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get progres history for a kegiatan
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

    const access = await verifyAccess(auth.id, parseInt(kegiatanId));
    if (!access.valid) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const [progres] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM progres_kegiatan 
       WHERE kegiatan_id = ? 
       ORDER BY tanggal_update DESC`,
      [kegiatanId]
    );

    return NextResponse.json(progres);
  } catch (error) {
    console.error('Error fetching progres:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete progres entry
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
    const progresId = searchParams.get('id');

    if (!progresId) {
      return NextResponse.json({ error: 'Progres ID diperlukan' }, { status: 400 });
    }

    // Get kegiatan_id first
    const [progresRow] = await pool.query<RowDataPacket[]>(
      'SELECT kegiatan_id FROM progres_kegiatan WHERE id = ?',
      [progresId]
    );

    if (progresRow.length === 0) {
      return NextResponse.json({ error: 'Progres tidak ditemukan' }, { status: 404 });
    }

    const access = await verifyAccess(auth.id, progresRow[0].kegiatan_id);
    if (!access.valid) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    await pool.query('DELETE FROM progres_kegiatan WHERE id = ?', [progresId]);

    return NextResponse.json({ message: 'Progres berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting progres:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
