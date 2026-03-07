# Sequence Diagram V2 - Sistem Informasi Monitoring Capaian Kinerja

Dokumen ini berisi Sequence Diagram berdasarkan Use Case dan Activity Diagram yang telah dibuat.

---

## Legenda Komponen

| Simbol      | Nama        | Keterangan            |
| ----------- | ----------- | --------------------- |
| :Actor      | Aktor       | Pengguna sistem       |
| :Boundary   | Antarmuka   | Halaman/UI sistem     |
| :Controller | Pengontrol  | Logika proses         |
| :Database   | Basis Data  | Penyimpanan data      |
| →           | Request     | Permintaan dari aktor |
| ←--         | Response    | Balasan dari sistem   |
| alt         | Alternative | Percabangan kondisi   |
| loop        | Perulangan  | Proses berulang       |

---

## 1. Login

```plantuml
@startuml SD01_Login
title Sequence Diagram: Login

actor User
boundary "Halaman Login" as UI
control "Sistem" as Ctrl
database "Database" as DB

User -> UI : Buka halaman login
UI --> User : Tampilkan form login

User -> UI : Input username dan password
User -> UI : Klik tombol login
UI -> Ctrl : Kirim data login

Ctrl -> DB : Cek data pengguna
DB --> Ctrl : Data pengguna

alt Data Valid
    Ctrl --> UI : Login berhasil
    UI --> User : Tampilkan dashboard
else Data Tidak Valid
    Ctrl --> UI : Login gagal
    UI --> User : Tampilkan pesan error
end

@enduml
```

**Aktor:** Admin, Koordinator, PPK, Pimpinan, Pelaksana

---

## 2. Kelola Data Pengguna

```plantuml
@startuml SD02_Kelola_Pengguna
title Sequence Diagram: Kelola Data Pengguna

actor Admin
boundary "Halaman Pengguna" as UI
control "Sistem" as Ctrl
database "Database" as DB

Admin -> UI : Buka menu pengguna
UI -> Ctrl : Request daftar pengguna
Ctrl -> DB : Query data pengguna
DB --> Ctrl : Data pengguna
Ctrl --> UI : Data pengguna
UI --> Admin : Tampilkan daftar pengguna

alt Tambah Pengguna
    Admin -> UI : Klik tambah pengguna
    Admin -> UI : Isi data pengguna
    Admin -> UI : Klik simpan
    UI -> Ctrl : Kirim data pengguna
    Ctrl -> DB : Simpan data pengguna
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Admin : Tampilkan notifikasi sukses

else Edit Pengguna
    Admin -> UI : Klik edit pengguna
    Admin -> UI : Ubah data pengguna
    Admin -> UI : Klik update
    UI -> Ctrl : Kirim data perubahan
    Ctrl -> DB : Update data pengguna
    DB --> Ctrl : Konfirmasi update
    Ctrl --> UI : Berhasil
    UI --> Admin : Tampilkan notifikasi sukses

else Hapus Pengguna
    Admin -> UI : Klik hapus pengguna
    UI --> Admin : Tampilkan konfirmasi
    Admin -> UI : Konfirmasi hapus
    UI -> Ctrl : Request hapus
    Ctrl -> DB : Hapus data pengguna
    DB --> Ctrl : Konfirmasi hapus
    Ctrl --> UI : Berhasil
    UI --> Admin : Tampilkan notifikasi sukses
end

@enduml
```

**Aktor:** Admin

---

## 3. Kelola Data Master

```plantuml
@startuml SD03_Kelola_Master
title Sequence Diagram: Kelola Data Master

actor Admin
boundary "Halaman Master" as UI
control "Sistem" as Ctrl
database "Database" as DB

Admin -> UI : Pilih menu master data
UI --> Admin : Tampilkan pilihan data master

Admin -> UI : Pilih jenis data
UI -> Ctrl : Request daftar data
Ctrl -> DB : Query data
DB --> Ctrl : Data master
Ctrl --> UI : Data master
UI --> Admin : Tampilkan daftar data

alt Tambah Data
    Admin -> UI : Klik tambah
    Admin -> UI : Isi data baru
    Admin -> UI : Klik simpan
    UI -> Ctrl : Kirim data baru
    Ctrl -> DB : Simpan data
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Admin : Tampilkan notifikasi sukses

else Edit Data
    Admin -> UI : Klik edit
    Admin -> UI : Ubah data
    Admin -> UI : Klik update
    UI -> Ctrl : Kirim perubahan
    Ctrl -> DB : Update data
    DB --> Ctrl : Konfirmasi update
    Ctrl --> UI : Berhasil
    UI --> Admin : Tampilkan notifikasi sukses

else Hapus Data
    Admin -> UI : Klik hapus
    Admin -> UI : Konfirmasi hapus
    UI -> Ctrl : Request hapus
    Ctrl -> DB : Hapus data
    DB --> Ctrl : Konfirmasi hapus
    Ctrl --> UI : Berhasil
    UI --> Admin : Tampilkan notifikasi sukses
end

@enduml
```

