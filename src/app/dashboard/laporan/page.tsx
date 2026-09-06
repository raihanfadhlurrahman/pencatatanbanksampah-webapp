"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, 
  Printer, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Info,
  Users,
  PackageCheck,
  Coins,
  Sparkles
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

interface EventWargaDetail {
  nasabah_id: string;
  no_nasabah: string;
  nama: string;
  rt_rw: string;
  items: { nama_sampah: string; berat: number; total_nilai: number }[];
  total_berat: number;
  total_nilai: number;
}

// Data Mock Kas Umum
const MOCK_SUMMARY: SummaryData = {
  totalSetoranBerat: 350.5,
  totalSetoranNilai: 720000,
  totalPenjualanBerat: 420.0,
  totalPenjualanNilai: 1150000,
  totalPencairan: 250000,
  kasMasukLain: 100000,
  kasKeluarLain: 175000,
  surplusKas: 825000,
};

// Data Mock Event Pertemuan Dusun
const MOCK_EVENT_DATA: EventWargaDetail[] = [
  {
    nasabah_id: "n1",
    no_nasabah: "RJS001",
    nama: "Bapak Anto",
    rt_rw: "RT 04/RW 18",
    items: [
      { nama_sampah: "Kardus Bekas", berat: 12.5, total_nilai: 25000 },
      { nama_sampah: "Botol Plastik PET", berat: 4.0, total_nilai: 12000 },
    ],
    total_berat: 16.5,
    total_nilai: 37000,
  },
  {
    nasabah_id: "n2",
    no_nasabah: "RJS002",
    nama: "Ibu Indah",
    rt_rw: "RT 04/RW 18",
    items: [
      { nama_sampah: "Kertas Duplek", berat: 8.0, total_nilai: 14000 },
      { nama_sampah: "Besi Tua", berat: 5.0, total_nilai: 20000 },
    ],
    total_berat: 13.0,
    total_nilai: 34000,
  },
  {
    nasabah_id: "n3",
    no_nasabah: "RJS003",
    nama: "Bapak Budi",
    rt_rw: "RT 05/RW 18",
    items: [
      { nama_sampah: "Kardus Bekas", berat: 15.0, total_nilai: 30000 },
      { nama_sampah: "Minyak Jelantah", berat: 3.0, total_nilai: 18000 },
    ],
    total_berat: 18.0,
    total_nilai: 48000,
  },
  {
    nasabah_id: "n4",
    no_nasabah: "RJS004",
    nama: "Ibu Maryati",
    rt_rw: "RT 05/RW 18",
    items: [
      { nama_sampah: "Kaleng Alumunium", berat: 2.5, total_nilai: 22500 },
      { nama_sampah: "Botol Plastik PET", berat: 6.0, total_nilai: 18000 },
    ],
    total_berat: 8.5,
    total_nilai: 40500,
  },
];

