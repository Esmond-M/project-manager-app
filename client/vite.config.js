import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // In production the app lives at /project-manager-app/ on the WordPress site.
  // In dev the Vite proxy handles /api so no base path is needed.
  base: mode === 'production' ? '/project-manager-app/' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
}));
