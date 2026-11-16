import { Router, Request, Response } from 'express';
import { db } from '../db';
import { upload, verifyImageMagicBytes, cleanupFiles, removeUploadedFile } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';
import { Listing, ListingImage, ListingCategory, ListingType } from '../types';

export const listingsRouter = Router();

const VALID_CATEGORIES: ListingCategory[] = [
  'Electronics',
  'IDs & Cards',
  'Bags & Backpacks',
  'Keys',
  'Clothing & Accessories',
  'Books & Stationery',
  'Jewelry & Watches',
  'Other',
];

// Helper to sanitize listing for public responses
export function sanitizeListing(
  listing: any,
  currentUserId?: string,
  userClaimStatus?: string,
  includePrivateIfAuthorized: boolean = false
): Partial<Listing> {
  const isOwner = Boolean(currentUserId && listing.creator_id === currentUserId);
  const isApprovedClaimant = userClaimStatus === 'approved';

  const sanitized: any = {
    id: listing.id,
    type: listing.type,
    title: listing.title,
    category: listing.category,
    description: listing.description,
    date_lost_or_found: listing.date_lost_or_found,
    campus_location: listing.campus_location,
    specific_location: listing.specific_location,
    status: listing.status,
    creator_id: listing.creator_id,
    creator_name: listing.creator_name,
    // Creator email is only disclosed to owner or approved claimant
    creator_email: isOwner || isApprovedClaimant ? listing.creator_email : undefined,
    creator_role: listing.creator_role,
    verification_question: listing.verification_question,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
    is_owner: isOwner,
  };

  // Only the creator can see their private verification notes and contact in authorized detailed views
  if (includePrivateIfAuthorized) {
    if (isOwner) {
      sanitized.private_verification_notes = listing.private_verification_notes;
      sanitized.private_contact = listing.private_contact;
    } else if (isApprovedClaimant) {
      // Only approved claimant can see owner contact info
      sanitized.private_contact = listing.private_contact;
    }
  }

  return sanitized;
}

// 1. GET /api/listings - Browse and search with filters
listingsRouter.get('/', (req: Request, res: Response) => {
  const { type, category, location, search, status, sort } = req.query;
  const currentUserId = req.user?.id;

  let query = 'SELECT * FROM listings WHERE 1=1';
  const params: any[] = [];

  if (type && (type === 'lost' || type === 'found')) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (location && location !== 'All') {
    query += ' AND campus_location LIKE ?';
    params.push(`%${location}%`);
  }

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    query += ' AND (title LIKE ? OR description LIKE ? OR specific_location LIKE ? OR campus_location LIKE ?)';
    params.push(term, term, term, term);
  }

  // Sorting
  if (sort === 'oldest') {
    query += ' ORDER BY created_at ASC';
  } else if (sort === 'date_lost') {
    query += ' ORDER BY date_lost_or_found DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const rawListings = db.prepare(query).all(...params) as any[];

  // Attach primary images & claims counts
  const imageStmt = db.prepare('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, created_at ASC');
  const claimsCountStmt = db.prepare('SELECT COUNT(*) as count FROM claims WHERE listing_id = ?');
  const pendingClaimsStmt = db.prepare("SELECT COUNT(*) as count FROM claims WHERE listing_id = ? AND status = 'pending'");

  const listings = rawListings.map((l) => {
    const isOwner = Boolean(currentUserId && l.creator_id === currentUserId);
    const images = imageStmt.all(l.id) as ListingImage[];
    
    // Privacy: Only expose claim counts to the listing owner
    const claimsCount = isOwner ? (claimsCountStmt.get(l.id) as { count: number }).count : undefined;
    const pendingCount = isOwner ? (pendingClaimsStmt.get(l.id) as { count: number }).count : undefined;

    const sanitized = sanitizeListing(l, currentUserId, undefined, false);
    return {
      ...sanitized,
      images,
      claims_count: claimsCount,
      pending_claims_count: pendingCount,
    };
  });

  res.json({ listings });
});

