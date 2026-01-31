import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

// GET - Get dokumen output for review (pimpinan)
// Workflow:
// - Draft: Pimpinan provides feedback after Kesubag review
// - Final (minta_validasi=1 + validasi_kesubag=valid): Pimpinan validates and can "sahkan"
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    // Using correct column names from database after migration
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
        d.draft_feedback_pimpinan,
        d.draft_reviewed_by_pimpinan,
        d.draft_reviewed_at_pimpinan,
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
        -- Draft yang sudah diterima kesubag (menunggu atau sudah ada feedback pimpinan)
        (d.tipe_dokumen = 'draft' AND d.draft_status_kesubag = 'reviewed')
        OR
        -- Final yang sudah divalidasi kesubag (valid atau tidak_valid yang sudah pernah sampai pimpinan)
        (d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND d.validasi_kesubag = 'valid')
        OR
        -- Dokumen yang sudah disahkan (untuk histori)
        (d.status_final = 'disahkan')
      )
    `;

    const queryParams: (string | number)[] = [];

    if (kegiatan_id) {
      query += ' AND d.kegiatan_id = ?';
      queryParams.push(kegiatan_id);
    }

    // Order: pending final validation from kesubag first, then drafts, then by date
    query += ` ORDER BY 
      CASE 
        WHEN d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND d.validasi_kesubag = 'valid' AND d.validasi_pimpinan = 'pending' THEN 0
        WHEN d.tipe_dokumen = 'draft' AND d.draft_status_kesubag = 'reviewed' AND d.draft_feedback_pimpinan IS NULL THEN 1
        ELSE 2 
      END,
      d.uploaded_at DESC`;

    const [dokumen] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Get summary counts - hanya dokumen yang sudah diteruskan kesubag
    const [summary] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tipe_dokumen = 'draft' AND draft_status_kesubag = 'reviewed' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN tipe_dokumen = 'final' AND minta_validasi = 1 AND validasi_kesubag = 'valid' THEN 1 ELSE 0 END) as final_count,
        SUM(CASE WHEN minta_validasi = 1 AND validasi_kesubag = 'valid' AND validasi_pimpinan = 'pending' THEN 1 ELSE 0 END) as menunggu_validasi_akhir,
        SUM(CASE WHEN status_final = 'disahkan' THEN 1 ELSE 0 END) as disahkan_count,
        SUM(CASE WHEN tipe_dokumen = 'draft' AND draft_status_kesubag = 'reviewed' AND draft_feedback_pimpinan IS NULL THEN 1 ELSE 0 END) as draft_menunggu_feedback
      FROM dokumen_output
      WHERE (
        (tipe_dokumen = 'draft' AND draft_status_kesubag = 'reviewed')
        OR (tipe_dokumen = 'final' AND minta_validasi = 1 AND validasi_kesubag = 'valid')
        OR (status_final = 'disahkan')
      )
    `);

    return NextResponse.json({ 
      dokumen,
      summary: summary[0] || { total: 0, draft_count: 0, final_count: 0, menunggu_validasi_akhir: 0, disahkan_count: 0 }
    });
  } catch (error) {
    console.error('Error fetching dokumen for review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Review/Validate dokumen (pimpinan only)
// Workflows:
// 1. Draft feedback: Pimpinan provides feedback on draft already reviewed by kesubag
// 2. Final validation: Pimpinan validates final document and can "sahkan"
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(authCookie.value);
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden - Only pimpinan can review' }, { status: 403 });
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

    // Get kegiatan name for notification
    const [kegiatanInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama FROM kegiatan WHERE id = ?',
      [dokumen.kegiatan_id]
    );
    const kegiatanNama = kegiatanInfo[0]?.nama || 'Kegiatan';

    // Handle "sahkan" action for final validated documents
    if (action === 'sahkan') {
      if (!isFinalValidation) {
        return NextResponse.json({ error: 'Hanya dokumen final dengan minta validasi yang dapat disahkan' }, { status: 400 });
      }

      // Must be already validated by pimpinan
      if (dokumen.validasi_pimpinan !== 'valid') {
        return NextResponse.json({ error: 'Dokumen harus divalidasi terlebih dahulu sebelum disahkan' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET status_final = 'disahkan'
        WHERE id = ?
      `, [id]);

      // Update kegiatan status_verifikasi
      await pool.query(
        'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
        ['valid', dokumen.kegiatan_id]
      );

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: '🏆 Dokumen Telah Disahkan',
        message: `Dokumen "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" telah resmi disahkan oleh Pimpinan.`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'kegiatan'
      });

      return NextResponse.json({
        message: 'Dokumen berhasil disahkan',
        success: true
      });
    }

    // Handle final validation (valid/tidak_valid)
    if (isFinalValidation && (action === 'valid' || action === 'tidak_valid')) {
      if (dokumen.validasi_kesubag !== 'valid') {
        return NextResponse.json({ error: 'Dokumen harus divalidasi oleh Kesubag terlebih dahulu' }, { status: 400 });
      }

      if (action === 'tidak_valid' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan validasi' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          validasi_pimpinan = ?,
          validasi_feedback_pimpinan = ?,
          validasi_by_pimpinan = ?,
          validasi_at_pimpinan = NOW(),
          status_final = ?,
          tanggal_disahkan = ${action === 'valid' ? 'NOW()' : 'NULL'}
        WHERE id = ?
      `, [
        action, 
        catatan || null, 
        payload.id, 
        action === 'valid' ? 'disahkan' : 'revisi',  // Jika valid langsung disahkan
        id
      ]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'valid' ? '🏆 Dokumen Disahkan!' : '❌ Dokumen Invalid (Pimpinan)',
        message: action === 'valid' 
          ? `Dokumen "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" telah divalidasi dan disahkan oleh Pimpinan.`
          : `Dokumen "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" tidak valid. ${catatan ? 'Alasan: ' + catatan : ''}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'kegiatan'
      });

      // Update kegiatan status
      if (action === 'valid') {
        // Jika valid, update status kegiatan ke valid
        await pool.query(
          'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
          ['valid', dokumen.kegiatan_id]
        );
      } else {
        // Jika invalid, set kegiatan status to revisi
        await pool.query(
          'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
          ['revisi', dokumen.kegiatan_id]
        );
      }

      return NextResponse.json({
        message: action === 'valid' ? 'Dokumen berhasil divalidasi' : 'Dokumen ditolak',
        success: true
      });
    }

    // Handle draft feedback (for drafts reviewed by kesubag)
    if (isDraft && action === 'draft_feedback') {
      // Check if kesubag has reviewed
      if (!dokumen.draft_status_kesubag || dokumen.draft_status_kesubag === 'pending') {
        return NextResponse.json({ error: 'Draft harus direview oleh Kesubag terlebih dahulu' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          draft_feedback_pimpinan = ?,
          draft_reviewed_by_pimpinan = ?,
          draft_reviewed_at_pimpinan = NOW()
        WHERE id = ?
      `, [catatan || 'Reviewed', payload.id, id]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: '💬 Feedback Draft dari Pimpinan',
        message: `Pimpinan memberikan feedback untuk draft "${dokumen.nama_file}" pada kegiatan "${kegiatanNama}".${catatan ? ' Catatan: ' + catatan : ''}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'kegiatan'
      });

      return NextResponse.json({
        message: 'Feedback draft berhasil disimpan',
        success: true
      });
    }

    // Handle legacy draft feedback (diterima/ditolak for drafts)
    if (isDraft && (action === 'diterima' || action === 'ditolak')) {
      // Check if kesubag has reviewed
      if (dokumen.draft_status_kesubag !== 'reviewed') {
        return NextResponse.json({ error: 'Draft harus direview oleh Kesubag terlebih dahulu' }, { status: 400 });
      }

      if (action === 'ditolak' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          draft_feedback_pimpinan = ?,
          draft_reviewed_by_pimpinan = ?,
          draft_reviewed_at_pimpinan = NOW()
        WHERE id = ?
      `, [catatan || 'Diterima', payload.id, id]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'diterima' ? '✅ Draft Disetujui Pimpinan' : '❌ Draft Ditolak Pimpinan',
        message: action === 'diterima' 
          ? `Draft "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" telah disetujui oleh Pimpinan.`
          : `Draft "${dokumen.nama_file}" untuk kegiatan "${kegiatanNama}" ditolak. ${catatan ? 'Catatan: ' + catatan : ''}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'kegiatan'
      });

      return NextResponse.json({
        message: action === 'diterima' ? 'Draft berhasil disetujui' : 'Draft ditolak',
        success: true
      });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Error reviewing dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
