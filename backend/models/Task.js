import mongoose from 'mongoose';

// Something the user has to do. Comes from an approved Suggestion or is created manually.
const taskSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        origin: { type: String, enum: ['suggestion', 'manual'], required: true },
        suggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Suggestion' },
        sourceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'SourceItem' }, // to react to source changes

        title: { type: String, required: true, trim: true },
        description: String,
        course: String,
        dueAt: Date,
        estimatedMinutes: Number,
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

        status: {
            type: String,
            enum: ['todo', 'scheduled', 'in_progress', 'done', 'cancelled'],
            default: 'todo',
        },
        completedAt: Date,

        // Embedded instead of a separate collection: always read together with the task
        subtasks: [
            {
                title: { type: String, required: true },
                done: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true },
);

taskSchema.index({ userId: 1, status: 1, dueAt: 1 });

export default mongoose.model('Task', taskSchema);
