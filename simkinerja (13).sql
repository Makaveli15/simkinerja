-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 19 Feb 2026 pada 07.45
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
-- Struktur dari tabel `approval_history`
--

CREATE TABLE `approval_history` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_approver` enum('koordinator','ppk','kepala') NOT NULL,
  `action` enum('approve','reject','revisi') NOT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `approval_history`
--

INSERT INTO `approval_history` (`id`, `kegiatan_id`, `user_id`, `role_approver`, `action`, `catatan`, `created_at`) VALUES
(4, 2, 6, 'koordinator', 'approve', NULL, '2026-02-18 14:55:58'),
(5, 2, 7, 'ppk', 'approve', NULL, '2026-02-18 14:56:08'),
(6, 2, 2, 'kepala', 'approve', NULL, '2026-02-18 14:56:18'),
(10, 4, 6, 'koordinator', 'approve', NULL, '2026-02-18 16:14:29'),
(11, 4, 7, 'ppk', 'approve', NULL, '2026-02-18 16:16:00'),
(12, 4, 2, 'kepala', 'approve', NULL, '2026-02-19 05:13:51');

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
  `draft_status_kesubag` enum('pending','reviewed','revisi') DEFAULT 'pending',
  `draft_feedback_kesubag` text DEFAULT NULL,
  `draft_reviewed_by_kesubag` int(11) DEFAULT NULL,
  `draft_reviewed_at_kesubag` timestamp NULL DEFAULT NULL,
  `draft_feedback_pimpinan` text DEFAULT NULL,
  `draft_reviewed_by_pimpinan` int(11) DEFAULT NULL,
  `draft_reviewed_at_pimpinan` timestamp NULL DEFAULT NULL,
  `minta_validasi` tinyint(1) DEFAULT 0,
  `minta_validasi_at` timestamp NULL DEFAULT NULL,
  `validasi_kesubag` enum('pending','valid','tidak_valid') DEFAULT 'pending',
  `validasi_feedback_kesubag` text DEFAULT NULL,
  `validasi_by_kesubag` int(11) DEFAULT NULL,
  `validasi_at_kesubag` timestamp NULL DEFAULT NULL,
  `validasi_pimpinan` enum('pending','valid','tidak_valid') DEFAULT 'pending',
  `validasi_feedback_pimpinan` text DEFAULT NULL,
  `validasi_by_pimpinan` int(11) DEFAULT NULL,
  `validasi_at_pimpinan` timestamp NULL DEFAULT NULL,
  `status_final` enum('draft','menunggu_kesubag','menunggu_pimpinan','revisi','disahkan') DEFAULT 'draft',
  `tanggal_disahkan` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `dokumen_output`
--

INSERT INTO `dokumen_output` (`id`, `kegiatan_id`, `nama_file`, `path_file`, `tipe_dokumen`, `deskripsi`, `ukuran_file`, `tipe_file`, `uploaded_by`, `uploaded_at`, `draft_status_kesubag`, `draft_feedback_kesubag`, `draft_reviewed_by_kesubag`, `draft_reviewed_at_kesubag`, `draft_feedback_pimpinan`, `draft_reviewed_by_pimpinan`, `draft_reviewed_at_pimpinan`, `minta_validasi`, `minta_validasi_at`, `validasi_kesubag`, `validasi_feedback_kesubag`, `validasi_by_kesubag`, `validasi_at_kesubag`, `validasi_pimpinan`, `validasi_feedback_pimpinan`, `validasi_by_pimpinan`, `validasi_at_pimpinan`, `status_final`, `tanggal_disahkan`) VALUES
(1, 4, 'Laporan_Kegiatan_Tahun_2026 (1).docx', '/uploads/dokumen-output/kegiatan_4_1771479368819.docx', 'draft', 'hdhdhdhf', 8975, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-02-19 05:36:19', 'reviewed', 'hdhdfdfh', 6, '2026-02-19 05:39:18', 'hjhgjgjgkgkgkg', 2, '2026-02-19 05:39:29', 0, NULL, 'pending', NULL, NULL, NULL, 'pending', NULL, NULL, NULL, 'menunggu_kesubag', NULL),
(2, 4, 'Laporan_Kegiatan_Tahun_2026 (1).docx', '/uploads/dokumen-output/kegiatan_4_1771479519951.docx', 'final', 'hghhfhdhd', 8975, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-02-19 05:38:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-19 05:39:46', 'valid', NULL, 6, '2026-02-19 05:40:17', 'valid', NULL, 2, '2026-02-19 05:40:27', 'disahkan', '2026-02-19 13:40:27'),
(3, 4, 'Laporan_Kegiatan_Tahun_2026 (1).docx', '/uploads/dokumen-output/kegiatan_4_1771479677551.docx', 'final', 'nnngfhgfhf', 8975, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-02-19 05:41:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-19 05:42:26', 'valid', NULL, 6, '2026-02-19 05:49:51', 'valid', NULL, 2, '2026-02-19 05:50:00', 'disahkan', '2026-02-19 13:50:00'),
(4, 4, 'Laporan_Kegiatan_Tahun_2026 (1).docx', '/uploads/dokumen-output/kegiatan_4_1771480593912.docx', 'final', 'gsggsgs', 8975, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-02-19 05:56:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-19 05:57:08', 'valid', NULL, 6, '2026-02-19 05:57:18', 'valid', NULL, 2, '2026-02-19 05:57:28', 'disahkan', '2026-02-19 13:57:28'),
(5, 4, 'Laporan_Kegiatan_Tahun_2026 (1).docx', '/uploads/dokumen-output/kegiatan_4_1771480609537.docx', 'final', 'gsgssdgsdg', 8975, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-02-19 05:56:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-19 05:57:07', 'valid', NULL, 6, '2026-02-19 05:57:17', 'valid', NULL, 2, '2026-02-19 05:57:30', 'disahkan', '2026-02-19 13:57:30'),
(6, 4, 'Laporan_Kegiatan_Tahun_2026 (1).docx', '/uploads/dokumen-output/kegiatan_4_1771480623395.docx', 'final', 'gsdggsgs', 8975, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, '2026-02-19 05:57:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-02-19 05:57:05', 'valid', NULL, 6, '2026-02-19 05:57:16', 'valid', NULL, 2, '2026-02-19 05:57:27', 'disahkan', '2026-02-19 13:57:27');

-- --------------------------------------------------------

--
-- Struktur dari tabel `evaluasi`
--

CREATE TABLE `evaluasi` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_pemberi` enum('pimpinan','kesubag') NOT NULL COMMENT 'Role yang memberikan evaluasi',
  `jenis_evaluasi` enum('catatan','arahan','rekomendasi') NOT NULL DEFAULT 'catatan',
  `isi` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `evaluasi`
--

INSERT INTO `evaluasi` (`id`, `kegiatan_id`, `user_id`, `role_pemberi`, `jenis_evaluasi`, `isi`, `created_at`) VALUES
(3, 2, 6, '', 'catatan', 'fjhfjhfjhfjhfjfjhf', '2026-02-18 15:13:17'),
(4, 2, 2, 'pimpinan', 'rekomendasi', 'hfjfjfjfjfjhfj', '2026-02-18 15:13:35');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kegiatan`
--

CREATE TABLE `kegiatan` (
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
  `jenis_validasi` enum('dokumen','kuantitas') DEFAULT 'dokumen',
  `anggaran_pagu` decimal(15,2) DEFAULT 0.00,
  `status` enum('belum_mulai','berjalan','selesai','tertunda') DEFAULT 'berjalan',
  `status_pengajuan` enum('draft','diajukan','review_koordinator','approved_koordinator','review_ppk','approved_ppk','review_kepala','disetujui','ditolak','revisi') DEFAULT 'draft',
  `tanggal_pengajuan` datetime DEFAULT NULL,
  `tanggal_approval` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `catatan_approval` text DEFAULT NULL,
  `status_verifikasi` enum('belum_verifikasi','menunggu','valid','revisi') DEFAULT 'belum_verifikasi',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_by_koordinator` int(11) DEFAULT NULL,
  `tanggal_approval_koordinator` datetime DEFAULT NULL,
  `catatan_koordinator` text DEFAULT NULL,
  `approved_by_ppk` int(11) DEFAULT NULL,
  `tanggal_approval_ppk` datetime DEFAULT NULL,
  `catatan_ppk` text DEFAULT NULL,
  `approved_by_kepala` int(11) DEFAULT NULL,
  `tanggal_approval_kepala` datetime DEFAULT NULL,
  `catatan_kepala` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kegiatan`
--

INSERT INTO `kegiatan` (`id`, `tim_id`, `kro_id`, `mitra_id`, `created_by`, `nama`, `deskripsi`, `tanggal_mulai`, `tanggal_selesai`, `tanggal_realisasi_selesai`, `target_output`, `output_realisasi`, `satuan_output`, `jenis_validasi`, `anggaran_pagu`, `status`, `status_pengajuan`, `tanggal_pengajuan`, `tanggal_approval`, `approved_by`, `catatan_approval`, `status_verifikasi`, `created_at`, `updated_at`, `approved_by_koordinator`, `tanggal_approval_koordinator`, `catatan_koordinator`, `approved_by_ppk`, `tanggal_approval_ppk`, `catatan_ppk`, `approved_by_kepala`, `tanggal_approval_kepala`, `catatan_kepala`) VALUES
(2, 1, 1, 75, 3, 'Johanes Siuk Teme', 'hfhjfjhfjhfjfjhfjhfjh', '2026-02-15', '2026-03-14', '2026-03-06', '700', 0.00, 'Responden', 'kuantitas', 12967577.00, 'selesai', 'disetujui', '2026-02-18 22:55:44', '2026-02-18 22:56:18', NULL, NULL, 'belum_verifikasi', '2026-02-18 14:54:59', '2026-02-18 15:44:20', 6, '2026-02-18 22:55:58', NULL, 7, '2026-02-18 22:56:08', NULL, 2, '2026-02-18 22:56:18', NULL),
(4, 1, 6, 75, 3, 'gsdgsgss', 'sfgsgsddsgsdg', '2026-02-11', '2026-03-12', '2026-03-12', '5', 0.00, 'Dokumen', 'dokumen', 10760000.00, 'selesai', 'disetujui', '2026-02-19 00:12:13', '2026-02-19 13:13:50', NULL, NULL, 'valid', '2026-02-18 16:12:07', '2026-02-19 05:57:54', 6, '2026-02-19 00:14:21', NULL, 7, '2026-02-19 00:15:59', NULL, 2, '2026-02-19 13:13:50', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `kegiatan_mitra`
--

CREATE TABLE `kegiatan_mitra` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `mitra_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kegiatan_mitra`
--

INSERT INTO `kegiatan_mitra` (`id`, `kegiatan_id`, `mitra_id`, `created_at`) VALUES
(5, 2, 75, '2026-02-18 14:54:59'),
(6, 2, 235, '2026-02-18 14:54:59'),
(7, 2, 59, '2026-02-18 14:54:59'),
(12, 4, 75, '2026-02-18 16:12:07'),
(13, 4, 40, '2026-02-18 16:12:07'),
(14, 4, 160, '2026-02-18 16:12:07');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kendala_kegiatan`
--

CREATE TABLE `kendala_kegiatan` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
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

