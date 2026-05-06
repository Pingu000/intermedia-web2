import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw AppError.unauthorized('No has iniciado sesión, token no proporcionado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser || currentUser.deleted) {
      throw AppError.unauthorized('El usuario de este token ya no existe o fue eliminado');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(AppError.unauthorized('Token JWT inválido'));
    } else if (error.name === 'TokenExpiredError') {
      next(AppError.unauthorized('Tu sesión ha expirado, vuelve a iniciar sesión'));
    } else {
      next(error);
    }
  }
};
