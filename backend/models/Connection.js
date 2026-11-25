import mongoose from 'mongoose';

// A source the user has linked: Google Calendar, Brightspace iCal feed, forwarded email.
const connectionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        provider: {
            type: String,
            enum: ['google_calendar', 'brightspace', 'email'],
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'error', 'disconnected'],
            default: 'active',
        },

        // Secrets are stored encrypted (AES-256-GCM, utils/crypto) and hidden from queries by default.
        credentials: {
            accessToken: { type: String, select: false },
            refreshToken: { type: String, select: false },
            expiresAt: Date,
            icalUrl: { type: String, select: false }, // Brightspace feed link
        },

        // Google Calendar push channel (renewed by a scheduler before it expires)
        watchChannel: {
            id: String,
            resourceId: String,
            expiresAt: Date,
        },
        calendarId: String, // which Google calendar Oroom writes blocks into
        syncToken: String, // Google incremental sync token

        inboundAddress: String, // forwarding address, for provider 'email'

        lastSyncedAt: Date,
        lastError: String,
    },
    { timestamps: true },
);

// One connection per provider per user
connectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.model('Connection', connectionSchema);
