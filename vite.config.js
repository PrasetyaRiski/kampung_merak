import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          mqtt: ["mqtt"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://api-merak.abdulrosyid.my.id",
        changeOrigin: true,
      },
      "/auth": {
        target: "https://api-merak.abdulrosyid.my.id",
        changeOrigin: true,
      },
      "/video_feed": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
