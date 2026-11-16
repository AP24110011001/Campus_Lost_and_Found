import React, { useState, useEffect, useCallback } from 'react';
import { Listing, Claim } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TypeBadge, StatusBadge, ClaimStatusBadge } from '../components/StatusBadge';
import { 
  Inbox, 
  Send, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Phone, 
  ArrowRight, 
  PlusCircle, 
  Sparkles,
  AlertCircle,
  UserCheck
} from 'lucide-react';

interface MyActivityPageProps {
  onSelectListing: (listingId: string) => void;
  onReviewClaims: (listingId: string) => void;
  onNavigateCreate: () => void;
  initialTab?: 'listings' | 'claims';
}

export const MyActivityPage: React.FC<MyActivityPageProps> = ({
  onSelectListing,
  onReviewClaims,
  onNavigateCreate,
  initialTab = 'listings',
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'claims'>(initialTab);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!currentUser) {
      setMyListings([]);
      setMyClaims([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getMyActivity();
      setMyListings(data.my_listings);
      setMyClaims(data.my_claims);
    } catch (err) {
      console.error('Failed to load user activity:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPendingReviews = myListings.reduce(
    (acc, item) => acc + (item.pending_claims_count || 0),
    0
  );

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Campus Activity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track items you have reported and manage claims you have submitted as{' '}
          <strong className="text-slate-800">{currentUser ? currentUser.name : 'Anonymous Guest'}</strong>.
        </p>
      </div>

      {/* Guest Notice if not signed in */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Demo Persona Required:</strong> You are currently browsing as an anonymous guest. Please choose a demo persona (e.g. Alex Rivera or Samira Khan) from the header dropdown to view your personal activity and claim reviews.
          </div>
        </div>
      )}

      {/* Accessible Tabs */}
      <div role="tablist" aria-label="Activity Categories" className="flex items-center gap-2 border-b border-slate-200">
        <button
          role="tab"
          id="tab-listings"
          aria-selected={activeTab === 'listings'}
          aria-controls="panel-listings"
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeTab === 'listings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>My Listings</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {myListings.length}
          </span>
          {totalPendingReviews > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold animate-pulse">
              {totalPendingReviews} to review
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-claims"
          aria-selected={activeTab === 'claims'}
          aria-controls="panel-claims"
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition -mb-px focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeTab === 'claims'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Submitted Claims</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {myClaims.length}
          </span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse flex gap-4">
              <div className="w-24 h-24 bg-slate-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: MY LISTINGS */}
      {!loading && activeTab === 'listings' && (
        <div id="panel-listings" role="tabpanel" aria-labelledby="tab-listings" className="space-y-4">
          {myListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto mb-4 text-indigo-600">
                📦
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No listings posted yet</h3>
              <p className="text-xs text-slate-500 mb-6">
                You have not reported any lost or found belongings under this persona.
              </p>
              <button
                onClick={onNavigateCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <PlusCircle className="w-4 h-4" />
                Report an Item Now
              </button>
            </div>
          ) : (
            myListings.map((listing) => {
              const primaryImage = listing.images && listing.images.length > 0 ? listing.images[0].file_path : null;
              const hasPendingClaims = (listing.pending_claims_count || 0) > 0;

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {primaryImage ? (
                        <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={listing.type} />
                        <StatusBadge status={listing.status} />
                        <span className="text-xs text-slate-500 font-medium">
                          &bull; {listing.category}
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectListing(listing.id)}
                        className="font-bold text-slate-900 text-base hover:text-indigo-600 cursor-pointer transition line-clamp-1"
                      >
                        {listing.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {listing.campus_location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Claims Count */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    {hasPendingClaims ? (
                      <button
                        onClick={() => onReviewClaims(listing.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs animate-pulse focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        Review Claims ({listing.pending_claims_count})
                      </button>
                    ) : (
                      <button
                        onClick={() => onReviewClaims(listing.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        View Claims ({listing.claims_count || 0})
                      </button>
                    )}

                    <button
                      onClick={() => onSelectListing(listing.id)}
                      className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Manage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: MY CLAIMS */}
      {!loading && activeTab === 'claims' && (
        <div id="panel-claims" role="tabpanel" aria-labelledby="tab-claims" className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto mb-4 text-indigo-600">
                🏷️
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No claims submitted yet</h3>
              <p className="text-xs text-slate-500 mb-6">
                When you find your lost belonging in the public directory, submit a claim to verify ownership.
              </p>
            </div>
          ) : (
            myClaims.map((claim) => {
              const isApproved = claim.status === 'approved';

              return (
                <div
                  key={claim.id}
                  className={`bg-white rounded-2xl p-5 border shadow-xs transition space-y-4 ${
                    isApproved
                      ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Bar with Title and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {claim.listing_type && <TypeBadge type={claim.listing_type} />}
                        <span className="text-xs text-slate-500 font-medium">
                          {claim.listing_category} &bull; {claim.listing_campus_location}
                        </span>
                      </div>
                      <h3
                        onClick={() => onSelectListing(claim.listing_id)}
                        className="font-bold text-slate-900 text-base hover:text-indigo-600 cursor-pointer transition"
                      >
                        {claim.listing_title}
                      </h3>
                    </div>

                    <div className="self-start sm:self-center">
                      <ClaimStatusBadge status={claim.status} />
                    </div>
                  </div>

                  {/* Submission details recap */}
                  <div className="text-xs space-y-2">
                    <div className="text-slate-500">
                      <strong className="text-slate-700">Your Verification Proof: </strong>
                      <span className="italic text-slate-800">&ldquo;{claim.verification_details}&rdquo;</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Submitted on {new Date(claim.created_at).toLocaleDateString()} &bull; Posted by {claim.listing_creator_name}
                    </div>
                  </div>

                  {/* REVEALED CONTACT INFORMATION (CRITICAL TRUST REQUIREMENT) */}
                  {isApproved && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Owner Contact Revealed for Return Coordination
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-2">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          Poster Contact &amp; Meetup Instructions:
                        </div>
                        <div className="font-mono text-xs text-slate-900 font-bold bg-slate-50 p-2.5 rounded">
                          {claim.listing_creator_contact || 'Contact verified by campus authority.'}
                        </div>
                        {claim.listing_creator_email && (
                          <div className="text-slate-500 text-[11px]">
                            Campus Email: <span className="font-semibold text-slate-700">{claim.listing_creator_email}</span>
                          </div>
                        )}
                        {claim.review_notes && (
                          <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                            <strong>Note from Owner: </strong>
                            {claim.review_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If Rejected */}
                  {claim.status === 'rejected' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                      <strong>Rejection Reason: </strong>
                      {claim.review_notes || 'Verification proof did not match the owner’s private records.'}
                    </div>
                  )}

                  {/* Link to view original listing */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onSelectListing(claim.listing_id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      View Original Listing
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
