import mongoose from 'mongoose';

// Every incoming webhook (Google push, inbound email, ...) is saved before processing,
// so it can be retried and the same delivery is never handled twice.
const webhookEventSchema = new mongoose.Schema(
    {
        provider: { type: String, enum: ['google_calendar', 'email'], required: true },
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

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true }); // dedupe deliveries
// TODO: TTL index to auto-delete old events after ~30 days

export default mongoose.model('WebhookEvent', webhookEventSchema);
