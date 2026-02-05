-- Migration: Add approval workflow for kegiatan
-- Alur: Pelaksana mengajukan → Pimpinan menyetujui → Kegiatan berjalan

-- Tambah kolom untuk approval workflow
ALTER TABLE kegiatan 
ADD COLUMN status_pengajuan ENUM('draft', 'diajukan', 'disetujui', 'ditolak') DEFAULT 'draft' AFTER status,
ADD COLUMN tanggal_pengajuan DATETIME NULL AFTER status_pengajuan,
ADD COLUMN tanggal_approval DATETIME NULL AFTER tanggal_pengajuan,
ADD COLUMN approved_by INT NULL AFTER tanggal_approval,
ADD COLUMN catatan_approval TEXT NULL AFTER approved_by;

-- Add foreign key untuk approved_by
ALTER TABLE kegiatan
ADD CONSTRAINT fk_kegiatan_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update kegiatan yang sudah ada menjadi 'disetujui' agar bisa tetap berjalan
UPDATE kegiatan SET status_pengajuan = 'disetujui' WHERE status IN ('berjalan', 'selesai');
UPDATE kegiatan SET status_pengajuan = 'draft' WHERE status_pengajuan IS NULL;

-- Create index untuk query yang sering digunakan
CREATE INDEX idx_kegiatan_status_pengajuan ON kegiatan(status_pengajuan);
CREATE INDEX idx_kegiatan_approved_by ON kegiatan(approved_by);

-- Verifikasi struktur tabel
DESCRIBE kegiatan;

-- Query untuk melihat kegiatan yang menunggu approval
SELECT id, nama, status, status_pengajuan, tanggal_pengajuan, created_by 
FROM kegiatan 
WHERE status_pengajuan = 'diajukan';
