import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

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
        ko.*,
        t.nama as tim_nama,
        u.username as created_by_nama,
        u.nama_lengkap as pelaksana_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        koordinator.nama_lengkap as approved_by_koordinator_nama,
        ppk.nama_lengkap as approved_by_ppk_nama,
        kepala.nama_lengkap as approved_by_kepala_nama
      FROM kegiatan ko
      JOIN tim t ON ko.tim_id = t.id
      JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users koordinator ON ko.approved_by_koordinator = koordinator.id
      LEFT JOIN users ppk ON ko.approved_by_ppk = ppk.id
      LEFT JOIN users kepala ON ko.approved_by_kepala = kepala.id
      WHERE ko.id = ?`,
      [id]
    );

    if (kegiatan.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Get approval history
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
      ...kegiatan[0],
      approval_history: approvalHistory
    });
  } catch (error) {
    console.error('Error fetching kegiatan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Kepala/Pimpinan approve or reject kegiatan (Final approval stage)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  
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

    if (!['approve', 'reject', 'revisi'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action harus "approve", "reject", atau "revisi"' 
      }, { status: 400 });
    }

    // Get Kepala info
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT nama_lengkap FROM users WHERE id = ?',
      [auth.id]
    );
    const kepalaNama = userRows[0]?.nama_lengkap || 'Kepala';

    await connection.beginTransaction();

    // Check kegiatan exists and is pending Kepala approval
    const [kegiatan] = await connection.query<RowDataPacket[]>(
      `SELECT ko.*, 
        u.id as pelaksana_id, 
        u.nama_lengkap as pelaksana_nama,
        t.nama as tim_nama
      FROM kegiatan ko
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE ko.id = ?`,
      [id]
    );

    if (kegiatan.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const kegiatanData = kegiatan[0];

    // Verify status is pending for Kepala approval (review_kepala)
    if (kegiatanData.status_pengajuan !== 'review_kepala') {
      await connection.rollback();
      return NextResponse.json({ 
        error: `Kegiatan dengan status "${kegiatanData.status_pengajuan}" tidak dapat diproses. Kegiatan harus dalam status "review_kepala" untuk persetujuan akhir.` 
      }, { status: 400 });
    }

    let newStatusPengajuan: string = '';
    let newStatusKegiatan: string = kegiatanData.status;
    let notificationTitle: string = '';
    let notificationMessage: string = '';

    if (action === 'approve') {
      // Final approval - kegiatan can now run
      newStatusPengajuan = 'disetujui';
      newStatusKegiatan = 'berjalan';
      notificationTitle = 'Kegiatan Disetujui - Dapat Dimulai';
      notificationMessage = `Kegiatan "${kegiatanData.nama}" telah disetujui oleh Kepala ${kepalaNama}. Kegiatan dapat segera dimulai.`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          status = ?,
          approved_by_kepala = ?,
          tanggal_approval_kepala = NOW(),
          catatan_kepala = ?,
          tanggal_approval = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `, [newStatusPengajuan, newStatusKegiatan, auth.id, catatan || null, id]);

    } else if (action === 'reject') {
      // Reject - kegiatan is rejected
      newStatusPengajuan = 'ditolak';
      notificationTitle = 'Kegiatan Ditolak oleh Kepala';
      notificationMessage = `Kegiatan "${kegiatanData.nama}" ditolak oleh Kepala ${kepalaNama}. Alasan: ${catatan || 'Tidak ada catatan'}`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          approved_by_kepala = ?,
          tanggal_approval_kepala = NOW(),
          catatan_kepala = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [newStatusPengajuan, auth.id, catatan || null, id]);

    } else if (action === 'revisi') {
      // Request revision - back to pelaksana
      newStatusPengajuan = 'revisi';
      notificationTitle = 'Kegiatan Perlu Revisi';
      notificationMessage = `Kegiatan "${kegiatanData.nama}" perlu direvisi. Catatan dari Kepala ${kepalaNama}: ${catatan || 'Tidak ada catatan'}`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          catatan_kepala = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [newStatusPengajuan, catatan || null, id]);
    }

    // Insert into approval history
    await connection.query(`
      INSERT INTO approval_history (kegiatan_id, user_id, role_approver, action, catatan)
      VALUES (?, ?, 'kepala', ?, ?)
    `, [id, auth.id, action, catatan || null]);

    // Create notification for pelaksana
    if (kegiatanData.pelaksana_id) {
      await createNotification({
        userId: kegiatanData.pelaksana_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'kegiatan',
        referenceId: parseInt(id),
        referenceType: 'kegiatan'
      });
    }

    // If rejected or revision, also notify koordinator and PPK who approved
    if (action !== 'approve') {
      if (kegiatanData.approved_by_koordinator) {
        await createNotification({
          userId: kegiatanData.approved_by_koordinator,
          title: action === 'reject' ? 'Kegiatan Ditolak oleh Kepala' : 'Kegiatan Perlu Revisi',
          message: `Kegiatan "${kegiatanData.nama}" yang Anda setujui telah ${action === 'reject' ? 'ditolak' : 'diminta revisi'} oleh Kepala.`,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }
      
      if (kegiatanData.approved_by_ppk) {
        await createNotification({
          userId: kegiatanData.approved_by_ppk,
          title: action === 'reject' ? 'Kegiatan Ditolak oleh Kepala' : 'Kegiatan Perlu Revisi',
          message: `Kegiatan "${kegiatanData.nama}" yang Anda setujui telah ${action === 'reject' ? 'ditolak' : 'diminta revisi'} oleh Kepala.`,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }
    }

    await connection.commit();

    return NextResponse.json({ 
      message: action === 'approve' 
        ? 'Kegiatan berhasil disetujui dan dapat segera dimulai' 
        : action === 'reject'
        ? 'Kegiatan berhasil ditolak'
        : 'Permintaan revisi berhasil dikirim',
      status_pengajuan: newStatusPengajuan,
      status: newStatusKegiatan
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    connection.release();
  }
}
