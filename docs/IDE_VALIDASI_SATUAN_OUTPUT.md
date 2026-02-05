# 📋 Ide: Sistem Validasi Output Berdasarkan Tipe Satuan

> **Status:** Menunggu konsultasi dengan pengguna dan dosen pembimbing
> **Tanggal:** 5 Februari 2026

---

## 🔍 Latar Belakang Masalah

- Beberapa kegiatan memiliki target output dengan jumlah besar (contoh: 523 responret)
- Tidak praktis jika pimpinan harus memvalidasi satu per satu
- Perlu sistem yang fleksibel untuk berbagai jenis satuan output

---

## 💡 Solusi yang Diusulkan

Membuat **Master Satuan Output** yang menentukan cara validasi berdasarkan tipe satuan.

---

## 📊 Struktur Master Satuan Output

| Kode | Nama Satuan | Tipe Validasi   | Cara Kerja                       |
| ---- | ----------- | --------------- | -------------------------------- |
| DOK  | Dokumen     | `per_file`      | Upload & validasi per dokumen    |
| RES  | Responret   | `batch_numeric` | Upload rekap + input jumlah unit |
| KEG  | Kegiatan    | `checklist`     | Checklist milestone + bukti      |
| DATA | Dataset     | `per_file`      | Upload & validasi per file       |
| LAP  | Laporan     | `per_file`      | Upload & validasi per laporan    |

---

## 📝 Perbedaan Form Berdasarkan Tipe

### 1. Tipe `per_file` (Dokumen, Laporan, Dataset)

**Pelaksana:**

- Upload file satu per satu
- Setiap file = 1 unit output

**Validator (Pimpinan/Kesubag):**

- Validasi per file
- Status: Valid / Tidak Valid

**Perhitungan Capaian:**

```
Capaian = Jumlah File Valid / Target Output
```

---

### 2. Tipe `batch_numeric` (Responret, Sampel)

**Pelaksana:**

- Upload rekap/batch (misal: "Rekap Responret Minggu 1")
- Input jumlah unit dalam batch tersebut (misal: 150 responret)

**Validator (Pimpinan/Kesubag):**

- Validasi batch dokumen
- Konfirmasi/revisi jumlah unit yang valid

**Perhitungan Capaian:**

```
Capaian = Total Unit Valid dari Semua Batch / Target Output
```

**Contoh:**

```
Target: 523 responret

Batch 1: "Rekap Minggu 1" - 150 unit ✓ Valid
Batch 2: "Rekap Minggu 2" - 180 unit ✓ Valid
Batch 3: "Rekap Minggu 3" - 193 unit ⏳ Pending

Capaian = (150 + 180) / 523 = 63.1%
```

---

### 3. Tipe `checklist` (Kegiatan, Milestone)

**Pelaksana:**

- Centang milestone/tahapan yang selesai
- Upload bukti untuk setiap milestone

**Validator (Pimpinan/Kesubag):**

- Validasi per milestone
- Status: Selesai / Belum Selesai

**Perhitungan Capaian:**

```
Capaian = Milestone Valid / Total Milestone
```

---

## 🔄 Alur Kerja

```
┌─────────────────┐
│  Pilih KRO      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Satuan Output   │ (otomatis dari KRO atau pilih manual)
│ terisi          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Form Upload     │ (menyesuaikan tipe satuan)
│ Dinamis         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Form Validasi   │ (menyesuaikan tipe satuan)
│ Dinamis         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Capaian         │ (dihitung otomatis berdasarkan tipe)
│ Otomatis        │
└─────────────────┘
```

---

## 🛠️ Yang Perlu Diimplementasi

1. **Database:**
   - Tabel `master_satuan_output` (kode, nama, tipe_validasi, deskripsi)
   - Tambah kolom `jumlah_unit` pada `dokumen_output` untuk tipe batch
   - Relasi satuan ke KRO atau kegiatan

2. **Frontend - Form Upload:**
   - Form dinamis berdasarkan tipe satuan
   - Input jumlah unit untuk tipe `batch_numeric`
   - Checklist untuk tipe `checklist`

3. **Frontend - Form Validasi:**
   - Form validasi dinamis berdasarkan tipe satuan
   - Input konfirmasi jumlah unit untuk tipe `batch_numeric`
   - Validasi per milestone untuk tipe `checklist`

4. **Backend:**
   - API untuk master satuan output
   - Logic perhitungan capaian berdasarkan tipe

---

## ❓ Pertanyaan untuk Konsultasi

1. Jenis satuan apa saja yang dibutuhkan di lapangan?
2. Apakah alur validasi untuk setiap tipe sudah sesuai?
3. Apakah ada tipe satuan khusus lainnya yang perlu ditambahkan?
4. Bagaimana jika ada kegiatan dengan multiple output type?

---

## 📌 Catatan

- Ide ini perlu dikonsultasikan dengan pengguna dan dosen pembimbing sebelum diimplementasi
- Fokus saat ini: pengembangan fitur yang sudah ada
- Implementasi ide ini dijadwalkan untuk fase berikutnya

---

_Dokumen ini disimpan sebagai referensi untuk pengembangan selanjutnya._
