import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Get all indikator kinerja
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = 'SELECT * FROM master_indikator_kinerja';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY urutan ASC';

    const [rows] = await pool.query<RowDataPacket[]>(query);

    // Calculate total bobot
    const activeIndikator = (rows as RowDataPacket[]).filter(r => r.is_active);
    const totalBobot = activeIndikator.reduce((sum, r) => sum + parseFloat(r.bobot), 0);

    return NextResponse.json({
      indikator: rows,
      totalBobot: Math.round(totalBobot * 100) / 100,
      isValid: Math.abs(totalBobot - 100) < 0.01
    });
  } catch (error) {
    console.error('Error fetching indikator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new indikator
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { kode, nama, deskripsi, bobot, urutan, rumus_perhitungan, satuan, nilai_min, nilai_max, is_active } = body;

    // Validate required fields
    if (!kode || !nama || bobot === undefined) {
      return NextResponse.json({ error: 'Kode, nama, dan bobot wajib diisi' }, { status: 400 });
    }

    // Check if kode already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM master_indikator_kinerja WHERE kode = ?',
      [kode]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Kode indikator sudah digunakan' }, { status: 400 });
    }

    // Get max urutan if not provided
    let finalUrutan = urutan;
    if (!finalUrutan) {
      const [maxUrutan] = await pool.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(urutan), 0) + 1 as next_urutan FROM master_indikator_kinerja'
      );
      finalUrutan = maxUrutan[0].next_urutan;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO master_indikator_kinerja 
       (kode, nama, deskripsi, bobot, urutan, rumus_perhitungan, satuan, nilai_min, nilai_max, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kode,
        nama,
        deskripsi || null,
        parseFloat(bobot),
        finalUrutan,
        rumus_perhitungan || null,
        satuan || '%',
        nilai_min || 0,
        nilai_max || 100,
        is_active !== false
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Indikator berhasil ditambahkan',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating indikator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update indikator
export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, kode, nama, deskripsi, bobot, urutan, rumus_perhitungan, satuan, nilai_min, nilai_max, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID indikator wajib diisi' }, { status: 400 });
    }

    // Check if kode already exists for other indikator
    if (kode) {
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM master_indikator_kinerja WHERE kode = ? AND id != ?',
        [kode, id]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Kode indikator sudah digunakan' }, { status: 400 });
      }
    }

    await pool.query(
      `UPDATE master_indikator_kinerja SET
        kode = COALESCE(?, kode),
        nama = COALESCE(?, nama),
        deskripsi = ?,
        bobot = COALESCE(?, bobot),
        urutan = COALESCE(?, urutan),
        rumus_perhitungan = ?,
        satuan = COALESCE(?, satuan),
        nilai_min = COALESCE(?, nilai_min),
        nilai_max = COALESCE(?, nilai_max),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        kode || null,
        nama || null,
        deskripsi,
        bobot !== undefined ? parseFloat(bobot) : null,
        urutan || null,
        rumus_perhitungan,
        satuan || null,
        nilai_min,
        nilai_max,
        is_active,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Indikator berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating indikator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete indikator
export async function DELETE(req: NextRequest) {
  try {
    const cookie = req.cookies.get('auth')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID indikator wajib diisi' }, { status: 400 });
    }

    // Soft delete - just set is_active to false instead of deleting
    await pool.query(
      'UPDATE master_indikator_kinerja SET is_active = FALSE WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Indikator berhasil dinonaktifkan'
    });
  } catch (error) {
    console.error('Error deleting indikator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
