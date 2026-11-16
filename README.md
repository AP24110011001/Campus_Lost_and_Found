# 🎓 Campus Lost & Found

A full-stack web application designed for campus communities to report lost or found items, search listings with granular filters, and return belongings through a **private, verifiable claim process**.

---

## 🚀 Key Features

1. **Lost & Found Reporting**:
   - Create detailed listings with title, category (8 campus categories), date, campus building, and specific room/spot notes.
   - Upload up to 5 photos stored locally on the server (5MB limit per file).
   - Set **Public Verification Challenge Questions** for prospective claimants.
   - Record **Secret Verification Notes** known only to the poster (never exposed in public API responses).
   - Store private contact info (phone, alternate email, meetup notes) protected server-side until claim verification.

2. **Smart Search & Granular Filtering**:
   - Instant search across item title, description, campus building, and room notes.
   - Filter by listing type (`All`, `Lost`, `Found`), category, campus location, and resolution status.
   - Visual active-filter chips with individual dismiss buttons and a "Clear All Filters" reset.
   - Sort by recently posted, date lost/found, or oldest.

3. **Verifiable Claim Process (Trust & Safety)**:
   - Claimants must answer the poster's challenge question and provide identifying details that were **not** disclosed in the public listing (e.g. laser engravings, contents of inner pockets, lockscreen wallpaper, serial numbers).
   - Server-side authorization ensures **only the listing creator or finder** can access submitted claims or make decisions.
   - **Repeated Review Guard**: Rejected or approved claims cannot be reviewed repeatedly.
   - **Concurrency Safety**: Claim status transitions and listing resolution are wrapped in atomic SQLite transactions.
   - **Duplicate Claim Prevention**: Database constraints and server checks prevent the same user from submitting duplicate claims for an item.
   - **Anti-Self-Claim**: Users cannot submit claims on their own listings.

4. **Private Contact Exchange**:
   - Public listing feeds and detail endpoints **never** expose the poster's private phone number or secret notes.
   - When the poster approves a claim, mutual contact information and meeting instructions are unlocked for both parties.

5. **Upload Hardening & Storage Security**:
   - **Raster Photos Only**: Accepts authentic JPEG, PNG, WEBP, and GIF files.
   - **SVG Rejection**: SVG uploads from users are explicitly rejected to prevent Stored XSS attacks via scriptable XML.
   - **Magic Byte Inspection**: The server inspects the first bytes of uploaded files to detect extension/MIME spoofing (e.g. HTML or scripts disguised as `.jpg`).
   - **Orphan File Cleanup**: Temporary files are deleted immediately if listing validation or magic byte checks fail. When a listing is deleted, all associated images are unlinked from disk.

6. **Audit Trail & Status History**:
   - Complete timestamped timeline for every listing: created, claim submitted, claim approved/rejected, status changed.

7. **Switchable Demo Personas**:
   - Includes pre-seeded personas representing students, staff, and faculty, plus an option to browse as an anonymous guest or create custom personas.

---

## ⚠️ Identity Model & Deployment Boundaries

### Demo Mode vs. Production Authentication

| Aspect | Demo Mode (`DEMO_MODE=true`) | Real Production Mode (`DEMO_MODE=false`) |
| :--- | :--- | :--- |
| **Identity Header** | Accepts `x-user-id` header or `?as_user=` query param | Mock headers are **strictly ignored** (`req.user = undefined`) |
| **Persona Switching** | Anyone with access can switch personas via the UI | Disabled (`POST /api/users/switch` returns 403) |
| **Database Reset** | `/api/reset-demo` resets sample data | Strictly disabled (`POST /api/reset-demo` returns 403) |
| **Anonymous State** | Requests without user ID are treated as unauthenticated | Standard unauthenticated visitor |

> [!IMPORTANT]
> **This project uses a mock persona system for demonstration purposes.** Anyone with access to the demonstration instance can act as any demo user. For real production deployment, this mock header authentication MUST be disabled (`ALLOW_DEMO_AUTH=false`), and replaced with an institutional campus identity provider (e.g., CAS, SAML 2.0, Shibboleth, or institutional OAuth2/OIDC).

---

## 🏗️ Architecture & Project Structure

```
Campus Lost & Found/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Persona session handler & production boundary guards
│   │   │   └── upload.ts        # Multer storage, magic byte validator, file cleanup
│   │   ├── routes/
│   │   │   ├── users.ts         # Demo accounts & persona switcher
│   │   │   ├── listings.ts      # Listings CRUD, filters, and privacy redaction layer
│   │   │   ├── claims.ts        # Atomic claim submission, review, and activity
│   │   │   └── history.ts       # Audit timeline for listings
│   │   ├── types.ts             # Shared TypeScript data models
│   │   ├── db.ts                # SQLite database setup & sample data seeder
│   │   ├── app.ts               # Express configuration, CORS, static uploads
│   │   └── index.ts             # Server entry point (port 3001)
│   ├── tests/
│   │   └── api.test.ts          # Vitest suite for authorization, privacy, uploads
│   ├── uploads/                 # Local image storage
│   └── campus_lost_found.db     # SQLite persistence database (WAL mode)
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Typed API client with demo session header
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Branding, nav tabs, persona switcher, reset modal
│   │   │   ├── ListingCard.tsx  # Grid card with badges and image preview
│   │   │   ├── ImageGallery.tsx # Multi-image viewer with zoom modal
│   │   │   ├── StatusBadge.tsx  # Badges for Lost/Found & Active/Resolved
│   │   │   └── TimelineView.tsx # Timestamped status history timeline
│   │   ├── context/
│   │   │   ├── AuthContext.tsx  # Persona state & persistence
│   │   │   └── ToastContext.tsx # Toast alerts (success, error, info)
│   │   ├── pages/
│   │   │   ├── HomePage.tsx            # Search bar, category filters, listings grid
│   │   │   ├── ListingDetailPage.tsx   # Item details, verification prompt, claim form
│   │   │   ├── CreateListingPage.tsx   # Photo upload, validation & security settings
│   │   │   ├── MyActivityPage.tsx      # Tabbed listings & submitted claims
│   │   │   └── ClaimReviewPage.tsx     # Owner portal to evaluate claims
│   │   ├── types.ts             # Frontend TypeScript types
│   │   ├── App.tsx              # View router and state coordinator
│   │   └── main.tsx             # React DOM root
│   └── vite.config.ts           # Vite bundler configuration & proxy
└── package.json                 # Root script runner (dev, build, test)
```

