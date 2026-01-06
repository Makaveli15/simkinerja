const mysql = require('mysql2/promise');

async function createTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'simkinerja',
    multipleStatements: true
  });

  try {
    console.log('🔄 Membuat tabel sistem pelaksana...\n');

    // Tabel kegiatan_operasional
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kegiatan_operasional (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tim_id INT NOT NULL,
        created_by INT NOT NULL,
        nama VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        tanggal_mulai DATE NOT NULL,
        tanggal_selesai DATE,
        target_output VARCHAR(255),
        satuan_output VARCHAR(50) DEFAULT 'kegiatan',
        anggaran_pagu DECIMAL(15, 2) DEFAULT 0,
        status ENUM('belum_mulai', 'berjalan', 'selesai', 'tertunda') DEFAULT 'berjalan',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tim_id) REFERENCES tim(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabel kegiatan_operasional dibuat');

    // Tabel progres_kegiatan
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS progres_kegiatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kegiatan_operasional_id INT NOT NULL,
        tanggal_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        capaian_output DECIMAL(5, 2) DEFAULT 0,
        ketepatan_waktu DECIMAL(5, 2) DEFAULT 0,
        kualitas_output DECIMAL(5, 2) DEFAULT 0,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabel progres_kegiatan dibuat');

    // Tabel realisasi_fisik
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS realisasi_fisik (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kegiatan_operasional_id INT NOT NULL,
        tanggal_realisasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        persentase DECIMAL(5, 2) NOT NULL,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabel realisasi_fisik dibuat');

    // Tabel realisasi_anggaran
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS realisasi_anggaran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kegiatan_operasional_id INT NOT NULL,
        tanggal_realisasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        jumlah DECIMAL(15, 2) NOT NULL,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabel realisasi_anggaran dibuat');

    // Tabel kendala_kegiatan
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kendala_kegiatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kegiatan_operasional_id INT NOT NULL,
        tanggal_kendala TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deskripsi TEXT NOT NULL,
        tingkat_prioritas ENUM('rendah', 'sedang', 'tinggi') DEFAULT 'sedang',
        status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabel kendala_kegiatan dibuat');

    // Tabel tindak_lanjut
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tindak_lanjut (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kendala_id INT NOT NULL,
        tanggal_tindak_lanjut TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deskripsi TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kendala_id) REFERENCES kendala_kegiatan(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabel tindak_lanjut dibuat');

    // Create indexes
    console.log('\n🔄 Membuat index...');
    
    try {
      await connection.execute('CREATE INDEX idx_kegiatan_tim ON kegiatan_operasional(tim_id)');
    } catch (e) { /* Index mungkin sudah ada */ }
    
    try {
      await connection.execute('CREATE INDEX idx_kegiatan_status ON kegiatan_operasional(status)');
    } catch (e) { /* Index mungkin sudah ada */ }
    
    try {
      await connection.execute('CREATE INDEX idx_progres_kegiatan ON progres_kegiatan(kegiatan_operasional_id)');
    } catch (e) { /* Index mungkin sudah ada */ }
    
    try {
      await connection.execute('CREATE INDEX idx_kendala_status ON kendala_kegiatan(status)');
    } catch (e) { /* Index mungkin sudah ada */ }

    console.log('✅ Index dibuat');

    console.log('\n🎉 Semua tabel berhasil dibuat!');
    console.log('\n📋 Struktur Tabel:');
    console.log('   - kegiatan_operasional: Kegiatan utama tim');
    console.log('   - progres_kegiatan: Indikator kinerja (capaian, waktu, kualitas)');
    console.log('   - realisasi_fisik: Progres fisik kegiatan');
    console.log('   - realisasi_anggaran: Serapan anggaran');
    console.log('   - kendala_kegiatan: Daftar kendala');
    console.log('   - tindak_lanjut: Tindak lanjut kendala');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createTables();
