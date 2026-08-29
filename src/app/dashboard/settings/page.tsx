"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Settings, 
  Trash2, 
  Plus, 
  Edit2, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  User, 
  Lock, 
  X,
  RefreshCw,
  Users,
  Truck,
  Trash
} from "lucide-react";

interface JenisSampah {
  id: string;
  nama_sampah: string;
  satuan: string;
}

interface HargaNasabah {
  id: string;
  jenis_sampah_id: string;
  nama_sampah: string;
  harga_jual: number;
  potongan_kas: number;
  harga_beli: number;
}

interface Pengepul {
  id: string;
  nama: string;
}

interface HargaPengepul {
  id: string;
  pengepul_id: string;
  jenis_sampah_id: string;
  nama_sampah?: string;
  harga_jual: number;
  minimal_berat: number;
}

interface Officer {
  id: string;
  email: string;
  nama: string;
  role: "admin" | "ketua" | "sekretaris" | "bendahara" | "petugas";
  status: "aktif" | "nonaktif";
  foto_url?: string;
}

// Data Mock Kosong
const MOCK_SAMPAH: JenisSampah[] = [];
const MOCK_HARGA_NASABAH: HargaNasabah[] = [];
const MOCK_PENGEPUL: Pengepul[] = [];
const MOCK_HARGA_PENGEPUL: HargaPengepul[] = [];
const MOCK_OFFICERS: Officer[] = [];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"sampah" | "harga_nasabah" | "harga_mitra" | "pengurus">("sampah");
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Data States
  const [jenisSampahList, setJenisSampahList] = useState<JenisSampah[]>(MOCK_SAMPAH);
  const [hargaNasabahList, setHargaNasabahList] = useState<HargaNasabah[]>(MOCK_HARGA_NASABAH);
  const [pengepulList, setPengepulList] = useState<Pengepul[]>(MOCK_PENGEPUL);
  const [hargaPengepulList, setHargaPengepulList] = useState<HargaPengepul[]>(MOCK_HARGA_PENGEPUL);
  const [officers, setOfficers] = useState<Officer[]>(MOCK_OFFICERS);

  // Active Pengepul selection for Tab 3 (Mitra)
  const [selectedMitraId, setSelectedMitraId] = useState("");

  // Modals state
  const [sampahModalOpen, setSampahModalOpen] = useState(false);
  const [hargaNasabahModalOpen, setHargaNasabahModalOpen] = useState(false);
  const [hargaMitraModalOpen, setHargaMitraModalOpen] = useState(false);
  const [officerModalOpen, setOfficerModalOpen] = useState(false);

  // Edit references
  const [editingSampah, setEditingSampah] = useState<JenisSampah | null>(null);
  const [editingHargaNasabah, setEditingHargaNasabah] = useState<HargaNasabah | null>(null);
  const [editingHargaMitra, setEditingHargaMitra] = useState<HargaPengepul | null>(null);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);

  // Form Fields - Jenis Sampah
  const [namaSampah, setNamaSampah] = useState("");
  const [satuan, setSatuan] = useState("kg");

  // Form Fields - Harga Nasabah
  const [selectedJenisId, setSelectedJenisId] = useState("");
  const [hargaJualNasabah, setHargaJualNasabah] = useState<number>(0);
  const [potonganKas, setPotonganKas] = useState<number>(0);

  // Form Fields - Harga Mitra
  const [selectedJenisMitraId, setSelectedJenisMitraId] = useState("");
  const [hargaJualMitra, setHargaJualMitra] = useState<number>(0);
  const [minimalBerat, setMinimalBerat] = useState<number>(0);

  // Form Fields - Officer
  const [email, setEmail] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<"admin" | "ketua" | "sekretaris" | "bendahara" | "petugas">("petugas");
  const [status, setStatus] = useState<"aktif" | "nonaktif">("aktif");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch Jenis Sampah
      const { data: typesData, error: typesError } = await supabase
        .from("jenis_sampah")
        .select("*")
        .order("nama_sampah", { ascending: true });

      // Fetch Harga Nasabah
      const { data: nasabahPrices } = await supabase
        .from("harga_nasabah")
        .select(`
          id,
          jenis_sampah_id,
          harga_jual,
          potongan_kas,
          harga_beli,
          jenis_sampah (
            nama_sampah
          )
        `);

      // Fetch Pengepul
      const { data: pData } = await supabase
        .from("pengepul")
        .select("id, nama")
        .order("nama", { ascending: true });

      // Fetch Harga Pengepul
      const { data: pPrices } = await supabase
        .from("harga_pengepul")
        .select(`
          id,
          pengepul_id,
          jenis_sampah_id,
          harga_jual,
          minimal_berat,
          jenis_sampah (
            nama_sampah
          )
        `);

      // Fetch Officers
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .order("nama", { ascending: true });

      if (typesError) {
        setUsingMock(true);
        setJenisSampahList(MOCK_SAMPAH);
        setHargaNasabahList(MOCK_HARGA_NASABAH);
        setPengepulList(MOCK_PENGEPUL);
        setHargaPengepulList(MOCK_HARGA_PENGEPUL);
        setOfficers(MOCK_OFFICERS);
        setSelectedMitraId("p1");
        return;
      }

      if (typesData) setJenisSampahList(typesData);
      
      if (nasabahPrices) {
        const formatted: HargaNasabah[] = nasabahPrices.map((h: any) => ({
          id: h.id,
          jenis_sampah_id: h.jenis_sampah_id,
          nama_sampah: h.jenis_sampah?.nama_sampah || "Sampah",
          harga_jual: Number(h.harga_jual),
          potongan_kas: Number(h.potongan_kas),
          harga_beli: Number(h.harga_beli),
        }));
        setHargaNasabahList(formatted);
      }

      if (pData) {
        setPengepulList(pData);
        if (pData.length > 0 && !selectedMitraId) {
          setSelectedMitraId(pData[0].id);
        }
      }

      if (pPrices) {
        const formatted: HargaPengepul[] = pPrices.map((hp: any) => ({
          id: hp.id,
          pengepul_id: hp.pengepul_id,
          jenis_sampah_id: hp.jenis_sampah_id,
          nama_sampah: hp.jenis_sampah?.nama_sampah || "Sampah",
          harga_jual: Number(hp.harga_jual),
          minimal_berat: Number(hp.minimal_berat || 0),
        }));
        setHargaPengepulList(formatted);
      }

      if (usersData) {
        setOfficers(usersData as any);
      }

      setUsingMock(false);
    } catch (err) {
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // TAB 1: KATEGORI SAMPAH (jenis_sampah CRUD)
  // ==========================================
  const handleOpenAddSampah = () => {
    setEditingSampah(null);
    setNamaSampah("");
    setSatuan("kg");
    setErrorMsg(null);
    setSampahModalOpen(true);
  };

  const handleOpenEditSampah = (s: JenisSampah) => {
    setEditingSampah(s);
    setNamaSampah(s.nama_sampah);
    setSatuan(s.satuan);
    setErrorMsg(null);
    setSampahModalOpen(true);
  };

  const handleSampahSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const isEditing = !!editingSampah;

    if (usingMock) {
      if (isEditing) {
        setJenisSampahList(prev => prev.map(s => s.id === editingSampah.id ? { ...s, nama_sampah: namaSampah, satuan } : s));
      } else {
        const newS: JenisSampah = { id: String(Date.now()), nama_sampah: namaSampah, satuan };
        setJenisSampahList(prev => [...prev, newS]);
      }
      setSampahModalOpen(false);
      setSuccessMsg("Kategori sampah berhasil disimpan!");
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("jenis_sampah")
          .update({ nama_sampah: namaSampah, satuan })
          .eq("id", editingSampah.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("jenis_sampah")
          .insert({ nama_sampah: namaSampah, satuan });
        if (error) throw error;
      }
      loadSettings();
      setSampahModalOpen(false);
      setSuccessMsg("Kategori sampah berhasil disimpan!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan kategori.");
    }
  };

  const handleSampahDelete = async (id: string) => {
    if (!confirm("Menghapus kategori sampah ini juga akan menghapus acuan harga yang terhubung. Lanjutkan?")) return;

    if (usingMock) {
      setJenisSampahList(prev => prev.filter(s => s.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from("jenis_sampah").delete().eq("id", id);
      if (error) throw error;
      loadSettings();
      setSuccessMsg("Kategori sampah berhasil dihapus.");
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data.");
    }
  };

  // ==========================================
  // TAB 2: ACUAN HARGA NASABAH CRUD
  // ==========================================
  const handleOpenAddHargaNasabah = () => {
    setEditingHargaNasabah(null);
    setSelectedJenisId("");
    setHargaJualNasabah(0);
    setPotonganKas(0);
    setErrorMsg(null);
    setHargaNasabahModalOpen(true);
  };

  const handleOpenEditHargaNasabah = (h: HargaNasabah) => {
    setEditingHargaNasabah(h);
    setSelectedJenisId(h.jenis_sampah_id);
    setHargaJualNasabah(h.harga_jual);
    setPotonganKas(h.potongan_kas);
    setErrorMsg(null);
    setHargaNasabahModalOpen(true);
  };

  const handleHargaNasabahSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const isEditing = !!editingHargaNasabah;
    const activeType = jenisSampahList.find(t => t.id === selectedJenisId);
    const calculatedBeli = Math.max(0, hargaJualNasabah - potonganKas);

    if (usingMock) {
      if (isEditing) {
        setHargaNasabahList(prev => prev.map(h => h.id === editingHargaNasabah.id ? {
          ...h, harga_jual: hargaJualNasabah, potongan_kas: potonganKas, harga_beli: calculatedBeli
        } : h));
      } else {
        const newH: HargaNasabah = {
          id: String(Date.now()),
          jenis_sampah_id: selectedJenisId,
          nama_sampah: activeType?.nama_sampah || "Sampah",
          harga_jual: hargaJualNasabah,
          potongan_kas: potonganKas,
          harga_beli: calculatedBeli
        };
        setHargaNasabahList(prev => [...prev, newH]);
      }
      setHargaNasabahModalOpen(false);
      setSuccessMsg("Harga acuan nasabah berhasil disimpan!");
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("harga_nasabah")
          .update({ harga_jual: hargaJualNasabah, potongan_kas: potonganKas })
          .eq("id", editingHargaNasabah.id);
        if (error) throw error;
      } else {
        const exists = hargaNasabahList.some(h => h.jenis_sampah_id === selectedJenisId);
        if (exists) throw new Error("Acuan harga untuk kategori ini sudah diatur.");

        const { error } = await supabase
          .from("harga_nasabah")
          .insert({ jenis_sampah_id: selectedJenisId, harga_jual: hargaJualNasabah, potongan_kas: potonganKas });
        if (error) throw error;
      }
      loadSettings();
      setHargaNasabahModalOpen(false);
      setSuccessMsg("Harga acuan nasabah berhasil disimpan!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan harga.");
    }
  };

  const handleHargaNasabahDelete = async (id: string) => {
    if (!confirm("Hapus acuan harga nasabah ini?")) return;
    if (usingMock) {
      setHargaNasabahList(prev => prev.filter(h => h.id !== id));
      return;
    }
    try {
      const { error } = await supabase.from("harga_nasabah").delete().eq("id", id);
      if (error) throw error;
      loadSettings();
      setSuccessMsg("Harga acuan nasabah berhasil dihapus.");
    } catch (err: any) {
      alert(err.message || "Gagal menghapus.");
    }
  };

  // ==========================================
  // TAB 3: ACUAN HARGA MITRA PENGEPUL CRUD
  // ==========================================
  const handleOpenAddHargaMitra = () => {
    setEditingHargaMitra(null);
    setSelectedJenisMitraId("");
    setHargaJualMitra(0);
    setMinimalBerat(0);
    setErrorMsg(null);
    setHargaMitraModalOpen(true);
  };

  const handleOpenEditHargaMitra = (hp: HargaPengepul) => {
    setEditingHargaMitra(hp);
    setSelectedJenisMitraId(hp.jenis_sampah_id);
    setHargaJualMitra(hp.harga_jual);
    setMinimalBerat(hp.minimal_berat);
    setErrorMsg(null);
    setHargaMitraModalOpen(true);
  };

  const handleHargaMitraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const isEditing = !!editingHargaMitra;
    const activeType = jenisSampahList.find(t => t.id === selectedJenisMitraId);

    if (usingMock) {
      if (isEditing) {
        setHargaPengepulList(prev => prev.map(hp => hp.id === editingHargaMitra.id ? {
          ...hp, harga_jual: hargaJualMitra, minimal_berat: minimalBerat
        } : hp));
      } else {
        const newHp: HargaPengepul = {
          id: String(Date.now()),
          pengepul_id: selectedMitraId,
          jenis_sampah_id: selectedJenisMitraId,
          nama_sampah: activeType?.nama_sampah || "Sampah",
          harga_jual: hargaJualMitra,
          minimal_berat: minimalBerat
        };
        setHargaPengepulList(prev => [...prev, newHp]);
      }
      setHargaMitraModalOpen(false);
      setSuccessMsg("Harga pengepul berhasil disimpan!");
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("harga_pengepul")
          .update({ harga_jual: hargaJualMitra, minimal_berat: minimalBerat })
          .eq("id", editingHargaMitra.id);
        if (error) throw error;
      } else {
        const exists = hargaPengepulList.some(hp => hp.pengepul_id === selectedMitraId && hp.jenis_sampah_id === selectedJenisMitraId);
        if (exists) throw new Error("Harga kategori sampah ini sudah diatur untuk mitra terpilih.");

        const { error } = await supabase
          .from("harga_pengepul")
          .insert({
            pengepul_id: selectedMitraId,
            jenis_sampah_id: selectedJenisMitraId,
            harga_jual: hargaJualMitra,
            minimal_berat: minimalBerat
          });
        if (error) throw error;
      }
      loadSettings();
      setHargaMitraModalOpen(false);
      setSuccessMsg("Harga mitra berhasil disimpan!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan harga mitra.");
    }
  };

  const handleHargaMitraDelete = async (id: string) => {
    if (!confirm("Hapus acuan harga untuk mitra ini?")) return;
    if (usingMock) {
      setHargaPengepulList(prev => prev.filter(hp => hp.id !== id));
      return;
    }
    try {
      const { error } = await supabase.from("harga_pengepul").delete().eq("id", id);
      if (error) throw error;
      loadSettings();
      setSuccessMsg("Harga acuan mitra berhasil dihapus.");
    } catch (err: any) {
      alert(err.message || "Gagal menghapus.");
    }
  };

  // ==========================================
  // TAB 4: OFFICERS CRUD LOGIC
  // ==========================================
  const handleOpenAddOfficer = () => {
    setEditingOfficer(null);
    setEmail("");
    setNama("");
    setRole("petugas");
    setStatus("aktif");
    setPassword("");
    setFotoUrl("");
    setFotoFile(null);
    setFotoPreview(null);
    setErrorMsg(null);
    setOfficerModalOpen(true);
  };

  const handleOpenEditOfficer = (o: Officer) => {
    setEditingOfficer(o);
    setEmail(o.email);
    setNama(o.nama);
    setRole(o.role);
    setStatus(o.status);
    setFotoUrl(o.foto_url || "");
    setFotoFile(null);
    setFotoPreview(o.foto_url || null);
    setPassword("");
    setErrorMsg(null);
    setOfficerModalOpen(true);
  };

  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const isEditing = !!editingOfficer;
    let finalFotoUrl = fotoUrl;

    if (usingMock) {
      if (fotoFile) {
        finalFotoUrl = URL.createObjectURL(fotoFile);
      }
      if (isEditing) {
        setOfficers(prev => prev.map(o => o.id === editingOfficer.id ? {
          ...o, nama, role, status, foto_url: finalFotoUrl
        } : o));
      } else {
        const newO: Officer = {
          id: String(Date.now()),
          email, nama, role, status, foto_url: finalFotoUrl || "https://i.pravatar.cc/150?img=1"
        };
        setOfficers(prev => [...prev, newO]);
      }
      setOfficerModalOpen(false);
      setSuccessMsg("Data pengurus berhasil diperbarui!");
      return;
    }

    try {
      if (fotoFile) {
        const fileExt = fotoFile.name.split(".").pop();
        const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `profiles/officer_${cleanEmail}_${Date.now()}.${fileExt}`;
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
        const { error: profileError } = await supabase
          .from("users")
          .update({ nama, role, status, foto_url: finalFotoUrl })
          .eq("id", editingOfficer.id);
        if (profileError) throw profileError;
      } else {
        if (!password || password.length < 6) {
          throw new Error("Password akun pengurus baru minimal 6 karakter.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        const authUser = authData?.user;
        if (!authUser) throw new Error("Gagal mendaftarkan user auth.");

        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            email,
            nama,
            role,
            status,
            foto_url: finalFotoUrl || null
          });
        if (profileError) throw profileError;
      }

      loadSettings();
      setOfficerModalOpen(false);
      setSuccessMsg("Data pengurus berhasil disimpan!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan pengurus.");
    }
  };

  const handleOfficerDelete = async (officer: Officer) => {
    let currentEmail = "";
    if (typeof window !== "undefined") {
      const userProfileStr = localStorage.getItem("user_profile");
      if (userProfileStr) {
        try {
          const parsed = JSON.parse(userProfileStr);
          currentEmail = parsed.email || "";
        } catch (e) {}
      }
    }

    const isSelf = currentEmail && officer.email.toLowerCase() === currentEmail.toLowerCase();
    
    if (isSelf) {
      if (!confirm(`Peringatan: Anda akan menghapus akun Anda sendiri (${officer.nama}). Apakah Anda yakin?`)) {
        return;
      }
    } else {
      if (!confirm(`Apakah Anda yakin ingin menghapus akun ${officer.role.toUpperCase()} "${officer.nama}" (${officer.email})?`)) {
        return;
      }
    }

    if (usingMock) {
      setOfficers(prev => prev.filter(o => o.id !== officer.id));
      setSuccessMsg(`Akun pengurus ${officer.nama} berhasil dihapus.`);
      return;
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", officer.id);
      if (error) throw error;

      loadSettings();
      setSuccessMsg(`Akun ${officer.role} ${officer.nama} berhasil dihapus.`);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus akun pengurus.");
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(angka);
  };

  // Filter prices by selected Mitra (Tab 3)
  const filteredHargaPengepul = hargaPengepulList.filter(hp => hp.pengepul_id === selectedMitraId);

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
          <Settings className="h-6 w-6 text-[#5E7A3E]" />
          Pengaturan Sistem & Pengurus
        </h1>
        <p className="text-xs font-bold text-[#202A14]/70 mt-0.5">
          Kelola kategori sampah, acuan harga nasabah, harga penawaran mitra pengepul, dan daftar akun pengurus
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-[1.5rem] text-xs font-bold flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5 text-green-600" />
          {successMsg}
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-[#E2E8D5] flex-wrap gap-1">
        <button
          onClick={() => setActiveTab("sampah")}
          className={`py-3 px-4 font-black text-xs border-b-4 transition-all ${
            activeTab === "sampah" ? "border-[#5E7A3E] text-[#5E7A3E]" : "border-transparent text-[#202A14]/65 hover:text-[#202A14]"
          }`}
        >
          Kategori Sampah ({jenisSampahList.length})
        </button>
        <button
          onClick={() => setActiveTab("harga_nasabah")}
          className={`py-3 px-4 font-black text-xs border-b-4 transition-all ${
            activeTab === "harga_nasabah" ? "border-[#5E7A3E] text-[#5E7A3E]" : "border-transparent text-[#202A14]/65 hover:text-[#202A14]"
          }`}
        >
          Acuan Harga Nasabah ({hargaNasabahList.length})
        </button>
        <button
          onClick={() => setActiveTab("harga_mitra")}
          className={`py-3 px-4 font-black text-xs border-b-4 transition-all ${
            activeTab === "harga_mitra" ? "border-[#5E7A3E] text-[#5E7A3E]" : "border-transparent text-[#202A14]/65 hover:text-[#202A14]"
          }`}
        >
          Harga Mitra Pengepul ({hargaPengepulList.length})
        </button>
        <button
          onClick={() => setActiveTab("pengurus")}
          className={`py-3 px-4 font-black text-xs border-b-4 transition-all ${
            activeTab === "pengurus" ? "border-[#5E7A3E] text-[#5E7A3E]" : "border-transparent text-[#202A14]/65 hover:text-[#202A14]"
          }`}
        >
          Akun Pengurus ({officers.length})
        </button>
      </div>

      {/* TAB 1: KATEGORI SAMPAH (jenis_sampah) */}
      {activeTab === "sampah" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#202A14]/60">Daftar Jenis Kategori Sampah</h2>
            <button
              onClick={handleOpenAddSampah}
              className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> TAMBAH KATEGORI
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
              <thead>
                <tr className="bg-[#E2E8D5]/30 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                  <th className="py-4 px-6">Nama Kategori Sampah</th>
                  <th className="py-4 px-6">Satuan Timbangan</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8D5]/25">
                {jenisSampahList.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F9F9F6]">
                    <td className="py-3.5 px-6 font-black text-sm text-[#5E7A3E]">{s.nama_sampah}</td>
                    <td className="py-3.5 px-6 uppercase font-bold text-[#202A14]/60">{s.satuan}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditSampah(s)}
                          className="bg-zinc-100 p-2 rounded-full hover:bg-zinc-200"
                          title="Ubah"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#5E7A3E]" />
                        </button>
                        <button
                          onClick={() => handleSampahDelete(s.id)}
                          className="bg-red-50 p-2 rounded-full hover:bg-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACUAN HARGA NASABAH (harga_nasabah) */}
      {activeTab === "harga_nasabah" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#202A14]/60">Daftar Acuan Harga Warga</h2>
            <button
              onClick={handleOpenAddHargaNasabah}
              className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> ATUR HARGA NASABAH
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
              <thead>
                <tr className="bg-[#E2E8D5]/30 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                  <th className="py-4 px-6">Kategori Sampah</th>
                  <th className="py-4 px-6 text-right">Harga Jual (Pengepul)</th>
                  <th className="py-4 px-6 text-right">Potongan Kas</th>
                  <th className="py-4 px-6 text-right">Harga Bersih (Nasabah)</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8D5]/25">
                {hargaNasabahList.map((h) => (
                  <tr key={h.id} className="hover:bg-[#F9F9F6]">
                    <td className="py-3.5 px-6 font-black text-sm text-[#5E7A3E]">{h.nama_sampah}</td>
                    <td className="py-3.5 px-6 text-right font-bold">{formatRupiah(h.harga_jual)}/kg</td>
                    <td className="py-3.5 px-6 text-right text-red-600 font-bold">-{formatRupiah(h.potongan_kas)}/kg</td>
                    <td className="py-3.5 px-6 text-right font-black text-green-700 text-sm">{formatRupiah(h.harga_beli)}/kg</td>
                    <td className="py-3.5 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditHargaNasabah(h)}
                          className="bg-zinc-100 p-2 rounded-full hover:bg-zinc-200"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#5E7A3E]" />
                        </button>
                        <button
                          onClick={() => handleHargaNasabahDelete(h.id)}
                          className="bg-red-50 p-2 rounded-full hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACUAN HARGA MITRA PENGEPUL (harga_pengepul) */}
      {activeTab === "harga_mitra" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            {/* Dropdown pilih Mitra Pengepul */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase text-[#202A14]/70">Pilih Mitra Pengepul:</label>
              <select
                value={selectedMitraId}
                onChange={(e) => setSelectedMitraId(e.target.value)}
                className="px-4 py-2 bg-white border border-[#E2E8D5] rounded-full text-xs font-black outline-none focus:border-[#5E7A3E]"
              >
                {pengepulList.map(p => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddHargaMitra}
              disabled={!selectedMitraId}
              className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-center disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> ATUR HARGA MITRA
            </button>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-[2.5rem] border border-[#E2E8D5]/40 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-semibold text-[#202A14]">
              <thead>
                <tr className="bg-[#E2E8D5]/30 border-b border-[#E2E8D5] text-[10px] font-black uppercase tracking-wider text-[#202A14]/70">
                  <th className="py-4 px-6">Kategori Sampah Diterima</th>
                  <th className="py-4 px-6 text-right">Harga Jual dari Mitra</th>
                  <th className="py-4 px-6 text-right">Syarat Min. Berat Ambil</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8D5]/25">
                {filteredHargaPengepul.map((hp) => (
                  <tr key={hp.id} className="hover:bg-[#F9F9F6]">
                    <td className="py-3.5 px-6 font-black text-sm text-[#5E7A3E]">{hp.nama_sampah}</td>
                    <td className="py-3.5 px-6 text-right font-black text-green-700 text-sm">{formatRupiah(hp.harga_jual)}/kg</td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#202A14]/70">{hp.minimal_berat} kg</td>
                    <td className="py-3.5 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditHargaMitra(hp)}
                          className="bg-zinc-100 p-2 rounded-full hover:bg-zinc-200"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#5E7A3E]" />
                        </button>
                        <button
                          onClick={() => handleHargaMitraDelete(hp.id)}
                          className="bg-red-50 p-2 rounded-full hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredHargaPengepul.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-zinc-400 italic">
                      Pengepul terpilih belum diatur kategori sampah dan harganya.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AKUN PENGURUS */}
      {activeTab === "pengurus" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#202A14]/60">Daftar Pengurus Dusun</h2>
            <button
              onClick={handleOpenAddOfficer}
              className="bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> TAMBAH AKUN PENGURUS
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officers.map((o) => (
              <div 
                key={o.id}
                className="bg-white p-5 rounded-[2rem] border border-[#E2E8D5]/40 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {o.foto_url ? (
                    <img 
                      src={o.foto_url} 
                      alt={o.nama} 
                      className="h-12 w-12 rounded-full object-cover border-2 border-[#E2E8D5]"
                    />
                  ) : (
                    <div className="bg-[#E2E8D5] text-[#5E7A3E] h-12 w-12 rounded-full flex items-center justify-center font-black">
                      {o.nama.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-black text-[#202A14]">{o.nama}</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold">{o.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#5E7A3E] text-white px-2 py-0.5 rounded-full">
                        {o.role}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === "aktif" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                      }`}>
                        {o.status === "aktif" ? "Aktif" : "Non-aktif"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditOfficer(o)}
                    className="bg-zinc-100 hover:bg-zinc-200 p-2.5 rounded-full text-[#5E7A3E] transition-all"
                    title="Ubah Profil / Peran Pengurus"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOfficerDelete(o)}
                    className="bg-red-50 hover:bg-red-100 p-2.5 rounded-full text-red-600 transition-all"
                    title="Hapus Akun Pengurus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. MODAL TAMBAH/EDIT KATEGORI SAMPAH */}
      {/* ======================================================== */}
      {sampahModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSampahSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                {editingSampah ? "Ubah Kategori Sampah" : "Tambah Kategori Sampah"}
              </h2>
              <button type="button" onClick={() => setSampahModalOpen(false)} className="bg-[#202A14]/30 p-1.5 rounded-full text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-800 p-3 rounded-[1.25rem] text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <AlertCircle className="h-4.5 w-4.5 text-red-600" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Nama Kategori Sampah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Plastik Bening HD / Botol Kaca"
                  value={namaSampah}
                  onChange={(e) => setNamaSampah(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Satuan Berat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: kg / Liter / Pcs"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button type="button" onClick={() => setSampahModalOpen(false)} className="flex-1 border-2 border-[#E2E8D5] text-[#202A14] font-extrabold text-xs py-3 rounded-full">BATAL</button>
              <button type="submit" className="flex-1 bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full shadow-sm">SIMPAN</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL TAMBAH/EDIT ACUAN HARGA NASABAH */}
      {/* ======================================================== */}
      {hargaNasabahModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleHargaNasabahSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                {editingHargaNasabah ? "Ubah Harga Nasabah" : "Atur Harga Nasabah"}
              </h2>
              <button type="button" onClick={() => setHargaNasabahModalOpen(false)} className="bg-[#202A14]/30 p-1.5 rounded-full text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-800 p-3 rounded-[1.25rem] text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <AlertCircle className="h-4.5 w-4.5 text-red-600" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Pilih Kategori Sampah</label>
                <select
                  required
                  disabled={!!editingHargaNasabah}
                  value={selectedJenisId}
                  onChange={(e) => setSelectedJenisId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {jenisSampahList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama_sampah} ({t.satuan})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Harga Jual Acuan Pengepul (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 3000"
                  value={hargaJualNasabah || ""}
                  onChange={(e) => setHargaJualNasabah(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Potongan Kas (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1000"
                  value={potonganKas || ""}
                  onChange={(e) => setPotonganKas(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>

              <div className="bg-[#E2E8D5]/40 p-4 rounded-[1.5rem] border border-[#E2E8D5]/20 flex justify-between items-center text-xs font-semibold">
                <span>Harga Bersih Nasabah:</span>
                <span className="font-black text-sm text-[#5E7A3E]">
                  {formatRupiah(Math.max(0, hargaJualNasabah - potonganKas))}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button type="button" onClick={() => setHargaNasabahModalOpen(false)} className="flex-1 border-2 border-[#E2E8D5] text-[#202A14] font-extrabold text-xs py-3 rounded-full">BATAL</button>
              <button type="submit" className="flex-1 bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full shadow-sm">SIMPAN</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL TAMBAH/EDIT ACUAN HARGA MITRA PENGEPUL */}
      {/* ======================================================== */}
      {hargaMitraModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleHargaMitraSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                {editingHargaMitra ? "Ubah Harga Mitra" : "Atur Kategori & Harga Mitra"}
              </h2>
              <button type="button" onClick={() => setHargaMitraModalOpen(false)} className="bg-[#202A14]/30 p-1.5 rounded-full text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-800 p-3 rounded-[1.25rem] text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <AlertCircle className="h-4.5 w-4.5 text-red-600" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Pilih Kategori Sampah</label>
                <select
                  required
                  disabled={!!editingHargaMitra}
                  value={selectedJenisMitraId}
                  onChange={(e) => setSelectedJenisMitraId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {jenisSampahList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama_sampah} ({t.satuan})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Harga Beli Mitra Pengepul (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 3200"
                  value={hargaJualMitra || ""}
                  onChange={(e) => setHargaJualMitra(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Syarat Minimal Timbangan Ambil (kg)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 50"
                  value={minimalBerat || ""}
                  onChange={(e) => setMinimalBerat(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button type="button" onClick={() => setHargaMitraModalOpen(false)} className="flex-1 border-2 border-[#E2E8D5] text-[#202A14] font-extrabold text-xs py-3 rounded-full">BATAL</button>
              <button type="submit" className="flex-1 bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full shadow-sm">SIMPAN</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL TAMBAH/EDIT AKUN PENGURUS */}
      {/* ======================================================== */}
      {officerModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202A14]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleOfficerSubmit}
            className="bg-[#F9F9F6] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-[#E2E8D5]"
          >
            <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-tight">
                {editingOfficer ? "Ubah Profil Pengurus" : "Tambah Akun Pengurus Baru"}
              </h2>
              <button type="button" onClick={() => setOfficerModalOpen(false)} className="bg-[#202A14]/30 p-1.5 rounded-full text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {errorMsg && (
                <div className="bg-red-50 text-red-800 p-3 rounded-[1.25rem] text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <AlertCircle className="h-4.5 w-4.5 text-red-600" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Nama Lengkap Pengurus</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Ranti Lestari"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Alamat Email (Login)</label>
                <input
                  type="email"
                  required
                  disabled={!!editingOfficer}
                  placeholder="Contoh: ranti@basah.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none disabled:opacity-50"
                />
              </div>

              {!editingOfficer && (
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-[#5E7A3E]" /> Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Jabatan / Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="petugas">Petugas Lapangan (Timbangan)</option>
                  <option value="bendahara">Bendahara (Keuangan & Pencairan)</option>
                  <option value="sekretaris">Sekretaris (Data Warga)</option>
                  <option value="ketua">Ketua Bank Sampah</option>
                  <option value="admin">Administrator Sistem</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Status Keaktifan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-aktif (Blokir Akses)</option>
                </select>
              </div>

              {/* Upload Foto Profil Wajah Pengurus */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">Foto Profil Wajah Pengurus</label>
                <div className="flex items-center gap-4 pl-3">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="h-14 w-14 rounded-full object-cover border-2 border-[#E2E8D5] shadow-sm" />
                  ) : (
                    <div className="h-14 w-14 bg-[#E2E8D5] rounded-full flex items-center justify-center text-[10px] font-bold text-[#202A14]/50 text-center">Belum Ada</div>
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
                            alert("Ukuran foto profil pengurus maksimal 1MB.");
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
              </div>

            </div>

            <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3">
              <button type="button" onClick={() => setOfficerModalOpen(false)} className="flex-1 border-2 border-[#E2E8D5] text-[#202A14] font-extrabold text-xs py-3 rounded-full">BATAL</button>
              <button type="submit" className="flex-1 bg-[#5E7A3E] text-white font-extrabold text-xs py-3 rounded-full shadow-sm">SIMPAN</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
