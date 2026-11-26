import mongoose from 'mongoose';
import { PROVIDERS } from './Connection.js';

// The raw thing pulled from a source (an iCal event, an email, an uploaded PDF), before AI extraction.
const sourceItemSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection' }, // empty for uploads
        source: {
            type: String,
            enum: [...PROVIDERS, 'upload'], // stays in sync with the connectors in Connection.js
            required: true,
        },

        externalId: { type: String, required: true }, // id in the source system, used to dedupe
        contentHash: String, // detects when the source item changed

        title: String,
        rawContent: String, // text body / description
        fileKey: String, // S3 key for PDFs and attachments
        dueAt: Date,
        metadata: mongoose.Schema.Types.Mixed, // anything source-specific

        status: {
            type: String,
            enum: ['pending', 'extracted', 'failed', 'removed'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

// "No duplicates": the same external item is saved once per user + source
sourceItemSchema.index({ userId: 1, source: 1, externalId: 1 }, { unique: true });

export default mongoose.model('SourceItem', sourceItemSchema);
