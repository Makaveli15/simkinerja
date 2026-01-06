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

// POST - Add kendala entry
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

    const { kegiatan_id, deskripsi, tingkat_prioritas } = await request.json();

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'Kegiatan ID diperlukan' }, { status: 400 });
    }

    if (!deskripsi) {
      return NextResponse.json({ error: 'Deskripsi kendala harus diisi' }, { status: 400 });
    }

    const hasAccess = await verifyAccess(auth.id, kegiatan_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const validDampak = ['rendah', 'sedang', 'tinggi'];
    const dampak = validDampak.includes(tingkat_prioritas) ? tingkat_prioritas : 'sedang';

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO kendala_kegiatan 
       (kegiatan_operasional_id, user_id, deskripsi, tingkat_dampak, status, tanggal_kejadian)
       VALUES (?, ?, ?, ?, 'open', CURDATE())`,
      [kegiatan_id, auth.id, deskripsi, dampak]
    );

    return NextResponse.json({ message: 'Kendala berhasil disimpan', id: result.insertId });
  } catch (error) {
    console.error('Error creating kendala:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get kendala list for a kegiatan
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

    const [kendala] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM kendala_kegiatan 
       WHERE kegiatan_operasional_id = ? 
       ORDER BY 
         CASE tingkat_prioritas 
           WHEN 'tinggi' THEN 1 
           WHEN 'sedang' THEN 2 
           WHEN 'rendah' THEN 3 
         END,
         tanggal_kendala DESC`,
      [kegiatanId]
    );

    // Get tindak lanjut for each kendala
    const kendalaWithTindakLanjut = await Promise.all(kendala.map(async (k) => {
      const [tindakLanjut] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM tindak_lanjut 
         WHERE kendala_id = ? 
         ORDER BY tanggal_tindak_lanjut DESC`,
        [k.id]
      );
      return { ...k, tindak_lanjut: tindakLanjut };
    }));

    // Summary
    const total = kendala.length;
    const open = kendala.filter(k => k.status === 'open').length;
    const inProgress = kendala.filter(k => k.status === 'in_progress').length;
    const resolved = kendala.filter(k => k.status === 'resolved').length;

    return NextResponse.json({
      data: kendalaWithTindakLanjut,
      summary: {
        total,
        open,
        in_progress: inProgress,
        resolved,
        persentase_selesai: total > 0 ? ((resolved / total) * 100).toFixed(1) : '0'
      }
    });
  } catch (error) {
    console.error('Error fetching kendala:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update kendala status
export async function PUT(request: NextRequest) {
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

    const { id, status, deskripsi, tingkat_prioritas } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Kendala ID diperlukan' }, { status: 400 });
    }

    // Get kegiatan_id first
    const [kendalaRow] = await pool.query<RowDataPacket[]>(
      'SELECT kegiatan_operasional_id FROM kendala_kegiatan WHERE id = ?',
      [id]
    );

    if (kendalaRow.length === 0) {
      return NextResponse.json({ error: 'Kendala tidak ditemukan' }, { status: 404 });
    }

    const hasAccess = await verifyAccess(auth.id, kendalaRow[0].kegiatan_operasional_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const validStatuses = ['open', 'in_progress', 'resolved'];
    const validPrioritas = ['rendah', 'sedang', 'tinggi'];

    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

    if (status && validStatuses.includes(status)) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (deskripsi) {
      updateFields.push('deskripsi = ?');
      updateValues.push(deskripsi);
    }

    if (tingkat_prioritas && validPrioritas.includes(tingkat_prioritas)) {
      updateFields.push('tingkat_prioritas = ?');
      updateValues.push(tingkat_prioritas);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 });
    }

    updateValues.push(id);

    await pool.query<ResultSetHeader>(
      `UPDATE kendala_kegiatan SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({ message: 'Kendala berhasil diupdate' });
  } catch (error) {
    console.error('Error updating kendala:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete kendala entry
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
    const kendalaId = searchParams.get('id');

    if (!kendalaId) {
      return NextResponse.json({ error: 'Kendala ID diperlukan' }, { status: 400 });
    }

    // Get kegiatan_id first
    const [kendalaRow] = await pool.query<RowDataPacket[]>(
      'SELECT kegiatan_operasional_id FROM kendala_kegiatan WHERE id = ?',
      [kendalaId]
    );

    if (kendalaRow.length === 0) {
      return NextResponse.json({ error: 'Kendala tidak ditemukan' }, { status: 404 });
    }

    const hasAccess = await verifyAccess(auth.id, kendalaRow[0].kegiatan_operasional_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Delete tindak lanjut first
    await pool.query('DELETE FROM tindak_lanjut WHERE kendala_id = ?', [kendalaId]);
    await pool.query('DELETE FROM kendala_kegiatan WHERE id = ?', [kendalaId]);

    return NextResponse.json({ message: 'Kendala berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kendala:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
