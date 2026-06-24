import React, { useState, useEffect, useRef } from 'react';
import { useBrowser, BG_MAP } from '../../context/BrowserContext';
import { HexColorPicker, RgbaStringColorPicker } from 'react-colorful';
import { Save, X, Beaker, Eye, LayoutTemplate, Ghost, Upload } from 'lucide-react';
import './ThemeCreator.css';

const DEFAULT_THEME_STATE = {
  name: 'My Custom Theme',
  colors: {
    bgPrimary: '#08060b',
    bgSecondary: '#0f0c12',
    accentPrimary: '#ff5500',
    accentSecondary: '#7b21d4',
    textPrimary: '#f0ecf5',
    textSecondary: '#9088a0',
    textMuted: '#4a4055',
    borderColor: '#221133',
    borderHighlight: '#552200',
    panelBg: 'rgba(15, 12, 18, 0.75)',
    chromeBgBase: '#080709',
    chromeBgTabs: '#050507',
    chromeBgTabActive: '#131015',
    chromeBgTabInactive: 'rgba(255, 255, 255, 0.03)',
    chromeBgSidebar: 'rgba(15, 12, 18, 0.75)',
    chromeBgFavicon: '#3a3040',
    chromeBgMenu: 'rgba(8, 5, 16, 0.96)',
    chromeBgToolbar: '#0f0c12',
    chromeBgUrlbar: '#06050a',
    chromeTextSidebar: 'rgba(180, 120, 60, 0.7)',
    textSearchbar: '#f0ecf5',
    chromeTextTabActive: '#f0ecf5',
    chromeTextTabInactive: '#9088a0'
  },
  brandFont: 'Cinzel Decorative',
  uiFont: 'Inter',
  backgroundImage: 'dashboard-bg',
  particleAnimation: 'bats',
  showFog: true
};

