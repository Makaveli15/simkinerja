import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Get kegiatan detail for koordinator (same structure as pimpinan)
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
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const kegiatanId = resolvedParams.id;

    // Get koordinator's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [payload.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ 
        error: 'Koordinator belum ditugaskan ke tim manapun' 
      }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

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
      WHERE ko.id = ? AND ko.tim_id = ?
    `, [kegiatanId, timId]);

    if (kegiatanRows.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan atau bukan bagian dari tim Anda' }, { status: 404 });
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

    // Get evaluasi
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
      console.error('Error fetching evaluasi:', err);
      evaluasi = [];
    }

    // Get dokumen output
    let dokumenOutput: RowDataPacket[] = [];
    try {
      const [dokumenRows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          do.*,
          u.nama_lengkap as uploaded_by_nama
        FROM dokumen_output do
        LEFT JOIN users u ON do.uploaded_by = u.id
        WHERE do.kegiatan_id = ?
        ORDER BY do.uploaded_at DESC
      `, [kegiatanId]);
      dokumenOutput = dokumenRows;
    } catch (err) {
      console.error('Error fetching dokumen output:', err);
      dokumenOutput = [];
    }

    // Get approval history
    let approvalHistory: RowDataPacket[] = [];
    try {
      const [approvalRows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          ah.*,
          u.nama_lengkap as approver_nama,
          u.role as approver_role
        FROM approval_history ah
        LEFT JOIN users u ON ah.user_id = u.id
        WHERE ah.kegiatan_id = ?
        ORDER BY ah.created_at DESC
      `, [kegiatanId]);
      approvalHistory = approvalRows;
    } catch (err) {
      console.error('Error fetching approval history:', err);
      approvalHistory = [];
    }

    // Calculate summary
    const totalRealisasiAnggaran = realisasiAnggaran.reduce(
      (sum: number, r: RowDataPacket) => sum + (parseFloat(r.jumlah) || 0), 
      0
    );

    const totalKendala = kendala.length;
    const kendalaResolved = kendala.filter((k: RowDataPacket) => k.status === 'resolved').length;

    // Calculate dokumen stats
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

    const kinerjaResult = await hitungKinerjaKegiatanAsync(kegiatanData);

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
      approval_history: approvalHistory,
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
