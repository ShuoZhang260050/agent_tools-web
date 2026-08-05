import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
  server: {
    port: 5173,
    proxy: {
      '/chat': { target: 'http://localhost:8000', changeOrigin: true },
      '/sessions': { target: 'http://localhost:8000', changeOrigin: true },
      '/models': { target: 'http://localhost:8000', changeOrigin: true },
      '/login': { target: 'http://localhost:8000', changeOrigin: true },
      '/register': { target: 'http://localhost:8000', changeOrigin: true },
      '/me': { target: 'http://localhost:8000', changeOrigin: true },
      '/documents': { target: 'http://localhost:8000', changeOrigin: true },
      '/workspace': { target: 'http://localhost:8000', changeOrigin: true },
      '/traces': { target: 'http://localhost:8000', changeOrigin: true },
      '/extract-text': { target: 'http://localhost:8000', changeOrigin: true },
      '/tools': { target: 'http://localhost:8000', changeOrigin: true },
      '/permissions': { target: 'http://localhost:8000', changeOrigin: true },
      '/screenshots': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
