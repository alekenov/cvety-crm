import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main/components/ui': path.resolve(__dirname, '../src/components/ui'),
      '@main/lib/utils': path.resolve(__dirname, '../src/lib/utils.ts'),
      '@main/lib/types': path.resolve(__dirname, '../src/lib/types.ts'),
      '@main/hooks': path.resolve(__dirname, '../src/hooks'),
      '@main/components/orders': path.resolve(__dirname, '../src/components/orders'),
      '@main/components/catalog': path.resolve(__dirname, '../src/components/catalog'),
      '@main/components/shared': path.resolve(__dirname, '../src/components/shared'),
    },
  },
  base: '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})