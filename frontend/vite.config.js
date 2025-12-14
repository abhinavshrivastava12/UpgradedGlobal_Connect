import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  
  // Define global variables for browser compatibility
  define: {
    global: 'globalThis',
    'process.env': {}
  },

  // Resolve Node.js polyfills for browser
  resolve: {
    alias: {
      events: 'events',
      util: 'util',
      buffer: 'buffer',
      stream: 'stream-browserify'
    }
  },
  
  // Local Development Proxy: API calls ko backend par bhejega
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // Build optimization
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          socket: ['socket.io-client'],
        }
      }
    }
  }
});