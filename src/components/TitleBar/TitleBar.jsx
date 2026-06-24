import React, { useState, useEffect } from 'react';
import './TitleBar.css';

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    // Check initial state
    window.electronAPI?.isMaximized().then(v => setMaximized(v)).catch(() => {});
  }, []);

  const handleMinimize  = () => window.electronAPI?.minimizeWindow();
  const handleMaximize  = () => {
    window.electronAPI?.maximizeWindow();
    setMaximized(m => !m);
  };
  const handleClose     = () => window.electronAPI?.closeWindow();

  return (
    <div className="titlebar">
      {/* Drag region — left branding */}
      <div className="titlebar__drag">
        {/* Ghost icon */}
        <svg className="titlebar__ghost" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z"
            fill="rgba(255,85,0,0.12)"
            stroke="rgba(255,85,0,0.6)"
            strokeWidth="2"
          />
          <circle cx="30" cy="40" r="4.5" fill="color-mix(in srgb, var(--accent-primary) 85%, transparent)" />
          <circle cx="50" cy="40" r="4.5" fill="color-mix(in srgb, var(--accent-primary) 85%, transparent)" />
        </svg>
        <span className="titlebar__name">
          <span style={{ color: 'var(--accent-primary)' }}>Hallow</span>
          <span style={{ color: 'var(--accent-secondary)' }}>Net</span>
        </span>
      </div>

      {/* Window control buttons */}
      <div className="titlebar__controls">
        <button
          className="titlebar__btn titlebar__btn--minimize"
          onClick={handleMinimize}
          title="Minimize"
          tabIndex={-1}
        >
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button
          className="titlebar__btn titlebar__btn--maximize"
          onClick={handleMaximize}
          title={maximized ? 'Restore' : 'Maximize'}
          tabIndex={-1}
        >
          {maximized ? (
            /* Restore icon: two overlapping squares */
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="2" y="0" width="8" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="0" y="2" width="8" height="8" rx="0.5" fill="rgba(10,6,18,0.95)" stroke="currentColor" strokeWidth="1"/>
            </svg>
          ) : (
            /* Maximize icon: single square */
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          title="Close"
          tabIndex={-1}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="10" y1="0" x2="0"  y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
