"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowUpRight, 
  Users, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Info,
  DollarSign,
  Trash2,
  TrendingDown,
  X,
  Search
} from "lucide-react";

interface Nasabah {
  id: string;
  no_nasabah: string;
  nama: string;
  rt_rw: string;
  saldo: number;
}

interface PencairanHistory {
  id: string;
  nasabah_id: string;
  nasabah_nama: string;
  nasabah_no: string;
  nominal_pencairan: number;
  saldo_awal: number;
  saldo_akhir: number;
  tanggal: string;
}

// Data Mock Kosong
const MOCK_NASABAH: Nasabah[] = [];
const MOCK_CAIR_HISTORY: PencairanHistory[] = [];

export default function PencairanPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>(MOCK_NASABAH);
  const [cairHistoryList, setCairHistoryList] = useState<PencairanHistory[]>(MOCK_CAIR_HISTORY);

  const [activeTab, setActiveTab] = useState<"cair" | "riwayat">("cair");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [selectedNasabahId, setSelectedNasabahId] = useState("");
  const [nasabahSearchQuery, setNasabahSearchQuery] = useState("");
  const [nasabahDropdownOpen, setNasabahDropdownOpen] = useState(false);
  const [nominal, setNominal] = useState<number>(0);
  const [keterangan, setKeterangan] = useState("Pencairan Saldo Bank Sampah");

  useEffect(() => {
    loadNasabah();
  }, []);

  const loadNasabah = async () => {
    try {
      setLoading(true);
      
      // Fetch Nasabah
      const { data: nasabahData, error: nasError } = await supabase
        .from("nasabah")
        .select("id, no_nasabah, nama, rt_rw, saldo")
        .order("no_nasabah", { ascending: true });

      // Fetch Pencairan History
      const { data: cairData } = await supabase
        .from("pencairan_saldo")
        .select(`
          id,
          nasabah_id,
          nominal_pencairan,
          saldo_awal,
          saldo_akhir,
          tanggal,
          nasabah (
            nama,
            no_nasabah
          )
        `)
        .order("tanggal", { ascending: false });

      if (nasError) {
        setUsingMock(true);
        setNasabahList(MOCK_NASABAH);
        setCairHistoryList(MOCK_CAIR_HISTORY);
        return;
      }

      if (nasabahData) {
        setNasabahList(nasabahData);
      }

      if (cairData) {
        const formatted: PencairanHistory[] = cairData.map((c: any) => ({
          id: c.id,
          nasabah_id: c.nasabah_id,
          nasabah_nama: c.nasabah?.nama || "Warga",
          nasabah_no: c.nasabah?.no_nasabah || "ID",
          nominal_pencairan: Number(c.nominal_pencairan),
          saldo_awal: Number(c.saldo_awal),
          saldo_akhir: Number(c.saldo_akhir),
          tanggal: c.tanggal,
        }));
        setCairHistoryList(formatted);
      }

      setUsingMock(false);
    } catch (err) {
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  const activeNasabah = nasabahList.find(n => n.id === selectedNasabahId);
  const maxSaldo = activeNasabah ? activeNasabah.saldo : 0;

  const handleCairkanSemua = () => {
    if (maxSaldo > 0) {
      setNominal(maxSaldo);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedNasabahId || nominal <= 0) {
      setErrorMsg("Harap pilih nama warga dan input nominal penarikan.");
      return;
    }

    if (nominal > maxSaldo) {
      setErrorMsg("Nominal pencairan tidak boleh melebihi sisa saldo tabungan warga.");
      return;
    }

    setSaving(true);

    if (usingMock) {
      setTimeout(() => {
        const newCair: PencairanHistory = {
          id: String(Date.now()),
          nasabah_id: selectedNasabahId,
          nasabah_nama: activeNasabah?.nama || "Warga",
          nasabah_no: activeNasabah?.no_nasabah || "ID",
          nominal_pencairan: nominal,
          saldo_awal: maxSaldo,
          saldo_akhir: maxSaldo - nominal,
          tanggal: new Date().toISOString()
        };
        setCairHistoryList(prev => [newCair, ...prev]);
        setSuccess(true);
        setSaving(false);
        // Simulasi update lokal
        setNasabahList(prev => prev.map(n => n.id === selectedNasabahId ? {
          ...n,
          saldo: n.saldo - nominal
        } : n));
        setSelectedNasabahId("");
        setNominal(0);
      }, 1000);
      return;
    }

    try {
      // Ambil profile pengurus login
      const sessionProfile = localStorage.getItem("user_profile");
      const loggedUser = sessionProfile ? JSON.parse(sessionProfile) : null;
      
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", loggedUser?.email)
        .single();

      const saldoAwal = maxSaldo;
      const saldoAkhir = maxSaldo - nominal;

      // 1. Simpan ke tabel pencairan_saldo
      const { data: cairData, error: cairError } = await supabase
        .from("pencairan_saldo")
        .insert({
          nasabah_id: selectedNasabahId,
          nominal_pencairan: nominal,
          saldo_awal: saldoAwal,
          saldo_akhir: saldoAkhir,
          petugas_id: userData?.id || null,
        })
        .select()
        .single();

      if (cairError) throw cairError;

      // 2. Simpan ke riwayat_saldo nasabah
      const { error: riwayatError } = await supabase
        .from("riwayat_saldo")
        .insert({
          nasabah_id: selectedNasabahId,
          tipe: "pencairan",
          reference_id: cairData.id,
          nominal: nominal,
          saldo_akhir: saldoAkhir,
          keterangan: keterangan || "Pencairan Tabungan Warga",
        });

      if (riwayatError) throw riwayatError;

      // 3. Update saldo di tabel nasabah
      const { error: nasUpdateError } = await supabase
        .from("nasabah")
        .update({
          saldo: saldoAkhir
        })
        .eq("id", selectedNasabahId);

      if (nasUpdateError) throw nasUpdateError;

      // 4. Catat ke kas umum (keuangan_kas) sebagai pengeluaran
      const { error: kasError } = await supabase
        .from("keuangan_kas")
        .insert({
          tipe: "keluar",
          kategori: "Pencairan Saldo Nasabah",
          nominal: nominal,
          keterangan: `Penarikan saldo ${activeNasabah?.no_nasabah} - ${activeNasabah?.nama}`,
        });

      if (kasError) throw kasError;

      setSuccess(true);
      setSelectedNasabahId("");
      setNominal(0);
      loadNasabah(); // Reload balances & history
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses transaksi pencairan.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE TRANSAKSI & BALIKKAN SALDO NASABAH
  // ==========================================
  const handlePencairanDelete = async (cair: PencairanHistory) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan pencairan sebesar ${formatRupiah(cair.nominal_pencairan)} untuk ${cair.nasabah_nama}? Tindakan ini akan mengembalikan saldo warga tersebut dan menghapus pencatatan pengeluaran kas.`)) return;

    if (usingMock) {
      setCairHistoryList(prev => prev.filter(c => c.id !== cair.id));
      return;
    }

    try {
      // 1. Ambil saldo warga aktif saat ini
      const { data: nasData, error: nasError } = await supabase
        .from("nasabah")
        .select("saldo")
        .eq("id", cair.nasabah_id)
        .single();

      if (nasError) throw nasError;

      const currentSaldo = Number(nasData.saldo || 0);
      // Kembalikan saldo nasabah
      const newSaldo = currentSaldo + cair.nominal_pencairan;

      // 2. Update saldo nasabah di database
      const { error: updateError } = await supabase
        .from("nasabah")
        .update({ saldo: newSaldo })
        .eq("id", cair.nasabah_id);

      if (updateError) throw updateError;

      // 3. Hapus data di riwayat_saldo nasabah
      await supabase
        .from("riwayat_saldo")
        .delete()
        .eq("reference_id", cair.id)
        .eq("nasabah_id", cair.nasabah_id);

      // 4. Hapus data di keuangan_kas (kas keluar terkait)
      await supabase
        .from("keuangan_kas")
        .delete()
        .eq("nominal", cair.nominal_pencairan)
        .eq("tipe", "keluar")
        .eq("kategori", "Pencairan Saldo Nasabah");

      // 5. Hapus data di pencairan_saldo
      const { error: deleteError } = await supabase
        .from("pencairan_saldo")
        .delete()
        .eq("id", cair.id);

      if (deleteError) throw deleteError;

      loadNasabah();
      alert("Transaksi pencairan berhasil dibatalkan dan saldo warga dikembalikan!");
    } catch (err: any) {
      alert(err.message || "Gagal membatalkan transaksi.");
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
      <div>
        <h1 className="text-2xl font-black uppercase text-[#202A14] tracking-tight flex items-center gap-2">
          <ArrowUpRight className="h-6 w-6 text-[#A25B43]" />
          Pencairan Saldo Tabungan
        </h1>
        <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
          Proses penarikan uang tabungan warga dari hasil penimbangan sampah
        </p>
      </div>

      {/* TABS MENU */}
      <div className="flex border-b border-[#E2E8D5]">
        <button
          onClick={() => { setActiveTab("cair"); setSuccess(false); }}
          className={`py-3 px-6 font-black text-sm border-b-4 transition-all ${
            activeTab === "cair" 
              ? "border-[#5E7A3E] text-[#5E7A3E]" 
              : "border-transparent text-[#202A14]/60 hover:text-[#202A14]/90"
          }`}
        >
          Form Pencairan Saldo
        </button>
        <button
          onClick={() => { setActiveTab("riwayat"); setSuccess(false); }}
          className={`py-3 px-6 font-black text-sm border-b-4 transition-all ${
            activeTab === "riwayat" 
              ? "border-[#5E7A3E] text-[#5E7A3E]" 
              : "border-transparent text-[#202A14]/60 hover:text-[#202A14]/90"
          }`}
        >
          Riwayat Pencairan Warga ({cairHistoryList.length})
        </button>
      </div>

      {/* TAB CONTENT 1: FORM PENCAIRAN */}
      {activeTab === "cair" && (
        <>
          {success && (
            <div className="bg-green-50 border border-green-200 p-5 rounded-[2rem] text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
              <h2 className="text-base font-black text-green-800 uppercase tracking-tight">PENCAIRAN SALDO BERHASIL!</h2>
              <p className="text-xs text-green-700 font-bold max-w-xs mx-auto">
                Uang tabungan warga telah berhasil dicairkan. Kas umum bank sampah dan sisa saldo tabungan nasabah telah berkurang otomatis.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-2.5 px-6 rounded-full shadow-sm"
              >
                PROSES PENCAIRAN BARU
              </button>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PILIH DAN DETAIL SALDO NASABAH */}
              <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-5">
                
                {errorMsg && (
                  <div className="bg-red-50 text-red-800 p-3.5 rounded-[1.25rem] text-xs font-semibold flex items-start gap-2 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* PILIH NASABAH (SEARCHABLE SELECT) */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[#5E7A3E]" /> Pilih Warga (Nasabah)
                    </span>
                    {selectedNasabahId && (
                      <button 
                        type="button" 
                        onClick={() => { setSelectedNasabahId(""); setNasabahSearchQuery(""); }}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        Ganti Warga
                      </button>
                    )}
                  </label>

                  {!selectedNasabahId ? (
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-[#5E7A3E]" />
                      <input
                        type="text"
                        placeholder="Ketik Nama atau No. Nasabah untuk mencari..."
                        value={nasabahSearchQuery}
                        onChange={(e) => {
                          setNasabahSearchQuery(e.target.value);
                          setNasabahDropdownOpen(true);
                        }}
                        onFocus={() => setNasabahDropdownOpen(true)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-semibold outline-none transition-all"
                      />

                      {nasabahDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-[#E2E8D5] rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 space-y-1">
                          {nasabahList
                            .filter(n => 
                              n.nama.toLowerCase().includes(nasabahSearchQuery.toLowerCase()) ||
                              n.no_nasabah.toLowerCase().includes(nasabahSearchQuery.toLowerCase())
                            )
                            .map((n) => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                  setSelectedNasabahId(n.id);
                                  setNasabahDropdownOpen(false);
                                }}
                                className="w-full text-left p-2.5 hover:bg-[#E2E8D5]/30 rounded-xl transition-all flex items-center justify-between text-xs font-semibold"
                              >
                                <div>
                                  <span className="font-black text-[#202A14] block">{n.nama}</span>
                                  <span className="text-[10px] text-zinc-500 font-bold">{n.no_nasabah} | {n.rt_rw.split("/")[0]}</span>
                                </div>
                                <span className="text-[10px] text-green-700 font-black">Saldo: {formatRupiah(n.saldo)}</span>
                              </button>
                            ))}

                          {nasabahList.filter(n => 
                            n.nama.toLowerCase().includes(nasabahSearchQuery.toLowerCase()) ||
                            n.no_nasabah.toLowerCase().includes(nasabahSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="p-4 text-center text-xs text-zinc-400 italic font-semibold">
                              Tidak ditemukan warga dengan kata kunci tersebut.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-[#E2E8D5]/40 border-2 border-[#5E7A3E] rounded-full">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#5E7A3E] text-white rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                          {activeNasabah?.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#202A14]">{activeNasabah?.nama}</h4>
                          <span className="text-[10px] text-[#202A14]/70 font-bold block mt-0.5">
                            {activeNasabah?.no_nasabah} | {activeNasabah?.rt_rw.split("/")[0]} | Saldo: {formatRupiah(activeNasabah?.saldo || 0)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedNasabahId(""); setNasabahSearchQuery(""); }}
                        className="bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-black border border-red-200 transition-all shadow-sm"
                      >
                        GANTI
                      </button>
                    </div>
                  )}
                </div>

                {/* DETAIL SALDO AKTIF WARGA */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3 flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-[#5E7A3E]" /> Sisa Tabungan Warga
                  </label>

                  {activeNasabah ? (
                    <div className="bg-[#E2E8D5]/40 p-6 rounded-[2rem] border border-[#E2E8D5]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-base font-black text-[#202A14]">{activeNasabah.nama}</h3>
                        <p className="text-xs text-[#202A14]/75 font-semibold mt-0.5">
                          No. Nasabah: {activeNasabah.no_nasabah} | Alamat: {activeNasabah.rt_rw}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-[#202A14]/65 tracking-wider block">Saldo Tersedia</span>
                        <span className="text-2xl font-black text-[#5E7A3E] mt-0.5 block">{formatRupiah(maxSaldo)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F9F9F6] border-2 border-dashed border-[#E2E8D5] p-6 rounded-[2rem] text-center text-[#202A14]/50 text-xs italic">
                      Pilih warga di atas untuk memuat sisa tabungan saldo aktif.
                    </div>
                  )}
                </div>

                {/* INPUT NOMINAL CAIR */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-[#5E7A3E]" /> Nominal yang Dicairkan
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sm font-black text-[#5E7A3E]">
                      Rp
                    </div>
                    <input
                      type="number"
                      required
                      disabled={!selectedNasabahId}
                      placeholder="Masukkan nominal uang (misal: 50000)"
                      value={nominal || ""}
                      onChange={(e) => setNominal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-base font-black outline-none transition-all placeholder:text-[#202A14]/40"
                    />
                  </div>

                  {nominal > maxSaldo && (
                    <div className="text-red-700 font-bold text-[11px] pl-3 flex items-center gap-1.5 mt-1.5">
                      <AlertCircle className="h-4 w-4 text-[#A25B43]" />
                      Nominal melebihi saldo tabungan tersedia ({formatRupiah(maxSaldo)})!
                    </div>
                  )}
                </div>

              </div>

              {/* AKSI RINGKASAN PENCAIRAN */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3 border-b border-[#E2E8D5]/40 pb-2">
                    <Wallet className="h-5 w-5 text-[#5E7A3E]" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wide">Ringkasan Transaksi</h2>
                  </div>

                  {activeNasabah ? (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handleCairkanSemua}
                        className="w-full bg-[#E2E8D5] hover:bg-[#E2E8D5]/90 text-[#202A14] font-black text-xs py-3 rounded-full shadow-sm active:scale-95 transition-all"
                      >
                        CAIRKAN SEMUA SALDO ({formatRupiah(maxSaldo)})
                      </button>

                      <div className="bg-[#F9F9F6] p-4 rounded-[1.5rem] border border-[#E2E8D5]/20 space-y-2 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-[#202A14]/75">Saldo Awal:</span>
                          <span>{formatRupiah(maxSaldo)}</span>
                        </div>
                        <div className="flex justify-between text-[#A25B43] font-bold">
                          <span>Pencairan (Nominal):</span>
                          <span>-{formatRupiah(nominal)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-[#E2E8D5] pt-2 font-black text-sm text-[#5E7A3E]">
                          <span>Saldo Tersisa:</span>
                          <span>{formatRupiah(Math.max(0, maxSaldo - nominal))}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/70 pl-2">
                          Catatan / Keterangan Penarikan
                        </label>
                        <input
                          type="text"
                          value={keterangan}
                          onChange={(e) => setKeterangan(e.target.value)}
                          placeholder="Contoh: Penarikan saldo tahunan"
                          className="w-full px-3 py-2 bg-[#F9F9F6] border border-[#E2E8D5] focus:border-[#5E7A3E] rounded-xl text-xs font-semibold outline-none"
                        />
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400 text-xs italic">
                      Pilih warga terlebih dahulu untuk membuka ringkasan transaksi pencairan.
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving || !selectedNasabahId || nominal <= 0 || nominal > maxSaldo}
                  className="w-full bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-base py-4 rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all duration-150 disabled:opacity-70 disabled:pointer-events-none mt-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {saving ? "MEMPROSES..." : "KONFIRMASI PENCAIRAN"}
                </button>

              </div>

            </form>
          )}
        </>
      )}

      {/* TAB CONTENT 2: RIWAYAT PENCAIRAN WARGA */}
      {activeTab === "riwayat" && (
        <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
              <thead>
                <tr className="bg-[#E2E8D5]/50 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">No. Nasabah</th>
                  <th className="py-4 px-6">Nama Warga</th>
                  <th className="py-4 px-6 text-right">Saldo Awal</th>
                  <th className="py-4 px-6 text-right">Nominal Cair</th>
                  <th className="py-4 px-6 text-right">Saldo Akhir</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8D5]/30">
                {cairHistoryList.map((cair) => (
                  <tr key={cair.id} className="hover:bg-[#F9F9F6]">
                    <td className="py-3 px-6 whitespace-nowrap">{formatDate(cair.tanggal)}</td>
                    <td className="py-3 px-6 font-bold">{cair.nasabah_no}</td>
                    <td className="py-3 px-6 font-bold text-[#5E7A3E]">{cair.nasabah_nama}</td>
                    <td className="py-3 px-6 text-right">{formatRupiah(cair.saldo_awal)}</td>
                    <td className="py-3 px-6 text-right font-black text-[#A25B43]">-{formatRupiah(cair.nominal_pencairan)}</td>
                    <td className="py-3 px-6 text-right font-black text-[#5E7A3E]">{formatRupiah(cair.saldo_akhir)}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handlePencairanDelete(cair)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded-full transition-all"
                        title="Batalkan Pencairan"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {cairHistoryList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#202A14]/50 italic">
                      <TrendingDown className="h-8 w-8 text-[#E2E8D5] mx-auto mb-2" />
                      Belum ada catatan transaksi pencairan tabungan warga.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
