import express from 'express';
import healthRouter from './routes/health.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use('/api/node', healthRouter);
app.use((_request, response) => {
    response.status(404).json({ error: 'Not found' });
});

export default app;