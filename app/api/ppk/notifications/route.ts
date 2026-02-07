import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Get notifications for PPK
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get notifications for this user
    const [notifications] = await pool.query<RowDataPacket[]>(`
      SELECT 
        id, title, message, type, is_read as \`read\`, 
        reference_id as referenceId, reference_type as referenceType,
        created_at as time
      FROM notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [payload.id]);

    // Count unread
    const [unreadResult] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `, [payload.id]);

    return NextResponse.json({
      notifications: notifications,
      unreadCount: unreadResult[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark notifications as read
export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all as read
      await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [payload.id]
      );
    } else if (notificationId) {
      // Mark specific notification as read
      await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, payload.id]
      );
    }

    return NextResponse.json({ message: 'Notifications updated' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
