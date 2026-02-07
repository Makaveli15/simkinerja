import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hitungKinerjaKegiatanAsync, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Get kegiatan list for koordinator (per tim)
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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const kro_id = searchParams.get('kro_id');
    const status_pengajuan = searchParams.get('status_pengajuan');
    const status = searchParams.get('status');
    const periode_mulai = searchParams.get('periode_mulai');
    const periode_selesai = searchParams.get('periode_selesai');

    // Build query
    let query = `
      SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tim_id,
        ko.kro_id,
        ko.created_by,
        ko.target_output,
        ko.output_realisasi,
        ko.satuan_output,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.tanggal_realisasi_selesai,
        ko.anggaran_pagu,
        ko.status,
        ko.status_pengajuan,
        ko.status_verifikasi,
        ko.catatan_koordinator,
        ko.tanggal_approval_koordinator,
        ko.created_at,
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        u.nama_lengkap as pelaksana_nama,
        u.email as pelaksana_email,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN users u ON ko.created_by = u.id
      WHERE ko.tim_id = ?
    `;

    const queryParams: (string | number)[] = [timId];

    if (kro_id) {
      query += ' AND ko.kro_id = ?';
      queryParams.push(kro_id);
    }

    if (status_pengajuan) {
      query += ' AND ko.status_pengajuan = ?';
      queryParams.push(status_pengajuan);
    }

    if (status) {
      query += ' AND ko.status = ?';
      queryParams.push(status);
    }

    if (periode_mulai) {
      query += ' AND ko.tanggal_mulai >= ?';
      queryParams.push(periode_mulai);
    }

    if (periode_selesai) {
      query += ' AND ko.tanggal_selesai <= ?';
      queryParams.push(periode_selesai);
    }

    query += ' ORDER BY ko.created_at DESC';

    const [kegiatanRows] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Calculate kinerja for each kegiatan
    const kegiatanWithKinerja = await Promise.all(kegiatanRows.map(async (kg) => {
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
        ...kg,
        target_output: parseFloat(kg.target_output) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        indikator: kinerjaResult.indikator
      };
    }));

    // Get KRO list for filter dropdown
    const [kroList] = await pool.query<RowDataPacket[]>('SELECT id, kode, nama FROM kro ORDER BY kode');

    return NextResponse.json({
      kegiatan: kegiatanWithKinerja,
      filters: {
        kro_list: kroList
      }
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
