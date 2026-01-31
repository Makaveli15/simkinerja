import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - Get all kegiatan for kesubag monitoring (read-only)
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'kesubag') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const kro_id = searchParams.get('kro_id');
    const tim_id = searchParams.get('tim_id');
    const status_kinerja = searchParams.get('status_kinerja');
    const status = searchParams.get('status');
    const periode_mulai = searchParams.get('periode_mulai');
    const periode_selesai = searchParams.get('periode_selesai');

    // Build query with filters
    let query = `
      SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tim_id,
        ko.kro_id,
        ko.target_output,
        ko.output_realisasi,
        ko.satuan_output,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.tanggal_realisasi_selesai,
        ko.anggaran_pagu,
        ko.status,
        ko.status_verifikasi,
        ko.created_at,
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_operasional_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_operasional_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_operasional_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan_operasional ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];

    if (kro_id) {
      query += ' AND ko.kro_id = ?';
      queryParams.push(kro_id);
    }

    if (tim_id) {
      query += ' AND ko.tim_id = ?';
      queryParams.push(tim_id);
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
    const kegiatanWithKinerja = kegiatanRows.map((kg) => {
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

      const kinerjaResult = hitungKinerjaKegiatan(kegiatanData);

      return {
        ...kg,
        target_output: parseFloat(kg.target_output) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        indikator: kinerjaResult.indikator,
        realisasi_anggaran_persen: kg.anggaran_pagu > 0 
          ? Math.round((parseFloat(kg.total_realisasi_anggaran) / parseFloat(kg.anggaran_pagu)) * 100 * 100) / 100 
          : 0,
        capaian_output_persen: kg.target_output > 0 
          ? Math.round((parseFloat(kg.output_realisasi) / parseFloat(kg.target_output)) * 100 * 100) / 100 
          : 0
      };
    });

    // Filter by status_kinerja if provided
    let filteredKegiatan = kegiatanWithKinerja;
    if (status_kinerja) {
      filteredKegiatan = kegiatanWithKinerja.filter(k => k.status_kinerja === status_kinerja);
    }

    // Get KRO list for filter dropdown
    const [kroList] = await pool.query<RowDataPacket[]>('SELECT id, kode, nama FROM kro ORDER BY kode');
    
    // Get Tim list for filter dropdown
    const [timList] = await pool.query<RowDataPacket[]>('SELECT id, nama FROM tim ORDER BY nama');

    return NextResponse.json({
      kegiatan: filteredKegiatan,
      filters: {
        kro_list: kroList,
        tim_list: timList
      }
    });
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Block all write operations for kesubag on kegiatan
export async function POST() {
  return NextResponse.json({ error: 'Kesubag tidak dapat membuat kegiatan' }, { status: 403 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Kesubag tidak dapat mengubah kegiatan' }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Kesubag tidak dapat menghapus kegiatan' }, { status: 403 });
}
