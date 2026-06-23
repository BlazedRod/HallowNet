import React, { useState, useEffect } from 'react';
import { useBrowser } from '../../context/BrowserContext';
import './Trapdoor.css';

export default function Trapdoor() {
  const { trapdoorActive: active } = useBrowser();
  const [opening, setOpening] = useState(false);
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    let timeout;
    if (active) {
      setShouldRender(true);
      setOpening(false);
    } else if (shouldRender) {
      setOpening(true);
      // Wait for the open animation to finish before unmounting
      timeout = setTimeout(() => {
        setShouldRender(false);
        setOpening(false);
      }, 600);
    }
    return () => clearTimeout(timeout);
  }, [active]);

  if (!shouldRender) return null;

  return (
    <div className={`trapdoor-container ${shouldRender ? 'active' : ''} ${opening ? 'opening' : ''}`}>
      <div className="trapdoor-panel">
        
        {/* Fake Safe Screen - Dark Mode Google */}
        <div className="trapdoor-fake-screen">
          <div className="fake-google-header">
            <span>Gmail</span>
            <span>Images</span>
            <div className="fake-google-apps-icon">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            </div>
            <div className="fake-google-profile">M</div>
          </div>

          <div className="fake-google-center">
            <h1 className="fake-google-logo">
              <span style={{color: '#4285F4'}}>G</span>
              <span style={{color: '#EA4335'}}>o</span>
              <span style={{color: '#FBBC05'}}>o</span>
              <span style={{color: '#4285F4'}}>g</span>
              <span style={{color: '#34A853'}}>l</span>
              <span style={{color: '#EA4335'}}>e</span>
            </h1>
            
            <div className="fake-google-search-bar">
              <svg className="fake-search-icon" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#9aa0a6"></path></svg>
              <input type="text" className="fake-search-input" />
              <svg className="fake-mic-icon" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m12 15c1.66 0 3-1.31 3-2.97v-7.02c0-1.66-1.34-3.01-3-3.01s-3 1.34-3 3.01v7.02c0 1.66 1.34 2.97 3 2.97z" fill="#4285f4"></path><path d="m11 18.08h2v3.92h-2z" fill="#34a853"></path><path d="m7.05 16.87c-1.27-1.33-2.05-2.83-2.05-4.87h2c0 1.45.56 2.42 1.47 3.38v.32l-1.15 1.18z" fill="#f4b400"></path><path d="m12 16.93a4.97 5.25 0 0 1 -3.54 -1.55l-1.41 1.49c1.26 1.34 3.02 2.13 4.95 2.13 3.87 0 6.99-2.92 6.99-7h-1.99c0 2.92-2.24 4.93-5 4.93z" fill="#ea4335"></path></svg>
            </div>

            <div className="fake-google-buttons">
              <button>Google Search</button>
              <button>I'm Feeling Lucky</button>
            </div>
          </div>

          <div className="fake-google-footer">
            <div className="fake-google-footer-top">United States</div>
            <div className="fake-google-footer-bottom">
              <div className="fake-google-footer-links">
                <span>About</span>
                <span>Advertising</span>
                <span>Business</span>
                <span>How Search works</span>
              </div>
              <div className="fake-google-footer-links">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Settings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heavy Metal Texture Elements on the door edges */}
        <div style={{ position: 'absolute', bottom: '0', width: '100%', height: '20px', background: 'repeating-linear-gradient(45deg, #000, #000 10px, #1a1a1a 10px, #1a1a1a 20px)' }} />
      </div>
    </div>
  );
}
