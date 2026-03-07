# Activity Diagram (Mermaid) - SIMKINERJA

## 1. Activity Diagram Login

```mermaid
flowchart TD
    subgraph User
        A((●)) --> B[Buka Halaman Login]
        B --> C[Input Username & Password]
    end

    subgraph System
        C --> D{Validasi Kredensial}
        D -->|Valid| E[Cek Role User]
        E --> F[Redirect ke Dashboard]
        D -->|Invalid| G[Tampilkan Error]
    end

    subgraph User2[User]
        G --> H[Input Ulang Kredensial]
        H --> C
    end

    subgraph System2[System]
        F --> I[Tampilkan Dashboard]
        I --> J((◉))
    end
```

---

## 2. Activity Diagram Buat Kegiatan (Pelaksana)

```mermaid
flowchart TD
    subgraph Pelaksana
        A((●)) --> B[Pilih Menu Kegiatan]
    end

    subgraph System
        B --> C[Tampilkan Daftar Kegiatan]
    end

    subgraph Pelaksana2[Pelaksana]
        C --> D[Klik Tambah Kegiatan]
    end

    subgraph System2[System]
        D --> E[Tampilkan Form Kegiatan]
    end

    subgraph Pelaksana3[Pelaksana]
        E --> F[Isi Data Kegiatan]
        F --> G[Pilih KRO & Mitra]
        G --> H[Input Target & Anggaran]
    end

    subgraph System3[System]
        H --> I{Validasi Data}
        I -->|Valid| J[Simpan Kegiatan]
        J --> K[Set Status Draft]
        I -->|Invalid| L[Tampilkan Error]
    end

    subgraph Pelaksana4[Pelaksana]
        L --> M[Perbaiki Data]
        M --> F
    end

    subgraph System4[System]
        K --> N[Tampilkan Konfirmasi]
        N --> O((◉))
    end
```

---

## 3. Activity Diagram Input Progres (Pelaksana)

```mermaid
flowchart TD
    subgraph Pelaksana
        A((●)) --> B[Pilih Kegiatan]
    end

    subgraph System
        B --> C[Tampilkan Detail Kegiatan]
    end

    subgraph Pelaksana2[Pelaksana]
        C --> D[Klik Input Progres]
    end

    subgraph System2[System]
        D --> E[Tampilkan Form Progres]
    end

    subgraph Pelaksana3[Pelaksana]
        E --> F[Input Capaian Output]
        F --> G[Input Keterangan]
        G --> H[Upload Bukti Dokumen]
    end

    subgraph System3[System]
        H --> I{Validasi Data}
        I -->|Valid| J[Simpan Progres]
        J --> K[Update Status Kegiatan]
        K --> L[Kirim Notifikasi ke Koordinator]
        I -->|Invalid| M[Tampilkan Error]
    end

    subgraph Pelaksana4[Pelaksana]
        M --> N[Perbaiki Data]
        N --> F
    end

    subgraph System4[System]
        L --> O[Tampilkan Konfirmasi]
        O --> P((◉))
    end
```

---

## 4. Activity Diagram Ajukan Validasi (Pelaksana)

```mermaid
flowchart TD
    subgraph Pelaksana
        A((●)) --> B[Pilih Kegiatan Selesai]
    end

    subgraph System
        B --> C[Tampilkan Detail Kegiatan]
    end

    subgraph Pelaksana2[Pelaksana]
        C --> D[Klik Ajukan Validasi]
    end

    subgraph System2[System]
        D --> E{Cek Kelengkapan Dokumen}
        E -->|Lengkap| F[Tampilkan Form Validasi]
        E -->|Tidak Lengkap| G[Tampilkan Peringatan]
    end

    subgraph Pelaksana3[Pelaksana]
        G --> H[Lengkapi Dokumen]
        H --> D
        F --> I[Upload Bukti Kuantitas]
        I --> J[Input Catatan]
        J --> K[Klik Submit]
    end

    subgraph System3[System]
        K --> L[Simpan Pengajuan]
        L --> M[Set Status Menunggu Validasi]
        M --> N[Kirim Notifikasi ke Koordinator]
        N --> O[Tampilkan Konfirmasi]
        O --> P((◉))
    end
```

---

## 5. Activity Diagram Validasi Output (Koordinator)

