import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let _supabaseClient = null;

function getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn("⚠️ WARNING: Supabase URL or Key is missing. Returning fallback dummy client.");
        return {
            from: () => ({
                upsert: async () => ({ error: new Error("Supabase not configured") }),
                select: () => ({
                    eq: () => ({
                        single: async () => ({ data: null, error: new Error("Supabase not configured") })
                    })
                })
            }),
            storage: {
                from: () => ({
                    upload: async () => ({ error: new Error("Supabase not configured") }),
                    getPublicUrl: () => ({ data: { publicUrl: "" } })
                })
            }
        };
    }

    _supabaseClient = createClient(supabaseUrl, supabaseKey);
    return _supabaseClient;
}

const supabase = new Proxy({}, {
    get(target, prop) {
        return getSupabaseClient()[prop];
    }
});

export default supabase;
