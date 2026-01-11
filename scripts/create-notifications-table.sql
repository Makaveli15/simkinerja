-- Script untuk membuat tabel notifications
-- Jalankan di phpMyAdmin atau MySQL client

USE simkinerja;

-- Cek dan hapus tabel jika sudah ada
DROP TABLE IF EXISTS notifications;

-- Buat tabel notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('evaluasi', 'validasi', 'permintaan_validasi', 'deadline', 'tugas', 'kendala', 'kegiatan') NOT NULL DEFAULT 'kegiatan',
    reference_id INT NULL COMMENT 'ID referensi (kegiatan_id, dokumen_id, evaluasi_id)',
    reference_type VARCHAR(50) NULL COMMENT 'Tipe referensi (kegiatan, dokumen, evaluasi)',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verifikasi tabel
DESCRIBE notifications;

SELECT 'Tabel notifications berhasil dibuat!' as status;
