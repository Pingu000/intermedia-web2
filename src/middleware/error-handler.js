import { AppError } from '../utils/AppError.js';
import { sendSlackError } from '../utils/handleLogger.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Error interno del servidor';
  let details = err.details || undefined;

  // Si es un error 5XX lo mandamos a Slack con todos los detalles que pide el enunciado
  if (statusCode >= 500) {
    sendSlackError(err, req);
  }

  // Manejo de errores propios de Mongoose (como duplicados si nos olvidamos atraparlos en el code)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'El registro ya existe (duplicado en la BD)';
  }

  res.status(statusCode).json({
    status: 'error',
    code,
    message,
    ...(details && { details }) // Solo añade details si existe
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: 'La ruta solicitada no existe',
  });
};
