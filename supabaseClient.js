
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fqhlilblqzdrlsxbdmmd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZFqyzVLLLNlOwgyllAXhhQ_2W_JQDk4";

if (
  !SUPABASE_URL.startsWith("https://") ||
  !SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
) {
  throw new Error("Konfigurasi Supabase belum lengkap.");
}

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
    }
);
