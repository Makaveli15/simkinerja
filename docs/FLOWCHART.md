# Flowchart Sistem SimKinerja

## 1. Flowchart Alur Pembuatan Kegiatan

```mermaid
flowchart TD
    %% Start
    Start([Start]) --> Login[/Login/]
    Login --> Role{Role?}

    %% Role Routing
    Role -->|Pelaksana| Buat[Buat Kegiatan]
    Role -->|Koordinator| K1
    Role -->|PPK| P1
    Role -->|Pimpinan| Pi1

    %% Alur Pelaksana
    Buat --> Ajukan{Ajukan?}
    Ajukan -->|Tidak| Buat
    Ajukan -->|Ya| K1

    %% Stage 1: Koordinator
    K1{Review Koordinator} -->|Setuju| P1
    K1 -->|Tolak/Revisi| Buat

    %% Stage 2: PPK
    P1{Review PPK} -->|Setuju| Pi1
    P1 -->|Tolak/Revisi| Buat

    %% Stage 3: Pimpinan
    Pi1{Approval Pimpinan} -->|Setuju| Approved[Kegiatan Disetujui]
    Pi1 -->|Tolak/Revisi| Buat

    %% End
    Approved --> End([End])

    %% Styling
    classDef startEnd fill:#f8cecc,stroke:#b85450,stroke-width:2px
    classDef process fill:#dae8fc,stroke:#6c8ebf,stroke-width:2px
    classDef decision fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef io fill:#d5e8d4,stroke:#82b366,stroke-width:2px

    class Start,End startEnd
    class Buat,Approved process
    class Role,Ajukan,K1,P1,Pi1 decision
    class Login io
```

---

## 2. Flowchart Alur Validasi Output & Input Progres

```mermaid
flowchart TD
    %% Start
    Start([Start]) --> Laksana[Pelaksanaan Kegiatan]

    %% Input Progres & Output
    Laksana --> Input[/Input Progres & Output/]
    Input --> Ajukan{Ajukan Validasi?}
    Ajukan -->|Tidak| Input
    Ajukan -->|Ya| VK

    %% Validasi Koordinator
    VK{Validasi Koordinator} -->|Valid| VP
    VK -->|Tidak Valid| Input

    %% Pengesahan Pimpinan
    VP{Pengesahan Pimpinan} -->|Sahkan| Skor[Hitung Skor Kinerja]
    VP -->|Tolak| Input

    %% Selesai
    Skor --> Selesai{Kegiatan Selesai?}
    Selesai -->|Tidak| Input
    Selesai -->|Ya| End([End])

    %% Styling
    classDef startEnd fill:#f8cecc,stroke:#b85450,stroke-width:2px
    classDef process fill:#dae8fc,stroke:#6c8ebf,stroke-width:2px
    classDef decision fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef io fill:#d5e8d4,stroke:#82b366,stroke-width:2px

    class Start,End startEnd
    class Laksana,Skor process
    class Ajukan,VK,VP,Selesai decision
    class Input io
```

---

## Penjelasan Alur

### Alur 1: Pembuatan Kegiatan

| Fase            | Proses                                          |
| --------------- | ----------------------------------------------- |
| **1. Login**    | User login → Sistem routing berdasarkan role    |
| **2. Buat**     | Pelaksana buat kegiatan → Ajukan                |
| **3. Approval** | Koordinator → PPK → Pimpinan (3 stage approval) |
| **4. Selesai**  | Kegiatan disetujui → Siap dilaksanakan          |

### Alur 2: Validasi Output & Input Progres

| Fase            | Proses                                     |
| --------------- | ------------------------------------------ |
| **1. Laksana**  | Pelaksana melaksanakan kegiatan            |
| **2. Input**    | Input progres & output → Ajukan validasi   |
| **3. Validasi** | Koordinator validasi → Pimpinan sahkan     |
| **4. Skor**     | Hitung skor kinerja → Cek kegiatan selesai |

---

## Keterangan Simbol

| Warna     | Simbol        | Keterangan   |
| --------- | ------------- | ------------ |
| 🔴 Merah  | Oval          | Start / End  |
| 🔵 Biru   | Persegi       | Process      |
| 🟡 Kuning | Belah Ketupat | Decision     |
| 🟢 Hijau  | Jajar Genjang | Input/Output |
