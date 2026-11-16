import React from 'react';
import { ListingHistory } from '../types';
import { 
  PlusCircle, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  Archive, 
  Clock 
} from 'lucide-react';

interface TimelineViewProps {
  history: ListingHistory[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No status history recorded yet.
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <PlusCircle className="w-4 h-4 text-indigo-600" />;
      case 'claim_submitted':
        return <Send className="w-4 h-4 text-amber-600" />;
      case 'claim_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'claim_rejected':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'status_changed':
        return <RotateCw className="w-4 h-4 text-blue-600" />;
      case 'closed':
        return <Archive className="w-4 h-4 text-slate-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionBg = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-indigo-50 border-indigo-200';
      case 'claim_submitted':
        return 'bg-amber-50 border-amber-200';
      case 'claim_approved':
        return 'bg-emerald-50 border-emerald-200';
      case 'claim_rejected':
        return 'bg-rose-50 border-rose-200';
      case 'status_changed':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((event) => {
        const dateObj = new Date(event.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const formattedTime = dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        return (
          <div key={event.id} className="relative group">
            {/* Timeline bullet icon */}
            <div
              className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center bg-white shadow-2xs ${getActionBg(
                event.action
              )}`}
            >
              {getActionIcon(event.action)}
            </div>

            {/* Event content */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span className="font-semibold text-slate-700">{event.actor_name}</span>
                <span>
                  {formattedDate} at {formattedTime}
                </span>
              </div>
              <div className="text-slate-800 font-medium leading-relaxed">
                {event.details}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

