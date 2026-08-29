-- SKEMA DATABASE SUPABASE / POSTGRESQL - BASAH REJOSARI

-- 1. Tabel users (Pengurus)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'ketua', 'sekretaris', 'bendahara', 'petugas')) NOT NULL,
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    foto_url TEXT,                         -- URL foto profil muka petugas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel nasabah
CREATE TABLE IF NOT EXISTS nasabah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_nasabah VARCHAR(50) UNIQUE NOT NULL, -- Contoh format: RJS001, RJS002
    nama VARCHAR(255) NOT NULL,            -- Nama kepala keluarga/perwakilan
    rt_rw VARCHAR(50) NOT NULL,             -- Contoh: "RT 01/RW 18"
    no_hp VARCHAR(20),
    saldo DECIMAL(15, 2) DEFAULT 0.00,      -- Saldo aktif saat ini
    foto_url TEXT,                         -- URL foto muka perwakilan nasabah
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel jenis_sampah
CREATE TABLE IF NOT EXISTS jenis_sampah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_sampah VARCHAR(100) UNIQUE NOT NULL, -- Contoh: "Botol Plastik", "Kardus", "Kaleng"
    satuan VARCHAR(20) DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel harga_nasabah (Harga Beli & Acuan Aktif)
CREATE TABLE IF NOT EXISTS harga_nasabah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis_sampah_id UUID REFERENCES jenis_sampah(id) ON DELETE CASCADE,
    harga_jual DECIMAL(15, 2) NOT NULL,       -- Harga acuan jual ke pengepul
    potongan_kas DECIMAL(15, 2) NOT NULL,     -- Potongan untuk kas/petugas
    harga_beli DECIMAL(15, 2) GENERATED ALWAYS AS (harga_jual - potongan_kas) STORED, -- Harga bersih diterima nasabah
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel pengepul
CREATE TABLE IF NOT EXISTS pengepul (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    kontak VARCHAR(100),
    alamat TEXT,
    jadwal_ambil VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel harga_pengepul (Harga Jual per Pengepul)
CREATE TABLE IF NOT EXISTS harga_pengepul (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengepul_id UUID REFERENCES pengepul(id) ON DELETE CASCADE,
    jenis_sampah_id UUID REFERENCES jenis_sampah(id) ON DELETE CASCADE,
    harga_jual DECIMAL(15, 2) NOT NULL,       -- Harga beli dari pengepul
    minimal_berat DECIMAL(10, 2) DEFAULT 0.00, -- Batas minimal berat timbangan untuk angkut
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pengepul_id, jenis_sampah_id)
);

-- 7. Tabel setoran (Nasabah -> Bank Sampah)
CREATE TABLE IF NOT EXISTS setoran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id),
    jenis_sampah_id UUID REFERENCES jenis_sampah(id),
    berat DECIMAL(10, 2) NOT NULL,            -- Berat sampah (kg)
    harga_jual_saat_ini DECIMAL(15, 2) NOT NULL, -- Harga acuan pengepul saat transaksi
    potongan_kas_saat_ini DECIMAL(15, 2) NOT NULL, -- Potongan kas saat transaksi
    harga_beli_saat_ini DECIMAL(15, 2) NOT NULL, -- Harga bersih nasabah saat transaksi
    total_nilai DECIMAL(15, 2) NOT NULL,      -- Hasil: berat * harga_beli_saat_ini
    foto_timbangan_url TEXT,                  -- URL foto timbangan (maks 1MB)
    petugas_id UUID REFERENCES users(id),     -- Petugas yang memproses
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel penjualan_pengepul (Bank Sampah -> Pengepul)
CREATE TABLE IF NOT EXISTS penjualan_pengepul (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengepul_id UUID REFERENCES pengepul(id),
    jenis_sampah_id UUID REFERENCES jenis_sampah(id),
    berat DECIMAL(10, 2) NOT NULL,
    harga_jual_saat_ini DECIMAL(15, 2) NOT NULL, -- Harga jual saat transaksi
    total_nilai DECIMAL(15, 2) NOT NULL,      -- Hasil: berat * harga_jual_saat_ini
    petugas_id UUID REFERENCES users(id),     -- Bendahara yang memproses
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel pencairan_saldo
CREATE TABLE IF NOT EXISTS pencairan_saldo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id),
    nominal_pencairan DECIMAL(15, 2) NOT NULL,
    saldo_awal DECIMAL(15, 2) NOT NULL,       -- Saldo sebelum dicairkan
    saldo_akhir DECIMAL(15, 2) NOT NULL,      -- Saldo setelah dicairkan
    petugas_id UUID REFERENCES users(id),     -- Bendahara yang memproses
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel riwayat_saldo
CREATE TABLE IF NOT EXISTS riwayat_saldo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id),
    tipe VARCHAR(20) CHECK (tipe IN ('setoran', 'pencairan')) NOT NULL,
    reference_id UUID NOT NULL,               -- ID setoran atau ID pencairan
    nominal DECIMAL(15, 2) NOT NULL,          -- + untuk setor, - untuk cair
    saldo_akhir DECIMAL(15, 2) NOT NULL,      -- Saldo setelah transaksi ini
    keterangan TEXT,                          -- Catatan opsional
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabel keuangan_kas
CREATE TABLE IF NOT EXISTS keuangan_kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipe VARCHAR(10) CHECK (tipe IN ('masuk', 'keluar')) NOT NULL,
    kategori VARCHAR(100) NOT NULL,           -- Kategori kas (misal: "Penjualan Pengepul", "Bagi Hasil/Fee Petugas", dst)
    nominal DECIMAL(15, 2) NOT NULL,
    keterangan TEXT,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Tabel vote_petugas
CREATE TABLE IF NOT EXISTS vote_petugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasabah_id UUID REFERENCES nasabah(id) ON DELETE CASCADE UNIQUE, -- Setiap warga hanya boleh memilih 1 petugas (1 vote)
    petugas_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ulasan TEXT,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vote_petugas DISABLE ROW LEVEL SECURITY;

-- 13. View Peringkat Warga Teraktif (Penyetor Kiloan Terbanyak)
CREATE OR REPLACE VIEW view_leaderboard_berat AS
SELECT 
    n.id AS nasabah_id,
    n.nama,
    n.no_nasabah,
    n.foto_url,
    COALESCE(SUM(s.berat), 0) AS total_berat
FROM nasabah n
LEFT JOIN setoran s ON n.id = s.nasabah_id
GROUP BY n.id, n.nama, n.no_nasabah, n.foto_url
ORDER BY total_berat DESC
LIMIT 5;

-- 14. View Peringkat Warga dengan Tabungan Terbanyak
CREATE OR REPLACE VIEW view_leaderboard_saldo AS
SELECT 
    id AS nasabah_id,
    nama,
    no_nasabah,
    foto_url,
    saldo
FROM nasabah
ORDER BY saldo DESC
LIMIT 5;

-- 15. View Peringkat Rating Kepuasan Petugas (Terfavorit hasil vote)
CREATE OR REPLACE VIEW view_leaderboard_rating AS
SELECT 
    u.id AS petugas_id,
    u.nama,
    u.role,
    u.foto_url,
    COUNT(v.id) AS total_vote
FROM users u
LEFT JOIN vote_petugas v ON u.id = v.petugas_id
GROUP BY u.id, u.nama, u.role, u.foto_url
ORDER BY total_vote DESC;

