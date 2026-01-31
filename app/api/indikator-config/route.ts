import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Get active indikator kinerja configuration (public endpoint for calculation)
// This endpoint doesn't require authentication as it's used by the kinerja calculator
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT kode, nama, bobot, deskripsi, urutan, satuan, nilai_min, nilai_max 
       FROM master_indikator_kinerja 
       WHERE is_active = TRUE 
       ORDER BY urutan ASC`
    );

    // Calculate total bobot to validate
    const totalBobot = rows.reduce((sum, r) => sum + parseFloat(r.bobot), 0);

    // Convert to key-value format for easy access
    const bobotConfig: Record<string, number> = {};
    rows.forEach(r => {
      bobotConfig[r.kode.toUpperCase()] = parseFloat(r.bobot) / 100; // Convert to decimal
    });

    return NextResponse.json({
      indikator: rows,
      bobotConfig,
      totalBobot: Math.round(totalBobot * 100) / 100,
      isValid: Math.abs(totalBobot - 100) < 0.01
    });
  } catch (error) {
    console.error('Error fetching indikator config:', error);
    
    // Return default configuration if database fails
    return NextResponse.json({
      indikator: [],
      bobotConfig: {
        CAPAIAN_OUTPUT: 0.30,
        KETEPATAN_WAKTU: 0.20,
        SERAPAN_ANGGARAN: 0.20,
        KUALITAS_OUTPUT: 0.20,
        PENYELESAIAN_KENDALA: 0.10,
      },
      totalBobot: 100,
      isValid: true,
      isDefault: true
    });
  }
}
