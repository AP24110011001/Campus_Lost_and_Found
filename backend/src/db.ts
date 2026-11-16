import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'campus_lost_found.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function createDatabase(dbFilePath: string = DB_PATH): Database.Database {
  const db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      department TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('lost', 'found')),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date_lost_or_found TEXT NOT NULL,
      campus_location TEXT NOT NULL,
      specific_location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'in_claim', 'resolved', 'closed')),
      creator_id TEXT NOT NULL REFERENCES users(id),
      creator_name TEXT NOT NULL,
      creator_email TEXT NOT NULL,
      creator_role TEXT NOT NULL,
      verification_question TEXT NOT NULL,
      private_verification_notes TEXT NOT NULL,
      private_contact TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      filename TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      claimant_id TEXT NOT NULL REFERENCES users(id),
      claimant_name TEXT NOT NULL,
      claimant_email TEXT NOT NULL,
      claimant_role TEXT NOT NULL,
      verification_details TEXT NOT NULL,
      claimant_contact TEXT NOT NULL,
      claimant_message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      review_notes TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      UNIQUE(listing_id, claimant_id)
    );

    CREATE TABLE IF NOT EXISTS listing_history (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_listings_type_status ON listings(type, status);
    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
    CREATE INDEX IF NOT EXISTS idx_listings_creator ON listings(creator_id);
    CREATE INDEX IF NOT EXISTS idx_claims_listing ON claims(listing_id);
    CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
    CREATE INDEX IF NOT EXISTS idx_history_listing ON listing_history(listing_id);
  `);

  return db;
}

export const db = createDatabase();

// Helper to generate visually appealing SVGs for demo items
function createSampleSvg(title: string, category: string, color1: string, color2: string, iconSymbol: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.15" />
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#grad)" />
  <circle cx="400" cy="270" r="140" fill="white" fill-opacity="0.95" filter="url(#shadow)" />
  <text x="400" y="315" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="90" text-anchor="middle">${iconSymbol}</text>
  <rect x="100" y="450" width="600" height="90" rx="16" fill="white" fill-opacity="0.95" filter="url(#shadow)" />
  <text x="400" y="490" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold" fill="#0f172a" text-anchor="middle">${title}</text>
  <text x="400" y="520" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">${category} • Campus Lost &amp; Found</text>
</svg>`;
}

