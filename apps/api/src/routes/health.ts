import { Router } from 'express';
import { pool } from '../database/pool.js';

const router = Router();

router.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
});

router.get('/ready', async (_request, response) => {
    try {
        await pool.query('SELECT 1');
        response.json({ status: 'ready', database: 'connected' });
    } catch (error) {
        console.error('Database readiness check failed', error);
        response.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
});

export default router;