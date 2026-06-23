const { ipcRenderer } = require('electron');

// ─── Gargoyle Stealth Defuser ────────────────────────────────────
// Injected into every page's Main World to defeat anti-adblock scripts.
// Runs before the page executes its own scripts.
// Extreme Domains list MUST match the one in gargoyle.cjs
const EXTREME_DOMAINS = [
  'kisscartoon.sh'
];

const isExtremeDomain = () => {
  return EXTREME_DOMAINS.some(d => window.location.hostname.includes(d));
};

(function injectGargoyleStealth() {
  if (!isExtremeDomain()) return; // Do not inject extreme defusers on normal sites!

  const defuserCode = `
    (function() {
      // 0. Destroy Closed Shadow DOM Encryption!
      const originalAttachShadow = Element.prototype.attachShadow;
      Element.prototype.attachShadow = function(options) {
        // Force all shadow roots to be 'open' so Gargoyle's executioner can pierce them!
        return originalAttachShadow.call(this, { ...options, mode: 'open' });
      };

      // 1. Defuse global detection variables
      const mockObj = { value: false, writable: true, configurable: true };
      Object.defineProperty(window, 'adblock', mockObj);
      Object.defineProperty(window, '_adblock', mockObj);
      Object.defineProperty(window, 'isAdBlockActive', mockObj);
      Object.defineProperty(window, 'adblocker', mockObj);
      
      // 2. Mock Google Ads & Analytics (often checked for existence)
      window.adsbygoogle = { push: function() {}, loaded: true };
      window.google_ad_client = true;
      window.google_ad_status = 1;
      window.ga = function() {};
      window.ga.q = [];
      
      // 3. Mock aggressive popunder APIs
      window.popunder = function() {};
      window.Popunder = function() {};
      
      // 4. Defuse bait-element detection (Bypass offsetHeight checks on ad banners)
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName, options) {
        const el = originalCreateElement.call(document, tagName, options);
        if (tagName.toLowerCase() === 'div') {
          const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
          const originalClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
          
          Object.defineProperty(el, 'offsetHeight', {
            get: function() {
              const cls = typeof this.className === 'string' ? this.className.toLowerCase() : '';
              if (cls.includes('ad') || cls.includes('banner') || cls.includes('sponsor')) return 50;
              return originalOffsetHeight ? originalOffsetHeight.get.call(this) : 0;
            },
            configurable: true
          });
          
          Object.defineProperty(el, 'clientHeight', {
            get: function() {
              const cls = typeof this.className === 'string' ? this.className.toLowerCase() : '';
              if (cls.includes('ad') || cls.includes('banner') || cls.includes('sponsor')) return 50;
              return originalClientHeight ? originalClientHeight.get.call(this) : 0;
            },
            configurable: true
          });
        }
        return el;
      };
      
      // 5. Ghost Proxy: Intercept Fetch & XHR to silently kill ad scripts without triggering 'onerror'
      const isAdUrl = (url) => {
        if (!url) return false;
        const s = url.toLowerCase();
        return s.includes('/ads.') || s.includes('popunder') || s.includes('ad_type') || s.includes('detect') || s.includes('adblock');
      };

      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        if (isAdUrl(url)) {
          return new Response('/* Gargoyle Ghost Proxy */', { status: 200, statusText: 'OK' });
        }
        return originalFetch.apply(this, args);
      };

      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        if (isAdUrl(url)) this._isAd = true;
        return originalXHROpen.call(this, method, url, ...rest);
      };
      
      const originalXHRSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function(body) {
        if (this._isAd) {
          Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
          Object.defineProperty(this, 'status', { value: 200, configurable: true });
          Object.defineProperty(this, 'responseText', { value: '/* Gargoyle Ghost Proxy */', configurable: true });
          Object.defineProperty(this, 'response', { value: '/* Gargoyle Ghost Proxy */', configurable: true });
          if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
          if (typeof this.onload === 'function') this.onload();
          return;
        }
        return originalXHRSend.call(this, body);
      };

      // 6. The Shadow DOM Interceptor: Block asynchronous script & iframe injection
      const handleNodeInjection = (child) => {
        if (child && child.tagName) {
          const tag = child.tagName.toLowerCase();
          if ((tag === 'script' || tag === 'iframe') && child.src && isAdUrl(child.src)) {
             setTimeout(() => { 
               if (typeof child.onload === 'function') child.onload(); 
               if (typeof child.onreadystatechange === 'function') child.onreadystatechange();
             }, 10);
             return true; // Pretend it was injected
          }
        }
        return false;
      };

      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function(child) {
        if (handleNodeInjection(child)) return child;
        return originalAppendChild.call(this, child);
      };

      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function(child, refNode) {
        if (handleNodeInjection(child)) return child;
        return originalInsertBefore.call(this, child, refNode);
      };

      // 7. Nuclear Option: Kill Popunders, Notifications, and ServiceWorkers
      window.open = function() { console.log('[Gargoyle] Blocked popunder!'); return null; };
      if (window.Notification) {
         window.Notification.requestPermission = () => Promise.resolve('denied');
         try { Object.defineProperty(window, 'Notification', { value: function() { return {}; }, writable: false }); } catch(e){}
      }
      if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (let reg of regs) reg.unregister();
        }).catch(()=>{});
      }

    })();
  `;
  
  // Use webFrame to execute in the Main World, completely bypassing CSP!
  const { webFrame } = require('electron');
  webFrame.executeJavaScript(defuserCode).catch(e => console.error('[Gargoyle] webFrame execution failed:', e));
})();

