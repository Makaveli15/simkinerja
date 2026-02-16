import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createNotification, createNotificationForAllPimpinan } from '@/lib/services/notificationService';

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

async function getAuth(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  if (!authCookie) return null;
  try {
    return JSON.parse(decodeURIComponent(authCookie)) as AuthUser;
  } catch {
    return null;
  }
}

// GET - Fetch validation history for a kegiatan
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kegiatan_id = searchParams.get('kegiatan_id');

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    const [validations] = await pool.query<RowDataPacket[]>(`
      SELECT 
        v.*,
        u.nama_lengkap as created_by_nama,
        vk.nama_lengkap as validated_by_koordinator_nama,
        vp.nama_lengkap as validated_by_pimpinan_nama
      FROM validasi_output_kuantitas v
      LEFT JOIN users u ON v.created_by = u.id
      LEFT JOIN users vk ON v.validated_by_koordinator = vk.id
      LEFT JOIN users vp ON v.validated_by_pimpinan = vp.id
      WHERE v.kegiatan_id = ?
      ORDER BY v.created_at DESC
    `, [kegiatan_id]);

    // Get kegiatan info for context
    const [kegiatanInfo] = await pool.query<RowDataPacket[]>(`
      SELECT 
        k.id, k.nama, k.target_output, k.satuan_output, k.output_tervalidasi,
        s.jenis_validasi
      FROM kegiatan k
      LEFT JOIN satuan_output s ON k.satuan_output = s.nama
      WHERE k.id = ?
    `, [kegiatan_id]);

    return NextResponse.json({ 
      validations,
      kegiatan: kegiatanInfo[0] || null
    });
  } catch (error) {
    console.error('Error fetching validasi kuantitas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit new validation request (pelaksana)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Only pelaksana can submit validation requests' }, { status: 403 });
    }

    const body = await request.json();
    const { kegiatan_id, jumlah_output, bukti_pendukung, keterangan } = body;

    if (!kegiatan_id || !jumlah_output) {
      return NextResponse.json({ error: 'kegiatan_id and jumlah_output are required' }, { status: 400 });
    }

    if (jumlah_output <= 0) {
      return NextResponse.json({ error: 'jumlah_output must be positive' }, { status: 400 });
    }

    // Get kegiatan info
    const [kegiatanInfo] = await pool.query<RowDataPacket[]>(
      'SELECT nama, target_output, output_tervalidasi, tim_id FROM kegiatan WHERE id = ?',
      [kegiatan_id]
    );

    if (kegiatanInfo.length === 0) {
      return NextResponse.json({ error: 'Kegiatan not found' }, { status: 404 });
    }

    const kegiatan = kegiatanInfo[0];

    // Check if total would exceed target
    const totalAfterValidation = (kegiatan.output_tervalidasi || 0) + jumlah_output;
    if (totalAfterValidation > kegiatan.target_output) {
      return NextResponse.json({ 
        error: `Jumlah output melebihi target. Sisa yang dapat diajukan: ${kegiatan.target_output - (kegiatan.output_tervalidasi || 0)}` 
      }, { status: 400 });
    }

    // Insert validation request
    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO validasi_output_kuantitas 
      (kegiatan_id, jumlah_output, bukti_pendukung, keterangan, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [
      kegiatan_id,
      jumlah_output,
      bukti_pendukung ? JSON.stringify(bukti_pendukung) : null,
      keterangan || null,
      auth.id
    ]);

    // Notify koordinator
    const [koordinators] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE role = ? AND tim_id = ?',
      ['koordinator', kegiatan.tim_id]
    );

    for (const koordinator of koordinators) {
      await createNotification({
        userId: koordinator.id,
        title: '📊 Permintaan Validasi Output',
        message: `Pelaksana mengajukan validasi ${jumlah_output} output untuk kegiatan "${kegiatan.nama}". Silakan review dan validasi.`,
        type: 'permintaan_validasi',
        referenceId: kegiatan_id,
        referenceType: 'kegiatan'
      });
    }

    return NextResponse.json({ 
      message: 'Permintaan validasi berhasil diajukan',
      id: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating validasi kuantitas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Validate/reject (koordinator/pimpinan)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['koordinator', 'pimpinan'].includes(auth.role)) {
      return NextResponse.json({ error: 'Only koordinator or pimpinan can validate' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, feedback } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    if (!['valid', 'revisi'].includes(action)) {
      return NextResponse.json({ error: 'action must be "valid" or "revisi"' }, { status: 400 });
    }

    if (action === 'revisi' && !feedback?.trim()) {
      return NextResponse.json({ error: 'Feedback is required for revisi' }, { status: 400 });
    }

    // Get validation record
    const [validationRecord] = await pool.query<RowDataPacket[]>(`
      SELECT v.*, k.nama as kegiatan_nama, k.output_tervalidasi, k.target_output
      FROM validasi_output_kuantitas v
      JOIN kegiatan k ON v.kegiatan_id = k.id
      WHERE v.id = ?
    `, [id]);

    if (validationRecord.length === 0) {
      return NextResponse.json({ error: 'Validation record not found' }, { status: 404 });
    }

    const record = validationRecord[0];

    if (auth.role === 'koordinator') {
      // Koordinator validates first
      if (record.validated_by_koordinator) {
        return NextResponse.json({ error: 'Already validated by koordinator' }, { status: 400 });
      }

      await pool.query(`
        UPDATE validasi_output_kuantitas 
        SET 
          validated_by_koordinator = ?,
          validasi_koordinator_at = NOW(),
          feedback_koordinator = ?,
          status_validasi = ?
        WHERE id = ?
      `, [
        auth.id,
        feedback || null,
        action === 'revisi' ? 'revisi' : 'pending', // Still pending for pimpinan if valid
        id
      ]);

      // Notify pelaksana
      await createNotification({
        userId: record.created_by,
        title: action === 'valid' ? '✅ Output Divalidasi Koordinator' : '📝 Output Perlu Revisi',
        message: action === 'valid'
          ? `${record.jumlah_output} output untuk kegiatan "${record.kegiatan_nama}" telah divalidasi oleh Koordinator. Menunggu validasi Pimpinan.`
          : `Validasi ${record.jumlah_output} output untuk kegiatan "${record.kegiatan_nama}" perlu revisi. Alasan: ${feedback}`,
        type: 'validasi',
        referenceId: record.kegiatan_id,
        referenceType: 'kegiatan'
      });

      // If valid, notify pimpinan
      if (action === 'valid') {
        await createNotificationForAllPimpinan({
          title: '📊 Output Menunggu Validasi Akhir',
          message: `${record.jumlah_output} output untuk kegiatan "${record.kegiatan_nama}" sudah divalidasi Koordinator. Silakan validasi akhir.`,
          type: 'permintaan_validasi',
          referenceId: record.kegiatan_id,
          referenceType: 'kegiatan'
        });
      }

      return NextResponse.json({ 
        message: action === 'valid' ? 'Output divalidasi, menunggu Pimpinan' : 'Output ditolak, perlu revisi',
        success: true
      });
    }

    if (auth.role === 'pimpinan') {
      // Pimpinan validates after koordinator
      if (!record.validated_by_koordinator) {
        return NextResponse.json({ error: 'Koordinator must validate first' }, { status: 400 });
      }

      if (record.validated_by_pimpinan) {
        return NextResponse.json({ error: 'Already validated by pimpinan' }, { status: 400 });
      }

      await pool.query(`
        UPDATE validasi_output_kuantitas 
        SET 
          validated_by_pimpinan = ?,
          validasi_pimpinan_at = NOW(),
          feedback_pimpinan = ?,
          status_validasi = ?
        WHERE id = ?
      `, [
        auth.id,
        feedback || null,
        action,
        id
      ]);

      // If valid, update kegiatan.output_tervalidasi
      if (action === 'valid') {
        const newTotal = (record.output_tervalidasi || 0) + record.jumlah_output;
        await pool.query(`
          UPDATE kegiatan 
          SET 
            output_tervalidasi = ?,
            output_tervalidasi_at = NOW(),
            output_validated_by = ?
          WHERE id = ?
        `, [newTotal, auth.id, record.kegiatan_id]);

        // Update kegiatan status if target reached
        if (newTotal >= record.target_output) {
          await pool.query(
            'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
            ['valid', record.kegiatan_id]
          );
        }
      }

      // Notify pelaksana
      await createNotification({
        userId: record.created_by,
        title: action === 'valid' ? '🏆 Output Disahkan!' : '📝 Output Perlu Revisi',
        message: action === 'valid'
          ? `${record.jumlah_output} output untuk kegiatan "${record.kegiatan_nama}" telah disahkan oleh Pimpinan!`
          : `Validasi ${record.jumlah_output} output untuk kegiatan "${record.kegiatan_nama}" ditolak Pimpinan. Alasan: ${feedback}`,
        type: 'validasi',
        referenceId: record.kegiatan_id,
        referenceType: 'kegiatan'
      });

      return NextResponse.json({ 
        message: action === 'valid' ? 'Output berhasil disahkan!' : 'Output ditolak, perlu revisi',
        success: true
      });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error validating kuantitas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
