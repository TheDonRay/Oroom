import mongoose from 'mongoose';

// Every incoming webhook (Google push, inbound email, Stripe, Clerk) is saved before processing,
// so it can be retried and the same delivery is never handled twice.
// This lists webhook senders, not connectors: add a value whenever a new service sends webhooks.
const webhookEventSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ['google_calendar', 'email', 'stripe', 'clerk'],
            required: true,
        },
        eventId: { type: String, required: true }, // provider's delivery / message id
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // filled in after lookup

        payload: mongoose.Schema.Types.Mixed,
        status: {
            type: String,
            enum: ['received', 'processed', 'failed'],
            default: 'received',
        },
        error: String,
        processedAt: Date,
    },
    { timestamps: true },
);

// TTL indexing happening here
webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true }); // dedupe deliveries
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // auto-delete after 30 days

export default mongoose.model('WebhookEvent', webhookEventSchema);
