-- Migration: Create dokumen_output table
-- Menyimpan file dokumen output kegiatan (draft/final) untuk validasi pimpinan

CREATE TABLE IF NOT EXISTS dokumen_output (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    nama_file VARCHAR(255) NOT NULL,
    nama_asli VARCHAR(255) NOT NULL,
    tipe_file VARCHAR(100) NOT NULL,
    ukuran_file INT NOT NULL DEFAULT 0,
    jenis_dokumen ENUM('draft', 'final') NOT NULL DEFAULT 'draft',
    keterangan TEXT NULL,
    status_review ENUM('pending', 'reviewed', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    catatan_pimpinan TEXT NULL,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_kegiatan (kegiatan_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_jenis (jenis_dokumen),
    INDEX idx_status (status_review),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
