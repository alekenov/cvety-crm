import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Pre-bundle React and common dependencies to avoid compatibility issues
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover'
    ],
    exclude: []
  },
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  },
  build: {
    target: 'es2020', // Поддержка современных браузеров
    sourcemap: false, // Отключить sourcemaps в production для меньшего размера
    rollupOptions: {
      external: [],
      output: {
        // Simplify chunk splitting to avoid React 19 compatibility issues
        manualChunks: (id) => {
          // Keep React separate and stable
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Group all Radix UI components together for better compatibility
            if (id.includes('@radix-ui/')) {
              return 'radix-vendor'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            if (id.includes('lucide-react') || id.includes('sonner')) {
              return 'ui-vendor'
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor'
            }
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor'
            }
            return 'vendor'
          }
          
          // App pages - split by feature
          if (id.includes('src/pages/orders') || id.includes('src/components/orders')) {
            return 'orders'
          }
          if (id.includes('src/pages/catalog') || id.includes('src/components/catalog')) {
            return 'catalog'
          }
          if (id.includes('src/pages/warehouse') || id.includes('src/components/warehouse')) {
            return 'warehouse'
          }
          if (id.includes('src/pages/customers')) {
            return 'customers'
          }
          if (id.includes('src/pages/production')) {
            return 'production'
          }
          if (id.includes('src/pages/settings')) {
            return 'settings'
          }
          if (id.includes('src/pages/supplies')) {
            return 'supplies'
          }
        }
      }
    },
    chunkSizeWarningLimit: 500, // Warn at 500KB instead of default 1000KB
  }
})