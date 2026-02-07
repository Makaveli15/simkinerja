-- Script: Fix Approval Workflow untuk tabel kegiatan
-- Tanggal: 2026-02-07
-- Deskripsi: Menambahkan kolom-kolom yang diperlukan untuk multi-level approval workflow
-- Urutan: Pelaksana -> Koordinator -> PPK -> Pimpinan (Kepala)
-- PENTING: Jalankan script ini di phpMyAdmin atau MySQL CLI

-- ==============================================
-- STEP 1: Tambah kolom status_pengajuan jika belum ada
-- ==============================================

-- Tambah kolom status_pengajuan
ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS status_pengajuan ENUM(
    'draft', 
    'diajukan',        -- Diajukan ke Koordinator
    'review_ppk',      -- Sudah disetujui Koordinator, menunggu PPK
    'review_kepala',   -- Sudah disetujui PPK, menunggu Kepala/Pimpinan
    'disetujui',       -- Disetujui oleh Kepala/Pimpinan
    'ditolak',         -- Ditolak oleh salah satu approver
    'revisi'           -- Perlu revisi dari pelaksana
) DEFAULT 'draft';

-- ==============================================
-- STEP 2: Tambah kolom tanggal pengajuan
-- ==============================================

ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS tanggal_pengajuan DATETIME NULL;

-- ==============================================
-- STEP 3: Tambah kolom untuk tracking approval Koordinator
-- ==============================================

ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by_koordinator INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval_koordinator DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_koordinator TEXT NULL;

-- ==============================================
-- STEP 4: Tambah kolom untuk tracking approval PPK
-- ==============================================

ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by_ppk INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval_ppk DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_ppk TEXT NULL;

-- ==============================================
-- STEP 5: Tambah kolom untuk tracking approval Kepala/Pimpinan
-- ==============================================

ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by_kepala INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval_kepala DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_kepala TEXT NULL;

-- ==============================================
-- STEP 6: Tambah kolom legacy (approved_by, tanggal_approval) jika belum ada
-- ==============================================

ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_approval TEXT NULL;

-- ==============================================
-- STEP 7: Update default value untuk data existing
-- ==============================================

-- Set status_pengajuan = 'draft' untuk kegiatan yang belum memiliki status
UPDATE kegiatan 
SET status_pengajuan = 'draft' 
WHERE status_pengajuan IS NULL;

-- ==============================================
-- STEP 8: Buat tabel approval_history untuk audit trail
-- ==============================================

CREATE TABLE IF NOT EXISTS approval_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_id INT NOT NULL,
    user_id INT NOT NULL,
    role_approver ENUM('koordinator', 'ppk', 'kepala') NOT NULL,
    action ENUM('approve', 'reject', 'revisi') NOT NULL,
    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_approval_history_kegiatan (kegiatan_id),
    INDEX idx_approval_history_user (user_id)
);

-- Tambahkan foreign key jika belum ada (opsional, bisa gagal jika sudah ada)
-- ALTER TABLE approval_history ADD CONSTRAINT fk_approval_kegiatan FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE;
-- ALTER TABLE approval_history ADD CONSTRAINT fk_approval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==============================================
-- STEP 9: Verifikasi
-- ==============================================

-- Tampilkan struktur tabel setelah migrasi
DESCRIBE kegiatan;

-- Tampilkan contoh data
SELECT id, nama, status, status_pengajuan, tanggal_pengajuan 
FROM kegiatan 
LIMIT 5;
