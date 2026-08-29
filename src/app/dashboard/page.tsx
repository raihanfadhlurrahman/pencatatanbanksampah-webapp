"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Trash2, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Truck, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Settings,
  AlertCircle,
  X,
  Star,
  Award,
  Search,
  ChevronRight as ArrowRight,
  BookOpen
} from "lucide-react";
import Link from "next/link";

interface StatistikDashboard {
  nasabahCount: number;
  totalSampah: number;
  totalTabungan: number;
  pengepulCount: number;
}

interface TransaksiTerbaru {
  id: string;
  nasabah_nama: string;
  tipe: "setoran" | "pencairan";
  keterangan: string;
  nominal: number;
  tanggal: string;
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

// Data Demo Kosong
const MOCK_STATISTIK: StatistikDashboard = {
  nasabahCount: 0,
  totalSampah: 0,
  totalTabungan: 0,
  pengepulCount: 0,
};

const MOCK_TRANSAKSI: TransaksiTerbaru[] = [];

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<StatistikDashboard>(MOCK_STATISTIK);
  const [transaksiList, setTransaksiList] = useState<TransaksiTerbaru[]>(MOCK_TRANSAKSI);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // Leaderboard States in Dashboard
  const [leadBeratList, setLeadBeratList] = useState<LeadBerat[]>([]);
  const [leadSaldoList, setLeadSaldoList] = useState<LeadSaldo[]>([]);
  const [leadRatingList, setLeadRatingList] = useState<LeadRating[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<"teraktif" | "saldo" | "petugas">("teraktif");

  // Vote Modal States (Only for Ketua role)
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [nasabahSearchList, setNasabahSearchList] = useState<any[]>([]);
  const [officersSearchList, setOfficersSearchList] = useState<any[]>([]);
  const [selectedNasabahId, setSelectedNasabahId] = useState("");
  const [selectedPetugasId, setSelectedPetugasId] = useState("");
  const [voteUlasan, setVoteUlasan] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);

