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
4. Petugas menginput berat sampah (misal: 3.5 kg) dan mengunggah **1 foto timbangan** (maksimal 1MB, opsional tapi disarankan).
5. Sistem menghitung:
   - `total_nilai_nasabah` (untuk saldo nasabah) = `berat * harga_beli` (contoh: 3.5 * 2.200 = 7.700).
   - *Info Margin*: `estimasi_margin_kas` = `berat * potongan_kas_saat_ini` (contoh: 3.5 * 800 = 2.800).
6. Saat data disimpan:
   - Tambah baris baru di tabel `setoran` dengan merekam `harga_jual_saat_ini`, `potongan_kas_saat_ini` yang telah disesuaikan, dan `harga_beli_saat_ini` yang disesuaikan.
   - **Update saldo nasabah** di tabel `nasabah`: `saldo = saldo + total_nilai_nasabah`.
   - Tambah baris baru di tabel `riwayat_saldo` tipe `setoran`.



### 4.2. Alur Penjualan ke Pengepul (Bank Sampah -> Pengepul)
1. **Bendahara** memilih nama Pengepul dan Jenis Sampah.
2. Sistem mengambil `harga_jual` dari tabel `harga_pengepul` untuk jenis sampah dan pengepul terpilih.
3. Bendahara menginput berat total sampah yang dijual.
4. Sistem menghitung `total_nilai = berat * harga_jual`.
5. Saat data disimpan:
   - Tambah baris baru di tabel `penjualan_pengepul`.
   - **Update keuangan kas**: Tambah baris baru di tabel `keuangan_kas` dengan tipe `masuk`, kategori `"Penjualan Pengepul"`, nominal `total_nilai`, dan keterangan penjualan tersebut.

### 4.3. Alur Pencairan Saldo (Tabungan Nasabah)
1. **Bendahara** mencari nama nasabah yang ingin mencairkan saldo.
2. Sistem menampilkan data nasabah beserta saldo aktif saat ini (`saldo_awal`).
3. Bendahara menginput `nominal_pencairan`.
   - *Validasi*: `nominal_pencairan` tidak boleh melebihi `saldo_aktif`.
4. Sistem menghitung `saldo_akhir = saldo_awal - nominal_pencairan`.
5. Saat data disimpan:
   - Tambah baris baru di tabel `pencairan_saldo`.
   - **Update saldo nasabah** di tabel `nasabah`: `saldo = saldo_akhir`.
   - Tambah baris baru di tabel `riwayat_saldo` tipe `pencairan`.
   - **Update keuangan kas**: Tambah baris baru di tabel `keuangan_kas` dengan tipe `keluar`, kategori `"Pencairan Saldo Nasabah"`, nominal `nominal_pencairan`, dan keterangan pencairan.

### 4.4. Alur Pembagian Kas / Fee Petugas (Bagi Hasil)
1. Keuntungan/margin bank sampah diperoleh dari selisih `harga_jual_pengepul` dengan `harga_beli_nasabah` yang terkumpul di kas umum.
2. Ketika pengurus sepakat membagikan fee/insentif secara offline:
   - **Bendahara** membuka menu Keuangan Kas.
   - Menginput transaksi baru: Tipe `keluar`, kategori `"Bagi Hasil/Fee Petugas"`, nominal sesuai kesepakatan, dan keterangan (misal: "Pembagian fee bulan Agustus untuk 4 petugas").
   - Transaksi disimpan dan saldo kas umum bank sampah akan berkurang secara otomatis.

---

## 5. Panduan Desain UI/UX Antar-Generasi (Orang Tua & Remaja)

Aplikasi BASAH Rejosari akan dioperasikan oleh kelompok usia yang sangat beragam, mulai dari bapak/ibu dusun (pengurus/nasabah senior) hingga remaja karang taruna (petugas lapangan). Oleh karena itu, antarmuka (UI/UX) harus memenuhi kriteria berikut:

### 5.1. Kriteria Desain untuk Orang Tua (Aksesibilitas Tinggi)
* **Keterbacaan Font**: Ukuran teks utama minimal `16px` untuk paragraf dan `18px - 20px` untuk label input serta tombol. Menggunakan font Sans-serif yang bersih (seperti *Inter* atau *Outfit*).
* **Kontras Warna Tinggi**: Memenuhi standar keterbacaan WCAG AA agar tetap terlihat jelas saat digunakan di luar ruangan (outdoor) di bawah sinar matahari selama kegiatan penimbangan sampah.
* **Ukuran Tombol & Input**: Area sentuh (touch target) berukuran minimal `48px x 48px` untuk mencegah salah klik oleh orang tua.
* **Bahasa Sederhana**: Menghindari istilah teknis atau perbankan yang rumit. Menggunakan bahasa Indonesia yang akrab di telinga masyarakat dusun:
  * *"Setor Sampah"* (bukan *Input Log Transaksi Setoran*)
  * *"Tarik Tabungan"* atau *"Cairkan Saldo"* (bukan *Withdrawal Ledger*)
  * *"Data Warga"* (bukan *Manajemen Akun Entitas Nasabah*)
