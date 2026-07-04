import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend lives in /web. During dev, Vite (5173) proxies API + SSE to Express (3000).
// In production, `npm run build` emits web/dist and Express serves it as a single process.
export default defineConfig({
  root: 'web',
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
