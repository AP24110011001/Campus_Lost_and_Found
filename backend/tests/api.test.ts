import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { db, seedDemoData } from '../src/db';
import { UPLOADS_DIR } from '../src/middleware/upload';

describe('Campus Lost & Found API & Security Tests', () => {
  beforeEach(() => {
    // Reset test database to clean seed state
    db.exec(`
      DELETE FROM listing_history;
      DELETE FROM claims;
      DELETE FROM listing_images;
      DELETE FROM listings;
      DELETE FROM users;
    `);
    seedDemoData(db);
  });

  describe('1. Identity & Route Protection', () => {
    it('rejects unauthenticated requests to protected endpoints without user id', async () => {
      // Missing x-user-id header
      const res = await request(app)
        .post('/api/listings')
        .send({ title: 'Test Item' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects unauthenticated attempts to submit claims', async () => {
      const res = await request(app)
        .post('/api/listings/lst_airpods/claims')
        .send({
          verification_details: 'Mine!',
          claimant_contact: '555-0100',
        });

      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated attempts to access my-activity', async () => {
      const res = await request(app).get('/api/my-activity');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Listing Validation & Upload Hardening', () => {
    it('rejects listing creation when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('x-user-id', 'usr_alex')
        .send({
          title: 'Ab', // too short
          type: 'invalid_type', // invalid
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.errors).toBeInstanceOf(Array);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('rejects listing if private verification notes or contact are missing', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('x-user-id', 'usr_alex')
        .send({
          type: 'lost',
          title: 'Mechanical Pencil Set',
          category: 'Books & Stationery',
          description: 'Left in Room 204 after calculus lecture on Monday.',
          date_lost_or_found: '2026-11-08',
          campus_location: 'Mathematics Hall',
          verification_question: 'What brand and lead size are the pencils?',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toContain(
        'Private verification details are required so you can confirm valid claims (min 5 characters).'
      );
    });

    it('rejects SVG uploads for user listings to prevent stored XSS attacks', async () => {
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>';
      const res = await request(app)
        .post('/api/listings')
        .set('x-user-id', 'usr_alex')
        .field('type', 'lost')
        .field('title', 'USB Flash Drive with SVG')
        .field('category', 'Electronics')
        .field('description', 'Dropped near lecture hall.')
        .field('date_lost_or_found', '2026-11-09')
        .field('campus_location', 'Science Complex')
        .field('verification_question', 'What color lanyard is attached?')
        .field('private_verification_notes', 'Blue Corsair 64GB drive')
        .field('private_contact', 'alex@campus.edu')
        .attach('images', Buffer.from(svgContent), 'malicious.svg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('SVG files are not permitted');
    });

    it('rejects spoofed images with fake extensions that fail magic byte verification', async () => {
      const fakeJpg = 'This is plain text pretending to be a JPG image.';
      const res = await request(app)
        .post('/api/listings')
        .set('x-user-id', 'usr_alex')
        .field('type', 'lost')
        .field('title', 'Spoofed Image Test')
        .field('category', 'Electronics')
        .field('description', 'Trying to upload fake jpg file.')
        .field('date_lost_or_found', '2026-11-09')
        .field('campus_location', 'Science Complex')
        .field('verification_question', 'What model is it?')
        .field('private_verification_notes', 'Secret notes here')
        .field('private_contact', 'alex@campus.edu')
        .attach('images', Buffer.from(fakeJpg), 'fake.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('is not a valid image or has an invalid file header');
    });

    it('successfully accepts valid PNG image uploads with genuine magic bytes', async () => {
      // 1x1 transparent PNG magic bytes
      const validPngBytes = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);

      const res = await request(app)
        .post('/api/listings')
        .set('x-user-id', 'usr_alex')
        .field('type', 'lost')
        .field('title', 'Blue Hydro Flask with Sticker')
        .field('category', 'Other')
        .field('description', 'Lost near basketball court 3.')
        .field('date_lost_or_found', '2026-11-09')
        .field('campus_location', 'Recreation Center')
        .field('verification_question', 'What brand is the sticker on the back?')
        .field('private_verification_notes', 'Yosemite National Park sticker')
        .field('private_contact', 'alex@campus.edu')
        .attach('images', validPngBytes, 'photo.png');

      expect(res.status).toBe(201);
      expect(res.body.listing.images.length).toBe(1);
      expect(res.body.listing.title).toBe('Blue Hydro Flask with Sticker');

      // Verify file exists on disk
      const savedFilename = res.body.listing.images[0].filename;
      const savedPath = path.join(UPLOADS_DIR, savedFilename);
      expect(fs.existsSync(savedPath)).toBe(true);

      // Clean up test file
      if (fs.existsSync(savedPath)) {
        fs.unlinkSync(savedPath);
      }
    });
  });

  describe('3. Privacy & Trust: Stripping Secret Details in Public Responses', () => {
    it('public listing feed NEVER exposes private_verification_notes or private_contact', async () => {
      const res = await request(app).get('/api/listings');

      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBeGreaterThan(0);

      for (const item of res.body.listings) {
        expect(item.private_verification_notes).toBeUndefined();
        expect(item.private_contact).toBeUndefined();
        expect(item.creator_email).toBeUndefined();
        expect(item.verification_question).toBeDefined();
      }
    });

    it('single listing detail hides private details from other campus users', async () => {
      // lst_airpods belongs to usr_samira
      // Access as usr_marcus (non-owner)
      const res = await request(app)
        .get('/api/listings/lst_airpods')
        .set('x-user-id', 'usr_marcus');

      expect(res.status).toBe(200);
      expect(res.body.listing.id).toBe('lst_airpods');
      expect(res.body.listing.is_owner).toBe(false);
      expect(res.body.listing.private_verification_notes).toBeUndefined();
      expect(res.body.listing.private_contact).toBeUndefined();
      expect(res.body.listing.creator_email).toBeUndefined();
    });

    it('single listing detail displays private details ONLY to the owner', async () => {
      // lst_airpods belongs to usr_samira
      const res = await request(app)
        .get('/api/listings/lst_airpods')
        .set('x-user-id', 'usr_samira');

      expect(res.status).toBe(200);
      expect(res.body.listing.is_owner).toBe(true);
      expect(res.body.listing.private_verification_notes).toBeDefined();
      expect(res.body.listing.private_contact).toBeDefined();
      expect(res.body.listing.creator_email).toBe('samira.khan@campus.edu');
    });
  });

  describe('4. Claim Submission, Anti-Self-Claim & Duplicate Prevention', () => {
    it('prevents user from claiming their own listing', async () => {
      // lst_backpack is created by usr_alex
      const res = await request(app)
        .post('/api/listings/lst_backpack/claims')
        .set('x-user-id', 'usr_alex')
        .send({
          verification_details: 'I own this backpack!',
          claimant_contact: '555-0123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You cannot submit a claim on your own listing.');
    });

    it('prevents duplicate claims by the same user on the same listing', async () => {
      // First claim from Marcus Chen on lst_backpack
      const firstRes = await request(app)
        .post('/api/listings/lst_backpack/claims')
        .set('x-user-id', 'usr_marcus')
        .send({
          verification_details: 'It has Sedgewick CS Algorithms inside and Pikachu keychain.',
          claimant_contact: 'marcus@campus.edu or 555-019-3388',
          claimant_message: 'Please let me know if this is mine!',
        });

      expect(firstRes.status).toBe(201);

      // Attempting to submit another claim from the same user for the same listing
      const secondRes = await request(app)
        .post('/api/listings/lst_backpack/claims')
        .set('x-user-id', 'usr_marcus')
        .send({
          verification_details: 'Submitting a duplicate claim attempt.',
          claimant_contact: 'marcus@campus.edu',
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.error).toContain('Duplicate claim: You have already submitted a claim');
    });

    it('prevents submitting a claim on a resolved listing', async () => {
      // lst_calc is already resolved
      const res = await request(app)
        .post('/api/listings/lst_calc/claims')
        .set('x-user-id', 'usr_alex')
        .send({
          verification_details: 'Late claim attempt.',
          claimant_contact: 'alex@campus.edu',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('This listing is already resolved');
    });
  });

  describe('5. Claim Review Permissions, Repeated Review Guard & Contact Exchange', () => {
    it('forbids non-owner from viewing claims list for a listing', async () => {
      // lst_airpods is owned by usr_samira
      const res = await request(app)
        .get('/api/listings/lst_airpods/claims')
        .set('x-user-id', 'usr_marcus');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('forbids non-owner from reviewing/approving/rejecting claims', async () => {
      // clm_airpods_demo is on lst_airpods (owner: usr_samira)
      const res = await request(app)
        .post('/api/claims/clm_airpods_demo/review')
        .set('x-user-id', 'usr_marcus')
        .send({ action: 'approve' });

      expect(res.status).toBe(403);
    });

    it('allows owner to approve a claim and reveals contact information to claimant', async () => {
      // clm_airpods_demo is claimed by usr_alex on lst_airpods (owner: usr_samira)
      // 1. Samira approves Alex's claim
      const reviewRes = await request(app)
        .post('/api/claims/clm_airpods_demo/review')
        .set('x-user-id', 'usr_samira')
        .send({
          action: 'approve',
          review_notes: 'Engraving matches perfectly! Come pick it up at Library front desk.',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.claim_status).toBe('approved');
      expect(reviewRes.body.listing_status).toBe('resolved');

      // 2. Now Alex checks their activity page
      const activityRes = await request(app)
        .get('/api/my-activity')
        .set('x-user-id', 'usr_alex');

      expect(activityRes.status).toBe(200);
      const airpodsClaim = activityRes.body.my_claims.find((c: any) => c.listing_id === 'lst_airpods');
      expect(airpodsClaim).toBeDefined();
      expect(airpodsClaim.status).toBe('approved');
      expect(airpodsClaim.listing_creator_contact).toContain('Campus Library Staff Desk');
    });

    it('prevents reviewing an already reviewed claim (repeated review guard)', async () => {
      // clm_calc_demo is already approved
      const repeatRes = await request(app)
        .post('/api/claims/clm_calc_demo/review')
        .set('x-user-id', 'usr_elena')
        .send({ action: 'reject' });

      expect(repeatRes.status).toBe(400);
      expect(repeatRes.body.error).toContain('This claim has already been approved. Repeated reviews are not permitted.');
    });

    it('prevents approving a claim when listing is already marked resolved', async () => {
      // lst_calc is already resolved, add a pending claim for testing
      db.prepare(`
        INSERT INTO claims (id, listing_id, claimant_id, claimant_name, claimant_email, claimant_role, verification_details, claimant_contact, claimant_message, status, created_at)
        VALUES ('clm_test_race', 'lst_calc', 'usr_alex', 'Alex Rivera', 'alex@campus.edu', 'student', 'My calc!', '555-0199', '', 'pending', '2026-11-10T00:00:00Z')
      `).run();

      const res = await request(app)
        .post('/api/claims/clm_test_race/review')
        .set('x-user-id', 'usr_elena')
        .send({ action: 'approve' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('This listing is already marked as resolved');
    });
  });

  describe('6. Listing Deletion & Owner Authorization', () => {
    it('forbids non-owner from deleting someone else\'s listing', async () => {
      // lst_airpods belongs to usr_samira
      const res = await request(app)
        .delete('/api/listings/lst_airpods')
        .set('x-user-id', 'usr_marcus');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('allows owner to delete their listing and cascades cleanly', async () => {
      // lst_backpack belongs to usr_alex
      const res = await request(app)
        .delete('/api/listings/lst_backpack')
        .set('x-user-id', 'usr_alex');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');

      // Verify listing is gone
      const check = db.prepare('SELECT id FROM listings WHERE id = ?').get('lst_backpack');
      expect(check).toBeUndefined();
    });
  });
});
