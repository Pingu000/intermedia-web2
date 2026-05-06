import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath, folder = 'bildyapp') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto'
  });
  return result.secure_url;
};

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
        else resolve(result.secure_url);
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (url) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${fileName}`;

  await cloudinary.uploader.destroy(publicId);
};
