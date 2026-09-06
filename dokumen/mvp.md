# MVP (Minimum Viable Product) BASAH Rejosari
**Sistem Administrasi & Transaksi Keuangan Bank Sampah Rejosari**

Dokumen ini mendefinisikan spesifikasi fungsional sistem, skema database, matriks hak akses, dan alur transaksi untuk pengembangan sistem BASAH Rejosari.

---

## 1. Arsitektur & Teknologi Sistem
* **Framework Frontend & Backend**: Next.js (App Router)
* **Database & Auth**: Supabase (PostgreSQL)
* **Storage**: Supabase Storage (untuk foto bukti timbangan, maksimal 1MB)
* **Styling**: Tailwind CSS (Desain UI/UX akan diimplementasikan setelah referensi diberikan)

---

## 2. Matriks Hak Akses (Role & Authorization)

Sistem memiliki **5 Role Pengurus** yang terdaftar di database, serta **Viewer Publik** yang tidak memerlukan login.

| Fitur / Modul | Viewer Publik | Petugas Operasional | Bendahara | Sekretaris | Ketua | Admin Sistem |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard Publik** (Statistik Umum & Harga Beli) | ✔ (Read) | ✔ (Read) | ✔ (Read) | ✔ (Read) | ✔ (Read) | ✔ (Read) |
| **Dashboard Pengurus** (Metrik Keuangan Lengkap) | ❌ | ✔ (Read) | ✔ (Read) | ✔ (Read) | ✔ (Read) | ✔ (Read) |
| **Manajemen Nasabah** (CRUD) | ❌ | ❌ | ✔ (CRUD) | ✔ (CRUD) | ❌ | ❌ |
| **Setor Sampah** (Input transaksi & upload foto 1MB) | ❌ | ✔ (Create) | ❌ | ❌ | ❌ | ❌ |
| **Pencairan Saldo Nasabah** (Proses penarikan saldo) | ❌ | ❌ | ✔ (Create) | ❌ | ❌ | ❌ |
| **Kemitraan & Penjualan Pengepul** (CRUD & Transaksi) | ❌ | ❌ | ✔ (CRUD) | ❌ | ✔ (Read) | ❌ |
| **Keuangan Kas** (Pencatatan pemasukan/pengeluaran) | ❌ | ❌ | ✔ (CRUD) | ❌ | ✔ (Read) | ❌ |
| **Laporan Bulanan/Tahunan** (Cetak/Unduh) | ❌ | ❌ | ✔ (Read) | ✔ (Read) | ✔ (Read) | ❌ |
| **Manajemen Pengurus (Akun)** (Tambah/Edit/Hapus) | ❌ | ❌ | ❌ | ❌ | ❌ | ✔ (CRUD) |
| **Daftar Harga Beli Nasabah** (Update harga sampah) | ❌ | ❌ | ✔ (Update) | ❌ | ❌ | ✔ (CRUD) |

---

## 3. Skema Database Relasional (Supabase / PostgreSQL)

### 3.1. Tabel `users` (Pengurus)
Menyimpan data otentikasi, role, dan foto profil masing-masing pengurus.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'ketua', 'sekretaris', 'bendahara', 'petugas')) NOT NULL,
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    foto_url TEXT,                         -- URL foto profil muka petugas (Supabase Storage)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2. Tabel `nasabah`
Menyimpan data perwakilan rumah/keluarga yang menjadi nasabah beserta foto profilnya.
```sql
CREATE TABLE nasabah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_nasabah VARCHAR(50) UNIQUE NOT NULL, -- Contoh format: RJS001, RJS002
    nama VARCHAR(255) NOT NULL,            -- Nama kepala keluarga/perwakilan
    rt_rw VARCHAR(50) NOT NULL,             -- Contoh: "RT 01/RW 18"
    no_hp VARCHAR(20),
    saldo DECIMAL(15, 2) DEFAULT 0.00,      -- Saldo aktif saat ini
    foto_url TEXT,                         -- URL foto muka perwakilan nasabah (Supabase Storage)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3. Tabel `jenis_sampah`
Daftar jenis sampah yang diterima oleh bank sampah.
```sql
CREATE TABLE jenis_sampah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_sampah VARCHAR(100) UNIQUE NOT NULL, -- Contoh: "Botol Plastik", "Kardus", "Kaleng"
    satuan VARCHAR(20) DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4. Tabel `harga_nasabah` (Harga Beli & Acuan)