INSERT INTO `kendala_kegiatan` (`id`, `kegiatan_id`, `user_id`, `tanggal_kejadian`, `deskripsi`, `tingkat_dampak`, `status`, `created_at`) VALUES
(3, 2, 3, '2026-02-18', 'hjfhgdghdghdghdhgdhgdhg', 'sedang', 'resolved', '2026-02-18 14:58:37'),
(4, 2, 3, '2026-02-18', 'jhfjhfjhfjhfjh', 'sedang', 'resolved', '2026-02-18 14:59:56'),
(5, 2, 3, '2026-02-18', 'khfjhfjhfjhfhjfhjfjhfjhf', 'sedang', 'resolved', '2026-02-18 15:00:43'),
(6, 2, 3, '2026-02-18', 'gkjgkgkjgkjgjkgkj', 'sedang', 'resolved', '2026-02-18 15:03:27'),
(7, 2, 3, '2026-02-18', 'jgkjgkjgkjg', 'sedang', 'resolved', '2026-02-18 15:03:49'),
(8, 4, 3, '2026-02-19', 'gdgggaga', 'tinggi', 'resolved', '2026-02-19 05:30:40');

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
(1, '2896.BMA.004', 'Publikasi/Laporan Analisis dan Pengembangan Statistik', 'Laporan atau publikasi hasil analisis dan pengembangan statistik untuk mendukung perumusan dan evaluasi kebijakan.', '2026-01-11 19:00:27'),
(2, '2897.BMA.004', 'Laporan Diseminasi dan Metadata Statistik', 'Dokumen diseminasi data statistik beserta metadata untuk meningkatkan pemahaman dan pemanfaatan data.', '2026-01-11 19:00:27'),
(3, '2897.QDB.003', 'Penguatan Penyelenggaraan Pembinaan Statistik Sektoral', 'Dokumen pembinaan dan koordinasi penyelenggaraan statistik sektoral pada K/L dan pemerintah daerah.', '2026-01-11 19:00:27'),
(4, '2898.BMA.007', 'Publikasi/Laporan Statistik Neraca Pengeluaran', 'Publikasi statistik hasil penyusunan dan analisis neraca pengeluaran sebagai bagian neraca nasional.', '2026-01-11 19:00:27'),
(5, '2899.BMA.006', 'Publikasi/Laporan Neraca Produksi', 'Dokumen statistik hasil penghitungan dan analisis neraca produksi.', '2026-01-11 19:00:27'),
(6, '2900.BMA.005', 'Dokumen/Laporan Pengembangan Metodologi Kegiatan Statistik', 'Dokumen metodologi dan pedoman teknis pengembangan kegiatan statistik.', '2026-01-11 19:00:27'),
(7, '2901.CAN.004', 'Pengembangan Infrastruktur dan Layanan Teknologi Informasi Statistik', 'Dokumen, sistem, dan layanan pendukung infrastruktur TIK statistik.', '2026-01-11 19:00:27'),
(8, '2902.BMA.004', 'Publikasi/Laporan Statistik Distribusi', 'Publikasi statistik distribusi ekonomi dan pendapatan.', '2026-01-11 19:00:27'),
(9, '2902.BMA.006', 'Publikasi/Laporan Sensus Ekonomi', 'Dokumen dan publikasi resmi hasil Sensus Ekonomi.', '2026-01-11 19:00:27'),
(10, '2903.BMA.009', 'Publikasi/Laporan Statistik Harga', 'Laporan dan publikasi statistik harga dan indeks harga.', '2026-01-11 19:00:27'),
(11, '2904.BMA.006', 'Publikasi/Laporan Statistik Industri, Pertambangan, dan Energi', 'Publikasi statistik sektor industri, pertambangan, dan energi.', '2026-01-11 19:00:27'),
(12, '2905.BMA.004', 'Publikasi/Laporan Sakernas', 'Dokumen dan publikasi hasil Survei Angkatan Kerja Nasional.', '2026-01-11 19:00:27'),
(13, '2905.BMA.006', 'Publikasi/Laporan Survei Penduduk Antar Sensus (SUPAS)', 'Publikasi dan laporan hasil SUPAS.', '2026-01-11 19:00:27'),
(27, '2906.BMA.003', 'Publikasi/Laporan Statistik Kesejahteraan Rakyat', 'Dokumen statistik kondisi kesejahteraan rakyat.', '2026-01-11 19:00:51'),
(28, '2906.BMA.006', 'Publikasi/Laporan Susenas', 'Publikasi resmi hasil Survei Sosial Ekonomi Nasional.', '2026-01-11 19:00:51'),
(29, '2907.BMA.006', 'Publikasi/Laporan Statistik Ketahanan Sosial', 'Laporan statistik kondisi ketahanan sosial masyarakat.', '2026-01-11 19:00:51'),
(30, '2907.BMA.008', 'Publikasi/Laporan Pendataan Potensi Desa (PODES)', 'Dokumen dan publikasi hasil Pendataan Potensi Desa.', '2026-01-11 19:00:51'),
(31, '2908.BMA.004', 'Publikasi/Laporan Statistik Keuangan, TIK, dan Pariwisata', 'Publikasi statistik sektor keuangan, TIK, dan pariwisata.', '2026-01-11 19:00:51'),
(32, '2908.BMA.009', 'Publikasi/Laporan Statistik E-Commerce', 'Dokumen statistik aktivitas dan perkembangan e-commerce.', '2026-01-11 19:00:51'),
(33, '2909.BMA.005', 'Publikasi/Laporan Statistik Peternakan, Perikanan, dan Kehutanan', 'Publikasi statistik sektor peternakan, perikanan, dan kehutanan.', '2026-01-11 19:00:51'),
(34, '2910.BMA.001', 'Publikasi/Laporan Statistik Tanaman Pangan', 'Publikasi statistik tanaman pangan dan hortikultura.', '2026-01-11 19:00:51'),
(35, '2911.BMA.002', 'Publikasi/Laporan Statistik Perdagangan', 'Publikasi statistik perdagangan dalam dan luar negeri.', '2026-01-11 19:00:51'),
(36, '2912.BMA.003', 'Publikasi/Laporan Statistik Lingkungan Hidup', 'Publikasi statistik lingkungan hidup dan pembangunan berkelanjutan.', '2026-01-11 19:00:51'),
(37, '2913.BMA.004', 'Publikasi/Laporan Statistik Transportasi', 'Publikasi statistik sektor transportasi.', '2026-01-11 19:00:51'),
(38, '2914.BMA.005', 'Publikasi/Laporan Statistik Kependudukan', 'Publikasi statistik kependudukan dan demografi.', '2026-01-11 19:00:51');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_indikator_kinerja`
--

CREATE TABLE `master_indikator_kinerja` (
  `id` int(11) NOT NULL,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `bobot` decimal(5,2) NOT NULL DEFAULT 0.00,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `rumus_perhitungan` text DEFAULT NULL,
  `satuan` varchar(20) DEFAULT '%',
  `nilai_min` decimal(5,2) DEFAULT 0.00,
  `nilai_max` decimal(5,2) DEFAULT 100.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `master_indikator_kinerja`
--

INSERT INTO `master_indikator_kinerja` (`id`, `kode`, `nama`, `deskripsi`, `bobot`, `urutan`, `rumus_perhitungan`, `satuan`, `nilai_min`, `nilai_max`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'capaian_output', 'Capaian Output', 'Perbandingan output realisasi dengan target output. Semakin tinggi realisasi mendekati atau melebihi target, semakin baik nilai indikator ini.', 25.00, 1, '(output_realisasi / target_output) * 100', '%', 0.00, 100.00, 1, '2026-01-31 17:56:10', '2026-02-05 14:18:20'),
(2, 'ketepatan_waktu', 'Ketepatan Waktu', 'Mengukur apakah kegiatan selesai tepat waktu atau lebih cepat dari jadwal yang ditentukan.', 20.00, 2, 'Berdasarkan selisih tanggal realisasi selesai dengan tanggal target selesai', '%', 0.00, 100.00, 1, '2026-01-31 17:56:10', '2026-01-31 17:56:10'),
(3, 'serapan_anggaran', 'Serapan Anggaran', 'Efisiensi penggunaan anggaran, membandingkan realisasi anggaran dengan pagu anggaran yang ditetapkan.', 25.00, 3, '(realisasi_anggaran / anggaran_pagu) * 100', '%', 0.00, 100.00, 1, '2026-01-31 17:56:10', '2026-02-05 14:18:27'),
(4, 'kualitas_output', 'Kualitas Output', 'Status verifikasi dan validasi dokumen output kegiatan oleh pimpinan.', 20.00, 4, 'Berdasarkan status verifikasi dokumen (valid=100, revisi=50, pending=0)', '%', 0.00, 100.00, 1, '2026-01-31 17:56:10', '2026-02-05 14:10:11'),
(5, 'penyelesaian_kendala', 'Penyelesaian Kendala', 'Rasio kendala yang berhasil diselesaikan terhadap total kendala yang dilaporkan.', 10.00, 5, '(kendala_resolved / total_kendala) * 100', '%', 0.00, 100.00, 1, '2026-01-31 17:56:10', '2026-02-05 14:10:02');

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
(1, 'Adrianus Un', 'Mitra Pendataan', 'Mamsena RT 015 RW 006', 'L', '+62 821-4474-9822', '530524100008', 'ickoun240419@gmail.com', '2026-01-11 19:07:17'),
(2, 'Yohanes Kase Tonbesi', 'Mitra Pendataan', 'Jl. Cengkeh RT. 026 RW. 001', 'L', '+62 813-2862-7140', '530522030027', 'tonbesijoni@gmail.com', '2026-01-11 19:07:17'),
(3, 'FELIX OBENU', 'Mitra Pendataan', 'Batnes, RT 004/RW 002', 'L', '+62 812-7120-3561', '530522100261', 'felixobenu6@gmail.com', '2026-01-11 19:07:17'),
(4, 'Gradiana Tulasi', 'Mitra (Pendataan dan Pengolahan)', 'Boronubaen RT 010/RW 004 Desa Boronubaen, Kecamatan Biboki Utara', 'P', '+62 823-3909-3549', '530523030014', 'diianatulasi@gmail.com', '2026-01-11 19:07:17'),
(5, 'ELISABETH  LUSITANIA BINABU', 'Mitra Pendataan', 'Sap\'an, Rt/Rw: 010/004', 'P', '+62 214-4895-643', NULL, 'lusitaniabinabu@gmail.com', '2026-01-11 19:07:17'),
(6, 'Filomena Amoi Usboko', 'Mitra Pendataan', 'OENOPU RT 003 RW 002 DESA T EBA', 'P', '+62 821-4532-3665', '530523030004', 'amoiusboko7@gmail.com', '2026-01-11 19:07:17'),
(7, 'Maria Elsi Sako Manek', 'Mitra Pendataan', 'Fafinesu C RT 001 RW 001', 'P', '+62 082-1468-48398', '530522100006', 'mariaelsisakomanek@gmail.com', '2026-01-11 19:07:17'),
(8, 'Januarius Tikneon', 'Mitra Pendataan', 'Jl. Mambramo Rt 03 Rw 01', 'L', '+62 822-1683-0724', '530523030149', 'belleckjanuarius@gmail.com', '2026-01-11 19:07:17'),
(9, 'Oktofianus Oki', 'Mitra Pendataan', 'RT/RW:002/001 DESA BANAIN B KECAMATAN BIKOMI UTARA KABUPATEN TTU', 'L', '+62 821-3725-5377', NULL, 'ooktofianusoki@gmail.com', '2026-01-11 19:07:17'),
(10, 'Nurliah Apryanti', 'Mitra Pendataan', 'Jl. Imam Bonjol', 'P', '+62 813-5358-2105', '530523080004', 'nurliahapryamti@gmail.com', '2026-01-11 19:07:17'),
(11, 'Maria Febriana neno', 'Mitra Pendataan', 'Jalan trans Timor raya,RT/RW 006/003', 'P', '+62 813-3710-7703', '530523030029', 'febbyocky0@gmail.com', '2026-01-11 19:07:17'),
(12, 'Jefrianto Koes', 'Mitra Pendataan', 'Jalan Hati Suci', 'L', '+62 851-4324-6448', '530522020003', 'koesjefrianto@gmail.com', '2026-01-11 19:07:17'),
(13, 'Maria Arni De Jesus', 'Mitra Pendataan', 'Jalan Pante Makassar', 'P', '+62 853-3835-9564', '530522100165', 'arniidejesus99@gmail.com', '2026-01-11 19:07:17'),
(14, 'Heri Robertus Haekase', 'Mitra Pendataan', 'Oelatimo Rt 002 Rw 001', 'L', '+62 821-4400-7204', '530522030048', 'Herirobertushaekase96@gmail.com', '2026-01-11 19:07:17'),
(15, 'Ignasius Baba', 'Mitra Pendataan', 'Kotafoun, RT 008 RW 003', 'L', '+62 853-3308-6287', '530522030029', 'babaignas1234@gmail.com', '2026-01-11 19:07:17'),
(16, 'Hendrikus Arlando Amleni', 'Mitra Pendataan', 'Sapaen', 'L', '+62 812-3768-4325', '530523030056', 'hendrikus060494@gmail.com', '2026-01-11 19:07:17'),
(17, 'Maria Gradiana Siki', 'Mitra Pendataan', 'Femnasi', 'P', '+62 081-3394-59338', '530522100100', 'gradianasiki2@gmail.com', '2026-01-11 19:07:17'),
(18, 'Imakulata Bano', 'Mitra Pendataan', 'Jl. Matmanas, RT/RW: 010/003, Kel. Benpasi, Kec. Kota Kefamenanu, Kab. TTU', 'P', '+62 852-5351-6616', NULL, 'imabano475@gmail.com', '2026-01-11 19:07:17'),
(19, 'Melki Asan Aplunggi', 'Mitra Pendataan', 'Sp 1 Rt021/RW 008 Desa Ponu', 'L', '+62 853-9583-5602', '530523030116', 'asanaplunggi2@gmail.com', '2026-01-11 19:07:17'),
(20, 'Apriana Erwinda Kefi', 'Mitra Pendataan', 'Benpasi', 'P', '+62 853-3746-2282', NULL, 'aprianakefi9@gmail.com', '2026-01-11 19:07:17'),
(21, 'Wilhelmus Rio Metkono', 'Mitra Pendataan', 'DESA SALLU, RT 006/RW 003, KECAMATAN MIOMAFFO BARAT', 'L', '+62 812-8203-8586', '530522100075', 'riometkono12@gmail.com', '2026-01-11 19:07:17'),
(22, 'Dionisius Ambone', 'Mitra Pendataan', 'Haumuti', 'L', '+62 812-3922-5492', '530522030030', 'dionisiusambone27@gmail.com', '2026-01-11 19:07:17'),
(23, 'Gustaf Inyong Kobi', 'Mitra Pengolahan', 'Jln. Semangka II', 'L', '+62 822-4707-4910', '530522020001', 'inyongadvena@gmail.com', '2026-01-11 19:07:17'),
(24, 'Rikhardus Novertus Thaal', 'Mitra Pendataan', 'Desa Fatuneno RT 001 RW 001', 'L', '+62 082-1445-26003', '530522030062', 'rikhardusnovertus@gmail.com', '2026-01-11 19:07:17'),
(25, 'Dorothea Bertilya Seran Bria', 'Mitra (Pendataan dan Pengolahan)', 'Sasi km 7 , RT 030/RW 008', 'P', '+62 822-3388-9453', '530523030073', 'debbybria01@gmail.com', '2026-01-11 19:07:17'),
(26, 'Adriana Leltakaeb', 'Mitra Pendataan', 'Haulasi, RT/RW: 012/006, Desa: Haulasi, Kecamatan: Miomaffo Barat', 'P', '+62 822-3682-5244', '530522100223', 'adrianaleltakaeb97@gmail.com', '2026-01-11 19:07:17'),
(27, 'Adrianus Simau', 'Mitra Pendataan', 'Sunbaki, RT/RW 006/002', 'L', '+62 821-4706-6265', NULL, 'adrysimau94@gmail.com', '2026-01-11 19:07:17'),
(28, 'Vinsensius Amsikan', 'Mitra Pendataan', 'Jln. Delima blok L, RT 015,RW 004', 'L', '+62 592-4917-872', '530523110046', 'amsikanvian@gmail.com', '2026-01-11 19:07:17'),
(29, 'Laurensius Saunoah', 'Mitra Pendataan', 'Bansone, RT/RW 001/001', 'L', '+62 852-5335-8686', '530524100001', 'lsaunoah@gmail.com', '2026-01-11 19:07:17'),
(30, 'Nicodemos de Carvalho Magno', 'Mitra Pendataan', 'Dusun: Sobe-Ainlite', 'L', '+62 823-4128-3777', '530523030146', 'decmagnonico@gmail.com', '2026-01-11 19:07:17'),
(31, 'BENYAMIN KOLO', 'Mitra Pendataan', 'RT/RW: 004/002, DESA FAENNAKE KEC. BIKOMI UTARA', 'L', '+62 823-4030-9131', NULL, 'benykolo497@gmail.com', '2026-01-11 19:07:17'),
(32, 'MARIA OKTAVIANA ABI', 'Mitra Pendataan', 'KLATUN, RT 003/RW 002, DESA PONU, KECAMATAN BIBOKI ANLEU, KABUPATEN TIMOR TENGAH UTARA, PROVINSINSI NUSA TENGGARA TIMUR', 'P', '+62 812-3693-2741', NULL, 'mariaoktavianaaby@gmail.com', '2026-01-11 19:07:17'),
(33, 'Mikhael Robert Anait', 'Mitra Pendataan', 'Naileku', 'L', '+62 812-3895-6988', '530522020021', 'robertanayt@gmail.com', '2026-01-11 19:07:17'),
(34, 'Maria Nonivia Nurak', 'Mitra Pendataan', 'JL. Sonbay RT 006 / RW 005', 'P', '+62 823-5940-9444', '530522100340', 'nony.nurak11@gmail.com', '2026-01-11 19:07:17'),
(35, 'Maria Yolanda Taena', 'Mitra Pendataan', 'RT 003 RW 001', 'P', '+62 821-9781-9518', '530522100325', 'yolandataena3@gmail.com', '2026-01-11 19:07:17'),
(36, 'Maria Floresty Lake', 'Mitra (Pendataan dan Pengolahan)', 'RT.007/RW.004, Desa Nimasi, Kec. Bikomi Tengah', 'P', '+62 082-2367-80911', '530523030122', 'estilake14@gmail.com', '2026-01-11 19:07:17'),
(37, 'Maria Euphrasia Tas\'au', 'Mitra Pendataan', 'Jalan sonbay Tunbakun', 'P', '+62 822-4718-7066', '530523030055', 'miratasau976@gmail.com', '2026-01-11 19:07:17'),
(38, 'Adelina Sanit', 'Mitra Pendataan', 'Tublopo Rt 09 Rw 03', 'P', '+62 823-4104-1132', NULL, 'deliasanit15@gmail.com', '2026-01-11 19:07:17'),
(39, 'Vebrianti Meni Susu', 'Mitra Pendataan', 'BEBA, RT 022/RW 009, DESA OELAMI', 'P', '+62 813-3945-9365', '530523030012', 'vebysusu36@gmail.com', '2026-01-11 19:07:17'),
(40, 'ADIPONTIUS ALOISIUS TEFI', 'Mitra (Pendataan dan Pengolahan)', 'Jln. Sonbay Tanah Putih, RT/RW: 018/012, Kel. Kefamenanu Tengah, Kec. Kota Kefamenanu, Kab. TTU', 'L', '+62 081-3530-14861', '530523060018', 'tefiadipontus@gmail.com', '2026-01-11 19:07:17'),
(41, 'Ferdinandus Lake', 'Mitra Pendataan', 'RT 002 / RW 001', 'L', '+62 853-3344-5944', '530522030008', 'ferdinanduslake090@gmail.com', '2026-01-11 19:07:17'),
(42, 'Wilfridus Masaubat', 'Mitra Pendataan', 'Atolan,RT/RW 006/002,Desa Letneo Kecamatan Insana Barat', 'L', '+62 812-4611-6476', '530523030147', 'Fridusmasaubat25@gmail.com', '2026-01-11 19:07:17'),
(43, 'Coryanti Ermelinda Ati', 'Mitra Pengolahan', 'Jalan Sisingamangaraja No. 22, RT 04/RW 02', 'P', '+62 822-3773-3763', '530524100006', 'coriantyermelinda@gmail.com', '2026-01-11 19:07:17'),
(44, 'Frengkianus S. Ufa', 'Mitra Pendataan', 'Nansean', 'L', '+62 813-3713-7016', '530623110020', 'frengkianusufa@gmail.com', '2026-01-11 19:07:17'),
(45, 'YUNITA NENO', 'Mitra Pendataan', 'MAUBESI, RT 002 RW 001', 'P', '+62 852-6957-1671', '530522100110', 'yunitaneno2799@gmail.com', '2026-01-11 19:07:17'),
(46, 'Cornelius Mardianto Buan Talan', 'Mitra Pendataan', 'Kuatnana, RT/Rw/001/001', 'L', '+62 881-2159-52260', '530522020043', 'corneliustalan@gmail.com', '2026-01-11 19:07:17'),
(47, 'Ermelinda Wea Go\'o', 'Mitra Pendataan', 'Jalan Ahmad Yani, RT 010 RW 003', 'P', '+62 823-4238-8962', '530523060013', 'indagoo90@gmail.com', '2026-01-11 19:07:17'),
(48, 'Gradiana Talan', 'Mitra Pendataan', 'Kuatnana', 'P', '+62 822-8718-0381', '530522020042', 'talangradiana@gmail.com', '2026-01-11 19:07:17'),
(49, 'Marselina Seo', 'Mitra Pendataan', 'Maubesi RT/RW 009/002 Desa Maubesi, kecamatan Insana Tengah', 'P', '+62 821-5517-8801', '530522100116', 'seomarselina96@gmail.com', '2026-01-11 19:07:17'),
(50, 'Nikodemus kefi', 'Mitra Pendataan', 'BANAIN C Rt 005 Rw 002', 'L', '+62 821-4550-6329', '530523030088', 'kefinikodemus1987@gmail.com', '2026-01-11 19:07:17'),
(51, 'Yohanes Viser Nahak', 'Mitra Pendataan', 'Jalan Raya Pantai Utara, RT 003/RW 001', 'L', '+62 822-4755-5380', '530523030100', 'yohanesvnahak7@gmail.com', '2026-01-11 19:07:17'),
(52, 'Roswita Bani', 'Mitra Pendataan', 'RT 03 RW 01', 'P', '+62 821-4405-2744', '530522100296', 'roswitabani005@gmail.com', '2026-01-11 19:07:17'),
(53, 'Bernadette Esperanza Louiza Maria Lake', 'Mitra Pendataan', 'Jl. Yos Soedarso', 'P', '+62 085-3331-63573', '530524100004', 'rossielake@gmail.com', '2026-01-11 19:07:17'),
(54, 'Graciana Dede Amsikan', 'Mitra Pendataan', 'Oenitas RT 01 RW 01', 'P', '+62 082-2368-2002', '530523030102', 'gracianaamsikan@gmail.com', '2026-01-11 19:07:17'),
(55, 'Gabriel Naitkakin', 'Mitra (Pendataan dan Pengolahan)', 'RT 001 RW 001, Desa Letmafo Timur Kecamatan Insana Tengah', 'L', '+62 812-2709-6197', '530522100113', 'gebinaitkakin29@gmail.com', '2026-01-11 19:07:17'),
(56, 'Mathilda Firianti Bani', 'Mitra Pendataan', 'Oelnitep', 'P', '+62 852-6128-5275', '530522030038', 'virabani139@gmail.com', '2026-01-11 19:07:17'),
(57, 'Ferdinandus Suaun', 'Mitra Pengolahan', 'Jl. Diponegoro koko, kelurahan Bansone, Kecamatan Kota Kefamenanu, Kabupaten Timor Tengah Utara, Provinsi Nusa Tenggara Timur', 'L', '+62 082-2367-67569', NULL, 'Ferdinandussuaun@gmail.com', '2026-01-11 19:07:17'),
(58, 'Deni Mantolas', 'Mitra Pendataan', 'Desa Eban Rt/Rw 020/006', 'L', '+62 853-1933-7495', '530522100085', 'denimantolas@gmail.com', '2026-01-11 19:07:17'),
(59, 'Adeodatus Riulaman Berkanis', 'Mitra (Pendataan dan Pengolahan)', 'RT.006/RW.002 Desa Fatumuti, kecamatan Noemuti, Kabupaten TTU', 'L', '+62 123-6219-191', '530522100388', 'deoberkanis@gmail.com', '2026-01-11 19:07:17'),
(60, 'Sesarius Lolomsait', 'Mitra Pendataan', 'Saenam', 'L', '+62 812-3873-7052', '530522100195', 'Sesariuslolomsait@gmail.com', '2026-01-11 19:07:17'),
(61, 'Ferdinandes Filemon Raja', 'Mitra Pendataan', 'Jln. Pisang 2 Rt. 030 Rw 005', 'L', '+62 081-3389-16731', '530523030001', 'fedinadesraja@gmail.com', '2026-01-11 19:07:17'),
(62, 'Rince Eka Boling', 'Mitra Pendataan', 'NEKMATANI,RT/RW:040/007,KEL.KEFAMENANU SELATAN,KEC.KOTA KEFAMENANU', 'P', '+62 822-3774-6789', '530522100373', 'bolingrince@gmail.com', '2026-01-11 19:07:17'),
(63, 'Angelina Naikbiti', 'Mitra Pendataan', 'NAUTUS RT001/RW001', 'P', '+62 821-2552-1176', '530522100129', 'Anaikbiti@gmail.com', '2026-01-11 19:07:17'),
(64, 'Alfridus Naisau', 'Mitra Pendataan', 'Haufo\'o, RT 004 RW 002 DUSUN 1', 'L', '+62 813-6324-2018', NULL, 'alfridusnaisau1@gmail.com', '2026-01-11 19:07:17'),
(65, 'Yuli Oktovina Waly', 'Mitra Pendataan', 'RT 040 RW 007, KEFAMENANU SELATAN', 'P', '+62 085-3338-35466', '530522020023', 'yuliwaly25@gmail.com', '2026-01-11 19:07:17'),
(66, 'Kresensia Neonnub', 'Mitra Pendataan', 'Nailiu,RT/RW:008/002', 'P', '+62 821-4784-9268', '530522100047', 'kresensianeonnub@gmail.com', '2026-01-11 19:07:17'),
(67, 'Dalmasius Naibesi', 'Mitra Pendataan', 'FATUHAO RT/RW 004/002, DESA FAFINESU B, KECAMATAN INSANA FAFINESU', 'L', '+62 813-3702-0620', '530522100235', 'dallmasiusnaibesi@gmail.com', '2026-01-11 19:07:17'),
(68, 'MELKIOR ADITYA SERAN', 'Mitra Pendataan', 'Jl.Basuki Rahmat, RT/RW: 003/006, Kel.Bepasi, Kec. Kota Kefamenanu', 'L', '+62 081-3392-42671', '530522100055', 'seranmelki789@gmail.com', '2026-01-11 19:07:17'),
(69, 'Florensia Lake', 'Mitra Pendataan', 'FATUNENO, RT/RW:010/005 Desa Fatuneno, Kecamatan Miomaffo Barat Kabupaten Timor Tengah Utara, Provinsi Nusa Tenggara Timur', 'P', '+62 823-5954-3292', '530523080002', 'florensialake1@gmail.com', '2026-01-11 19:07:17'),
(70, 'Kristina Emanuela Sutal', 'Mitra Pendataan', 'Kuatnana RT/RW 001/001', 'P', '+62 878-1541-3626', '530523030027', 'kristinasutal@gmail.com', '2026-01-11 19:07:17'),
(71, 'Richardus Alexandro Oeleu', 'Mitra Pengolahan', 'Jalan Sonbay Rt 031 Rw 005', 'L', '+62 822-6691-4552', NULL, 'richardusoeleu@gmail.com', '2026-01-11 19:07:17'),
(72, 'Elma Roswita Opat', 'Mitra (Pendataan dan Pengolahan)', 'Oeekam, RT 008 / RW 02', 'P', '+62 822-6623-0722', '530523060028', 'elmanacho.echan@gmail.com', '2026-01-11 19:07:17'),
(73, 'Maria Fatima Makun', 'Mitra (Pendataan dan Pengolahan)', 'Desa Sapaen RT 01/RW 01, Kecamatan Biboki Utara, Kabupaten Timor Tengah Utara', 'P', '+62 821-4619-6960', '530523110050', 'mariafatimamakun11@gmail.com', '2026-01-11 19:07:17'),
(74, 'Adelina Armi Asmiati Kefi', 'Mitra Pengolahan', 'Jln. Sisingamangaraja Benpasi RT 09/RW 02', 'P', '+62 823-2380-2813', '530522110013', 'adelkefi29@gmail.com', '2026-01-11 19:07:17'),
(75, 'Abraham Derusel Tethun', 'Mitra Pendataan', 'Jalan mamsena', 'L', '+62 821-4498-4146', '530522100054', 'abrahamtethun8@gmail.com', '2026-01-11 19:07:17'),
(76, 'Bernadus Igo Koten', 'Mitra Pendataan', 'Jl. Gereja Katolik St. Petrus Kanisius Manufui RT 09 RW 04 Desa Upfaon', 'L', '+62 812-1081-6313', '530523030148', 'igokoten94@gmail.com', '2026-01-11 19:07:17'),
(77, 'Theofilus Natun Kolo', 'Mitra Pendataan', 'Jalan Bibis RT/RW 02/01', 'L', '+62 822-4596-2897', '530522030033', 'theofiluskolo@gmail.com', '2026-01-11 19:07:17'),
(78, 'Desiderius Yosef Kaauni', 'Mitra Pendataan', 'Maubesi. Desa Maubesi. Kecamatan Insana Tengah. Kabupaten Timor Tengah Utara', 'L', '+62 813-3855-0799', '530523030128', 'dariuskaaunii@gmail.com', '2026-01-11 19:07:17'),
(79, 'Romualdus Yemarsef Banusu', 'Mitra Pendataan', 'Jalan Timor Raya Nesam  RT 16 RW 04 km 29', 'L', '+62 822-7111-8392', '530522020055', 'obybanusus@gmail.com', '2026-01-11 19:07:17'),
(80, 'Novilinda Naisaban', 'Mitra Pendataan', 'Tainmetan RT 013 Desa Maubesi, Kec Insana Tengah', 'P', '+62 813-3879-3916', '530522100111', 'novilindanaisaban491@gmail.com', '2026-01-11 19:07:17'),
(81, 'Herman Naif', 'Mitra Pendataan', 'Oemasi, RT 004/ RW 002 Desa Fatuana', 'L', '+62 821-5855-1863', '530522030014', 'hackyrman6@gmail.com', '2026-01-11 19:07:17'),
(82, 'Yuliana Missa', 'Mitra Pendataan', 'Haulasi, RT 002 RW 001 Desa Haulasi, Kecamatan Miomaffo Barat, Kabupaten Timor Tengah Utara', 'P', '+62 813-6763-2441', '530523030022', 'yulianamissa70@gmail.com', '2026-01-11 19:07:17'),
(83, 'Radegunda Oeleu', 'Mitra Pendataan', 'Jln.Nekmese,Desa Usapinonot RT/RW 001/001', 'P', '+62 813-5333-5410', '530522100067', 'oeleuradegunda@gmail.com', '2026-01-11 19:07:17'),
(84, 'Cristina Lopes Amaral', 'Mitra Pendataan', 'jalan Timor Raya, Oelurai  desa Tapenpah, kecamatan Insana, RT 008 RW  berapa .', 'P', '+62 853-3967-3887', '530523110044', 'resthyamaral@gmail.com', '2026-01-11 19:07:17'),
(85, 'Florida Primania Ketty Luan', 'Mitra (Pendataan dan Pengolahan)', 'Kilometer Lima', 'P', '+62 821-4695-3231', '530622020014', 'kattiluan@gmail.com', '2026-01-11 19:07:17'),
(86, 'Heribertus Rio Bria', 'Mitra Pendataan', 'Pantae, RT/RW 007/003', 'L', '+62 822-3705-5715', '530522100275', 'briario081@gmail.com', '2026-01-11 19:07:17'),
(87, 'OKTAVIANA FEKA', 'Mitra Pendataan', 'Oelneke RT/RW; 008/004', 'P', '+62 822-4797-4192', '530522100138', 'oktavianafeka@gamail.com', '2026-01-11 19:07:17'),
(88, 'Novyanti Tanik', 'Mitra Pengolahan', 'Tububue, RT/RW : 029/001', 'P', '+62 813-3736-7489', '530522110006', 'novhytanik@gmail.com', '2026-01-11 19:07:17'),
(89, 'Adriana Maria Gorethi Fobia', 'Mitra Pendataan', 'Jl acasia rt 008 Rw 004', 'P', '+62 812-6110-3091', '530522030039', 'adrianafobia1980@gmail.com', '2026-01-11 19:07:17'),
(90, 'Vinsensius Paebesi', 'Mitra Pendataan', 'Aibano,oan ,RT/RW 007/002 Desa Boronubaen', 'L', '+62 821-1176-9053', '530522050003', 'Paebesivinsen02@gmail.com', '2026-01-11 19:07:17'),
(91, 'Vitalis Aliyance Lake', 'Mitra Pendataan', 'Jl. Fatualam, RT 006, RW 002, Desa Lapeom, Kecamatan Insana Barat', 'L', '+62 081-3536-14394', '530522100046', 'vitalislake89@gmail.com', '2026-01-11 19:07:17'),
(92, 'Yosefa Citra Dewi Abi', 'Mitra Pendataan', 'Sainoni,fatunaenu,RT/RW 007/003', 'P', '+62 823-2130-7146', '530524100002', 'yosefaabi66@gmail.com', '2026-01-11 19:07:17'),
(93, 'Elisabeth Lelu Lagamakin', 'Mitra Pendataan', 'Jl. Sisingamangaraja No. 01, RT.019/RW.005', 'P', '+62 821-1001-0626', '530523030002', 'elisabethlelu9@gmail.com', '2026-01-11 19:07:17'),
(94, 'SILVERIOR GONZAGA BERELAKA', 'Mitra Pendataan', 'Jl. Sobay, RT.014/RW.02, Kefamenanu Sel., Kec. Kota Kefamenanu, Kabupaten Timor Tengah Utara, Nusa Tenggara Tim. 85613', 'L', '+62 877-6592-8123', '530524100007', 'silveriorberelaka@gmail.com', '2026-01-11 19:07:17'),
(95, 'Yuliana Luruk Nahak', 'Mitra Pendataan', 'Ekanaktuka,RT/RW : 001/001,Desa. botof, Kecamatan Insana', 'P', '+62 822-3649-8514', NULL, 'yulianaluruknahak@gmail.com', '2026-01-11 19:07:17'),
(96, 'Liberius E. Lake', 'Mitra Pendataan', 'Oenenu', 'L', '+62 813-5394-0273', '530522020022', 'ericklacke@gmail.com', '2026-01-11 19:07:17'),
(97, 'Destika Keke', 'Mitra Pendataan', 'Nansean, RT/RW 002/002', 'P', '+62 081-3539-89729', '530522030054', 'destikakeke18@gmail.com', '2026-01-11 19:07:17'),
(98, 'Polykarpus Manek Balibo', 'Mitra Pendataan', 'RT 006 / RW 002', 'L', '+62 822-3798-0708', '530522030037', 'olisbalibo@gmail.com', '2026-01-11 19:07:17'),
(99, 'Wenseslaus Evensius mano', 'Mitra Pendataan', 'Desa Baas RT 004/RW 001', 'L', '+62 853-3355-1233', '530522100015', 'wenseslausevenm@gmail.com', '2026-01-11 19:07:17'),
(100, 'Matheus Mitriji Ola Lake', 'Mitra Pendataan', 'Peboko', 'L', '+62 823-5940-7118', '530523030143', 'laketheo8@gmail.com', '2026-01-11 19:07:17'),
(101, 'Yosefina Funan', 'Mitra Pendataan', 'TUAMAU RT 008/RW 002 DESA BANNAE', 'P', '+62 823-3671-5794', '530522100045', 'vivifunan0111@gmail.com', '2026-01-11 19:07:17'),
(102, 'Cresensia Kefi', 'Mitra Pendataan', 'Jln Diponegoro RT/RW: 017/006', 'P', '+62 813-3753-7931', '530523110035', 'cresensiakefi7@gmail.com', '2026-01-11 19:07:17'),
(103, 'Robertus Torino Banusu', 'Mitra Pendataan', 'OEKOLO RT/RW 006/002', 'L', '+62 821-1266-0569', '530522100234', 'Rinobanusu@gmail.com', '2026-01-11 19:07:17'),
(104, 'Cornelia M M Klau', 'Mitra Pendataan', 'JL NURI RT 003 RW 001', 'P', '+62 822-4702-5973', '530522030056', 'nellyklau@yahoo.co', '2026-01-11 19:07:17'),
(105, 'Graciana Abi', 'Mitra Pendataan', 'RT 005/RW 002, Desa Sainoni, Kecamatan Bikomi Utara Kabupaten Timor Tengah Utara', 'P', '+62 821-4530-1490', '530522100011', 'cia160498@gmail.com', '2026-01-11 19:07:17'),
(106, 'Hendrikus Naben', 'Mitra Pendataan', 'Eban, RT/RW:005/002 Desa Eban, Kecamatan Miomaffo Barat Kabupaten Timor Tengah Utara', 'L', '+62 823-1133-4416', '530522100232', 'hendriknaben@gmail.com', '2026-01-11 19:07:17'),
(107, 'Antonius Tna\'auni', 'Mitra Pendataan', 'Kuanek, RT007 RW003', 'L', '+62 821-4708-6875', '530522030036', 'antonius.tnaauni87@yahoo.com', '2026-01-11 19:07:17'),
(108, 'Frederikus Nia', 'Mitra Pendataan', 'Maurisu Utara', 'L', '+62 081-2462-58170', '530523110003', 'frederikusnia@gmail.com', '2026-01-11 19:07:17'),
(109, 'MARVELIA NOVIRA AMTAHAN', 'Mitra Pendataan', 'Oelolok, RT 001/ RW 001', 'P', '+62 853-3737-5097', NULL, 'firaamtahan@gmail.com', '2026-01-11 19:07:17'),
(110, 'Angela Huberti Kono', 'Mitra (Pendataan dan Pengolahan)', 'Kuanek, RT 005/ RW 003', 'P', '+62 821-4525-2625', NULL, 'angelakono99@gmail.com', '2026-01-11 19:07:17'),
(111, 'Alexius Sasi', 'Mitra Pendataan', 'Baas RT 002 RW 002', 'L', '+62 786-9942-629', '530522100014', 'alexiussasi@gmail.com', '2026-01-11 19:07:17'),
(112, 'Valentina M Mamo', 'Mitra (Pendataan dan Pengolahan)', 'Desa Noepesu', 'P', '+62 812-3647-1730', '530523110027', 'ennymamo23@gmail.com', '2026-01-11 19:07:17'),
(113, 'Elisabeth Chyntya Rafu Fahik', 'Mitra Pendataan', 'Naesleu RT 022 RW 004', 'P', '+62 812-3549-8881', '530522100009', 'ciku130499@gmail.com', '2026-01-11 19:07:17'),
(114, 'Petronela Dale', 'Mitra Pendataan', 'Jln.Sonbay Tunbakun', 'P', '+62 812-9385-9321', '530523110052', 'nonadlle903@gmail.com', '2026-01-11 19:07:17'),
(115, 'LODIVIKUS BERE MAU', 'Mitra Pendataan', 'Desa Nimasi', 'L', '+62 853-3835-9690', '530522100028', 'lodivikusberemau@gmail.com', '2026-01-11 19:07:17'),
(116, 'Evlyn Paula Klau', 'Mitra Pengolahan', 'Jalan Ahmad Yani RT 027 / RW 004', 'P', '+62 822-4772-9603', '530523060024', 'evlynp1310@gmail.com', '2026-01-11 19:07:17'),
(117, 'Fedelia Maria N. Da Conceicao', 'Mitra (Pendataan dan Pengolahan)', 'Jln.Nuri Fatuteke', 'P', '+62 822-4767-6069', '530523070002', 'ila.daconceicao24@gmail.com', '2026-01-11 19:07:17'),
(118, 'Yerimias Manek', 'Mitra Pendataan', 'Kelurahan Bansone,RT/RW.003/001,Kecamatan Kota Kefamenanu', 'L', '+62 812-3800-3099', '530522100069', 'manekyeri@gmail.com', '2026-01-11 19:07:17'),
(119, 'Winfrida yosefa sani lake', 'Mitra Pendataan', 'Jl.L Lake Nilulat', 'P', '+62 822-4788-5466', '530522020019', 'lakewindy173@gmail.com', '2026-01-11 19:07:17'),
(120, 'Fransiskus Rissaldo Elu', 'Mitra Pendataan', 'JLN. SISINGAMANGARAJA BENPASI', 'L', '+62 821-4676-1575', '530522100140', 'risalll1997@gmail.com', '2026-01-11 19:07:17'),
(121, 'Roderiques Primus Olla', 'Mitra Pendataan', 'RT/RW:004/002', 'L', '+62 082-2479-18994', '530522100162', 'primusroderiques@gmail.com', '2026-01-11 19:07:17'),
(122, 'Antonina kefi', 'Mitra Pendataan', 'Banain, Rt/Rw 003/002', 'P', '+62 081-2466-25148', '530522100141', 'antoninakefi4@gmail.com', '2026-01-11 19:07:17'),
(123, 'Yohana Maria Neo', 'Mitra Pendataan', 'BITAUNI', 'P', '+62 812-7823-6661', '530522020068', 'yohananeo8@gmail.com', '2026-01-11 19:07:17'),
(124, 'Rony Alexander Boling', 'Mitra Pendataan', 'Nekmatani RT/RW: 040/007', 'L', '+62 812-8450-3814', '530522020025', 'ronyboling@gmail.com', '2026-01-11 19:07:17'),
(125, 'Angelina Lawalu', 'Mitra Pendataan', 'Jln. Akasia RT: 008 RW: 004', 'P', '+62 821-4412-9165', '530522100357', 'lawaluangelina@gmail.com', '2026-01-11 19:07:17'),
(126, 'Djulita Thresiani Nahak', 'Mitra Pengolahan', 'Kelurahan Sasi Rt/Rw 027/001', 'P', '+62 081-2468-22308', '530523060021', 'djulitanahak78@gmail.com', '2026-01-11 19:07:17'),
(127, 'Jozina Erlinda Mariati Nara Kaha', 'Mitra Pendataan', 'Jl. Diponegoro, RT 10/RW 04', 'P', '+62 812-4630-3515', '530522100356', 'jozina01ge02gei@gmail.com', '2026-01-11 19:07:17'),
(128, 'Ana Viktoria Ampolo', 'Mitra Pendataan', 'Kampung Baru,Rt009/Rw003', 'P', '+62 821-4613-2758', '530522030040', 'annaampolo271@gmail.com', '2026-01-11 19:07:17'),
(129, 'Bonefasius Hati Sanbein', 'Mitra (Pendataan dan Pengolahan)', 'Jln. Pelajar Lurasik RT/RW 016/004', 'L', '+62 812-3704-5160', '530522100038', 'bonefasiussanbein@gmail.com', '2026-01-11 19:07:17'),
(130, 'Yunita Elenora Kono', 'Mitra Pendataan', 'RT.012, RW.007', 'P', '+62 813-4214-9640', '530523030017', 'nitaelfrida03@gmail.com', '2026-01-11 19:07:17'),
(131, 'Fransiska Monalisa Amaina Oky', 'Mitra Pendataan', 'Upkasen RT/RW 017/006', 'P', '+62 821-4745-7399', '530523030015', 'fransiskaoki2602@gmail.com', '2026-01-11 19:07:17'),
(132, 'Aloysius Damianus Kolo', 'Mitra Pendataan', 'Puaono RT/RW: 001/001 Banain B', 'L', '+62 853-3831-5140', '530523030065', 'aloysiusdamianuskolo@gmail.com', '2026-01-11 19:07:17'),
(133, 'Ronaldo Devino Jeronimo', 'Mitra Pendataan', 'Sasi, Km. 7', 'L', '+62 813-3698-8380', '530523060001', 'bynnojr007@gmail.com', '2026-01-11 19:07:17'),
(134, 'Marselinus Lalus', 'Mitra Pendataan', 'Desa Bijaepasu, Rt 014 / Rw 007', 'L', '+62 812-3852-3350', '530522030012', 'madridell59@gmail.com', '2026-01-11 19:07:17'),
(135, 'Elfrida Maria Manue Funan', 'Mitra Pendataan', 'Jl.Trans Kefa-Kupang', 'P', '+62 821-4403-1954', '530522100292', 'elfridamariafunan@gmail.com', '2026-01-11 19:07:17'),
(136, 'FRANSISKUS XAVERIUS AFANDI NAIMNULE', 'Mitra (Pendataan dan Pengolahan)', 'Desa Buk RT.003 RW.002', 'L', '+62 812-3690-9190', '530523060030', 'themasterafandi@gmail.com', '2026-01-11 19:07:17'),
(137, 'Pius Fenansius Masaubat', 'Mitra Pendataan', 'OINBIT RT 003/ RW 002', 'L', '+62 822-1492-1599', '530522100214', 'ravenmasaubat98@gmail.com', '2026-01-11 19:07:17'),
(138, 'Kanisius yos lake', 'Mitra Pendataan', 'Maumolo,RT/RW:017/006', 'L', '+62 813-4753-4618', '530522100335', 'Lakekenz@gmail.com', '2026-01-11 19:07:17'),
(139, 'Janrino Junus Rivaldi Fanggidae', 'Mitra Pengolahan', 'BTN Naiola Bikomi Selatan RT. 013 / RW. 004', 'L', '+62 081-3251-92102', NULL, 'janrinofanggidae@gmail.com', '2026-01-11 19:07:17'),
(140, 'Claudia Nadia. Putri. Yoani Lake', 'Mitra Pendataan', 'Jl seroja Kelurahan Kefamenanu Utara', 'P', '+62 821-4698-3936', '530523110007', 'nadyaganzer19@gmail.com', '2026-01-11 19:07:17'),
(141, 'Fanda Apriani Kolloh', 'Mitra Pendataan', 'Jl. Prof. Dr. W. Z. Yohanes, kilo meter 7', 'P', '+62 852-3802-4530', NULL, 'fandakolloh@gmail.com', '2026-01-11 19:07:17'),
(142, 'Margharetha S. Naibobe', 'Mitra (Pendataan dan Pengolahan)', 'Benpasi, RT 009 RW 005', 'P', '+62 821-4053-6787_', '530524100005', 'ghegeaplugi@gmail.com', '2026-01-11 19:07:17'),
(143, 'Silveira Juniati Kolo', 'Mitra Pengolahan', 'Jalan Semangka', 'P', '+62 823-3964-5254', '530522110005', 'silveirajuniatikolo@gmail.com', '2026-01-11 19:07:17'),
(144, 'Anita Carolina Sao Salo', 'Mitra Pendataan', 'Benpasi RT.012 / RW.003', 'P', '+62 813-3981-0012', '530522100326', 'anitasaosalo@gmail.com', '2026-01-11 19:07:17'),
(145, 'Maria Gradiana Misa', 'Mitra Pendataan', 'Jalan Timor Raya', 'P', '+62 081-3396-49955', '530523110055', 'derimisa7@gmail.com', '2026-01-11 19:07:17'),
(146, 'Selviana Hausufa', 'Mitra Pendataan', 'Tuabatan', 'P', '+62 812-5399-5826', '530522100121', 'selvianahausufa@gmail.com', '2026-01-11 19:07:17'),
(147, 'Petronela Unab', 'Mitra Pendataan', 'OELBONAK,RT 001 RW 002', 'P', '+62 823-3977-9231', '530522100040', 'petronelaunab@yahoo.com', '2026-01-11 19:07:17'),
(148, 'Inosensius Nggadas', 'Mitra Pendataan', 'Jl.L.Lake RT003/RW002', 'L', '+62 085-3380-89096', '530523030040', 'inosensiusnggadas@gmail.com', '2026-01-11 19:07:17'),
(149, 'Yohana Palbeno', 'Mitra Pendataan', 'Sunkaen,Desa Sunkaen,Rt/Rw.003,002,Kec.Bikomi Nilulat', 'P', '+62 822-7104-1233', '530522030024', 'palbenoyohana@gmail.com', '2026-01-11 19:07:17'),
(150, 'Kristafora Metan', 'Mitra Pendataan', 'OENENU UTARA, RT/RW : 002/001, KECAMATAN BIKOMI TENGAH KABUPATEN TIMOR TENGAH UTARA', 'P', '+62 822-4735-1350', '530522100024', 'istametan09@gmail.com', '2026-01-11 19:07:17'),
(151, 'Oktaviana kope', 'Mitra Pendataan', 'Desa batnes kecamatan musi', 'P', '+62 085-2161-03172', '530522100147', 'Kopeoktaviana33@gmail.com', '2026-01-11 19:07:17'),
(152, 'Yoseph Benyamin Hati Meo Tulasi', 'Mitra Pendataan', 'Teflopo ,RT 005/ RW 002 DUSUN B', 'L', '+62 081-3120-66649', '530522100099', 'hatimeotulasi1986@gmail.com', '2026-01-11 19:07:17'),
(153, 'Damianus Banusu', 'Mitra (Pendataan dan Pengolahan)', 'Oekolo, RT/RW: 012/003, Desa Humusu Oekolo, Kecamatan Insana Utara', 'L', '+62 812-4661-6012', '530522100233', 'damianusbanusu59@gmail.com', '2026-01-11 19:07:17'),
(154, 'Yohana Albertin Pay', 'Mitra Pendataan', 'RT/RW: 055/006', 'P', '+62 813-3797-2445', '530522020052', 'yohanaalbertinpay@gmail.com', '2026-01-11 19:07:17'),
(155, 'Gradiana olga rafu', 'Mitra Pendataan', 'Motadik, RT 010 RW 01', 'P', '+62 822-5391-4901', '530522100059', 'olgarafu04@gmail.com', '2026-01-11 19:07:17'),
(156, 'Louis Florentino Maria Lake', 'Mitra Pendataan', 'Nifutasi RT/ RW 002/001', 'L', '+62 821-4467-3272', '530523040005', 'louisflorentinomarialake@gmail.com', '2026-01-11 19:07:17'),
(157, 'Ignasia wanty Taena', 'Mitra Pendataan', 'Usapipukan', 'P', '+62 813-3798-5467', NULL, 'Ignasiawtaena@gmail.com', '2026-01-11 19:07:17'),
(158, 'Hendrikus Paulus Malelak', 'Mitra Pendataan', 'Jl.akasia Kefamenanu utara', 'L', '+62 821-4512-9811', '530522100134', 'hendrikuspaulusmalelak@gmail.com', '2026-01-11 19:07:17'),
(159, 'Desi Fatima Amloki', 'Mitra Pendataan', 'Oelolok RT/RW 002/001', 'P', '+62 082-1457-13415', '530522100170', 'dessiamloki02@gmail.com', '2026-01-11 19:07:17'),
(160, 'ADRIANUS KOLO', 'Mitra Pendataan', 'BANURU, RT 002/RW 001', 'L', '+62 821-4421-8983', '530523110018', 'ardhyadryan87@gmail.com', '2026-01-11 19:07:17'),
(161, 'Rofina Kolo Tubani Naisoko', 'Mitra (Pendataan dan Pengolahan)', 'Tubuhue, RT 003/ RW 001', 'P', '+62 812-3889-3896', NULL, 'naisokofhya@gmail.com', '2026-01-11 19:07:17'),
(162, 'Sofiana Koa', 'Mitra Pendataan', 'Wini', 'P', '+62 813-2912-0015', '530523080007', 'Koasofiana@gmail.com', '2026-01-11 19:07:17'),
(163, 'JEFRIANUS UA ATINI', 'Mitra Pendataan', 'Nansean', 'L', '+62 823-4032-1754', NULL, 'jhemarshy019@gmail.com', '2026-01-11 19:07:17'),
(164, 'Kadek Adinda Chintya Divayani', 'Mitra (Pendataan dan Pengolahan)', 'Tainmetan, RT 001, RW 001', 'P', '+62 821-5847-6946', '530623110049', 'kadekadinda119@gmail.com', '2026-01-11 19:07:17'),
(165, 'Claudia Yunita Anggraini Mout', 'Mitra Pendataan', 'Jalan Mutis Rt/Rw: 003/001', 'P', '+62 087-8654-00013', NULL, 'rarakithly10@icloud.com', '2026-01-11 19:07:17'),
(166, 'Elfrida Nensiana Kono Foni', 'Mitra (Pendataan dan Pengolahan)', 'Oelninaat, RT/RW: 017/005, Kelurahan Maubeli, Kecamatan Kota Kefamenanu', 'P', '+62 813-3792-1798', '530524100003', 'estifoni46@gmail.com', '2026-01-11 19:07:17'),
(167, 'Thomas Didimus Naitkakin', 'Mitra Pendataan', 'Kiupasan', 'L', '+62 821-4550-6329', '530523030104', 'izanaitkakin@gmail.com', '2026-01-11 19:07:17'),
(168, 'Wilibrodus Thaal', 'Mitra Pendataan', 'Desa saenam RT 001/RW 002', 'L', '+62 821-4488-6862', '530523030063', 'thaalwilly@gmail.com', '2026-01-11 19:07:17'),
(169, 'Yuliana Nono', 'Mitra Pendataan', 'Bakitolas, RT 010/RW 003. Desa Bakitolas. Kecamatan Naibenu', 'P', '+62 821-4525-9384', '530523030070', 'yulinono524@gmail.com', '2026-01-11 19:07:17'),
(170, 'Veronika Alesandra Aleus', 'Mitra Pengolahan', 'DESA TUBUHUE, KM 4, RT 006,RW 002', 'P', '+62 823-4027-6220', NULL, 'alesandraaleus@gmail.com', '2026-01-11 19:07:17'),
(171, 'Antonius Mario Fendriano Kefi', 'Mitra Pendataan', 'Jalan Sonbay, Rt/Rw 030/012, Kel. Kefa Tengah', 'L', '+62 813-9374-6063', '530522100346', 'kefifendry37@gmail.com', '2026-01-11 19:07:17'),
(172, 'Godefredus Mariano Naikofi', 'Mitra Pendataan', 'Jalan Ahmad Yani, Km 3 RT 026/ RW 004', 'L', '+62 813-3980-9842', NULL, 'marionaikofi06@gmail.com', '2026-01-11 19:07:17'),
(173, 'Sesilia Malaof Fallo', 'Mitra Pendataan', 'Jl.Haekto RT/RW : 001/001', 'P', '+62 082-1440-03105', '530522100161', 'liafalo1212@gmail.com', '2026-01-11 19:07:17'),
(174, 'Marianus Paebesi', 'Mitra Pendataan', 'Boronubaen RT 008/ RW 002', 'L', '+62 082-1117-69031', '530523080009', 'marianuspaebesi@gmail.com', '2026-01-11 19:07:17'),
(175, 'Robertus Fnini', 'Mitra Pendataan', 'NANSEAN, RT 002 RW 002', 'L', '+62 813-5385-0201', '530522030047', 'fninirobidistikakeke@gmail.com', '2026-01-11 19:07:17'),
(176, 'Magdalena Agustina Poto', 'Mitra Pendataan', 'Jalan Kartini RT 038 RW 002', 'P', '+62 852-3917-6791', '530522030046', 'magdalenapotoena@gmail.com', '2026-01-11 19:07:17'),
(177, 'Wilfrid Roberto Suan', 'Mitra Pendataan', 'RT 005 RW 003', 'L', '+62 895-2012-2557', '530522100001', 'willmcrmy950@gmail.com', '2026-01-11 19:07:17'),
(178, 'Yulianus Benediktus To', 'Mitra Pendataan', 'RT 036 / RW 006', 'L', '+62 852-5306-1226', '530522030059', 'alvianoto@gmail.com', '2026-01-11 19:07:17'),
(179, 'Bonevantura Masaubat', 'Mitra Pendataan', 'Oinbit', 'L', '+62 812-1008-7994', '530522020046', 'fentmasaubat@gmail.com', '2026-01-11 19:07:17'),
(180, 'Giovanny Robertho Wolfram Lake', 'Mitra Pendataan', 'Jl. Pattimura RT 008 RW 005', 'L', '+62 821-4639-5676', NULL, 'giovannyroberthowolframlake@gmail.com', '2026-01-11 19:07:17'),
(181, 'Lidia Ludgardis Neolaka', 'Mitra Pendataan', 'Bijeli,Rt 005/Rw 002 Desa Bijeli-Kecamatan Noemuti', 'P', '+62 822-3633-8251', '530523080006', 'Lidyaneolaka23@gmail.com', '2026-01-11 19:07:17'),
(182, 'Alexander Funan', 'Mitra (Pendataan dan Pengolahan)', 'Opo, RT/RW: 003/001, Desa Pantae, Kecamatan Biboki Selatan, Kabupaten Timor Tengah Utara', 'L', '+62 821-4525-2456', '530523080003', 'alexander.funan@gmail.com', '2026-01-11 19:07:17'),
(183, 'MARIA AMFOTIS', 'Mitra Pendataan', 'Benpasi Rt 02.Rw 01', 'P', '+62 813-3857-1627', '530522030041', 'miaamfotis5@gmail.com', '2026-01-11 19:07:17'),
(184, 'Priska Vianne Kefi', 'Mitra (Pendataan dan Pengolahan)', 'Benpasi RT 010 RW 005', 'P', '+62 852-4520-2928', '530523060016', 'priskakefi@gmail.com', '2026-01-11 19:07:17'),
(185, 'Maria Gracia Kefi', 'Mitra Pendataan', 'Jln. Sisingamangaraja RT/RW 006/002 Benpasi', 'P', '+62 822-4750-2071', '530522020037', 'marianaibukefi@gmail.com', '2026-01-11 19:07:17'),
(186, 'Florida Hati', 'Mitra Pendataan', 'Fatuhao,RT 005,RW 003, Desa Fafinesu B kecamatan Insana Fafinesu', 'P', '+62 851-6711-4428', '530522100005', 'hakkytune@gmail.com', '2026-01-11 19:07:17'),
(187, 'Frederikus Fransiskus Lake', 'Mitra Pendataan', 'Aplasi RT/RW: 006/003', 'L', '+62 812-1742-7838', '530522100359', 'frederikuslake@gmail.com', '2026-01-11 19:07:17'),
(188, 'Rikardus Tahakae', 'Mitra Pendataan', 'RT 005 / RW 002', 'L', '+62 812-3690-1581', '530522030019', 'rikard.tahakae@gmail.com', '2026-01-11 19:07:17'),
(189, 'Marselina Ketmoen', 'Mitra Pendataan', 'JAK', 'P', '+62 812-4640-3417', '530522100249', 'serlyk16@gmail.com', '2026-01-11 19:07:17'),
(190, 'Yohanes Eban', 'Mitra Pendataan', 'Nefosene,RT/RW 005/003, Desa Sone, Kecamatan Insana Tengah', 'L', '+62 812-9984-8738', '530522100042', 'jhonilopes659@gmail.com', '2026-01-11 19:07:17'),
(191, 'Melkianus Y.M. Ufa', 'Mitra Pendataan', 'Nansean', 'L', '+62 823-4104-226', NULL, 'yantoufa4@gmail.com', '2026-01-11 19:07:17'),
(192, 'Bartolomeus sani', 'Mitra Pendataan', 'BENUS RT 03 RW 01', 'L', '+62 821-4725-4770', '530522100286', 'bartoteme@gmail.com', '2026-01-11 19:07:17'),
(193, 'Oktovianus Naikofi', 'Mitra Pendataan', 'Ekanaktuka,RT/RW  :001/001, Desa Botof, Kecamatan Insana, kabupaten Timor Tengah Utara', 'L', '+62 082-1385-65132', '530522020031', 'oktonaikofi242@gmail.com', '2026-01-11 19:07:17'),
(194, 'Petrus sambu Djawa', 'Mitra (Pendataan dan Pengolahan)', 'Oenaek, RT/RW 003/002, Desa Fafinesu, kecamatan Insana Fafinesu', 'L', '+62 081-2642-20442', NULL, 'petrussambudjawa@gmail.com', '2026-01-11 19:07:17'),
(195, 'Maria Marsela Ua', 'Mitra Pendataan', 'Bitauni', 'P', '+62 852-5398-6176', '530522030013', 'mariamarselaua@gmail.com', '2026-01-11 19:07:17'),
(196, 'Selestiano Cabreira Do Rosario', 'Mitra Pendataan', 'Jl. Meo Otu Hale', 'L', '+62 821-6167-8201', NULL, 'selesrosario@gmail.com', '2026-01-11 19:07:17'),
(197, 'Hildegardis Jeni Tefa', 'Mitra Pendataan', 'Fatuneno', 'P', '+62 813-3725-9016', NULL, 'jenitefahildegardis@gmail.com', '2026-01-11 19:07:17'),
(198, 'Petrus Aleus Ninu', 'Mitra Pendataan', 'RT 004 RW 002 DUSUN 01 KOTE', 'L', '+62 822-9864-6182', '530522030005', 'petrusninu175@gmail.com', '2026-01-11 19:07:17'),
(199, 'Valentina Leltakaeb', 'Mitra Pendataan', 'Oeolo RT 005 RW 003', 'P', '+62 082-1451-95890', '530523030099', 'valentinaleltakaeb@gmail.com', '2026-01-11 19:07:17'),
(200, 'Widiana Maria abi', 'Mitra Pendataan', 'Tualene RT RW 009/005 Biboki utara', 'P', '+62 081-3395-27962', '530522100035', 'widianamariaabi@gmail.com', '2026-01-11 19:07:17'),
(201, 'Gonzalves Damian Tabati', 'Mitra Pendataan', 'Jalan Boronubaen', 'L', '+62 821-4496-9248', NULL, 'gonzalvestabati12@gmail.com', '2026-01-11 19:07:17'),
(202, 'Yosef Antoin Taus', 'Mitra Pendataan', 'RT 003 / RW 002', 'L', '+62 821-3483-6116', '530522030017', 'yosefantoin1@gmail.com', '2026-01-11 19:07:17'),
(203, 'Fransiskus Usfinit', 'Mitra Pendataan', 'Boentuna Rt/Rw 001/001, Desa Humusu Sainiup', 'L', '+62 813-1851-4393', '530522020018', 'fransusfinit86@gmail.com', '2026-01-11 19:07:17'),
(204, 'Aprianus Oematan', 'Mitra Pendataan', 'Jln. Suan-Sabu,  Desa fatunisuan Kecamatan Miomaffo Barat', 'L', '+62 813-5328-8617', '530523030131', 'Itokaunan27@gmail.com', '2026-01-11 19:07:17'),
(205, 'Elda Suni', 'Mitra Pendataan', 'Haumeni, RT 002/RW 001, Desa Haumeni, Kecamatan Bikomi Utara', 'P', '+62 813-3713-5772', '530522050004', 'eeldasuni@gmail.com', '2026-01-11 19:07:17'),
(206, 'Dolfiana Hartun', 'Mitra Pendataan', 'Kotafoun, RT 008 RW 003', 'P', '+62 813-3702-4784', '530522030058', 'dolfianahartun95@gmail.com', '2026-01-11 19:07:17'),
(207, 'Yustina Sanae Sanak', 'Mitra Pengolahan', 'Jl. Diponeggoro, Koko, Rt/Rw 013/005', 'P', '+62 082-1450-57806', NULL, 'Novasanak34@gmail.com', '2026-01-11 19:07:17'),
(208, 'Kondradus Poli Mamulak', 'Mitra Pendataan', 'Berseon,  RT 010/RW 005, Desa Lokomea, Kecamatan Biboki Utara', 'L', '+62 853-3743-7782', '530523030005', 'kondradmamulak@gmail.com', '2026-01-11 19:07:17'),
(209, 'Elfira Evangelista Bala', 'Mitra (Pendataan dan Pengolahan)', 'Jalan Ahmad Yani, RT/RW : 025/004', 'P', '+62 823-5122-6341', NULL, 'elfirabala04@gmail.com', '2026-01-11 19:07:17'),
(210, 'Dominggus Taus', 'Mitra Pendataan', 'Bonak', 'L', '+62 822-6623-3710', '530523040001', 'tausdominggus@gmail.com', '2026-01-11 19:07:17'),
(211, 'Emilia Manek Kanmese', 'Mitra (Pendataan dan Pengolahan)', 'Jl. Sisingamangaraja Benpasi B, RT10 RW07', 'P', '+62 822-3506-3083', '530523060004', 'emiliamanek@gmail.com', '2026-01-11 19:07:17'),
(212, 'DONATIANA BARKANIS', 'Mitra Pendataan', 'Banfanu,Rt/Rw 008/004', 'P', '+62 081-2393-36235', NULL, 'onabarkanis444@gmail.com', '2026-01-11 19:07:17'),
(213, 'Yuventus Bubun', 'Mitra Pendataan', 'Bakitolas', 'L', '+62 813-8010-5617', '530522100206', 'yuvenbubun@gmail.com', '2026-01-11 19:07:17'),
(214, 'Fransiska Tmaisan', 'Mitra Pendataan', 'Kuanek, RT009, RW004', 'P', '+62 082-2664-10536', '530523110030', 'ransytmaisan@gmail.com', '2026-01-11 19:07:17'),
(215, 'FLEGONI EMANUEL NABEN', 'Mitra Pendataan', 'Fatumnasi,RT/RW :028/006 Desa Eban, kec. Miomaffo Barat', 'L', '+62 823-5955-1351', '530523030130', 'gonynaben95@gmail.com', '2026-01-11 19:07:17'),
(216, 'Regina Elvasani Jalo', 'Mitra Pengolahan', 'Jl.Eltari RT 001 RW 001', 'P', '+62 813-3754-1064', '530522110014', 'evajalo14@gmail.com', '2026-01-11 19:07:17'),
(217, 'Yudith Botha', 'Mitra Pendataan', 'Sap\'an', 'P', '+62 822-6692-0847', '530523080001', 'yudithbotha@gmail.com', '2026-01-11 19:07:17'),
(218, 'DAMIANUS BABU TULU', 'Mitra Pendataan', 'Oekolo, RT/RW:016/004,Desa Humusu Oekolo, Kecamatan Insana Utara', 'L', '+62 812-2290-3128', '530523030048', 'tuludamianus@gmail.com', '2026-01-11 19:07:17'),
(219, 'FREDERIKUS SERAN', 'Mitra Pengolahan', 'JLN JENDRAL A. YANI, RT/RW: 037/007, KECAMATAN KOTA KEFAMENANU, KABUPATEN TIMOR TENGAH UTARA. KELURAHAN KEFAMENANU SELATAN.', 'L', '+62 853-6382-8229', '530523030136', 'frederikusseran00@gmail.com', '2026-01-11 19:07:17'),
(220, 'Ubaldus Taninas', 'Mitra Pendataan', 'Oemofa Rt/Rw:021/008Desa Naekake A Kecamatan Mutis Kab TTU', 'L', '+62 823-4286-4276', '530523030142', 'Nintautaninas189@gmail.com', '2026-01-11 19:07:17'),
(221, 'Dorothea Saijao', 'Mitra Pendataan', 'Benpasi RT 005 RW 006', 'P', '+62 852-0545-3598', '530522030045', 'dorotheasaijao@gmail.com', '2026-01-11 19:07:17'),
(222, 'Apolinaris Tnesi', 'Mitra Pendataan', 'Oenopu, RT 005/ RW 003', 'L', '+62 821-4546-0387', '530522100181', 'apolinaristnesi@gmail.com', '2026-01-11 19:07:17'),
(223, 'Christin Friliani Kleing', 'Mitra Pengolahan', 'Jln. Ahmad yani, AS. kodim 1618 TTU', 'P', '+62 812-3865-0731', '530522020012', 'christinkleing@gmail.com', '2026-01-11 19:07:17'),
(224, 'ROSA DELIMA KOLO', 'Mitra (Pendataan dan Pengolahan)', 'Desa Taekas', 'P', '+62 858-4710-3755', NULL, 'selikolo11@gmail.com', '2026-01-11 19:07:17'),
(225, 'Maria Julia Ningsih Omenu', 'Mitra Pendataan', 'OEBKIN, RT.003/RW.001, DESA NAIOLA TIMUR', 'P', '+62 082-1445-68952', '530523110005', 'omenuningsih87@gmail.com', '2026-01-11 19:07:17'),
(226, 'Arnoldus Tulasi', 'Mitra Pendataan', 'Motadik', 'L', '+62 821-4490-8078', '530522020049', 'alonatulasi400@gmail.com', '2026-01-11 19:07:17'),
(227, 'Maria Getriana Taimenas', 'Mitra Pendataan', 'Jalan Nasional Trans Timor RT 002 RW 001', 'P', '+62 082-1771-37884', '530522030026', 'getrianataimenas@gmail.com', '2026-01-11 19:07:17'),
(228, 'Emiliana lake', 'Mitra Pendataan', 'Jl.A.YANI RT 35/RW 007 kelurahan Kefamenanu selatan', 'P', '+62 852-3057-0887', '530522100375', 'lakeemiliana@gmail.com', '2026-01-11 19:07:17'),
(229, 'Stefi Adelina Darsi', 'Mitra Pendataan', 'DESA BOTOF RT 001/RW 001', 'P', '+62 853-3830-5977', '530522030015', 'stefidarsi09@gmail.com', '2026-01-11 19:07:17'),
(230, 'Anita Ch Fandoe', 'Mitra Pendataan', 'RT 002 / RW 001', 'P', '+62 822-6189-5685', '530522030016', 'nitafandoe81@gmail.com', '2026-01-11 19:07:17'),
(231, 'Rosa Da Lima Kosat', 'Mitra Pendataan', 'BES\'ANA RT 012/RW 006', 'P', '+62 831-3078-9353', '530523030047', 'rosadalimakosat89@gmail.com', '2026-01-11 19:07:17'),
(232, 'Osepd Manasye Atonis', 'Mitra Pendataan', 'Matmanas, RT 024 RW 005, Kelurahan Benpasi Kecamatan Kota Kefamenanu', 'L', '+62 852-5315-5339', '530522100166', 'osteratonis@gmail.com', '2026-01-11 19:07:17'),
(233, 'Lidwin Serostiana Koa', 'Mitra Pendataan', 'Sasi, 008/003, kelurahan Sasi, Kota Kefamenanu', 'P', '+62 821-3794-2589', '530522020057', 'otykoa14@gmail.com', '2026-01-11 19:07:17'),
(234, 'Maria Tri Fridolin Hano\'e', 'Mitra (Pendataan dan Pengolahan)', 'Tualeu - Lanaus', 'P', '+62 813-1962-1675', NULL, 'trifridolin@gmail.com', '2026-01-11 19:07:17'),
(235, 'Adelina Naimuni', 'Mitra Pendataan', 'Kuatnana RT/RW : 002/001', 'P', '+62 852-0594-0996', '530522100213', 'adelinanaimuni1985@gmail.com', '2026-01-11 19:07:17'),
(236, 'Rosalinda Bukifan', 'Mitra Pendataan', 'SONAF,RT/RW:002/001,Kel/Desa:BILOE,Kec:BIBOKI UTARA', 'P', '+62 081-3374-98469', '530523030079', 'rosalindabukifan13@gmail.com', '2026-01-11 19:07:17'),
(237, 'Apryana Reni Tasuib', 'Mitra Pengolahan', 'Bukit 10 RT 12 RW 002', 'P', '+62 822-4787-0755', '530523060040', 'apryanatasuib@gmail.com', '2026-01-11 19:07:17'),
(238, 'Yovita Librianti Unab', 'Mitra Pendataan', 'Jl. Akasia RT 08 RW 04 Kel. Kefa Utara', 'P', '+62 813-3988-5559', '530522030023', 'Unabyovita@gmail.com', '2026-01-11 19:07:17'),
(239, 'Arrydarsmi Na\'at', 'Mitra Pengolahan', 'Besnaen RT 019 RW 005', 'L', '+62 082-3411-95406', '530523110036', 'arrynaat38@gmail.com', '2026-01-11 19:07:17'),
(240, 'Ferdinandus Wae', 'Mitra Pendataan', 'Jl Nuri Kefamenanu Selatan', 'L', '+62 214-5570-831', '530523030141', 'waeferi6@gmail.com', '2026-01-11 19:07:17');

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('evaluasi','validasi','permintaan_validasi','deadline','tugas','kendala','kegiatan') NOT NULL DEFAULT 'kegiatan',
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `reference_id`, `reference_type`, `is_read`, `created_at`, `read_at`) VALUES
(1, 3, 'Kegiatan Disetujui Koordinator', 'Kegiatan \"Survei\" telah disetujui oleh Koordinator Juan XXX dan menunggu persetujuan PPK.', 'kegiatan', 1, 'kegiatan', 1, '2026-02-17 17:18:10', '2026-02-19 05:35:08'),
(2, 3, 'Kegiatan Disetujui PPK', 'Kegiatan \"Survei\" telah disetujui oleh PPK Texaz dan menunggu persetujuan Kepala.', 'kegiatan', 1, 'kegiatan', 1, '2026-02-17 17:18:41', '2026-02-19 05:35:08'),
(3, 3, 'Kegiatan Disetujui - Dapat Dimulai', 'Kegiatan \"Survei\" telah disetujui oleh Kepala Marthin Juan. Kegiatan dapat segera dimulai.', 'kegiatan', 1, 'kegiatan', 1, '2026-02-17 17:20:36', '2026-02-19 05:35:08'),
(4, 3, 'Catatan Baru dari Pimpinan', 'Pimpinan memberikan catatan untuk kegiatan: Survei', 'evaluasi', 1, 'kegiatan', 1, '2026-02-18 13:17:38', '2026-02-19 05:35:08'),
(5, 3, 'Kegiatan Disetujui Koordinator', 'Kegiatan \"Johanes Siuk Teme\" telah disetujui oleh Koordinator Juan XXX dan menunggu persetujuan PPK.', 'kegiatan', 2, 'kegiatan', 1, '2026-02-18 14:55:58', '2026-02-19 05:35:08'),
(6, 3, 'Kegiatan Disetujui PPK', 'Kegiatan \"Johanes Siuk Teme\" telah disetujui oleh PPK Texaz dan menunggu persetujuan Kepala.', 'kegiatan', 2, 'kegiatan', 1, '2026-02-18 14:56:08', '2026-02-19 05:35:08'),
(7, 3, 'Kegiatan Disetujui - Dapat Dimulai', 'Kegiatan \"Johanes Siuk Teme\" telah disetujui oleh Kepala Marthin Juan. Kegiatan dapat segera dimulai.', 'kegiatan', 2, 'kegiatan', 1, '2026-02-18 14:56:18', '2026-02-19 05:35:08'),
(8, 3, 'Rekomendasi Baru dari Pimpinan', 'Pimpinan memberikan rekomendasi untuk kegiatan: Johanes Siuk Teme', 'evaluasi', 2, 'kegiatan', 1, '2026-02-18 15:13:35', '2026-02-19 05:35:08'),
(9, 3, 'Kegiatan Disetujui Koordinator', 'Kegiatan \"Valentino Michael Rizaldi Muda\" telah disetujui oleh Koordinator Juan XXX dan menunggu persetujuan PPK.', 'kegiatan', 3, 'kegiatan', 1, '2026-02-18 15:58:05', '2026-02-19 05:35:08'),
(10, 3, 'Kegiatan Disetujui PPK', 'Kegiatan \"Valentino Michael Rizaldi Muda\" telah disetujui oleh PPK Texaz dan menunggu persetujuan Kepala.', 'kegiatan', 3, 'kegiatan', 1, '2026-02-18 15:58:14', '2026-02-19 05:35:08'),
(11, 3, 'Kegiatan Disetujui - Dapat Dimulai', 'Kegiatan \"Valentino Michael Rizaldi Muda\" telah disetujui oleh Kepala Marthin Juan. Kegiatan dapat segera dimulai.', 'kegiatan', 3, 'kegiatan', 1, '2026-02-18 15:58:34', '2026-02-19 05:35:08'),
(12, 3, 'Kegiatan Disetujui Koordinator', 'Kegiatan \"gsdgsgss\" telah disetujui oleh Koordinator Juan XXX dan menunggu persetujuan PPK.', 'kegiatan', 4, 'kegiatan', 1, '2026-02-18 16:14:24', '2026-02-19 05:35:08'),
(13, 3, 'Kegiatan Disetujui PPK', 'Kegiatan \"gsdgsgss\" telah disetujui oleh PPK Texaz dan menunggu persetujuan Kepala.', 'kegiatan', 4, 'kegiatan', 1, '2026-02-18 16:15:59', '2026-02-19 05:35:08'),
(14, 3, 'Kegiatan Disetujui - Dapat Dimulai', 'Kegiatan \"gsdgsgss\" telah disetujui oleh Kepala Marthin Juan. Kegiatan dapat segera dimulai.', 'kegiatan', 4, 'kegiatan', 1, '2026-02-19 05:13:52', '2026-02-19 05:35:08'),
(15, 6, '📝 Draft Dokumen Baru', 'Asking Alexandria mengupload draft \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\". Silakan review.', 'permintaan_validasi', 4, 'kegiatan', 0, '2026-02-19 05:36:32', NULL),
(16, 6, '📄 Dokumen Final Diupload', 'Asking Alexandria mengupload dokumen final \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\". Menunggu permintaan validasi dari pelaksana.', 'kegiatan', 4, 'kegiatan', 0, '2026-02-19 05:38:39', NULL),
(17, 3, '✅ Draft Diterima Koordinator', 'Draft \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah direview oleh Juan XXX. Catatan: hdhdfdfh', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:39:18', NULL),
(18, 2, '📝 Draft Menunggu Review', 'Draft \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" sudah direview Koordinator. Silakan berikan feedback.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:39:18', NULL),
(19, 2, '📋 Draft Menunggu Review', 'Draft \"Laporan_Kegiatan_Tahun_2026 (1).docx\" dari kegiatan \"gsdgsgss\" telah direview Kesubag dan menunggu feedback Anda.', 'permintaan_validasi', 1, 'dokumen', 0, '2026-02-19 05:39:22', NULL),
(20, 3, '✅ Draft Disetujui Pimpinan', 'Draft \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah disetujui oleh Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:39:29', NULL),
(21, 6, '📄 Permintaan Validasi Dokumen', 'Pelaksana mengajukan dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" untuk divalidasi.', 'permintaan_validasi', 4, 'dokumen', 0, '2026-02-19 05:39:46', NULL),
(22, 3, '✅ Dokumen Valid (Koordinator)', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi oleh Juan XXX. Menunggu validasi Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:40:17', NULL),
(23, 2, '📋 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" sudah divalidasi Koordinator. Silakan validasi dan sahkan.', 'permintaan_validasi', 4, 'kegiatan', 0, '2026-02-19 05:40:17', NULL),
(24, 2, '📄 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" dari kegiatan \"gsdgsgss\" telah divalidasi Kesubag dan menunggu validasi akhir Anda.', 'permintaan_validasi', 2, 'dokumen', 0, '2026-02-19 05:40:22', NULL),
(25, 3, '🏆 Dokumen Disahkan!', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi dan disahkan oleh Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:40:27', NULL),
(26, 6, '📄 Dokumen Final Diupload', 'Asking Alexandria mengupload dokumen final \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\". Menunggu permintaan validasi dari pelaksana.', 'kegiatan', 4, 'kegiatan', 0, '2026-02-19 05:41:17', NULL),
(27, 6, '📄 Permintaan Validasi Dokumen', 'Pelaksana mengajukan dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" untuk divalidasi.', 'permintaan_validasi', 4, 'dokumen', 0, '2026-02-19 05:42:26', NULL),
(28, 3, '✅ Dokumen Valid (Koordinator)', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi oleh Juan XXX. Menunggu validasi Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:49:51', NULL),
(29, 2, '📋 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" sudah divalidasi Koordinator. Silakan validasi dan sahkan.', 'permintaan_validasi', 4, 'kegiatan', 0, '2026-02-19 05:49:52', NULL),
(30, 2, '📄 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" dari kegiatan \"gsdgsgss\" telah divalidasi Kesubag dan menunggu validasi akhir Anda.', 'permintaan_validasi', 3, 'dokumen', 0, '2026-02-19 05:49:56', NULL),
(31, 3, '🏆 Dokumen Disahkan!', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi dan disahkan oleh Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:50:00', NULL),
(32, 6, '📄 Dokumen Final Diupload', 'Asking Alexandria mengupload dokumen final \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\". Menunggu permintaan validasi dari pelaksana.', 'kegiatan', 4, 'kegiatan', 0, '2026-02-19 05:56:33', NULL),
(33, 6, '📄 Dokumen Final Diupload', 'Asking Alexandria mengupload dokumen final \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\". Menunggu permintaan validasi dari pelaksana.', 'kegiatan', 4, 'kegiatan', 0, '2026-02-19 05:56:49', NULL),
(34, 6, '📄 Dokumen Final Diupload', 'Asking Alexandria mengupload dokumen final \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\". Menunggu permintaan validasi dari pelaksana.', 'kegiatan', 4, 'kegiatan', 0, '2026-02-19 05:57:03', NULL),
(35, 6, '📄 Permintaan Validasi Dokumen', 'Pelaksana mengajukan dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" untuk divalidasi.', 'permintaan_validasi', 4, 'dokumen', 0, '2026-02-19 05:57:05', NULL),
(36, 6, '📄 Permintaan Validasi Dokumen', 'Pelaksana mengajukan dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" untuk divalidasi.', 'permintaan_validasi', 4, 'dokumen', 0, '2026-02-19 05:57:07', NULL),
(37, 6, '📄 Permintaan Validasi Dokumen', 'Pelaksana mengajukan dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" untuk divalidasi.', 'permintaan_validasi', 4, 'dokumen', 0, '2026-02-19 05:57:08', NULL),
(38, 3, '✅ Dokumen Valid (Koordinator)', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi oleh Juan XXX. Menunggu validasi Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:16', NULL),
(39, 2, '📋 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" sudah divalidasi Koordinator. Silakan validasi dan sahkan.', 'permintaan_validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:16', NULL),
(40, 3, '✅ Dokumen Valid (Koordinator)', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi oleh Juan XXX. Menunggu validasi Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:17', NULL),
(41, 2, '📋 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" sudah divalidasi Koordinator. Silakan validasi dan sahkan.', 'permintaan_validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:17', NULL),
(42, 3, '✅ Dokumen Valid (Koordinator)', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi oleh Juan XXX. Menunggu validasi Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:18', NULL),
(43, 2, '📋 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" sudah divalidasi Koordinator. Silakan validasi dan sahkan.', 'permintaan_validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:18', NULL),
(44, 2, '📄 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" dari kegiatan \"gsdgsgss\" telah divalidasi Kesubag dan menunggu validasi akhir Anda.', 'permintaan_validasi', 6, 'dokumen', 0, '2026-02-19 05:57:24', NULL),
(45, 2, '📄 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" dari kegiatan \"gsdgsgss\" telah divalidasi Kesubag dan menunggu validasi akhir Anda.', 'permintaan_validasi', 5, 'dokumen', 0, '2026-02-19 05:57:24', NULL),
(46, 2, '📄 Dokumen Menunggu Validasi Akhir', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" dari kegiatan \"gsdgsgss\" telah divalidasi Kesubag dan menunggu validasi akhir Anda.', 'permintaan_validasi', 4, 'dokumen', 0, '2026-02-19 05:57:24', NULL),
(47, 3, '🏆 Dokumen Disahkan!', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi dan disahkan oleh Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:27', NULL),
(48, 3, '🏆 Dokumen Disahkan!', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi dan disahkan oleh Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:28', NULL),
(49, 3, '🏆 Dokumen Disahkan!', 'Dokumen \"Laporan_Kegiatan_Tahun_2026 (1).docx\" untuk kegiatan \"gsdgsgss\" telah divalidasi dan disahkan oleh Pimpinan.', 'validasi', 4, 'kegiatan', 0, '2026-02-19 05:57:30', NULL);

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
(1, 1, 'user-8', '2026-02-17 17:12:25'),
(2, 1, 'user-7', '2026-02-17 17:12:25'),
(3, 1, 'user-6', '2026-02-17 17:12:25'),
(4, 1, 'mitra-240', '2026-02-17 17:12:25'),
(5, 1, 'mitra-2', '2026-02-17 17:12:25'),
(6, 1, 'mitra-3', '2026-02-17 17:12:25');

-- --------------------------------------------------------

--
-- Struktur dari tabel `progres_kegiatan`
--

CREATE TABLE `progres_kegiatan` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
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

INSERT INTO `progres_kegiatan` (`id`, `kegiatan_id`, `user_id`, `tanggal_update`, `capaian_output`, `ketepatan_waktu`, `kualitas_output`, `keterangan`, `created_at`) VALUES
(1, 4, 3, '2026-02-19', 0.00, 22.00, 10.00, 'fnfhmvhmv', '2026-02-19 05:40:36'),
(2, 4, 3, '2026-02-19', 20.00, 22.00, 20.00, 'gfdhhdghd', '2026-02-19 05:40:48');

-- --------------------------------------------------------

--
-- Struktur dari tabel `realisasi_anggaran`
--

CREATE TABLE `realisasi_anggaran` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal_realisasi` date NOT NULL,
  `jumlah` decimal(15,2) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `realisasi_anggaran`
