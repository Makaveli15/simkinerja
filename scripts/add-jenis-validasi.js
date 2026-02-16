// Script to add jenis_validasi column to satuan_output table
const mysql = require('mysql2/promise');

async function addJenisValidasiColumn() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'simkinerja',
    waitForConnections: true,
  });

  try {
    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'simkinerja' 
      AND TABLE_NAME = 'satuan_output' 
      AND COLUMN_NAME = 'jenis_validasi'
    `);

    if (columns.length === 0) {
      console.log('Adding jenis_validasi column to satuan_output table...');
      
      await pool.query(`
        ALTER TABLE satuan_output 
        ADD COLUMN jenis_validasi ENUM('dokumen', 'kuantitas') DEFAULT 'dokumen'
      `);
      
      console.log('Column added successfully!');
    } else {
      console.log('Column jenis_validasi already exists.');
    }

    // Update existing records based on satuan type
    console.log('Updating jenis_validasi values...');
    
    // Dokumen-based outputs
    await pool.query(`
      UPDATE satuan_output SET jenis_validasi = 'dokumen' 
      WHERE nama IN ('Dokumen', 'Publikasi', 'Peta', 'Lembar', 'Tabel', 'Data')
    `);
    
    // Quantity-based outputs
    await pool.query(`
      UPDATE satuan_output SET jenis_validasi = 'kuantitas' 
      WHERE nama IN (
        'Responden', 'Orang Kegiatan', 'Orang Jam Pelajaran', 'Orang Perjalanan',
        'Orang Bulan', 'Orang Jam', 'Orang Hari', 'Orang', 'Unit', 'Buah',
        'Tahun', 'Layanan', 'Wilayah', 'Set', 'Paket'
      )
    `);

    // Check current values
    const [results] = await pool.query('SELECT nama, jenis_validasi FROM satuan_output');
    console.log('\nCurrent satuan_output values:');
    console.table(results);

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addJenisValidasiColumn();
