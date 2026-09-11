import { defineConfig } from "vite";
export default defineConfig({
  server: {
    port: 5188,
    strictPort: true,
    proxy: {
      "/socket.io": { target: "http://127.0.0.1:3001", ws: true },
      "/api": "http://127.0.0.1:3001",
      "/docs": "http://127.0.0.1:3001",
    },
  },
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
});
