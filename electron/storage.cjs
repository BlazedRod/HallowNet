const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class SecureStorage {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.gargoylePath = path.join(this.userDataPath, 'gargoyle.json');
    this.historyPath = path.join(this.userDataPath, 'history.json');
    this.directoryPath = path.join(this.userDataPath, 'directory.json');
    this.vaultPath = path.join(this.userDataPath, 'vault.enc');
    this.keyPath = path.join(this.userDataPath, 'master.key');
    
    this.masterKey = null;
  }

  // â”€â”€â”€ ENVELOPE ENCRYPTION PIPELINE â”€â”€â”€

  initializeEncryption() {
    try {
      if (fs.existsSync(this.keyPath)) {
        const encryptedKey = fs.readFileSync(this.keyPath);
        if (safeStorage.isEncryptionAvailable()) {
          this.masterKey = safeStorage.decryptString(encryptedKey);
        } else {
          // Fallback if OS keychain is broken (extremely rare)
          this.masterKey = encryptedKey.toString('utf-8');
        }
      } else {
        // Generate a cryptographically secure 256-bit AES master key
        this.masterKey = crypto.randomBytes(32).toString('hex');
        let keyToStore = Buffer.from(this.masterKey, 'utf-8');
        
        if (safeStorage.isEncryptionAvailable()) {
          keyToStore = safeStorage.encryptString(this.masterKey);
        }
        
        fs.writeFileSync(this.keyPath, keyToStore);
      }
    } catch (err) {
      console.error('[SecureStorage] Failed to initialize cryptography envelope:', err);
    }
  }

  encryptPayload(plainText) {
    if (!this.masterKey) return plainText; // Fail-safe
    
    // AES-256-GCM requires a 96-bit (12-byte) initialization vector
    const iv = crypto.randomBytes(12);
    const keyBuffer = Buffer.from(this.masterKey.slice(0, 64), 'hex'); // ensure 32 bytes
    
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: IV:AuthTag:Ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decryptPayload(encryptedPayload) {
    if (!this.masterKey) return encryptedPayload;
    if (!encryptedPayload.includes(':')) return encryptedPayload; // Not encrypted

    try {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) throw new Error('Invalid payload structure');

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      const keyBuffer = Buffer.from(this.masterKey.slice(0, 64), 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[SecureStorage] Vault decryption failed. Tampering detected?', err);
      return '[]'; // Return empty array to prevent crashing the UI
    }
  }

  // â”€â”€â”€ THE VAULT (PASSWORDS) â”€â”€â”€

  getPasswords() {
    this.initializeEncryption();
    try {
      if (!fs.existsSync(this.vaultPath)) return [];
      const encryptedData = fs.readFileSync(this.vaultPath, 'utf8');
      const decryptedData = this.decryptPayload(encryptedData);
      return JSON.parse(decryptedData);
    } catch (err) {
      console.error('[SecureStorage] Error reading vault:', err);
      return [];
    }
  }

  savePassword(pwdEntry) {
    this.initializeEncryption();
    const passwords = this.getPasswords();
    const newEntry = { id: Date.now().toString(), ...pwdEntry };
    passwords.push(newEntry);
    
    const plainText = JSON.stringify(passwords);
    const encryptedData = this.encryptPayload(plainText);
    
    fs.writeFileSync(this.vaultPath, encryptedData, 'utf8');
    return newEntry;
  }

  deletePassword(id) {
    this.initializeEncryption();
    let passwords = this.getPasswords();
    passwords = passwords.filter(p => p.id !== id);
    
    const plainText = JSON.stringify(passwords);
    const encryptedData = this.encryptPayload(plainText);
    
    fs.writeFileSync(this.vaultPath, encryptedData, 'utf8');
    return true;
  }

  // â”€â”€â”€ HISTORY â”€â”€â”€

  getHistory() {
    try {
      if (!fs.existsSync(this.historyPath)) return [];
      const raw = fs.readFileSync(this.historyPath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      return [];
    }
  }

  saveHistoryItem(url, title) {
    const history = this.getHistory();
    history.unshift({ id: Date.now().toString(), url, title, timestamp: Date.now() });
    
    // Cap at 1000 items
    if (history.length > 1000) history.pop();
    
    fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2), 'utf8');
    return history;
  }

  updateHistoryTitle(url, title) {
    const history = this.getHistory();
    if (history.length > 0 && history[0].url === url) {
      history[0].title = title;
      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2), 'utf8');
    }
    return history;
  }

  // â”€â”€â”€ GARGOYLE STATS â”€â”€â”€

  getGargoyleStats() {
    try {
      if (!fs.existsSync(this.gargoylePath)) {
        return { totalAdsBlocked: 0 };
      }
      return JSON.parse(fs.readFileSync(this.gargoylePath, 'utf8'));
    } catch (err) {
      return { totalAdsBlocked: 0 };
    }
  }

  incrementGargoyleBlocked() {
    const stats = this.getGargoyleStats();
    stats.totalAdsBlocked = (stats.totalAdsBlocked || 0) + 1;
    fs.writeFileSync(this.gargoylePath, JSON.stringify(stats, null, 2), 'utf8');
    return stats.totalAdsBlocked;
  }

  // â”€â”€â”€ DIRECTORY â”€â”€â”€

  getDirectory() {
    try {
      if (!fs.existsSync(this.directoryPath)) {
        // Return default directory with fixed URLs
        return [
          { title: 'Horror Movies',       url: 'https://www.imdb.com/feature/genre/horror/' },
          { title: 'Horror Games',        url: 'https://store.steampowered.com/category/horror' },
          { title: 'Haunted Attractions', url: 'https://www.hauntworld.com/' },
          { title: 'Halloween News',      url: 'https://bloody-disgusting.com/' },
          { title: 'Paranormal',          url: 'https://www.reddit.com/r/Paranormal/' },
          { title: 'Urban Legends',       url: 'https://www.snopes.com/tag/urban-legends/' },
          { title: 'Cryptids',            url: 'https://cryptidz.fandom.com/wiki/Cryptidz_Wiki' },
          { title: 'Horror Podcasts',     url: 'https://www.reddit.com/r/horrorpodcasts/' },
          { title: 'Horror Radio',        url: 'https://www.halloweenradio.net/' },
          { title: 'Autumn Recipes',      url: 'https://www.allrecipes.com/recipes/17561/holidays-and-events/halloween/' },
          { title: 'Pumpkin Carving',     url: 'https://www.pumpkinlady.com/' },
          { title: 'Costumes',            url: 'https://www.spirithalloween.com/' },
          { title: 'Seasonal Crafts',     url: 'https://www.pinterest.com/search/pins/?q=halloween+crafts' }
        ];
      }
      return JSON.parse(fs.readFileSync(this.directoryPath, 'utf8'));
    } catch (err) {
      return [];
    }
  }

  saveDirectory(directoryArray) {
    fs.writeFileSync(this.directoryPath, JSON.stringify(directoryArray, null, 2), 'utf8');
    return directoryArray;
  }
}

module.exports = new SecureStorage();