// ─── Native Isolated-World DOM Executioner ──────────────────────────
// Runs outside the site's CSP restrictions, making it immune to blocking.
(function initIsolatedExecutioner() {
  if (!isExtremeDomain()) return; // Do not run DOM Executioner on normal sites!

  const css = `
    [id*="adblock" i], [class*="adblock" i],
    [id*="detect" i], [class*="detect" i],
    iframe[src*="/ads/" i], iframe[src*="?ad=" i], iframe[src*="-ad-" i] {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  
  // Inject CSS safely
  const injectCSS = () => {
    if (!document.documentElement) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.documentElement.appendChild(style);
  };
  
  if (document.documentElement) injectCSS();
  else document.addEventListener('DOMContentLoaded', injectCSS);

  const nukeModals = () => {
    try {
      if (!document.body) return;
      
      const getAllElements = (root) => {
        // Omni-selector: scan EVERYTHING except core document tags
        const elements = Array.from(root.querySelectorAll('*')).filter(el => {
           const tag = el.tagName ? el.tagName.toLowerCase() : '';
           return tag && !['html', 'head', 'body', 'script', 'style', 'link', 'meta', 'noscript'].includes(tag);
        });
        
        for (const el of elements) {
          // Pierce Shadow DOM boundaries
          if (el.shadowRoot) {
             try { elements.push(...getAllElements(el.shadowRoot)); } catch(e){}
          }
          // Pierce Same-Origin Iframe boundaries
          if (el.tagName && el.tagName.toLowerCase() === 'iframe') {
             try {
               if (el.contentDocument) elements.push(...getAllElements(el.contentDocument));
             } catch(e) {}
          }
        }
        return elements;
      };

      const elements = getAllElements(document);
      let nuked = false;
      for (const el of elements) {
        // Skip if it contains massive text (it's likely a main content wrapper)
        if (!el.textContent || el.textContent.length > 500) continue;
        
        // Strip spaces and special characters to defeat obfuscation
        const text = el.textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
          text.includes('disableyouradblock') || 
          text.includes('whitelistkisscartoon') || 
          text.includes('turnoffyouradblocker') ||
          text.includes('adblockdetected') ||
          text.includes('hentaigame') ||
          text.includes('hentai') ||
          text.includes('playthebest') ||
          text.includes('hotsingles') ||
          text.includes('playforfree') ||
          text.includes('casino') ||
          text.includes('crypto') ||
          text.includes('operabrowser')
        ) {
          let target = el;
          let current = el;
          while (current && current !== document.body && current !== document.documentElement) {
            const style = window.getComputedStyle(current);
            if (style.position === 'absolute' || style.position === 'fixed' || parseInt(style.zIndex, 10) > 10) {
              target = current; // Found the overlay container
              break;
            }
            // Climb up the DOM. If we hit the top of an iframe, escape out to the parent document!
            let next = current.parentElement;
            if (!next) {
               if (current.getRootNode && current.getRootNode().host) {
                 next = current.getRootNode().host; // Escape Shadow DOM
               } else if (current.ownerDocument && current.ownerDocument.defaultView && current.ownerDocument.defaultView.frameElement) {
                 next = current.ownerDocument.defaultView.frameElement; // Escape Iframe!
               }
            }
            current = next;
          }
          // Instead of target.remove() which alerts MutationObservers, permanently blind it!
          target.style.setProperty('display', 'none', 'important');
          target.style.setProperty('opacity', '0', 'important');
          target.style.setProperty('pointer-events', 'none', 'important');
          target.style.setProperty('width', '0px', 'important');
          target.style.setProperty('height', '0px', 'important');
          target.style.setProperty('position', 'absolute', 'important');
          target.style.setProperty('z-index', '-99999', 'important');
          nuked = true;
        }
      }
      
      // Force unlock scrolling if the site locked it
      if (nuked && document.body) {
        document.body.style.setProperty('overflow', 'auto', 'important');
        document.documentElement.style.setProperty('overflow', 'auto', 'important');
      }
    } catch(e) {}
  };

  // Run aggressively but debounced to prevent CPU lockups during heavy DOM mutations
  let nukeTimeout = null;
  const debouncedNuke = () => {
    if (nukeTimeout) return;
    nukeTimeout = setTimeout(() => {
      nukeModals();
      nukeTimeout = null;
    }, 250); // 4 sweeps per second is fast enough to blind ads without crashing performance
  };

  const observer = new MutationObserver(debouncedNuke);
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    });
  }
  
  // Failsafe backup loop (runs less frequently now)
  setInterval(debouncedNuke, 2000);
})();



// ─── YouTube Ad Killer ───────────────────────────────────────────
// Injected into every page. Only activates on YouTube.
(function youtubeGargoyle() {
  if (!location.href.includes('youtube.com')) return;
  if (window.__gargoyleActive) return;
  window.__gargoyleActive = true;

  const CSS_TO_HIDE = `
    .ad-showing .ytp-ad-player-overlay,
    .ytp-ad-overlay-container,
    .ytp-ad-text-overlay,
    .ytp-ad-image-overlay,
    ytd-action-companion-ad-renderer,
    ytd-display-ad-renderer,
    ytd-promoted-video-renderer,
    ytd-rich-item-renderer[is-shelf-item],
    ytd-ad-slot-renderer,
    ytd-banner-promo-renderer,
    ytd-statement-banner-renderer,
    ytd-in-feed-ad-layout-renderer,
    #masthead-ad,
    .ytd-mealbar-promo-renderer,
    tp-yt-iron-overlay-backdrop,
    .ytp-ce-element,
    #player-ads { display: none !important; }
  `;

  // Inject CSS immediately
  const style = document.createElement('style');
  style.textContent = CSS_TO_HIDE;
  (document.head || document.documentElement).appendChild(style);

  function killAd() {
    const video = document.querySelector('video');

    // Fast-forward video ad by setting currentTime to end
    if (video && !video.paused) {
      const adShowing = document.querySelector('.ad-showing');
      if (adShowing) {
        // Mute and seek to end to force ad completion
        video.muted = true;
        if (video.duration && isFinite(video.duration)) {
          video.currentTime = video.duration - 0.1;
        }
      } else {
        // Restore volume once ad is gone
        if (video.muted && !localStorage.getItem('hwn_muted')) {
          video.muted = false;
        }
      }
    }

    // Click skip button if available
    const skipSelectors = [
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern'
    ];
    for (const sel of skipSelectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        break;
      }
    }
  }

  // Run every 300ms — fast enough to catch ads before they play audio
  setInterval(killAd, 300);

  // Also run on every DOM mutation for immediate response
  new MutationObserver(killAd).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

// ─── Banshee Audio Engine ──────────────────────────────────────────
// Banshee logic is now directly injected via WebContents.jsx to ensure Main World context and bypass CSP.

// ─── Webview Click Interceptor ───────────────────────────────────
document.addEventListener('mousedown', () => {
  try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.sendToHost('webview-click');
  } catch (e) {}
});

// ─── Macro Automaton Interceptor ─────────────────────────────────
window.addEventListener('message', (e) => {
  if (!e.data) return;
  try {
    if (e.data.type === 'hwn-macro-record') {
      const { ipcRenderer } = require('electron');
      ipcRenderer.sendToHost('macro-record', e.data.detail);
    } else if (e.data.type === 'hwn-macro-play') {
      const { ipcRenderer } = require('electron');
      ipcRenderer.sendToHost('macro-play', e.data.detail);
    }
  } catch (err) {}
});

// ─── Password Form Interceptor ───────────────────────────────────
document.addEventListener('submit', (e) => {
  const form = e.target;
  const passwordInput = form.querySelector('input[type="password"]');

  if (passwordInput) {
    const password = passwordInput.value;
    const inputs = Array.from(form.querySelectorAll('input'));
    const pwdIndex = inputs.indexOf(passwordInput);

    let username = '';
    if (pwdIndex > 0) {
      for (let i = pwdIndex - 1; i >= 0; i--) {
        const type = inputs[i].type.toLowerCase();
        if (type === 'text' || type === 'email' || type === 'tel') {
          username = inputs[i].value;
          break;
        }
      }
    }

    if (username && password) {
      try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.sendToHost('save-password-prompt', { url: window.location.origin, username, password });
      } catch (err) {}
    }
  }
});

// ─── Single-Tab Navigation Enforcer ─────────────────────────────────────────
// Forces all external target="_blank" links, forms, and window.open calls 
// to execute natively inside the SAME tab. If the user wants a new tab,
// they explicitly use Right Click -> Open in New Tab.
const enforceSingleTab = document.createElement('script');
enforceSingleTab.textContent = `
  // 1. Strip target="_blank" from links and forms during capture phase
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, form, button');
    if (el && el.getAttribute && el.getAttribute('target') === '_blank') {
      el.removeAttribute('target');
    }
  }, true);
  
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.getAttribute('target') === '_blank') {
      e.target.removeAttribute('target');
    }
  }, true);

  // 2. Override window.open to redirect the current tab instead of returning null
  const _ogOpen = window.open;
  window.open = function(url, target, features) {
    if (url && (target === '_blank' || target === 'blank' || !target)) {
      window.location.href = url;
      return window; // Prevent crash on newWin.location.href
    }
    return _ogOpen.apply(this, arguments);
  };
`;
document.documentElement.appendChild(enforceSingleTab);
