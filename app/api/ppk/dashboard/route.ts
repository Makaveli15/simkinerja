import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Dashboard data for PPK
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'ppk') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all kegiatan that need PPK approval or have been processed by PPK
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
        koordinator.nama_lengkap as koordinator_nama,
        ko.catatan_koordinator,
        ko.tanggal_approval_koordinator,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users u ON ko.created_by = u.id
      LEFT JOIN users koordinator ON ko.approved_by_koordinator = koordinator.id
      WHERE ko.status_pengajuan IN ('review_ppk', 'approved_ppk', 'review_kepala', 'disetujui', 'ditolak')
         OR ko.approved_by_ppk IS NOT NULL
      ORDER BY 
        CASE WHEN ko.status_pengajuan = 'review_ppk' THEN 0 ELSE 1 END,
        ko.created_at DESC
    `);

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
        koordinator_nama: kg.koordinator_nama,
        catatan_koordinator: kg.catatan_koordinator,
        tanggal_approval_koordinator: kg.tanggal_approval_koordinator,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        total_kendala: kg.total_kendala,
        kendala_resolved: kg.kendala_resolved,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja
      };
    }));

    // Calculate statistics
    const totalKegiatan = kegiatanWithKinerja.length;
    
    // Kegiatan menunggu approval PPK
    const menungguApproval = kegiatanWithKinerja.filter(
      k => k.status_pengajuan === 'review_ppk'
    ).length;

    // Kegiatan yang sudah diproses PPK (sudah diteruskan ke Kepala atau sudah final)
    const sudahDiproses = kegiatanWithKinerja.filter(
      k => ['review_kepala', 'disetujui'].includes(k.status_pengajuan)
    ).length;

    // Kegiatan ditolak
    const ditolak = kegiatanWithKinerja.filter(
      k => k.status_pengajuan === 'ditolak' || k.status_pengajuan === 'revisi'
    ).length;

    // Status Kinerja Distribution
    const statusKinerja = {
      sukses: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Sukses').length,
      perlu_perhatian: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
      bermasalah: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Bermasalah').length,
      belum_mulai: kegiatanWithKinerja.filter(k => k.status_kinerja === 'Belum Dinilai').length
    };

    // Average kinerja score
    const avgKinerja = totalKegiatan > 0
      ? Math.round(kegiatanWithKinerja.reduce((sum, k) => sum + k.skor_kinerja, 0) / totalKegiatan * 100) / 100
      : 0;

    // Total anggaran yang perlu divalidasi
    const totalAnggaran = kegiatanWithKinerja
      .filter(k => k.status_pengajuan === 'review_ppk')
      .reduce((sum, k) => sum + (parseFloat(String(k.anggaran_pagu)) || 0), 0);

    // Get recent activities (kegiatan terbaru yang perlu approval)
    const pendingApprovals = kegiatanWithKinerja
      .filter(k => k.status_pengajuan === 'review_ppk')
      .slice(0, 10);

    // Get tim list
    const [timList] = await pool.query<RowDataPacket[]>('SELECT id, nama FROM tim ORDER BY nama');

    // Build status distribution
    const statusDistribution = [
      { status: 'Menunggu Review', jumlah: menungguApproval },
      { status: 'Diteruskan ke Kepala', jumlah: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'review_kepala').length },
      { status: 'Disetujui', jumlah: kegiatanWithKinerja.filter(k => k.status_pengajuan === 'disetujui').length },
      { status: 'Ditolak/Revisi', jumlah: ditolak }
    ];

    return NextResponse.json({
      stats: {
        total_kegiatan: totalKegiatan,
        menunggu_review: menungguApproval,
        disetujui: sudahDiproses,
        ditolak: ditolak,
        rata_rata_kinerja: avgKinerja,
        total_anggaran: totalAnggaran
      },
      status_kinerja: statusKinerja,
      kegiatan: kegiatanWithKinerja,
      pending_approvals: pendingApprovals,
      status_distribution: statusDistribution,
      tim_list: timList
    });
  } catch (error) {
    console.error('Error fetching PPK dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
