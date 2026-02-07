-- Migration Script: Multi-Level Approval System
-- Tanggal: 2026-02-07
-- Deskripsi: 
--   1. Mengubah role kesubag menjadi koordinator dan menambah role ppk
--   2. Mengubah alur approval dari Pelaksana -> Pimpinan
--      menjadi Pelaksana -> Koordinator -> PPK -> Kepala (Pimpinan)

-- ==============================================
-- STEP 1: Update ENUM role pada tabel users
-- ==============================================

-- Backup dulu data users (opsional - jalankan manual jika diperlukan)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Alter kolom role untuk mengubah kesubag menjadi koordinator dan menambah ppk
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'pimpinan', 'pelaksana', 'koordinator', 'ppk') NOT NULL DEFAULT 'pelaksana';

-- Migrasi user kesubag yang sudah ada menjadi koordinator
UPDATE users SET role = 'koordinator' WHERE role = 'kesubag';

-- ==============================================
-- STEP 2: Update ENUM status_pengajuan di tabel kegiatan
-- ==============================================

-- Cek apakah kolom status_pengajuan sudah ada
-- Jika belum ada, tambahkan dengan ALTER TABLE

-- Update ENUM status_pengajuan untuk multi-level approval
ALTER TABLE kegiatan 
MODIFY COLUMN status_pengajuan ENUM(
    'draft', 
    'diajukan', 
    'review_koordinator', 
    'approved_koordinator',
    'review_ppk', 
    'approved_ppk',
    'review_kepala', 
    'disetujui', 
    'ditolak',
    'revisi'
) DEFAULT 'draft';

-- ==============================================
-- STEP 3: Tambah kolom untuk multi-level approval tracking
-- ==============================================

-- Kolom untuk tracking approval Koordinator
ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by_koordinator INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval_koordinator DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_koordinator TEXT NULL;

-- Kolom untuk tracking approval PPK
ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by_ppk INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval_ppk DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_ppk TEXT NULL;

-- Kolom untuk tracking approval Kepala (rename dari approved_by jika sudah ada)
ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS approved_by_kepala INT NULL,
ADD COLUMN IF NOT EXISTS tanggal_approval_kepala DATETIME NULL,
ADD COLUMN IF NOT EXISTS catatan_kepala TEXT NULL;

-- ==============================================
-- STEP 4: Tambah Foreign Keys
-- ==============================================

-- Foreign key untuk approved_by_koordinator
ALTER TABLE kegiatan
ADD CONSTRAINT fk_kegiatan_approved_koordinator 
FOREIGN KEY (approved_by_koordinator) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key untuk approved_by_ppk
ALTER TABLE kegiatan
ADD CONSTRAINT fk_kegiatan_approved_ppk 
FOREIGN KEY (approved_by_ppk) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key untuk approved_by_kepala
ALTER TABLE kegiatan
ADD CONSTRAINT fk_kegiatan_approved_kepala 
FOREIGN KEY (approved_by_kepala) REFERENCES users(id) ON DELETE SET NULL;

-- ==============================================
-- STEP 5: Tambah Index untuk query performance
-- ==============================================

-- Index untuk filter kegiatan per koordinator (berdasarkan tim)
CREATE INDEX IF NOT EXISTS idx_kegiatan_tim_status ON kegiatan(tim_id, status_pengajuan);

-- ==============================================
-- STEP 6: Migrasi data existing
-- ==============================================

-- Migrasi data approval yang sudah ada ke format baru
-- Pindahkan data approved_by ke approved_by_kepala jika ada
-- UPDATE kegiatan 
-- SET approved_by_kepala = approved_by, 
--     tanggal_approval_kepala = tanggal_approval,
--     catatan_kepala = catatan_approval
-- WHERE approved_by IS NOT NULL AND status_pengajuan = 'disetujui';

-- ==============================================
-- STEP 7: Tabel history approval (opsional - untuk audit trail)
-- ==============================================

CREATE TABLE IF NOT EXISTS approval_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_id INT NOT NULL,
    user_id INT NOT NULL,
    role_approver ENUM('koordinator', 'ppk', 'kepala') NOT NULL,
    action ENUM('approve', 'reject', 'revisi') NOT NULL,
    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_approval_history_kegiatan (kegiatan_id),
    INDEX idx_approval_history_user (user_id)
);

-- ==============================================
-- Selesai
-- ==============================================
-- Jalankan script ini dengan: mysql -u username -p database_name < add-multi-level-approval.sql
