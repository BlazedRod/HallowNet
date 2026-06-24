import React, { useState, useEffect } from 'react';
import { useBrowser } from '../../context/BrowserContext';
import { CloudRain, Moon, Settings2, X, Star, History, Wind } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useBrowser();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-heading">Widgets</span>
        <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Close">
          <X size={15} />
        </button>
      </div>

      <WeatherWidget />
      <MoonWidget />
      <BookmarksWidget />
      <HistoryWidget />
      <ThemeWidget />
    </aside>
  );
}

/* ── Weather ── */
function WeatherWidget() {
  const [wx, setWx] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=42.5195&longitude=-70.8967&current_weather=true&temperature_unit=fahrenheit')
      .then(r => r.json())
      .then(d => setWx(d.current_weather))
      .catch(() => {});
  }, []);

  return (
    <div className="widget">
      <div className="widget-header">
        <CloudRain size={13} className="widget-icon" />
        <span className="widget-header-label">Salem, MA</span>
      </div>
      <div className="widget-body">
        {wx ? (
          <div className="weather-row">
            <span className="weather-temp">{Math.round(wx.temperature)}&deg;F</span>
            <div className="weather-meta">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <Wind size={11} /> {wx.windspeed} mph
              </div>
              <div>Salem, Massachusetts</div>
            </div>
          </div>
        ) : (
          <span className="empty-state animate-pulse">Loading...</span>
        )}
      </div>
    </div>
  );
}

/* ── Moon ── */
function getMoonPhase() {
  const LUNAR = 29.53058867;
  const known = new Date('2024-01-11T11:57:00Z');
  const phase = ((Date.now() - known.getTime()) / 86400000 % LUNAR) / LUNAR;
  if (phase < 0.03 || phase > 0.97) return { name: 'New Moon',       pct: 0   };
  if (phase < 0.22)                 return { name: 'Waxing Crescent', pct: Math.round(phase / 0.25 * 50) };
  if (phase < 0.28)                 return { name: 'First Quarter',   pct: 50  };
  if (phase < 0.47)                 return { name: 'Waxing Gibbous',  pct: Math.round(50 + (phase - 0.25) / 0.25 * 50) };
  if (phase < 0.53)                 return { name: 'Full Moon',       pct: 100 };
  if (phase < 0.72)                 return { name: 'Waning Gibbous',  pct: Math.round(100 - (phase - 0.5) / 0.25 * 50) };
  if (phase < 0.78)                 return { name: 'Last Quarter',    pct: 50  };
  return                                   { name: 'Waning Crescent', pct: Math.round(50 - (phase - 0.75) / 0.25 * 50) };
}

function MoonWidget() {
  const moon = getMoonPhase();
  return (
    <div className="widget">
      <div className="widget-header">
        <Moon size={13} className="widget-icon" />
        <span className="widget-header-label">Moon Phase</span>
      </div>
      <div className="widget-body">
        <div className="moon-display">
          <div className="moon-orb">
            <div className="moon-fill" style={{ width: `${moon.pct}%` }} />
          </div>
          <div className="moon-info">
            <span className="moon-name">{moon.name}</span>
            <span className="moon-pct">{moon.pct}% illuminated</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Bookmarks ── */
function BookmarksWidget() {
  const { bookmarks, addTab } = useBrowser();
  return (
    <div className="widget">
      <div className="widget-header">
        <Star size={13} className="widget-icon" />
        <span className="widget-header-label">Bookmarks</span>
      </div>
      <div className="widget-body">
        {bookmarks.length === 0
          ? <span className="empty-state">No bookmarks yet.</span>
          : (
            <ul className="link-list">
              {bookmarks.map(b => (
                <li key={b.id} className="link-item" onClick={() => addTab(b.url)} title={b.url}>
                  <div className="link-item-title">{b.title}</div>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
}

/* ── History ── */
function HistoryWidget() {
  const { history, addTab } = useBrowser();
  return (
    <div className="widget">
      <div className="widget-header">
        <History size={13} className="widget-icon" />
        <span className="widget-header-label">Recent History</span>
      </div>
      <div className="widget-body">
        {history.length === 0
          ? <span className="empty-state">Nothing visited yet.</span>
          : (
            <ul className="link-list">
              {history.slice(0, 8).map((h, i) => (
                <li key={i} className="link-item" onClick={() => addTab(h.url)} title={h.url}>
                  <div className="link-item-title">{h.title}</div>
                  <div className="link-item-url">{h.url}</div>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
}

const THEMES = [
  { id: 'classic-halloween', name: 'Classic Halloween' },
  { id: 'autumn-forest',     name: 'Autumn Forest'     },
  { id: 'geesebimps',        name: 'Geesebimps'        },
  { id: 'blood-moon',        name: 'Blood Moon'        },
  { id: 'grimoire',          name: 'Grimoire'          },
  { id: 'whiteout',          name: 'Whiteout'          },
];

/* ── Theme ── */
function ThemeWidget() {
  const { theme, setTheme, customThemes } = useBrowser();
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeThemeObj = THEMES.find(t => t.id === theme) || customThemes.find(t => t.id === theme);
  const activeName = activeThemeObj ? activeThemeObj.name : 'Unknown Theme';

  return (
    <div className="widget">
      <div className="widget-header">
        <Settings2 size={13} className="widget-icon" />
        <span className="widget-header-label">Theme</span>
      </div>
      <div className="widget-body">
        <div className="theme-select-container" ref={ref}>
          <button className="theme-select-btn" onClick={() => setOpen(!open)}>
            <span>{activeName}</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▼</span>
          </button>
          
          {open && (
            <div className="theme-dropdown-menu">
              <div className="theme-dropdown-group-label">Official Themes</div>
              {THEMES.map(t => (
                <div 
                  key={t.id} 
                  className={`theme-dropdown-item ${theme === t.id ? 'active' : ''}`}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                >
                  {t.name}
                </div>
              ))}
              
              {customThemes.length > 0 && (
                <>
                  <div className="theme-dropdown-group-label" style={{ marginTop: '4px' }}>Lab Themes</div>
                  {customThemes.map(t => (
                    <div 
                      key={t.id} 
                      className={`theme-dropdown-item ${theme === t.id ? 'active' : ''}`}
                      onClick={() => { setTheme(t.id); setOpen(false); }}
                    >
                      {t.name}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
