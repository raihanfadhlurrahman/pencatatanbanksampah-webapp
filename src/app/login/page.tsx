"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogIn, Eye, EyeOff, Lock, Mail, ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // Authenticate dengan Supabase Auth untuk Akun Riil
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message === "Invalid login credentials" 
          ? "Email atau kata sandi salah. Silakan periksa kembali." 
          : authError.message
        );
      }

      const user = authData?.user;
      if (!user) throw new Error("Gagal mengambil data user.");

      // 2. Fetch User Profile from public.users to check role & status
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, status, nama")
        .eq("email", user.email)
        .single();

      if (profileError || !profile) {
        // Jika auth sukses tapi profile di public.users belum diset (misal inisialisasi awal)
        // Kita berikan role 'admin' sebagai fallback
        console.warn("Profil pengguna di public.users tidak ditemukan. Menggunakan role default.");
        localStorage.setItem("user_profile", JSON.stringify({
          email: user.email,
          nama: user.email?.split("@")[0] || "Pengurus",
          role: "admin"
        }));
        router.push("/dashboard");
        return;
      }

      if (profile.status === "nonaktif") {
        await supabase.auth.signOut();
        throw new Error("Akun Anda telah dinonaktifkan oleh administrator.");
      }

      // Simpan data profil di localStorage agar mudah dibaca di client-side
      localStorage.setItem("user_profile", JSON.stringify({
        email: user.email,
        nama: profile.nama,
        role: profile.role
      }));

      // Redirect ke dashboard pengurus
      router.push("/dashboard");

    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#202A14] flex flex-col justify-between font-sans">
      
      {/* HEADER NAVIGASI */}
      <div className="p-4 flex items-center">
        <Link 
          href="/" 
          className="flex items-center gap-1 text-[#5E7A3E] font-extrabold text-sm hover:underline py-2 px-3 rounded-full hover:bg-[#E2E8D5]/30 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
          KEMBALI
        </Link>
      </div>

      {/* FORM LOGIN (Terinspirasi uireference.jpg Layar 2) */}
      <div className="max-w-md w-full mx-auto px-6 py-4 flex flex-col items-center">
        
        {/* LOGO & Branding */}
        <div className="text-center mb-6 flex flex-col items-center">
          <img 
            src="/image/logoBasah.png" 
            alt="Logo BASAH Rejosari" 
            className="h-20 w-auto object-contain mb-3 drop-shadow-md" 
          />
          <h2 className="text-2xl font-black tracking-tight text-[#5E7A3E] uppercase">MASUK PENGURUS</h2>
          <p className="text-xs font-semibold text-[#202A14]/70 mt-1">
            Gunakan akun pengurus yang telah didaftarkan Admin
          </p>
        </div>

        {/* CARD INPUT FORM */}
        <form onSubmit={handleLogin} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-[#E2E8D5]/40 space-y-5">
          
          {/* Error Message Box */}
          {errorMsg && (
            <div className="bg-red-50 text-red-800 p-3.5 rounded-[1.25rem] text-xs font-semibold flex items-start gap-2 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Input Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5E7A3E]">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                placeholder="contoh: budi@basah.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#202A14]/75 pl-3">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5E7A3E]">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-[#F9F9F6] border-2 border-[#E2E8D5] focus:border-[#5E7A3E] rounded-full text-sm font-semibold outline-none transition-all placeholder:text-[#202A14]/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5E7A3E]/80 hover:text-[#5E7A3E]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5E7A3E] hover:bg-[#5E7A3E]/90 text-white font-extrabold text-base py-4 rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none mt-2"
          >
            <LogIn className="h-5 w-5" />
            {loading ? "MEMPROSES..." : "MASUK KE SISTEM"}
          </button>
        </form>

        <div className="mt-5 text-center px-4">
          <p className="text-[11px] font-bold text-[#202A14]/60 leading-relaxed">
            *Belum punya akun? Akun pengurus hanya dapat dibuat oleh Admin Dusun. Hubungi pengurus utama untuk registrasi.
          </p>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="py-4 text-center text-[10px] font-semibold text-[#202A14]/40 mt-auto">
        BASAH Rejosari &copy; 2026
      </footer>

    </div>
  );
}
