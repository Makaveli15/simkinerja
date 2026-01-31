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
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for upcoming deadlines and create notifications if not exists
    const [deadlines] = await pool.query<RowDataPacket[]>(
      `SELECT ko.id, ko.tanggal_selesai, ko.nama as kegiatan_nama
       FROM kegiatan ko
       JOIN users u ON ko.tim_id = u.tim_id
       WHERE u.id = ? 
         AND ko.status NOT IN ('selesai')
         AND ko.tanggal_selesai BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
       ORDER BY ko.tanggal_selesai ASC
       LIMIT 5`,
      [auth.id]
    );

    // Create deadline notifications if not already created today
    for (const d of deadlines) {
      // Check if notification already exists for this deadline today
      const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND type = 'deadline' AND reference_id = ? 
         AND DATE(created_at) = CURDATE()`,
        [auth.id, d.id]
      );

      if (existing.length === 0) {
        const daysLeft = Math.ceil((new Date(d.tanggal_selesai).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        await createNotification({
          userId: auth.id,
          title: '⏰ Deadline Mendekati',
          message: `${d.kegiatan_nama} - ${daysLeft <= 0 ? 'Hari ini!' : `${daysLeft} hari lagi`}`,
          type: 'deadline',
          referenceId: d.id,
          referenceType: 'kegiatan'
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
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'mark_read' && notificationId) {
      // Handle dynamic notification IDs (string like "deadline-123")
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
