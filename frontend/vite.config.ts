import visualizer from "rollup-plugin-visualizer";
import { defineConfig } from 'vitest/config';
import type { ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? 'localhost,web')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

/** Proxy API calls to the backend but let browser navigations fall through to the SPA. */
function apiProxy(target: string, allowHtml = false): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    bypass(req) {
      if (!allowHtml && req.headers.accept?.includes('text/html')) {
        // Fall back to serve SPA
        return req.url;
      }
    },
  };
}

export default defineConfig({
  publicDir: './static',
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
    outDir: './dist',
    emptyOutDir: true,
    rolldownOptions: {
      // Two HTML entries: the main SPA and the Owlbear Rodeo panel. The OBR
      // bundle is the only place @owlbear-rodeo/sdk is reachable.
      input: {
        main: path.resolve(__dirname, 'index.html'),
        obr: path.resolve(__dirname, 'obr.html'),
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-mui',
              test: /node_modules[\\/](?:@mui|@emotion)[\\/]/,
            },
            {
              name: 'vendor-motion',
              test: /node_modules[\\/]motion[\\/]/,
            },
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
  server: {
    allowedHosts,
    // Dev-only: Owlbear Rodeo fetches the extension
    // manifest + icon cross-origin from this http://localhost dev server. Vite 8
    // blocks cross-origin dev requests by default. Keep this scoped to
    // Owlbear origins rather than using an open `origin: true`.
    // Affects `vite dev` only, never the build.
    cors: { origin: [/^https:\/\/([a-z0-9-]+\.)?owlbear\.(?:app|rodeo)$/] },
    ...(process.env.API_PROXY_TARGET && {
      proxy: {
        '/api': apiProxy(process.env.API_PROXY_TARGET),
        '/health': apiProxy(process.env.API_PROXY_TARGET),
        '/c': apiProxy(process.env.API_PROXY_TARGET),
      },
    }),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup-dom.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['test/browser/**/*'],
    coverage: {
      provider: 'istanbul',
      enabled: false,
      reporter: ['text', 'html', 'lcov', 'json', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/api/schema.ts',
        'src/main.tsx',
      ],
    },
  },
});
