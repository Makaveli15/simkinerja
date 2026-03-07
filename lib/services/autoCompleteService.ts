/**
 * Auto Complete Service
 * 
 * Service untuk mengecek dan mengubah status kegiatan menjadi 'selesai'
 * secara otomatis ketika semua kondisi terpenuhi.
 * 
 * Kondisi untuk auto-complete:
 * 1. Output tervalidasi >= target_output
 *    - Untuk jenis_validasi='kuantitas': SUM(validasi_kuantitas.jumlah_output WHERE status='disahkan')
 *    - Untuk jenis_validasi='dokumen': COUNT(dokumen_output WHERE tipe_dokumen='final' AND status_final='disahkan')
 * 2. Semua kendala sudah resolved (tidak ada kendala dengan status='open')
 * 3. Serapan anggaran >= 50% dari pagu (minimal untuk dianggap selesai)
 * 
 * Sinkronisasi dengan kinerjaCalculator.ts:
 * - tanggal_realisasi_selesai akan diisi dengan tanggal saat auto-complete dijalankan
 * - Ini mempengaruhi perhitungan skor Ketepatan Waktu
 * - output_realisasi diupdate dengan output_tervalidasi untuk skor Capaian Output
 */

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Ambang batas serapan anggaran minimum untuk auto-complete (50%)
const AMBANG_SERAPAN_MINIMUM = 50;

export interface KegiatanCompletionStatus {
  kegiatan_id: number;
  nama: string;
  target_output: number;
  output_tervalidasi: number;
  jenis_validasi: 'kuantitas' | 'dokumen';
  total_kendala_open: number;
  anggaran_pagu: number;
  total_realisasi_anggaran: number;
  serapan_anggaran_persen: number;
  is_output_complete: boolean;
  is_kendala_resolved: boolean;
  is_anggaran_tercapai: boolean;
  can_auto_complete: boolean;
  current_status: string;
}

export interface AutoCompleteResult {
  success: boolean;
  message: string;
  kegiatan_id: number;
  previous_status?: string;
  new_status?: string;
  completion_status?: KegiatanCompletionStatus;
}

/**
 * Mengambil jenis validasi dari satuan_output
 */
async function getJenisValidasi(satuanOutput: string): Promise<'kuantitas' | 'dokumen'> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT jenis_validasi FROM satuan_output WHERE nama = ?`,
      [satuanOutput]
    );
    
    if (rows.length > 0 && rows[0].jenis_validasi) {
      return rows[0].jenis_validasi;
    }
    
    // Default ke dokumen jika tidak ditemukan
    return 'dokumen';
  } catch (error) {
    console.error('Error getting jenis_validasi:', error);
    return 'dokumen';
  }
}

/**
 * Menghitung output tervalidasi berdasarkan jenis validasi
 */
async function getOutputTervalidasi(kegiatanId: number, jenisValidasi: 'kuantitas' | 'dokumen'): Promise<number> {
  try {
    if (jenisValidasi === 'kuantitas') {
      // Untuk kuantitas: SUM jumlah_output dari validasi_kuantitas yang sudah disahkan
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(jumlah_output), 0) as total
         FROM validasi_kuantitas
         WHERE kegiatan_id = ? AND status = 'disahkan'`,
        [kegiatanId]
      );
      return parseFloat(rows[0]?.total || 0);
    } else {
      // Untuk dokumen: COUNT dokumen final yang sudah disahkan (status_final = 'disahkan')
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total
         FROM dokumen_output
         WHERE kegiatan_id = ? 
           AND tipe_dokumen = 'final' 
           AND status_final = 'disahkan'`,
        [kegiatanId]
      );
      return parseInt(rows[0]?.total || 0);
    }
  } catch (error) {
    console.error('Error getting output tervalidasi:', error);
    return 0;
  }
}

/**
 * Menghitung jumlah kendala yang masih open
 */
async function getOpenKendalaCount(kegiatanId: number): Promise<number> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM kendala_kegiatan
       WHERE kegiatan_id = ? AND status = 'open'`,
      [kegiatanId]
    );
    return parseInt(rows[0]?.total || 0);
  } catch (error) {
    console.error('Error getting open kendala count:', error);
    return 0;
  }
}

/**
 * Menghitung total realisasi anggaran
 */
