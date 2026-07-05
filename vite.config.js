import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend lives in /web. During dev, Vite (5173) proxies API + SSE to Express (3000).
// In production, `npm run build` emits web/dist and Express serves it as a single process.
export default defineConfig({
  root: 'web',
  // Env files live at the repo root (single .env), but `root: 'web'` would make
  // Vite look in web/. Point envDir back at the repo root so VITE_* vars (e.g.
  // VITE_VAPI_PUBLIC_KEY) are picked up. Only VITE_-prefixed vars are exposed to
  // the client, so the other secrets in .env stay server-side.
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/events': { target: 'http://localhost:3000', ws: false },
      '/webhooks': 'http://localhost:3000',
      '/prm-form': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
