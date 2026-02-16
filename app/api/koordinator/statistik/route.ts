import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData } from '@/lib/services/kinerjaCalculator';

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

    // Get all kegiatan for this tim with detailed info
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.id,
        ko.nama,
        ko.target_output,
        COALESCE(ko.output_realisasi, 0) as output_realisasi,
        ko.satuan_output,
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
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      WHERE ko.tim_id = ?
      ORDER BY ko.created_at DESC
    `, [timId]);

    // Calculate kinerja for each kegiatan
    const kegiatanWithKinerja = await Promise.all(kegiatanRows.map(async (kg: RowDataPacket) => {
      const kegiatanData: KegiatanData = {
        target_output: parseFloat(kg.target_output) || 0,
        tanggal_mulai: kg.tanggal_mulai,
        tanggal_selesai: kg.tanggal_selesai,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        tanggal_realisasi_selesai: kg.tanggal_realisasi_selesai,
        status_verifikasi: kg.status_verifikasi || 'belum_verifikasi',
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        total_kendala: parseInt(kg.total_kendala) || 0,
        kendala_resolved: parseInt(kg.kendala_resolved) || 0
      };

      const kinerjaResult = await hitungKinerjaKegiatanAsync(kegiatanData);

      return {
        id: kg.id,
        nama: kg.nama,
        target_output: kg.target_output,
        output_realisasi: kg.output_realisasi,
        satuan_output: kg.satuan_output,
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
        status_kinerja: kinerjaResult.status_kinerja
      };
    }));

    // Get all pelaksana in this tim
    const [pelaksanaRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id,
        u.nama_lengkap,
        u.email,
        u.username,
        (SELECT COUNT(*) FROM kegiatan WHERE created_by = u.id AND tim_id = ?) as total_kegiatan,
        (SELECT COUNT(*) FROM kegiatan WHERE created_by = u.id AND tim_id = ? AND status = 'selesai') as kegiatan_selesai,
        (SELECT COUNT(*) FROM kegiatan WHERE created_by = u.id AND tim_id = ? AND status = 'berjalan') as kegiatan_berjalan
      FROM users u
      WHERE u.tim_id = ? AND u.role = 'pelaksana'
      ORDER BY u.nama_lengkap
    `, [timId, timId, timId, timId]);

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

    // === ANGGARAN STATISTIK ===
    const totalAnggaran = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.anggaran_pagu) || 0), 0);
    const totalRealisasiAnggaran = kegiatanWithKinerja.reduce((sum, k) => sum + (parseFloat(k.total_realisasi_anggaran) || 0), 0);
    const sisaAnggaran = totalAnggaran - totalRealisasiAnggaran;
    const persentaseSerapan = totalAnggaran > 0 ? Math.round((totalRealisasiAnggaran / totalAnggaran) * 100 * 100) / 100 : 0;

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

    return NextResponse.json({
      tim: timInfo[0] || null,
      ringkasan: {
        total_kegiatan: totalKegiatan,
        kegiatan_selesai: kegiatanSelesai,
        kegiatan_berjalan: kegiatanBerjalan,
        kegiatan_draft: kegiatanDraft,
        kegiatan_dibatalkan: kegiatanDibatalkan,
        rata_rata_kinerja: avgKinerjaTim,
        total_pelaksana: pelaksanaRows.length
      },
      anggaran: {
        total: totalAnggaran,
        realisasi: totalRealisasiAnggaran,
        sisa: sisaAnggaran,
        persentase_serapan: persentaseSerapan
      },
      output: {
        total_target: totalTargetOutput,
        total_realisasi: totalRealisasiOutput,
        persentase_capaian: persentaseCapaianOutput
      },
      kendala: {
        total: totalKendala,
        resolved: kendalaResolved,
        open: kendalaOpen
      },
      distribusi_kinerja: kinerjaDistribusi,
      distribusi_pengajuan: pengajuanDistribusi,
      pelaksana: pelaksanaStats,
      trend_bulanan: trendBulanan,
      top_kinerja: topKinerja,
      bottom_kinerja: bottomKinerja,
      top_anggaran: topAnggaran,
      kegiatan_deadline: kegiatanDeadline,
      kegiatan_terlambat: kegiatanTerlambat
    });
  } catch (error) {
    console.error('Error fetching koordinator statistik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
