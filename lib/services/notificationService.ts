import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: 'evaluasi' | 'validasi' | 'permintaan_validasi' | 'deadline' | 'tugas' | 'kendala' | 'kegiatan';
  referenceId?: number;
  referenceType?: 'kegiatan' | 'dokumen' | 'evaluasi';
}

/**
 * Membuat notifikasi baru untuk user
 */
export async function createNotification(data: NotificationData): Promise<number | null> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.userId, data.title, data.message, data.type, data.referenceId || null, data.referenceType || null]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Membuat notifikasi untuk semua anggota tim tertentu
 */
export async function createNotificationForTeam(
  timId: number, 
  data: Omit<NotificationData, 'userId'>
): Promise<number> {
  try {
    // Get all users in the team
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE tim_id = ? AND role = ?',
      [timId, 'pelaksana']
    );

    let created = 0;
    for (const user of users) {
      const notifId = await createNotification({
        ...data,
        userId: user.id
      });
      if (notifId) created++;
    }
    return created;
  } catch (error) {
    console.error('Error creating team notifications:', error);
    return 0;
  }
}

/**
 * Membuat notifikasi untuk semua pimpinan
 */
export async function createNotificationForAllPimpinan(
  data: Omit<NotificationData, 'userId'>
): Promise<number> {
  try {
    const [pimpinanUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE role = ?',
      ['pimpinan']
    );

    let created = 0;
    for (const user of pimpinanUsers) {
      const notifId = await createNotification({
        ...data,
        userId: user.id
      });
      if (notifId) created++;
    }
    return created;
  } catch (error) {
    console.error('Error creating pimpinan notifications:', error);
    return 0;
  }
}

/**
 * Membuat notifikasi untuk semua kesubag
 */
export async function createNotificationForAllKesubag(
  data: Omit<NotificationData, 'userId'>
): Promise<number> {
  try {
    const [kesubagUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE role = ?',
      ['kesubag']
    );

    let created = 0;
    for (const user of kesubagUsers) {
      const notifId = await createNotification({
        ...data,
        userId: user.id
      });
      if (notifId) created++;
    }
    return created;
  } catch (error) {
    console.error('Error creating kesubag notifications:', error);
    return 0;
  }
}

/**
 * Membuat notifikasi untuk pelaksana yang upload dokumen tertentu
 */
export async function createNotificationForDocUploader(
  dokumenId: number,
  data: Omit<NotificationData, 'userId'>
): Promise<number | null> {
  try {
    const [dokumen] = await pool.query<RowDataPacket[]>(
      'SELECT uploaded_by FROM dokumen_output WHERE id = ?',
      [dokumenId]
    );

    if (dokumen.length === 0) return null;

    return await createNotification({
      ...data,
      userId: dokumen[0].uploaded_by
    });
  } catch (error) {
    console.error('Error creating doc uploader notification:', error);
    return null;
  }
}

/**
 * Membuat notifikasi untuk pelaksana berdasarkan kegiatan
 */
export async function createNotificationForKegiatanTeam(
  kegiatanId: number,
  data: Omit<NotificationData, 'userId'>
): Promise<number> {
  try {
    // Get tim_id from kegiatan
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM kegiatan_operasional WHERE id = ?',
      [kegiatanId]
    );

    if (kegiatan.length === 0) return 0;

    return await createNotificationForTeam(kegiatan[0].tim_id, data);
  } catch (error) {
    console.error('Error creating kegiatan team notification:', error);
    return 0;
  }
}

/**
 * Mendapatkan notifikasi untuk user
 * @param onlyUnread - Jika true, hanya mengambil notifikasi yang belum dibaca
 */
export async function getNotifications(userId: number, limit: number = 20, onlyUnread: boolean = false): Promise<RowDataPacket[]> {
  try {
    let query = `SELECT * FROM notifications WHERE user_id = ?`;
    
    if (onlyUnread) {
      query += ` AND is_read = FALSE`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    
    const [notifications] = await pool.query<RowDataPacket[]>(query, [userId, limit]);
    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Menghitung jumlah notifikasi yang belum dibaca
 */
export async function getUnreadCount(userId: number): Promise<number> {
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Menandai notifikasi sebagai sudah dibaca
 */
export async function markAsRead(notificationId: number, userId: number): Promise<boolean> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Menandai semua notifikasi user sebagai sudah dibaca
 */
export async function markAllAsRead(userId: number): Promise<number> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
}
