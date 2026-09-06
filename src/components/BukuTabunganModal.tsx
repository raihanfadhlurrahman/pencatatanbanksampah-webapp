"use client";

import { X, Printer, BookOpen } from "lucide-react";

interface Nasabah {
  id: string;
  no_nasabah: string;
  nama: string;
  rt_rw: string;
  no_hp?: string;
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
  rincian_sampah?: string; // e.g. "Kardus Bekas (5.0 kg), Botol PET (2.5 kg)"
}

interface BukuTabunganModalProps {
  isOpen: boolean;
  onClose: () => void;
  nasabah: Nasabah | null;
  riwayat: RiwayatSaldo[];
  totalBerat?: number;
}

export default function BukuTabunganModal({
  isOpen,
  onClose,
  nasabah,
  riwayat,
  totalBerat = 0
}: BukuTabunganModalProps) {
  if (!isOpen || !nasabah) return null;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(angka);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#202A14]/50 backdrop-blur-sm flex items-center justify-center p-4 print:fixed print:inset-0 print:z-[9999] print:bg-white print:p-0 print:backdrop-blur-none">
      
      {/* CONTAINER MODAL & AREA CETAK (PRINT ISOLATED) */}
      <div className="bg-[#F9F9F6] w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#E2E8D5] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:bg-white print:m-0 print:p-0">
        
        {/* HEADER MODAL (Di-hide saat cetak print) */}
        <div className="bg-[#5E7A3E] text-white p-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-full">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">Buku Tabungan Fisik Warga</h2>
              <p className="text-[11px] text-white/80 font-bold">Cetak salinan halaman tabungan untuk kartu fisik per KK</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white text-[#5E7A3E] hover:bg-white/90 font-extrabold text-xs py-2 px-4 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Printer className="h-4 w-4" />
              CETAK BUKU TABUNGAN
            </button>
            <button
              onClick={onClose}
              className="bg-black/20 hover:bg-black/30 p-2 rounded-full text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* KONTEN SIAP CETAK (PASSBOOK SHEET) */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 print:p-4 print:overflow-visible">
          
          {/* TAMPILAN BUKU TABUNGAN CARD/SHEET */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-[#E2E8D5] shadow-sm space-y-6 print:border-2 print:border-zinc-800 print:rounded-2xl print:p-6 print:w-full">
            
            {/* KOP OFFICIAL BUKU TABUNGAN */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-4 border-[#202A14] pb-4 gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3.5">
                <img
                  src="/image/logoBasah.png"
                  alt="Logo BASAH Rejosari"
                  className="h-16 w-auto object-contain"
                />
                <div>
                  <h1 className="text-lg font-black tracking-wide uppercase text-[#202A14]">
                    BUKU TABUNGAN BANK SAMPAH
                  </h1>
                  <h2 className="text-sm font-black text-[#5E7A3E] uppercase tracking-wider">
                    "BASAH REJOSARI"
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-600 mt-0.5 uppercase">
                    RW 18, Dusun Rejosari, Kalurahan Wedomartani, Ngemplak, Sleman
                  </p>
                </div>
              </div>

              <div className="bg-[#E2E8D5]/50 px-4 py-2 rounded-2xl border border-[#E2E8D5] text-right sm:text-right w-full sm:w-auto print:border-zinc-400">
                <span className="text-[9px] font-black uppercase text-zinc-500 block">No. Tabungan Warga</span>
                <span className="text-base font-black text-[#5E7A3E] tracking-wider">{nasabah.no_nasabah}</span>
              </div>
            </div>

            {/* IDENTITAS KEPALA KELUARGA / WARGA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F9F9F6] p-4 rounded-2xl border border-[#E2E8D5]/50 text-xs font-bold text-[#202A14] print:bg-zinc-50 print:border-zinc-300">
              <div className="space-y-1.5">
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-zinc-500 w-28">Nama KK / Warga:</span>
                  <span className="font-black uppercase text-sm text-[#202A14]">{nasabah.nama}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-zinc-500 w-28">Wilayah (RT/RW):</span>
                  <span className="font-black text-[#5E7A3E]">{nasabah.rt_rw} (Rejosari)</span>
                </div>
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-[#E2E8D5] sm:pl-4 print:border-zinc-300">
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-zinc-500 w-28">No. Telepon / WA:</span>
                  <span className="font-extrabold">{nasabah.no_hp || "-"}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-zinc-500 w-28">Total Sampah Disetor:</span>
                  <span className="font-black text-[#5E7A3E]">{totalBerat > 0 ? `${totalBerat.toFixed(1)} kg` : "-"}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-zinc-500 w-28">Saldo Tabungan Saat Ini:</span>
                  <span className="font-black text-green-700">{formatRupiah(nasabah.saldo)}</span>
                </div>
              </div>
            </div>

            {/* TABEL PASSBOOK MUTASI TABUNGAN */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#202A14] border-b border-[#E2E8D5] pb-1.5 print:border-zinc-400">
                Catatan Mutasi Penimbangan & Tabungan (Buku Fisik)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#5E7A3E] text-white font-black text-[10px] uppercase tracking-wider print:bg-zinc-800">
                      <th className="py-2.5 px-3 rounded-l-xl text-center w-8">No</th>
                      <th className="py-2.5 px-3 w-20">Tanggal</th>
                      <th className="py-2.5 px-3">Keterangan & Rincian Sampah (Jenis & Berat)</th>
                      <th className="py-2.5 px-3 text-right text-green-100 w-24">Kredit (+)</th>
                      <th className="py-2.5 px-3 text-right text-red-100 w-24">Debit (-)</th>
                      <th className="py-2.5 px-3 text-right w-24">Saldo (Rp)</th>
                      <th className="py-2.5 px-3 rounded-r-xl text-center w-14">Paraf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8D5]/60 text-[#202A14] font-semibold print:divide-zinc-300">
                    {riwayat.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-[#F9F9F6] transition-colors">
                        <td className="py-2.5 px-3 text-center text-zinc-500 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-600 font-bold">{formatDate(row.tanggal)}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-extrabold text-[#202A14] block">{row.keterangan}</span>
                          {row.rincian_sampah && (
                            <span className="text-[10px] font-bold text-[#5E7A3E] bg-[#E2E8D5]/40 px-2 py-0.5 rounded-full inline-block mt-1">
                              Rincian: {row.rincian_sampah}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-green-700 whitespace-nowrap">
                          {row.tipe === "setoran" ? `+${formatRupiah(row.nominal)}` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-red-700 whitespace-nowrap">
                          {row.tipe === "pencairan" ? `-${formatRupiah(row.nominal)}` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-[#5E7A3E] whitespace-nowrap">
                          {formatRupiah(row.saldo_akhir)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="h-6 w-10 border border-dashed border-zinc-300 rounded mx-auto flex items-center justify-center text-[8px] text-zinc-400 font-normal">
                            [ &nbsp;&nbsp; ]
                          </div>
                        </td>
                      </tr>
                    ))}

                    {riwayat.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs italic">
                          Belum ada catatan setoran atau pencairan pada buku tabungan fisik ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TANDA TANGAN PETUGAS BANK SAMPAH & LEMBAR PENGESAHAN */}
            <div className="pt-6 grid grid-cols-2 text-center text-xs font-semibold text-[#202A14] gap-4 border-t border-[#E2E8D5] print:border-zinc-400">
              <div>
                <p className="text-[10px] text-zinc-500">Dicetak Pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="font-bold text-[#5E7A3E] uppercase mt-1">Pemegang Buku Tabungan</p>
                <div className="h-14"></div>
                <p className="border-b border-[#202A14] w-3/4 mx-auto pb-0.5 font-black uppercase">{nasabah.nama}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Kepala Keluarga / Nasabah</p>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500">Bank Sampah BASAH Rejosari</p>
                <p className="font-bold text-[#5E7A3E] uppercase mt-1">Petugas / Pengurus Bank Sampah</p>
                <div className="h-14"></div>
                <p className="border-b border-[#202A14] w-3/4 mx-auto pb-0.5 font-black uppercase">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Tanda Tangan & Cap Unit</p>
              </div>
            </div>

            {/* FOOTER BUKU TABUNGAN */}
            <div className="text-center text-[9px] font-bold text-zinc-400 border-t border-dashed border-[#E2E8D5] pt-3 italic print:border-zinc-300">
              Harap membawa buku tabungan fisik ini setiap kali melakukan penimbangan atau pencairan saldo di lokasi Bank Sampah BASAH Rejosari.
            </div>

          </div>

        </div>

        {/* BOTTOM ACTION BAR (Di-hide saat cetak print) */}
        <div className="p-4 bg-white border-t border-[#E2E8D5] flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-[#E2E8D5] hover:bg-[#E2E8D5]/20 text-[#202A14] font-extrabold text-xs py-3 rounded-full transition-all"
          >
            TUTUP
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#5E7A3E] hover:bg-[#5E7A3E]/95 text-white font-extrabold text-xs py-3 rounded-full flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            CETAK HALAMAN TABUNGAN
          </button>
        </div>

      </div>

    </div>
  );
}