async function getTotalRealisasiAnggaran(kegiatanId: number): Promise<number> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(jumlah), 0) as total
       FROM realisasi_anggaran
       WHERE kegiatan_id = ?`,
      [kegiatanId]
    );
    return parseFloat(rows[0]?.total || 0);
  } catch (error) {
    console.error('Error getting total realisasi anggaran:', error);
    return 0;
  }
}

/**
 * Mengecek kondisi penyelesaian kegiatan
 */
export async function checkCompletionConditions(kegiatanId: number): Promise<KegiatanCompletionStatus | null> {
  try {
    // Ambil data kegiatan
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, nama, target_output, satuan_output, jenis_validasi, anggaran_pagu, status
       FROM kegiatan
       WHERE id = ?`,
      [kegiatanId]
    );
    
    if (kegiatanRows.length === 0) {
      return null;
    }
    
    const kegiatan = kegiatanRows[0];
    const targetOutput = parseFloat(kegiatan.target_output) || 0;
    const anggaranPagu = parseFloat(kegiatan.anggaran_pagu) || 0;
    
    // Ambil jenis validasi dari kolom kegiatan atau dari satuan_output
    const jenisValidasi = kegiatan.jenis_validasi || await getJenisValidasi(kegiatan.satuan_output);
    
    // Hitung output tervalidasi
    const outputTervalidasi = await getOutputTervalidasi(kegiatanId, jenisValidasi);
    
    // Hitung kendala open
    const totalKendalaOpen = await getOpenKendalaCount(kegiatanId);
    
    // Hitung total realisasi anggaran
    const totalRealisasiAnggaran = await getTotalRealisasiAnggaran(kegiatanId);
    
    // Hitung serapan anggaran persen
    const serapanAnggaranPersen = anggaranPagu > 0 
      ? (totalRealisasiAnggaran / anggaranPagu) * 100 
      : 100; // Jika tidak ada pagu, anggap 100%
    
    // Cek kondisi
    const isOutputComplete = outputTervalidasi >= targetOutput;
    const isKendalaResolved = totalKendalaOpen === 0;
    // Anggaran dianggap tercapai jika serapan >= 50% atau tidak ada pagu
    const isAnggaranTercapai = anggaranPagu <= 0 || serapanAnggaranPersen >= AMBANG_SERAPAN_MINIMUM;
    
    const canAutoComplete = isOutputComplete && isKendalaResolved && isAnggaranTercapai;
    
    return {
      kegiatan_id: kegiatanId,
      nama: kegiatan.nama,
      target_output: targetOutput,
      output_tervalidasi: outputTervalidasi,
      jenis_validasi: jenisValidasi,
      total_kendala_open: totalKendalaOpen,
      anggaran_pagu: anggaranPagu,
      total_realisasi_anggaran: totalRealisasiAnggaran,
      serapan_anggaran_persen: Math.round(serapanAnggaranPersen * 100) / 100,
      is_output_complete: isOutputComplete,
      is_kendala_resolved: isKendalaResolved,
      is_anggaran_tercapai: isAnggaranTercapai,
      can_auto_complete: canAutoComplete,
      current_status: kegiatan.status
    };
  } catch (error) {
    console.error('Error checking completion conditions:', error);
    return null;
  }
}

/**
 * Mengecek dan mengupdate status kegiatan menjadi selesai jika semua kondisi terpenuhi
 */
