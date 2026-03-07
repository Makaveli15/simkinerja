# Sequence Diagram (PlantUML) - SIMKINERJA

## 1. Sequence Diagram Login

```plantuml
@startuml
title Sequence Diagram - Login

actor User
boundary "Halaman Login" as UI
control "AuthController" as C
entity "UserRepository" as R
database "Database" as DB

User -> UI : Input username & password
UI -> C : login(username, password)
C -> R : findByUsername(username)
R -> DB : SELECT * FROM users
DB --> R : userData
R --> C : User

alt [Kredensial Valid]
    C --> UI : LoginSuccess
    UI --> User : Redirect ke Dashboard
else [Kredensial Invalid]
    C --> UI : LoginFailed
    UI --> User : Tampilkan error
end

@enduml
```

---

## 2. Sequence Diagram Buat Kegiatan

```plantuml
@startuml
title Sequence Diagram - Buat Kegiatan

actor Pelaksana
boundary "Halaman Kegiatan" as UI
control "KegiatanController" as C
entity "Repository" as R
database "Database" as DB

Pelaksana -> UI : Klik Tambah Kegiatan
UI -> C : getFormData()
C -> R : findAllKRO(), findAllMitra()
R -> DB : SELECT * FROM kro, mitra
DB --> R : dataList
R --> C : List<KRO>, List<Mitra>
C --> UI : FormData
UI --> Pelaksana : Tampilkan form

Pelaksana -> UI : Input data & Klik Simpan
UI -> C : create(kegiatanData)
C -> C : validate(kegiatanData)

alt [Data Valid]
    C -> R : save(kegiatan)
    R -> DB : INSERT INTO kegiatan_operasional
    DB --> R : kegiatanId
    R --> C : Kegiatan
    C --> UI : CreateSuccess
    UI --> Pelaksana : Tampilkan konfirmasi
else [Data Invalid]
    C --> UI : ValidationError
    UI --> Pelaksana : Tampilkan error
end

@enduml
```

---

## 3. Sequence Diagram Input Progres

```plantuml
@startuml
title Sequence Diagram - Input Progres

actor Pelaksana
boundary "Halaman Progres" as UI
control "ProgresController" as C
entity "Repository" as R
database "Database" as DB

Pelaksana -> UI : Pilih kegiatan
UI -> C : getDetail(kegiatanId)
C -> R : findById(kegiatanId)
R -> DB : SELECT * FROM kegiatan_operasional
DB --> R : kegiatanData
R --> C : Kegiatan
C --> UI : KegiatanDetail
UI --> Pelaksana : Tampilkan form progres

Pelaksana -> UI : Input capaian & upload bukti
UI -> C : create(progresData, file)
C -> R : save(progres)
R -> DB : INSERT INTO progres_kegiatan
DB --> R : progresId
R --> C : Progres
C -> C : sendNotification(koordinatorId)
C --> UI : CreateSuccess
UI --> Pelaksana : Tampilkan konfirmasi

@enduml
```

---

## 4. Sequence Diagram Ajukan Validasi

```plantuml
@startuml
title Sequence Diagram - Ajukan Validasi

actor Pelaksana
boundary "Halaman Validasi" as UI
control "ValidasiController" as C
entity "Repository" as R
database "Database" as DB

Pelaksana -> UI : Klik Ajukan Validasi
UI -> C : checkKelengkapan(kegiatanId)
C -> R : findDokumen(kegiatanId)
R -> DB : SELECT * FROM dokumen_output
DB --> R : dokumenList
R --> C : List<Dokumen>

alt [Dokumen Lengkap]
    C --> UI : ShowForm
    Pelaksana -> UI : Upload bukti & Submit
    UI -> C : submit(validasiData)
    C -> R : updateStatus(kegiatanId, "MENUNGGU")
    R -> DB : UPDATE kegiatan_operasional
    DB --> R : success
    C -> C : notifyKoordinator()
    C --> UI : SubmitSuccess
    UI --> Pelaksana : Tampilkan konfirmasi
else [Dokumen Tidak Lengkap]
    C --> UI : Warning
    UI --> Pelaksana : Tampilkan peringatan
end

@enduml
```