export function seedDemoData(database: Database.Database = db): void {
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

  // 1. Insert Demo Users
  const insertUser = database.prepare(`
    INSERT INTO users (id, name, email, role, avatar_color, department, created_at)
    VALUES (@id, @name, @email, @role, @avatar_color, @department, @created_at)
  `);

  const demoUsers = [
    {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex.rivera@campus.edu',
      role: 'student',
      avatar_color: 'bg-indigo-600 text-white',
      department: 'Computer Science (Sophomore)',
      created_at: daysAgo(30),
    },
    {
      id: 'usr_samira',
      name: 'Samira Khan',
      email: 'samira.khan@campus.edu',
      role: 'staff',
      avatar_color: 'bg-emerald-600 text-white',
      department: 'Main Library Staff Desk',
      created_at: daysAgo(30),
    },
    {
      id: 'usr_marcus',
      name: 'Marcus Chen',
      email: 'marcus.chen@campus.edu',
      role: 'student',
      avatar_color: 'bg-amber-600 text-white',
      department: 'Pre-Med Biology (Freshman)',
      created_at: daysAgo(30),
    },
    {
      id: 'usr_elena',
      name: 'Elena Rostova',
      email: 'elena.rostova@campus.edu',
      role: 'faculty',
      avatar_color: 'bg-purple-600 text-white',
      department: 'Physics & Astronomy Dept',
      created_at: daysAgo(30),
    },
  ];

  for (const user of demoUsers) {
    insertUser.run(user);
  }

  // 2. Sample SVGs saved to uploads directory
  const sampleImages = [
    { filename: 'airpods-pro.svg', title: 'AirPods Pro 2nd Gen', cat: 'Electronics', c1: '#3b82f6', c2: '#1d4ed8', icon: '🎧' },
    { filename: 'backpack-navy.svg', title: 'The North Face Recon', cat: 'Bags & Backpacks', c1: '#0f172a', c2: '#334155', icon: '🎒' },
    { filename: 'student-id.svg', title: 'Campus Student ID Card', cat: 'IDs & Cards', c1: '#059669', c2: '#047857', icon: '🪪' },
    { filename: 'calculator.svg', title: 'TI-84 Plus CE Graphing Calc', cat: 'Electronics', c1: '#7c3aed', c2: '#6d28d9', icon: '🧮' },
    { filename: 'water-bottle.svg', title: 'Hydro Flask 32oz Cobalt', cat: 'Other', c1: '#0284c7', c2: '#0369a1', icon: '💧' },
    { filename: 'keys-carabiner.svg', title: 'Toyota Key Fob & Dorm Key', cat: 'Keys', c1: '#dc2626', c2: '#b91c1c', icon: '🔑' },
    { filename: 'fleece-jacket.svg', title: 'Patagonia Better Sweater M', cat: 'Clothing & Accessories', c1: '#15803d', c2: '#166534', icon: '🧥' },
  ];

  for (const img of sampleImages) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, createSampleSvg(img.title, img.cat, img.c1, img.c2, img.icon));
    }
  }

  // 3. Insert Initial Listings
  const insertListing = database.prepare(`
    INSERT INTO listings (
      id, type, title, category, description, date_lost_or_found,
      campus_location, specific_location, status, creator_id,
      creator_name, creator_email, creator_role, verification_question,
      private_verification_notes, private_contact, created_at, updated_at
    ) VALUES (
      @id, @type, @title, @category, @description, @date_lost_or_found,
      @campus_location, @specific_location, @status, @creator_id,
      @creator_name, @creator_email, @creator_role, @verification_question,
      @private_verification_notes, @private_contact, @created_at, @updated_at
    )
  `);

  const insertImage = database.prepare(`
    INSERT INTO listing_images (id, listing_id, file_path, filename, is_primary, created_at)
    VALUES (@id, @listing_id, @file_path, @filename, @is_primary, @created_at)
  `);

  const insertHistory = database.prepare(`
    INSERT INTO listing_history (id, listing_id, actor_id, actor_name, action, details, created_at)
    VALUES (@id, @listing_id, @actor_id, @actor_name, @action, @details, @created_at)
  `);

  const listingsData = [
    {
      id: 'lst_airpods',
      type: 'found',
      title: 'AirPods Pro (2nd Gen) in White Charging Case',
      category: 'Electronics',
      description: 'Found under a desk in Science Complex Lecture Hall 101 after the 3 PM Organic Chemistry lecture. The case has a small silicone protective sleeve and an engraving on the back.',
      date_lost_or_found: daysAgo(2).split('T')[0],
      campus_location: 'Science Complex',
      specific_location: 'Lecture Hall 101, Row E, Desk 14',
      status: 'active',
      creator_id: 'usr_samira',
      creator_name: 'Samira Khan',
      creator_email: 'samira.khan@campus.edu',
      creator_role: 'staff',
      verification_question: 'What color is the silicone case, what custom text or emoji is engraved on the charging lid, and what name appears when pairing via Bluetooth?',
      private_verification_notes: 'Silicone case is mint green. Laser engraving says "A.R. 2024 ⚡". Bluetooth broadcast name is "Alex\'s AirPods Pro".',
      private_contact: 'Campus Library Staff Desk, Phone: (555) 014-9921, Ext 402. Hours: Mon-Fri 8am-7pm.',
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
      images: [{ id: 'img_airpods_1', filename: 'airpods-pro.svg', is_primary: 1 }],
    },
    {
      id: 'lst_backpack',
      type: 'lost',
      title: 'Navy Blue The North Face Recon Backpack',
      category: 'Bags & Backpacks',
      description: 'Accidentally left my backpack on the 2nd floor study area near the silent reading room. Contains notebooks and personal items. Offering immense gratitude for its return!',
      date_lost_or_found: daysAgo(3).split('T')[0],
      campus_location: 'Main Library',
      specific_location: '2nd Floor Quiet Study Cubicles, West Wing',
      status: 'active',
      creator_id: 'usr_alex',
      creator_name: 'Alex Rivera',
      creator_email: 'alex.rivera@campus.edu',
      creator_role: 'student',
      verification_question: 'What specific textbook and course code is in the main pocket, and what keychains are hooked on the side webbing?',
      private_verification_notes: 'Contains CS 240 Algorithms textbook by Sedgewick with yellow sticky notes, plus a metallic carabiner with a miniature pixel Pikachu keychain.',
      private_contact: 'Alex Rivera, Cell: (555) 018-4420, Discord: @alex_cs. Can meet in Student Center or Library.',
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
      images: [{ id: 'img_backpack_1', filename: 'backpack-navy.svg', is_primary: 1 }],
    },
    {
      id: 'lst_student_id',
      type: 'found',
      title: 'Student ID Card & Dining Pass in Campus Lanyard',
      category: 'IDs & Cards',
      description: 'Found on the pavement right outside the Student Union cafeteria entrance. Placed safely inside the security check desk.',
      date_lost_or_found: daysAgo(1).split('T')[0],
      campus_location: 'Student Union',
      specific_location: 'Cafeteria South Entrance Doors',
      status: 'active',
      creator_id: 'usr_marcus',
      creator_name: 'Marcus Chen',
      creator_email: 'marcus.chen@campus.edu',
      creator_role: 'student',
      verification_question: 'What is the full name, student ID number last 4 digits, and what color cardholder sleeve was attached?',
      private_verification_notes: 'Card name is "Jordan Lee", ID ending in 7742, clear hard-plastic sleeve with a small holographic hologram sticker.',
      private_contact: 'Marcus Chen, Cell: (555) 019-3388, Instagram: @marcus_c. Can hand over at Bio Sci Building.',
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
      images: [{ id: 'img_id_1', filename: 'student-id.svg', is_primary: 1 }],
    },
    {
      id: 'lst_calc',
      type: 'found',
      title: 'TI-84 Plus CE Graphing Calculator (Rose Gold Edition)',
      category: 'Electronics',
      description: 'Turned in to the Math Department front office. Calculator is in excellent condition and powered on.',
      date_lost_or_found: daysAgo(4).split('T')[0],
      campus_location: 'Mathematics Hall',
      specific_location: 'Room 302 Help Room desk',
      status: 'resolved',
      creator_id: 'usr_elena',
      creator_name: 'Elena Rostova',
      creator_email: 'elena.rostova@campus.edu',
      creator_role: 'faculty',
      verification_question: 'What sticker is placed on the slide cover, and what initials are scratched into the battery compartment?',
      private_verification_notes: 'Slide cover has a NASA worm logo sticker. Inside battery compartment has initials "E.K." in black Sharpie.',
      private_contact: 'Elena Rostova, Math Hall Room 418, Office Phone: (555) 012-7800.',
      created_at: daysAgo(4),
      updated_at: daysAgo(1),
      images: [{ id: 'img_calc_1', filename: 'calculator.svg', is_primary: 1 }],
    },
    {
      id: 'lst_bottle',
      type: 'lost',
      title: 'Hydro Flask 32 oz Wide Mouth Water Bottle (Cobalt Blue)',
      category: 'Other',
      description: 'Left behind on the bench next to Court 2 at the Recreation Center after intramural basketball practice.',
      date_lost_or_found: daysAgo(5).split('T')[0],
      campus_location: 'Recreation Center',
      specific_location: 'Main Gymnasium, Court 2 bleachers',
      status: 'active',
      creator_id: 'usr_marcus',
      creator_name: 'Marcus Chen',
      creator_email: 'marcus.chen@campus.edu',
      creator_role: 'student',
      verification_question: 'Describe at least two stickers on the bottle body and the type of lid (straw vs flex cap).',
      private_verification_notes: 'Has a black flex straw cap. Stickers: Red Bull Racing vinyl decal and a National Parks Yosemite sticker.',
      private_contact: 'Marcus Chen, Phone: (555) 019-3388, Room 214 North Hall.',
      created_at: daysAgo(5),
      updated_at: daysAgo(5),
      images: [{ id: 'img_bottle_1', filename: 'water-bottle.svg', is_primary: 1 }],
    },
    {
      id: 'lst_keys',
      type: 'found',
      title: 'Set of Keys with Toyota Electronic Fob & Dorm Tag',
      category: 'Keys',
      description: 'Found on the grass near the Bell Tower walkway during evening jog. Has several keys and a black remote fob.',
      date_lost_or_found: daysAgo(2).split('T')[0],
      campus_location: 'University Quad',
      specific_location: 'Path between Bell Tower and Alumni Hall',
      status: 'active',
      creator_id: 'usr_alex',
      creator_name: 'Alex Rivera',
      creator_email: 'alex.rivera@campus.edu',
      creator_role: 'student',
      verification_question: 'What color carabiner holds the keys together, how many total keys are on the ring, and what logo or tag is on the gym badge?',
      private_verification_notes: 'Bright blue anodized D-ring carabiner, 4 brass keys total, black Toyota fob, and a mini barcode tag for Planet Fitness.',
      private_contact: 'Alex Rivera, (555) 018-4420, Dorm: South Quad Tower B 3rd Floor.',
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
      images: [{ id: 'img_keys_1', filename: 'keys-carabiner.svg', is_primary: 1 }],
    },
  ];

  for (const item of listingsData) {
    insertListing.run({
      id: item.id,
      type: item.type,
      title: item.title,
      category: item.category,
      description: item.description,
      date_lost_or_found: item.date_lost_or_found,
      campus_location: item.campus_location,
      specific_location: item.specific_location,
      status: item.status,
      creator_id: item.creator_id,
      creator_name: item.creator_name,
      creator_email: item.creator_email,
      creator_role: item.creator_role,
      verification_question: item.verification_question,
      private_verification_notes: item.private_verification_notes,
      private_contact: item.private_contact,
      created_at: item.created_at,
      updated_at: item.updated_at,
    });

    for (const img of item.images) {
      insertImage.run({
        id: img.id,
        listing_id: item.id,
        file_path: `/uploads/${img.filename}`,
        filename: img.filename,
        is_primary: img.is_primary,
        created_at: item.created_at,
      });
    }

    insertHistory.run({
      id: `hist_${item.id}_created`,
      listing_id: item.id,
      actor_id: item.creator_id,
      actor_name: item.creator_name,
      action: 'created',
      details: `Listing created as ${item.type.toUpperCase()}`,
      created_at: item.created_at,
    });
  }

  // 4. Sample Claim for the Calculator (which is resolved)
  const insertClaim = database.prepare(`
    INSERT INTO claims (
      id, listing_id, claimant_id, claimant_name, claimant_email, claimant_role,
      verification_details, claimant_contact, claimant_message, status, review_notes,
      created_at, reviewed_at
    ) VALUES (
      @id, @listing_id, @claimant_id, @claimant_name, @claimant_email, @claimant_role,
      @verification_details, @claimant_contact, @claimant_message, @status, @review_notes,
      @created_at, @reviewed_at
    )
  `);

  insertClaim.run({
    id: 'clm_calc_demo',
    listing_id: 'lst_calc',
    claimant_id: 'usr_marcus',
    claimant_name: 'Marcus Chen',
    claimant_email: 'marcus.chen@campus.edu',
    claimant_role: 'student',
    verification_details: 'The slide cover has a round NASA logo sticker on the center. The inside battery door has "E.K." written in permanent marker (my roommate Evan Kim borrowed it for Calculus).',
    claimant_contact: 'Marcus Chen, Cell: (555) 019-3388. Can meet between classes at Math Hall.',
    claimant_message: 'Thank you so much Professor Rostova! Evan was panicking about losing this before the midterm.',
    status: 'approved',
    review_notes: 'Details match perfectly (NASA sticker and initials). Calculator was returned successfully at Math Hall 418.',
    created_at: daysAgo(2),
    reviewed_at: daysAgo(1),
  });

  insertHistory.run({
    id: 'hist_calc_claim_sub',
    listing_id: 'lst_calc',
    actor_id: 'usr_marcus',
    actor_name: 'Marcus Chen',
    action: 'claim_submitted',
    details: 'Claim submitted with verification details',
    created_at: daysAgo(2),
  });

  insertHistory.run({
    id: 'hist_calc_claim_app',
    listing_id: 'lst_calc',
    actor_id: 'usr_elena',
    actor_name: 'Elena Rostova',
    action: 'claim_approved',
    details: 'Claim approved for Marcus Chen. Mutual contact information unlocked.',
    created_at: daysAgo(1),
  });

  // Also add a pending claim on the AirPods to show realistic in-review state!
  insertClaim.run({
    id: 'clm_airpods_demo',
    listing_id: 'lst_airpods',
    claimant_id: 'usr_alex',
    claimant_name: 'Alex Rivera',
    claimant_email: 'alex.rivera@campus.edu',
    claimant_role: 'student',
    verification_details: 'The silicone case is mint green with a small clip. The back is laser engraved "A.R. 2024 ⚡". When opened next to an iPhone it connects as "Alex\'s AirPods Pro".',
    claimant_contact: 'Alex Rivera, Cell: (555) 018-4420, Discord: @alex_cs',
    claimant_message: 'Hi Samira, I attended the 3pm O-Chem class on Tuesday and realized I left them under my desk. Hope this matches!',
    status: 'pending',
    review_notes: null,
    created_at: daysAgo(1),
    reviewed_at: null,
  });

  insertHistory.run({
    id: 'hist_airpods_claim_sub',
    listing_id: 'lst_airpods',
    actor_id: 'usr_alex',
    actor_name: 'Alex Rivera',
    action: 'claim_submitted',
    details: 'Claim submitted by Alex Rivera (Verification challenge answered)',
    created_at: daysAgo(1),
  });
}

// Automatically seed on module load
seedDemoData(db);

