import mongoose from 'mongoose';
import Connection from './base.js';

// Google Calendar: OAuth tokens (in base credentials) + push channel and sync state.
const googleCalendarSchema = new mongoose.Schema({
    // Push channel, renewed by a scheduler before it expires
    watchChannel: {
        id: String,
        resourceId: String,
        expiresAt: Date,
    },
    calendarId: String, // which Google calendar Oroom writes blocks into
    syncToken: String, // Google incremental sync token
});

export default Connection.discriminator('GoogleCalendarConnection', googleCalendarSchema, 'google_calendar');
