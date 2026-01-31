import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hitungKinerjaKegiatan, KegiatanData, IndikatorSkor } from '@/lib/services/kinerjaCalculator';

interface KegiatanWithKinerja {
  id: number;
  nama: string;
  tim_id: number;
  kro_id: number;
  target_output: number;
  output_realisasi: number;
  satuan_output: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_realisasi_selesai: string | null;
  anggaran_pagu: number;
  status: string;
  status_verifikasi: string;
  tim_nama: string;
  kro_kode: string;
  kro_nama: string;
  total_realisasi_anggaran: number;
  total_kendala: number;
  kendala_resolved: number;
  skor_kinerja: number;
  status_kinerja: 'Sukses' | 'Perlu Perhatian' | 'Bermasalah' | 'Belum Dinilai';
  indikator: IndikatorSkor;
}

// GET - Generate statistik for kesubag (read-only, auto-generated)
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const jenis_laporan = searchParams.get('jenis') || 'kro'; // kro, tim, anggaran, bermasalah
    const periode_mulai = searchParams.get('periode_mulai');
    const periode_selesai = searchParams.get('periode_selesai');

    // Get all kegiatan with related data
    let dateFilter = '';
    const dateParams: string[] = [];
    
    if (periode_mulai) {
      dateFilter += ' AND ko.tanggal_mulai >= ?';
      dateParams.push(periode_mulai);
    }
    if (periode_selesai) {
      dateFilter += ' AND ko.tanggal_selesai <= ?';
      dateParams.push(periode_selesai);
    }

    const [kegiatanRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ko.id,
        ko.nama,
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
        t.nama as tim_nama,
        kro.kode as kro_kode,
        kro.nama as kro_nama,
        COALESCE((SELECT SUM(jumlah) FROM realisasi_anggaran WHERE kegiatan_id = ko.id), 0) as total_realisasi_anggaran,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id), 0) as total_kendala,
        COALESCE((SELECT COUNT(*) FROM kendala_kegiatan WHERE kegiatan_id = ko.id AND status = 'resolved'), 0) as kendala_resolved
      FROM kegiatan ko
      LEFT JOIN tim t ON ko.tim_id = t.id
      LEFT JOIN kro ON ko.kro_id = kro.id
      WHERE 1=1 ${dateFilter}
      ORDER BY ko.created_at DESC
    `, dateParams);

    // Calculate kinerja for each kegiatan
    const kegiatanWithKinerja: KegiatanWithKinerja[] = kegiatanRows.map((kg) => {
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
        id: kg.id,
        nama: kg.nama,
        tim_id: kg.tim_id,
        kro_id: kg.kro_id,
        target_output: parseFloat(kg.target_output) || 0,
        output_realisasi: parseFloat(kg.output_realisasi) || 0,
        satuan_output: kg.satuan_output,
        tanggal_mulai: kg.tanggal_mulai,
        tanggal_selesai: kg.tanggal_selesai,
        tanggal_realisasi_selesai: kg.tanggal_realisasi_selesai,
        anggaran_pagu: parseFloat(kg.anggaran_pagu) || 0,
        status: kg.status,
        status_verifikasi: kg.status_verifikasi,
        tim_nama: kg.tim_nama,
        kro_kode: kg.kro_kode,
        kro_nama: kg.kro_nama,
        total_realisasi_anggaran: parseFloat(kg.total_realisasi_anggaran) || 0,
        total_kendala: parseInt(kg.total_kendala) || 0,
        kendala_resolved: parseInt(kg.kendala_resolved) || 0,
        skor_kinerja: kinerjaResult.skor_kinerja,
        status_kinerja: kinerjaResult.status_kinerja,
        indikator: kinerjaResult.indikator
      };
    });

    let laporan;

    switch (jenis_laporan) {
      case 'kro':
        // Rekap capaian kinerja per KRO
        const [kroList] = await pool.query<RowDataPacket[]>('SELECT id, kode, nama FROM kro ORDER BY kode');
        
        laporan = {
          judul: 'Rekap Capaian Kinerja per KRO',
          data: kroList.map(kro => {
            const kroKegiatan = kegiatanWithKinerja.filter(k => k.kro_id === kro.id);
            const totalPagu = kroKegiatan.reduce((sum, k) => sum + k.anggaran_pagu, 0);
            const totalRealisasi = kroKegiatan.reduce((sum, k) => sum + k.total_realisasi_anggaran, 0);
            const avgSkor = kroKegiatan.length > 0 
              ? kroKegiatan.reduce((sum, k) => sum + k.skor_kinerja, 0) / kroKegiatan.length 
              : 0;
            
            return {
              kro_id: kro.id,
              kro_kode: kro.kode,
              kro_nama: kro.nama,
              total_kegiatan: kroKegiatan.length,
              kegiatan_sukses: kroKegiatan.filter(k => k.status_kinerja === 'Sukses').length,
              kegiatan_perlu_perhatian: kroKegiatan.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
              kegiatan_bermasalah: kroKegiatan.filter(k => k.status_kinerja === 'Bermasalah').length,
              kegiatan_selesai: kroKegiatan.filter(k => k.status === 'selesai').length,
              rata_rata_skor: Math.round(avgSkor * 100) / 100,
              total_pagu: totalPagu,
              total_realisasi: totalRealisasi,
              serapan_persen: totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 100 * 100) / 100 : 0
            };
          }),
          summary: {
            total_kro: kroList.length,
            total_kegiatan: kegiatanWithKinerja.length,
            rata_rata_skor_instansi: kegiatanWithKinerja.length > 0 
              ? Math.round(kegiatanWithKinerja.reduce((sum, k) => sum + k.skor_kinerja, 0) / kegiatanWithKinerja.length * 100) / 100
              : 0
          }
        };
        break;

      case 'tim':
        // Rekap capaian kinerja per Tim
        const [timList] = await pool.query<RowDataPacket[]>('SELECT id, nama FROM tim ORDER BY nama');
        
        laporan = {
          judul: 'Rekap Capaian Kinerja per Tim',
          data: timList.map(tim => {
            const timKegiatan = kegiatanWithKinerja.filter(k => k.tim_id === tim.id);
            const totalPagu = timKegiatan.reduce((sum, k) => sum + k.anggaran_pagu, 0);
            const totalRealisasi = timKegiatan.reduce((sum, k) => sum + k.total_realisasi_anggaran, 0);
            const avgSkor = timKegiatan.length > 0 
              ? timKegiatan.reduce((sum, k) => sum + k.skor_kinerja, 0) / timKegiatan.length 
              : 0;
            
            // Get avg per indicator
            const avgCapaianOutput = timKegiatan.length > 0 
              ? timKegiatan.reduce((sum, k) => sum + k.indikator.capaian_output, 0) / timKegiatan.length : 0;
            const avgKetepatanWaktu = timKegiatan.length > 0 
              ? timKegiatan.reduce((sum, k) => sum + k.indikator.ketepatan_waktu, 0) / timKegiatan.length : 0;
            const avgSerapanAnggaran = timKegiatan.length > 0 
              ? timKegiatan.reduce((sum, k) => sum + k.indikator.serapan_anggaran, 0) / timKegiatan.length : 0;
            const avgKualitasOutput = timKegiatan.length > 0 
              ? timKegiatan.reduce((sum, k) => sum + k.indikator.kualitas_output, 0) / timKegiatan.length : 0;
            
            return {
              tim_id: tim.id,
              tim_nama: tim.nama,
              total_kegiatan: timKegiatan.length,
              kegiatan_sukses: timKegiatan.filter(k => k.status_kinerja === 'Sukses').length,
              kegiatan_perlu_perhatian: timKegiatan.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
              kegiatan_bermasalah: timKegiatan.filter(k => k.status_kinerja === 'Bermasalah').length,
              kegiatan_selesai: timKegiatan.filter(k => k.status === 'selesai').length,
              rata_rata_skor: Math.round(avgSkor * 100) / 100,
              indikator: {
                capaian_output: Math.round(avgCapaianOutput * 100) / 100,
                ketepatan_waktu: Math.round(avgKetepatanWaktu * 100) / 100,
                serapan_anggaran: Math.round(avgSerapanAnggaran * 100) / 100,
                kualitas_output: Math.round(avgKualitasOutput * 100) / 100
              },
              total_pagu: totalPagu,
              total_realisasi: totalRealisasi,
              serapan_persen: totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 100 * 100) / 100 : 0
            };
          }),
          summary: {
            total_tim: timList.length,
            total_kegiatan: kegiatanWithKinerja.length,
            rata_rata_skor_instansi: kegiatanWithKinerja.length > 0 
              ? Math.round(kegiatanWithKinerja.reduce((sum, k) => sum + k.skor_kinerja, 0) / kegiatanWithKinerja.length * 100) / 100
              : 0
          }
        };
        break;

      case 'anggaran':
        // Rekap realisasi anggaran
        const totalPaguAll = kegiatanWithKinerja.reduce((sum, k) => sum + k.anggaran_pagu, 0);
        const totalRealisasiAll = kegiatanWithKinerja.reduce((sum, k) => sum + k.total_realisasi_anggaran, 0);
        
        // Group by KRO
        const [kroListAnggaran] = await pool.query<RowDataPacket[]>('SELECT id, kode, nama FROM kro ORDER BY kode');
        
        laporan = {
          judul: 'Rekap Realisasi Anggaran',
          data: kroListAnggaran.map(kro => {
            const kroKegiatan = kegiatanWithKinerja.filter(k => k.kro_id === kro.id);
            const pagu = kroKegiatan.reduce((sum, k) => sum + k.anggaran_pagu, 0);
            const realisasi = kroKegiatan.reduce((sum, k) => sum + k.total_realisasi_anggaran, 0);
            
            return {
              kro_kode: kro.kode,
              kro_nama: kro.nama,
              total_kegiatan: kroKegiatan.length,
              pagu_anggaran: pagu,
              realisasi_anggaran: realisasi,
              sisa_anggaran: pagu - realisasi,
              serapan_persen: pagu > 0 ? Math.round((realisasi / pagu) * 100 * 100) / 100 : 0
            };
          }),
          summary: {
            total_pagu: totalPaguAll,
            total_realisasi: totalRealisasiAll,
            total_sisa: totalPaguAll - totalRealisasiAll,
            serapan_persen: totalPaguAll > 0 ? Math.round((totalRealisasiAll / totalPaguAll) * 100 * 100) / 100 : 0
          }
        };
        break;

      case 'bermasalah':
        // Daftar kegiatan bermasalah
        const kegiatanBermasalah = kegiatanWithKinerja.filter(
          k => k.status_kinerja === 'Bermasalah' || k.status_kinerja === 'Perlu Perhatian'
        ).sort((a, b) => a.skor_kinerja - b.skor_kinerja); // Sort by skor ascending (worst first)
        
        laporan = {
          judul: 'Daftar Kegiatan Bermasalah',
          data: kegiatanBermasalah.map(k => ({
            id: k.id,
            nama: k.nama,
            tim_nama: k.tim_nama,
            kro_kode: k.kro_kode,
            kro_nama: k.kro_nama,
            status: k.status,
            status_kinerja: k.status_kinerja,
            skor_kinerja: k.skor_kinerja,
            indikator: k.indikator,
            masalah_utama: getMasalahUtama(k.indikator),
            capaian_output_persen: k.target_output > 0 
              ? Math.round((k.output_realisasi / k.target_output) * 100 * 100) / 100 : 0,
            serapan_anggaran_persen: k.anggaran_pagu > 0 
              ? Math.round((k.total_realisasi_anggaran / k.anggaran_pagu) * 100 * 100) / 100 : 0,
            tanggal_selesai: k.tanggal_selesai
          })),
          summary: {
            total_bermasalah: kegiatanBermasalah.filter(k => k.status_kinerja === 'Bermasalah').length,
            total_perlu_perhatian: kegiatanBermasalah.filter(k => k.status_kinerja === 'Perlu Perhatian').length,
            total: kegiatanBermasalah.length
          }
        };
        break;

      default:
        return NextResponse.json({ error: 'Jenis laporan tidak valid' }, { status: 400 });
    }

    return NextResponse.json({
      laporan,
      generated_at: new Date().toISOString(),
      periode: {
        mulai: periode_mulai || 'Semua',
        selesai: periode_selesai || 'Semua'
      }
    });
  } catch (error) {
    console.error('Error generating statistik:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to determine main issue
function getMasalahUtama(indikator: { capaian_output: number; ketepatan_waktu: number; serapan_anggaran: number; kualitas_output: number; penyelesaian_kendala: number }): string {
  const issues = [];
  
  if (indikator.capaian_output < 60) issues.push('Capaian Output Rendah');
  if (indikator.ketepatan_waktu < 60) issues.push('Keterlambatan');
  if (indikator.serapan_anggaran < 60) issues.push('Serapan Anggaran Rendah');
  if (indikator.kualitas_output < 60) issues.push('Kualitas Belum Terverifikasi');
  if (indikator.penyelesaian_kendala < 60) issues.push('Kendala Belum Terselesaikan');
  
  return issues.length > 0 ? issues.join(', ') : '-';
}

// Block write operations
export async function POST() {
  return NextResponse.json({ error: 'Forbidden - Statistik dihasilkan otomatis oleh sistem' }, { status: 403 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