--

INSERT INTO `realisasi_anggaran` (`id`, `kegiatan_id`, `user_id`, `tanggal_realisasi`, `jumlah`, `keterangan`, `created_at`) VALUES
(3, 2, 3, '2026-02-18', 7900000.00, 'kfhjfjhfhjfjhfjfjh\nlgjkgkhjfhjfjhfjfhjf', '2026-02-18 14:58:11'),
(4, 2, 3, '2026-02-18', 5067577.00, 'gdsgdsgsdg', '2026-02-18 15:18:22'),
(5, 4, 3, '2026-02-19', 5600000.00, 'gfdgdgdfgd', '2026-02-19 05:26:58'),
(6, 4, 3, '2026-02-19', 5160000.00, 'dsggsdg', '2026-02-19 05:58:27');

-- --------------------------------------------------------

--
-- Struktur dari tabel `realisasi_fisik`
--

CREATE TABLE `realisasi_fisik` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tanggal_realisasi` date NOT NULL,
  `persentase` decimal(5,2) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `satuan_output`
--

CREATE TABLE `satuan_output` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `deskripsi` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `jenis_validasi` enum('dokumen','kuantitas') DEFAULT 'dokumen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `satuan_output`
--

INSERT INTO `satuan_output` (`id`, `nama`, `deskripsi`, `is_active`, `created_at`, `updated_at`, `jenis_validasi`) VALUES
(1, 'Dokumen', 'Output berupa dokumen', 1, '2026-02-10 16:49:16', '2026-02-10 16:49:16', 'dokumen'),
(2, 'Publikasi', 'Output berupa publikasi', 1, '2026-02-10 16:49:16', '2026-02-10 16:49:16', 'dokumen'),
(3, 'Layanan', 'Output berupa layanan', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(4, 'Wilayah', 'Output berupa wilayah', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(5, 'Data', 'Output berupa data', 1, '2026-02-10 16:49:16', '2026-02-10 16:49:16', 'dokumen'),
(6, 'Peta', 'Output berupa peta', 1, '2026-02-10 16:49:16', '2026-02-10 16:49:16', 'dokumen'),
(7, 'Orang Kegiatan', 'Output berupa orang kegiatan', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(8, 'Responden', 'Output berupa responden', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(9, 'Orang Jam Pelajaran', 'Output berupa orang jam pelajaran', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(10, 'Orang Perjalanan', 'Output berupa orang perjalanan', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(11, 'Orang Bulan', 'Output berupa orang bulan', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(12, 'Buah', 'Output berupa buah', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(13, 'Tahun', 'Output berupa tahun', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(14, 'Unit', 'Output berupa unit', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(15, 'Lembar', 'Output berupa lembar', 1, '2026-02-10 16:49:16', '2026-02-10 16:49:16', 'dokumen'),
(16, 'Tabel', 'Output berupa tabel', 1, '2026-02-10 16:49:16', '2026-02-10 16:49:16', 'dokumen'),
(17, 'Orang Jam', 'Output berupa orang jam', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(18, 'Orang Hari', 'Output berupa orang hari', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(19, 'Set', 'Output berupa set', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(20, 'Paket', 'Output berupa paket', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas'),
(21, 'Orang', 'Output berupa orang', 1, '2026-02-10 16:49:16', '2026-02-10 18:01:43', 'kuantitas');

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
(4, 3, 3, '2026-02-18', 'hfhgdhgdhdhdhhg', '2026-02-18', 'selesai', '2026-02-18 14:59:13'),
(5, 3, 3, '2026-02-18', 'hfhjfjfjfjhfjhfjhfjfhjfjh', '2026-02-24', 'selesai', '2026-02-18 14:59:31'),
(6, 4, 3, '2026-02-18', 'vhjfjhfjhfjhfjhfjh', '2026-02-18', 'selesai', '2026-02-18 15:00:11'),
(7, 5, 3, '2026-02-18', 'jghjfhjfjhfjhfjhfjhfjh\n', '2026-02-25', 'selesai', '2026-02-18 15:01:22'),
(8, 6, 3, '2026-02-18', 'fjhfjhfjhfjhfjh', '2026-02-27', 'selesai', '2026-02-18 15:03:40'),
(9, 6, 3, '2026-02-18', 'fjhfjhfjhfjh', '2026-02-18', 'selesai', '2026-02-18 15:04:05'),
(10, 8, 3, '2026-02-19', 'fsbfhhgdsgs', '2026-02-20', 'selesai', '2026-02-19 05:30:55'),
(11, 8, 3, '2026-02-19', 'gfgggsg', '2026-02-23', 'selesai', '2026-02-19 05:31:07');

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
  `role` enum('admin','pimpinan','pelaksana','koordinator','ppk') NOT NULL DEFAULT 'pelaksana',
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
(2, 'kepala', 'kepala@gmail.com', 'Marthin Juan', '$2b$10$ZLldZZIUvrTwlMYVb5mVPOmfbXgw9uQNILPkFMBzlwBbOk.xkmPvC', 'pimpinan', 'aktif', NULL, '2026-01-06 06:34:24', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAEMAZADASIAAhEBAxEB/8QAHAAAAQUBAQEAAAAAAAAAAAAAAAEDBAUGAgcI/8QAUxAAAQMDAQQFBwYHDAoCAwAAAQACAwQFERIGITFBE1FhcYEHFCIykaGxI0JScsHRFTM2YnN0shYkNDVDU2OCkpPS4Rc3RFRVg5SiwvAms4Ti8f/EABsBAQADAQEBAQAAAAAAAAAAAAABAgMEBQYH/8QAMBEAAgEDAwMDAQcFAQAAAAAAAAECAxESBCExE0FRBRQyIjRCUmFxkbEVI4LB8IH/2gAMAwEAAhEDEQA/ANToRoT+lGnsXXc+SwGNCNKfx2Ix2JcjAY0o0p/T2JNKXGAzoyjQntKNIS4wGdOEmhP6UmlLjAZ0I0p/SjCXGAxpRpT+lGAmQwGNKNCf0pNKXGAzpRhPaf8A+LsU8p3iJ/8AZKjJIsqTfCI2nCTT2KQ6NzThzS3vGEmhTkR02hnT2JNKf0o0pcrgM6UmlP6UaUyGAxo7EaU/oQWpkMBjQjQntKXSmQwGNCNCe0o0JkMBnQjQntKNKnIYDOhGhPaUaUyIwGdKNPYntA5I0JkMBjSjSn9KNO5MhgxnSjQndCNKXGA1pCTQn9KTSpuMGM6UukJ3T2I0diXGAzpCNIT2lGlRcYDWkJNIT2jsRo7FORGAzpCC1PaOxGhLjAlaEaFX/hSubvfan456Xb0jrnXTfwS2P7TLuXH1oeTtvEsdCNKq+k2gcciGEdmkfek842gg9J9FHM3mAN/xVevDyVuvBa6EaFHoLnBW6mOBgmj9eOQ4x2jPFTg3UMjeOxaKaZoopjOhJoPUn9KTSVbInpjOhGhPaOxGjsTIdMZ0diNHYntHYjR2JcdMZ0diNCe0hOQ0z53YYNw4uPAI52JVJvZIi6ECMlwAGSdwAVibbIBnW3PUchSKWh6CQSPOp/AAcAqOquxtDSSb3Q3Q0z6djhIxocTkHOSpW/rK76PAJK5wFzOTbuenGmoKyOSwPGlwDgeTt6hy2hrna43aGniMasdyn6QgEt3hTk1wVlShP5IgC0wAek+Tv3BOR2yjHra3HtO5WHEDtXDmDGRuTqSYWnprsRTQUwH4lhB54TT7XTv9UOZ3FTRwx1rox4A3hFNruHQg+xVy2jDSYpDnHB3PxUF9PJH68bm94Wi6M8sHuSaH/wCSuqzXJhPRwlxsUcFBNOA4Yaz6TlJFpbjfOT3M/wA1aaXg4xuRpJO/cjqyZMdJTS3Kaa1SMGqN3SDmMYKjOgewZcxzR1kYV/JLDGMvl4cgVCfcM5aIQWn6RV4TkzGrp6S72KrSjQFPNSTwgiH9VNul1ZzFEM9TVqpM5XSiu5E0I0J/Sk0KcjPAZ0I0J7QjQlxgM6EaE9oRoU5DAZ0I0J7QjSouOmM6UaQntCNCnIYDOntRp7U8W9iAwJkRgMaAjR1J7QjSepMhgM6UaU9pRpTIdMZ0pNBT+ko0pcdMaotpaaWRxrKdkGB6Lm5dk9XBPybT2xpOhkkndHj4qgr6KKknDIqhs4xkuA4dijNgfI5rWtJLjhvavJsh7utD6Xa5oH7UUDzh1FLjrGn71IoaimuQe6llwGb3NeMOb96zNVb56UB0rNztwIOQptst14glE9PE2MObgiY4Dh1KHGNi1OvVnO0ldFlWWyirnh9RHrc3cHA6Sox2fo2elTvnp38nMlKtnxPiA1Ad43hcKilJcG0qcb7og2yqqPOZbdWkPnibrZKBjpGdvarMtKqblQ1M80VTRTiCZgLC7raVHbb72MH8MOaerGfsXXCurblVJx2auXuntRo7lW09ZcKF7WXMxzU7yGiojGCwnhqHUetXIaAcluR3raM1JbG8LT4GNO9PRUskwJbgNHMp3pIxwp2e1Oeduxjo246slQ5N8G8acL7sdaxrY2t0tGBg7l2MBoaAAB1Jnzv+hHtXJrHcomjxWeLOpTgiRhAJzu96j+dyA5DGpPPJD81iYsdSJKLhwxvXKZbVu+fGD3HC7FRFxw4eCjFk5xfc7RxXHnMP5x8Ehq2gejGT3lLMZR8j7QQCOSXCiitdjBjHtXQrB/Nn2qMZE9SPkeLByXJbu0kZB4hN+eD+aPtSGsB/kvepxZDnAZkopGSnoHYYd4GrCZk6eM6ZHvB7XKV511xk+KR1Q1+NUIdjrK0TfdGE4wfDIR1Hi4+1IWnrKll8R/2cf2iuD0ed0RH9dWyMXD8yNpHUjT2KQQOTceOVzpVrlMBnT2I0die0o0lMiMBnR2IDexPaD1I04S4wGdI6kaR1J3Sl096XGAwWo0p7CXSmQwGNKNKe0o0qbjAa0o0p3SjSlx0xktRoT2lGkpcdMZ0o0p7QjR3JcjAZ0o0p7QjR/wC4S4wGdKTT2p/QjQlyOmZMsHUrumqoqhrWtADmj1ccO5NU1FC4Bz3B5+j1KY1rWN0taGjqAwvLbOOjTadxivY99I4xeswh4B54OVzHeqWqwZyaeXGDne0+PJS8bj2hVVRZc5NPJ/Vd96lW4ZrOU47xLYMJjEjSHMdwc12QU5DTPmaXAgAdahW2Skp6BlFUP82nY4uIfuDieYPBOOqGzzx09LMJGU56aZ7Duz81vt+CjE6I2e7HXDSSDxCRIOG/mlVShHr2tdbqlrjgGJ3wU+2PfNa6WWT13wtLs9eFFrGdLZ6uOMtbO6IhpecD29yfsldTXC2xupjgRNEboyd7CBzXTR4NaUUpc8kzSjCc0rObQ7b2vZqvZRVsFXJI+MSAwsaQASRzcOorZytyd9OjOpLGCuy/0o0rF/6WbAeFHcv7tn+Ndx+VbZ57w11PXxg/OdEzHucVHUj5Oj+n6j8DNjpRpUe13agvVIKq31LZojuONxaeog7wVQ3ryhWexXWa21VPWvlh06jExhbvaHc3DkVLkkjGGmqTk4RjujTaEaFjWeVewve1gpLjlxwMxs/xp+4+Uqy2u41FDUUteZaeQxvLI2aSR1ZcDhR1I+TX2GovbBmr0I0LMXLyi2a1+aianrX+dUzKhvRxsOGuzgHLhv3Is/lEst7ukNughrIpZiQ10zGBuQCcZDjxwmavyR7KvjljsabSjT2Ji73KmstrnuNVrMMABcGAEnJAAGccysn/AKWNn/8AdLl/dx/41LmlyUp6SrVV4RubPT2I09iy1V5SbJSUtJUSU1eWVkZkYGxtyAHFu/Lutp4ZUX/Sxs//ALpcv7uP/Go6kfJdaDUNXUGbPT2I0rI0/lS2dnlDHsracE+vLE0tH9lxPuWup54aunZUU8rZYpBlj2HIcFKknwZVdNUpfONgwjSnNKNKtcxxG8I0pzSjBS4xGtPYjTjkncJcFLjEax2Ix2JzCMBLjEb09iTSncI0pcYjWlGnsTuEYS4xGtKNKd0hGkJcjEa0owndIRpCXGI1hGE7pCNCXGI1hGE5pRpS4wG8IwOpO6UaexLk4jWhJpT2lJo7EuRiUMNICQ95wPo9amcly1wdwKUkAZJAHavOPPilFEO4ukjbHNE8gg4PUmhd2iP04jrxyO5d1dXG+OSEAkEbnDrVS9XSujkq1HGX0sKmunqYOhm0vAdkEt3hO2e5T0L3U8FNHMZ3ABrjjf8AcobuabbI+GRssbtL2EFp6itUlY54VZRnlc3M9K8ub0ce7G/TwymXRhhb6Qdvw4NOcHqWVrdpLlPF0T6jo2u3Ho26SfFRaC71lrMhpnt+U9YPGrf196r07noS1dHLa9jYTVVqhE/TVbCYMtkiPHOOGOazGytYaS+Rx6sR1OY3Dt+b71UTSumkfNK4ukecuceZT1sLm3Wjc3iJ2Y9q1jHEwepzqxaVtz1HSVgfK7BF+5+kqDGzpRVBgfpGrSWPOM9WQF6AeJWD8rv5L0v6639h6S+J9doftEP1PMNnvyktn65F+2Fs/K/TRxXK31DWgPlie15A46SMZ9pWIss8VLfKCpndoihqY3vdjOGhwJPsWo8ou0NBtLcqJlpe6oZDGRqEbm5c4jcAQDyHJYr4s+iqxk9VTklskxjyZ3Cak2vgpmvIiq2ujkbyOGkg+0e8q58sMMbKy2StjaJHskDnAb3YLcZPPiVI8m+xdbR17b5conU+hpEEThh5JGC4jkME7uO9NeWP8fafqS/Fqt9w43OE/UIuHjf9mZfYGKObbW3MkY17dbjhwyMhjiPetLtzTQv8ptojdCwsmEHSNLRh/wAo4b+vcMLOeT38ubb9Z/7DlqNt/wDWlY+6n/8AucoXxNa9/d/4v/ZN8rdLA2x0MzYmNkZP0bXBuCG6SdPduC8vt9WaC5U1Y0ZNPM2QAc8EH7F6t5Xvyco/1sfsOXkckbonBrxgkB3gQCPcQk/kW9N30yT/ADPVvKtdYxs9Q0kLyfPX9KCOBY0Z+Lm+xeW0TQ+ugY4Za6RoIPMZVjdLrVX2lpBJ6tso2xHtAfpz/wBzfYq+g/jGm/St+IUSd3c30tHo0cO+5675UaeBmx4LYY2mOdgZhoGkb9w6l4/S/wALh/SN+K9k8qn5Gu/WI/tXjdL/AAuH9I34qZ/I5vS/sz/VnovlgpII57ZVMja2aUSMe8De4N04z7T7VE8lm0EtNdHWWZ5dT1ILogfmvAzu7xnxAVj5ZPxdo+tN/wCCwezNR5rtRbJs4DaqPJ7C4A+5G7TKaekqugxl4f8ALse+3CuprXQy1tXIIoIW6nOP/vFeeDyk3271ssWz1kjlZG0vxK1z36es6SAO7f4pPK9dZA+itDHEMLTPIAfW3kN+Dkx5Hv4wuZ/oWfEq7k3KyOOhpYQ0zrzV32RoNj/KDDtDVfg+uhbS1pBMek+hJ1gZ3g9istsdq4tlaCOQRCepqCRDGTgbuJPYMj2rxNlVLQ3cVcDiySGfW0jkQVs/KzK6e5WydpJp5KXVGesl2T7i1QpuxtU9PpLUwSX0u+36EtvlMv8ABbBW1dlp+hqA4U07Q9rNQ3b95zw6wtxsreH3/Z2luUzY2yy6hI2MENa4OI5nsz4rBbB1VLtDs/WbI3AgEtMlK7G9vM47Qd/cStnsRs9XbM2iahrZoZS6cyMMRJAaQBzA5hTFs59ZTowjKKjjJP8AdGh0o0rpC0ueTY50o05K6QlxY50o09i6ylDSeR9iXFjjSjT2JzQ7qXQj3bz4BRcYjOEmE/0Y4knuXQGDuACZFsSPpPUjR2KTglGCmQxRGwgNLjgBSfSSAHqTIYjYgHN4HcjoG/TPsToaUaT1KLsnFDJhOdxBXJYRxBUjSUnDiQmTIcUZAvxwOEw95PFxKbnqo4I9ch3cABxJ6gm43O6PVIMOcdRHV2LmSPmJTFedxTDylE7JHPaD6TDhzeYVXWVVRQ1AJd0sL+AdxHZlXRi93YmOTD+C6bK2aMSMOWuTM7yyJzhuIGVojJ8jNX+K8UyJRoGTk4Szv6YtjZjJ9IpsQuHEhXLJJLcUHWVbbO0xqr9SMHBj+kd3N3qsYzeGtBc5xwABvJW+2Xsb7ZA6oqRipmAy3+bb1d/WpOvSUXVqJ9kX3NYTyu/kvS/rrf2HrdrB+V38mKX9db+w9Uk9j7HRfaIfqeXWKNk20FuilY18b6qJrmOGQ4FwyCOa1flQtNFaLvRS2+mjpRNES5sLdLctPEAbhx5LLbPflJbP1yL9sLceWL+GWs8+jk+LVkuGe/Vk1q6aT5TOPJ9tzWi5QWa6VDp4JzohllOXMdyGeJB4b+G5O+WT8fafqS/FqwuzwJ2jtgb63ncWP7YW68seentP1Jfi1Te8TCVKENdBxVrp/wAGZ8nn5c236z/2HLT7b/60rH3U/wD9zlmPJ5+XNt+s/wDYctPtv/rSsfdT/wD3ORfEmv8Aa/8AF/7LPyvfk5R/rY/YcsHtdbjSxWWtazEdZbITq63taGn3afat55Xvyco/1sfsOULaayVN28m1hmo6eSonpoYSI4mF7i1zADgDfxDVMldsw0lTp0qbfDbRlbbb9Hk8vVxc3fJPDCxx6g4E/EexZ+3/AMY036VvxC9KvNrfZ/I7HSysLJnGOWRpGCHOeDgjrAIHgvNbf/GNN+lb8QqNWsd+nqdSM5fm/wCEexeVT8jXfrEf2rxql/hcP6RvxXsvlU/I136xH9q8apf4XD+kb8VafJz+mfZn+rPS/LJ+LtH1pv8AwXnVqBN3ow31jUMx36gvRvLL+LtH1pv/AAWI2OpXVm19ria3VpqGyEdjTqPuCiXyLaJ46NN+H/LLjyqSF+2Lmk7o6djR3bz9qh7FP2mZU1X7momySFjemDtHDJx65HuVl5WacxbVRTb8TUrTntBI+wKd5Hf4xuX6JnxKfeGajoVJJPZclE/ydbXPe57rTvccn98Rf4lsdtdnamp8n9ulfERWWqnYZYwQ4gaAH7x1EA56gVp9pNq6DZaKCSuZPJ5w4tY2FoJ3cSckdYUz8K2yalpXT1UEbLhGDDHO9rTKHAbgCd/Ebh1q6UeDzZ6zUTcKjjsntbv5Pnu3V9Ra7hBXUrtM0Dw9p7RyPZyX0PaLlFd7VTXCnyI6hgcAeR5jwOR4LwzbHZ9+zl/mpACad/ylO7rYeXhw8F6B5Iqx01irKRziRTz6m5PAOHD2tJ8VWDs7HZ6jCNWiq0f+TN9jelQhbHz4b/8A0JdR7PYkQhAup3WjW7rKRCAXU7rRqd9JIhCbsXU7rKNTvpFJyRwTYC6nfSKCT1n2pMoTYC5PWUaj1n2oDSeCXQexRsBMu+kUmXdZ9q6DSjR3KdhY5z2oXQDwdwRqeOZHggsedQ0xZJ01RIZpuRPBvcE+Xg8U1q6t6jz1ZYejhHSTHg0cu0rGzZ8fchTzmK+6mHjhjh1pb05vm7BzL93sUaW3VWvpNTXuJyd/NNz09dO/XKwuPeN3vVrGixuncetUnoyx5yBhw8V3XzhrOjBy53HsCjwU1XDq0gR6hgkkJ6OmZGdTnF7+sqyKSxUrnEEZjbrducfcFeWnZiuucbZyW09O7g9+8nuCd2VtcNzrpX1UfSRQNBDeRcTz69y3oDQAGgADgByU3seno9Eqq6lTgrLVs/QWn0omGSbnLJvd4dSs0eKFFz24U4wVoqwLzbyvXan81pLOA41HSCpcceiG4c0b+vOfYvSVDq7Pa7hKJq220lTIG6Q+aBryB1ZI4byqvdHVpqkaVRTkr2PnyzVEVJfKCpndoihqY3vdjOGhwJOO5aTyjbS2/aK50ptsjpYaeIgvLC3USc7gd/ABesfuY2f/AOBW3/pI/uTsFis9K8Pp7VRQuG/VHTsafcFXE9KXqFOVRVMXdHmnk12QqpLnFe66B0VPBl0DZG4MjiMAgdQ4568K+8qtknuFnp7jTsdI6hc7pGj+bdjJ8CB4ErdoVrbWOOWsnKuq3jsfOlhuz7Fe6a5siEpgcToJxqBBBGe4la2hrarb7yhUVwjpPN4aPQ5+/UGNY4u3nA3knAXodXsZs3XTmae005eTklgLM9+kjKs6K30dtg6CipYqaL6MTA0f5qqidVbX05fVGP1Wtc8/8r1yp/M6K1guNQZPODu3BmHN49efgtNsHdae6bJUfQBwNIxtNIHD5zWjOOzBBVvWWi2XGRsldbqWqe0aWumha8gdWSE5SUNJQQmGipoaaMnUWQxhjc9eArd7nHKtCWnVJLdGL8q13gprCy1ua8z1bg9pA9FoaQTn3LyOnl6CpimIz0bw7HXg5X0bWWq3XEsNdQU1UWZ0meFr9OeOMjco37mdn/8AgVt/6SP7lDTbOrS66FClhizB+ULa+3XXZmkpaUS9JWaagBzcaGAuG/tyCN3UvNqdwZURvccBrwSfFfREmz9lmbG2Wz0EgibojDqZh0NznA3bhknd2rj9zGz/APwO2/8ASR/cocWy1DX0qMMIxZ5b5SNqLdtHU0MNskdNFTNeTJoLdTnY3AHB3afetJ5MtkZ7Yx95uETo55maIInjBaw8SRyJ3Y7O9bOnsdoo5RLTWqigkHB0dOxp9oCnKbb3ZhU1a6Ko0lZGS8omzEu0NmZLSM1VtGS6NvORp9ZvfuBHd2rz/wAnu0VLszeqkXMvhhmj0PdoJLHA7sgb+sL21VVz2Xsd3l6WutkEsnOTGlx7yMEo1vdEUNUo0nRqK8X45POtpbh/pE2mobbZmyPpqcHMzmEAZI1OI5AADGeasvKxRimtNnnpxoZSyGFhb83LQR+wt7brVb7TD0Nvo4aZh4iNuM954nxRc7TQXmk81uFO2oh1BwY4kYI4HI3pYlauMakMV9Mf335PJNrdqbZtPsvbnPJF4p5NMjdJxpx6RzwwSGnHJaryTW2aksNTWysLRVyjo8/Oa0Yz7SfYtLVbJ2CtmjmqbVTvkjADTpxuHDOOPjlWzGMiY2ONoa1ow1rRgAdyJb3FXVQlR6VNW/7sKmaqrp6GmfU1UzIYWcXvOAo92u9NZ6XppyXPfkRRN9aQ9nZ28AsYIrhtZWedVkpio2H0Qz1R2M6z1uPgtLpK7OejQc93sjSt2z2ec/S64ti7ZWloVvS1VNWx9JSVENQz6UUgcPcs4LBaRF0YoYw3t3k9+eKp6/Yil1ecWxz6GcbxJTHQfEcCsVXgbS00H8X+5v8AvS47F5rDtLf7DIIrrUvMIOG1D2dJGfr/ADm+3C09NtY8sY+pohLG8ZEtI8PGOvBwfYStU78MylpKkd0rmix2JcKHR3e3150U1WxzwMmN3ovHe04IUxNzmcWtmGEodj5oSeKPFQQd9IfotR0n5gXCEJO+k/MCOkP0B7VwhAd9Jn5oSa/zQuUIDrpHdQR0jlyhAeeWm0z3uad0VQ7zCA6TVPJa1554HV2pJ5LTR1H4OtMM17uB/koPRib2uI+9d22x3zaSCNtdLJbLQwYjgjbodIOxvIfnOyVtbXaKCy0oprfTNgZ84je5563HiVd2iznjoqEeImJns12t1JHJXwtcSMudAS5rOw/eoBkBGQcheo43YUGey2ypcXTUMLnH5wbg+5UucFf0tSd4Ox5ySu6OiqrlP0FHEZHHifmt7zyW/bs5ZmO1C3xHsdkj2KfFFHCzRDGyNn0WNwFORnT9Kd7zZDs9qjtFCKdjtb3HVI/GNTlP8EIVT2oQUIqKE48kYSoQuCEIS4BCEIAQhCXAI8EIS4BCEJcAhCEAIQhNwCEITcAhCE3AIQhACq73e4bRBjAkqJATHFnG76TupoRe71HaqfS3S+qeMxsccBo5ud1NHvWXoaF9fO6vuBdIJHB4EgwZTyc4cmjk1TdRV2dVChn9UuDikt9Re6p1xub3PjfwBGkyDqA+azs4nmr91QyEtijjc9wb6MbBjA5dwShyaZ/GTu2AftFczk6ktzpqStHbsd9PVnhTMaPzpQfglZVTNljjmgDRI7S17X5GcE8PBOYTNRukpuycfsuVpU0kcsajbsPz00NVGWTMDgRg7uSytZstWWl7qmxSgMzqfSP/ABbu76J7VrgV0HLCM5Rex1xqSiYmludJdH+a1MHQ1ce80849Jp62nn3hW0FxuNDgU1Y50Y/kqj5RvgeI9pUu87OUN5i+UZombvZKw6XNPYRwWXmqq6xVApr1mWA7o60D2B45d67adVT2fJ1J06u0kbOm2sp/UuED6V384304z4jePEK8iljnjbLDIySN3BzHBwPiF5/qDgHNILXDIIOQQuYZZ6CbpqKd1M/noPoO728CtXG5z1PT096bPRULN27a6J5EV1Y2ndnAnZno3d/Nvju7Vo2ua5oc0hzSMgg5BWbTXJ5lSlKm7SQqEIUGYIQhNwCEITckEIQqEghCEFgQhCCwIQhACEIS4sCEIS7FgQhCXYsCEIS4sCEIS4sCEIS4sCEIS4sCEIS4sCEIS4sCEIU3FgUC73VlrpgQ0SVEpLYos+seZPU0cSU9cK+K20jqmbJAIDGD1pHHg0dpWGkNTeKmplkkY6TBa8g5aHDhEPzQePWrLyzooUHUe/A7TU77jUOrKp5lY52oucPxzhzx9AcgrjOeSwhuu0sknRNicwglv4xjRkdWB2Jtv7paumlqDUtbHFjVqqHc8Y3DvWcoOTu2epij0HeOR8U0JomXAa5o25hPrvA4OHX3rA/gW8TUD6yWsgDGu0luHOOfHvTcljqI6aGV9wGJS4boRhunt7UjCKfJnOnGStc9Gfcrez1q+lGP6Zv3qDV360jocV8JLZmuIaSd3PgFj37LPZU0kTqypcaljHYDAD6XEDuTkmysMV6NC6qq3sEgBJfg6DjDtw7QtXjbk54UaSfJrjtXY28bg0nsY4/Ym3bZWNvCqe7uiKyTNmKZ7K0ubUONOBuMvPO/3b13Lsxb47LFWdDIXOf6RMp9U50nHsWGFI6sKZpjt1ZhMxmZyx3GTo9ze8KdUGhu8THMfHUwSxkBzd4O/wD93LD7UbOUltsENfRxdDNG5vTEPJ1ZHf1rXWe2stVpoYGkl74y+Q5yC9wbnHYk4QUVKJGMY2cTOVdurNm5DJRh1RQE5fTcSwdbPuUqCqgrads9PI2SN3McuwjkVopg2VhY8ZBWcrtm2iY1NFK6mnO8viHrfWbwK0p1trSOqnUFdv4p+2Xets0g82d0lP8AOpnn0T9U/NPuVM6uq6D0bnT+gP8AaYBln9YcQpTZWTRiSJ7XsO8Oacgrq2aNpQhWjaSuej2q70l3pzLTPw5v4yJ258Z6iPt4KcvLKeqnoaplVSSmKZm4OxkOH0XDmFvbFtBTXmLTgQ1UbcyQE7x2jrH/AKVlKFuDw9VpJUXdcFshCFlc4gQhCXFgQhCqSCEIQAhCEAIQhACEIQBlCErW6j2IBEJXDS7HsSIAQunMLce9coAQhCAEIQgBCEIAQhCAEIQgBcySMhjdJI4MYwFznE7gBxK6VDtJBc67oKKlpTLTP9KY6w0OI9Vpz83mevgpXJaKTdjGbYbVPe4TRnTI9pFJGeMTDuMhH0ncuoeK52HefwAcuJPTvO871ZReSzz2qfWXy7ySyyHLmUzA0DsBdnd4KY2z0VhnfQ0LHthaQ703aiSRvOVpUlHCyPVo1KbeECFDHC2/l7mAxYdnq1ad6LaGxWisjkbwy7Gni0j0VQz229OrJnNNU4GVxa4S4GMnHPqTYsF3eCDFLjmHVDd/vWKgvJ19JPe5p6YiPZ2SKQelG10bx2k/5hQZ5oja6emdKwODXRl2sYBDmnPiAqYbLXA/7OB3zBdDZKuxjo4R2F/+SnGK7joQfMi/rLxSuqbbUdPCHQsa5w6UcTuI8N5TVfd6D8PGdlZE6PLIyQ7PojB1e0YVONkqwf7uPF33LpuydSP5SIDsDvuUvDyZx0tFP5E0XugY+ud51GfOQfRAO45x1fR3pJL7bDZmURqgdLwNzTnSDkH4KMNk5fnVLB/yiftSjZQjjWt8IP8A9lX+2u5v06XkTaS+0Fx2XkpIZi6pIZ6IYeXatNbrrSXW20s1JKZGxfJPJGMODRkLOfuViIw+sdg8dMYH2q+tdop7HaoaendI5r5XSOdIQTktxyA5AJKUHGyMakIJrEmlybLkjnKpc66VF1rGUdXExlNFG4QzR6mvznO8bxwVIQcnZFJSjTjlJ2SLCWKOX1hxVFV7PMZIZ6CQ0kp4mMZY7vb9ykR3wtnZT19I+mkc7S17TrjcewhWm9afXSe5rTnGccoO6MnJWVFGdFygMQ4CeP0oz38wpMNQ+KSOqpZ9EjDqjljIOPvHYr+SFkgORx47s5VFWbPmFzpbdJ5q87yzjE/vHJdEKye0jfO6xluj0DZ3aKK9QGOQNirYh8pGDucPpN7PgrpeLwXGoo66MP1UNdGdUbs7ndx5g8wvUtnr9FfKMuw2KpiwJos8D1jsKrUhbdHiarTdN5R4/gtkIQsTiBJuSowoJEwEuR1oRhLgEIQouAQhCXAIQhLgF0JCNx3hcnghoJ3AKUwOuAe3Ld5HBIxpBy4YXLnNgjdK87mjO5DJG1MQfGTg9auVOnSDGBvTfgggjcUKjZYEISYS4FQgbkJcAhJhLhLgEJMIwlwKhAQlwCEZRlRcAsxfPRuru1jStOs3tE0i4Rv5GIfEo+Dq0j/ulaCug7KaXTXY7lQ9do4qqyWB8UcULZHyajvdjACivula3OKen8S4ru7RxSWypkkja50cTixxG9pxxCjUWzFsmooJJY3udJG1zsyHiQpvFK7JWEVeRy/aCuj3GOkB7S771GftTXNO6SlHh/mrRuydmH+y+1zvvTo2WtG7FGzxJ+9FUpjq0F2KOn2xrnVbI3spZGukY04BBwSB19q2ngPYsjLb6Wm2otccFNGxp1OcAOJAOCtWHdiVMXZpGVXHZxHAGni1vsTNccRx/X+xOByj1x+Sj+ufgs0ZRW5Fc72KJayTd7weqOFvuJUkqNZhquF8f1Pib/2ldmm+Zh6pto5lVcmdJcqFnXVNPsyVfcyqSobq2goW8dLnvPgP81eD1h3rTWO80jm9BjbRr9SkZU3R9RXT00sMkME/RCCUYzgA7nDhxU223NlxbKzoXwywkCRjt+Ce3mmLUNVklmI/H1Ur/fj7E1s23VDWVGN8tS4DubuCmrSjGkpdzXTaypW1lSk/jE1FtsluvNtq6WvpmzRF4wDuLDji08isvcLTeNg69lygldVW+I4bUnixp4slA+afpfBaWgus1vjeyKKN4e7US47+pSqjaCpmAEEccLcekJBq1H7lyR1KhszmratQqyVy6t1cy5W6CtiY9jJmag17SCPapKqKXaGkk0x1Luhkx6TiMMB71bNcHtDmnUDvBHAopxlujBTjLdBhGEqRQahhCEqARCEIBUiEIBUJDuGTuHWdyr6/aC0WtwbXXGngcRkNL8n2BSrlHKK5ZYpxj+RGOpUdNtbs/VydHDd6Yu6i7Gfan/3QWYtkLbtSHowS75UblKTRXqQfcl10rTojyQXHIA54RQyAOkZnOHZI6s/YsfLtnRGU6amKXgRo6Q5HWBjKsLVeBcpGtpaylcWjLw6RwcBnmCFfF8lVVpvZM1T3AbsZKb4quuV/tdpa01tbGxzx6LQdTnduAq9u3Oz7ycVpGBnDoyM9io7sOtTjs2aFIse/yhU8sb/M7fO6QeqXkafHBVa7b26MfpfHA09RYfvVbnPPX0Y97noaMrFUXlDj0kV1JvHB0J494Kn023NunO+nqGtHF2AQFDdi8dbQlwzTZRwUNl2t74myeewta/hreAVSVe3VugmdFFFLOGHBe0gA9ym5pPUUoK7kafKMrLxbe21xAfT1EYPE4Bx701Jt/RtcQyjlLeRLgCVFzP3tC3yNblGVmodt6Cpgc+GmqHPZxYQGj2ncmpNssNHycMZPLUXfBVc0iXq6K7mqyjKxc2175HejLoA+g3d709Btg5rCHvjl6i4Yd7lXqrwVWsot2ua7KotpW76Z+PpNPuVdLtdK9vybomEccNJKZkvjrlE2CbQXNdqa5owerHvCsppnTpdXSdaKTGkcOAQlVj6UhXl2LLWkcoSrG2/xbTfom/BVt4aDaKwcuhKsbUc2ukP9C34KlX4mdX4k1vBONTbeCcHELnRxszdaP/lttxuwyRXoPaqK47trbb9WRXQK6n8UdTWyHge1MVpzHH9b7F2HJqqIIj+sfgqorFfUMKBALhbpq10ENPUxVcokILyx7cDGM7wp5SLWE3B3RerShWg4TV0yopmTz31s8lJLAyOBw9PBGokcCOPBWc8nQ08srtwYxx9ycTdTA2qpZad5cGStLXFpwcFWnUc5ZMihQhQgqcOERadnmeyVG54wW03Su8cuK4sEJhslK13rPZrJ6y45TdXb7nLQvoo7mJoXM6MCoj3sbwwHN7OtWTdFNA0HcyJgz3ALatVU4pI4dHpJaadWpN/JlHU1YdcpGl+lgfpyDwUuaKep1yUpMjYWZf6XBZqlmFXP0z3sLHykaNeHHIJBx1JoXaakdNBFO5jH+i9od6wXLLTt7o+PrU5ycqrezbNDFdzgtnJfGRjcN6cnuNzo4tFvq5Y6d4Dy3r7M8lmqWfzqbohIG7s7z1KXDWwUt2ENZUytpx65bvOO5Oi4vYxhCvg5XPXpL1ao85uNM4ji1kgefYMlRztLbckN85eRyFLJ8SAFnZqupjjAfAYCDvkjb0jMeG8KTFVxVDCYZmyAcdJ4d45LJ1PyPd67Lg7Qxb9FBWO6jhgB9rspp+0M3zLYf69Q0fAFVhfk5XJeeCr1WQ6svJYnaGsI9G3Qt+tUE/8AimXX+5ne2KjYOohzvfkKCXHC5L93FOpIo6svJO/D126qL+7f/iUOsul/qWFsNwgpM84oCT7SU0X7lwXqVUkUlUk1a5S11julxOazaComzydnA8MqsGyD5HvxXEOacEviO/xzvWqL+1cF+eKuq013OeST5Mq/Y2oxurIXd7CmDshXAgB9O7xP3LXly5DwHZdwCuq8ymKM5UWKrDg6kgIcAGktlAcMdRI4dyZFoqgHdNSzGV7S1rmyNJGfpEcfitQ6RvAagOwLnpW5GrJx3ZWnXl3IxSZjKplbJCxrrY+J7cekGuJ7lCIqI9zmyN7wQvQREZGTStdhsfDPNRjJngdyKtbsZOJjqW6VNGCI3gtcclruGVOdtRVPon00lLSPa4EBzmek3xV69sT/AF4o3Z62gqHUUlNG0TR07GPY9pBa3GN6nOEnuiYQTkl5M02qkA9bKejulZDE+KKd7GSDD2tO5ytWWynrJqmSRrg5smkFrsbsBcv2diJ9Cd7ewjK0c6fDJq0owm4kD8NVha1rntLWjGC0Hcnaiupy9pieQcem5jMNce48EyLTO58bWvYTI0uAzjC5ktFfHv6HWOtpyrY07lKlHF2kiXJcdYa1rIm4+cB6yG3SSmmY6SIGMHJDeY71Vvppo/xkL297SuTI8t0F5IHLPBOlFmXSV7ltUXzpJnmASRQu4RufqI7M813LWQRQtfHVNeT80AghUuQjd1J0Yol0ostorv0cjX4Di0g4dvB71YS7U9LKHtpoIsDBDG8VmUEKHQg+QqaWyNBNczM0VBMbQTp0tcM+xd0F1a2vh9LcXgFZvGDwT1LT1NVUNZSxOkkByA0Z4J0IotRp41FJHp/NC5p46t8EZfSTBxaNWRgApzzeq/mmt73/AHLDBn6AtRTstyFdhm01Y/oXKbZzm0Uf6FvwUKuD3tNFKWNFQ0tc6MF5YMccKVRGKmpIqZtROREwNBFLvOP6yidGTiZVNVScbJlk3gnGqB0+7c+qPdG1v2lcGeUj0POvGRg+xZrTTOR6iJWXj0drbYevV8FbgnCbt1phudyfV1kb3mmaGxky7w4787uxXBs9D/MvP/Of961lCySN/eRxSsVwO5NVG8s48SrX8FUTf5F3968/auXWyj5wf97vvVVBELVpdioR2KxdaqQH0WyM7WyuPxymnWxvzKiVv1gHfcrYGq1sO6ISVOvoZ2+rLG/6zS34ZTToqlnGAO+o8H3JhI0WqpPuIqraaq81sU+Dh0uIm+KsukwfTY9h/OYVlNs6xr5qaka8ENBkcAefAKYQeW5hrdRGOnk4so7c/wDfUMIji0k4LujBd7UVFXIypkaGw4a4gZiblFtie6vhcI3lodkkNO7cpD7LdKmqkdFQTOa52QcYBXS5RvufLdSXR2fchirl1D0YRv5RBSLjI+CsfEwRloxvdGCVLi2TvDyMwxxjj6UgVjVbIV1XVOm6aCNruRJJ9yq6sE+SYym6bNkXkHio89NTzuDnxjWOD27nDxC6Lua5L15SuXbuNaauE/JzNqGfRm3OHc4faCuW18eoMmDoJDwbIMZ7jwKcL008te0se0OaeIIyCrL8zNtrgfL02ZFDMDoR+9pTH/Rv9Jh8OXgufPNHo1MfQnk7OWHx5eKY+CmZLLlyXJsv5jmuC9EirkOl461w56aL1yXq1ijkdl/auS9NSSho9I45ZXOvIyOClIq5DrnpYo3zuGlri3OC4Dgo+sE7nA9gKtqBtRTQyh8BHo62ZONRxwVkmI7sfc2kp3R0Z3GocdDeOcbz4blAucL2zmUNa2MkNGOtZavulRX1ZncXRg7mxh3qDG8BaiOoiuNjZVyyDWwaSG7mh3V7FtOk4pM0lZogP1aDowXY3Z4ZUaYHoCJTV6cAnSIj1dykiRhOBIwnscE3WD96S7t+n7QqRumKFTGS2GKdxb0ph6V2ZPT1xNODjseE6HvDtRaCeGeiI+BKbo3saJ9T2tJlO4uA5BSwQ4ZaQQeYOVab34Nq1WPUf0or4nhlRC4PjfoY5oa0PyeHW0cFINY0etG4DrLm/aUxTZ8+j+rL+0FYe1TNq/BbUzjkroiT1EcsIaNZ9NuRpO8Z3qPTwUcpmbLHG4B+GB3IY5KXWRsNK9xY0loznATVNDHJ0wcHECQgDUQAO5SmsSF03Re3caksdDL6gew/mOz8VXzWZjZeiiqsuzpw9hAz1ZxhXRo4/mktPcPswVFkjc2qEZOT0rMHURvLSc81aEnfkzp0oTb3Kea010OSYC8Dmw5UVzHxnD2OaRyIwtS9tTkF41AHlu+G9Mz1EhnAkDOjDgDG9uSRjfuKvGq2VjQlJ/SZrK9Q2EsgttoFbMzFRVDIyN7Wch4rO26zUF2ucMMMWlxkBfjdpA3nI7l6WWtYNLRhoGAOocklUurI6dHS3cmR5OKr62obTRasZe46WN+kfuU+d7Y2ue8hrGjLnHkFl5K01daZ35DBujb1N+8qaauejJ2J1JBSVbXec1rI2xPJc/WA+R+N/HgAn/NbW31bo7+8b9yZgs9xZFk08Y1Euw6QAjJJ3jkU55pXNG+lacdUwV//AEqhHR0Q9W6n+0z7k0Y2E/J3Jzt/9GfsXZbUN9elk/qkOTEz2BjjJSS7gT6UQVkC9sMZbbOlc7WZ5HP1YxkZwPgp5TdFF0Nvpog3GmJowOvG/wB6h3C+W63EsnqdUo4wxDW/PcOHiuRu7bJclFXZNdvK4IJCzFXtXWS5FJSxU45PmOt39kblU1FXW1Y/fVbPL+aH6G+xuFGSRyz1kI7Lc19XcqGkP74q4Yz9HWC72cVWzbSUYJEEVRUfVj0j/uws4xjIvUY1v1Rhdula0Zc7Heo6ng5payT4RbS3yqePkqSGPqMry73DHxUd1ZcJjl1YIgeUMTQP+7JUZrk40qrqyM3XqPlnToTKflqiomB4h8px7F1FSUkOdFNE3PPSDlIHLtrutZOUnyyuTfJIaQ3cMAdm5dhxPE5TAcuHVTY5mxODsuGQcHB8VTkumTQ5dtcmGuCcaVVmiZQN2hqKupENDQ9I93AF28pmPagh2mopsDOCWH7Cs1FLI54MAkc4HLTECSPYpEVuulU75K21shP9A4Z8SF6HRgcS6r4L6faiFrsQQOeOt50rul2hpqglsw6BwGck5B8VVw7JbRz4LbRO0fnlrftUtmwG0khwaanZ9eoCo4Ukt2XjCs3wSo79QSyFnSlna4YCakvPSQ1ElNAJYocdI57wM5IG4cSN4VnV7DXa4UdLEWUFE+nLx8m8uDmnBHLiOsphnkurC4GS7U4+rC4n4qq6K5Zs9PVvaxnxfXxOzDA2NvNmolp8OXgpbNpIHD5SF7T2EHKv4/JbD/K3iXH9HCB8SpMfkxtLWYlrqyQ9Y0tR1KBC0dYyL7tWS0r6yNrY4GPDDggkE8NyZ/DdQ9pYHsyfnad63bfJps6MFxr3Hr84xn3J5vk72ZaN9LUP+tUE/Yo61Gxd6Gb7nnjbnPgtmDZmHi14+5MS1Usp9N508mg4AXqLNhtmWDBtTH/XkeftTjdjNmmOy2y02e3UftRaikuw/p8/J5hHb5pLVPchIwRwact1ekQTjO7gM9aZN2qvNnUzqxxhOMsc/OMcF64zZiwxg6bRSDIwfQ4jtTwsdobwtND/ANMz7k91Dwaew8M8dprhSQslE9PHO50ZbG7pMaHcjjmo761742xOnJY31WB24dwXtgs1qad1qoR/+Mz7k423UDNzaClb3QN+5Pdx8EvQt8yPCulZnJO7ng709+EZGxyQxzO6F53NcdRAz1r3EUVIOFHTj/kt+5dNp6dvq08I7ox9ye7j+Eewt3PAzK3rPsKciqnQAvimkjeCMAA4K97a1rBhjGtHUGgJe3A9ie8Xgn2C7s8FjuVTBL0rJX6t49JuePFLHdqyOTpBUSE8w7JB8F7xgA50tB7kvgPYo93H8JZ6FPmR4UbxWztex1Q0N0kkFmMjqG7inotoH09O8dBrmc8uychq9vOCMaW+wIAAGAAB1YUPVR4xJ9nZWueCVe0dbURiMYph85zARnxUWK8VkeD5wSdQeHPGoggEc+9fQj2se3S9jHNPJzQQmjR0h40lOe+Jv3K61kF90stJjwzxWm2raymaKqMvmzxaQ0EfenhfrdPURymfowXNyHcsA/5L191ptjzl1sond9Ow/Ym3WCzP9a0UJ3Y/g7R8Aq+5pfhIjpcG2mUuxtK2Q1Ncxoc3AijLRuPM8PBaN7Hjix3sUMbO2hjNEdA2Fv0YZHxj2NcECwW5o9COaPtbUyZ97io68Dpp08I2KfaKsOoULOYD5e7k37VUU0c0lSx8LJndESS6FpJaeW8eK0Nx2atrIJanpK1smB6QqTknhvyCoFOKyjhbDS3WrZG3g1xa77AuiGphjsW6cpO4CrqWD06qrZn6bnfau23CR278Juz1HSfiF0Ky9g/xtGR1Oo2k+3UuTVXhwOqahlHU+FzfgVZVoFulI6FRUOG6ta4drG/YotwqnwUj3SyRODvRDWsOp3YN/FDjWnfJb7dN9Qluf7QVPPZ7/XVz56ekgZj1Io52+i3q5eKt1IW2ZhW6kI3irss7ltBX3IuYxxpKY7hHGfScPznfYFTNnpY5fNmyMbJ9Dmf81FqLHtPDJ0r7dWahvy3BA8AVUVtFWxvd0lDVag8kymB419vDcslBS7njz6sneSNAyupJJ+hbOwyDkOakLEktiDHdKGyavVO5ze1X1FepZdHTsa5rjpc5gPo9p70nStujJqxcLl0THOBewOI4ZGcKI+vzIWRR6sAnLjjgkF0j6PLmEO5Ac1jiymaLAO3rsOwq+C4wyNJf8lgZ3ncR2J5ldTOYXiZukccnChxZZSROa7K7DlV/hejacdI7+yVMhnjnZrie146wVVxaLqRMa5dh3LKjh2E4HqljRMeBzzTjXEJgOyuw4KDRM2bQ1nqMYz6rQPgu+kdjGonxXKFz5M9qyFz2IzjkucJVFyRcoyFzhLgKLgXKMhIkUg61I1JEJcC5S5C4wlS4OshGQuUJcHWR1pNSRCXB1lGQud3UhLg6yELlCXB0hc8kiA7QuUeKA6yjIXOUZQHWQjK5yjKA6Rlc5RlANVkJqKWSJvEjI7Ss5ggkEYI3YWoz4KDXW8VJMseBLzB4O/zV4ysaQlbZlJhKOCV7HRuLHtLXDiCkWxumKEoJa4OacEcCEgSoX5LajuwIDKn0TyeOB71Zh5cAdRcCOOcrLJ+mrJqX1HZb9E8FRx8GU6KfBeS01NONM1PDIDyfG0/YoE+y9iqB6dqp29sTejPtan4LnBLuf8m7t4HxUvIIBByDzCplJdzlnSXEkZufYCyP/Euq6f6s2v8Abyq+o8nOoE0t3cOoTQA+8EfBbTKMq6rzXcwlpaMuYnn9w2P2ikp4ov3hUMg1aOikLHEHlggD3qll2dv9E8SvtFSdByHMYJR7shetZRqI4LSOpkuUYz0NOTueJ1k8ktXLJUtMcr3ZeCzSAe5FHWOpJxLH6TfnNzxC9qlYyduiaNkrfoyMDh71VVWydgrcmW1QNf8ATiBYR7N3uWq1UHtJHPL098xZ5bNd66V+RMYxyazdhd019radwEjunZza7j7Vtqrya2yTJpK6rpz1OxIPfvVJWeTe8RAmmqaWqb1ZMZ9+VtGpRlsYPSVokqjqW1tGKuBrzFq0kkeq7qUkOyFSPl2pstJJS1Nnk6E6dLhEXhmkY3aCd3eqUbQ3EOeBVDO8EFo3fcqdBy+InFwdj2vPejPehC8w90M96MlCEAuShIlQBlGUiEAuUZSIQC5RlIhALlGUiEAuUZSIQC5RlIhALlGUiEA1VPmjpZJIIzLI0ZbGPndijW2sqKthM9NJTnholbg7ufipyBvS+xXe/Iu5CRCXLCoSIQCoSZRkoBUJMlGSgFyjISZKMoBuemhqWaZWZxwdzCqam2TU+XM+UYOY4jwV0EvAqyk0WUnEzOUqua2jhkidKW6Xjflu5UrTkLaLudMJXFHalSJVY1Ae5Ow1MsB+TkLR1cR7E0hRYmyZaQ3VpGJmafzm7/cp0cscwzG8O7lnwgOLXZBIPWNyo6a7GUqMXwaNCrKKtmkkEb3Bw6yN6siMFZNWOWUXE5lMgicYmh0gHotccAnqylYXlg1jS7G8A5wjO/CVQUFQkQgFBI4E+1RKy1264jFdb6ap3YzJECR3HkpSFKk1wyGkz//Z', 0);
INSERT INTO `users` (`id`, `username`, `email`, `nama_lengkap`, `password`, `role`, `status`, `tim_id`, `created_at`, `foto`, `is_first_login`) VALUES
(3, 'Jungker', 'jungker@gmail.com', 'Asking Alexandria', '$2b$10$crRtw2loc11q3poEOc/LmeTwwpfNPC6KQG6b0tsM/KJA3sRWsDGXa', 'pelaksana', 'aktif', 1, '2026-01-06 07:35:47', 'data:image/jpeg;base64,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', 0),
(6, 'juan', 'makavelixyz69@gmail.com', 'Juan XXX', '$2b$10$ETwLFhJEWv8.Y/akKeFHwucyXTfCqnE.L6KOv2CnfYSeRU1XuZhRG', 'koordinator', 'aktif', 1, '2026-02-07 06:51:03', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCADQAZADASIAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAIDBAEFB//EAEUQAAICAQMCAwQGBwUGBgMAAAECAxEABBIhMUETUWEicYGRBRQyUqGxIzNCU5KTwRVi0eHwJENUcnPSBoKissLxNWOD/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAtEQEAAgEDAgQEBgMAAAAAAAAAARECEjFRAyETIkHwcYGRwSMyYaGx0TNC4f/aAAwDAQACEQMRAD8A+zYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxkHljQ07qpsDk+ZofjgTyqcyCImIjeOli7/EYhn8dA6xSKjAMpkXaSCL+yeQexBAOQkTUEBvEXg3sAoEV0JNk82eK7fGxusbqWfVCVI/Fj9oE34Z4r/zZP/aAQWniqwP1ZH/yzPMdV4sTLErEWPZPSyPPLIk1IUpI4cHjcWo1QHG0D3+/4Z1nb0dZ29G/Mkq6l3cLKiLfs+wSf/dl+yQMSspIJHssAQo71VHn1JzLIdUmpkKjeh27QSAB2Nd/U38M547vJ1dnGi1JJU6tQX6Dab6Vx7WXw+OJf0kiMNp4VCPL1OYn+tLNKz6sIHSkQstJQ5ZfZv5kj0zZp/GEgEmwgKeQeSePTNzs5Y7xv+7TjGM5PUYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAZwmgSe3kM7nGNKSewwKPrsX3Zv5L/4Y+uxfdm/kv8A4Znh+kBLe/TaiGqrel38r/0cr1GuDaDUMEmicRtttCD0NGxmqeXLqzETOqPfzXRfSMcrzqVfaj7FKoxJG0E37PsmyRXPQHvli6nTpyscoPn4D+/yymHVR+JPZkI8QV+jb7q+mW/Wov7/APLb/DFLHVv/AGj381i6yJmVakBY0N0TAfMjL8wvqI3eJV32ZB1Qj8xm7JMOnTz1X3MYxkdTGMYHGUMpVgCCKIPfKzCfH8VZXFrtKXannrXY9eldeboVbjAo02o8ferRtFJGxVkavPggjqCOR7+QDYF+RYG1Ivg8geWckkWNdzXXoCfywTNbp4yj65D5v/Lb/DA1kJIAL8//AK2/wy1LHiYcwvxjMj6sLqJI2SVQtU+0kNflXl/XMTlEbukYzOzXjMf1lNxbdLyAK2NQ/DJRapZSoqRST0ZSP8skdTGfVqcMo9GrGMZtgxjGAxjGAxjGAxjGAxjGAxjGAxjGAxjGAxjGAxjGAxjI71LlAw3AWVvkDAljKhqImheVH8REsHwwWNjqKHJPHTISa2NdMNQgaRSyqQCFK2QOdxFVfI6+l8YGjGUtOw1aadY2NqWZyGAUduaom+133yHi6kvfgKqEgBXem+1RPFiq5H9MDTnGICkk0AOTmWOaYyyBnSVGUvEYkI48iSSpPxHu4zKHlGhghm1zO+6L/aRtj8ezZHSuQP2efdgcg1ml8OYmNIwbYr7A33fHDGz7/PK5dRF/Z2pjWSFFCOAgCi/Z7Ux73m9ZFXTFo+KUkAg/l1yrVlf7M1HIFxPx8Dmo3eTqatE9/T36kOq0wl1F6iLmQV7Y+6uW/W9N/wARF/GMzxqk+olelK7/ANqwfsAZoWNCdz7N1kij8MSuGqt+f5+KEmogkeJUmjZjIOAwJzdnjfSMGm0+kj2M0I8aMbo2YEW69xZ54/yzT4GvKoqa9iElX2vDRmdQTuD9BRFAbQCPXJLr07ubehjMSz6p9RpiphWBo2M6urK4Iqit1xd9R5Zw6zVRrqppdE3hQ34axEO83e1A87qjzYPbnI6t2MzDVgaoaeRdrvzGFtiRVktQ9kXY5NfPJQauOeORx7IjYq1srdO/sk9RR8+cC/GUDW6c6NdY0nhwMoYPKClA9LDUR8ctZ0UqGYAsaUE9T6YENRD48Jj8R47IO5DR4IP9Mjq5hp9M0h5roBXPzIy/KtR+oYUDYoA3XPuwk7ME2vh3RssiEDcSm5STXx+XOaV1mnbbU8dntvGUTlBJHtA/b4IPXj49cu0su6MBiAQB0VlHQeeaebHVc9/f1bMwSyaddfb+CHC/bO2xV8Xd/tHt3Pnm/Mruq6oiutAmj6/DOeV12ezGr7ssOrgOsmvahIA8Q7AGq65Bs9e+ak1ELuqpMjMTwAwJyJ1A8dYxdG+drfnVZZSGVX4LDgG85xd7tzVbNGMYzs5GMYwGMYwGMYwGMYwGMYwGMZwmsDuMqjeZxuaERgopCs/tBjdqascccgnv5cgrIN8spAXcTyAK9fcMC3K1nicxhJFbxELoV5DLxyD8R88qXwl8JoommKoAkl7jtYi/aJ56Annmu+TjE5RTIUjJRbRPa2t3pjVjsOB/gEvGJClIpGDMVPG3b15N1xx288izy/pE/RI5vwbYncKHJHHe+BfFc80JeENwYu5IYsPaIHIqqHUe/OpHHEgSNFRR0CigMCCyF3jKtashPCGj079vd3+GVhJZ4KdZVWe/ER5Ajwgr0Up3v+93JB4Ay+QyCvDRW553NVCj6HvWC+xFLiiSBSgnk/664FbwNIE3+GWjk3ISu4gfE9asX64eKNDPPLKVRkpiSFCKAb9oUR1vk8dqy0h/EUhlCUdy7eSeK5v39u46VzXHpY0IZrlcftyHcegBrysDkCh188AFiR4wEZnVCFYgkgcWNx+HU81nVWRXIVIkTxCTXJYV17Ud3v4HrxN2KoWVC5A4Vas/PKn0qzkfWD4gVrCCwverF88HvxYBoECgqjYaiBHWd9SrBAWhYItj2t4IN0eLFkVXHW5GJw4VSEBcsfDQeYPJN9RYPfniqvO6WZ9Uhk8F4Ig36Ldwzr5lSPZF9uvuyccURiiVIzEkRpEW0AA4AodvTp0wIJp42EigvsKBLtg/Fn7d2ftfDnOnRafduMYNNuCn7KtZNgdAbJN9ec0ZzAxwwBZHk2kNyB+lZhzz0PA5/D5ZTqI0i+ip4wD7MTgbnLnoe55OejsX7o+WcaKNlKsikEUQRwctuWWE5YzDNAo8XUcD9YO391cu2r5D5Z1dPEszyhfacAEXxxfNdL56+g8hk9i/dHyxZGFQzTKLi4H6xcsbSRbzJGoikLbjIigMeVsHjuFAPoPdlvhoa9heDY4yWGscamWRn1UEreKgn05v2kX20AUdR+1ZDdOfaArqcuEcUi71Wt207ltSaNjp29MtyibSQzSxSsoEkTb1YKLvay9SPJj0/Im42sKvuBEnG6yCO1dB8aOVLERDGJYI3aMChGOL6Ggeg+ODqDFqPDnUKjkLE4N7jXQ+R/PNGBlOnhBjVGeNkltDW488kAsDQIscdBwKzn1beskkU9mWUSI59vwxSg7bsDgHoAOenW9eR2Le7aAaqxwawKQjrqXmMKEttRSlbtvmSa4snjnp60KokfwfC3srSq5kk3MWR+BaK4Iq7IvgccEHJ6ldTFpZX00u6RVdlWRNwJJsChR46CvPvnNNrvG08M0kLwrMAylrFBr2hgQCrVVgjgmucDyv/EjuPorQsN8ZP0howwZASw+sxDkrwLu/XPYR9zPtMLWoaJehr19L9Mw/T+lTUaSLxEIji1emnZkkKkFJkIJ4oqACTfl26jbJFO0dXHICtNFILDcHjd2skWaPAPHOEqFpkkXwgYSS5pyjAiPgmzdEixXAvkcVdZJzIszzRRK3RLkkZAWuhQoiva6j08uLm2QxySys2nRKLMX9gKBZIvgL1B4HTLQJVJ9pXBqgRRHJvn3VXHbrzxJi2ommWKMjVyik3UNy+OWIWztO08C+fl3rNIjIIO0dcyrMmohnm1Qg+oSRXbOrI0dG2JqqIJ7kUB5mtbRBi5DurMoWw3Sr6A8A8+WTTC6pWYysrJuJWQUSOGW6Hfy65EyyICXgJoO1xncKB4HY2RzVVwRfS9MrsZWs8TSeGHAc3SngkAgEgHqORz6jLMBjGMBjGMBjGMBkHZ7KIKJWw5FqD88kd3G2uvN+WVPOEcrRJHkDhYiZ2cTTXEyah/rG/wC0HUbepNAeXNefAsk85fmZdYj3tBNGj7J93lgaxC5TncO205La0ZcNOVyQRysDIu/aQQG6Aggg16EA+mZNbNNJCqwK+4OrWrFD7JBq6PBqj6E5cmqJUF4yrdwAT/TLaaMuGnGUfWR91v4Tj6yPut/CclmjLhfjM8Op8XUyRbaCIrWe9lv+3JzS+EY+L3tt/An+mWO+xOMxNLcoh0qQyyy7mkllPtO9XVmlFdhfH42bOU6qZ3j8NAyh/ZLglSt9xxzlqahiDvjK0eKBN/hl0ymmWjGRVtyg+eRlRZNiMFI3BqJ8uRXxAyIkilRRdn5Js13PTjy6ZxixkVUdBRt1IslaPTnjmueehHqJ5FQd7EvYNUtdMCvVQJqYTp5VDxSezIpFhl7gjyPT45dkCqmYPuO5VIoMao11HTt19/mcngMYxgMYxgMYxgMYxgMYxgUTpGqu5ARpAI2kBCsBZrn0LGvU5ZGXKDeAG6GvzxKjSQuiyNEzKQJEA3KfMWCLHqCMrimhbUyRIzM+1ZW+0VprAo9P2DwPeevIX4xjAxaM/wCwwcf7tfyyccySMyBkLofaVWuuTV+XTK9G4GigFN+rX9k+WSSdN7KXJa72V0Hyzz4TGmHfOJ1SnKN0ZXkbuLBoi8jBI0kZZhyHZePRiP6Z13G0cN1H7J88r0jjwW4b9bJ+yfvnF+arK8ttF+mVamPx9NLCdw8RCtqxUixXBHI9+T8QeTfwnG8EVTfwnN3DNSnp5FeMAKI2QANGCPYNdOM74IXYIiY1Q3sQABhRFHjgc3xXT33CYLC31gISeFfbtFrfUk9lsnr59emX51ckEkDyOm1lKEckcNx1H5fDJ5XLEsm0kWyHchsij8Mkjh0DD4iwaPccYHJIo5lCyxq6hgwDCxYIIPvBAI9RhU2M7BmO83THgcAceQ4/E5PGBXHJv4ZGRwAWBBoX2vofhlmMril8XeNpUo5Ugg/A8jnisCzGMYDGMYFUTF5pt0JTYwQOa/SCgbHpbEfA5nn1Kx6lkKNwB7Qque3W+Oua1BF212eOOmZJ9XpYtQySTxI4AsMwByS6dOLnZn02pXxGXawUFjvoUx3HjrfHu75JJYvrckniHgVVcG69L7ZnXU/RyjxJGgdxISD7JIO4gH/1H4Xl0Wu0hlkb6zEA1EW48szb0zhNz2lo+sRff/A4+sRff/A5W2t0pHs62BT/AM6n+ucfWaY3t10C2K+2prrz193yysaJ4lb9Yi+/+Bx9Yi+/+ByB12kPTWQj/wDouRfWac1s10C+0CbZTx3HXBoniVmkdX+kNQVNjwo/zfLdWwUwEmgJP/i2U6KWObX6hopFkAijFqQe75drHSPwHdgqiTksaH2WzfT3Yzj8Sv0+yp9Ungh/CdjwfD4sc++uOvXtk/HjK/bI+GVPrNDLD+klhdeG2swPINjjzvEeu0TlmE0SkErbMATX9M66Z4TTPDbGQYwR0OGijeRJGQF472nyvriJg0YZSCDyCO+SYEjhq5HOcXF3KYdOkEk8iXc8gkazfO1V4+CjLFDAG2B8uM5tez7fBII46DywKk0ip9Izazcd0sMcRXsAhc3/AOs/LNGMYDGMYDGMYDGMYDGMYDGMYDKdLpotFpIdLAu2KCNY0W7pQKA+Qy7GAxjIu6xozuwVFFszGgB5nA87Qzr9XjDb1CxoBdUeOorn058ssjniaQsYSjWRuIHNe7zyrQ6rRppIqngUmNS3tgWaGRM+geZtz6Yof2Sq8sTybv3dux+HlwyjTHeHpzxnVPaWp549o9ruO3rlelmjELW3+8k7f3zh9dpSSv1iPjab3iuv+WR0us0qxMDqYh+kc8uPvnJqjXvC6Z07S0ePF978MeNGeA3J9Mj9d0n/ABUP8wYGr0zHauoiJPAAcc5uMo5hicZ4lplFxONgf2T7J/a9M5A7yQRvInhuygsl3tNcjLMZ6HAyuJXXeGCAbiV2iuPX1u8sznc84HcYxgMgFYSM24bSBQrm+bN/L5ZPOEEkUarr64HcYxgMYxgVRRuks5aYuJHDKpH6sbQK+YJ+OZdXqI49SEcSH7P2Y3NX6gV2+HF9RmsqqS+L7C7gFZiOTz7Iv4nj1+dcuigmkaR41LMKJK4axmInuwjU6dB4UglJZ3I2Ruw4YnqoodPjl0GxJJFVuBtAs32yafRelQkiJCTfVeOt9Pjkh9G6YMzeFH7X9wZmpdpzwuXdy/eHzxuX7w+eP7P0/wC5i/ljH9n6f9zF/LGO7OrA3L94fPG5fvD54/s/T/uYv5Yx/Z+n/cxfyxjuasENMQfpHUUb/Qx/m+S+kGRY42k3bAxLbQSa2N0A5v3c5ZBpItPK8kahS6qpCgAcX/jndTpo9VGEksqDdfAj+ubw7T3TLKJyuNv+M0epglidU8UCPg74nU/CwCfhndJPFKrmMOoLE/pFdSb9GArm+M6PorShXGz7bbjbHg+nPA9Bxk0+j9OgIEaGyT7S31N983eLN4tEf2BksiihECigB0rJZzYMYxgZo9UX+lJ9JsIEUMcgauDuZxXw2fjmnKzKizrEb3upYeyaoEXz0/aH+ryzAYxjAYxjAYykzVOi7o/De1B3e0XHNAe4H5Z1Z94DJFKw3FTa7apqJpqNdTY6jkXYsLcZBTKSu5VUc7hdn0yKRy/o2kmtlQq6ooVWJrmjZFUaF9zd8UFmQeeJCwLgsqbyi+023zocnAhiUAEXSbLYkkj1vrkh7KhUUADgDoAMCLSMA+yJmKpuXoAx549/H45TqtUIBIHn0+nqJpFklbgBftMw49kWvN9+2TEc7hDLKFqiyxDg+yQQSeas2Ko8D1vskcB1UMrwhplDLHJ4dlAaJ5ri9o99DA5MHG7b4r7hYVSFAI7X15ynVrGweJ5tu9Gcoo3yErtpkHPTjoDyR8dBSZplbxQkaknaq2X47k9BZJ48hz1BmFUMWCgMRRNcnA8z6Nmg8KONfFEngoWLo4XoOhIq/QZY82n7iahJzSSXuHuHI9emV6LTaRoon2K0vgruBN9R1rp265F9J9Fky7mA3kI9SkUSeAOfZN+VZ58NWmHoz06pbmYbBbAmx09+V6Rh4Lcj9bJ3/vnIiDSvCjRxRMp27WCg2L88r08WmSB2kjiAV5CSVHADnM+bWvl0Nm5fMfPBYUaI+eYUl0JJDfVOi1tIPX/74yTjRzxtFBLFFK60kkQQshIJDCwRfcWCOM6eZjytMb6sMGnWJUIAZbJKEbrbd3B9mhS1RN8gCwalC0YAZlkrZIq7lNgnqOgodTQ5A6nOxeJHGqSuXIFeIatuwJquT6Csk8SvybBBHKsQeDfb/Rzs4pWM7meSDcxZkRzvBUraFRVHnueW8uvxyP1xJ5dRp9LLG2o09CSNwRRItb9D589DgasZS07REeJC+0tQZBvAtgBYHPN3dUACSRk0ljlFxurCr4N8f6BwJ4xmZ4tSfpOCVZFGmWGRZE7s5ZNp+AD/ADGBpxjGAxjGBxlDCiLyuNjGUhd3kfbe8rW6vOuLy3IuiSxtHIiujCmVhYI8iMCWMgiFAbdnskjdXFkmvxr4YSUSFgAwKmjuUj/7wJ4xjAYxjAYxnCQOuB3GR3DG4YpLhLGVvNFGAZHVATQLGufLAlRtpVwQRYrm/dii4WZFJEkUsjBgCVsG+QaI+BBGNwzLofFTRQrJp49PMyeJMsYGwSNy9UefaJN9/jii4XzSGLw252lwpogdeBdnzrpzlhZVIBYAsaFnqcz6kR+BM00sgi8NtwQlSBXYjkEVwQb5yWmRE3il8YkGVgtF2oDceBZoAfCu2WiJiZpPxVsBQzEg1S8cevQY3SsDSKgKWNxshvIgfDvlmMiq2R2v9KVBII2gWK6jm+uPBj3MxBYswf2iWAIAHAPTp29T1JyzGBWYwJEdRVE3TEDnvQ4JuuvrkyaFnK50MsTwgspdSNykjb62CD8so0+lZ0R9a/jTKPaW/wBGrWG4FAGiBTEXx2s4Gh5GqRYk3SqlqHtVJN0N1Hy5q68s6yMxHtlQDdADn0N/08snjAikape0VfU9zxXJ79BnSayLyKrCPeokYEopPJrr+YzoQbt5A31RauawKYRqmffM6KnNRqnIuqs2eRzddby2Q7U3kMdvNLd/IdfdkmFirI9RncBjK03K5RtzdWDkCuvT4ZZgeTpvo47IWkVl2gWm1CG9kdbW+t9/8rxoozIT4JAscbEr8rrN+M5x0sYiqdJ6mUzdsb6KGuNOnUfsjzyGn0UQjIfTpfiP1UdNxr8M1ztthb9KkTN7Ku/QMeB5XyRx3yYFKBZNDqe+TwsbtfFyqmb6nB/w8f8ACMfVIVNrAgI6EKM1Yy+Hjwz4mXJlSxmJlEexIFUjYFqj2r8ctyKOkiB0YMrcgjoc6MIxzRS0Y3DgqGBXkEHoQc6pTxnQKQ1BmO0gG7A57nj8vPCIyu5L2rEFVr7PFV+GQldY5omZyAxKVuABJ5HXknihXn8ggYZ0kDRTlktiYpOQbHADVYFi+/U9qGWOkEstMoMiAMDXK2CAQe3BYfE5bkHijkZGeNWaNtyEiypoix5GiR7icAVcUEYUK4YXxfPPuyuTUGMGSTbDEjHe8pABWrsEHjnz8jliSbpJEKMuwgWejCrsfl8M5OCYWIQuy+0FAFmuwvjnpgWYymLTRwsTDaKSSUB9mzXNdunbzJ6nJ0zxgEmNjV7T0wJ4xjAYxjAZF40kXbIiutg0wscGxksYFMsUpVzDMUc2V3LuW6oWODV80CPfnWlkQi4CwJr2GBq2Avmuxs+49ctxgQWRGUEGrF0wo/I85PIsiuKdQwsGiL5BsH55BobspI8bGuVN9DfQ2ObPb+mBblOoDFV2mvasnOymZQxiRHIRiFLbbbsL5odecjqSSmzwmcMCDVeR8/8AXOWN2ctlMz6mMqUVZAbs9K49Tlg8Uiw6Uf7v+eQ1CGRBHtYqTztCkV5Hd2PT45OK1XYEKhKUXXIrtWbtwqECJjMKYUOtDjv65ZUv30/gP+OcZmUuwQuQthRVnrxzxk7Pli0iEal++n8B/wAcVL99P4D/AI5Ln0xz6Ytahl+kBJ/Z2pt1rwX/AGfQ+uatUNR4BOlZBKpBAkHst5qa6WOL7HmjVHP9IX/Zuq/6L/kc3Yy/LHvhelHny+EfdRpNUurh3hWR1JWSNxTIw7H8/UEEcEZfmPUyaqbRyfUXjinDEI0qll9lqIIBB5AI9Ly1ZZFgDOgaQLbKh6muguvxzlbtGUSvyvxN0uxArKLDkNypoECvcbyldXIxQHSSruvcSyex76b8r6Z3S+LHp0EwjMxFyGMEKW7kA2QMq3C6KKOCJYolCIooKO2d2AOZKO6q6/0wrWarOngYVyORZEDobByWZ3ZyUMbBKa2G29wrp/n6Z2TUMi2sTSHyUi/xIy1IsXcXYmwOABxR9fx/DJ5g002oiJimheTdLIfFDDaqkkr1a+hA4HboBmvxfTFSLMZCOTeWFVtyeQMiWVdoZgCxoWepyWRZFcUyhhYNEXyDY/HAljMs5mhiAVWnZpDR9kbRyRfTjtxzyPU5FpCAjywyKQQOHAFnjz55zjl1YxyqmoxuGh3USRoZQrMSQti3oc/n2yzMMEybW8GN35sneG6gHu3lWaNM7OhZ12m+l+uXHqxlNV+0k40uxjGdWTK9PBFpYEghXZGgpVHYZik+kdQImZdFJa+ZSv8A3ZSus+k40UDRtIS7Fi7pYBJNCj2FAe7v1zp4eXuUuHpRO0kkp3KY1batDuOvNm+eOgqjk5A5jYRMquQdrMu4A9iRYv5jMmh1MjldPIku6NAGklKWx8ztPU9egGbGJCkgWQOg75jKNO6oQS+NCshRkJHKsKKnuMszz0aaFZ3hikYyv4gDsu1eACBR6cX7ycsi1WpYAvpuCLtGB/r5VnHxcf1+kpa9UB1LyB3PshCt+yOpuvPn8stynTEiMR+G6KgAG9txPxsk/HJysViZlUsQLAHU50xyjKLhY7i2rldp2gWGJuySbH+vPI6iaHTxeNPMkMaEW7vtXnjkn3/OsjufzyJZ13MXJHWvLFtaZacZkhkkdNzb1s8BiPdfHn1+Pbpkyz11xZpaMYxlZMYxgMYxgMYxgMo1UcM0axTxLIjN9lk3C+vPyy/KNSEKLvLgBtw2FhyOe3bjp0PTLG7OWyuZIJCnixCQ87bS6sc+7jO6ZRHpo0FAKoAATYAOwrt7s5qIY5QhkMo2sK8OR15PHO08j35yGVABFTgqSosMeBYHtEc8D/M5pyWgjxDz2H9c7Y88iaDsT2UHj44EikE88cfZOVISseeLHnnFdXLAX7Jo2CO1/wBclkVm+kCP7N1XP+5f8jm7MP0h/wDjdV/0X/I5uy5flhOn/kn4R92TT/q2/wCrJ/7znEcfWZEC13J8MizQ/a6Hivl6ZTHJFHJufxd/iOoChyvLt1A47de3xy2VIiWDmb2wCdrOPlXT4ZxjZcfywkm3xpCB7XFmuo57/P8A0ctvKliXw/Dt9qkAHeb4rvdnKxoIQu3fqK27edTJde/d19euGoa0+1kz0OUQQJFK7qZCX5O6RmA9wJofDLz0OahvHZhNfVZf/P8A7s+Z/Z7/ANfjliMWUEkd+1e7IKFhjcMzFbJHDMQKv1J75wwReNe6Xcx3frHrivWvh3zq0sRlZARwD5ivwyVjzyuWBJihcyDYbGyRk+dEX7jkBoolbcGnu75ncj5X+GBp0/25PePyy/MujjWEPGpYhaou5Y/M8nNWYy3DGMZkVznagPPBHQXmSHWNLplfYhk43KjMyjzptvPHPQZrmNICfvDM8eoJTcYZVJI9kqLHTy8s8vUms94huI7Kk1jeJEhRPbVmb9IzMP8AlG3kfKs2QMGWwCPeCMzR6lmK74JktbO5RwfLg+n45phYMLF9uorHTyvPeJJjtstxjGeph5D6xX08txyDhhxGx/pkYvpCN5X3hgQaVUDtY6gkbRRo9Pxyb6pWhmtJVABAuM88deP65yPW/pirafUBbreUFd+eOfL5j1z1V22YX6OfxdU21GCFQQx3C/gRQ7dDzm9jSk+Q7Zl00ySS0u7p3Qj8xmpjSk+Qzz9TdqNmGHUpJpvZBYi19kswscVuq8jDraj36ghB0BUlgeB32juSPl50JxTkwbmjlRq+yyi7+HGcj1JZwrQTKKNllFdfTPDq/WPfzZaNO6OWZN/tUfauuna/6ZZMFMLhxuUiiCLsZGJ1a6vjzBGTkNRknsM9PTm8W4ZkEYiVUUKgFBaqh5VlAWCBSqRBWcNRSOgO/J7dMt8JG04QGTaRYO9g3n1u8jFEYtM4a7Nnl2bt/e5/1fF5XWN04QEiUWPPgV15yZIo85FXCot39m+ATkd8jMSgUpwKa1I8z057ce/nBLbjGM05GMYwGMYwGMYwGZ9YITEBNII1u73benPX3A5oyqeISptN+hHUZY3Zy2Z50iGwUgdmAVS23d3IHmaBNehyDQRMfDS2tixKvyvNV7uvyzuo0W/a0TSJtJtU2+3fHO4Hp1FVznYtEAd7lzY+wapb9wHTpnS45cKnj39ElSNC25FCqo5aunPOdEmlMgjDwlzdKCLNdePiMHSoWYBCtrQI7dcj9SUd3PN9B5dOmLjlIxnj39E08CQAp4bAiwRRsZPw4/uL8szw6UrSyRs1KPaJB3H1oDnr2rLfq6WP0PFc85Ljk0zx7+ir6QjQfRupIRf1L9vQ5vzztbpd2k1CpBZMT1RN3XArPRxlPlhrpRMZzcekfdAxRsbMaknuRnPAi/dJ/CMsxnN3qFfgRfuk/hGPAi/dJ/CMsxgqEFjRDaoqnzAyRFijncYVX4EP7pP4RjwIf3SfwjLMZbkV+BD+6T+EY8CH90n8IyzGLkRVFQUqhR6CsjEqx7o0RUAYmlAAN8k/Mn43lmRKKZBIR7SggH0NX+QyCWMisiOzqrAlDtYA9DQNH4EfPJYEJYxLGUNEHqCLyoadkgEUXhIqABF8P2VA6cX2GaMZmcYmbW1MenWIMFVFLGzsWr4oX8AB8MsVduSxiMYibLMYxmkUHR6diSYlsncTXeqv31x7sLotMsgkWFA4BUMFF0TdX78vxluRBY1U2BkjyM7jIM66DSLe3TRC7ukHN9fnlghjX7KgduMsxkqBwKB0zjKGUqeh88ljKMZ+jYypXe/K7bvkevvxLpGTTlYEjkfoBI20VfPNHtfbNmZTOuo1R08ftCFgZjtsA9Qt3w32T3494xTWqeUxpYwAKXj+7j6snkv8OX4yUap5MYxlZMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgMYxgcIsUb8+DWR9vfwVKV073k8YEJJY4gDIwUHuenQn8gcnjK/Ai3lwm1mYOxU7SxArmuvFDnyGBZjKxG6hQJWNX9oA3/8AWLlXqquAlkqaJbyAPb44FmRLAGrwHtgpVgavkcD0zCTqJZ2kinQRsqlVeI8df7wN+8f1zWMWzlMxtDdvXzyPjR79m72iLr0zEqa1TXjRmyTZiPHP/NkAusGsK/WYzaXRiND4bs3GEcuc9SY9P4/t6W9fPG9fPMezWfv4f5J/7sbNZ+/h/kn/ALsmiOV1zx/H9t2MrjkaQE+GyUxX2+4HcZ10Z1K7ytirXqPXObqkzBVLMQABZJ6DKzqF8TYiu7c3tXgURfJ4/av1o10yQiRXZ6JZj1JJrgChfQcDge/J4FEkMkxppikdEFY+C1ivtdR36UenxtZbWlYrzdisljAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAYxjAZik+sjUsUCsnYM9Dt/dv8e+bc8+eaWLXAFAyvYXajHy6sAQO/X08ud4bsZ7Kf9uXVKShdSW6uu0dKH2b9349snu1P139VFfh/vD5/8uQMk/1hkmjR0NbVWN+DfduQe3lXXJyHUnVExpGreEQCxJHX4Z1j4OGXp3n38l27Vfuof5p/7cbtV+6h/mn/ALcrU6/ncdOeTVAiutd/d/rojOvFeKdO3S9qlff3Pp/nk+TXzn38no4xjOD0GMYwGMYwGMYwP//Z', 0),
(7, 'ppk', 'ppk@gmail.com', 'Texaz', '$2b$10$Iio3J3bZHsUGrl0s2u7vkOvZ.DY4Fq0YDokTWY1I5GFEhQ7bPpSrO', 'ppk', 'aktif', NULL, '2026-02-07 06:57:10', NULL, 0),
(8, 'ipds', 'alexandriaasking926@gmail.com', 'xcvbnn', '$2b$10$lQSVv.vP/Km2YLj7OUMPKuEx9oCVfEFJDl1ys1Asz0egAjof5Z/8y', 'pelaksana', 'aktif', 4, '2026-02-07 15:04:30', NULL, 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `validasi_kuantitas`
--

CREATE TABLE `validasi_kuantitas` (
  `id` int(11) NOT NULL,
  `kegiatan_id` int(11) NOT NULL,
  `jumlah_output` decimal(15,2) NOT NULL,
  `bukti_path` varchar(500) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `status` enum('draft','menunggu','disahkan','ditolak') DEFAULT 'draft',
  `koordinator_id` int(11) DEFAULT NULL,
  `pimpinan_id` int(11) DEFAULT NULL,
  `catatan_koordinator` text DEFAULT NULL,
  `catatan_pimpinan` text DEFAULT NULL,
  `status_kesubag` enum('pending','valid','tidak_valid') DEFAULT 'pending',
  `status_pimpinan` enum('pending','valid','tidak_valid') DEFAULT 'pending',
  `feedback_kesubag` text DEFAULT NULL,
  `feedback_pimpinan` text DEFAULT NULL,
  `validated_kesubag_at` timestamp NULL DEFAULT NULL,
  `validated_pimpinan_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `validasi_kuantitas`
