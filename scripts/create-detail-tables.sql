-- Script untuk membuat tabel yang dibutuhkan untuk fitur detail kegiatan
-- Jalankan di MySQL/phpMyAdmin

-- Tabel progres_kegiatan (untuk menyimpan progres/capaian)
CREATE TABLE IF NOT EXISTS progres_kegiatan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_operasional_id INT NOT NULL,
  tanggal_update DATE NOT NULL,
  capaian_output DECIMAL(5,2) DEFAULT 0,
  ketepatan_waktu DECIMAL(5,2) DEFAULT 0,
  kualitas_output DECIMAL(5,2) DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel realisasi_fisik (untuk menyimpan realisasi fisik)
CREATE TABLE IF NOT EXISTS realisasi_fisik (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_operasional_id INT NOT NULL,
  tanggal_realisasi DATE NOT NULL,
  persentase DECIMAL(5,2) DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel realisasi_anggaran (untuk menyimpan realisasi anggaran)
CREATE TABLE IF NOT EXISTS realisasi_anggaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_operasional_id INT NOT NULL,
  tanggal_realisasi DATE NOT NULL,
  jumlah DECIMAL(15,2) DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel kendala_kegiatan (untuk menyimpan kendala)
-- Menggunakan created_at untuk ordering karena lebih universal
CREATE TABLE IF NOT EXISTS kendala_kegiatan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_operasional_id INT NOT NULL,
  tanggal_kendala DATE DEFAULT NULL,
  deskripsi TEXT NOT NULL,
  status ENUM('open', 'resolved') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel tindak_lanjut (untuk menyimpan tindak lanjut kendala)
CREATE TABLE IF NOT EXISTS tindak_lanjut (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kendala_id INT NOT NULL,
  tanggal_tindak_lanjut DATE DEFAULT NULL,
  deskripsi TEXT NOT NULL,
  status ENUM('pending', 'in_progress', 'done') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kendala_id) REFERENCES kendala_kegiatan(id) ON DELETE CASCADE
);

-- Tambah kolom ke kegiatan_operasional jika belum ada (MySQL 8.0+)
-- Untuk MySQL versi lama, gunakan ALTER TABLE terpisah

-- Cek dan tambah kolom target_output
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'kegiatan_operasional' AND column_name = 'target_output');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE kegiatan_operasional ADD COLUMN target_output DECIMAL(10,2) DEFAULT NULL', 'SELECT "Column target_output already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cek dan tambah kolom satuan_output  
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'kegiatan_operasional' AND column_name = 'satuan_output');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE kegiatan_operasional ADD COLUMN satuan_output VARCHAR(50) DEFAULT "dokumen"', 'SELECT "Column satuan_output already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cek dan tambah kolom kro_id
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'kegiatan_operasional' AND column_name = 'kro_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE kegiatan_operasional ADD COLUMN kro_id INT DEFAULT NULL', 'SELECT "Column kro_id already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cek dan tambah kolom mitra_id
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'kegiatan_operasional' AND column_name = 'mitra_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE kegiatan_operasional ADD COLUMN mitra_id INT DEFAULT NULL', 'SELECT "Column mitra_id already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
