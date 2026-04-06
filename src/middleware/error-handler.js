// Middleware centralizado de errores, atrapa todo lo que tiremos con AppError o fallas internas (T6)
import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  // Por defecto, si no es una instancia de AppError, asumimos internal (500)
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Error interno del servidor';
  let details = err.details || undefined;

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
