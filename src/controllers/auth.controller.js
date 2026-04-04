import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateTokens } from '../utils/token.js';
import { notificationService } from '../services/notification.service.js';

/**
 * 1) Registro de usuario - POST /api/user/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name, lastName } = req.body; // Ya está validado y "transformado" mediante Zod en nuestro middleware

    // Verificamos conflicto de email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.conflict('El email ingresado ya está asociado a una cuenta.');
    }

    // Hasheamos la contraseña con bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generamos un código numérico de 6 cifras aleatorio
    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Creamos el documento en base de datos
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      lastName,
      verificationCode: validationCode,
      role: 'admin' // El enunciado exige 'admin' por defecto al inicio
    });

    // Generamos ambos tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Lanzamos el evento correspondiente (Requisito de T2)
    notificationService.emit('user:registered', { email: newUser.email });

    // Devolvemos el status 201 (Created) con la info requerida
    res.status(201).json({
      user: {
        email: newUser.email,
        status: newUser.status,
        role: newUser.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2) Validación del email - PUT /api/user/validation
 */
export const validateEmail = async (req, res, next) => {
  try {
    // Este middleware requiere "requireAuth", así que req.user tiene al emisor real del token JWT
    const currentUser = req.user;
    const { code } = req.body;

    // Protegemos el uso excesivo antes de comprobar
    if (currentUser.verificationAttempts <= 0) {
      throw AppError.tooManyRequests('Has agotado el número de intentos máximos (3).');
    }

    // Comparamos los códigos
    if (currentUser.verificationCode !== code) {
      currentUser.verificationAttempts -= 1;
      await currentUser.save();
      throw AppError.badRequest(`Código incorrecto. Te quedan ${currentUser.verificationAttempts} intento(s).`);
    }

    // Si acertó, validamos, emitimos y limpiamos el código
    currentUser.status = 'verified';
    currentUser.verificationCode = undefined;
    await currentUser.save();

    notificationService.emit('user:verified', { email: currentUser.email });

    res.status(200).json({ message: 'Validación completada con éxito. Ya puedes acceder a todas las funciones.' });
  } catch (error) {
    next(error);
  }
};
