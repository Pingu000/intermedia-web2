import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configuramos Cloudinary con las credenciales del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Sube un archivo a Cloudinary desde su ruta local y devuelve la URL publica
export const uploadToCloudinary = async (filePath, folder = 'bildyapp') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto' // acepta imagenes y PDFs
  });
  return result.secure_url;
};

// Sube un buffer en memoria (para cuando usamos multer con memoryStorage)
export const uploadBufferToCloudinary = (buffer, folder = 'bildyapp', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: options.folder || folder, 
        resource_type: options.resourceType || 'auto', 
        ...options 
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // Devolvemos directamente la secure_url
      }
    );

    // Convertir buffer a stream y enviarlo (Código de clase)
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// Borra un archivo de Cloudinary por su URL publica
export const deleteFromCloudinary = async (url) => {
  // Extraemos el public_id de la URL (es la parte entre la carpeta y la extension)
  const parts = url.split('/');
  const fileName = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${fileName}`;

  await cloudinary.uploader.destroy(publicId);
};
