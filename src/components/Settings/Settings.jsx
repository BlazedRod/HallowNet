import React, { useState, useEffect, useRef } from 'react';
import { useBrowser } from '../../context/BrowserContext';
import { Key, Shield, Trash2, Copy, Eye, EyeOff, LayoutTemplate, Search, PaintBucket, Lock, Info, Pencil, X, Check } from 'lucide-react';
import './Settings.css';

const THEMES = [
  { id: 'classic-halloween', name: 'Classic Halloween' },
  { id: 'autumn-forest',     name: 'Autumn Forest'     },
  { id: 'geesebimps',        name: 'Geesebimps'        },
  { id: 'blood-moon',        name: 'Blood Moon'        },
  { id: 'grimoire',          name: 'Grimoire'          },
];

const SEARCH_ENGINES = [
  { id: 'google',     name: 'Google' },
  { id: 'duckduckgo', name: 'DuckDuckGo' },
  { id: 'bing',       name: 'Bing' },
];

export default function Settings({ isActive }) {
  const { 
    theme, setTheme, customThemes, deleteCustomTheme, activeTabId, navigate,
    sidebarOpen, setSidebarOpen,
    restoreSession, setRestoreSession,
    searchEngine, setSearchEngine,
    showTabIcons, setShowTabIcons,
    toolbarSettings, setToolbarSettings,
    audioSettings, setAudioSettings,
    passwords, savePassword, deletePassword,
    panicHotkey, setPanicHotkey
  } = useBrowser();

  const [activeTab, setActiveTab] = useState('general');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleTutorial = (e) => {
      const { action } = e.detail;
      if (action === 'settings-tab-general') setActiveTab('general');
      if (action === 'settings-tab-themes') setActiveTab('themes');
      if (action === 'settings-tab-toolbar') setActiveTab('toolbar');
      if (action === 'settings-tab-hotkeys') setActiveTab('hotkeys');
      if (action === 'settings-tab-crypt') setActiveTab('crypt');
      if (action === 'settings-tab-about') setActiveTab('about');
    };
    window.addEventListener('tutorial-action', handleTutorial);
    return () => window.removeEventListener('tutorial-action', handleTutorial);
  }, []);

  return (
    <div className="settings-page">
      {isActive && (
        <>
          <div className="settings-bg" />
          <div className="settings-fog-layer" />
        </>
      )}

      <div className="settings-inner">
        <div className="settings-header">
          <h1 className="settings-title">CONFIGURATION</h1>
          <p className="settings-subtitle">HallowNet Core Parameters</p>
        </div>

        <div className="settings-core-layout">
          {/* Sidebar Navigation */}
          <div className="settings-sidebar">
            <button className={`settings-nav-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              <LayoutTemplate size={16} /> General
            </button>
            <button className={`settings-nav-btn ${activeTab === 'themes' ? 'active' : ''}`} onClick={() => setActiveTab('themes')}>
              <PaintBucket size={16} /> Themes
            </button>
            <button className={`settings-nav-btn ${activeTab === 'toolbar' ? 'active' : ''}`} onClick={() => setActiveTab('toolbar')}>
              <Search size={16} /> Toolbar
            </button>
            <button className={`settings-nav-btn ${activeTab === 'hotkeys' ? 'active' : ''}`} onClick={() => setActiveTab('hotkeys')}>
              <Key size={16} /> Hotkeys
            </button>
            <button className={`settings-nav-btn ${activeTab === 'crypt' ? 'active' : ''}`} onClick={() => setActiveTab('crypt')}>
              <Lock size={16} /> The Crypt
            </button>
            <button className={`settings-nav-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
              <Info size={16} /> About
            </button>
          </div>

          {/* Content Area */}
          <div className="settings-content-area">
            {activeTab === 'general' && (
              <div className="settings-section animate-fade-in">
                <h2 className="section-title">Appearance & Search</h2>
                
                <div className="glass-panel">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Restore Previous Session</h3>
                      <p>Automatically reopen the tabs you were looking at when the browser was last closed.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={restoreSession} onChange={() => setRestoreSession(v => !v)} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Sidebar on Startup</h3>
                      <p>Display the widgets panel when the browser opens.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={sidebarOpen} onChange={() => setSidebarOpen(v => !v)} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Tab Favicons</h3>
                      <p>Display website icons next to the titles in the tab bar.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={showTabIcons} onChange={() => setShowTabIcons(v => !v)} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Default Search Engine</h3>
                      <p>Used when typing a query in the address bar.</p>
                    </div>
                    <div className="gothic-select-wrapper">
                      <select className="gothic-select" value={searchEngine} onChange={e => setSearchEngine(e.target.value)}>
                        {SEARCH_ENGINES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="setting-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div className="setting-info">
                      <h3>Startup Sound</h3>
                      <p>Play a haunting chime when HallowNet boots up.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={audioSettings?.startup} onChange={() => setAudioSettings({ ...audioSettings, startup: !audioSettings?.startup })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Interface Sounds</h3>
                      <p>Play atmospheric sound effects when opening or closing tabs.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={audioSettings?.tabs} onChange={() => setAudioSettings({ ...audioSettings, tabs: !audioSettings?.tabs })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Typing Feedback</h3>
                      <p>Play a subtle bone-tap sound when typing in the address bar.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={audioSettings?.typing} onChange={() => setAudioSettings({ ...audioSettings, typing: !audioSettings?.typing })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div className="setting-info">
                      <h3>Restart Tutorial</h3>
                      <p>Reset the tutorial state and replay the interactive Ghost Guide.</p>
                    </div>
                    <button
                      className="gothic-btn highlight"
                      style={{ cursor: 'pointer', letterSpacing: '0.1em', flexShrink: 0 }}
                      onClick={() => {
                        localStorage.removeItem('hwn_tutorial_completed');
                        window.location.reload();
                      }}
                    >
                      Replay Guide
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'themes' && (
              <div className="settings-section animate-fade-in">
                <h2 className="section-title">Atmosphere</h2>
                <div className="glass-panel">

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Browser Theme</h3>
                      <p>Choose the visual atmosphere for HallowNet.</p>
                    </div>
                    <div ref={themeDropdownRef} style={{ position: 'relative', minWidth: '220px' }}>
                      <button
                        className="gothic-select-custom"
                        onClick={() => setThemeDropdownOpen(o => !o)}
                      >
                        <span>{[...THEMES, ...(customThemes || [])].find(t => t.id === theme)?.name || theme}</span>
                        <span className="gothic-select-arrow" style={{ transform: themeDropdownOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                      </button>

                      {themeDropdownOpen && (
                        <div className="gothic-dropdown">
                          <div className="gothic-dropdown-group-label">Official Themes</div>
                          {THEMES.map(t => (
                            <div
                              key={t.id}
                              className={`gothic-dropdown-item ${theme === t.id ? 'active' : ''}`}
                              onClick={() => { setTheme(t.id); setThemeDropdownOpen(false); }}
                            >{t.name}</div>
                          ))}

                          {customThemes && customThemes.length > 0 && (
                            <>
                              <div className="gothic-dropdown-group-label" style={{ marginTop: '6px' }}>Lab Themes</div>
                              {customThemes.map(t => (
                                <div
                                  key={t.id}
                                  className={`gothic-dropdown-item ${theme === t.id ? 'active' : ''}`}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                                >
                                  <span
                                    style={{ flex: 1, cursor: 'pointer' }}
                                    onClick={() => { setTheme(t.id); setThemeDropdownOpen(false); }}
                                  >{t.name}</span>
                                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    <button
                                      title="Edit"
                                      onClick={(e) => { e.stopPropagation(); setThemeDropdownOpen(false); navigate(activeTabId, `hallow://theme-creator?edit=${t.id}`); }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    ><Pencil size={12} /></button>
                                    <button
                                      title="Delete"
                                      onClick={(e) => { e.stopPropagation(); deleteCustomTheme(t.id); }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                                      onMouseEnter={e => e.currentTarget.style.color = '#ff5555'}
                                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                    ><X size={12} /></button>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="setting-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div className="setting-info">
                      <h3>Theme Lab</h3>
                      <p>Design your own custom theme with live preview.</p>
                    </div>
                    <button
                      className="gothic-btn highlight theme-lab-btn"
                      style={{ cursor: 'pointer', letterSpacing: '0.1em', flexShrink: 0 }}
                      onClick={() => navigate(activeTabId, 'hallow://theme-creator')}
                    >
                      Open Theme Lab
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'toolbar' && (
              <div className="settings-section animate-fade-in">
                <h2 className="section-title">Toolbar Actions</h2>
                <div className="glass-panel">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Extensions</h3>
                      <p>Display the Extensions button in the main toolbar.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={toolbarSettings?.showExtensions} onChange={() => setToolbarSettings({ ...toolbarSettings, showExtensions: !toolbarSettings?.showExtensions })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Gargoyle</h3>
                      <p>Display the Gargoyle Protection shield button.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={toolbarSettings?.showGargoyle} onChange={() => setToolbarSettings({ ...toolbarSettings, showGargoyle: !toolbarSettings?.showGargoyle })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Ghost Mode</h3>
                      <p>Display the Ghost Mode quick toggle.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={toolbarSettings?.showGhostMode} onChange={() => setToolbarSettings({ ...toolbarSettings, showGhostMode: !toolbarSettings?.showGhostMode })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Poltergeist Studio</h3>
                      <p>Display the macro recording button.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={toolbarSettings?.showPoltergeist} onChange={() => setToolbarSettings({ ...toolbarSettings, showPoltergeist: !toolbarSettings?.showPoltergeist })} />
                      <span className="runic-track" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Show Banshee Board</h3>
                      <p>Display the soundboard button.</p>
                    </div>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={toolbarSettings?.showBanshee} onChange={() => setToolbarSettings({ ...toolbarSettings, showBanshee: !toolbarSettings?.showBanshee })} />
                      <span className="runic-track" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hotkeys' && (
              <div className="settings-section animate-fade-in">
                <h2 className="section-title">Keyboard Shortcuts</h2>
                <div className="glass-panel">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h3>Panic Button (The Trapdoor)</h3>
                      <p>Instantly slams a heavy trapdoor over your screen, mutes all audio, and hides your tabs. Press again to restore.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        value={panicHotkey}
                        readOnly
                        className="hotkey-input"
                        placeholder="Click to bind..."
                        onKeyDown={(e) => {
                          e.preventDefault();
                          // Don't bind raw modifiers alone
                          if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
                          
                          let keyName = e.key;
                          if (keyName === ' ') keyName = 'Space';
                          if (keyName.length === 1) keyName = keyName.toUpperCase();
                          
                          let modifiers = [];
                          if (e.ctrlKey) modifiers.push('Ctrl');
                          if (e.shiftKey) modifiers.push('Shift');
                          if (e.altKey) modifiers.push('Alt');
                          
                          const finalKey = modifiers.length > 0 ? `${modifiers.join('+')}+${keyName}` : keyName;
                          setPanicHotkey(finalKey);
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-primary)',
                          padding: '8px 15px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-family)',
                          fontSize: '1rem',
                          textAlign: 'center',
                          width: '150px',
                          cursor: 'pointer',
                          outline: 'none',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crypt' && (
              <TheCrypt 
                passwords={passwords} 
                savePassword={savePassword} 
                deletePassword={deletePassword} 
              />
            )}

            {activeTab === 'about' && (
              <div className="settings-section animate-fade-in">
                <h2 className="section-title">About HallowNet</h2>
                <div className="glass-panel text-center">
                  <h3 className="about-branding">HALLOW<span>NET</span></h3>
                  <p className="about-desc">A Chromium-based browser built strictly for Halloween, horror, and autumn enthusiasts.</p>
                  <span className="about-version">v1.6.8 — Ghostly Helper Appears</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TheCrypt({ passwords, savePassword, deletePassword }) {
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [pwd, setPwd] = useState('');
  const [visibleStates, setVisibleStates] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Generator State
  const [genLen, setGenLen] = useState(16);
  const [genNum, setGenNum] = useState(true);
  const [genSym, setGenSym] = useState(true);
  const [generatedPwd, setGeneratedPwd] = useState('');

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let pool = chars;
    if (genNum) pool += nums;
    if (genSym) pool += syms;
    
    let res = '';
    for(let i=0; i<genLen; i++) {
      res += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    setGeneratedPwd(res);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!site || !pwd) return;
    savePassword({ site, username, password: pwd });
    setSite(''); setUsername(''); setPwd('');
  };

  const toggleVisible = (id) => {
    setVisibleStates(prev => ({...prev, [id]: !prev[id]}));
  };

  return (
    <div className="settings-section animate-fade-in crypt-section">
      <h2 className="section-title">The Crypt</h2>
      
      <div className="crypt-grid">
        {/* Left Col: Generator & Save Form */}
        <div className="crypt-left">
          <div className="glass-panel">
            <h3 className="panel-subtitle"><Shield size={16}/> Password Generator</h3>
            <div className="generator-body">
              <div className="gen-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ width: '80px' }}>Length: {genLen}</label>
                <input type="range" min="8" max="32" value={genLen} onChange={e => setGenLen(Number(e.target.value))} className="gothic-slider" style={{ flex: 1, marginLeft: '10px' }} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div className="gen-toggles">
                  <label className="runic-checkbox">
                    <input type="checkbox" checked={genNum} onChange={e => setGenNum(e.target.checked)}/> Numbers
                  </label>
                  <label className="runic-checkbox">
                    <input type="checkbox" checked={genSym} onChange={e => setGenSym(e.target.checked)}/> Symbols
                  </label>
                </div>
                <button className="gothic-btn" type="button" onClick={generatePassword} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Generate</button>
              </div>
              
              {generatedPwd && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="gothic-input" 
                    style={{ flex: 1, color: 'var(--accent-primary)', letterSpacing: '0.1em', padding: '8px 12px' }} 
                    value={generatedPwd} 
                    readOnly 
                  />
                  <button 
                    className="crypt-icon-btn" 
                    type="button" 
                    onClick={() => handleCopy(generatedPwd, 'gen')} 
                    title="Copy to Clipboard"
                    style={{ height: '36px', width: '36px', borderRadius: '4px' }}
                  >
                    {copiedId === 'gen' ? <Check size={16} color="#00ff66" /> : <Copy size={16}/>}
                  </button>
                </div>
              )}
            </div>
          </div>

          <form className="glass-panel" onSubmit={handleSave} style={{marginTop: '16px'}}>
            <h3 className="panel-subtitle"><Key size={16}/> Save New Password</h3>
            <div className="form-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
              <input className="gothic-input" type="text" placeholder="Website URL" value={site} onChange={e => setSite(e.target.value)} required />
              <input className="gothic-input" type="text" placeholder="Username (Optional)" value={username} onChange={e => setUsername(e.target.value)} />
              <input className="gothic-input" type="text" placeholder="Password" value={pwd} onChange={e => setPwd(e.target.value)} required />
              <button className="gothic-btn highlight" type="submit" style={{ padding: '10px', marginTop: '4px' }}>Save Password</button>
            </div>
          </form>
        </div>

        {/* Right Col: Saved Passwords */}
        <div className="crypt-right">
          <div className="glass-panel full-height">
            <h3 className="panel-subtitle"><Lock size={16}/> Saved Passwords ({passwords.length})</h3>
            <div className="crypt-list">
              {passwords.length === 0 ? (
                <div className="crypt-empty">Your vault is empty. No passwords saved.</div>
              ) : (
                passwords.map(p => (
                  <div key={p.id} className="crypt-item">
                    <div className="crypt-item-info">
                      <div className="crypt-item-site">{p.site}</div>
                      <div className="crypt-item-user">{p.username || 'No username'}</div>
                    </div>
                    <div className="crypt-item-pwd">
                      {visibleStates[p.id] ? p.password : '••••••••••••••••'}
                    </div>
                    <div className="crypt-actions">
                      <button type="button" className="crypt-icon-btn" onClick={() => toggleVisible(p.id)}>
                        {visibleStates[p.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                      <button type="button" className="crypt-icon-btn" onClick={() => handleCopy(p.password, p.id)} title="Copy Password">
                        {copiedId === p.id ? <Check size={16} color="#00ff66" /> : <Copy size={16}/>}
                      </button>
                      <button type="button" className="crypt-icon-btn danger" onClick={() => deletePassword(p.id)} title="Delete Password">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
