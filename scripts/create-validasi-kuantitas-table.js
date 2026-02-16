// Script to create validasi_kuantitas table
const mysql = require('mysql2/promise');

async function createValidasiKuantitasTable() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'simkinerja',
    waitForConnections: true,
  });

  try {
    // Check if table exists
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'simkinerja' 
      AND TABLE_NAME = 'validasi_kuantitas'
    `);

    if (tables.length === 0) {
      console.log('Creating validasi_kuantitas table...');
      
      await pool.query(`
        CREATE TABLE validasi_kuantitas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          kegiatan_id INT NOT NULL,
          jumlah_output INT NOT NULL,
          bukti_path VARCHAR(500) NULL,
          keterangan TEXT NULL,
          status_kesubag ENUM('pending', 'valid', 'tidak_valid') DEFAULT 'pending',
          status_pimpinan ENUM('pending', 'valid', 'tidak_valid') DEFAULT 'pending',
          feedback_kesubag TEXT NULL,
          feedback_pimpinan TEXT NULL,
          validated_kesubag_at TIMESTAMP NULL,
          validated_pimpinan_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE
        )
      `);
      
      console.log('Table validasi_kuantitas created successfully!');
    } else {
      console.log('Table validasi_kuantitas already exists.');
    }

    // Show table structure
    const [columns] = await pool.query('DESCRIBE validasi_kuantitas');
    console.log('\nTable structure:');
    console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Default: c.Default })));

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createValidasiKuantitasTable();
