import fp from 'fastify-plugin'
import path from 'node:path'

export default fp(async (fastify) => {
    // 1. Serve static assets (JS, CSS, images) from the dist/public folder
    fastify.register(import('@fastify/static'), {
        root: path.join(process.cwd(), 'dist/public'),
        prefix: '/',
        wildcard: false // Crucial: Stops the plugin from hijacking '/*'
    })

    // 2. The SPA Fallback
    // If a route isn't an API endpoint and isn't a static file, serve index.html
    fastify.setNotFoundHandler((request, reply) => {
        // If the request is for an API route that doesn't exist, return standard 404 JSON
        if (request.url.startsWith('/api/')) {
            reply.code(404).send({ error: 'Not Found' })
            return
        }

        // Otherwise, send the React index.html
        reply.sendFile('index.html')
    })
})
