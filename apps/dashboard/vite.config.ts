import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Static operator-dashboard demo, published to GitHub Pages as a sub-path of the
// combined site: the landing page is served at /TripAssist/, this at
// /TripAssist/dashboard/. If this ever moves off Pages (e.g. Vercel at a domain
// root), flip `base` to '/dashboard/'.
export default defineConfig({
  base: '/TripAssist/dashboard/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
