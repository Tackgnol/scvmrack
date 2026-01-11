import {fastifyCookie} from "@fastify/cookie";
import { join } from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions,} from 'fastify'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}



const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  // Upewnij się, że używasz poprawnego __dirname
  void await fastify.register(fastifyCookie);
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts
  });
}


export default app
export { app, options }
