const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function executeInstall(targetPath, options = {}) {
  try {
    const sourceDir = path.dirname(process.execPath);
    
    // 0. Wipe Data if Fresh Install
    if (options.wipeData) {
      const userDataDir = path.join(app.getPath('appData'), 'HallowNet');
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
    }

    // 1. Copy Files
    fs.cpSync(sourceDir, targetPath, { recursive: true, force: true });

    // 2. Setup Paths
    const targetExe = path.join(targetPath, path.basename(process.execPath));
    const desktopPath = app.getPath('desktop');
    const startMenuPath = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    
    const desktopShortcut = path.join(desktopPath, 'HallowNet.lnk');
    const startMenuShortcut = path.join(startMenuPath, 'HallowNet.lnk');

    // 3. PowerShell magic for Shortcuts and Registry Uninstall keys
    const esc = (p) => p.replace(/\\/g, '\\\\');
    const safeDesktop = esc(desktopShortcut);
    const safeStartMenu = esc(startMenuShortcut);
    const safeTargetExe = esc(targetExe);
    const safeTargetPath = esc(targetPath);

    let psScript = `$WshShell = New-Object -comObject WScript.Shell;\n`;

    if (options.desktopShortcut) {
      psScript += `
        $Shortcut = $WshShell.CreateShortcut("${safeDesktop}");
        $Shortcut.TargetPath = "${safeTargetExe}";
        $Shortcut.WorkingDirectory = "${safeTargetPath}";
        $Shortcut.Save();
      `;
    }

    if (options.startMenuShortcut) {
      psScript += `
        $Shortcut2 = $WshShell.CreateShortcut("${safeStartMenu}");
        $Shortcut2.TargetPath = "${safeTargetExe}";
        $Shortcut2.WorkingDirectory = "${safeTargetPath}";
        $Shortcut2.Save();
      `;
    }

    psScript += `
      $RegPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\HallowNet";
      New-Item -Path $RegPath -Force | Out-Null;
      Set-ItemProperty -Path $RegPath -Name "DisplayName" -Value "HallowNet";
      Set-ItemProperty -Path $RegPath -Name "DisplayIcon" -Value "${safeTargetExe}";
      Set-ItemProperty -Path $RegPath -Name "Publisher" -Value "HallowNet";
      
      $UninstallCmd = "powershell.exe -WindowStyle Hidden -Command \`"Stop-Process -Name 'HallowNet' -Force -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force '${safeTargetPath}' -ErrorAction SilentlyContinue; Remove-Item -Path '${safeDesktop}' -Force -ErrorAction SilentlyContinue; Remove-Item -Path '${safeStartMenu}' -Force -ErrorAction SilentlyContinue; Remove-Item -Path '$RegPath' -Force -ErrorAction SilentlyContinue\`"";
      Set-ItemProperty -Path $RegPath -Name "UninstallString" -Value $UninstallCmd;
    `;

    await execPromise(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`);

    // Wait, let the React UI show "Done", do NOT auto-launch here.
    return { success: true };
  } catch (err) {
    console.error("Installation Error:", err);
    return { success: false, error: err.message };
  }
}

async function executeUninstall() {
  try {
    const rawLocalAppData = process.env.LOCALAPPDATA || path.join(require('os').homedir(), 'AppData', 'Local');
    const targetPath = path.join(rawLocalAppData, 'Programs', 'HallowNet');
    const userDataDir = path.join(app.getPath('appData'), 'HallowNet');
    
    const desktopPath = app.getPath('desktop');
    const startMenuPath = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    
    const desktopShortcut = path.join(desktopPath, 'HallowNet.lnk');
    const startMenuShortcut = path.join(startMenuPath, 'HallowNet.lnk');

    const esc = (p) => p.replace(/\\/g, '\\\\');
    const safeTargetPath = esc(targetPath);
    const safeDesktop = esc(desktopShortcut);
    const safeStartMenu = esc(startMenuShortcut);
    const safeUserData = esc(userDataDir);

    let psScript = `
      Stop-Process -Name 'HallowNet' -Force -ErrorAction SilentlyContinue;
      Start-Sleep -Seconds 1;
      Remove-Item -Recurse -Force '${safeTargetPath}' -ErrorAction SilentlyContinue;
      Remove-Item -Recurse -Force '${safeUserData}' -ErrorAction SilentlyContinue;
      Remove-Item -Path '${safeDesktop}' -Force -ErrorAction SilentlyContinue;
      Remove-Item -Path '${safeStartMenu}' -Force -ErrorAction SilentlyContinue;
      $RegPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\HallowNet";
      Remove-Item -Path $RegPath -Force -ErrorAction SilentlyContinue;
    `;

    await execPromise(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`);
    return { success: true };
  } catch (err) {
    console.error("Uninstall Error:", err);
    return { success: false, error: err.message };
  }
}

function finishInstall(targetPath, shouldLaunch) {
  if (shouldLaunch) {
    const targetExe = path.join(targetPath, path.basename(process.execPath));
    const { spawn } = require('child_process');
    
    // CRITICAL: We must completely purge the Portable Executable variables from the 
    // spawned environment, otherwise the installed app will inherit them and 
    // infinitely boot back into the Installer Mode.
    const cleanEnv = Object.assign({}, process.env);
    delete cleanEnv.PORTABLE_EXECUTABLE_FILE;
    delete cleanEnv.PORTABLE_EXECUTABLE_DIR;
    delete cleanEnv.PORTABLE_EXECUTABLE_APP_FILENAME;

    spawn(targetExe, [], { detached: true, stdio: 'ignore', env: cleanEnv });
  }
  
  // Wait a brief moment to ensure the spawn detached successfully, then terminate the installer
  setTimeout(() => app.quit(), 500);
}

module.exports = { executeInstall, executeUninstall, finishInstall };
