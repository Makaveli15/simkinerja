# Activity Diagram V2 - Sistem Informasi Monitoring Capaian Kinerja

Dokumen ini berisi Activity Diagram berdasarkan Use Case yang telah dibuat.

---

## Legenda Komponen

| Simbol | Nama         | Keterangan    |
| ------ | ------------ | ------------- |
| ●      | Initial Node | Titik awal    |
| ◎      | Final Node   | Titik akhir   |
| ▭      | Action       | Aktivitas     |
| ◇      | Decision     | Percabangan   |
| ═══    | Swimlane     | Pemisah aktor |

---

## 1. Login

```plantuml
@startuml AD01_Login
title Activity Diagram: Login

|User|
start
:Buka Halaman Login;
:Input Username dan Password;
:Klik Tombol Login;

|Sistem|
:Validasi Data Login;

if (Data Valid?) then (ya)
  :Tampilkan Dashboard sesuai Role;
else (tidak)
  :Tampilkan Pesan Error;
endif

stop

@enduml
```

**Aktor:** Admin, Koordinator, PPK, Pimpinan, Pelaksana

---

## 2. Kelola Data Pengguna

```plantuml
@startuml AD02_Kelola_Pengguna
title Activity Diagram: Kelola Data Pengguna

|Admin|
start
:Buka Menu Pengguna;

|Sistem|
:Tampilkan Daftar Pengguna;

|Admin|
switch (Pilih Aksi?)
case (Tambah)
  :Isi Data Pengguna Baru;
  :Klik Simpan;
case (Edit)
  :Ubah Data Pengguna;
  :Klik Update;
case (Hapus)
  :Pilih Pengguna;
  :Konfirmasi Hapus;
endswitch

|Sistem|
if (Berhasil?) then (ya)
  :Simpan Perubahan;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan Error;
endif

stop

@enduml
```

**Aktor:** Admin

---

## 3. Kelola Data Master

```plantuml
@startuml AD03_Kelola_Master
title Activity Diagram: Kelola Data Master

|Admin|
start
:Pilih Menu Master Data;

switch (Pilih Jenis Data?)
case (Tim)
  :Buka Halaman Tim;
case (KRO)
  :Buka Halaman KRO;
case (Mitra)
  :Buka Halaman Mitra;
case (Satuan Output)
  :Buka Halaman Satuan Output;
case (Indikator)
  :Buka Halaman Indikator;
endswitch

|Sistem|
:Tampilkan Daftar Data;

|Admin|
switch (Pilih Aksi?)
case (Tambah)
  :Isi Data Baru;
  :Klik Simpan;
case (Edit)
  :Ubah Data;
  :Klik Update;
case (Hapus)
  :Konfirmasi Hapus;
endswitch

|Sistem|
if (Berhasil?) then (ya)
  :Simpan Perubahan;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan Error;
endif

stop

@enduml
```

**Aktor:** Admin

---

## 4. Tambah Kegiatan

```plantuml
@startuml AD04_Tambah_Kegiatan
title Activity Diagram: Tambah Kegiatan

|Pelaksana|
start
:Buka Menu Kegiatan;
:Klik Tambah Kegiatan;
:Isi Form Kegiatan;
:Pilih KRO dan Mitra;
:Klik Simpan;

|Sistem|
:Validasi Data Kegiatan;

if (Data Valid?) then (ya)
  :Simpan Kegiatan;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan Error;
endif

stop

@enduml
```

**Aktor:** Pelaksana

---

## 5. Ajukan Approval Kegiatan

```plantuml
@startuml AD05_Ajukan_Approval
title Activity Diagram: Ajukan Approval Kegiatan

|Pelaksana|
start
:Buka Daftar Kegiatan;
:Pilih Kegiatan;
:Klik Ajukan Approval;

|Sistem|
:Cek Kelengkapan Data;

if (Data Lengkap?) then (ya)
  :Ubah Status Kegiatan;
  :Kirim Notifikasi ke Koordinator;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan "Data Belum Lengkap";
endif

stop

@enduml
```

**Aktor:** Pelaksana

---

## 6. Update Progres

```plantuml
@startuml AD06_Update_Progres
title Activity Diagram: Update Progres

|Pelaksana|
start
:Buka Detail Kegiatan;
:Klik Tambah Progres;
:Input Persentase Capaian;
:Input Keterangan;
:Klik Simpan;

|Sistem|
if (Data Valid?) then (ya)
  :Simpan Data Progres;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan Error;
endif

stop

@enduml
```

**Aktor:** Pelaksana

---

## 7. Ajukan Validasi Output

```plantuml
@startuml AD07_Ajukan_Validasi
title Activity Diagram: Ajukan Validasi Output

|Pelaksana|
start
:Buka Detail Kegiatan;
:Input Jumlah Output;
:Upload Bukti Dukung;
:Klik Ajukan Validasi;

|Sistem|
:Cek Kelengkapan Data;

if (Data Lengkap?) then (ya)
  :Simpan Data Output;
  :Kirim Notifikasi ke Koordinator;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan "Lengkapi Data";
endif

stop

@enduml
```

**Aktor:** Pelaksana

---

## 8. Unggah Laporan

```plantuml
@startuml AD08_Unggah_Laporan
title Activity Diagram: Unggah Laporan

|Pelaksana|
start
:Buka Menu Laporan;
:Klik Upload Laporan;
:Input Judul dan Periode;
:Pilih File Laporan;
:Klik Upload;

|Sistem|
:Validasi File;

if (File Valid?) then (ya)
  :Simpan File Laporan;
  :Tampilkan Notifikasi Sukses;
else (tidak)
  :Tampilkan Pesan Error;
endif

stop

@enduml
```

