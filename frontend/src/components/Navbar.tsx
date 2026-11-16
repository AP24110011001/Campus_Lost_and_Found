import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { 
  Search, 
  PlusCircle, 
  ShieldAlert, 
  RotateCcw, 
  ChevronDown, 
  Menu, 
  X, 
  Sparkles,
  Inbox,
  UserPlus,
  LogOut,
  User as UserIcon,
  HelpCircle
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'browse' | 'create' | 'activity';
  onNavigate: (tab: 'browse' | 'create' | 'activity', listingId?: string) => void;
  pendingClaimsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, pendingClaimsCount = 0 }) => {
  const { currentUser, allUsers, switchUser, createPersona, clearPersona, isDemoMode } = useAuth();
  const { success, error } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newPersonaModal, setNewPersonaModal] = useState(false);
  const [resetConfirmModal, setResetConfirmModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // New persona form state
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<'student' | 'staff' | 'faculty'>('student');
  const [customDept, setCustomDept] = useState('');

  const handleReset = async () => {
    try {
      setResetting(true);
      await api.resetDemo();
      success('Demo database successfully reset with fresh sample listings and personas.');
      setResetConfirmModal(false);
      window.location.reload();
    } catch (err: any) {
      error(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  const handleCreatePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customEmail) return;
    try {
      await createPersona({
        name: customName,
        email: customEmail,
        role: customRole,
        department: customDept || undefined,
      });
      setNewPersonaModal(false);
      setCustomName('');
      setCustomEmail('');
      setCustomDept('');
    } catch {
      // Handled in auth context
    }
  };

  return (
    <>
      {/* Top Demo Disclosure Banner */}
      <aside aria-label="Demo environment notice" className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-amber-200 text-xs py-2 px-4 border-b border-amber-800/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Demo Environment:</strong> Using switchable mock personas for demonstration. Private verification notes and phone numbers are protected server-side, but this mode does not replace real campus SSO.
            </span>
          </div>
          {isDemoMode && (
            <button
              onClick={() => setResetConfirmModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white underline underline-offset-2 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>
          )}
        </div>
      </aside>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => onNavigate('browse')}
            className="flex items-center gap-3 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('browse');
              }
            }}
            aria-label="Go to Campus Lost and Found home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <span className="text-xl" aria-hidden="true">🎓</span>
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                CampusFind
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Demo
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">Campus Belonging Recovery</div>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onNavigate('browse')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                currentTab === 'browse'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Search className="w-4 h-4" />
              Browse Listings
            </button>

            <button
              onClick={() => onNavigate('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                currentTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost / Found
            </button>

            <button
              onClick={() => onNavigate('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition relative focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                currentTab === 'activity'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              My Activity
              {pendingClaimsCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full animate-pulse">
                  {pendingClaimsCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Persona Switcher & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition group text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Demo persona menu"
              >
                {currentUser ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentUser.avatar_color}`}>
                    {currentUser.name.charAt(0)}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                    {currentUser ? currentUser.name : 'Anonymous Guest'}
                    {currentUser && (
                      <span className="text-[10px] font-semibold text-slate-500 capitalize">
                        ({currentUser.role})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser ? currentUser.department || 'Switch Persona' : 'Click to select account'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div 
                    role="menu"
                    aria-label="Demo personas"
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Select Demo Persona</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          Local Demo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Switch accounts to test owner verification, claim review, and privacy controls under different roles:
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {allUsers.map((user) => {
                        const isCurrent = user.id === currentUser?.id;
                        return (
                          <button
                            key={user.id}
                            role="menuitem"
                            onClick={() => {
                              switchUser(user.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition focus-visible:outline-hidden focus-visible:bg-indigo-50 ${
                              isCurrent
                                ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${user.avatar_color}`}>
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate flex items-center justify-between">
                                <span>{user.name}</span>
                                <span className="text-[10px] font-normal uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {user.role}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {user.department || user.email}
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Active persona" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1 px-2 space-y-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setNewPersonaModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-2 transition focus-visible:outline-hidden focus-visible:bg-indigo-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        + Create Custom Demo Persona
                      </button>

                      {currentUser && (
                        <button
                          onClick={() => {
                            clearPersona();
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg flex items-center gap-2 transition focus-visible:outline-hidden focus-visible:bg-slate-100"
                        >
                          <LogOut className="w-3.5 h-3.5 text-slate-400" />
                          Browse as Anonymous Guest
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Toggle mobile navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav aria-label="Mobile Navigation" className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            <button
              onClick={() => {
                onNavigate('browse');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                currentTab === 'browse' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              Browse Listings
            </button>
            <button
              onClick={() => {
                onNavigate('create');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                currentTab === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost / Found
            </button>
            <button
              onClick={() => {
                onNavigate('activity');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold ${
                currentTab === 'activity' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
              }`}
            >
              <span className="flex items-center gap-3">
                <Inbox className="w-4 h-4" />
                My Activity
              </span>
              {pendingClaimsCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                  {pendingClaimsCount}
                </span>
              )}
            </button>
          </nav>
        )}
      </header>

      {/* Confirmation Modal for Resetting Demo Data */}
      {resetConfirmModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 id="reset-modal-title" className="text-base font-bold text-slate-900">
                Reset Demo Database?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the sample campus items (AirPods, Backpack, Calculator, Keys, ID Card) and reset demo personas to their initial test state. Any temporary listings created during your session will be replaced.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Create Custom Demo Persona */}
      {newPersonaModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="create-persona-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 id="create-persona-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Create Demo Persona
              </h3>
              <button
                onClick={() => setNewPersonaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Add a custom campus member to test reporting items and submitting verifiable claims under different names.
            </p>
            <form onSubmit={handleCreatePersona} className="space-y-4">
              <div>
                <label htmlFor="custom-name" className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  id="custom-name"
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="custom-email" className="block text-xs font-bold text-slate-700 mb-1">Campus Email *</label>
                <input
                  id="custom-email"
                  type="email"
                  required
                  placeholder="e.g. jordan.lee@campus.edu"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="custom-role" className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    id="custom-role"
                    value={customRole}
                    onChange={(e: any) => setCustomRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Campus Staff</option>
                    <option value="faculty">Faculty / Grad</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="custom-dept" className="block text-xs font-bold text-slate-700 mb-1">Department / Dorm</label>
                  <input
                    id="custom-dept"
                    type="text"
                    placeholder="e.g. South Hall"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewPersonaModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  Create &amp; Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