---

## 5. Sequence Diagram Validasi Output (Koordinator)

```plantuml
@startuml
title Sequence Diagram - Validasi Output

actor Koordinator
boundary "Halaman Validasi" as UI
control "ValidasiController" as C
entity "Repository" as R
database "Database" as DB

Koordinator -> UI : Buka menu validasi
UI -> C : getPendingList()
C -> R : findByStatus("MENUNGGU")
R -> DB : SELECT * FROM kegiatan_operasional
DB --> R : kegiatanList
R --> C : List<Kegiatan>
C --> UI : PendingList
UI --> Koordinator : Tampilkan daftar

Koordinator -> UI : Pilih & Review
UI -> C : getDetail(kegiatanId)
C -> R : findById(kegiatanId)
R -> DB : SELECT kegiatan, dokumen
DB --> R : data
R --> C : DetailKegiatan
C --> UI : Detail
UI --> Koordinator : Tampilkan detail

Koordinator -> UI : Keputusan

alt [Approve]
    UI -> C : approve(kegiatanId)
    C -> R : updateStatus("VALID_KOORDINATOR")
    R -> DB : UPDATE
    C -> C : notifyPPK()
else [Revisi]
    UI -> C : revisi(kegiatanId, catatan)
    C -> R : updateStatus("REVISI")
    R -> DB : UPDATE
    C -> C : notifyPelaksana()
else [Tolak]
    UI -> C : reject(kegiatanId, alasan)
    C -> R : updateStatus("DITOLAK")
    R -> DB : UPDATE
    C -> C : notifyPelaksana()
end

C --> UI : Success
UI --> Koordinator : Konfirmasi

@enduml
```

---

## 6. Sequence Diagram Verifikasi Anggaran (PPK)

```plantuml
@startuml
title Sequence Diagram - Verifikasi Anggaran

actor PPK
boundary "Halaman Verifikasi" as UI
control "VerifikasiController" as C
entity "Repository" as R
database "Database" as DB

PPK -> UI : Buka menu verifikasi
UI -> C : getPendingList()
C -> R : findByStatus("VALID_KOORDINATOR")
R -> DB : SELECT * FROM kegiatan_operasional
DB --> R : kegiatanList
R --> C : List<Kegiatan>
C --> UI : PendingList
UI --> PPK : Tampilkan daftar

PPK -> UI : Pilih & Review anggaran
UI -> C : getDetailAnggaran(kegiatanId)
C -> R : findRealisasi(kegiatanId)
R -> DB : SELECT * FROM realisasi_anggaran
DB --> R : realisasiList
R --> C : DetailAnggaran
C --> UI : Detail
UI --> PPK : Tampilkan detail

PPK -> UI : Keputusan

alt [Approve]
    UI -> C : approve(kegiatanId)
    C -> R : updateStatus("VALID_PPK")
    R -> DB : UPDATE
    C -> C : notifyPimpinan()
else [Revisi/Tolak]
    UI -> C : reject(kegiatanId, alasan)
    C -> R : updateStatus("REVISI/DITOLAK")
    R -> DB : UPDATE
    C -> C : notifyPelaksana()
end

C --> UI : Success
UI --> PPK : Konfirmasi

@enduml
```

---

## 7. Sequence Diagram Pengesahan Final (Pimpinan)

