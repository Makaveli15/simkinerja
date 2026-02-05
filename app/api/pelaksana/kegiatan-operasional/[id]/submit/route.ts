import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// POST - Submit kegiatan untuk approval pimpinan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Check kegiatan exists and belongs to user's tim
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, status_pengajuan, created_by 
       FROM kegiatan 
       WHERE id = ? AND tim_id = ?`,
      [id, timId]
    );

    if (kegiatan.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const kegiatanData = kegiatan[0];

    // Only creator can submit
    if (kegiatanData.created_by !== auth.id) {
      return NextResponse.json({ 
        error: 'Hanya pembuat kegiatan yang dapat mengajukan' 
      }, { status: 403 });
    }

    // Can only submit if status is 'draft' or 'ditolak'
    if (!['draft', 'ditolak'].includes(kegiatanData.status_pengajuan)) {
      return NextResponse.json({ 
        error: `Kegiatan dengan status "${kegiatanData.status_pengajuan}" tidak dapat diajukan` 
      }, { status: 400 });
    }

    // Update status pengajuan
    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan 
       SET status_pengajuan = 'diajukan', 
           tanggal_pengajuan = NOW(),
           catatan_approval = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    // Create notification for pimpinan
    try {
      // Get pimpinan users
      const [pimpinanUsers] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE role = 'pimpinan'`
      );

      for (const pimpinan of pimpinanUsers) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
           VALUES (?, 'approval_request', 'Pengajuan Kegiatan Baru', ?, ?, 'kegiatan')`,
          [pimpinan.id, `Kegiatan "${kegiatanData.nama}" menunggu persetujuan Anda.`, id]
        );
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({ 
      message: 'Kegiatan berhasil diajukan ke Pimpinan untuk persetujuan',
      status_pengajuan: 'diajukan'
    });
  } catch (error) {
    console.error('Error submitting kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
