import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authMiddleware, isDemoMode } from './middleware/auth';
import { usersRouter } from './routes/users';
import { listingsRouter } from './routes/listings';
import { claimsRouter } from './routes/claims';
import { historyRouter } from './routes/history';
import { db, seedDemoData } from './db';

export const app = express();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Security & Parsing Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded images with nosniff and cache control
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  },
}));

// Authenticate session via header or query in Demo Mode
app.use('/api', authMiddleware);

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api', claimsRouter);
app.use('/api', historyRouter);

// Platform stats
app.use('/api/stats', (_req: Request, res: Response) => {
  const total = (db.prepare('SELECT COUNT(*) as count FROM listings').get() as { count: number }).count;
  const lost = (db.prepare("SELECT COUNT(*) as count FROM listings WHERE type = 'lost' AND status != 'resolved'").get() as { count: number }).count;
  const found = (db.prepare("SELECT COUNT(*) as count FROM listings WHERE type = 'found' AND status != 'resolved'").get() as { count: number }).count;
  const resolved = (db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'resolved'").get() as { count: number }).count;
  const claims = (db.prepare('SELECT COUNT(*) as count FROM claims').get() as { count: number }).count;

  res.json({
    total_listings: total,
    active_lost: lost,
    active_found: found,
    resolved_returned: resolved,
    total_claims: claims,
    is_demo_mode: isDemoMode(),
  });
});

// Demo database reset helper - strictly restricted to demo mode
app.post('/api/reset-demo', (_req: Request, res: Response) => {
  if (!isDemoMode()) {
    res.status(403).json({ error: 'Database reset is strictly prohibited outside of Demo mode.' });
    return;
  }

  db.exec(`
    DELETE FROM listing_history;
    DELETE FROM claims;
    DELETE FROM listing_images;
    DELETE FROM listings;
    DELETE FROM users;
  `);
  seedDemoData(db);
  res.json({ message: 'Demo database has been reset with sample listings and mock personas.' });
});

// Serve frontend static build if available
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
      return;
    }
    next();
  });
}

// Centralized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File too large. Maximum image size is 5MB.' });
    return;
  }
  if (err.message && err.message.includes('Only authentic JPG, PNG, WEBP, or GIF')) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message && err.message.includes('SVG files are not permitted')) {
    res.status(400).json({ error: err.message });
    return;
  }

  const statusCode = typeof err.status === 'number' ? err.status : 500;
  const userSafeMessage = statusCode < 500 ? err.message : 'An unexpected server error occurred. Please try again.';
  res.status(statusCode).json({
    error: userSafeMessage,
  });
});
