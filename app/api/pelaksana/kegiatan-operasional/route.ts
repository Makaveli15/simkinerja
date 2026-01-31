import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData } from '@/lib/services/kinerjaCalculator';

// GET - List kegiatan operasional tim
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = JSON.parse(authCookie.value);
    
    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const filterBulan = searchParams.get('bulan');
    const filterTahun = searchParams.get('tahun');

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json([]);
    }

    const timId = userRows[0].tim_id;

    // Build query with optional filters - include new monitoring fields
    let query = `SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.tanggal_realisasi_selesai,
        ko.target_output,
        ko.output_realisasi,
        ko.satuan_output,
        ko.anggaran_pagu,
        ko.status,
        ko.status_verifikasi,
        ko.created_at,
        ko.kro_id,
        ko.mitra_id,
        t.nama as tim_nama,
        u.username as created_by_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        m.nama as mitra_nama,
        COALESCE((SELECT persentase FROM realisasi_fisik WHERE kegiatan_id = ko.id ORDER BY tanggal_realisasi DESC LIMIT 1), 0) as realisasi_fisik,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_anggaran_realisasi
      FROM kegiatan ko
      JOIN tim t ON ko.tim_id = t.id
      JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN mitra m ON ko.mitra_id = m.id
      WHERE ko.tim_id = ?`;
    
    const params: (string | number)[] = [timId];

    // Add date filters
    if (filterTahun) {
      if (filterBulan && filterBulan !== 'semua') {
        // Filter by specific month and year
        query += ` AND (
          (YEAR(ko.tanggal_mulai) = ? AND MONTH(ko.tanggal_mulai) = ?)
          OR (YEAR(ko.tanggal_selesai) = ? AND MONTH(ko.tanggal_selesai) = ?)
          OR (ko.tanggal_mulai <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')) 
              AND ko.tanggal_selesai >= CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
        )`;
        params.push(filterTahun, filterBulan, filterTahun, filterBulan, filterTahun, filterBulan, filterTahun, filterBulan);
      } else {
        // Filter by year only
        query += ` AND (YEAR(ko.tanggal_mulai) = ? OR YEAR(ko.tanggal_selesai) = ?)`;
        params.push(filterTahun, filterTahun);
      }
    }

    query += ` ORDER BY ko.created_at DESC`;

    // Get kegiatan with calculated scores
    const [kegiatan] = await pool.query<RowDataPacket[]>(query, params);

    // Calculate scores for each kegiatan using rule-based calculator
    const kegiatanWithScores = await Promise.all(kegiatan.map(async (k) => {
      // Get kendala stats
      const [kendalaStats] = await pool.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
         FROM kendala_kegiatan 
         WHERE kegiatan_id = ?`,
        [k.id]
      );

      // Get kendala list (detail)
      let kendalaList: RowDataPacket[] = [];
      try {
        const [kendalaResult] = await pool.query<RowDataPacket[]>(
          `SELECT id, deskripsi, tingkat_dampak as tingkat_keparahan, status, tanggal_kejadian as tanggal_kendala, created_at
           FROM kendala_kegiatan 
           WHERE kegiatan_id = ? 
           ORDER BY COALESCE(tanggal_kejadian, created_at, id) DESC`,
          [k.id]
        );
        kendalaList = kendalaResult;
      } catch (e) {
        console.log('Could not fetch kendala list:', e);
      }

      // Prepare data for rule-based kinerja calculator
      const kinerjaData: KegiatanData = {
        target_output: parseFloat(k.target_output) || 0,
        tanggal_mulai: k.tanggal_mulai,
        tanggal_selesai: k.tanggal_selesai,
        anggaran_pagu: parseFloat(k.anggaran_pagu) || 0,
        output_realisasi: parseFloat(k.output_realisasi) || 0,
        tanggal_realisasi_selesai: k.tanggal_realisasi_selesai,
        status_verifikasi: k.status_verifikasi || 'belum_verifikasi',
        total_realisasi_anggaran: parseFloat(k.total_anggaran_realisasi) || 0,
        total_kendala: parseInt(kendalaStats[0]?.total) || 0,
        kendala_resolved: parseInt(kendalaStats[0]?.resolved) || 0,
      };

      // Calculate kinerja using the service (automatic calculation)
      const kinerjaResult = hitungKinerjaKegiatan(kinerjaData);

      const realisasiAnggaran = k.anggaran_pagu > 0 
        ? (k.total_anggaran_realisasi / k.anggaran_pagu) * 100 
        : 0;

      return {
        ...k,
        realisasi_anggaran: Math.min(realisasiAnggaran, 100).toFixed(1),
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        kendala_total: kendalaStats[0]?.total || 0,
        kendala_resolved: kendalaStats[0]?.resolved || 0,
        kendala_open: (kendalaStats[0]?.total || 0) - (kendalaStats[0]?.resolved || 0),
        kendala_list: kendalaList,
        // Include indikator breakdown
        indikator: kinerjaResult.indikator,
        deviasi: kinerjaResult.deviasi,
      };
    }));

    return NextResponse.json(kegiatanWithScores);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new kegiatan operasional
export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Anda belum tergabung dalam tim' }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

    const { nama, deskripsi, tanggal_mulai, tanggal_selesai, target_output, satuan_output, anggaran_pagu, status: inputStatus, kro_id, mitra_id } = await request.json();

    if (!nama || !tanggal_mulai) {
      return NextResponse.json({ error: 'Nama dan tanggal mulai harus diisi' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['belum_mulai', 'berjalan', 'selesai', 'tertunda'];
    const finalStatus = validStatuses.includes(inputStatus) ? inputStatus : 'berjalan';

    // Check if mitra is available (not assigned to another active kegiatan in overlapping dates)
    if (mitra_id && tanggal_mulai && tanggal_selesai) {
      const [conflictingKegiatan] = await pool.query<RowDataPacket[]>(
        `SELECT id, nama, tanggal_mulai, tanggal_selesai 
         FROM kegiatan 
         WHERE mitra_id = ? 
           AND status != 'selesai'
           AND (
             (tanggal_mulai <= ? AND tanggal_selesai >= ?)
             OR (tanggal_mulai <= ? AND tanggal_selesai >= ?)
             OR (tanggal_mulai >= ? AND tanggal_selesai <= ?)
           )`,
        [mitra_id, tanggal_selesai, tanggal_mulai, tanggal_mulai, tanggal_mulai, tanggal_mulai, tanggal_selesai]
      );

      if (conflictingKegiatan.length > 0) {
        const conflict = conflictingKegiatan[0];
        return NextResponse.json({ 
          error: `Mitra sudah ditugaskan pada kegiatan "${conflict.nama}" (${new Date(conflict.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(conflict.tanggal_selesai).toLocaleDateString('id-ID')})` 
        }, { status: 400 });
      }
    }

    // Round anggaran to avoid floating-point precision issues (e.g., 10000000 becoming 9999999.99)
    const roundedAnggaran = anggaran_pagu ? Math.round(Number(anggaran_pagu) * 100) / 100 : 0;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO kegiatan 
       (tim_id, created_by, nama, deskripsi, tanggal_mulai, tanggal_selesai, target_output, satuan_output, anggaran_pagu, status, kro_id, mitra_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [timId, auth.id, nama, deskripsi || null, tanggal_mulai, tanggal_selesai || null, target_output || null, satuan_output || 'kegiatan', roundedAnggaran, finalStatus, kro_id || null, mitra_id || null]
    );

    return NextResponse.json({ message: 'Kegiatan berhasil dibuat', id: result.insertId });
  } catch (error) {
    console.error('Error creating kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
