import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Strictly allow raster photos only: JPEG, PNG, WEBP, GIF.
// SVGs are explicitly forbidden for user uploads to prevent Stored XSS attacks via scriptable XML.
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg';
    const randomHex = Math.random().toString(36).substring(2, 10);
    const safeName = `item_${Date.now()}_${randomHex}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Reject SVG explicitly
  if (file.mimetype.toLowerCase().includes('svg') || ext === '.svg') {
    cb(new Error('SVG files are not permitted for security reasons. Please upload JPG, PNG, WEBP, or GIF photos.'));
    return;
  }

  const allowedMimes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
  if (allowedMimes.has(file.mimetype.toLowerCase()) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image format (${file.mimetype}). Only JPEG, PNG, WEBP, and GIF images are accepted.`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5, // Maximum 5 images per listing
  },
  fileFilter,
});

/**
 * Validate image buffer headers (Magic Bytes) to verify real image contents
 * and prevent extension/MIME spoofing.
 */
export function verifyImageMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // GIF: GIF87a or GIF89a
    const gifHeader = buffer.toString('ascii', 0, 6);
    if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
      return true;
    }

    // WEBP: RIFF....WEBP
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    if (riff === 'RIFF' && webp === 'WEBP') {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Clean up an array of Multer files from disk on failure.
 */
export function cleanupFiles(files?: Express.Multer.File[]): void {
  if (!files || files.length === 0) return;
  for (const file of files) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error(`Failed to clean up file ${file.path}:`, err);
    }
  }
}

/**
 * Delete a specific file in the uploads directory safely.
 */
export function removeUploadedFile(relativeOrFilename: string): void {
  try {
    const filename = path.basename(relativeOrFilename);
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error(`Failed to remove file ${relativeOrFilename}:`, err);
  }
}
