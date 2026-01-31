-- Script untuk menghapus tabel yang tidak digunakan
-- Tanggal: 1 Februari 2026
-- Tabel yang dihapus:
--   1. laporan_kinerja - tidak ada kode yang menggunakan, FK ke tabel kegiatan yang kosong
--   2. penugasan_tim - tidak digunakan, FK ke tabel kegiatan yang kosong
--   3. kegiatan - tabel lama yang sudah digantikan oleh kegiatan_operasional

-- Nonaktifkan foreign key checks sementara
SET FOREIGN_KEY_CHECKS = 0;

-- Hapus tabel laporan_kinerja (tidak ada data, tidak digunakan dalam aplikasi)
DROP TABLE IF EXISTS `laporan_kinerja`;

-- Hapus tabel penugasan_tim (tidak ada data, FK ke kegiatan yang tidak digunakan)
DROP TABLE IF EXISTS `penugasan_tim`;

-- Hapus tabel kegiatan (tabel lama, sudah digantikan oleh kegiatan_operasional)
DROP TABLE IF EXISTS `kegiatan`;

-- Aktifkan kembali foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verifikasi tabel sudah terhapus
SELECT 'Tabel yang tersisa:' AS info;
SHOW TABLES;
