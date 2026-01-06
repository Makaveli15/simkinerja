import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - List all Mitra
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

    const [mitra] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, posisi, alamat, no_telp, sobat_id FROM mitra ORDER BY nama ASC`
    );

    return NextResponse.json(mitra);
  } catch (error) {
    console.error('Error fetching Mitra:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
