import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

const DEFAULT_PASSWORD = 'BPS5305';

// GET - List all users
export async function GET() {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.nama_lengkap, u.email, u.role, u.status, u.tim_id, t.nama as tim_nama, u.created_at 
       FROM users u 
       LEFT JOIN tim t ON u.tim_id = t.id 
       ORDER BY u.id DESC`
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username, nama_lengkap, email, role, tim_id } = body;

    if (!username || !email || !role) {
      return NextResponse.json({ error: 'Username, email, dan role wajib diisi' }, { status: 400 });
    }

    const validRoles = ['admin', 'pimpinan', 'pelaksana'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    // Tim hanya wajib untuk pelaksana
    if (role === 'pelaksana' && !tim_id) {
      return NextResponse.json({ error: 'Tim wajib dipilih untuk pelaksana' }, { status: 400 });
    }

    // Use default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const [result]: any = await pool.execute(
      'INSERT INTO users (username, nama_lengkap, email, password, role, status, tim_id, is_first_login) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [username, nama_lengkap || null, email, hashedPassword, role, 'aktif', role === 'pelaksana' ? tim_id : null]
    );

    return NextResponse.json({ id: result.insertId, message: 'User berhasil dibuat dengan password default BPS5305' }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Username atau email sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, username, email, password, role, tim_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    // Tim hanya wajib untuk pelaksana
    if (role === 'pelaksana' && !tim_id) {
      return NextResponse.json({ error: 'Tim wajib dipilih untuk pelaksana' }, { status: 400 });
    }

    let query = 'UPDATE users SET username = ?, email = ?, role = ?, tim_id = ?';
    let params: any[] = [username, email, role, role === 'pelaksana' ? tim_id : null];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    return NextResponse.json({ message: 'User berhasil diupdate' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Username atau email sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Toggle status or reset password
export async function PATCH(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID dan action wajib diisi' }, { status: 400 });
    }

    // Prevent actions on self
    if (parseInt(id) === admin.id) {
      return NextResponse.json({ error: 'Tidak dapat melakukan aksi pada akun sendiri' }, { status: 400 });
    }

    if (action === 'toggle_status') {
      // Get current status
      const [rows]: any = await pool.execute('SELECT status FROM users WHERE id = ?', [id]);
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }
      const currentStatus = rows[0].status;
      const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';
      
      await pool.execute('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);
      
      return NextResponse.json({ message: `User berhasil di${newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`, status: newStatus });
    }

    if (action === 'reset_password') {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await pool.execute('UPDATE users SET password = ?, is_first_login = 1 WHERE id = ?', [hashedPassword, id]);
      
      return NextResponse.json({ message: `Password berhasil direset ke default (${DEFAULT_PASSWORD})` });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(req: Request) {
  const admin = await getAuthUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    // Prevent deleting self
    if (parseInt(id) === admin.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
