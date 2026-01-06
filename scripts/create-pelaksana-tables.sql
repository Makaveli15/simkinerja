-- Script untuk membuat tabel tambahan untuk fitur pelaksana
-- Jalankan di MySQL/phpMyAdmin

-- Tabel penugasan_tim (untuk menugaskan kegiatan ke user)
CREATE TABLE IF NOT EXISTS penugasan_tim (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kegiatan_id INT NOT NULL,
    status ENUM('belum', 'berjalan', 'selesai') DEFAULT 'belum',
    prioritas ENUM('rendah', 'sedang', 'tinggi') DEFAULT 'sedang',
    deadline DATE,
    tanggal_mulai DATETIME,
    tanggal_selesai DATETIME,
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE
);

-- Tabel laporan_kinerja (untuk input laporan harian pelaksana)
CREATE TABLE IF NOT EXISTS laporan_kinerja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kegiatan_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    uraian TEXT NOT NULL,
    volume DECIMAL(10, 2) NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE
);

-- Index untuk optimasi query
CREATE INDEX idx_penugasan_user ON penugasan_tim(user_id);
CREATE INDEX idx_penugasan_kegiatan ON penugasan_tim(kegiatan_id);
CREATE INDEX idx_penugasan_status ON penugasan_tim(status);
CREATE INDEX idx_penugasan_deadline ON penugasan_tim(deadline);

CREATE INDEX idx_laporan_user ON laporan_kinerja(user_id);
CREATE INDEX idx_laporan_kegiatan ON laporan_kinerja(kegiatan_id);
CREATE INDEX idx_laporan_tanggal ON laporan_kinerja(tanggal);
