import { Router, Request, Response } from 'express';
import { db } from '../db';
import { ListingHistory } from '../types';

export const historyRouter = Router();

// GET /api/listings/:id/history - Get timeline of events for a listing
historyRouter.get('/listings/:id/history', (req: Request, res: Response) => {
  const { id: listingId } = req.params;

  const listingExists = db.prepare('SELECT id FROM listings WHERE id = ?').get(listingId);
  if (!listingExists) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  const history = db.prepare(`
    SELECT * FROM listing_history
    WHERE listing_id = ?
    ORDER BY created_at ASC
  `).all(listingId) as ListingHistory[];

  res.json({ history });
});

