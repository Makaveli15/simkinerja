import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Get kegiatan detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Get kegiatan detail - allow access if user is creator OR kegiatan belongs to user's tim
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ko.*,
        t.nama as tim_nama,
        u.username as created_by_nama,
        k.kode as kro_kode,
        k.nama as kro_nama,
        m.nama as mitra_nama
      FROM kegiatan ko
      JOIN tim t ON ko.tim_id = t.id
      JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro k ON ko.kro_id = k.id
      LEFT JOIN mitra m ON ko.mitra_id = m.id
      WHERE ko.id = ? AND (ko.tim_id = ? OR ko.created_by = ?)`,
      [id, timId, auth.id]
    );

    if (kegiatan.length === 0) {
      // Debug: check if kegiatan exists at all
      const [anyKegiatan] = await pool.query<RowDataPacket[]>(
        'SELECT id, tim_id, created_by FROM kegiatan WHERE id = ?',
        [id]
      );
      console.log('Debug - Kegiatan check:', { 
        requestedId: id, 
        userTimId: timId, 
        userId: auth.id,
        foundKegiatan: anyKegiatan[0] || 'not found'
      });
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Get progres history - with fallback if table doesn't exist
    let progres: RowDataPacket[] = [];
    try {
      const [progresResult] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM progres_kegiatan 
         WHERE kegiatan_id = ? 
         ORDER BY tanggal_update DESC`,
        [id]
      );
      progres = progresResult;
    } catch (e) {
      console.log('Table progres_kegiatan might not exist');
    }

    // Get realisasi fisik history - with fallback if table doesn't exist
    let realisasiFisik: RowDataPacket[] = [];
    try {
      const [fisikResult] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM realisasi_fisik 
         WHERE kegiatan_id = ? 
         ORDER BY tanggal_realisasi DESC`,
        [id]
      );
      realisasiFisik = fisikResult;
    } catch (e) {
      console.log('Table realisasi_fisik might not exist');
    }

    // Get realisasi anggaran history - with fallback if table doesn't exist
    let realisasiAnggaran: RowDataPacket[] = [];
    try {
      const [anggaranResult] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM realisasi_anggaran 
         WHERE kegiatan_id = ? 
         ORDER BY tanggal_realisasi DESC`,
        [id]
      );
      realisasiAnggaran = anggaranResult;
    } catch (e) {
      console.log('Table realisasi_anggaran might not exist');
    }

    // Get kendala list - try tanggal_kendala first, fallback to created_at, then id
    let kendala: RowDataPacket[] = [];
    try {
      const [kendalaResult] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM kendala_kegiatan 
         WHERE kegiatan_id = ? 
         ORDER BY COALESCE(tanggal_kendala, created_at, id) DESC`,
        [id]
      );
      kendala = kendalaResult;
    } catch (e1) {
      // Fallback: try simpler query without tanggal_kendala
      try {
        const [kendalaResult] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM kendala_kegiatan 
           WHERE kegiatan_id = ? 
           ORDER BY id DESC`,
          [id]
        );
        kendala = kendalaResult;
      } catch (e2) {
        console.log('Table kendala_kegiatan might not exist');
      }
    }

    // Get tindak lanjut for each kendala
    const kendalaWithTindakLanjut = await Promise.all(kendala.map(async (k) => {
      try {
        const [tindakLanjut] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM tindak_lanjut 
           WHERE kendala_id = ? 
           ORDER BY created_at DESC`,
          [k.id]
        );
        return { ...k, tindak_lanjut: tindakLanjut };
      } catch (e) {
        return { ...k, tindak_lanjut: [] };
      }
    }));

    // Get dokumen stats untuk perhitungan kinerja berdasarkan dokumen
    let dokumenStats = {
      total_final: 0,
      final_disahkan: 0,
      final_menunggu: 0,
      final_revisi: 0,
    };
    try {
      const [dokumenResult] = await pool.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_final,
          SUM(CASE WHEN status_final = 'disahkan' THEN 1 ELSE 0 END) as final_disahkan,
          SUM(CASE WHEN status_final IN ('menunggu_kesubag', 'menunggu_pimpinan') THEN 1 ELSE 0 END) as final_menunggu,
          SUM(CASE WHEN status_final = 'revisi' OR validasi_kesubag = 'tidak_valid' OR validasi_pimpinan = 'tidak_valid' THEN 1 ELSE 0 END) as final_revisi
        FROM dokumen_output 
        WHERE kegiatan_id = ? AND tipe_dokumen = 'final' AND minta_validasi = 1`,
        [id]
      );
      if (dokumenResult.length > 0) {
        dokumenStats = {
          total_final: Number(dokumenResult[0].total_final) || 0,
          final_disahkan: Number(dokumenResult[0].final_disahkan) || 0,
          final_menunggu: Number(dokumenResult[0].final_menunggu) || 0,
          final_revisi: Number(dokumenResult[0].final_revisi) || 0,
        };
      }
    } catch (e) {
      console.log('Could not get dokumen stats:', e);
    }

    // Prepare data for automatic kinerja calculation
    const kegiatanDetail = kegiatan[0];
    const totalAnggaran = realisasiAnggaran.reduce((sum, r) => sum + parseFloat(r.jumlah), 0);
    const totalKendala = kendala.length;
    const resolvedKendala = kendala.filter(k => k.status === 'resolved').length;
    
    // Parse target_output as number (could be string in DB)
    const targetOutputNum = parseFloat(kegiatanDetail.target_output) || 0;
    const outputRealisasiNum = parseFloat(kegiatanDetail.output_realisasi) || 0;

    // Prepare data for kinerja calculator (rule-based evaluation)
    const kinerjaData: KegiatanData = {
      target_output: targetOutputNum,
      tanggal_mulai: kegiatanDetail.tanggal_mulai,
      tanggal_selesai: kegiatanDetail.tanggal_selesai,
      anggaran_pagu: parseFloat(kegiatanDetail.anggaran_pagu) || 0,
      output_realisasi: outputRealisasiNum,
      tanggal_realisasi_selesai: kegiatanDetail.tanggal_realisasi_selesai,
      status_verifikasi: kegiatanDetail.status_verifikasi || 'belum_verifikasi',
      total_realisasi_anggaran: totalAnggaran,
      total_kendala: totalKendala,
      kendala_resolved: resolvedKendala,
      // Tambahkan dokumen_stats untuk perhitungan kualitas output berdasarkan dokumen
      dokumen_stats: dokumenStats.total_final > 0 ? dokumenStats : undefined,
    };

    // Calculate kinerja using rule-based service (automatic calculation)
    const kinerjaResult = hitungKinerjaKegiatan(kinerjaData);

    // Calculate realisasi fisik persen from output
    const latestRealisasiFisik = realisasiFisik[0]?.persentase || 0;
    const realisasiOutputPersen = targetOutputNum > 0 
      ? (outputRealisasiNum / targetOutputNum) * 100 
      : 0;
    
    // Use the higher value between realisasi_fisik table and calculated from output
    const finalRealisasiFisikPersen = Math.max(latestRealisasiFisik, realisasiOutputPersen);
    
    const paguAnggaran = parseFloat(kegiatanDetail.anggaran_pagu) || 0;
    const realisasiAnggaranPersen = paguAnggaran > 0 ? (totalAnggaran / paguAnggaran) * 100 : 0;

    // Helper function to format date to YYYY-MM-DD without timezone issues
    const formatDateForResponse = (date: Date | string | null): string | null => {
      if (!date) return null;
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // If it's a string, check if it needs conversion
      if (typeof date === 'string') {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date; // Already in correct format
        }
        // Parse and reformat
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return null;
    };

    // Format kegiatan dates properly to avoid timezone issues
    const kegiatanFormatted = {
      ...kegiatan[0],
      tanggal_mulai: formatDateForResponse(kegiatan[0].tanggal_mulai),
      tanggal_selesai: formatDateForResponse(kegiatan[0].tanggal_selesai),
      tanggal_realisasi_selesai: formatDateForResponse(kegiatan[0].tanggal_realisasi_selesai),
    };

    return NextResponse.json({
      kegiatan: kegiatanFormatted,
      progres,
      realisasi_fisik: realisasiFisik,
      realisasi_anggaran: realisasiAnggaran,
      kendala: kendalaWithTindakLanjut,
      summary: {
        // Data realisasi
        realisasi_fisik_persen: Math.min(finalRealisasiFisikPersen, 100),
        realisasi_anggaran_nominal: totalAnggaran,
        realisasi_anggaran_persen: Math.min(realisasiAnggaranPersen, 100).toFixed(1),
        output_realisasi: outputRealisasiNum,
        target_output: targetOutputNum,
        
        // Kendala summary
        total_kendala: totalKendala,
        kendala_resolved: resolvedKendala,
        kendala_pending: totalKendala - resolvedKendala,
        penyelesaian_kendala_persen: kinerjaResult.indikator.penyelesaian_kendala.toFixed(1),
        
        // Kinerja result (auto-calculated by service)
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        
        // Indikator detail (auto-calculated)
        indikator: {
          capaian_output: kinerjaResult.indikator.capaian_output,
          ketepatan_waktu: kinerjaResult.indikator.ketepatan_waktu,
          serapan_anggaran: kinerjaResult.indikator.serapan_anggaran,
          kualitas_output: kinerjaResult.indikator.kualitas_output,
          penyelesaian_kendala: kinerjaResult.indikator.penyelesaian_kendala,
        },
        
        // Deviasi (auto-calculated)
        deviasi: kinerjaResult.deviasi,
      }
    });
  } catch (error) {
    console.error('Error fetching kegiatan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update kegiatan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Check ownership
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kegiatan WHERE id = ? AND tim_id = ?',
      [id, timId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const { 
      nama, deskripsi, tanggal_mulai, tanggal_selesai, 
      target_output, satuan_output, anggaran_pagu, status, 
      kro_id, mitra_id,
      // New fields for raw data monitoring
      output_realisasi, tanggal_realisasi_selesai, status_verifikasi
    } = await request.json();

    // Get current kegiatan data to preserve fields that are not being updated
    const [currentData] = await pool.query<RowDataPacket[]>(
      `SELECT nama, deskripsi, kro_id, mitra_id, tanggal_mulai, tanggal_selesai, 
              target_output, satuan_output, anggaran_pagu, status,
              output_realisasi, tanggal_realisasi_selesai, status_verifikasi 
       FROM kegiatan WHERE id = ?`,
      [id]
    );

    const currentKegiatan = currentData[0];
    
    // Use current values if new values are not provided (undefined means not sent, null means explicitly cleared)
    const finalKroId = kro_id !== undefined ? kro_id : currentKegiatan.kro_id;
    const finalMitraId = mitra_id !== undefined ? mitra_id : currentKegiatan.mitra_id;
    const finalTanggalMulai = tanggal_mulai && tanggal_mulai !== '' ? tanggal_mulai : currentKegiatan.tanggal_mulai;
    const finalTanggalSelesai = tanggal_selesai !== undefined ? tanggal_selesai : currentKegiatan.tanggal_selesai;
    const finalOutputRealisasi = output_realisasi !== undefined ? output_realisasi : currentKegiatan.output_realisasi;
    const finalTanggalRealisasiSelesai = tanggal_realisasi_selesai !== undefined ? tanggal_realisasi_selesai : currentKegiatan.tanggal_realisasi_selesai;
    const finalStatusVerifikasi = status_verifikasi !== undefined ? status_verifikasi : currentKegiatan.status_verifikasi;

    // Check if mitra is available (not assigned to another active kegiatan in overlapping dates)
    if (finalMitraId && finalTanggalMulai && finalTanggalSelesai) {
      const [conflictingKegiatan] = await pool.query<RowDataPacket[]>(
        `SELECT ko.id, ko.nama, ko.tanggal_mulai, ko.tanggal_selesai 
         FROM kegiatan ko
         WHERE ko.mitra_id = ? 
           AND ko.id != ?
           AND ko.status != 'selesai'
           AND (
             (ko.tanggal_mulai <= ? AND ko.tanggal_selesai >= ?)
             OR (ko.tanggal_mulai <= ? AND ko.tanggal_selesai >= ?)
             OR (ko.tanggal_mulai >= ? AND ko.tanggal_selesai <= ?)
           )`,
        [finalMitraId, id, finalTanggalSelesai, finalTanggalMulai, finalTanggalMulai, finalTanggalMulai, finalTanggalMulai, finalTanggalSelesai]
      );

      if (conflictingKegiatan.length > 0) {
        const conflict = conflictingKegiatan[0];
        return NextResponse.json({ 
          error: `Mitra sudah ditugaskan pada kegiatan "${conflict.nama}" (${new Date(conflict.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(conflict.tanggal_selesai).toLocaleDateString('id-ID')})` 
        }, { status: 400 });
      }
    }

    // Prepare final values - use current if new value is not provided or is empty string
    const finalNama = nama !== undefined && nama !== '' ? nama : currentKegiatan.nama;
    const finalDeskripsi = deskripsi !== undefined ? deskripsi : currentKegiatan.deskripsi;
    const finalTargetOutput = target_output !== undefined && target_output !== null ? target_output : currentKegiatan.target_output;
    const finalSatuanOutput = satuan_output !== undefined && satuan_output !== '' ? satuan_output : currentKegiatan.satuan_output;
    // Round anggaran to avoid floating-point precision issues (e.g., 10000000 becoming 9999999)
    const finalAnggaranPagu = anggaran_pagu !== undefined && anggaran_pagu !== null 
      ? Math.round(Number(anggaran_pagu) * 100) / 100 
      : currentKegiatan.anggaran_pagu;
    const finalStatus = status !== undefined && status !== '' ? status : currentKegiatan.status;

    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan SET
        nama = ?,
        deskripsi = ?,
        tanggal_mulai = ?,
        tanggal_selesai = ?,
        target_output = ?,
        satuan_output = ?,
        anggaran_pagu = ?,
        status = ?,
        kro_id = ?,
        mitra_id = ?,
        output_realisasi = ?,
        tanggal_realisasi_selesai = ?,
        status_verifikasi = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [finalNama, finalDeskripsi, finalTanggalMulai, finalTanggalSelesai, finalTargetOutput, finalSatuanOutput, finalAnggaranPagu, finalStatus, finalKroId, finalMitraId, finalOutputRealisasi, finalTanggalRealisasiSelesai, finalStatusVerifikasi, id]
    );

    return NextResponse.json({ message: 'Kegiatan berhasil diupdate' });
  } catch (error) {
    console.error('Error updating kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete kegiatan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timId = userRows[0].tim_id;

    // Check ownership
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kegiatan WHERE id = ? AND tim_id = ?',
      [id, timId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Delete related data first (cascading delete)
    const [kendalaRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kendala_kegiatan WHERE kegiatan_id = ?',
      [id]
    );

    for (const k of kendalaRows) {
      await pool.query('DELETE FROM tindak_lanjut WHERE kendala_id = ?', [k.id]);
    }

    await pool.query('DELETE FROM kendala_kegiatan WHERE kegiatan_id = ?', [id]);
    await pool.query('DELETE FROM realisasi_anggaran WHERE kegiatan_id = ?', [id]);
    await pool.query('DELETE FROM realisasi_fisik WHERE kegiatan_id = ?', [id]);
    await pool.query('DELETE FROM progres_kegiatan WHERE kegiatan_id = ?', [id]);
    await pool.query('DELETE FROM kegiatan WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
