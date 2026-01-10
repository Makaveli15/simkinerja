-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 10 Jan 2026 pada 14.28
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
-- Struktur dari tabel `dokumen_output`
--

CREATE TABLE `dokumen_output` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `nama_file` varchar(255) NOT NULL,
  `path_file` varchar(500) NOT NULL,
  `tipe_dokumen` enum('draft','final') DEFAULT 'draft',
  `deskripsi` text DEFAULT NULL,
  `ukuran_file` int(11) NOT NULL DEFAULT 0,
  `tipe_file` varchar(100) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_review` enum('pending','diterima','ditolak') DEFAULT 'pending',
  `catatan_reviewer` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `dokumen_output`
--

INSERT INTO `dokumen_output` (`id`, `kegiatan_id`, `nama_file`, `path_file`, `tipe_dokumen`, `deskripsi`, `ukuran_file`, `tipe_file`, `uploaded_by`, `uploaded_at`, `status_review`, `catatan_reviewer`, `reviewed_by`, `reviewed_at`) VALUES
(1, 11, 'Laporan_Kegiatan_Tahun_2026.docx', '/uploads/dokumen-output/kegiatan_11_1767934903512.docx', 'draft', 'bbhdhdh', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-09 05:01:43', 'diterima', 'sdgsgsdgsgs', 2, '2026-01-09 05:03:13'),
(2, 11, 'kegiatan_11_1767934903512 (1).docx', '/uploads/dokumen-output/kegiatan_11_1767936175654.docx', 'draft', 'hdfhdh', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-09 05:22:55', 'ditolak', 'wettwetw', 2, '2026-01-09 05:27:49'),
(5, 7, 'kegiatan_11_1767934903512.docx', '/uploads/dokumen-output/kegiatan_7_1767939253716.docx', 'draft', '', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-09 06:14:13', 'diterima', NULL, 2, '2026-01-09 06:15:06'),
(6, 7, 'kegiatan_11_1767934903512.docx', '/uploads/dokumen-output/kegiatan_7_1767939331130.docx', 'draft', '', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-09 06:15:31', 'diterima', 'cnjdjdjjdgjgdjd', 2, '2026-01-09 06:15:59'),
(7, 7, 'kegiatan_11_1767934903512.docx', '/uploads/dokumen-output/kegiatan_7_1767939455909.docx', 'final', '', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-09 06:17:35', 'diterima', 'sgsgsgsg', 2, '2026-01-09 06:18:16'),
(8, 10, 'kegiatan_11_1767934903512 (1).docx', '/uploads/dokumen-output/kegiatan_10_1767939933798.docx', 'draft', 'sfhfhsfh', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-09 06:25:33', 'diterima', NULL, 2, '2026-01-09 06:27:54'),
(9, 4, 'kegiatan_11_1767934903512 (1).docx', '/uploads/dokumen-output/kegiatan_4_1768027551676.docx', 'draft', '', 10579, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-01-10 06:45:51', 'diterima', NULL, 2, '2026-01-10 06:46:32');

-- --------------------------------------------------------

--
-- Struktur dari tabel `evaluasi_pimpinan`
--

CREATE TABLE `evaluasi_pimpinan` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `jenis_evaluasi` enum('catatan','arahan','rekomendasi') NOT NULL DEFAULT 'catatan',
  `isi` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `evaluasi_pimpinan`
--

INSERT INTO `evaluasi_pimpinan` (`id`, `kegiatan_id`, `user_id`, `jenis_evaluasi`, `isi`, `created_at`) VALUES
(1, 11, 2, 'arahan', 'fdgsfgfsgsgsf', '2026-01-09 03:50:34'),
(2, 14, 2, 'arahan', 'yfyrfuyfufhfjfjhfjh', '2026-01-10 11:55:26');

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
  `tanggal_realisasi_selesai` date DEFAULT NULL,
  `target_output` varchar(255) DEFAULT NULL,
  `output_realisasi` decimal(15,2) DEFAULT 0.00,
  `satuan_output` varchar(50) DEFAULT NULL,
  `anggaran_pagu` decimal(15,2) DEFAULT 0.00,
  `status` enum('belum_mulai','berjalan','selesai','tertunda') DEFAULT 'berjalan',
  `status_verifikasi` enum('belum_verifikasi','menunggu','valid','revisi') DEFAULT 'belum_verifikasi',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kegiatan_operasional`
