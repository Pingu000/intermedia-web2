import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError.js';

// Aseguramos que la carpeta uploads exista físicamente para que multer no tire error
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar un sufijo para evitar que dos archivos de diferente persona se sobreescriban
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// Filtro de seguridad (Solo permitimos enviar imágenes reales)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('El archivo adjunto debe ser una imagen.'), false);
  }
};

// Exportamos el middleware listo para ponerse en cualquier ruta
export const uploadLogo = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 Megabytes
  }
});
