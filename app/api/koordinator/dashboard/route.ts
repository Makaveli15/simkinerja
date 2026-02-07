import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Dashboard data for koordinator (per tim)
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

    // Get all kegiatan for this tim
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.id,
        ko.nama,
        ko.tim_id,
        ko.kro_id,
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
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        u.nama_lengkap as pelaksana_nama,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users u ON ko.created_by = u.id
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
        tim_id: kg.tim_id,
        kro_id: kg.kro_id,
        tim_nama: kg.tim_nama,
        kro_kode: kg.kro_kode,
        kro_nama: kg.kro_nama,
        status: kg.status,
        status_pengajuan: kg.status_pengajuan,
        status_verifikasi: kg.status_verifikasi,
        pelaksana_nama: kg.pelaksana_nama,
        anggaran_pagu: kg.anggaran_pagu,
        total_realisasi_anggaran: kg.total_realisasi_anggaran,
        total_kendala: kg.total_kendala,
        kendala_resolved: kg.kendala_resolved,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja
      };
    }));

    // Calculate statistics
    const totalKegiatan = kegiatanWithKinerja.length;
    
    // Kegiatan menunggu approval koordinator
    const menungguApproval = kegiatanWithKinerja.filter(
      k => k.status_pengajuan === 'diajukan' || k.status_pengajuan === 'review_koordinator'
    ).length;

    // Status Kinerja Distribution
    const statusKinerja = {
      sukses: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Sukses').length,
      perlu_perhatian: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
      bermasalah: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Bermasalah').length,
      belum_mulai: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Belum Dinilai').length
    };

    // Status kegiatan distribution
    const statusKegiatan = {
      berjalan: kegiatanWithKinerja.filter(k => k.status === 'berjalan').length,
      selesai: kegiatanWithKinerja.filter(k => k.status === 'selesai').length,
      draft: kegiatanWithKinerja.filter(k => k.status === 'draft').length,
      dibatalkan: kegiatanWithKinerja.filter(k => k.status === 'dibatalkan').length
    };

    // Average kinerja score
    const avgKinerja = totalKegiatan > 0
      ? Math.round(kegiatanWithKinerja.reduce((sum, k) => sum + k.skor_kinerja, 0) / totalKegiatan * 100) / 100
      : 0;

    // Get pelaksana count in this tim
    const [pelaksanaCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE tim_id = ? AND role = "pelaksana"',
      [timId]
    );

    // Get recent activities (kegiatan terbaru yang diajukan)
    const recentActivities = kegiatanWithKinerja
      .filter(k => k.status_pengajuan === 'diajukan')
      .slice(0, 5);

    return NextResponse.json({
      tim: timInfo[0] || null,
      statistics: {
        total_kegiatan: totalKegiatan,
        menunggu_approval: menungguApproval,
        rata_rata_kinerja: avgKinerja,
        total_pelaksana: pelaksanaCount[0]?.count || 0
      },
      status_kinerja: statusKinerja,
      status_kegiatan: statusKegiatan,
      kegiatan: kegiatanWithKinerja,
      recent_activities: recentActivities
    });
  } catch (error) {
    console.error('Error fetching koordinator dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
