import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBrowser } from '../../context/BrowserContext';
import {
  ChevronLeft, ChevronRight, RotateCw, Home,
  Settings, Ghost, Search, Plus, X, Star, PanelRightClose, Puzzle, ShieldCheck, EyeOff, Activity, Volume2, Skull, Download, Folder, Pause, Play, Trash2
} from 'lucide-react';
import './BrowserChrome.css';

const PoltergeistIcon = ({ size = 16, color = 'currentColor', className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <text 
      x="50%" 
      y="50%" 
      dy=".35em"
      textAnchor="middle" 
      fill={color}
      style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: '24px', letterSpacing: 0 }}
    >
      P
    </text>
  </svg>
);

function getNiceTabTitle(url, title) {
  if (title && title.trim() !== '') return title;
  if (!url) return 'New Tab';
  if (url.includes('hallow://dashboard')) return 'Dashboard';
  if (url.includes('hallow://settings')) return 'Settings';
  if (url.includes('hallow://gargoyle')) return 'Gargoyle';
  if (url.includes('hallow://theme-creator')) return 'Theme Lab';
  if (url.includes('hallow://extensions')) return 'Extensions';
  if (url.includes('newtab')) return 'New Tab';
  return url;
}

function SortableTab({ tab, activeTabId, showTabIcons, setActiveTabId, closeTab, isOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || isOverlay ? 9999 : 'auto',
    opacity: isDragging && !isOverlay ? 0 : 1, // Hide original entirely while dragging so overlay shows
  };

  const displayTitle = getNiceTabTitle(tab.url, tab.title);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`tab ${tab.id === activeTabId ? 'active' : ''} ${tab.isGhost ? 'tab--ghost' : ''} ${tab.isClosing ? 'tab--closing' : ''} ${isDragging && !isOverlay ? 'tab--is-dragging' : ''} ${tab.poltergeist?.isRecording ? 'tab--recording' : (tab.poltergeist?.refreshInterval || tab.poltergeist?.scrollSpeed || tab.poltergeist?.isPlaying) ? 'tab--poltergeist' : ''} ${isOverlay ? 'tab--dragging-overlay' : ''}`}
      onClick={(e) => {
        // Prevent click if we were dragging
        if (e.defaultPrevented) return;
        setActiveTabId(tab.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        window.electronAPI?.showTabContextMenu(tab.id);
      }}
      title={displayTitle}
    >
      {showTabIcons && (
        tab.url.startsWith('hallow://') && !tab.isGhost ? (
          <Ghost size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        ) : tab.isGhost ? (
          <Ghost size={16} color="#a855f7" style={{ flexShrink: 0 }} />
        ) : tab.favicon ? (
          <img src={tab.favicon} className="tab-favicon" alt="" />
        ) : (
          <div className="tab-favicon-placeholder" />
        )
      )}
      {tab.poltergeist?.isRecording && (
        <div className="record-dot" style={{ width: '8px', height: '8px', flexShrink: 0, marginRight: '4px' }} title="Recording Haunt"></div>
      )}
      {tab.poltergeist?.isPlaying && (
        <PoltergeistIcon size={14} color="#00ff66" style={{ flexShrink: 0, marginRight: '4px', animation: 'spin 2s linear infinite' }} title="Playing Haunt" />
      )}
      <span className="tab-title">{displayTitle}</span>
      <button
        className="tab-close"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
        title="Close tab"
      >
        <X size={11} />
      </button>
    </div>
  );
}

import { AudioEngine } from '../../audio/AudioEngine';

