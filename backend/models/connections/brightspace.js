import mongoose from 'mongoose';
import Connection from './base.js';

// Brightspace: the user pastes their calendar's iCal feed link.
const brightspaceSchema = new mongoose.Schema({
    icalUrl: { type: String, required: true, select: false }, // secret: anyone with it can read the feed
});

export default Connection.discriminator('BrightspaceConnection', brightspaceSchema, 'brightspace');
