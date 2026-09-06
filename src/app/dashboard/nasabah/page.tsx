"use client";

import { useEffect, useState } from "react";
import { supabase, deleteStorageFile } from "@/lib/supabase";
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Phone, 
  MapPin, 
  DollarSign, 
  Upload, 
  TrendingDown, 
  ArrowDownLeft, 
  ArrowUpRight,
  AlertCircle,
  BookOpen
} from "lucide-react";
import BukuTabunganModal from "@/components/BukuTabunganModal";

interface Nasabah {
  id: string;
  no_nasabah: string;
  nama: string;
  rt_rw: string;
  no_hp: string;
  saldo: number;
  foto_url?: string;
}

interface RiwayatSaldo {
  id: string;
  tipe: "setoran" | "pencairan";
  nominal: number;
  saldo_akhir: number;
  keterangan: string;
  tanggal: string;
}

// Data Mock Kosong
const MOCK_NASABAH: Nasabah[] = [];
const MOCK_RIWAYAT: Record<string, RiwayatSaldo[]> = {};

export default function NasabahPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>(MOCK_NASABAH);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatSaldo[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingNasabah, setEditingNasabah] = useState<Nasabah | null>(null);

  // State Buku Tabungan Fisik
  const [bukuTabunganOpen, setBukuTabunganOpen] = useState(false);
  const [bukuTabunganNasabah, setBukuTabunganNasabah] = useState<Nasabah | null>(null);
  const [bukuTabunganRiwayat, setBukuTabunganRiwayat] = useState<RiwayatSaldo[]>([]);
  const [bukuTabunganTotalBerat, setBukuTabunganTotalBerat] = useState(0);

  // Form Fields
  const [nama, setNama] = useState("");
  const [rtRw, setRtRw] = useState("RT 04/RW 18");
  const [noHp, setNoHp] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    loadNasabah();
  }, []);

  const loadNasabah = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nasabah")
        .select("*")
        .order("no_nasabah", { ascending: true });

      if (error) {
        setUsingMock(true);
        setNasabahList(MOCK_NASABAH);
        return;
      }

      if (data && data.length > 0) {
        setNasabahList(data);
        setUsingMock(false);
      } else {
        setNasabahList([]);
        setUsingMock(false);
      }
    } catch (err) {
      setUsingMock(true);
      setNasabahList(MOCK_NASABAH);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (nasabah: Nasabah) => {
    setSelectedNasabah(nasabah);
    setDetailModalOpen(true);

    if (usingMock) {
      setRiwayat(MOCK_RIWAYAT[nasabah.id] || []);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("riwayat_saldo")
        .select("*")
        .eq("nasabah_id", nasabah.id)
        .order("tanggal", { ascending: false });

      if (!error && data) {
        setRiwayat(data as any);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBukuTabungan = async (nasabah: Nasabah) => {
    setBukuTabunganNasabah(nasabah);
    setBukuTabunganOpen(true);

    if (usingMock) {
      setBukuTabunganRiwayat(MOCK_RIWAYAT[nasabah.id] || [
        { id: "h1", tipe: "setoran", nominal: 25000, saldo_akhir: nasabah.saldo, keterangan: "Setoran Sampah Dusun", rincian_sampah: "Kardus Bekas (12.5 kg)", tanggal: new Date().toISOString() }
      ]);
      setBukuTabunganTotalBerat(16.5);
      return;
    }

    try {
      // 1. Fetch setoran details with jenis_sampah dari database Supabase
      const { data: setoranDetails } = await supabase
        .from("setoran")
        .select("tanggal, berat, total_nilai, jenis_sampah(nama_sampah)")
        .eq("nasabah_id", nasabah.id);

      const setoranMapByDate: Record<string, string[]> = {};
      let totBerat = 0;
      setoranDetails?.forEach((s: any) => {
        totBerat += Number(s.berat);
        const dateKey = s.tanggal ? new Date(s.tanggal).toISOString().split("T")[0] : "";
        const itemStr = `${s.jenis_sampah?.nama_sampah || "Sampah"} (${s.berat} kg)`;
        if (!setoranMapByDate[dateKey]) setoranMapByDate[dateKey] = [];
        setoranMapByDate[dateKey].push(itemStr);
      });
      setBukuTabunganTotalBerat(totBerat);

      // 2. Fetch riwayat saldo
      const { data: historyData } = await supabase
        .from("riwayat_saldo")
        .select("*")
        .eq("nasabah_id", nasabah.id)
        .order("tanggal", { ascending: true });

      if (historyData) {
        const enriched = historyData.map((h: any) => {
          const dateKey = h.tanggal ? new Date(h.tanggal).toISOString().split("T")[0] : "";
          const rincian = h.tipe === "setoran" && setoranMapByDate[dateKey]
            ? setoranMapByDate[dateKey].join(", ")
            : undefined;
          return {
            ...h,
            rincian_sampah: rincian
          };
        });
        setBukuTabunganRiwayat(enriched);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingNasabah(null);
    setNama("");
    setRtRw("RT 04/RW 18");
    setNoHp("");
    setFotoUrl("");
    setFotoFile(null);
    setFotoPreview(null);
    setErrorMsg(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (nasabah: Nasabah) => {
    setEditingNasabah(nasabah);
    setNama(nasabah.nama);
    setRtRw(nasabah.rt_rw);
    setNoHp(nasabah.no_hp);
    setFotoUrl(nasabah.foto_url || "");
    setFotoFile(null);
    setFotoPreview(nasabah.foto_url || null);
    setErrorMsg(null);
    setFormModalOpen(true);
  };

  const generateNoNasabah = () => {
    if (nasabahList.length === 0) return "RJS001";
    
    // Cari no nasabah terbesar
    const numbers = nasabahList
      .map(n => {
        const match = n.no_nasabah.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
    const maxNum = Math.max(...numbers);
    const nextNum = maxNum + 1;
    return `RJS${String(nextNum).padStart(3, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isEditing = !!editingNasabah;
    const currentNoNasabah = isEditing ? editingNasabah.no_nasabah : generateNoNasabah();

    setSaving(true); // Opsional: jika ingin melacak status upload
    let finalFotoUrl = fotoUrl;

    if (usingMock) {
      if (fotoFile) {
        finalFotoUrl = URL.createObjectURL(fotoFile);
      }
      if (isEditing) {
        setNasabahList(prev => prev.map(n => n.id === editingNasabah.id ? {
          ...n,
          nama,
          rt_rw: rtRw,
          no_hp: noHp,
          foto_url: finalFotoUrl
        } : n));
      } else {
        const newNas: Nasabah = {
          id: String(Date.now()),
          no_nasabah: currentNoNasabah,
          nama,
          rt_rw: rtRw,
          no_hp: noHp,
          saldo: 0,
          foto_url: finalFotoUrl || "https://i.pravatar.cc/150?img=1"
        };
        setNasabahList(prev => [...prev, newNas]);
      }
      setFormModalOpen(false);
      return;
    }

    try {
      // Upload foto profil jika ada berkas yang dipilih
      if (fotoFile) {
        // Hapus foto lama jika ada
        if (isEditing && editingNasabah?.foto_url) {
          await deleteStorageFile(editingNasabah.foto_url);
        }

        const fileExt = fotoFile.name.split(".").pop();
        const fileName = `profiles/nasabah_${currentNoNasabah}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("timbangan-photos")
          .upload(fileName, fotoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("timbangan-photos")
          .getPublicUrl(fileName);
        
        finalFotoUrl = publicUrlData?.publicUrl || "";
      }

      if (isEditing) {
        const { error } = await supabase
          .from("nasabah")
          .update({
            nama,
            rt_rw: rtRw,
            no_hp: noHp,
            foto_url: finalFotoUrl
          })
          .eq("id", editingNasabah.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nasabah")
          .insert({
            no_nasabah: currentNoNasabah,
            nama,
            rt_rw: rtRw,
            no_hp: noHp,
            saldo: 0.00,
            foto_url: finalFotoUrl || null
          });

        if (error) throw error;
      }
      
      loadNasabah();
      setFormModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data nasabah.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data nasabah ini?")) return;

    if (usingMock) {
      setNasabahList(prev => prev.filter(n => n.id !== id));
      return;
    }

    try {
      const target = nasabahList.find(n => n.id === id);
      if (target?.foto_url) {
        await deleteStorageFile(target.foto_url);
      }

      const { error } = await supabase
        .from("nasabah")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadNasabah();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data.");
    }
  };

  // Filter Search
  const filteredNasabah = nasabahList.filter(n => 
    n.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.no_nasabah.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.rt_rw.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
            <Users className="h-6 w-6 text-[#5E7A3E]" />
            Data Warga (Nasabah)
          </h1>
          <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
            Kelola pendataan warga dusun perwakilan rumah untuk pencatatan bank sampah
          </p>
        </div>
        
        {/* Tambah Warga (Hanya Sekretaris, Bendahara, Admin) */}
        {profile && ["admin", "sekretaris", "bendahara"].includes(profile.role) && (
          <button
            onClick={handleOpenAdd}
            className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-3 px-5 rounded-full flex items-center gap-2 shadow-md active:scale-95 transition-all duration-150 self-start sm:self-center"
          >
            <UserPlus className="h-4.5 w-4.5" />
            TAMBAH WARGA
          </button>
        )}
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5E7A3E]">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Cari nama warga, nomor nasabah, atau RT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E2E8D5] rounded-full text-sm font-semibold outline-none shadow-sm focus:border-[#5E7A3E] focus:ring-1 focus:ring-[#5E7A3E] transition-all"
        />
      </div>

      {/* LIST KARTU NASABAH (Terinspirasi uireference.jpg Layar 5/6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNasabah.map((nasabah) => (
          <div 
            key={nasabah.id}
            className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#5E7A3E]/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {/* Avatar Bulat Muka Nasabah */}
                {nasabah.foto_url ? (
                  <img 
                    src={nasabah.foto_url} 
                    alt={nasabah.nama} 
                    className="h-14 w-14 rounded-full border-2 border-[#E2E8D5] shadow-sm object-cover"
                  />
                ) : (
                  <div className="bg-[#E2E8D5] text-[#5E7A3E] h-14 w-14 rounded-full flex items-center justify-center font-black text-xl">
                    {nasabah.nama.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#E2E8D5] text-[#202A14] px-2 py-0.5 rounded-full">
                      {nasabah.no_nasabah}
                    </span>
                    <span className="text-[10px] font-bold text-[#202A14]/60 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#5E7A3E]" />
                      {nasabah.rt_rw}
                    </span>
                  </div>
                  <h3 className="text-base font-black tracking-tight text-[#202A14] mt-1">{nasabah.nama}</h3>
                  {nasabah.no_hp && (
                    <p className="text-xs text-[#202A14]/70 font-semibold mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#5E7A3E]" />
                      {nasabah.no_hp}
                    </p>
                  )}
                </div>
              </div>

              {/* Teks Saldo Terbesar */}
              <div className="text-right flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#202A14]/50">Tabungan</span>
                <span className="text-base font-black text-[#5E7A3E] mt-0.5">{formatRupiah(nasabah.saldo)}</span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8D5]/30">
              <button
                onClick={() => handleOpenDetail(nasabah)}
                className="flex-1 bg-[#E2E8D5]/50 hover:bg-[#E2E8D5] text-[#202A14] font-extrabold text-[11px] py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all"
              >
                <Eye className="h-4 w-4 text-[#5E7A3E]" />
                DETAIL & RIWAYAT
              </button>

              <button
                onClick={() => handleOpenBukuTabungan(nasabah)}
                className="bg-[#5E7A3E]/10 hover:bg-[#5E7A3E]/20 text-[#5E7A3E] font-extrabold text-[11px] py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all"
                title="Lihat / Cetak Buku Tabungan Fisik Warga"
              >
                <BookOpen className="h-4 w-4 text-[#5E7A3E]" />
                TABUNGAN FISIK
              </button>

              {profile && ["admin", "sekretaris", "bendahara"].includes(profile.role) && (
                <>
                  <button
                    onClick={() => handleOpenEdit(nasabah)}
                    className="bg-zinc-100 hover:bg-zinc-200 text-[#202A14] font-extrabold text-[11px] p-2 rounded-full transition-all"
                    title="Ubah Data"
                  >
                    <Edit2 className="h-4 w-4 text-[#5E7A3E]" />
                  </button>
                  <button
                    onClick={() => handleDelete(nasabah.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-[11px] p-2 rounded-full transition-all"
                    title="Hapus Warga"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </>
              )}
            </div>

          </div>
        ))}

        {filteredNasabah.length === 0 && !loading && (
          <div className="col-span-full bg-white p-12 rounded-[2rem] text-center border border-[#E2E8D5]/40 text-[#202A14]/50">
            <Users className="h-12 w-12 text-[#E2E8D5] mx-auto mb-3" />
            <p className="font-extrabold uppercase text-xs tracking-wider">Warga tidak ditemukan</p>
            <p className="text-xs mt-1">Gunakan kata kunci pencarian lain atau tambahkan warga baru.</p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. MODAL DETAIL NASABAH (Terinspirasi uireference.jpg Layar 7) */}
      {/* ======================================================== */}
      {detailModalOpen && selectedNasabah && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F9F9F6] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-[#E2E8D5]">
            
            {/* Header Profil (Layar 7 Sage Green Card) */}
            <div className="bg-[#E2E8D5] p-6 relative flex items-center gap-4">
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="absolute top-4 right-4 bg-white/55 hover:bg-white p-2 rounded-full text-[#202A14]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Avatar Wajah Bulat Besar di Detail Card */}
              {selectedNasabah.foto_url ? (
                <img 
                  src={selectedNasabah.foto_url} 
                  alt={selectedNasabah.nama} 
                  className="h-16 w-16 rounded-full border-2 border-white shadow-md object-cover"
                />
              ) : (
                <div className="bg-[#5E7A3E] text-white h-16 w-16 rounded-full flex items-center justify-center font-black text-2xl shadow-md">
                  {selectedNasabah.nama.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#5E7A3E] text-white px-2 py-0.5 rounded-full">
                  ID: {selectedNasabah.no_nasabah}
                </span>
                <h2 className="text-lg font-black text-[#202A14] mt-1">{selectedNasabah.nama}</h2>
                <p className="text-xs font-semibold text-[#202A14]/75 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[#5E7A3E]" /> {selectedNasabah.rt_rw}
                </p>
              </div>
            </div>

            {/* Saldo Aktif Besar */}
            <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#E2E8D5]/35">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#202A14]/70">Tabungan Aktif Warga</span>
              <span className="text-xl font-black text-[#5E7A3E]">{formatRupiah(selectedNasabah.saldo)}</span>
            </div>

            {/* Riwayat Mutasi Vertikal (Layar 6 List) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#202A14]/65 border-b border-[#E2E8D5] pb-2">
                Riwayat Tabungan (Audit Trail)
              </h3>
              
              {riwayat.map((log) => (
                <div 
                  key={log.id}
                  className="bg-white p-3 rounded-[1.25rem] border border-[#E2E8D5]/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      log.tipe === "setoran" 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-[#A25B43] border border-red-200"
                    }`}>
                      {log.tipe === "setoran" ? <ArrowDownLeft className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#202A14]">{log.keterangan}</h4>
                      <span className="text-[10px] text-[#202A14]/60 font-semibold block mt-0.5">
                        {formatDate(log.tanggal)} | Saldo: {formatRupiah(log.saldo_akhir)}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-black ${
                    log.tipe === "setoran" ? "text-green-700" : "text-[#A25B43]"
                  }`}>
                    {log.tipe === "setoran" ? "+" : "-"}{formatRupiah(log.nominal)}
                  </span>
                </div>
              ))}

              {riwayat.length === 0 && (
                <div className="text-center py-8 text-[#202A14]/50 text-xs">
                  <TrendingDown className="h-8 w-8 text-[#E2E8D5] mx-auto mb-2" />
                  Belum ada riwayat setoran atau pencairan tabungan.
                </div>
              )}
            </div>

            {/* Aksi Bawah */}
            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-2">
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/30 text-[#202A14] font-extrabold text-xs py-3 rounded-full"
              >
                TUTUP
              </button>
              <button 
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenBukuTabungan(selectedNasabah);
                }}
                className="flex-1 bg-[#5E7A3E] hover:bg-[#5E7A3E]/95 text-white font-extrabold text-xs py-3 rounded-full flex items-center justify-center gap-1.5 shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                TABUNGAN FISIK
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL TAMBAH/EDIT NASABAH */}
      {/* ======================================================== */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            
            {/* Modal Header */}
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                {editingNasabah ? "Ubah Data Warga" : "Tambah Warga Baru"}
              </h2>
              <button 
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="bg-[#202A14]/30 hover:bg-[#202A14]/40 p-1.5 rounded-full text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              
              {errorMsg && (
                <div className="bg-red-50 text-red-800 p-3 rounded-[1.25rem] text-xs font-semibold flex items-start gap-2 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Nama */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Nama Lengkap Perwakilan KK
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Bapak Budi Santoso"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
                />
              </div>

              {/* Input RT/RW */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  RT / RW
                </label>
                <select
                  value={rtRw}
                  onChange={(e) => setRtRw(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all"
                >
                  <option value="RT 04/RW 18">RT 04 / RW 18 (Dusun Rejosari)</option>
                  <option value="RT 05/RW 18">RT 05 / RW 18 (Dusun Rejosari)</option>
                </select>
              </div>

              {/* Input No HP */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Nomor HP (WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="contoh: 081234567890"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
                />
              </div>

              {/* Input Foto Wajah Nasabah */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
                  Foto Profil Wajah Warga
                </label>
                
                <div className="flex items-center gap-4 pl-3">
                  {fotoPreview ? (
                    <img 
                      src={fotoPreview} 
                      alt="Preview profil" 
                      className="h-14 w-14 rounded-full object-cover border-2 border-[#E2E8D5] shadow-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 bg-[#E2E8D5] rounded-full flex items-center justify-center text-[10px] font-bold text-[#202A14]/50 text-center">
                      Belum Ada
                    </div>
                  )}
                  
                  <div className="relative bg-[#E2E8D5]/40 hover:bg-[#E2E8D5]/60 border-2 border-dashed border-[#E2E8D5] rounded-full py-2 px-4 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-xs font-black text-[#5E7A3E]">PILIH / AMBIL FOTO</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024) {
                            alert("Ukuran foto profil warga maksimal 1MB.");
                            e.target.value = "";
                            return;
                          }
                          setFotoFile(file);
                          setFotoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#202A14]/50 pl-3 font-semibold mt-1">
                  *Pilih foto dari galeri atau ambil foto langsung (Maksimal 1MB).
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button 
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 rounded-full transition-all"
              >
                BATAL
              </button>
              <button 
                type="submit"
                className="flex-1 bg-[#5E7A3E] hover:bg-[#5E7A3E]/95 text-white font-extrabold text-xs py-3 rounded-full shadow-sm"
              >
                {editingNasabah ? "SIMPAN PERUBAHAN" : "TAMBAH WARGA"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL CETAK BUKU TABUNGAN FISIK */}
      <BukuTabunganModal
        isOpen={bukuTabunganOpen}
        onClose={() => setBukuTabunganOpen(false)}
        nasabah={bukuTabunganNasabah}
        riwayat={bukuTabunganRiwayat}
        totalBerat={bukuTabunganTotalBerat}
      />

    </div>
  );
}
