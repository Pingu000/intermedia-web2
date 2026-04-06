import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { notificationService } from '../services/notification.service.js';

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

/**
 * Borrar cuenta - DELETE /api/user?soft=true|false
 */
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Si req.query.soft existe y es estrictamente igual al texto "true"
    const isSoftDelete = req.query.soft === 'true';

    const currentUser = await User.findById(userId);

    // Ocultamos la cuenta en vez de borrarla
    if (isSoftDelete) {
      currentUser.deleted = true;
      await currentUser.save();
    } else {
      // Borrado definitivo de la BBDD
      await User.findByIdAndDelete(userId);
    }

    // Emitimos el evento y le pasamos en los datos si ha sido definitivo o no
    notificationService.emit('user:deleted', { 
      email: currentUser.email, 
      softDelete: isSoftDelete 
    });

    res.status(200).json({ 
      message: isSoftDelete 
        ? 'Cuenta desactivada (Soft Delete)' 
        : 'Cuenta eliminada permanentemente de la base de datos' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar datos personales (Onboarding) - PUT /api/user/register
 */
export const updatePersonalData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Los parsea de forma segura el validador Zod de las rutas
    const { name, lastName } = req.body;

    // findByIdAndUpdate devuelve el documento y aplicamos 'new: true' para que devuelva la versión recién actualizada (requerimiento)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, lastName },
      { new: true, runValidators: true }
    );

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

/**
 * Invitar a compañeros - POST /api/user/invite?emails=a@test.com,b@test.com
 */
export const inviteUsers = async (req, res, next) => {
  try {
    const { emails } = req.query;
    const currentUser = req.user;
    
    // Validamos que por lo menos venga la query con algo
    if (!emails) {
      throw AppError.badRequest('Debes proporcionar los correos separados por comas (Ej: ?emails=uno@tes.com,dos@test.com)');
    }

    // Convertimos a array y limpiamos espacios de cada uno
    const emailList = emails.split(',').map(e => e.trim());
    const emailsInvitados = [];

    // Por cada email correcto, lanzamos el evento que pide la práctica
    for (const email of emailList) {
      if (email) {
        notificationService.emit('user:invited', {
          email: email,
          companyId: currentUser.company || 'Temporal'
        });
        emailsInvitados.push(email);
      }
    }

    res.status(200).json({ 
      message: 'Invitaciones enviadas correctamente',
      invitados: emailsInvitados
    });
  } catch (error) {
    next(error);
  }
};
