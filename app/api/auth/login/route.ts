import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json({ error: 'Masukkan username dan password' }, { status: 400 });
    }

    const [rows]: any = await pool.execute(
      'SELECT id, username, password, role, status, is_first_login FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 401 });
    }

    const user = rows[0];

    // Check if user is active (support both 'active' and 'aktif')
    if (user.status !== 'active' && user.status !== 'aktif') {
      return NextResponse.json({ error: 'Akun tidak aktif. Hubungi admin.' }, { status: 403 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    // Allow both admin and pelaksana to login
    if (user.role !== 'admin' && user.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Akses ditolak: role tidak valid' }, { status: 403 });
    }

    const isFirstLogin = user.is_first_login === 1 || user.is_first_login === true;
    const payload = { id: user.id, username: user.username, role: user.role, isFirstLogin };
    const cookieValue = encodeURIComponent(JSON.stringify(payload));
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const cookie = `auth=${cookieValue}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`;

    // Return JSON response with role and isFirstLogin for client-side handling
    return NextResponse.json(
      { message: 'Login berhasil', role: user.role, isFirstLogin },
      { headers: { 'Set-Cookie': cookie } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err?.message }, { status: 500 });
  }
}
