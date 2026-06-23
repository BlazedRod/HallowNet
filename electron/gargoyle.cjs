const { app, ipcMain } = require('electron');
const SecureStorage = require('./storage.cjs');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// GARGOYLE V4 AD-BLOCKER ENGINE V9
// Multi-layer network proxy, clickjacking annihilator, and Shadow DOM piercing
// Handles YouTube-specific ad delivery separately
// ──────────────────────────────────────────────

const DOMAIN_BLOCKLIST = [
  // Google Ad Network
  'googleadservices.com',
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  'static.doubleclick.net',
  'securepubads.g.doubleclick.net',
  // YouTube Ad APIs
  'ad.youtube.com',
  'ads.youtube.com',
  // Facebook
  'connect.facebook.net',
  'an.facebook.com',
  // Amazon
  'amazon-adsystem.com',
  'aax.amazon-adsystem.com',
  // Programmatic Networks
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'rubiconproject.com',
  'openx.net',
  'pubmatic.com',
  'appnexus.com',
  'adnxs.com',
  'advertising.com',
  'spotxchange.com',
  'smartadserver.com',
  'lijit.com',
  'undertone.com',
  'adtechus.com',
  // Analytics / Tracking
  'quantserve.com',
  'scorecardresearch.com',
  'moatads.com',
  'adsafeprotected.com',
  'zedo.com',
  'adtech.de',
  'popads.net',
  'ads.twitter.com',
  'ads.linkedin.com',
  'tiktok.com/api/ad/',
  'ads-twitter.com',
  'serving-sys.com',
  'yieldmanager.com',
  'trafficjunky.net',
  'revsci.net',
  'turn.com',
  'bluekai.com',
  'demdex.net',
  'exelator.com',
  // Popunders, Adult, and Aggressive Ad Networks
  'exoclick.com',
  'juicyads.com',
  'ero-advertising.com',
  'trafficfactory.biz',
  'twinred.com',
  'adxpansion.com',
  'plugrush.com',
  'clickadu.com',
  'hilltopads.com',
  'propellerads.com',
  'popcash.net',
  'adsterra.com',
  'galaksion.com',
  'monadplug.com',
  'trafficstars.com',
  'mgid.com',
  'revcontent.com',
  'yllix.com',
  'adcash.com',
  'ad-maven.com',
  'zeropark.com',
  'adnium.com',
  'runative.com',
  'ad-center.com',
  'adultadworld.com',
  'blacklabelads.com',
  'c.ad-maven.com',
  // Streaming Site specific
  'highcpmgate.com',
  'highcpmrevenuegate.com',
  'profitabledisplaynetwork.com',
  'monetag.com',
  'whos.amung.us',
  'jads.co',
  'onclickads.net',
  'bidgear.com',
  'ad-score.com',
  'tsyndicate.com',
  'placements.com',
  'a.medleyads.com',
  'w.adplxmd.com',
  'pub2srv.com',
  'exdynsrv.com',
  'syndication.exdynsrv.com',
  'chaturbate.com/b/',
  'stripchat.com/ad',
  'bongacams.com/ad',
  'livejasmin.com/ad',
  'realsrv.com',
  'a.realsrv.com',
  'realsrv.com/deliver',
  'adk2x.com',
  'dolphincdn.xyz',
  's.dolphincdn.xyz',
  'kisscartoon.sh/ads',
  'kisscartoon.sh/adx',
  'adk2.co',
  'adxad.com',
  'a.adxad.com',
  'ads.exoclick.com',
  'syndication.exoclick.com',
  's.mngads.com',
  'adx.mngads.com',
  'ads.trafficjunky.net',
  'ads.adsterra.com',
  'pl.monetizer101.com',
  'ads.pubmatic.com',
  'cdn.adotmob.com',
  'srv.adsterratools.com',
  'creative.adsterratools.com',
  'track.adsterratools.com',
  's.adroll.com',
  'd.adroll.com',
  'googleads.g.doubleclick.net',
  'pubads.g.doubleclick.net',
  'securepubads.g.doubleclick.net',
  'static.doubleclick.net',
  'cm.g.doubleclick.net',
  'stats.g.doubleclick.net',
  'bidder.criteo.com',
  'gum.criteo.com',
  'static.criteo.net',
  'cdn.taboola.com',
  'trc.taboola.com',
  'widgets.outbrain.com',
  'log.outbrain.com',
  'pixel.rubiconproject.com',
  'fastlane.rubiconproject.com',
  'ib.adnxs.com',
  'acdn.adnxs.com',
  'b.scorecardresearch.com',
  'sb.scorecardresearch.com',
  'px.moatads.com',
  'z.moatads.com',
  'sync.1rx.io',
  'ads.pubmatic.com',
  'image2.pubmatic.com',
  'ssum-sec.casalemedia.com',
  'simage2.pubmatic.com',
];

