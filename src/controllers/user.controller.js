import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { notificationService } from '../services/notification.service.js';
import { uploadToCloudinary } from '../services/storage.service.js';

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
    const { name, lastName, nif } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, lastName, nif },
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

    if (!emails) {
      throw AppError.badRequest('Debes proporcionar los correos separados por comas (Ej: ?emails=uno@test.com,dos@test.com)');
    }

    if (!currentUser.company) {
      throw AppError.badRequest('Debes pertenecer a una empresa antes de poder invitar a compañeros.');
    }

    const bcrypt = (await import('bcryptjs')).default;
    const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
    const usuariosCreados = [];

    for (const email of emailList) {
      // Comprobamos que no exista ya ese email en la BD
      const existe = await User.findOne({ email });
      if (existe) continue;

      // Generamos una contraseña temporal aleatoria para el invitado
      const passwordTemporal = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordTemporal, salt);

      const nuevoUsuario = await User.create({
        email,
        password: hashedPassword,
        name: 'Pendiente',
        lastName: 'Pendiente',
        role: 'guest', // Los invitados siempre entran como guest
        company: currentUser.company,
        verificationCode: Math.floor(100000 + Math.random() * 900000).toString()
      });

      notificationService.emit('user:invited', {
        email: nuevoUsuario.email,
        companyId: currentUser.company
      });

      usuariosCreados.push(nuevoUsuario.email);
    }

    res.status(200).json({
      message: 'Invitaciones enviadas correctamente',
      invitados: usuariosCreados
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Onboarding Empresa (Creación o vinculación) - PATCH /api/user/company
 */
export const setupCompany = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, cif, isFreelance, address } = req.body;
    
    // Necesitamos el modelo Company para crear/buscar
    const { Company } = await import('../models/index.js');
    const currentUser = await User.findById(userId);

    let companyAsociada;

    if (isFreelance) {
      // 1. Lógica para usuario Autónomo
      companyAsociada = await Company.create({
        owner: userId,
        name: `Freelance de ${currentUser.name || currentUser.email}`,
        isFreelance: true,
        address: address // Opcional
      });
    } else {
      // 2. Lógica para Empresa tradicional
      if (!cif) {
        throw AppError.badRequest('El CIF es obligatorio para crear o unirse a una empresa en modalidad corporativa.');
      }

      // Buscamos si el CIF ya existe en el sistema
      companyAsociada = await Company.findOne({ cif, isFreelance: false });

      if (!companyAsociada) {
        // La empresa no existe, así que la CREAMOS y asignamos a este usuario como 'owner'
        if (!name) throw AppError.badRequest('Debes indicar el nombre de la empresa al registrarla por primera vez.');
        
        companyAsociada = await Company.create({
          owner: userId,
          name: name,
          cif: cif,
          isFreelance: false,
          address: address
        });
      }
      // Si ya existía, el usuario se une como 'guest' (no es el dueño)
      currentUser.role = 'guest';
    }

    // Atamos la empresa al perfil del usuario
    currentUser.company = companyAsociada._id;
    await currentUser.save();

    res.status(200).json({
      user: currentUser,
      company: companyAsociada
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Subir logo de empresa - PATCH /api/user/logo
 */
export const updateCompanyLogo = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Como multer va en la ruta antes que en el controlador, si todo ha ido bien, el archivo ya está en req.file
    if (!req.file) {
      throw AppError.badRequest('No has proporcionado ninguna imagen o el campo no se llama "logo".');
    }

    const { Company } = await import('../models/index.js');
    const currentUser = await User.findById(userId);

    // Verificamos si realmente pertenece a una empresa antes de cambiar un logo
    if (!currentUser.company) {
      throw AppError.badRequest('No perteneces a ninguna empresa actualmente. Únete a una antes de subir un logo.');
    }

    // Subimos la imagen a Cloudinary y obtenemos la URL publica
    const logoUrl = await uploadToCloudinary(req.file.path, 'bildyapp/logos');

    const updatedCompany = await Company.findByIdAndUpdate(
      currentUser.company,
      { logo: logoUrl },
      { new: true }
    );

    // Devolvemos el campo logo como exige el enunciado
    res.status(200).json({ 
      message: 'Logo de empresa actualizado correctamente',
      logo: updatedCompany.logo 
    });
  } catch (error) {
    next(error);
  }
};
