import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Served at myintp.github.io/candidatus/ via GitHub Pages.
  base: process.env.GITHUB_PAGES ? '/candidatus/' : '/',
  server: {
    proxy: {
      '/jooble-api': {
        target: 'https://jooble.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jooble-api/, '/api')
      }
    }
  }
})