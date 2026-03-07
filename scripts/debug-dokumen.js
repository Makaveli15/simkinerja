const mysql = require('mysql2/promise');

async function debug() {
  const pool = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  // Cari kegiatan yang berjalan dengan jenis dokumen
  const [kegiatan] = await pool.query(`
    SELECT k.id, k.nama, k.target_output, k.output_realisasi, k.satuan_output, k.jenis_validasi, k.status, k.anggaran_pagu
    FROM kegiatan k
    WHERE k.status = 'berjalan'
    ORDER BY k.id DESC
    LIMIT 10
  `);
  
  console.log('=== Kegiatan Berjalan ===');
  console.table(kegiatan);
  
  for (const kg of kegiatan) {
    console.log(`\n=== Detail Kegiatan ID: ${kg.id} - ${kg.nama} ===`);
    console.log('Jenis Validasi:', kg.jenis_validasi);
    console.log('Target Output:', kg.target_output);
    
    // Cek dokumen output
    const [dokumen] = await pool.query(`
      SELECT id, nama_file, tipe_dokumen, status_final, minta_validasi
      FROM dokumen_output
      WHERE kegiatan_id = ?
    `, [kg.id]);
    
    console.log('\nDokumen Output:');
    if (dokumen.length > 0) {
      console.table(dokumen);
    } else {
      console.log('  (tidak ada dokumen)');
    }
    
    // Hitung dokumen yang disahkan
    const [countDisahkan] = await pool.query(`
      SELECT COUNT(*) as total
      FROM dokumen_output
      WHERE kegiatan_id = ? AND tipe_dokumen = 'final' AND status_final = 'disahkan'
    `, [kg.id]);
    
    console.log('Dokumen Final Disahkan:', countDisahkan[0].total);
    console.log('Target Output:', kg.target_output);
    console.log('Output Complete?:', countDisahkan[0].total >= parseFloat(kg.target_output || 0));
    
    // Cek kendala
    const [kendala] = await pool.query(`
      SELECT COUNT(*) as total FROM kendala_kegiatan WHERE kegiatan_id = ? AND status = 'open'
    `, [kg.id]);
    console.log('Kendala Open:', kendala[0].total);
    
    // Cek realisasi anggaran
    const [realisasi] = await pool.query(`
      SELECT COALESCE(SUM(jumlah), 0) as total FROM realisasi_anggaran WHERE kegiatan_id = ?
    `, [kg.id]);
    const pagu = parseFloat(kg.anggaran_pagu) || 0;
    const serapan = pagu > 0 ? (parseFloat(realisasi[0].total) / pagu) * 100 : 100;
    console.log('Pagu:', pagu, 'Realisasi:', realisasi[0].total, 'Serapan:', serapan.toFixed(2) + '%');
    
    // Can auto complete?
    const isOutputComplete = countDisahkan[0].total >= parseFloat(kg.target_output || 0);
    const isKendalaResolved = kendala[0].total === 0;
    const isAnggaranTercapai = pagu <= 0 || serapan >= 50;
    
    console.log('\n--- Kondisi Auto-Complete ---');
    console.log('Output Complete:', isOutputComplete);
    console.log('Kendala Resolved:', isKendalaResolved);
    console.log('Anggaran Tercapai:', isAnggaranTercapai);
    console.log('CAN AUTO-COMPLETE:', isOutputComplete && isKendalaResolved && isAnggaranTercapai);
  }
  
  await pool.end();
}

debug().catch(console.error);