--

INSERT INTO `validasi_kuantitas` (`id`, `kegiatan_id`, `jumlah_output`, `bukti_path`, `keterangan`, `status`, `koordinator_id`, `pimpinan_id`, `catatan_koordinator`, `catatan_pimpinan`, `status_kesubag`, `status_pimpinan`, `feedback_kesubag`, `feedback_pimpinan`, `validated_kesubag_at`, `validated_pimpinan_at`, `created_at`, `updated_at`) VALUES
(3, 2, 300.00, '/uploads/bukti_kuantitas/bukti_kuantitas_2_1771427372511.xlsx', 'fhfhdhdhdh', 'disahkan', 6, 2, NULL, NULL, 'valid', 'valid', NULL, NULL, '2026-02-18 15:10:57', '2026-02-18 15:12:01', '2026-02-18 15:09:32', '2026-02-18 15:12:01'),
(4, 2, 400.00, '/uploads/bukti_kuantitas/bukti_kuantitas_2_1771427933188.docx', 'hfdhdhfdd', 'disahkan', 6, 2, NULL, NULL, 'valid', 'valid', NULL, NULL, '2026-02-18 15:20:17', '2026-02-18 15:20:25', '2026-02-18 15:18:54', '2026-02-18 15:20:25');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `approval_history`
--
ALTER TABLE `approval_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_approval_history_kegiatan` (`kegiatan_id`),
  ADD KEY `idx_approval_history_user` (`user_id`);

