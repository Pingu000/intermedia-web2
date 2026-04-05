import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * Obtener perfil del usuario actual - GET /api/user
 */
export const getUser = async (req, res, next) => {
  try {
    // Extraemos el id del usuario que ya pasó por el middleware requireAuth
    const userId = req.user._id;

    // Buscamos al usuario en la base de datos.
    // Usamos .populate('company') para que Mongoose reemplace el ObjectId por los datos reales de la empresa (T5).
    // Nota: El 'fullName' aparecerá solo en la respuesta porque configuramos toJSON: { virtuals: true } en el modelo.
    const userProfile = await User.findById(userId).populate('company');
    
    if (!userProfile || userProfile.deleted) {
      throw AppError.notFound('Usuario');
    }

    res.status(200).json({
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
};
