import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { manualMongoSanitize } from './middleware/sanitize.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './docs/swagger.js';

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.'
});
app.use('/api', limiter);

app.use(manualMongoSanitize);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

morganBody(app, {
  noColors: true,
  skip: (req, res) => res.statusCode < 500,
  stream: loggerStream
});

app.use('/uploads', express.static('uploads'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'Bienvenido a la API de BildyApp'
  });
});

app.get('/api/test-slack', (req, res, next) => {
  next(new Error('Esto es una prueba de error crítico (500) para comprobar que Slack funciona correctamente.'));
});

app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
