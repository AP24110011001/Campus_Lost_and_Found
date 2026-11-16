import React from 'react';
import { Listing } from '../types';
import { TypeBadge, StatusBadge } from './StatusBadge';
import { 
  MapPin, 
  Calendar, 
  Tag, 
  Images, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onReviewClaims?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, onReviewClaims }) => {
  const primaryImage = listing.images && listing.images.length > 0 ? listing.images[0].file_path : null;
  const imageCount = listing.images?.length || 0;

  // Format date
  const formattedDate = new Date(listing.date_lost_or_found).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Top Image Preview Banner */}
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <span className="text-4xl mb-1">📦</span>
            <span className="text-xs font-semibold">No Image Provided</span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <TypeBadge type={listing.type} />
          <StatusBadge status={listing.status} />
        </div>

        {/* Multi-image counter */}
        {imageCount > 1 && (
          <div className="absolute bottom-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Images className="w-3.5 h-3.5" />
            <span>{imageCount} photos</span>
          </div>
        )}

        {/* Category tag on image */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
          <Tag className="w-3 h-3 text-indigo-600" />
          <span>{listing.category}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Date row */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 gap-2">
            <span className="inline-flex items-center gap-1 truncate font-medium text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{listing.campus_location}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
            {listing.title}
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {listing.description}
          </p>

          {/* Specific Location Note if present */}
          {listing.specific_location && (
            <div className="text-[11px] bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-600 mb-3 truncate">
              <span className="font-semibold text-slate-700">Specific spot: </span>
              {listing.specific_location}
            </div>
          )}
        </div>

        {/* Footer info & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          {/* Poster info or claims badge */}
          {listing.is_owner ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Your Listing
              </span>
              {(listing.pending_claims_count || 0) > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  {listing.pending_claims_count} claim{listing.pending_claims_count === 1 ? '' : 's'} to review!
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <span className="text-slate-400">Posted by:</span>
              <span className="font-semibold text-slate-700 truncate">{listing.creator_name}</span>
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
            <span>{listing.is_owner ? 'Manage' : 'Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

