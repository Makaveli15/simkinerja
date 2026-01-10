import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// POST - Update raw data fields (output_realisasi, tanggal_realisasi_selesai, status_verifikasi)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Check ownership
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, output_realisasi, tanggal_realisasi_selesai, status_verifikasi FROM kegiatan_operasional WHERE id = ? AND tim_id = ?',
      [id, timId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { output_realisasi, tanggal_realisasi_selesai, status_verifikasi } = body;
    
    const currentData = existing[0];

    // Build update query dynamically based on what's provided
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    // Handle output_realisasi - only update if explicitly provided
    if (output_realisasi !== undefined) {
      updates.push('output_realisasi = ?');
      values.push(output_realisasi !== null ? parseFloat(output_realisasi) : currentData.output_realisasi);
    }

    // Handle tanggal_realisasi_selesai - can be null to clear it
    if (tanggal_realisasi_selesai !== undefined) {
      updates.push('tanggal_realisasi_selesai = ?');
      // If empty string or null, set to NULL in database
      if (tanggal_realisasi_selesai === '' || tanggal_realisasi_selesai === null) {
        values.push(null);
      } else {
        // Format date properly to avoid timezone issues
        const dateValue = tanggal_realisasi_selesai;
        values.push(dateValue);
      }
    }

    // Handle status_verifikasi - only update if explicitly provided
    if (status_verifikasi !== undefined) {
      updates.push('status_verifikasi = ?');
      values.push(status_verifikasi || currentData.status_verifikasi);
    }

    // Always update updated_at
    updates.push('updated_at = NOW()');

    if (updates.length === 1) {
      // Only updated_at, nothing else to update
      return NextResponse.json({ message: 'Tidak ada perubahan' });
    }

    // Add id for WHERE clause
    values.push(id);

    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan_operasional SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('Error updating raw data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
