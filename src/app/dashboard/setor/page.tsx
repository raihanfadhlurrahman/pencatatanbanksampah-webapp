"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowDownLeft, 
  Users, 
  Trash2, 
  Calculator, 
  Camera, 
  Info, 
  CheckCircle, 
  AlertCircle,
  X,
  FileText,
  Eye,
  TrendingDown,
  Search
} from "lucide-react";
import Link from "next/link";

interface Nasabah {
  id: string;
  no_nasabah: string;
  nama: string;
  rt_rw: string;
  saldo: number;
}

interface JenisSampahHarga {
  id: string;
  jenis_sampah_id: string;
  nama_sampah: string;
  harga_jual: number;
  potongan_kas: number;
  harga_beli: number;
}

interface SetoranHistory {
  id: string;
  nasabah_id: string;
  nasabah_nama: string;
  nama_sampah: string;
  berat: number;
  harga_beli_saat_ini: number;
  total_nilai: number;
  foto_timbangan_url?: string;
  tanggal: string;
}

// Data Mock Kosong
const MOCK_NASABAH: Nasabah[] = [];
const MOCK_SAMPAH: JenisSampahHarga[] = [];
const MOCK_HISTORY: SetoranHistory[] = [];

export default function SetorPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>(MOCK_NASABAH);
  const [sampahList, setSampahList] = useState<JenisSampahHarga[]>(MOCK_SAMPAH);
  const [historyList, setHistoryList] = useState<SetoranHistory[]>(MOCK_HISTORY);

  const [activeTab, setActiveTab] = useState<"setor" | "riwayat">("setor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [selectedNasabahId, setSelectedNasabahId] = useState("");
  const [nasabahSearchQuery, setNasabahSearchQuery] = useState("");
  const [nasabahDropdownOpen, setNasabahDropdownOpen] = useState(false);
  const [selectedSampahId, setSelectedSampahId] = useState("");
  const [berat, setBerat] = useState<number>(0);
  const [potonganKasCustom, setPotonganKasCustom] = useState<number>(0);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Lightbox modal for viewing image
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch Nasabah
      const { data: nasabahData, error: nasError } = await supabase
        .from("nasabah")
        .select("id, no_nasabah, nama, rt_rw, saldo")
        .order("no_nasabah", { ascending: true });

      // Fetch active prices
      const { data: hargaData, error: hargaError } = await supabase
        .from("harga_nasabah")
        .select(`
          id,
          harga_jual,
          potongan_kas,
          harga_beli,
          jenis_sampah (
            id,
            nama_sampah
          )
        `);

      // Fetch Setoran History
      const { data: setoranData } = await supabase
        .from("setoran")
        .select(`
          id,
          nasabah_id,
          berat,
          harga_beli_saat_ini,
          total_nilai,
          foto_timbangan_url,
          tanggal,
          nasabah (
            nama
          ),
          jenis_sampah (
            nama_sampah
          )
        `)
        .order("tanggal", { ascending: false });

      if (nasError || hargaError) {
        setUsingMock(true);
        setNasabahList(MOCK_NASABAH);
        setSampahList(MOCK_SAMPAH);
        setHistoryList(MOCK_HISTORY);
        return;
      }

      if (nasabahData) setNasabahList(nasabahData);
      
      if (hargaData && hargaData.length > 0) {
        const formatted: JenisSampahHarga[] = hargaData.map((h: any) => ({
          id: h.id,
          jenis_sampah_id: h.jenis_sampah?.id || "",
          nama_sampah: h.jenis_sampah?.nama_sampah || "Sampah",
          harga_jual: Number(h.harga_jual),
          potongan_kas: Number(h.potongan_kas),
          harga_beli: Number(h.harga_beli),
        }));
        setSampahList(formatted);
      }

      if (setoranData) {
        const formattedHistory: SetoranHistory[] = setoranData.map((s: any) => ({
          id: s.id,
          nasabah_id: s.nasabah_id,
          nasabah_nama: s.nasabah?.nama || "Warga",
          nama_sampah: s.jenis_sampah?.nama_sampah || "Sampah",
          berat: Number(s.berat),
          harga_beli_saat_ini: Number(s.harga_beli_saat_ini),
          total_nilai: Number(s.total_nilai),
          foto_timbangan_url: s.foto_timbangan_url || undefined,
          tanggal: s.tanggal,
        }));
        setHistoryList(formattedHistory);
      }
      
      setUsingMock(false);
    } catch (err) {
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  // Triggered when trash type changes to auto-fill default potongan
  const handleSelectSampah = (id: string) => {
    setSelectedSampahId(id);
    const selected = sampahList.find(s => s.id === id);
    if (selected) {
      setPotonganKasCustom(selected.potongan_kas);
    }
  };

  // Image Upload handler (Max 1MB verification)
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Ukuran foto melebihi batas 1MB. Silakan kompres atau pilih foto yang lebih kecil.");
      e.target.value = "";
      return;
    }

    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleAdjustBerat = (amount: number) => {
    setBerat(prev => Math.max(0, parseFloat((prev + amount).toFixed(2))));
  };

  // Find active configurations
  const activeSampah = sampahList.find(s => s.id === selectedSampahId);
  const activeNasabah = nasabahList.find(n => n.id === selectedNasabahId);
  
  // Calculate dynamic pricing
  const hargaJualSaatIni = activeSampah ? activeSampah.harga_jual : 0;
  const potonganKasSaatIni = potonganKasCustom;
  const hargaBeliSaatIni = activeSampah ? Math.max(0, hargaJualSaatIni - potonganKasSaatIni) : 0;
  const totalNilaiNasabah = berat * hargaBeliSaatIni;
  const estimasiMarginKas = berat * potonganKasSaatIni;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNasabahId || !selectedSampahId || berat <= 0) {
      setErrorMsg("Harap lengkapi nama warga, jenis sampah, dan berat timbangan.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    if (usingMock) {
      setTimeout(() => {
        const newSet: SetoranHistory = {
          id: String(Date.now()),
          nasabah_id: selectedNasabahId,
          nasabah_nama: activeNasabah?.nama || "Warga",
          nama_sampah: activeSampah?.nama_sampah || "Sampah",
          berat: berat,
          harga_beli_saat_ini: hargaBeliSaatIni,
          total_nilai: totalNilaiNasabah,
          foto_timbangan_url: fotoPreview || undefined,
          tanggal: new Date().toISOString()
        };
        setHistoryList(prev => [newSet, ...prev]);
        setSuccess(true);
        setSaving(false);
        // Reset form
        setSelectedNasabahId("");
        setSelectedSampahId("");
        setBerat(0);
        setFotoFile(null);
        setFotoPreview(null);
      }, 1000);
      return;
    }

    try {
      // 1. Upload photo to Supabase Storage if present
      let fotoUrl = "";
      if (fotoFile) {
        const fileExt = fotoFile.name.split(".").pop();
        const fileName = `${Date.now()}_timbangan.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("timbangan-photos")
          .upload(fileName, fotoFile);

        if (uploadError) throw uploadError;

        // Ambil URL public
        const { data: publicUrlData } = supabase.storage
          .from("timbangan-photos")
          .getPublicUrl(fileName);
        
        fotoUrl = publicUrlData?.publicUrl || "";
      }

      // Ambil profile pengurus login
      const sessionProfile = localStorage.getItem("user_profile");
      const loggedUser = sessionProfile ? JSON.parse(sessionProfile) : null;
      
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", loggedUser?.email)
        .single();

      // 2. Insert record setoran
      const { data: setoranData, error: setoranError } = await supabase
        .from("setoran")
        .insert({
          nasabah_id: selectedNasabahId,
          jenis_sampah_id: activeSampah?.jenis_sampah_id, // ID jenis sampah riil
          berat: berat,
          harga_jual_saat_ini: hargaJualSaatIni,
          potongan_kas_saat_ini: potonganKasSaatIni,
          harga_beli_saat_ini: hargaBeliSaatIni,
          total_nilai: totalNilaiNasabah,
          foto_timbangan_url: fotoUrl || null,
          petugas_id: userData?.id || null,
        })
        .select()
        .single();

      if (setoranError) throw setoranError;

      // 3. Tambah baris baru di riwayat_saldo nasabah
      const { error: riwayatError } = await supabase
        .from("riwayat_saldo")
        .insert({
          nasabah_id: selectedNasabahId,
          tipe: "setoran",
          reference_id: setoranData.id,
          nominal: totalNilaiNasabah,
          saldo_akhir: (activeNasabah ? Number(activeNasabah.saldo || 0) : 0) + totalNilaiNasabah,
          keterangan: `Setor ${berat} kg ${activeSampah?.nama_sampah}`,
        });

      if (riwayatError) throw riwayatError;

      // 4. Update saldo di tabel nasabah
      const { error: nasUpdateError } = await supabase
        .from("nasabah")
        .update({
          saldo: (activeNasabah ? Number(activeNasabah.saldo || 0) : 0) + totalNilaiNasabah
        })
        .eq("id", selectedNasabahId);

      if (nasUpdateError) throw nasUpdateError;

      setSuccess(true);
      // Reset form
      setSelectedNasabahId("");
      setSelectedSampahId("");
      setBerat(0);
      setFotoFile(null);
      setFotoPreview(null);
      loadData(); // Reload nasabah balances & history list
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE TRANSAKSI & BALIKKAN SALDO NASABAH
  // ==========================================
  const handleSetoranDelete = async (setoran: SetoranHistory) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan setoran ${setoran.berat} kg ${setoran.nama_sampah} untuk ${setoran.nasabah_nama}? Tindakan ini akan memotong saldo warga sebesar ${formatRupiah(setoran.total_nilai)} secara otomatis.`)) return;

    if (usingMock) {
      setHistoryList(prev => prev.filter(s => s.id !== setoran.id));
      return;
    }

    try {
      // 1. Ambil saldo warga aktif saat ini
      const { data: nasData, error: nasError } = await supabase
        .from("nasabah")
        .select("saldo")
        .eq("id", setoran.nasabah_id)
        .single();

      if (nasError) throw nasError;

      const currentSaldo = Number(nasData.saldo || 0);
      // Kurangi saldo warga (minimal 0)
      const newSaldo = Math.max(0, currentSaldo - setoran.total_nilai);

      // 2. Update saldo nasabah di database
      const { error: updateError } = await supabase
        .from("nasabah")
        .update({ saldo: newSaldo })
        .eq("id", setoran.nasabah_id);

      if (updateError) throw updateError;

      // 3. Hapus data di riwayat_saldo nasabah
      await supabase
        .from("riwayat_saldo")
        .delete()
        .eq("reference_id", setoran.id)
        .eq("nasabah_id", setoran.nasabah_id);

      // 4. Hapus data di setoran
      const { error: deleteError } = await supabase
        .from("setoran")
        .delete()
        .eq("id", setoran.id);

      if (deleteError) throw deleteError;

      loadData();
      alert("Transaksi setoran berhasil dibatalkan dan saldo warga disesuaikan!");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-[#202A14] tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="h-6 w-6 text-[#5E7A3E]" />
            Timbang & Setor Sampah
          </h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Catat penimbangan sampah dari warga, hitung tabungan, dan kelola riwayat setoran
          </p>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex border-b border-[#E2E8D5]">
        <button
          onClick={() => { setActiveTab("setor"); setSuccess(false); }}
          className={`py-3 px-6 font-black text-sm border-b-4 transition-all ${
            activeTab === "setor" 
              ? "border-[#5E7A3E] text-[#5E7A3E]" 
              : "border-transparent text-[#202A14]/60 hover:text-[#202A14]/90"
          }`}
        >
          Form Setor Sampah
        </button>
        <button
          onClick={() => { setActiveTab("riwayat"); setSuccess(false); }}
          className={`py-3 px-6 font-black text-sm border-b-4 transition-all ${
            activeTab === "riwayat" 
              ? "border-[#5E7A3E] text-[#5E7A3E]" 
              : "border-transparent text-[#202A14]/60 hover:text-[#202A14]/90"
          }`}
        >
          Riwayat Setoran Warga ({historyList.length})
        </button>
      </div>

      {/* TAB CONTENT 1: FORM INPUT SETORAN */}
      {activeTab === "setor" && (
        <>
          {success && (
            <div className="bg-green-50 border border-green-200 p-5 rounded-[2rem] text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
              <h2 className="text-base font-black text-green-800 uppercase tracking-tight">TRANSAKSI SETORAN BERHASIL!</h2>
              <p className="text-xs text-green-700 font-bold max-w-xs mx-auto">
                Data penimbangan warga telah berhasil disimpan. Saldo tabungan warga telah bertambah secara otomatis.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-full shadow-sm"
              >
                TRANSAKSI BARU
              </button>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* INPUT FORM PENIMBANGAN */}
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
                      <Users className="h-4 w-4 text-[#5E7A3E]" /> Pilih Warga (Penyetor)
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

                {/* PILIH JENIS SAMPAH */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3 flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4 text-[#5E7A3E]" /> Pilih Kategori Sampah
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {sampahList.map(s => {
                      const isSelected = selectedSampahId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSampah(s.id)}
                          className={`
                            p-3 rounded-[1.5rem] border text-center flex flex-col items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? "bg-[#5E7A3E] text-white border-[#5E7A3E] shadow-sm scale-102" 
                              : "bg-[#F9F9F6] border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14]/90"
                            }
                          `}
                        >
                          <Trash2 className={`h-5 w-5 mb-1.5 ${isSelected ? "text-white" : "text-[#5E7A3E]"}`} />
                          <span className="text-xs font-black leading-tight tracking-tight">{s.nama_sampah}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* INPUT BERAT */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3 flex items-center gap-1.5">
                    <Calculator className="h-4 w-4 text-[#5E7A3E]" /> Input Berat Sampah ({activeSampah?.nama_sampah ? (sampahList.find(s => s.id === selectedSampahId)?.nama_sampah ? "kg" : "satuan") : "kg"})
                  </label>
                  
                  {/* Field Input Utama */}
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={berat || ""}
                      onChange={(e) => setBerat(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-center py-3.5 px-12 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xl font-black outline-none transition-all text-[#202A14]"
                    />
                    <span className="absolute right-5 text-xs font-black text-[#5E7A3E] uppercase tracking-wider">
                      {activeSampah?.nama_sampah ? (sampahList.find(s => s.id === selectedSampahId)?.nama_sampah ? "KG" : "STN") : "KG"}
                    </span>
                  </div>

                  {/* Tombol Cepat Tambah/Kurang (Grid 4 Kolom Pas & Responsif) */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustBerat(-1)}
                      className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 active:scale-95 text-[#202A14] py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center transition-all border border-[#E2E8D5] shadow-sm"
                    >
                      -1.0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustBerat(-0.1)}
                      className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 active:scale-95 text-[#202A14] py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center transition-all border border-[#E2E8D5] shadow-sm"
                    >
                      -0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustBerat(0.1)}
                      className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 active:scale-95 text-[#202A14] py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center transition-all border border-[#E2E8D5] shadow-sm"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustBerat(1)}
                      className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 active:scale-95 text-[#202A14] py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center transition-all border border-[#E2E8D5] shadow-sm"
                    >
                      +1.0
                    </button>
                  </div>
                </div>

              </div>

              {/* RINCIAN HARGA & UPLOAD FOTO */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-5 flex flex-col justify-between">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3 border-b border-[#E2E8D5]/40 pb-2">
                    <Calculator className="h-5 w-5 text-[#5E7A3E]" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wide">Kalkulasi Harga Beli</h2>
                  </div>

                  {activeSampah ? (
                    <div className="space-y-3 text-xs font-semibold">
                      
                      <div className="flex justify-between">
                        <span className="text-[#202A14]/75">Harga Acuan Pengepul:</span>
                        <span className="font-extrabold">{formatRupiah(hargaJualSaatIni)}/kg</span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[#202A14]/75">Potongan Kas / Petugas:</span>
                          <span className="font-black text-[#5E7A3E]">Rupiah/kg</span>
                        </div>
                        <input
                          type="number"
                          required
                          value={potonganKasCustom}
                          onChange={(e) => setPotonganKasCustom(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-right px-3 py-1.5 bg-[#F9F9F6] border border-[#E2E8D5] focus:border-[#5E7A3E] rounded-lg font-black outline-none"
                        />
                      </div>

                      <div className="flex justify-between border-t border-dashed border-[#E2E8D5] pt-2">
                        <span className="font-bold">Harga Bersih Nasabah:</span>
                        <span className="font-black text-[#5E7A3E] text-sm">{formatRupiah(hargaBeliSaatIni)}/kg</span>
                      </div>

                      <div className="bg-[#E2E8D5]/35 p-3 rounded-[1.25rem] text-center space-y-1">
                        <span className="text-[10px] font-black uppercase text-[#202A14]/60 tracking-wider">Hasil Saldo Masuk Nasabah</span>
                        <div className="text-xl font-black text-[#5E7A3E]">
                          {formatRupiah(totalNilaiNasabah)}
                        </div>
                        <span className="text-[9px] text-[#202A14]/50 block font-bold">
                          Est. Margin Kas Dusun: +{formatRupiah(estimasiMarginKas)}
                        </span>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-400 text-xs italic">
                      Pilih kategori sampah di kolom kiri untuk melihat rincian kalkulasi harga.
                    </div>
                  )}
                </div>

                {/* UPLOAD FOTO BUKTI TIMBANGAN */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-1 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-[#5E7A3E]" /> Foto Timbangan (Maks 1MB)
                  </label>
                  
                  <div className="relative border-2 border-dashed border-[#E2E8D5] rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#E2E8D5]/10 transition-all min-h-[140px]">
                    {fotoPreview ? (
                      <div className="relative w-full h-[120px] rounded-lg overflow-hidden">
                        <img 
                          src={fotoPreview} 
                          alt="Preview timbangan" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFotoFile(null);
                            setFotoPreview(null);
                          }}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-7 w-7 text-[#5E7A3E]/60 mb-2" />
                        <span className="text-[11px] font-black text-[#5E7A3E]">AMBIL FOTO TIMBANGAN</span>
                        <span className="text-[9px] font-bold text-[#202A14]/40 mt-0.5">Maksimal 1 Foto, Ukuran &lt; 1MB</span>
                      </>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* TOMBOL SIMPAN TRANSAKSI */}
                <button
                  type="submit"
                  disabled={saving || !selectedNasabahId || !selectedSampahId || berat <= 0}
                  className="w-full bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-base py-4 rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all duration-150 disabled:opacity-75 disabled:pointer-events-none mt-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {saving ? "MENYIMPAN..." : "SIMPAN SETORAN"}
                </button>

              </div>

            </form>
          )}
        </>
      )}

      {/* TAB CONTENT 2: DAFTAR RIWAYAT SETORAN */}
      {activeTab === "riwayat" && (
        <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
              <thead>
                <tr className="bg-[#E2E8D5]/50 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Nama Warga</th>
                  <th className="py-4 px-6">Jenis Sampah</th>
                  <th className="py-4 px-6 text-right">Berat</th>
                  <th className="py-4 px-6 text-right">Harga Bersih</th>
                  <th className="py-4 px-6 text-right">Hasil Tabungan</th>
                  <th className="py-4 px-6 text-center">Foto</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8D5]/30">
                {historyList.map((setoran) => (
                  <tr key={setoran.id} className="hover:bg-[#F9F9F6]">
                    <td className="py-3 px-6 whitespace-nowrap">{formatDate(setoran.tanggal)}</td>
                    <td className="py-3 px-6 font-bold text-[#5E7A3E]">{setoran.nasabah_nama}</td>
                    <td className="py-3 px-6">{setoran.nama_sampah}</td>
                    <td className="py-3 px-6 text-right font-black">{setoran.berat} kg</td>
                    <td className="py-3 px-6 text-right">{formatRupiah(setoran.harga_beli_saat_ini)}/kg</td>
                    <td className="py-3 px-6 text-right font-black text-green-700">+{formatRupiah(setoran.total_nilai)}</td>
                    <td className="py-3 px-6 text-center">
                      {setoran.foto_timbangan_url ? (
                        <button
                          onClick={() => setViewingPhotoUrl(setoran.foto_timbangan_url || null)}
                          className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 text-[#202A14] font-black text-[10px] py-1 px-2.5 rounded-full transition-all"
                        >
                          LIHAT FOTO
                        </button>
                      ) : (
                        <span className="text-zinc-400 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleSetoranDelete(setoran)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded-full transition-all"
                        title="Batalkan Setoran"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {historyList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#202A14]/50 italic">
                      <TrendingDown className="h-8 w-8 text-[#E2E8D5] mx-auto mb-2" />
                      Belum ada riwayat transaksi setor sampah warga.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIGHTBOX MODAL FOR TIMBANGAN PHOTO VIEWING */}
      {/* ======================================================== */}
      {viewingPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] overflow-hidden rounded-2xl">
            <button 
              onClick={() => setViewingPhotoUrl(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
            <img 
              src={viewingPhotoUrl} 
              alt="Foto Timbangan" 
              className="w-full h-auto object-contain max-h-[80vh] border-2 border-white rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
