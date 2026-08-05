import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadBuffer = async (buffer: Buffer, mimetype: string): Promise<string> => {
  const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(base64, {
    folder: 'social-app',
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  });
  return result.secure_url;
};
