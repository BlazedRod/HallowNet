const { net, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const REPO_OWNER = 'BlazedRod';
const REPO_NAME = 'HallowNet';

/**
 * Checks GitHub for the latest release and compares it to the current app version.
 * Returns an object with { updateAvailable: boolean, version: string, downloadUrl: string, releaseNotes: string }
 */
async function checkForUpdates() {
  return new Promise((resolve) => {
    const request = net.request({
      method: 'GET',
      protocol: 'https:',
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
    });

    request.setHeader('User-Agent', `HallowNet-Updater/${app.getVersion()}`);

    request.on('response', (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          if (response.statusCode !== 200) {
            console.error('Update check failed:', response.statusCode, data);
            resolve({ updateAvailable: false });
            return;
          }

          const release = JSON.parse(data);
          const latestVersion = release.tag_name.replace(/[^0-9.]/g, ''); // strip 'v' prefix
          const currentVersion = app.getVersion();

          // Basic semver compare
          if (isNewerVersion(currentVersion, latestVersion)) {
            // Find the Windows .exe asset
            const exeAsset = release.assets.find(a => a.name.endsWith('.exe'));
            
            if (exeAsset) {
              resolve({
                updateAvailable: true,
                version: latestVersion,
                downloadUrl: exeAsset.browser_download_url,
                releaseNotes: release.body
              });
              return;
            }
          }
          
          resolve({ updateAvailable: false });
        } catch (err) {
          console.error('Failed to parse GitHub release data', err);
          resolve({ updateAvailable: false });
        }
      });
    });

    request.on('error', (err) => {
      console.error('Failed to check for updates', err);
      resolve({ updateAvailable: false });
    });

    request.end();
  });
}

const https = require('https');

/**
 * Downloads the update to the temp folder and executes it.
 */
async function downloadAndInstallUpdate(downloadUrl, windowToNotify) {
  return new Promise((resolve, reject) => {
    const fileName = `HallowNet_Update_${Date.now()}.exe`;
    const tempPath = path.join(app.getPath('temp'), fileName);
    
    // Notify frontend we are starting
    if (windowToNotify) {
      windowToNotify.webContents.send('updater:progress', { percent: 0 });
    }

    const downloadFile = (url) => {
      https.get(url, (response) => {
        // Handle Redirects (GitHub always redirects asset downloads)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          downloadFile(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        let lastPercent = 0;
        
        const fileStream = fs.createWriteStream(tempPath);
        
        response.on('data', (chunk) => {
          fileStream.write(chunk);
          downloadedBytes += chunk.length;
          
          if (totalBytes > 0 && windowToNotify) {
            const percent = Math.round((downloadedBytes / totalBytes) * 100);
            if (percent > lastPercent) {
              lastPercent = percent;
              windowToNotify.webContents.send('updater:progress', { percent });
            }
          }
        });

        response.on('end', () => {
          fileStream.end();
        });

        fileStream.on('finish', () => {
          fileStream.close();
        });

        // The OS lock is officially released here
        fileStream.on('close', () => {
          if (windowToNotify) {
            windowToNotify.webContents.send('updater:progress', { percent: 100 });
          }

          console.log('Download complete. Waiting 2.5s for Windows Defender to release its aggressive scan lock...');
          
          setTimeout(() => {
            console.log('Spawning installer:', tempPath);
            try {
              const child = spawn(tempPath, ['--silent-update'], {
                detached: true,
                stdio: 'ignore'
              });
              
              child.unref(); // Allow the parent to exit independently
              
              // Give the installer 1 second to spin up before we kill the browser
              setTimeout(() => {
                app.quit();
              }, 1000);
              
              resolve(true);
            } catch (err) {
              console.error('Spawn failed:', err);
              reject(err);
            }
          }, 2500); // 2.5 second delay bypasses the infamous Windows "EBUSY" Defender bug
        });
      }).on('error', (err) => {
        fs.unlink(tempPath, () => {});
        reject(err);
      });
    };

    downloadFile(downloadUrl);
  });
}

function isNewerVersion(current, latest) {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const cVal = c[i] || 0;
    const lVal = l[i] || 0;
    if (lVal > cVal) return true;
    if (lVal < cVal) return false;
  }
  return false;
}

module.exports = {
  checkForUpdates,
  downloadAndInstallUpdate
};
