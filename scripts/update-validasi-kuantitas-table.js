// Script to update validasi_kuantitas table structure
const mysql = require('mysql2/promise');

async function updateValidasiKuantitasTable() {
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
      console.log('Creating validasi_kuantitas table with new structure...');
      
      await pool.query(`
        CREATE TABLE validasi_kuantitas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          kegiatan_id INT NOT NULL,
          jumlah_output DECIMAL(15,2) NOT NULL,
          keterangan TEXT NULL,
          status ENUM('draft', 'menunggu', 'disahkan', 'ditolak') DEFAULT 'draft',
          koordinator_id INT NULL,
          pimpinan_id INT NULL,
          catatan_koordinator TEXT NULL,
          catatan_pimpinan TEXT NULL,
          tanggal_validasi_koordinator TIMESTAMP NULL,
          tanggal_validasi_pimpinan TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_kegiatan_id (kegiatan_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('Table validasi_kuantitas created successfully!');
    } else {
      console.log('Table validasi_kuantitas exists, checking columns...');
      
      // Check if 'status' column exists
      const [statusCol] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'simkinerja' 
        AND TABLE_NAME = 'validasi_kuantitas' 
        AND COLUMN_NAME = 'status'
      `);

      if (statusCol.length === 0) {
        console.log('Adding status column...');
        await pool.query(`
          ALTER TABLE validasi_kuantitas 
          ADD COLUMN status ENUM('draft', 'menunggu', 'disahkan', 'ditolak') DEFAULT 'draft' AFTER keterangan
        `);
        console.log('status column added');
      }

      // Check if koordinator_id column exists
      const [koordinatorCol] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'simkinerja' 
        AND TABLE_NAME = 'validasi_kuantitas' 
        AND COLUMN_NAME = 'koordinator_id'
      `);

      if (koordinatorCol.length === 0) {
        console.log('Adding koordinator_id column...');
        await pool.query(`
          ALTER TABLE validasi_kuantitas 
          ADD COLUMN koordinator_id INT NULL AFTER status
        `);
        console.log('koordinator_id column added');
      }

      // Check if pimpinan_id column exists
      const [pimpinanCol] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'simkinerja' 
        AND TABLE_NAME = 'validasi_kuantitas' 
        AND COLUMN_NAME = 'pimpinan_id'
      `);

      if (pimpinanCol.length === 0) {
        console.log('Adding pimpinan_id column...');
        await pool.query(`
          ALTER TABLE validasi_kuantitas 
          ADD COLUMN pimpinan_id INT NULL AFTER koordinator_id
        `);
        console.log('pimpinan_id column added');
      }

      // Check if catatan_koordinator column exists
      const [catatanKoordinatorCol] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'simkinerja' 
        AND TABLE_NAME = 'validasi_kuantitas' 
        AND COLUMN_NAME = 'catatan_koordinator'
      `);

      if (catatanKoordinatorCol.length === 0) {
        console.log('Adding catatan_koordinator column...');
        await pool.query(`
          ALTER TABLE validasi_kuantitas 
          ADD COLUMN catatan_koordinator TEXT NULL AFTER pimpinan_id
        `);
        console.log('catatan_koordinator column added');
      }

      // Check if catatan_pimpinan column exists
      const [catatanPimpinanCol] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'simkinerja' 
        AND TABLE_NAME = 'validasi_kuantitas' 
        AND COLUMN_NAME = 'catatan_pimpinan'
      `);

      if (catatanPimpinanCol.length === 0) {
        console.log('Adding catatan_pimpinan column...');
        await pool.query(`
          ALTER TABLE validasi_kuantitas 
          ADD COLUMN catatan_pimpinan TEXT NULL AFTER catatan_koordinator
        `);
        console.log('catatan_pimpinan column added');
      }

      // Modify jumlah_output to DECIMAL if needed
      const [jumlahCol] = await pool.query(`
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'simkinerja' 
        AND TABLE_NAME = 'validasi_kuantitas' 
        AND COLUMN_NAME = 'jumlah_output'
      `);

      if (jumlahCol.length > 0 && jumlahCol[0].DATA_TYPE === 'int') {
        console.log('Modifying jumlah_output to DECIMAL...');
        await pool.query(`
          ALTER TABLE validasi_kuantitas 
          MODIFY COLUMN jumlah_output DECIMAL(15,2) NOT NULL
        `);
        console.log('jumlah_output modified to DECIMAL');
      }

      console.log('Table update completed!');
    }

    // Show final table structure
    const [columns] = await pool.query('DESCRIBE validasi_kuantitas');
    console.log('\nFinal table structure:');
    console.table(columns.map(c => ({
      Field: c.Field,
      Type: c.Type,
      Null: c.Null,
      Default: c.Default
    })));

    await pool.end();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updateValidasiKuantitasTable();
