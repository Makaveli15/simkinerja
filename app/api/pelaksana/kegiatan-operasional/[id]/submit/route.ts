import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

// POST - Submit kegiatan untuk approval (multi-level: Koordinator -> PPK -> Kepala)
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
      `SELECT ko.id, ko.nama, ko.status_pengajuan, ko.created_by, t.nama as tim_nama
       FROM kegiatan ko
       LEFT JOIN tim t ON ko.tim_id = t.id
       WHERE ko.id = ? AND ko.tim_id = ?`,
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

    // Can only submit if status is 'draft', 'ditolak', or 'revisi'
    if (!['draft', 'ditolak', 'revisi'].includes(kegiatanData.status_pengajuan)) {
      return NextResponse.json({ 
        error: `Kegiatan dengan status "${kegiatanData.status_pengajuan}" tidak dapat diajukan` 
      }, { status: 400 });
    }

    // Update status pengajuan - now goes to Koordinator first
    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan 
       SET status_pengajuan = 'diajukan', 
           tanggal_pengajuan = NOW(),
           -- Reset previous approval data when resubmitting
           approved_by_koordinator = NULL,
           tanggal_approval_koordinator = NULL,
           catatan_koordinator = NULL,
           approved_by_ppk = NULL,
           tanggal_approval_ppk = NULL,
           catatan_ppk = NULL,
           approved_by_kepala = NULL,
           tanggal_approval_kepala = NULL,
           catatan_kepala = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    // Create notification for Koordinator of this tim
    try {
      // Get koordinator users for this tim
      const [koordinatorUsers] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE role = 'koordinator' AND tim_id = ? AND status = 'active'`,
        [timId]
      );

      if (koordinatorUsers.length > 0) {
        for (const koordinator of koordinatorUsers) {
          await createNotification({
            userId: koordinator.id,
            title: 'Pengajuan Kegiatan Baru',
            message: `Kegiatan "${kegiatanData.nama}" menunggu persetujuan Anda.`,
            type: 'kegiatan',
            referenceId: parseInt(id),
            referenceType: 'kegiatan'
          });
        }
      } else {
        // If no koordinator for this tim, notify all koordinator
        const [allKoordinator] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE role = 'koordinator' AND status = 'active'`
        );
        
        for (const koordinator of allKoordinator) {
          await createNotification({
            userId: koordinator.id,
            title: 'Pengajuan Kegiatan Baru',
            message: `Kegiatan "${kegiatanData.nama}" dari Tim ${kegiatanData.tim_nama || ''} menunggu persetujuan Anda.`,
            type: 'kegiatan',
            referenceId: parseInt(id),
            referenceType: 'kegiatan'
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({ 
      message: 'Kegiatan berhasil diajukan ke Koordinator untuk persetujuan',
      status_pengajuan: 'diajukan'
    });
  } catch (error) {
    console.error('Error submitting kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
