import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBrowser } from '../../context/BrowserContext';
import {
  Film, Gamepad2, Castle, Flame, BookOpen, Leaf,
  Radio, Skull, MapPin, Coffee, Scissors, ShoppingBag,
  Newspaper, Mic, Moon, Plus, X, Trash2, Search, Ghost
} from 'lucide-react';
import './Dashboard.css';

// Directory links are now dynamic and securely loaded from the backend storage via BrowserContext

const RainDrop = ({ left, delay, duration, width, opacity, zIndex }) => (
  <div 
    className="particle-raindrop"
    style={{
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      width: `${width}px`,
      opacity: opacity,
      zIndex: zIndex
    }}
  />
);

function getDaysUntilHalloween() {
  const now = new Date();
  let h = new Date(now.getFullYear(), 9, 31);
  if (now > h) h = new Date(now.getFullYear() + 1, 9, 31);
  return Math.ceil((h - now) / 86400000);
}

function getMoonPhase() {
  const LUNAR = 29.53058867;
  const known = new Date('2024-01-11T11:57:00Z');
  const phase = ((Date.now() - known.getTime()) / 86400000 % LUNAR) / LUNAR;
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22)                 return 'Waxing Crescent';
  if (phase < 0.28)                 return 'First Quarter';
  if (phase < 0.47)                 return 'Waxing Gibbous';
  if (phase < 0.53)                 return 'Full Moon';
  if (phase < 0.72)                 return 'Waning Gibbous';
  if (phase < 0.78)                 return 'Last Quarter';
  return                                   'Waning Crescent';
}

function getSeasonProgress() {
  const now = new Date();
  const autumnStart = new Date(now.getFullYear(), 8, 1);
  const autumnEnd   = new Date(now.getFullYear(), 10, 30);
  if (now >= autumnStart && now <= autumnEnd) {
    return { season: 'Autumn', pct: Math.round((now - autumnStart) / (autumnEnd - autumnStart) * 100) };
  }
  return { season: 'Off-Season', pct: 0 };
}

