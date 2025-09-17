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
        global: "globalThis", // polyfill for global
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
});
