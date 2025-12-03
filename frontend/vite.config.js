import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: path.resolve(__dirname, "node_modules", "buffer/"),
      events: path.resolve(__dirname, "node_modules", "events/"),
      util: path.resolve(__dirname, "node_modules", "util/"),
      stream: path.resolve(__dirname, "node_modules", "stream-browserify"),
      process: "process/browser",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  // ✅ Local Development Proxy: API calls ko backend par bhejega
  server: {
    proxy: {
      // Jab frontend '/api' ko call karega, to woh request http://localhost:8000 par chali jaegi
      '/api': 'http://localhost:8000' 
    }
  }
});