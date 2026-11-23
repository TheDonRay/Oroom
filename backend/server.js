// Env vars are loaded by Node itself (`--env-file=.env` in the dev script)
// and validated in config/env.js.
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

async function start() {
    try { 
        // awaits db connection here 
        await connectDB();
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }

    const server = app.listen(env.PORT, () => {
        console.log(`Server successfully running on: http://localhost:${env.PORT}`);
    });

    // Graceful shutdown: stop accepting requests, then close the DB connection
    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down...`);
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000).unref(); // force exit if it hangs
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start();
