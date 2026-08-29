Nah, sekarang kebutuhannya sudah jauh lebih jelas. Dari rancangan Anda, **BASAH Rejosari (BAnk SAmpaH Rejosari)** sebaiknya jangan dibuat seperti sekadar website pencatatan, tetapi sebagai **sistem administrasi dan transaksi bank sampah** yang punya tiga lapisan: data nasabah, operasional setoran, dan keuangan.

Ada beberapa hal yang perlu kita luruskan dulu, terutama **role akses, harga sampah per pengepul, saldo saat pencairan, dan fee petugas**.

## 1. Struktur fungsi BASAH Rejosari

Saya akan merapikan rancangan Anda menjadi seperti ini:

### A. Dashboard

Menampilkan ringkasan:

* Total nasabah aktif
* Total berat sampah terkumpul
* Total nilai sampah yang disetorkan nasabah
* Total transaksi penjualan ke pengepul
* Total pemasukan
* Total pengeluaran
* Saldo/kas bank sampah
* Ringkasan saldo seluruh nasabah
* Riwayat pemasukan dan pengeluaran terbaru
* Riwayat penjualan ke pengepul terbaru

Untuk **total transaksi dengan pengepul**, sebaiknya ditampilkan sebagai:

> **12 Transaksi Penjualan**

kemudian ketika diklik bisa melihat:

> 4 transaksi → Pengepul A
> 5 transaksi → Pengepul B
> 3 transaksi → Pengepul C

---

# 2. Data Nasabah

Saya setuju dengan keputusan Anda: **tidak perlu menyimpan nomor KK**.

Gunakan **satu nama perwakilan keluarga sebagai satu nasabah**.

Contoh:

| No. Nasabah | Nama Perwakilan | RT/RW       | No. HP |     Saldo |
| ----------- | --------------- | ----------- | ------ | --------: |
| RJS001      | Bapak A         | RT 01/RW 18 | 08xxx  | Rp125.000 |
| RJS002      | Ibu B           | RT 01/RW 18 | 08xxx  |  Rp85.000 |

Jadi konsepnya:

> **1 rumah/keluarga = 1 akun nasabah**

Tidak perlu mencatat semua anggota keluarga.

### Detail nasabah

Ketika nama nasabah diklik:

**Bapak A — RJS001**

* RT/RW
* Nomor HP
* Saldo saat ini
* Total setoran
* Total berat sampah
* Riwayat setoran
* Riwayat pencairan
* Riwayat saldo

Jadi warga/pengurus bisa melihat **saldo terbentuk dari mana**.

---

# 3. Setor Sampah

Bagian ini menurut saya perlu sedikit diubah dari rancangan awal.

### Form Setoran

**Tanggal & waktu**
→ otomatis dari sistem

**Nama nasabah**
→ pilih dari database

**Jenis sampah**
→ pilih dari daftar aktif

**Berat**
→ misalnya 2,5 kg

**Harga/kg**
→ **otomatis mengikuti harga yang berlaku pada saat transaksi**

**Total nilai**
→ otomatis:

> Berat × Harga/kg

**Petugas**
→ otomatis berdasarkan akun yang sedang login

**Foto bukti**
→ upload maksimal 2 MB

### Apakah 2 MB cukup?

**Cukup.**

Untuk foto bukti setor, 2 MB malah sudah cukup besar untuk kebutuhan administrasi. Saya justru menyarankan:

> **Maksimal 2 MB/foto × maksimal 2 foto**

Misalnya:

* Foto 1 → sampah sebelum ditimbang
* Foto 2 → proses/hasil penimbangan

Tetapi **jangan memaksa setiap transaksi harus upload foto** kalau nanti justru membuat petugas malas menggunakan sistem. Bisa dibuat **opsional** atau diwajibkan hanya untuk kondisi tertentu.

---

# 4. Bagian paling penting: jenis sampah + harga per pengepul

Pemikiran Anda **sudah tepat**.

Jangan membuat:

> Botol plastik = Rp3.000/kg

secara global.

Karena:

> Pengepul A → Botol plastik Rp3.000/kg
> Pengepul B → Botol plastik Rp3.500/kg

Maka struktur datanya harus **harga berdasarkan pengepul**.

Contohnya:

### Pengepul A

| Jenis Sampah  | Harga/kg |
| ------------- | -------: |
| Botol plastik |  Rp3.000 |
| Kardus        |  Rp2.000 |
| Kaleng        |  Rp4.000 |

### Pengepul B

| Jenis Sampah  | Harga/kg |
| ------------- | -------: |
| Botol plastik |  Rp3.500 |
| Kardus        |  Rp2.500 |
| Kaleng        |  Rp3.800 |

Dan petugas/admin bisa:

**Tambah jenis sampah**

atau

**Edit harga sampah untuk pengepul tertentu.**

---

## Tetapi ada satu hal penting.

Saat nasabah menyetor sampah, sistem **jangan mengambil harga terbaru secara dinamis** untuk transaksi lama.

Misalnya:

29 Agustus:

