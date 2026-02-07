import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

// POST - Koordinator approve/reject kegiatan
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
    if (!payload || payload.role !== 'koordinator') {
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

    // Get koordinator's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id, nama_lengkap FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ 
        error: 'Koordinator belum ditugaskan ke tim manapun' 
      }, { status: 400 });
    }

    const timId = userRows[0].tim_id;
    const koordinatorNama = userRows[0].nama_lengkap;

    await connection.beginTransaction();

    // Get kegiatan and verify it belongs to this tim and is pending approval
    const [kegiatanRows] = await connection.query<RowDataPacket[]>(`
      SELECT ko.*, u.id as pelaksana_id, u.nama_lengkap as pelaksana_nama
      FROM kegiatan ko
      LEFT JOIN users u ON ko.created_by = u.id
      WHERE ko.id = ? AND ko.tim_id = ?
    `, [id, timId]);

    if (kegiatanRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ 
        error: 'Kegiatan tidak ditemukan atau bukan bagian dari tim Anda' 
      }, { status: 404 });
    }

    const kegiatan = kegiatanRows[0];

    // Verify status is pending for koordinator approval
    if (!['diajukan', 'review_koordinator'].includes(kegiatan.status_pengajuan)) {
      await connection.rollback();
      return NextResponse.json({ 
        error: 'Kegiatan tidak dalam status menunggu persetujuan koordinator' 
      }, { status: 400 });
    }

    let newStatus: string = '';
    let notificationTitle: string = '';
    let notificationMessage: string = '';

    if (action === 'approve') {
      // Approve -> move to PPK review
      newStatus = 'review_ppk';
      notificationTitle = 'Kegiatan Disetujui Koordinator';
      notificationMessage = `Kegiatan "${kegiatan.nama}" telah disetujui oleh Koordinator ${koordinatorNama} dan menunggu persetujuan PPK.`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          approved_by_koordinator = ?,
          tanggal_approval_koordinator = NOW(),
          catatan_koordinator = ?
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

      // Notify all PPK users
      const [ppkUsers] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE role = "ppk" AND status = "active"'
      );

      for (const ppk of ppkUsers) {
        await createNotification({
          userId: ppk.id,
          title: 'Kegiatan Menunggu Persetujuan',
          message: `Kegiatan "${kegiatan.nama}" dari Tim ${kegiatan.tim_nama || ''} menunggu persetujuan Anda.`,
          type: 'kegiatan',
          referenceId: parseInt(id),
          referenceType: 'kegiatan'
        });
      }

    } else if (action === 'reject') {
      // Reject -> back to draft
      newStatus = 'ditolak';
      notificationTitle = 'Kegiatan Ditolak Koordinator';
      notificationMessage = `Kegiatan "${kegiatan.nama}" ditolak oleh Koordinator ${koordinatorNama}. Alasan: ${catatan || 'Tidak ada catatan'}`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          approved_by_koordinator = ?,
          tanggal_approval_koordinator = NOW(),
          catatan_koordinator = ?
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

    } else if (action === 'revisi') {
      // Request revision
      newStatus = 'revisi';
      notificationTitle = 'Kegiatan Perlu Revisi';
      notificationMessage = `Kegiatan "${kegiatan.nama}" perlu direvisi. Catatan dari Koordinator ${koordinatorNama}: ${catatan || 'Tidak ada catatan'}`;

      await connection.query(`
        UPDATE kegiatan 
        SET 
          status_pengajuan = ?,
          catatan_koordinator = ?
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
      VALUES (?, ?, 'koordinator', ?, ?)
    `, [id, payload.id, action, catatan || null]);

    await connection.commit();

    return NextResponse.json({
      message: action === 'approve' 
        ? 'Kegiatan berhasil disetujui dan diteruskan ke PPK'
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
