import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification } from '@/lib/services/notificationService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for pending document validations that have been forwarded by Kesubag
    // Pimpinan hanya menerima notifikasi untuk dokumen yang sudah diteruskan kesubag:
    // - Draft: draft_status_kesubag = 'reviewed' (diterima kesubag) DAN draft_feedback_pimpinan IS NULL
    // - Final (minta_validasi=1): validasi_kesubag = 'valid' DAN validasi_pimpinan = 'pending'
    const [pendingDocs] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.nama_file, d.uploaded_at, d.kegiatan_id, d.tipe_dokumen,
              ko.nama as kegiatan_nama, u.nama_lengkap as uploader_nama
       FROM dokumen_output d
       JOIN kegiatan ko ON d.kegiatan_id = ko.id
       JOIN users u ON d.uploaded_by = u.id
       WHERE 
         -- Draft yang sudah diterima kesubag dan menunggu feedback pimpinan
         (d.tipe_dokumen = 'draft' AND d.draft_status_kesubag = 'reviewed' AND d.draft_feedback_pimpinan IS NULL)
         OR
         -- Final yang sudah divalidasi kesubag dan menunggu validasi pimpinan
         (d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND d.validasi_kesubag = 'valid' AND d.validasi_pimpinan = 'pending')
       ORDER BY d.uploaded_at DESC
       LIMIT 10`
    );

    for (const doc of pendingDocs) {
      // Check if notification already exists for this document (regardless of date or read status)
      const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND type = 'permintaan_validasi' AND reference_id = ? AND reference_type = 'dokumen'`,
        [auth.id, doc.id]
      );

      if (existing.length === 0) {
        // Pesan berbeda untuk draft dan final
        const isDraft = doc.tipe_dokumen === 'draft';
        await createNotification({
          userId: auth.id,
          title: isDraft ? '📋 Draft Menunggu Review' : '📄 Dokumen Menunggu Validasi Akhir',
          message: isDraft 
            ? `Draft "${doc.nama_file}" dari kegiatan "${doc.kegiatan_nama}" telah direview Kesubag dan menunggu feedback Anda.`
            : `Dokumen "${doc.nama_file}" dari kegiatan "${doc.kegiatan_nama}" telah divalidasi Kesubag dan menunggu validasi akhir Anda.`,
          type: 'permintaan_validasi',
          referenceId: doc.id,
          referenceType: 'dokumen'
        });
      }
    }

    // Get only unread notifications from database
    const dbNotifications = await getNotifications(auth.id, 20, true);
    const unreadCount = await getUnreadCount(auth.id);

    // Format notifications for frontend
    const notifications = dbNotifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: n.created_at,
      type: n.type,
      read: n.is_read === 1 || n.is_read === true,
      referenceId: n.reference_id,
      referenceType: n.reference_type
    }));

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Mark notification as read
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'mark_read' && notificationId) {
      // Handle dynamic notification IDs (string like "pending-doc-123")
      if (typeof notificationId === 'string' && notificationId.includes('-')) {
        return NextResponse.json({ success: true, message: 'Dynamic notification marked as read' });
      }
      
      const success = await markAsRead(parseInt(notificationId), auth.id);
      return NextResponse.json({ success });
    }

    if (action === 'mark_all_read') {
      const count = await markAllAsRead(auth.id);
      return NextResponse.json({ success: true, markedCount: count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