```mermaid
flowchart TD
    subgraph Koordinator
        A((●)) --> B[Buka Menu Validasi]
    end

    subgraph System
        B --> C[Tampilkan Daftar Pengajuan]
    end

    subgraph Koordinator2[Koordinator]
        C --> D[Pilih Pengajuan]
    end

    subgraph System2[System]
        D --> E[Tampilkan Detail Kegiatan]
        E --> F[Tampilkan Dokumen & Bukti]
    end

    subgraph Koordinator3[Koordinator]
        F --> G[Review Dokumen]
        G --> H{Keputusan}
        H -->|Approve| I[Klik Approve]
        H -->|Revisi| J[Input Catatan Revisi]
        H -->|Tolak| K[Input Alasan Penolakan]
    end

    subgraph System3[System]
        I --> L[Set Status Disetujui]
        L --> M[Teruskan ke PPK]
        M --> N[Kirim Notifikasi ke PPK]
        J --> O[Set Status Perlu Revisi]
        O --> P[Kirim Notifikasi ke Pelaksana]
        K --> Q[Set Status Ditolak]
        Q --> P
        N --> R[Tampilkan Konfirmasi]
        P --> R
        R --> S((◉))
    end
```

---

## 6. Activity Diagram Verifikasi Anggaran (PPK)

```mermaid
flowchart TD
    subgraph PPK
        A((●)) --> B[Buka Menu Verifikasi]
    end

    subgraph System
        B --> C[Tampilkan Daftar Kegiatan]
    end

    subgraph PPK2[PPK]
        C --> D[Pilih Kegiatan]
    end

    subgraph System2[System]
        D --> E[Tampilkan Detail Anggaran]
        E --> F[Tampilkan Realisasi]
    end

    subgraph PPK3[PPK]
        F --> G[Review Kesesuaian Pagu]
        G --> H{Keputusan}
        H -->|Approve| I[Klik Approve]
        H -->|Revisi| J[Input Catatan Revisi]
        H -->|Tolak| K[Input Alasan Penolakan]
    end

    subgraph System3[System]
        I --> L[Set Status Disetujui PPK]
        L --> M[Teruskan ke Pimpinan]
        M --> N[Kirim Notifikasi ke Pimpinan]
        J --> O[Set Status Perlu Revisi]
        O --> P[Kirim Notifikasi ke Pelaksana]
        K --> Q[Set Status Ditolak]
        Q --> P
        N --> R[Tampilkan Konfirmasi]
        P --> R
        R --> S((◉))
    end
```

---

## 7. Activity Diagram Pengesahan Final (Pimpinan)

```mermaid
flowchart TD
    subgraph Pimpinan
        A((●)) --> B[Buka Menu Approval]
    end

    subgraph System
        B --> C[Tampilkan Daftar Kegiatan]
    end

    subgraph Pimpinan2[Pimpinan]
        C --> D[Pilih Kegiatan]
    end

    subgraph System2[System]
        D --> E[Tampilkan Detail Lengkap]
        E --> F[Tampilkan Progres & Anggaran]
    end

    subgraph Pimpinan3[Pimpinan]
        F --> G[Review Kegiatan]
        G --> H{Keputusan}
        H -->|Approve| I[Klik Approve Final]
        H -->|Tolak| J[Input Alasan Penolakan]
    end

    subgraph System3[System]
        I --> K[Set Status Disahkan]
        K --> L[Kirim Notifikasi ke Semua Pihak]
        J --> M[Set Status Ditolak]
        M --> N[Kirim Notifikasi ke Pelaksana]
        L --> O[Tampilkan Konfirmasi]
        N --> O
        O --> P((◉))
    end
```

---

## 8. Activity Diagram Evaluasi Kinerja (Pimpinan)

```mermaid
flowchart TD
    subgraph Pimpinan
        A((●)) --> B[Pilih Menu Evaluasi]
    end

    subgraph System
        B --> C[Tampilkan Daftar Kegiatan/Pegawai]
    end

    subgraph Pimpinan2[Pimpinan]
        C --> D[Pilih Kegiatan/Pegawai]
    end

    subgraph System2[System]
        D --> E[Tampilkan Statistik Kinerja]
    end

    subgraph Pimpinan3[Pimpinan]
        E --> F[Pilih Jenis Evaluasi]
        F --> G[Input Isi Evaluasi]
        G --> H[Klik Simpan]
    end

    subgraph System3[System]
        H --> I[Simpan Evaluasi]
        I --> J[Kirim Notifikasi ke Pegawai]
        J --> K[Tampilkan Konfirmasi]
        K --> L((◉))
    end
```

---

## 9. Activity Diagram Kelola Data Master (Admin)

