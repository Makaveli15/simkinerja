-- Script untuk membuat tabel sistem pelaksana
-- Jalankan di MySQL/phpMyAdmin

-- Drop existing tables jika ada (hati-hati dengan data!)
-- DROP TABLE IF EXISTS tindak_lanjut;
-- DROP TABLE IF EXISTS kendala_kegiatan;
-- DROP TABLE IF EXISTS realisasi_anggaran;
-- DROP TABLE IF EXISTS realisasi_fisik;
-- DROP TABLE IF EXISTS progres_kegiatan;
-- DROP TABLE IF EXISTS kegiatan_operasional;

-- Tabel kegiatan_operasional (kegiatan yang dibuat pelaksana)
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
);

-- Tabel progres_kegiatan (progres indikator kinerja)
CREATE TABLE IF NOT EXISTS progres_kegiatan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_operasional_id INT NOT NULL,
    tanggal_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    capaian_output DECIMAL(5, 2) DEFAULT 0 COMMENT 'Persentase 0-100',
    ketepatan_waktu DECIMAL(5, 2) DEFAULT 0 COMMENT 'Persentase 0-100',
    kualitas_output DECIMAL(5, 2) DEFAULT 0 COMMENT 'Persentase 0-100',
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel realisasi_fisik
CREATE TABLE IF NOT EXISTS realisasi_fisik (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_operasional_id INT NOT NULL,
    tanggal_realisasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    persentase DECIMAL(5, 2) NOT NULL COMMENT 'Persentase 0-100',
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel realisasi_anggaran
CREATE TABLE IF NOT EXISTS realisasi_anggaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_operasional_id INT NOT NULL,
    tanggal_realisasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jumlah DECIMAL(15, 2) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel kendala_kegiatan
CREATE TABLE IF NOT EXISTS kendala_kegiatan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_operasional_id INT NOT NULL,
    tanggal_kendala TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deskripsi TEXT NOT NULL,
    tingkat_prioritas ENUM('rendah', 'sedang', 'tinggi') DEFAULT 'sedang',
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_operasional_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE
);

-- Tabel tindak_lanjut
CREATE TABLE IF NOT EXISTS tindak_lanjut (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kendala_id INT NOT NULL,
    tanggal_tindak_lanjut TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deskripsi TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kendala_id) REFERENCES kendala_kegiatan(id) ON DELETE CASCADE
);

-- Index untuk optimasi
CREATE INDEX idx_kegiatan_tim ON kegiatan_operasional(tim_id);
CREATE INDEX idx_kegiatan_creator ON kegiatan_operasional(created_by);
CREATE INDEX idx_kegiatan_status ON kegiatan_operasional(status);
CREATE INDEX idx_progres_kegiatan ON progres_kegiatan(kegiatan_operasional_id);
CREATE INDEX idx_realisasi_fisik_kegiatan ON realisasi_fisik(kegiatan_operasional_id);
CREATE INDEX idx_realisasi_anggaran_kegiatan ON realisasi_anggaran(kegiatan_operasional_id);
CREATE INDEX idx_kendala_kegiatan ON kendala_kegiatan(kegiatan_operasional_id);
CREATE INDEX idx_kendala_status ON kendala_kegiatan(status);
CREATE INDEX idx_tindak_lanjut_kendala ON tindak_lanjut(kendala_id);
