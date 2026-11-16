import React, { useState, useEffect, useCallback } from 'react';
import { Listing, ListingHistory } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ImageGallery } from '../components/ImageGallery';
import { TypeBadge, StatusBadge, ClaimStatusBadge } from '../components/StatusBadge';
import { TimelineView } from '../components/TimelineView';
import { fireCelebrationConfetti } from '../utils/confetti';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Inbox, 
  Trash2, 
  RotateCw,
  HelpCircle,
  Eye,
  Lock,
  Sparkles,
  X,
  UserCheck
} from 'lucide-react';

interface ListingDetailPageProps {
  listingId: string;
  onBack: () => void;
  onReviewClaims: (listingId: string) => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listingId,
  onBack,
  onReviewClaims,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [history, setHistory] = useState<ListingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Claim Form State
  const [verificationDetails, setVerificationDetails] = useState('');
  const [claimantContact, setClaimantContact] = useState('');
  const [claimantMessage, setClaimantMessage] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  // Status & Delete modals
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchListingData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [listingData, historyData] = await Promise.all([
        api.getListing(listingId),
        api.getListingHistory(listingId).catch(() => ({ history: [] })),
      ]);
      setListing(listingData.listing);
      setHistory(historyData.history);

      if (currentUser && !claimantContact) {
        setClaimantContact(currentUser.email);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load listing details');
    } finally {
      setLoading(false);
    }
  }, [listingId, currentUser, claimantContact]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  // Submit Claim handler
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      error('Please select an active demo persona from the header before submitting a claim.');
      return;
    }

    if (!verificationDetails.trim() || !claimantContact.trim()) {
      error('Please provide both the verification proof and your contact details.');
      return;
    }

    try {
      setSubmittingClaim(true);
      const res = await api.submitClaim(listingId, {
        verification_details: verificationDetails,
        claimant_contact: claimantContact,
        claimant_message: claimantMessage,
      });

      success(res.message || 'Claim submitted successfully!');
      setShowClaimForm(false);
      await fetchListingData();
    } catch (err: any) {
      error(err.message || 'Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Status Change handler
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await api.updateListingStatus(listingId, newStatus);
      success(`Listing status updated to ${newStatus}`);
      if (newStatus === 'resolved') {
        fireCelebrationConfetti();
      }
      await fetchListingData();
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Listing handler
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await api.deleteListing(listingId);
      success('Listing and associated images removed successfully.');
      setDeleteModalOpen(false);
      onBack();
    } catch (err: any) {
      error(err.message || 'Failed to delete listing');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse" aria-busy="true">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="aspect-16/10 bg-slate-200 rounded-2xl" />
        <div className="h-8 bg-slate-200 rounded w-2/3" />
        <div className="h-20 bg-slate-200 rounded" />
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Listing Not Found</h2>
          <p className="text-xs text-rose-700 mb-6">{errorMsg || 'This listing may have been deleted or does not exist.'}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(listing.date_lost_or_found).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isResolved = listing.status === 'resolved';
  const hasUserClaimed = Boolean(listing.user_claim);
  const userClaim = listing.user_claim;

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8 animate-fade-in">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        <div className="flex items-center gap-2">
          <TypeBadge type={listing.type} />
          <StatusBadge status={listing.status} />
        </div>
      </div>

      {/* Main Grid: Left Column Images & Info | Right Column Claims & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Photos & Public Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photos Carousel */}
          <ImageGallery images={listing.images} title={listing.title} />

          {/* Title & Metadata Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md mb-2">
                <Tag className="w-3 h-3" />
                {listing.category}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {listing.title}
              </h1>
            </div>

            {/* Location & Date Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-start gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">{listing.campus_location}</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">
                    {listing.specific_location || 'General campus building'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">
                    {listing.type === 'lost' ? 'Lost on:' : 'Found on:'}
                  </div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">{formattedDate}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Public Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Posted By Persona Info */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {listing.creator_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    {listing.creator_name}
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                      {listing.creator_role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Reported on {new Date(listing.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {listing.is_owner && (
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  You are the poster
                </span>
              )}
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-indigo-600" />
              Activity &amp; Status History
            </h3>
            <TimelineView history={history} />
          </div>
        </div>

        {/* Right Column: Verification, Claims, & Owner Operations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Verification Challenge Card (Public Safeguard) */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-800/50 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verification Challenge
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent fraudulent claims, the finder/owner requires the true claimant to answer the question below. Private details are NOT listed in the public description.
            </p>

            <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 text-xs text-white">
              <div className="font-semibold text-indigo-200 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
                Challenge Question:
              </div>
              <div className="italic text-slate-100 leading-relaxed font-medium">
                &ldquo;{listing.verification_question}&rdquo;
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              Personal contact details remain protected until claim is approved.
            </div>
          </div>

          {/* SCENARIO 1: Owner View (Listing Creator) */}
          {listing.is_owner && (
            <div className="bg-white rounded-2xl p-5 border-2 border-indigo-200 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  Owner Verification Panel
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                  Private to You
                </span>
              </div>

              {/* Secret Reference Notes (Known only to creator) */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs">
                <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  Your Secret Verification Notes:
                </div>
                <p className="text-amber-800 leading-relaxed font-medium">
                  {listing.private_verification_notes || 'No secret notes recorded.'}
                </p>
                <div className="text-[10px] text-amber-700/80 mt-1.5">
                  &bull; Compare incoming claimant answers against these notes to verify ownership.
                </div>
              </div>

              {/* Private Contact Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  Your Protected Contact Information:
                </div>
                <p className="text-slate-700 leading-relaxed font-mono text-[11px]">
                  {listing.private_contact || 'No contact specified.'}
                </p>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  &bull; Automatically hidden from the public. Only revealed to claimants you approve.
                </div>
              </div>

              {/* CTA to Review Claims */}
              <button
                onClick={() => onReviewClaims(listing.id)}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Inbox className="w-4 h-4" />
                Review Submitted Claims
                {(listing.pending_claims_count || 0) > 0 && (
                  <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                    {listing.pending_claims_count} Pending
                  </span>
                )}
              </button>

              {/* Status Management Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {listing.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={updatingStatus}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Mark Reunited &amp; Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('active')}
                    disabled={updatingStatus}
                    className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                    Reopen as Active
                  </button>
                )}

                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition ml-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Listing
                </button>
              </div>
            </div>
          )}

          {/* SCENARIO 2: User Already Submitted a Claim */}
          {!listing.is_owner && hasUserClaimed && userClaim && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Your Claim Status</h3>
                <ClaimStatusBadge status={userClaim.status} />
              </div>

              {/* If Approved: Mutual Contact Exchange Revealed */}
              {userClaim.status === 'approved' && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-xs space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Claim Approved! Mutual Contact Revealed
                  </div>

                  <p className="text-emerald-800 leading-relaxed">
                    The owner has verified your details and approved this claim. You can now reach out to coordinate pickup.
                  </p>

                  <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Poster Contact &amp; Meetup Instructions:
                    </div>
                    <div className="font-mono text-xs text-slate-900 font-bold bg-slate-50 p-2.5 rounded-lg">
                      {listing.private_contact || 'Contact verified by campus desk.'}
                    </div>
                    {userClaim.review_notes && (
                      <div className="text-slate-600 pt-1 text-[11px]">
                        <span className="font-bold text-slate-700">Owner Note: </span>
                        {userClaim.review_notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* If Pending */}
              {userClaim.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Claim Under Review
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Your verification answer has been sent to the poster. They will review your answers against the hidden identifying details.
                  </p>
                </div>
              )}

              {/* If Rejected */}
              {userClaim.status === 'rejected' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-rose-900">Claim Rejected by Poster</div>
                  <p className="text-rose-800 leading-relaxed">
                    {userClaim.review_notes || 'The verification details provided did not match the item.'}
                  </p>
                </div>
              )}

              {/* Summary of What Claimant Submitted */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
                <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Your Submitted Proof:
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 italic">
                  &ldquo;{userClaim.verification_details}&rdquo;
                </div>
                <div className="text-[11px] text-slate-400">
                  Submitted on {new Date(userClaim.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* SCENARIO 3: Item is Resolved and User Didn't Claim */}
          {!listing.is_owner && !hasUserClaimed && isResolved && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center text-xs space-y-2">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto" />
              <h3 className="font-bold text-sm text-purple-900">Item Successfully Reunited</h3>
              <p className="text-purple-700 leading-relaxed">
                This item has already been claimed, verified, and returned to its rightful owner.
              </p>
            </div>
          )}

          {/* SCENARIO 4: Public Visitor / Claimant Form */}
          {!listing.is_owner && !hasUserClaimed && !isResolved && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Is this your item?</h3>
                  <p className="text-xs text-slate-500">
                    Submit verification proof to privately reclaim your belonging.
                  </p>
                </div>
              </div>

              {!showClaimForm ? (
                <button
                  onClick={() => setShowClaimForm(true)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-100 transition flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Send className="w-4 h-4" />
                  Submit a Claim
                </button>
              ) : (
                <form onSubmit={handleSubmitClaim} className="space-y-4 pt-2">
                  {!currentUser && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Please select a demo persona in the top navigation to submit this claim.</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="claim-proof" className="block text-xs font-bold text-slate-700 mb-1">
                      Verification Proof *
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5 leading-tight">
                      Answer the question: &ldquo;{listing.verification_question}&rdquo;
                    </p>
                    <textarea
                      id="claim-proof"
                      required
                      rows={3}
                      value={verificationDetails}
                      onChange={(e) => setVerificationDetails(e.target.value)}
                      placeholder="e.g. Laser engraving on lid says 'A.R. 2024', sticker on back is mint green..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label htmlFor="claim-contact" className="block text-xs font-bold text-slate-700 mb-1">
                      Your Contact Info *
                    </label>
                    <input
                      id="claim-contact"
                      type="text"
                      required
                      value={claimantContact}
                      onChange={(e) => setClaimantContact(e.target.value)}
                      placeholder="e.g. Phone: (555) 019-3388 or student email"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Kept private. Only revealed if the poster approves your claim.
                    </div>
                  </div>

                  <div>
                    <label htmlFor="claim-message" className="block text-xs font-bold text-slate-700 mb-1">
                      Message to Poster (Optional)
                    </label>
                    <input
                      id="claim-message"
                      type="text"
                      value={claimantMessage}
                      onChange={(e) => setClaimantMessage(e.target.value)}
                      placeholder="e.g. I can meet you at the library desk today."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingClaim || !currentUser}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal for Listing Deletion */}
      {deleteModalOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                Permanently Delete Listing?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>{listing.title}</strong>? All submitted claims and uploaded image files on disk will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
