import { env } from '../config/env.js';

// 404 for any request that didn't match a route
export function notFound(req, res) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler. Express 5 forwards errors thrown in async handlers here automatically.
// It must keep all four parameters so Express recognises it as an error handler.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500;

    if (status >= 500) console.error(err);

    res.status(status).json({
        error: status >= 500 && env.isProduction
            ? 'Internal server error'
            : err.message,
    });
}
