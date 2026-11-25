import mongoose from 'mongoose';

// One run of the timer on a task.
const timerSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },

        startedAt: { type: Date, required: true },
        endedAt: Date, // empty while the timer is running
        durationSeconds: Number, // filled in when stopped
    },
    { timestamps: true },
);

timerSessionSchema.index({ userId: 1, taskId: 1 });

export default mongoose.model('TimerSession', timerSessionSchema);
