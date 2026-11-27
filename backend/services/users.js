import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

// Clerk sends the same user in two shapes: snake_case in webhooks, camelCase from its API.
// Both are mapped to the fields our User model stores.

export function profileFromWebhook(data) {
    const primary = data.email_addresses?.find((e) => e.id === data.primary_email_address_id);
    return {
        clerkId: data.id,
        email: primary?.email_address,
        name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
        avatarUrl: data.image_url,
    };
}

function profileFromApi(user) {
    return {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
        avatarUrl: user.imageUrl,
    };
}

// Create the user if new, otherwise update their profile. Settings and billing are left alone.
export async function upsertUserFromClerk({ clerkId, email, name, avatarUrl }) {
    if (!email) {
        throw new Error(`Clerk user ${clerkId} has no primary email; email must be required at sign-up`);
    }
    return User.findOneAndUpdate(
        { clerkId },
        { $set: { email, name, avatarUrl } },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    );
}

// Fallback for requireAuth: the user is signed in but the user.created webhook
// hasn't arrived (or failed). Fetch them from Clerk and create them now.
export async function provisionUserFromClerk(clerkId) {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    return upsertUserFromClerk(profileFromApi(clerkUser));
}

// TODO: also delete the user's Tasks, Connections, etc. once those features exist
export async function deleteUserByClerkId(clerkId) {
    return User.findOneAndDelete({ clerkId });
}