const Bat = ({ delay, top, duration, size, scale }) => (
  <div
    className="particle-bat-wrapper"
    style={{
      top: `${top}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <div className="particle-bat-bob" style={{ animationDelay: `${delay}s` }}>
      <div className="bat-body-container" style={{ width: `${size}px`, height: `${size * 0.5}px`, transform: `scale(${scale})` }}>
        
        <div className="bat-wing-left">
          <svg viewBox="0 0 50 50" width="100%" height="100%">
            <path fill="#05020a" d="M50,22 C40,25 35,10 15,5 C25,25 5,35 0,20 C15,40 35,48 50,42 Z" />
          </svg>
        </div>

        <div className="bat-wing-right">
          <svg viewBox="50 0 50 50" width="100%" height="100%">
            <path fill="#05020a" d="M50,42 C65,48 85,40 100,20 C95,35 75,25 85,5 C65,10 60,25 50,22 Z" />
          </svg>
        </div>

        <div className="bat-body-core">
          <svg viewBox="0 0 100 50" width="100%" height="100%">
            <polygon fill="#05020a" points="46,24 43,12 50,18 57,12 54,24" />
            <ellipse cx="50" cy="28" rx="5.5" ry="12" fill="#05020a" />
          </svg>
        </div>

      </div>
    </div>
  </div>
);

const LightningStreak = ({ delay, left, width, height }) => (
  <div
    className="lightning-streak"
    style={{
      left: `${left}%`,
      width: `${width}px`,
      height: `${height}px`,
      animationDelay: `${delay}s`
    }}
  >
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
      <path fill="#e0d0ff" d="M55,0 L15,55 L45,55 L30,100 L85,45 L50,45 Z" />
    </svg>
  </div>
);

export default function Dashboard({ tabId, isActive }) {
  const { navigate, directory, addDirectoryItem, removeDirectoryItem, tabs, theme, customThemes } = useBrowser();
  const tab = tabs.find(t => t.id === tabId);
  const isNewTab = tab?.url?.includes('hallow://newtab') || tab?.url?.includes('hallow-ghost://newtab');

  const activeThemeObj = customThemes.find(t => t.id === theme);
  const particleAnim = activeThemeObj?.particleAnimation || 'bats';

  const [weather, setWeather] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);

  const baseDelay = isNewTab ? 0.1 : 1.6;

  const days   = getDaysUntilHalloween();
  const moon   = getMoonPhase();

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=42.5195&longitude=-70.8967&current_weather=true&temperature_unit=fahrenheit')
      .then(r => r.json()).then(d => setWeather(d.current_weather)).catch(() => {});
  }, []);

  return (
    <div className={`dashboard ${tabId === '1' ? 'dashboard--intro' : ''}`}>
      {/* ── Background image ── */}
      {!isNewTab && <div className="dash-bg" />}

      {/* ── HEAVY PARTICLE LAYERS (Only rendered when tab is actively visible) ── */}
      {isActive && !isNewTab && (
        <>
          {/* ── Lightning Streaks ── */}
          <div className="lightning-layer">
            <LightningStreak delay={3} left={15} width={40} height={300} />
            <LightningStreak delay={8} left={70} width={25} height={200} />
            <LightningStreak delay={14} left={25} width={60} height={400} />
            <LightningStreak delay={22} left={85} width={30} height={250} />
          </div>

          {/* ── Dynamic Particle Layer ── */}
          {isActive && particleAnim === 'bats' && (
            <div className="bats-layer">
              <Bat delay={0} top={20} duration={12} size={60} scale={1} />
              <Bat delay={4} top={35} duration={15} size={40} scale={0.8} />
              <Bat delay={8} top={15} duration={10} size={70} scale={1.2} />
              <Bat delay={13} top={40} duration={18} size={30} scale={0.6} />
              <Bat delay={17} top={25} duration={14} size={50} scale={0.9} />
            </div>
          )}

          {isActive && particleAnim === 'thunderstorm' && (
            <div className="rain-layer">
              <div className="ambient-flash"></div>
              {/* Foreground Rain (Thick, Fast, Opaque) */}
              {Array.from({ length: 40 }).map((_, i) => (
                <RainDrop 
                  key={`fg-${i}`} 
                  left={Math.random() * 100} 
                  delay={Math.random() * 2} 
                  duration={0.3 + Math.random() * 0.2} 
                  width={2 + Math.random() * 1.5}
                  opacity={0.5 + Math.random() * 0.5}
                  zIndex={3}
                />
              ))}
              {/* Midground Rain (Medium, Normal speed, Translucent) */}
              {Array.from({ length: 60 }).map((_, i) => (
                <RainDrop 
                  key={`mg-${i}`} 
                  left={Math.random() * 100} 
                  delay={Math.random() * 2} 
                  duration={0.5 + Math.random() * 0.3} 
                  width={1 + Math.random()}
                  opacity={0.3 + Math.random() * 0.3}
                  zIndex={2}
                />
              ))}
              {/* Background Rain (Thin, Slow, Very Transparent) */}
              {Array.from({ length: 80 }).map((_, i) => (
                <RainDrop 
                  key={`bg-${i}`} 
                  left={Math.random() * 100} 
                  delay={Math.random() * 2} 
                  duration={0.7 + Math.random() * 0.4} 
                  width={0.5 + Math.random() * 0.5}
                  opacity={0.1 + Math.random() * 0.2}
                  zIndex={1}
                />
              ))}
            </div>
          )}

          {/* ── Rolling Fog ── */}
          <div className="fog-layer">
            <div className="fog-drift fog-fast"></div>
            <div className="fog-drift fog-slow"></div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <header className="dash-header animate-fade-in">
        <p className="dash-eyebrow">Est. All Hallows Eve</p>
        <h1 className="dash-title">HALLOW<span>NET</span></h1>
        <p className="dash-tagline">Your window into the dark</p>

        {/* Search Bar or Stat Strip */}
        {isNewTab ? (
          <form className="dash-search-form" onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) navigate(tabId, searchQuery.trim()); }}>
            <input 
              type="text" 
              className="dash-search-input" 
              placeholder="Search the web or type a URL..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              autoFocus 
            />
            <button type="submit" className="dash-search-btn"><Search size={18} /></button>
          </form>
        ) : (
          <div className="dash-stats">
            <div className="stat-card">
              <div className="stat-value-wrap">
                <span className="stat-value">{days}</span>
              </div>
              <span className="stat-label">Days to Halloween</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <div className="stat-value-wrap">
                <span className="stat-icon-text"><Moon size={18} strokeWidth={1.5} /></span>
                <span className="stat-value moon-stat">{moon}</span>
              </div>
              <span className="stat-label">Current Moon</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <div className="stat-value-wrap">
                {weather ? (
                  <span className="stat-value">{Math.round(weather.temperature)}<sup>°F</sup></span>
                ) : (
                  <span className="stat-value animate-pulse">--</span>
                )}
              </div>
              <span className="stat-label">Salem, MA</span>
            </div>
          </div>
        )}
      </header>

      {/* ── Directory ── */}
      {!isNewTab && (
        <section className="dash-directory">
          <div className="dash-section-header">
            <span className="dash-section-rule" />
            <h2 className="dash-section-title">HallowNet Directory</h2>
            <span className="dash-section-rule" />
          </div>
          <div className="directory-grid">
            {directory.map((link, index) => {
              let domain = '';
              try { domain = new URL(link.url).hostname; } catch(e) {}
              return (
                <button 
                  key={index}
                  className="dir-card"
                  style={{ animationDelay: `${baseDelay + (index * 0.05)}s` }}
                  onClick={() => navigate(tabId, link.url)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ url: link.url, x: e.clientX, y: e.clientY });
                  }}
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                    alt=""
                    className="dir-card-favicon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="dir-card-icon" style={{ display: 'none' }}>
                    <Ghost size={20} strokeWidth={1.5} />
                  </div>
                  <span className="dir-card-label">{link.title || domain}</span>
                </button>
              );
            })}

            <button 
              className="dir-card dir-card-add"
              style={{ animationDelay: `${baseDelay + (directory.length * 0.05)}s` }}
              onClick={() => setShowAddModal(true)}
            >
              <div className="dir-card-icon">
                <Plus size={20} strokeWidth={1.5} />
              </div>
              <span className="dir-card-label">Add Link</span>
            </button>
          </div>
        </section>
      )}

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            <h3>Add to Directory</h3>
            <div className="dashboard-modal-inputs">
              <input type="text" placeholder="Site Name (e.g. Reddit)" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
              <input type="url" placeholder="URL (https://...)" value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={(e) => {
                if (e.key === 'Enter' && newTitle && newUrl) {
                  addDirectoryItem(newTitle, newUrl);
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewUrl('');
                }
              }}/>
            </div>
            <div className="dashboard-modal-actions">
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="primary" onClick={() => {
                if (newTitle && newUrl) {
                  addDirectoryItem(newTitle, newUrl);
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewUrl('');
                }
              }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="dashboard-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button onClick={(e) => {
            e.stopPropagation();
            removeDirectoryItem(contextMenu.url);
            setContextMenu(null);
          }}>
            <Trash2 size={14} /> Remove Link
          </button>
        </div>
      )}
    </div>
  );
}
