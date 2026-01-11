import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

// GET - Get pimpinan profile
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try with foto column first, fallback without it
    let rows;
    try {
      [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, username, email, nama_lengkap, role, status, foto FROM users WHERE id = ?',
        [payload.id]
      );
    } catch {
      // If foto column doesn't exist, query without it
      [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, username, email, nama_lengkap, role, status FROM users WHERE id = ?',
        [payload.id]
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update pimpinan profile
export async function PUT(request: NextRequest) {
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
    
    const body = await request.json();
    const { username, nama_lengkap, email, foto } = body;

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json({ error: 'Username dan email wajib diisi' }, { status: 400 });
    }

    // Check if username is already taken by another user
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, auth.id]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    // Check if email is already taken by another user
    const [existingEmails] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, auth.id]
    );
    
    if (existingEmails.length > 0) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
    }

    // Try to update with foto column, fallback without it
    try {
      await pool.query(
        'UPDATE users SET username = ?, nama_lengkap = ?, email = ?, foto = ? WHERE id = ?',
        [username, nama_lengkap || null, email, foto || null, auth.id]
      );
    } catch {
      // If foto column doesn't exist, update without it
      await pool.query(
        'UPDATE users SET username = ?, nama_lengkap = ?, email = ? WHERE id = ?',
        [username, nama_lengkap || null, email, auth.id]
      );
    }

    // Update cookie with new username
    const newAuth = { ...auth, username };
    const response = NextResponse.json({ message: 'Profil berhasil diperbarui' });
    response.cookies.set('auth', JSON.stringify(newAuth), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
