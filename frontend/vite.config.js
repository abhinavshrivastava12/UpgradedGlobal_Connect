import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  
  define: {
    global: 'globalThis',
    'process.env': {}
  },

  resolve: {
    alias: {
      events: 'events',
      util: 'util',
      buffer: 'buffer',
      stream: 'stream-browserify'
    }
  },
  
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  }
});