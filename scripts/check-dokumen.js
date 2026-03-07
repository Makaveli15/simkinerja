const mysql = require('mysql2/promise');

async function checkDokumen() {
  const pool = await mysql.createPool({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'simkinerja' 
  });
  
  // Kegiatan ID 11
  const [kg] = await pool.query('SELECT id, nama, jenis_validasi, target_output, status, output_realisasi FROM kegiatan WHERE id = 11');
  console.log('Kegiatan:', kg[0]);
  
  // All dokumen output untuk kegiatan 11
  const [allDok] = await pool.query(`
    SELECT id, nama_file, tipe_dokumen, status_final, minta_validasi 
    FROM dokumen_output 
    WHERE kegiatan_id = 11
  `);
  console.log('\nSemua Dokumen Output:');
  console.table(allDok);
  
  // Dokumen output yang disahkan
  const [dok] = await pool.query(`
    SELECT COUNT(*) as total 
    FROM dokumen_output 
    WHERE kegiatan_id = 11 
      AND tipe_dokumen = 'final' 
      AND status_final = 'disahkan'
  `);
  console.log('\nDokumen Final Disahkan:', dok[0].total);
  console.log('Target Output:', kg[0].target_output);
  console.log('Output Complete?:', dok[0].total >= parseFloat(kg[0].target_output || 0));
  
  await pool.end();
}

checkDokumen().catch(console.error);
