import express from 'express';
import { handleClerkWebhook } from '../controllers/clerkWebhookController.js';

// Mounted at /webhooks in app.js, BEFORE express.json().
// Each route reads the body as a raw Buffer, because signature checks need the exact bytes sent.
const router = express.Router();

router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

export default router;
