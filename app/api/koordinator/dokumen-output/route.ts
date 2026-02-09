import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification, createNotificationForAllPimpinan } from '@/lib/services/notificationService';

// GET - Get dokumen output for review (koordinator)
// Workflow:
// - Draft: Koordinator reviews drafts uploaded by pelaksana
// - Final (minta_validasi=1): Koordinator validates first before pimpinan
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    // Query dokumen yang perlu direview koordinator
    let query = `
      SELECT 
        d.id,
        d.nama_file,
        d.path_file,
        d.tipe_dokumen,
        d.deskripsi,
        d.ukuran_file,
        d.tipe_file,
        d.uploaded_at,
        d.uploaded_by,
        d.kegiatan_id,
        d.minta_validasi,
        d.minta_validasi_at,
        d.status_final,
        -- Draft review columns
        d.draft_status_kesubag,
        d.draft_feedback_kesubag,
        d.draft_reviewed_by_kesubag,
        d.draft_reviewed_at_kesubag,
        -- Final validation columns
        d.validasi_kesubag,
        d.validasi_feedback_kesubag,
        d.validasi_by_kesubag,
        d.validasi_at_kesubag,
        d.validasi_pimpinan,
        d.validasi_feedback_pimpinan,
        d.validasi_by_pimpinan,
        d.validasi_at_pimpinan,
        -- Joined data
        u.nama_lengkap as uploaded_by_nama,
        u.username as uploaded_by_username,
        vk.nama_lengkap as validated_by_kesubag_nama,
        vp.nama_lengkap as validated_by_pimpinan_nama,
        ko.nama as kegiatan_nama,
        ko.status as kegiatan_status,
        t.nama as tim_nama
      FROM dokumen_output d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users vk ON d.validasi_by_kesubag = vk.id
      LEFT JOIN users vp ON d.validasi_by_pimpinan = vp.id
      JOIN kegiatan ko ON d.kegiatan_id = ko.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE (
        -- Draft yang menunggu review (draft_status_kesubag = 'pending' atau NULL, atau status_review = 'pending')
        (d.tipe_dokumen = 'draft' AND (d.draft_status_kesubag = 'pending' OR d.draft_status_kesubag IS NULL OR d.status_review = 'pending'))
        OR
        -- Draft yang sudah direview (untuk histori) - diterima
        (d.tipe_dokumen = 'draft' AND (d.draft_status_kesubag = 'diterima' OR d.status_review = 'diterima'))
        OR
        -- Final yang minta validasi dan belum divalidasi koordinator
        (d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND (d.validasi_kesubag = 'pending' OR d.validasi_kesubag IS NULL))
        OR
        -- Final yang sudah divalidasi koordinator (untuk histori)
        (d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND d.validasi_kesubag IN ('valid', 'tidak_valid'))
      )
    `;

    const queryParams: (string | number)[] = [];

    if (kegiatan_id) {
      query += ' AND d.kegiatan_id = ?';
      queryParams.push(kegiatan_id);
    }

    // Order: pending first, then by date
    query += ` ORDER BY 
      CASE 
        WHEN d.tipe_dokumen = 'draft' AND (d.draft_status_kesubag = 'pending' OR d.draft_status_kesubag IS NULL OR d.status_review = 'pending') THEN 0
        WHEN d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND (d.validasi_kesubag = 'pending' OR d.validasi_kesubag IS NULL) THEN 1
        ELSE 2 
      END,
      d.uploaded_at DESC`;

    const [dokumen] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Get summary counts - handle both old and new column names
    const [summary] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tipe_dokumen = 'draft' AND (COALESCE(draft_status_kesubag, status_review) = 'pending' OR (draft_status_kesubag IS NULL AND status_review IS NULL)) THEN 1 ELSE 0 END) as draft_pending,
        SUM(CASE WHEN tipe_dokumen = 'draft' AND (draft_status_kesubag = 'diterima' OR status_review = 'diterima') THEN 1 ELSE 0 END) as draft_reviewed,
        SUM(CASE WHEN tipe_dokumen = 'final' AND minta_validasi = 1 AND (validasi_kesubag = 'pending' OR validasi_kesubag IS NULL) THEN 1 ELSE 0 END) as final_pending,
        SUM(CASE WHEN tipe_dokumen = 'final' AND minta_validasi = 1 AND validasi_kesubag = 'valid' THEN 1 ELSE 0 END) as final_valid,
        SUM(CASE WHEN tipe_dokumen = 'final' AND minta_validasi = 1 AND validasi_kesubag = 'tidak_valid' THEN 1 ELSE 0 END) as final_tidak_valid
      FROM dokumen_output
      WHERE (
        (tipe_dokumen = 'draft')
        OR (tipe_dokumen = 'final' AND minta_validasi = 1)
      )
    `);

    return NextResponse.json({ 
      dokumen,
      summary: summary[0] || { 
        total: 0, 
        draft_pending: 0, 
        draft_reviewed: 0, 
        final_pending: 0, 
        final_valid: 0,
        final_tidak_valid: 0
      }
    });
  } catch (error) {
    console.error('Error fetching dokumen for review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Review/Validate dokumen (koordinator only)
// Workflows:
// 1. Draft review: Koordinator reviews draft and provides feedback
// 2. Final validation: Koordinator validates final document before pimpinan
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden - Only koordinator can review' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, catatan } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Check if dokumen exists
    const [dokumenCheck] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM dokumen_output WHERE id = ?',
      [id]
    );

    if (dokumenCheck.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    const dokumen = dokumenCheck[0];
    const isDraft = dokumen.tipe_dokumen === 'draft';
    const isFinalValidation = dokumen.tipe_dokumen === 'final' && dokumen.minta_validasi === 1;

    // Get kegiatan info for notification
    const [kegiatanInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama FROM kegiatan WHERE id = ?',
      [dokumen.kegiatan_id]
    );
    const kegiatanNama = kegiatanInfo[0]?.nama || 'Kegiatan';

    // Get koordinator name
    const [koordinatorInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama_lengkap FROM users WHERE id = ?',
      [payload.id]
    );
    const koordinatorNama = koordinatorInfo[0]?.nama_lengkap || 'Koordinator';

    // Handle draft review (reviewed/rejected mapped to reviewed/revisi for DB enum)
    if (isDraft && (action === 'reviewed' || action === 'rejected')) {
      if (action === 'rejected' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan draft' }, { status: 400 });
      }

      // Update draft status - use correct enum values: 'pending', 'reviewed', 'revisi'
      const dbStatus = action === 'reviewed' ? 'reviewed' : 'revisi';
      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          draft_status_kesubag = ?,
          draft_feedback_kesubag = ?,
          draft_reviewed_by_kesubag = ?,
          draft_reviewed_at_kesubag = NOW()
        WHERE id = ?
      `, [
        dbStatus,
        catatan || null,
        payload.id,
        id
      ]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'reviewed' ? '✅ Draft Diterima Koordinator' : '❌ Draft Ditolak Koordinator',
        message: action === 'reviewed'
          ? `Draft "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" telah direview oleh ${koordinatorNama}.${catatan ? ' Catatan: ' + catatan : ''}`
          : `Draft "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" ditolak oleh ${koordinatorNama}. Alasan: ${catatan}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'kegiatan'
      });

      // If reviewed, notify pimpinan to also review
      if (action === 'reviewed') {
        await createNotificationForAllPimpinan({
          title: '📝 Draft Menunggu Review',
          message: `Draft "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" sudah direview Koordinator. Silakan berikan feedback.`,
          type: 'validasi',
          referenceId: dokumen.kegiatan_id,
          referenceType: 'kegiatan'
        });
      }

      return NextResponse.json({
        message: action === 'reviewed' ? 'Draft berhasil direview' : 'Draft ditolak',
        success: true
      });
    }

    // Handle final validation (valid/tidak_valid)
    if (isFinalValidation && (action === 'valid' || action === 'tidak_valid')) {
      if (action === 'tidak_valid' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan validasi' }, { status: 400 });
      }

      // Update validation status
      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          validasi_kesubag = ?,
          validasi_feedback_kesubag = ?,
          validasi_by_kesubag = ?,
          validasi_at_kesubag = NOW(),
          status_final = ?
        WHERE id = ?
      `, [
        action,
        catatan || null,
        payload.id,
        action === 'valid' ? 'menunggu_pimpinan' : 'revisi',
        id
      ]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'valid' ? '✅ Dokumen Valid (Koordinator)' : '❌ Dokumen Tidak Valid (Koordinator)',
        message: action === 'valid'
          ? `Dokumen "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" telah divalidasi oleh ${koordinatorNama}. Menunggu validasi Pimpinan.`
          : `Dokumen "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" tidak valid. Alasan: ${catatan}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'kegiatan'
      });

      // If valid, notify pimpinan for final validation
      if (action === 'valid') {
        await createNotificationForAllPimpinan({
          title: '📋 Dokumen Menunggu Validasi Akhir',
          message: `Dokumen "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" sudah divalidasi Koordinator. Silakan validasi dan sahkan.`,
          type: 'permintaan_validasi',
          referenceId: dokumen.kegiatan_id,
          referenceType: 'kegiatan'
        });
      }

      // Update kegiatan status if rejected
      if (action === 'tidak_valid') {
        await pool.query(
          'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
          ['revisi', dokumen.kegiatan_id]
        );
      }

      return NextResponse.json({
        message: action === 'valid' ? 'Dokumen berhasil divalidasi' : 'Dokumen tidak valid',
        success: true
      });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Error reviewing dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
