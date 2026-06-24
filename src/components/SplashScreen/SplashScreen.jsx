import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const BOOT_SEQUENCE = [
  { text: 'HALLOWNET CORE',         sub: 'Initializing runtime environment',       delay: 800  },
  { text: 'GARGOYLE ENGINE',        sub: 'Mounting network interception layer',     delay: 2200 },
  { text: 'SESSION PROTOCOLS',      sub: 'Establishing secure haunted session',     delay: 3800 },
  { text: 'GOTHIC INTERFACE',       sub: 'Rendering atmospheric display layer',     delay: 5200 },
  { text: 'ALL SYSTEMS NOMINAL',    sub: 'Welcome to HallowNet',                   delay: 6400 },
];

export default function SplashScreen({ onComplete }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [phase, setPhase] = useState('in'); // in | hold | out

  useEffect(() => {
    try {
      const storedSettings = JSON.parse(localStorage.getItem('hwn_audioSettings'));
      const playStartup = storedSettings ? storedSettings.startup : true;
      
      if (playStartup) {
        const startupAudio = new Audio('./startup.wav');
        startupAudio.volume = 0.6; // 60% volume so it doesn't blast the user
        startupAudio.play().catch(() => {
          // Autoplay might be blocked or file might not exist. Silently fail.
        });
      }
    } catch (e) {}

    BOOT_SEQUENCE.forEach(({ delay }, i) => {
      setTimeout(() => setActiveStep(i), delay);
    });
    // Give it a moment to linger on 'Welcome to HallowNet'
    setTimeout(() => setPhase('out'), 7800);
    setTimeout(() => onComplete(), 8600);
  }, []);

  const progress = activeStep < 0 ? 0 : Math.round(((activeStep + 1) / BOOT_SEQUENCE.length) * 100);

  return (
    <div className={`splash ${phase === 'out' ? 'splash--out' : 'splash--in'}`}>
      <div className="splash__bg" />
      
      {/* Deep atmospheric background glows */}
      <div className="splash__glow splash__glow--1" />
      <div className="splash__glow splash__glow--2" />
      <div className="splash__glow splash__glow--3" />

      {/* Scanline overlay */}
      <div className="splash__scanlines" />

      {/* Central emblem */}
      <div className="splash__center">
        <div className="splash__emblem">
          <div className="splash__sigil">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash__sigil-svg">
              <path d="M60 5 L115 60 L60 115 L5 60 Z" stroke="color-mix(in srgb, var(--accent-primary) 80%, transparent)" strokeWidth="1.5" />
              <path d="M60 15 L105 60 L60 105 L15 60 Z" stroke="color-mix(in srgb, var(--accent-primary) 40%, transparent)" strokeWidth="1" strokeDasharray="4 6" />
              <circle cx="60" cy="5" r="2" fill="var(--accent-primary)" />
              <circle cx="115" cy="60" r="2" fill="var(--accent-primary)" />
              <circle cx="60" cy="115" r="2" fill="var(--accent-primary)" />
              <circle cx="5" cy="60" r="2" fill="var(--accent-primary)" />
            </svg>
          </div>
          <div className="splash__ghost">
            <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z"
                fill="color-mix(in srgb, var(--accent-primary) 8%, transparent)"
                stroke="color-mix(in srgb, var(--accent-primary) 70%, transparent)"
                strokeWidth="1.5"
              />
              <circle cx="30" cy="38" r="5" fill="color-mix(in srgb, var(--accent-primary) 90%, transparent)" />
              <circle cx="50" cy="38" r="5" fill="color-mix(in srgb, var(--accent-primary) 90%, transparent)" />
            </svg>
          </div>
        </div>

        <h1 className="splash__wordmark">
          {'HALLOWNET'.split('').map((ch, i) => (
            <span 
              key={i} 
              className={`splash__letter ${i >= 6 ? 'splash__letter--net' : ''}`} 
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {ch}
            </span>
          ))}
        </h1>

        <p className="splash__tagline">THE HAUNTED BROWSER</p>
      </div>

      {/* Mystic Loading Area */}
      <div className="splash__mystic-loader">
        <div className="splash__incantation" key={activeStep}>
          {activeStep >= 0 && activeStep < BOOT_SEQUENCE.length 
            ? BOOT_SEQUENCE[activeStep].sub 
            : 'Awakening the network...'}
        </div>

        {/* Progress line */}
        <div className="splash__progress-track">
          <div className="splash__progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
