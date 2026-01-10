-- Migration: Create evaluasi_pimpinan table
-- This table stores evaluations (catatan, arahan, rekomendasi) from pimpinan

CREATE TABLE IF NOT EXISTS evaluasi_pimpinan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_id INT NOT NULL,
    user_id INT NOT NULL,
    jenis_evaluasi ENUM('catatan', 'arahan', 'rekomendasi') NOT NULL DEFAULT 'catatan',
    isi TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kegiatan_id) REFERENCES kegiatan_operasional(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_kegiatan (kegiatan_id),
    INDEX idx_user (user_id),
    INDEX idx_jenis (jenis_evaluasi),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some sample data (optional)
-- INSERT INTO evaluasi_pimpinan (kegiatan_id, user_id, jenis_evaluasi, isi) VALUES
-- (1, 3, 'catatan', 'Progres kegiatan sudah baik, lanjutkan koordinasi dengan tim terkait.'),
-- (1, 3, 'arahan', 'Pastikan target output tercapai sesuai timeline.'),
-- (2, 3, 'rekomendasi', 'Pertimbangkan untuk menambah SDM jika diperlukan.');
