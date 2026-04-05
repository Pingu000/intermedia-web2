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

/**
 * Cambiar contraseña - PUT /api/user/password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Tal y como planeamos, validamos manualmente aquí en lugar de usar Zod .refine() para no incluir el Bonus Extra
    if (currentPassword === newPassword) {
      throw AppError.badRequest('La nueva contraseña debe ser diferente a la que ya usas.');
    }

    const currentUser = await User.findById(userId);

    // Importamos dinámicamente bcryptjs si preferimos, o lo pongo arriba. Lo pongo limpio importándolo al vuelo.
    const bcrypt = (await import('bcryptjs')).default;

    // Verificamos que la contraseña original introducida sea la suya de verdad
    const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
    if (!isMatch) {
      throw AppError.unauthorized('La contraseña actual es incorrecta.');
    }

    // Ciframos la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    currentUser.password = await bcrypt.hash(newPassword, salt);
    await currentUser.save();

    res.status(200).json({ message: 'Se ha cambiado la contraseña correctamente.' });
  } catch (error) {
    next(error);
  }
};
