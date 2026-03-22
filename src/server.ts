import Fastify from 'fastify';
import appService from './app.js'; // import Twojego pliku app.ts
import 'dotenv/config';

const server = Fastify({
    logger: true
});

const start = async () => {
    // Rejestrujemy główną aplikację (Autoload itd.)
    await server.register(appService);

    try {
        // Passenger sam przydziela port przez zmienną PORT
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

        await server.listen({ port, host: '0.0.0.0' });
        server.log.info(`Serwer działa na porcie: ${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
