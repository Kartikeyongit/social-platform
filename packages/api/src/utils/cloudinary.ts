import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dibovl6kv',
  api_key: process.env.CLOUDINARY_API_KEY || '271466534784918',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'k5si7SFQPtlxKjIVT6CJTfmfF4M',
});

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'social-app',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
