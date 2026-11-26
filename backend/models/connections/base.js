import mongoose from 'mongoose';

// Fields every connector has. Provider-specific fields live in their own file in this folder,
// added on top of this schema as a Mongoose discriminator keyed by `provider`.
// All connectors share one `connections` collection.
const connectionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        provider: { type: String, required: true }, // set automatically by each provider model
        status: {
            type: String,
            enum: ['active', 'error', 'disconnected'],
            default: 'active',
        },

        // OAuth tokens, for providers that use OAuth (Google, Slack, ...).
        // Secrets are stored encrypted (AES-256-GCM, utils/crypto) and hidden from queries by default.
        credentials: {
            accessToken: { type: String, select: false },
            refreshToken: { type: String, select: false },
            expiresAt: Date,
            scope: String,
        },

        lastSyncedAt: Date,
        lastError: String,
    },
    { timestamps: true, discriminatorKey: 'provider' },
);

// One connection per provider per user
connectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.model('Connection', connectionSchema);
