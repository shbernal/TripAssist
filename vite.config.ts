import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Single static app with two HTML entry points, published to GitHub Pages under
// one shared base, /TripAssist/:
//   - the story landing page  → /TripAssist/            (index.html)
//   - the operator dashboard  → /TripAssist/dashboard/  (dashboard/index.html)
// Vite emits both HTML files in place, so the deploy just publishes `dist` as-is
// (no post-build splicing). If this ever moves off Pages (e.g. Vercel at a domain
// root), flip `base` to '/'.
export default defineConfig({
  base: '/TripAssist/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        story: resolve(import.meta.dirname, 'index.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard/index.html'),
      },
    },
  },
})
