import React, { useState, useEffect, useRef } from 'react';
import { useBrowser, BG_MAP } from '../../context/BrowserContext';
import { Save, X, Beaker, Eye, LayoutTemplate, Ghost, Upload } from 'lucide-react';
import './ThemeCreator.css';

const DEFAULT_THEME_STATE = {
  name: 'My Custom Theme',
  colors: {
    bgPrimary: '#08060b',
    bgSecondary: '#0f0c12',
    bgTertiary: '#181320',
    accentPrimary: '#ff5500',
    accentSecondary: '#7b21d4',
    textPrimary: '#f0ecf5',
    textSecondary: '#9088a0',
    textMuted: '#4a4055',
    borderColor: '#221133',
    borderHighlight: '#552200',
    panelBg: 'rgba(15, 12, 18, 0.75)'
  },
  brandFont: 'Cinzel Decorative',
  uiFont: 'Inter',
  backgroundImage: 'dashboard-bg',
  particleAnimation: 'bats'
};

const BRAND_FONTS = [
  'Federo', 
  'Cinzel Decorative', 
  'Cinzel', 
  'Creepster', 
  'Nosifer',
  'Butcherman',
  'Griffy',
  'Macondo',
  'Eater', 
  'Pirata One', 
  'UnifrakturMaguntia', 
  'MedievalSharp',
  'Flavors',
  'Fontdiner Swanky',
  'Frijole',
  'Trade Winds',
  'Metal Mania',
  'Sancreek',
  'Piedra',
  'Scream Real'
];
const UI_FONTS = ['Inter', 'Roboto', 'Share Tech Mono'];

