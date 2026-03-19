// src/lib/supabase.js
// Supabase client — single instance shared across the entire app.
// Uses VITE_ env vars (exposed by Vite at build time via import.meta.env).

import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
    throw new Error(
        '[Supabase] Missing env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    );
}

// Custom Storage adapter via Capacitor Preferences
// Solves login persistence issues (flashing, token wipe) on iOS and Android
const capacitorStorage = {
  getItem: async (key) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  },
};

// Bypass the Web Locks API used by GoTrue-JS for cross-tab localStorage coordination.
// The lock causes AbortError timeouts when multiple browser tabs are open simultaneously.
// This no-op lock is safe: session persistence and auth still work normally.
const noopLock = async (_name, _acquireTimeout, fn) => fn();

export const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: {
        storage: capacitorStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: noopLock,
    },
});
