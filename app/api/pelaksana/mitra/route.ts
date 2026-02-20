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

    // If dates are provided, check mitra availability
    if (tanggalMulai && tanggalSelesai) {
      // Mitra tidak tersedia jika sudah dipilih pada kegiatan yang belum selesai
      // Query lebih sederhana: cek apakah mitra sudah ada di kegiatan yang statusnya bukan 'selesai'
      let excludeCondition = '';
      const params: (string | number)[] = [];

      if (excludeKegiatanId) {
        excludeCondition = 'AND km.kegiatan_id != ?';
        params.push(parseInt(excludeKegiatanId));
      }

      const query = `
        SELECT 
          m.id, 
          m.nama, 
          m.posisi, 
          m.alamat, 
          m.no_telp, 
          m.sobat_id,
          busy.kegiatan_id as busy_kegiatan_id,
          busy.kegiatan_nama as busy_kegiatan_nama,
          busy.tanggal_mulai as busy_mulai,
          busy.tanggal_selesai as busy_selesai
        FROM mitra m
        LEFT JOIN (
          SELECT 
            km.mitra_id,
            k.id as kegiatan_id,
            k.nama as kegiatan_nama,
            k.tanggal_mulai,
            k.tanggal_selesai
          FROM kegiatan_mitra km
          INNER JOIN kegiatan k ON km.kegiatan_id = k.id
          WHERE k.status != 'selesai'
          ${excludeCondition}
        ) busy ON m.id = busy.mitra_id
        ORDER BY m.nama ASC
      `;

      const [mitra] = await pool.query<RowDataPacket[]>(query, params);

      // Mark unavailable mitra
      const mitraWithAvailability = mitra.map((m: RowDataPacket) => ({
        id: m.id,
        nama: m.nama,
        posisi: m.posisi,
        alamat: m.alamat,
        no_telp: m.no_telp,
        sobat_id: m.sobat_id,
        available: m.busy_kegiatan_id === null,
        busy_info: m.busy_kegiatan_id !== null ? {
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