**Aktor:** Admin

---

## 4. Tambah Kegiatan

```plantuml
@startuml SD04_Tambah_Kegiatan
title Sequence Diagram: Tambah Kegiatan

actor Pelaksana
boundary "Halaman Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

Pelaksana -> UI : Buka menu kegiatan
UI -> Ctrl : Request daftar kegiatan
Ctrl -> DB : Query kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> Pelaksana : Tampilkan daftar kegiatan

Pelaksana -> UI : Klik tambah kegiatan
UI --> Pelaksana : Tampilkan form kegiatan

Pelaksana -> UI : Isi form kegiatan
Pelaksana -> UI : Pilih KRO dan mitra
Pelaksana -> UI : Klik simpan
UI -> Ctrl : Kirim data kegiatan

Ctrl -> DB : Validasi data
alt Data Valid
    Ctrl -> DB : Simpan kegiatan
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Pelaksana : Tampilkan notifikasi sukses
else Data Tidak Valid
    Ctrl --> UI : Error validasi
    UI --> Pelaksana : Tampilkan pesan error
end

@enduml
```

**Aktor:** Pelaksana

---

## 5. Ajukan Approval Kegiatan

```plantuml
@startuml SD05_Ajukan_Approval
title Sequence Diagram: Ajukan Approval Kegiatan

actor Pelaksana
boundary "Halaman Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

Pelaksana -> UI : Buka daftar kegiatan
UI -> Ctrl : Request daftar kegiatan
Ctrl -> DB : Query kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> Pelaksana : Tampilkan daftar kegiatan

Pelaksana -> UI : Pilih kegiatan
Pelaksana -> UI : Klik ajukan approval
UI -> Ctrl : Request pengajuan

Ctrl -> DB : Cek kelengkapan data
alt Data Lengkap
    Ctrl -> DB : Update status kegiatan
    DB --> Ctrl : Konfirmasi update
    Ctrl -> DB : Simpan notifikasi
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Pelaksana : Tampilkan notifikasi sukses
else Data Belum Lengkap
    Ctrl --> UI : Data belum lengkap
    UI --> Pelaksana : Tampilkan pesan warning
end

@enduml
```

**Aktor:** Pelaksana

---

## 6. Update Progres

```plantuml
@startuml SD06_Update_Progres
title Sequence Diagram: Update Progres

actor Pelaksana
boundary "Halaman Detail Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

Pelaksana -> UI : Buka detail kegiatan
UI -> Ctrl : Request detail kegiatan
Ctrl -> DB : Query detail kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> Pelaksana : Tampilkan detail kegiatan

Pelaksana -> UI : Klik tambah progres
UI --> Pelaksana : Tampilkan form progres

Pelaksana -> UI : Input persentase capaian
Pelaksana -> UI : Input keterangan
Pelaksana -> UI : Klik simpan
UI -> Ctrl : Kirim data progres

alt Data Valid
    Ctrl -> DB : Simpan data progres
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Pelaksana : Tampilkan notifikasi sukses
else Data Tidak Valid
    Ctrl --> UI : Error validasi
    UI --> Pelaksana : Tampilkan pesan error
end

@enduml
```

**Aktor:** Pelaksana

---

## 7. Ajukan Validasi Output