```mermaid
flowchart TD
    subgraph Admin
        A((●)) --> B[Pilih Menu Data Master]
    end

    subgraph System
        B --> C[Tampilkan Submenu]
    end

    subgraph Admin2[Admin]
        C --> D[Pilih Jenis Data]
    end

    subgraph System2[System]
        D --> E[Tampilkan Daftar Data]
    end

    subgraph Admin3[Admin]
        E --> F{Operasi}
        F -->|Tambah| G[Klik Tambah]
        F -->|Edit| H[Pilih & Klik Edit]
        F -->|Hapus| I[Pilih & Klik Hapus]
        F -->|Lihat| J[Pilih Data]
    end

    subgraph System3[System]
        G --> K[Tampilkan Form Input]
    end

    subgraph Admin4[Admin]
        K --> L[Input Data Baru]
        L --> M[Klik Simpan]
    end

    subgraph System4[System]
        H --> N[Tampilkan Form Edit]
    end

    subgraph Admin5[Admin]
        N --> O[Ubah Data]
        O --> P[Klik Simpan]
    end

    subgraph System5[System]
        I --> Q[Tampilkan Konfirmasi Hapus]
    end

    subgraph Admin6[Admin]
        Q --> R[Konfirmasi]
    end

    subgraph System6[System]
        M --> S[Simpan ke Database]
        P --> S
        R --> T[Hapus dari Database]
        J --> U[Tampilkan Detail]
        S --> V[Tampilkan Konfirmasi]
        T --> V
        U --> V
        V --> W((◉))
    end
```

---

## 10. Activity Diagram Lapor Kendala (Pelaksana)

```mermaid
flowchart TD
    subgraph Pelaksana
        A((●)) --> B[Pilih Kegiatan]
    end

    subgraph System
        B --> C[Tampilkan Detail Kegiatan]
    end

    subgraph Pelaksana2[Pelaksana]
        C --> D[Klik Lapor Kendala]
    end

    subgraph System2[System]
        D --> E[Tampilkan Form Kendala]
    end

    subgraph Pelaksana3[Pelaksana]
        E --> F[Input Tanggal Kejadian]
        F --> G[Input Deskripsi Kendala]
        G --> H[Pilih Tingkat Dampak]
        H --> I[Klik Simpan]
    end

    subgraph System3[System]
        I --> J[Validasi Data]
        J --> K[Simpan Kendala]
        K --> L[Set Status Open]
        L --> M{Tingkat Dampak}
        M -->|Tinggi| N[Kirim Notifikasi Urgent]
        M -->|Rendah/Sedang| O[Kirim Notifikasi Normal]
        N --> P[Tampilkan Konfirmasi]
        O --> P
        P --> Q((◉))
    end
```

---

## 11. Activity Diagram Alur Approval Lengkap

```mermaid
flowchart TD
    subgraph Pelaksana
        A((●)) --> B[Buat Kegiatan]
    end

    subgraph System
        B --> C[Simpan Kegiatan]
    end

    subgraph Pelaksana2[Pelaksana]
        C --> D[Input Progres & Upload Dokumen]
        D --> E[Ajukan Validasi]
    end

    subgraph System2[System]
        E --> F[Kirim ke Koordinator]
    end

    subgraph Koordinator
        F --> G[Review Kegiatan]
        G --> H{Approve?}
    end

    subgraph System3[System]
        H -->|Ya| I[Kirim ke PPK]
        H -->|Tidak| J[Kembalikan ke Pelaksana]
    end

    subgraph PPK
        I --> K[Verifikasi Anggaran]
        K --> L{Approve?}
    end

    subgraph System4[System]
        L -->|Ya| M[Kirim ke Pimpinan]
        L -->|Tidak| N[Kembalikan ke Pelaksana]
    end

    subgraph Pimpinan
        M --> O[Pengesahan Final]
        O --> P{Approve?}
    end

    subgraph System5[System]
        P -->|Ya| Q[Set Status Disahkan]
        Q --> R[Kirim Notifikasi ke Semua]
        P -->|Tidak| S[Kegiatan Ditolak]
        J --> T[Pelaksana Revisi]
        N --> T
        R --> U((◉))
        S --> U
        T --> D
    end
```

---

## Keterangan Simbol

| Simbol         | Arti                       |
| -------------- | -------------------------- |
| `((●))`        | Start (Initial Node)       |
| `((◉))`        | End (Final Node)           |
| `[ ]`          | Activity / Action          |
| `{ }`          | Decision (Keputusan)       |
| `subgraph`     | Swimlane (pembagian aktor) |
| `-->`          | Control Flow               |
| `-->\|label\|` | Flow dengan kondisi        |
