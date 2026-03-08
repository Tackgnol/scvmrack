import visualizer from "rollup-plugin-visualizer";
import { defineConfig, type ProxyOptions } from 'vite';
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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            // Let the bundler handle the framework core (React, TanStack, Auth)
            // automatically to ensure correct execution order.
          }
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
    ...(process.env.API_PROXY_TARGET && {
      proxy: {
        '/auth': apiProxy(process.env.API_PROXY_TARGET, true),
        '/characters': apiProxy(process.env.API_PROXY_TARGET),
        '/equipment': apiProxy(process.env.API_PROXY_TARGET),
        '/session': apiProxy(process.env.API_PROXY_TARGET),
        '/health': apiProxy(process.env.API_PROXY_TARGET),
        '/c': apiProxy(process.env.API_PROXY_TARGET),
      },
    }),
  },
});
