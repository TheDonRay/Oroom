import mongoose from 'mongoose';

// A person who signs in with Google. Every other model points back here via userId.
const userSchema = new mongoose.Schema(
    {
        googleId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, trim: true },
        avatarUrl: String,
        timezone: { type: String, default: 'America/Toronto' }, // IANA name, used by the scheduler

        settings: {
            autoApprove: { type: Boolean, default: false }, // skip the Suggestion review step
            workingHours: {
                start: { type: String, default: '09:00' }, // "HH:mm" in the user's timezone
                end: { type: String, default: '22:00' },
            },
            reminderMinutesBefore: { type: Number, default: 30 },
            dailySummary: { type: Boolean, default: true }, // 7:00 summary email
        },

        // TODO: plan / subscription status once billing is in scope
        // This is adding onto stripe user's payment. 
    },
    { timestamps: true },
);

export default mongoose.model('User', userSchema);
