import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyPluginAsync } from 'fastify';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Mörk Borg Character API',
        version: '1.0.0',
      },
    },
    transform: ({ schema, url }) => {
      // Remove trailing slashes
      let fixedUrl = url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url;
      // Convert :param to {param}
      fixedUrl = fixedUrl.replace(/:(\w+)/g, '{$1}');
      return { schema, url: fixedUrl };
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Expose OpenAPI JSON
  fastify.get('/openapi.json', async () => {
    return fastify.swagger();
  });
};

export default fp(swaggerPlugin);
