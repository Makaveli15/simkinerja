// Script untuk memanggil auto-complete service langsung
const mysql = require('mysql2/promise');

async function autoComplete(kegiatanId) {
  const pool = await mysql.createPool({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'simkinerja' 
  });
  
  console.log(`\n=== Auto-Complete Kegiatan ID: ${kegiatanId} ===\n`);
  
  // 1. Ambil data kegiatan
  const [kegiatanRows] = await pool.query(`
    SELECT id, nama, target_output, satuan_output, jenis_validasi, anggaran_pagu, status
    FROM kegiatan
    WHERE id = ?
  `, [kegiatanId]);
  
  if (kegiatanRows.length === 0) {
    console.log('Kegiatan tidak ditemukan');
    await pool.end();
    return;
  }
  
  const kegiatan = kegiatanRows[0];
  console.log('Kegiatan:', kegiatan.nama);
  console.log('Status Saat Ini:', kegiatan.status);
  console.log('Jenis Validasi:', kegiatan.jenis_validasi);
  console.log('Target Output:', kegiatan.target_output);
  
  // 2. Hitung output tervalidasi berdasarkan jenis
  let outputTervalidasi = 0;
  
  if (kegiatan.jenis_validasi === 'kuantitas') {
    const [rows] = await pool.query(`
      SELECT COALESCE(SUM(jumlah_output), 0) as total
      FROM validasi_kuantitas
      WHERE kegiatan_id = ? AND status = 'disahkan'
    `, [kegiatanId]);
    outputTervalidasi = parseFloat(rows[0]?.total || 0);
    console.log('Output Tervalidasi (kuantitas):', outputTervalidasi);
  } else {
    // Untuk dokumen
    const [rows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM dokumen_output
      WHERE kegiatan_id = ? 
        AND tipe_dokumen = 'final' 
        AND status_final = 'disahkan'
    `, [kegiatanId]);
    outputTervalidasi = parseInt(rows[0]?.total || 0);
    console.log('Output Tervalidasi (dokumen):', outputTervalidasi);
  }
  
  // 3. Cek kendala open
  const [kendalaRows] = await pool.query(`
    SELECT COUNT(*) as total
    FROM kendala_kegiatan
    WHERE kegiatan_id = ? AND status = 'open'
  `, [kegiatanId]);
  const kendalaOpen = parseInt(kendalaRows[0]?.total || 0);
  console.log('Kendala Open:', kendalaOpen);
  
  // 4. Cek serapan anggaran
  const [realisasiRows] = await pool.query(`
    SELECT COALESCE(SUM(jumlah), 0) as total
    FROM realisasi_anggaran
    WHERE kegiatan_id = ?
  `, [kegiatanId]);
  const anggaranPagu = parseFloat(kegiatan.anggaran_pagu) || 0;
  const totalRealisasi = parseFloat(realisasiRows[0]?.total || 0);
  const serapan = anggaranPagu > 0 ? (totalRealisasi / anggaranPagu) * 100 : 100;
  console.log('Serapan Anggaran:', serapan.toFixed(2) + '%');
  
  // 5. Evaluasi kondisi
  const targetOutput = parseFloat(kegiatan.target_output) || 0;
  const isOutputComplete = outputTervalidasi >= targetOutput;
  const isKendalaResolved = kendalaOpen === 0;
  const isAnggaranTercapai = anggaranPagu <= 0 || serapan >= 50;
  const canAutoComplete = isOutputComplete && isKendalaResolved && isAnggaranTercapai;
  
  console.log('\n--- Kondisi ---');
  console.log('Output Complete:', isOutputComplete, `(${outputTervalidasi}/${targetOutput})`);
  console.log('Kendala Resolved:', isKendalaResolved);
  console.log('Anggaran Tercapai:', isAnggaranTercapai);
  console.log('CAN AUTO-COMPLETE:', canAutoComplete);
  
  if (kegiatan.status === 'selesai') {
    console.log('\n✅ Kegiatan sudah selesai');
    await pool.end();
    return;
  }
  
  if (!canAutoComplete) {
    console.log('\n❌ Tidak memenuhi syarat auto-complete');
    await pool.end();
    return;
  }
  
  // 6. Update status
  console.log('\n🚀 Melakukan Auto-Complete...');
  
  await pool.query(`
    UPDATE kegiatan 
    SET status = 'selesai',
        tanggal_realisasi_selesai = CURDATE(),
        output_realisasi = ?,
        updated_at = NOW()
    WHERE id = ?
  `, [outputTervalidasi, kegiatanId]);
  
  console.log('✅ Status diubah ke: selesai');
  console.log('✅ Output Realisasi diupdate ke:', outputTervalidasi);
  console.log('✅ Tanggal Realisasi Selesai diisi dengan tanggal hari ini');
  
  // Verifikasi
  const [updated] = await pool.query('SELECT status, output_realisasi, tanggal_realisasi_selesai FROM kegiatan WHERE id = ?', [kegiatanId]);
  console.log('\n--- Kegiatan Setelah Update ---');
  console.log(updated[0]);
  
  await pool.end();
}

// Ambil kegiatan ID dari argument atau default ke 11
const kegiatanId = parseInt(process.argv[2]) || 11;
autoComplete(kegiatanId).catch(console.error);
