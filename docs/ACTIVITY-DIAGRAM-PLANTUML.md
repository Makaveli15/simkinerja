# Activity Diagram (PlantUML) - SIMKINERJA

## 1. Activity Diagram Login

```plantuml
@startuml
|User|
start
:Buka Halaman Login;

|System|
:Tampilkan Form Login;

|User|
:Input Username & Password;

|System|
:Validasi Kredensial;
if (Valid?) then (Ya)
  :Cek Role User;
  :Redirect ke Dashboard;
else (Tidak)
  :Tampilkan Pesan Error;
  |User|
  :Input Ulang Kredensial;
endif

|System|
:Tampilkan Dashboard;
stop
@enduml
```

---

## 2. Activity Diagram Buat Kegiatan (Pelaksana)

```plantuml
@startuml
|Pelaksana|
start
:Pilih Menu Kegiatan;

|System|
:Tampilkan Daftar Kegiatan;

|Pelaksana|
:Klik Tambah Kegiatan;

|System|
:Tampilkan Form Kegiatan;

|Pelaksana|
:Isi Data Kegiatan;
:Pilih KRO;
:Pilih Mitra;
:Input Target & Anggaran;

|System|
:Validasi Data;
if (Valid?) then (Ya)
  :Simpan Kegiatan;
  :Set Status Draft;
else (Tidak)
  :Tampilkan Error;
  |Pelaksana|
  :Perbaiki Data;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 3. Activity Diagram Input Progres (Pelaksana)

```plantuml
@startuml
|Pelaksana|
start
:Pilih Kegiatan;

|System|
:Tampilkan Detail Kegiatan;

|Pelaksana|
:Klik Input Progres;

|System|
:Tampilkan Form Progres;

|Pelaksana|
:Input Capaian Output;
:Input Keterangan;
:Upload Bukti Dokumen;

|System|
:Validasi Data;
if (Valid?) then (Ya)
  :Simpan Progres;
  :Update Status Kegiatan;
  :Kirim Notifikasi ke Koordinator;
else (Tidak)
  :Tampilkan Error;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 4. Activity Diagram Ajukan Validasi (Pelaksana)

```plantuml
@startuml
|Pelaksana|
start
:Pilih Kegiatan Selesai;

|System|
:Tampilkan Detail Kegiatan;

|Pelaksana|
:Klik Ajukan Validasi;

|System|
:Cek Kelengkapan Dokumen;
if (Lengkap?) then (Ya)
  :Tampilkan Form Validasi;
  |Pelaksana|
  :Upload Bukti Kuantitas;
  :Input Catatan;
  :Klik Submit;
  |System|
  :Simpan Pengajuan;
  :Set Status Menunggu Validasi;
  :Kirim Notifikasi ke Koordinator;
else (Tidak)
  :Tampilkan Peringatan;
  |Pelaksana|
  :Lengkapi Dokumen;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 5. Activity Diagram Validasi Output (Koordinator)

```plantuml
@startuml
|Koordinator|
start
:Buka Menu Validasi;

|System|
:Tampilkan Daftar Pengajuan;

|Koordinator|
:Pilih Pengajuan;

|System|
:Tampilkan Detail Kegiatan;
:Tampilkan Dokumen Output;
:Tampilkan Bukti Kuantitas;

|Koordinator|
:Review Dokumen;
if (Keputusan?) then (Approve)
  :Klik Approve;
  |System|
  :Set Status Disetujui;
  :Teruskan ke PPK;
  :Kirim Notifikasi ke PPK;
else if (Revisi) then (Revisi)
  :Input Catatan Revisi;
  |System|
  :Set Status Perlu Revisi;
  :Kirim Notifikasi ke Pelaksana;
else (Tolak)
  :Input Alasan Penolakan;
  |System|
  :Set Status Ditolak;
  :Kirim Notifikasi ke Pelaksana;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 6. Activity Diagram Verifikasi Anggaran (PPK)

```plantuml
@startuml
|PPK|
start
:Buka Menu Verifikasi;

|System|
:Tampilkan Daftar Kegiatan;

|PPK|
:Pilih Kegiatan;

|System|
:Tampilkan Detail Anggaran;
:Tampilkan Realisasi;

|PPK|
:Review Kesesuaian Pagu;
if (Keputusan?) then (Approve)
  :Klik Approve;
  |System|
  :Set Status Disetujui PPK;
  :Teruskan ke Pimpinan;
  :Kirim Notifikasi ke Pimpinan;
else if (Revisi) then (Revisi)
  :Input Catatan Revisi;
  |System|
  :Set Status Perlu Revisi;
  :Kirim Notifikasi ke Pelaksana;
else (Tolak)
  :Input Alasan Penolakan;
  |System|
  :Set Status Ditolak;
  :Kirim Notifikasi ke Pelaksana;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 7. Activity Diagram Pengesahan Final (Pimpinan)

```plantuml
@startuml
|Pimpinan|
start
:Buka Menu Approval;