> Botol plastik = Rp3.000/kg

Bapak A setor:

> 5 kg × Rp3.000 = Rp15.000

Kemudian 2 September harga berubah:

> Botol plastik = Rp3.500/kg

Transaksi tanggal 29 Agustus **tetap Rp15.000**, jangan ikut berubah menjadi Rp17.500.

Jadi setiap transaksi harus menyimpan:

> **Jenis sampah + berat + harga saat transaksi + nilai transaksi**

Ini sangat penting untuk menjaga histori dan transparansi.

---

# 5. Tapi ada pertanyaan penting: harga siapa yang digunakan untuk saldo nasabah?

Ini perlu ditentukan bersama pengurus.

Karena ada dua transaksi yang berbeda:

### Transaksi A — Warga → Bank Sampah

Misalnya warga menyerahkan:

> 5 kg botol plastik

Bank sampah memberikan nilai:

> Rp15.000

Saldo warga:

> +Rp15.000

### Transaksi B — Bank Sampah → Pengepul

Kemudian bank sampah menjual:

> 100 kg botol plastik

kepada Pengepul A dengan harga:

> Rp3.000/kg = Rp300.000

**Harga transaksi warga dan harga transaksi pengepul tidak harus sama.**

Nah, **selisih inilah yang nantinya bisa menjadi sumber kas/biaya operasional/fee sesuai aturan yang disepakati.**

---

# 6. Bagian Fee Petugas

Nah, untuk ini saya **tidak menyarankan langsung menetapkan persentase sebelum tahu margin nyata bank sampah**.

Misalnya:

Warga diberi nilai:

> Rp3.000/kg

Bank sampah menjual ke pengepul:

> Rp3.500/kg

Margin:

> Rp500/kg

Kalau langsung diberikan:

> 10% dari seluruh nilai penjualan

bisa jadi terlalu besar atau terlalu kecil tergantung kondisi.

### Saya lebih menyarankan konsep:

**Harga jual ke pengepul**
− **nilai yang menjadi hak nasabah**
= **margin bank sampah**

Kemudian margin tersebut dibagi berdasarkan kesepakatan.

Contoh **ilustrasi saja**:

> Margin = Rp100.000

Bisa disepakati:

* **60% → kas/operasional bank sampah**
* **30% → insentif/fee petugas**
* **10% → dana pengembangan/kegiatan sosial**

Tapi angka **60/30/10 ini jangan dimasukkan sebagai ketentuan final** sebelum dibahas dengan masyarakat.

Alternatif yang bahkan lebih sederhana untuk tahap awal:

> **Fee petugas dihitung berdasarkan kegiatan operasional**, bukan persentase penjualan.

Misalnya ada insentif per hari operasional atau per kegiatan penimbangan.

Ini lebih mudah dikelola dan tidak membuat keuangan terlalu rumit.

---

# 7. Fitur Pencairan Saldo

Nah, **ini memang harus menjadi menu tersendiri**.

Jangan dimasukkan ke menu Setor Sampah.

Saya sarankan:

## 💰 Menu "Pencairan Saldo"

Misalnya satu tahun kemudian:

**Nasabah: Bapak A**

Saldo:

> Rp250.000

Kemudian melakukan pencairan:

> Rp250.000

Sistem otomatis mencatat:

**Saldo awal:** Rp250.000
**Pencairan:** -Rp250.000
**Saldo akhir:** Rp0

Dan masuk ke:

> **Riwayat Pencairan**

---

### Kalau pencairannya sebagian?

Misalnya:

Saldo:

> Rp500.000

Dicairkan:

> Rp200.000

Maka:

> Saldo akhir = Rp300.000

Jadi sistem harus memungkinkan:

**Pencairan sebagian maupun seluruh saldo.**

---

# 8. Jangan menghapus riwayat saldo

Ini sangat penting.

Jangan ketika pencairan Rp250.000 dilakukan, sistem hanya mengubah:

> Saldo = Rp0

Tanpa histori.

Harus ada:

### Riwayat Saldo

| Tanggal | Jenis     | Keterangan         |   Nominal |    Saldo |
| ------- | --------- | ------------------ | --------: | -------: |
| 29/8    | Setoran   | Botol plastik 5 kg | +Rp15.000 | Rp15.000 |
| 1/9     | Setoran   | Kardus 3 kg        |  +Rp6.000 | Rp21.000 |
| 7/9/27  | Pencairan | Pencairan tahunan  | -Rp21.000 |      Rp0 |

Dengan begitu, kalau warga bertanya:

> "Saldo saya kok segini?"

pengurus dapat menunjukkan histori.

---

# 9. Menu Kemitraan/Pengepul

Saya sarankan strukturnya:

### Pengepul A

**Informasi**

* Nama
* Kontak
* Alamat (opsional)
* Jadwal pengambilan

**Daftar Harga**

| Jenis         | Harga/kg | Status |
| ------------- | -------: | ------ |
| Botol plastik |  Rp3.000 | Aktif  |
| Kardus        |  Rp2.000 | Aktif  |