### Unrelated Experiments Note (`backend/genai_project`)
The `backend/genai_project` folder is an independent, experimental image restoration prototype. It is **not** imported, referenced, or used by the core Campus Lost & Found application. It is kept completely isolated and is not part of the application build or runtime.

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or later (Node 20+ or 24+ recommended).
- **npm**: v9.0.0 or later.

---

## ⚡ Quick Start

### 1. Install Dependencies

From the repository root:
```bash
# Install root workspace dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Run in Development Mode

From the repository root:
```bash
npm run dev
```

This starts:
- **Backend API**: `http://localhost:3001`
- **Frontend App**: `http://localhost:5173` (with Vite proxy to backend)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Production Build & Run

To build both frontend and backend:
```bash
npm run build
```

Then start the production server:
```bash
cd backend && npm run start
```
The full application (frontend SPA + backend API + static uploads) is served directly on [http://localhost:3001](http://localhost:3001).

---

## 🧪 Running Automated Tests

Run the test suite verifying listing validation, secret details redaction, duplicate claim prevention, SVG rejection, magic byte checking, repeated review guards, and owner review permissions:

```bash
npm run test
```

Or from the `backend/` directory:
```bash
cd backend && npm test
```

---

## 👥 Demo Personas & Credentials

The app includes four pre-seeded campus personas to test reporting, claiming, and owner reviews:

| Persona | Role | Campus Department / Focus | Demo ID |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | Student (Sophomore) | Computer Science | `usr_alex` |
| **Samira Khan** | Campus Staff | Main Library Help Desk | `usr_samira` |
| **Marcus Chen** | Student (Freshman) | Pre-Med Biology | `usr_marcus` |
| **Elena Rostova** | Faculty / Grad Assistant | Physics & Astronomy | `usr_elena` |

You can switch personas at any time using the **account switcher dropdown** in the top navigation bar, test **Anonymous Guest** mode, or click **"+ Create Custom Demo Persona"** to test with your own persona.

---

## 🔍 End-to-End Walkthrough Guide

To experience the complete private verifiable claim process:

1. **Sign in as Alex Rivera** (default persona):
   - Browse the directory. You will see listings like **AirPods Pro (2nd Gen)** found by *Samira Khan* at the Science Complex.
   - Click on the AirPods listing. Note that Samira's secret notes and phone number are **not** visible.
   - Read the verification question: *"What color is the silicone case, what custom text or emoji is engraved on the charging lid, and what name appears when pairing via Bluetooth?"*
   - Alex has already submitted a pending claim answering this challenge.

2. **Switch to Samira Khan (Staff)**:
   - Click the persona switcher in the top right and select **Samira Khan**.
   - Notice the **"1 claim to review"** badge on the *My Activity* tab and on the AirPods listing card.
   - Click **Review Claims**.
   - You will see your **Private Verification Cheat Sheet** side-by-side with Alex's submitted answers.
   - Click **Verify & Approve Claim** and enter optional meetup instructions (e.g. *"Pick up at Library desk tomorrow at 2 PM"*).
   - Confetti triggers, the listing updates to **Resolved**, and mutual contact details are unlocked.

3. **Switch back to Alex Rivera**:
   - Go to **My Activity** > **My Submitted Claims**.
   - See the approved claim card highlighted in emerald with Samira's **revealed contact number and library desk hours**.

4. **Test Anonymous Guest Mode**:
   - Open the persona dropdown and click **Browse as Anonymous Guest**.
   - Click **Report Lost / Found** or attempt to submit a claim. Note the clear warning explaining that an active persona is required to submit listings or claims.

---

## 📡 Key API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings` | Public | Search listings with filters (secret fields stripped) |
| `GET` | `/api/listings/:id` | Public / Auth | Get listing details (unmasks secrets only if authorized) |
| `POST` | `/api/listings` | Authenticated | Create listing with up to 5 uploaded raster images |
| `PATCH` | `/api/listings/:id/status` | Owner Only | Update listing status (`active`, `resolved`, `closed`) |
| `DELETE`| `/api/listings/:id` | Owner Only | Delete listing and unlink uploaded images from disk |
| `POST` | `/api/listings/:id/claims` | Authenticated | Submit claim with verification proof (anti-duplicate) |
| `GET` | `/api/listings/:id/claims` | Owner Only | Review all submitted claims for a listing |
| `POST` | `/api/claims/:id/review` | Owner Only | Approve or reject a claim (atomic transaction) |
| `GET` | `/api/my-activity` | Authenticated | Get current user's listings and submitted claims |
| `GET` | `/api/listings/:id/history` | Public | Audit log of status transitions |
| `GET` | `/api/users` | Public | List available demo accounts |
| `POST` | `/api/users/switch` | Demo Only | Switch or create demo persona |
| `POST` | `/api/reset-demo` | Demo Only | Reset database with fresh sample data |

---

## 📄 License

MIT. Built for university and college campus communities.
