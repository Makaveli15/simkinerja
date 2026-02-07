import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

// GET - Get PPK profile
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user profile
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, username, email, nama_lengkap, role, status, foto
      FROM users
      WHERE id = ?
    `, [payload.id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update PPK profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'ppk') {
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

    // Update profile
    await pool.query(
      'UPDATE users SET username = ?, nama_lengkap = ?, email = ?, foto = ? WHERE id = ?',
      [username, nama_lengkap || null, email, foto || null, auth.id]
    );

    // Fetch updated profile
    const [updatedRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, nama_lengkap, role, status, foto FROM users WHERE id = ?',
      [auth.id]
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
