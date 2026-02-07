-- Migration: Add validation columns to dokumen_output table
-- This script adds the new validation columns while keeping backward compatibility with existing columns

-- Add draft review columns (koordinator)
ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS draft_status_kesubag ENUM('pending', 'diterima', 'ditolak') DEFAULT NULL AFTER status_review;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS draft_feedback_kesubag TEXT NULL AFTER draft_status_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS draft_reviewed_by_kesubag INT NULL AFTER draft_feedback_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS draft_reviewed_at_kesubag TIMESTAMP NULL AFTER draft_reviewed_by_kesubag;

-- Add minta_validasi columns (pelaksana request)
ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS minta_validasi TINYINT(1) DEFAULT 0 AFTER draft_reviewed_at_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS minta_validasi_at TIMESTAMP NULL AFTER minta_validasi;

-- Add koordinator validation columns for final documents
ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_kesubag ENUM('pending', 'valid', 'tidak_valid') DEFAULT NULL AFTER minta_validasi_at;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_feedback_kesubag TEXT NULL AFTER validasi_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_by_kesubag INT NULL AFTER validasi_feedback_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_at_kesubag TIMESTAMP NULL AFTER validasi_by_kesubag;

-- Add pimpinan validation columns for final documents
ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_pimpinan ENUM('pending', 'valid', 'tidak_valid') DEFAULT NULL AFTER validasi_at_kesubag;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_feedback_pimpinan TEXT NULL AFTER validasi_pimpinan;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_by_pimpinan INT NULL AFTER validasi_feedback_pimpinan;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS validasi_at_pimpinan TIMESTAMP NULL AFTER validasi_by_pimpinan;

-- Add final status column
ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS status_final ENUM('draft', 'menunggu_kesubag', 'menunggu_pimpinan', 'revisi', 'disahkan') DEFAULT 'draft' AFTER validasi_at_pimpinan;

ALTER TABLE dokumen_output 
ADD COLUMN IF NOT EXISTS tanggal_disahkan TIMESTAMP NULL AFTER status_final;

-- Add foreign key constraints if they don't exist (run carefully)
-- ALTER TABLE dokumen_output ADD CONSTRAINT fk_draft_reviewed_by FOREIGN KEY (draft_reviewed_by_kesubag) REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE dokumen_output ADD CONSTRAINT fk_validasi_by_kesubag FOREIGN KEY (validasi_by_kesubag) REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE dokumen_output ADD CONSTRAINT fk_validasi_by_pimpinan FOREIGN KEY (validasi_by_pimpinan) REFERENCES users(id) ON DELETE SET NULL;

-- Sync existing data: Copy old status_review values to new draft_status_kesubag if null
UPDATE dokumen_output 
SET draft_status_kesubag = status_review 
WHERE draft_status_kesubag IS NULL AND status_review IS NOT NULL;

-- Copy old catatan_reviewer to draft_feedback_kesubag if null
UPDATE dokumen_output 
SET draft_feedback_kesubag = catatan_reviewer 
WHERE draft_feedback_kesubag IS NULL AND catatan_reviewer IS NOT NULL;

-- Copy old reviewed_by to draft_reviewed_by_kesubag if null
UPDATE dokumen_output 
SET draft_reviewed_by_kesubag = reviewed_by 
WHERE draft_reviewed_by_kesubag IS NULL AND reviewed_by IS NOT NULL;

-- Copy old reviewed_at to draft_reviewed_at_kesubag if null
UPDATE dokumen_output 
SET draft_reviewed_at_kesubag = reviewed_at 
WHERE draft_reviewed_at_kesubag IS NULL AND reviewed_at IS NOT NULL;

-- =====================================================
-- SUMMARY OF WORKFLOW:
-- 
-- DRAFT Documents:
-- 1. Pelaksana uploads draft
-- 2. Koordinator reviews: diterima/ditolak
-- 3. draft_status_kesubag tracks status
-- 4. draft_feedback_kesubag stores feedback
--
-- FINAL Documents:
-- 1. Pelaksana uploads final
-- 2. Pelaksana clicks "Minta Validasi" (minta_validasi=1)
-- 3. Koordinator validates: valid/tidak_valid
--    - validasi_kesubag tracks status
--    - validasi_feedback_kesubag stores feedback
-- 4. If valid, Pimpinan validates: valid/tidak_valid
--    - validasi_pimpinan tracks status
--    - validasi_feedback_pimpinan stores feedback
-- 5. If both valid: status_final='disahkan', tanggal_disahkan=NOW()
-- =====================================================