export default function LaporanPage() {
  const [reportTab, setReportTab] = useState<"periode" | "event">("periode");
  
  // State Laporan Periode Kas
  const [summary, setSummary] = useState<SummaryData>(MOCK_SUMMARY);
  const [periodRange, setPeriodRange] = useState<"1_bulan" | "2_bulan" | "3_bulan" | "6_bulan" | "1_tahun">("1_bulan");
  const [selectedMonth, setSelectedMonth] = useState("08");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [periodText, setPeriodText] = useState("");

  // State Rekap Event Dusun
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventWargaList, setEventWargaList] = useState<EventWargaDetail[]>(MOCK_EVENT_DATA);
  const [filterRt, setFilterRt] = useState<string>("semua");

  const [loading, setLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    if (reportTab === "periode") {
      loadLaporanKas();
    } else {
      loadLaporanEvent();
    }
  }, [reportTab, periodRange, selectedMonth, selectedYear, eventDate]);

  const getNamaBulan = (bulan: string) => {
    const listBulan: Record<string, string> = {
      "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
      "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
      "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
    };
    return listBulan[bulan] || "";
  };

  const loadLaporanKas = async () => {
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

      const { data: setoranData, error: setError } = await supabase
        .from("setoran")
        .select("berat, total_nilai")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      const { data: penjualanData, error: penError } = await supabase
        .from("penjualan_pengepul")
        .select("berat, total_nilai")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      const { data: pencairanData, error: cairError } = await supabase
        .from("pencairan_saldo")
        .select("nominal_pencairan")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

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

  const loadLaporanEvent = async () => {
    try {
      setLoading(true);
      const startOfDay = `${eventDate}T00:00:00Z`;
      const endOfDay = `${eventDate}T23:59:59Z`;

      const { data: setoranData, error } = await supabase
        .from("setoran")
        .select(`
          id,
          berat,
          total_nilai,
          tanggal,
          nasabah_id,
          nasabah (id, no_nasabah, nama, rt_rw),
          jenis_sampah (nama_sampah)
        `)
        .gte("tanggal", startOfDay)
        .lte("tanggal", endOfDay);

      if (error || !setoranData || setoranData.length === 0) {
        setEventWargaList([]);
        return;
      }

      // Grouping per Warga
      const grouped: Record<string, EventWargaDetail> = {};
      setoranData.forEach((s: any) => {
        const nasId = s.nasabah_id || "unknown";
        const nasNama = s.nasabah?.nama || "Warga Tanpa Nama";
        const nasNo = s.nasabah?.no_nasabah || "-";
        const nasRt = s.nasabah?.rt_rw || "RT 04/RW 18";

        if (!grouped[nasId]) {
          grouped[nasId] = {
            nasabah_id: nasId,
            no_nasabah: nasNo,
            nama: nasNama,
            rt_rw: nasRt,
            items: [],
            total_berat: 0,
            total_nilai: 0,
          };
        }

        grouped[nasId].items.push({
          nama_sampah: s.jenis_sampah?.nama_sampah || "Sampah",
          berat: Number(s.berat),
          total_nilai: Number(s.total_nilai),
        });
        grouped[nasId].total_berat += Number(s.berat);
        grouped[nasId].total_nilai += Number(s.total_nilai);
      });

      setEventWargaList(Object.values(grouped));
    } catch (err) {
      setEventWargaList([]);
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

  // Filter RT pada Rekap Event
  const filteredEventWarga = eventWargaList.filter(w => {
    if (filterRt === "semua") return true;
    return w.rt_rw.includes(filterRt);
  });

  // Total Event Summary
  const totalEventBerat = filteredEventWarga.reduce((acc, curr) => acc + curr.total_berat, 0);
  const totalEventNilai = filteredEventWarga.reduce((acc, curr) => acc + curr.total_nilai, 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase text-[#202A14] tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#5E7A3E]" />
            Laporan & Rekapitulasi
          </h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Generasikan laporan arus kas umum atau rekapitulasi setoran warga per-event/pertemuan dusun
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-3 px-5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all self-start sm:self-center"
        >
          <Printer className="h-4.5 w-4.5" />
          {reportTab === "periode" ? "CETAK LAPORAN KAS" : "CETAK REKAP EVENT DUSUN"}
        </button>
      </div>

      {/* SUB-TABS SWITCHER (KAS PERIODE vs REKAP EVENT DUSUN) */}
      <div className="bg-[#E2E8D5]/40 p-1.5 rounded-full flex gap-1 print:hidden border border-[#E2E8D5]">
        <button
          onClick={() => setReportTab("periode")}
          className={`flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
            reportTab === "periode" 
              ? "bg-[#5E7A3E] text-white shadow-sm" 
              : "text-[#202A14]/70 hover:text-[#202A14]"
          }`}
        >
          <FileText className="h-4 w-4" />
          Laporan Rekapitulasi Kas & Periode
        </button>
        <button
          onClick={() => setReportTab("event")}
          className={`flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
            reportTab === "event" 
              ? "bg-[#5E7A3E] text-white shadow-sm" 
              : "text-[#202A14]/70 hover:text-[#202A14]"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Rekap Event / Pertemuan Dusun (Per Pengumpulan)
        </button>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-wrap gap-4 items-center justify-between print:hidden">
        
        {reportTab === "periode" ? (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-xs font-black text-[#202A14]/80">
              <Calendar className="h-4 w-4 text-[#5E7A3E]" />
              PERIODE LAPORAN:
            </div>

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
        ) : (
          <div className="flex flex-wrap gap-4 items-center w-full justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#202A14]/80">
                <Calendar className="h-4 w-4 text-[#5E7A3E]" />
                TANGGAL EVENT PERTEMUAN:
              </div>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="px-4 py-2 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-black outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#202A14]/80">FILTER RT:</span>
              <select
                value={filterRt}
                onChange={(e) => setFilterRt(e.target.value)}
                className="px-4 py-2 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-black outline-none"
              >
                <option value="semua">Semua RT (04 & 05)</option>
                <option value="RT 04">RT 04 / RW 18</option>
                <option value="RT 05">RT 05 / RW 18</option>
              </select>
            </div>
          </div>
        )}

        {usingMock && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#E2E8D5]/60 text-[#202A14]">
            <Info className="h-3.5 w-3.5" /> Mode Demo (Data Acuan Sementara)
          </span>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LAPORAN PERIODE KAS (PRINT-READY SHEET) */}
      {/* ======================================================== */}
      {reportTab === "periode" && (
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
              Rukun Tetangga 04 & 05, Rukun Warga 18, Dusun Rejosari, Wedomartani
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

              <div className="flex justify-between items-center py-3 bg-[#E2E8D5]/35 px-4 rounded-xl border border-[#E2E8D5]/20 font-black text-sm text-[#5E7A3E] mt-4">
                <span>SURPLUS / NET PERTUMBUHAN KAS PERIODE:</span>
                <span>{formatRupiah(summary.surplusKas)}</span>
              </div>

            </div>
          </div>

          {/* TANDA TANGAN ARSIP */}
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

          <div className="text-center text-[10px] font-bold text-[#202A14]/40 border-t border-[#E2E8D5]/50 pt-4 italic">
            Sistem BASAH Rejosari - Inisiasi dan Pengembangan oleh KKN Unit 57 Angkatan 73
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: REKAPITULASI EVENT / PERTEMUAN DUSUN (PRINT-READY SHEET) */}
      {/* ======================================================== */}
      {reportTab === "event" && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm print:shadow-none print:border-none print:p-0 space-y-8 max-w-4xl mx-auto">
          
          {/* KOP OFFICIAL EVENT PERTEMUAN DUSUN */}
          <div className="text-center border-b-4 border-[#202A14] pb-5 flex flex-col items-center">
            <img 
              src="/image/logoBasah.png" 
              alt="Logo BASAH Rejosari" 
              className="h-20 w-auto object-contain mb-3 drop-shadow-sm" 
            />
            <h2 className="text-xl font-black tracking-wider uppercase text-[#202A14]">
              REKAPITULASI SETORAN WARGA PER-EVENT / PERTEMUAN DUSUN
            </h2>
            <h3 className="text-sm font-black text-[#5E7A3E] uppercase tracking-wide">
              BANK SAMPAH "BASAH REJOSARI"
            </h3>
            <p className="text-xs font-bold text-[#202A14]/75 mt-0.5 uppercase">
              Rukun Tetangga 04 & 05, Rukun Warga 18, Dusun Rejosari, Wedomartani
            </p>
            <p className="text-xs font-black text-[#5E7A3E] mt-2 tracking-widest uppercase bg-[#E2E8D5]/40 px-4 py-1.5 rounded-full border border-[#E2E8D5]">
              Tanggal Pertemuan: {new Date(eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* KARTU RINGKASAN EVENT PERTEMUAN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-[#E2E8D5] flex items-center gap-3">
              <div className="bg-[#5E7A3E]/10 p-3 rounded-full text-[#5E7A3E]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total Warga Menyetor</span>
                <span className="text-base font-black text-[#202A14]">{filteredEventWarga.length} KK Warga</span>
              </div>
            </div>

            <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-[#E2E8D5] flex items-center gap-3">
              <div className="bg-[#5E7A3E]/10 p-3 rounded-full text-[#5E7A3E]">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total Sampah Disetor</span>
                <span className="text-base font-black text-[#202A14]">{totalEventBerat.toFixed(1)} kg</span>
              </div>
            </div>

            <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-[#E2E8D5] flex items-center gap-3">
              <div className="bg-[#5E7A3E]/10 p-3 rounded-full text-[#5E7A3E]">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total Saldo Masuk Bank</span>
                <span className="text-base font-black text-green-700">{formatRupiah(totalEventNilai)}</span>
              </div>
            </div>
          </div>

          {/* TABEL SPESIFIK REKAP PER WARGA */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#202A14] border-b border-[#E2E8D5] pb-1.5">
              Rincian Setoran Spesifik per Warga (Pertemuan Dusun)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#5E7A3E] text-white font-black text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3 rounded-l-xl text-center w-10">No</th>
                    <th className="py-3 px-3 w-44">Nama Warga (KK)</th>
                    <th className="py-3 px-3 w-28">RT / RW</th>
                    <th className="py-3 px-3">Jenis Sampah Disetor & Berat per Jenis</th>
                    <th className="py-3 px-3 text-right w-28">Total Berat</th>
                    <th className="py-3 px-3 rounded-r-xl text-right w-36">Uang Masuk Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8D5]/60 text-[#202A14] font-semibold">
                  {filteredEventWarga.map((warga, idx) => (
                    <tr key={warga.nasabah_id} className="hover:bg-[#F9F9F6] transition-colors">
                      <td className="py-3 px-3 text-center text-zinc-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-[#202A14]">
                        {warga.nama}
                        <span className="block text-[9px] text-zinc-400 font-normal">{warga.no_nasabah}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#5E7A3E]">{warga.rt_rw}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {warga.items.map((item, itemIdx) => (
                            <span 
                              key={itemIdx}
                              className="bg-[#E2E8D5]/50 border border-[#E2E8D5] text-[#202A14] text-[10px] px-2 py-0.5 rounded-full font-bold"
                            >
                              {item.nama_sampah}: <strong className="text-[#5E7A3E]">{item.berat}kg</strong> ({formatRupiah(item.total_nilai)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#202A14] whitespace-nowrap">
                        {warga.total_berat.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 text-right font-black text-green-700 whitespace-nowrap">
                        {formatRupiah(warga.total_nilai)}
                      </td>
                    </tr>
                  ))}

                  {filteredEventWarga.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 font-bold text-xs">
                        Tidak ada transaksi/event penimbangan sampah pada tanggal ini.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E2E8D5]/40 font-black text-xs text-[#202A14] border-t-2 border-[#5E7A3E]">
                    <td colSpan={4} className="py-3 px-3 uppercase text-right">TOTAL AKUMULASI EVENT DUSUN:</td>
                    <td className="py-3 px-3 text-right text-[#5E7A3E]">{totalEventBerat.toFixed(1)} kg</td>
                    <td className="py-3 px-3 text-right text-green-700">{formatRupiah(totalEventNilai)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* TANDA TANGAN ARSIP DUSUN */}
          <div className="pt-10 grid grid-cols-2 text-center text-xs font-semibold text-[#202A14] gap-8">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold text-[#5E7A3E] uppercase mt-0.5">Ketua RT / Perwakilan Dusun</p>
              <div className="h-16"></div>
              <p className="border-b border-[#202A14] w-2/3 mx-auto pb-1 font-black"></p>
              <p className="text-[10px] text-[#202A14]/70 mt-1">Tanda Tangan & Nama Terang</p>
            </div>
            <div>
              <p>Dibuat oleh,</p>
              <p className="font-bold text-[#5E7A3E] uppercase mt-0.5">Petugas / Pengurus Bank Sampah</p>
              <div className="h-16"></div>
              <p className="border-b border-[#202A14] w-2/3 mx-auto pb-1 font-black"></p>
              <p className="text-[10px] text-[#202A14]/70 mt-1">Tanda Tangan & Nama Terang</p>
            </div>
          </div>

          <div className="text-center text-[10px] font-bold text-[#202A14]/40 border-t border-[#E2E8D5]/50 pt-4 italic">
            Sistem BASAH Rejosari - Rekapitulasi Resmi Pertemuan Penimbangan Dusun Rejosari
          </div>

        </div>
      )}

    </div>
  );
}
