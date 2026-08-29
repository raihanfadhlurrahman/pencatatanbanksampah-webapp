"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Trash2, 
  Wallet, 
  TrendingUp, 
  LogIn, 
  Info, 
  Award,
  ChevronRight,
  Truck,
  Star,
  X,
  Search,
  ChevronRight as ArrowRight,
  Calendar,
  DollarSign
} from "lucide-react";

// Tipe Data untuk State
interface Statistik {
  totalNasabah: number;
  totalSampah: number;
  totalTabungan: number;
  totalPengepul: number;
}

interface GroupedHargaMitra {
  pengepul_id: string;
  pengepul_nama: string;
  jadwal_ambil?: string;
  items: {
    jenis_sampah_id: string;
    nama_sampah: string;
    satuan: string;
    harga_jual: number;
    potongan_kas: number;
    harga_beli: number;
    minimal_berat: number;
  }[];
}

interface LeadBerat {
  nasabah_id: string;
  nama: string;
  no_nasabah: string;
  foto_url?: string;
  total_berat: number;
}

interface LeadSaldo {
  nasabah_id: string;
  nama: string;
  no_nasabah: string;
  foto_url?: string;
  saldo: number;
}

interface LeadRating {
  petugas_id: string;
  nama: string;
  role: string;
  foto_url?: string;
  total_vote: number;
}

// Data Mock untuk Fallback (Supabase Offline/Belum Terkoneksi)
const MOCK_STATISTIK: Statistik = {
  totalNasabah: 0,
  totalSampah: 0,
  totalTabungan: 0,
  totalPengepul: 0,
};

const MOCK_GROUPED_HARGA: GroupedHargaMitra[] = [];
const MOCK_LEAD_BERAT: LeadBerat[] = [];
const MOCK_LEAD_SALDO: LeadSaldo[] = [];
const MOCK_LEAD_RATING: LeadRating[] = [];

