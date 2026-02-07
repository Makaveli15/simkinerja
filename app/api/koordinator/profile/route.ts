import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';

// GET - Get koordinator profile
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user profile with tim info
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id, u.username, u.email, u.nama_lengkap, u.role, u.status, u.foto, u.tim_id,
        t.nama as tim_nama
      FROM users u
      LEFT JOIN tim t ON u.tim_id = t.id
      WHERE u.id = ?
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

// PUT - Update koordinator profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { nama, email, foto } = body;

    // Validate required fields
    if (!nama) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    // Check if email is already taken by another user (if email provided)
    if (email) {
      const [existingEmails] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, auth.id]
      );
      
      if (existingEmails.length > 0) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
      }
    }

    // Update profile (only columns that exist in users table)
    await pool.query(
      'UPDATE users SET nama_lengkap = ?, email = ?, foto = ? WHERE id = ?',
      [nama, email || null, foto || null, auth.id]
    );

    // Fetch updated profile
    const [updatedRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id, u.username, u.email, u.nama_lengkap, u.role, u.status, u.foto, u.tim_id,
        t.nama as tim_nama
      FROM users u
      LEFT JOIN tim t ON u.tim_id = t.id
      WHERE u.id = ?
    `, [auth.id]);

    // Dispatch event for layout to update
    return NextResponse.json({
      message: 'Profile updated successfully',
      ...updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
