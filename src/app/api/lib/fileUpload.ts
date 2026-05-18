import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

const hasCloudinaryCredentials = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export function validateImageType(file: File): boolean {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  return allowedMimeTypes.includes(file.type || '');
}

export async function uploadToCloudinary(
  file: File,
  folder: string,
  transformation?: Record<string, unknown> | Array<Record<string, unknown>>
): Promise<string> {
  if (!hasCloudinaryCredentials) {
    throw new Error('Cloudinary not configured');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    transformation,
    resource_type: 'auto',
  });

  return result.secure_url;
}

export async function uploadToLocal(
  file: File,
  uploadDir: string,
  filenamePrefix: string
): Promise<string> {
  const uploadsPath = path.join(process.cwd(), 'public', uploadDir);
  
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.name);
  const filename = `${filenamePrefix}-${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadsPath, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  return `/${uploadDir}/${filename}`;
}

export async function handleFileUpload(
  file: File,
  type: 'logo' | 'og-image' | 'favicon'
): Promise<string> {
  if (!validateImageType(file)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and SVG files are allowed.');
  }

  if (hasCloudinaryCredentials) {
    const folders = {
      logo: 'ai-tool-finder/site/logos',
      'og-image': 'ai-tool-finder/site/og-images',
      favicon: 'ai-tool-finder/site/favicons',
    };

    const transformations = {
      logo: [{ width: 500, crop: 'limit' }],
      'og-image': [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }],
      favicon: [{ width: 64, crop: 'limit' }],
    };

    return await uploadToCloudinary(file, folders[type], transformations[type]);
  } else {
    const uploadDirs = {
      logo: 'uploads/logos',
      'og-image': 'uploads/og-images',
      favicon: 'uploads/favicons',
    };

    const prefixes = {
      logo: 'logo',
      'og-image': 'og-image',
      favicon: 'favicon',
    };

    return await uploadToLocal(file, uploadDirs[type], prefixes[type]);
  }
}
