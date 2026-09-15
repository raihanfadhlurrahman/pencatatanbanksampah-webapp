"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Truck, 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Phone, 
  MapPin, 
  TrendingUp, 
  X, 
  CheckCircle, 
  AlertCircle,
  TrendingDown,
  PackageCheck
} from "lucide-react";

interface Pengepul {
  id: string;
  nama: string;
  kontak: string;
  alamat: string;
  jadwal_ambil: string;
}

interface HargaPengepul {
  id: string;
  pengepul_id: string;
  jenis_sampah_id: string;
  nama_sampah?: string;
  harga_jual: number;
}

interface PenjualanHistory {
  id: string;
  pengepul_nama: string;
  nama_sampah: string;
  berat: number;
  harga_jual_saat_ini: number;
  total_nilai: number;
  tanggal: string;
}

// Data Mock Kosong
const MOCK_PENGEPUL: Pengepul[] = [];
const MOCK_HARGA: HargaPengepul[] = [];
const MOCK_PENJUALAN: PenjualanHistory[] = [];

export default function PengepulPage() {
  const [pengepulList, setPengepulList] = useState<Pengepul[]>(MOCK_PENGEPUL);
  const [hargaList, setHargaList] = useState<HargaPengepul[]>(MOCK_HARGA);
  const [penjualanList, setPenjualanList] = useState<PenjualanHistory[]>(MOCK_PENJUALAN);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"mitra" | "penjualan">("mitra");

  // Modals state
  const [mitraModalOpen, setMitraModalOpen] = useState(false);
  const [jualModalOpen, setJualModalOpen] = useState(false);
  const [editingPengepul, setEditingPengepul] = useState<Pengepul | null>(null);

  // Form Mitra Fields
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  const [jadwalAmbil, setJadwalAmbil] = useState("Setiap Hari");

  // Form Penjualan Fields
  const [selectedPengepulId, setSelectedPengepulId] = useState("");
  const [selectedSampahId, setSelectedSampahId] = useState("");
  const [beratJual, setBeratJual] = useState<number>(0);

  // Helper types & Stock Map
  const [typesList, setTypesList] = useState<any[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch Pengepul
      const { data: pengepulData, error: pengError } = await supabase
        .from("pengepul")
        .select("*")
        .order("nama", { ascending: true });

      // Fetch Trash Types
      const { data: typesData } = await supabase
        .from("jenis_sampah")
        .select("id, nama_sampah");

      if (typesData) {
        setTypesList(typesData);
      } else {
        setTypesList([
          { id: "1", nama_sampah: "Botol Plastik PET" },
          { id: "2", nama_sampah: "Kardus Cokelat" },
          { id: "3", nama_sampah: "Kaleng / Besi Seng" },
        ]);
      }

      // Fetch Harga Pengepul
      const { data: pricesData } = await supabase
        .from("harga_pengepul")
        .select(`
          id,
          pengepul_id,
          jenis_sampah_id,
          harga_jual,
          jenis_sampah (
            nama_sampah
          )
        `);

      // Fetch Penjualan History
      const { data: salesData } = await supabase
        .from("penjualan_pengepul")
        .select(`
          id,
          jenis_sampah_id,
          berat,
          harga_jual_saat_ini,
          total_nilai,
          tanggal,
          pengepul (
            nama
          ),
          jenis_sampah (
            nama_sampah
          )
        `)
        .order("tanggal", { ascending: false });

      // Fetch Data Setoran Masuk untuk Kalkulasi Stok Gudang
      const { data: setoranData } = await supabase
        .from("setoran")
        .select("jenis_sampah_id, berat");

      // Hitung Akumulasi Stok Bersih di Gudang (Total Masuk - Total Terjual)
      const stockMapCalc: Record<string, number> = {};
      if (setoranData) {
        setoranData.forEach((s: any) => {
          if (s.jenis_sampah_id) {
            stockMapCalc[s.jenis_sampah_id] = (stockMapCalc[s.jenis_sampah_id] || 0) + Number(s.berat || 0);
          }
        });
      }
      if (salesData) {
        salesData.forEach((s: any) => {
          const trashId = s.jenis_sampah_id;
          if (trashId) {
            stockMapCalc[trashId] = Math.max(0, (stockMapCalc[trashId] || 0) - Number(s.berat || 0));
          }
        });
      }
      setStockMap(stockMapCalc);

      if (pengError) {
        setUsingMock(true);
        setPengepulList(MOCK_PENGEPUL);
        setHargaList(MOCK_HARGA);
        setPenjualanList(MOCK_PENJUALAN);
        return;
      }

      if (pengepulData) setPengepulList(pengepulData);
      
      if (pricesData && pricesData.length > 0) {
        const formattedPrices: HargaPengepul[] = pricesData.map((p: any) => ({
          id: p.id,
          pengepul_id: p.pengepul_id,
          jenis_sampah_id: p.jenis_sampah_id,
          nama_sampah: p.jenis_sampah?.nama_sampah,
          harga_jual: Number(p.harga_jual),
        }));
        setHargaList(formattedPrices);
      }

      if (salesData && salesData.length > 0) {
        const formattedSales: PenjualanHistory[] = salesData.map((s: any) => ({
          id: s.id,
          pengepul_nama: s.pengepul?.nama || "Pengepul",
          nama_sampah: s.jenis_sampah?.nama_sampah || "Sampah",
          berat: Number(s.berat),
          harga_jual_saat_ini: Number(s.harga_jual_saat_ini),
          total_nilai: Number(s.total_nilai),
          tanggal: s.tanggal,
        }));
        setPenjualanList(formattedSales);
      }

      setUsingMock(false);
    } catch (err) {
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  // 1. TAMBAH/EDIT MITRA PENGEPUL
  const handleOpenAdd = () => {
    setEditingPengepul(null);
    setNama("");
    setKontak("");
    setAlamat("");
    setJadwalAmbil("Setiap Hari");
    setErrorMsg(null);
    setMitraModalOpen(true);
  };

  const handleOpenEdit = (pengepul: Pengepul) => {
    setEditingPengepul(pengepul);
    setNama(pengepul.nama);
    setKontak(pengepul.kontak);
    setAlamat(pengepul.alamat);
    setJadwalAmbil(pengepul.jadwal_ambil);
    setErrorMsg(null);
    setMitraModalOpen(true);
  };

  const handleMitraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isEditing = !!editingPengepul;

    if (usingMock) {
      if (isEditing) {
        setPengepulList(prev => prev.map(p => p.id === editingPengepul.id ? {
          ...p, nama, kontak, alamat, jadwal_ambil: jadwalAmbil
        } : p));
      } else {
        const newP: Pengepul = {
          id: String(Date.now()),
          nama, kontak, alamat, jadwal_ambil: jadwalAmbil
        };
        setPengepulList(prev => [...prev, newP]);
      }
      setMitraModalOpen(false);
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("pengepul")
          .update({ nama, kontak, alamat, jadwal_ambil: jadwalAmbil })
          .eq("id", editingPengepul.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pengepul")
          .insert({ nama, kontak, alamat, jadwal_ambil: jadwalAmbil });

        if (error) throw error;
      }
      loadData();
      setMitraModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data pengepul.");
    }
  };

  const handleMitraDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data pengepul ini?")) return;

    if (usingMock) {
      setPengepulList(prev => prev.filter(p => p.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from("pengepul")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data.");
    }
  };

  // 2. INPUT TRANSAKSI PENJUALAN KE PENGEPUL
  const handleOpenJual = () => {
    setSelectedPengepulId("");
    setSelectedSampahId("");
    setBeratJual(0);
    setErrorMsg(null);
    setJualModalOpen(true);
  };

  // Handler saat memilih jenis sampah: Otomatis set berat ke SELURUH stok yang tercatat
  const handleSelectSampah = (trashId: string) => {
    setSelectedSampahId(trashId);
    const availableStock = stockMap[trashId] || 0;
    setBeratJual(availableStock > 0 ? parseFloat(availableStock.toFixed(2)) : 0);
  };

  // Cari harga jual pengepul aktif dari tabel harga
  const activeHargaPengepul = hargaList.find(
    h => h.pengepul_id === selectedPengepulId && h.jenis_sampah_id === selectedSampahId
  );
  
  const defaultHargaJual = activeHargaPengepul ? activeHargaPengepul.harga_jual : 0;
  const totalNilaiJual = beratJual * defaultHargaJual;

  const handleJualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPengepulId || !selectedSampahId || beratJual <= 0) {
      setErrorMsg("Harap lengkapi formulir penjualan.");
      return;
    }

    setSaving(true);

    const activePengepul = pengepulList.find(p => p.id === selectedPengepulId);
    const activeTrash = typesList.find(t => t.id === selectedSampahId);

    if (usingMock) {
      setTimeout(() => {
        const newSale: PenjualanHistory = {
          id: String(Date.now()),
          pengepul_nama: activePengepul?.nama || "Pengepul",
          nama_sampah: activeTrash?.nama_sampah || "Sampah",
          berat: beratJual,
          harga_jual_saat_ini: defaultHargaJual,
          total_nilai: totalNilaiJual,
          tanggal: new Date().toISOString(),
        };
        setPenjualanList(prev => [newSale, ...prev]);
        setStockMap(prev => ({
          ...prev,
          [selectedSampahId]: Math.max(0, (prev[selectedSampahId] || 0) - beratJual)
        }));
        setJualModalOpen(false);
        setSaving(false);
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

      // 1. Simpan ke penjualan_pengepul
      const { error: sellError } = await supabase
        .from("penjualan_pengepul")
        .insert({
          pengepul_id: selectedPengepulId,
          jenis_sampah_id: selectedSampahId,
          berat: beratJual,
          harga_jual_saat_ini: defaultHargaJual,
          total_nilai: totalNilaiJual,
          petugas_id: userData?.id || null,
        });

      if (sellError) throw sellError;

      // 2. Simpan ke kas umum (keuangan_kas) sebagai pemasukan
      const { error: kasError } = await supabase
        .from("keuangan_kas")
        .insert({
          tipe: "masuk",
          kategori: "Penjualan Pengepul",
          nominal: totalNilaiJual,
          keterangan: `Penjualan ${beratJual} kg ${activeTrash?.nama_sampah} ke ${activePengepul?.nama}`,
        });

      if (kasError) throw kasError;

      loadData();
      setJualModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan transaksi penjualan.");
    } finally {
      setSaving(false);
    }
  };

  const handlePenjualanDelete = async (sale: PenjualanHistory) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan penjualan ${sale.berat} kg ${sale.nama_sampah} ke ${sale.pengepul_nama}? Tindakan ini akan menghapus catatan kas masuk terkait.`)) return;

    if (usingMock) {
      setPenjualanList(prev => prev.filter(p => p.id !== sale.id));
      return;
    }

    try {
      // 1. Cari & hapus transaksi keuangan kas masuk terkait
      await supabase
        .from("keuangan_kas")
        .delete()
        .eq("nominal", sale.total_nilai)
        .eq("tipe", "masuk")
        .eq("kategori", "Penjualan Pengepul");

      // 2. Hapus data penjualan
      const { error: sellError } = await supabase
        .from("penjualan_pengepul")
        .delete()
        .eq("id", sale.id);

      if (sellError) throw sellError;

      loadData();
      alert("Transaksi penjualan berhasil dibatalkan!");
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
            <Truck className="h-6 w-6 text-[#5E7A3E]" />
            Kemitraan Pengepul & Penjualan
          </h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Kelola data mitra pengepul, kelola harga jual sampah, dan catat transaksi penjualan
          </p>
        </div>

        {/* Action button */}
        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={handleOpenAdd}
            className="border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 px-4 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="h-4.5 w-4.5 text-[#5E7A3E]" />
            MITRA PENGEPUL
          </button>
          
          <button
            onClick={handleOpenJual}
            className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-3 px-5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <DollarSign className="h-4.5 w-4.5" />
            CATAT PENJUALAN
          </button>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex border-b border-[#E2E8D5]">
        <button
          onClick={() => setActiveTab("mitra")}
          className={`py-3 px-6 font-black text-sm border-b-4 transition-all ${
            activeTab === "mitra" 
              ? "border-[#5E7A3E] text-[#5E7A3E]" 
              : "border-transparent text-[#202A14]/60 hover:text-[#202A14]/90"
          }`}
        >
          Mitra Pengepul ({pengepulList.length})
        </button>
        <button
          onClick={() => setActiveTab("penjualan")}
          className={`py-3 px-6 font-black text-sm border-b-4 transition-all ${
            activeTab === "penjualan" 
              ? "border-[#5E7A3E] text-[#5E7A3E]" 
              : "border-transparent text-[#202A14]/60 hover:text-[#202A14]/90"
          }`}
        >
          Riwayat Penjualan ({penjualanList.length})
        </button>
      </div>

      {/* TAB CONTENT 1: MITRA PENGEPUL */}
      {activeTab === "mitra" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pengepulList.map((p) => {
            const pricingList = hargaList.filter(h => h.pengepul_id === p.id);
            return (
              <div 
                key={p.id}
                className="bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between space-y-4"
              >
                {/* Info Utama */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black tracking-tight text-[#5E7A3E]">{p.nama}</h3>
                    <div className="flex gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        className="bg-zinc-100 p-2 rounded-full hover:bg-zinc-200"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-[#5E7A3E]" />
                      </button>
                      <button 
                        onClick={() => handleMitraDelete(p.id)}
                        className="bg-red-50 p-2 rounded-full hover:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-semibold text-[#202A14]/80">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#5E7A3E]" />
                      <span>{p.kontak || "Tidak ada kontak"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#5E7A3E] shrink-0" />
                      <span className="truncate">{p.alamat || "Tidak ada alamat"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#E2E8D5]/30 py-1.5 px-3 rounded-lg text-[11px] font-bold text-[#202A14] w-fit">
                      <Calendar className="h-4 w-4 text-[#5E7A3E]" />
                      <span>Penjemputan: {p.jadwal_ambil || "Kondisional"}</span>
                    </div>
                  </div>
                </div>

                {/* Daftar Harga Jual (Daftar screen uireference.jpg Layar 5) */}
                <div className="border-t border-[#E2E8D5]/40 pt-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/60 mb-2">Daftar Harga Jual Pengepul:</h4>
                  {pricingList.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      {pricingList.map(h => (
                        <div key={h.id} className="bg-[#F9F9F6] p-2 rounded-xl border border-[#E2E8D5]/20 flex justify-between">
                          <span className="truncate max-w-[80px] text-[#202A14]/75">{h.nama_sampah || "Sampah"}</span>
                          <span className="text-[#5E7A3E] font-black">{formatRupiah(h.harga_jual)}/kg</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#202A14]/50 italic">Daftar harga jual belum dikonfigurasi.</p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT 2: RIWAYAT PENJUALAN */}
      {activeTab === "penjualan" && (
        <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
              <thead>
                <tr className="bg-[#E2E8D5]/50 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Mitra Pengepul</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6 text-right">Berat (kg)</th>
                  <th className="py-4 px-6 text-right">Harga Jual</th>
                  <th className="py-4 px-6 text-right">Total Nilai</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8D5]/30">
                {penjualanList.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#F9F9F6]">
                    <td className="py-3 px-6 whitespace-nowrap">{formatDate(sale.tanggal)}</td>
                    <td className="py-3 px-6 font-bold text-[#5E7A3E]">{sale.pengepul_nama}</td>
                    <td className="py-3 px-6">{sale.nama_sampah}</td>
                    <td className="py-3 px-6 text-right font-black">{sale.berat} kg</td>
                    <td className="py-3 px-6 text-right">{formatRupiah(sale.harga_jual_saat_ini)}/kg</td>
                    <td className="py-3 px-6 text-right font-black text-green-700">+{formatRupiah(sale.total_nilai)}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handlePenjualanDelete(sale)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded-full transition-all"
                        title="Batalkan Penjualan"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {penjualanList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[#202A14]/50 italic">
                      <TrendingDown className="h-8 w-8 text-[#E2E8D5] mx-auto mb-2" />
                      Belum ada catatan transaksi penjualan ke pengepul.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. MODAL TAMBAH/EDIT MITRA PENGEPUL */}
      {/* ======================================================== */}
      {mitraModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleMitraSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                {editingPengepul ? "Ubah Data Mitra Pengepul" : "Tambah Mitra Pengepul"}
              </h2>
              <button 
                type="button" 
                onClick={() => setMitraModalOpen(false)}
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

              {/* Input Nama Pengepul */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Nama Badan/Pengepul
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CV Jaya Sejahtera (Pak Joko)"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
                />
              </div>

              {/* Input Kontak */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Kontak (No HP / Telepon)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0812-3456-7890"
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
                />
              </div>

              {/* Input Alamat */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Alamat Pengepul
                </label>
                <textarea
                  placeholder="Masukkan alamat lengkap pengepul"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-[1.25rem] text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
                />
              </div>

              {/* Input Jadwal Pengambilan */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Jadwal Penjemputan / Pengambilan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Setiap Hari Selasa / Kondisional"
                  value={jadwalAmbil}
                  onChange={(e) => setJadwalAmbil(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button" 
                onClick={() => setMitraModalOpen(false)}
                className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 rounded-full"
              >
                BATAL
              </button>
              <button 
                type="submit"
                className="flex-1 bg-[#5E7A3E] hover:bg-[#5E7A3E]/95 text-white font-extrabold text-xs py-3 rounded-full shadow-sm"
              >
                {editingPengepul ? "SIMPAN" : "TAMBAH MITRA"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL TRANSAKSI PENJUALAN KE PENGEPUL */}
      {/* ======================================================== */}
      {jualModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleJualSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">Catat Penjualan Sampah</h2>
              <button 
                type="button" 
                onClick={() => setJualModalOpen(false)}
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

              {/* Pilih Pengepul */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Pilih Pengepul Pembeli
                </label>
                <select
                  required
                  value={selectedPengepulId}
                  onChange={(e) => setSelectedPengepulId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="">-- Pilih Mitra Pengepul --</option>
                  {pengepulList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {/* Pilih Jenis Sampah */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Jenis Sampah yang Dijual
                </label>
                <select
                  required
                  disabled={!selectedPengepulId}
                  value={selectedSampahId}
                  onChange={(e) => handleSelectSampah(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="">-- Pilih Jenis Sampah --</option>
                  {typesList.map(t => {
                    const stock = stockMap[t.id] || 0;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.nama_sampah} (Stok: {stock > 0 ? `${stock.toFixed(1)} kg` : "0 kg"})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tampilan Ringkasan Stok Gudang */}
              {selectedSampahId && (
                <div className="bg-[#E2E8D5]/40 border border-[#5E7A3E]/20 p-3 rounded-[1.25rem] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#5E7A3E]/10 text-[#5E7A3E] rounded-full">
                      <PackageCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#202A14]/70 uppercase tracking-wider">
                        Stok Tercatat di Gudang
                      </p>
                      <p className="text-sm font-black text-[#5E7A3E]">
                        {(stockMap[selectedSampahId] || 0).toFixed(2)} kg
                      </p>
                    </div>
                  </div>

                  {(stockMap[selectedSampahId] || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setBeratJual(parseFloat((stockMap[selectedSampahId] || 0).toFixed(2)))}
                      className="text-[11px] font-black bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white px-3 py-1.5 rounded-full transition-all shadow-xs"
                      title="Gunakan seluruh stok yang tercatat"
                    >
                      Gunakan Semua
                    </button>
                  )}
                </div>
              )}

              {/* Peringatan jika berat melebihi stok tercatat */}
              {selectedSampahId && (stockMap[selectedSampahId] || 0) > 0 && beratJual > (stockMap[selectedSampahId] || 0) && (
                <p className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>Berat input ({beratJual} kg) melebihi stok tercatat ({(stockMap[selectedSampahId] || 0).toFixed(2)} kg).</span>
                </p>
              )}

              {/* Info jika stok kosong */}
              {selectedSampahId && (stockMap[selectedSampahId] || 0) <= 0 && (
                <p className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>Belum ada catatan setoran warga yang tersedia untuk jenis sampah ini (Stok: 0 kg).</span>
                </p>
              )}

              {/* Input Berat */}
              <div className="space-y-1">
                <div className="flex justify-between items-center pl-3 pr-1">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75">
                    Berat Sampah Terjual (kg)
                  </label>
                  {selectedSampahId && (stockMap[selectedSampahId] || 0) > 0 && (
                    <span className="text-[10px] text-[#5E7A3E] font-bold">
                      Default: Seluruh Stok
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={!selectedSampahId}
                  placeholder="0.00"
                  value={beratJual || ""}
                  onChange={(e) => setBeratJual(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>

              {/* Rincian Kas Masuk */}
              {selectedSampahId && (
                <div className="bg-[#E2E8D5]/30 p-4 rounded-[1.5rem] space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span>Harga Jual Pengepul:</span>
                    <span>{formatRupiah(defaultHargaJual)}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Berat Dijual:</span>
                    <span className="font-bold">{beratJual} kg</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-[#5E7A3E]/30 pt-2 font-black text-sm text-[#5E7A3E]">
                    <span>Total Kas Masuk:</span>
                    <span>{formatRupiah(totalNilaiJual)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button" 
                onClick={() => setJualModalOpen(false)}
                className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 rounded-full"
              >
                BATAL
              </button>
              <button 
                type="submit"
                disabled={saving || !selectedPengepulId || !selectedSampahId || beratJual <= 0}
                className="flex-1 bg-[#5E7A3E] hover:bg-[#5E7A3E]/95 text-white font-extrabold text-xs py-3 rounded-full shadow-sm"
              >
                {saving ? "MENYIMPAN..." : "SIMPAN TRANSAKSI"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
