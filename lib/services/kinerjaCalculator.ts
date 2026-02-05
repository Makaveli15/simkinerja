/**
 * Kinerja Calculator Service
 * 
 * Service untuk menghitung skor kinerja kegiatan secara otomatis
 * berdasarkan data mentah (raw data) tanpa input manual skor.
 * 
 * Prinsip: Pengguna hanya input data faktual, sistem menghitung skor.
 * 
 * Bobot Indikator (diambil dari database master_indikator_kinerja):
 * - Capaian Output: default 30%
 * - Ketepatan Waktu: default 20%
 * - Serapan Anggaran: default 20%
 * - Kualitas Output: default 20%
 * - Penyelesaian Kendala: default 10%
 */

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface KegiatanData {
  // Data Target (dari kegiatan)
  target_output: number;
  tanggal_mulai: string | Date | null;    // Tanggal mulai kegiatan
  tanggal_selesai: string | Date | null;  // Target selesai
  anggaran_pagu: number;
  
  // Data Realisasi (raw data yang diinput pengguna)
  output_realisasi: number;
  tanggal_realisasi_selesai: string | Date | null;  // Tanggal selesai aktual
  status_verifikasi: 'belum_verifikasi' | 'menunggu' | 'valid' | 'revisi';
  
  // Data dari tabel terkait
  total_realisasi_anggaran: number;  // Sum dari realisasi_anggaran
  total_kendala: number;
  kendala_resolved: number;
  
  // Data dokumen untuk perhitungan status verifikasi per dokumen (opsional)
  dokumen_stats?: {
    total_final: number;           // Total dokumen final
    final_disahkan: number;        // Dokumen final yang sudah disahkan
    final_menunggu: number;        // Dokumen final yang menunggu validasi
    final_revisi: number;          // Dokumen final yang ditolak/perlu revisi
  };
}

export interface IndikatorSkor {
  capaian_output: number;      // Skor 0-100
  ketepatan_waktu: number;     // Skor 0-100
  serapan_anggaran: number;    // Skor 0-100
  kualitas_output: number;     // Skor 0-100
  penyelesaian_kendala: number; // Skor 0-100
}

export interface KinerjaResult {
  indikator: IndikatorSkor;
  skor_kinerja: number;        // Total skor 0-100
  status_kinerja: 'Sukses' | 'Perlu Perhatian' | 'Bermasalah' | 'Belum Dinilai';
  deviasi: {
    output: number;            // Deviasi output (realisasi - target)
    waktu: number;             // Deviasi waktu dalam hari (negatif = terlambat)
    anggaran: number;          // Deviasi anggaran dalam persen
  };
}

// Interface untuk konfigurasi bobot dari database
export interface BobotConfig {
  CAPAIAN_OUTPUT: number;
  KETEPATAN_WAKTU: number;
  SERAPAN_ANGGARAN: number;
  KUALITAS_OUTPUT: number;
  PENYELESAIAN_KENDALA: number;
}

// Bobot default masing-masing indikator
const DEFAULT_BOBOT: BobotConfig = {
  CAPAIAN_OUTPUT: 0.30,
  KETEPATAN_WAKTU: 0.20,
  SERAPAN_ANGGARAN: 0.20,
  KUALITAS_OUTPUT: 0.20,
  PENYELESAIAN_KENDALA: 0.10,
};

// Bobot yang digunakan (bisa dioverride dari database)
let BOBOT: BobotConfig = { ...DEFAULT_BOBOT };

// Cache untuk bobot dari database
let cachedBobot: BobotConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 menit cache

/**
 * Fetch bobot konfigurasi dari database (server-side)
 * Mengambil data dari tabel master_indikator_kinerja yang aktif
 */