export default function BrowserChrome() {
  const {
    tabs, activeTabId, setActiveTabId, addTab, closeTab, updateTab, moveTab,
    navigate, setSidebarOpen, bookmarks, toggleBookmark,
    showTabIcons, toolbarSettings, audioSettings, goBack, goForward, reload, ghostMode, toggleGhostMode,
    downloads, clearDownloads, removeDownload, pauseDownload, resumeDownload, cancelDownload, showDownload,
    updateAvailable
  } = useBrowser();
  const [urlInput, setUrlInput] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [showPoltergeistMenu, setShowPoltergeistMenu] = useState(false);
  const [showBansheeMenu, setShowBansheeMenu] = useState(false);
  const [showGargoyleMenu, setShowGargoyleMenu] = useState(false);
  const [showDownloadsMenu, setShowDownloadsMenu] = useState(false);
  const inputRef = useRef(null);
  const poltergeistRef = useRef(null);
  const bansheeRef = useRef(null);
  const gargoyleRef = useRef(null);
  const downloadsRef = useRef(null);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false;

  const [gargoyleEnabled, setGargoyleEnabled] = useState(true);
  const isRecordingRef = useRef(false);

  // Tab Freezing Logic
  const [frozenTabWidth, setFrozenTabWidth] = useState(null);
  const tabsContainerRef = useRef(null);

  // Dynamic fade and auto-scroll logic
  const [scrollState, setScrollState] = useState({ left: false, right: false });

  const updateScrollState = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setScrollState({
        left: scrollLeft > 10,
        right: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10
      });
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [tabs.length]);

  useEffect(() => {
    if (tabsContainerRef.current && activeTabId) {
      requestAnimationFrame(() => {
        if (!tabsContainerRef.current) return;
        const activeTabEl = tabsContainerRef.current.querySelector('.tab.active');
        if (activeTabEl) {
          const container = tabsContainerRef.current;
          const tabRect = activeTabEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const fadeZone = 30; // 24px mask + buffer
          let scrollDelta = 0;

          if (tabRect.left < containerRect.left + fadeZone) {
            scrollDelta = tabRect.left - (containerRect.left + fadeZone);
          } else if (tabRect.right > containerRect.right - fadeZone) {
            scrollDelta = tabRect.right - (containerRect.right - fadeZone);
          }

          if (scrollDelta !== 0) {
            container.scrollBy({ left: scrollDelta, behavior: 'smooth' });
          }
        }
      });
    }
  }, [activeTabId, tabs.length]);

  const handleTabCloseWrapper = (id) => {
    if (frozenTabWidth === null && tabsContainerRef.current) {
      const firstTab = tabsContainerRef.current.querySelector('.tab');
      if (firstTab) {
        setFrozenTabWidth(firstTab.getBoundingClientRect().width);
      }
    }
    closeTab(id);
  };

  const handleTabsMouseLeave = () => {
    setFrozenTabWidth(null);
  };

  // dnd-kit setup
  const [activeDragTab, setActiveDragTab] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Wait 5px to distinguish drag from click
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const tab = tabs.find(t => t.id === active.id);
    if (tab) setActiveDragTab(tab);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragTab(null);
    if (over && active.id !== over.id) {
      moveTab(active.id, over.id);
    }
  };

  const handleDragCancel = () => {
    setActiveDragTab(null);
  };

  useEffect(() => {
    isRecordingRef.current = !!activeTab?.poltergeist?.isRecording;
  }, [activeTab?.poltergeist?.isRecording]);

  useEffect(() => {
    if (window.electronAPI?.getGargoyleStats) {
      window.electronAPI.getGargoyleStats().then(s => setGargoyleEnabled(s.enabled)).catch(() => {});
    }
    const interval = setInterval(() => {
      if (window.electronAPI?.getGargoyleStats) {
        window.electronAPI.getGargoyleStats().then(s => setGargoyleEnabled(s.enabled)).catch(() => {});
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleGargoyle = async () => {
    if (window.electronAPI?.toggleGargoyle) {
      const newState = await window.electronAPI.toggleGargoyle();
      setGargoyleEnabled(newState);
    }
  };

  useEffect(() => {
    window.electronAPI?.isMaximized().then(v => setMaximized(v)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      // Auto-focus and select the URL bar when a new tab (dashboard) is opened
      if (activeTab.url === 'hallow://dashboard' || activeTab.url === 'hallow-ghost://dashboard') {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 50);
      }
    }
  }, [activeTabId, activeTab?.url]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Do not allow clicking on the tutorial speech bubbles to inadvertently close the menus we are trying to teach the user about!
      if (e.target.closest('.tutorial-overlay')) return;

      if (poltergeistRef.current && !poltergeistRef.current.contains(e.target)) {
        if (!isRecordingRef.current) setShowPoltergeistMenu(false);
      }
      if (bansheeRef.current && !bansheeRef.current.contains(e.target)) {
        setShowBansheeMenu(false);
      }
      if (gargoyleRef.current && !gargoyleRef.current.contains(e.target)) {
        setShowGargoyleMenu(false);
      }
      if (downloadsRef.current && !downloadsRef.current.contains(e.target)) {
        setShowDownloadsMenu(false);
      }
    };

    const closeAllMenus = () => {
      if (!isRecordingRef.current) setShowPoltergeistMenu(false);
      setShowBansheeMenu(false);
      setShowGargoyleMenu(false);
      setShowDownloadsMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('webview-clicked', closeAllMenus);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('webview-clicked', closeAllMenus);
    };
  }, []);

  // Separate useEffect for tutorial actions that need access to latest tab state
  useEffect(() => {
    const handleTutorialAction = (e) => {
      const { action } = e.detail;
      
      if (action === 'open-poltergeist') {
        setShowBansheeMenu(false);
        setShowGargoyleMenu(false);
        setShowPoltergeistMenu(true);
      }
      if (action === 'open-banshee') {
        setShowPoltergeistMenu(false);
        setShowGargoyleMenu(false);
        setShowBansheeMenu(true);
      }
      if (action === 'open-gargoyle') {
        setShowPoltergeistMenu(false);
        setShowBansheeMenu(false);
        setShowGargoyleMenu(true);
      }
      if (action === 'open-sidebar') {
        setSidebarOpen(true);
      }
      if (action === 'close-menus') {
        if (!isRecordingRef.current) setShowPoltergeistMenu(false);
        setShowBansheeMenu(false);
        setShowGargoyleMenu(false);
        setShowDownloadsMenu(false);
        setSidebarOpen(false);
      }

      if (action === 'navigate-settings') {
        setSidebarOpen(false);
        if (activeTabId) navigate(activeTabId, 'hallow://settings');
      }
      
      if (action === 'navigate-dashboard') {
        setSidebarOpen(false);
        if (activeTabId) navigate(activeTabId, 'hallow://dashboard');
      }

      if (action === 'navigate-theme-lab') {
        if (activeTabId) navigate(activeTabId, 'hallow://theme-creator');
      }

      if (action === 'navigate-settings-toolbar') {
        if (activeTabId) navigate(activeTabId, 'hallow://settings');
        // Give it a tiny delay to mount before firing the tab switch
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('tutorial-action', { detail: { action: 'settings-tab-toolbar' } }));
        }, 50);
      }

      if (action === 'navigate-gargoyle') {
        setSidebarOpen(false);
        if (activeTabId) navigate(activeTabId, 'hallow://gargoyle');
      }

      if (action === 'simulate-poltergeist') {
        setShowPoltergeistMenu(true);
        if (activeTabId) {
          updateTab(activeTabId, {
            poltergeist: {
              ...activeTab?.poltergeist,
              isPlaying: true,
              macroEvents: [
                { type: 'mousemove', x: 200, y: 200, time: 0 },
                { type: 'mousemove', x: 400, y: 300, time: 600 },
                { type: 'click', x: 400, y: 300, time: 700 },
                { type: 'mousemove', x: 600, y: 200, time: 1300 },
                { type: 'click', x: 600, y: 200, time: 1400 },
                { type: 'mousemove', x: 200, y: 200, time: 2000 }
              ]
            }
          });
        }
      }

      if (action === 'stop-poltergeist') {
        if (activeTabId) {
          updateTab(activeTabId, {
            poltergeist: {
              ...activeTab?.poltergeist,
              isPlaying: false
            }
          });
        }
      }
    };

    window.addEventListener('tutorial-action', handleTutorialAction);
    return () => window.removeEventListener('tutorial-action', handleTutorialAction);
  }, [activeTabId, activeTab, updateTab, navigate, setSidebarOpen]);

  const handleGargoyleRightClick = (e) => {
    e.preventDefault();
    addTab('hallow://gargoyle');
    setShowGargoyleMenu(false);
  };

  const handleMinimize  = () => {
    console.log('Sending minimize signal');
    window.electronAPI?.minimizeWindow();
  };
  const handleMaximize  = () => {
    console.log('Sending maximize signal');
    window.electronAPI?.maximizeWindow();
    setMaximized(m => !m);
  };
  const handleClose     = () => {
    console.log('Sending close signal');
    if (window.electronAPI) window.electronAPI.closeWindow();
    // Fallback: standard browser window close
    window.close();
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw || !activeTab) return;
    navigate(activeTab.id, raw);
    inputRef.current?.blur();
  };

  return (
    <div className="browser-chrome">

      {updateAvailable && showUpdateBanner && (
        <div className="update-banner" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="update-banner-content">
            <span className="update-banner-text">A spooky new update (v{updateAvailable.version}) is available!</span>
            <button 
              onClick={() => navigate(activeTabId, 'hallow://settings#about')}
              className="update-banner-link"
            >
              Open Settings to Install
            </button>
          </div>
          <button onClick={() => setShowUpdateBanner(false)} className="update-banner-close" title="Dismiss">
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Tab Strip / Title Bar ── */}
      <div className="tabs-row">
        {/* Logo / Drag region left */}
        <div className="browser-logo">
          <svg className="browser-logo__ghost" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z"
              fill="color-mix(in srgb, var(--accent-primary) 12%, transparent)"
              stroke="color-mix(in srgb, var(--accent-primary) 60%, transparent)"
              strokeWidth="2"
            />
            <circle cx="30" cy="40" r="4.5" fill="color-mix(in srgb, var(--accent-primary) 85%, transparent)" />
            <circle cx="50" cy="40" r="4.5" fill="color-mix(in srgb, var(--accent-primary) 85%, transparent)" />
          </svg>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
            <div 
              className={`tabs-container ${frozenTabWidth ? 'is-closing' : ''} ${scrollState.left && scrollState.right ? 'overflowing-both' : scrollState.left ? 'overflowing-left' : scrollState.right ? 'overflowing-right' : ''}`}
              ref={tabsContainerRef}
              onMouseLeave={handleTabsMouseLeave}
              onScroll={updateScrollState}
              onWheel={(e) => {
                if (tabsContainerRef.current) {
                  tabsContainerRef.current.scrollLeft += e.deltaY;
                }
              }}
              style={frozenTabWidth ? { '--frozen-tab-width': `${frozenTabWidth}px` } : {}}
            >
              {tabs.map(tab => (
                <SortableTab
                  key={tab.id}
                  tab={tab}
                  activeTabId={activeTabId}
                  showTabIcons={showTabIcons}
                  setActiveTabId={setActiveTabId}
                  closeTab={handleTabCloseWrapper}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeDragTab ? (
              <SortableTab
                tab={activeDragTab}
                activeTabId={activeTabId}
                showTabIcons={showTabIcons}
                setActiveTabId={() => {}}
                closeTab={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <button
          className="new-tab-btn"
          style={{ flexShrink: 0, margin: '0 4px', height: '30px' }}
          onClick={() => addTab()}
          title="New Tab"
        >
          <Plus size={15} />
        </button>

        {/* Dedicated drag region that fills all empty space */}
        <div className="titlebar-drag-spacer"></div>

        {/* Window control buttons */}
        <div className="window-controls">
          <button className="window-btn window-btn--minimize" onClick={handleMinimize} title="Minimize" tabIndex={-1}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 5H10" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
          <button className="window-btn window-btn--maximize" onClick={handleMaximize} title={maximized ? 'Restore' : 'Maximize'} tabIndex={-1}>
            {maximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 3.5H7.5V9.5H1.5V3.5Z" stroke="currentColor" strokeWidth="1"/>
                <path d="M3.5 3.5V1.5H9.5V7.5H7.5" stroke="currentColor" strokeWidth="1"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 0.5H9.5V9.5H0.5V0.5Z" stroke="currentColor" strokeWidth="1"/>
              </svg>
            )}
          </button>
          <button className="window-btn window-btn--close" onClick={handleClose} title="Close" tabIndex={-1}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.5 0.5L9.5 9.5M9.5 0.5L0.5 9.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Address Bar ── */}
      <div className="address-bar-row">

        {/* Navigation */}
        <div className="nav-buttons">
          <button className="icon-btn nav-btn" title="Back" onClick={goBack}>
            <ChevronLeft size={17} />
          </button>
          <button className="icon-btn nav-btn" title="Forward" onClick={goForward}>
            <ChevronRight size={17} />
          </button>
          <button className="icon-btn nav-btn" title="Refresh" onClick={reload}>
            <RotateCw size={15} />
          </button>
          <button
            className="icon-btn nav-btn"
            title="Home"
            onClick={() => navigate(activeTab?.id, 'hallow://dashboard')}
          >
            <Home size={16} />
          </button>
        </div>

        {/* URL Bar */}
        <form className="address-bar-form" onSubmit={handleNavigate}>
          <div className="address-bar-wrapper">
            <Search size={13} className="search-icon-inner" />
            <input
              ref={inputRef}
              type="text"
              className="address-bar-input"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (audioSettings?.typing && e.key !== 'Enter') {
                  AudioEngine.playTypingSound();
                }
              }}
              onFocus={e => e.target.select()}
              placeholder="Search or enter address..."
            />
            {activeTab && !activeTab.url.startsWith('hallow://') && (
              <button
                type="button"
                className={`icon-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
                onClick={() => toggleBookmark(activeTab)}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                <Star size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </form>

        {/* Actions */}
        <div className="action-buttons">
          <button
            className="icon-btn action-btn hallownet-btn"
            title="HallowNet Home"
            onClick={() => addTab('hallow://dashboard')}
          >
            <Ghost size={17} />
          </button>
          <div className="chrome-divider" />
          
          <div className="downloads-wrapper" ref={downloadsRef}>
            <button
              className={`icon-btn action-btn downloads-btn ${downloads.some(d => d.state === 'progressing') ? 'active' : ''}`}
              title="Downloads"
              onClick={() => setShowDownloadsMenu(!showDownloadsMenu)}
            >
              <Download size={16} />
              {downloads.some(d => d.state === 'progressing') && <div className="downloads-indicator" />}
            </button>
            {showDownloadsMenu && (
              <div className="downloads-menu">
                <div className="downloads-header">
                  <div className="downloads-header-title">
                    <Download size={14} /> Downloads
                  </div>
                  {downloads.length > 0 && (
                    <button className="downloads-clear-btn" onClick={clearDownloads}>Clear</button>
                  )}
                </div>
                <div className="downloads-list">
                  {downloads.length === 0 ? (
                    <div className="downloads-empty">No recent downloads.</div>
                  ) : (
                    downloads.map(dl => {
                      const pct = dl.totalBytes ? Math.round((dl.receivedBytes / dl.totalBytes) * 100) : 0;
                      return (
                        <div key={dl.id} className="download-item">
                          <div className="dl-icon">
                            {dl.state === 'completed' ? <Folder size={18} /> : <Download size={18} />}
                          </div>
                          <div className="dl-info">
                            <div className="dl-name" title={dl.filename}>{dl.filename}</div>
                            <div className="dl-meta">
                              {dl.state === 'progressing' ? `${pct}% • ${(dl.receivedBytes / 1024 / 1024).toFixed(1)} MB` :
                               dl.state === 'paused' ? 'Paused' :
                               dl.state === 'interrupted' ? 'Interrupted' :
                               dl.state === 'cancelled' ? 'Cancelled' : 'Completed'}
                            </div>
                            {dl.state === 'progressing' && (
                              <div className="dl-progress-bar">
                                <div className="dl-progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                            )}
                          </div>
                          <div className="dl-actions">
                            {dl.state === 'progressing' && (
                              <button onClick={() => pauseDownload(dl.id)} title="Pause"><Pause size={14} /></button>
                            )}
                            {dl.state === 'paused' && (
                              <button onClick={() => resumeDownload(dl.id)} title="Resume"><Play size={14} /></button>
                            )}
                            {(dl.state === 'progressing' || dl.state === 'paused') && (
                              <button onClick={() => cancelDownload(dl.id)} title="Cancel"><X size={14} /></button>
                            )}
                            {dl.state === 'completed' && dl.savePath && (
                              <button onClick={() => showDownload(dl.savePath)} title="Show in folder"><Folder size={14} /></button>
                            )}
                            {['completed', 'cancelled', 'interrupted'].includes(dl.state) && (
                              <button onClick={() => removeDownload(dl.id)} title="Remove from list"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {toolbarSettings?.showExtensions !== false && (
            <button
              className="icon-btn action-btn"
              title="Extensions"
              onClick={() => addTab('hallow://extensions')}
            >
              <Puzzle size={16} />
            </button>
          )}
          {toolbarSettings?.showGargoyle !== false && (
            <div className="gargoyle-wrapper" ref={gargoyleRef}>
              <button
                className="icon-btn action-btn gargoyle-btn"
                title="Gargoyle Protection - Right-click for dashboard"
                onClick={() => setShowGargoyleMenu(!showGargoyleMenu)}
                onContextMenu={handleGargoyleRightClick}
              >
                <ShieldCheck size={16} />
              </button>
              {showGargoyleMenu && (
                <div className="gargoyle-menu">
                  <div className="gargoyle-header">
                    <ShieldCheck size={14} /> Gargoyle Protection
                  </div>
                  <div className="gargoyle-row">
                    <span>Master Protection</span>
                    <label className="runic-toggle">
                      <input type="checkbox" checked={gargoyleEnabled} onChange={toggleGargoyle} />
                      <span className="runic-track" />
                    </label>
                  </div>
                  <div 
                    style={{marginTop: '8px', textAlign: 'center', fontSize: '0.75rem', color: '#a090b0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', cursor: 'pointer'}} 
                    onClick={handleGargoyleRightClick}
                    className="gargoyle-open-dash"
                  >
                    Open Full Dashboard
                  </div>
                </div>
              )}
            </div>
          )}
          {toolbarSettings?.showPoltergeist !== false && (
            <div className="poltergeist-wrapper" ref={poltergeistRef}>
              <button
                className={`icon-btn action-btn poltergeist-btn ${activeTab?.poltergeist?.isRecording ? 'recording' : (activeTab?.poltergeist?.refreshInterval || activeTab?.poltergeist?.scrollSpeed || activeTab?.poltergeist?.isPlaying) ? 'playing' : ''}`}
                title="Poltergeist Automation"
                onClick={() => setShowPoltergeistMenu(!showPoltergeistMenu)}
              >
                <PoltergeistIcon size={16} />
              </button>
              {showPoltergeistMenu && activeTab && (
                <div className="poltergeist-menu">
                  <div className="poltergeist-header">
                    <PoltergeistIcon size={14} /> Poltergeist Mode
                  </div>
                  <div className="poltergeist-control-group">
                    <div className="control-label">Auto-Refresh</div>
                    <div className="segmented-control">
                      <button className={!activeTab.poltergeist?.refreshInterval ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, refreshInterval: null } })}>OFF</button>
                      <button className={activeTab.poltergeist?.refreshInterval === 5000 ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, refreshInterval: 5000 } })}>5s</button>
                      <button className={activeTab.poltergeist?.refreshInterval === 10000 ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, refreshInterval: 10000 } })}>10s</button>
                      <button className={activeTab.poltergeist?.refreshInterval === 30000 ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, refreshInterval: 30000 } })}>30s</button>
                    </div>
                  </div>
                  <div className="poltergeist-control-group">
                    <div className="control-label">Auto-Scroll</div>
                    <div className="segmented-control">
                      <button className={!activeTab.poltergeist?.scrollSpeed ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, scrollSpeed: null } })}>OFF</button>
                      <button className={activeTab.poltergeist?.scrollSpeed === 1 ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, scrollSpeed: 1 } })}>SLW</button>
                      <button className={activeTab.poltergeist?.scrollSpeed === 3 ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, scrollSpeed: 3 } })}>MED</button>
                      <button className={activeTab.poltergeist?.scrollSpeed === 6 ? 'active' : ''} onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, scrollSpeed: 6 } })}>FST</button>
                    </div>
                  </div>
                  <div className="poltergeist-header" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <PoltergeistIcon size={14} /> Macro Automaton
                  </div>
                  <div className="macro-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' }}>
                    {!activeTab.poltergeist?.isRecording ? (
                      <button 
                        className="macro-btn record-btn"
                        onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, isRecording: true, macroEvents: [] } })}
                      >
                        <div className="record-dot"></div> Record Haunt
                      </button>
                    ) : (
                      <button 
                        className="macro-btn stop-btn"
                        onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, isRecording: false } })}
                      >
                        <div className="stop-square"></div> Stop Recording
                      </button>
                    )}

                    {activeTab.poltergeist?.macroEvents?.length > 0 && !activeTab.poltergeist?.isRecording && (
                      <>
                        {!activeTab.poltergeist?.isPlaying ? (
                          <button 
                            className="macro-btn play-btn"
                            onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, isPlaying: true } })}
                          >
                            ▶ Play Haunt
                          </button>
                        ) : (
                          <button 
                            className="macro-btn stop-play-btn"
                            onClick={() => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, isPlaying: false } })}
                          >
                            ■ Stop Playback
                          </button>
                        )}
                        <div className="poltergeist-control-group loop-toggle" style={{ marginTop: '8px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="control-label" style={{ margin: 0 }}>Loop Playback</div>
                          <label className="runic-toggle">
                            <input 
                              type="checkbox" 
                              checked={activeTab.poltergeist?.loopMacro || false}
                              onChange={(e) => updateTab(activeTab.id, { poltergeist: { ...activeTab.poltergeist, loopMacro: e.target.checked } })}
                            />
                            <span className="runic-track" />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {toolbarSettings?.showBanshee !== false && (
            <div className="banshee-wrapper" ref={bansheeRef}>
              <button
                className={`icon-btn action-btn banshee-btn ${(activeTab?.banshee?.overdrive || 100) > 100 ? 'active' : ''}`}
                title="Banshee Audio Engine"
                onClick={() => setShowBansheeMenu(!showBansheeMenu)}
              >
                <Volume2 size={16} />
              </button>
              {showBansheeMenu && activeTab && (
                <div className="banshee-menu">
                  <div className="banshee-header">
                    <Volume2 size={14} /> Banshee Overdrive
                  </div>
                  <div className="banshee-amplifier">
                    <div className="banshee-digital-deck">
                      <div className="banshee-deck-label">MASTER GAIN</div>
                      <div className="banshee-deck-value">{activeTab.banshee?.overdrive || 100}<span>%</span></div>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="300"
                      step="10"
                      className="banshee-slider"
                      value={activeTab.banshee?.overdrive || 100}
                      onChange={(e) => updateTab(activeTab.id, {
                        banshee: { ...activeTab.banshee, overdrive: Number(e.target.value) }
                      })}
                    />
                    <div className="banshee-slider-marks">
                      <span>100</span>
                      <span>150</span>
                      <span>200</span>
                      <span>250</span>
                      <span>300</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {toolbarSettings?.showGhostMode !== false && (
            <button
              className={`icon-btn action-btn ghost-mode-btn ${ghostMode ? 'ghost-mode-btn--active' : ''}`}
              title={ghostMode ? 'Ghost Mode Active — Click to disable' : 'Enable Ghost Mode'}
              onClick={toggleGhostMode}
            >
              <EyeOff size={16} />
            </button>
          )}
          <button
            className="icon-btn action-btn sidebar-toggle-btn"
            title="Toggle Sidebar"
            onClick={() => setSidebarOpen(p => !p)}
          >
            <PanelRightClose size={16} />
          </button>
          <button
            className="icon-btn action-btn settings-btn"
            title="Settings"
            onClick={() => addTab('hallow://settings')}
          >
            <Settings size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
