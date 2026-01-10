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
    
    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notifications = [];

    // Check for kegiatan with low performance (score < 60)
    const [lowPerformance] = await pool.query<RowDataPacket[]>(
      `SELECT ko.id, ko.nama, ko.target_realisasi_output, ko.realisasi_output
       FROM kegiatan_operasional ko
       WHERE ko.realisasi_output < (ko.target_realisasi_output * 0.5)
         AND ko.target_realisasi_output > 0
       ORDER BY ko.updated_at DESC
       LIMIT 5`
    );

    for (const k of lowPerformance) {
      const progress = k.target_realisasi_output > 0 
        ? Math.round((k.realisasi_output / k.target_realisasi_output) * 100) 
        : 0;
      notifications.push({
        id: `low-perf-${k.id}`,
        title: 'Kinerja Rendah',
        message: `${k.nama} - Capaian hanya ${progress}%`,
        time: new Date().toISOString(),
        type: 'kegiatan',
        read: false,
      });
    }

    // Check for kegiatan pending verification
    const [pendingVerif] = await pool.query<RowDataPacket[]>(
      `SELECT ko.id, ko.nama, ko.updated_at
       FROM kegiatan_operasional ko
       WHERE ko.status_verifikasi = 'pending'
       ORDER BY ko.updated_at DESC
       LIMIT 5`
    );

    for (const k of pendingVerif) {
      notifications.push({
        id: `pending-verif-${k.id}`,
        title: 'Menunggu Verifikasi',
        message: `${k.nama} perlu diverifikasi`,
        time: k.updated_at,
        type: 'verifikasi',
        read: false,
      });
    }

    // Check for recent evaluations
    const [recentEval] = await pool.query<RowDataPacket[]>(
      `SELECT ep.id, ep.jenis_evaluasi, ep.created_at, ko.nama as kegiatan_nama
       FROM evaluasi_pimpinan ep
       JOIN kegiatan_operasional ko ON ep.kegiatan_id = ko.id
       WHERE ep.user_id = ?
         AND ep.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY ep.created_at DESC
       LIMIT 3`,
      [auth.id]
    );

    for (const e of recentEval) {
      notifications.push({
        id: `eval-${e.id}`,
        title: `Evaluasi ${e.jenis_evaluasi}`,
        message: `Anda memberikan ${e.jenis_evaluasi} untuk ${e.kegiatan_nama}`,
        time: e.created_at,
        type: 'evaluasi',
        read: true,
      });
    }

    // Check for kegiatan with kendala
    const [withKendala] = await pool.query<RowDataPacket[]>(
      `SELECT ko.id, ko.nama, kk.created_at
       FROM kegiatan_operasional ko
       JOIN kendala_kegiatan kk ON ko.id = kk.kegiatan_operasional_id
       WHERE kk.status != 'selesai'
         AND kk.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY ko.id, ko.nama
       ORDER BY MAX(kk.created_at) DESC
       LIMIT 3`
    );

    for (const k of withKendala) {
      notifications.push({
        id: `kendala-${k.id}`,
        title: 'Kegiatan Bermasalah',
        message: `${k.nama} melaporkan kendala`,
        time: k.created_at,
        type: 'kegiatan',
        read: false,
      });
    }

    // Sort by time
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

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

export async function POST(req: Request) {
  // Mark notifications as read (handled client-side with localStorage for now)
  return NextResponse.json({ success: true });
}
