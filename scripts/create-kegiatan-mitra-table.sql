-- Migration: Create kegiatan_mitra table for many-to-many relationship
-- Satu kegiatan bisa memiliki banyak mitra

CREATE TABLE IF NOT EXISTS kegiatan_mitra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_id INT NOT NULL,
  mitra_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_kegiatan_mitra (kegiatan_id, mitra_id),
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  FOREIGN KEY (mitra_id) REFERENCES mitra(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Index untuk query yang sering digunakan
CREATE INDEX idx_kegiatan_mitra_kegiatan ON kegiatan_mitra(kegiatan_id);
CREATE INDEX idx_kegiatan_mitra_mitra ON kegiatan_mitra(mitra_id);

-- Migrasi data dari kolom mitra_id di tabel kegiatan (jika ada)
INSERT IGNORE INTO kegiatan_mitra (kegiatan_id, mitra_id)
SELECT id, mitra_id FROM kegiatan WHERE mitra_id IS NOT NULL;

-- Verifikasi
SELECT * FROM kegiatan_mitra;
