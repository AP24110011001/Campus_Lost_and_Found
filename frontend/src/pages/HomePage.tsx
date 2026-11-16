import React, { useState, useEffect, useCallback } from 'react';
import { Listing, PlatformStats, ListingCategory, ListingType } from '../types';
import { api } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  PlusCircle, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Laptop, 
  Backpack, 
  CreditCard, 
  KeyRound, 
  Shirt, 
  BookOpen, 
  Watch, 
  HelpCircle,
  X,
  Filter
} from 'lucide-react';

interface HomePageProps {
  onSelectListing: (id: string) => void;
  onNavigateCreate: () => void;
  onReviewClaims: (listingId: string) => void;
}

const CATEGORIES: { label: ListingCategory | 'All'; icon: React.ReactNode }[] = [
  { label: 'All', icon: <Layers className="w-4 h-4" /> },
  { label: 'Electronics', icon: <Laptop className="w-4 h-4" /> },
  { label: 'Bags & Backpacks', icon: <Backpack className="w-4 h-4" /> },
  { label: 'IDs & Cards', icon: <CreditCard className="w-4 h-4" /> },
  { label: 'Keys', icon: <KeyRound className="w-4 h-4" /> },
  { label: 'Clothing & Accessories', icon: <Shirt className="w-4 h-4" /> },
  { label: 'Books & Stationery', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Jewelry & Watches', icon: <Watch className="w-4 h-4" /> },
  { label: 'Other', icon: <HelpCircle className="w-4 h-4" /> },
];

const CAMPUS_LOCATIONS = [
  'All',
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
];

export const HomePage: React.FC<HomePageProps> = ({ onSelectListing, onNavigateCreate, onReviewClaims }) => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('newest');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [listingsData, statsData] = await Promise.all([
        api.getListings({
          type: selectedType,
          category: selectedCategory,
          location: selectedLocation,
          status: selectedStatus,
          search: search.trim() || undefined,
          sort: selectedSort,
        }),
        api.getStats().catch(() => null),
      ]);
      setListings(listingsData.listings);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load campus listings');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, selectedLocation, selectedStatus, search, selectedSort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 200); // Debounce search input
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const clearFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedStatus('All');
    setSelectedSort('newest');
  };

  const hasActiveFilters =
    search !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'All' ||
    selectedLocation !== 'All' ||
    selectedStatus !== 'All';

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Campus Banner */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-indigo-800/40 p-6 sm:p-10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/60 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Private Verifiable Claims Process</span>
          </div>

          <h1 id="hero-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Lost something on campus? <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-emerald-300">
              Recover it safely and privately.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
            Report lost belongings, browse found items, and reclaim them through private verification questions. Your personal contact info stays hidden until ownership is verified by the poster.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-950/50 hover:shadow-lg transition transform active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost or Found Item
            </button>
            <button
              onClick={() => {
                setSelectedType('lost');
                setSearch('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10 backdrop-blur-xs transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Lost Items ({stats?.active_lost ?? '...'})
            </button>
            <button
              onClick={() => {
                setSelectedType('found');
                setSearch('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10 backdrop-blur-xs transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Found Items ({stats?.active_found ?? '...'})
            </button>
          </div>
        </div>

        {/* Live Quick Stats Strip */}
        {stats && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total_listings}</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Total Listings</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{stats.active_lost}</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Active Lost</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats.active_found}</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Active Found</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-300">{stats.resolved_returned}</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Reunited Items</div>
            </div>
          </div>
        )}
      </section>

      {/* Search & Filter Controls */}
      <section aria-label="Search and Filter Listings" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Search Bar & Type Tabs */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">Search items by title, description, or campus building</label>
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-input"
              type="text"
              placeholder="Search by item title, description, building, or specific room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Switcher Pills */}
          <div role="group" aria-label="Filter by listing type" className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0 border border-slate-200">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('lost')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedType === 'lost'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-100/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Lost Only
            </button>
            <button
              onClick={() => setSelectedType('found')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedType === 'found'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-100/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Found Only
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div role="group" aria-label="Filter by item category" className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters (Location, Status, Sort) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Campus Location Filter */}
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <label htmlFor="loc-filter" className="font-semibold text-slate-700">Location:</label>
              <select
                id="loc-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-slate-600">
              <label htmlFor="status-filter" className="font-semibold text-slate-700">Status:</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="in_claim">In Claim Review</option>
                <option value="resolved">Resolved / Returned</option>
              </select>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <label htmlFor="sort-select" className="font-semibold text-slate-700">Sort by:</label>
            <select
              id="sort-select"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="newest">Recently Posted</option>
              <option value="date_lost">Date Lost / Found</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Active Filters:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                Keyword: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} aria-label="Clear search keyword" className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full capitalize">
                Type: {selectedType}
                <button onClick={() => setSelectedType('all')} aria-label="Clear type filter" className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} aria-label="Clear category filter" className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedLocation !== 'All' && (
              <span className="inline-flex items-center gap-1 text-xs bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                Location: {selectedLocation}
                <button onClick={() => setSelectedLocation('All')} aria-label="Clear location filter" className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'All' && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full capitalize">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('All')} aria-label="Clear status filter" className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold ml-auto underline underline-offset-2 transition"
            >
              <RotateCcw className="w-3 h-3" />
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* Listings Grid / Results Area */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Campus Listings</span>
            {!loading && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {listings.length} item{listings.length === 1 ? '' : 's'}
              </span>
            )}
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="aspect-16/10 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="font-bold text-base mb-1">Failed to load listings</h3>
            <p className="text-xs text-rose-600 mb-4">{errorMsg}</p>
            <button
              onClick={fetchListings}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMsg && listings.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto mb-4 text-indigo-600">
              🔍
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No matching campus listings</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {hasActiveFilters
                ? 'No items matched your current search and filter combination. Try clearing some filters or searching for different keywords.'
                : 'No items reported in this category yet. Be the first to report a lost or found item!'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Clear All Filters
                </button>
              )}
              <button
                onClick={onNavigateCreate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
              >
                + Report an Item
              </button>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !errorMsg && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onClick={() => onSelectListing(item.id)}
                onReviewClaims={() => onReviewClaims(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