```plantuml
@startuml SD07_Ajukan_Validasi
title Sequence Diagram: Ajukan Validasi Output

actor Pelaksana
boundary "Halaman Detail Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

Pelaksana -> UI : Buka detail kegiatan
UI -> Ctrl : Request detail kegiatan
Ctrl -> DB : Query detail kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> Pelaksana : Tampilkan detail kegiatan

Pelaksana -> UI : Input jumlah output
Pelaksana -> UI : Upload bukti dukung
Pelaksana -> UI : Klik ajukan validasi
UI -> Ctrl : Kirim data output

Ctrl -> DB : Cek kelengkapan data
alt Data Lengkap
    Ctrl -> DB : Simpan data output
    DB --> Ctrl : Konfirmasi simpan
    Ctrl -> DB : Simpan notifikasi
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Pelaksana : Tampilkan notifikasi sukses
else Data Belum Lengkap
    Ctrl --> UI : Data belum lengkap
    UI --> Pelaksana : Tampilkan pesan warning
end

@enduml
```

**Aktor:** Pelaksana

---

## 8. Unggah Laporan

```plantuml
@startuml SD08_Unggah_Laporan
title Sequence Diagram: Unggah Laporan

actor Pelaksana
boundary "Halaman Laporan" as UI
control "Sistem" as Ctrl
database "Database" as DB

Pelaksana -> UI : Buka menu laporan
Pelaksana -> UI : Klik upload laporan
UI --> Pelaksana : Tampilkan form upload

Pelaksana -> UI : Input judul dan periode
Pelaksana -> UI : Pilih file laporan
Pelaksana -> UI : Klik upload
UI -> Ctrl : Kirim file dan data

Ctrl -> Ctrl : Validasi file
alt File Valid
    Ctrl -> DB : Simpan file laporan
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> Pelaksana : Tampilkan notifikasi sukses
else File Tidak Valid
    Ctrl --> UI : Error validasi
    UI --> Pelaksana : Tampilkan pesan error
end

@enduml
```

**Aktor:** Pelaksana

---

## 9. Approval Kegiatan

```plantuml
@startuml SD09_Approval_Kegiatan
title Sequence Diagram: Approval Kegiatan

actor "Koordinator/PPK" as User
boundary "Halaman Approval" as UI
control "Sistem" as Ctrl
database "Database" as DB

User -> UI : Buka menu approval
UI -> Ctrl : Request daftar kegiatan
Ctrl -> DB : Query kegiatan diajukan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> User : Tampilkan daftar kegiatan

User -> UI : Pilih kegiatan
UI -> Ctrl : Request detail kegiatan
Ctrl -> DB : Query detail kegiatan
DB --> Ctrl : Data detail
Ctrl --> UI : Data detail
UI --> User : Tampilkan detail kegiatan

User -> UI : Review kegiatan

alt Setujui
    User -> UI : Klik setujui
    User -> UI : Input catatan
    UI -> Ctrl : Kirim persetujuan
    Ctrl -> DB : Update status kegiatan
    DB --> Ctrl : Konfirmasi update
    Ctrl -> DB : Simpan notifikasi
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> User : Tampilkan notifikasi sukses

else Tolak
    User -> UI : Klik tolak
    User -> UI : Input alasan penolakan
    UI -> Ctrl : Kirim penolakan
    Ctrl -> DB : Update status ditolak
    DB --> Ctrl : Konfirmasi update
    Ctrl -> DB : Simpan notifikasi
    DB --> Ctrl : Konfirmasi simpan
    Ctrl --> UI : Berhasil
    UI --> User : Tampilkan notifikasi sukses
end

@enduml
```

**Aktor:** Koordinator, PPK

---

## 10. Monitoring Kegiatan

```plantuml
@startuml SD10_Monitoring
title Sequence Diagram: Monitoring Kegiatan

actor "Koordinator/Pimpinan" as User
boundary "Halaman Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

User -> UI : Buka menu kegiatan
UI -> Ctrl : Request daftar kegiatan
Ctrl -> DB : Query daftar kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> User : Tampilkan daftar kegiatan

User -> UI : Pilih kegiatan
UI -> Ctrl : Request detail kegiatan
Ctrl -> DB : Query detail kegiatan
DB --> Ctrl : Data detail
Ctrl --> UI : Data detail
UI --> User : Tampilkan detail kegiatan

User -> User : Lihat informasi kegiatan

@enduml
```

**Aktor:** Koordinator, Pimpinan

---

## 11. Validasi Output

