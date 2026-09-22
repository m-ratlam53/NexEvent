import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Only used as a fallback when VITE_API_BASE_URL is unset (axios then
  // calls a relative /api path, which this proxy forwards) — derived from
  // env rather than hardcoded so each developer's own backend port (e.g.
  // if 5000 is taken locally) doesn't need a source change.
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': apiProxyTarget,
      },
    },
  }
})
