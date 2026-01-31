-- Migration: Add validation columns to dokumen_output table
-- SIMPLE VERSION - Run statements one by one in phpMyAdmin
-- If a column already exists, just skip to the next statement

-- 1. Add minta_validasi column
ALTER TABLE dokumen_output ADD COLUMN minta_validasi BOOLEAN DEFAULT FALSE;

-- 2. Add status_validasi_kesubag column
ALTER TABLE dokumen_output ADD COLUMN status_validasi_kesubag ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending';

-- 3. Add catatan_validasi_kesubag column
ALTER TABLE dokumen_output ADD COLUMN catatan_validasi_kesubag TEXT NULL;

-- 4. Add validated_by_kesubag column
ALTER TABLE dokumen_output ADD COLUMN validated_by_kesubag INT NULL;

-- 5. Add validated_at_kesubag column
ALTER TABLE dokumen_output ADD COLUMN validated_at_kesubag TIMESTAMP NULL;

-- 6. Add status_validasi_pimpinan column
ALTER TABLE dokumen_output ADD COLUMN status_validasi_pimpinan ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending';

-- 7. Add catatan_validasi_pimpinan column
ALTER TABLE dokumen_output ADD COLUMN catatan_validasi_pimpinan TEXT NULL;

-- 8. Add tanggal_disahkan column
ALTER TABLE dokumen_output ADD COLUMN tanggal_disahkan DATETIME NULL;

-- Verify columns - run this last to check
DESCRIBE dokumen_output;
