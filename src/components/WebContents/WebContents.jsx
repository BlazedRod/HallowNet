import React, { useRef, useEffect, useState } from 'react';
import { useBrowser } from '../../context/BrowserContext';
import Dashboard from '../Dashboard/Dashboard';
import Settings from '../Settings/Settings';
import Gargoyle from '../Gargoyle/Gargoyle';
import ThemeCreator from '../ThemeCreator/ThemeCreator';
import './WebContents.css';

export default function WebContents() {
  const { tabs, activeTabId, updateTab, addHistory, updateHistoryTitle, trapdoorActive, addTab } = useBrowser();

  return (
    <div className="web-contents-container">
      {tabs.map(tab => {
        const isActive      = tab.id === activeTabId;
        const isDash        = tab.url.startsWith('hallow://dashboard') || tab.url.startsWith('hallow-ghost://dashboard') || tab.url.startsWith('hallow://newtab') || tab.url.startsWith('hallow-ghost://newtab');
        const isSettings    = tab.url.startsWith('hallow://settings');
        const isExtensions  = tab.url.startsWith('hallow://extensions');
        const isGargoyle   = tab.url.startsWith('hallow://gargoyle');
        const isThemeCreator = tab.url.startsWith('hallow://theme-creator');

        return (
          <div
            key={tab.id}
            className="web-content-pane"
            style={{ visibility: isActive ? 'visible' : 'hidden', zIndex: isActive ? 1 : 0 }}
          >
            {isDash ? (
              <Dashboard tabId={tab.id} isActive={isActive} />
            ) : isSettings ? (
              <Settings isActive={isActive} />
            ) : isThemeCreator ? (
              <ThemeCreator isActive={isActive} />
            ) : isExtensions ? (
              <ExtensionsManager isActive={isActive} />
            ) : isGargoyle ? (
              <Gargoyle isActive={isActive} />
            ) : (
                <WebViewWrapper
                  tab={tab}
                  isActive={isActive}
                  updateTab={updateTab}
                  addHistory={addHistory}
                  updateHistoryTitle={updateHistoryTitle}
                  trapdoorActive={trapdoorActive}
                  addTab={addTab}
                />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExtensionsManager() {
  const [extList, setExtList] = useState([]);
  const [error, setError] = useState(null);

  const handleLoadUnpacked = async () => {
    try {
      if (window.electronAPI && window.electronAPI.loadExtension) {
        const result = await window.electronAPI.loadExtension();
        if (result.success) {
          setExtList([...extList, { name: result.name, version: result.version }]);
          setError(null);
        } else if (result.error !== 'Canceled by user') {
          setError(result.error);
        }
      } else {
        setError('electronAPI not available. Did you restart the app?');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="extensions-page" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', background: '#04030a', color: '#e0d0e0', overflowY: 'auto' }}>
      <h1 style={{ fontFamily: 'Cinzel', fontSize: '2rem', color: '#ff5500', marginBottom: '10px' }}>Extensions Manager</h1>
      <p style={{ color: '#a090b0', marginBottom: '30px' }}>Load unpacked extensions into HallowNet.</p>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button 
          onClick={handleLoadUnpacked}
          style={{ background: 'rgba(255,85,0,0.1)', color: '#ff5500', border: '1px solid rgba(255,85,0,0.3)', padding: '10px 20px', fontFamily: 'Cinzel', cursor: 'pointer', borderRadius: '2px' }}
        >
          Load Unpacked Extension
        </button>
      </div>

      {error && (
        <div style={{ padding: '15px', background: 'rgba(255,50,50,0.1)', border: '1px solid #ff3333', color: '#ff3333', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {extList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(150,130,160,0.5)', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            No extensions loaded.
          </div>
        ) : (
          extList.map((ext, i) => (
            <div key={i} style={{ padding: '20px', background: 'rgba(10,6,18,0.7)', border: '1px solid rgba(120,40,200,0.15)', borderLeft: '3px solid #ff5500', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#ffaa66' }}>{ext.name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#9080a0' }}>Version {ext.version}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WebViewWrapper({ tab, isActive, updateTab, addHistory, updateHistoryTitle, trapdoorActive, addTab }) {
  const webviewRef = useRef(null);
  const recordingBufferRef = useRef([]);
  const { savePassword, setActiveWebview, GHOST_PARTITION } = useBrowser();
  const [passwordPrompt, setPasswordPrompt] = useState(null);
  const [initialUrl] = useState(tab.url);

  const stateRef = useRef({ isActive, isPlaying: tab.poltergeist?.isPlaying });
  useEffect(() => {
    stateRef.current = { isActive, isPlaying: tab.poltergeist?.isPlaying };
  }, [isActive, tab.poltergeist?.isPlaying]);

  const GHOST_PROTECTION_JS = `
    (function() {
      if (window.__ghostProtection) return;
      window.__ghostProtection = true;

      // Canvas fingerprint spoofing
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(...args) {
        const ctx = this.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i]     += Math.floor(Math.random() * 3) - 1;
            imageData.data[i + 1] += Math.floor(Math.random() * 3) - 1;
            imageData.data[i + 2] += Math.floor(Math.random() * 3) - 1;
          }
          ctx.putImageData(imageData, 0, 0);
        }
        return origToDataURL.apply(this, args);
      };

      // Audio fingerprint spoofing
      const origGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function(channel) {
        const data = origGetChannelData.call(this, channel);
        for (let i = 0; i < data.length; i += 100) {
          data[i] += (Math.random() - 0.5) * 0.0001;
        }
        return data;
      };

      // Spoof screen resolution slightly
      Object.defineProperty(screen, 'width',  { get: () => 1920 });
      Object.defineProperty(screen, 'height', { get: () => 1080 });

      // Block WebRTC IP leaks
      if (window.RTCPeerConnection) {
        window.RTCPeerConnection = function() { throw new Error('Blocked by Ghost Mode'); };
        window.webkitRTCPeerConnection = window.RTCPeerConnection;
      }
    })();
  `;

  // Register this webview as the active one whenever tab mounts or becomes visible
  useEffect(() => {
    if (isActive && webviewRef.current) {
      setActiveWebview(webviewRef.current);
    }
  }, [isActive, setActiveWebview]);

  const START_RECORDING_JS = `
    (function() {
      if (window.__hwnRecordingActive) return;
      window.__hwnRecordingActive = true;
      const startTime = Date.now();
      
      const recordEvent = (e) => {
        if (!window.__hwnRecordingActive) return;
        const evt = { type: e.type, time: Date.now() - startTime };
        if (e.type.includes('mouse') || e.type === 'click') {
          evt.x = e.clientX;
          evt.y = e.clientY;
        }
        if (e.type.includes('key')) {
          evt.key = e.key;
        }
        if (e.type === 'scroll') {
          evt.scrollX = window.scrollX;
          evt.scrollY = window.scrollY;
        }
        if (e.type === 'change' || e.type === 'input') {
          let path = [];
          let current = e.target;
          while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.nodeName.toLowerCase();
            if (current.id) {
              selector += '#' + current.id;
              path.unshift(selector);
              break;
            } else {
              let sib = current, nth = 1;
              while (sib = sib.previousElementSibling) nth++;
              selector += ':nth-child(' + nth + ')';
              path.unshift(selector);
              current = current.parentNode;
            }
          }
          evt.selector = path.join(' > ');
          evt.value = e.target.value;
        }
        console.log('HWN_MACRO_RECORD:' + JSON.stringify(evt));
      };

      ['mousemove', 'mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'scroll', 'change', 'input'].forEach(type => {
        document.addEventListener(type, recordEvent, { passive: true, capture: true });
      });

      window.__hwnStopRecording = () => {
        window.__hwnRecordingActive = false;
        ['mousemove', 'mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'scroll', 'change', 'input'].forEach(type => {
          document.removeEventListener(type, recordEvent, { capture: true });
        });
      };
    })();
  `;

  const getPlaybackInjection = (eventsJson, loop) => `
    (function() {
      if (window.__hwnPlaybackActive) return;
      window.__hwnPlaybackActive = true;
      
      const events = ${eventsJson};
      if (!events || events.length === 0) return;

      let cursor = document.getElementById('hwn-ghost-cursor');
      if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'hwn-ghost-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '32px';
        cursor.style.height = '32px';
        cursor.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'%2300ff66\\'%3E%3Cpath d=\\'M12 2C6.48 2 2 6.48 2 12v9l3-3 2 2 2-2 2 2 2-2 2 2 3 3v-9c0-5.52-4.48-10-10-10zm-2 9c-.83 0-1.5-.67-1.5-1.5S9.17 8 10 8s1.5.67 1.5 1.5S10.83 11 10 11zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 8 14 8s1.5.67 1.5 1.5S14.83 11 14 11z\\'/%3E%3C/svg%3E")';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '9999999';
        cursor.style.transition = 'top 0.1s linear, left 0.1s linear';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.filter = 'drop-shadow(0 0 8px rgba(0,255,102,0.8))';
        document.body.appendChild(cursor);
      }

      let timers = [];
      
      // Prevent native OS dropdowns from opening during playback, as they steal mouse focus and freeze automation!
      const blockNativeSelects = (e) => {
        if (window.__hwnPlaybackActive && e.target.tagName === 'SELECT') e.preventDefault();
      };
      document.addEventListener('mousedown', blockNativeSelects, { capture: true, passive: false });

      const play = () => {
        let maxTime = 0;
        events.forEach(evt => {
          if (evt.time > maxTime) maxTime = evt.time;
          let t = setTimeout(() => {
            if (!window.__hwnPlaybackActive) return;
            if (evt.type.includes('mouse') || evt.type === 'click') {
              if (evt.type === 'mousemove') {
                cursor.style.left = evt.x + 'px';
                cursor.style.top = evt.y + 'px';
              }
              if (evt.type === 'click') {
                const ripple = document.createElement('div');
                ripple.style.position = 'fixed';
                ripple.style.left = evt.x + 'px';
                ripple.style.top = evt.y + 'px';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.borderRadius = '50%';
                ripple.style.border = '2px solid #00ff66';
                ripple.style.zIndex = '9999998';
                ripple.style.pointerEvents = 'none';
                ripple.style.transition = 'all 0.3s ease-out';
                document.body.appendChild(ripple);
                setTimeout(() => { ripple.style.transform = 'translate(-50%, -50%) scale(2)'; ripple.style.opacity = '0'; }, 10);
                setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 300);
              } else {
                console.log('HWN_MACRO_PLAY:' + JSON.stringify(evt));
              }
            } else if (evt.type === 'keydown' || evt.type === 'keyup') {
              const el = document.activeElement || document.body;
              el.dispatchEvent(new KeyboardEvent(evt.type, { key: evt.key, bubbles: true }));
            } else if (evt.type === 'scroll') {
              window.scrollTo(evt.scrollX, evt.scrollY);
            } else if (evt.type === 'change' || evt.type === 'input') {
              try {
                const el = document.querySelector(evt.selector);
                if (el) {
                  el.value = evt.value;
                  el.dispatchEvent(new Event(evt.type, { bubbles: true }));
                }
              } catch (err) {}
            }
          }, evt.time);
          timers.push(t);
        });

        if (${loop}) {
          let t = setTimeout(() => {
            if (window.__hwnPlaybackActive) play();
          }, maxTime + 1000);
          timers.push(t);
        }
      };

      play();

      window.__hwnStopPlayback = () => {
        window.__hwnPlaybackActive = false;
        timers.forEach(t => clearTimeout(t));
        if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
        document.removeEventListener('mousedown', blockNativeSelects, { capture: true });
      };
    })();
  `;

  const getBansheeInjection = (multiplier) => `
    (function() {
      if (!window.__bansheeCtx) {
        window.__bansheeCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (window.__bansheeCtx.state === 'suspended') {
        window.__bansheeCtx.resume();
      }
      document.querySelectorAll('audio, video').forEach(el => {
        if (!el._bansheeHooked) {
          el._bansheeHooked = true;
          try {
            const source = window.__bansheeCtx.createMediaElementSource(el);
            const gainNode = window.__bansheeCtx.createGain();
            source.connect(gainNode);
            gainNode.connect(window.__bansheeCtx.destination);
            el._bansheeGainNode = gainNode;
          } catch(e) {}
        }
        if (el._bansheeGainNode) {
          el._bansheeGainNode.gain.value = ${multiplier};
        }
      });
    })();
  `;

  const YOUTUBE_ADBLOCK_JS = `
    (function() {
      if (window.__gargoyleYT) return;
      window.__gargoyleYT = true;

      // Auto-click "Skip Ad" buttons as soon as they appear
      const skipObserver = new MutationObserver(() => {
        const skipBtn = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, [class*="skip-ad"]');
        if (skipBtn) skipBtn.click();

        // Hide ad overlays and banners
        const adSelectors = [
          '.ytp-ad-overlay-container',
          '.ytp-ad-text-overlay',
          '.ytp-ad-player-overlay',
          '#masthead-ad',
          '.ytd-banner-promo-renderer',
          'ytd-statement-banner-renderer',
          'ytd-ad-slot-renderer',
          '#player-ads',
          '.video-ads'
        ];
        adSelectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            el.style.display = 'none';
          });
        });

        // Note: Fast-forwarding the video via currentTime has been permanently removed 
        // because YouTube's SPA DOM-recycling constantly causes false positives during 
        // playlist transitions, leading to catastrophic infinite-skip loops.
        // We now rely entirely on the native skip button auto-clicker and CSS hiding.

      skipObserver.observe(document.body, { childList: true, subtree: true });
    })();
  `;

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const SCROLLBAR_CSS = `
      ::-webkit-scrollbar { width: 7px !important; height: 7px !important; }
      ::-webkit-scrollbar-track { background: #07050c !important; }
      ::-webkit-scrollbar-thumb {
        background: rgba(200, 60, 0, 0.5) !important;
        border-radius: 0 !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 85, 0, 0.75) !important;
      }
      ::-webkit-scrollbar-corner { background: #07050c !important; }
    `;

    const onDomReady = () => {
      updateTab(tab.id, { loading: false });
      wv.insertCSS(SCROLLBAR_CSS).catch(() => {});
      // Inject YouTube-specific ad blocker if on YouTube
      const src = wv.getURL ? wv.getURL() : tab.url;
      if (src && src.includes('youtube.com')) {
        wv.executeJavaScript(YOUTUBE_ADBLOCK_JS).catch(() => {});
      }
      // Inject fingerprint protection for Ghost Mode tabs
      if (tab.isGhost) {
        wv.executeJavaScript(GHOST_PROTECTION_JS).catch(() => {});
      }
      
      if (tab.poltergeist?.scrollSpeed) {
        wv.executeJavaScript(`
          if (window.__hwnPoltergeistScroll) clearInterval(window.__hwnPoltergeistScroll);
          window.__hwnPoltergeistScroll = setInterval(() => {
            window.scrollBy(0, ${tab.poltergeist.scrollSpeed});
            if (document.scrollingElement) {
              document.scrollingElement.scrollTop += ${tab.poltergeist.scrollSpeed};
            }
          }, 30);
        `).catch(() => {});
      }

      // Re-apply Banshee overdrive if active
      if (tab.banshee?.overdrive && tab.banshee.overdrive !== 100) {
        wv.executeJavaScript(getBansheeInjection(tab.banshee.overdrive / 100)).catch(() => {});
      }

      // Re-apply Macro Record/Playback if cross-navigating
      if (tab.poltergeist?.isRecording) {
        wv.executeJavaScript(START_RECORDING_JS).catch(() => {});
      } else if (tab.poltergeist?.isPlaying && tab.poltergeist?.macroEvents?.length > 0) {
        const eventsJson = JSON.stringify(tab.poltergeist.macroEvents);
        const loop = !!tab.poltergeist.loopMacro;
        wv.executeJavaScript(getPlaybackInjection(eventsJson, loop)).catch(() => {});
      }
    };

    const onTitle    = e  => {
      updateTab(tab.id, { title: e.title });
      updateHistoryTitle(webviewRef.current?.getURL(), e.title, tab.isGhost);
    };
    const onFavicon  = e  => updateTab(tab.id, { favicon: e.favicons?.[0] ?? '' });
    const onNavStart = e  => { if (e.isMainFrame && !e.isSameDocument) updateTab(tab.id, { loading: true }); };
    const onNavStop  = () => updateTab(tab.id, { loading: false });
    const onNavigate = e  => {
      updateTab(tab.id, { url: e.url });
      
      // The page's actual <title> tag hasn't loaded yet. Do NOT use the old tab.title from the closure!
      // Always default to the URL until onTitle updates it retroactively.
      addHistory(e.url, e.url, tab.isGhost);
    };

    const onNewWindow = (e) => {
      e.preventDefault();
      // Natively route target="_blank" popups into proper HallowNet tabs
      if (e.url) addTab(e.url);
    };

    const onWillNavigate = (e) => {
      // The Gargoyle Engine is now robust enough (~80,000 domains) to handle malicious redirects.
      // We no longer blindly block cross-domain navigations here so legitimate redirects (like job portals) work.
    };

    const onIpcMessage = (e) => {
      if (e.channel === 'save-password-prompt') {
        setPasswordPrompt(e.args[0]);
      } else if (e.channel === 'webview-click') {
        const { isActive: curActive, isPlaying: curPlaying } = stateRef.current;
        if (curActive && !curPlaying) {
          window.dispatchEvent(new Event('webview-clicked'));
        }
      } else if (e.channel === 'macro-record') {
        const eventData = e.args[0];
        recordingBufferRef.current.push(eventData);
      } else if (e.channel === 'macro-play') {
        const evt = e.args[0];
        if (evt.type.includes('mouse')) {
          let type = 'mouseMove';
          if (evt.type === 'mousedown') type = 'mouseDown';
          if (evt.type === 'mouseup') type = 'mouseUp';
          wv.sendInputEvent({
            type,
            x: evt.x,
            y: evt.y,
            button: 'left',
            clickCount: 1
          });
        }
      }
    };

    const onConsoleMessage = (e) => {
      try {
        if (e.message.startsWith('HWN_MACRO_RECORD:')) {
          const eventData = JSON.parse(e.message.substring(17));
          recordingBufferRef.current.push(eventData);
        } else if (e.message.startsWith('HWN_MACRO_PLAY:')) {
          const evt = JSON.parse(e.message.substring(15));
          if (evt.type.includes('mouse')) {
            let type = 'mouseMove';
            if (evt.type === 'mousedown') type = 'mouseDown';
            if (evt.type === 'mouseup') type = 'mouseUp';
            wv.sendInputEvent({
              type,
              x: evt.x,
              y: evt.y,
              button: 'left',
              clickCount: 1
            });
          }
        }
      } catch (err) {}
    };

    wv.addEventListener('dom-ready',             onDomReady);
    wv.addEventListener('page-title-updated',    onTitle);
    wv.addEventListener('page-favicon-updated',  onFavicon);
    wv.addEventListener('did-start-navigation',  onNavStart);
    wv.addEventListener('did-stop-loading',      onNavStop);
    wv.addEventListener('did-fail-load',         onNavStop);
    wv.addEventListener('did-navigate',          onNavigate);
    wv.addEventListener('did-navigate-in-page',  onNavigate);
    wv.addEventListener('will-navigate',         onWillNavigate);
    wv.addEventListener('new-window',            onNewWindow);
    wv.addEventListener('ipc-message',           onIpcMessage);
    wv.addEventListener('console-message',       onConsoleMessage);

    return () => {
      wv.removeEventListener('dom-ready',            onDomReady);
      wv.removeEventListener('page-title-updated',   onTitle);
      wv.removeEventListener('page-favicon-updated', onFavicon);
      wv.removeEventListener('did-start-navigation', onNavStart);
      wv.removeEventListener('did-stop-loading',     onNavStop);
      wv.removeEventListener('did-fail-load',        onNavStop);
      wv.removeEventListener('did-navigate',          onNavigate);
      wv.removeEventListener('did-navigate-in-page',  onNavigate);
      wv.removeEventListener('will-navigate',         onWillNavigate);
      wv.removeEventListener('new-window',            onNewWindow);
      wv.removeEventListener('ipc-message',           onIpcMessage);
      wv.removeEventListener('console-message',       onConsoleMessage);
    };
  }, [tab.id, updateTab, addHistory, updateHistoryTitle, tab.isGhost, tab.poltergeist?.scrollSpeed]);

  // ── Handle External URL Changes (Typed in URL bar) ──
  useEffect(() => {
    const wv = webviewRef.current;
    if (wv && tab.url) {
      try {
        const currentUrl = wv.getURL();
        if (currentUrl && currentUrl !== tab.url) {
          wv.loadURL(tab.url);
        }
      } catch (e) {}
    }
  }, [tab.url]);

  // ── Poltergeist Auto-Refresh ──
  useEffect(() => {
    if (!tab.poltergeist?.refreshInterval) return;
    const interval = setInterval(() => {
      try {
        if (webviewRef.current?.reload) {
          webviewRef.current.reload();
        } else if (webviewRef.current) {
          webviewRef.current.src = webviewRef.current.src;
        }
      } catch (err) {}
    }, tab.poltergeist.refreshInterval);
    return () => clearInterval(interval);
  }, [tab.poltergeist?.refreshInterval]);

  // ── Banshee Audio Engine Sync ──
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    try {
      const multiplier = (tab.banshee?.overdrive || 100) / 100;
      wv.executeJavaScript(getBansheeInjection(multiplier)).catch(() => {});
    } catch (err) {}
  }, [tab.banshee?.overdrive]);

  // ── Macro Automaton Record Sync ──
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    try {
      if (tab.poltergeist?.isRecording) {
        recordingBufferRef.current = [];
        wv.executeJavaScript(START_RECORDING_JS).catch(() => {});
      } else {
        wv.executeJavaScript(`if (window.__hwnStopRecording) window.__hwnStopRecording();`).catch(() => {});
        if (recordingBufferRef.current.length > 0) {
          const eventsToSave = [...recordingBufferRef.current];
          updateTab(tab.id, (t) => ({
            poltergeist: {
              ...t.poltergeist,
              macroEvents: eventsToSave
            }
          }));
          recordingBufferRef.current = [];
        }
      }
    } catch (err) {}
  }, [tab.poltergeist?.isRecording]);

  // ── Macro Automaton Playback Sync ──
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    try {
      if (tab.poltergeist?.isPlaying && tab.poltergeist?.macroEvents?.length > 0) {
        const eventsJson = JSON.stringify(tab.poltergeist.macroEvents);
        const loop = !!tab.poltergeist.loopMacro;
        wv.executeJavaScript(getPlaybackInjection(eventsJson, loop)).catch(() => {});
      } else {
        wv.executeJavaScript(`if (window.__hwnStopPlayback) window.__hwnStopPlayback();`).catch(() => {});
      }
    } catch (err) {}
  }, [tab.poltergeist?.isPlaying, tab.poltergeist?.loopMacro]); // Intentionally omitting macroEvents to prevent IPC execution spam

  // ── Poltergeist Auto-Scroll (Dynamic Toggle) ──
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    try {
      if (tab.poltergeist?.scrollSpeed) {
        wv.executeJavaScript(`
          if (window.__hwnPoltergeistScroll) clearInterval(window.__hwnPoltergeistScroll);
          window.__hwnPoltergeistScroll = setInterval(() => {
            window.scrollBy(0, ${tab.poltergeist.scrollSpeed});
            if (document.scrollingElement) {
              document.scrollingElement.scrollTop += ${tab.poltergeist.scrollSpeed};
            }
          }, 30);
        `).catch(() => {});
      } else {
        wv.executeJavaScript(`
          if (window.__hwnPoltergeistScroll) {
            clearInterval(window.__hwnPoltergeistScroll);
            delete window.__hwnPoltergeistScroll;
          }
        `).catch(() => {});
      }
    } catch (err) {
      // Ignore sync errors if webview isn't ready yet
    }
  }, [tab.poltergeist?.scrollSpeed]);

  const handleSavePassword = () => {
    if (passwordPrompt) {
      savePassword({
        site: passwordPrompt.site,
        username: passwordPrompt.username,
        password: passwordPrompt.password
      });
      setPasswordPrompt(null);
    }
  };

  const getPreloadPath = () => {
    try {
      if (window.electronAPI && window.electronAPI.preloadPath) {
        return window.electronAPI.preloadPath;
      }
    } catch (e) {}
    return undefined;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Ghost Mode Banner */}
      {tab.isGhost && (
        <div className="ghost-mode-banner">
          <svg width="13" height="13" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px', flexShrink: 0}}>
            <path d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z" fill="rgba(150,80,255,0.3)" stroke="#a855f7" strokeWidth="3"/>
            <circle cx="30" cy="38" r="5" fill="#a855f7"/><circle cx="50" cy="38" r="5" fill="#a855f7"/>
          </svg>
          Ghost Mode - No history, cookies, or fingerprints are recorded
        </div>
      )}
        <webview
          ref={webviewRef}
          src={initialUrl}
          {...(getPreloadPath() ? { preload: getPreloadPath() } : {})}
          {...(tab.isGhost ? { partition: GHOST_PARTITION } : {})}
          className="electron-webview"
          style={tab.isGhost ? { marginTop: '0' } : {}}
          allowpopups="true"
          webpreferences="nodeIntegrationInSubFrames=yes"
          audioMuted={trapdoorActive}
        />

      {/* Loading Overlay */}
      {tab.loading && (
        <div className="webview-loading-overlay">
          <div className="loading-pulse-ring"></div>
          <svg width="40" height="40" viewBox="0 0 80 96" fill="none" className="loading-ghost" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z" fill="var(--accent-primary)" opacity="0.8" />
            <circle cx="30" cy="38" r="5" fill="#fff" />
            <circle cx="50" cy="38" r="5" fill="#fff" />
          </svg>
        </div>
      )}
      
      {/* Auto-Save Password Prompt Overlay */}
      {passwordPrompt && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px', width: '320px',
          background: 'rgba(10, 6, 18, 0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 85, 0, 0.4)', borderRadius: '4px',
          padding: '16px', color: '#e0d0e0', boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
          zIndex: 1000, fontFamily: 'var(--font-family)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffaa66', fontFamily: 'Cinzel', fontSize: '1rem', letterSpacing: '0.05em' }}>
            Save Password?
          </h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#a090b0', lineHeight: 1.4 }}>
            Would you like to save the password for <strong>{passwordPrompt.site}</strong> to your HallowNet Vault?
          </p>
          <div style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '2px', marginBottom: '15px' }}>
            <div><span style={{color: '#605070'}}>User:</span> {passwordPrompt.username || 'N/A'}</div>
            <div><span style={{color: '#605070'}}>Pass:</span> ••••••••</div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setPasswordPrompt(null)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#a090b0', padding: '6px 12px', cursor: 'pointer', borderRadius: '2px', fontSize: '0.8rem' }}
            >
              Never
            </button>
            <button 
              onClick={handleSavePassword}
              style={{ background: 'rgba(255,85,0,0.15)', border: '1px solid rgba(255,85,0,0.5)', color: '#ffaa66', padding: '6px 12px', cursor: 'pointer', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              Save Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
