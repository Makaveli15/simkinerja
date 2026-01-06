-- Script untuk update schema sistem pelaksana
-- Menambahkan relasi ke KRO dan Mitra

-- Update tabel kegiatan_operasional dengan foreign key ke KRO
ALTER TABLE kegiatan_operasional
ADD COLUMN IF NOT EXISTS kro_id INT NULL AFTER tim_id,
ADD COLUMN IF NOT EXISTS mitra_id INT NULL AFTER kro_id;

-- Tambah foreign key jika belum ada
-- ALTER TABLE kegiatan_operasional ADD FOREIGN KEY (kro_id) REFERENCES kro(id) ON DELETE SET NULL;
-- ALTER TABLE kegiatan_operasional ADD FOREIGN KEY (mitra_id) REFERENCES mitra(id) ON DELETE SET NULL;

-- Buat tabel KRO jika belum ada
CREATE TABLE IF NOT EXISTS kro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tahun INT NOT NULL,
    target_output VARCHAR(255),
    satuan VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Buat tabel Mitra jika belum ada
CREATE TABLE IF NOT EXISTS mitra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    nik VARCHAR(20),
    alamat TEXT,
    no_hp VARCHAR(20),
    email VARCHAR(100),
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample KRO data
INSERT IGNORE INTO kro (kode, nama, deskripsi, tahun, target_output, satuan) VALUES
('KRO.001', 'Pengumpulan Data Statistik', 'Kegiatan pengumpulan data statistik dasar', 2026, '100', 'dokumen'),
('KRO.002', 'Pengolahan Data Statistik', 'Kegiatan pengolahan dan analisis data statistik', 2026, '50', 'laporan'),
('KRO.003', 'Diseminasi Statistik', 'Kegiatan penyebarluasan informasi statistik', 2026, '12', 'publikasi'),
('KRO.004', 'Pembinaan Statistik Sektoral', 'Kegiatan pembinaan statistik sektoral kepada instansi', 2026, '24', 'kegiatan'),
('KRO.005', 'Sensus dan Survei', 'Pelaksanaan sensus dan survei statistik', 2026, '6', 'survei');

-- Insert sample Mitra data
INSERT IGNORE INTO mitra (nama, nik, alamat, no_hp, email, status) VALUES
('Ahmad Rizki', '5305012345670001', 'Jl. Merdeka No. 1', '081234567890', 'ahmad@email.com', 'aktif'),
('Siti Rahayu', '5305012345670002', 'Jl. Sudirman No. 2', '081234567891', 'siti@email.com', 'aktif'),
('Budi Santoso', '5305012345670003', 'Jl. Diponegoro No. 3', '081234567892', 'budi@email.com', 'aktif'),
('Dewi Lestari', '5305012345670004', 'Jl. Kartini No. 4', '081234567893', 'dewi@email.com', 'aktif'),
('Eko Prasetyo', '5305012345670005', 'Jl. Ahmad Yani No. 5', '081234567894', 'eko@email.com', 'aktif');

-- Index
CREATE INDEX IF NOT EXISTS idx_kro_tahun ON kro(tahun);
CREATE INDEX IF NOT EXISTS idx_mitra_status ON mitra(status);
CREATE INDEX IF NOT EXISTS idx_kegiatan_kro ON kegiatan_operasional(kro_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_mitra ON kegiatan_operasional(mitra_id);
