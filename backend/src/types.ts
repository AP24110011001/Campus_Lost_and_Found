export type UserRole = 'student' | 'staff' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_color: string;
  department?: string;
  created_at: string;
}

export type ListingType = 'lost' | 'found';
export type ListingCategory =
  | 'Electronics'
  | 'IDs & Cards'
  | 'Bags & Backpacks'
  | 'Keys'
  | 'Clothing & Accessories'
  | 'Books & Stationery'
  | 'Jewelry & Watches'
  | 'Other';

export type ListingStatus = 'active' | 'in_claim' | 'resolved' | 'closed';

export interface ListingImage {
  id: string;
  listing_id: string;
  file_path: string;
  filename: string;
  is_primary: number;
  created_at: string;
}

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  category: ListingCategory;
  description: string;
  date_lost_or_found: string;
  campus_location: string;
  specific_location: string;
  status: ListingStatus;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  creator_role: string;
  verification_question: string;
  private_verification_notes?: string; // Hidden unless authorized
  private_contact?: string; // Hidden unless authorized
  created_at: string;
  updated_at: string;
  images?: ListingImage[];
  claims_count?: number;
  is_owner?: boolean;
  user_claim?: Claim | null;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface Claim {
  id: string;
  listing_id: string;
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_role: string;
  verification_details: string;
  claimant_contact: string;
  claimant_message: string;
  status: ClaimStatus;
  review_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  listing_title?: string;
  listing_type?: ListingType;
  listing_creator_name?: string;
  listing_creator_contact?: string | null; // Revealed if approved
}

export interface ListingHistory {
  id: string;
  listing_id: string;
  actor_id: string;
  actor_name: string;
  action: 'created' | 'claim_submitted' | 'claim_approved' | 'claim_rejected' | 'status_changed' | 'closed';
  details: string;
  created_at: string;
}

