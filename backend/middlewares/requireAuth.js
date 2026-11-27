import { getAuth } from '@clerk/express';
import User from '../models/User.js';
import { provisionUserFromClerk } from '../services/users.js';

// Use on any route that needs a signed-in user. Sets req.user to the Mongo User.
// Needs clerkMiddleware() to run earlier in the chain (see app.js).
// Express 5 forwards errors from async middleware to errorHandler, so no try/catch.
export async function requireAuth(req, res, next) {
    const { userId } = getAuth(req); // Clerk's user id, e.g. "user_2abc..."
    if (!userId) {
        return res.status(401).json({ error: 'Not signed in' });
    }

    // Normally the user.created webhook has already made this User. If it hasn't
    // arrived yet (or failed), create them now from Clerk so they aren't locked out.
    const user =
        (await User.findOne({ clerkId: userId })) ?? (await provisionUserFromClerk(userId));

    req.user = user;
    next();
}
