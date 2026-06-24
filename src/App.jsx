import React, { useState, useEffect } from 'react';
import { BrowserProvider } from './context/BrowserContext';
import BrowserChrome from './components/BrowserChrome/BrowserChrome';
import WebContents from './components/WebContents/WebContents';
import Sidebar from './components/Sidebar/Sidebar';
import SplashScreen from './components/SplashScreen/SplashScreen';
import GhostTutorial from './components/GhostTutorial/GhostTutorial';
import Trapdoor from './components/Trapdoor/Trapdoor';
import InstallerUI from './components/InstallerUI/InstallerUI';
import './App.css';

function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [isInstallerMode, setIsInstallerMode] = useState(false);

  useEffect(() => {
    // Block rendering until all fonts are 100% loaded to prevent FOUT and animation desync
    document.fonts.ready.then(() => setFontsLoaded(true));

    // If running in installer mode, bypass normal boot
    if (window.location.hash === '#/installer') {
      setIsInstallerMode(true);
      return;
    }

    let savedTheme = localStorage.getItem('hwn_theme');
    const validBuiltins = ['classic-halloween', 'autumn-forest', 'geesebimps', 'blood-moon', 'grimoire', 'whiteout'];
    if (!savedTheme || (!validBuiltins.includes(savedTheme) && !savedTheme.startsWith('custom-'))) {
      savedTheme = 'classic-halloween';
    }
    document.documentElement.setAttribute('data-theme', savedTheme);

    // If it's a custom Lab theme, inject its CSS variables immediately
    // so the splash screen renders with the correct colors/fonts
    if (savedTheme.startsWith('custom-')) {
      try {
        const customThemes = JSON.parse(localStorage.getItem('hwn_custom_themes') || '[]');
        const custom = customThemes.find(t => t.id === savedTheme);
        if (custom) {
          const styleTag = document.createElement('style');
          styleTag.id = 'hwn-custom-theme-style';
          styleTag.textContent = `
            :root[data-theme="${savedTheme}"] {
              --bg-primary: ${custom.colors.bgPrimary};
              --bg-secondary: ${custom.colors.bgSecondary};
              --chrome-bg-base: ${custom.colors.chromeBgBase || '#080709'};
              --chrome-bg-tabs: ${custom.colors.chromeBgTabs || '#050507'};
              --chrome-bg-tab-active: ${custom.colors.chromeBgTabActive || '#131015'};
              --chrome-bg-tab-inactive: ${custom.colors.chromeBgTabInactive || 'rgba(255, 255, 255, 0.03)'};
              --chrome-bg-sidebar: ${custom.colors.chromeBgSidebar || 'rgba(15, 12, 18, 0.75)'};
              --chrome-bg-favicon: ${custom.colors.chromeBgFavicon || '#3a3040'};
              --chrome-bg-menu: ${custom.colors.chromeBgMenu || 'rgba(8, 5, 16, 0.96)'};
              --chrome-bg-toolbar: ${custom.colors.chromeBgToolbar || '#0f0c12'};
              --chrome-bg-urlbar: ${custom.colors.chromeBgUrlbar || '#06050a'};
              --chrome-text-sidebar: ${custom.colors.chromeTextSidebar || 'rgba(180, 120, 60, 0.7)'};
              --accent-primary: ${custom.colors.accentPrimary};
              --accent-secondary: ${custom.colors.accentSecondary};
              --accent-glow: ${custom.colors.accentPrimary};
              --text-primary: ${custom.colors.textPrimary};
              --text-secondary: ${custom.colors.textSecondary};
              --text-muted: ${custom.colors.textMuted};
              --text-searchbar: ${custom.colors.textSearchbar || custom.colors.textPrimary};
              --border-color: ${custom.colors.borderColor};
              --border-highlight: ${custom.colors.borderHighlight};
              --panel-bg: ${custom.colors.panelBg};
              --brand-font: '${custom.brandFont}', sans-serif;
              --font-family: '${custom.uiFont}', sans-serif;
              --shadow-glow-orange: 0 0 20px color-mix(in srgb, ${custom.colors.accentPrimary} 40%, transparent), 0 0 40px color-mix(in srgb, ${custom.colors.accentPrimary} 15%, transparent);
              --shadow-glow-purple: 0 0 20px color-mix(in srgb, ${custom.colors.accentPrimary} 40%, transparent), 0 0 40px color-mix(in srgb, ${custom.colors.accentPrimary} 15%, transparent);
            }
          `;
          document.head.appendChild(styleTag);
        }
      } catch (e) {
        // Malformed localStorage — ignore, fall back to defaults
      }
    }
  }, []);

  if (!fontsLoaded) {
    return <div style={{ width: '100vw', height: '100vh', background: '#000' }} />;
  }

  if (isInstallerMode) {
    return <InstallerUI />;
  }

  return (
    <>
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      {splashDone && (
        <BrowserProvider>
          <div className="app-shell">
            <BrowserChrome />
            <div className="app-content">
              <WebContents />
              <Sidebar />
            </div>
            <GhostTutorial />
          </div>
          <Trapdoor />
        </BrowserProvider>
      )}
    </>
  );
}

export default App;
