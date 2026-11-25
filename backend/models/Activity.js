import mongoose from 'mongoose';

// Append-only log of what happened ("Synced 3 items from Brightspace", "Rescheduled Essay").
const activitySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, required: true }, // e.g. 'sync.completed', 'task.rescheduled'
        message: String,
        entity: {
            kind: { type: String, enum: ['Task', 'Suggestion', 'Connection', 'CalendarEvent', 'Note'] },
            id: mongoose.Schema.Types.ObjectId,
        },
        data: mongoose.Schema.Types.Mixed,
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
