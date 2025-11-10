import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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
router.get('/file/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
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

    // Return the filename (frontend will construct full URL)
    res.json({
      success: true,
      cid: req.file.filename, // Use filename as CID for backward compatibility
      filename: req.file.filename,
      message: 'Logo uploaded successfully',
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

    // Return the filename (frontend will construct full URL)
    res.json({
      success: true,
      cid: req.file.filename, // Use filename as CID for backward compatibility
      filename: req.file.filename,
      message: 'Banner uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

