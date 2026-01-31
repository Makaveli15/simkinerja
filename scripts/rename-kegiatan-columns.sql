-- Script untuk rename kolom kegiatan_operasional_id menjadi kegiatan_id
-- di tabel yang terkait (setelah tabel kegiatan_operasional di-rename menjadi kegiatan)
-- Tanggal: 1 Februari 2026

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel kendala_kegiatan
ALTER TABLE `kendala_kegiatan` 
  DROP FOREIGN KEY `kendala_kegiatan_ibfk_1`;
ALTER TABLE `kendala_kegiatan`
  CHANGE COLUMN `kegiatan_operasional_id` `kegiatan_id` INT(11) NOT NULL;
ALTER TABLE `kendala_kegiatan`
  ADD CONSTRAINT `kendala_kegiatan_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

-- 2. Tabel progres_kegiatan  
ALTER TABLE `progres_kegiatan`
  DROP FOREIGN KEY `progres_kegiatan_ibfk_1`;
ALTER TABLE `progres_kegiatan`
  CHANGE COLUMN `kegiatan_operasional_id` `kegiatan_id` INT(11) NOT NULL;
ALTER TABLE `progres_kegiatan`
  ADD CONSTRAINT `progres_kegiatan_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

-- 3. Tabel realisasi_anggaran
ALTER TABLE `realisasi_anggaran`
  DROP FOREIGN KEY `realisasi_anggaran_ibfk_1`;
ALTER TABLE `realisasi_anggaran`
  CHANGE COLUMN `kegiatan_operasional_id` `kegiatan_id` INT(11) NOT NULL;
ALTER TABLE `realisasi_anggaran`
  ADD CONSTRAINT `realisasi_anggaran_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

-- 4. Tabel realisasi_fisik
ALTER TABLE `realisasi_fisik`
  DROP FOREIGN KEY `realisasi_fisik_ibfk_1`;
ALTER TABLE `realisasi_fisik`
  CHANGE COLUMN `kegiatan_operasional_id` `kegiatan_id` INT(11) NOT NULL;
ALTER TABLE `realisasi_fisik`
  ADD CONSTRAINT `realisasi_fisik_ibfk_kegiatan` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan` (`id`) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
