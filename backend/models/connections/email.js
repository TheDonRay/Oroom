import mongoose from 'mongoose';
import Connection from './base.js';

// Forwarded email: the user forwards mail to a unique Oroom address.
const emailSchema = new mongoose.Schema({
    inboundAddress: { type: String, required: true, lowercase: true, trim: true },
});

// Inbound mail is matched to a user by this address, so it must be unique.
// Partial filter keeps the index to email connections only.
emailSchema.index(
    { inboundAddress: 1 },
    { unique: true, partialFilterExpression: { provider: 'email' } },
);

export default Connection.discriminator('EmailConnection', emailSchema, 'email');
