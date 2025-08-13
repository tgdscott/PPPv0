import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '127.0.0.1', 
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Proxy static asset requests (audio, covers) to backend FastAPI server
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
    // Add a fallback for HTML5 history API routing
    // This ensures that all non-API requests are served by index.html
    middleware: [
      (req, res, next) => {
        if (!req.url.startsWith('/api') && !req.url.includes('.')) {
          req.url = '/'; // Rewrite to root to serve index.html
        }
        next();
      },
    ],
  },
})