import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Get kegiatan detail (read-only for kesubag - monitoring only)
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
    if (!payload || payload.role !== 'kesubag') {
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

    // Get dokumen output with kesubag validation status
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
        ORDER BY do.uploaded_at DESC
      `, [kegiatanId]);
      dokumenOutput = dokumenRows;
    } catch (err) {
      console.error('Error fetching dokumen output:', err);
      dokumenOutput = [];
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

    // Separate evaluasi by role for backward compatibility
    const evaluasiKesubag = evaluasi.filter((e: RowDataPacket) => e.role_pemberi === 'kesubag');
    const evaluasiPimpinan = evaluasi.filter((e: RowDataPacket) => e.role_pemberi === 'pimpinan');

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

    // Document validation summary
    // For drafts: check draft_status_kesubag
    // For finals with minta_validasi: check validasi_kesubag
    const dokumenPending = dokumenOutput.filter((d: RowDataPacket) => {
      if (d.tipe_dokumen === 'draft') {
        return !d.draft_status_kesubag || d.draft_status_kesubag === 'pending';
      } else if (d.tipe_dokumen === 'final' && d.minta_validasi === 1) {
        return !d.validasi_kesubag || d.validasi_kesubag === 'pending';
      }
      return false;
    }).length;
    
    const dokumenDiterima = dokumenOutput.filter((d: RowDataPacket) => {
      if (d.tipe_dokumen === 'draft') {
        return d.draft_status_kesubag === 'reviewed';
      } else if (d.tipe_dokumen === 'final' && d.minta_validasi === 1) {
        return d.validasi_kesubag === 'valid';
      }
      return false;
    }).length;
    
    const dokumenDitolak = dokumenOutput.filter((d: RowDataPacket) => {
      if (d.tipe_dokumen === 'draft') {
        return d.draft_status_kesubag === 'revisi';
      } else if (d.tipe_dokumen === 'final' && d.minta_validasi === 1) {
        return d.validasi_kesubag === 'tidak_valid';
      }
      return false;
    }).length;

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
      evaluasi: evaluasi, // Unified evaluasi list
      evaluasi_kesubag: evaluasiKesubag, // Backward compatibility
      evaluasi_pimpinan: evaluasiPimpinan, // Backward compatibility
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
        deviasi: kinerjaResult.deviasi,
        // Dokumen summary
        dokumen_total: dokumenOutput.length,
        dokumen_pending: dokumenPending,
        dokumen_diterima: dokumenDiterima,
        dokumen_ditolak: dokumenDitolak
      }
    });
  } catch (error) {
    console.error('Error fetching kegiatan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Kesubag is read-only for kegiatan (no PATCH, PUT, DELETE)
export async function PATCH() {
  return NextResponse.json({ error: 'Forbidden - Kesubag hanya dapat monitoring kegiatan' }, { status: 403 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Forbidden - Kesubag hanya dapat monitoring kegiatan' }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Forbidden - Kesubag tidak dapat menghapus kegiatan' }, { status: 403 });
}
