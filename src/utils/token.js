import jwt from 'jsonwebtoken';

// Pequeña utilidad para no repetir esta lógica en login y registro.
export const generateTokens = (user) => {
  // El Access Token caduca rápido por seguridad (15 minutos como pide el enunciado)
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  // El Refresh Token vive más tiempo para poder renovar la sesión de forma invisible
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
