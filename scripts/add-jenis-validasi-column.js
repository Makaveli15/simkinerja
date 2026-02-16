const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja'
  });

  try {
    console.log('Adding jenis_validasi column to kegiatan table...');
    
    await pool.query(`
      ALTER TABLE kegiatan 
      ADD COLUMN jenis_validasi ENUM('dokumen','kuantitas') DEFAULT 'dokumen' 
      AFTER satuan_output
    `);
    
    console.log('Column added successfully!');

    // Verify
    const [cols] = await pool.query('DESCRIBE kegiatan');
    const jenisValidasiCol = cols.find(c => c.Field === 'jenis_validasi');
    console.log('jenis_validasi column:', jenisValidasiCol);

    // Update kegiatan ID 24 ke kuantitas untuk testing
    await pool.query("UPDATE kegiatan SET jenis_validasi = 'kuantitas' WHERE id = 24");
    console.log('Updated kegiatan ID 24 to jenis_validasi = kuantitas');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error('Error:', error.message);
    }
  }

  await pool.end();
})();
