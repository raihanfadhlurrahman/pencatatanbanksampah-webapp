"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Home, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Truck, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  User as UserIcon,
  Menu,
  X,
  HelpCircle
} from "lucide-react";

interface UserProfile {
  email: string;
  nama: string;
  role: string;
  foto_url?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        
        // 1. Cek Supabase Auth Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Ambil profil pengurus
          const { data: dbProfile } = await supabase
            .from("users")
            .select("nama, role, foto_url")
            .eq("email", session.user.email)
            .single();

          const activeProfile: UserProfile = {
            email: session.user.email || "",
            nama: dbProfile?.nama || session.user.email?.split("@")[0] || "Pengurus",
            role: dbProfile?.role || "petugas",
            foto_url: dbProfile?.foto_url || undefined,
          };
          
          setProfile(activeProfile);
          localStorage.setItem("user_profile", JSON.stringify(activeProfile));
        } else {
          // 2. Cek Mock Session (Demo Mode)
          const mockSessionStr = localStorage.getItem("mock_session");
          const userProfileStr = localStorage.getItem("user_profile");
          
          if (mockSessionStr && userProfileStr) {
            setProfile(JSON.parse(userProfileStr));
          } else {
            // Belum login sama sekali, lempar ke login
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Gagal melakukan pengecekan autentikasi Supabase:", err);
        
        // JIKA koneksi Supabase error/offline, kita tetap periksa session Mock/Demo di local storage
        const mockSessionStr = localStorage.getItem("mock_session");
        const userProfileStr = localStorage.getItem("user_profile");
        
        if (mockSessionStr && userProfileStr) {
          setProfile(JSON.parse(userProfileStr));
        } else {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("mock_session");
    localStorage.removeItem("user_profile");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F6] flex flex-col items-center justify-center text-[#202A14]">
        <div className="bg-[#E2E8D5] p-4 rounded-full animate-bounce shadow-md mb-4">
          <Home className="h-8 w-8 text-[#5E7A3E]" />
        </div>
        <p className="text-sm font-extrabold tracking-wide uppercase">Memvalidasi Akun...</p>
      </div>
    );
  }

  if (!profile) return null;

  // Menu item navigasi
  const navItems = [
    { name: "Beranda", href: "/dashboard", icon: Home, roles: ["admin", "ketua", "sekretaris", "bendahara", "petugas"] },
    { name: "Nasabah", href: "/dashboard/nasabah", icon: Users, roles: ["admin", "sekretaris", "bendahara", "ketua", "petugas"] },
    { name: "Setor Sampah", href: "/dashboard/setor", icon: ArrowDownLeft, roles: ["admin", "petugas", "ketua"] },
    { name: "Pencairan Saldo", href: "/dashboard/pencairan", icon: ArrowUpRight, roles: ["admin", "bendahara"] },
    { name: "Pengepul", href: "/dashboard/pengepul", icon: Truck, roles: ["admin", "bendahara", "ketua"] },
    { name: "Keuangan Kas", href: "/dashboard/keuangan", icon: DollarSign, roles: ["admin", "bendahara", "ketua"] },
    { name: "Laporan", href: "/dashboard/laporan", icon: FileText, roles: ["admin", "ketua", "sekretaris", "bendahara"] },
    { name: "Panduan Role", href: "/dashboard/panduan", icon: HelpCircle, roles: ["admin", "ketua", "sekretaris", "bendahara", "petugas"] },
    { name: "Pengaturan", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
  ];

  // Filter menu berdasarkan role login
  const allowedNavItems = navItems.filter(item => item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#202A14] flex flex-col md:flex-row font-sans">
      
      {/* MOBILE HEADER (Terinspirasi uireference.jpg layout) */}
      <header className="md:hidden bg-[#5E7A3E] text-white py-4 px-5 flex items-center justify-between shadow-md print:hidden">
        <div className="flex items-center gap-2.5">
          {/* Avatar Bulat Foto Profil Petugas (User Identity) */}
          {profile.foto_url ? (
            <img 
              src={profile.foto_url} 
              alt="Foto Profil Petugas" 
              className="h-10 w-10 rounded-full border-2 border-[#E2E8D5] object-cover"
            />
          ) : (
            <div className="bg-[#E2E8D5] text-[#5E7A3E] h-10 w-10 rounded-full flex items-center justify-center font-black">
              {profile.nama.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-sm font-black leading-tight truncate max-w-[150px]">{profile.nama}</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E2E8D5] text-[#202A14] px-1.5 py-0.5 rounded">
              {profile.role}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-[#202A14]/30 hover:bg-[#202A14]/40 p-2 rounded-full transition-all"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGASI (DESKTOP LAYOUT) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#E2E8D5] p-5 shadow-lg border-r border-[#5E7A3E]/10
        transform md:translate-x-0 md:relative md:flex md:flex-col transition-transform duration-300 ease-in-out print:hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* CLOSE BUTTON MOBILE */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 text-[#202A14]/85 bg-white/50 p-1.5 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        {/* LOGO & NAMA APLIKASI */}
        <div className="flex items-center gap-3 pb-6 border-b border-[#5E7A3E]/15">
          <div className="bg-white p-2 rounded-2xl shadow-sm">
            <img 
              src="/image/logoBasah.png" 
              alt="Logo BASAH Rejosari" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <h2 className="font-black text-[#202A14] text-base tracking-wide uppercase">BASAH REJOSARI</h2>
            <p className="text-[10px] text-[#202A14]/65 font-bold uppercase">Dusun Rejosari</p>
          </div>
        </div>

        {/* MENU LIST NAVIGASI */}
        <div className="flex-1 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-black uppercase text-[#202A14]/50 tracking-wider">
            Menu Utama
          </div>
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs transition-all duration-150
                  ${isActive 
                    ? "bg-[#5E7A3E] text-white shadow-sm font-extrabold translate-x-1" 
                    : "text-[#202A14]/80 hover:bg-white/60 hover:text-[#5E7A3E]"}
                `}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-[#5E7A3E]"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* PROFIL PENGURUS & LOGOUT */}
        <div className="pt-4 border-t border-[#5E7A3E]/15 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {profile.foto_url ? (
              <img 
                src={profile.foto_url} 
                alt="Foto Profil Petugas" 
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
            ) : (
              <div className="bg-[#5E7A3E] text-white h-10 w-10 rounded-full flex items-center justify-center font-black shadow-sm">
                {profile.nama.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-[#202A14] truncate">{profile.nama}</h3>
              <span className="text-[9px] font-extrabold uppercase text-[#5E7A3E] bg-white px-2 py-0.5 rounded-full inline-block mt-0.5 tracking-wider border border-[#5E7A3E]/20">
                {profile.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all border border-red-200"
          >
            <LogOut className="h-4 w-4" />
            KELUAR (LOGOUT)
          </button>
        </div>

      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 z-40 bg-white/95 backdrop-blur border border-[#E2E8D5] rounded-full shadow-lg py-2.5 px-4 flex items-center justify-around print:hidden">
        {allowedNavItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-150
                ${isActive ? "text-[#5E7A3E] font-black scale-105" : "text-[#202A14]/60"}
              `}
            >
              <div className={`p-1.5 rounded-full ${isActive ? "bg-[#E2E8D5] text-[#5E7A3E]" : ""}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
        {/* Tombol Menu Tambahan untuk navigasi laci sidebar */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 text-[#202A14]/60"
        >
          <div className="p-1.5 rounded-full">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-bold mt-0.5">Lainnya</span>
        </button>
      </nav>

      {/* LAYAR UTAMA (MAIN CONTENT WINDOW) */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 overflow-y-auto">
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
