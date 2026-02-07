import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get kegiatan detail for koordinator
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get koordinator's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ 
        error: 'Koordinator belum ditugaskan ke tim manapun' 
      }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

    // Get kegiatan detail
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.*,
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        u.nama_lengkap as pelaksana_nama,
        u.email as pelaksana_email,
        approver_koordinator.nama_lengkap as approved_by_koordinator_nama,
        approver_ppk.nama_lengkap as approved_by_ppk_nama,
        approver_kepala.nama_lengkap as approved_by_kepala_nama,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN users approver_koordinator ON ko.approved_by_koordinator = approver_koordinator.id
      LEFT JOIN users approver_ppk ON ko.approved_by_ppk = approver_ppk.id
      LEFT JOIN users approver_kepala ON ko.approved_by_kepala = approver_kepala.id
      WHERE ko.id = ? AND ko.tim_id = ?
    `, [id, timId]);

    if (kegiatanRows.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan atau bukan bagian dari tim Anda' }, { status: 404 });
    }

    // Get approval history if exists
    const [approvalHistory] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ah.*,
        u.nama_lengkap as approver_nama,
        u.role as approver_role
      FROM approval_history ah
      LEFT JOIN users u ON ah.user_id = u.id
      WHERE ah.kegiatan_id = ?
      ORDER BY ah.created_at DESC
    `, [id]);

    return NextResponse.json({
      kegiatan: kegiatanRows[0],
      approval_history: approvalHistory
    });
  } catch (error) {
    console.error('Error fetching kegiatan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