  // Card Popup Modals States in Dashboard
  const [searchModalOpen, setSearchModalOpen] = useState(false); // Modal KK
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false); // Modal Detail Warga
  const [selectedNasabah, setSelectedNasabah] = useState<any | null>(null);
  const [selectedNasabahHistory, setSelectedNasabahHistory] = useState<any[]>([]);
  const [selectedNasabahTotalWeight, setSelectedNasabahTotalWeight] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [sampahModalOpen, setSampahModalOpen] = useState(false); // Modal Sampah
  const [lastTenSetoran, setLastTenSetoran] = useState<any[]>([]);

  const [tabunganModalOpen, setTabunganModalOpen] = useState(false); // Modal Tabungan
  const [lastTenTransactions, setLastTenTransactions] = useState<any[]>([]);

  const [pengepulModalOpen, setPengepulModalOpen] = useState(false); // Modal Mitra
  const [pengepulFullList, setPengepulFullList] = useState<any[]>([]);

  useEffect(() => {
    // Ambil data profil dari local storage
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Fetch Nasabah Count
        const { count: nasabahCount, error: nasCountError } = await supabase
          .from("nasabah")
          .select("*", { count: "exact", head: true });

        // Fetch Total Sampah
        const { data: setoranData, error: setError } = await supabase
          .from("setoran")
          .select("berat");

        // Fetch Nasabah Saldo for Total Tabungan Warga
        const { data: nasData, error: nasError } = await supabase
          .from("nasabah")
          .select("saldo");

        // Fetch all nasabah for voting dropdown
        const { data: nasList } = await supabase
          .from("nasabah")
          .select("id, nama, no_nasabah, rt_rw, saldo, foto_url")
          .order("nama", { ascending: true });
        if (nasList) {
          setNasabahSearchList(nasList);
        }

        // Fetch all active officers
        const { data: offList } = await supabase
          .from("users")
          .select("id, nama, role")
          .eq("status", "aktif")
          .order("nama", { ascending: true });
        if (offList) setOfficersSearchList(offList);

        // Fetch Pengepul Count
        const { data: pengepulData, error: pengError } = await supabase
          .from("pengepul")
          .select("id, nama, kontak, alamat, jadwal_ambil")
          .order("nama", { ascending: true });

        // Fetch Riwayat Saldo
        const { data: riwayatData, error: riwayatError } = await supabase
          .from("riwayat_saldo")
          .select(`
            id,
            tipe,
            nominal,
            tanggal,
            nasabah (
              nama,
              rt_rw
            )
          `)
          .order("tanggal", { ascending: false })
          .limit(10);

        // Fetch Leaderboards
        const { data: leadBerat } = await supabase
          .from("view_leaderboard_berat")
          .select("*");

        const { data: leadSaldo } = await supabase
          .from("view_leaderboard_saldo")
          .select("*");

        const { data: leadRating } = await supabase
          .from("view_leaderboard_rating")
          .select("*");

        // Fetch 10 Last Penimbangan (for Sampah Card Modal)
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

        // Jika salah satu error, kita gunakan mock data
        if (nasCountError || setError || nasError || pengError || riwayatError) {
          console.log("Supabase error / tabel belum ada. Menggunakan data demo dashboard.");
          setUsingMock(true);
          setNasabahSearchList([
            { id: "n1", nama: "Bapak Anto Rejosari", no_nasabah: "RJS001" },
            { id: "n2", nama: "Ibu Sri Lestari", no_nasabah: "RJS002" },
          ]);
          setOfficersSearchList([
            { id: "u1", nama: "Pak Admin Demo", role: "admin" },
            { id: "u2", nama: "Ibu Indah Rejosari", role: "sekretaris" },
          ]);
          setLoading(false);
          return;
        }

        // Kalkulasi stats
        const finalNasabahCount = nasabahCount || 0;
        const finalTotalSampah = setoranData?.reduce((acc, curr) => acc + Number(curr.berat), 0) || 0;
        const finalPengepulCount = pengepulData?.length || 0;
        const finalTotalTabungan = nasData?.reduce((acc, curr) => acc + Number(curr.saldo || 0), 0) || 0;

        setStats({
          nasabahCount: finalNasabahCount,
          totalSampah: finalTotalSampah,
          totalTabungan: finalTotalTabungan,
          pengepulCount: finalPengepulCount,
        });

        // Format riwayat
        if (riwayatData && riwayatData.length > 0) {
          const formattedRiwayat: TransaksiTerbaru[] = riwayatData.map((r: any) => ({
            id: r.id,
            nasabah_nama: `${r.nasabah?.nama || "Warga"} (${r.nasabah?.rt_rw?.split("/")[0] || ""})`,
            tipe: r.tipe === "setoran" ? "setoran" : "pencairan",
            keterangan: r.tipe === "setoran" ? "Penyetoran Sampah Daur Ulang" : "Pencairan Saldo Tabungan",
            nominal: Number(r.nominal),
            tanggal: r.tanggal,
          }));
          setTransaksiList(formattedRiwayat.slice(0, 5)); // Hanya tampilkan 5 di list beranda
          setLastTenTransactions(riwayatData); // Simpan 10 untuk modal
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

        if (pengepulData) {
          setPengepulFullList(pengepulData);
        }

        if (lastSetoran) {
          setLastTenSetoran(lastSetoran);
        }

        setUsingMock(false);
      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNasabahId || !selectedPetugasId) {
      alert("Harap pilih warga yang menilai dan petugas yang dinilai.");
      return;
    }

    if (usingMock) {
      alert("Vote berhasil disimulasikan! (Mode Simulasi)");
      setVoteModalOpen(false);
      setSelectedNasabahId("");
      setSelectedPetugasId("");
      setVoteUlasan("");
      return;
    }

    try {
      setSubmittingVote(true);
      const { error } = await supabase
        .from("vote_petugas")
        .insert({
          nasabah_id: selectedNasabahId,
          petugas_id: selectedPetugasId,
          ulasan: voteUlasan || null
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Warga tersebut sudah pernah memberikan vote! Setiap warga hanya boleh memilih 1 petugas.");
        }
        throw error;
      }

      alert("Vote petugas terbaik berhasil disimpan!");
      setVoteModalOpen(false);
      setSelectedNasabahId("");
      setSelectedPetugasId("");
      setVoteUlasan("");
      
      // Reload leaderboard rating
      const { data: leadRating } = await supabase
        .from("view_leaderboard_rating")
        .select("*");
      if (leadRating) {
        setLeadRatingList(leadRating.map((l: any) => ({
          petugas_id: l.petugas_id,
          nama: l.nama,
          role: l.role,
          foto_url: l.foto_url || undefined,
          total_vote: Number(l.total_vote || 0)
        })));
      }
    } catch (err: any) {
      alert(err.message || "Gagal mengirimkan vote.");
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleViewNasabahDetail = async (nasabah: any) => {
    setSelectedNasabah(nasabah);
    setDetailModalOpen(true);
    setLoadingDetail(true);

    if (usingMock) {
      setSelectedNasabahTotalWeight(44.0);
      setSelectedNasabahHistory([
        { id: "h1", tipe: "setoran", nominal: 15000, saldo_akhir: 125000, keterangan: "Setor 5kg Botol Plastik PET", tanggal: new Date().toISOString() },
      ]);
      setLoadingDetail(false);
      return;
    }

    try {
      const { data: setoranData } = await supabase
        .from("setoran")
        .select("berat")
        .eq("nasabah_id", nasabah.id);
      
      const totalBerat = setoranData?.reduce((acc, curr) => acc + Number(curr.berat), 0) || 0;
      setSelectedNasabahTotalWeight(totalBerat);

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

  const filteredNasabahSearch = nasabahSearchList.filter(n => 
    n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.no_nasabah.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(angka);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const formatSimpleDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5E7A3E]"></div>
      </div>
    );
  }

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

      {/* HEADER RINGKASAN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-[#202A14] tracking-tight">Ringkasan Sistem</h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Kelola operasional dan pantau sirkulasi keuangan bank sampah dusun
          </p>
        </div>
        
        {/* TANGGAL HARI INI */}
        <div className="bg-[#E2E8D5] text-[#202A14] py-2.5 px-4 rounded-[1.25rem] inline-flex items-center gap-2 text-xs font-black self-start">
          <Calendar className="h-4 w-4 text-[#5E7A3E]" />
          <span>Sabtu, 29 Agustus 2026</span>
        </div>
      </div>

      {/* METRIK KARTU UTAMA (PILL CARD GRID - CLICKABLE FOR POPUP) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Warga/KK Card */}
        <button 
          onClick={() => { setSearchModalOpen(true); setSearchQuery(""); }}
          className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between min-h-[120px] text-left hover:bg-[#E2E8D5]/10 active:scale-95 transition-all duration-150 cursor-pointer w-full border-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/65">Total Warga</span>
            <div className="bg-[#E2E8D5] p-2 rounded-full text-[#5E7A3E]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black block text-[#202A14]">{stats.nasabahCount} KK</span>
            <span className="text-[10px] text-[#202A14]/50 font-bold">Warga Terdaftar 🔍</span>
          </div>
        </button>

        {/* Sampah Terkumpul Card */}
        <button 
          onClick={() => setSampahModalOpen(true)}
          className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between min-h-[120px] text-left hover:bg-[#E2E8D5]/10 active:scale-95 transition-all duration-150 cursor-pointer w-full border-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/65">Sampah Terkumpul</span>
            <div className="bg-[#E2E8D5] p-2 rounded-full text-[#5E7A3E]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black block text-[#202A14]">{stats.totalSampah.toFixed(1)} kg</span>
            <span className="text-[10px] text-[#202A14]/50 font-bold">Kumulatif Timbangan 📦</span>
          </div>
        </button>

        {/* Total Tabungan Warga Card */}
        <button 
          onClick={() => setTabunganModalOpen(true)}
          className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between min-h-[120px] text-left hover:bg-[#E2E8D5]/10 active:scale-95 transition-all duration-150 cursor-pointer w-full border-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/65">Tabungan Warga</span>
            <div className="bg-[#E2E8D5] p-2 rounded-full text-[#5E7A3E]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black block text-[#202A14]">{formatRupiah(stats.totalTabungan)}</span>
            <span className="text-[10px] text-[#202A14]/50 font-bold">Total Tabungan Warga 💰</span>
          </div>
        </button>

        {/* Pengepul Aktif Card */}
        <button 
          onClick={() => setPengepulModalOpen(true)}
          className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between min-h-[120px] text-left hover:bg-[#E2E8D5]/10 active:scale-95 transition-all duration-150 cursor-pointer w-full border-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#202A14]/65">Mitra Pengepul</span>
            <div className="bg-[#E2E8D5] p-2 rounded-full text-[#5E7A3E]">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black block text-[#202A14]">{stats.pengepulCount} Mitra</span>
            <span className="text-[10px] text-[#202A14]/50 font-bold">Kemitraan Aktif 🚚</span>
          </div>
        </button>

      </div>

      {/* AKSI CEPAT DAN AKTIVITAS TERBARU (Layout Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM 1 & 2: Riwayat Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-[#E2E8D5]/40 pb-2.5">
            <TrendingUp className="h-5 w-5 text-[#5E7A3E]" />
            <h2 className="text-base font-extrabold uppercase tracking-wide">Aktivitas Transaksi Terbaru</h2>
          </div>

          <div className="space-y-3.5">
            {transaksiList.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3.5 bg-[#F9F9F6] rounded-[1.25rem] border border-[#E2E8D5]/20"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-full ${
                    item.tipe === "setoran" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-[#A25B43] border border-red-200"
                  }`}>
                    {item.tipe === "setoran" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight">{item.nasabah_nama}</h3>
                    <div className="text-[10px] text-[#202A14]/70 font-semibold mt-0.5">
                      {item.keterangan} | {formatDate(item.tanggal)}
                    </div>
                  </div>
                </div>

                <span className={`text-sm font-black ${
                  item.tipe === "setoran" ? "text-green-700" : "text-[#A25B43]"
                }`}>
                  {item.tipe === "setoran" ? "+" : "-"}{formatRupiah(item.nominal)}
                </span>
              </div>
            ))}

            {transaksiList.length === 0 && (
              <div className="text-center py-8 text-zinc-400 italic text-xs">
                Belum ada riwayat transaksi masuk/keluar yang tercatat.
              </div>
            )}
          </div>
        </div>

        {/* KOLOM 3: AKSI CEPAT PENGURUS */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-[#E2E8D5]/40 pb-2.5">
              <Settings className="h-5 w-5 text-[#5E7A3E]" />
              <h2 className="text-base font-extrabold uppercase tracking-wide">Aksi Cepat</h2>
            </div>
            
            <p className="text-xs font-semibold text-[#202A14]/60 leading-relaxed mb-4">
              Pilih menu di bawah ini atau gunakan navigasi untuk memulai transaksi operasional di lapangan.
            </p>
          </div>

          <div className="space-y-3">
            {/* Tombol Setor Sampah */}
            {profile && ["admin", "petugas", "ketua"].includes(profile.role) && (
              <Link 
                href="/dashboard/setor" 
                className="w-full bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-3.5 px-5 rounded-full flex items-center justify-between shadow-sm active:scale-95 transition-all duration-150"
              >
                <span className="flex items-center gap-2">
                  <ArrowDownLeft className="h-4.5 w-4.5" />
                  TIMBANG & SETOR SAMPAH
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            {/* Tombol Cairkan Tabungan */}
            {profile && ["admin", "bendahara"].includes(profile.role) && (
              <Link 
                href="/dashboard/pencairan" 
                className="w-full bg-[#E2E8D5] hover:bg-[#E2E8D5]/90 text-[#202A14] font-extrabold text-xs py-3.5 px-5 rounded-full flex items-center justify-between shadow-sm active:scale-95 transition-all duration-150"
              >
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="h-4.5 w-4.5 text-[#5E7A3E]" />
                  CAIRKAN SALDO TABUNGAN
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            {/* Tombol Tambah Nasabah */}
            {profile && ["admin", "sekretaris", "bendahara"].includes(profile.role) && (
              <Link 
                href="/dashboard/nasabah" 
                className="w-full border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3.5 px-5 rounded-full flex items-center justify-between shadow-sm active:scale-95 transition-all duration-150"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-[#5E7A3E]" />
                  MANAJEMEN DATA WARGA
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            {/* Tombol Vote Petugas Terbaik (Hanya Ketua) */}
            {profile && profile.role === "ketua" && (
              <button 
                type="button"
                onClick={() => setVoteModalOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3.5 px-5 rounded-full flex items-center justify-between shadow-sm active:scale-95 transition-all duration-150 border-0 cursor-pointer text-left"
              >
                <span className="flex items-center gap-2">
                  <Star className="h-4.5 w-4.5 fill-white text-white" />
                  INPUT VOTE PETUGAS TERBAIK
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Tombol Panduan Role & SOP */}
            <Link 
              href="/dashboard/panduan" 
              className="w-full bg-[#E2E8D5]/60 hover:bg-[#E2E8D5] text-[#202A14] font-extrabold text-xs py-3.5 px-5 rounded-full flex items-center justify-between shadow-sm active:scale-95 transition-all duration-150 border border-[#E2E8D5]"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-[#5E7A3E]" />
                PANDUAN ROLE & SOP OPERASIONAL
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="text-[10px] text-center font-bold text-[#202A14]/50 mt-4 italic">
            BASAH Rejosari - Dusun Rejosari
          </div>
        </div>

      </div>

      {/* SECTION PAPAN PERINGKAT (LEADERBOARD) DI DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Leaderboard */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8D5]/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#5E7A3E]" />
              <h2 className="text-base font-extrabold uppercase tracking-wide">Pahlawan Lingkungan Dusun (Papan Peringkat)</h2>
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
        </div>

        {/* Column 3: Tips Dusun */}
        <div className="bg-[#5E7A3E] text-white p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[250px]">
          <div>
            <h3 className="text-base font-black uppercase tracking-wide border-b border-white/20 pb-2 mb-3">
              💡 Tips Operasional
            </h3>
            <ul className="text-xs font-semibold space-y-3 leading-relaxed opacity-95 pl-3 list-disc">
              <li>Pastikan timbangan telah dikalibrasi ke angka nol sebelum mencatat setoran warga.</li>
              <li>Ingatkan Ketua untuk secara berkala menginput vote Petugas Terbaik berdasarkan umpan balik warga.</li>
              <li>Perbarui acuan harga secara berkala jika ada penyesuaian harga dari mitra pengepul.</li>
            </ul>
          </div>
          <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-4">
            Pengurus Unit 57 Rejosari
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL POPUP FORM VOTE PETUGAS (HANYA KETUA) */}
      {/* ======================================================== */}
      {voteModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleVoteSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            {/* Modal Header */}
            <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-1.5">
                🏆 Input Vote Petugas Terbaik
              </h2>
              <button 
                type="button" 
                onClick={() => setVoteModalOpen(false)} 
                className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Info Keterangan */}
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-[1.5rem] text-[11px] leading-relaxed font-semibold">
                Sebagai Ketua, Anda dapat memasukkan pilihan vote dari warga. Setiap warga terdaftar dibatasi hanya dapat memilih <strong>1 pengurus</strong> sebagai terfavorit.
              </div>

              {/* Pilih Warga yang Menilai */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Warga yang Memberi Suara (Nasabah)
                </label>
                <select
                  required
                  value={selectedNasabahId}
                  onChange={(e) => setSelectedNasabahId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="">-- Pilih Nama Warga --</option>
                  {nasabahSearchList.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.nama} ({n.no_nasabah})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Nama Petugas Terbaik */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Petugas Pilihan Terbaik
                </label>
                <select
                  required
                  value={selectedPetugasId}
                  onChange={(e) => setSelectedPetugasId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="">-- Pilih Nama Pengurus --</option>
                  {officersSearchList.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nama} ({o.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teks Ulasan */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Ulasan / Catatan Singkat (Opsional)
                </label>
                <textarea
                  placeholder="Masukkan ulasan warga terkait keramahan atau kecepatan pelayanan petugas (jika ada)..."
                  value={voteUlasan}
                  onChange={(e) => setVoteUlasan(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-[1.5rem] text-xs font-semibold outline-none resize-none"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button" 
                disabled={submittingVote}
                onClick={() => setVoteModalOpen(false)} 
                className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 rounded-full transition-all"
              >
                BATAL
              </button>
              <button 
                type="submit" 
                disabled={submittingVote}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-400 text-white font-extrabold text-xs py-3 rounded-full shadow-sm transition-all"
              >
                {submittingVote ? "MENYIMPAN..." : "KIRIM VOTE"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL POPUP CARD 1: PENCARIAN & DETAIL WARGA DI DASHBOARD */}
      {/* ======================================================== */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[85vh]">
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                🔎 Daftar & Cari Warga
              </h2>
              <button 
                type="button" 
                onClick={() => setSearchModalOpen(false)} 
                className="bg-[#202A14]/30 p-1.5 rounded-full text-white hover:bg-[#202A14]/50 border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
                      <p className="text-[9px] text-zinc-500 font-bold mt-0.5">{nasabah.no_nasabah} | {nasabah.rt_rw?.split("/")[0] || ""}</p>
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

            <div className="p-4 bg-white border-t border-[#E2E8D5] text-center">
              <span className="text-[9px] font-black text-[#202A14]/50 uppercase tracking-wider block">
                *Klik nama warga untuk membuka detail mutasi tabungan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL BUKU TABUNGAN WARGA DI DASHBOARD */}
      {detailModalOpen && selectedNasabah && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5] max-h-[85vh]">
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                📖 Buku Tabungan Warga (Admin View)
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

            <div className="p-5 space-y-4 overflow-y-auto flex-1 max-h-[70vh]">
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

              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wide text-[#202A14]/85 border-b border-[#E2E8D5] pb-1.5 pl-1">
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
                          <span className="text-[8px] text-zinc-500 font-extrabold mt-0.5 block">{formatSimpleDate(item.tanggal)}</span>
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

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button" 
                onClick={() => setDetailModalOpen(false)} 
                className="w-full bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full hover:bg-[#5E7A3E]/90 transition-all"
              >
                TUTUP DETAIL
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
                <span className="text-2xl font-black text-[#5E7A3E] block mt-1">{stats.totalSampah.toFixed(1)} kg</span>
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
                        <span className="text-[8px] text-zinc-400 font-bold block mt-0.5">{formatSimpleDate(setor.tanggal)}</span>
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
                <span className="text-2xl font-black text-green-700 block mt-1">{formatRupiah(stats.totalTabungan)}</span>
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
                          <span className="text-[8px] text-zinc-400 font-bold block mt-0.5">{formatSimpleDate(item.tanggal)}</span>
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
                <span className="text-2xl font-black text-[#5E7A3E] block mt-1">{stats.pengepulCount} Mitra Aktif</span>
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