// 2. GET /api/listings/:id - Detailed view
listingsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  const rawListing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as any;

  if (!rawListing) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }

  // Check if current user has submitted a claim for this listing
  let userClaim: any = null;
  if (currentUserId) {
    userClaim = db.prepare('SELECT * FROM claims WHERE listing_id = ? AND claimant_id = ?').get(id, currentUserId);
  }

  const userClaimStatus = userClaim?.status;
  const isOwner = Boolean(currentUserId && rawListing.creator_id === currentUserId);
  const sanitized = sanitizeListing(rawListing, currentUserId, userClaimStatus, true);

  const images = db.prepare('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, created_at ASC').all(id) as ListingImage[];
  
  // Privacy: Claim counts are only relevant and disclosed to the listing owner
  const claimsCount = isOwner ? (db.prepare('SELECT COUNT(*) as count FROM claims WHERE listing_id = ?').get(id) as { count: number }).count : undefined;
  const pendingClaimsCount = isOwner ? (db.prepare("SELECT COUNT(*) as count FROM claims WHERE listing_id = ? AND status = 'pending'").get(id) as { count: number }).count : undefined;

  res.json({
    listing: {
      ...sanitized,
      images,
      claims_count: claimsCount,
      pending_claims_count: pendingClaimsCount,
      user_claim: userClaim || null,
    },
  });
});

