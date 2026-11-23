import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

    await mongoose.connect(env.MONGO_URI, {
        dbName: env.MONGO_DB_NAME,
        serverSelectionTimeoutMS: 10000, // fail fast instead of hanging if Atlas is unreachable
    });

    const { host, name } = mongoose.connection;
    console.log(`MongoDB connected: ${host}/${name}`);
}

export async function disconnectDB() {
    await mongoose.connection.close();
}
