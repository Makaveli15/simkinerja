import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// POST - For first login password change (no current password required)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { newPassword, confirmPassword } = body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Password baru tidak cocok' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Check if user exists and is first login
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, is_first_login FROM users WHERE id = ?',
      [auth.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark as not first login
    await pool.query(
      'UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?',
      [hashedPassword, auth.id]
    );

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error changing password (first login):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - For regular password change (requires current password)
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Password baru tidak cocok' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Get current user password
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT password FROM users WHERE id = ?',
      [auth.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark as not first login
    await pool.query(
      'UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?',
      [hashedPassword, auth.id]
    );

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
