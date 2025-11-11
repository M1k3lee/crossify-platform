import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param folder - Folder path in Cloudinary (e.g., 'logos', 'banners')
 * @param publicId - Optional public ID (filename without extension)
 * @returns Cloudinary upload result with secure URL
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: 'logos' | 'banners',
  publicId?: string
): Promise<{
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `crossify/${folder}`,
        public_id: publicId,
        resource_type: 'auto', // Automatically detect image/video
        overwrite: false, // Don't overwrite existing files
        transformation: folder === 'banners' 
          ? [
              { width: 1200, height: 400, crop: 'limit' }, // Optimize banner size
              { quality: 'auto:good' }, // Auto quality optimization
            ]
          : [
              { width: 400, height: 400, crop: 'limit' }, // Optimize logo size
              { quality: 'auto:good' },
            ],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            format: result.format || 'unknown',
            width: result.width || 0,
            height: result.height || 0,
            bytes: result.bytes || 0,
          });
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      }
    );

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID or URL
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    // Extract public_id from URL if a full URL is provided
    let actualPublicId = publicId;
    if (publicId.includes('cloudinary.com')) {
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
        // Extract public_id from URL path
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        actualPublicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove extension
      }
    }

    const result = await cloudinary.uploader.destroy(actualPublicId);
    if (result.result === 'ok') {
      console.log(`✅ Deleted from Cloudinary: ${actualPublicId}`);
    } else {
      console.warn(`⚠️ Cloudinary delete result: ${result.result} for ${actualPublicId}`);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

/**
 * Get a Cloudinary URL with transformations
 * @param publicId - Cloudinary public ID or URL
 * @param transformations - Optional Cloudinary transformations
 * @returns Transformed URL
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: any
): string {
  if (!isCloudinaryConfigured()) {
    return publicId; // Return as-is if Cloudinary not configured
  }

  // If it's already a Cloudinary URL, return it
  if (publicId.includes('cloudinary.com')) {
    return publicId;
  }

  // Generate URL with transformations
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
}

