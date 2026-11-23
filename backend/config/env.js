import { z } from 'zod';

// Validates process.env once at startup (Node loads .env via --env-file).
// Import `env` from here instead of reading process.env elsewhere.
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    MONGO_URI: z
        .string({ error: 'MONGO_URI is required (copy it from Atlas → Connect → Drivers)' })
        .regex(/^mongodb(\+srv)?:\/\//, 'MONGO_URI must start with mongodb:// or mongodb+srv://'),
    MONGO_DB_NAME: z.string().min(1).default('oroom'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = {
    ...parsed.data,
    isProduction: parsed.data.NODE_ENV === 'production',
};
