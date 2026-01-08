import { NextRequest, NextResponse } from 'next/server';
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

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.*, t.nama as tim_nama 
       FROM users u 
       LEFT JOIN tim t ON u.tim_id = t.id 
       WHERE u.id = ?`,
      [auth.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    delete user.password;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { username, nama_lengkap, email, foto } = await request.json();

    // Check if username already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, auth.id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    // Check if email already exists
    const [existingEmail] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, auth.id]
    );

    if (existingEmail.length > 0) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
    }

    await pool.query(
      'UPDATE users SET username = ?, nama_lengkap = ?, email = ?, foto = ? WHERE id = ?',
      [username, nama_lengkap || null, email, foto || null, auth.id]
    );

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
