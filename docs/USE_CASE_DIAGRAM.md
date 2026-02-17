# Use Case Diagram - Sistem Informasi Monitoring Kinerja

Dokumen ini berisi Use Case Diagram untuk **Sistem Informasi Monitoring Kinerja (SIMKINERJA)**.

---

## Diagram Use Case Sistem

```plantuml
@startuml

left to right direction
skinparam packageStyle rectangle

actor Pelaksana
actor Koordinator
actor PPK
actor Pimpinan
actor Admin

rectangle "Sistem Informasi Monitoring Kinerja (SIMKINERJA)" {
    usecase "Login" as UC1
    usecase "Kelola Profil" as UC2
    usecase "Lihat Dashboard" as UC3
    usecase "Kelola Kegiatan" as UC4
    usecase "Input Output" as UC5
    usecase "Ajukan Validasi" as UC6
    usecase "Review Kegiatan" as UC7
    usecase "Validasi Output" as UC8
    usecase "Pengesahan Final" as UC9
    usecase "Lihat Statistik" as UC10
    usecase "Export Laporan" as UC11
    usecase "Evaluasi Kinerja" as UC12
    usecase "Kelola Data Master" as UC13
}

Pelaksana --> UC1
Pelaksana --> UC2
Pelaksana --> UC3
Pelaksana --> UC4
Pelaksana --> UC5
Pelaksana --> UC6
Pelaksana --> UC11

Koordinator --> UC1
Koordinator --> UC2
Koordinator --> UC3
Koordinator --> UC7
Koordinator --> UC8
Koordinator --> UC10
Koordinator --> UC11

PPK --> UC1
PPK --> UC2
PPK --> UC3
PPK --> UC7
PPK --> UC8
PPK --> UC10
PPK --> UC11

Pimpinan --> UC1
Pimpinan --> UC2
Pimpinan --> UC3
Pimpinan --> UC9
Pimpinan --> UC10
Pimpinan --> UC11
Pimpinan --> UC12

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC13

UC4 ..> UC5 : <<include>>
UC5 ..> UC6 : <<include>>
UC8 ..> UC9 : <<include>>

@enduml
```

**Cara Melihat Diagram:**

1. Copy kode PlantUML di atas
2. Buka [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
3. Paste kode untuk melihat visualisasi diagram

---

## Deskripsi Aktor

| No  | Aktor           | Deskripsi                                             |
| --- | --------------- | ----------------------------------------------------- |
| 1   | **Pelaksana**   | Staf yang melaksanakan kegiatan operasional           |
| 2   | **Koordinator** | Pejabat yang mengkoordinir dan mereview kegiatan tim  |
| 3   | **PPK**         | Pejabat Pembuat Komitmen yang mereview aspek anggaran |
| 4   | **Pimpinan**    | Kepala unit yang memberikan pengesahan final          |
| 5   | **Admin**       | Administrator sistem yang mengelola data master       |

---

## Deskripsi Use Case

| Kode | Use Case           | Deskripsi                                       | Aktor                                 |
| ---- | ------------------ | ----------------------------------------------- | ------------------------------------- |
| UC1  | Login              | Masuk ke sistem                                 | Semua                                 |
| UC2  | Kelola Profil      | Mengubah informasi profil pengguna              | Semua                                 |
| UC3  | Lihat Dashboard    | Melihat ringkasan statistik                     | Semua                                 |
| UC4  | Kelola Kegiatan    | Membuat, edit, hapus, dan ajukan kegiatan       | Pelaksana                             |
| UC5  | Input Output       | Memasukkan kuantitas atau upload dokumen output | Pelaksana                             |
| UC6  | Ajukan Validasi    | Mengajukan output untuk divalidasi              | Pelaksana                             |
| UC7  | Review Kegiatan    | Mereview dan setujui/tolak pengajuan kegiatan   | Koordinator, PPK                      |
| UC8  | Validasi Output    | Memvalidasi output yang dilaporkan              | Koordinator, PPK                      |
| UC9  | Pengesahan Final   | Memberikan pengesahan akhir atas output         | Pimpinan                              |
| UC10 | Lihat Statistik    | Melihat grafik dan analisis kinerja             | Koordinator, PPK, Pimpinan            |
| UC11 | Export Laporan     | Mengunduh laporan Excel/PDF                     | Pelaksana, Koordinator, PPK, Pimpinan |
| UC12 | Evaluasi Kinerja   | Memberikan evaluasi kinerja pelaksana           | Pimpinan                              |
| UC13 | Kelola Data Master | Mengelola pengguna, tim, KRO, mitra             | Admin                                 |

---

## Relasi Include

| Use Case Utama  | Include          | Keterangan                                        |
| --------------- | ---------------- | ------------------------------------------------- |
| Kelola Kegiatan | Input Output     | Setelah kegiatan dibuat, pelaksana input output   |
| Input Output    | Ajukan Validasi  | Output yang sudah diinput perlu diajukan validasi |
| Validasi Output | Pengesahan Final | Output yang valid perlu disahkan pimpinan         |
