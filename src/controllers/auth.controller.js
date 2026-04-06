import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

    // Imprimimos el código en consola para poder validar el email en desarrollo (en producción llegaría por email)
    console.log(`[VALIDACION] Código para ${newUser.email}: ${validationCode}`);

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

/**
 * 3) Login - POST /api/user/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscamos al usuario. Como password suele estar en "select: false" si lo hubiéramos configurado así, por precaución comprobamos directo
    const currentUser = await User.findOne({ email });
    if (!currentUser || currentUser.deleted) {
      throw AppError.unauthorized('Credenciales incorrectas'); // Usamos mensaje genérico por seguridad
    }

    // Comparamos el hash de bcrypt
    const isMatch = await bcrypt.compare(password, currentUser.password);
    if (!isMatch) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    // Generamos tokens
    const { accessToken, refreshToken } = generateTokens(currentUser);

    // Guardamos el refresh token activo en la BBDD
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

/**
 * 7) Refresh token - POST /api/user/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw AppError.unauthorized('Se requiere el refresh token en el cuerpo de la petición');
    }

    // Verificamos matemáticamente que el JWT es válido y no expiró
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw AppError.unauthorized('Refresh token caducado o inválido');
    }

    // Comprobamos que el token realmente esté en la lista de tokens válidos del usuario (por si hizo logout en otro lado)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser || !currentUser.refreshTokens.includes(refreshToken)) {
      throw AppError.unauthorized('El token ya fue invalidado o el usuario no existe');
    }

    // Generamos un nuevo Access Token (y podríamos rotar el refresh, pero devolveremos un nuevo access por ahora)
    const { accessToken } = generateTokens(currentUser);

    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * 7) Logout - POST /api/user/logout
 */
export const logout = async (req, res, next) => {
  try {
    const currentUser = req.user; // Gracias al middleware requireAuth
    const refreshToken = req.body?.refreshToken; // Opcional: el cliente puede mandarnos cuál token revocar
    
    if (refreshToken) {
      // Borramos ESE refresh token concreto (cerrar sesión en este dispositivo)
      currentUser.refreshTokens = currentUser.refreshTokens.filter(t => t !== refreshToken);
    } else {
      // Si no nos pasan token, cerramos todas sus sesiones en todas partes
      currentUser.refreshTokens = [];
    }
    
    await currentUser.save();
    
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};