--

INSERT INTO `kegiatan_operasional` (`id`, `tim_id`, `kro_id`, `mitra_id`, `created_by`, `nama`, `deskripsi`, `tanggal_mulai`, `tanggal_selesai`, `tanggal_realisasi_selesai`, `target_output`, `output_realisasi`, `satuan_output`, `anggaran_pagu`, `status`, `status_verifikasi`, `created_at`, `updated_at`) VALUES
(3, 1, 3, 4, 3, 'xcvxx', 'sfsfgdsgsd', '2026-01-06', '2026-01-20', NULL, '1', 0.00, 'dokumen', 1000000000.00, 'berjalan', 'belum_verifikasi', '2026-01-06 16:32:20', '2026-01-06 16:33:19'),
(4, 1, 2, 5, 3, 'cccc', 'dsfdsfdsf', '2026-01-06', '2026-01-29', '2026-01-31', '2', 1.00, 'dokumen', 10000000.00, 'berjalan', 'revisi', '2026-01-08 06:49:12', '2026-01-10 06:46:40'),
(6, 1, 3, NULL, 3, 'sdgdsg', 'saasdsfsf', '2026-01-09', '2026-01-30', NULL, '1', 0.00, 'dokumen', 6500000.00, 'berjalan', 'belum_verifikasi', '2026-01-08 06:50:27', '2026-01-08 06:50:27'),
(7, 1, 4, 1, 3, 'sgsdgsdgjgjg', 'gdfgdg', '2026-01-06', '2026-01-30', '2026-01-29', '1', 1.00, 'dokumen', 0.00, 'berjalan', 'valid', '2026-01-08 06:58:11', '2026-01-10 08:45:12'),
(9, 1, 2, NULL, 3, 'hfgjfjfgjf', 'fghfgdhd', '2026-01-15', '2026-02-06', NULL, '3', 2.00, 'dokumen', 5540000.00, 'berjalan', 'belum_verifikasi', '2026-01-08 07:34:47', '2026-01-10 07:14:04'),
(10, 1, 5, NULL, 3, 'jjfjfgjf', 'jdjdjdjdj', '2026-01-12', '2026-01-29', '2026-01-28', '1', 1.00, 'dokumen', 125000000.00, 'berjalan', 'valid', '2026-01-08 07:38:44', '2026-01-09 06:28:04'),
(11, 1, 4, NULL, 3, 'dhdhdfhfdh', 'srfasggdgad', '2026-01-14', '2026-02-04', '2026-02-01', '2', 1.00, 'dokumen', 4750000.00, 'berjalan', 'revisi', '2026-01-08 07:42:23', '2026-01-10 08:33:21'),
(14, 1, 6, NULL, 3, 'bagagsgs', 'fdsgsgdsg', '2025-12-23', '2026-01-12', NULL, '3', 1.00, 'publikasi', 4800000.00, 'berjalan', 'belum_verifikasi', '2026-01-10 09:38:56', '2026-01-10 09:39:50');

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
(3, 3, 3, '2026-01-07', 'dgdfgdffd', 'sedang', 'open', '2026-01-06 17:18:42'),
(4, 11, 3, '2026-01-08', 'gsfhshfh', 'tinggi', 'resolved', '2026-01-08 10:10:45');

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
(22, 1, 'mitra-1', '2026-01-06 13:50:34'),
(23, 2, 'user-3', '2026-01-09 03:56:25'),
(24, 2, 'user-2', '2026-01-09 03:56:25'),
(25, 2, 'user-1', '2026-01-09 03:56:25'),
(26, 2, 'mitra-5', '2026-01-09 03:56:25'),
(27, 2, 'mitra-2', '2026-01-09 03:56:25'),
(28, 2, 'mitra-3', '2026-01-09 03:56:25'),
(29, 2, 'mitra-1', '2026-01-09 03:56:29');

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
(4, 3, 3, '2026-01-07', 10.00, 5.00, 10.00, 'dfgdfgfh', '2026-01-06 17:18:13'),
(5, 11, 3, '2026-01-08', 50.00, 100.00, 50.00, 'hfdhdfhhdfh', '2026-01-08 10:31:24'),
(6, 11, 3, '2026-01-08', 50.00, 100.00, 50.00, 'dfgfdhdfhdf', '2026-01-08 10:33:25'),
(8, 10, 3, '2026-01-09', 100.00, 100.00, 0.00, 'sdsgdsgsdgs', '2026-01-09 06:24:55'),
(9, 4, 3, '2026-01-10', 50.00, 100.00, 0.00, 'fsdfsfdsf', '2026-01-10 06:31:29'),
(11, 9, 3, '2026-01-10', 66.67, 100.00, 0.00, 'fafffaf', '2026-01-10 07:14:04'),
(12, 7, 3, '2026-01-10', 100.00, 13.00, 100.00, 'dhgdg', '2026-01-10 08:43:15'),
(13, 14, 3, '2026-01-10', 33.33, 72.00, 0.00, 'sfffafa', '2026-01-10 09:39:50');

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
(4, 3, 3, '2026-01-07', 10000000.00, NULL, '2026-01-06 17:18:31'),
(5, 11, 3, '2026-01-08', 1235000.00, 'fsdgg', '2026-01-08 10:10:27'),
(6, 11, 3, '2026-01-08', 3745000.00, NULL, '2026-01-08 10:28:34'),
(8, 7, 3, '2026-01-09', 0.00, NULL, '2026-01-09 06:13:56'),
(9, 10, 3, '2026-01-09', 50000000.00, NULL, '2026-01-09 06:25:20'),
(11, 10, 3, '2026-01-10', 75000000.00, NULL, '2026-01-10 07:21:28');

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

