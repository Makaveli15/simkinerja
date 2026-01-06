-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 06 Jan 2026 pada 19.30
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `simkinerja`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `kegiatan`
--

CREATE TABLE `kegiatan` (
  `id` int(11) NOT NULL,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `kro_id` int(11) DEFAULT NULL,
  `anggaran` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `kegiatan_operasional`
--

CREATE TABLE `kegiatan_operasional` (
  `id` int(11) NOT NULL,
  `tim_id` int(11) NOT NULL,
  `kro_id` int(11) DEFAULT NULL,
  `mitra_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `target_output` varchar(255) DEFAULT NULL,
  `satuan_output` varchar(50) DEFAULT NULL,
  `anggaran_pagu` decimal(15,2) DEFAULT 0.00,
  `status` enum('berjalan','selesai','tertunda') DEFAULT 'berjalan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kegiatan_operasional`
--

INSERT INTO `kegiatan_operasional` (`id`, `tim_id`, `kro_id`, `mitra_id`, `created_by`, `nama`, `deskripsi`, `tanggal_mulai`, `tanggal_selesai`, `target_output`, `satuan_output`, `anggaran_pagu`, `status`, `created_at`, `updated_at`) VALUES
(3, 1, 3, 4, 3, 'xcvxx', 'sfsfgdsgsd', '2026-01-06', '2026-01-20', '1', 'dokumen', 1000000000.00, 'berjalan', '2026-01-06 16:32:20', '2026-01-06 16:33:19');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kendala_kegiatan`
--

CREATE TABLE `kendala_kegiatan` (
  `id` int(11) NOT NULL,
  `kegiatan_operasional_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal_kejadian` date NOT NULL,
  `deskripsi` text NOT NULL,
  `tingkat_dampak` enum('rendah','sedang','tinggi') DEFAULT 'sedang',
  `status` enum('open','resolved') DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kendala_kegiatan`
--

INSERT INTO `kendala_kegiatan` (`id`, `kegiatan_operasional_id`, `user_id`, `tanggal_kejadian`, `deskripsi`, `tingkat_dampak`, `status`, `created_at`) VALUES
(3, 3, 3, '2026-01-07', 'dgdfgdffd', 'sedang', 'open', '2026-01-06 17:18:42');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kro`
--

CREATE TABLE `kro` (
  `id` int(11) NOT NULL,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kro`
--

INSERT INTO `kro` (`id`, `kode`, `nama`, `deskripsi`, `created_at`) VALUES
(1, '4324234', 'Bajhjhj', 'sgsdg', '2026-01-06 07:36:55'),
(2, 'KRO.001', 'Pengumpulan Data Statistik', 'Kegiatan pengumpulan data statistik dasar', '2026-01-06 12:41:46'),
(3, 'KRO.002', 'Pengolahan Data Statistik', 'Kegiatan pengolahan dan analisis data statistik', '2026-01-06 12:41:46'),
(4, 'KRO.003', 'Diseminasi Statistik', 'Kegiatan penyebarluasan informasi statistik', '2026-01-06 12:41:46'),
(5, 'KRO.004', 'Pembinaan Statistik Sektoral', 'Kegiatan pembinaan statistik sektoral kepada instansi', '2026-01-06 12:41:46'),
(6, 'KRO.005', 'Sensus dan Survei', 'Pelaksanaan sensus dan survei statistik', '2026-01-06 12:41:46');

-- --------------------------------------------------------

--
-- Struktur dari tabel `laporan_kinerja`
--

CREATE TABLE `laporan_kinerja` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `uraian` text NOT NULL,
  `volume` decimal(10,2) NOT NULL,
  `satuan` varchar(50) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `mitra`
--

CREATE TABLE `mitra` (
  `id` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `posisi` varchar(100) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `jk` enum('L','P') DEFAULT NULL,
  `no_telp` varchar(50) DEFAULT NULL,
  `sobat_id` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `mitra`
--

INSERT INTO `mitra` (`id`, `nama`, `posisi`, `alamat`, `jk`, `no_telp`, `sobat_id`, `email`, `created_at`) VALUES
(1, 'Ahmad Rizki', 'Pencacah', 'Jl. Merdeka No. 1', 'L', '081234567890', 'SOBAT001', 'ahmad@email.com', '2026-01-06 12:44:39'),
(2, 'Siti Rahayu', 'Pencacah', 'Jl. Sudirman No. 2', 'P', '081234567891', 'SOBAT002', 'siti@email.com', '2026-01-06 12:44:39'),
(3, 'Budi Santoso', 'Pengawas', 'Jl. Diponegoro No. 3', 'L', '081234567892', 'SOBAT003', 'budi@email.com', '2026-01-06 12:44:39'),
(4, 'Dewi Lestari', 'Pencacah', 'Jl. Kartini No. 4', 'P', '081234567893', 'SOBAT004', 'dewi@email.com', '2026-01-06 12:44:39'),
(5, 'Eko Prasetyo', 'Pengawas', 'Jl. Ahmad Yani No. 5', 'L', '081234567894', 'SOBAT005', 'eko@email.com', '2026-01-06 12:44:39');

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifications_read`
--

CREATE TABLE `notifications_read` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `notification_id` varchar(100) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `notifications_read`
--

INSERT INTO `notifications_read` (`id`, `user_id`, `notification_id`, `read_at`) VALUES
(1, 1, 'user-3', '2026-01-06 09:34:35'),
(2, 1, 'user-2', '2026-01-06 09:34:35'),
(3, 1, 'user-1', '2026-01-06 09:34:35'),
(7, 1, 'mitra-5', '2026-01-06 13:50:29'),
(8, 1, 'mitra-2', '2026-01-06 13:50:29'),
(9, 1, 'mitra-3', '2026-01-06 13:50:29'),
(22, 1, 'mitra-1', '2026-01-06 13:50:34');

-- --------------------------------------------------------

--
-- Struktur dari tabel `penugasan_tim`
--

CREATE TABLE `penugasan_tim` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `status` enum('belum','berjalan','selesai') DEFAULT 'belum',
  `prioritas` enum('rendah','sedang','tinggi') DEFAULT 'sedang',
  `deadline` date DEFAULT NULL,
  `tanggal_mulai` datetime DEFAULT NULL,
  `tanggal_selesai` datetime DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `progres_kegiatan`
--

CREATE TABLE `progres_kegiatan` (
  `id` int(11) NOT NULL,
  `kegiatan_operasional_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal_update` date NOT NULL,
  `capaian_output` decimal(5,2) DEFAULT 0.00,
  `ketepatan_waktu` decimal(5,2) DEFAULT 0.00,
  `kualitas_output` decimal(5,2) DEFAULT 0.00,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `progres_kegiatan`
--

INSERT INTO `progres_kegiatan` (`id`, `kegiatan_operasional_id`, `user_id`, `tanggal_update`, `capaian_output`, `ketepatan_waktu`, `kualitas_output`, `keterangan`, `created_at`) VALUES
(4, 3, 3, '2026-01-07', 10.00, 5.00, 10.00, 'dfgdfgfh', '2026-01-06 17:18:13');

-- --------------------------------------------------------

--
-- Struktur dari tabel `realisasi_anggaran`
--

CREATE TABLE `realisasi_anggaran` (
  `id` int(11) NOT NULL,
  `kegiatan_operasional_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal_realisasi` date NOT NULL,
  `jumlah` decimal(15,2) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `realisasi_anggaran`
--

INSERT INTO `realisasi_anggaran` (`id`, `kegiatan_operasional_id`, `user_id`, `tanggal_realisasi`, `jumlah`, `keterangan`, `created_at`) VALUES
(4, 3, 3, '2026-01-07', 10000000.00, NULL, '2026-01-06 17:18:31');

-- --------------------------------------------------------

--
-- Struktur dari tabel `realisasi_fisik`
--

CREATE TABLE `realisasi_fisik` (
  `id` int(11) NOT NULL,
  `kegiatan_operasional_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal_realisasi` date NOT NULL,
  `persentase` decimal(5,2) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `realisasi_fisik`
--

INSERT INTO `realisasi_fisik` (`id`, `kegiatan_operasional_id`, `user_id`, `tanggal_realisasi`, `persentase`, `keterangan`, `created_at`) VALUES
(5, 3, 3, '2026-01-07', 10.00, 'sfdgsdg', '2026-01-06 17:18:23');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tim`
--

CREATE TABLE `tim` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `tim`
--

INSERT INTO `tim` (`id`, `nama`, `deskripsi`, `created_at`) VALUES
(1, 'Distribusi', NULL, '2026-01-06 06:42:06'),
(2, 'Produksi', NULL, '2026-01-06 06:42:06'),
(3, 'Sosial', NULL, '2026-01-06 06:42:06'),
(4, 'IPDS', NULL, '2026-01-06 06:42:06'),
(5, 'Nerwilis', NULL, '2026-01-06 06:42:06'),
(6, 'Desa Cantik', NULL, '2026-01-06 06:42:06'),
(7, 'PSS', NULL, '2026-01-06 06:42:06'),
(8, 'IPM', NULL, '2026-01-06 06:42:06'),
(9, 'ZI', NULL, '2026-01-06 06:42:06');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tindak_lanjut`
--

CREATE TABLE `tindak_lanjut` (
  `id` int(11) NOT NULL,
  `kendala_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `deskripsi` text NOT NULL,
  `batas_waktu` date DEFAULT NULL,
  `status` enum('direncanakan','dalam_proses','selesai') DEFAULT 'direncanakan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `upload_laporan`
--

CREATE TABLE `upload_laporan` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `periode_bulan` int(11) NOT NULL,
  `periode_tahun` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `upload_laporan`
--

INSERT INTO `upload_laporan` (`id`, `user_id`, `judul`, `periode_bulan`, `periode_tahun`, `file_path`, `file_name`, `keterangan`, `created_at`, `updated_at`) VALUES
(1, 3, 'xxx', 1, 2026, '/uploads/laporan/laporan_3_1767724023409.xls', 'Kegiatan_ZI_2026-01.xls', 'ggg', '2026-01-06 18:27:03', '2026-01-06 18:27:03');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','pimpinan','pelaksana') NOT NULL DEFAULT 'pelaksana',
  `status` enum('aktif','nonaktif') DEFAULT 'aktif',
  `tim_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `tim_id`, `created_at`, `foto`) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$e7gIxG1qKkpTtOQPqTTkd.BTk3xdhMc/T2LnHL6L1lx.6rU2U2UYe', 'admin', 'aktif', NULL, '2026-01-06 06:08:43', 'data:image/webp;base64,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'),
(2, 'kepala', 'kepala@gmail.com', '$2b$10$778lLua2JviEwlxUpEa6mO9Aqz3u8ZVPphBoyruu7Qta0QpjObUjK', 'pimpinan', 'aktif', NULL, '2026-01-06 06:34:24', NULL),
(3, 'jungker', 'jungker@gmail.com', '$2b$10$SjHoKIyp3YRTtIf1TLP2N.pdNng7dQv.dFF92PQgh0oGYVKdkYY4.', 'pelaksana', 'aktif', 1, '2026-01-06 07:35:47', NULL);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`),
  ADD KEY `kro_id` (`kro_id`);

--
-- Indeks untuk tabel `kegiatan_operasional`
--
ALTER TABLE `kegiatan_operasional`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_kegiatan_tim` (`tim_id`),
  ADD KEY `idx_kegiatan_status` (`status`);

--
-- Indeks untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_operasional_id` (`kegiatan_operasional_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_kendala_status` (`status`);

--
-- Indeks untuk tabel `kro`
--
ALTER TABLE `kro`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indeks untuk tabel `laporan_kinerja`
--
ALTER TABLE `laporan_kinerja`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_laporan_user` (`user_id`),
  ADD KEY `idx_laporan_kegiatan` (`kegiatan_id`),
  ADD KEY `idx_laporan_tanggal` (`tanggal`);

--
-- Indeks untuk tabel `mitra`
--
ALTER TABLE `mitra`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `notifications_read`
--
ALTER TABLE `notifications_read`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_read` (`user_id`,`notification_id`);

--
-- Indeks untuk tabel `penugasan_tim`
--
ALTER TABLE `penugasan_tim`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_penugasan_user` (`user_id`),
  ADD KEY `idx_penugasan_kegiatan` (`kegiatan_id`),
  ADD KEY `idx_penugasan_status` (`status`),
  ADD KEY `idx_penugasan_deadline` (`deadline`);

--
-- Indeks untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_progres_kegiatan` (`kegiatan_operasional_id`);

--
-- Indeks untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_operasional_id` (`kegiatan_operasional_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `realisasi_fisik`
--
ALTER TABLE `realisasi_fisik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_operasional_id` (`kegiatan_operasional_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `tim`
--
ALTER TABLE `tim`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indeks untuk tabel `tindak_lanjut`
--
ALTER TABLE `tindak_lanjut`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kendala_id` (`kendala_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `upload_laporan`
--
ALTER TABLE `upload_laporan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_tim` (`tim_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `kegiatan_operasional`
--
ALTER TABLE `kegiatan_operasional`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `kro`
--
ALTER TABLE `kro`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `laporan_kinerja`
--
ALTER TABLE `laporan_kinerja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `mitra`
--
ALTER TABLE `mitra`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `notifications_read`
--
ALTER TABLE `notifications_read`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT untuk tabel `penugasan_tim`
--
ALTER TABLE `penugasan_tim`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `realisasi_fisik`
--
ALTER TABLE `realisasi_fisik`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `tim`
--
ALTER TABLE `tim`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT untuk tabel `tindak_lanjut`
--
ALTER TABLE `tindak_lanjut`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `upload_laporan`
--
ALTER TABLE `upload_laporan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  ADD CONSTRAINT `kegiatan_ibfk_1` FOREIGN KEY (`kro_id`) REFERENCES `kro` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `kegiatan_operasional`
--
ALTER TABLE `kegiatan_operasional`
  ADD CONSTRAINT `kegiatan_operasional_ibfk_1` FOREIGN KEY (`tim_id`) REFERENCES `tim` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kegiatan_operasional_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  ADD CONSTRAINT `kendala_kegiatan_ibfk_1` FOREIGN KEY (`kegiatan_operasional_id`) REFERENCES `kegiatan_operasional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kendala_kegiatan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `laporan_kinerja`
--
ALTER TABLE `laporan_kinerja`
  ADD CONSTRAINT `laporan_kinerja_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `laporan_kinerja_ibfk_2` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `penugasan_tim`
--
ALTER TABLE `penugasan_tim`
  ADD CONSTRAINT `penugasan_tim_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `penugasan_tim_ibfk_2` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  ADD CONSTRAINT `progres_kegiatan_ibfk_1` FOREIGN KEY (`kegiatan_operasional_id`) REFERENCES `kegiatan_operasional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `progres_kegiatan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  ADD CONSTRAINT `realisasi_anggaran_ibfk_1` FOREIGN KEY (`kegiatan_operasional_id`) REFERENCES `kegiatan_operasional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `realisasi_anggaran_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `realisasi_fisik`
--
ALTER TABLE `realisasi_fisik`
  ADD CONSTRAINT `realisasi_fisik_ibfk_1` FOREIGN KEY (`kegiatan_operasional_id`) REFERENCES `kegiatan_operasional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `realisasi_fisik_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `tindak_lanjut`
--
ALTER TABLE `tindak_lanjut`
  ADD CONSTRAINT `tindak_lanjut_ibfk_1` FOREIGN KEY (`kendala_id`) REFERENCES `kendala_kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tindak_lanjut_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `upload_laporan`
--
ALTER TABLE `upload_laporan`
  ADD CONSTRAINT `upload_laporan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_tim` FOREIGN KEY (`tim_id`) REFERENCES `tim` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
