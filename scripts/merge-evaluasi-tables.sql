-- Script untuk menggabungkan tabel evaluasi_pimpinan dan evaluasi_kesubag
-- menjadi satu tabel evaluasi
-- Tanggal: 1 Februari 2026

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Buat tabel evaluasi baru
CREATE TABLE IF NOT EXISTS `evaluasi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kegiatan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_pemberi` enum('pimpinan','kesubag') NOT NULL COMMENT 'Role yang memberikan evaluasi',
  `jenis_evaluasi` enum('catatan','arahan','rekomendasi') NOT NULL DEFAULT 'catatan',
  `isi` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `kegiatan_id` (`kegiatan_id`),
  KEY `user_id` (`user_id`),
  KEY `role_pemberi` (`role_pemberi`),
  CONSTRAINT `evaluasi_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluasi_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Migrasi data dari evaluasi_pimpinan
INSERT INTO `evaluasi` (kegiatan_id, user_id, role_pemberi, jenis_evaluasi, isi, created_at)
SELECT kegiatan_id, user_id, 'pimpinan', jenis_evaluasi, isi, created_at
FROM `evaluasi_pimpinan`;

-- 3. Migrasi data dari evaluasi_kesubag
INSERT INTO `evaluasi` (kegiatan_id, user_id, role_pemberi, jenis_evaluasi, isi, created_at)
SELECT kegiatan_id, user_id, 'kesubag', jenis_evaluasi, isi, created_at
FROM `evaluasi_kesubag`;

-- 4. Hapus tabel lama
DROP TABLE IF EXISTS `evaluasi_pimpinan`;
DROP TABLE IF EXISTS `evaluasi_kesubag`;

SET FOREIGN_KEY_CHECKS = 1;

-- Verifikasi
SELECT 'Tabel evaluasi berhasil dibuat!' AS info;
SELECT * FROM evaluasi ORDER BY created_at DESC;
