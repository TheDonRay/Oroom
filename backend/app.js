import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

// import routes here
import webhookRoutes from './routes/webhookRoutes.js';

const app = express();

// security + incoming request middleware
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));

// webhooks go here, BEFORE express.json(): signature checks need the raw body
app.use('/webhooks', webhookRoutes);

app.use(express.json());

// Reads the Clerk session token on every request (CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY from env).
// It doesn't block anything by itself; protect routes with middlewares/requireAuth.js.
app.use(clerkMiddleware());

// health route check
app.get('/health', (req, res) => {
    res.status(200).json({ serverStatus: 'Ok' });
});

// mount routes here (e.g. app.use('/api/v1/tasks', taskRoutes))

// must stay last: 404 for unmatched routes, then the error handler
app.use(notFound);
app.use(errorHandler);

export default app;
