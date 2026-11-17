import React, { useState, useRef, useEffect } from 'react';
import { 
  LogIn, 
  LogOut, 
  Settings, 
  Loader2, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/sound';

interface UserMenuProps {
  onNavigateToSettings?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigateToSettings }) => {
  const { authUser, isAuthenticated, isGuest, openAuthModal, signOut, isActionLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = () => {
    soundFx.playCrystalChime(750);
    setIsOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    soundFx.playCrystalChime(650);
    setIsOpen(false);
    await signOut();
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    if (onNavigateToSettings) {
      onNavigateToSettings();
    }
  };

  // If in guest mode, show the Sign In button
  if (isGuest || !isAuthenticated || !authUser) {
    return (
      <button
        id="header-sign-in-btn"
        onClick={() => openAuthModal('signin')}
        className="flex items-center gap-1.5 h-8.5 px-2.5 sm:px-3 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer text-xs font-semibold active:scale-98 flex-shrink-0"
        title="Sign in or create an account"
        aria-label="Sign In"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    );
  }

  // Get 2-character initials
  const initials = authUser.fullName
    ? authUser.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'HF';

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        id="header-user-menu-btn"
        onClick={handleToggleMenu}
        className="flex items-center gap-1.5 sm:gap-2 h-8.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer text-xs"
        aria-label="User account menu"
        aria-expanded={isOpen}
      >
        {authUser.avatarUrl ? (
          <img
            src={authUser.avatarUrl}
            alt={authUser.fullName}
            className="w-5.5 h-5.5 rounded-full object-cover border border-indigo-500/40"
          />
        ) : (
          <div className="w-5.5 h-5.5 rounded-full bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300">
            {initials}
          </div>
        )}

        <span className="hidden sm:inline font-semibold text-slate-200 max-w-[90px] truncate">
          {authUser.fullName.split(' ')[0]}
        </span>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#11141f] border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Identity header */}
          <div className="px-3.5 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {authUser.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt={authUser.fullName}
                  className="w-8 h-8 rounded-lg object-cover border border-indigo-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{authUser.fullName}</div>
                <div className="text-xs text-slate-400 truncate">{authUser.email}</div>
              </div>
            </div>

            {/* Verification and Provider Badges */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                {authUser.provider === 'google' ? 'Google' : 'Email'}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  authUser.isConfirmed
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}
              >
                {authUser.isConfirmed ? 'Verified' : 'Unconfirmed'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-1 space-y-0.5">
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={handleGoToSettings}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Preferences</span>
              </button>
            )}

            {/* Sign Out Action */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isActionLoading}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