**Riwayat Penjualan**

| Tanggal | Total Berat | Total Nilai |
| ------- | ----------: | ----------: |
| 1 Sept  |       50 kg |   Rp150.000 |
| 7 Sept  |       75 kg |   Rp225.000 |

Jadi ketika pengurus membuka **Pengepul A**, seluruh informasi terkait pengepul tersebut ada di satu tempat.

---

# 10. Sekarang soal ROLE — ini yang perlu dibedakan

Menurut saya jangan hanya:

> Penglihat – Petugas – Admin

Karena struktur organisasi Anda punya fungsi yang berbeda.

Saya menyarankan **4 role**:

### 👑 1. KETUA

Bisa melihat:

* Dashboard
* Nasabah
* Setoran
* Keuangan
* Pengepul
* Laporan
* Pencairan

Tetapi **tidak harus bisa mengubah semua pengaturan sistem**.

---

### 📝 2. SEKRETARIS

Fokus pada administrasi:

* Tambah/edit nasabah
* Data pengurus
* Jadwal
* Administrasi
* Riwayat kegiatan
* Laporan administrasi

---

### 💰 3. BENDAHARA

Fokus keuangan:

* Melihat setoran
* Saldo nasabah
* Pencairan
* Pemasukan
* Pengeluaran
* Penjualan
* Laporan keuangan

---

### ♻️ 4. PETUGAS OPERASIONAL

Fokus lapangan:

* Input setoran
* Pemilahan
* Penimbangan
* Upload foto
* Melihat data nasabah
* Melihat jenis/harga sampah yang aktif

---

### ⚙️ 5. ADMIN SISTEM

**Ini bukan jabatan struktural bank sampah.**

Ini akun teknis untuk:

* Membuat akun
* Menghapus/nonaktifkan akun
* Mengatur role
* Mengatur jenis sampah
* Mengatur harga
* Backup database
* Pengaturan sistem

**Admin sistem sebaiknya dipegang orang yang dipercaya dan paham webapp.**

Kalau Anda sebagai mahasiswa KKN menjadi admin sistem sementara, **sebelum KKN selesai harus dilakukan serah terima akun admin kepada pihak yang ditunjuk masyarakat.**

---

# 11. Bagaimana dengan "Penglihat"?

Menurut saya **Penglihat tidak perlu menjadi role utama**.

Lebih bagus dibuat sebagai:

### 👁️ Mode Viewer

Misalnya Ketua/RW atau pihak tertentu hanya perlu melihat:

* jumlah nasabah,
* jumlah sampah,
* statistik,
* laporan.

Mereka **tidak dapat mengedit data**.

Jadi:

> **Viewer = akses baca saja (read-only)**

Bukan pengurus.

---

# 12. Struktur akhirnya

Jadi BASAH Rejosari kira-kira seperti ini:

```text
                    BASAH REJOSARI
                          │
                    ┌─────┴─────┐
                    │           │
                  ADMIN       PENGURUS
                  SISTEM         │
                                │
          ┌──────────┬──────────┼──────────┐
          │          │          │          │
        KETUA    SEKRETARIS  BENDAHARA  OPERASIONAL
                                              │
                                    Pemilahan & Penimbangan
                                              │
                                        Koordinator
                                        Kemitraan*
```

* **Koordinator Kemitraan** bisa diberikan akses khusus terhadap modul pengepul/penjualan, atau jika ingin sistem lebih sederhana, aksesnya dapat digabung dengan **Ketua/Operasional**.

---

## 13. Satu hal lagi: watermark KKN

Untuk:

> **KKN UNIT 57 ANGKATAN 73**

Saya sarankan **jangan menjadikannya watermark permanen di setiap halaman sebagai identitas utama sistem**.

Lebih elegan kalau di footer:

> **BASAH Rejosari — Sistem Informasi Bank Sampah Rejosari**
> *Inisiasi dan pengembangan oleh KKN Unit 57 Angkatan 73*

Dengan begitu setelah KKN selesai, **BASAH Rejosari tetap terasa sebagai sistem milik masyarakat**, bukan "website milik KKN".

---

# 🎯 Jadi versi MVP BASAH Rejosari

Kalau waktu Anda terbatas, saya akan mengunci **8 modul inti**:

1. **Dashboard**
2. **Nasabah**
3. **Setor Sampah**
4. **Saldo Nasabah**
5. **Pencairan**
6. **Keuangan**
7. **Pengepul & Harga**
8. **Laporan**

Dengan role:

> **Ketua | Sekretaris | Bendahara | Petugas | Admin Sistem | Viewer**

Dan database harus mampu membedakan:

> **Harga sampah berdasarkan pengepul + harga yang berlaku pada saat transaksi.**

Ini fondasi yang paling penting. Setelah fondasi ini benar, barulah kita masuk ke **desain halaman/UI dan database**. Jangan coding dulu sebelum dua hal tersebut benar-benar jelas, karena perubahan struktur transaksi setelah webapp jadi justru akan merepotkan.
