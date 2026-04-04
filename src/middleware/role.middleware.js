import { AppError } from '../utils/AppError.js';

// Middleware para restringir el acceso basándonos en los roles ('admin' o 'guest') - Visto en T7
export const restrictTo = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Siempre asumimos que este middleware va *después* de auth.middleware, por lo que req.user ya existe
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return next(AppError.forbidden('No tienes permiso para acceder a esta ruta.'));
    }
    
    next();
  };
};
