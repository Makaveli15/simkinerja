import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get single kegiatan detail for approval
export async function GET(
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
    
    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT 
        k.*,
        t.nama as tim_nama,
        u.username as created_by_nama,
        u.nama_lengkap as pelaksana_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        m.nama as mitra_nama,
        approver.nama_lengkap as approved_by_nama
      FROM kegiatan k
      JOIN tim t ON k.tim_id = t.id
      JOIN users u ON k.created_by = u.id
      LEFT JOIN kro ON k.kro_id = kro.id
      LEFT JOIN mitra m ON k.mitra_id = m.id
      LEFT JOIN users approver ON k.approved_by = approver.id
      WHERE k.id = ?`,
      [id]
    );

    if (kegiatan.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(kegiatan[0]);
  } catch (error) {
    console.error('Error fetching kegiatan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Approve or reject kegiatan
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
    
    if (auth.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, catatan } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action harus "approve" atau "reject"' 
      }, { status: 400 });
    }

    // Check kegiatan exists and is pending approval
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, status_pengajuan, created_by FROM kegiatan WHERE id = ?`,
      [id]
    );

    if (kegiatan.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const kegiatanData = kegiatan[0];

    if (kegiatanData.status_pengajuan !== 'diajukan') {
      return NextResponse.json({ 
        error: `Kegiatan dengan status "${kegiatanData.status_pengajuan}" tidak dapat diproses` 
      }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'disetujui' : 'ditolak';
    const kegiatanStatus = action === 'approve' ? 'berjalan' : 'belum_mulai';

    // Update kegiatan
    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan 
       SET status_pengajuan = ?,
           status = CASE WHEN ? = 'disetujui' THEN 'berjalan' ELSE status END,
           tanggal_approval = NOW(),
           approved_by = ?,
           catatan_approval = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newStatus, newStatus, auth.id, catatan || null, id]
    );

    // Create notification for pelaksana
    try {
      const notifType = action === 'approve' ? 'approval_accepted' : 'approval_rejected';
      const notifTitle = action === 'approve' ? 'Kegiatan Disetujui' : 'Kegiatan Ditolak';
      const notifMessage = action === 'approve' 
        ? `Kegiatan "${kegiatanData.nama}" telah disetujui oleh Pimpinan. Kegiatan dapat dimulai.`
        : `Kegiatan "${kegiatanData.nama}" ditolak oleh Pimpinan.${catatan ? ` Catatan: ${catatan}` : ''}`;

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (?, ?, ?, ?, ?, 'kegiatan')`,
        [kegiatanData.created_by, notifType, notifTitle, notifMessage, id]
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return NextResponse.json({ 
      message: action === 'approve' 
        ? 'Kegiatan berhasil disetujui' 
        : 'Kegiatan berhasil ditolak',
      status_pengajuan: newStatus,
    });
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
