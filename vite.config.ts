import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react(), vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        react: resolve(process.cwd(), 'react.html'),
        vue: resolve(process.cwd(), 'vue.html'),
        phaser: resolve(process.cwd(), 'phaser.html'),
        pixi: resolve(process.cwd(), 'pixi.html'),
      },
    },
  },
});
