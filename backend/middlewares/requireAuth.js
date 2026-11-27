import { getAuth } from '@clerk/express';
import User from '../models/User.js';

// Use on any route that needs a signed-in user. Sets req.user to the Mongo User.
// Needs clerkMiddleware() to run earlier in the chain (see app.js).
// Express 5 forwards errors from async middleware to errorHandler, so no try/catch.
export async function requireAuth(req, res, next) {
    const { userId } = getAuth(req); // Clerk's user id, e.g. "user_2abc..."
    if (!userId) {
        return res.status(401).json({ error: 'Not signed in' });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
        // Signed in with Clerk, but the user.created webhook hasn't created them yet
        return res.status(401).json({ error: 'Account not set up yet' });
    }

    req.user = user;
    next();
}
