import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageOrientation,
  BorderStyle,
} from 'docx';

interface AuthData {
  id: number;
  role: string;
  tim_id?: number;
}

async function getAuthFromCookie(): Promise<AuthData | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth');
    
    if (!authCookie) return null;
    
    const auth = JSON.parse(authCookie.value) as AuthData;
    return auth;
  } catch {
    return null;
  }
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'selesai': return 'Selesai';
    case 'berjalan': return 'Berjalan';
    case 'tertunda': return 'Tertunda';
    default: return 'Belum Mulai';
  }
}

function getDampakText(dampak: string): string {
  switch (dampak) {
    case 'tinggi': return 'Tinggi';
    case 'sedang': return 'Sedang';
    case 'rendah': return 'Rendah';
    default: return '-';
  }
}

function getKendalaStatusText(status: string): string {
  switch (status) {
    case 'open': return 'Belum Selesai';
    case 'resolved': return 'Selesai';
    default: return '-';
  }
}

// Border style for tables
const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

export async function POST(request: Request) {
  try {
    // Auth check
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'pelaksana') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { bulan, tahun, kro_id, status } = body;

    // Get user's tim_id
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT tim_id FROM users WHERE id = ?',
      [auth.id]
    );

    if (userRows.length === 0 || !userRows[0].tim_id) {
      return NextResponse.json({ error: 'User tidak memiliki tim' }, { status: 400 });
    }

    const timId = userRows[0].tim_id;

    // Get tim info
    const [timRows] = await pool.query<RowDataPacket[]>(
      'SELECT nama FROM tim WHERE id = ?',
      [timId]
    );
    const timNama = timRows.length > 0 ? timRows[0].nama : 'Tim';

    // Get user info
    const [userInfo] = await pool.query<RowDataPacket[]>(
      'SELECT username FROM users WHERE id = ?',
      [auth.id]
    );
    const userName = userInfo.length > 0 ? userInfo[0].username : 'User';

    // Build query with filters - include mitra
    let query = `
      SELECT 
        ko.id,
        ko.nama,
        ko.deskripsi,
        ko.tanggal_mulai,
        ko.tanggal_selesai,
        ko.target_output,
        ko.satuan_output,
        ko.anggaran_pagu,
        ko.status,
        COALESCE(kro.kode, '-') as kro_kode,
        COALESCE(kro.nama, '-') as kro_nama,
        COALESCE(m.nama, '-') as mitra_nama,
        COALESCE(m.posisi, '-') as mitra_posisi,
        COALESCE(m.no_telp, '-') as mitra_telp,
        (SELECT COALESCE(SUM(jumlah), 0) FROM realisasi_anggaran WHERE kegiatan_operasional_id = ko.id) as total_realisasi,
        (SELECT persentase FROM realisasi_fisik WHERE kegiatan_operasional_id = ko.id ORDER BY tanggal_realisasi DESC LIMIT 1) as progres_fisik
      FROM kegiatan_operasional ko
      LEFT JOIN kro ON ko.kro_id = kro.id
      LEFT JOIN mitra m ON ko.mitra_id = m.id
      WHERE ko.tim_id = ?
    `;
    
    const params: (number | string)[] = [timId];

    if (tahun) {
      query += ` AND YEAR(ko.tanggal_mulai) = ?`;
      params.push(tahun);
    }

    if (bulan) {
      query += ` AND MONTH(ko.tanggal_mulai) = ?`;
      params.push(bulan);
    }

    if (kro_id) {
      query += ` AND ko.kro_id = ?`;
      params.push(kro_id);
    }

    if (status) {
      query += ` AND ko.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY ko.tanggal_mulai DESC`;

    const [kegiatan] = await pool.query<RowDataPacket[]>(query, params);

    // Get kendala for each kegiatan
    const kegiatanIds = kegiatan.map(k => k.id);
    let kendalaMap: { [key: number]: RowDataPacket[] } = {};
    
    if (kegiatanIds.length > 0) {
      const [allKendala] = await pool.query<RowDataPacket[]>(
        `SELECT kk.*, u.username as pelapor
         FROM kendala_kegiatan kk
         LEFT JOIN users u ON kk.user_id = u.id
         WHERE kk.kegiatan_operasional_id IN (?)
         ORDER BY kk.tanggal_kejadian DESC`,
        [kegiatanIds]
      );
      
      allKendala.forEach(k => {
        if (!kendalaMap[k.kegiatan_operasional_id]) {
          kendalaMap[k.kegiatan_operasional_id] = [];
        }
        kendalaMap[k.kegiatan_operasional_id].push(k);
      });
    }

    // Calculate summary
    const totalKegiatan = kegiatan.length;
    const kegiatanSelesai = kegiatan.filter(k => k.status === 'selesai').length;
    const kegiatanBerjalan = kegiatan.filter(k => k.status === 'berjalan').length;
    const kegiatanTertunda = kegiatan.filter(k => k.status === 'tertunda').length;
    const totalPagu = kegiatan.reduce((sum, k) => sum + (Number(k.anggaran_pagu) || 0), 0);
    const totalRealisasi = kegiatan.reduce((sum, k) => sum + (Number(k.total_realisasi) || 0), 0);
    const avgProgres = kegiatan.length > 0 
      ? kegiatan.reduce((sum, k) => sum + (Number(k.progres_fisik) || 0), 0) / kegiatan.length 
      : 0;

    // Count total kendala
    const totalKendala = Object.values(kendalaMap).flat().length;
    const kendalaOpen = Object.values(kendalaMap).flat().filter(k => k.status === 'open').length;
    const kendalaResolved = Object.values(kendalaMap).flat().filter(k => k.status === 'resolved').length;

    // Generate period text
    let periodText = `Tahun ${tahun || new Date().getFullYear()}`;
    if (bulan) {
      periodText = `${BULAN_NAMES[bulan - 1]} ${tahun || new Date().getFullYear()}`;
    }

    // Build detail kegiatan sections
    const detailSections: (Paragraph | Table)[] = [];
    
    kegiatan.forEach((k, index) => {
      const kendalaList = kendalaMap[k.id] || [];
      
      // Kegiatan header
      detailSections.push(
        new Paragraph({
          children: [new TextRun({ text: `${index + 1}. ${k.nama}`, bold: true, size: 24 })],
          spacing: { before: 300, after: 100 },
        })
      );

      // Info table for each kegiatan
      detailSections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'KRO', bold: true })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${k.kro_kode} - ${k.kro_nama}` })] })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: getStatusText(k.status) })] })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: tableBorders,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Periode', bold: true })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${formatDate(k.tanggal_mulai)} s/d ${formatDate(k.tanggal_selesai)}` })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Progres Fisik', bold: true })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${k.progres_fisik || 0}%` })] })],
                  borders: tableBorders,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Target Output', bold: true })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${k.target_output || 0} ${k.satuan_output || ''}` })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Target Anggaran', bold: true })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(Number(k.anggaran_pagu) || 0) })] })],
                  borders: tableBorders,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Mitra', bold: true })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: k.mitra_nama !== '-' ? `${k.mitra_nama} (${k.mitra_posisi})` : '-' })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Realisasi Anggaran', bold: true })] })],
                  borders: tableBorders,
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(Number(k.total_realisasi) || 0) })] })],
                  borders: tableBorders,
                }),
              ],
            }),
          ],
        })
      );

      // Deskripsi
      if (k.deskripsi) {
        detailSections.push(
          new Paragraph({
            children: [new TextRun({ text: 'Deskripsi:', bold: true })],
            spacing: { before: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: k.deskripsi, italics: true })],
            spacing: { after: 100 },
          })
        );
      }

      // Kendala section for this kegiatan
      if (kendalaList.length > 0) {
        detailSections.push(
          new Paragraph({
            children: [new TextRun({ text: `Kendala (${kendalaList.length}):`, bold: true })],
            spacing: { before: 100 },
          })
        );

        // Kendala table
        detailSections.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    borders: tableBorders,
                    width: { size: 5, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tanggal', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    borders: tableBorders,
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Deskripsi', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    borders: tableBorders,
                    width: { size: 45, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Dampak', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    borders: tableBorders,
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    borders: tableBorders,
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...kendalaList.map((kendala, ki) => 
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: String(ki + 1) })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: formatDate(kendala.tanggal_kejadian) })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: kendala.deskripsi || '-' })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: getDampakText(kendala.tingkat_dampak) })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: getKendalaStatusText(kendala.status) })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                  ],
                })
              ),
            ],
          })
        );
      } else {
        detailSections.push(
          new Paragraph({
            children: [new TextRun({ text: 'Kendala: Tidak ada kendala', italics: true })],
            spacing: { before: 100 },
          })
        );
      }

      // Add separator
      detailSections.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 200 },
        })
      );
    });

    // Create Word Document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: 'LAPORAN KEGIATAN OPERASIONAL',
                bold: true,
                size: 36,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: String(timNama).toUpperCase(),
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Periode: ${periodText}`,
                size: 26,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // ==================== RINGKASAN ====================
          new Paragraph({
            children: [
              new TextRun({
                text: 'I. RINGKASAN',
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
          }),
          
          // Summary Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              // Row 1
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Kegiatan', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${totalKegiatan} kegiatan` })] })],
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Target Anggaran', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(totalPagu) })] })],
                    borders: tableBorders,
                  }),
                ],
              }),
              // Row 2
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Kegiatan Selesai', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${kegiatanSelesai} kegiatan` })] })],
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Realisasi', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(totalRealisasi) })] })],
                    borders: tableBorders,
                  }),
                ],
              }),
              // Row 3
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Kegiatan Berjalan', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${kegiatanBerjalan} kegiatan` })] })],
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Persentase Serapan', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: totalPagu > 0 ? `${((totalRealisasi / totalPagu) * 100).toFixed(1)}%` : '0%' })] })],
                    borders: tableBorders,
                  }),
                ],
              }),
              // Row 4
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Kegiatan Tertunda', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${kegiatanTertunda} kegiatan` })] })],
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rata-rata Progres Fisik', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${avgProgres.toFixed(1)}%` })] })],
                    borders: tableBorders,
                  }),
                ],
              }),
              // Row 5 - Kendala Summary
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Kendala', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${totalKendala} kendala` })] })],
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: 'Kendala Selesai / Belum', bold: true })] })],
                    borders: tableBorders,
                    shading: { fill: 'F0F0F0' },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${kendalaResolved} selesai / ${kendalaOpen} belum` })] })],
                    borders: tableBorders,
                  }),
                ],
              }),
            ],
          }),

          // ==================== DAFTAR KEGIATAN ====================
          new Paragraph({
            children: [
              new TextRun({
                text: 'II. DAFTAR KEGIATAN',
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          // Summary table of all kegiatan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              // Header row
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 4, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Nama Kegiatan', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 22, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'KRO', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Mitra', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 14, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Progres', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 8, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Target Anggaran', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 12, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Realisasi', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 12, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Kendala', bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'CCCCCC' },
                    borders: tableBorders,
                    width: { size: 8, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // Data rows
              ...kegiatan.map((k, index) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String(index + 1) })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String(k.nama || '-') })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String(k.kro_kode || '-') })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String(k.mitra_nama || '-') })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `${k.progres_fisik || 0}%` })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(Number(k.anggaran_pagu) || 0), size: 18 })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(Number(k.total_realisasi) || 0), size: 18 })] })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: getStatusText(k.status) })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String((kendalaMap[k.id] || []).length) })], alignment: AlignmentType.CENTER })],
                      borders: tableBorders,
                    }),
                  ],
                })
              ),
            ],
          }),

          // ==================== DETAIL KEGIATAN ====================
          new Paragraph({
            children: [
              new TextRun({
                text: 'III. DETAIL KEGIATAN',
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          // Detail sections
          ...detailSections,

          // ==================== FOOTER ====================
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}`,
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Dibuat oleh: ${userName}`,
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }],
    });

    // Generate document buffer
    const buffer = await Packer.toBuffer(doc);

    // Return as downloadable file
    const fileName = `Laporan_Kegiatan_${periodText.replace(/\s+/g, '_')}.docx`;
    
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: unknown) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