|System|
:Tampilkan Daftar Kegiatan;

|Pimpinan|
:Pilih Kegiatan;

|System|
:Tampilkan Detail Lengkap;
:Tampilkan Progres & Output;
:Tampilkan Realisasi Anggaran;

|Pimpinan|
:Review Kegiatan;
if (Keputusan?) then (Approve)
  :Klik Approve Final;
  |System|
  :Set Status Disahkan;
  :Kirim Notifikasi ke Semua Pihak;
else (Tolak)
  :Input Alasan Penolakan;
  |System|
  :Set Status Ditolak;
  :Kirim Notifikasi ke Pelaksana;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 8. Activity Diagram Evaluasi Kinerja (Pimpinan)

```plantuml
@startuml
|Pimpinan|
start
:Pilih Menu Evaluasi;

|System|
:Tampilkan Daftar Kegiatan/Pegawai;

|Pimpinan|
:Pilih Kegiatan/Pegawai;

|System|
:Tampilkan Statistik Kinerja;

|Pimpinan|
:Pilih Jenis Evaluasi;
:Input Isi Evaluasi;
:Klik Simpan;

|System|
:Simpan Evaluasi;
:Kirim Notifikasi ke Pegawai;

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 9. Activity Diagram Kelola Data Master (Admin)

```plantuml
@startuml
|Admin|
start
:Pilih Menu Data Master;

|System|
:Tampilkan Submenu Data Master;

|Admin|
:Pilih Jenis Data;

|System|
:Tampilkan Daftar Data;

|Admin|
if (Operasi?) then (Tambah)
  :Klik Tambah;
  |System|
  :Tampilkan Form Input;
  |Admin|
  :Input Data Baru;
  :Klik Simpan;
  |System|
  :Simpan ke Database;
else if (Edit) then (Edit)
  :Pilih Data;
  :Klik Edit;
  |System|
  :Tampilkan Form Edit;
  |Admin|
  :Ubah Data;
  :Klik Simpan;
  |System|
  :Update Database;
else if (Hapus) then (Hapus)
  :Pilih Data;
  :Klik Hapus;
  |System|
  :Tampilkan Konfirmasi;
  |Admin|
  :Konfirmasi Hapus;
  |System|
  :Hapus dari Database;
else (Lihat)
  :Pilih Data;
  |System|
  :Tampilkan Detail;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 10. Activity Diagram Lapor Kendala (Pelaksana)

```plantuml
@startuml
|Pelaksana|
start
:Pilih Kegiatan;

|System|
:Tampilkan Detail Kegiatan;

|Pelaksana|
:Klik Lapor Kendala;

|System|
:Tampilkan Form Kendala;

|Pelaksana|
:Input Tanggal Kejadian;
:Input Deskripsi Kendala;
:Pilih Tingkat Dampak;
:Klik Simpan;

|System|
:Validasi Data;
:Simpan Kendala;
:Set Status Open;
if (Tingkat Dampak?) then (Tinggi)
  :Kirim Notifikasi Urgent;
else (Rendah/Sedang)
  :Kirim Notifikasi Normal;
endif

|System|
:Tampilkan Konfirmasi;
stop
@enduml
```

---

## 11. Activity Diagram Alur Approval Lengkap

```plantuml
@startuml
|Pelaksana|
start
:Buat Kegiatan;

|System|
:Simpan Kegiatan;

|Pelaksana|
:Input Progres;
:Upload Dokumen;

|System|
:Simpan Progres & Dokumen;

|Pelaksana|
:Ajukan Validasi;

|System|
:Kirim ke Koordinator;

|Koordinator|
:Review Kegiatan;
if (Approve?) then (Ya)
  |System|
  :Kirim ke PPK;
  |PPK|
  :Verifikasi Anggaran;
  if (Approve?) then (Ya)
    |System|
    :Kirim ke Pimpinan;
    |Pimpinan|
    :Pengesahan Final;
    if (Approve?) then (Ya)
      |System|
      :Set Status Disahkan;
      :Kirim Notifikasi ke Semua;
    else (Tidak)
      :Kegiatan Ditolak;
    endif
  else (Tidak)
    |System|
    :Kembalikan ke Pelaksana;
  endif
else (Tidak)
  |System|
  :Kembalikan ke Pelaksana;
endif
stop
@enduml
```

---

## Cara Melihat Diagram

1. Copy kode PlantUML di atas
2. Buka [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
3. Paste kode untuk melihat visualisasi diagram

---

## Keterangan Simbol PlantUML

| Simbol                     | Arti                       |
| -------------------------- | -------------------------- |
| `start`                    | Titik awal (Initial Node)  |
| `stop`                     | Titik akhir (Final Node)   |
| `:text;`                   | Activity / Action          |
| `if...then...else...endif` | Decision (Keputusan)       |
| `\|Swimlane\|`             | Swimlane (pembagian aktor) |
| `-->`                      | Control Flow               |
