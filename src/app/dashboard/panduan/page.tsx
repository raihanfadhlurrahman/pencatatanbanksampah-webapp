"use client";

import { useState } from "react";
import { 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  FileText, 
  Settings, 
  Truck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";

interface RoleGuide {
  id: string;
  title: string;
  roleBadge: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  responsibilities: string[];
  allowedFeatures: {
    name: string;
    description: string;
    link?: string;
  }[];
  restrictedFeatures: string[];
  workflowSteps: {
    step: number;
    title: string;
    detail: string;
  }[];
}

const ROLE_GUIDES: RoleGuide[] = [
  {
    id: "admin",
    title: "Administrator Sistem",
    roleBadge: "ADMIN",
    icon: ShieldCheck,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Pengelola penuh seluruh infrastruktur, akun pengurus, dan parameter sistem bank sampah.",
    responsibilities: [
      "Mengelola pendaftaran & penonaktifan akun pengurus/petugas dusun.",
      "Mengatur master data kategori sampah dan rumus persentase potongan kas dusun.",
      "Memastikan database Supabase dan integrasi keuangan berjalan lancar.",
      "Menangani pemulihan data atau transaksi yang salah diinput."
    ],
    allowedFeatures: [
      { name: "Manajemen Pengurus", description: "Menambah, mengedit role, dan mereset kata sandi akun pengurus.", link: "/dashboard/settings" },
      { name: "Pengaturan Kategori Sampah", description: "Menambah kategori baru & rumus potongan kas dusun.", link: "/dashboard/settings" },
      { name: "Akses Semua Transaksi", description: "Melakukan penimbangan, pencairan, dan inspeksi keuangan tanpa batasan.", link: "/dashboard" },
    ],
    restrictedFeatures: [
      "Tidak ada pembatasan (Akses Penuh Sistem)."
    ],
    workflowSteps: [
      { step: 1, title: "Konfigurasi Awal", detail: "Atur kategori sampah dan besaran potongan kas dusun di menu Pengaturan." },
      { step: 2, title: "Buat Akun Pengurus", detail: "Daftarkan akun untuk Ketua, Sekretaris, Bendahara, dan Petugas Timbangan." },
      { step: 3, title: "Pemantauan berkala", detail: "Cek laporan rekapitulasi keuangan dan setoran secara rutin setiap bulan." }
    ]
  },
  {
    id: "ketua",
    title: "Ketua & Pimpinan Dusun",
    roleBadge: "KETUA",
    icon: Award,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    description: "Pimpinan operasional yang memantau kinerja bank sampah dan menyalurkan umpan balik warga.",
    responsibilities: [
      "Memantau statistik total sampah terkumpul, tabungan warga, dan keuangan umum kas.",
      "Menginput pilihan Vote Petugas Terbaik secara transparan berdasarkan masukan warga.",
      "Mengevaluasi laporan rekapitulasi partisipasi warga bulanan."
    ],
    allowedFeatures: [
      { name: "Input Vote Petugas Terbaik", description: "Merekam 1 suara pilihan warga untuk apresiasi pengurus terbaik.", link: "/dashboard" },
      { name: "Papan Peringkat (Leaderboard)", description: "Memantau peringkat penyetor kiloan terbanyak dan tabungan tertinggi.", link: "/dashboard" },
      { name: "Laporan & Rekapitulasi", description: "Memeriksa tren partisipasi dusun dan laporan bulanan.", link: "/dashboard/laporan" },
    ],
    restrictedFeatures: [
      "Tidak dapat mengubah struktur akun pengurus atau meretas master database."
    ],
    workflowSteps: [
      { step: 1, title: "Pantau Ringkasan Beranda", detail: "Lihat total timbangan dan tabungan warga secara akumulatif." },
      { step: 2, title: "Rekam Vote Warga", detail: "Tekan tombol 'INPUT VOTE PETUGAS TERBAIK' di beranda untuk merekam masukan warga." },
      { step: 3, title: "Evaluasi Laporan Bulanan", detail: "Buka menu Laporan untuk mengunduh rekapitulasi setoran dusun." }
    ]
  },
  {
    id: "sekretaris",
    title: "Sekretaris Administrasi",
    roleBadge: "SEKRETARIS",
    icon: Users,
    color: "text-[#5E7A3E]",
    bgColor: "bg-[#E2E8D5]",
    description: "Penanggung jawab data pendataan warga, pencetakan nomor nasabah, dan dokumen laporan.",
    responsibilities: [
      "Mendaftarkan warga baru ke dalam sistem bank sampah.",
      "Memperbarui data identitas warga (Nomor HP, Wilayah RT/RW, dan foto).",
      "Memantau riwayat aktivitas dan keaktifan warga."
    ],
    allowedFeatures: [
      { name: "Pendataan Warga / Nasabah", description: "Registrasi warga baru, edit profil, dan pencarian cepat.", link: "/dashboard/nasabah" },
      { name: "Detail Buku Tabungan", description: "Melihat histori mutasi setoran dan pencairan tiap-tiap warga.", link: "/dashboard/nasabah" },
      { name: "Laporan Administrasi", description: "Mengeksport data partisipasi dan riwayat keaktifan warga.", link: "/dashboard/laporan" },
    ],
    restrictedFeatures: [
      "Tidak dapat melakukan transaksi pengeluaran kas umum bank sampah."
    ],
    workflowSteps: [
      { step: 1, title: "Registrasi Warga Baru", detail: "Buka menu Nasabah, klik 'Tambah Warga Baru', isi nama dan RT/RW." },
      { step: 2, title: "Bantu Pencarian Saldo Warga", detail: "Gunakan kolom pencarian cepat untuk mengecek buku tabungan warga." },
      { step: 3, title: "Cetak Rekap Data", detail: "Buka menu Laporan untuk melihat statistik keaktifan warga." }
    ]
  },
  {
    id: "bendahara",
    title: "Bendahara Keuangan",
    roleBadge: "BENDAHARA",
    icon: DollarSign,
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    description: "Penanggung jawab sirkulasi arus kas, penarikan tabungan warga, dan penetapan harga beli mitra.",
    responsibilities: [
      "Memproses penarikan/pencairan uang tabungan oleh warga.",
      "Mencatat pengeluaran dan pemasukan kas umum dusun.",
      "Mengatur acuan harga beli nasabah dan harga jual ke mitra pengepul."
    ],
    allowedFeatures: [
      { name: "Pencairan Saldo Warga", description: "Membuat transaksi penarikan tabungan dan mencetak kuitansi.", link: "/dashboard/pencairan" },
      { name: "Pencatatan Keuangan Kas", description: "Merekam dana masuk/keluar kas operasional dusun.", link: "/dashboard/keuangan" },
      { name: "Manajemen Mitra Pengepul", description: "Mengatur daftar pengepul mitra dan harga beli.", link: "/dashboard/pengepul" },
    ],
    restrictedFeatures: [
      "Tidak dapat menghapus transaksi tanpa persetujuan pimpinan."
    ],
    workflowSteps: [
      { step: 1, title: "Proses Penarikan Tabungan", detail: "Buka menu Pencairan Saldo, cari nama warga, masukkan nominal penarikan." },
      { step: 2, title: "Catat Transaksi Penjualan", detail: "Input hasil penjualan sampah ke pengepul di menu Keuangan Kas." },
      { step: 3, title: "Update Harga Beli", detail: "Sesuaikan harga jual ke mitra di menu Pengepul jika ada kenaikan harga pasar." }
    ]
  },
  {
    id: "petugas",
    title: "Petugas Lapangan (Timbangan)",
    roleBadge: "PETUGAS",
    icon: ArrowDownLeft,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Petugas operasional yang melakukan penimbangan sampah daur ulang warga di lokasi setoran.",
    responsibilities: [
      "Melakukan penimbangan berat sampah warga secara akurat.",
      "Memilih kategori sampah daur ulang yang sesuai.",
      "Mengunggah foto bukti fisik penimbangan jika diperlukan."
    ],
    allowedFeatures: [
      { name: "Form Penimbangan Sampah", description: "Catat setoran sampah warga secara real-time dengan tombol cepat.", link: "/dashboard/setor" },
      { name: "Pencarian Warga Cepat", description: "Mencari warga berdasarkan nama atau No. Nasabah secara instan.", link: "/dashboard/setor" },
      { name: "Riwayat Setoran Harian", description: "Memeriksa riwayat timbangan yang baru saja diinput.", link: "/dashboard/setor" },
    ],
    restrictedFeatures: [
      "Tidak dapat mencairkan uang tunai atau mengubah harga acuan sampah."
    ],
    workflowSteps: [
      { step: 1, title: "Cari Nama Penyetor", detail: "Di menu Setor Sampah, ketik nama atau ID warga pada kolom pencarian." },
      { step: 2, title: "Pilih Kategori & Timbang", detail: "Pilih tombol kategori sampah, lalu gunakan tombol +1, +0.1 untuk mencatat berat." },
      { step: 3, title: "Simpan Transaksi", detail: "Tekan tombol Simpan Transaksi. Saldo warga akan bertambah secara otomatis." }
    ]
  },
  {
    id: "warga",
    title: "Warga Publik (Nasabah)",
    roleBadge: "WARGA PUBLIK",
    icon: HelpCircle,
    color: "text-teal-700",
    bgColor: "bg-teal-100",
    description: "Masyarakat Dusun Rejosari yang menyetorkan sampah dan mengumpulkan saldo tabungan.",
    responsibilities: [
      "Memilah sampah daur ulang dari rumah tangga.",
      "Membawa sampah terpilah ke lokasi Bank Sampah Rejosari.",
      "Memantau saldo tabungan dan peringkat keaktifan dusun."
    ],
    allowedFeatures: [
      { name: "Pencarian Saldo Tabungan", description: "Mengecek sisa saldo dan mutasi setoran tanpa perlu login.", link: "/" },
      { name: "Papan Peringkat Dusun", description: "Melihat peringkat warga teraktif dan petugas terfavorit.", link: "/" },
      { name: "Daftar Harga Beli Sampah", description: "Memeriksa daftar harga beli sampah daur ulang per mitra.", link: "/" },
    ],
    restrictedFeatures: [
      "Tidak memiliki akses ke Dashboard Operasional Pengurus (memerlukan Login)."
    ],
    workflowSteps: [
      { step: 1, title: "Pilah Sampah Rumah", detail: "Pisahkan botol plastik, kardus, kaleng, dan kertas dari sampah organik." },
      { step: 2, title: "Setor & Timbang", detail: "Bawa sampah ke petugas penimbangan pada jadwal operasional." },
      { step: 3, title: "Cek Saldo Mandiri", detail: "Buka halaman utama web BASAH Rejosari, tekan tombol 'Cari Saldo'." }
    ]
  }
];

export default function PanduanPage() {
  const [activeTab, setActiveTab] = useState<string>("admin");

  const currentGuide = ROLE_GUIDES.find(g => g.id === activeTab) || ROLE_GUIDES[0];
  const GuideIcon = currentGuide.icon;

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="bg-[#5E7A3E] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black tracking-wide uppercase">
            <BookOpen className="h-4 w-4" />
            PANDUAN LENGKAP PENGGUNAAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Tugas & Wewenang Berdasarkan Peran (Role)
          </h1>
          <p className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed">
            Pelajari alur kerja operasional, hak akses fitur, serta Panduan Operasional Standar (SOP) untuk masing-masing pengurus Bank Sampah Rejosari.
          </p>
        </div>
        
        {/* Hiasan Latar Belakang */}
        <BookOpen className="absolute -right-6 -bottom-6 h-48 w-48 text-white/10 rotate-12 pointer-events-none" />
      </div>

      {/* TABS PERAN (ROLE SWITCHER) */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm overflow-x-auto gap-1">
        {ROLE_GUIDES.map((guide) => {
          const Icon = guide.icon;
          const isActive = activeTab === guide.id;
          return (
            <button
              key={guide.id}
              onClick={() => setActiveTab(guide.id)}
              className={`
                flex items-center gap-2 py-3 px-4 rounded-[1.5rem] text-xs font-black whitespace-nowrap transition-all duration-200 border-0 cursor-pointer
                ${isActive 
                  ? "bg-[#5E7A3E] text-white shadow-sm scale-100" 
                  : "bg-transparent text-[#202A14]/70 hover:bg-[#E2E8D5]/30 hover:text-[#202A14]"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{guide.title.split(" ")[0]}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase ${isActive ? "bg-white/20 text-white" : "bg-[#E2E8D5] text-[#202A14]"}`}>
                {guide.roleBadge}
              </span>
            </button>
          );
        })}
      </div>

      {/* DETAIL PERAN YANG DIPILIH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM UTAMA: RINCIAN TUGAS & SOP */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KARTU PROFIL PERAN */}
          <div className="bg-white p-6 sm:p-7 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8D5]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className={`${currentGuide.bgColor} p-3 rounded-2xl`}>
                  <GuideIcon className={`h-7 w-7 ${currentGuide.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#202A14]">{currentGuide.title}</h2>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${currentGuide.bgColor} ${currentGuide.color} px-2.5 py-0.5 rounded-full inline-block mt-1`}>
                    HAK AKSES: {currentGuide.roleBadge}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#202A14]/80 font-semibold leading-relaxed">
              {currentGuide.description}
            </p>

            {/* TUGAS UTAMA */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#202A14]/70 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#5E7A3E]" /> Tugas & Tanggung Jawab Utama
              </h3>
              <div className="space-y-2">
                {currentGuide.responsibilities.map((resp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 bg-[#F9F9F6] rounded-2xl border border-[#E2E8D5]/30 text-xs font-semibold text-[#202A14]">
                    <span className="h-5 w-5 bg-[#5E7A3E] text-white rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{resp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SOP LANGKAH OPERASIONAL */}
          <div className="bg-white p-6 sm:p-7 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wide text-[#202A14] border-b border-[#E2E8D5]/40 pb-2.5 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-[#5E7A3E]" /> Standard Operating Procedure (SOP Peran)
            </h3>

            <div className="space-y-3">
              {currentGuide.workflowSteps.map((step) => (
                <div key={step.step} className="flex items-start gap-4 p-4 bg-[#F9F9F6] rounded-[1.5rem] border border-[#E2E8D5]/40">
                  <div className="bg-[#5E7A3E] text-white h-8 w-8 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {step.step}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-[#202A14]">{step.title}</h4>
                    <p className="text-[11px] text-[#202A14]/70 font-semibold leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: FITUR YANG BISA DIBUKA & BATASAN */}
        <div className="space-y-6">
          
          {/* FITUR YANG DAPAT DIAKSES */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#5E7A3E] border-b border-[#E2E8D5]/40 pb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Fitur Utama yang Dapat Dibuka
            </h3>

            <div className="space-y-3">
              {currentGuide.allowedFeatures.map((feat, idx) => (
                <div key={idx} className="p-3.5 bg-[#F9F9F6] rounded-2xl border border-[#E2E8D5]/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#202A14]">{feat.name}</h4>
                    {feat.link && (
                      <Link 
                        href={feat.link} 
                        className="text-[9px] font-black text-[#5E7A3E] hover:underline flex items-center gap-0.5"
                      >
                        BUKA MENU <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <p className="text-[10px] text-[#202A14]/70 font-semibold leading-normal">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PEMBATASAN HAK AKSES */}
          <div className="bg-red-50/60 p-6 rounded-[2.5rem] border border-red-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-700 border-b border-red-200 pb-2 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" /> Pembatasan Hak Akses
            </h3>

            <div className="space-y-2">
              {currentGuide.restrictedFeatures.map((rest, idx) => (
                <div key={idx} className="text-xs text-red-900 font-semibold leading-relaxed flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>{rest}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KARTU BANTUAN */}
          <div className="bg-[#E2E8D5] p-5 rounded-[2.5rem] space-y-2 text-center">
            <HelpCircle className="h-7 w-7 text-[#5E7A3E] mx-auto" />
            <h4 className="text-xs font-black text-[#202A14] uppercase">Butuh Bantuan Lebih Lanjut?</h4>
            <p className="text-[10px] font-bold text-[#202A14]/75 leading-relaxed">
              Hubungi Pengurus Unit 57 KKN Wedomartani atau Administrator Sistem jika akun Anda mengalami kendala akses.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