```plantuml
@startuml
title Sequence Diagram - Pengesahan Final

actor Pimpinan
boundary "Halaman Approval" as UI
control "ApprovalController" as C
entity "Repository" as R
database "Database" as DB

Pimpinan -> UI : Buka menu approval
UI -> C : getPendingList()
C -> R : findByStatus("VALID_PPK")
R -> DB : SELECT * FROM kegiatan_operasional
DB --> R : kegiatanList
R --> C : List<Kegiatan>
C --> UI : PendingList
UI --> Pimpinan : Tampilkan daftar

Pimpinan -> UI : Pilih & Review
UI -> C : getFullDetail(kegiatanId)
C -> R : findKegiatan, findProgres, findRealisasi
R -> DB : SELECT kegiatan, progres, realisasi
DB --> R : fullData
R --> C : FullDetail
C --> UI : Detail
UI --> Pimpinan : Tampilkan detail lengkap

Pimpinan -> UI : Keputusan

alt [Approve]
    UI -> C : approveFinal(kegiatanId)
    C -> R : updateStatus("DISAHKAN")
    R -> DB : UPDATE
    C -> C : broadcastNotification()
else [Tolak]
    UI -> C : reject(kegiatanId, alasan)
    C -> R : updateStatus("DITOLAK_PIMPINAN")
    R -> DB : UPDATE
    C -> C : notifyPelaksana()
end

C --> UI : Success
UI --> Pimpinan : Konfirmasi

@enduml
```

---

## 8. Sequence Diagram Evaluasi Kinerja (Pimpinan)

```plantuml
@startuml
title Sequence Diagram - Evaluasi Kinerja

actor Pimpinan
boundary "Halaman Evaluasi" as UI
control "EvaluasiController" as C
entity "Repository" as R
database "Database" as DB

Pimpinan -> UI : Buka menu evaluasi
UI -> C : getKegiatanList()
C -> R : findAll()
R -> DB : SELECT * FROM kegiatan_operasional
DB --> R : kegiatanList
R --> C : List<Kegiatan>
C --> UI : KegiatanList
UI --> Pimpinan : Tampilkan daftar

Pimpinan -> UI : Pilih kegiatan
UI -> C : getStatistik(kegiatanId)
C -> R : calculateKinerja(kegiatanId)
R -> DB : SELECT progres, realisasi
DB --> R : data
R --> C : StatistikKinerja
C --> UI : Statistik
UI --> Pimpinan : Tampilkan statistik

Pimpinan -> UI : Input evaluasi & Simpan
UI -> C : create(evaluasiData)
C -> R : save(evaluasi)
R -> DB : INSERT INTO evaluasi_pimpinan
DB --> R : evaluasiId
R --> C : Evaluasi
C -> C : notifyPegawai()
C --> UI : CreateSuccess
UI --> Pimpinan : Konfirmasi

@enduml
```

---

## 9. Sequence Diagram Kelola Data Master (Admin) - CRUD

```plantuml
@startuml
title Sequence Diagram - Kelola Data Master (CRUD)

actor Admin
boundary "Halaman Data Master" as UI
control "DataMasterController" as C
entity "Repository" as R
database "Database" as DB

== Lihat Data ==
Admin -> UI : Pilih menu data master
UI -> C : getAll(entityType)
C -> R : findAll()
R -> DB : SELECT * FROM [table]
DB --> R : dataList
R --> C : List<Entity>
C --> UI : DataList
UI --> Admin : Tampilkan daftar data

== Tambah Data ==
Admin -> UI : Klik Tambah
UI --> Admin : Tampilkan form input
Admin -> UI : Input data baru & Klik Simpan
UI -> C : create(entityData)
C -> C : validate(entityData)

alt [Data Valid]
    C -> R : save(entity)
    R -> DB : INSERT INTO [table]
    DB --> R : entityId
    R --> C : Entity
    C --> UI : CreateSuccess
    UI --> Admin : Tampilkan konfirmasi sukses
else [Data Invalid]
    C --> UI : ValidationError
    UI --> Admin : Tampilkan pesan error
end

== Edit Data ==
Admin -> UI : Pilih data & Klik Edit
UI -> C : getById(id)
C -> R : findById(id)
R -> DB : SELECT * FROM [table] WHERE id = ?
DB --> R : entityData
R --> C : Entity
C --> UI : Entity
UI --> Admin : Tampilkan form edit dengan data

Admin -> UI : Ubah data & Klik Simpan
UI -> C : update(id, entityData)
C -> C : validate(entityData)
C -> R : update(entity)
R -> DB : UPDATE [table] SET ... WHERE id = ?
DB --> R : success
R --> C : Entity
C --> UI : UpdateSuccess
UI --> Admin : Tampilkan konfirmasi sukses

== Hapus Data ==
Admin -> UI : Pilih data & Klik Hapus
UI --> Admin : Tampilkan konfirmasi hapus
Admin -> UI : Konfirmasi
UI -> C : delete(id)
C -> R : deleteById(id)
R -> DB : DELETE FROM [table] WHERE id = ?
DB --> R : success
R --> C : deleted
C --> UI : DeleteSuccess
UI --> Admin : Tampilkan konfirmasi sukses

@enduml
```

