import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode})=>({
  plugins: [react()],
  base: './',
  publicDir: false,
  build: {
    outDir: mode==='share-preview'?'dist/netlify-preview':'dist/web',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  server: { watch: {ignored: ['**/dist/**','**/legacy/**','**/.local/**']}, proxy: { '/official-csv': {
    target: 'https://docs.google.com', changeOrigin: true, followRedirects: true,
    rewrite: () => '/spreadsheets/d/e/2PACX-1vSySx90K2gB-VRRxUKlgp1hRt2IJGVPkd4Jl9vKoihAaj0UrfE8Y13mAE7V2q6PzUgHNQDtTcN6uwm3/pub?gid=1617292525&single=true&output=csv',
  } } },
  test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'], setupFiles: ['./tests/setup.ts'], environment: 'jsdom', restoreMocks: true },
}));
