import config from "./vite.config";

export default {
  ...config,
  cacheDir: "node_modules/.vite-protocol",
  optimizeDeps: {
    entries: ["test/contracts/protocol.html", "test/contracts/popup.html"],
    include: ["@sentry/browser", "@tackgnol/rpgtools-shared-auth/client"],
  },
  server: {
    ...config.server,
    cors: { origin: /^http:\/\/127\.0\.0\.1:\d+$/ },
  },
};
