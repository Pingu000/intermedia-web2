import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler, notFound } from './middleware/error-handler.js';

// No importamos routes todavía porque no las hemos creado, lo haremos en un commit posterior.

const app = express();

// ============================================
// Seguridad (Helmet, Rate Limit, Sanitize) - Requisito T6
// ============================================

// Helmet nos protege agregando cabeceras HTTP de seguridad
app.use(helmet());

// Rate limit para prevenir ataques de fuerza bruta (ej: 100 peticiones cada 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.'
});
app.use('/api', limiter); // Solo limitamos las rutas /api

// Protección contra inyecciones NoSQL
app.use(mongoSanitize());

// ============================================
// Middleware globales
// ============================================

app.use(cors()); // Para que nuestro frontal pueda consumir la API
app.use(express.json()); // Para parsear el body en formato JSON
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (para cuando subamos los logos con multer)
app.use('/uploads', express.static('uploads'));

// ============================================
// Rutas (Temporales hasta crear user.routes.js)
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Bienvenido a la API de BildyApp'
  });
});

// AQUI IREMOS METIENDO LAS RUTAS (Ej: app.use('/api/user', userRoutes))

// ============================================
// Manejo de errores
// ============================================

// Siempre al final de todo para atrapar lo que las rutas no atraparon
app.use(notFound);       // Si llega aquí, es que no hizo 'match' con ninguna ruta exitosa
app.use(errorHandler);   // Si alguna ruta hizo throw AppError, cae aquí

export default app;
