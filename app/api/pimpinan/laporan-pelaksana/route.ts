import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface AuthData {
  id: number;
  role: string;
}

async function getAuthFromCookie(): Promise<AuthData | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  
  if (!authCookie) return null;
  
  try {
    const auth = JSON.parse(authCookie.value) as AuthData;
    return auth;
  } catch {
    return null;
  }
}

// GET - List all laporan from pelaksana
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun') || new Date().getFullYear().toString();
    const bulan = searchParams.get('bulan');
    const tim_id = searchParams.get('tim_id');

    let query = `
      SELECT 
        ul.id, 
        ul.judul, 
        ul.periode_bulan, 
        ul.periode_tahun, 
        ul.file_path, 
        ul.file_name, 
        ul.keterangan, 
        ul.created_at,
        ul.user_id,
        u.nama_lengkap as user_nama,
        t.nama as tim_nama
      FROM upload_laporan ul
      JOIN users u ON ul.user_id = u.id
      LEFT JOIN tim t ON u.tim_id = t.id
      WHERE ul.periode_tahun = ?
    `;
    const params: (number | string)[] = [tahun];

    if (bulan) {
      query += ` AND ul.periode_bulan = ?`;
      params.push(bulan);
    }

    if (tim_id) {
      query += ` AND u.tim_id = ?`;
      params.push(tim_id);
    }

    query += ` ORDER BY ul.created_at DESC`;

    const [laporan] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json(laporan);
  } catch (error) {
    console.error('Error fetching laporan pelaksana:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
