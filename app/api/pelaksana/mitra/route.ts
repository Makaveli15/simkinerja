import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - List all Mitra (with optional filtering for availability)
export async function GET(request: NextRequest) {
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

    // Get filter parameters for availability check
    const { searchParams } = new URL(request.url);
    const tanggalMulai = searchParams.get('tanggal_mulai');
    const tanggalSelesai = searchParams.get('tanggal_selesai');
    const excludeKegiatanId = searchParams.get('exclude_kegiatan_id'); // For update operations

    // If dates are provided, filter out mitra that are already assigned to active kegiatan
    if (tanggalMulai && tanggalSelesai) {
      // Get mitra that are NOT assigned to any kegiatan with overlapping dates
      let query = `
        SELECT m.id, m.nama, m.posisi, m.alamat, m.no_telp, m.sobat_id,
               CASE 
                 WHEN ko.id IS NOT NULL THEN 1 
                 ELSE 0 
               END as is_busy,
               ko.nama as busy_kegiatan_nama,
               ko.tanggal_mulai as busy_mulai,
               ko.tanggal_selesai as busy_selesai
        FROM mitra m
        LEFT JOIN kegiatan_operasional ko ON m.id = ko.mitra_id 
          AND ko.status != 'selesai'
          AND (
            (ko.tanggal_mulai <= ? AND ko.tanggal_selesai >= ?)
            OR (ko.tanggal_mulai <= ? AND ko.tanggal_selesai >= ?)
            OR (ko.tanggal_mulai >= ? AND ko.tanggal_selesai <= ?)
          )`;
      
      const params: (string | number)[] = [
        tanggalSelesai, tanggalMulai,  // Overlap check 1: kegiatan spans across our dates
        tanggalMulai, tanggalMulai,     // Overlap check 2: our start is within kegiatan
        tanggalMulai, tanggalSelesai    // Overlap check 3: kegiatan is within our dates
      ];

      // Exclude specific kegiatan (for update operations)
      if (excludeKegiatanId) {
        query += ` AND ko.id != ?`;
        params.push(parseInt(excludeKegiatanId));
      }

      query += ` ORDER BY m.nama ASC`;

      const [mitra] = await pool.query<RowDataPacket[]>(query, params);

      // Mark unavailable mitra
      const mitraWithAvailability = mitra.map((m: RowDataPacket) => ({
        ...m,
        available: m.is_busy === 0,
        busy_info: m.is_busy === 1 ? {
          kegiatan: m.busy_kegiatan_nama,
          mulai: m.busy_mulai,
          selesai: m.busy_selesai
        } : null
      }));

      return NextResponse.json(mitraWithAvailability);
    }

    // Default: return all mitra without availability info
    const [mitra] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, posisi, alamat, no_telp, sobat_id FROM mitra ORDER BY nama ASC`
    );

    return NextResponse.json(mitra);
  } catch (error) {
    console.error('Error fetching Mitra:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