* **Ikon dengan Label**: Navigasi dan tombol tidak boleh hanya menampilkan ikon saja (misal ikon ⚙️), melainkan wajib disertai teks penjelasan (misal: ⚙️ Pengaturan).

### 5.2. Kriteria Desain untuk Remaja (Modern & Interaktif)
* **Tata Letak Bersih (Clean Webapp Style)**: Desain bergaya modern dengan sudut membulat (*rounded corners*), bayangan halus (*subtle shadows*), dan navigasi sidebar yang ergonomis.
* **Visualisasi Grafik**: Dashboard dilengkapi dengan chart visual yang interaktif (menggunakan grafik batang/garis) untuk menunjukkan tren pengumpulan sampah mingguan dan pertumbuhan kas.
* **Desain Mobile-First**: Halaman input setoran sampah harus sangat responsif dan dioptimalkan untuk perangkat HP (smartphone), karena petugas muda akan menginput data langsung di lokasi penimbangan.
* **Mikro-Animasi**: Transisi antarhalaman dan efek hover tombol yang halus untuk meningkatkan kepuasan pengguna saat bernavigasi.

### 5.3. Palet Warna Eco & Professional
* **Hijau Daun (Primary - Forest Green)**: Melambangkan lingkungan hidup dan gerakan bank sampah.
* **Biru Navy / Teal (Secondary)**: Melambangkan transparansi keuangan, tabungan, dan keamanan kas.
* **Abu-Abu Terang (Neutral)**: Untuk warna latar belakang agar mata tidak cepat lelah saat pengurus menginput banyak data sekaligus.

---

### 5.4. Prompt Generator UI/UX (Dapat Disalin untuk Pembuatan Desain)

> [!TIP]
> Salin teks di bawah ini untuk digunakan sebagai prompt ketika men-generate mockup UI, ilustrasi, atau kode frontend:
>
> ```text
> Create a responsive web app UI/UX design for a waste bank administration system called "BASAH Rejosari" using Tailwind CSS. The design must bridge two target user groups: elderly/parents (who need extreme simplicity) and teenagers (who appreciate modern aesthetics).
> 
> Key UX/UI Requirements:
> 1. Accessibility for Seniors:
>    - Large, highly legible typography (minimum 16px body, 18px for inputs and buttons) using clean fonts like Inter or Outfit.
>    - High color contrast (WCAG AA compliant) suitable for outdoor sunlight use.
>    - Touch targets must be at least 48px height/width with clear padding.
>    - Buttons and navigation items must have text labels next to icons (no icon-only buttons).
>    - Simple Indonesian copy (e.g., "Setor Sampah" instead of "Transaction Entry", "Cairkan Saldo" instead of "Withdrawal").
> 
> 2. Modern Feel for Teenagers/Youths:
>    - A clean dashboard cards layout with subtle rounded corners (rounded-xl) and soft card shadows.
>    - Clean data visualization charts for weekly trash weight trends.
>    - Fully responsive layout optimized for mobile screens first, as operators input data on their mobile phones in the field.
> 
> 3. Clean Eco Palette:
>    - Primary Color: Deep Forest Green (#15803d) representing nature and recycling.
>    - Accent Color: Soft Teal or Ocean Blue representing trust, balance, and finance.
>    - Background: Clean off-white/light gray (#f8fafc) to reduce eye strain.
> ```
 

---

## 6. Layout & Alur Layar (Berdasarkan Referensi uireference.jpg)

