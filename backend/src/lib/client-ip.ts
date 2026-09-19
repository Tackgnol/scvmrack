import { BlockList, isIP } from 'node:net';
import type { IncomingHttpHeaders } from 'node:http';

// Caddy reaches the container over the Docker bridge, so `request.ip` is the
// bridge gateway for every visitor. Cloudflare puts the real client in
// CF-Connecting-IP, but only a peer on a private network (our Caddy) may
// vouch for it; a direct hit on the origin cannot spoof its rate-limit key.
const privatePeers = new BlockList();
privatePeers.addSubnet('127.0.0.0', 8, 'ipv4');
privatePeers.addSubnet('10.0.0.0', 8, 'ipv4');
privatePeers.addSubnet('172.16.0.0', 12, 'ipv4');
privatePeers.addSubnet('192.168.0.0', 16, 'ipv4');
privatePeers.addAddress('::1', 'ipv6');
privatePeers.addSubnet('fc00::', 7, 'ipv6');

function isPrivatePeer(ip: string): boolean {
  const family = isIP(ip);
  return family !== 0 && privatePeers.check(ip, family === 4 ? 'ipv4' : 'ipv6');
}

export function clientIp(request: { ip: string; headers: IncomingHttpHeaders }): string {
  const forwarded = request.headers['cf-connecting-ip'];
  if (typeof forwarded === 'string' && isIP(forwarded) && isPrivatePeer(request.ip)) {
    return forwarded;
  }
  return request.ip;
}
