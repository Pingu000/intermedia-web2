import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token;
    
    // Obtenemos el token de la cabecera Authorization (Bearer) tal y como indica el enunciado
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      throw AppError.unauthorized('No has iniciado sesión, token no proporcionado');
    }
    
    // Verificamos el token con el secreto indicado en .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Localizamos al usuario en BBDD. Usamos select para traer la info sin la contraseña para no arrastrarla por seguridad (T5)
    const currentUser = await User.findById(decoded.id).select('-password');
    
    if (!currentUser || currentUser.deleted) {
      throw AppError.unauthorized('El usuario de este token ya no existe o fue eliminado');
    }
    
    // Guardamos el objeto user entero en la request para que los controladores puedan usar su ID o Role
    req.user = currentUser;
    next();
  } catch (error) {
    // Interceptamos los propios errores de la libería jsonwebtoken
    if (error.name === 'JsonWebTokenError') {
      next(AppError.unauthorized('Token JWT inválido'));
    } else if (error.name === 'TokenExpiredError') {
      next(AppError.unauthorized('Tu sesión ha expirado, vuelve a iniciar sesión'));
    } else {
      next(error); // Si cae aquí normalmente es un AppError nuestro
    }
  }
};
