erDiagram
tim ||--o{ users : "has"
tim ||--o{ kegiatan : "has"

    users ||--o{ kegiatan : "creates"
    users ||--o{ dokumen_output : "uploads"
    users ||--o{ dokumen_output : "reviews_draft_kesubag"
    users ||--o{ dokumen_output : "reviews_draft_pimpinan"
    users ||--o{ evaluasi : "creates"
    users ||--o{ kendala_kegiatan : "reports"
    users ||--o{ progres_kegiatan : "creates"
    users ||--o{ realisasi_anggaran : "creates"
    users ||--o{ realisasi_fisik : "creates"
    users ||--o{ tindak_lanjut : "creates"
    users ||--o{ notifications : "receives"
    users ||--o{ upload_laporan : "uploads"

    kro ||--o{ kegiatan : "classifies"
    mitra ||--o{ kegiatan : "assigned_to"

    kegiatan ||--o{ dokumen_output : "has"
    kegiatan ||--o{ evaluasi : "has"
    kegiatan ||--o{ kendala_kegiatan : "has"
    kegiatan ||--o{ progres_kegiatan : "has"
    kegiatan ||--o{ realisasi_anggaran : "has"
    kegiatan ||--o{ realisasi_fisik : "has"

    kendala_kegiatan ||--o{ tindak_lanjut : "has"

    tim {
        int id PK
        varchar nama UK
        text deskripsi
        timestamp created_at
    }

    users {
        int id PK
        varchar username UK
        varchar email UK
        varchar nama_lengkap
        varchar password
        enum role "admin|pimpinan|pelaksana|kesubag"
        enum status "aktif|nonaktif"
        int tim_id FK
        timestamp created_at
        longtext foto
        tinyint is_first_login
    }

    kro {
        int id PK
        varchar kode UK
        varchar nama
        text deskripsi
        timestamp created_at
    }

    mitra {
        int id PK
        varchar nama
        varchar posisi
        text alamat
        enum jk "L|P"
        varchar no_telp
        varchar sobat_id
        varchar email
        timestamp created_at
    }

    kegiatan {
        int id PK
        int tim_id FK
        int kro_id FK
        int mitra_id FK
        int created_by FK
        varchar nama
        text deskripsi
        date tanggal_mulai
        date tanggal_selesai
        date tanggal_realisasi_selesai
        varchar target_output
        decimal output_realisasi
        varchar satuan_output
        decimal anggaran_pagu
        enum status "belum_mulai|berjalan|selesai|tertunda"
        enum status_verifikasi "belum_verifikasi|menunggu|valid|revisi"
        timestamp created_at
        timestamp updated_at
    }

    dokumen_output {
        int id PK
        int kegiatan_id FK
        varchar nama_file
        varchar path_file
        enum tipe_dokumen "draft|final"
        text deskripsi
        int ukuran_file
        varchar tipe_file
        int uploaded_by FK
        timestamp uploaded_at
        enum draft_status_kesubag "pending|reviewed|revisi"
        text draft_feedback_kesubag
        int draft_reviewed_by_kesubag FK
        enum validasi_kesubag "pending|valid|tidak_valid"
        enum validasi_pimpinan "pending|valid|tidak_valid"
        enum status_final "draft|menunggu_kesubag|menunggu_pimpinan|revisi|disahkan"
    }

    evaluasi {
        int id PK
        int kegiatan_id FK
        int user_id FK
        enum role_pemberi "pimpinan|kesubag"
        enum jenis_evaluasi "catatan|arahan|rekomendasi"
        text isi
        timestamp created_at
    }

    kendala_kegiatan {
        int id PK
        int kegiatan_id FK
        int user_id FK
        date tanggal_kejadian
        text deskripsi
        enum tingkat_dampak "rendah|sedang|tinggi"
        enum status "open|resolved"
        timestamp created_at
    }

    tindak_lanjut {
        int id PK
        int kendala_id FK
        int user_id FK
        date tanggal
        text deskripsi
        date batas_waktu
        enum status "direncanakan|dalam_proses|selesai"
        timestamp created_at
    }

    progres_kegiatan {
        int id PK
        int kegiatan_id FK
        int user_id FK
        date tanggal_update
        decimal capaian_output
        decimal ketepatan_waktu
        decimal kualitas_output
        text keterangan
        timestamp created_at
    }

    realisasi_anggaran {
        int id PK
        int kegiatan_id FK
        int user_id FK
        date tanggal_realisasi
        decimal jumlah
        text keterangan
        timestamp created_at
    }

    realisasi_fisik {
        int id PK
        int kegiatan_id FK
        int user_id FK
        date tanggal_realisasi
        decimal persentase
        text keterangan
        timestamp created_at
    }

    notifications {
        int id PK
        int user_id FK
        varchar title
        text message
        enum type "evaluasi|validasi|permintaan_validasi|deadline|tugas|kendala|kegiatan"
        int reference_id
        varchar reference_type
        tinyint is_read
        timestamp created_at
        timestamp read_at
    }

    notifications_read {
        int id PK
        int user_id
        varchar notification_id
        timestamp read_at
    }

    upload_laporan {
        int id PK
        int user_id FK
        varchar judul
        int periode_bulan
        int periode_tahun
        varchar file_path
        varchar file_name
        text keterangan
        timestamp created_at
        timestamp updated_at
    }
