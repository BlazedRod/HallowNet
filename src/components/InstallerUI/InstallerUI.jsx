import React, { useState, useEffect } from 'react';
import './InstallerUI.css';

export default function InstallerUI() {
  const [installPath, setInstallPath] = useState('');
  const [status, setStatus] = useState('welcome'); // welcome, eula, options, installing, done, error
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [shouldWipeData, setShouldWipeData] = useState(false);
  
  const [desktopShortcut, setDesktopShortcut] = useState(true);
  const [startMenuShortcut, setStartMenuShortcut] = useState(true);
  const [launchOnFinish, setLaunchOnFinish] = useState(true);

  useEffect(() => {
    async function initInstaller() {
      if (window.electronAPI?.getDefaultInstallPath) {
        const path = await window.electronAPI.getDefaultInstallPath();
        if (path) setInstallPath(path);
      }
      if (window.electronAPI?.checkExistingInstall) {
        const exists = await window.electronAPI.checkExistingInstall();
        if (exists) {
          setStatus('update_prompt');
        }
      }
    }
    initInstaller();
  }, []);

  const handleSelectPath = async () => {
    if (window.electronAPI?.selectInstallPath) {
      const selected = await window.electronAPI.selectInstallPath();
      if (selected) setInstallPath(selected);
    }
  };

  const handleInstall = async (overrideWipe = null) => {
    const finalWipeData = overrideWipe !== null ? overrideWipe : shouldWipeData;
    if (!window.electronAPI?.startInstall) return;
    setStatus('installing');
    
    // Fake progress bar for cinematic effect
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 5;
      if (prog > 90) prog = 90; // Wait at 90% for actual IPC finish
      setProgress(prog);
    }, 100);

    const result = await window.electronAPI.startInstall(installPath, {
      desktopShortcut,
      startMenuShortcut,
      wipeData: finalWipeData
    });
    clearInterval(interval);
    
    if (result && result.success) {
      setProgress(100);
      setStatus('done');
    } else {
      setStatus('error');
      setErrorMsg(result?.error || 'Unknown error occurred.');
      setProgress(0);
    }
  };

  const handleUninstall = async () => {
    if (!window.electronAPI?.startUninstall) return;
    setStatus('uninstalling');

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 5;
      if (prog > 90) prog = 90;
      setProgress(prog);
    }, 100);

    const result = await window.electronAPI.startUninstall();
    clearInterval(interval);

    if (result && result.success) {
      setProgress(100);
      setStatus('uninstalled');
    } else {
      setStatus('error');
      setErrorMsg(result?.error || 'Unknown error during uninstall.');
      setProgress(0);
    }
  };

  const handleFinish = () => {
    if (window.electronAPI?.finishInstall) {
      window.electronAPI.finishInstall(installPath, launchOnFinish);
    }
  };

  return (
    <div className="installer-wrapper">
      <div className="installer-fog"></div>
      
      {/* Title Bar for dragging */}
      <div className="installer-titlebar">
        <div className="installer-drag-region">HallowNet Setup</div>
        <button className="installer-close-btn" onClick={() => window.electronAPI?.closeWindow?.()}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.5 0.5L9.5 9.5M9.5 0.5L0.5 9.5" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </button>
      </div>

      <div className="installer-content">
        <div className="installer-logo-area">
          <svg className="installer-ghost" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z" fill="color-mix(in srgb, var(--accent-primary) 15%, #08060a)" stroke="var(--accent-primary)" strokeWidth="2" />
            <circle cx="30" cy="40" r="4.5" fill="var(--accent-primary)" />
            <circle cx="50" cy="40" r="4.5" fill="var(--accent-primary)" />
          </svg>
          <h1 className="installer-title">H A L L O W N E T</h1>
        </div>

        {status === 'update_prompt' && (
          <div className="installer-step center-content">
            <div className="installer-label" style={{ color: 'var(--accent-primary)', marginBottom: '15px' }}>
              EXISTING INSTALLATION DETECTED
            </div>
            <p className="installer-desc" style={{ marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
              We found a previous installation of HallowNet on your system. <br/><br/>
              Would you like to safely <strong style={{color: '#fff'}}>Update</strong> to the latest version while preserving your saved data, perform a <strong style={{color: 'var(--accent-primary)'}}>Fresh Install</strong> to completely wipe your profile, or <strong style={{color: '#ff2233'}}>Uninstall</strong> the browser entirely?
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginTop: '10px', width: '100%' }}>
              <button className="installer-manifest-btn" style={{ width: 'auto', flex: 1, padding: '16px 5px', letterSpacing: '2px' }} onClick={() => handleInstall(false)}>
                UPDATE
              </button>
              <button className="installer-manifest-btn secondary-btn" style={{ width: 'auto', flex: 1, padding: '16px 5px', letterSpacing: '2px' }} onClick={() => {
                setShouldWipeData(true);
                setStatus('options');
              }}>
                FRESH INSTALL
              </button>
              <button className="installer-manifest-btn error-btn" style={{ width: 'auto', flex: 1, padding: '16px 5px', letterSpacing: '2px' }} onClick={handleUninstall}>
                UNINSTALL
              </button>
            </div>
          </div>
        )}

        {status === 'uninstalling' && (
          <div className="installer-step center-content">
            <div className="installer-label pulsing" style={{ color: '#ff2233' }}>UNINSTALLING...</div>
            <div className="installer-progress-container">
              <div className="installer-progress-bar" style={{ width: `${progress}%`, background: '#ff2233', boxShadow: '0 0 10px #ff2233' }}></div>
            </div>
          </div>
        )}

        {status === 'uninstalled' && (
          <div className="installer-step center-content">
            <div className="installer-label success" style={{ marginBottom: '10px' }}>UNINSTALL COMPLETE</div>
            <p className="installer-desc">HallowNet and all associated data have been completely removed from your system.</p>
            
            <button className="installer-manifest-btn" style={{ marginTop: '30px' }} onClick={() => window.electronAPI?.closeWindow()}>
              CLOSE
            </button>
          </div>
        )}

        {status === 'welcome' && (
          <div className="installer-step center-content">
            <p className="installer-desc" style={{ marginBottom: '30px', fontSize: '14px' }}>
              Welcome to the HallowNet installation wizard. This will install HallowNet onto your computer.
            </p>
            <button className="installer-manifest-btn" onClick={() => setStatus('eula')}>
              NEXT
            </button>
          </div>
        )}

        {status === 'eula' && (
          <div className="installer-step">
            <div className="installer-label">END USER LICENSE AGREEMENT</div>
            <div className="installer-eula-box">
              <p><strong>END USER LICENSE AGREEMENT (EULA)</strong></p>
              <p>Please read the following terms and conditions carefully before installing or using HallowNet. By installing or using this software, you agree to be bound by the terms of this EULA.</p>
              <p><strong>1. LICENSE GRANT.</strong> The developers grant you a revocable, non-exclusive, non-transferable, limited license to download, install, and use the software strictly in accordance with the terms of this Agreement.</p>
              <p><strong>2. RESTRICTIONS.</strong> You agree not to, and you will not permit others to license, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose, or otherwise commercially exploit the software or make the software available to any third party.</p>
              <p><strong>3. MODIFICATIONS TO SOFTWARE.</strong> The developers reserve the right to modify, suspend, or discontinue, temporarily or permanently, the software or any service to which it connects, with or without notice and without liability to you.</p>
              <p><strong>4. TERM AND TERMINATION.</strong> This Agreement shall remain in effect until terminated by you or the developers. The developers may, in their sole discretion, at any time and for any or no reason, suspend or terminate this Agreement with or without prior notice.</p>
              <p><strong>5. SEVERABILITY.</strong> If any provision of this Agreement is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.</p>
              <p>Do you accept all the terms of the preceding License Agreement?</p>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button className="installer-manifest-btn secondary-btn" onClick={() => setStatus('welcome')}>
                DECLINE
              </button>
              <button className="installer-manifest-btn" onClick={() => setStatus('options')}>
                AGREE
              </button>
            </div>
          </div>
        )}

        {status === 'options' && (
          <div className="installer-step">
            <div className="installer-label">DESTINATION PATH</div>
            <div className="installer-path-selector">
              <input type="text" value={installPath} readOnly className="installer-input" />
              <button className="installer-browse-btn" onClick={handleSelectPath}>BROWSE</button>
            </div>
            
            <div className="installer-options-list">
              <label className="installer-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={desktopShortcut} 
                  onChange={(e) => setDesktopShortcut(e.target.checked)} 
                />
                <span className="installer-checkbox-text">Create Desktop Shortcut</span>
              </label>
              <label className="installer-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={startMenuShortcut} 
                  onChange={(e) => setStartMenuShortcut(e.target.checked)} 
                />
                <span className="installer-checkbox-text">Create Start Menu Shortcut</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button className="installer-manifest-btn secondary-btn" onClick={() => setStatus('eula')}>
                BACK
              </button>
              <button className="installer-manifest-btn" onClick={() => handleInstall()}>
                INSTALL
              </button>
            </div>
          </div>
        )}

        {status === 'installing' && (
          <div className="installer-step center-content">
            <div className="installer-label pulsing">INSTALLING FILES...</div>
            <div className="installer-progress-container">
              <div className="installer-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="installer-step center-content">
            <div className="installer-label success" style={{ marginBottom: '10px' }}>INSTALLATION COMPLETE</div>
            <p className="installer-desc">HallowNet has been successfully installed on your system.</p>
            
            <div className="installer-options-list" style={{ marginTop: '20px', width: '100%', alignItems: 'flex-start' }}>
              <label className="installer-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={launchOnFinish} 
                  onChange={(e) => setLaunchOnFinish(e.target.checked)} 
                />
                <span className="installer-checkbox-text">Launch HallowNet</span>
              </label>
            </div>

            <button className="installer-manifest-btn" style={{ marginTop: '30px' }} onClick={handleFinish}>
              FINISH
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="installer-step center-content">
            <div className="installer-label error">INSTALLATION FAILED</div>
            <div className="installer-error-box">{errorMsg}</div>
            <button className="installer-manifest-btn error-btn" onClick={() => setStatus('options')}>
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
