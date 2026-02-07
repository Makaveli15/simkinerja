# Dokumentasi Sistem Multi-Level Approval

## Gambaran Umum

Sistem SIMKINERJA telah diperbarui untuk mendukung alur persetujuan multi-level yang baru. Perubahan utama adalah:

1. **Kesubag** diganti menjadi **Koordinator** (per tim)
2. Ditambahkan role baru **PPK** (Pejabat Pembuat Keputusan)
3. Alur persetujuan menjadi 4 level: **Pelaksana → Koordinator → PPK → Kepala**

## Alur Persetujuan Baru

```
┌─────────────┐     ┌──────────────┐     ┌─────────┐     ┌────────┐
│  Pelaksana  │────►│  Koordinator │────►│   PPK   │────►│ Kepala │
│  (Submit)   │     │  (Review 1)  │     │(Review 2│     │(Final) │
└─────────────┘     └──────────────┘     └─────────┘     └────────┘
      │                    │                  │              │
      │                    ▼                  ▼              ▼
      │              ┌──────────┐       ┌──────────┐   ┌──────────┐
      │              │ Approve/ │       │ Approve/ │   │ Approve/ │
      │              │ Reject/  │       │ Reject/  │   │ Reject/  │
      │              │ Revisi   │       │ Revisi   │   │ Revisi   │
      │              └──────────┘       └──────────┘   └──────────┘
      │                    │                  │              │
      └────────────────────┴──────────────────┴──────────────┘
                           Revisi ke Pelaksana
```

## Status Pengajuan

| Status               | Deskripsi                                        |
| -------------------- | ------------------------------------------------ |
| `draft`              | Kegiatan belum diajukan                          |
| `diajukan`           | Pelaksana mengajukan kegiatan                    |
| `review_koordinator` | Menunggu review dari Koordinator tim             |
| `review_ppk`         | Menunggu review dari PPK                         |
| `review_kepala`      | Menunggu persetujuan final dari Kepala           |
| `disetujui`          | Kegiatan disetujui, status berubah ke 'berjalan' |
| `ditolak`            | Kegiatan ditolak                                 |
| `revisi`             | Kegiatan dikembalikan untuk diperbaiki           |

## Role dan Tanggung Jawab

### 1. Pelaksana

- Membuat dan mengelola kegiatan operasional
- Mengajukan kegiatan untuk persetujuan
- Melakukan revisi jika diminta
- Mengupdate progress kegiatan

### 2. Koordinator (per Tim)

- Setiap tim memiliki 1 Koordinator
- Mereview kegiatan dari pelaksana di timnya
- Meneruskan ke PPK jika disetujui
- Dapat meminta revisi atau menolak kegiatan

### 3. PPK (Pejabat Pembuat Keputusan)

- Mereview kegiatan yang sudah disetujui Koordinator
- Validasi anggaran dan kelayakan kegiatan
- Meneruskan ke Kepala jika disetujui
- Dapat meminta revisi atau menolak kegiatan

### 4. Kepala (Pimpinan)

- Persetujuan final untuk kegiatan
- Kegiatan yang disetujui otomatis berstatus 'berjalan'
- Dapat meminta revisi atau menolak kegiatan

## Struktur Database Baru

### Kolom Baru pada Tabel `kegiatan_operasional`

```sql
-- Tracking approval Koordinator
approved_by_koordinator INT,
tanggal_approval_koordinator DATETIME,
catatan_koordinator TEXT,

-- Tracking approval PPK
approved_by_ppk INT,
tanggal_approval_ppk DATETIME,
catatan_ppk TEXT,

-- Tracking approval Kepala (sudah ada sebelumnya)
approved_by INT,
tanggal_approval DATETIME,
catatan_pimpinan TEXT,
```

### Tabel Baru `approval_history`

```sql
CREATE TABLE approval_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kegiatan_id INT NOT NULL,
  approver_id INT NOT NULL,
  level ENUM('koordinator', 'ppk', 'kepala') NOT NULL,
  status ENUM('approved', 'rejected', 'revisi') NOT NULL,
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan_operasional(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);
```

### Update ENUM pada Tabel `users`

```sql
ALTER TABLE users MODIFY COLUMN role
  ENUM('admin', 'pimpinan', 'pelaksana', 'kesubag', 'koordinator', 'ppk') NOT NULL;
```

## API Endpoints

### Koordinator

| Method | Endpoint                                  | Deskripsi             |
| ------ | ----------------------------------------- | --------------------- |
| GET    | `/api/koordinator/dashboard`              | Dashboard data        |
| GET    | `/api/koordinator/profile`                | Get profile           |
| PUT    | `/api/koordinator/profile`                | Update profile        |
| GET    | `/api/koordinator/kegiatan`               | List kegiatan tim     |
| GET    | `/api/koordinator/kegiatan/[id]`          | Detail kegiatan       |
| POST   | `/api/koordinator/kegiatan/[id]/approval` | Approve/Reject/Revisi |
| GET    | `/api/koordinator/notifications`          | Get notifications     |
| PUT    | `/api/koordinator/notifications`          | Mark as read          |
| POST   | `/api/koordinator/change-password`        | Change password       |

### PPK

