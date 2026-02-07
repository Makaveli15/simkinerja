-- Script: Fix Approval Workflow (Versi Sederhana)
-- Tanggal: 2026-02-07
-- Jalankan script ini di phpMyAdmin satu per satu jika ada error

-- ===== STEP 1: Cek apakah kolom sudah ada =====
-- Jika error "Duplicate column name", kolom sudah ada - skip ke step berikutnya

-- Tambah kolom status_pengajuan
ALTER TABLE kegiatan ADD COLUMN status_pengajuan VARCHAR(50) DEFAULT 'draft';

-- ===== STEP 2: Tambah kolom tanggal pengajuan =====
ALTER TABLE kegiatan ADD COLUMN tanggal_pengajuan DATETIME NULL;

-- ===== STEP 3: Tambah kolom approval Koordinator =====
ALTER TABLE kegiatan ADD COLUMN approved_by_koordinator INT NULL;
ALTER TABLE kegiatan ADD COLUMN tanggal_approval_koordinator DATETIME NULL;
ALTER TABLE kegiatan ADD COLUMN catatan_koordinator TEXT NULL;

-- ===== STEP 4: Tambah kolom approval PPK =====
ALTER TABLE kegiatan ADD COLUMN approved_by_ppk INT NULL;
ALTER TABLE kegiatan ADD COLUMN tanggal_approval_ppk DATETIME NULL;
ALTER TABLE kegiatan ADD COLUMN catatan_ppk TEXT NULL;

-- ===== STEP 5: Tambah kolom approval Kepala =====
ALTER TABLE kegiatan ADD COLUMN approved_by_kepala INT NULL;
ALTER TABLE kegiatan ADD COLUMN tanggal_approval_kepala DATETIME NULL;
ALTER TABLE kegiatan ADD COLUMN catatan_kepala TEXT NULL;

-- ===== STEP 6: Tambah kolom legacy =====
ALTER TABLE kegiatan ADD COLUMN approved_by INT NULL;
ALTER TABLE kegiatan ADD COLUMN tanggal_approval DATETIME NULL;
ALTER TABLE kegiatan ADD COLUMN catatan_approval TEXT NULL;

-- ===== STEP 7: Set default value =====
UPDATE kegiatan SET status_pengajuan = 'draft' WHERE status_pengajuan IS NULL OR status_pengajuan = '';

-- ===== STEP 8: Buat tabel approval_history =====
CREATE TABLE IF NOT EXISTS approval_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kegiatan_id INT NOT NULL,
    user_id INT NOT NULL,
    role_approver VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== STEP 9: Verifikasi =====
SELECT 
    id, 
    nama, 
    status, 
    status_pengajuan,
    approved_by_koordinator,
    approved_by_ppk,
    approved_by_kepala
FROM kegiatan 
LIMIT 5;

-- ===== SELESAI =====
-- Jika semua berjalan lancar, restart npm run dev
