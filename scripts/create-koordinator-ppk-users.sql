-- =====================================================
-- SQL Script untuk membuat User Koordinator dan PPK
-- Jalankan setelah add-multi-level-approval.sql
-- =====================================================

-- Pastikan dulu ENUM sudah diupdate
-- ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'pimpinan', 'pelaksana', 'kesubag', 'koordinator', 'ppk') NOT NULL;

-- =====================================================
-- 1. Buat User Koordinator untuk setiap Tim
-- =====================================================

-- Ambil daftar tim yang ada
-- SELECT * FROM tim;

-- Contoh insert koordinator (sesuaikan tim_id dengan tim yang ada)
-- Password: 'koordinator123' (hash bcrypt)
-- Gunakan script JS untuk generate hash yang benar

INSERT INTO users (nama, username, password, role, email, nip, jabatan, tim_id, created_at)
VALUES 
  ('Koordinator Tim IPDS', 'koordinator_ipds', '$2a$10$rOLmKqVBDqNH8uRlGJYjae.LjRqXFhRgLz.T/GR1xhK0LMY4w8DZm', 'koordinator', 'koordinator_ipds@bps.go.id', '199001012020011001', 'Koordinator Tim IPDS', 1, NOW()),
  ('Koordinator Tim Sosial', 'koordinator_sosial', '$2a$10$rOLmKqVBDqNH8uRlGJYjae.LjRqXFhRgLz.T/GR1xhK0LMY4w8DZm', 'koordinator', 'koordinator_sosial@bps.go.id', '199001012020011002', 'Koordinator Tim Sosial', 2, NOW()),
  ('Koordinator Tim Produksi', 'koordinator_produksi', '$2a$10$rOLmKqVBDqNH8uRlGJYjae.LjRqXFhRgLz.T/GR1xhK0LMY4w8DZm', 'koordinator', 'koordinator_produksi@bps.go.id', '199001012020011003', 'Koordinator Tim Produksi', 3, NOW()),
  ('Koordinator Tim Distribusi', 'koordinator_distribusi', '$2a$10$rOLmKqVBDqNH8uRlGJYjae.LjRqXFhRgLz.T/GR1xhK0LMY4w8DZm', 'koordinator', 'koordinator_distribusi@bps.go.id', '199001012020011004', 'Koordinator Tim Distribusi', 4, NOW()),
  ('Koordinator Tim Neraca', 'koordinator_neraca', '$2a$10$rOLmKqVBDqNH8uRlGJYjae.LjRqXFhRgLz.T/GR1xhK0LMY4w8DZm', 'koordinator', 'koordinator_neraca@bps.go.id', '199001012020011005', 'Koordinator Tim Neraca', 5, NOW())
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  role = VALUES(role),
  tim_id = VALUES(tim_id);

-- =====================================================
-- 2. Buat User PPK (Pejabat Pembuat Keputusan)
-- =====================================================

-- PPK tidak terikat pada tim tertentu
INSERT INTO users (nama, username, password, role, email, nip, jabatan, created_at)
VALUES 
  ('PPK BPS', 'ppk', '$2a$10$rOLmKqVBDqNH8uRlGJYjae.LjRqXFhRgLz.T/GR1xhK0LMY4w8DZm', 'ppk', 'ppk@bps.go.id', '198501012015011001', 'Pejabat Pembuat Keputusan', NOW())
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  role = VALUES(role);

-- =====================================================
-- 3. Verifikasi User yang dibuat
-- =====================================================

SELECT id, nama, username, role, tim_id, jabatan 
FROM users 
WHERE role IN ('koordinator', 'ppk')
ORDER BY role, tim_id;

-- =====================================================
-- CATATAN:
-- Password default: 'koordinator123' untuk semua koordinator
-- Password default: 'ppk123' untuk PPK
-- 
-- Hash di atas adalah contoh, gunakan script JS untuk
-- generate hash yang benar dengan bcrypt
-- =====================================================
