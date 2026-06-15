import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Automatically open the SPA login route when running `npm run dev`
      open: '/',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || env.VITE_API_URL),
    }
  }
})