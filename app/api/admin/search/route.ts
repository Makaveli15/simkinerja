import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query}%`;

    // Search users
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, 'user' as type FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );

    // Search tim
    const [tim] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, 'tim' as type FROM tim WHERE nama LIKE ? OR deskripsi LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );

    // Search mitra
    const [mitra] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, posisi, 'mitra' as type FROM mitra WHERE nama LIKE ? OR posisi LIKE ? OR email LIKE ? LIMIT 5`,
      [searchTerm, searchTerm, searchTerm]
    );

    // Search kro
    const [kro] = await pool.query<RowDataPacket[]>(
      `SELECT id, kode, nama, 'kro' as type FROM kro WHERE kode LIKE ? OR nama LIKE ? LIMIT 5`,
      [searchTerm, searchTerm]
    );

    const results = [
      ...users.map((u: RowDataPacket) => ({ ...u, label: u.username, sublabel: u.email, href: '/admin/users' })),
      ...tim.map((t: RowDataPacket) => ({ ...t, label: t.nama, sublabel: 'Tim', href: '/admin/tim' })),
      ...mitra.map((m: RowDataPacket) => ({ ...m, label: m.nama, sublabel: m.posisi, href: '/admin/mitra' })),
      ...kro.map((k: RowDataPacket) => ({ ...k, label: k.nama, sublabel: k.kode, href: '/admin/kro' })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Gagal mencari data' }, { status: 500 });
  }
}
