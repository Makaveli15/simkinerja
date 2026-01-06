-- Script untuk menambahkan kolom batas_waktu ke tabel tindak_lanjut
-- Jalankan script ini di phpMyAdmin atau MySQL CLI

USE simkinerja;

-- Tambah kolom batas_waktu
ALTER TABLE tindak_lanjut 
ADD COLUMN batas_waktu DATE NULL AFTER deskripsi;

-- Verifikasi perubahan
DESCRIBE tindak_lanjut;
