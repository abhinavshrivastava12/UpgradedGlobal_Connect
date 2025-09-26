// vite.config.js (Final Version for Deployment)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// ... (other imports) ...

export default defineConfig({
  plugins: [react()],
  // ... other configs ...
  build: {
    sourcemap: true, // Accha hai
  },
  // ❌ REMOVED: Deployment ke liye yeh server block hata dein
  // server: { 
  //   proxy: { 
  //     '/api': 'http://localhost:8000' 
  //   } 
  // }
});