import config from "./vite.config";

export default {
  ...config,
  server: {
    ...config.server,
    cors: { origin: /^http:\/\/127\.0\.0\.1:\d+$/ },
  },
};
