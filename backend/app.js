import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

// import routes here

const app = express();

// security + incoming request middleware
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());

// health route check
app.get('/health', (req, res) => {
    res.status(200).json({ serverStatus: 'Ok' });
});

// mount routes here (e.g. app.use('/api/v1/tasks', taskRoutes))

// must stay last: 404 for unmatched routes, then the error handler
app.use(notFound);
app.use(errorHandler);

export default app;