Menyimpan data harga sampah aktif yang menampilkan rincian harga pengepul, potongan kas, dan harga bersih untuk nasabah.
```sql
CREATE TABLE harga_nasabah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis_sampah_id UUID REFERENCES jenis_sampah(id) ON DELETE CASCADE,
    harga_jual DECIMAL(15, 2) NOT NULL,       -- Harga acuan jual ke pengepul (contoh: 3000.00)
    potongan_kas DECIMAL(15, 2) NOT NULL,     -- Bagian/potongan untuk Kas/Petugas (contoh: 1000.00)
    harga_beli DECIMAL(15, 2) GENERATED ALWAYS AS (harga_jual - potongan_kas) STORED, -- Harga bersih diterima nasabah (contoh: 2000.00)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.5. Tabel `pengepul`
Data mitra pengepul yang membeli sampah terkumpul dari bank sampah.
```sql
CREATE TABLE pengepul (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    kontak VARCHAR(100),
    alamat TEXT,
    jadwal_ambil VARCHAR(255),               -- Keterangan hari/waktu penjemputan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.6. Tabel `harga_pengepul` (Harga Jual)
Daftar harga beli pengepul untuk masing-masing jenis sampah.
```sql
CREATE TABLE harga_pengepul (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengepul_id UUID REFERENCES pengepul(id) ON DELETE CASCADE,
    jenis_sampah_id UUID REFERENCES jenis_sampah(id) ON DELETE CASCADE,
    harga_jual DECIMAL(15, 2) NOT NULL,       -- Contoh: 3000.00
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pengepul_id, jenis_sampah_id)
);
```

### 3.7. Tabel `setoran` (Nasabah -> Bank Sampah)
Transaksi penyetoran sampah oleh warga dengan membekukan rincian harga acuan, potongan kas, dan harga bersih nasabah.
```sql
CREATE TABLE setoran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id),
    jenis_sampah_id UUID REFERENCES jenis_sampah(id),
    berat DECIMAL(10, 2) NOT NULL,            -- Berat sampah dalam kg
    harga_jual_saat_ini DECIMAL(15, 2) NOT NULL, -- Harga acuan pengepul saat transaksi (contoh: 3000)
    potongan_kas_saat_ini DECIMAL(15, 2) NOT NULL, -- Potongan kas saat transaksi (contoh: 1000)
    harga_beli_saat_ini DECIMAL(15, 2) NOT NULL, -- Harga bersih nasabah saat transaksi (contoh: 2000)
    total_nilai DECIMAL(15, 2) NOT NULL,      -- Hasil: berat * harga_beli_saat_ini (masuk ke saldo nasabah)
    foto_timbangan_url TEXT,                  -- URL foto timbangan (Supabase Storage, max 1MB)
    petugas_id UUID REFERENCES users(id),     -- Petugas yang menginput setoran
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.8. Tabel `penjualan_pengepul` (Bank Sampah -> Pengepul)
Transaksi penjualan akumulasi sampah ke pihak ketiga.
```sql
CREATE TABLE penjualan_pengepul (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengepul_id UUID REFERENCES pengepul(id),
    jenis_sampah_id UUID REFERENCES jenis_sampah(id),
    berat DECIMAL(10, 2) NOT NULL,
    harga_jual_saat_ini DECIMAL(15, 2) NOT NULL, -- Bekukan harga jual saat transaksi
    total_nilai DECIMAL(15, 2) NOT NULL,      -- Hasil: berat * harga_jual_saat_ini
    petugas_id UUID REFERENCES users(id),     -- Bendahara yang memproses
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.9. Tabel `pencairan_saldo`
Pencatatan penarikan uang tabungan oleh nasabah.
```sql
CREATE TABLE pencairan_saldo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id),
    nominal_pencairan DECIMAL(15, 2) NOT NULL,
    saldo_awal DECIMAL(15, 2) NOT NULL,       -- Saldo sebelum dicairkan
    saldo_akhir DECIMAL(15, 2) NOT NULL,      -- Saldo setelah dicairkan
    petugas_id UUID REFERENCES users(id),     -- Bendahara yang memproses
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.10. Tabel `riwayat_saldo`
Log perubahan saldo nasabah (audit trail) untuk transparansi warga.
```sql
CREATE TABLE riwayat_saldo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id),
    tipe VARCHAR(20) CHECK (tipe IN ('setoran', 'pencairan')) NOT NULL,
    reference_id UUID NOT NULL,               -- ID setoran atau ID pencairan_saldo
    nominal DECIMAL(15, 2) NOT NULL,          -- Nominal transaksi (+ untuk setor, - untuk cair)
    saldo_akhir DECIMAL(15, 2) NOT NULL,      -- Saldo nasabah setelah transaksi ini
    keterangan TEXT,                          -- Catatan opsional
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.11. Tabel `keuangan_kas`
Pencatatan kas masuk & kas keluar umum untuk bank sampah.
```sql
CREATE TABLE keuangan_kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe VARCHAR(10) CHECK (tipe IN ('masuk', 'keluar')) NOT NULL,
    kategori VARCHAR(100) NOT NULL,           -- Contoh: "Penjualan Pengepul", "Bagi Hasil/Fee Petugas", "Beli Alat Timbangan", "Alat Tulis Kantor"
    nominal DECIMAL(15, 2) NOT NULL,
    keterangan TEXT,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Alur Logika Transaksi & Dampak Keuangan

### 4.1. Alur Setor Sampah (Nasabah -> Bank Sampah)
1. **Petugas** memilih nama nasabah dan jenis sampah yang disetorkan.
2. Sistem otomatis mengambil rincian harga aktif (`harga_jual`, `potongan_kas`, dan `harga_beli`) dari tabel `harga_nasabah` dan mengisinya sebagai nilai default di form (misal: Harga Pengepul: 3.000/kg, Potongan Kas: 1.000/kg, Harga Nasabah: 2.000/kg).
3. **Penyesuaian Fleksibel**: Petugas dapat mengubah nilai `potongan_kas` secara manual pada form transaksi jika diperlukan (misal disesuaikan menjadi 800/kg karena kesepakatan khusus). Sistem akan langsung menghitung ulang harga nasabah secara dinamis: `harga_beli = harga_jual - potongan_kas_baru` (contoh: 3.000 - 800 = 2.200/kg).
4. Petugas menginput berat sa
  - **Dua Tombol Aksi Cepat**: Tombol **"Setor Sampah"** dan **"Tarik Tabungan (Cairkan)"** terletak tepat di bawah kartu identitas.
  - **Daftar Riwayat Vertikal (Layar 6)**: Daftar histori transaksi. Setiap baris mewakili satu transaksi:
    - Kiri: Ikon hijau untuk Setoran, atau ikon merah terracotta untuk Pencairan Saldo.
    - Tengah: Nama Sampah & Berat (misal: "Botol Plastik - 5 kg") beserta tanggal.
    - Kanan: Nominal uang bertambah/berkurang dengan indikasi warna yang jelas (`+Rp10.000` / `-Rp25.000`).

#### 6. Halaman Pencairan Uang Tabungan (Cairkan Saldo)
* **Tujuan**: Memproses pengambilan uang tabungan oleh warga.
* **Layout & Komponen**:
  - Tampilan sisa saldo nasabah yang sangat mencolok agar Bendahara tidak salah menginput nominal pencairan.
  - Pilihan cepat nominal: Tombol bertuliskan **"Cairkan Semua Saldo"** (agar Bendahara tidak perlu mengetik jika warga ingin mengambil seluruh uangnya) dan tombol pecahan input manual.
  - Pesan peringatan otomatis berwarna merah jika Bendahara menginput nominal pencairan melebihi sisa saldo nasabah.
  - Tombol **"Konfirmasi & Serahkan Uang"** berwarna hijau zaitun gelap dengan modal pop-up konfirmasi yang jelas.

