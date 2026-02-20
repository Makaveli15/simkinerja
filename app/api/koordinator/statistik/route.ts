import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData, IndikatorSkor } from '@/lib/services/kinerjaCalculator';

// GET - Statistik kinerja tim untuk koordinator
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'koordinator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const periode_mulai = searchParams.get('periode_mulai');
    const periode_selesai = searchParams.get('periode_selesai');

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

    // Get tim info
    const [timInfo] = await pool.query<RowDataPacket[]>(
      'SELECT id, nama FROM tim WHERE id = ?',
      [timId]
    );

    // Build date filter
    let dateFilter = '';
    const dateParams: (string | number)[] = [timId];
    
    if (periode_mulai) {
      dateFilter += ' AND ko.tanggal_mulai >= ?';
      dateParams.push(periode_mulai);
    }
    if (periode_selesai) {
      dateFilter += ' AND ko.tanggal_selesai <= ?';
      dateParams.push(periode_selesai);
    }

    // Get all kegiatan for this tim with detailed info
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.id,
        ko.nama,
        ko.target_output,
        COALESCE(ko.output_realisasi, 0) as output_realisasi,
        ko.satuan_output,
        ko.jenis_validasi,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.tanggal_realisasi_selesai,
        ko.anggaran_pagu,
        ko.status,
        ko.status_pengajuan,
        COALESCE(ko.status_verifikasi, 'belum_verifikasi') as status_verifikasi,
        ko.created_at,
        u.id as pelaksana_id,
        u.nama_lengkap as pelaksana_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved,
        COALESCE((SELECT SUM(jumlah_output) FROM validasi_kuantitas WHERE kegiatan_id = ko.id AND status = 'disahkan'), 0) as output_tervalidasi,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND status_final = 'disahkan'), 0) as dokumen_disahkan,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final'), 0) as total_dokumen_final,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final' AND status_final = 'menunggu'), 0) as dokumen_menunggu,
        COALESCE((SELECT COUNT(*) FROM dokumen_output WHERE kegiatan_id = ko.id AND tipe_dokumen = 'final' AND status_final = 'revisi'), 0) as dokumen_revisi
      FROM kegiatan ko
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      WHERE ko.tim_id = ? ${dateFilter}
      ORDER BY ko.created_at DESC
    `, dateParams);

    // Calculate kinerja for each kegiatan
    const kegiatanWithKinerja = await Promise.all(kegiatanRows.map(async (kg: RowDataPacket) => {
      // Determine output tervalidasi based on jenis_validasi
      const jenisValidasi = kg.jenis_validasi || 'dokumen';
      const outputTervalidasi = jenisValidasi === 'kuantitas' 
        ? parseFloat(kg.output_tervalidasi) || 0 
        : parseInt(kg.dokumen_disahkan) || 0;
      
      // Build dokumen_stats if needed
      const dokumenStats = jenisValidasi === 'dokumen' ? {
        total_final: parseInt(kg.total_dokumen_final) || 0,
        final_disahkan: parseInt(kg.dokumen_disahkan) || 0,
        final_menunggu: parseInt(kg.dokumen_menunggu) || 0,
        final_revisi: parseInt(kg.dokumen_revisi) || 0
      } : undefined;

      const kegiatanData: KegiatanData = {
        target_output: parseFloat(kg.target_output) || 0,
        tanggal_mulai: kg.tanggal_mulai,
        tanggal_selesai: kg.tanggal_selesai,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        output_tervalidasi: outputTervalidasi,
        tanggal_realisasi_selesai: kg.tanggal_realisasi_selesai,
        status_verifikasi: kg.status_verifikasi || 'belum_verifikasi',
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        total_kendala: parseInt(kg.total_kendala) || 0,
        kendala_resolved: parseInt(kg.kendala_resolved) || 0,
        jenis_validasi: jenisValidasi as 'kuantitas' | 'dokumen',
        dokumen_stats: dokumenStats
      };

      const kinerjaResult = await hitungKinerjaKegiatanAsync(kegiatanData);

      return {
        id: kg.id,
        nama: kg.nama,
        target_output: kg.target_output,
        output_realisasi: kg.output_realisasi,
        output_tervalidasi: outputTervalidasi,
        satuan_output: kg.satuan_output,
        jenis_validasi: jenisValidasi,
        tanggal_mulai: kg.tanggal_mulai,
        tanggal_selesai: kg.tanggal_selesai,
        anggaran_pagu: kg.anggaran_pagu,
        status: kg.status,
        status_pengajuan: kg.status_pengajuan,
        status_verifikasi: kg.status_verifikasi,
        pelaksana_id: kg.pelaksana_id,
        pelaksana_nama: kg.pelaksana_nama,
        total_realisasi_anggaran: kg.total_realisasi_anggaran,
        total_kendala: kg.total_kendala,
        kendala_resolved: kg.kendala_resolved,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        indikator: kinerjaResult.indikator
      };
    }));

    // Get all pelaksana in this tim
    const pelaksanaParams = [timId, timId, timId, timId];
    if (periode_mulai) {
      pelaksanaParams.push(periode_mulai as unknown as number);
    }
    if (periode_selesai) {
      pelaksanaParams.push(periode_selesai as unknown as number);
    }

    let pelaksanaDateFilter = '';
    if (periode_mulai || periode_selesai) {
      pelaksanaDateFilter = periode_mulai && periode_selesai 
        ? ' AND tanggal_mulai >= ? AND tanggal_selesai <= ?'
        : periode_mulai 
          ? ' AND tanggal_mulai >= ?'
          : ' AND tanggal_selesai <= ?';
    }

    const [pelaksanaRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id,
        u.nama_lengkap,
        u.email,
        u.username,
        (SELECT COUNT(*) FROM kegiatan WHERE created_by = u.id AND tim_id = ? ${pelaksanaDateFilter}) as total_kegiatan,
        (SELECT COUNT(*) FROM kegiatan WHERE created_by = u.id AND tim_id = ? AND status = 'selesai' ${pelaksanaDateFilter}) as kegiatan_selesai,
        (SELECT COUNT(*) FROM kegiatan WHERE created_by = u.id AND tim_id = ? AND status = 'berjalan' ${pelaksanaDateFilter}) as kegiatan_berjalan
      FROM users u
      WHERE u.tim_id = ? AND u.role = 'pelaksana'
      ORDER BY u.nama_lengkap
    `, pelaksanaParams);

    // Calculate pelaksana statistics with kinerja
    const pelaksanaStats = pelaksanaRows.map((p: RowDataPacket) => {
      const pelaksanaKegiatan = kegiatanWithKinerja.filter(k => k.pelaksana_id === p.id);
      const avgKinerja = pelaksanaKegiatan.length > 0
        ? Math.round(pelaksanaKegiatan.reduce((sum, k) => sum + k.skor_kinerja, 0) / pelaksanaKegiatan.length * 100) / 100
        : 0;
      
      return {
        id: p.id,
        nama: p.nama_lengkap,
        email: p.email,
        total_kegiatan: p.total_kegiatan,
        kegiatan_selesai: p.kegiatan_selesai,
        kegiatan_berjalan: p.kegiatan_berjalan,
        rata_rata_kinerja: avgKinerja
      };
    });

    // === STATISTIK RINGKASAN ===
    const totalKegiatan = kegiatanWithKinerja.length;
    const kegiatanSelesai = kegiatanWithKinerja.filter(k => k.status === 'selesai').length;
    const kegiatanBerjalan = kegiatanWithKinerja.filter(k => k.status === 'berjalan').length;
    const kegiatanDraft = kegiatanWithKinerja.filter(k => k.status === 'draft').length;
    const kegiatanDibatalkan = kegiatanWithKinerja.filter(k => k.status === 'dibatalkan').length;

    // Status kinerja distribution
    const kinerjaDistribusi = {
      sukses: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Sukses').length,
      perlu_perhatian: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
      bermasalah: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Bermasalah').length,
      belum_dinilai: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Belum Dinilai').length
    };

    // Status pengajuan distribution
    const pengajuanDistribusi = {
      draft: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'draft').length,
      diajukan: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'diajukan').length,
      review_koordinator: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'review_koordinator').length,
      approved_koordinator: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'approved_koordinator').length,
      review_ppk: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'review_ppk').length,
      approved_ppk: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'approved_ppk').length,
      review_pimpinan: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'review_pimpinan').length,
      approved: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'approved').length,
      ditolak: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'ditolak').length
    };

    // Rata-rata kinerja tim
    const avgKinerjaTim = totalKegiatan > 0
      ? Math.round(kegiatanWithKinerja.reduce((sum, k) => sum + k.skor_kinerja, 0) / totalKegiatan * 100) / 100
      : 0;

    // Status yang menunjukkan kegiatan sudah disetujui hingga tahap 3 (Kepala/Pimpinan)
    const STATUS_APPROVED_TAHAP_3 = ['disetujui', 'approved_pimpinan', 'approved'];

    // Filter kegiatan yang sudah disetujui final (tahap 3)
    const kegiatanApprovedFinal = kegiatanWithKinerja.filter(k => 
      STATUS_APPROVED_TAHAP_3.includes(k.status_pengajuan)
    );

    // === ANGGARAN STATISTIK - HANYA dari kegiatan yang sudah disetujui tahap 3 ===
    const totalAnggaran = kegiatanApprovedFinal.reduce((sum, k) => sum + (parseFloat(k.anggaran_pagu) || 0), 0);
    const totalRealisasiAnggaran = kegiatanApprovedFinal.reduce((sum, k) => sum + (parseFloat(k.total_realisasi_anggaran) || 0), 0);
    const sisaAnggaran = totalAnggaran - totalRealisasiAnggaran;
    const persentaseSerapan = totalAnggaran > 0 ? Math.round((totalRealisasiAnggaran / totalAnggaran) * 100 * 100) / 100 : 0;

    // Total anggaran dari semua kegiatan (untuk referensi)
    const totalAnggaranAll = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.anggaran_pagu) || 0), 0);
    const totalRealisasiAnggaranAll = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.total_realisasi_anggaran) || 0), 0);

    // === OUTPUT STATISTIK ===
    const totalTargetOutput = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.target_output) || 0), 0);
    const totalRealisasiOutput = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.output_realisasi) || 0), 0);
    const persentaseCapaianOutput = totalTargetOutput > 0 ? Math.round((totalRealisasiOutput / totalTargetOutput) * 100 * 100) / 100 : 0;

    // === KENDALA STATISTIK ===
    const totalKendala = kegiatanWithKinerja.reduce((sum, k) => sum + (parseInt(k.total_kendala) || 0), 0);
    const kendalaResolved = kegiatanWithKinerja.reduce((sum, k) => sum + (parseInt(k.kendala_resolved) || 0), 0);
    const kendalaOpen = totalKendala - kendalaResolved;

    // === TREND BULANAN (6 bulan terakhir) ===
    const [trendBulanan] = await pool.query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as bulan,
        COUNT(*) as total_kegiatan,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as kegiatan_selesai,
        SUM(COALESCE(anggaran_pagu, 0)) as total_anggaran,
        SUM(COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = kegiatan.id), 0)) as total_realisasi
      FROM kegiatan
      WHERE tim_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY bulan ASC
    `, [timId]);

    // === TOP 5 KEGIATAN DENGAN KINERJA TERTINGGI ===
    const topKinerja = [...kegiatanWithKinerja]
      .filter(k => k.status !== 'draft' && k.status !== 'dibatalkan')
      .sort((a, b) => b.skor_kinerja - a.skor_kinerja)
      .slice(0, 5)
      .map(k => ({
        id: k.id,
        nama: k.nama,
        pelaksana: k.pelaksana_nama,
        skor_kinerja: k.skor_kinerja,
        status_kinerja: k.status_kinerja,
        status: k.status
      }));

    // === TOP 5 KEGIATAN DENGAN KINERJA TERENDAH ===
    const bottomKinerja = [...kegiatanWithKinerja]
      .filter(k => k.status !== 'draft' && k.status !== 'dibatalkan' && k.skor_kinerja > 0)
      .sort((a, b) => a.skor_kinerja - b.skor_kinerja)
      .slice(0, 5)
      .map(k => ({
        id: k.id,
        nama: k.nama,
        pelaksana: k.pelaksana_nama,
        skor_kinerja: k.skor_kinerja,
        status_kinerja: k.status_kinerja,
        status: k.status
      }));

    // === TOP 5 KEGIATAN DENGAN ANGGARAN TERBESAR ===
    const topAnggaran = [...kegiatanWithKinerja]
      .sort((a, b) => (parseFloat(b.anggaran_pagu) || 0) - (parseFloat(a.anggaran_pagu) || 0))
      .slice(0, 5)
      .map(k => ({
        id: k.id,
        nama: k.nama,
        pelaksana: k.pelaksana_nama,
        anggaran: parseFloat(k.anggaran_pagu) || 0,
        realisasi: parseFloat(k.total_realisasi_anggaran) || 0,
        serapan: (parseFloat(k.anggaran_pagu) || 0) > 0 
          ? Math.round((parseFloat(k.total_realisasi_anggaran) || 0) / (parseFloat(k.anggaran_pagu) || 0) * 100 * 100) / 100 
          : 0
      }));

    // === KEGIATAN MENDEKATI DEADLINE ===
    const today = new Date();
    const kegiatanDeadline = kegiatanWithKinerja
      .filter(k => {
        if (k.status !== 'berjalan') return false;
        const deadline = new Date(k.tanggal_selesai);
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      })
      .map(k => {
        const deadline = new Date(k.tanggal_selesai);
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: k.id,
          nama: k.nama,
          pelaksana: k.pelaksana_nama,
          tanggal_selesai: k.tanggal_selesai,
          sisa_hari: diffDays
        };
      })
      .sort((a, b) => a.sisa_hari - b.sisa_hari);

    // === KEGIATAN YANG TERLAMBAT ===
    const kegiatanTerlambat = kegiatanWithKinerja
      .filter(k => {
        if (k.status !== 'berjalan') return false;
        const deadline = new Date(k.tanggal_selesai);
        return deadline < today;
      })
      .map(k => {
        const deadline = new Date(k.tanggal_selesai);
        const diffDays = Math.ceil((today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: k.id,
          nama: k.nama,
          pelaksana: k.pelaksana_nama,
          tanggal_selesai: k.tanggal_selesai,
          hari_terlambat: diffDays
        };
      })
      .sort((a, b) => b.hari_terlambat - a.hari_terlambat);

    // === RATA-RATA INDIKATOR TIM ===
    const kegiatanDinilai = kegiatanWithKinerja.filter(k => k.status_kinerja !== 'Belum Dinilai' && k.indikator);
    const avgIndikator = kegiatanDinilai.length > 0 ? {
      capaian_output: Math.round(kegiatanDinilai.reduce((sum, k) => sum + (k.indikator?.capaian_output || 0), 0) / kegiatanDinilai.length * 100) / 100,
      ketepatan_waktu: Math.round(kegiatanDinilai.reduce((sum, k) => sum + (k.indikator?.ketepatan_waktu || 0), 0) / kegiatanDinilai.length * 100) / 100,
      serapan_anggaran: Math.round(kegiatanDinilai.reduce((sum, k) => sum + (k.indikator?.serapan_anggaran || 0), 0) / kegiatanDinilai.length * 100) / 100,
      kualitas_output: Math.round(kegiatanDinilai.reduce((sum, k) => sum + (k.indikator?.kualitas_output || 0), 0) / kegiatanDinilai.length * 100) / 100
    } : null;

    // === KEGIATAN BERMASALAH DETAIL ===
    const kegiatanBermasalah = kegiatanWithKinerja
      .filter(k => k.status_kinerja === 'Bermasalah' || k.status_kinerja === 'Perlu Perhatian')
      .map(k => {
        // Tentukan masalah utama
        let masalahUtama = '';
        if (k.indikator) {
          const masalah = [];
          if (k.indikator.capaian_output < 60) masalah.push('Capaian output rendah');
          if (k.indikator.ketepatan_waktu < 60) masalah.push('Keterlambatan');
          if (k.indikator.serapan_anggaran < 40) masalah.push('Serapan anggaran rendah');
          if (k.indikator.kualitas_output < 60) masalah.push('Kualitas output rendah');
          masalahUtama = masalah.join(', ') || 'Kinerja di bawah target';
        }
        
        return {
          id: k.id,
          nama: k.nama,
          pelaksana: k.pelaksana_nama,
          status: k.status,
          status_kinerja: k.status_kinerja,
          skor_kinerja: k.skor_kinerja,
          masalah_utama: masalahUtama,
          indikator: k.indikator
        };
      })
      .sort((a, b) => a.skor_kinerja - b.skor_kinerja);

    // === STATISTIK OUTPUT TERVALIDASI ===
    const totalOutputTervalidasi = kegiatanWithKinerja.reduce((sum, k) => sum + (k.output_tervalidasi || 0), 0);
    const persentaseValidasi = totalTargetOutput > 0 ? Math.round((totalOutputTervalidasi / totalTargetOutput) * 100 * 100) / 100 : 0;

    return NextResponse.json({
      tim: timInfo[0] || null,
      ringkasan: {
        total_kegiatan: totalKegiatan,
        kegiatan_selesai: kegiatanSelesai,
        kegiatan_berjalan: kegiatanBerjalan,
        kegiatan_draft: kegiatanDraft,
        kegiatan_dibatalkan: kegiatanDibatalkan,
        kegiatan_approved_final: kegiatanApprovedFinal.length,
        rata_rata_kinerja: avgKinerjaTim,
        total_pelaksana: pelaksanaRows.length
      },
      anggaran: {
        total: totalAnggaran,
        realisasi: totalRealisasiAnggaran,
        sisa: sisaAnggaran,
        persentase_serapan: persentaseSerapan,
        // Info tambahan untuk referensi
        total_all: totalAnggaranAll,
        realisasi_all: totalRealisasiAnggaranAll
      },
      output: {
        total_target: totalTargetOutput,
        total_realisasi: totalRealisasiOutput,
        total_tervalidasi: totalOutputTervalidasi,
        persentase_capaian: persentaseCapaianOutput,
        persentase_validasi: persentaseValidasi
      },
      kendala: {
        total: totalKendala,
        resolved: kendalaResolved,
        open: kendalaOpen
      },
      distribusi_kinerja: kinerjaDistribusi,
      distribusi_pengajuan: pengajuanDistribusi,
      rata_rata_indikator: avgIndikator,
      pelaksana: pelaksanaStats,
      trend_bulanan: trendBulanan,
      top_kinerja: topKinerja,
      bottom_kinerja: bottomKinerja,
      top_anggaran: topAnggaran,
      kegiatan_deadline: kegiatanDeadline,
      kegiatan_terlambat: kegiatanTerlambat,
      kegiatan_bermasalah: kegiatanBermasalah
    });
  } catch (error) {
    console.error('Error fetching koordinator statistik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