export async function fetchBobotFromDatabase(): Promise<BobotConfig> {
  // Cek cache
  const now = Date.now();
  if (cachedBobot && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedBobot;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT kode, bobot FROM master_indikator_kinerja WHERE is_active = TRUE ORDER BY urutan ASC`
    );

    const config: BobotConfig = { ...DEFAULT_BOBOT };
    
    rows.forEach(row => {
      const kode = row.kode.toUpperCase();
      const bobot = parseFloat(row.bobot) / 100; // Convert to decimal
      
      if (kode === 'CAPAIAN_OUTPUT') config.CAPAIAN_OUTPUT = bobot;
      else if (kode === 'KETEPATAN_WAKTU') config.KETEPATAN_WAKTU = bobot;
      else if (kode === 'SERAPAN_ANGGARAN') config.SERAPAN_ANGGARAN = bobot;
      else if (kode === 'KUALITAS_OUTPUT') config.KUALITAS_OUTPUT = bobot;
      else if (kode === 'PENYELESAIAN_KENDALA') config.PENYELESAIAN_KENDALA = bobot;
    });

    // Update cache
    cachedBobot = config;
    cacheTimestamp = now;
    
    // Also update the global BOBOT variable
    BOBOT = config;
    
    return config;
  } catch (error) {
    console.error('Error fetching bobot from database:', error);
    return DEFAULT_BOBOT;
  }
}

/**
 * Clear bobot cache - dipanggil setelah admin mengubah konfigurasi
 */
export function clearBobotCache(): void {
  cachedBobot = null;
  cacheTimestamp = 0;
}

/**
 * Set bobot konfigurasi dari database
 * Dipanggil saat ingin menggunakan konfigurasi dari master_indikator_kinerja
 */
export function setBobotConfig(config: Partial<BobotConfig>): void {
  BOBOT = {
    ...DEFAULT_BOBOT,
    ...config
  };
}

/**
 * Reset bobot ke default
 */
export function resetBobotConfig(): void {
  BOBOT = { ...DEFAULT_BOBOT };
}

/**
 * Get current bobot configuration
 */
export function getBobotConfig(): BobotConfig {
  return { ...BOBOT };
}

// Ambang batas status kinerja
const THRESHOLD = {
  SUKSES: 80,
  PERLU_PERHATIAN: 60,
} as const;

// Ambang efektivitas serapan anggaran (95%)
const AMBANG_EFEKTIVITAS_ANGGARAN = 95;

/**
 * Hitung skor Capaian Output (30%)
 * Formula: (output_realisasi / target_output) * 100
 * Maksimal skor: 100
 */
function hitungCapaianOutput(targetOutput: number, outputRealisasi: number): number {
  if (!targetOutput || targetOutput <= 0) return 0;
  
  const persentase = (outputRealisasi / targetOutput) * 100;
  return Math.min(persentase, 100); // Cap at 100
}

/**
 * Hitung skor Ketepatan Waktu (20%)
 * 
 * LOGIKA:
 * - Jika tanggal selesai aktual SUDAH diisi:
 *   - Selesai tepat waktu atau lebih awal: 100%
 *   - Terlambat 1-7 hari: 80%
 *   - Terlambat 8-14 hari: 60%
 *   - Terlambat 15-30 hari: 40%
 *   - Terlambat > 30 hari: 20%
 * 
 * - Jika tanggal selesai aktual BELUM diisi:
 *   - Skor dimulai dari 0% dan naik prorata seiring waktu berjalan
 *   - Skor maksimal 80% karena belum selesai
 *   - Jika sudah melewati deadline: dikurangi penalti
 */
function hitungKetepatanWaktu(
  tanggalTarget: string | Date | null, 
  tanggalRealisasi: string | Date | null,
  tanggalMulai?: string | Date | null
): { skor: number; deviasiHari: number } {
  // Tidak ada deadline = belum bisa dinilai
  if (!tanggalTarget) {
    return { skor: 0, deviasiHari: 0 };
  }

  const target = new Date(tanggalTarget);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  // ========== KASUS 1: Sudah ada tanggal realisasi selesai ==========
  if (tanggalRealisasi) {
    const realisasi = new Date(tanggalRealisasi);
    realisasi.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((realisasi.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      // Selesai tepat waktu atau lebih awal → 100%
      return { skor: 100, deviasiHari: Math.abs(diffDays) };
    } else if (diffDays <= 7) {
      // Terlambat 1-7 hari → 80%
      return { skor: 80, deviasiHari: -diffDays };
    } else if (diffDays <= 14) {
      // Terlambat 8-14 hari → 60%
      return { skor: 60, deviasiHari: -diffDays };
    } else if (diffDays <= 30) {
      // Terlambat 15-30 hari → 40%
      return { skor: 40, deviasiHari: -diffDays };
    } else {
      // Terlambat > 30 hari → 20%
      return { skor: 20, deviasiHari: -diffDays };
    }
  }

  // ========== KASUS 2: Tanggal selesai BELUM diisi ==========
  // Skor dimulai dari 0% dan naik prorata
  
  if (!tanggalMulai) {
    // Tidak ada tanggal mulai → tidak bisa hitung prorata, return 0
    return { skor: 0, deviasiHari: 0 };
  }

  const mulai = new Date(tanggalMulai);
  mulai.setHours(0, 0, 0, 0);
  
  // Hitung durasi total dan waktu yang sudah berjalan
  const totalDurasi = Math.floor((target.getTime() - mulai.getTime()) / (1000 * 60 * 60 * 24));
  const waktuBerjalan = Math.floor((today.getTime() - mulai.getTime()) / (1000 * 60 * 60 * 24));
  const sisaWaktu = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Kegiatan belum dimulai
  if (waktuBerjalan < 0) {
    return { skor: 0, deviasiHari: sisaWaktu };
  }

  // Cek apakah sudah melewati deadline
  if (sisaWaktu < 0) {
    // SUDAH MELEWATI DEADLINE - skor dikurangi berdasarkan keterlambatan
    const keterlambatan = Math.abs(sisaWaktu);
    
    // Mulai dari 70% lalu dikurangi 10% setiap minggu keterlambatan
    // Minimum skor 10%
    const penalti = Math.floor(keterlambatan / 7) * 10;
    const skor = Math.max(70 - penalti, 10);
    
    return { skor, deviasiHari: -keterlambatan };
  }

  // BELUM MELEWATI DEADLINE - hitung prorata
  if (totalDurasi <= 0) {
    return { skor: 0, deviasiHari: sisaWaktu };
  }

  // Skor prorata: dari 0% sampai max 80% (karena belum selesai)
  // Formula: (waktu_berjalan / total_durasi) * 80
  const persentaseWaktu = waktuBerjalan / totalDurasi;
  const skorProrata = Math.min(persentaseWaktu * 80, 80);
  
  return { skor: Math.round(skorProrata), deviasiHari: sisaWaktu };
}

/**
 * Hitung skor Serapan Anggaran (20%)
 * - Serapan >= 95%: 100
 * - Serapan 85-94%: 80
 * - Serapan 70-84%: 60
 * - Serapan 50-69%: 40
 * - Serapan < 50%: skor = (serapan / 50) * 40
 * - Over budget (> 100%): dikurangi penalti
 */
function hitungSerapanAnggaran(
  paguAnggaran: number, 
  totalRealisasi: number
): { skor: number; deviasiPersen: number } {
  if (!paguAnggaran || paguAnggaran <= 0) {
    return { skor: 100, deviasiPersen: 0 }; // Tidak ada pagu = anggap sesuai
  }

  const serapanPersen = (totalRealisasi / paguAnggaran) * 100;
  const deviasi = serapanPersen - 100;

  // Over budget - penalti
  if (serapanPersen > 110) {
    return { skor: Math.max(0, 100 - (serapanPersen - 100) * 2), deviasiPersen: deviasi };
  }
  
  // Serapan optimal (95-110%)
  if (serapanPersen >= AMBANG_EFEKTIVITAS_ANGGARAN) {
    return { skor: 100, deviasiPersen: deviasi };
  }
  
  // Serapan 85-94%
  if (serapanPersen >= 85) {
    return { skor: 80, deviasiPersen: deviasi };
  }
  
  // Serapan 70-84%
  if (serapanPersen >= 70) {
    return { skor: 60, deviasiPersen: deviasi };
  }
  
  // Serapan 50-69%
  if (serapanPersen >= 50) {
    return { skor: 40, deviasiPersen: deviasi };
  }
  
  // Serapan < 50%
  return { skor: Math.max(0, (serapanPersen / 50) * 40), deviasiPersen: deviasi };
}

/**
 * Hitung skor Kualitas Output (20%)
 * 
 * LOGIKA BARU - Berdasarkan dokumen dan target output:
 * - Skor = (dokumen_disahkan / target_output) * 100
 * - Jika ada dokumen revisi: penalti
 * - Jika tidak ada dokumen final: gunakan status_verifikasi lama
 * 
 * LOGIKA LAMA (fallback jika tidak ada data dokumen):
 * - VALID: 100
 * - MENUNGGU: 50 (sedang menunggu validasi)
 * - REVISI: 30 (output perlu perbaikan)
 * - BELUM_VERIFIKASI: 0 (belum bisa dinilai)
 */
function hitungKualitasOutput(
  statusVerifikasi: 'belum_verifikasi' | 'menunggu' | 'valid' | 'revisi',
  dokumenStats?: {
    total_final: number;
    final_disahkan: number;
    final_menunggu: number;
    final_revisi: number;
  },
  targetOutput?: number
): number {
  // Jika ada data dokumen, hitung berdasarkan dokumen
  if (dokumenStats && dokumenStats.total_final > 0) {
    const { final_disahkan, final_menunggu, final_revisi } = dokumenStats;
    
    // Gunakan target_output jika tersedia, jika tidak gunakan total_final
    const target = targetOutput && targetOutput > 0 ? targetOutput : dokumenStats.total_final;
    
    // Skor dasar: persentase dokumen yang disahkan terhadap target
    const persentaseDisahkan = (final_disahkan / target) * 100;
    
    // Bonus untuk dokumen yang sedang menunggu (setengah nilai, proporsional terhadap target)
    const bonusMenunggu = (final_menunggu / target) * 50;
    
    // Penalti untuk dokumen yang perlu revisi
    const penaltiRevisi = (final_revisi / target) * 20;
    
    const skor = persentaseDisahkan + bonusMenunggu - penaltiRevisi;
    
    return Math.max(0, Math.min(100, skor));
  }
  
  // Fallback ke logika lama jika tidak ada data dokumen
  switch (statusVerifikasi) {
    case 'valid':
      return 100;
    case 'menunggu':
      return 50;  // Sedang menunggu validasi
    case 'revisi':
      return 30;  // Perlu revisi
    case 'belum_verifikasi':
    default:
      return 0;
  }
}

/**
 * Hitung skor Penyelesaian Kendala (10%)
 * Formula: (kendala_resolved / total_kendala) * 100
 * Jika tidak ada kendala, skor = 100
 */
function hitungPenyelesaianKendala(totalKendala: number, kendalaResolved: number): number {
  if (totalKendala === 0) return 100; // Tidak ada kendala = sempurna
  
  return (kendalaResolved / totalKendala) * 100;
}

/**
 * Tentukan status kinerja berdasarkan total skor
 */
function tentukanStatusKinerja(skor: number): 'Sukses' | 'Perlu Perhatian' | 'Bermasalah' | 'Belum Dinilai' {
  if (skor >= THRESHOLD.SUKSES) return 'Sukses';
  if (skor >= THRESHOLD.PERLU_PERHATIAN) return 'Perlu Perhatian';
  if (skor > 0) return 'Bermasalah';
  return 'Belum Dinilai';
}

/**
 * Fungsi utama untuk menghitung kinerja kegiatan
 * Menerima data mentah dan menghasilkan skor serta status kinerja
 * Versi synchronous - menggunakan bobot yang sudah di-set sebelumnya
 */
export function hitungKinerjaKegiatan(data: KegiatanData): KinerjaResult {
  // Hitung masing-masing indikator
  const skorCapaianOutput = hitungCapaianOutput(
    data.target_output, 
    data.output_realisasi
  );

  const { skor: skorKetepatanWaktu, deviasiHari } = hitungKetepatanWaktu(
    data.tanggal_selesai, 
    data.tanggal_realisasi_selesai,
    data.tanggal_mulai  // Tambahkan tanggal mulai untuk perhitungan prorata
  );

  const { skor: skorSerapanAnggaran, deviasiPersen: deviasiAnggaran } = hitungSerapanAnggaran(
    data.anggaran_pagu, 
    data.total_realisasi_anggaran
  );

  // Hitung kualitas output berdasarkan dokumen jika tersedia
  // Kirimkan target_output untuk perhitungan yang akurat
  const skorKualitasOutput = hitungKualitasOutput(
    data.status_verifikasi,
    data.dokumen_stats,
    data.target_output
  );

  const skorPenyelesaianKendala = hitungPenyelesaianKendala(
    data.total_kendala, 
    data.kendala_resolved
  );

  // Hitung total skor dengan pembobotan
  const totalSkor = 
    (skorCapaianOutput * BOBOT.CAPAIAN_OUTPUT) +
    (skorKetepatanWaktu * BOBOT.KETEPATAN_WAKTU) +
    (skorSerapanAnggaran * BOBOT.SERAPAN_ANGGARAN) +
    (skorKualitasOutput * BOBOT.KUALITAS_OUTPUT) +
    (skorPenyelesaianKendala * BOBOT.PENYELESAIAN_KENDALA);

  // Tentukan status kinerja
  const statusKinerja = tentukanStatusKinerja(totalSkor);

  // Hitung deviasi output
  const deviasiOutput = data.output_realisasi - data.target_output;

  return {
    indikator: {
      capaian_output: Math.round(skorCapaianOutput * 100) / 100,
      ketepatan_waktu: Math.round(skorKetepatanWaktu * 100) / 100,
      serapan_anggaran: Math.round(skorSerapanAnggaran * 100) / 100,
      kualitas_output: Math.round(skorKualitasOutput * 100) / 100,
      penyelesaian_kendala: Math.round(skorPenyelesaianKendala * 100) / 100,
    },
    skor_kinerja: Math.round(totalSkor),
    status_kinerja: statusKinerja,
    deviasi: {
      output: deviasiOutput,
      waktu: deviasiHari,
      anggaran: Math.round(deviasiAnggaran * 100) / 100,
    },
  };
}

/**
 * Fungsi async untuk menghitung kinerja kegiatan
 * Otomatis mengambil bobot dari database master_indikator_kinerja
 * DIREKOMENDASIKAN untuk digunakan di semua API
 */
export async function hitungKinerjaKegiatanAsync(data: KegiatanData): Promise<KinerjaResult> {
  // Fetch dan set bobot dari database
  await fetchBobotFromDatabase();
  
  // Gunakan fungsi synchronous setelah bobot di-set
  return hitungKinerjaKegiatan(data);
}

/**
 * Get color indicator untuk status kinerja (Hijau/Kuning/Merah)
 */
export function getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'Sukses':
      return 'green';
    case 'Perlu Perhatian':
      return 'yellow';
    case 'Bermasalah':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get CSS class untuk warna status
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'Sukses':
      return 'bg-green-100 text-green-700';
    case 'Perlu Perhatian':
      return 'bg-yellow-100 text-yellow-700';
    case 'Bermasalah':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