**Aktor:** Pelaksana

---

## 9. Approval Kegiatan

```plantuml
@startuml AD09_Approval_Kegiatan
title Activity Diagram: Approval Kegiatan

|Koordinator/PPK|
start
:Buka Menu Approval;
:Pilih Kegiatan yang Diajukan;
:Review Detail Kegiatan;

if (Keputusan?) then (Setujui)
  :Klik Tombol Setujui;
  :Input Catatan (opsional);
  |Sistem|
  :Update Status Kegiatan;
  :Kirim Notifikasi ke Pihak Terkait;
else (Tolak)
  :Klik Tombol Tolak;
  :Input Alasan Penolakan;
  |Sistem|
  :Update Status Ditolak;
  :Kirim Notifikasi ke Pelaksana;
endif

:Tampilkan Notifikasi Sukses;

stop

@enduml
```

**Aktor:** Koordinator, PPK

---

## 10. Monitoring Kegiatan

```plantuml
@startuml AD10_Monitoring
title Activity Diagram: Monitoring Kegiatan

|Koordinator/Pimpinan|
start
:Buka Menu Kegiatan;

|Sistem|
:Tampilkan Daftar Kegiatan;

|Koordinator/Pimpinan|
:Pilih Kegiatan;

|Sistem|
:Tampilkan Detail Kegiatan;

|Koordinator/Pimpinan|
:Lihat Informasi Kegiatan;

stop

@enduml
```

**Aktor:** Koordinator, Pimpinan

---

## 11. Validasi Output

```plantuml
@startuml AD11_Validasi_Output
title Activity Diagram: Validasi Output

|Koordinator/Pimpinan|
start
:Buka Menu Validasi Output;
:Pilih Output yang Diajukan;
:Review Bukti dan Jumlah Output;

if (Output Valid?) then (ya)
  :Klik Tombol Valid;
  :Input Catatan (opsional);
  |Sistem|
  :Update Status Output;
  :Kirim Notifikasi ke Pelaksana;
else (tidak)
  :Klik Tombol Tidak Valid;
  :Input Alasan Penolakan;
  |Sistem|
  :Update Status Ditolak;
  :Kirim Notifikasi ke Pelaksana;
endif

:Tampilkan Notifikasi Sukses;

stop

@enduml
```

**Aktor:** Koordinator, Pimpinan

---

## 12. Tambah Evaluasi

```plantuml
@startuml AD12_Tambah_Evaluasi
title Activity Diagram: Tambah Evaluasi

|Koordinator/Pimpinan|
start
:Buka Menu Evaluasi;
:Pilih Kegiatan;
:Pilih Jenis Evaluasi;
:Input Isi Evaluasi;
:Klik Simpan;

|Sistem|
:Simpan Data Evaluasi;
:Kirim Notifikasi ke Pelaksana;
:Tampilkan Notifikasi Sukses;

stop

@enduml
```

**Aktor:** Koordinator, Pimpinan

---

## 13. Lihat Laporan

```plantuml
@startuml AD13_Lihat_Laporan
title Activity Diagram: Lihat Laporan

|User|
start
:Buka Menu Laporan;
:Pilih Filter Periode;

|Sistem|
:Tampilkan Daftar Laporan;

|User|
switch (Pilih Aksi?)
case (Lihat Detail)
  :Klik Laporan;
  |Sistem|
  :Tampilkan Detail Laporan;
case (Download)
  :Klik Download;
  |Sistem|
  :Download File Laporan;
case (Export Excel)
  :Klik Export Excel;
  |Sistem|
  :Generate dan Download Excel;
case (Export PDF)
  :Klik Export PDF;
  |Sistem|
  :Generate dan Download PDF;
endswitch

stop

@enduml
```

**Aktor:** Koordinator, PPK, Pimpinan

---

## Ringkasan Activity Diagram

| No  | Diagram                  | Aktor                      | Use Case           |
| --- | ------------------------ | -------------------------- | ------------------ |
| 1   | Login                    | Semua User                 | Login              |
| 2   | Kelola Data Pengguna     | Admin                      | Kelola Data Master |
| 3   | Kelola Data Master       | Admin                      | Kelola Data Master |
| 4   | Tambah Kegiatan          | Pelaksana                  | Kelola Kegiatan    |
| 5   | Ajukan Approval Kegiatan | Pelaksana                  | Kelola Kegiatan    |
| 6   | Update Progres           | Pelaksana                  | Kelola Kegiatan    |
| 7   | Ajukan Validasi Output   | Pelaksana                  | Ajukan Validasi    |
| 8   | Unggah Laporan           | Pelaksana                  | Export Laporan     |
| 9   | Approval Kegiatan        | Koordinator, PPK           | Review Kegiatan    |
| 10  | Monitoring Kegiatan      | Koordinator, Pimpinan      | Lihat Statistik    |
| 11  | Validasi Output          | Koordinator, Pimpinan      | Validasi Output    |
| 12  | Tambah Evaluasi          | Koordinator, Pimpinan      | Evaluasi Kinerja   |
| 13  | Lihat Laporan            | Koordinator, PPK, Pimpinan | Export Laporan     |

---

## Cara Generate Diagram

1. **Online**: https://www.plantuml.com/plantuml/uml/
2. **VS Code**: Install extension "PlantUML"
3. **Command**: `java -jar plantuml.jar file.puml`