Berdasarkan berkas gambar referensi [`uireference.jpg`](file:///c:/KKN%20Wedomartani/pencatatanbanksampah-webapp/dokumen/uireference.jpg), sistem BASAH Rejosari akan mengadaptasi gaya visual **"Earthy Sage & Olive Green"** yang bersih, minimalis, dan sangat cocok untuk aplikasi ramah lingkungan. Gaya ini memiliki tingkat keterbacaan yang sangat tinggi sehingga ramah untuk orang tua, sekaligus memiliki struktur tata letak kartu yang rapi dan disukai oleh remaja.

### 6.1. Spesifikasi Palet Warna
* **Latar Belakang Aplikasi**: Warm Off-White (`#F9F9F6`) & Light Sage Green (`#E2E8D5`)
* **Warna Utama (Header, Tombol Aktif)**: Olive Green (`#5E7A3E`)
* **Warna Aksen/Status**: Soft Mint (`#B9D3B0`)
* **Warna Teks & Ikon**: Dark Olive/Charcoal (`#202A14`)
* **Warna Negatif (Pencairan/Kas Keluar)**: Warm Terracotta/Red-Brown (`#A25B43`)

---

### 6.2. Alur & Layout Halaman Utama (Mobile-First Layout)

#### 1. Halaman Dashboard Publik (Viewer - Tanpa Login)
* **Tujuan**: Untuk warga melihat statistik dusun dan daftar harga aktif saat ini.
* **Layout & Komponen**:
  - **Header Hijau Zaitun**: Area hijau penuh di bagian atas (seperti layar 1 pada referensi) dengan teks putih tebal: **"BASAH REJOSARI"** dan keterangan KKN di bawahnya secara anggun.
  - **3 Kartu Statistik Bulat (Pill Grid)**: Menampilkan total nasabah aktif, total berat sampah (kg), dan total saldo kas dalam kartu berlatar belakang Sage terang.
  - **Daftar Harga Sampah Aktif (Card List seperti layar 5)**: Baris vertikal jenis sampah. Setiap baris memiliki:
    - Ikon jenis sampah (Botol, Kardus, Besi) di sebelah kiri.
    - Judul sampah tebal (misal: **Botol Plastik**).
    - Detail kecil di bawahnya: "Harga Pengepul: Rp3.000 | Potongan Kas: Rp1.000".
    - Di sebelah kanan terdapat **Tombol Hijau Bulat** yang menampilkan harga bersih nasabah secara mencolok: **"Rp2.000"** (sangat mudah dibaca oleh orang tua).
  - **Tombol Navigasi Bawah**: Tombol berbentuk kapsul/pill panjang bertuliskan **"Login Pengurus"** untuk dialihkan ke halaman Login.

#### 2. Halaman Login Pengurus
* **Tujuan**: Pintu masuk pengurus (Ketua, Sekretaris, Bendahara, Petugas).
* **Layout & Komponen (Mengadopsi layar 2)**:
  - Latar belakang putih dengan ilustrasi eco-minimalis di atas.
  - Input Email & Kata Sandi berukuran besar, berbentuk kapsul panjang dengan border hijau zaitun lembut.
  - Tombol **"Masuk Sistem"** berbentuk pill hijau zaitun pekat di bagian bawah yang mudah diklik dengan satu tangan (mobile-friendly).

#### 3. Halaman Dashboard Pengurus (Ketua/Sekretaris/Bendahara)
* **Tujuan**: Ringkasan performa bank sampah setelah masuk sistem.
* **Layout & Komponen (Mengadopsi layar 3 & 4)**:
  - **Header Profil Pengurus**: Menampilkan foto profil bulat petugas (avatar) di sisi kiri, diikuti oleh salam hangat, nama pengurus, dan Role-nya (contoh: "Halo, Ibu Bendahara").
  - **Grafik Tren Setoran (Layar 3)**: Grafik batang modern (chart.js/recharts) yang menunjukkan perkembangan setoran sampah warga setiap bulannya.
  - **Riwayat Transaksi Terbaru**: Menampilkan log transaksi terbaru dengan indikator warna hijau (setoran masuk) dan merah (pencairan keluar).
  - **Menu Navigasi Bawah (Bottom Navigation Bar)**: Bar navigasi dengan 4 tombol utama berikon bulat besar (Home, Nasabah, Transaksi, Pengaturan) agar petugas bisa berpindah menu dengan mudah menggunakan jempol.

#### 4. Halaman Setor Sampah (Khusus Petugas Lapangan)
* **Tujuan**: Input transaksi penimbangan sampah warga.
* **Layout & Komponen (Mengadopsi layar 9 & 11)**:
  - **Pencarian & Pilih Nasabah**: Input dropdown besar untuk mencari nama nasabah (berdasarkan nama kepala keluarga/RT).
  - **Grid Jenis Sampah (Layar 9)**: Pilihan jenis sampah berupa tombol-tombol kotak besar dengan ikon visual, sehingga petugas tidak perlu mengetik nama sampah.
  - **Input Berat Sampah**: Input angka besar dengan tombol "+" dan "-" untuk menyesuaikan berat secara cepat.
  - **Kalkulator Rincian Harga**: Kotak informasi besar yang menampilkan:
    - *Harga Pengepul*: Rp3.000/kg
    - *Potongan Kas*: Kolom input angka yang sudah terisi otomatis Rp1.000, namun **dapat diedit secara bebas** jika ada kesepakatan khusus.
    - *Harga Bersih Nasabah*: Angka besar tebal **Rp2.000/kg** (otomatis berkurang jika potongan kas dinaikkan).
    - *Total Diterima Nasabah*: Teks hasil perhitungan akhir berukuran besar berwarna hijau gelap.
  - **Unggah Foto Kamera (Layar 11)**: Kotak persegi besar dengan ikon kamera untuk mengambil foto timbangan sampah (maks 1MB).
  - **Tombol Simpan Transaksi**: Tombol kapsul lebar di bagian bawah layar berwarna hijau zaitun.

#### 5. Halaman Riwayat & Detail Nasabah (Bendahara & Sekretaris)
* **Tujuan**: Melihat riwayat setoran, riwayat pencairan, dan riwayat saldo nasabah tertentu.
* **Layout & Komponen (Mengadopsi layar 6 & 7)**:
  - **Kartu Identitas Nasabah (Layar 7)**: Kartu bulat berwarna Sage Green di bagian atas berisi: Foto profil muka nasabah (avatar bulat besar), Nama perwakilan, Nomor Nasabah (RJS001), Alamat (RT 01/RW 18), dan **Saldo Aktif saat ini** dalam ukuran teks sangat besar.
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

