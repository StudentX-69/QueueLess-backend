import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getCorsOptions } from './utils/cors.js';

const app = express();
const noopIo = {
  to: () => noopIo,
  emit: () => {},
};

app.set('io', noopIo);

app.use(helmet());
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'QueueLess API' }));
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/queues', queueRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
