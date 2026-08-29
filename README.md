# Web App Pencatatan Bank Sampah Rejosari

Sistem informasi berbasis web yang dirancang untuk digitalisasi pencatatan, transparansi publik, pengolahan transaksi, dan manajemen keuangan **Bank Sampah**. Aplikasi ini dikembangkan sebagai bagian dari program kerja **KKN Wedomartani** untuk mempermudah operasional pengurus dan memberikan akses informasi real-time bagi nasabah/masyarakat.

---

## Fitur Utama

### 1. Portal Publik (`/`)
- **Transparansi Statistics**: Menampilkan total sampah terkelola, total tabungan terdistribusi, serta dampak positif terhadap lingkungan (pengurangan emisi CO₂, penghematan energi, dll.).
- **Papan Peringkat (Leaderboard)**: Mengapresiasi kontribusi nasabah dan wilayah RT teraktif dalam menyetor sampah.
- **Pencarian & Cek Saldo Nasabah**: Nasabah dapat mengecek saldo tabungan dan riwayat transaksi setoran secara mandiri hanya dengan menggunakan Nomor Induk / ID Nasabah.

### 2. Dashboard Pengurus & Operasional (`/dashboard`)
- **Ringkasan Analitik**: Visualisasi grafik tren setoran harian/bulanan, distribusi jenis sampah, dan indikator keuangan.
- **Input Setor Sampah (`/dashboard/setor`)**: Formulir penimbangan & pencatatan transaksi sampah masuk secara cepat berbasis kategori sampah dan kalkulasi otomatis nominal rupiah.
- **Manajemen Data Nasabah (`/dashboard/nasabah`)**: Pengelolaan profil nasabah, akumulasi berat sampah, riwayat saldo, serta cetak/ekspor data.
- **Penjualan ke Pengepul (`/dashboard/pengepul`)**: Pencatatan transaksi penyaluran/penjualan sampah ke pihak pengepul atau mitra daur ulang.
- **Manajemen Keuangan & Kas (`/dashboard/keuangan`)**: Pencatatan kas keluar-masuk operasional bank sampah.
- **Pencairan Saldo (`/dashboard/pencairan`)**: Pengajuan dan konfirmasi penarikan saldo tabungan nasabah.
- **Laporan & Rekapitulasi (`/dashboard/laporan`)**: Rekapitulasi laporan berkala untuk transparansi pengurus dan warga.
- **Pengaturan Sistem (`/dashboard/settings`)**: Fleksibilitas dalam mengubah daftar jenis sampah, harga beli/jual per kg, aturan minimal berat, dan informasi profil bank sampah.
- **Panduan Penggunaan (`/dashboard/panduan`)**: Modul petunjuk langkah demi langkah operasional bagi pengurus baru.

---

## Teknologi & Tools

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **UI & Icon**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Backend Services**: [Supabase](https://supabase.com/) (PostgreSQL Database, Auth, & Realtime)

---

## Struktur Direktori Project

```text
pencatatanbanksampah-webapp/
├── src/
│   ├── app/
│   │   ├── dashboard/          # Modul Dashboard Pengurus (Setor, Nasabah, Keuangan, dll.)
│   │   ├── login/              # Halaman Login Pengurus
│   │   ├── globals.css         # Styling global & Tailwind CSS
│   │   ├── layout.tsx          # Root Layout Aplikasi
│   │   └── page.tsx            # Landing Page / Portal Publik
│   └── lib/
│       └── supabase.ts         # Konfigurasi Client Supabase
├── supabase/                   # Skrip & Migrasi Database SQL
│   └── schema.sql              # Skema tabel utama (nasabah, transaksi, harga, dll.)
│
├── public/                     # Asset Statis (Gambar, Icon, Favicon)
└── package.json
```

---

## Panduan Memulai (Quick Start)

### 1. Prasyarat
Pastikan kamu telah menginstall:
- [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
- Git CLI

### 2. Kloning Repository
```bash
git clone https://github.com/yarvyaren/pencatatanbanksampah-webapp.git
cd pencatatanbanksampah-webapp
```

### 3. Install Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variable
Buat berkas `.env.local` di root folder project, lalu masukkan kredensial project Supabase kamu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Setup Database Supabase
1. Buka [Supabase Dashboard](https://database.new) dan buat project baru.
2. Masuk ke **SQL Editor** di Supabase Dashboard.
3. Salin isi file `supabase/schema.sql` lalu jalankan (**Run**) untuk membuat seluruh tabel dan fungsi yang dibutuhkan.
4. *(Opsional)* Jalankan berkas skrip pendukung lainnya seperti `supabase/add_leaderboard_rating.sql` dan `supabase/add_minimal_berat.sql` jika diperlukan.

### 6. Jalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya.

---

## Build & Production

Untuk membuat build produksi:
```bash
npm run build
```

Untuk menjalankan server produksi secara lokal setelah build:
```bash
npm run start
```

---

## Lisensi & Kontribusi

Dikembangkan oleh **Tim KKN Wedomartani** untuk keberlanjutan lingkungan dan pemberdayaan ekonomi masyarakat berbasis Bank Sampah.

---
*Dibuat untuk Masyarakat Wedomartani.*


