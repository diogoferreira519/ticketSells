import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/filmes': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/eventos': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/salas': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/catalogo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/pagamentos': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ingressos/meus': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ingressos/por-codigo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ingressos/validar': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