---

## 10. Sequence Diagram Lapor Kendala

```plantuml
@startuml
title Sequence Diagram - Lapor Kendala

actor Pelaksana
boundary "Halaman Kendala" as UI
control "KendalaController" as C
entity "Repository" as R
database "Database" as DB

Pelaksana -> UI : Klik Lapor Kendala
UI --> Pelaksana : Tampilkan form kendala

Pelaksana -> UI : Input kendala & Klik Simpan
UI -> C : create(kendalaData)
C -> C : validate(kendalaData)
C -> R : save(kendala)
R -> DB : INSERT INTO kendala_kegiatan
DB --> R : kendalaId
R --> C : Kendala

alt [Tingkat Dampak Tinggi]
    C -> C : sendUrgentNotification(koordinatorId)
else [Tingkat Dampak Rendah/Sedang]
    C -> C : sendNormalNotification(koordinatorId)
end

C --> UI : CreateSuccess
UI --> Pelaksana : Tampilkan konfirmasi

@enduml
```

---

## 11. Sequence Diagram Alur Approval Multi-Level

```plantuml
@startuml
title Sequence Diagram - Alur Approval Multi-Level

actor Pelaksana
actor Koordinator
actor PPK
actor Pimpinan
boundary "System UI" as UI
control "ApprovalController" as C
entity "Repository" as R
database "Database" as DB

== Fase 1: Pelaksana Submit ==
Pelaksana -> UI : Submit validasi
UI -> C : submit(kegiatanId)
C -> R : updateStatus("MENUNGGU_KOORDINATOR")
R -> DB : UPDATE kegiatan_operasional
C -> C : notifyKoordinator()

== Fase 2: Koordinator Review ==
Koordinator -> UI : Approve
UI -> C : approve(kegiatanId)
C -> R : updateStatus("VALID_KOORDINATOR")
R -> DB : UPDATE
C -> C : notifyPPK()

== Fase 3: PPK Review ==
PPK -> UI : Approve
UI -> C : approve(kegiatanId)
C -> R : updateStatus("VALID_PPK")
R -> DB : UPDATE
C -> C : notifyPimpinan()

== Fase 4: Pimpinan Pengesahan ==
Pimpinan -> UI : Approve Final
UI -> C : approveFinal(kegiatanId)
C -> R : updateStatus("DISAHKAN")
R -> DB : UPDATE
C -> C : broadcastNotification()
C --> UI : Kegiatan Disahkan

@enduml
```

---

## Cara Melihat Diagram

1. Copy kode PlantUML di atas
2. Buka [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
3. Paste kode untuk melihat visualisasi

---

## Keterangan Komponen

| Komponen     | Simbol             | Deskripsi       |
| ------------ | ------------------ | --------------- |
| **Actor**    | `actor`            | Pengguna sistem |
| **Boundary** | `boundary`         | Interface/UI    |
| **Control**  | `control`          | Controller      |
| **Entity**   | `entity`           | Repository      |
| **Database** | `database`         | Database        |
| **Message**  | `->`               | Request         |
| **Return**   | `-->`              | Response        |
| **Alt**      | `alt...else...end` | Kondisi         |
| **Divider**  | `== text ==`       | Pembatas        |
