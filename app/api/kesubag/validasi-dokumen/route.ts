import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

// GET - Get all dokumen for validation
// Workflow: 
// - Draft: Kesubag review → Forward ke Pimpinan untuk feedback
// - Final (minta_validasi=1): Kesubag validasi → Forward ke Pimpinan untuk validasi akhir → Sahkan
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Using correct column names from database after migration
    const [dokumen] = await pool.query<RowDataPacket[]>(`
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
        -- Draft review columns (renamed)
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
        ko.nama as kegiatan_nama,
        t.nama as tim_nama,
        u.nama_lengkap as uploaded_by_nama,
        vk.nama_lengkap as validated_by_kesubag_nama,
        vp.nama_lengkap as validated_by_pimpinan_nama
      FROM dokumen_output d
      LEFT JOIN kegiatan_operasional ko ON d.kegiatan_id = ko.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users vk ON d.validasi_by_kesubag = vk.id
      LEFT JOIN users vp ON d.validasi_by_pimpinan = vp.id
      ORDER BY 
        CASE 
          WHEN d.tipe_dokumen = 'final' AND d.minta_validasi = 1 AND d.validasi_kesubag = 'pending' THEN 0
          WHEN d.tipe_dokumen = 'draft' AND d.draft_status_kesubag = 'pending' THEN 1
          ELSE 2 
        END,
        d.uploaded_at DESC
    `);

    return NextResponse.json({ dokumen });
  } catch (error) {
    console.error('Error fetching dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Validate dokumen
// Two workflows:
// 1. Draft documents: Kesubag reviews (diterima/ditolak) → Forward to Pimpinan for feedback
// 2. Final documents (minta_validasi=1): Kesubag validates → If valid, forward to Pimpinan for final validation
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { dokumenId, action, catatan } = await req.json();

    if (!dokumenId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get dokumen details first
    const [dokumenRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        d.*,
        ko.nama as kegiatan_nama
      FROM dokumen_output d
      LEFT JOIN kegiatan_operasional ko ON d.kegiatan_id = ko.id
      WHERE d.id = ?
    `, [dokumenId]);

    if (dokumenRows.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    const dokumen = dokumenRows[0];
    const isDraft = dokumen.tipe_dokumen === 'draft';
    const isFinalValidation = dokumen.tipe_dokumen === 'final' && dokumen.minta_validasi === 1;

    if (isDraft) {
      // Draft workflow: Kesubag reviews then forward to Pimpinan
      // Accept either 'diterima'/'ditolak' (from frontend) and convert to 'reviewed'/'revisi'
      if (!['diterima', 'ditolak'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action for draft review' }, { status: 400 });
      }

      if (action === 'ditolak' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan' }, { status: 400 });
      }

      const draftStatus = action === 'diterima' ? 'reviewed' : 'revisi';

      // Update draft_status_kesubag for draft review (using correct column names)
      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          draft_status_kesubag = ?,
          draft_feedback_kesubag = ?,
          draft_reviewed_by_kesubag = ?,
          draft_reviewed_at_kesubag = NOW(),
          status_final = ?
        WHERE id = ?
      `, [
        draftStatus, 
        catatan || null, 
        payload.id, 
        action === 'diterima' ? 'menunggu_pimpinan' : 'revisi',
        dokumenId
      ]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'diterima' ? '📋 Draft Direview Kesubag' : '❌ Draft Butuh Revisi',
        message: action === 'diterima' 
          ? `Draft "${dokumen.nama_file}" diterima oleh Kesubag dan diteruskan ke Pimpinan untuk review.`
          : `Draft "${dokumen.nama_file}" ditolak oleh Kesubag. Alasan: ${catatan}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'dokumen'
      });

      // If accepted, forward to pimpinan for feedback
      if (action === 'diterima') {
        const [pimpinanRows] = await pool.query<RowDataPacket[]>(
          "SELECT id FROM users WHERE role = 'pimpinan' AND status = 'aktif'"
        );
        
        for (const pimpinan of pimpinanRows) {
          await createNotification({
            userId: pimpinan.id,
            title: '📋 Draft Menunggu Review',
            message: `Draft "${dokumen.nama_file}" dari kegiatan "${dokumen.kegiatan_nama}" telah direview Kesubag dan menunggu feedback Anda.`,
            type: 'permintaan_validasi',
            referenceId: dokumen.kegiatan_id,
            referenceType: 'dokumen'
          });
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: action === 'diterima' ? 'Draft diterima dan diteruskan ke Pimpinan' : 'Draft ditolak'
      });

    } else if (isFinalValidation) {
      // Final validation workflow: Kesubag validates, then forward to Pimpinan for final validation
      if (!['valid', 'tidak_valid'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action for final validation' }, { status: 400 });
      }

      if (action === 'tidak_valid' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan validasi' }, { status: 400 });
      }

      // Update validasi_kesubag (using correct column names)
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
        dokumenId
      ]);

      // Notify pelaksana
      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'valid' ? '✅ Dokumen Valid (Kesubag)' : '❌ Dokumen Invalid (Kesubag)',
        message: action === 'valid' 
          ? `Dokumen "${dokumen.nama_file}" divalidasi oleh Kesubag dan diteruskan ke Pimpinan untuk validasi akhir.`
          : `Dokumen "${dokumen.nama_file}" tidak valid menurut Kesubag. Alasan: ${catatan}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'dokumen'
      });

      // If valid, forward to pimpinan for final validation
      if (action === 'valid') {
        const [pimpinanRows] = await pool.query<RowDataPacket[]>(
          "SELECT id FROM users WHERE role = 'pimpinan' AND status = 'aktif'"
        );
        
        for (const pimpinan of pimpinanRows) {
          await createNotification({
            userId: pimpinan.id,
            title: '📄 Dokumen Menunggu Validasi Akhir',
            message: `Dokumen "${dokumen.nama_file}" dari kegiatan "${dokumen.kegiatan_nama}" telah divalidasi Kesubag dan menunggu validasi akhir Anda.`,
            type: 'permintaan_validasi',
            referenceId: dokumen.kegiatan_id,
            referenceType: 'dokumen'
          });
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: action === 'valid' ? 'Dokumen valid dan diteruskan ke Pimpinan' : 'Dokumen ditolak'
      });

    } else {
      // Regular dokumen tanpa minta_validasi - just draft review
      if (!['diterima', 'ditolak'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      if (action === 'ditolak' && !catatan?.trim()) {
        return NextResponse.json({ error: 'Catatan diperlukan untuk penolakan' }, { status: 400 });
      }

      await pool.query<ResultSetHeader>(`
        UPDATE dokumen_output 
        SET 
          draft_status_kesubag = ?,
          draft_feedback_kesubag = ?,
          draft_reviewed_by_kesubag = ?,
          draft_reviewed_at_kesubag = NOW()
        WHERE id = ?
      `, [action, catatan || null, payload.id, dokumenId]);

      await createNotification({
        userId: dokumen.uploaded_by,
        title: action === 'diterima' ? 'Dokumen Diterima Kesubag' : 'Dokumen Ditolak Kesubag',
        message: action === 'diterima' 
          ? `Dokumen "${dokumen.nama_file}" telah diterima oleh Kesubag.`
          : `Dokumen "${dokumen.nama_file}" ditolak oleh Kesubag. Alasan: ${catatan}`,
        type: 'validasi',
        referenceId: dokumen.kegiatan_id,
        referenceType: 'dokumen'
      });

      return NextResponse.json({ 
        success: true, 
        message: action === 'diterima' ? 'Dokumen berhasil diterima' : 'Dokumen berhasil ditolak'
      });
    }
  } catch (error) {
    console.error('Error validating dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
