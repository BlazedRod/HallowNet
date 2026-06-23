import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

import dashboardBg from '../assets/backgrounds/dashboard-bg.png';
import hauntedMansion from '../assets/backgrounds/haunted_mansion.png';
import darkForest from '../assets/backgrounds/dark_forest.png';
import mistyGraveyard from '../assets/backgrounds/misty_graveyard.png';
import gothicCastle from '../assets/backgrounds/gothic_castle.png';
import hauntedCarnival from '../assets/backgrounds/haunted_carnival.png';
import spookyBasement from '../assets/backgrounds/spooky_basement.png';
import scarecrowField from '../assets/backgrounds/scarecrow_field.png';

export const BG_MAP = {
  'dashboard-bg': dashboardBg,
  'haunted_mansion': hauntedMansion,
  'dark_forest': darkForest,
  'misty_graveyard': mistyGraveyard,
  'gothic_castle': gothicCastle,
  'haunted_carnival': hauntedCarnival,
  'spooky_basement': spookyBasement,
  'scarecrow_field': scarecrowField
};

const BrowserContext = createContext();

export const useBrowser = () => useContext(BrowserContext);

// Unique ghost session ID for this app launch (non-persistent partition)
const GHOST_PARTITION = `ghost-${Date.now()}`;

export const BrowserProvider = ({ children }) => {
  const [tabs, setTabs] = useState(() => {
    const shouldRestore = localStorage.getItem('hwn_restoreSession') !== 'false';
    if (shouldRestore) {
      try {
        const saved = localStorage.getItem('hwn_session_tabs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(tab => ({
              ...tab,
              loading: false,
              isGhost: false,
              poltergeist: { refreshInterval: null, scrollSpeed: null, isRecording: false, isPlaying: false, macroEvents: [], loopMacro: false }
            }));
          }
        }
      } catch(e) {}
    }
    return [{ id: '1', url: 'hallow://dashboard', title: 'HallowNet Dashboard', loading: false, favicon: '', isGhost: false, poltergeist: { refreshInterval: null, scrollSpeed: null, isRecording: false, isPlaying: false, macroEvents: [], loopMacro: false } }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    const shouldRestore = localStorage.getItem('hwn_restoreSession') !== 'false';
    if (shouldRestore) {
      return localStorage.getItem('hwn_session_activeTab') || '1';
    }
    return '1';
  });

  useEffect(() => {
    const sessionTabs = tabs.filter(t => !t.isGhost).map(t => ({
      id: t.id,
      url: t.url,
      title: t.title,
      favicon: t.favicon
    }));
    
    if (sessionTabs.length > 0) {
      localStorage.setItem('hwn_session_tabs', JSON.stringify(sessionTabs));
      const activeIsGhost = tabs.find(t => t.id === activeTabId)?.isGhost;
      localStorage.setItem('hwn_session_activeTab', activeIsGhost ? sessionTabs[sessionTabs.length - 1].id : activeTabId);
    } else {
      localStorage.removeItem('hwn_session_tabs');
      localStorage.removeItem('hwn_session_activeTab');
    }
  }, [tabs, activeTabId]);
  const [ghostMode, setGhostModeRaw] = useState(false);

  // ── Persisted settings (read from localStorage on first mount) ──
  const [theme, setThemeRaw] = useState(() => {
    const stored = localStorage.getItem('hwn_theme');
    const validBuiltins = ['classic-halloween', 'blood-moon', 'ectoplasm', 'witch-brew', 'geesebimps', 'grimoire'];
    if (stored && (validBuiltins.includes(stored) || stored.startsWith('custom-'))) return stored;
    return 'classic-halloween';
  });
  const [sidebarOpen, setSidebarOpenRaw] = useState(
    () => localStorage.getItem('hwn_sidebar') !== null
      ? localStorage.getItem('hwn_sidebar') === 'true'
      : true
  );
  const [searchEngine, setSearchEngineRaw] = useState(
    () => localStorage.getItem('hwn_searchEngine') || 'google'
  );
  const [showTabIcons, setShowTabIconsRaw] = useState(
    () => localStorage.getItem('hwn_tabIcons') !== null
      ? localStorage.getItem('hwn_tabIcons') === 'true'
      : true
  );
  const [toolbarSettings, setToolbarSettingsRaw] = useState(
    () => {
      const stored = localStorage.getItem('hwn_toolbarSettings');
      return stored ? JSON.parse(stored) : { showExtensions: true, showGargoyle: true, showGhostMode: true, showPoltergeist: true, showBanshee: true };
    }
  );
  
  const [customThemes, setCustomThemesRaw] = useState(() => {
    const stored = localStorage.getItem('hwn_custom_themes');
    return stored ? JSON.parse(stored) : [];
  });

  const [restoreSession, setRestoreSessionRaw] = useState(
    () => localStorage.getItem('hwn_restoreSession') !== null
      ? localStorage.getItem('hwn_restoreSession') === 'true'
      : true
  );

  const [trapdoorActive, setTrapdoorActiveRaw] = useState(false);
  const [panicHotkey, setPanicHotkeyRaw] = useState(
    () => localStorage.getItem('hwn_panicHotkey') || 'F12'
  );

  // Wrap setters to also persist to localStorage
  const setTheme = (v) => { localStorage.setItem('hwn_theme', v); setThemeRaw(v); };
  const setSidebarOpen = (v) => {
    const next = typeof v === 'function' ? v(sidebarOpen) : v;
    localStorage.setItem('hwn_sidebar', String(next));
    setSidebarOpenRaw(next);
  };
  const setSearchEngine = (v) => { localStorage.setItem('hwn_searchEngine', v); setSearchEngineRaw(v); };
  const setShowTabIcons = (v) => {
    const next = typeof v === 'function' ? v(showTabIcons) : v;
    localStorage.setItem('hwn_tabIcons', String(next));
    setShowTabIconsRaw(next);
  };
  
  const [audioSettings, setAudioSettingsRaw] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('hwn_audioSettings')) || { startup: true, tabs: true, typing: true }; 
    } catch { 
      return { startup: true, tabs: true, typing: true }; 
    }
  });

  const setToolbarSettings = (v) => {
    localStorage.setItem('hwn_toolbarSettings', JSON.stringify(v));
    setToolbarSettingsRaw(v);
  };
  const setCustomThemes = (v) => {
    localStorage.setItem('hwn_custom_themes', JSON.stringify(v));
    setCustomThemesRaw(v);
  };
  const setRestoreSession = (v) => {
    const next = typeof v === 'function' ? v(restoreSession) : v;
    localStorage.setItem('hwn_restoreSession', String(next));
    setRestoreSessionRaw(next);
  };
  const setPanicHotkey = (v) => {
    localStorage.setItem('hwn_panicHotkey', v);
    setPanicHotkeyRaw(v);
  };
  const setAudioSettings = (v) => {
    const next = typeof v === 'function' ? v(audioSettings) : v;
    localStorage.setItem('hwn_audioSettings', JSON.stringify(next));
    setAudioSettingsRaw(next);
  };

  const setTrapdoorActive = (val) => {
    const next = typeof val === 'function' ? val(trapdoorActive) : val;
    setTrapdoorActiveRaw(next);
    if (next) AudioEngine.playTrapdoorSlam();
  };

  // Global Panic Button Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if the user is literally just typing the hotkey name into an input somewhere,
      // but wait, F-keys are safe. If they bind it to a letter, we should ignore if in input.
      // We will handle input ignores just in case they bind it to a standard key.
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      if (e.key === panicHotkey && (!isInput || panicHotkey.startsWith('F'))) {
        e.preventDefault();
        setTrapdoorActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panicHotkey, trapdoorActive]); // Include trapdoorActive because setTrapdoorActive needs fresh state or we use functional updater

  const saveCustomTheme = (themeData) => {
    setCustomThemesRaw(prev => {
      const next = [...prev.filter(t => t.id !== themeData.id), themeData];
      localStorage.setItem('hwn_custom_themes', JSON.stringify(next));
      return next;
    });
  };
  
  const deleteCustomTheme = (id) => {
    setCustomThemesRaw(prev => {
      const next = prev.filter(t => t.id !== id);
      localStorage.setItem('hwn_custom_themes', JSON.stringify(next));
      return next;
    });
    if (theme === id) setTheme('classic-halloween');
  };

  const [bookmarks, setBookmarks] = useState([
    { id: 'b1', url: 'https://www.imdb.com/feature/genre/horror/', title: 'Horror Movies' }
  ]);
  const [history, setHistory] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [directory, setDirectory] = useState([]);

  useEffect(() => {
    if (window.electronAPI?.getPasswords) {
      window.electronAPI.getPasswords().then(pwds => setPasswords(pwds || []));
    }
    if (window.electronAPI?.getHistory) {
      window.electronAPI.getHistory().then(hist => setHistory(hist || []));
    }
    if (window.electronAPI?.getDirectory) {
      window.electronAPI.getDirectory().then(dir => setDirectory(dir || []));
    }
  }, []);
  
  // ── Downloads State ──
  const [downloads, setDownloads] = useState([]);

  // Active webview ref for back/forward navigation
  const activeWebviewRef = useRef(null);
  const setActiveWebview = (ref) => { activeWebviewRef.current = ref; };

  const goBack = () => {
    try {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (!activeTab) return;
      const isInternal = activeTab.url.startsWith('hallow://') || activeTab.url.startsWith('hallow-ghost://');

      if (!isInternal && activeWebviewRef.current?.canGoBack()) {
        activeWebviewRef.current.goBack();
      } else {
        const backStack = activeTab.backStack || [];
        if (backStack.length > 0) {
          const prevUrl = backStack[backStack.length - 1];
          const newBackStack = backStack.slice(0, -1);
          const forwardStack = [activeTab.url, ...(activeTab.forwardStack || [])];
          setTabs(prev => prev.map(t => {
            if (t.id === activeTabId) {
              const updates = { url: prevUrl, backStack: newBackStack, forwardStack };
              if (prevUrl === 'hallow://settings') updates.title = 'Settings';
              else if (prevUrl === 'hallow://gargoyle') updates.title = 'Gargoyle Protection';
              else if (prevUrl === 'hallow://extensions') updates.title = 'Extensions';
              else if (prevUrl === 'hallow://dashboard' || prevUrl === 'hallow-ghost://dashboard') updates.title = 'HallowNet Dashboard';
              return { ...t, ...updates };
            }
            return t;
          }));
        }
      }
    } catch(e) {}
  };

  const goForward = () => {
    try {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (!activeTab) return;
      const isInternal = activeTab.url.startsWith('hallow://') || activeTab.url.startsWith('hallow-ghost://');

      if (!isInternal && activeWebviewRef.current?.canGoForward()) {
        activeWebviewRef.current.goForward();
      } else {
        const forwardStack = activeTab.forwardStack || [];
        if (forwardStack.length > 0) {
          const nextUrl = forwardStack[0];
          const newForwardStack = forwardStack.slice(1);
          const backStack = [...(activeTab.backStack || []), activeTab.url];
          setTabs(prev => prev.map(t => {
            if (t.id === activeTabId) {
              const updates = { url: nextUrl, backStack, forwardStack: newForwardStack };
              if (nextUrl === 'hallow://settings') updates.title = 'Settings';
              else if (nextUrl === 'hallow://gargoyle') updates.title = 'Gargoyle Protection';
              else if (nextUrl === 'hallow://extensions') updates.title = 'Extensions';
              else if (nextUrl === 'hallow://dashboard' || nextUrl === 'hallow-ghost://dashboard') updates.title = 'HallowNet Dashboard';
              return { ...t, ...updates };
            }
            return t;
          }));
        }
      }
    } catch(e) {}
  };
  const reload    = () => { 
    try { 
      if (activeWebviewRef.current?.reload) {
        activeWebviewRef.current.reload(); 
      } else if (activeWebviewRef.current) {
        activeWebviewRef.current.src = activeWebviewRef.current.src;
      }
    } catch(e) {} 
  };

  // Toggle Ghost Mode — when enabling, opens a ghost new tab
  const toggleGhostMode = () => {
    const next = !ghostMode;
    setGhostModeRaw(next);
    if (next) {
      // Open a fresh ghost tab automatically
      const newId = Date.now().toString();
      setTabs(prev => [...prev, { id: newId, url: 'hallow://dashboard', title: 'Ghost Tab', loading: false, favicon: '', isGhost: true }]);
      setActiveTabId(newId);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Inject custom theme variables if a custom theme is selected
    const custom = customThemes.find(t => t.id === theme);
    let styleTag = document.getElementById('hwn-custom-theme-style');
    if (custom) {
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'hwn-custom-theme-style';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        :root {
          --bg-primary: ${custom.colors.bgPrimary};
          --bg-secondary: ${custom.colors.bgSecondary};
          --bg-tertiary: ${custom.colors.bgTertiary};
          --accent-primary: ${custom.colors.accentPrimary};
          --accent-secondary: ${custom.colors.accentSecondary};
          --accent-glow: ${custom.colors.accentPrimary};
          --text-primary: ${custom.colors.textPrimary};
          --text-secondary: ${custom.colors.textSecondary};
          --text-muted: ${custom.colors.textMuted};
          --border-color: ${custom.colors.borderColor};
          --border-highlight: ${custom.colors.borderHighlight};
          --panel-bg: ${custom.colors.panelBg};
          --brand-font: '${custom.brandFont}', sans-serif;
          --font-family: '${custom.uiFont}', sans-serif;
          --dashboard-bg: url('${custom.backgroundImage?.startsWith('data:image') ? custom.backgroundImage : (BG_MAP[custom.backgroundImage] || BG_MAP['dashboard-bg'])}');
          --shadow-glow-orange: 0 0 20px color-mix(in srgb, ${custom.colors.accentPrimary} 40%, transparent), 0 0 40px color-mix(in srgb, ${custom.colors.accentPrimary} 15%, transparent);
          --shadow-glow-purple: 0 0 20px color-mix(in srgb, ${custom.colors.accentPrimary} 40%, transparent), 0 0 40px color-mix(in srgb, ${custom.colors.accentPrimary} 15%, transparent);
        }
      `;
    } else {
      if (styleTag) styleTag.remove();
    }
  }, [theme, customThemes]);

  // Apply ghost-mode class to root for styling
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab?.isGhost) {
      document.documentElement.classList.add('ghost-mode');
    } else {
      document.documentElement.classList.remove('ghost-mode');
    }
  }, [activeTabId, tabs]);

  // ── Download IPC Listeners ──
  useEffect(() => {
    if (!window.electronAPI?.downloads) return;

    window.electronAPI.downloads.onStarted((data) => {
      setDownloads(prev => [{ ...data, state: 'progressing', receivedBytes: 0 }, ...prev]);
    });

    window.electronAPI.downloads.onUpdated((data) => {
      setDownloads(prev => prev.map(d => {
        if (d.id === data.id) {
          return { ...d, ...data };
        }
        return d;
      }));
    });

    window.electronAPI.downloads.onDone((data) => {
      setDownloads(prev => prev.map(d => {
        if (d.id === data.id) {
          return { ...d, ...data };
        }
        return d;
      }));
    });
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onAddNewTab) return;
    window.electronAPI.onAddNewTab((url) => {
      addTab(url);
    });

    if (!window.electronAPI?.onTabMenuAction) return;
    window.electronAPI.onTabMenuAction((action, targetTabId) => {
      if (action === 'close') {
        closeTab(targetTabId);
      } else if (action === 'close-other') {
        setTabs(prev => {
          const target = prev.find(t => t.id === targetTabId);
          if (!target) return prev;
          setActiveTabId(target.id);
          const remainingGhost = target.isGhost;
          if (!remainingGhost) setGhostModeRaw(false);
          return [target];
        });
      } else if (action === 'close-all') {
        setTabs(prev => {
          const newTab = { 
            id: Date.now().toString(), 
            url: 'hallow://dashboard', 
            title: 'HallowNet Dashboard', 
            loading: false,
            isGhost: false,
            favicon: '',
            poltergeist: { refreshInterval: null, scrollSpeed: null, isRecording: false, isPlaying: false, macroEvents: [], loopMacro: false },
            banshee: { overdrive: 100 }
          };
          setActiveTabId(newTab.id);
          setGhostModeRaw(false);
          return [newTab];
        });
      }
    });
  }, []); // addTab and setTabs are stable

  const clearDownloads = () => setDownloads(prev => prev.filter(d => d.state === 'progressing' || d.state === 'paused'));
  const removeDownload = (id) => setDownloads(prev => prev.filter(d => d.id !== id));
  const pauseDownload = (id) => window.electronAPI?.downloads?.pause(id);
  const resumeDownload = (id) => window.electronAPI?.downloads?.resume(id);
  const cancelDownload = (id) => window.electronAPI?.downloads?.cancel(id);
  const showDownload = (path) => window.electronAPI?.downloads?.showInFolder(path);

  const addTab = (url = 'hallow://newtab') => {
    try {
      const settings = JSON.parse(localStorage.getItem('hwn_audioSettings'));
      if (!settings || settings.tabs) AudioEngine.playTabOpenSound();
    } catch(e) {}

    const isGhost = ghostMode;
    const finalUrl = isGhost && url === 'hallow://newtab' ? 'hallow-ghost://newtab' : url;

    let initialTitle = 'New Tab';
    if (finalUrl === 'hallow://settings') initialTitle = 'Settings';
    else if (finalUrl === 'hallow://gargoyle') initialTitle = 'Gargoyle Protection';
    else if (finalUrl === 'hallow://extensions') initialTitle = 'Extensions';

    const newTab = { 
      id: Date.now().toString(), 
      url: finalUrl, 
      title: initialTitle, 
      loading: false,
      isGhost: isGhost,
      favicon: '',
      poltergeist: { refreshInterval: null, scrollSpeed: null, isRecording: false, isPlaying: false, macroEvents: [], loopMacro: false },
      banshee: { overdrive: 100 }
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id) => {
    if (tabs.length <= 1) {
      navigate(id, 'hallow://dashboard');
      return;
    }

    try {
      const settings = JSON.parse(localStorage.getItem('hwn_audioSettings'));
      if (!settings || settings.tabs) AudioEngine.playTabCloseSound();
    } catch(e) {}

    // First, mark the tab as closing immediately to trigger the CSS animation
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isClosing: true } : t));
    
    // Schedule the actual DOM unmount after the 300ms animation finishes
    // This must be OUTSIDE the setState functional updater to prevent React from 
    // spinning up multiple zombie timeouts during concurrent render passes!
    setTimeout(() => {
      setTabs(currentTabs => {
        // If it was already removed, don't do anything
        if (!currentTabs.some(t => t.id === id)) return currentTabs;

        const finalTabs = currentTabs.filter(t => t.id !== id);
        
        // If we closed the active tab, switch to the last available tab
        if (activeTabId === id && finalTabs.length > 0) {
          setActiveTabId(finalTabs[finalTabs.length - 1].id);
        }
        
        // If no ghost tabs remain, disable ghost mode
        const remainingGhost = finalTabs.some(t => t.isGhost);
        if (!remainingGhost) setGhostModeRaw(false);
        
        return finalTabs;
      });
    }, 300);
  };

  const updateTab = useCallback((id, updates) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === id) {
        const newUpdates = typeof updates === 'function' ? updates(tab) : updates;
        return { ...tab, ...newUpdates };
      }
      return tab;
    }));
  }, []);

  const moveTab = (draggedId, targetId) => {
    setTabs(prev => {
      const draggedIndex = prev.findIndex(t => t.id === draggedId);
      const targetIndex = prev.findIndex(t => t.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) return prev;
      
      const newTabs = [...prev];
      const [draggedTab] = newTabs.splice(draggedIndex, 1);
      newTabs.splice(targetIndex, 0, draggedTab);
      return newTabs;
    });
  };

  const navigate = (id, url) => {
    let formattedUrl = url;
    if (!url.startsWith('http') && !url.startsWith('hallow://')) {
      if (url.includes('.') && !url.includes(' ')) {
        formattedUrl = `https://${url}`;
      } else {
        const encoded = encodeURIComponent(url);
        switch (searchEngine) {
          case 'duckduckgo': formattedUrl = `https://duckduckgo.com/?q=${encoded}`; break;
          case 'bing':       formattedUrl = `https://www.bing.com/search?q=${encoded}`; break;
          case 'google':
          default:           formattedUrl = `https://www.google.com/search?q=${encoded}`; break;
        }
      }
    }
    
    setTabs(prev => prev.map(t => {
      if (t.id === id) {
        let titleUpdate = null;
        if (formattedUrl === 'hallow://settings') titleUpdate = 'Settings';
        else if (formattedUrl === 'hallow://gargoyle') titleUpdate = 'Gargoyle Protection';
        else if (formattedUrl === 'hallow://extensions') titleUpdate = 'Extensions';
        else if (formattedUrl === 'hallow://dashboard' || formattedUrl === 'hallow-ghost://dashboard') titleUpdate = 'HallowNet Dashboard';

        if (t.url === formattedUrl) {
          if (titleUpdate && t.title !== titleUpdate) {
            return { ...t, title: titleUpdate };
          }
          return t;
        }
        
        const updates = { url: formattedUrl };
        if (titleUpdate) updates.title = titleUpdate;

        const backStack = [...(t.backStack || []), t.url];
        return { ...t, ...updates, backStack, forwardStack: [] };
      }
      return t;
    }));
  };

  const toggleBookmark = (tab) => {
    if (tab.isGhost) return; // No bookmarks in Ghost Mode
    if (bookmarks.find(b => b.url === tab.url)) {
      setBookmarks(bookmarks.filter(b => b.url !== tab.url));
    } else {
      setBookmarks([...bookmarks, { id: Date.now().toString(), url: tab.url, title: tab.title || tab.url }]);
    }
  };

  const addHistory = useCallback((url, title, isGhost) => {
    if (url.startsWith('hallow://')) return;
    if (isGhost) return; // No history in Ghost Mode
    if (window.electronAPI?.saveHistory) {
      window.electronAPI.saveHistory(url, title || url).then(hist => setHistory(hist || []));
    } else {
      setHistory(prev => [{ id: Date.now().toString(), url, title: title || url, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    }
  }, []);

  const updateHistoryTitle = useCallback((url, title, isGhost) => {
    if (url.startsWith('hallow://')) return;
    if (isGhost) return;
    if (window.electronAPI?.updateHistoryTitle) {
      window.electronAPI.updateHistoryTitle(url, title).then(hist => setHistory(hist || []));
    } else {
      setHistory(prev => {
        if (prev.length > 0 && prev[0].url === url) {
          const newHist = [...prev];
          newHist[0].title = title;
          return newHist;
        }
        return prev;
      });
    }
  }, []);
  
  const clearHistory = () => setHistory([]);

  const savePassword = async (pwdEntry) => {
    if (window.electronAPI?.savePassword) {
      const savedEntry = await window.electronAPI.savePassword(pwdEntry);
      setPasswords(prev => [...prev, savedEntry]);
    } else {
      setPasswords(prev => [...prev, { id: Date.now().toString(), ...pwdEntry }]);
    }
  };

  const deletePassword = async (id) => {
    if (window.electronAPI?.deletePassword) {
      await window.electronAPI.deletePassword(id);
    }
    setPasswords(prev => prev.filter(p => p.id !== id));
  };

  const addDirectoryItem = async (title, url) => {
    const newDir = [...directory, { title, url }];
    setDirectory(newDir);
    if (window.electronAPI?.saveDirectory) {
      await window.electronAPI.saveDirectory(newDir);
    }
  };

  const removeDirectoryItem = async (url) => {
    const newDir = directory.filter(item => item.url !== url);
    setDirectory(newDir);
    if (window.electronAPI?.saveDirectory) {
      await window.electronAPI.saveDirectory(newDir);
    }
  };

  return (
    <BrowserContext.Provider value={{
      tabs, activeTabId, setActiveTabId, addTab, closeTab, updateTab, moveTab,
      navigate,
      theme, setTheme, customThemes, saveCustomTheme, deleteCustomTheme,
      sidebarOpen, setSidebarOpen,
      restoreSession, setRestoreSession,
      bookmarks, toggleBookmark,
      history, addHistory, updateHistoryTitle, clearHistory,
      directory, addDirectoryItem, removeDirectoryItem,
      searchEngine, setSearchEngine,
      showTabIcons, setShowTabIcons,
      toolbarSettings, setToolbarSettings,
      audioSettings, setAudioSettings,
      trapdoorActive, setTrapdoorActive, panicHotkey, setPanicHotkey,
      passwords, savePassword, deletePassword,
      downloads, clearDownloads, removeDownload, pauseDownload, resumeDownload, cancelDownload, showDownload,
      setActiveWebview, goBack, goForward, reload,
      ghostMode, toggleGhostMode,
      GHOST_PARTITION
    }}>
      {children}
    </BrowserContext.Provider>
  );
};
