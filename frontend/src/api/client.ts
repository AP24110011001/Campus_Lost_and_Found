import { Listing, Claim, ListingHistory, PlatformStats, User } from '../types';

const API_BASE = '/api';

export function getStoredUserId(): string | null {
  return localStorage.getItem('campus_user_id');
}

export function setStoredUserId(id: string): void {
  localStorage.setItem('campus_user_id', id);
}

export function clearStoredUserId(): void {
  localStorage.removeItem('campus_user_id');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getStoredUserId();
  const headers = new Headers(options.headers || {});

  // Attach demo identity header if an active demo persona is selected
  if (userId) {
    headers.set('x-user-id', userId);
  }

  // Set json content type if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.errors ? data.errors.join(', ') : `Request failed with status ${response.status}`);
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).code = data.code;
    throw err;
  }

  return data as T;
}

export const api = {
  // Users & Demo Personas
  getUsers: () => request<{ users: User[]; is_demo_mode: boolean }>('/users'),
  getCurrentUser: () => request<{ user: User | null; is_authenticated: boolean; is_demo_mode: boolean }>('/users/me'),
  switchUser: (body: { userId?: string; name?: string; email?: string; role?: string; department?: string }) =>
    request<{ user: User; message: string }>('/users/switch', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Stats
  getStats: () => request<PlatformStats>('/stats'),
  resetDemo: () => request<{ message: string }>('/reset-demo', { method: 'POST' }),

  // Listings
  getListings: (params: {
    type?: string;
    category?: string;
    location?: string;
    search?: string;
    status?: string;
    sort?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'all') query.set('type', params.type);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.location && params.location !== 'All') query.set('location', params.location);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return request<{ listings: Listing[] }>(`/listings${qs ? `?${qs}` : ''}`);
  },

  getListing: (id: string) => request<{ listing: Listing }>(`/listings/${id}`),

  createListing: (formData: FormData) =>
    request<{ listing: Listing; message: string }>('/listings', {
      method: 'POST',
      body: formData,
    }),

  updateListingStatus: (id: string, status: string) =>
    request<{ message: string; status: string }>(`/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteListing: (id: string) =>
    request<{ message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    }),

  // Claims
  submitClaim: (
    listingId: string,
    data: { verification_details: string; claimant_contact: string; claimant_message?: string }
  ) =>
    request<{ message: string; claim: Claim }>(`/listings/${listingId}/claims`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getListingClaims: (listingId: string) =>
    request<{ listing: Partial<Listing>; claims: Claim[] }>(`/listings/${listingId}/claims`),

  reviewClaim: (claimId: string, action: 'approve' | 'reject', review_notes?: string) =>
    request<{ message: string; claim_status: string; listing_status?: string }>(`/claims/${claimId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, review_notes }),
    }),

  getMyActivity: () =>
    request<{ my_listings: Listing[]; my_claims: Claim[] }>('/my-activity'),

  // History / Audit log
  getListingHistory: (listingId: string) =>
    request<{ history: ListingHistory[] }>(`/listings/${listingId}/history`),
};
