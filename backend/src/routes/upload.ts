import { Router, Request, Response } from 'express';
import multer from 'multer';

export const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST /upload/logo
router.post('/logo', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    // For MVP: Generate a mock hash-based ID (in production, use Pinata or similar)
    // This allows the app to work without IPFS setup
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const mockCid = `mock_${hash.substring(0, 16)}`; // Mock CID format
    
    // Store file info (in production, upload to IPFS/Pinata here)
    // For now, we'll return a mock CID that can be used as a placeholder

    res.json({
      success: true,
      cid: mockCid,
      message: 'Logo uploaded successfully (mock storage - use IPFS service for production)',
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

