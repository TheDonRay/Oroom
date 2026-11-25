import mongoose from 'mongoose';

// A block of time: a busy event read from the user's calendar, or a work block Oroom booked.
const calendarEventSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection' },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // set for Oroom work blocks

        externalId: String, // Google event id
        createdByOroom: { type: Boolean, default: false }, // Oroom only edits/deletes events where this is true

        title: String,
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },
        allDay: { type: Boolean, default: false },

        status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    },
    { timestamps: true },
);

calendarEventSchema.index({ userId: 1, startAt: 1, endAt: 1 }); // free-slot / overlap queries
calendarEventSchema.index({ connectionId: 1, externalId: 1 }, { unique: true, sparse: true });

export default mongoose.model('CalendarEvent', calendarEventSchema);
