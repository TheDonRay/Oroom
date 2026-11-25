import mongoose from 'mongoose';

// A typed note or uploaded PDF. Uploads also create a SourceItem so tasks can be extracted.
const noteSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // optional link
        sourceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'SourceItem' },

        title: { type: String, trim: true },
        body: String, // typed notes

        file: {
            key: String, // S3 object key
            name: String,
            mimeType: String,
            size: Number,
        },

        tags: [String], // embedded: no separate collection needed
    },
    { timestamps: true },
);

export default mongoose.model('Note', noteSchema);
