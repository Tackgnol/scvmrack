import { limitMax } from '../../lib/rate-limits.js';

export const roomRouteConfig = {
  rateLimit: { max: limitMax(50), timeWindow: '1 minute' },
};