// Domains that employ aggressive anti-adblock or cyber-warfare tactics.
// The thermonuclear "Kill Switch" rules are restricted strictly to these domains.
const EXTREME_DOMAINS = [
  'kisscartoon.sh'
];

// YouTube-specific path patterns to block
const YOUTUBE_AD_PATHS = [
  '/api/stats/ads',
  '/api/stats/qoe',
  '/get_midroll_info',
  '/pagead/',
  '/ptracking',
  '/youtubei/v1/player/ad_break',
  '/generate_204',         // ad ping
  '/api/stats/delayplay',
  '/videogoodput',
];

// URL string fragments that indicate an ad delivery request
const AD_URL_FRAGMENTS = [
  'ad_type=',
  'oad_type=',
  'adformat=',
  '&oad&',
  '/doubleclick/',
  'googlevideo.com/initplayback',
  '/popunder.js',
  '/pop.js',
  '/ad.js',
  '/ads.js',
  '/banner.js',
  '/banners/',
  '/popup.js',
  '/popup.php',
  '?ad_id=',
  '?zoneid=',
  'type=popunder',
  'type=ad',
  '/ad-banner/',
  '/popunders/',
  '?bannerid=',
  '/popup-ad/',
  '/adserver/',
  '/deliver/',
  '/www/delivery/',
  '/ad/serve',
  '&ad_type=',
  '&adformat='
];

let isEnabled = true;
let sessionAdsBlocked = 0;
let initialized = false;

const recentBlocks = [];
const MAX_RECENT = 50;

let DYNAMIC_BLOCK_SET = new Set(DOMAIN_BLOCKLIST);
let dynamicBlocklistLoaded = false;

function fetchDynamicBlocklist() {
  if (dynamicBlocklistLoaded) return;
  
  // We fetch app.getPath() inside a function to ensure electron is fully ready
  let cachePath;
  try { cachePath = path.join(app.getPath('userData'), 'gargoyle_hosts.txt'); } catch(e) { return; }

  const loadIntoSet = (data) => {
    const lines = data.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && (parts[0] === '0.0.0.0' || parts[0] === '127.0.0.1')) {
        if (parts[1] !== '0.0.0.0' && parts[1] !== 'localhost' && parts[1] !== 'broadcasthost') {
          DYNAMIC_BLOCK_SET.add(parts[1]);
        }
      }
    });
    dynamicBlocklistLoaded = true;
    console.log(`[Gargoyle] Dynamic blocklist loaded. Total known wards: ${DYNAMIC_BLOCK_SET.size}`);
  };

  if (fs.existsSync(cachePath)) {
    try {
      const stats = fs.statSync(cachePath);
      const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        loadIntoSet(fs.readFileSync(cachePath, 'utf8'));
        return;
      }
    } catch(e) { console.error('[Gargoyle] Cache read failed', e); }
  }

  console.log('[Gargoyle] Fetching fresh StevenBlack Hosts list...');
  https.get('https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        fs.writeFileSync(cachePath, data, 'utf8');
        loadIntoSet(data);
      } catch(e) { console.error('[Gargoyle] Failed to save/load hosts list', e); }
    });
  }).on('error', e => console.error('[Gargoyle] Network error fetching hosts', e));
}

