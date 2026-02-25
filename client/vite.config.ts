import visualizer from "rollup-plugin-visualizer";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    outDir: './public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor': [
            'react', 
            'react-dom', 
            'i18next', 
            'react-i18next', 
            'i18next-browser-languagedetector',
            'motion',
            'better-auth',
            '@tanstack/react-query', 
            '@tanstack/react-router'
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
