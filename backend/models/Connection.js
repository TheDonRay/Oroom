// A source the user has linked: Google Calendar, Brightspace iCal feed, forwarded email.
//
// To add a connector (e.g. Canvas, Slack):
//   1. Create models/connections/<name>.js with a schema for its own fields and
//      `Connection.discriminator('<Name>Connection', schema, '<provider_key>')`.
//   2. Add it to `connectionModels` below.
// The shared fields, indexes, and the PROVIDERS list used by other models update from there.
import Connection from './connections/base.js';
import GoogleCalendarConnection from './connections/googleCalendar.js';
import BrightspaceConnection from './connections/brightspace.js';
import EmailConnection from './connections/email.js';

const connectionModels = {
    google_calendar: GoogleCalendarConnection,
    brightspace: BrightspaceConnection,
    email: EmailConnection,
};

export const PROVIDERS = Object.keys(connectionModels);

// Use this to create a connection so the right provider fields are validated:
//   await connectionModelFor('brightspace').create({ userId, icalUrl })
export function connectionModelFor(provider) {
    const model = connectionModels[provider];
    if (!model) throw new Error(`Unknown connection provider: ${provider}`);
    return model;
}

export { GoogleCalendarConnection, BrightspaceConnection, EmailConnection };
export default Connection;
