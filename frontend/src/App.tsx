import { useState, useEffect } from 'react';
import OperationalDashboard from './components/OperationalDashboard/OperationalDashboard';
import LandingPage from './components/LandingPage/LandingPage';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged, type User } from './firebase';
import './App.css';

const JURISDICTION_CITY = import.meta.env.VITE_DEFAULT_JURISDICTION_CITY || 'ZAMBOANGA CITY';

function App() {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' PHT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) setCurrentView('dashboard');
      else setCurrentView('landing');
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView('landing');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div
      className={
        currentView === 'dashboard' && user
          ? 'flex flex-col h-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300'
          : 'min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300'
      }
    >
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs">
        {/* Left: Brand + incident badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {/* Live status pulse */}
            <div className="relative flex items-center justify-center" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping absolute opacity-60"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block relative"></span>
            </div>

            <h1
              onClick={() => setCurrentView('landing')}
              className="text-sm font-black tracking-widest text-slate-900 dark:text-white flex items-center gap-2 select-none cursor-pointer uppercase"
              id="brand-logo"
            >
              <span>Sentinel</span>
              <span className="text-[#1976D2]">AI</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1976D2] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider ml-1 shadow-xs">
                EOC Copilot
              </span>
            </h1>
          </div>

          {/* Active incident / status badge */}
          {user && currentView === 'dashboard' ? (
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[#D32F2F] dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Active Incident #2026-07 — Tumaga River Flooding</span>
            </div>
          ) : (
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Cortex Engine Online</span>
            </div>
          )}
        </div>

        {/* Right: jurisdiction + time + auth + theme */}
        <div className="flex items-center gap-3">
          {/* Jurisdiction block */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400 shadow-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
              JURISDICTION:{' '}
              <strong className="text-slate-900 dark:text-white font-semibold uppercase">{JURISDICTION_CITY}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
            <span className="text-slate-900 dark:text-white font-bold tabular-nums">{timeStr}</span>
          </div>

          {/* User profile or sign-in */}
          {user ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs" id="user-profile-badge">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1976D2] dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'C')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate max-w-28">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Commander · Verified</span>
              </div>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="ml-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]"
            >
              <svg className="w-3.5 h-3.5 bg-white rounded-sm p-px" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <>
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-[#1976D2]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main
        className={
          currentView === 'dashboard' && user
            ? 'flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 relative'
            : 'flex-1 bg-[#F8FAFC] dark:bg-slate-950 relative'
        }
      >
        {currentView === 'dashboard' && user ? (
          <div className="w-full h-full p-3">
            <OperationalDashboard />
          </div>
        ) : (
          <LandingPage
            user={user}
            isAuthLoading={isAuthLoading}
            onGoogleSignIn={handleGoogleSignIn}
            onEnterDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
