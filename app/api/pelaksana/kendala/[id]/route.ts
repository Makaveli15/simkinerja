import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper to verify access
async function verifyAccess(authId: number, kendalaId: number): Promise<boolean> {
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT tim_id FROM users WHERE id = ?',
    [authId]
  );

  if (userRows.length === 0 || !userRows[0].tim_id) {
    return false;
  }

  const timId = userRows[0].tim_id;

  const [kendala] = await pool.query<RowDataPacket[]>(
    `SELECT k.id FROM kendala_kegiatan k
     JOIN kegiatan_operasional ko ON k.kegiatan_operasional_id = ko.id
     WHERE k.id = ? AND ko.tim_id = ?`,
    [kendalaId, timId]
  );

  return kendala.length > 0;
}

// PUT - Update kendala status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const kendalaId = parseInt(resolvedParams.id);

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hasAccess = await verifyAccess(auth.id, kendalaId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { status, deskripsi, tingkat_prioritas } = await request.json();

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (status) {
      const validStatuses = ['open', 'resolved'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (deskripsi !== undefined) {
      updates.push('deskripsi = ?');
      values.push(deskripsi);
    }

    if (tingkat_prioritas) {
      const validPriorities = ['rendah', 'sedang', 'tinggi'];
      if (!validPriorities.includes(tingkat_prioritas)) {
        return NextResponse.json({ error: 'Prioritas tidak valid' }, { status: 400 });
      }
      updates.push('tingkat_dampak = ?');
      values.push(tingkat_prioritas);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    values.push(kendalaId);

    await pool.query<ResultSetHeader>(
      `UPDATE kendala_kegiatan SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ message: 'Kendala berhasil diupdate' });
  } catch (error) {
    console.error('Error updating kendala:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete kendala
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const kendalaId = parseInt(resolvedParams.id);

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hasAccess = await verifyAccess(auth.id, kendalaId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Delete related tindak lanjut first
    await pool.query('DELETE FROM tindak_lanjut WHERE kendala_id = ?', [kendalaId]);
    
    // Then delete the kendala
    await pool.query<ResultSetHeader>('DELETE FROM kendala_kegiatan WHERE id = ?', [kendalaId]);

    return NextResponse.json({ message: 'Kendala berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kendala:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