--
-- Dumping data untuk tabel `tindak_lanjut`
--

INSERT INTO `tindak_lanjut` (`id`, `kendala_id`, `user_id`, `tanggal`, `deskripsi`, `batas_waktu`, `status`, `created_at`) VALUES
(2, 4, 3, '2026-01-08', 'djdgjdg', '2026-01-23', 'direncanakan', '2026-01-08 10:11:17');

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
  `nama_lengkap` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','pimpinan','pelaksana') NOT NULL DEFAULT 'pelaksana',
  `status` enum('aktif','nonaktif') DEFAULT 'aktif',
  `tim_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto` longtext DEFAULT NULL,
  `is_first_login` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `nama_lengkap`, `password`, `role`, `status`, `tim_id`, `created_at`, `foto`, `is_first_login`) VALUES
(1, 'Makaveli', 'admin@example.com', 'Marthin Juan I Gede Ngara Raka', '$2b$10$e7gIxG1qKkpTtOQPqTTkd.BTk3xdhMc/T2LnHL6L1lx.6rU2U2UYe', 'admin', 'aktif', NULL, '2026-01-06 06:08:43', 'data:image/webp;base64,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', 0),
(2, 'kepala', 'kepala@gmail.com', NULL, '$2b$10$ZLldZZIUvrTwlMYVb5mVPOmfbXgw9uQNILPkFMBzlwBbOk.xkmPvC', 'pimpinan', 'aktif', NULL, '2026-01-06 06:34:24', NULL, 0),
(3, 'Jungker', 'jungker@gmail.com', 'Asking Alexandria', '$2b$10$crRtw2loc11q3poEOc/LmeTwwpfNPC6KQG6b0tsM/KJA3sRWsDGXa', 'pelaksana', 'aktif', 1, '2026-01-06 07:35:47', 'data:image/jpeg;base64,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', 0);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `dokumen_output`
--
ALTER TABLE `dokumen_output`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_id` (`kegiatan_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indeks untuk tabel `evaluasi_pimpinan`
--
ALTER TABLE `evaluasi_pimpinan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_id` (`kegiatan_id`),
  ADD KEY `user_id` (`user_id`);

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
-- AUTO_INCREMENT untuk tabel `dokumen_output`
--
ALTER TABLE `dokumen_output`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `evaluasi_pimpinan`
--
ALTER TABLE `evaluasi_pimpinan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `kegiatan_operasional`
--
ALTER TABLE `kegiatan_operasional`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT untuk tabel `penugasan_tim`
--
ALTER TABLE `penugasan_tim`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `upload_laporan`
--
ALTER TABLE `upload_laporan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `dokumen_output`
--
ALTER TABLE `dokumen_output`
  ADD CONSTRAINT `dokumen_output_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan_operasional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dokumen_output_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dokumen_output_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `evaluasi_pimpinan`
--
ALTER TABLE `evaluasi_pimpinan`
  ADD CONSTRAINT `evaluasi_pimpinan_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan_operasional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluasi_pimpinan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