function shouldBlock(url) {
  if (!isEnabled) return false;

  // 0. The Holy Whitelist: Core Video Player Structural Scripts
  // KissCartoon deliberately names their core video player initialization files 'ads.js' 
  // so that adblockers kill the video player. We must force-allow these so the video boots.
  if (url.includes('cartooncdn.xyz') && (url.includes('ads.js') || url.includes('videojs'))) {
    return false; 
  }

  // 1. Dynamic Domain Set check (O(1) lookup time per domain segment)
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    if (DOMAIN_BLOCKLIST.some(d => url.includes(d))) return true;
    return false;
  }

  let parts = hostname.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const domainToCheck = parts.slice(i).join('.');
    if (DYNAMIC_BLOCK_SET.has(domainToCheck)) {
      return true;
    }
  }

  // 2. YouTube-specific path blocking
  if (url.includes('youtube.com')) {
    if (YOUTUBE_AD_PATHS.some(p => url.includes(p))) return true;
  }

  // 3. Ad URL fragment matching
  if (AD_URL_FRAGMENTS.some(f => url.includes(f))) return true;

  return false;
}

const hookedSessions = new WeakSet();

function initGargoyle(sess) {
  if (hookedSessions.has(sess)) return;
  hookedSessions.add(sess);

  sess.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url.toLowerCase();

    // EXTREME MODE: The network Kill Switch
    // If the request originates from an EXTREME_DOMAIN, activate hyper-aggressive keyword blocking.
    let isExtreme = false;
    let referer = '';
    
    // Attempt to determine the origin of the request
    if (details.requestHeaders && details.requestHeaders['Referer']) {
       referer = details.requestHeaders['Referer'].toLowerCase();
    }
    
    // Check if the referer OR the target url itself belongs to an extreme domain (like during initial navigation)
    if (EXTREME_DOMAINS.some(d => referer.includes(d) || url.includes(d))) {
       isExtreme = true;
    }

    if (isExtreme) {
      const killKeywords = ['hentai', 'popunder', 'popup', 'ad_type', 'banner', 'tracker', 'ad-score', 'ad-delivery'];
      if (killKeywords.some(k => url.includes(k))) {
         // Exclude main document navigations so we don't break searching for "hentai" directly on KissCartoon
         if (!url.includes('kisscartoon.sh/cartoon/') && !url.includes('kisscartoon.sh/cartoonlist')) {
             return callback({ redirectURL: 'gargoyle://void/empty.txt' });
         }
      }
    }

    if (shouldBlock(url)) {
      SecureStorage.incrementGargoyleBlocked();
      sessionAdsBlocked++;
      
      // Keep track of recent blocks
      recentBlocks.unshift({ url, timestamp: Date.now() });
      if (recentBlocks.length > MAX_RECENT) recentBlocks.pop();

      console.log(`[Gargoyle] BLOCKED: ${url.slice(0, 120)}`);
      
      // Instead of cancelling (which alerts the site via 'onerror') or using 'data:' URIs (which fail CSP),
      // we redirect the request to our custom, highly-privileged Void Protocol.
      // The browser natively allows this to load successfully with an empty payload, bypassing ALL detection!
      if (details.resourceType === 'script') {
        return callback({ redirectURL: 'gargoyle://void/empty.js' });
      } else if (details.resourceType === 'image') {
        return callback({ redirectURL: 'gargoyle://void/empty.gif' });
      } else if (details.resourceType === 'subFrame') {
        return callback({ redirectURL: 'gargoyle://void/empty.html' });
      } else {
        return callback({ redirectURL: 'gargoyle://void/empty.txt' });
      }
    }

    callback({ cancel: false });
  });

  // Only bind IPC handlers once across the entire app
  if (!initialized) {
    initialized = true;
    
    // Kick off the async blocklist fetch in the background as soon as the first session connects
    fetchDynamicBlocklist();

    ipcMain.handle('gargoyle:get-stats', () => ({
      enabled: isEnabled,
      totalBlocked: SecureStorage.getGargoyleStats().totalAdsBlocked,
      sessionBlocked: sessionAdsBlocked,
      blocklistSize: DYNAMIC_BLOCK_SET.size + YOUTUBE_AD_PATHS.length,
      recentBlocks
    }));

    ipcMain.handle('gargoyle:toggle', () => {
      isEnabled = !isEnabled;
      return isEnabled;
    });

    console.log('[Gargoyle V4] Engine Initialized. Multi-session blocking active.');
  }
}

module.exports = { initGargoyle };