```plantuml
@startuml SD11_Validasi_Output
title Sequence Diagram: Validasi Output

actor "Koordinator/Pimpinan" as User
boundary "Halaman Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

User -> UI : Buka menu kegiatan
UI -> Ctrl : Request daftar kegiatan
Ctrl -> DB : Query daftar kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> User : Tampilkan daftar kegiatan

User -> UI : Pilih kegiatan
UI -> Ctrl : Request detail kegiatan
Ctrl -> DB : Query detail kegiatan
DB --> Ctrl : Data detail
Ctrl --> UI : Data detail
UI --> User : Tampilkan detail kegiatan

User -> UI : Klik tab validasi output
UI -> Ctrl : Request data output
Ctrl -> DB : Query data output
DB --> Ctrl : Data output
Ctrl --> UI : Data output
UI --> User : Tampilkan bukti dan jumlah output

User -> UI : Review output

alt Output Valid
    User -> UI : Klik tombol valid
    User -> UI : Input catatan
    UI -> Ctrl : Kirim validasi
    Ctrl -> DB : Update status output
    DB --> Ctrl : Konfirmasi update
    Ctrl --> UI : Berhasil
    UI --> User : Tampilkan notifikasi sukses

else Output Tidak Valid
    User -> UI : Klik tidak valid
    User -> UI : Input alasan penolakan
    UI -> Ctrl : Kirim penolakan
    Ctrl -> DB : Update status ditolak
    DB --> Ctrl : Konfirmasi update
    Ctrl --> UI : Berhasil
    UI --> User : Tampilkan notifikasi sukses
end

@enduml
```

**Aktor:** Koordinator, Pimpinan

---

## 12. Tambah Evaluasi

```plantuml
@startuml SD12_Tambah_Evaluasi
title Sequence Diagram: Tambah Evaluasi

actor "Koordinator/Pimpinan" as User
boundary "Halaman Kegiatan" as UI
control "Sistem" as Ctrl
database "Database" as DB

User -> UI : Buka menu kegiatan
UI -> Ctrl : Request daftar kegiatan
Ctrl -> DB : Query daftar kegiatan
DB --> Ctrl : Data kegiatan
Ctrl --> UI : Data kegiatan
UI --> User : Tampilkan daftar kegiatan

User -> UI : Pilih kegiatan
UI -> Ctrl : Request detail kegiatan
Ctrl -> DB : Query detail kegiatan
DB --> Ctrl : Data detail
Ctrl --> UI : Data detail
UI --> User : Tampilkan detail kegiatan

User -> UI : Klik tab evaluasi
UI -> Ctrl : Request data evaluasi
Ctrl -> DB : Query data evaluasi
DB --> Ctrl : Data evaluasi
Ctrl --> UI : Data evaluasi
UI --> User : Tampilkan daftar evaluasi

User -> UI : Klik tambah evaluasi
User -> UI : Pilih jenis evaluasi
User -> UI : Input isi evaluasi
User -> UI : Klik simpan
UI -> Ctrl : Kirim data evaluasi

Ctrl -> DB : Simpan data evaluasi
DB --> Ctrl : Konfirmasi simpan
Ctrl --> UI : Berhasil
UI --> User : Tampilkan notifikasi sukses

@enduml
```

**Aktor:** Koordinator, Pimpinan

---

## 13. Lihat Laporan

```plantuml
@startuml SD13_Lihat_Laporan
title Sequence Diagram: Lihat Laporan

actor User
boundary "Halaman Laporan" as UI
control "Sistem" as Ctrl
database "Database" as DB

User -> UI : Buka menu laporan
User -> UI : Pilih filter periode
UI -> Ctrl : Request daftar laporan
Ctrl -> DB : Query laporan
DB --> Ctrl : Data laporan
Ctrl --> UI : Data laporan
UI --> User : Tampilkan daftar laporan

alt Lihat Detail
    User -> UI : Klik laporan
    UI -> Ctrl : Request detail laporan
    Ctrl -> DB : Query detail laporan
    DB --> Ctrl : Data detail
    Ctrl --> UI : Data detail
    UI --> User : Tampilkan detail laporan

else Download
    User -> UI : Klik download
    UI -> Ctrl : Request file laporan
    Ctrl -> DB : Ambil file laporan
    DB --> Ctrl : File laporan
    Ctrl --> UI : File laporan
    UI --> User : Download file

else Export
    User -> UI : Pilih format export
    UI -> Ctrl : Request export
    Ctrl -> DB : Query data laporan
    DB --> Ctrl : Data laporan
    Ctrl -> Ctrl : Generate file
    Ctrl --> UI : File hasil export
    UI --> User : Download file
end

@enduml
```

**Aktor:** Koordinator, PPK, Pimpinan

---

## Ringkasan Sequence Diagram

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