const BRAND_FONTS = [
  'Cryptik',
  'Exquisite Corpse',
  'Frank Knows',
  'Kreepy Krawly',
  'October Crow',
  'Raven Scream',
  'Raven Song',
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
const UI_FONTS = ['Inter', 'Roboto', 'Share Tech Mono', 'Outfit', 'Jura', 'Space Mono', 'Merriweather', 'Playfair Display', 'Lato', 'Montserrat', 'Oswald'];

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
    navigate(activeTabId, 'hallow://settings#themes');
  };

  // Live Preview CSS Injection
  const previewStyle = {
    '--bg-primary': themeState.colors.bgPrimary,
    '--bg-secondary': themeState.colors.bgSecondary,
    '--chrome-bg-base': themeState.colors.chromeBgBase,
    '--chrome-bg-tabs': themeState.colors.chromeBgTabs,
    '--chrome-bg-tab-active': themeState.colors.chromeBgTabActive,
    '--chrome-bg-tab-inactive': themeState.colors.chromeBgTabInactive,
    '--chrome-bg-sidebar': themeState.colors.chromeBgSidebar,
    '--chrome-bg-favicon': themeState.colors.chromeBgFavicon,
    '--chrome-bg-menu': themeState.colors.chromeBgMenu,
    '--chrome-bg-toolbar': themeState.colors.chromeBgToolbar,
    '--chrome-bg-urlbar': themeState.colors.chromeBgUrlbar,
    '--chrome-text-sidebar': themeState.colors.chromeTextSidebar,
    '--text-searchbar': themeState.colors.textSearchbar,
    '--chrome-text-tab-active': themeState.colors.chromeTextTabActive,
    '--chrome-text-tab-inactive': themeState.colors.chromeTextTabInactive,
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
    '--dashboard-bg': !themeState.backgroundImage || themeState.backgroundImage === 'none' ? 'none' : `url('${themeState.backgroundImage?.startsWith('data:image') ? themeState.backgroundImage : (BG_MAP[themeState.backgroundImage] || BG_MAP['dashboard-bg'])}')`,
    '--shadow-glow-orange': `0 0 20px color-mix(in srgb, ${themeState.colors.accentPrimary} 40%, transparent), 0 0 40px color-mix(in srgb, ${themeState.colors.accentPrimary} 15%, transparent)`,
    background: 'var(--chrome-bg-base)',
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
          <button className="tc-btn tc-btn-cancel" onClick={() => navigate(activeTabId, 'hallow://settings#themes')}>
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
                    style={{ 
                      backgroundImage: bg === 'none' ? 'none' : `url(${BG_MAP[bg]})`,
                      ...(bg === 'none' ? { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' } : {})
                    }}
                    onClick={() => setThemeState({...themeState, backgroundImage: bg})}
                    title={bg.replace('_', ' ')}
                  >
                    {bg === 'none' && <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Cinzel, serif', fontSize: '1.2rem', letterSpacing: '0.2em' }}>NONE</span>}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                <input 
                  type="checkbox" 
                  id="showFogToggle"
                  checked={themeState.showFog ?? true}
                  onChange={(e) => setThemeState({...themeState, showFog: e.target.checked})}
                  style={{ accentColor: '#ff5500', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="showFogToggle" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace' }}>Enable Flowing Fog Layer</label>
              </div>
            </div>
            
            <div className="tc-section">
              <h2>Core Colors</h2>
            <div className="tc-color-grid">
              <ColorPicker label="Accent Primary" value={themeState.colors.accentPrimary} onChange={(v) => handleColorChange('accentPrimary', v)} />
              <ColorPicker label="Accent Secondary" value={themeState.colors.accentSecondary} onChange={(v) => handleColorChange('accentSecondary', v)} />
              <ColorPicker label="New Tab Background" value={themeState.colors.bgPrimary} onChange={(v) => handleColorChange('bgPrimary', v)} />
            </div>
          </div>

          <div className="tc-section">
            <h2>Browser Chrome Colors</h2>
            <div className="tc-color-grid">
              <ColorPicker label="Top Bar Base" value={themeState.colors.chromeBgBase} onChange={(v) => handleColorChange('chromeBgBase', v)} />
              <ColorPicker label="Tabs Strip" value={themeState.colors.chromeBgTabs} onChange={(v) => handleColorChange('chromeBgTabs', v)} />
              <ColorPicker label="Active Tab" value={themeState.colors.chromeBgTabActive} onChange={(v) => handleColorChange('chromeBgTabActive', v)} />
              <ColorPicker label="Inactive Tabs" value={themeState.colors.chromeBgTabInactive} onChange={(v) => handleColorChange('chromeBgTabInactive', v)} />
              <ColorPicker label="Toolbar" value={themeState.colors.chromeBgToolbar} onChange={(v) => handleColorChange('chromeBgToolbar', v)} />
              <ColorPicker label="Address Bar" value={themeState.colors.chromeBgUrlbar} onChange={(v) => handleColorChange('chromeBgUrlbar', v)} />
              <ColorPicker label="Sidebar BG" value={themeState.colors.chromeBgSidebar} onChange={(v) => handleColorChange('chromeBgSidebar', v)} />
            </div>
          </div>

          <div className="tc-section">
            <h2>Text & Borders</h2>
            <div className="tc-color-grid">
              <ColorPicker label="Text Primary" value={themeState.colors.textPrimary} onChange={(v) => handleColorChange('textPrimary', v)} />
              <ColorPicker label="Text Secondary" value={themeState.colors.textSecondary} onChange={(v) => handleColorChange('textSecondary', v)} />
              <ColorPicker label="Text Muted" value={themeState.colors.textMuted} onChange={(v) => handleColorChange('textMuted', v)} />
              <ColorPicker label="Sidebar Text" value={themeState.colors.chromeTextSidebar} onChange={(v) => handleColorChange('chromeTextSidebar', v)} />
              <ColorPicker label="Search Bar Text" value={themeState.colors.textSearchbar} onChange={(v) => handleColorChange('textSearchbar', v)} />
              <ColorPicker label="Active Tab Text" value={themeState.colors.chromeTextTabActive} onChange={(v) => handleColorChange('chromeTextTabActive', v)} />
              <ColorPicker label="Inactive Tab Text" value={themeState.colors.chromeTextTabInactive} onChange={(v) => handleColorChange('chromeTextTabInactive', v)} />
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
              {/* Browser Chrome Simulator */}
              <div style={{ height: '38px', background: 'var(--chrome-bg-tabs)', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid var(--border-highlight)', paddingLeft: '8px' }}>
                <div style={{ 
                  padding: '0 16px', 
                  height: '32px', 
                  background: 'var(--chrome-bg-tab-active)', 
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
                  <span style={{ color: 'var(--accent-primary)' }}>Hallow</span><span style={{ color: 'var(--accent-secondary)' }}>Net</span> Dashboard
                </div>
              </div>
              
              {/* Fake Address Bar */}
              <div style={{ height: '46px', background: 'var(--chrome-bg-toolbar)', borderBottom: '1px solid var(--border-highlight)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <div style={{ flex: 1, height: '30px', background: 'var(--chrome-bg-urlbar)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  hallow://dashboard
                </div>
                <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                  <Ghost size={16} color="var(--accent-primary)" />
                </div>
              </div>

              {/* Main Content Area (Layout Simulator) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'row', position: 'relative' }}>
                {/* Main Dashboard Panel */}
                <div style={{ 
                  flex: 1, 
                  background: 'var(--dashboard-bg) center/cover no-repeat', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  padding: '30px', 
                  gap: '20px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 0 }}></div>
                  {/* Dashboard Content */}
                  <div style={{ textAlign: 'center', marginTop: '20px', zIndex: 1 }}>
                    <h1 style={{ fontFamily: 'var(--brand-font)', fontSize: '3rem', margin: 0 }}>
                      {themeState.name ? (
                        <span style={{ color: 'var(--accent-primary)', textShadow: '0 0 10px var(--accent-primary)' }}>{themeState.name}</span>
                      ) : (
                        <>
                          <span style={{ color: 'var(--accent-primary)', textShadow: '0 0 10px var(--accent-primary)' }}>HALLOW</span>
                          <span style={{ color: 'var(--accent-secondary)', textShadow: '0 0 10px var(--accent-secondary)' }}>NET</span>
                        </>
                      )}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', margin: '10px auto', maxWidth: '400px' }}>
                      This is a live preview of your forged theme. Colors, fonts, and borders will update instantly.
                    </p>
                  </div>
                  
                  {/* Fake Grid Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '10px', zIndex: 1 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ 
                        height: '60px', 
                        background: 'var(--panel-bg)', 
                        border: '1px solid var(--border-color)', 
                        backdropFilter: 'blur(8px)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)',
                        boxShadow: 'var(--shadow-md)'
                      }}>
                        <Ghost size={24} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Simulator */}
                <div style={{ 
                  width: '140px', 
                  background: 'var(--chrome-bg-sidebar)', 
                  borderLeft: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '15px',
                  gap: '10px',
                  boxShadow: '-5px 0 20px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ color: 'color-mix(in srgb, var(--chrome-text-sidebar) 75%, transparent)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' }}>BOOKMARKS</div>
                  <div style={{ color: 'color-mix(in srgb, var(--chrome-text-sidebar) 60%, transparent)', fontSize: '11px', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Horror Movies</div>
                  <div style={{ color: 'color-mix(in srgb, var(--chrome-text-sidebar) 60%, transparent)', fontSize: '11px', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Scary Stories</div>
                  <div style={{ color: 'color-mix(in srgb, var(--chrome-text-sidebar) 60%, transparent)', fontSize: '11px', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Urban Legends</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Color Picker Component using react-colorful for a sleek Triple-A feel
function ColorPicker({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const isRgba = value && value.toString().startsWith('rgba');
  const safeValue = value || '#000000';

  const PickerComponent = isRgba ? RgbaStringColorPicker : HexColorPicker;

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
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="tc-color-hex-input"
          placeholder={isRgba ? "rgba(r,g,b,a)" : "#RRGGBB"}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {isOpen && (
        <>
          <div className="tc-popover-overlay" onClick={() => setIsOpen(false)} />
          <div className="tc-color-popover" style={{ padding: '16px', width: 'auto', display: 'flex', justifyContent: 'center', background: 'var(--panel-bg)', backdropFilter: 'blur(10px)' }}>
            <PickerComponent color={safeValue} onChange={onChange} />
          </div>
        </>
      )}
    </div>
  );
}