export default function Home() {
  const [statistik, setStatistik] = useState<Statistik>(MOCK_STATISTIK);
  const [groupedHarga, setGroupedHarga] = useState<GroupedHargaMitra[]>(MOCK_GROUPED_HARGA);
  
  // Leaderboard States
  const [leadBeratList, setLeadBeratList] = useState<LeadBerat[]>(MOCK_LEAD_BERAT);
  const [leadSaldoList, setLeadSaldoList] = useState<LeadSaldo[]>(MOCK_LEAD_SALDO);
  const [leadRatingList, setLeadRatingList] = useState<LeadRating[]>(MOCK_LEAD_RATING);

  // Warga Search & Detail States
  const [allNasabahList, setAllNasabahList] = useState<any[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNasabah, setSelectedNasabah] = useState<any | null>(null);
  const [selectedNasabahHistory, setSelectedNasabahHistory] = useState<any[]>([]);
  const [selectedNasabahTotalWeight, setSelectedNasabahTotalWeight] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Card Popup Modals States
  const [sampahModalOpen, setSampahModalOpen] = useState(false);
  const [lastTenSetoran, setLastTenSetoran] = useState<any[]>([]);
  
  const [tabunganModalOpen, setTabunganModalOpen] = useState(false);
  const [lastTenTransactions, setLastTenTransactions] = useState<any[]>([]);

  const [pengepulModalOpen, setPengepulModalOpen] = useState(false);
  const [pengepulFullList, setPengepulFullList] = useState<any[]>([]);

  const [leaderboardTab, setLeaderboardTab] = useState<"teraktif" | "saldo" | "petugas">("teraktif");
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 1. Fetch Statistik
        const { count: nasabahCount, error: nasabahError } = await supabase
          .from("nasabah")
          .select("*", { count: "exact", head: true });

        const { data: nasData, error: nasDataError } = await supabase
          .from("nasabah")
          .select("saldo");

        const { data: setoranData, error: setoranError } = await supabase
          .from("setoran")
          .select("berat");

        // 2. Fetch Harga Nasabah (untuk acuan potongan_kas)
        const { data: hargaNasabahData, error: hargaNasabahError } = await supabase
          .from("harga_nasabah")
          .select("jenis_sampah_id, potongan_kas");

        // 3. Fetch Pengepul (Mitra)
        const { data: pengepulData, error: pengepulError } = await supabase
          .from("pengepul")
          .select("id, nama, kontak, alamat, jadwal_ambil")
          .order("nama", { ascending: true });

        // 4. Fetch Harga Pengepul (Mitra Prices)
        const { data: hargaPengepulData, error: hargaPengepulError } = await supabase
          .from("harga_pengepul")
          .select(`
            id,
            pengepul_id,
            jenis_sampah_id,
            harga_jual,
            minimal_berat,
            jenis_sampah (
              nama_sampah,
              satuan
            )
          `);

        // 5. Fetch Leaderboards
        const { data: leadBerat } = await supabase
          .from("view_leaderboard_berat")
          .select("*");

        const { data: leadSaldo } = await supabase
          .from("view_leaderboard_saldo")
          .select("*");

        const { data: leadRating } = await supabase
          .from("view_leaderboard_rating")
          .select("*");

        // 6. Fetch All Nasabah List (for search)
        const { data: allNasabah } = await supabase
          .from("nasabah")
          .select("id, no_nasabah, nama, rt_rw, saldo, foto_url")
          .order("nama", { ascending: true });

        // 7. Fetch 10 Last Penimbangan (for Sampah Card Modal)
        const { data: lastSetoran } = await supabase
          .from("setoran")
          .select(`
            id,
            berat,
            tanggal,
            nasabah (nama, rt_rw),
            jenis_sampah (nama_sampah)
          `)
          .order("tanggal", { ascending: false })
          .limit(10);

        // 8. Fetch 10 Last Transactions (for Tabungan Card Modal)
        const { data: lastMutasi } = await supabase
          .from("riwayat_saldo")
          .select(`
            id,
            tipe,
            nominal,
            keterangan,
            tanggal,
            nasabah (nama, rt_rw)
          `)
          .order("tanggal", { ascending: false })
          .limit(10);

        // Jika terjadi error (misalnya Supabase belum dikonfigurasi/tabel belum ada)
        if (nasabahError || nasDataError || setoranError || hargaNasabahError || pengepulError || hargaPengepulError) {
          console.warn("Menggunakan data demo kosong karena Supabase belum terhubung.");
          setUsingMock(true);
          setLoading(false);
          return;
        }

        // Kalkulasi Statistik dari Database
        const totalNasabah = nasabahCount || 0;
        const totalSampah = setoranData?.reduce((acc, curr) => acc + Number(curr.berat), 0) || 0;
        const totalTabungan = nasData?.reduce((acc, curr) => acc + Number(curr.saldo || 0), 0) || 0;
        const totalPengepul = pengepulData?.length || 0;

        setStatistik({
          totalNasabah,
          totalSampah,
          totalTabungan,
          totalPengepul,
        });

        // Pengelompokan Harga Berdasarkan Pengepul
        if (pengepulData && hargaPengepulData) {
          const formatted: GroupedHargaMitra[] = pengepulData.map((p: any) => {
            const matchedPrices = hargaPengepulData.filter((hp: any) => hp.pengepul_id === p.id);
            const items = matchedPrices.map((hp: any) => {
              const potRecord = hargaNasabahData?.find((hn: any) => hn.jenis_sampah_id === hp.jenis_sampah_id);
              const potongan = potRecord ? Number(potRecord.potongan_kas) : 0;
              const hargaJual = Number(hp.harga_jual);
              return {
                jenis_sampah_id: hp.jenis_sampah_id,
                nama_sampah: hp.jenis_sampah?.nama_sampah || "Sampah",
                satuan: hp.jenis_sampah?.satuan || "kg",
                harga_jual: hargaJual,
                potongan_kas: potongan,
                harga_beli: Math.max(0, hargaJual - potongan),
                minimal_berat: Number(hp.minimal_berat || 0),
              };
            });

            return {
              pengepul_id: p.id,
              pengepul_nama: p.nama,
              jadwal_ambil: p.jadwal_ambil || undefined,
              items,
            };
          }).filter(g => g.items.length > 0);

          setGroupedHarga(formatted);
          setPengepulFullList(pengepulData);
        }

        // Set Leaderboards
        if (leadBerat) {
          setLeadBeratList(leadBerat.map((l: any) => ({
            nasabah_id: l.nasabah_id,
            nama: l.nama,
            no_nasabah: l.no_nasabah,
            foto_url: l.foto_url || undefined,
            total_berat: Number(l.total_berat)
          })));
        }

        if (leadSaldo) {
          setLeadSaldoList(leadSaldo.map((l: any) => ({
            nasabah_id: l.nasabah_id,
            nama: l.nama,
            no_nasabah: l.no_nasabah,
            foto_url: l.foto_url || undefined,
            saldo: Number(l.saldo)
          })));
        }

        if (leadRating) {
          setLeadRatingList(leadRating.map((l: any) => ({
            petugas_id: l.petugas_id,
            nama: l.nama,
            role: l.role,
            foto_url: l.foto_url || undefined,
            total_vote: Number(l.total_vote || 0)
          })));
        }

        if (allNasabah) {
          setAllNasabahList(allNasabah);
        }

        if (lastSetoran) {
          setLastTenSetoran(lastSetoran);
        }

        if (lastMutasi) {
          setLastTenTransactions(lastMutasi);
        }

        setUsingMock(false);
      } catch (err) {
        console.error("Gagal memuat data dari Supabase:", err);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleViewNasabahDetail = async (nasabah: any) => {
    setSelectedNasabah(nasabah);
    setDetailModalOpen(true);
    setLoadingDetail(true);

    if (usingMock) {
      // Data simulasi jika Supabase offline
      setSelectedNasabahTotalWeight(44.0);
      setSelectedNasabahHistory([
        { id: "h1", tipe: "setoran", nominal: 15000, saldo_akhir: 125000, keterangan: "Setor 5kg Botol Plastik PET", tanggal: new Date().toISOString() },
        { id: "h2", tipe: "pencairan", nominal: 50000, saldo_akhir: 110000, keterangan: "Pencairan tabungan belanja", tanggal: new Date(Date.now() - 86400000 * 2).toISOString() },
      ]);
      setLoadingDetail(false);
      return;
    }

    try {
      // 1. Fetch total berat sampah dari setoran
      const { data: setoranData } = await supabase
        .from("setoran")
        .select("berat")
        .eq("nasabah_id", nasabah.id);
      
      const totalBerat = setoranData?.reduce((acc, curr) => acc + Number(curr.berat), 0) || 0;
      setSelectedNasabahTotalWeight(totalBerat);

      // 2. Fetch history dari riwayat_saldo
      const { data: historyData } = await supabase
        .from("riwayat_saldo")
        .select("id, tipe, nominal, saldo_akhir, keterangan, tanggal")
        .eq("nasabah_id", nasabah.id)
        .order("tanggal", { ascending: false });

      if (historyData) {
        setSelectedNasabahHistory(historyData);
      } else {
        setSelectedNasabahHistory([]);
      }
    } catch (err) {
      console.error("Gagal memuat detail warga:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter warga di modal pencarian
  const filteredNasabahSearch = allNasabahList.filter(n => 
    n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.no_nasabah.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format rupiah
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#202A14] flex flex-col font-sans">
      
      {/* HEADER UTAMA (Earthy Sage) */}
      <header className="bg-[#5E7A3E] text-white py-8 px-6 rounded-b-[2.5rem] shadow-md flex flex-col items-center justify-center text-center">
        <div className="bg-[#E2E8D5] p-3 rounded-full mb-3 shadow-inner">
          <Trash2 className="h-8 w-8 text-[#5E7A3E]" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-wide uppercase">BASAH Rejosari</h1>
        <p className="text-sm font-medium opacity-90 mt-1">
          BAnk SAmpaH Rejosari - Dusun Rejosari, Wedomartani
        </p>
        
        {usingMock && (
          <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-sm animate-pulse">
            <Info className="h-3.5 w-3.5" /> Supabase Belum Terhubung
          </span>
        )}
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-6">
        
        {/* SECTION 1: RINGKASAN DATA (PILL GRID - 4 CARDS INTERACTIVE) */}
        <section className="grid grid-cols-2 gap-3">
          
          {/* Card Warga (Clickable untuk memicu pencarian) */}
          <button 
            type="button"
            onClick={() => { setSearchModalOpen(true); setSearchQuery(""); }}
            className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 p-3.5 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all cursor-pointer border-0 w-full"
            title="Klik untuk mencari saldo tabungan warga"
          >
            <div className="bg-white/80 p-2 rounded-full mb-2">
              <Users className="h-5 w-5 text-[#5E7A3E]" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#202A14]/70">Warga</span>
            <span className="text-base font-black mt-0.5">{statistik.totalNasabah} KK</span>
            <span className="text-[8px] text-[#202A14]/50 font-bold mt-1">Cari Saldo 🔍</span>
          </button>

          {/* Card Sampah (Clickable untuk memicu pop-up penimbangan) */}
          <button 
            type="button"
            onClick={() => setSampahModalOpen(true)}
            className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 p-3.5 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all cursor-pointer border-0 w-full"
            title="Klik untuk detail timbangan"
          >
            <div className="bg-white/80 p-2 rounded-full mb-2">
              <TrendingUp className="h-5 w-5 text-[#5E7A3E]" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#202A14]/70">Sampah</span>
            <span className="text-base font-black mt-0.5">{statistik.totalSampah.toFixed(1)} kg</span>
            <span className="text-[8px] text-[#202A14]/50 font-bold mt-1">Lihat Detail 📦</span>
          </button>

          {/* Card Total Tabungan Warga (Clickable untuk memicu pop-up transaksi) */}
          <button 
            type="button"
            onClick={() => setTabunganModalOpen(true)}
            className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 p-3.5 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all cursor-pointer border-0 w-full"
            title="Klik untuk detail tabungan"
          >
            <div className="bg-white/80 p-2 rounded-full mb-2">
              <Wallet className="h-5 w-5 text-[#5E7A3E]" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#202A14]/70">Tabungan Warga</span>
            <span className="text-xs font-black mt-0.5 whitespace-nowrap">{formatRupiah(statistik.totalTabungan)}</span>
            <span className="text-[8px] text-[#202A14]/50 font-bold mt-1">Mutasi Kas 💰</span>
          </button>

          {/* Card Mitra Pengepul (Clickable untuk memicu pop-up mitra) */}
          <button 
            type="button"
            onClick={() => setPengepulModalOpen(true)}
            className="bg-[#E2E8D5] hover:bg-[#E2E8D5]/80 p-3.5 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all cursor-pointer border-0 w-full"
            title="Klik untuk info mitra pengepul"
          >
            <div className="bg-white/80 p-2 rounded-full mb-2">
              <Truck className="h-5 w-5 text-[#5E7A3E]" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#202A14]/70">Mitra Pengepul</span>
            <span className="text-base font-black mt-0.5">{statistik.totalPengepul} Mitra</span>
            <span className="text-[8px] text-[#202A14]/50 font-bold mt-1">Info Mitra 🚚</span>
          </button>

        </section>

        {/* INFO PENTING UNTUK WARGA */}
        {usingMock && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-[2rem] text-xs font-semibold space-y-1">
            <h4 className="font-black uppercase flex items-center gap-1.5"><Info className="h-4 w-4" /> KONEKSI DATABASE BELUM AKTIF</h4>
            <p className="text-amber-800/80 leading-relaxed font-bold">
              Harap konfigurasikan file <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950">.env.local</code> Anda agar data warga, timbangan, dan acuan harga dapat dimuat secara dinamis dari database Supabase Anda.
            </p>
          </div>
        )}

        {/* SECTION 2: PAPAN PERINGKAT (LEADERBOARD) */}
        <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-[#E2E8D5]/30 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8D5]/50 pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#5E7A3E]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide">Pahlawan Lingkungan Dusun</h2>
            </div>
          </div>

          {/* Sub-tabs Leaderboard */}
          <div className="flex bg-[#F9F9F6] p-1 rounded-full border border-[#E2E8D5]/40 text-[10px] font-black text-center">
            <button 
              onClick={() => setLeaderboardTab("teraktif")}
              className={`flex-1 py-1.5 rounded-full transition-all ${leaderboardTab === "teraktif" ? "bg-[#5E7A3E] text-white" : "text-[#202A14]/65"}`}
            >
              Teraktif (kg)
            </button>
            <button 
              onClick={() => setLeaderboardTab("saldo")}
              className={`flex-1 py-1.5 rounded-full transition-all ${leaderboardTab === "saldo" ? "bg-[#5E7A3E] text-white" : "text-[#202A14]/65"}`}
            >
              Tabungan (Rp)
            </button>
            <button 
              onClick={() => setLeaderboardTab("petugas")}
              className={`flex-1 py-1.5 rounded-full transition-all ${leaderboardTab === "petugas" ? "bg-[#5E7A3E] text-white" : "text-[#202A14]/65"}`}
            >
              Petugas Terfavorit
            </button>
          </div>

          <div className="space-y-2">
            {/* Teraktif Tab */}
            {leaderboardTab === "teraktif" && leadBeratList.map((nas, idx) => (
              <div key={nas.nasabah_id} className="flex items-center justify-between p-2.5 bg-[#F9F9F6] rounded-2xl border border-[#E2E8D5]/20 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#5E7A3E] w-5 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                  </span>
                  {nas.foto_url ? (
                    <img src={nas.foto_url} alt="" className="h-8 w-8 rounded-full object-cover border-2 border-[#E2E8D5]" />
                  ) : (
                    <div className="h-8 w-8 bg-[#E2E8D5] rounded-full flex items-center justify-center font-black text-[#5E7A3E] text-[10px]">
                      {nas.nama.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-black text-[#202A14]">{nas.nama}</h4>
                    <span className="text-[9px] text-zinc-500 font-bold block">{nas.no_nasabah}</span>
                  </div>
                </div>
                <span className="font-black text-[#5E7A3E] text-sm">{nas.total_berat.toFixed(1)} kg</span>
              </div>
            ))}

            {leaderboardTab === "teraktif" && leadBeratList.length === 0 && (
              <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                Belum ada timbangan sampah yang tercatat untuk menghitung peringkat teraktif.
              </div>
            )}

            {/* Saldo Tab */}
            {leaderboardTab === "saldo" && leadSaldoList.map((nas, idx) => (
              <div key={nas.nasabah_id} className="flex items-center justify-between p-2.5 bg-[#F9F9F6] rounded-2xl border border-[#E2E8D5]/20 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#5E7A3E] w-5 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                  </span>
                  {nas.foto_url ? (
                    <img src={nas.foto_url} alt="" className="h-8 w-8 rounded-full object-cover border-2 border-[#E2E8D5]" />
                  ) : (
                    <div className="h-8 w-8 bg-[#E2E8D5] rounded-full flex items-center justify-center font-black text-[#5E7A3E] text-[10px]">
                      {nas.nama.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-black text-[#202A14]">{nas.nama}</h4>
                    <span className="text-[9px] text-zinc-500 font-bold block">{nas.no_nasabah}</span>
                  </div>
                </div>
                <span className="font-black text-green-700 text-sm">{formatRupiah(nas.saldo)}</span>
              </div>
            ))}

            {leaderboardTab === "saldo" && leadSaldoList.length === 0 && (
              <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                Belum ada data warga terdaftar untuk memuat peringkat saldo tabungan.
              </div>
            )}

            {/* Petugas Tab */}
            {leaderboardTab === "petugas" && leadRatingList.map((pet, idx) => (
              <div key={pet.petugas_id} className="flex items-center justify-between p-2.5 bg-[#F9F9F6] rounded-2xl border border-[#E2E8D5]/20 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#5E7A3E] w-5 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                  </span>
                  {pet.foto_url ? (
                    <img src={pet.foto_url} alt="" className="h-8 w-8 rounded-full object-cover border-2 border-[#E2E8D5]" />
                  ) : (
                    <div className="h-8 w-8 bg-[#E2E8D5] rounded-full flex items-center justify-center font-black text-[#5E7A3E] text-[10px]">
                      {pet.nama.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-black text-[#202A14]">{pet.nama}</h4>
                    <span className="text-[8px] text-[#5E7A3E] font-extrabold uppercase bg-[#E2E8D5] px-2 py-0.5 rounded-full mt-0.5 inline-block tracking-wider">
                      {pet.role}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-[#5E7A3E] text-sm flex items-center justify-end gap-0.5">
                    {pet.total_vote} Vote
                  </span>
                </div>
              </div>
            ))}

            {leaderboardTab === "petugas" && leadRatingList.length === 0 && (
              <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                Belum ada pengurus yang mendapatkan vote dari warga.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: DAFTAR HARGA SAMPAH DIKATEGORIKAN BERDASARKAN PENGEPUL */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8D5]/50 pb-2">
            <TrendingUp className="h-5 w-5 text-[#5E7A3E]" />
            <h2 className="text-base font-extrabold uppercase tracking-wide">Daftar Beli Sampah Per Mitra</h2>
          </div>

          {groupedHarga.map((group) => (
            <div key={group.pengepul_id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-[#E2E8D5]/30 space-y-3">
              <div className="flex items-center justify-between border-b border-dashed border-[#E2E8D5] pb-2">
                <h3 className="text-sm font-black text-[#5E7A3E] flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-[#5E7A3E]" />
                  {group.pengepul_nama}
                </h3>
                {group.jadwal_ambil && (
                  <span className="text-[9px] bg-[#E2E8D5] text-[#202A14] px-2 py-0.5 rounded-full font-bold">
                    Jadwal: {group.jadwal_ambil}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <div 
                    key={item.jenis_sampah_id} 
                    className="flex items-center justify-between p-3 bg-[#F9F9F6] hover:bg-[#E2E8D5]/20 rounded-[1.25rem] border border-[#E2E8D5]/20 transition-all duration-200"
                  >
                    <div>
                      <h4 className="text-xs font-black tracking-tight text-[#202A14]">{item.nama_sampah}</h4>
                      <div className="text-[10px] text-[#202A14]/75 font-semibold mt-0.5">
                        Harga Pengepul: {formatRupiah(item.harga_jual)} | Potongan: {formatRupiah(item.potongan_kas)} | Min: {item.minimal_berat} {item.satuan}
                      </div>
                    </div>
                    
                    {/* Harga Beli Nasabah */}
                    <div className="flex flex-col items-end">
                      <div className="bg-[#5E7A3E] text-white px-3 py-1.5 rounded-full font-black text-[11px] min-w-[70px] text-center shadow-sm">
                        {formatRupiah(item.harga_beli)}
                      </div>
                      <span className="text-[8px] font-black text-[#202A14]/60 mr-1 mt-0.5">per {item.satuan}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groupedHarga.length === 0 && (
            <div className="bg-white p-8 rounded-[2rem] text-center text-zinc-400 text-xs italic border border-[#E2E8D5]/30">
              Belum ada acuan harga aktif per mitra yang diatur.
              <p className="text-[10px] font-bold text-[#202A14]/50 mt-1 pl-4 pr-4">
                *Silakan atur harga beli mitra pengepul di menu Pengaturan (setelah masuk login) agar daftar harga tampil di sini.
              </p>
            </div>
          )}
        </section>

        {/* PETUNJUK PENAMBAHAN KATEGORI BARU */}
        <div className="bg-[#E2E8D5]/30 p-4 rounded-[2rem] flex items-start gap-2.5">
          <Info className="h-4.5 w-4.5 text-[#5E7A3E] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#202A14]/85 leading-relaxed font-semibold">
            <p className="font-black text-[#202A14]">💡 Informasi Pengurus Dusun:</p>
            <p className="mt-1 font-bold text-[#202A14]/70">
              Jika Anda menambah kategori sampah baru di Pengaturan, pastikan Anda juga mengisi acuan harga di <strong>Tab Harga Nasabah</strong> dan <strong>Tab Harga Mitra</strong> agar kategori tersebut dapat langsung muncul di halaman depan ini dan siap ditimbang.
            </p>
          </div>
        </div>

        {/* SECTION 4: TOMBOL LOGIN PENGURUS */}
        <section className="pt-2">
          <Link 
            href="/login" 
            className="w-full bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-base py-4 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all duration-200"
          >
            <LogIn className="h-5 w-5" />
            MASUK SEBAGAI PENGURUS
            <ChevronRight className="h-5 w-5 ml-1" />
          </Link>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-6 px-4 bg-[#E2E8D5] text-[#202A14]/80 text-center text-xs mt-auto rounded-t-[2rem]">
        <div className="flex items-center justify-center gap-1.5 mb-1.5 font-bold">
          <Award className="h-4 w-4 text-[#5E7A3E]" />
          <span>BASAH Rejosari v1.0</span>
        </div>
        <p className="font-medium leading-relaxed">
          Sistem Informasi Bank Sampah Rejosari
        </p>
        <p className="text-[10px] text-[#202A14]/60 mt-1 font-semibold italic">
          Inisiasi dan Pengembangan oleh KKN Unit 57 Angkatan 73
        </p>
      </footer>

      {/* ======================================================== */}
      {/* MODAL POPUP 1: PENCARIAN WARGA PUBLIK */}
      {/* ======================================================== */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[85vh]">
            {/* Header */}
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                🔎 Cari Tabungan Warga
              </h2>
              <button 
                type="button" 
                onClick={() => setSearchModalOpen(false)} 
                className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input Pencarian */}
            <div className="p-4 border-b border-[#E2E8D5]">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-[#5E7A3E]" />
                <input
                  type="text"
                  placeholder="Masukkan nama warga atau Nomor Nasabah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-xs font-semibold outline-none transition-all"
                />
              </div>
            </div>

            {/* Hasil Pencarian */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[45vh]">
              {filteredNasabahSearch.map((nasabah) => (
                <button
                  key={nasabah.id}
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    handleViewNasabahDetail(nasabah);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-[#E2E8D5]/20 rounded-2xl border border-[#E2E8D5]/40 text-left transition-all active:scale-99"
                >
                  <div className="flex items-center gap-3">
                    {nasabah.foto_url ? (
                      <img src={nasabah.foto_url} alt="" className="h-9 w-9 rounded-full object-cover border" />
                    ) : (
                      <div className="h-9 w-9 bg-[#E2E8D5] rounded-full flex items-center justify-center font-black text-[#5E7A3E] text-xs">
                        {nasabah.nama.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black text-[#202A14]">{nasabah.nama}</h4>
                      <p className="text-[9px] text-zinc-500 font-bold mt-0.5">{nasabah.no_nasabah} | {nasabah.rt_rw.split("/")[0]}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4.5 w-4.5 text-[#5E7A3E]" />
                </button>
              ))}

              {filteredNasabahSearch.length === 0 && (
                <div className="text-center py-8 text-zinc-400 italic text-[11px]">
                  Nama warga atau No. Nasabah tidak ditemukan.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-white border-t border-[#E2E8D5] text-center">
              <span className="text-[9px] font-black text-[#202A14]/50 uppercase tracking-wider block">
                *Klik nama warga untuk membuka buku tabungan & riwayat mutasi
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL POPUP 2: DETAIL & RIWAYAT AKTIVITAS WARGA */}
      {/* ======================================================== */}
      {detailModalOpen && selectedNasabah && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                📖 Buku Tabungan Warga
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    setSearchModalOpen(true);
                  }}
                  className="bg-[#202A14]/30 px-3 py-1 rounded-full text-white text-[9px] font-black uppercase hover:bg-[#202A14]/50"
                >
                  KEMBALI CARI
                </button>
                <button 
                  type="button" 
                  onClick={() => setDetailModalOpen(false)} 
                  className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 max-h-[70vh]">
              
              {/* Profil Identitas Warga */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm">
                {selectedNasabah.foto_url ? (
                  <img src={selectedNasabah.foto_url} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-[#E2E8D5] shadow-sm" />
                ) : (
                  <div className="h-16 w-16 bg-[#E2E8D5] rounded-full flex items-center justify-center font-black text-[#5E7A3E] text-sm">
                    {selectedNasabah.nama.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-[#202A14]">{selectedNasabah.nama}</h3>
                  <p className="text-[10px] text-zinc-500 font-extrabold mt-0.5">ID: {selectedNasabah.no_nasabah}</p>
                  <span className="text-[9px] text-[#5E7A3E] font-black uppercase bg-[#E2E8D5]/45 px-2 py-0.5 rounded-full mt-1.5 inline-block tracking-wider">
                    {selectedNasabah.rt_rw}
                  </span>
                </div>
              </div>

              {/* Grid Ringkasan Saldo & Sampah */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E2E8D5]/40 p-3.5 rounded-[1.5rem] border border-[#E2E8D5]/20 text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#202A14]/60">Total Sampah</span>
                  <span className="text-base font-black text-[#5E7A3E] block mt-0.5">
                    {loadingDetail ? "Memuat..." : `${selectedNasabahTotalWeight.toFixed(1)} kg`}
                  </span>
                </div>
                <div className="bg-[#E2E8D5]/40 p-3.5 rounded-[1.5rem] border border-[#E2E8D5]/20 text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#202A14]/60">Saldo Aktif</span>
                  <span className="text-base font-black text-green-700 block mt-0.5">
                    {formatRupiah(selectedNasabah.saldo)}
                  </span>
                </div>
              </div>

              {/* List Mutasi Riwayat Saldo */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wide text-[#202A14]/85 border-b border-[#E2E8D5] pb-1.5 pl-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#5E7A3E]" />
                  Aktivitas Tabungan Terakhir
                </h4>

                <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                  {loadingDetail ? (
                    <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                      Memuat riwayat transaksi...
                    </div>
                  ) : selectedNasabahHistory.map((item) => {
                    const isSetor = item.tipe === "setoran";
                    return (
                      <div 
                        key={item.id}
                        className="bg-white p-3 rounded-2xl border border-[#E2E8D5]/35 flex items-center justify-between text-xs font-semibold"
                      >
                        <div>
                          <h5 className="font-black text-[#202A14] text-[11px]">{item.keterangan}</h5>
                          <span className="text-[8px] text-zinc-500 font-extrabold mt-0.5 block">{formatDate(item.tanggal)}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-xs ${isSetor ? "text-green-700" : "text-[#A25B43]"}`}>
                            {isSetor ? `+${formatRupiah(item.nominal)}` : `-${formatRupiah(item.nominal)}`}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-semibold block mt-0.5">Sisa: {formatRupiah(item.saldo_akhir)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {!loadingDetail && selectedNasabahHistory.length === 0 && (
                    <div className="text-center py-8 text-zinc-400 italic text-[10px]">
                      Belum ada riwayat setoran atau penarikan saldo.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button" 
                onClick={() => setDetailModalOpen(false)} 
                className="w-full bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full hover:bg-[#5E7A3E]/90 transition-all active:scale-95"
              >
                TUTUP BUKU TABUNGAN
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL POPUP CARD 2: SAMPAH TERKUMPUL (10 TIMBANGAN TERAKHIR) */}
      {/* ======================================================== */}
      {sampahModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[80vh]">
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                📦 10 Timbangan Sampah Terakhir
              </h2>
              <button 
                type="button" 
                onClick={() => setSampahModalOpen(false)} 
                className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="bg-white p-4 rounded-[1.5rem] border border-[#E2E8D5]/40 text-center shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/50 block">Total Berat Terkumpul</span>
                <span className="text-2xl font-black text-[#5E7A3E] block mt-1">{statistik.totalSampah.toFixed(1)} kg</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-[#202A14]/75 border-b border-[#E2E8D5] pb-1.5 pl-1">Aktivitas Terbaru</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {lastTenSetoran.map((setor) => (
                    <div key={setor.id} className="bg-white p-3 rounded-2xl border border-[#E2E8D5]/35 flex items-center justify-between text-xs font-semibold">
                      <div>
                        <h4 className="font-black text-[#202A14]">{setor.nasabah?.nama || "Warga"}</h4>
                        <span className="text-[8px] text-zinc-500 font-extrabold mt-0.5 block">Kategori: {setor.jenis_sampah?.nama_sampah || "Sampah"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#5E7A3E] text-xs block">{setor.berat} kg</span>
                        <span className="text-[8px] text-zinc-400 font-bold block mt-0.5">{formatDate(setor.tanggal)}</span>
                      </div>
                    </div>
                  ))}

                  {lastTenSetoran.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                      Belum ada data aktivitas penimbangan sampah.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5]">
              <button 
                type="button" 
                onClick={() => setSampahModalOpen(false)} 
                className="w-full bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full hover:bg-[#5E7A3E]/90 transition-all"
              >
                TUTUP DETAIL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL POPUP CARD 3: TABUNGAN WARGA (10 MUTASI TERAKHIR) */}
      {/* ======================================================== */}
      {tabunganModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[80vh]">
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                💰 10 Transaksi Terakhir Warga
              </h2>
              <button 
                type="button" 
                onClick={() => setTabunganModalOpen(false)} 
                className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="bg-white p-4 rounded-[1.5rem] border border-[#E2E8D5]/40 text-center shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/50 block">Total Uang Warga</span>
                <span className="text-2xl font-black text-green-700 block mt-1">{formatRupiah(statistik.totalTabungan)}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-[#202A14]/75 border-b border-[#E2E8D5] pb-1.5 pl-1">Mutasi Transaksi</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {lastTenTransactions.map((item) => {
                    const isSetor = item.tipe === "setoran";
                    return (
                      <div key={item.id} className="bg-white p-3 rounded-2xl border border-[#E2E8D5]/35 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <h4 className="font-black text-[#202A14]">{item.nasabah?.nama || "Warga"}</h4>
                          <span className="text-[8px] text-zinc-500 font-extrabold mt-0.5 block">{item.keterangan}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-xs block ${isSetor ? "text-green-700" : "text-[#A25B43]"}`}>
                            {isSetor ? `+${formatRupiah(item.nominal)}` : `-${formatRupiah(item.nominal)}`}
                          </span>
                          <span className="text-[8px] text-zinc-400 font-bold block mt-0.5">{formatDate(item.tanggal)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {lastTenTransactions.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                      Belum ada mutasi keuangan tabungan yang tercatat.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5]">
              <button 
                type="button" 
                onClick={() => setTabunganModalOpen(false)} 
                className="w-full bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full hover:bg-[#5E7A3E]/90 transition-all"
              >
                TUTUP MUTASI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL POPUP CARD 4: MITRA PENGEPUL (DAFTAR MITRA) */}
      {/* ======================================================== */}
      {pengepulModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[80vh]">
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                🚚 Daftar Mitra Pengepul Aktif
              </h2>
              <button 
                type="button" 
                onClick={() => setPengepulModalOpen(false)} 
                className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="bg-white p-4 rounded-[1.5rem] border border-[#E2E8D5]/40 text-center shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/50 block">Jumlah Kemitraan</span>
                <span className="text-2xl font-black text-[#5E7A3E] block mt-1">{statistik.totalPengepul} Mitra Aktif</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-[#202A14]/75 border-b border-[#E2E8D5] pb-1.5 pl-1">Informasi Kemitraan</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
                  {pengepulFullList.map((mitra) => (
                    <div key={mitra.id} className="bg-white p-4 rounded-2xl border border-[#E2E8D5]/35 space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center border-b border-[#E2E8D5]/20 pb-1.5">
                        <h4 className="font-black text-[#5E7A3E] text-[13px]">{mitra.nama}</h4>
                        {mitra.jadwal_ambil && (
                          <span className="text-[8px] bg-[#E2E8D5] text-[#202A14] px-2 py-0.5 rounded-full font-bold">
                            Jadwal: {mitra.jadwal_ambil}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-[#202A14]/80">
                        <p className="flex justify-between">
                          <span className="font-bold text-[#202A14]/50">Kontak:</span> 
                          <span>{mitra.kontak || "-"}</span>
                        </p>
                        <p className="flex justify-between items-start gap-3">
                          <span className="font-bold text-[#202A14]/50 shrink-0">Alamat:</span> 
                          <span className="text-right leading-tight">{mitra.alamat || "-"}</span>
                        </p>
                      </div>
                    </div>
                  ))}

                  {pengepulFullList.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 italic text-[10px]">
                      Belum ada data mitra pengepul terdaftar.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5]">
              <button 
                type="button" 
                onClick={() => setPengepulModalOpen(false)} 
                className="w-full bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full hover:bg-[#5E7A3E]/90 transition-all"
              >
                TUTUP DETAIL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