--
-- Indeks untuk tabel `dokumen_output`
--
ALTER TABLE `dokumen_output`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_id` (`kegiatan_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `reviewed_by` (`draft_reviewed_by_pimpinan`),
  ADD KEY `validated_by_kesubag` (`draft_reviewed_by_kesubag`);

--
-- Indeks untuk tabel `evaluasi`
--
ALTER TABLE `evaluasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_id` (`kegiatan_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `role_pemberi` (`role_pemberi`);

--
-- Indeks untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_kegiatan_tim` (`tim_id`),
  ADD KEY `idx_kegiatan_status` (`status`),
  ADD KEY `idx_kegiatan_status_pengajuan` (`status_pengajuan`),
  ADD KEY `idx_kegiatan_approved_by` (`approved_by`),
  ADD KEY `fk_kegiatan_approved_koordinator` (`approved_by_koordinator`),
  ADD KEY `fk_kegiatan_approved_ppk` (`approved_by_ppk`),
  ADD KEY `fk_kegiatan_approved_kepala` (`approved_by_kepala`),
  ADD KEY `idx_kegiatan_tim_status` (`tim_id`,`status_pengajuan`);

--
-- Indeks untuk tabel `kegiatan_mitra`
--
ALTER TABLE `kegiatan_mitra`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_kegiatan_mitra` (`kegiatan_id`,`mitra_id`),
  ADD KEY `mitra_id` (`mitra_id`);

--
-- Indeks untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_kendala_status` (`status`),
  ADD KEY `kendala_kegiatan_ibfk_kegiatan` (`kegiatan_id`);

--
-- Indeks untuk tabel `kro`
--
ALTER TABLE `kro`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indeks untuk tabel `master_indikator_kinerja`
--
ALTER TABLE `master_indikator_kinerja`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indeks untuk tabel `mitra`
--
ALTER TABLE `mitra`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_type` (`type`);

--
-- Indeks untuk tabel `notifications_read`
--
ALTER TABLE `notifications_read`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_read` (`user_id`,`notification_id`);

--
-- Indeks untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_progres_kegiatan` (`kegiatan_id`);

--
-- Indeks untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `realisasi_anggaran_ibfk_kegiatan` (`kegiatan_id`);

--
-- Indeks untuk tabel `realisasi_fisik`
--
ALTER TABLE `realisasi_fisik`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `realisasi_fisik_ibfk_kegiatan` (`kegiatan_id`);

--
-- Indeks untuk tabel `satuan_output`
--
ALTER TABLE `satuan_output`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

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
-- Indeks untuk tabel `validasi_kuantitas`
--
ALTER TABLE `validasi_kuantitas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kegiatan_id` (`kegiatan_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `approval_history`
--
ALTER TABLE `approval_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `dokumen_output`
--
ALTER TABLE `dokumen_output`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `evaluasi`
--
ALTER TABLE `evaluasi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `kegiatan_mitra`
--
ALTER TABLE `kegiatan_mitra`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `kro`
--
ALTER TABLE `kro`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT untuk tabel `master_indikator_kinerja`
--
ALTER TABLE `master_indikator_kinerja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `mitra`
--
ALTER TABLE `mitra`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=241;

--
-- AUTO_INCREMENT untuk tabel `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT untuk tabel `notifications_read`
--
ALTER TABLE `notifications_read`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `realisasi_fisik`
--
ALTER TABLE `realisasi_fisik`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `satuan_output`
--
ALTER TABLE `satuan_output`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT untuk tabel `tim`
--
ALTER TABLE `tim`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `tindak_lanjut`
--
ALTER TABLE `tindak_lanjut`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `upload_laporan`
--
ALTER TABLE `upload_laporan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `validasi_kuantitas`
--
ALTER TABLE `validasi_kuantitas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `approval_history`
--
ALTER TABLE `approval_history`
  ADD CONSTRAINT `approval_history_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `dokumen_output`
--
ALTER TABLE `dokumen_output`
  ADD CONSTRAINT `dokumen_output_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dokumen_output_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dokumen_output_ibfk_3` FOREIGN KEY (`draft_reviewed_by_pimpinan`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dokumen_output_ibfk_4` FOREIGN KEY (`draft_reviewed_by_kesubag`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `evaluasi`
--
ALTER TABLE `evaluasi`
  ADD CONSTRAINT `evaluasi_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluasi_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kegiatan`
--
ALTER TABLE `kegiatan`
  ADD CONSTRAINT `fk_kegiatan_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_kegiatan_approved_kepala` FOREIGN KEY (`approved_by_kepala`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_kegiatan_approved_koordinator` FOREIGN KEY (`approved_by_koordinator`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_kegiatan_approved_ppk` FOREIGN KEY (`approved_by_ppk`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `kegiatan_ibfk_1` FOREIGN KEY (`tim_id`) REFERENCES `tim` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kegiatan_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kegiatan_mitra`
--
ALTER TABLE `kegiatan_mitra`
  ADD CONSTRAINT `kegiatan_mitra_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kegiatan_mitra_ibfk_2` FOREIGN KEY (`mitra_id`) REFERENCES `mitra` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kendala_kegiatan`
--
ALTER TABLE `kendala_kegiatan`
  ADD CONSTRAINT `kendala_kegiatan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kendala_kegiatan_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `progres_kegiatan`
--
ALTER TABLE `progres_kegiatan`
  ADD CONSTRAINT `progres_kegiatan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `progres_kegiatan_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `realisasi_anggaran`
--
ALTER TABLE `realisasi_anggaran`
  ADD CONSTRAINT `realisasi_anggaran_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `realisasi_anggaran_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `realisasi_fisik`
--
ALTER TABLE `realisasi_fisik`
  ADD CONSTRAINT `realisasi_fisik_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `realisasi_fisik_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

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

--
-- Ketidakleluasaan untuk tabel `validasi_kuantitas`
--
ALTER TABLE `validasi_kuantitas`
  ADD CONSTRAINT `validasi_kuantitas_ibfk_1` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