export default function ThemeCreator() {
  const { saveCustomTheme, activeTabId, navigate, setTheme, customThemes, tabs } = useBrowser();
  const [themeState, setThemeState] = useState(DEFAULT_THEME_STATE);
  const [editId, setEditId] = useState(null);

  const [brandFontOpen, setBrandFontOpen] = useState(false);
  const brandFontRef = useRef(null);
  
  const [uiFontOpen, setUiFontOpen] = useState(false);
  const uiFontRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (brandFontRef.current && !brandFontRef.current.contains(e.target)) setBrandFontOpen(false);
      if (uiFontRef.current && !uiFontRef.current.contains(e.target)) setUiFontOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target.result;
      setThemeState(prev => ({
        ...prev,
        backgroundImage: base64Str
      }));
    };
    reader.readAsDataURL(file);
  };

  // On mount, check if we're in edit mode via ?edit=id in the tab URL
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;
    const match = activeTab.url.match(/[?&]edit=([^&]+)/);
    if (match) {
      const id = match[1];
      const existing = customThemes.find(t => t.id === id);
      if (existing) {
        setEditId(id);
        setThemeState({
          name: existing.name,
          colors: { ...existing.colors },
          brandFont: existing.brandFont || 'Cinzel Decorative',
          uiFont: existing.uiFont || 'Inter',
          backgroundImage: existing.backgroundImage || 'dashboard-bg',
          particleAnimation: existing.particleAnimation || 'bats'
        });
      }
    }
  }, []);

  const handleColorChange = (key, val) => {
    setThemeState(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: val }
    }));
  };

  const handleSave = () => {
    const id = editId || `custom-${Date.now()}`;
    const newTheme = {
      id,
      name: themeState.name,
      ...themeState
    };
    saveCustomTheme(newTheme);
    setTheme(id);
    navigate(activeTabId, 'hallow://settings');
  };

  // Live Preview CSS Injection
  const previewStyle = {
    '--bg-primary': themeState.colors.bgPrimary,
    '--bg-secondary': themeState.colors.bgSecondary,
    '--bg-tertiary': themeState.colors.bgTertiary,
    '--accent-primary': themeState.colors.accentPrimary,
    '--accent-secondary': themeState.colors.accentSecondary,
    '--accent-glow': themeState.colors.accentPrimary,
    '--text-primary': themeState.colors.textPrimary,
    '--text-secondary': themeState.colors.textSecondary,
    '--text-muted': themeState.colors.textMuted,
    '--border-color': themeState.colors.borderColor,
    '--border-highlight': themeState.colors.borderHighlight,
    '--panel-bg': themeState.colors.panelBg,
    '--brand-font': `'${themeState.brandFont}', sans-serif`,
    '--font-family': `'${themeState.uiFont}', sans-serif`,
    '--shadow-glow-orange': `0 0 20px color-mix(in srgb, ${themeState.colors.accentPrimary} 40%, transparent), 0 0 40px color-mix(in srgb, ${themeState.colors.accentPrimary} 15%, transparent)`,
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-family)',
    height: '100%',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 0 0 1px var(--border-color), 0 10px 40px rgba(0,0,0,0.8)'
  };

  return (
    <div className="theme-creator-container">
      <div className="tc-header">
        <div className="tc-header-title">
          <h1 style={{ fontFamily: 'var(--brand-font, "Cinzel Decorative")', fontSize: '2rem', margin: 0, color: 'var(--accent-primary)', textShadow: '0 0 15px var(--accent-primary)' }}>
            {editId ? 'Edit Theme' : 'Theme Lab'}
          </h1>
        </div>
        <div className="tc-actions">
          <button className="tc-btn tc-btn-cancel" onClick={() => navigate(activeTabId, 'hallow://settings')}>
            <X size={16} /> Cancel
          </button>
          <button className="tc-btn tc-btn-save" onClick={handleSave}>
            <Save size={16} /> {editId ? 'Update Theme' : 'Save Lab Theme'}
          </button>
        </div>
      </div>

      <div className="tc-content">
        {/* Left Panel: Controls */}
        <div className="tc-controls">
          <div className="tc-section">
            <h2>Theme Metadata</h2>
            <div className="tc-input-group">
              <label>Theme Name</label>
              <input 
                type="text" 
                value={themeState.name} 
                onChange={e => setThemeState({...themeState, name: e.target.value})}
                className="tc-text-input"
              />
            </div>
          </div>

          <div className="tc-section">
            <h2>Typography</h2>
            <div className="tc-input-group">
              <label>Brand Font (Headers)</label>
              <div ref={brandFontRef} style={{ position: 'relative', width: '100%' }}>
                <button 
                  className="tc-select-custom" 
                  onClick={() => setBrandFontOpen(!brandFontOpen)}
                >
                  <span style={{ fontFamily: themeState.brandFont }}>{themeState.brandFont}</span>
                  <span className="tc-select-arrow" style={{ transform: brandFontOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>
                {brandFontOpen && (
                  <div className="tc-dropdown">
                    {BRAND_FONTS.map(f => (
                      <div 
                        key={f} 
                        className={`tc-dropdown-item ${themeState.brandFont === f ? 'active' : ''}`}
                        style={{ fontFamily: f }}
                        onClick={() => {
                          setThemeState({...themeState, brandFont: f});
                          setBrandFontOpen(false);
                        }}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="tc-input-group">
              <label>UI Font (Text)</label>
              <div ref={uiFontRef} style={{ position: 'relative', width: '100%' }}>
                <button 
                  className="tc-select-custom" 
                  onClick={() => setUiFontOpen(!uiFontOpen)}
                >
                  <span style={{ fontFamily: themeState.uiFont }}>{themeState.uiFont}</span>
                  <span className="tc-select-arrow" style={{ transform: uiFontOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>
                {uiFontOpen && (
                  <div className="tc-dropdown">
                    {UI_FONTS.map(f => (
                      <div 
                        key={f} 
                        className={`tc-dropdown-item ${themeState.uiFont === f ? 'active' : ''}`}
                        style={{ fontFamily: f }}
                        onClick={() => {
                          setThemeState({...themeState, uiFont: f});
                          setUiFontOpen(false);
                        }}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tc-section">
              <h2>Background Image</h2>
              <div className="tc-bg-grid">
                {Object.keys(BG_MAP).map(bg => (
                  <div 
                    key={bg}
                    className={`tc-bg-thumbnail ${themeState.backgroundImage === bg ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${BG_MAP[bg]})` }}
                    onClick={() => setThemeState({...themeState, backgroundImage: bg})}
                    title={bg.replace('_', ' ')}
                  >
                    {themeState.backgroundImage === bg && (
                      <div className="tc-bg-selected-overlay"><Ghost size={24} /></div>
                    )}
                  </div>
                ))}
                {themeState.backgroundImage?.startsWith('data:image') && (
                  <div 
                    className="tc-bg-thumbnail active"
                    style={{ backgroundImage: `url(${themeState.backgroundImage})` }}
                    title="Custom Upload"
                  >
                    <div className="tc-bg-selected-overlay"><Ghost size={24} /></div>
                  </div>
                )}
                <label className="tc-bg-upload-btn" title="Upload Custom Background">
                  <Upload size={24} />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="tc-section">
              <h2>Particle Animations</h2>
              <div className="tc-animation-grid">
                {['bats', 'thunderstorm', 'none'].map(anim => (
                  <button 
                    key={anim}
                    className={`tc-anim-btn ${themeState.particleAnimation === anim ? 'active' : ''}`}
                    onClick={() => setThemeState({...themeState, particleAnimation: anim})}
                  >
                    {anim.charAt(0).toUpperCase() + anim.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="tc-section">
              <h2>Core Colors</h2>
            <div className="tc-color-grid">
              <ColorPicker label="Accent Primary" value={themeState.colors.accentPrimary} onChange={(v) => handleColorChange('accentPrimary', v)} />
              <ColorPicker label="Accent Secondary" value={themeState.colors.accentSecondary} onChange={(v) => handleColorChange('accentSecondary', v)} />
              <ColorPicker label="Background Primary" value={themeState.colors.bgPrimary} onChange={(v) => handleColorChange('bgPrimary', v)} />
              <ColorPicker label="Background Secondary" value={themeState.colors.bgSecondary} onChange={(v) => handleColorChange('bgSecondary', v)} />
              <ColorPicker label="Background Tertiary" value={themeState.colors.bgTertiary} onChange={(v) => handleColorChange('bgTertiary', v)} />
            </div>
          </div>

          <div className="tc-section">
            <h2>Text & Borders</h2>
            <div className="tc-color-grid">
              <ColorPicker label="Text Primary" value={themeState.colors.textPrimary} onChange={(v) => handleColorChange('textPrimary', v)} />
              <ColorPicker label="Text Secondary" value={themeState.colors.textSecondary} onChange={(v) => handleColorChange('textSecondary', v)} />
              <ColorPicker label="Text Muted" value={themeState.colors.textMuted} onChange={(v) => handleColorChange('textMuted', v)} />
              <ColorPicker label="Border Color" value={themeState.colors.borderColor} onChange={(v) => handleColorChange('borderColor', v)} />
              <ColorPicker label="Border Highlight" value={themeState.colors.borderHighlight} onChange={(v) => handleColorChange('borderHighlight', v)} />
            </div>
          </div>
        </div>

        {/* Right Panel: Live Preview Window */}
        <div className="tc-preview-pane">
          <div className="tc-preview-header">
            <Eye size={18} /> Live Vision
          </div>
          <div className="tc-preview-window-wrapper">
            <div style={previewStyle}>
              {/* Fake Titlebar */}
              <div style={{ height: '38px', background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingLeft: '8px' }}>
                <div style={{ 
                  padding: '0 16px', 
                  height: '32px', 
                  background: 'var(--bg-tertiary)', 
                  color: 'var(--text-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '11.5px',
                  fontWeight: 500,
                  marginLeft: '4px', 
                  boxShadow: '0 -1px 0 0 var(--accent-primary) inset, 0 0 12px color-mix(in srgb, var(--accent-primary) 8%, transparent)',
                  clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 100%, 0% 100%)'
                }}>
                  <LayoutTemplate size={12} color="var(--accent-primary)" />
                  HallowNet Dashboard
                </div>
              </div>
              
              {/* Fake Address Bar */}
              <div style={{ height: '46px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-highlight)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <div style={{ flex: 1, height: '30px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  hallow://theme-creator
                </div>
                <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                  <Ghost size={16} color="var(--accent-primary)" />
                </div>
              </div>

              {/* Fake Content Area */}
              <div style={{ flex: 1, padding: '30px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h1 style={{ fontFamily: 'var(--brand-font)', color: 'var(--accent-primary)', textShadow: '0 0 10px var(--accent-primary)', fontSize: '3rem', margin: 0 }}>{themeState.name || 'HallowNet'}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', maxWidth: '400px' }}>
                  This is a live preview of your forged theme. Colors, fonts, and borders will update instantly.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '10px 20px', fontFamily: 'var(--brand-font)', fontSize: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-glow-orange)' }}>
                    Primary Action
                  </button>
                  <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 20px', fontFamily: 'var(--font-family)', fontSize: '14px' }}>
                    Secondary
                  </button>
                </div>

                {/* Fake Glass Panel */}
                <div style={{ marginTop: '20px', padding: '20px', background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Glassmorphism Panel</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Testing the transparency and border highlights of the panel background.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Conversion helpers
function hexToHSL(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  return { h, s, l };
}

function HSLToHex(h, s, l) {
  s /= 100; l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2, r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// Custom Color Picker Component using HSL sliders for a sleek Triple-A feel
function ColorPicker({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const safeValue = value && value.length === 7 ? value : '#000000';
  const hsl = hexToHSL(safeValue);

  const handleSliderChange = (h, s, l) => {
    onChange(HSLToHex(h, s, l));
  };

  return (
    <div className="tc-color-picker-wrapper" style={{ position: 'relative' }}>
      <label className="tc-color-label">{label}</label>
      <div className="tc-color-input-group" onClick={() => setIsOpen(true)}>
        <div 
          className="tc-color-swatch-btn"
          style={{ backgroundColor: safeValue }}
        />
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="tc-color-hex-input"
          placeholder="#RRGGBB"
          maxLength={7}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {isOpen && (
        <>
          <div className="tc-popover-overlay" onClick={() => setIsOpen(false)} />
          <div className="tc-color-popover">
            <div className="tc-color-preview-large" style={{ backgroundColor: safeValue }} />
            
            <div className="tc-slider-group">
              <div className="tc-slider-row">
                <span className="tc-slider-label">H</span>
                <input 
                  type="range" min="0" max="360" value={hsl.h} 
                  onChange={e => handleSliderChange(Number(e.target.value), hsl.s, hsl.l)}
                  className="tc-range-slider tc-range-hue"
                  style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                />
              </div>

              <div className="tc-slider-row">
                <span className="tc-slider-label">S</span>
                <input 
                  type="range" min="0" max="100" value={hsl.s} 
                  onChange={e => handleSliderChange(hsl.h, Number(e.target.value), hsl.l)}
                  className="tc-range-slider tc-range-sat"
                  style={{ background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))` }}
                />
              </div>

              <div className="tc-slider-row">
                <span className="tc-slider-label">L</span>
                <input 
                  type="range" min="0" max="100" value={hsl.l} 
                  onChange={e => handleSliderChange(hsl.h, hsl.s, Number(e.target.value))}
                  className="tc-range-slider tc-range-lit"
                  style={{ background: `linear-gradient(to right, #000, hsl(${hsl.h}, ${hsl.s}%, 50%), #fff)` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
