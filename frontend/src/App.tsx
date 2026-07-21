import { useState, useEffect } from 'react';
import OperationalDashboard from './components/OperationalDashboard/OperationalDashboard';
import './App.css';

function App() {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' PHT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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

  return (
    <div className="app-shell flex flex-col h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Premium EOC Navigation Bar */}
      <header className="navbar flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/80 glass-panel shadow-xs z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-danger inline-block animate-ping absolute opacity-75"></span>
              <span className="w-3 h-3 rounded-full bg-danger inline-block relative"></span>
            </div>
            <h1 className="text-xl font-black tracking-wider text-foreground flex items-center gap-2 select-none">
              <span>SENTINEL</span>
              <span className="text-primary font-black">AI</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 ml-1">
                EMERGENCY OPERATIONS COPILOT
              </span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
            <span>INCIDENT #2026-07: TUMAGA RIVER FLOODING</span>
          </div>
        </div>

        {/* Right Section: Metadata & Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-3 text-neutral-foreground bg-neutral/10 px-3 py-1.5 rounded-lg border border-border">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              JURISDICTION: <strong className="text-foreground font-semibold">ZAMBOANGA CITY</strong>
            </span>
            <span className="text-border">|</span>
            <span className="text-foreground font-bold">{timeStr}</span>
          </div>

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

      {/* Main Operational Canvas */}
      <main className="app-shell-content flex-1 overflow-hidden p-3 bg-background">
        <OperationalDashboard />
      </main>
    </div>
  );
}

export default App;
