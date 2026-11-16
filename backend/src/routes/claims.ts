import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { Claim, Listing } from '../types';

export const claimsRouter = Router();

// 1. POST /api/listings/:id/claims - Submit a claim with verification proof
claimsRouter.post('/listings/:id/claims', requireAuth, (req: Request, res: Response) => {
  const { id: listingId } = req.params;
  const user = req.user!;
  const { verification_details, claimant_contact, claimant_message } = req.body;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId) as Listing | undefined;
  if (!listing) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }

  // Prevent creator from claiming their own listing
  if (listing.creator_id === user.id) {
    res.status(400).json({ error: 'You cannot submit a claim on your own listing.' });
    return;
  }

  // Check if listing is already closed or resolved
  if (listing.status === 'closed' || listing.status === 'resolved') {
    res.status(400).json({ error: `Cannot submit claim: This listing is already ${listing.status}.` });
    return;
  }

  // Check for duplicate claim from the same user
  const existingClaim = db.prepare('SELECT id, status FROM claims WHERE listing_id = ? AND claimant_id = ?').get(listingId, user.id);
  if (existingClaim) {
    res.status(409).json({
      error: 'Duplicate claim: You have already submitted a claim for this listing.',
      claim: existingClaim,
    });
    return;
  }

  // Validation
  const errors: string[] = [];
  if (!verification_details || typeof verification_details !== 'string' || verification_details.trim().length < 8) {
    errors.push('Verification proof is required (min 8 characters). Please provide identifying details not revealed in the public post.');
  }

  if (!claimant_contact || typeof claimant_contact !== 'string' || claimant_contact.trim().length < 5) {
    errors.push('Your contact information (phone number or campus email) is required so the poster can reach you.');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', errors });
    return;
  }

  const claimId = `clm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    const submitTransaction = db.transaction(() => {
      // Re-verify uniqueness inside transaction
      const doubleCheck = db.prepare('SELECT id FROM claims WHERE listing_id = ? AND claimant_id = ?').get(listingId, user.id);
      if (doubleCheck) {
        throw new Error('DUPLICATE_CLAIM');
      }

      db.prepare(`
        INSERT INTO claims (
          id, listing_id, claimant_id, claimant_name, claimant_email, claimant_role,
          verification_details, claimant_contact, claimant_message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(
        claimId,
        listingId,
        user.id,
        user.name,
        user.email,
        user.role,
        verification_details.trim(),
        claimant_contact.trim(),
        (claimant_message || '').trim(),
        now
      );

      // Update listing status if it was active to in_claim
      if (listing.status === 'active') {
        db.prepare('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?').run('in_claim', now, listingId);
      }

      // Add audit history
      db.prepare(`
        INSERT INTO listing_history (id, listing_id, actor_id, actor_name, action, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `hist_${Date.now()}`,
        listingId,
        user.id,
        user.name,
        'claim_submitted',
        `Claim submitted by ${user.name} (${user.role}) with verification proof`,
        now
      );
    });

    submitTransaction();

    const createdClaim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId);
    res.status(201).json({
      message: 'Claim successfully submitted. The listing owner has been notified to review your verification details.',
      claim: createdClaim,
    });
  } catch (err: any) {
    if (err.message === 'DUPLICATE_CLAIM') {
      res.status(409).json({ error: 'Duplicate claim: You have already submitted a claim for this listing.' });
      return;
    }
    res.status(500).json({ error: err.message || 'Error submitting claim' });
  }
});

// 2. GET /api/listings/:id/claims - Review claims (OWNER ONLY)
claimsRouter.get('/listings/:id/claims', requireAuth, (req: Request, res: Response) => {
  const { id: listingId } = req.params;
  const user = req.user!;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId) as Listing | undefined;
  if (!listing) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }

  // Authorization: Only the creator of the listing can review claims!
  if (listing.creator_id !== user.id) {
    res.status(403).json({ error: 'Forbidden: Only the listing creator/finder can review claims for this item.' });
    return;
  }

  const claims = db.prepare(`
    SELECT * FROM claims 
    WHERE listing_id = ? 
    ORDER BY CASE status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END, created_at DESC
  `).all(listingId) as Claim[];

  res.json({
    listing: {
      id: listing.id,
      title: listing.title,
      type: listing.type,
      category: listing.category,
      campus_location: listing.campus_location,
      status: listing.status,
      verification_question: listing.verification_question,
      private_verification_notes: listing.private_verification_notes, // Owner can see their own reference notes
      private_contact: listing.private_contact,
    },
    claims,
  });
});

// 3. POST /api/claims/:id/review - Approve or reject claim (OWNER ONLY)
claimsRouter.post('/claims/:id/review', requireAuth, (req: Request, res: Response) => {
  const { id: claimId } = req.params;
  const user = req.user!;
  const { action, review_notes } = req.body;

  if (action !== 'approve' && action !== 'reject') {
    res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
    return;
  }

  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as Claim | undefined;
  if (!claim) {
    res.status(404).json({ error: 'Claim not found.' });
    return;
  }

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(claim.listing_id) as Listing | undefined;
  if (!listing) {
    res.status(404).json({ error: 'Associated listing not found.' });
    return;
  }

  // Authorization: Only the listing owner can review this claim
  if (listing.creator_id !== user.id) {
    res.status(403).json({ error: 'Forbidden: Only the listing owner or finder can review this claim.' });
    return;
  }

  // Critical State Guard: Ensure a rejected or approved claim cannot be reviewed repeatedly as if it were still pending
  if (claim.status !== 'pending') {
    res.status(400).json({
      error: `Cannot review claim: This claim has already been ${claim.status}. Repeated reviews are not permitted.`,
    });
    return;
  }

  // Critical State Guard: If attempting to approve, verify listing is not already resolved
  if (action === 'approve' && (listing.status === 'resolved' || listing.status === 'closed')) {
    res.status(400).json({
      error: `Cannot approve claim: This listing is already marked as ${listing.status}.`,
    });
    return;
  }

  const now = new Date().toISOString();

  try {
    const reviewTransaction = db.transaction(() => {
      if (action === 'approve') {
        // 1. Mark this claim as approved with optimistic status check
        const claimUpdate = db.prepare(`
          UPDATE claims 
          SET status = 'approved', review_notes = ?, reviewed_at = ?
          WHERE id = ? AND status = 'pending'
        `).run(review_notes || 'Claim verified and approved.', now, claimId);

        if (claimUpdate.changes === 0) {
          throw new Error('CLAIM_CONCURRENCY_CONFLICT');
        }

        // 2. Mark listing as resolved
        db.prepare(`
          UPDATE listings 
          SET status = 'resolved', updated_at = ?
          WHERE id = ?
        `).run(now, listing.id);

        // 3. Reject other pending claims with note
        db.prepare(`
          UPDATE claims 
          SET status = 'rejected', review_notes = 'Another claimant provided verified proof of ownership for this item.', reviewed_at = ?
          WHERE listing_id = ? AND id != ? AND status = 'pending'
        `).run(now, listing.id, claimId);

        // 4. Record history
        db.prepare(`
          INSERT INTO listing_history (id, listing_id, actor_id, actor_name, action, details, created_at)
          VALUES (?, ?, ?, ?, 'claim_approved', ?, ?)
        `).run(
          `hist_${Date.now()}`,
          listing.id,
          user.id,
          user.name,
          `Claim approved for ${claim.claimant_name}. Item marked resolved. Mutual contact exchanged.`,
          now
        );
      } else {
        // Reject claim
        const claimUpdate = db.prepare(`
          UPDATE claims 
          SET status = 'rejected', review_notes = ?, reviewed_at = ?
          WHERE id = ? AND status = 'pending'
        `).run(review_notes || 'Verification details did not match.', now, claimId);

        if (claimUpdate.changes === 0) {
          throw new Error('CLAIM_CONCURRENCY_CONFLICT');
        }

        // Check if any other pending claims remain; if none, revert listing status to active
        const remainingPending = db.prepare("SELECT COUNT(*) as count FROM claims WHERE listing_id = ? AND status = 'pending'").get(listing.id) as { count: number };
        if (remainingPending.count === 0 && listing.status === 'in_claim') {
          db.prepare('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?').run('active', now, listing.id);
        }

        db.prepare(`
          INSERT INTO listing_history (id, listing_id, actor_id, actor_name, action, details, created_at)
          VALUES (?, ?, ?, ?, 'claim_rejected', ?, ?)
        `).run(
          `hist_${Date.now()}`,
          listing.id,
          user.id,
          user.name,
          `Claim from ${claim.claimant_name} was rejected: ${review_notes || 'Verification details did not match'}`,
          now
        );
      }
    });

    reviewTransaction();

    if (action === 'approve') {
      res.json({
        message: `Claim approved successfully. ${claim.claimant_name} can now view your contact details to coordinate return.`,
        claim_status: 'approved',
        listing_status: 'resolved',
      });
    } else {
      res.json({
        message: `Claim from ${claim.claimant_name} was rejected.`,
        claim_status: 'rejected',
      });
    }
  } catch (err: any) {
    if (err.message === 'CLAIM_CONCURRENCY_CONFLICT') {
      res.status(409).json({ error: 'Conflict: This claim has already been updated by another action.' });
      return;
    }
    res.status(500).json({ error: err.message || 'Error processing claim review.' });
  }
});

// 4. GET /api/my-activity - User's listings and claims
claimsRouter.get('/my-activity', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;

  // 1. My Listings
  const rawListings = db.prepare(`
    SELECT * FROM listings 
    WHERE creator_id = ? 
    ORDER BY created_at DESC
  `).all(user.id) as any[];

  const imageStmt = db.prepare('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, created_at ASC');
  const claimsCountStmt = db.prepare('SELECT COUNT(*) as count FROM claims WHERE listing_id = ?');
  const pendingClaimsStmt = db.prepare("SELECT COUNT(*) as count FROM claims WHERE listing_id = ? AND status = 'pending'");

  const myListings = rawListings.map((l) => ({
    ...l, // Owner gets all fields of their own listings
    images: imageStmt.all(l.id),
    claims_count: (claimsCountStmt.get(l.id) as { count: number }).count,
    pending_claims_count: (pendingClaimsStmt.get(l.id) as { count: number }).count,
    is_owner: true,
  }));

  // 2. My Claims
  const rawClaims = db.prepare(`
    SELECT c.*, 
           l.title as listing_title, 
           l.type as listing_type, 
           l.category as listing_category,
           l.campus_location as listing_campus_location,
           l.status as listing_status,
           l.creator_name as listing_creator_name,
           l.creator_email as listing_creator_email,
           l.private_contact as listing_creator_contact
    FROM claims c
    JOIN listings l ON c.listing_id = l.id
    WHERE c.claimant_id = ?
    ORDER BY c.created_at DESC
  `).all(user.id) as any[];

  // Hide the listing creator's contact unless the claim is approved
  const myClaims = rawClaims.map((c) => {
    const isApproved = c.status === 'approved';
    return {
      id: c.id,
      listing_id: c.listing_id,
      claimant_id: c.claimant_id,
      claimant_name: c.claimant_name,
      claimant_email: c.claimant_email,
      claimant_role: c.claimant_role,
      verification_details: c.verification_details,
      claimant_contact: c.claimant_contact,
      claimant_message: c.claimant_message,
      status: c.status,
      review_notes: c.review_notes,
      created_at: c.created_at,
      reviewed_at: c.reviewed_at,
      listing_title: c.listing_title,
      listing_type: c.listing_type,
      listing_category: c.listing_category,
      listing_campus_location: c.listing_campus_location,
      listing_status: c.listing_status,
      listing_creator_name: c.listing_creator_name,
      // CRITICAL PRIVACY BOUNDARY: Only expose creator contact when claim is approved
      listing_creator_email: isApproved ? c.listing_creator_email : null,
      listing_creator_contact: isApproved ? c.listing_creator_contact : null,
    };
  });

  res.json({
    my_listings: myListings,
    my_claims: myClaims,
  });
});
