import mongoose from 'mongoose';

// A person who signs in with Clerk. Every other model points back here via userId.
const userSchema = new mongoose.Schema(
    {
        clerkId: { type: String, required: true, unique: true },
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

        // Filled in by the Stripe webhook; empty until the user first checks out.
        billing: {
            stripeCustomerId: { type: String, unique: true, sparse: true }, // cus_..., used to match webhook events to a user
            stripeSubscriptionId: String, // sub_...
            plan: { type: String, enum: ['free', 'pro'], default: 'free' },
            // Mirrors Stripe's subscription.status; 'none' = never subscribed
            subscriptionStatus: {
                type: String,
                enum: [
                    'none',
                    'trialing',
                    'active',
                    'past_due',
                    'canceled',
                    'unpaid',
                    'incomplete',
                    'incomplete_expired',
                    'paused',
                ],
                default: 'none',
            },
            priceId: String, // which Stripe price they're on
            trialEndsAt: Date,
            currentPeriodEnd: Date, // when access ends if they stop paying
            cancelAtPeriodEnd: { type: Boolean, default: false },
        },
    },
    { timestamps: true },
);

export default mongoose.model('User', userSchema);
