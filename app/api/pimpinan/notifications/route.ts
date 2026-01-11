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

    // Check for pending document validations and create notifications if not exists
    const [pendingDocs] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.nama_file, d.uploaded_at, d.kegiatan_id, ko.nama as kegiatan_nama, u.nama_lengkap as uploader_nama
       FROM dokumen_output d
       JOIN kegiatan_operasional ko ON d.kegiatan_id = ko.id
       JOIN users u ON d.uploaded_by = u.id
       WHERE d.status_review = 'pending'
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
        await createNotification({
          userId: auth.id,
          title: '📄 Permintaan Validasi Dokumen',
          message: `${doc.uploader_nama} mengajukan validasi: ${doc.nama_file} (${doc.kegiatan_nama})`,
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
