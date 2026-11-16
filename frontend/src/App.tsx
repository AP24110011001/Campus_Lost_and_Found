import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { MyActivityPage } from './pages/MyActivityPage';
import { ClaimReviewPage } from './pages/ClaimReviewPage';
import { api } from './api/client';

type ViewMode = 'browse' | 'create' | 'activity' | 'detail' | 'review';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<ViewMode>('browse');
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [reviewListingId, setReviewListingId] = useState<string | null>(null);
  const [pendingClaimsCount, setPendingClaimsCount] = useState<number>(0);

  // Sync hash with views for back/forward navigation and reload stability
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('listing/')) {
        const id = hash.split('/')[1];
        setActiveListingId(id);
        setView('detail');
      } else if (hash.startsWith('review/')) {
        const id = hash.split('/')[1];
        setReviewListingId(id);
        setView('review');
      } else if (hash === 'create') {
        setView('create');
      } else if (hash === 'activity') {
        setView('activity');
      } else {
        setView('browse');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check pending claims for user
  useEffect(() => {
    if (!currentUser) return;
    api.getMyActivity()
      .then((data) => {
        const count = data.my_listings.reduce(
          (acc, item) => acc + (item.pending_claims_count || 0),
          0
        );
        setPendingClaimsCount(count);
      })
      .catch(() => {});
  }, [currentUser, view]);

  const navigateTo = (newView: ViewMode, id?: string) => {
    setView(newView);
    if (newView === 'detail' && id) {
      setActiveListingId(id);
      window.location.hash = `listing/${id}`;
    } else if (newView === 'review' && id) {
      setReviewListingId(id);
      window.location.hash = `review/${id}`;
    } else if (newView === 'create') {
      window.location.hash = 'create';
    } else if (newView === 'activity') {
      window.location.hash = 'activity';
    } else {
      window.location.hash = 'browse';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTab = view === 'create' ? 'create' : view === 'activity' ? 'activity' : 'browse';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header & Demo Controls */}
      <Navbar
        currentTab={navTab}
        onNavigate={(tab) => navigateTo(tab)}
        pendingClaimsCount={pendingClaimsCount}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {view === 'browse' && (
          <HomePage
            onSelectListing={(id) => navigateTo('detail', id)}
            onNavigateCreate={() => navigateTo('create')}
            onReviewClaims={(id) => navigateTo('review', id)}
          />
        )}

        {view === 'create' && (
          <CreateListingPage
            onBack={() => navigateTo('browse')}
            onSuccess={(id) => navigateTo('detail', id)}
          />
        )}

        {view === 'detail' && activeListingId && (
          <ListingDetailPage
            listingId={activeListingId}
            onBack={() => navigateTo('browse')}
            onReviewClaims={(id) => navigateTo('review', id)}
          />
        )}

        {view === 'activity' && (
          <MyActivityPage
            onSelectListing={(id) => navigateTo('detail', id)}
            onReviewClaims={(id) => navigateTo('review', id)}
            onNavigateCreate={() => navigateTo('create')}
          />
        )}

        {view === 'review' && reviewListingId && (
          <ClaimReviewPage
            listingId={reviewListingId}
            onBack={() => navigateTo('detail', reviewListingId)}
            onSelectListing={(id) => navigateTo('detail', id)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm">🎓 Campus Lost &amp; Found</span>
            <span className="text-slate-300">|</span>
            <span>Secure Student Belonging Recovery</span>
          </div>

          <div className="text-center sm:text-right text-slate-400">
            Powered by SQLite &bull; Private Verifiable Claim Safeguard &bull; Demo Environment
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

