import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get total users
    const [usersCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM users'
    );

    // Get active users
    const [activeUsersCount] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM users WHERE status = 'aktif'"
    );

    // Get total tim
    const [timCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM tim'
    );

    // Get total KRO
    const [kroCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM kro'
    );

    // Get total Mitra
    const [mitraCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM mitra'
    );

    // Get total Kegiatan
    const [kegiatanCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM kegiatan'
    );

    // Get total budget from kegiatan
    const [totalBudget] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(anggaran), 0) as total FROM kegiatan'
    );

    // Get users by role
    const [usersByRole] = await pool.query<RowDataPacket[]>(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // Get users by tim (only pelaksana)
    const [usersByTim] = await pool.query<RowDataPacket[]>(
      `SELECT t.nama as tim_nama, COUNT(u.id) as count 
       FROM tim t 
       LEFT JOIN users u ON t.id = u.tim_id 
       GROUP BY t.id, t.nama 
       ORDER BY count DESC`
    );

    // Get recent users
    const [recentUsers] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, role, status, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    // Get recent kegiatan
    const [recentKegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT k.id, k.kode, k.nama, k.anggaran, kr.nama as kro_nama, k.created_at 
       FROM kegiatan k 
       LEFT JOIN kro kr ON k.kro_id = kr.id 
       ORDER BY k.created_at DESC 
       LIMIT 5`
    );

    return NextResponse.json({
      stats: {
        totalUsers: usersCount[0].total,
        activeUsers: activeUsersCount[0].total,
        totalTim: timCount[0].total,
        totalKro: kroCount[0].total,
        totalMitra: mitraCount[0].total,
        totalKegiatan: kegiatanCount[0].total,
        totalBudget: totalBudget[0].total,
      },
      usersByRole,
      usersByTim,
      recentUsers,
      recentKegiatan,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
