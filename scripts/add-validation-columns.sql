-- Migration: Add validation columns to dokumen_output table
-- This migration adds new columns for 2-tier validation workflow
-- Keeps existing columns for backward compatibility
-- Run this in phpMyAdmin or MySQL command line

-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we use a procedure to check and add columns safely

DELIMITER //

DROP PROCEDURE IF EXISTS AddColumnIfNotExists//

CREATE PROCEDURE AddColumnIfNotExists()
BEGIN
    -- Add minta_validasi
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'minta_validasi' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN minta_validasi BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add status_validasi_kesubag
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'status_validasi_kesubag' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN status_validasi_kesubag ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending';
    END IF;
    
    -- Add catatan_validasi_kesubag
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'catatan_validasi_kesubag' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN catatan_validasi_kesubag TEXT NULL;
    END IF;
    
    -- Add validated_by_kesubag
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'validated_by_kesubag' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN validated_by_kesubag INT NULL;
    END IF;
    
    -- Add validated_at_kesubag
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'validated_at_kesubag' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN validated_at_kesubag TIMESTAMP NULL;
    END IF;
    
    -- Add status_validasi_pimpinan
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'status_validasi_pimpinan' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN status_validasi_pimpinan ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending';
    END IF;
    
    -- Add catatan_validasi_pimpinan
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'catatan_validasi_pimpinan' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN catatan_validasi_pimpinan TEXT NULL;
    END IF;
    
    -- Add tanggal_disahkan
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dokumen_output' AND COLUMN_NAME = 'tanggal_disahkan' AND TABLE_SCHEMA = DATABASE()) THEN
        ALTER TABLE dokumen_output ADD COLUMN tanggal_disahkan DATETIME NULL;
    END IF;
END//

DELIMITER ;

-- Run the procedure
CALL AddColumnIfNotExists();

-- Clean up
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- Verify columns
DESCRIBE dokumen_output;
