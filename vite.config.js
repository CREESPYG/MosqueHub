import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/And APK/**",
        "**/android/**",
        "**/flutter_app/**",
        "**/*.apk",
      ],
    },
  },
});
