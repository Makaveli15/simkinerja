-- Script untuk membuat tabel master_indikator_kinerja
-- Tabel ini menyimpan konfigurasi indikator kinerja yang digunakan untuk menghitung skor kinerja kegiatan

CREATE TABLE IF NOT EXISTS master_indikator_kinerja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  bobot DECIMAL(5,2) NOT NULL DEFAULT 0,
  urutan INT NOT NULL DEFAULT 0,
  rumus_perhitungan TEXT,
  satuan VARCHAR(20) DEFAULT '%',
  nilai_min DECIMAL(5,2) DEFAULT 0,
  nilai_max DECIMAL(5,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default indikator kinerja berdasarkan sistem yang sudah ada
INSERT INTO master_indikator_kinerja (kode, nama, deskripsi, bobot, urutan, rumus_perhitungan, satuan) VALUES
('capaian_output', 'Capaian Output', 'Perbandingan output realisasi dengan target output. Semakin tinggi realisasi mendekati atau melebihi target, semakin baik nilai indikator ini.', 30.00, 1, '(output_realisasi / target_output) * 100', '%'),
('ketepatan_waktu', 'Ketepatan Waktu', 'Mengukur apakah kegiatan selesai tepat waktu atau lebih cepat dari jadwal yang ditentukan.', 20.00, 2, 'Berdasarkan selisih tanggal realisasi selesai dengan tanggal target selesai', '%'),
('serapan_anggaran', 'Serapan Anggaran', 'Efisiensi penggunaan anggaran, membandingkan realisasi anggaran dengan pagu anggaran yang ditetapkan.', 20.00, 3, '(realisasi_anggaran / anggaran_pagu) * 100', '%'),
('kualitas_output', 'Kualitas Output', 'Status verifikasi dan validasi dokumen output kegiatan oleh pimpinan.', 20.00, 4, 'Berdasarkan status verifikasi dokumen (valid=100, revisi=50, pending=0)', '%'),
('penyelesaian_kendala', 'Penyelesaian Kendala', 'Rasio kendala yang berhasil diselesaikan terhadap total kendala yang dilaporkan.', 10.00, 5, '(kendala_resolved / total_kendala) * 100', '%');

-- Verifikasi total bobot = 100%
SELECT 
  'Total Bobot' as label,
  SUM(bobot) as total_bobot,
  CASE WHEN SUM(bobot) = 100 THEN 'OK' ELSE 'WARNING: Total bobot tidak 100%' END as status
FROM master_indikator_kinerja
WHERE is_active = TRUE;

-- Query untuk melihat semua indikator
SELECT * FROM master_indikator_kinerja ORDER BY urutan;
