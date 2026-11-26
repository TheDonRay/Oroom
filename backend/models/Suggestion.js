import mongoose from 'mongoose';

// What Claude proposes from a SourceItem. The user approves or skips it (or autoApprove does).
const suggestionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        sourceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'SourceItem', required: true },

        title: { type: String, required: true },
        description: String,
        dueAt: Date,
        estimatedMinutes: Number,
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        confidence: { type: Number, min: 0, max: 1 }, // from the AI output

        status: {
            type: String,
            enum: ['pending', 'approved', 'skipped'],
            default: 'pending',
        },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // set once approved
    },
    { timestamps: true },
);

suggestionSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Suggestion', suggestionSchema);
