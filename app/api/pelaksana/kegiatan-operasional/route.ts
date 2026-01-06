import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper function to calculate kinerja score
function calculateKinerjaScore(
  capaianOutput: number,
  ketepataWaktu: number,
  serapanAnggaran: number,
  kualitasOutput: number,
  penyelesaianKendala: number
) {
  // Bobot indikator
  const bobot = {
    capaianOutput: 0.30,
    ketepatanWaktu: 0.20,
    serapanAnggaran: 0.20,
    kualitasOutput: 0.20,
    penyelesaianKendala: 0.10,
  };

  const skor = 
    (capaianOutput * bobot.capaianOutput) +
    (ketepataWaktu * bobot.ketepatanWaktu) +
    (serapanAnggaran * bobot.serapanAnggaran) +
    (kualitasOutput * bobot.kualitasOutput) +
    (penyelesaianKendala * bobot.penyelesaianKendala);

  let status = 'Belum dinilai';
  if (skor >= 80) status = 'Sukses';
  else if (skor >= 60) status = 'Perlu Perhatian';
  else if (skor > 0) status = 'Bermasalah';

  return { skor: Math.round(skor), status };
}

// GET - List kegiatan operasional tim
export async function GET() {
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
      return NextResponse.json([]);
    }

    const timId = userRows[0].tim_id;

    // Get kegiatan with calculated scores
    const [kegiatan] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.target_output,
        ko.satuan_output,
        ko.anggaran_pagu,
        ko.status,
        ko.created_at,
        ko.kro_id,
        ko.mitra_id,
        t.nama as tim_nama,
        u.username as created_by_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        m.nama as mitra_nama,
        COALESCE((SELECT persentase FROM realisasi_fisik WHERE kegiatan_operasional_id = ko.id ORDER BY tanggal_realisasi DESC LIMIT 1), 0) as realisasi_fisik,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_operasional_id = ko.id), 0) as total_anggaran_realisasi
      FROM kegiatan_operasional ko
      JOIN tim t ON ko.tim_id = t.id
      JOIN users u ON ko.created_by = u.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN mitra m ON ko.mitra_id = m.id
      WHERE ko.tim_id = ?
      ORDER BY ko.created_at DESC`,
      [timId]
    );

    // Calculate scores for each kegiatan
    const kegiatanWithScores = await Promise.all(kegiatan.map(async (k) => {
      // Get latest progres
      const [progres] = await pool.query<RowDataPacket[]>(
        `SELECT capaian_output, ketepatan_waktu, kualitas_output 
         FROM progres_kegiatan 
         WHERE kegiatan_operasional_id = ? 
         ORDER BY tanggal_update DESC LIMIT 1`,
        [k.id]
      );

      // Get kendala stats
      const [kendalaStats] = await pool.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
         FROM kendala_kegiatan 
         WHERE kegiatan_operasional_id = ?`,
        [k.id]
      );

      // Get kendala list (detail)
      let kendalaList: RowDataPacket[] = [];
      try {
        const [kendalaResult] = await pool.query<RowDataPacket[]>(
          `SELECT id, deskripsi, tingkat_dampak as tingkat_keparahan, status, tanggal_kejadian as tanggal_kendala, created_at
           FROM kendala_kegiatan 
           WHERE kegiatan_operasional_id = ? 
           ORDER BY COALESCE(tanggal_kejadian, created_at, id) DESC`,
          [k.id]
        );
        kendalaList = kendalaResult;
      } catch (e) {
        console.log('Could not fetch kendala list:', e);
      }

      const latestProgres = progres[0] || { capaian_output: 0, ketepatan_waktu: 0, kualitas_output: 0 };
      const realisasiAnggaran = k.anggaran_pagu > 0 
        ? (k.total_anggaran_realisasi / k.anggaran_pagu) * 100 
        : 0;
      const penyelesaianKendala = kendalaStats[0]?.total > 0 
        ? (kendalaStats[0].resolved / kendalaStats[0].total) * 100 
        : 100;

      const { skor, status: statusKinerja } = calculateKinerjaScore(
        latestProgres.capaian_output,
        latestProgres.ketepatan_waktu,
        Math.min(realisasiAnggaran, 100),
        latestProgres.kualitas_output,
        penyelesaianKendala
      );

      return {
        ...k,
        realisasi_anggaran: Math.min(realisasiAnggaran, 100).toFixed(1),
        skor_kinerja: skor,
        status_kinerja: statusKinerja,
        kendala_total: kendalaStats[0]?.total || 0,
        kendala_resolved: kendalaStats[0]?.resolved || 0,
        kendala_open: (kendalaStats[0]?.total || 0) - (kendalaStats[0]?.resolved || 0),
        kendala_list: kendalaList,
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

    const { nama, deskripsi, tanggal_mulai, tanggal_selesai, target_output, satuan_output, anggaran_pagu, kro_id, mitra_id } = await request.json();

    if (!nama || !tanggal_mulai) {
      return NextResponse.json({ error: 'Nama dan tanggal mulai harus diisi' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO kegiatan_operasional 
       (tim_id, created_by, nama, deskripsi, tanggal_mulai, tanggal_selesai, target_output, satuan_output, anggaran_pagu, status, kro_id, mitra_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'berjalan', ?, ?)`,
      [timId, auth.id, nama, deskripsi || null, tanggal_mulai, tanggal_selesai || null, target_output || null, satuan_output || 'kegiatan', anggaran_pagu || 0, kro_id || null, mitra_id || null]
    );

    return NextResponse.json({ message: 'Kegiatan berhasil dibuat', id: result.insertId });
  } catch (error) {
    console.error('Error creating kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
