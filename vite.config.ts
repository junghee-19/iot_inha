import path from 'path';
import { webcrypto } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          // FastAPI dev 서버 포트와 일치시킨다 (uvicorn 기본 8000)
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@assets': path.resolve(__dirname, './assets'),
      },
    },
  };
});
