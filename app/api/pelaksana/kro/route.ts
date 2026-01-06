import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - List all KRO
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

    const [kro] = await pool.query<RowDataPacket[]>(
      `SELECT id, kode, nama, deskripsi FROM kro ORDER BY kode ASC`
    );

    return NextResponse.json(kro);
  } catch (error) {
    console.error('Error fetching KRO:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
