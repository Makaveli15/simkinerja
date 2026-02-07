import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

// POST - PPK approve/reject kegiatan
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, catatan } = body;

    if (!action || !['approve', 'reject', 'revisi'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action harus berupa approve, reject, atau revisi' 
      }, { status: 400 });
    }

    // Get PPK info
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT nama_lengkap FROM users WHERE id = ?',
      [payload.id]
    );

    const ppkNama = userRows[0]?.nama_lengkap || 'PPK';

    await connection.beginTransaction();

    // Get kegiatan and verify it's pending PPK approval
    const [kegiatanRows] = await connection.query<RowDataPacket[]>(`
      SELECT ko.*, 
        u.id as pelaksana_id, 
        u.nama_lengkap as pelaksana_nama,
        t.nama as tim_nama
      FROM kegiatan ko
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE ko.id = ?
    `, [id]);

    if (kegiatanRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const kegiatan = kegiatanRows[0];

    // Verify status is pending for PPK approval
    if (kegiatan.status_pengajuan !== 'review_ppk') {
      await connection.rollback();
      return NextResponse.json({ 
        error: 'Kegiatan tidak dalam status menunggu persetujuan PPK' 
      }, { status: 400 });
    }

    let newStatus: string = '';
    let notificationTitle: string = '';
    let notificationMessage: string = '';

    if (action === 'approve') {
      // Approve -> move to Kepala review
      newStatus = 'review_kepala';
      notificationTitle = 'Kegiatan Disetujui PPK';
      notificationMessage = `Kegiatan "${kegiatan.nama}" telah disetujui oleh PPK ${ppkNama} dan menunggu persetujuan Kepala.`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          approved_by_ppk = ?,
          tanggal_approval_ppk = NOW(),
          catatan_ppk = ?
        WHERE id = ?
      `, [newStatus, payload.id, catatan || null, id]);

      // Notify pelaksana
      if (kegiatan.pelaksana_id) {
        await createNotification({
          userId: kegiatan.pelaksana_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }

      // Notify all Kepala/Pimpinan users
      const [pimpinanUsers] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE role = "pimpinan" AND status = "active"'
      );

      for (const pimpinan of pimpinanUsers) {
        await createNotification({
          userId: pimpinan.id,
          title: 'Kegiatan Menunggu Persetujuan Akhir',
          message: `Kegiatan "${kegiatan.nama}" dari Tim ${kegiatan.tim_nama || ''} menunggu persetujuan akhir Anda.`,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }

    } else if (action === 'reject') {
      // Reject -> back to draft
      newStatus = 'ditolak';
      notificationTitle = 'Kegiatan Ditolak PPK';
      notificationMessage = `Kegiatan "${kegiatan.nama}" ditolak oleh PPK ${ppkNama}. Alasan: ${catatan || 'Tidak ada catatan'}`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          approved_by_ppk = ?,
          tanggal_approval_ppk = NOW(),
          catatan_ppk = ?
        WHERE id = ?
      `, [newStatus, payload.id, catatan || null, id]);

      // Notify pelaksana
      if (kegiatan.pelaksana_id) {
        await createNotification({
          userId: kegiatan.pelaksana_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }

      // Notify koordinator who approved it
      if (kegiatan.approved_by_koordinator) {
        await createNotification({
          userId: kegiatan.approved_by_koordinator,
          title: 'Kegiatan Ditolak oleh PPK',
          message: `Kegiatan "${kegiatan.nama}" yang Anda setujui telah ditolak oleh PPK. Alasan: ${catatan || 'Tidak ada catatan'}`,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }

    } else if (action === 'revisi') {
      // Request revision
      newStatus = 'revisi';
      notificationTitle = 'Kegiatan Perlu Revisi';
      notificationMessage = `Kegiatan "${kegiatan.nama}" perlu direvisi. Catatan dari PPK ${ppkNama}: ${catatan || 'Tidak ada catatan'}`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          catatan_ppk = ?
        WHERE id = ?
      `, [newStatus, catatan || null, id]);

      // Notify pelaksana
      if (kegiatan.pelaksana_id) {
        await createNotification({
          userId: kegiatan.pelaksana_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }
    }

    // Insert into approval history
    await connection.query(`
      INSERT INTO approval_history (kegiatan_id, user_id, role_approver, action, catatan)
      VALUES (?, ?, 'ppk', ?, ?)
    `, [id, payload.id, action, catatan || null]);

    await connection.commit();

    return NextResponse.json({
      message: action === 'approve' 
        ? 'Kegiatan berhasil disetujui dan diteruskan ke Kepala'
        : action === 'reject'
        ? 'Kegiatan berhasil ditolak'
        : 'Permintaan revisi berhasil dikirim',
      status_pengajuan: newStatus
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    connection.release();
  }
}
