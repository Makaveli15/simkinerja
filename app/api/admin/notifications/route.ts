import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';

// Helper to get user ID from cookie
async function getUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  if (!authCookie) return null;
  try {
    const user = JSON.parse(authCookie.value);
    return user.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // Ensure notifications_read table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications_read (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        notification_id VARCHAR(100) NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_read (user_id, notification_id)
      )
    `);

    // Get read notification IDs for this user
    const [readNotifs] = await pool.query<RowDataPacket[]>(
      `SELECT notification_id FROM notifications_read WHERE user_id = ?`,
      [userId]
    );
    const readIds = new Set(readNotifs.map((r: RowDataPacket) => r.notification_id));

    // Get recent activities as notifications
    const [recentUsers] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, 'user_created' as type, created_at FROM users ORDER BY created_at DESC LIMIT 3`
    );

    const [recentMitra] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, 'mitra_created' as type, created_at FROM mitra ORDER BY created_at DESC LIMIT 3`
    );

    const notifications = [
      ...recentUsers.map((u: RowDataPacket) => ({
        id: `user-${u.id}`,
        title: 'User Baru',
        message: `${u.username} telah ditambahkan`,
        time: u.created_at,
        type: 'user',
        read: readIds.has(`user-${u.id}`),
        referenceId: u.id,
        referenceType: 'user',
      })),
      ...recentMitra.map((m: RowDataPacket) => ({
        id: `mitra-${m.id}`,
        title: 'Mitra Baru',
        message: `${m.nama} telah ditambahkan`,
        time: m.created_at,
        type: 'mitra',
        read: readIds.has(`mitra-${m.id}`),
        referenceId: m.id,
        referenceType: 'mitra',
      })),
    ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      // Mark all as read - get current notifications first
      const [recentUsers] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM users ORDER BY created_at DESC LIMIT 3`
      );
      const [recentMitra] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM mitra ORDER BY created_at DESC LIMIT 3`
      );

      const allIds = [
        ...recentUsers.map((u: RowDataPacket) => `user-${u.id}`),
        ...recentMitra.map((m: RowDataPacket) => `mitra-${m.id}`),
      ];

      for (const id of allIds) {
        await pool.query(
          `INSERT IGNORE INTO notifications_read (user_id, notification_id) VALUES (?, ?)`,
          [userId, id]
        );
      }

      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
    }

    if (notificationId) {
      await pool.query(
        `INSERT IGNORE INTO notifications_read (user_id, notification_id) VALUES (?, ?)`,
        [userId, notificationId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Mark notification error:', error);
    return NextResponse.json({ error: 'Failed to mark notification' }, { status: 500 });
  }
}