export async function checkAndAutoCompleteKegiatan(kegiatanId: number): Promise<AutoCompleteResult> {
  try {
    // Cek kondisi penyelesaian
    const completionStatus = await checkCompletionConditions(kegiatanId);
    
    if (!completionStatus) {
      return {
        success: false,
        message: 'Kegiatan tidak ditemukan',
        kegiatan_id: kegiatanId
      };
    }
    
    // Jika sudah selesai, tidak perlu update
    if (completionStatus.current_status === 'selesai') {
      return {
        success: true,
        message: 'Kegiatan sudah berstatus selesai',
        kegiatan_id: kegiatanId,
        completion_status: completionStatus
      };
    }
    
    // Jika tidak memenuhi syarat auto-complete
    if (!completionStatus.can_auto_complete) {
      const reasons: string[] = [];
      
      if (!completionStatus.is_output_complete) {
        reasons.push(`Output tervalidasi (${completionStatus.output_tervalidasi}) belum mencapai target (${completionStatus.target_output})`);
      }
      
      if (!completionStatus.is_kendala_resolved) {
        reasons.push(`Masih ada ${completionStatus.total_kendala_open} kendala yang belum resolved`);
      }
      
      if (!completionStatus.is_anggaran_tercapai) {
        reasons.push(`Serapan anggaran (${completionStatus.serapan_anggaran_persen}%) belum mencapai batas minimum (${AMBANG_SERAPAN_MINIMUM}%)`);
      }
      
      return {
        success: false,
        message: `Kegiatan belum dapat diselesaikan: ${reasons.join('; ')}`,
        kegiatan_id: kegiatanId,
        completion_status: completionStatus
      };
    }
    
    // Update status kegiatan menjadi selesai
    const previousStatus = completionStatus.current_status;
    
    // Update status, tanggal_realisasi_selesai, dan output_realisasi
    // tanggal_realisasi_selesai diisi dengan tanggal saat ini untuk sinkronisasi dengan kinerjaCalculator
    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan 
       SET status = 'selesai',
           tanggal_realisasi_selesai = CURDATE(),
           output_realisasi = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [completionStatus.output_tervalidasi, kegiatanId]
    );
    
    return {
      success: true,
      message: 'Kegiatan berhasil diubah statusnya menjadi selesai secara otomatis',
      kegiatan_id: kegiatanId,
      previous_status: previousStatus,
      new_status: 'selesai',
      completion_status: {
        ...completionStatus,
        current_status: 'selesai'
      }
    };
  } catch (error) {
    console.error('Error in checkAndAutoCompleteKegiatan:', error);
    return {
      success: false,
      message: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      kegiatan_id: kegiatanId
    };
  }
}

/**
 * Update output realisasi dan cek apakah kegiatan bisa auto-complete
 * Fungsi ini dipanggil setelah ada validasi baru yang disahkan
 */
export async function updateOutputAndCheckComplete(kegiatanId: number): Promise<AutoCompleteResult> {
  try {
    // Ambil data kegiatan
    const [kegiatanRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, satuan_output, jenis_validasi, status
       FROM kegiatan
       WHERE id = ?`,
      [kegiatanId]
    );
    
    if (kegiatanRows.length === 0) {
      return {
        success: false,
        message: 'Kegiatan tidak ditemukan',
        kegiatan_id: kegiatanId
      };
    }
    
    const kegiatan = kegiatanRows[0];
    
    // Jika sudah selesai, tidak perlu update
    if (kegiatan.status === 'selesai') {
      return {
        success: true,
        message: 'Kegiatan sudah berstatus selesai',
        kegiatan_id: kegiatanId
      };
    }
    
    // Ambil jenis validasi
    const jenisValidasi = kegiatan.jenis_validasi || await getJenisValidasi(kegiatan.satuan_output);
    
    // Hitung output tervalidasi
    const outputTervalidasi = await getOutputTervalidasi(kegiatanId, jenisValidasi);
    
    // Update output_realisasi
    await pool.query<ResultSetHeader>(
      `UPDATE kegiatan 
       SET output_realisasi = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [outputTervalidasi, kegiatanId]
    );
    
    // Cek dan auto-complete jika memenuhi syarat
    return await checkAndAutoCompleteKegiatan(kegiatanId);
  } catch (error) {
    console.error('Error in updateOutputAndCheckComplete:', error);
    return {
      success: false,
      message: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      kegiatan_id: kegiatanId
    };
  }
}

/**
 * Batch check untuk multiple kegiatan
 * Berguna untuk cron job atau background task
 */
export async function batchCheckAndAutoComplete(kegiatanIds: number[]): Promise<AutoCompleteResult[]> {
  const results: AutoCompleteResult[] = [];
  
  for (const kegiatanId of kegiatanIds) {
    const result = await checkAndAutoCompleteKegiatan(kegiatanId);
    results.push(result);
  }
  
  return results;
}

/**
 * Cek semua kegiatan yang berjalan dan auto-complete yang memenuhi syarat
 * Berguna untuk cron job
 */
export async function checkAllRunningKegiatan(): Promise<AutoCompleteResult[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM kegiatan WHERE status = 'berjalan'`
    );
    
    const kegiatanIds = rows.map(row => row.id);
    return await batchCheckAndAutoComplete(kegiatanIds);
  } catch (error) {
    console.error('Error in checkAllRunningKegiatan:', error);
    return [];
  }
}

export default {
  checkCompletionConditions,
  checkAndAutoCompleteKegiatan,
  updateOutputAndCheckComplete,
  batchCheckAndAutoComplete,
  checkAllRunningKegiatan
};
