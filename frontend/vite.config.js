// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // ... other configs
  build: {
    sourcemap: true, // 👈 Add this line to enable source maps
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
});