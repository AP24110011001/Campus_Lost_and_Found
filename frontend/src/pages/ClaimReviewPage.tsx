import React, { useState, useEffect, useCallback } from 'react';
import { Claim, Listing } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TypeBadge, StatusBadge, ClaimStatusBadge } from '../components/StatusBadge';
import { fireCelebrationConfetti } from '../utils/confetti';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  Check, 
  X, 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  UserCheck
} from 'lucide-react';

interface ClaimReviewPageProps {
  listingId: string;
  onBack: () => void;
  onSelectListing: (listingId: string) => void;
}

export const ClaimReviewPage: React.FC<ClaimReviewPageProps> = ({
  listingId,
  onBack,
  onSelectListing,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [listing, setListing] = useState<Partial<Listing> | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review modal state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await api.getListingClaims(listingId);
      setListing(data.listing);
      setClaims(data.claims);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load claims. You may not be authorized to view this page.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleOpenReviewModal = (claim: Claim, action: 'approve' | 'reject') => {
    if (claim.status !== 'pending') {
      error(`This claim has already been ${claim.status}.`);
      return;
    }
    setSelectedClaim(claim);
    setReviewAction(action);
    setReviewNotes(
      action === 'approve'
        ? 'Verification details match. Let\'s coordinate meetup!'
        : 'The identifying details provided did not match the item.'
    );
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    try {
      setSubmittingReview(true);
      const res = await api.reviewClaim(selectedClaim.id, reviewAction, reviewNotes);
      success(res.message);

      if (reviewAction === 'approve') {
        fireCelebrationConfetti();
      }

      setSelectedClaim(null);
      await fetchClaims();
    } catch (err: any) {
      error(err.message || 'Failed to submit claim review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4 animate-pulse" aria-busy="true">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-xs text-rose-700 mb-6">{errorMsg || 'Only the creator of this listing can review submitted claims.'}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Safety
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listing
        </button>

        <div className="flex items-center gap-2">
          {listing.type && <TypeBadge type={listing.type} />}
          {listing.status && <StatusBadge status={listing.status} />}
        </div>
      </div>

      {/* Listing Summary & Secret Reference Notes */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Owner Claim Verification Portal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            {listing.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus Location: <strong>{listing.campus_location}</strong>
          </p>
        </div>

        {/* Verification Cheat Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
          {/* Public Question */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Public Verification Question:
            </div>
            <p className="italic text-slate-600">&ldquo;{listing.verification_question}&rdquo;</p>
          </div>

          {/* Secret Notes Known to Owner */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              Your Secret Notes (Comparison Key):
            </div>
            <p className="text-amber-800 font-medium">{listing.private_verification_notes}</p>
          </div>
        </div>
      </div>

      {/* Claims List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Submitted Claims</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {claims.length}
          </span>
        </h2>
      </div>

      {/* Claims List */}
      {claims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">No claims submitted yet</h3>
          <p className="text-xs text-slate-500">
            When campus members submit proof of ownership, their verification answers will appear here for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isApproved = claim.status === 'approved';
            const isPending = claim.status === 'pending';

            return (
              <div
                key={claim.id}
                className={`bg-white rounded-2xl p-6 border shadow-xs transition space-y-4 ${
                  isApproved
                    ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Claimant Identity & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {claim.claimant_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {claim.claimant_name}
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {claim.claimant_role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Submitted {new Date(claim.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-center">
                    <ClaimStatusBadge status={claim.status} />
                  </div>
                </div>

                {/* Claimant's Verification Answers */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Claimant&apos;s Verification Proof:
                  </div>
                  <p className="text-xs text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 font-medium">
                    {claim.verification_details}
                  </p>
                </div>

                {/* Contact and Message */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" />
                      Claimant Contact:
                    </div>
                    <div className="text-slate-800 font-mono text-[11px]">
                      {claim.claimant_contact}
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Email: {claim.claimant_email}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      Personal Message:
                    </div>
                    <div className="text-slate-600 italic">
                      {claim.claimant_message ? `"${claim.claimant_message}"` : 'No additional message provided.'}
                    </div>
                  </div>
                </div>

                {/* Review Notes (If already reviewed) */}
                {claim.review_notes && (
                  <div className="text-xs bg-slate-100 p-2.5 rounded-lg text-slate-700">
                    <span className="font-bold">Your Review Decision: </span>
                    {claim.review_notes}
                  </div>
                )}

                {/* Action Buttons for Pending Claims */}
                {isPending && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenReviewModal(claim, 'reject')}
                      className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(claim, 'approve')}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Check className="w-4 h-4" />
                      Verify &amp; Approve Claim
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedClaim && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="review-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="review-dialog-title" className="font-bold text-base text-slate-900 flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600" />
                    Approve Claim for {selectedClaim.claimant_name}
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-rose-600" />
                    Reject Claim from {selectedClaim.claimant_name}
                  </>
                )}
              </h3>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewAction === 'approve' ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                Approving this claim verifies {selectedClaim.claimant_name} as the rightful recipient. <strong>Your private contact details will be revealed to them</strong>, and the listing status will update to <strong>Resolved</strong>.
              </p>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Rejecting this claim will notify {selectedClaim.claimant_name} that their verification details did not match.
              </p>
            )}

            <form onSubmit={handleConfirmReview} className="space-y-4">
              <div>
                <label htmlFor="review-notes" className="block text-xs font-bold text-slate-700 mb-1">
                  {reviewAction === 'approve'
                    ? 'Meetup Instructions / Return Note (Optional)'
                    : 'Reason for Rejection (Optional)'}
                </label>
                <textarea
                  id="review-notes"
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'e.g. Can meet outside library security desk tomorrow at 2 PM.'
                      : 'e.g. Verification details did not match the engraving on the item.'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingReview
                    ? 'Processing...'
                    : reviewAction === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
