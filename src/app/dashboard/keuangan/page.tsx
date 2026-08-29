"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  DollarSign, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  TrendingUp, 
  X, 
  AlertCircle,
  TrendingDown,
  Info
} from "lucide-react";

interface TransaksiKas {
  id: string;
  tipe: "masuk" | "keluar";
  kategori: string;
  nominal: number;
  keterangan: string;
  tanggal: string;
}

// Data Mock Kosong
const MOCK_KAS: TransaksiKas[] = [];

export default function KeuanganPage() {
  const [kasList, setKasList] = useState<TransaksiKas[]>(MOCK_KAS);
  const [saldoKas, setSaldoKas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [tipe, setTipe] = useState<"masuk" | "keluar">("masuk");
  const [kategori, setKategori] = useState("Lain-lain");
  const [nominal, setNominal] = useState<number>(0);
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    loadKas();
  }, []);

  const loadKas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("keuangan_kas")
        .select("*")
        .order("tanggal", { ascending: false });

      if (error) {
        setUsingMock(true);
        calculateSaldo(MOCK_KAS);
        return;
      }

      if (data) {
        setKasList(data as any);
        calculateSaldo(data as any);
        setUsingMock(false);
      }
    } catch (err) {
      setUsingMock(true);
      calculateSaldo(MOCK_KAS);
    } finally {
      setLoading(false);
    }
  };

  const calculateSaldo = (list: TransaksiKas[]) => {
    let balance = 0;
    list.forEach(t => {
      if (t.tipe === "masuk") balance += Number(t.nominal);
      else balance -= Number(t.nominal);
    });
    setSaldoKas(balance);
  };

  const handleOpenAdd = () => {
    setTipe("masuk");
    setKategori("Penjualan Pengepul");
    setNominal(0);
    setKeterangan("");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleTipeChange = (newTipe: "masuk" | "keluar") => {
    setTipe(newTipe);
    if (newTipe === "masuk") {
      setKategori("Penjualan Pengepul");
    } else {
      setKategori("Bagi Hasil/Fee Petugas");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (nominal <= 0 || !kategori || !keterangan) {
      setErrorMsg("Harap lengkapi semua field input.");
      return;
    }

    if (usingMock) {
      const newT: TransaksiKas = {
        id: String(Date.now()),
        tipe,
        kategori,
        nominal,
        keterangan,
        tanggal: new Date().toISOString(),
      };
      setKasList(prev => {
        const updated = [newT, ...prev];
        calculateSaldo(updated);
        return updated;
      });
      setModalOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("keuangan_kas")
        .insert({
          tipe,
          kategori,
          nominal,
          keterangan,
        });

      if (error) throw error;
      loadKas();
      setModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan transaksi kas.");
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(angka);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      
      {/* NOTIFIKASI KONEKSI DATABASE */}
      {usingMock && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-black uppercase">Database Supabase Belum Tersambung</h3>
            <p className="text-[11px] font-bold text-amber-800/80 mt-0.5">
              Gagal menghubungi server database Supabase. Silakan sambungkan database Anda terlebih dahulu dengan mengonfigurasi berkas .env.local dengan kredensial URL & Key yang valid, atau periksa koneksi internet Anda.
            </p>
          </div>
        </div>
      )}
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-[#202A14] tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#5E7A3E]" />
            Keuangan Kas Bank Sampah
          </h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Kelola pembukuan umum kas masuk, kas keluar, dan pencatatan insentif pengurus
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-3 px-5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="h-4.5 w-4.5" />
          CATAT TRANSAKSI KAS
        </button>
      </div>

      {/* SALDO KAS BESAR */}
      <div className="bg-[#E2E8D5] p-6 rounded-[2rem] border border-[#E2E8D5]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase text-[#202A14]/75 tracking-wider block">Saldo Kas Aktif Saat Ini</span>
          <h2 className="text-3xl font-black text-[#5E7A3E] mt-1">{formatRupiah(saldoKas)}</h2>
        </div>
        <div className="text-xs font-semibold text-[#202A14]/80 bg-white/70 p-3.5 rounded-[1.5rem] max-w-xs leading-relaxed">
          <Info className="h-4 w-4 text-[#5E7A3E] inline mr-1" />
          Saldo Kas dikumpulkan dari margin penjualan sampah pengepul dikurangi pengeluaran operasional dan fee petugas dusun.
        </div>
      </div>

      {/* TRANSAKSI BUKU KAS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8D5]/40 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#5E7A3E]" />
          <h2 className="text-base font-extrabold uppercase tracking-wide">Buku Kas Umum</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
            <thead>
              <tr className="bg-[#E2E8D5]/30 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Tipe</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Keterangan</th>
                <th className="py-4 px-6 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8D5]/25">
              {kasList.map((t) => (
                <tr key={t.id} className="hover:bg-[#F9F9F6]">
                  <td className="py-3.5 px-6 whitespace-nowrap">{formatDate(t.tanggal)}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      t.tipe === "masuk" 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-[#A25B43] border border-red-200"
                    }`}>
                      {t.tipe === "masuk" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-bold text-[#5E7A3E]">{t.kategori}</td>
                  <td className="py-3.5 px-6 max-w-[250px] truncate">{t.keterangan}</td>
                  <td className={`py-3.5 px-6 text-right font-black ${
                    t.tipe === "masuk" ? "text-green-700" : "text-[#A25B43]"
                  }`}>
                    {t.tipe === "masuk" ? "+" : "-"}{formatRupiah(t.nominal)}
                  </td>
                </tr>
              ))}

              {kasList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#202A14]/50 italic">
                    <TrendingDown className="h-8 w-8 text-[#E2E8D5] mx-auto mb-2" />
                    Belum ada transaksi di Buku Kas Umum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MODAL TAMBAH TRANSAKSI KAS */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">Catat Transaksi Buku Kas</h2>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="bg-[#202A14]/30 hover:bg-[#202A14]/40 p-1.5 rounded-full text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {errorMsg && (
                <div className="bg-red-50 text-red-800 p-3 rounded-[1.25rem] text-xs font-semibold flex items-start gap-2 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tipe Kas */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Tipe Aliran Kas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTipeChange("masuk")}
                    className={`py-3 rounded-full font-black text-xs border transition-all ${
                      tipe === "masuk"
                        ? "bg-[#5E7A3E] text-white border-[#5E7A3E]"
                        : "bg-white border-[#E2E8D5] text-[#202A14]"
                    }`}
                  >
                    UANG MASUK (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTipeChange("keluar")}
                    className={`py-3 rounded-full font-black text-xs border transition-all ${
                      tipe === "keluar"
                        ? "bg-[#A25B43] text-white border-[#A25B43]"
                        : "bg-white border-[#E2E8D5] text-[#202A14]"
                    }`}
                  >
                    UANG KELUAR (-)
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Kategori Pembukuan
                </label>
                {tipe === "masuk" ? (
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                  >
                    <option value="Penjualan Pengepul">Penjualan Sampah Pengepul</option>
                    <option value="Dana Bantuan">Sumbangan / Dana Bantuan</option>
                    <option value="Lain-lain">Lain-lain (Kas Masuk)</option>
                  </select>
                ) : (
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                  >
                    <option value="Bagi Hasil/Fee Petugas">Bagi Hasil / Fee Petugas (Kesepakatan)</option>
                    <option value="Pencairan Saldo Nasabah">Pencairan Saldo Warga</option>
                    <option value="Beli Alat Timbangan">Pembelian Alat Timbangan / Eco-Bag</option>
                    <option value="Alat Tulis Kantor">Alat Tulis Kantor & Cetak Laporan</option>
                    <option value="Kegiatan Sosial">Kegiatan Sosial Dusun</option>
                    <option value="Lain-lain">Lain-lain (Kas Keluar)</option>
                  </select>
                )}
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Nominal Transaksi (Rupiah)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 150000"
                  value={nominal || ""}
                  onChange={(e) => setNominal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none placeholder:text-[#202A14]/40"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Keterangan Detail
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembagian fee bulan Agustus untuk 3 petugas"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none placeholder:text-[#202A14]/40"
                />
              </div>

            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 rounded-full"
              >
                BATAL
              </button>
              <button 
                type="submit"
                className="flex-1 bg-[#5E7A3E] hover:bg-[#5E7A3E]/95 text-white font-extrabold text-xs py-3 rounded-full shadow-sm"
              >
                SIMPAN TRANSAKSI
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
