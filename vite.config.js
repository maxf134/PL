import { defineConfig } from 'vite';

export default defineConfig({
 base: '/PL/',
  server: { host: true, port: 5173 },
  build: { target: 'es2020' },
});