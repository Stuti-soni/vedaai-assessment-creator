import express from 'express';
import cors from 'cors';
import { assignmentRoutes } from './routes/assignment.routes';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export { app };
