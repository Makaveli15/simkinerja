-- Script untuk menambahkan kolom-kolom yang diperlukan pada tabel kegiatan_operasional
-- Jalankan script ini di phpMyAdmin atau MySQL client

-- Tambah kolom output_realisasi
ALTER TABLE kegiatan_operasional
ADD COLUMN IF NOT EXISTS output_realisasi DECIMAL(15,2) DEFAULT 0.00 AFTER satuan_output;

-- Tambah kolom status_verifikasi
ALTER TABLE kegiatan_operasional
ADD COLUMN IF NOT EXISTS status_verifikasi ENUM('belum_verifikasi', 'diverifikasi', 'ditolak') DEFAULT 'belum_verifikasi' AFTER status;

-- Tambah kolom tanggal_realisasi_selesai
ALTER TABLE kegiatan_operasional
ADD COLUMN IF NOT EXISTS tanggal_realisasi_selesai DATE NULL AFTER tanggal_selesai;

-- Tambah status belum_mulai jika belum ada
ALTER TABLE kegiatan_operasional 
MODIFY COLUMN status ENUM('belum_mulai', 'berjalan', 'selesai', 'tertunda') DEFAULT 'berjalan';

-- Buat tabel realisasi_anggaran jika belum ada
CREATE TABLE IF NOT EXISTS realisasi_anggaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_operasional_id INT NOT NULL,
    tanggal_realisasi DATE NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Index untuk realisasi_anggaran
CREATE INDEX IF NOT EXISTS idx_realisasi_kegiatan ON realisasi_anggaran(kegiatan_operasional_id);
CREATE INDEX IF NOT EXISTS idx_realisasi_tanggal ON realisasi_anggaran(tanggal_realisasi);

-- Buat tabel progres_kegiatan jika belum ada
CREATE TABLE IF NOT EXISTS progres_kegiatan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_operasional_id INT NOT NULL,
    user_id INT NOT NULL,
    tanggal_update DATE NOT NULL,
    progres_persen DECIMAL(5,2) DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk progres_kegiatan
CREATE INDEX IF NOT EXISTS idx_progres_kegiatan ON progres_kegiatan(kegiatan_operasional_id);
