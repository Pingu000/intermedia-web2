import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { notificationService } from '../services/notification.service.js';
import { uploadToCloudinary } from '../services/storage.service.js';

export const getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;

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

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      throw AppError.badRequest('La nueva contraseña debe ser diferente a la que ya usas.');
    }

    const currentUser = await User.findById(userId);

    const bcrypt = (await import('bcryptjs')).default;

    const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
    if (!isMatch) {
      throw AppError.unauthorized('La contraseña actual es incorrecta.');
    }

    const salt = await bcrypt.genSalt(10);
    currentUser.password = await bcrypt.hash(newPassword, salt);
    await currentUser.save();

    res.status(200).json({ message: 'Se ha cambiado la contraseña correctamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isSoftDelete = req.query.soft === 'true';

    const currentUser = await User.findById(userId);

    if (isSoftDelete) {
      currentUser.deleted = true;
      await currentUser.save();
    } else {
      await User.findByIdAndDelete(userId);
    }

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
      const existe = await User.findOne({ email });
      if (existe) continue;

      const passwordTemporal = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordTemporal, salt);

      const nuevoUsuario = await User.create({
        email,
        password: hashedPassword,
        name: 'Pendiente',
        lastName: 'Pendiente',
        role: 'guest',
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

export const setupCompany = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, cif, isFreelance, address } = req.body;

    const { Company } = await import('../models/index.js');
    const currentUser = await User.findById(userId);

    let companyAsociada;

    if (isFreelance) {
      companyAsociada = await Company.create({
        owner: userId,
        name: `Freelance de ${currentUser.name || currentUser.email}`,
        isFreelance: true,
        address: address
      });
    } else {
      if (!cif) {
        throw AppError.badRequest('El CIF es obligatorio para crear o unirse a una empresa en modalidad corporativa.');
      }

      companyAsociada = await Company.findOne({ cif, isFreelance: false });

      if (!companyAsociada) {
        if (!name) throw AppError.badRequest('Debes indicar el nombre de la empresa al registrarla por primera vez.');

        companyAsociada = await Company.create({
          owner: userId,
          name: name,
          cif: cif,
          isFreelance: false,
          address: address
        });
      }
      currentUser.role = 'guest';
    }

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

export const updateCompanyLogo = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      throw AppError.badRequest('No has proporcionado ninguna imagen o el campo no se llama "logo".');
    }

    const { Company } = await import('../models/index.js');
    const currentUser = await User.findById(userId);

    if (!currentUser.company) {
      throw AppError.badRequest('No perteneces a ninguna empresa actualmente. Únete a una antes de subir un logo.');
    }

    const logoUrl = await uploadToCloudinary(req.file.path, 'bildyapp/logos');

    const updatedCompany = await Company.findByIdAndUpdate(
      currentUser.company,
      { logo: logoUrl },
      { new: true }
    );

    res.status(200).json({
      message: 'Logo de empresa actualizado correctamente',
      logo: updatedCompany.logo
    });
  } catch (error) {
    next(error);
  }
};
