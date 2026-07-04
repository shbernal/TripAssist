import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Static scrollytelling landing page, published to GitHub Pages under /AccessTrip/.
// If this ever moves to Vercel (served at the domain root), flip `base` to '/'.
export default defineConfig({
  base: '/AccessTrip/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
