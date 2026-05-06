import { AppError } from '../utils/AppError.js';

export const restrictTo = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return next(AppError.forbidden('No tienes permiso para acceder a esta ruta.'));
    }

    next();
  };
};
