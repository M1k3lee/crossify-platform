import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// GitHub Pages serves from /crossify-platform subdirectory
// Use base path from environment or default to / for custom domains
const base = process.env.VITE_BASE_PATH || '/crossify-platform/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:3001',
        changeOrigin: true,
        // Don't rewrite - backend expects /api prefix
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})







