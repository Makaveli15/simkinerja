-- Add validation_type column to satuan_output table
-- 'dokumen' = requires document upload for validation
-- 'kuantitas' = requires quantity input (with optional supporting documents)

ALTER TABLE satuan_output
ADD COLUMN IF NOT EXISTS jenis_validasi ENUM('dokumen', 'kuantitas') DEFAULT 'kuantitas';

-- Update existing satuan output with appropriate validation types
-- Dokumen-based outputs (require file upload)
UPDATE satuan_output SET jenis_validasi = 'dokumen' WHERE nama IN (
  'Dokumen',
  'Publikasi',
  'Peta',
  'Lembar',
  'Tabel'
);

-- Quantity-based outputs (require number input)
UPDATE satuan_output SET jenis_validasi = 'kuantitas' WHERE nama IN (
  'Responden',
  'Orang Kegiatan',
  'Orang Jam Pelajaran',
  'Orang Perjalanan',
  'Orang Bulan',
  'Orang Jam',
  'Orang Hari',
  'Orang',
  'Unit',
  'Buah',
  'Tahun',
  'Layanan',
  'Wilayah',
  'Data',
  'Set',
  'Paket'
);

-- Add column to kegiatan table for tracking validated output (for kuantitas type)
ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS output_tervalidasi INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tervalidasi_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS output_validated_by INT NULL,
ADD COLUMN IF NOT EXISTS output_validation_note TEXT NULL;

-- Create table for quantity output validation history
CREATE TABLE IF NOT EXISTS validasi_output_kuantitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_id INT NOT NULL,
  jumlah_output INT NOT NULL,
  bukti_pendukung TEXT, -- JSON array of file paths
  keterangan TEXT,
  status_validasi ENUM('pending', 'valid', 'revisi') DEFAULT 'pending',
  validated_by_koordinator INT NULL,
  validasi_koordinator_at TIMESTAMP NULL,
  feedback_koordinator TEXT,
  validated_by_pimpinan INT NULL,
  validasi_pimpinan_at TIMESTAMP NULL,
  feedback_pimpinan TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (validated_by_koordinator) REFERENCES users(id),
  FOREIGN KEY (validated_by_pimpinan) REFERENCES users(id)
);