| Method | Endpoint                          | Deskripsi             |
| ------ | --------------------------------- | --------------------- |
| GET    | `/api/ppk/dashboard`              | Dashboard data        |
| GET    | `/api/ppk/profile`                | Get profile           |
| PUT    | `/api/ppk/profile`                | Update profile        |
| GET    | `/api/ppk/kegiatan`               | List kegiatan         |
| GET    | `/api/ppk/kegiatan/[id]`          | Detail kegiatan       |
| POST   | `/api/ppk/kegiatan/[id]/approval` | Approve/Reject/Revisi |
| GET    | `/api/ppk/notifications`          | Get notifications     |
| PUT    | `/api/ppk/notifications`          | Mark as read          |
| POST   | `/api/ppk/change-password`        | Change password       |

## Halaman Frontend

### Koordinator (`/koordinator/*`)

- `/koordinator/dashboard` - Dashboard
- `/koordinator/approval` - Daftar kegiatan untuk diapprove
- `/koordinator/approval/[id]` - Detail approval
- `/koordinator/kegiatan` - Monitoring kegiatan tim
- `/koordinator/kegiatan/[id]` - Detail kegiatan
- `/koordinator/profile` - Profil

### PPK (`/ppk/*`)

- `/ppk/dashboard` - Dashboard
- `/ppk/approval` - Daftar kegiatan untuk diapprove
- `/ppk/approval/[id]` - Detail approval
- `/ppk/kegiatan` - Monitoring semua kegiatan
- `/ppk/kegiatan/[id]` - Detail kegiatan
- `/ppk/profile` - Profil

## Notifikasi

Sistem akan mengirim notifikasi pada setiap tahap:

1. **Pelaksana submit** → Notifikasi ke Koordinator tim
2. **Koordinator approve** → Notifikasi ke PPK
3. **Koordinator reject/revisi** → Notifikasi ke Pelaksana
4. **PPK approve** → Notifikasi ke Kepala
5. **PPK reject/revisi** → Notifikasi ke Pelaksana
6. **Kepala approve** → Notifikasi ke Pelaksana, Koordinator, PPK
7. **Kepala reject/revisi** → Notifikasi ke Pelaksana, Koordinator, PPK

## Cara Instalasi

### 1. Jalankan Migrasi Database

```bash
# Jalankan SQL script
mysql -u root -p simkinerja < scripts/add-multi-level-approval.sql
```

### 2. Buat User Koordinator dan PPK

```bash
# Menggunakan script JS
node scripts/create-koordinator-ppk.js

# Atau menggunakan SQL
mysql -u root -p simkinerja < scripts/create-koordinator-ppk-users.sql
```

### 3. Kredensial Default

| Role        | Username                 | Password         |
| ----------- | ------------------------ | ---------------- |
| Koordinator | `koordinator_[nama_tim]` | `koordinator123` |
| PPK         | `ppk`                    | `ppk123`         |

**Contoh:**

- `koordinator_ipds` / `koordinator123`
- `koordinator_sosial` / `koordinator123`
- `ppk` / `ppk123`

## Migrasi dari Sistem Lama

Jika sudah ada kegiatan dengan status lama, Anda mungkin perlu memigrasi:

```sql
-- Update kegiatan yang sudah 'diajukan' ke 'review_koordinator'
UPDATE kegiatan_operasional
SET status_pengajuan = 'review_koordinator'
WHERE status_pengajuan = 'diajukan';

-- Untuk kegiatan yang sudah di-approve kesubag, langsung ke 'review_kepala'
-- (sesuaikan dengan kebutuhan)
```

## Troubleshooting

### 1. Error ENUM tidak valid

Pastikan migrasi database sudah dijalankan dan ENUM sudah diupdate.

### 2. Koordinator tidak bisa melihat kegiatan

Pastikan `tim_id` di tabel users sudah diset dengan benar untuk Koordinator.

### 3. Notifikasi tidak terkirim

Periksa apakah user penerima memiliki role yang sesuai dan `tim_id` yang benar.

## Arsitektur File

```
app/
├── koordinator/
│   ├── layout.tsx          # Layout dengan sidebar hijau
│   ├── page.tsx            # Redirect ke dashboard
│   ├── dashboard/
│   │   └── page.tsx
│   ├── approval/
│   │   ├── page.tsx        # Daftar approval
│   │   └── [id]/
│   │       └── page.tsx    # Detail approval
│   ├── kegiatan/
│   │   ├── page.tsx        # Daftar kegiatan
│   │   └── [id]/
│   │       └── page.tsx    # Detail kegiatan
│   └── profile/
│       └── page.tsx
├── ppk/
│   ├── layout.tsx          # Layout dengan sidebar orange
│   ├── page.tsx            # Redirect ke dashboard
│   ├── dashboard/
│   │   └── page.tsx
│   ├── approval/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── kegiatan/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── profile/
│       └── page.tsx
└── api/
    ├── koordinator/
    │   ├── dashboard/route.ts
    │   ├── profile/route.ts
    │   ├── kegiatan/
    │   │   ├── route.ts
    │   │   └── [id]/
    │   │       ├── route.ts
    │   │       └── approval/route.ts
    │   ├── notifications/route.ts
    │   └── change-password/route.ts
    └── ppk/
        ├── dashboard/route.ts
        ├── profile/route.ts
        ├── kegiatan/
        │   ├── route.ts
        │   └── [id]/
        │       ├── route.ts
        │       └── approval/route.ts
        ├── notifications/route.ts
        └── change-password/route.ts
```

## Warna Tema

| Role        | Primary Color    | Gradient                 |
| ----------- | ---------------- | ------------------------ |
| Koordinator | Green (#22c55e)  | green-500 to emerald-500 |
| PPK         | Orange (#f97316) | orange-500 to amber-500  |
| Pimpinan    | Purple           | purple-600               |
