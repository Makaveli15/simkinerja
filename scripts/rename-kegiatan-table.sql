-- Script untuk rename tabel kegiatan_operasional menjadi kegiatan
-- Tanggal: 1 Februari 2026

-- Nonaktifkan foreign key checks sementara
SET FOREIGN_KEY_CHECKS = 0;

-- Rename tabel
RENAME TABLE `kegiatan_operasional` TO `kegiatan`;

-- Aktifkan kembali foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verifikasi
SELECT 'Tabel berhasil di-rename:' AS info;
SHOW TABLES LIKE 'kegiatan%';
