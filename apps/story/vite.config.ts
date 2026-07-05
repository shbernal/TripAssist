import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Static animated story landing page, published to GitHub Pages under /TripAssist/.
// If this ever moves to Vercel (served at the domain root), flip `base` to '/'.
export default defineConfig({
  base: '/TripAssist/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
