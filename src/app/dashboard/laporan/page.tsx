"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, 
  Printer, 
  Calendar, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Info,
  Award
} from "lucide-react";

interface SummaryData {
  totalSetoranBerat: number;
  totalSetoranNilai: number;
  totalPenjualanBerat: number;
  totalPenjualanNilai: number;
  totalPencairan: number;
  kasMasukLain: number;
  kasKeluarLain: number;
  surplusKas: number;
}

// Data Mock
const MOCK_SUMMARY: SummaryData = {
  totalSetoranBerat: 350.5,
  totalSetoranNilai: 720000,
  totalPenjualanBerat: 420.0,
  totalPenjualanNilai: 1150000,
  totalPencairan: 250000,
  kasMasukLain: 100000, // dana bantuan
  kasKeluarLain: 175000, // fee petugas + ATK
  surplusKas: 825000, // Jual (1150k) + Masuk Lain (100k) - Cair (250k) - Keluar Lain (175k) = 825k
};

export default function LaporanPage() {
  const [summary, setSummary] = useState<SummaryData>(MOCK_SUMMARY);
  const [periodRange, setPeriodRange] = useState<"1_bulan" | "2_bulan" | "3_bulan" | "6_bulan" | "1_tahun">("1_bulan");
  const [selectedMonth, setSelectedMonth] = useState("08"); // default Agustus
  const [selectedYear, setSelectedYear] = useState("2026");
  const [periodText, setPeriodText] = useState("");
  const [loading, setLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    loadLaporan();
  }, [periodRange, selectedMonth, selectedYear]);

  const getNamaBulan = (bulan: string) => {
    const listBulan: Record<string, string> = {
      "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
      "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
      "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
    };
    return listBulan[bulan] || "";
  };

  const loadLaporan = async () => {
    try {
      setLoading(true);
      
      let startDate = "";
      let endDate = "";
      let textLabel = "";

      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      if (periodRange === "1_tahun") {
        startDate = `${selectedYear}-01-01T00:00:00Z`;
        endDate = `${selectedYear}-12-31T23:59:59Z`;
        textLabel = `Tahun ${selectedYear}`;
      } else {
        const monthsBack = periodRange === "2_bulan" ? 1 : periodRange === "3_bulan" ? 2 : periodRange === "6_bulan" ? 5 : 0;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;

        const startMonthObj = new Date(year, month - 1 - monthsBack, 1);
        const startY = startMonthObj.getFullYear();
        const startM = String(startMonthObj.getMonth() + 1).padStart(2, '0');
        startDate = `${startY}-${startM}-01T00:00:00Z`;

        if (monthsBack === 0) {
          textLabel = `${getNamaBulan(selectedMonth)} ${selectedYear}`;
        } else {
          textLabel = `${getNamaBulan(startM)} ${startY} - ${getNamaBulan(selectedMonth)} ${selectedYear}`;
        }
      }

      setPeriodText(textLabel);

      // Fetch Setoran
      const { data: setoranData, error: setError } = await supabase
        .from("setoran")
        .select("berat, total_nilai")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      // Fetch Penjualan
      const { data: penjualanData, error: penError } = await supabase
        .from("penjualan_pengepul")
        .select("berat, total_nilai")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      // Fetch Pencairan
      const { data: pencairanData, error: cairError } = await supabase
        .from("pencairan_saldo")
        .select("nominal_pencairan")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      // Fetch Kas Umum
      const { data: kasData, error: kasError } = await supabase
        .from("keuangan_kas")
        .select("tipe, nominal, kategori")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      if (setError || penError || cairError || kasError) {
        setUsingMock(true);
        setSummary(MOCK_SUMMARY);
        return;
      }

      // Hitung kalkulasi real
      let totalSetoranBerat = 0;
      let totalSetoranNilai = 0;
      setoranData?.forEach(s => {
        totalSetoranBerat += Number(s.berat);
        totalSetoranNilai += Number(s.total_nilai);
      });

      let totalPenjualanBerat = 0;
      let totalPenjualanNilai = 0;
      penjualanData?.forEach(p => {
        totalPenjualanBerat += Number(p.berat);
        totalPenjualanNilai += Number(p.total_nilai);
      });

      let totalPencairan = 0;
      pencairanData?.forEach(c => {
        totalPencairan += Number(c.nominal_pencairan);
      });

      let kasMasukLain = 0;
      let kasKeluarLain = 0;
      kasData?.forEach(k => {
        if (k.tipe === "masuk" && k.kategori !== "Penjualan Pengepul") {
          kasMasukLain += Number(k.nominal);
        } else if (k.tipe === "keluar") {
          if (k.kategori !== "Pencairan Saldo Nasabah") {
            kasKeluarLain += Number(k.nominal);
          }
        }
      });

      const surplusKas = (totalPenjualanNilai + kasMasukLain) - (totalPencairan + kasKeluarLain);

      setSummary({
        totalSetoranBerat,
        totalSetoranNilai,
        totalPenjualanBerat,
        totalPenjualanNilai,
        totalPencairan,
        kasMasukLain,
        kasKeluarLain,
        surplusKas
      });
      setUsingMock(false);
    } catch (err) {
      setUsingMock(true);
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(angka);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER (Sembunyikan saat cetak) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase text-[#202A14] tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#5E7A3E]" />
            Laporan Rekapitulasi Operasional
          </h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Generasikan ringkasan sirkulasi tabungan dan operasional kas untuk dicetak sebagai berkas arsip
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-3 px-5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all self-start sm:self-center"
        >
          <Printer className="h-4.5 w-4.5" />
          CETAK LAPORAN
        </button>
      </div>

      {/* FILTER BULAN & TAHUN (Sembunyikan saat cetak) */}
      <div className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-xs font-black text-[#202A14]/80">
          <Calendar className="h-4 w-4 text-[#5E7A3E]" />
          PERIODE LAPORAN:
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Dropdown Rentang Periode */}
          <select
            value={periodRange}
            onChange={(e) => setPeriodRange(e.target.value as any)}
            className="px-4 py-2.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-black outline-none"
          >
            <option value="1_bulan">1 Bulan (Bulanan)</option>
            <option value="2_bulan">2 Bulan Terakhir</option>
            <option value="3_bulan">3 Bulan (Triwulan)</option>
            <option value="6_bulan">6 Bulan (Semester)</option>
            <option value="1_tahun">1 Tahun (Tahunan)</option>
          </select>

          {/* Dropdown Acuan Bulan */}
          {periodRange !== "1_tahun" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-black outline-none"
            >
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          )}

          {/* Dropdown Tahun */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-black outline-none"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        {usingMock && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#E2E8D5]/60 text-[#202A14] ml-auto">
            <Info className="h-3.5 w-3.5" /> Mode Demo (Data Acuan Sementara)
          </span>
        )}
      </div>

      {/* ======================================================== */}
      {/* PRINT-READY REPORT CONTAINER (TAMPIL DI LAYAR & HASIL CETAK) */}
      {/* ======================================================== */}
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm print:shadow-none print:border-none print:p-0 space-y-8 max-w-3xl mx-auto">
        
        {/* KOP LAPORAN DUSUN REJOSARI DENGAN LOGO RESMI */}
        <div className="text-center border-b-4 border-[#202A14] pb-5 flex flex-col items-center">
          <img 
            src="/image/logoBasah.png" 
            alt="Logo BASAH Rejosari" 
            className="h-20 w-auto object-contain mb-3 drop-shadow-sm" 
          />
          <h2 className="text-xl font-black tracking-wider uppercase text-[#202A14]">
            REKAPITULASI LAPORAN BANK SAMPAH "BASAH REJOSARI"
          </h2>
          <p className="text-xs font-bold text-[#202A14]/75 mt-0.5 uppercase">
            Rukun Tetangga 01/02/03/04 Rukun Warga 18, Dusun Rejosari, Wedomartani
          </p>
          <p className="text-xs font-black text-[#5E7A3E] mt-2 tracking-widest uppercase bg-[#E2E8D5]/40 px-4 py-1 rounded-full border border-[#E2E8D5]">
            Periode Laporan: {periodText}
          </p>
        </div>

        {/* METRIK STATISTIK PENCATATAN */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#202A14] border-b border-[#E2E8D5] pb-1.5">
            A. Operasional Penimbangan & Setoran Warga
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-[#E2E8D5]/20">
              <span className="text-[10px] font-bold text-[#202A14]/65 uppercase block">Total Berat Sampah Warga</span>
              <span className="text-lg font-black text-[#202A14] mt-1 block">{summary.totalSetoranBerat.toFixed(1)} kg</span>
            </div>
            
            <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-[#E2E8D5]/20">
              <span className="text-[10px] font-bold text-[#202A14]/65 uppercase block">Total Nilai Kredit Warga</span>
              <span className="text-lg font-black text-[#202A14] mt-1 block">{formatRupiah(summary.totalSetoranNilai)}</span>
            </div>
          </div>
        </div>

        {/* METRIK KEUANGAN & PEMBUKUAN KAS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#202A14] border-b border-[#E2E8D5] pb-1.5">
            B. Arus Kas Umum & Sirkulasi Keuangan
          </h3>
          
          <div className="space-y-2.5 text-xs font-semibold text-[#202A14]">
            
            {/* Pemasukan Kas */}
            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="flex items-center gap-1.5 text-green-700 font-bold">
                <ArrowDownLeft className="h-4.5 w-4.5" />
                Pemasukan Penjualan Sampah ke Pengepul (+)
              </span>
              <span className="font-black text-green-700">+{formatRupiah(summary.totalPenjualanNilai)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-100 pl-6 text-[11px] text-zinc-600">
              <span>*Akumulasi berat sampah terjual:</span>
              <span>{summary.totalPenjualanBerat.toFixed(1)} kg</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="flex items-center gap-1.5 text-green-700 font-bold">
                <ArrowDownLeft className="h-4.5 w-4.5" />
                Pemasukan Kas Lainnya (+)
              </span>
              <span className="font-black text-green-700">+{formatRupiah(summary.kasMasukLain)}</span>
            </div>

            {/* Pengeluaran Kas */}
            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="flex items-center gap-1.5 text-[#A25B43] font-bold">
                <ArrowUpRight className="h-4.5 w-4.5" />
                Pengeluaran Pencairan Tabungan Warga (-)
              </span>
              <span className="font-black text-[#A25B43]">-{formatRupiah(summary.totalPencairan)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="flex items-center gap-1.5 text-[#A25B43] font-bold">
                <ArrowUpRight className="h-4.5 w-4.5" />
                Pengeluaran Operasional / Fee Petugas (-)
              </span>
              <span className="font-black text-[#A25B43]">-{formatRupiah(summary.kasKeluarLain)}</span>
            </div>

            {/* Surplus/Defisit Periode */}
            <div className="flex justify-between items-center py-3 bg-[#E2E8D5]/35 px-4 rounded-xl border border-[#E2E8D5]/20 font-black text-sm text-[#5E7A3E] mt-4">
              <span>SURPLUS / NET PERTUMBUHAN KAS PERIODE:</span>
              <span>{formatRupiah(summary.surplusKas)}</span>
            </div>

          </div>
        </div>

        {/* TANDA TANGAN ARSIP (Dua Kolom Cetak) */}
        <div className="pt-12 grid grid-cols-2 text-center text-xs font-semibold text-[#202A14] gap-8">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold text-[#5E7A3E] uppercase mt-0.5">Ketua Bank Sampah</p>
            <div className="h-20"></div>
            <p className="border-b border-[#202A14] w-2/3 mx-auto pb-1 font-black"></p>
            <p className="text-[10px] text-[#202A14]/70 mt-1">NIP/Identitas Ketua</p>
          </div>
          <div>
            <p>Dibuat oleh,</p>
            <p className="font-bold text-[#5E7A3E] uppercase mt-0.5">Bendahara Umum</p>
            <div className="h-20"></div>
            <p className="border-b border-[#202A14] w-2/3 mx-auto pb-1 font-black"></p>
            <p className="text-[10px] text-[#202A14]/70 mt-1">NIP/Identitas Bendahara</p>
          </div>
        </div>

        {/* Footer Arsip KKN */}
        <div className="text-center text-[10px] font-bold text-[#202A14]/40 border-t border-[#E2E8D5]/50 pt-4 italic">
          Sistem BASAH Rejosari - Inisiasi dan Pengembangan oleh KKN Unit 57 Angkatan 73
        </div>

      </div>

    </div>
  );
}
