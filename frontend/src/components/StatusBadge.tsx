import React from 'react';
import { ListingType, ListingStatus, ClaimStatus } from '../types';
import { AlertCircle, CheckCircle2, Clock, Check, Sparkles, XCircle } from 'lucide-react';

interface TypeBadgeProps {
  type: ListingType;
  className?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, className = '' }) => {
  if (type === 'lost') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        LOST
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs ${className}`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      FOUND
    </span>
  );
};

interface StatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'resolved':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 ${className}`}>
          <Sparkles className="w-3 h-3 text-purple-600" />
          Reunited &amp; Resolved
        </span>
      );
    case 'in_claim':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 ${className}`}>
          <Clock className="w-3 h-3 text-blue-600" />
          Claim in Review
        </span>
      );
    case 'closed':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <XCircle className="w-3 h-3 text-slate-500" />
          Closed
        </span>
      );
    case 'active':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
  }
};

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

export const ClaimStatusBadge: React.FC<ClaimStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ${className}`}>
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
          Claim Approved &bull; Contact Unlocked
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Claim Rejected
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
  }
};

