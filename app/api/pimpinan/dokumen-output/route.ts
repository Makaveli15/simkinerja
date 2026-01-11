import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification } from '@/lib/services/notificationService';

// GET - Get dokumen output for review (pimpinan)
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
    const status_filter = searchParams.get('status'); // pending, diterima, ditolak

    let query = `
      SELECT 
        d.*,
        u.nama_lengkap as uploaded_by_nama,
        u.username as uploaded_by_username,
        r.nama_lengkap as reviewed_by_nama,
        ko.nama as kegiatan_nama,
        ko.status as kegiatan_status,
        t.nama as tim_nama
      FROM dokumen_output d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users r ON d.reviewed_by = r.id
      JOIN kegiatan_operasional ko ON d.kegiatan_id = ko.id
      LEFT JOIN tim t ON ko.tim_id = t.id
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];

    if (kegiatan_id) {
      query += ' AND d.kegiatan_id = ?';
      queryParams.push(kegiatan_id);
    }

    if (status_filter) {
      query += ' AND d.status_review = ?';
      queryParams.push(status_filter);
    }

    query += ' ORDER BY d.uploaded_at DESC';

    const [dokumen] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Get summary counts
    const [summary] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_review = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status_review = 'diterima' THEN 1 ELSE 0 END) as diterima,
        SUM(CASE WHEN status_review = 'ditolak' THEN 1 ELSE 0 END) as ditolak,
        SUM(CASE WHEN tipe_dokumen = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN tipe_dokumen = 'final' THEN 1 ELSE 0 END) as final_count
      FROM dokumen_output
    `);

    return NextResponse.json({ 
      dokumen,
      summary: summary[0] || { total: 0, pending: 0, diterima: 0, ditolak: 0, draft_count: 0, final_count: 0 }
    });
  } catch (error) {
    console.error('Error fetching dokumen for review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Review dokumen (diterima/ditolak) - pimpinan only
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
    const { id, status_review, catatan_reviewer } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (!status_review || !['diterima', 'ditolak'].includes(status_review)) {
      return NextResponse.json({ 
        error: 'status_review tidak valid. Gunakan: diterima atau ditolak' 
      }, { status: 400 });
    }

    // Check if dokumen exists
    const [dokumenCheck] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM dokumen_output WHERE id = ?',
      [id]
    );

    if (dokumenCheck.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    // Update dokumen review status
    await pool.query<ResultSetHeader>(`
      UPDATE dokumen_output 
      SET 
        status_review = ?,
        catatan_reviewer = ?,
        reviewed_by = ?,
        reviewed_at = NOW()
      WHERE id = ?
    `, [status_review, catatan_reviewer || null, payload.id, id]);

    // If final dokumen is diterima, also update kegiatan status_verifikasi
    if (status_review === 'diterima' && dokumenCheck[0].tipe_dokumen === 'final') {
      await pool.query(
        'UPDATE kegiatan_operasional SET status_verifikasi = ? WHERE id = ?',
        ['valid', dokumenCheck[0].kegiatan_id]
      );
    }

    // If dokumen is ditolak, set kegiatan to revisi
    if (status_review === 'ditolak') {
      await pool.query(
        'UPDATE kegiatan_operasional SET status_verifikasi = ? WHERE id = ?',
        ['revisi', dokumenCheck[0].kegiatan_id]
      );
    }

    // Get kegiatan name for notification
    const [kegiatanInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama FROM kegiatan_operasional WHERE id = ?',
      [dokumenCheck[0].kegiatan_id]
    );
    const kegiatanNama = kegiatanInfo[0]?.nama || 'Kegiatan';

    // Create notification for pelaksana who uploaded the document
    await createNotification({
      userId: dokumenCheck[0].uploaded_by,
      title: status_review === 'diterima' ? '✅ Dokumen Disetujui' : '❌ Dokumen Ditolak',
      message: status_review === 'diterima' 
        ? `Dokumen "${dokumenCheck[0].nama_file}" untuk kegiatan "${kegiatanNama}" telah disetujui oleh pimpinan`
        : `Dokumen "${dokumenCheck[0].nama_file}" untuk kegiatan "${kegiatanNama}" ditolak. ${catatan_reviewer ? 'Catatan: ' + catatan_reviewer : 'Silakan perbaiki dan upload ulang.'}`,
      type: 'validasi',
      referenceId: dokumenCheck[0].kegiatan_id,
      referenceType: 'kegiatan'
    });

    // Get updated dokumen
    const [updatedDokumen] = await pool.query<RowDataPacket[]>(`
      SELECT d.*, u.nama_lengkap as uploaded_by_nama, r.nama_lengkap as reviewed_by_nama
      FROM dokumen_output d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users r ON d.reviewed_by = r.id
      WHERE d.id = ?
    `, [id]);

    return NextResponse.json({
      message: `Dokumen berhasil ${status_review === 'diterima' ? 'diterima' : 'ditolak'}`,
      dokumen: updatedDokumen[0]
    });
  } catch (error) {
    console.error('Error reviewing dokumen:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
