import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Get kegiatan detail (read-only for pimpinan)
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
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const kegiatanId = resolvedParams.id;

    // Get kegiatan detail
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.*,
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        u.username as created_by_username,
        u.nama_lengkap as created_by_nama
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users u ON ko.created_by = u.id
      WHERE ko.id = ?
    `, [kegiatanId]);

    if (kegiatanRows.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const kegiatan = kegiatanRows[0];

    // Get progres history
    const [progres] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM progres_kegiatan 
      WHERE kegiatan_id = ? 
      ORDER BY tanggal_update DESC
    `, [kegiatanId]);

    // Get realisasi anggaran
    const [realisasiAnggaran] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM realisasi_anggaran 
      WHERE kegiatan_id = ? 
      ORDER BY tanggal_realisasi DESC
    `, [kegiatanId]);

    // Get kendala
    let kendala: RowDataPacket[] = [];
    try {
      const [kendalaRows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM kendala_kegiatan 
        WHERE kegiatan_id = ?
        ORDER BY created_at DESC
      `, [kegiatanId]);
      
      // Get tindak lanjut for each kendala
      for (const k of kendalaRows) {
        try {
          const [tlRows] = await pool.query<RowDataPacket[]>(`
            SELECT id, deskripsi, batas_waktu, status, created_at 
            FROM tindak_lanjut 
            WHERE kendala_id = ?
            ORDER BY created_at DESC
          `, [k.id]);
          k.tindak_lanjut = tlRows;
        } catch {
          k.tindak_lanjut = [];
        }
      }
      kendala = kendalaRows;
    } catch (err) {
      console.error('Error fetching kendala:', err);
      kendala = [];
    }

    // Get evaluasi (unified table for both pimpinan & kesubag)
    let evaluasi: RowDataPacket[] = [];
    try {
      const [evaluasiRows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          e.*,
          COALESCE(u.nama_lengkap, u.username) as pemberi_nama,
          u.username as pemberi_username,
          u.role as pemberi_role
        FROM evaluasi e
        JOIN users u ON e.user_id = u.id
        WHERE e.kegiatan_id = ?
        ORDER BY e.created_at DESC
      `, [kegiatanId]);
      evaluasi = evaluasiRows;
    } catch (err) {
      console.error('Error fetching evaluasi (table may not exist):', err);
      evaluasi = [];
    }

    // Get dokumen output for document validation - hanya yang sudah diteruskan kesubag
    let dokumenOutput: RowDataPacket[] = [];
    try {
      const [dokumenRows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          do.*,
          u.nama_lengkap as uploader_nama,
          uk.nama_lengkap as validator_kesubag_nama,
          up.nama_lengkap as validator_pimpinan_nama
        FROM dokumen_output do
        LEFT JOIN users u ON do.uploaded_by = u.id
        LEFT JOIN users uk ON do.validasi_by_kesubag = uk.id
        LEFT JOIN users up ON do.validasi_by_pimpinan = up.id
        WHERE do.kegiatan_id = ?
          AND (
            -- Draft yang sudah diterima kesubag
            (do.tipe_dokumen = 'draft' AND do.draft_status_kesubag = 'reviewed')
            OR
            -- Final yang sudah divalidasi kesubag
            (do.tipe_dokumen = 'final' AND do.minta_validasi = 1 AND do.validasi_kesubag = 'valid')
            OR
            -- Dokumen yang sudah disahkan (untuk histori)
            (do.status_final = 'disahkan')
          )
        ORDER BY do.uploaded_at DESC
      `, [kegiatanId]);
      dokumenOutput = dokumenRows;
    } catch (err) {
      console.error('Error fetching dokumen output:', err);
      dokumenOutput = [];
    }

    // Calculate summary
    const totalRealisasiAnggaran = realisasiAnggaran.reduce(
      (sum: number, r: RowDataPacket) => sum + (parseFloat(r.jumlah) || 0), 
      0
    );

    const totalKendala = kendala.length;
    const kendalaResolved = kendala.filter((k: RowDataPacket) => k.status === 'resolved').length;

    // Calculate dokumen stats for kinerja calculation
    const dokumenFinalWithValidation = dokumenOutput.filter(
      (d: RowDataPacket) => d.tipe_dokumen === 'final' && d.minta_validasi === 1
    );
    const dokumenStats = dokumenFinalWithValidation.length > 0 ? {
      total_final: dokumenFinalWithValidation.length,
      final_disahkan: dokumenFinalWithValidation.filter((d: RowDataPacket) => d.status_final === 'disahkan').length,
      final_menunggu: dokumenFinalWithValidation.filter((d: RowDataPacket) => 
        d.status_final === 'menunggu_kesubag' || d.status_final === 'menunggu_pimpinan'
      ).length,
      final_revisi: dokumenFinalWithValidation.filter((d: RowDataPacket) => 
        d.status_final === 'revisi' || d.validasi_kesubag === 'tidak_valid' || d.validasi_pimpinan === 'tidak_valid'
      ).length,
    } : undefined;

    // Calculate kinerja
    const kegiatanData: KegiatanData = {
      target_output: parseFloat(kegiatan.target_output) || 0,
      tanggal_mulai: kegiatan.tanggal_mulai,
      tanggal_selesai: kegiatan.tanggal_selesai,
      anggaran_pagu: parseFloat(kegiatan.anggaran_pagu) || 0,
      output_realisasi: parseFloat(kegiatan.output_realisasi) || 0,
      tanggal_realisasi_selesai: kegiatan.tanggal_realisasi_selesai,
      status_verifikasi: kegiatan.status_verifikasi || 'belum_verifikasi',
      total_realisasi_anggaran: totalRealisasiAnggaran,
      total_kendala: totalKendala,
      kendala_resolved: kendalaResolved,
      dokumen_stats: dokumenStats
    };

    const kinerjaResult = hitungKinerjaKegiatan(kegiatanData);

    return NextResponse.json({
      kegiatan: {
        ...kegiatan,
        target_output: parseFloat(kegiatan.target_output) || 0,
        output_realisasi: parseFloat(kegiatan.output_realisasi) || 0,
        anggaran_pagu: parseFloat(kegiatan.anggaran_pagu) || 0
      },
      progres,
      realisasi_anggaran: realisasiAnggaran,
      kendala: kendala.map((k: RowDataPacket) => ({
        ...k,
        tindak_lanjut: k.tindak_lanjut || []
      })),
      dokumen_output: dokumenOutput,
      evaluasi,
      summary: {
        total_realisasi_anggaran: totalRealisasiAnggaran,
        realisasi_anggaran_persen: kegiatan.anggaran_pagu > 0 
          ? Math.round((totalRealisasiAnggaran / parseFloat(kegiatan.anggaran_pagu)) * 100 * 100) / 100 
          : 0,
        capaian_output_persen: kegiatan.target_output > 0 
          ? Math.round((parseFloat(kegiatan.output_realisasi) / parseFloat(kegiatan.target_output)) * 100 * 100) / 100 
          : 0,
        total_kendala: totalKendala,
        kendala_resolved: kendalaResolved,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        indikator: kinerjaResult.indikator,
        deviasi: kinerjaResult.deviasi
      }
    });
  } catch (error) {
    console.error('Error fetching kegiatan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Only allow updating status_verifikasi (verification)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'pimpinan') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const kegiatanId = resolvedParams.id;
    const body = await req.json();

    // ONLY allow status_verifikasi update - block all other fields
    const allowedFields = ['status_verifikasi'];
    const updateFields = Object.keys(body);
    
    // Check for forbidden fields
    const forbiddenFields = updateFields.filter(f => !allowedFields.includes(f));
    if (forbiddenFields.length > 0) {
      return NextResponse.json({ 
        error: `Forbidden - Pimpinan tidak dapat mengubah: ${forbiddenFields.join(', ')}. Hanya status verifikasi yang dapat diubah.` 
      }, { status: 403 });
    }

    // Validate status_verifikasi value
    const validStatuses = ['belum_verifikasi', 'valid', 'revisi'];
    if (!body.status_verifikasi || !validStatuses.includes(body.status_verifikasi)) {
      return NextResponse.json({ 
        error: 'Status verifikasi tidak valid. Gunakan: belum_verifikasi, valid, atau revisi' 
      }, { status: 400 });
    }

    // Update only status_verifikasi
    await pool.query<ResultSetHeader>(
      'UPDATE kegiatan SET status_verifikasi = ? WHERE id = ?',
      [body.status_verifikasi, kegiatanId]
    );

    return NextResponse.json({ 
      message: 'Status verifikasi berhasil diperbarui',
      status_verifikasi: body.status_verifikasi
    });
  } catch (error) {
    console.error('Error updating verifikasi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Block other write operations
export async function PUT() {
  return NextResponse.json({ error: 'Forbidden - Gunakan PATCH untuk verifikasi kualitas' }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Forbidden - Pimpinan tidak dapat menghapus kegiatan' }, { status: 403 });
}
