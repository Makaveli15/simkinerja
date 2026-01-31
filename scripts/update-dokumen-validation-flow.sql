-- Migration: Update dokumen_output table untuk alur validasi bertahap
-- Alur: Pelaksana -> Kesubag (review/validasi) -> Pimpinan (feedback/validasi akhir)

-- =====================================================
-- ALUR DRAFT:
-- 1. Pelaksana upload draft
-- 2. Kesubag review: terima/tolak (feedback jika tolak)
-- 3. Jika terima -> Pimpinan beri feedback
-- 4. Semua feedback visible ke Pelaksana
--
-- ALUR DOKUMEN FINAL & VALIDASI:
-- 1. Pelaksana upload dokumen final
-- 2. Pelaksana klik "Minta Validasi"
-- 3. Kesubag validasi: valid/tidak valid
--    - Tidak valid: feedback ke Pelaksana
--    - Valid: lanjut ke Pimpinan
-- 4. Pimpinan validasi akhir: valid/tidak valid
--    - Tidak valid: feedback ke Pelaksana
--    - Valid: dokumen DISAHKAN
-- =====================================================

-- Rename existing columns untuk DRAFT review (kesubag)
-- status_kesubag -> draft_status_kesubag
-- catatan_kesubag -> draft_feedback_kesubag
-- validated_by_kesubag -> draft_reviewed_by_kesubag
-- validated_at_kesubag -> draft_reviewed_at_kesubag

ALTER TABLE dokumen_output CHANGE COLUMN status_kesubag draft_status_kesubag ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending';
ALTER TABLE dokumen_output CHANGE COLUMN catatan_kesubag draft_feedback_kesubag TEXT NULL;
ALTER TABLE dokumen_output CHANGE COLUMN validated_by_kesubag draft_reviewed_by_kesubag INT NULL;
ALTER TABLE dokumen_output CHANGE COLUMN validated_at_kesubag draft_reviewed_at_kesubag TIMESTAMP NULL;

-- Rename existing columns untuk DRAFT feedback pimpinan
-- catatan_reviewer -> draft_feedback_pimpinan
-- reviewed_by -> draft_reviewed_by_pimpinan
-- reviewed_at -> draft_reviewed_at_pimpinan
-- status_review -> tidak digunakan lagi (akan dihapus nanti)

ALTER TABLE dokumen_output CHANGE COLUMN catatan_reviewer draft_feedback_pimpinan TEXT NULL;
ALTER TABLE dokumen_output CHANGE COLUMN reviewed_by draft_reviewed_by_pimpinan INT NULL;
ALTER TABLE dokumen_output CHANGE COLUMN reviewed_at draft_reviewed_at_pimpinan TIMESTAMP NULL;

-- Drop status_review yang tidak digunakan
ALTER TABLE dokumen_output DROP COLUMN IF EXISTS status_review;

-- Tambah kolom untuk ALUR VALIDASI FINAL
ALTER TABLE dokumen_output 
ADD COLUMN minta_validasi BOOLEAN DEFAULT FALSE 
AFTER draft_reviewed_at_pimpinan;

ALTER TABLE dokumen_output 
ADD COLUMN minta_validasi_at TIMESTAMP NULL 
AFTER minta_validasi;

-- Validasi Kesubag (tahap 1)
ALTER TABLE dokumen_output 
ADD COLUMN validasi_kesubag ENUM('pending', 'valid', 'tidak_valid') DEFAULT 'pending' 
AFTER minta_validasi_at;

ALTER TABLE dokumen_output 
ADD COLUMN validasi_feedback_kesubag TEXT NULL 
AFTER validasi_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN validasi_by_kesubag INT NULL 
AFTER validasi_feedback_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN validasi_at_kesubag TIMESTAMP NULL 
AFTER validasi_by_kesubag;

-- Validasi Pimpinan (tahap 2 - final)
ALTER TABLE dokumen_output 
ADD COLUMN validasi_pimpinan ENUM('pending', 'valid', 'tidak_valid') DEFAULT 'pending' 
AFTER validasi_at_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN validasi_feedback_pimpinan TEXT NULL 
AFTER validasi_pimpinan;

ALTER TABLE dokumen_output 
ADD COLUMN validasi_by_pimpinan INT NULL 
AFTER validasi_feedback_pimpinan;

ALTER TABLE dokumen_output 
ADD COLUMN validasi_at_pimpinan TIMESTAMP NULL 
AFTER validasi_by_pimpinan;

-- Status akhir dokumen (disahkan jika kedua validasi = valid)
ALTER TABLE dokumen_output 
ADD COLUMN status_final ENUM('draft', 'menunggu_kesubag', 'menunggu_pimpinan', 'revisi', 'disahkan') DEFAULT 'draft' 
AFTER validasi_at_pimpinan;

-- =====================================================
-- RINGKASAN KOLOM SETELAH MIGRATION:
-- 
-- DRAFT Review:
-- - draft_status_kesubag: pending/diterima/ditolak
-- - draft_feedback_kesubag: catatan dari kesubag
-- - draft_reviewed_by_kesubag, draft_reviewed_at_kesubag
-- - draft_feedback_pimpinan: feedback dari pimpinan
-- - draft_reviewed_by_pimpinan, draft_reviewed_at_pimpinan
--
-- FINAL Validation:
-- - minta_validasi: boolean (pelaksana request validasi)
-- - minta_validasi_at: timestamp
-- - validasi_kesubag: pending/valid/tidak_valid
-- - validasi_feedback_kesubag, validasi_by_kesubag, validasi_at_kesubag
-- - validasi_pimpinan: pending/valid/tidak_valid
-- - validasi_feedback_pimpinan, validasi_by_pimpinan, validasi_at_pimpinan
-- - status_final: draft/menunggu_kesubag/menunggu_pimpinan/revisi/disahkan
-- =====================================================
