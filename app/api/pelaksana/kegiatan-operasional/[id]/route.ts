import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
      FROM kegiatan_operasional ko
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
        'SELECT id, tim_id, created_by FROM kegiatan_operasional WHERE id = ?',
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
         WHERE kegiatan_operasional_id = ? 
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
         WHERE kegiatan_operasional_id = ? 
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
         WHERE kegiatan_operasional_id = ? 
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
         WHERE kegiatan_operasional_id = ? 
         ORDER BY COALESCE(tanggal_kendala, created_at, id) DESC`,
        [id]
      );
      kendala = kendalaResult;
    } catch (e1) {
      // Fallback: try simpler query without tanggal_kendala
      try {
        const [kendalaResult] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM kendala_kegiatan 
           WHERE kegiatan_operasional_id = ? 
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

    // Calculate scores
    const latestProgres = progres[0] || { capaian_output: 0, ketepatan_waktu: 0, kualitas_output: 0 };
    const latestRealisasiFisik = realisasiFisik[0]?.persentase || 0;
    const totalAnggaran = realisasiAnggaran.reduce((sum, r) => sum + parseFloat(r.jumlah), 0);
    const paguAnggaran = kegiatan[0].anggaran_pagu || 0;
    const realisasiAnggaranPersen = paguAnggaran > 0 ? (totalAnggaran / paguAnggaran) * 100 : 0;
    
    const totalKendala = kendala.length;
    const resolvedKendala = kendala.filter(k => k.status === 'resolved').length;
    const penyelesaianKendala = totalKendala > 0 ? (resolvedKendala / totalKendala) * 100 : 100;

    // Calculate weighted score
    const bobot = {
      capaianOutput: 0.30,
      ketepatanWaktu: 0.20,
      serapanAnggaran: 0.20,
      kualitasOutput: 0.20,
      penyelesaianKendala: 0.10,
    };

    const skor = 
      (latestProgres.capaian_output * bobot.capaianOutput) +
      (latestProgres.ketepatan_waktu * bobot.ketepatanWaktu) +
      (Math.min(realisasiAnggaranPersen, 100) * bobot.serapanAnggaran) +
      (latestProgres.kualitas_output * bobot.kualitasOutput) +
      (penyelesaianKendala * bobot.penyelesaianKendala);

    let statusKinerja = 'Belum dinilai';
    if (skor >= 80) statusKinerja = 'Sukses';
    else if (skor >= 60) statusKinerja = 'Perlu Perhatian';
    else if (skor > 0) statusKinerja = 'Bermasalah';

    return NextResponse.json({
      kegiatan: kegiatan[0],
      progres,
      realisasi_fisik: realisasiFisik,
      realisasi_anggaran: realisasiAnggaran,
      kendala: kendalaWithTindakLanjut,
      summary: {
        realisasi_fisik_persen: latestRealisasiFisik,
        realisasi_anggaran_nominal: totalAnggaran,
        realisasi_anggaran_persen: Math.min(realisasiAnggaranPersen, 100).toFixed(1),
        total_kendala: totalKendala,
        kendala_resolved: resolvedKendala,
        kendala_pending: totalKendala - resolvedKendala,
        penyelesaian_kendala_persen: penyelesaianKendala.toFixed(1),
        skor_kinerja: Math.round(skor),
        status_kinerja: statusKinerja,
        indikator: {
          capaian_output: latestProgres.capaian_output,
          ketepatan_waktu: latestProgres.ketepatan_waktu,
          serapan_anggaran: Math.min(realisasiAnggaranPersen, 100),
          kualitas_output: latestProgres.kualitas_output,
          penyelesaian_kendala: penyelesaianKendala,
        }
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
      'SELECT id FROM kegiatan_operasional WHERE id = ? AND tim_id = ?',
      [id, timId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const { nama, deskripsi, tanggal_mulai, tanggal_selesai, target_output, satuan_output, anggaran_pagu, status, kro_id, mitra_id } = await request.json();

    // Get current kegiatan data to preserve fields that are not being updated
    const [currentData] = await pool.query<RowDataPacket[]>(
      'SELECT kro_id, mitra_id, tanggal_mulai, tanggal_selesai FROM kegiatan_operasional WHERE id = ?',
      [id]
    );

    const currentKegiatan = currentData[0];
    
    // Use current values if new values are not provided (undefined means not sent, null means explicitly cleared)
    const finalKroId = kro_id !== undefined ? kro_id : currentKegiatan.kro_id;
    const finalMitraId = mitra_id !== undefined ? mitra_id : currentKegiatan.mitra_id;
    const finalTanggalMulai = tanggal_mulai || currentKegiatan.tanggal_mulai;
    const finalTanggalSelesai = tanggal_selesai || currentKegiatan.tanggal_selesai;

    // Check if mitra is available (not assigned to another active kegiatan in overlapping dates)
    if (finalMitraId && finalTanggalMulai && finalTanggalSelesai) {
      const [conflictingKegiatan] = await pool.query<RowDataPacket[]>(
        `SELECT ko.id, ko.nama, ko.tanggal_mulai, ko.tanggal_selesai 
         FROM kegiatan_operasional ko
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

    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan_operasional SET
        nama = COALESCE(?, nama),
        deskripsi = COALESCE(?, deskripsi),
        tanggal_mulai = COALESCE(?, tanggal_mulai),
        tanggal_selesai = COALESCE(?, tanggal_selesai),
        target_output = COALESCE(?, target_output),
        satuan_output = COALESCE(?, satuan_output),
        anggaran_pagu = COALESCE(?, anggaran_pagu),
        status = COALESCE(?, status),
        kro_id = ?,
        mitra_id = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [nama, deskripsi, tanggal_mulai, tanggal_selesai, target_output, satuan_output, anggaran_pagu, status, finalKroId, finalMitraId, id]
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
      'SELECT id FROM kegiatan_operasional WHERE id = ? AND tim_id = ?',
      [id, timId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    // Delete related data first (cascading delete)
    const [kendalaRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM kendala_kegiatan WHERE kegiatan_operasional_id = ?',
      [id]
    );

    for (const k of kendalaRows) {
      await pool.query('DELETE FROM tindak_lanjut WHERE kendala_id = ?', [k.id]);
    }

    await pool.query('DELETE FROM kendala_kegiatan WHERE kegiatan_operasional_id = ?', [id]);
    await pool.query('DELETE FROM realisasi_anggaran WHERE kegiatan_operasional_id = ?', [id]);
    await pool.query('DELETE FROM realisasi_fisik WHERE kegiatan_operasional_id = ?', [id]);
    await pool.query('DELETE FROM progres_kegiatan WHERE kegiatan_operasional_id = ?', [id]);
    await pool.query('DELETE FROM kegiatan_operasional WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kegiatan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
