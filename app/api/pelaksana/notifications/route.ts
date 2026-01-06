import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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

    // Get notifications for pelaksana
    const notifications = [];

    // Check for upcoming deadlines
    const [deadlines] = await pool.query<RowDataPacket[]>(
      `SELECT pt.id, pt.deadline, k.nama as kegiatan_nama
       FROM penugasan_tim pt
       JOIN kegiatan k ON pt.kegiatan_id = k.id
       WHERE pt.user_id = ? 
         AND pt.status != 'selesai'
         AND pt.deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
       ORDER BY pt.deadline ASC
       LIMIT 5`,
      [auth.id]
    );

    for (const d of deadlines) {
      const daysLeft = Math.ceil((new Date(d.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `deadline-${d.id}`,
        title: 'Deadline Mendekati',
        message: `${d.kegiatan_nama} - ${daysLeft <= 0 ? 'Hari ini!' : `${daysLeft} hari lagi`}`,
        time: new Date(d.deadline).toLocaleDateString('id-ID'),
        type: 'deadline',
        read: false,
      });
    }

    // Check for overdue tasks
    const [overdue] = await pool.query<RowDataPacket[]>(
      `SELECT pt.id, pt.deadline, k.nama as kegiatan_nama
       FROM penugasan_tim pt
       JOIN kegiatan k ON pt.kegiatan_id = k.id
       WHERE pt.user_id = ? 
         AND pt.status != 'selesai'
         AND pt.deadline < NOW()
       ORDER BY pt.deadline DESC
       LIMIT 3`,
      [auth.id]
    );

    for (const o of overdue) {
      notifications.push({
        id: `overdue-${o.id}`,
        title: 'Tugas Terlambat!',
        message: `${o.kegiatan_nama} sudah melewati deadline`,
        time: new Date(o.deadline).toLocaleDateString('id-ID'),
        type: 'deadline',
        read: false,
      });
    }

    // Check for new assignments (recent)
    const [newTasks] = await pool.query<RowDataPacket[]>(
      `SELECT pt.id, pt.created_at, k.nama as kegiatan_nama
       FROM penugasan_tim pt
       JOIN kegiatan k ON pt.kegiatan_id = k.id
       WHERE pt.user_id = ? 
         AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY pt.created_at DESC
       LIMIT 3`,
      [auth.id]
    );

    for (const t of newTasks) {
      notifications.push({
        id: `new-${t.id}`,
        title: 'Tugas Baru',
        message: `Anda ditugaskan untuk: ${t.kegiatan_nama}`,
        time: new Date(t.created_at).toLocaleDateString('id-ID'),
        type: 'tugas',
        read: false,
      });
    }

    // Mark read notifications
    const readIds: string[] = [];
    // Read notifications would be stored in localStorage on client side

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      notifications: notifications.slice(0, 10),
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
