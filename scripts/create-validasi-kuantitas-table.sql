-- Script untuk membuat tabel validasi_kuantitas
-- Tabel ini digunakan untuk menyimpan data validasi output kuantitas

CREATE TABLE IF NOT EXISTS validasi_kuantitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_id INT NOT NULL,
  jumlah_output DECIMAL(15,2) NOT NULL DEFAULT 0,
  bukti_path VARCHAR(500) NULL,
  keterangan TEXT NULL,
  status ENUM('draft', 'menunggu', 'disahkan', 'ditolak') DEFAULT 'draft',
  
  -- Koordinator validation
  koordinator_id INT NULL,
  status_kesubag ENUM('pending', 'valid', 'tidak_valid') DEFAULT 'pending',
  feedback_kesubag TEXT NULL,
  tanggal_validasi_kesubag DATETIME NULL,
  
  -- Pimpinan validation  
  pimpinan_id INT NULL,
  status_pimpinan ENUM('pending', 'valid', 'tidak_valid') DEFAULT 'pending',
  feedback_pimpinan TEXT NULL,
  tanggal_validasi_pimpinan DATETIME NULL,
  
  -- Catatan dari validator
  catatan_koordinator TEXT NULL,
  catatan_pimpinan TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_vk_kegiatan FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  CONSTRAINT fk_vk_koordinator FOREIGN KEY (koordinator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_vk_pimpinan FOREIGN KEY (pimpinan_id) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_vk_kegiatan (kegiatan_id),
  INDEX idx_vk_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Jika foreign key ke kegiatan_operasional (nama tabel sebenarnya)
-- Uncomment baris di bawah jika perlu:
-- ALTER TABLE validasi_kuantitas DROP FOREIGN KEY fk_vk_kegiatan;
-- ALTER TABLE validasi_kuantitas ADD CONSTRAINT fk_vk_kegiatan FOREIGN KEY (kegiatan_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE;
