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
      if (currentUser) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
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
      console.error("Google Sign-In failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView('landing');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div
      className={
        currentView === 'dashboard' && user
          ? "app-shell flex flex-col h-screen overflow-hidden bg-background text-foreground transition-colors duration-300"
          : "app-shell min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300"
      }
    >
      {/* Premium EOC Navigation Bar */}
      <header className="navbar sticky top-0 z-50 flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-danger inline-block animate-ping absolute opacity-75"></span>
              <span className="w-3 h-3 rounded-full bg-danger inline-block relative"></span>
            </div>
            <h1
              onClick={() => setCurrentView('landing')}
              className="text-xl font-black tracking-wider text-foreground flex items-center gap-2 select-none cursor-pointer"
            >
              <span>SENTINEL</span>
              <span className="text-primary font-black">AI</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 ml-1">
                EMERGENCY OPERATIONS COPILOT
              </span>
            </h1>
          </div>

          {user && currentView === 'dashboard' ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              <span>ACTIVE INCIDENT #2026-07: TUMAGA RIVER FLOODING</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span>SNOWFLAKE CORTEX ENGINE ONLINE</span>
            </div>
          )}
        </div>

        {/* Right Section: Metadata & Navigation Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-3 text-neutral-foreground bg-neutral/10 px-3 py-1.5 rounded-lg border border-border">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              JURISDICTION: <strong className="text-foreground font-semibold uppercase">{JURISDICTION_CITY}</strong>
            </span>
            <span className="text-border">|</span>
            <span className="text-foreground font-bold">{timeStr}</span>
          </div>

          {/* User Auth Profile Badge or Sign In Button */}
          {user ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-card border border-border">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full border border-primary" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'C')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left font-sans leading-tight">
                <span className="text-[11px] font-bold text-foreground truncate max-w-30">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-success font-semibold">COMMANDER (VERIFIED)</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 text-[10px] font-sans text-neutral-foreground hover:text-danger hover:underline px-1.5 py-0.5 rounded"
                title="Sign Out"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="button button-primary button-sm flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans font-bold shadow-xs hover:shadow transition-all duration-200"
              title="Sign in with Google Account"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>SIGN IN WITH GOOGLE</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="button button-outline button-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all duration-200"
            title="Toggle Dark / Light Mode"
          >
            {isDarkMode ? (
              <>
                <svg className="w-3.5 h-3.5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
                <span>LIGHT</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span>DARK</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={
          currentView === 'dashboard' && user
            ? "app-shell-content flex-1 overflow-hidden bg-background relative"
            : "app-shell-content flex-1 bg-background relative"
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

