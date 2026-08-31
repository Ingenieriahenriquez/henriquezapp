import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rrgjpzandvzbcmgogvit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Hjj9_htWKZWm0XtzgBwHDw_vwjsFymA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
