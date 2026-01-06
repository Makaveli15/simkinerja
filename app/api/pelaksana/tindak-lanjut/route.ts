import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper to verify access through kendala
async function verifyAccessByKendala(authId: number, kendalaId: number): Promise<boolean> {
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

// POST - Add tindak lanjut entry
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

    const { kendala_id, deskripsi, batas_waktu, update_status_kendala } = await request.json();

    if (!kendala_id) {
      return NextResponse.json({ error: 'Kendala ID diperlukan' }, { status: 400 });
    }

    if (!deskripsi) {
      return NextResponse.json({ error: 'Deskripsi tindak lanjut harus diisi' }, { status: 400 });
    }

    const hasAccess = await verifyAccessByKendala(auth.id, kendala_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tindak_lanjut 
       (kendala_id, user_id, deskripsi, tanggal, batas_waktu)
       VALUES (?, ?, ?, CURDATE(), ?)`,
      [kendala_id, auth.id, deskripsi, batas_waktu || null]
    );

    // Optionally update kendala status
    if (update_status_kendala) {
      const validStatuses = ['open', 'resolved'];
      if (validStatuses.includes(update_status_kendala)) {
        await pool.query(
          'UPDATE kendala_kegiatan SET status = ? WHERE id = ?',
          [update_status_kendala, kendala_id]
        );
      }
    }

    return NextResponse.json({ message: 'Tindak lanjut berhasil disimpan', id: result.insertId });
  } catch (error) {
    console.error('Error creating tindak lanjut:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get tindak lanjut for a kendala
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
    const kendalaId = searchParams.get('kendala_id');

    if (!kendalaId) {
      return NextResponse.json({ error: 'Kendala ID diperlukan' }, { status: 400 });
    }

    const hasAccess = await verifyAccessByKendala(auth.id, parseInt(kendalaId));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Get kendala info
    const [kendalaInfo] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM kendala_kegiatan WHERE id = ?',
      [kendalaId]
    );

    const [tindakLanjut] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tindak_lanjut 
       WHERE kendala_id = ? 
       ORDER BY tanggal_tindak_lanjut DESC`,
      [kendalaId]
    );

    return NextResponse.json({
      kendala: kendalaInfo[0] || null,
      tindak_lanjut: tindakLanjut
    });
  } catch (error) {
    console.error('Error fetching tindak lanjut:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update tindak lanjut
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

    const { id, deskripsi } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Tindak lanjut ID diperlukan' }, { status: 400 });
    }

    if (!deskripsi) {
      return NextResponse.json({ error: 'Deskripsi harus diisi' }, { status: 400 });
    }

    // Get kendala_id first
    const [tindakLanjutRow] = await pool.query<RowDataPacket[]>(
      'SELECT kendala_id FROM tindak_lanjut WHERE id = ?',
      [id]
    );

    if (tindakLanjutRow.length === 0) {
      return NextResponse.json({ error: 'Tindak lanjut tidak ditemukan' }, { status: 404 });
    }

    const hasAccess = await verifyAccessByKendala(auth.id, tindakLanjutRow[0].kendala_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    await pool.query<ResultSetHeader>(
      'UPDATE tindak_lanjut SET deskripsi = ? WHERE id = ?',
      [deskripsi, id]
    );

    return NextResponse.json({ message: 'Tindak lanjut berhasil diupdate' });
  } catch (error) {
    console.error('Error updating tindak lanjut:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete tindak lanjut entry
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
    const tindakLanjutId = searchParams.get('id');

    if (!tindakLanjutId) {
      return NextResponse.json({ error: 'Tindak lanjut ID diperlukan' }, { status: 400 });
    }

    // Get kendala_id first
    const [tindakLanjutRow] = await pool.query<RowDataPacket[]>(
      'SELECT kendala_id FROM tindak_lanjut WHERE id = ?',
      [tindakLanjutId]
    );

    if (tindakLanjutRow.length === 0) {
      return NextResponse.json({ error: 'Tindak lanjut tidak ditemukan' }, { status: 404 });
    }

    const hasAccess = await verifyAccessByKendala(auth.id, tindakLanjutRow[0].kendala_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    await pool.query('DELETE FROM tindak_lanjut WHERE id = ?', [tindakLanjutId]);

    return NextResponse.json({ message: 'Tindak lanjut berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting tindak lanjut:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