// 3. POST /api/listings - Create listing with image uploads and validation
listingsRouter.post('/', requireAuth, upload.array('images', 5), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    const user = req.user!;
    const {
      type,
      title,
      category,
      description,
      date_lost_or_found,
      campus_location,
      specific_location,
      verification_question,
      private_verification_notes,
      private_contact,
    } = req.body;

    // Validate uploaded file magic bytes to prevent extension or MIME spoofing
    if (files && files.length > 0) {
      for (const file of files) {
        const isValidMagic = verifyImageMagicBytes(file.path);
        if (!isValidMagic) {
          cleanupFiles(files);
          res.status(400).json({
            error: `File '${file.originalname}' is not a valid image or has an invalid file header. Only authentic JPG, PNG, WEBP, or GIF images are allowed.`,
          });
          return;
        }
      }
    }

    // Server-side validation
    const errors: string[] = [];

    if (!type || (type !== 'lost' && type !== 'found')) {
      errors.push("Type must be either 'lost' or 'found'.");
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 120) {
      errors.push('Title is required and must be between 3 and 120 characters.');
    }

    if (!category || !VALID_CATEGORIES.includes(category as ListingCategory)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      errors.push('Public description must be at least 10 characters long.');
    }

    if (!date_lost_or_found || !/^\d{4}-\d{2}-\d{2}$/.test(date_lost_or_found)) {
      errors.push('Date lost/found is required and must be in YYYY-MM-DD format.');
    }

    if (!campus_location || typeof campus_location !== 'string' || campus_location.trim().length < 2) {
      errors.push('Campus location is required.');
    }

    if (!verification_question || typeof verification_question !== 'string' || verification_question.trim().length < 8) {
      errors.push('Verification question is required to help verify ownership (min 8 characters).');
    }

    if (!private_verification_notes || typeof private_verification_notes !== 'string' || private_verification_notes.trim().length < 5) {
      errors.push('Private verification details are required so you can confirm valid claims (min 5 characters).');
    }

    if (!private_contact || typeof private_contact !== 'string' || private_contact.trim().length < 5) {
      errors.push('Private contact information (phone, email, or meeting instructions) is required.');
    }

    if (errors.length > 0) {
      cleanupFiles(files);
      res.status(400).json({ error: 'Validation failed', errors });
      return;
    }

    const listingId = `lst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertListing = db.prepare(`
      INSERT INTO listings (
        id, type, title, category, description, date_lost_or_found,
        campus_location, specific_location, status, creator_id,
        creator_name, creator_email, creator_role, verification_question,
        private_verification_notes, private_contact, created_at, updated_at
      ) VALUES (
        @id, @type, @title, @category, @description, @date_lost_or_found,
        @campus_location, @specific_location, 'active', @creator_id,
        @creator_name, @creator_email, @creator_role, @verification_question,
        @private_verification_notes, @private_contact, @created_at, @updated_at
      )
    `);

    const insertImage = db.prepare(`
      INSERT INTO listing_images (id, listing_id, file_path, filename, is_primary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertHistory = db.prepare(`
      INSERT INTO listing_history (id, listing_id, actor_id, actor_name, action, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const images: ListingImage[] = [];

    // Atomic transaction for database persistence
    const createTransaction = db.transaction(() => {
      insertListing.run({
        id: listingId,
        type: type as ListingType,
        title: title.trim(),
        category: category as ListingCategory,
        description: description.trim(),
        date_lost_or_found,
        campus_location: campus_location.trim(),
        specific_location: (specific_location || '').trim(),
        creator_id: user.id,
        creator_name: user.name,
        creator_email: user.email,
        creator_role: user.role,
        verification_question: verification_question.trim(),
        private_verification_notes: private_verification_notes.trim(),
        private_contact: private_contact.trim(),
        created_at: now,
        updated_at: now,
      });

      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const imageId = `img_${Date.now()}_${index}`;
          const filePath = `/uploads/${file.filename}`;
          const isPrimary = index === 0 ? 1 : 0;
          insertImage.run(imageId, listingId, filePath, file.filename, isPrimary, now);
          images.push({
            id: imageId,
            listing_id: listingId,
            file_path: filePath,
            filename: file.filename,
            is_primary: isPrimary,
            created_at: now,
          });
        });
      }

      insertHistory.run(
        `hist_${Date.now()}`,
        listingId,
        user.id,
        user.name,
        'created',
        `Listing published as ${type.toUpperCase()}`,
        now
      );
    });

    createTransaction();

    const createdListing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
    const sanitized = sanitizeListing(createdListing, user.id, undefined, true);

    res.status(201).json({
      message: 'Listing successfully created',
      listing: {
        ...sanitized,
        images,
        claims_count: 0,
      },
    });
  } catch (err: any) {
    cleanupFiles(files);
    res.status(500).json({ error: err.message || 'Server error while creating listing' });
  }
});

// 4. PATCH /api/listings/:id/status - Update listing status (Owner only)
listingsRouter.patch('/:id/status', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user!;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as any;
  if (!listing) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }

  // Authorization check
  if (listing.creator_id !== user.id) {
    res.status(403).json({ error: 'Unauthorized: Only the listing creator can change listing status.' });
    return;
  }

  const validStatuses = ['active', 'in_claim', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

  db.prepare(`
    INSERT INTO listing_history (id, listing_id, actor_id, actor_name, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `hist_${Date.now()}`,
    id,
    user.id,
    user.name,
    'status_changed',
    `Status updated to ${status.toUpperCase()}`,
    now
  );

  res.json({ message: `Listing status updated to ${status}`, status });
});

// 5. DELETE /api/listings/:id - Delete listing (Owner only) & Clean up images
listingsRouter.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as any;
  if (!listing) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }

  if (listing.creator_id !== user.id) {
    res.status(403).json({ error: 'Unauthorized: Only the creator can delete this listing.' });
    return;
  }

  // Clean up associated image files from disk
  const associatedImages = db.prepare('SELECT filename, file_path FROM listing_images WHERE listing_id = ?').all(id) as { filename: string; file_path: string }[];
  for (const img of associatedImages) {
    removeUploadedFile(img.filename || img.file_path);
  }

  db.prepare('DELETE FROM listings WHERE id = ?').run(id);
  res.json({ message: 'Listing and associated files deleted successfully.' });
});
