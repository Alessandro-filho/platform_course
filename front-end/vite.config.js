import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: './',
  plugins: [
    react({
      include: [/\.js$/, /\.jsx$/, /\.tsx$/, /\.md$/],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/serve-video': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/serve-txt': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/serve-files': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
