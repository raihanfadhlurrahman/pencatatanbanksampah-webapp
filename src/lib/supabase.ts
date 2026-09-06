import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL atau Anon Key/Publishable Key tidak ditemukan. Pastikan berkas .env.local sudah dibuat dengan benar.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Fungsi pembantu untuk menghapus file lama dari Supabase Storage (bucket: timbangan-photos)
 * @param publicUrl URL publik file di Supabase Storage
 */
export const deleteStorageFile = async (publicUrl: string | undefined | null) => {
  if (!publicUrl || typeof publicUrl !== "string") return;
  try {
    const parts = publicUrl.split("timbangan-photos/");
    if (parts.length > 1) {
      const filePath = decodeURIComponent(parts[1].split("?")[0]);
      if (filePath) {
        const { error } = await supabase.storage.from("timbangan-photos").remove([filePath]);
        if (error) {
          console.warn("Peringatan saat menghapus file lama dari Supabase storage:", error.message);
        }
      }
    }
  } catch (err) {
    console.warn("Gagal menghapus file lama dari storage Supabase:", err);
  }
};
