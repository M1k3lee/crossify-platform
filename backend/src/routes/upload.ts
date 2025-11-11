import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { uploadToCloudinary, isCloudinaryConfigured, getCloudinaryUrl } from '../services/cloudinary';

export const router = Router();

// Get uploads directory path (works with both CommonJS and ESM)
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
}

// Initialize uploads directory on module load
ensureUploadsDir().catch(console.error);

// Configure multer to store files in uploads directory
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random hash + original extension
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${hash}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// GET /upload/file/:filename - Serve uploaded images (must be before POST routes)
// Handle OPTIONS preflight requests
router.options('/file/:filename', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://crossify-platform.vercel.app',
    'https://crossify.io',
    'https://www.crossify.io',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ];
  
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(204).end();
});

router.get('/file/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // If filename is a Cloudinary URL, redirect to it
    if (filename.startsWith('http') && filename.includes('cloudinary.com')) {
      return res.redirect(302, filename);
    }
    
    // Check if it's a Cloudinary public_id (starts with crossify/)
    if (filename.startsWith('crossify/')) {
      const cloudinaryUrl = getCloudinaryUrl(filename);
      if (cloudinaryUrl !== filename) {
        return res.redirect(302, cloudinaryUrl);
      }
    }
    
    // Fallback to local file serving (for backward compatibility)
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.error(`❌ File not found: ${filename} (path: ${filePath})`);
      console.error('⚠️ This may be due to Railway ephemeral storage - files are lost on container restart');
      return res.status(404).json({ 
        error: 'File not found',
        message: 'File may have been lost due to container restart (Railway ephemeral storage). Consider using Cloudinary for persistent storage.',
        filename 
      });
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Set CORS headers to allow cross-origin requests
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'https://crossify-platform.vercel.app',
      'https://crossify.io',
      'https://www.crossify.io',
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    ];
    
    // Allow requests from allowed origins or any origin in development
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    // Use absolute path for sendFile
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// POST /upload/logo
router.post('/logo', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      // Delete the uploaded file if it's not an image
      try {
        await fs.unlink(req.file.path);
      } catch {}
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Validate file size (max 5MB for logos)
    if (req.file.size > 5 * 1024 * 1024) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    // Upload to Cloudinary if configured, otherwise use local storage
    if (isCloudinaryConfigured()) {
      try {
        const fileBuffer = await fs.readFile(req.file.path);
        const result = await uploadToCloudinary(fileBuffer, 'logos');
        
        // Clean up local file after Cloudinary upload
        try {
          await fs.unlink(req.file.path);
        } catch {}
        
        // Return Cloudinary URL (store the full URL in database)
        res.json({
          success: true,
          cid: result.secure_url, // Store Cloudinary URL as CID
          filename: result.secure_url, // Store Cloudinary URL as filename
          url: result.secure_url, // Direct URL for immediate use
          public_id: result.public_id, // Cloudinary public ID for future reference
          message: 'Logo uploaded successfully to Cloudinary',
        });
        return;
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
        // Fall through to local storage
      }
    }

    // Fallback to local storage (for backward compatibility or if Cloudinary fails)
    res.json({
      success: true,
      cid: req.file.filename, // Use filename as CID for backward compatibility
      filename: req.file.filename,
      message: 'Logo uploaded successfully (local storage)',
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// POST /upload/banner
router.post('/banner', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Validate file size (max 10MB for banners)
    if (req.file.size > 10 * 1024 * 1024) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
      return res.status(400).json({ error: 'File size must be less than 10MB' });
    }

    // Upload to Cloudinary if configured, otherwise use local storage
    if (isCloudinaryConfigured()) {
      try {
        const fileBuffer = await fs.readFile(req.file.path);
        const result = await uploadToCloudinary(fileBuffer, 'banners');
        
        // Clean up local file after Cloudinary upload
        try {
          await fs.unlink(req.file.path);
        } catch {}
        
        // Return Cloudinary URL (store the full URL in database)
        res.json({
          success: true,
          cid: result.secure_url, // Store Cloudinary URL as CID
          filename: result.secure_url, // Store Cloudinary URL as filename
          url: result.secure_url, // Direct URL for immediate use
          public_id: result.public_id, // Cloudinary public ID for future reference
          message: 'Banner uploaded successfully to Cloudinary',
        });
        return;
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
        // Fall through to local storage
      }
    }

    // Fallback to local storage (for backward compatibility or if Cloudinary fails)
    res.json({
      success: true,
      cid: req.file.filename, // Use filename as CID for backward compatibility
      filename: req.file.filename,
      message: 'Banner uploaded successfully (local storage)',
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

