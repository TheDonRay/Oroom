import { verifyWebhook } from '@clerk/express/webhooks';
import { env } from '../config/env.js';
import WebhookEvent from '../models/WebhookEvent.js';
import { profileFromWebhook, upsertUserFromClerk, deleteUserByClerkId } from '../services/users.js';

// POST /webhooks/clerk
// Clerk sends webhooks through Svix. req.body is the raw Buffer (see routes/webhooks.js),
// which the signature check needs.
export async function handleClerkWebhook(req, res) {
    if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
        return res.status(500).json({ error: 'CLERK_WEBHOOK_SIGNING_SECRET is not set' });
    }

    let evt;
    try {
        evt = await verifyWebhook(req, { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET });
    } catch {
        // Bad or missing signature, or a timestamp older than ~5 minutes
        return res.status(400).json({ error: 'Webhook verification failed' });
    }

    // svix-id is the same on every retry of one delivery, so it's our dedupe key
    const eventId = req.get('svix-id');

    // Log the event; if it already exists, this returns the existing row instead
    const record = await WebhookEvent.findOneAndUpdate(
        { provider: 'clerk', eventId },
        { $setOnInsert: { payload: evt } },
        { upsert: true, returnDocument: 'after' },
    );
    if (record.status === 'processed') {
        return res.status(200).json({ received: true, duplicate: true });
    }

    try {
        let user;
        switch (evt.type) {
            case 'user.created':
            case 'user.updated':
                user = await upsertUserFromClerk(profileFromWebhook(evt.data));
                break;
            case 'user.deleted':
                user = await deleteUserByClerkId(evt.data.id);
                break;
            default:
                // Verified event we don't handle; 200 so Clerk doesn't keep retrying it
                break;
        }

        record.status = 'processed';
        record.processedAt = new Date();
        record.error = undefined;
        if (user) record.userId = user._id;
        await record.save();

        return res.status(200).json({ received: true });
    } catch (err) {
        record.status = 'failed';
        record.error = err.message;
        await record.save();
        throw err; // errorHandler responds 500, so Clerk retries later
    }
}
