import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';

export async function PUT(request: NextRequest) {
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

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Password baru tidak cocok' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Get current user
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT password FROM users WHERE id = ?',
      [auth.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and set is_first_login to 0
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

// POST untuk first login (tanpa verifikasi password lama jika pakai default)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);

    const { newPassword, confirmPassword } = await request.json();

    // Validasi input
    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Password baru tidak cocok' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and set is_first_login to 0
    await pool.query(
      'UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?',
      [hashedPassword, auth.id]
    );

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
