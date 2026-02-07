import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

// POST - Change password for PPK
export async function POST(req: NextRequest) {
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
    const { currentPassword, newPassword } = body;

    if (!newPassword) {
      return NextResponse.json({ 
        error: 'Password baru wajib diisi' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password baru minimal 6 karakter' 
      }, { status: 400 });
    }

    // Get current password hash and check if first login
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT password, is_first_login FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if this is first login (from cookie OR database)
    const isFirstLogin = payload.isFirstLogin === true || userRows[0].is_first_login === 1 || userRows[0].is_first_login === true;

    // For non-first-login, verify current password
    if (!isFirstLogin) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: 'Password lama wajib diisi' 
        }, { status: 400 });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, userRows[0].password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark as not first login
    await pool.query(
      'UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?',
      [hashedPassword, payload.id]
    );

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
