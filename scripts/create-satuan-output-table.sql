-- Create master table for satuan output
CREATE TABLE IF NOT EXISTS satuan_output (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default satuan output values
INSERT INTO satuan_output (nama, deskripsi) VALUES
('Dokumen', 'Output berupa dokumen'),
('Publikasi', 'Output berupa publikasi'),
('Layanan', 'Output berupa layanan'),
('Wilayah', 'Output berupa wilayah'),
('Data', 'Output berupa data'),
('Peta', 'Output berupa peta'),
('Orang Kegiatan', 'Output berupa orang kegiatan'),
('Responden', 'Output berupa responden'),
('Orang Jam Pelajaran', 'Output berupa orang jam pelajaran'),
('Orang Perjalanan', 'Output berupa orang perjalanan'),
('Orang Bulan', 'Output berupa orang bulan'),
('Buah', 'Output berupa buah'),
('Tahun', 'Output berupa tahun'),
('Unit', 'Output berupa unit'),
('Lembar', 'Output berupa lembar'),
('Tabel', 'Output berupa tabel'),
('Orang Jam', 'Output berupa orang jam'),
('Orang Hari', 'Output berupa orang hari'),
('Set', 'Output berupa set'),
('Paket', 'Output berupa paket'),
('Orang', 'Output berupa orang')
ON DUPLICATE KEY UPDATE nama = nama;
