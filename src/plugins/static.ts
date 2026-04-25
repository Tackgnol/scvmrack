import fp from 'fastify-plugin'
import path from 'node:path'

export default fp(async (fastify) => {
    fastify.register(import('@fastify/static'), {
        root: path.join(process.cwd(), 'dist/public'),
        prefix: '/',
    })
})
