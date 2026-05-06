import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateTokens } from '../utils/token.js';
import { notificationService } from '../services/notification.service.js';
import { mailService } from '../services/mail.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.conflict('El email ingresado ya está asociado a una cuenta.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      lastName,
      verificationCode: validationCode,
      role: 'admin'
    });

    const { accessToken, refreshToken } = generateTokens(newUser);

    console.log(`[VALIDACION] Código para ${newUser.email}: ${validationCode}`);

    await mailService.sendValidationCode(newUser.email, validationCode);

    notificationService.emit('user:registered', { email: newUser.email });

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

export const validateEmail = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { code } = req.body;

    if (currentUser.verificationAttempts <= 0) {
      throw AppError.tooManyRequests('Has agotado el número de intentos máximos (3).');
    }

    if (currentUser.verificationCode !== code) {
      currentUser.verificationAttempts -= 1;
      await currentUser.save();
      throw AppError.badRequest(`Código incorrecto. Te quedan ${currentUser.verificationAttempts} intento(s).`);
    }

    currentUser.status = 'verified';
    currentUser.verificationCode = undefined;
    await currentUser.save();

    notificationService.emit('user:verified', { email: currentUser.email });

    res.status(200).json({ message: 'Validación completada con éxito. Ya puedes acceder a todas las funciones.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const currentUser = await User.findOne({ email });
    if (!currentUser || currentUser.deleted) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    const isMatch = await bcrypt.compare(password, currentUser.password);
    if (!isMatch) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    const { accessToken, refreshToken } = generateTokens(currentUser);

    currentUser.refreshTokens.push(refreshToken);
    await currentUser.save();

    res.status(200).json({
      user: {
        email: currentUser.email,
        status: currentUser.status,
        role: currentUser.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw AppError.unauthorized('Se requiere el refresh token en el cuerpo de la petición');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw AppError.unauthorized('Refresh token caducado o inválido');
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser || !currentUser.refreshTokens.includes(refreshToken)) {
      throw AppError.unauthorized('El token ya fue invalidado o el usuario no existe');
    }

    const { accessToken } = generateTokens(currentUser);

    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      currentUser.refreshTokens = currentUser.refreshTokens.filter(t => t !== refreshToken);
    } else {
      currentUser.refreshTokens = [];
    }

    await currentUser.save();

    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};
