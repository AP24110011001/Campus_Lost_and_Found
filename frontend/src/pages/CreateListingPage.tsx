import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ListingCategory, ListingType } from '../types';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  ShieldCheck, 
  Lock, 
  HelpCircle, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  UserCheck
} from 'lucide-react';

interface CreateListingPageProps {
  onBack: () => void;
  onSuccess: (listingId: string) => void;
}

const CATEGORIES: ListingCategory[] = [
  'Electronics',
  'IDs & Cards',
  'Bags & Backpacks',
  'Keys',
  'Clothing & Accessories',
  'Books & Stationery',
  'Jewelry & Watches',
  'Other',
];

const CAMPUS_LOCATIONS = [
  'Main Library',
  'Student Union',
  'Science Complex',
  'Recreation Center',
  'Engineering Hall',
  'Mathematics Hall',
  'Dining Commons',
  'University Quad',
  'Campus Health Center',
  'Parking Garage A & B',
  'Other Campus Location',
];

export const CreateListingPage: React.FC<CreateListingPageProps> = ({ onBack, onSuccess }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [type, setType] = useState<ListingType>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [dateLostOrFound, setDateLostOrFound] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [campusLocation, setCampusLocation] = useState('Main Library');
  const [specificLocation, setSpecificLocation] = useState('');
  
  // Verification security fields
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [privateVerificationNotes, setPrivateVerificationNotes] = useState('');
  const [privateContact, setPrivateContact] = useState('');

  // Image files & previews
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Handle image selection with strict format and size validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

      // Explicitly reject SVG uploads
      if (file.type.includes('svg') || ext === '.svg') {
        error(`SVG files are not permitted for security reasons. Please upload JPG, PNG, WEBP, or GIF photos.`);
        continue;
      }

      if (!allowedExtensions.includes(ext) || !file.type.startsWith('image/')) {
        error(`File '${file.name}' is not an accepted image format. Only JPG, PNG, WEBP, and GIF are allowed.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        error(`File '${file.name}' exceeds the 5MB size limit.`);
        continue;
      }

      if (selectedFiles.length + validFiles.length >= 5) {
        error('Maximum 5 images allowed per listing.');
        break;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!currentUser) {
      error('Please select an active demo persona from the header dropdown before reporting an item.');
      return;
    }

    // Client side validation
    const errors: string[] = [];
    if (!title.trim() || title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.');
    }
    if (!description.trim() || description.trim().length < 10) {
      errors.push('Public description must be at least 10 characters long.');
    }
    if (!verificationQuestion.trim() || verificationQuestion.trim().length < 8) {
      errors.push('Verification challenge question must be at least 8 characters long.');
    }
    if (!privateVerificationNotes.trim() || privateVerificationNotes.trim().length < 5) {
      errors.push('Private verification details are required so you can evaluate incoming claims.');
    }
    if (!privateContact.trim() || privateContact.trim().length < 5) {
      errors.push('Private contact info is required so approved claimants can coordinate with you.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('date_lost_or_found', dateLostOrFound);
      formData.append('campus_location', campusLocation);
      formData.append('specific_location', specificLocation.trim());
      formData.append('verification_question', verificationQuestion.trim());
      formData.append('private_verification_notes', privateVerificationNotes.trim());
      formData.append('private_contact', privateContact.trim());

      // Append images
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.createListing(formData);
      success(res.message || 'Listing published successfully!');
      onSuccess(res.listing.id);
    } catch (err: any) {
      error(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel &amp; Return
        </button>
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          Posting as: <strong className="text-slate-800">{currentUser ? currentUser.name : 'Anonymous Guest (Sign-in required)'}</strong>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report an Item
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide public item descriptions and configure private verification safeguards to securely return belongings.
        </p>
      </div>

      {/* Sign-in Warning if Anonymous */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Demo Persona Required:</strong> You are currently browsing as an anonymous guest. Please switch to an active persona (e.g. Alex Rivera or Samira Khan) in the top-right navigation dropdown to publish a listing.
          </div>
        </div>
      )}

      {/* Validation Errors banner */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800">
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Please resolve the following issues:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Lost vs Found Toggle */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Are you reporting a lost or found item? *
          </span>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                type === 'lost'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <AlertCircle className={`w-6 h-6 ${type === 'lost' ? 'text-amber-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold text-sm">I Lost Something</div>
                <div className="text-[11px] text-slate-500">Help the campus community identify and return it</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('found')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                type === 'found'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <CheckCircle2 className={`w-6 h-6 ${type === 'found' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold text-sm">I Found Something</div>
                <div className="text-[11px] text-slate-500">Safely locate the owner through private verification</div>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Item Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            2. Basic Item Information
          </h2>

          <div>
            <label htmlFor="listing-title" className="block text-xs font-bold text-slate-700 mb-1">
              Item Title *
            </label>
            <input
              id="listing-title"
              type="text"
              required
              placeholder="e.g. Navy Blue The North Face Recon Backpack"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-category" className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                id="listing-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="listing-date" className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'lost' ? 'Date Lost *' : 'Date Found *'}
              </label>
              <input
                id="listing-date"
                type="date"
                required
                value={dateLostOrFound}
                onChange={(e) => setDateLostOrFound(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-location" className="block text-xs font-bold text-slate-700 mb-1">
                Campus Location *
              </label>
              <select
                id="listing-location"
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="listing-specific-location" className="block text-xs font-bold text-slate-700 mb-1">
                Specific Area / Room Notes
              </label>
              <input
                id="listing-specific-location"
                type="text"
                placeholder="e.g. 2nd Floor Study Carrel near West Windows"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="listing-description" className="block text-xs font-bold text-slate-700 mb-1">
              Public Description *
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5 leading-tight">
              Describe general visible attributes. <strong>Security Notice:</strong> Do NOT disclose unique secret stickers, engravings, or inner contents here—use the private verification question below!
            </p>
            <textarea
              id="listing-description"
              required
              rows={3}
              placeholder="e.g. Left behind after 3 PM lecture. Blue canvas exterior with standard wear..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Step 3: Photos Upload */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Photos (Optional, Up to 5)
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Max 5MB &bull; JPG, PNG, WEBP, GIF
            </span>
          </div>

          <label 
            htmlFor="file-upload" 
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition focus-within:ring-2 focus-within:ring-indigo-500"
          >
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-bold text-slate-800">
              Click to select photos or drag and drop
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              Images are verified by server magic bytes. SVGs are rejected to protect community safety.
            </span>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {/* Previews Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-2xs">
                  <img src={preview} alt="Upload preview thumbnail" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={`Remove photo ${idx + 1}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Verification Safeguard (Crucial Trust & Safety) */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/60 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-indigo-200">
              4. Private Verification Safeguards
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            This verification process prevents bad actors from claiming belongings that are not theirs.
          </p>

          {/* Question (Public) */}
          <div className="space-y-1">
            <label htmlFor="verification-question" className="block text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Public Verification Question *
            </label>
            <p className="text-[11px] text-indigo-200 leading-tight">
              What question should the true owner answer to prove ownership? (Shown publicly)
            </p>
            <input
              id="verification-question"
              type="text"
              required
              placeholder="e.g. What specific sticker or engraving is on the device, or what items are in the pouch?"
              value={verificationQuestion}
              onChange={(e) => setVerificationQuestion(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
            />
          </div>

          {/* Secret Answer / Reference Notes (Private to Creator) */}
          <div className="space-y-1">
            <label htmlFor="private-verification-notes" className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Your Private Verification Notes (Secret) *
            </label>
            <p className="text-[11px] text-slate-300 leading-tight">
              <strong>STRICTLY PRIVATE:</strong> The secret answer or identifying marks known only to you. This is NEVER sent in public API responses!
            </p>
            <textarea
              id="private-verification-notes"
              required
              rows={2}
              placeholder="e.g. Has laser engraving 'A.R. 2024' on back lid; inside zip pocket has blue USB drive and Student ID #9823."
              value={privateVerificationNotes}
              onChange={(e) => setPrivateVerificationNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
            />
          </div>

          {/* Private Contact Details */}
          <div className="space-y-1 pt-2 border-t border-indigo-800/80">
            <label htmlFor="private-contact" className="block text-xs font-bold text-white flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" />
              Your Private Contact Details &amp; Meetup Instructions *
            </label>
            <p className="text-[11px] text-indigo-200 leading-tight">
              Hidden from the public. Only revealed to a claimant when you review and <strong>approve</strong> their claim.
            </p>
            <input
              id="private-contact"
              type="text"
              required
              placeholder="e.g. Cell: (555) 018-4420, Discord: @alex_cs, Meet outside Library Help Desk"
              value={privateContact}
              onChange={(e) => setPrivateContact(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !currentUser}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-200 transition flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Publishing Listing...' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};
