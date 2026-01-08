import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

// GET profile
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const auth = JSON.parse(authCookie.value);
    
    // Try with foto column first, fallback without it
    let rows;
    try {
      [rows] = await pool.query<RowDataPacket[]>(
        `SELECT u.id, u.username, u.nama_lengkap, u.email, u.role, u.status, u.tim_id, u.foto, t.nama as tim_nama 
         FROM users u 
         LEFT JOIN tim t ON u.tim_id = t.id 
         WHERE u.id = ?`,
        [auth.id]
      );
    } catch {
      // If foto column doesn't exist, query without it
      [rows] = await pool.query<RowDataPacket[]>(
        `SELECT u.id, u.username, u.nama_lengkap, u.email, u.role, u.status, u.tim_id, t.nama as tim_nama 
         FROM users u 
         LEFT JOIN tim t ON u.tim_id = t.id 
         WHERE u.id = ?`,
        [auth.id]
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT update profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const auth = JSON.parse(authCookie.value);
    const body = await request.json();
    const { username, nama_lengkap, email, foto } = body;

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
