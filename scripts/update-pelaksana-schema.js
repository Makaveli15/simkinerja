const mysql = require('mysql2/promise');

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja',
    multipleStatements: true
  });

  try {
    console.log('🔄 Updating schema untuk sistem pelaksana...\n');

    // Buat tabel KRO
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kro (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kode VARCHAR(50) NOT NULL UNIQUE,
        nama VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        tahun INT NOT NULL,
        target_output VARCHAR(255),
        satuan VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabel kro dibuat/sudah ada');

    // Buat tabel Mitra
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mitra (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        nik VARCHAR(20),
        alamat TEXT,
        no_hp VARCHAR(20),
        email VARCHAR(100),
        status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabel mitra dibuat/sudah ada');

    // Cek dan tambah kolom kro_id ke kegiatan_operasional
    try {
      await connection.execute(`
        ALTER TABLE kegiatan_operasional ADD COLUMN kro_id INT NULL AFTER tim_id
      `);
      console.log('✅ Kolom kro_id ditambahkan ke kegiatan_operasional');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Kolom kro_id sudah ada');
      } else {
        throw e;
      }
    }

    // Cek dan tambah kolom mitra_id ke kegiatan_operasional
    try {
      await connection.execute(`
        ALTER TABLE kegiatan_operasional ADD COLUMN mitra_id INT NULL AFTER kro_id
      `);
      console.log('✅ Kolom mitra_id ditambahkan ke kegiatan_operasional');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Kolom mitra_id sudah ada');
      } else {
        throw e;
      }
    }

    // Insert sample KRO data
    const kroData = [
      ['KRO.001', 'Pengumpulan Data Statistik', 'Kegiatan pengumpulan data statistik dasar'],
      ['KRO.002', 'Pengolahan Data Statistik', 'Kegiatan pengolahan dan analisis data statistik'],
      ['KRO.003', 'Diseminasi Statistik', 'Kegiatan penyebarluasan informasi statistik'],
      ['KRO.004', 'Pembinaan Statistik Sektoral', 'Kegiatan pembinaan statistik sektoral kepada instansi'],
      ['KRO.005', 'Sensus dan Survei', 'Pelaksanaan sensus dan survei statistik']
    ];

    for (const kro of kroData) {
      try {
        await connection.execute(
          'INSERT INTO kro (kode, nama, deskripsi) VALUES (?, ?, ?)',
          kro
        );
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    console.log('✅ Sample data KRO diinsert');

    // Insert sample Mitra data
    const mitraData = [
      ['Ahmad Rizki', 'Pencacah', 'Jl. Merdeka No. 1', 'L', '081234567890', 'SOBAT001', 'ahmad@email.com'],
      ['Siti Rahayu', 'Pencacah', 'Jl. Sudirman No. 2', 'P', '081234567891', 'SOBAT002', 'siti@email.com'],
      ['Budi Santoso', 'Pengawas', 'Jl. Diponegoro No. 3', 'L', '081234567892', 'SOBAT003', 'budi@email.com'],
      ['Dewi Lestari', 'Pencacah', 'Jl. Kartini No. 4', 'P', '081234567893', 'SOBAT004', 'dewi@email.com'],
      ['Eko Prasetyo', 'Pengawas', 'Jl. Ahmad Yani No. 5', 'L', '081234567894', 'SOBAT005', 'eko@email.com']
    ];

    for (const mitra of mitraData) {
      try {
        await connection.execute(
          'INSERT INTO mitra (nama, posisi, alamat, jk, no_telp, sobat_id, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
          mitra
        );
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    console.log('✅ Sample data Mitra diinsert');

    console.log('\n🎉 Schema berhasil diupdate!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateSchema();
