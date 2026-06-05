import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react(), vue(), svelte()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        react: resolve(root, 'react.html'),
        vue: resolve(root, 'vue.html'),
        svelte: resolve(root, 'svelte.html'),
        phaser: resolve(root, 'phaser.html'),
        pixi: resolve(root, 'pixi.html'),
      },
    },
  },
});
