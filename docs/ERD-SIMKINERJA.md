# Entity Relationship Diagram (ERD) - SIMKINERJA

## ERD Mermaid

```mermaid
erDiagram
    tim ||--o{ users : memiliki
    tim ||--o{ kegiatan_operasional : memiliki
    users ||--o{ kegiatan_operasional : membuat
    users ||--o{ dokumen_output : upload
    users ||--o{ progres_kegiatan : input
    users ||--o{ realisasi_anggaran : input
    users ||--o{ evaluasi_pimpinan : beri
    users ||--o{ kendala_kegiatan : lapor
    users ||--o{ tindak_lanjut : buat
    users ||--o{ notifications : terima
    users ||--o{ upload_laporan : upload
    kro ||--o{ kegiatan_operasional : klasifikasi
    mitra ||--o{ kegiatan_operasional : tugaskan
    kegiatan_operasional ||--o{ dokumen_output : punya
    kegiatan_operasional ||--o{ progres_kegiatan : punya
    kegiatan_operasional ||--o{ realisasi_anggaran : punya
    kegiatan_operasional ||--o{ evaluasi_pimpinan : punya
    kegiatan_operasional ||--o{ kendala_kegiatan : punya
    kendala_kegiatan ||--o{ tindak_lanjut : punya

    tim {
        int id PK
        varchar nama
    }

    users {
        int id PK
        varchar username
        varchar email
        enum role
        int tim_id FK
    }

    kro {
        int id PK
        varchar kode
        varchar nama
    }

    mitra {
        int id PK
        varchar nama
        varchar posisi
    }

    kegiatan_operasional {
        int id PK
        int tim_id FK
        int kro_id FK
        int mitra_id FK
        int created_by FK
        varchar nama
        date tanggal_mulai
        date tanggal_selesai
        decimal anggaran_pagu
        enum status
        enum status_verifikasi
    }

    dokumen_output {
        int id PK
        int kegiatan_id FK
        int uploaded_by FK
        varchar nama_file
        enum status_review
    }

    progres_kegiatan {
        int id PK
        int kegiatan_operasional_id FK
        int user_id FK
        decimal capaian_output
        decimal ketepatan_waktu
    }

    realisasi_anggaran {
        int id PK
        int kegiatan_operasional_id FK
        int user_id FK
        decimal jumlah
    }

    evaluasi_pimpinan {
        int id PK
        int kegiatan_id FK
        int user_id FK
        enum jenis_evaluasi
        text isi
    }

    kendala_kegiatan {
        int id PK
        int kegiatan_operasional_id FK
        int user_id FK
        enum tingkat_dampak
        enum status
    }

    tindak_lanjut {
        int id PK
        int kendala_id FK
        int user_id FK
        enum status
    }

    notifications {
        int id PK
        int user_id FK
        enum type
        tinyint is_read
    }

    upload_laporan {
        int id PK
        int user_id FK
        varchar judul
        int periode_bulan
    }
```

---

## Ringkasan Relasi

| Entitas Utama            | Relasi ke                                                     |
| ------------------------ | ------------------------------------------------------------- |
| **tim**                  | users, kegiatan_operasional                                   |
| **users**                | kegiatan, dokumen, progres, realisasi, evaluasi, kendala, dll |
| **kro**                  | kegiatan_operasional                                          |
| **mitra**                | kegiatan_operasional                                          |
| **kegiatan_operasional** | dokumen, progres, realisasi, evaluasi, kendala                |
| **kendala_kegiatan**     | tindak_lanjut                                                 |

---

## Daftar 14 Entitas

| No  | Entitas              | Deskripsi Singkat                   |
| --- | -------------------- | ----------------------------------- |
| 1   | tim                  | Tim/bagian organisasi               |
| 2   | users                | Pengguna (admin/pimpinan/pelaksana) |
| 3   | kro                  | Klasifikasi Rincian Output          |
| 4   | mitra                | Mitra statistik                     |
| 5   | kegiatan_operasional | Kegiatan utama sistem               |
| 6   | dokumen_output       | Dokumen output kegiatan             |
| 7   | progres_kegiatan     | Progres pelaksanaan                 |
| 8   | realisasi_anggaran   | Realisasi anggaran                  |
| 9   | evaluasi_pimpinan    | Evaluasi dari pimpinan              |
| 10  | kendala_kegiatan     | Kendala yang dihadapi               |
| 11  | tindak_lanjut        | Tindak lanjut kendala               |
| 12  | notifications        | Notifikasi sistem                   |
| 13  | upload_laporan       | Upload laporan kinerja              |

---

## Keterangan

| Simbol     | Arti              |
| ---------- | ----------------- |
| PK         | Primary Key       |
| FK         | Foreign Key       |
| `\|\|--o{` | One-to-Many (1:N) |
