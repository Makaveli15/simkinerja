# Entity Relationship Diagram (ERD) - SIMKINERJA
## Sistem Informasi Monitoring Kinerja

---

## 📊 Diagram ERD (Format Teks)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SIMKINERJA ERD                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │     tim     │
                                    ├─────────────┤
                                    │ PK id       │
                                    │    nama     │
                                    │    deskripsi│
                                    └──────┬──────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                          ▼                ▼                │
                   ┌─────────────┐  ┌─────────────┐         │
                   │    users    │  │   kegiatan  │         │
                   ├─────────────┤  ├─────────────┤         │
                   │ PK id       │  │ PK id       │         │
                   │    username │  │ FK tim_id ──┼─────────┘
                   │    email    │  │ FK kro_id   │
                   │    password │  │ FK mitra_id │
                   │    role     │  │ FK created_by│
                   │ FK tim_id ──┤  │    nama     │
                   └──────┬──────┘  │    status   │
                          │         └──────┬──────┘
                          │                │
    ┌──────────┬──────────┼──────────┬─────┼─────┬──────────┬──────────┐
    │          │          │          │     │     │          │          │
    ▼          ▼          ▼          │     │     ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────────┐ │     │ ┌────────┐ ┌────────┐ ┌────────┐
│notifi- │ │upload_ │ │  evaluasi  │ │     │ │dokumen_│ │progres_│ │kendala_│
│cations │ │laporan │ │(unified)   │ │     │ │output  │ │kegiatan│ │kegiatan│
├────────┤ ├────────┤ ├────────────┤ │     │ ├────────┤ ├────────┤ ├────────┤
│PK id   │ │PK id   │ │PK id       │ │     │ │PK id   │ │PK id   │ │PK id   │
│FK user │ │FK user │ │FK user     │ │     │ │FK keg  │ │FK keg  │ │FK keg  │
└────────┘ └────────┘ │FK keg      │ │     │ │FK user │ │FK user │ │FK user │
                      │role_pemberi│ │     │ └────────┘ └────────┘ └───┬────┘
                      └────────────┘ │                                 │
                                     │                                 │
    ┌────────────────────────────────┘                                 │
    │                                                                  ▼
    │     ┌─────────────┐    ┌─────────────┐                    ┌─────────────┐
    │     │     kro     │    │    mitra    │                    │tindak_lanjut│
    │     ├─────────────┤    ├─────────────┤                    ├─────────────┤
    │     │ PK id       │    │ PK id       │                    │ PK id       │
    └────►│    kode     │    │    nama     │                    │ FK kendala  │
          │    nama     │    │    posisi   │                    │ FK user     │
          └─────────────┘    └─────────────┘                    └─────────────┘

    ┌─────────────────┐     ┌─────────────────┐
    │realisasi_anggaran│    │ realisasi_fisik │
    ├─────────────────┤     ├─────────────────┤
    │ PK id           │     │ PK id           │
    │ FK kegiatan_id  │     │ FK kegiatan_id  │
    │ FK user_id      │     │ FK user_id      │
    │    jumlah       │     │    persentase   │
    └─────────────────┘     └─────────────────┘
```

---

## 🔗 Relasi Antar Tabel

| Dari Tabel | Kolom | Ke Tabel | Kolom | Keterangan |
|------------|-------|----------|-------|------------|
| users | tim_id | tim | id | User belongs to Tim |
| kegiatan | tim_id | tim | id | Kegiatan belongs to Tim |
| kegiatan | kro_id | kro | id | Kegiatan belongs to KRO |
| kegiatan | mitra_id | mitra | id | Kegiatan has Mitra |
| kegiatan | created_by | users | id | Kegiatan created by User |
| dokumen_output | kegiatan_id | kegiatan | id | Dokumen belongs to Kegiatan |
| dokumen_output | uploaded_by | users | id | Dokumen uploaded by User |
| dokumen_output | draft_reviewed_by_kesubag | users | id | Draft reviewed by Kesubag |
| dokumen_output | draft_reviewed_by_pimpinan | users | id | Draft reviewed by Pimpinan |
| evaluasi | kegiatan_id | kegiatan | id | Evaluasi for Kegiatan |
| evaluasi | user_id | users | id | Evaluasi by User (pimpinan/kesubag) |
| kendala_kegiatan | kegiatan_id | kegiatan | id | Kendala for Kegiatan |
| kendala_kegiatan | user_id | users | id | Kendala reported by User |
| progres_kegiatan | kegiatan_id | kegiatan | id | Progres for Kegiatan |
| progres_kegiatan | user_id | users | id | Progres by User |
| realisasi_anggaran | kegiatan_id | kegiatan | id | Realisasi for Kegiatan |
| realisasi_anggaran | user_id | users | id | Realisasi by User |
| realisasi_fisik | kegiatan_id | kegiatan | id | Realisasi for Kegiatan |
| realisasi_fisik | user_id | users | id | Realisasi by User |
| tindak_lanjut | kendala_id | kendala_kegiatan | id | Tindak Lanjut for Kendala |
| tindak_lanjut | user_id | users | id | Tindak Lanjut by User |
| notifications | user_id | users | id | Notification for User |
| upload_laporan | user_id | users | id | Laporan by User |

---

## 📋 Daftar Tabel (15 Tabel)

### 1. Master Data
| Tabel | Deskripsi |
|-------|-----------|
| **users** | Data pengguna sistem (admin, pimpinan, kesubag, pelaksana) |
| **tim** | Data tim/unit kerja |
| **kro** | Klasifikasi Rincian Output |
| **mitra** | Data mitra statistik |

### 2. Kegiatan & Monitoring
| Tabel | Deskripsi |
|-------|-----------|
| **kegiatan** | Data kegiatan operasional |
| **progres_kegiatan** | Tracking progres kegiatan |
| **realisasi_fisik** | Realisasi fisik (persentase) |
| **realisasi_anggaran** | Realisasi anggaran (nominal) |
| **kendala_kegiatan** | Kendala/masalah kegiatan |
| **tindak_lanjut** | Tindak lanjut kendala |

### 3. Dokumen & Validasi
| Tabel | Deskripsi |
|-------|-----------|
| **dokumen_output** | Dokumen output kegiatan (draft/final) |
| **upload_laporan** | File laporan yang diupload |

### 4. Evaluasi
| Tabel | Deskripsi |
|-------|-----------|
| **evaluasi** | Evaluasi terpadu oleh pimpinan & kesubag (role_pemberi: pimpinan/kesubag) |

### 5. Notifikasi
| Tabel | Deskripsi |
|-------|-----------|
| **notifications** | Notifikasi sistem |
| **notifications_read** | Tracking notifikasi yang sudah dibaca |

---

## 📌 Catatan Penting

1. **Tabel Pusat**: `kegiatan` adalah tabel utama yang menghubungkan sebagian besar tabel lainnya
2. **User Roles**: admin, pimpinan, kesubag, pelaksana
3. **Alur Validasi Dokumen**: Pelaksana → Kesubag → Pimpinan
4. **Cascade Delete**: Sebagian besar FK menggunakan ON DELETE CASCADE
