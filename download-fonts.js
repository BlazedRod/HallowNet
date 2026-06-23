import fs from 'fs';
import path from 'path';
import https from 'https';

const FONTS_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts');
const CSS_FILE = path.join(process.cwd(), 'src', 'styles', 'fonts.css');

if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

// Ensure the styles directory exists
const STYLES_DIR = path.dirname(CSS_FILE);
if (!fs.existsSync(STYLES_DIR)) {
  fs.mkdirSync(STYLES_DIR, { recursive: true });
}

const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Creepster&family=Cinzel:wght@400;700&display=block';

function fetch(url, options) {
  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve({
        headers: res.headers,
        text: () => Promise.resolve(Buffer.concat(data).toString('utf8')),
        buffer: () => Promise.resolve(Buffer.concat(data))
      }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching Google Fonts CSS...');
  // Must masquerade as a modern browser to get woff2
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
  let cssText = await res.text();

  const urls = [];
  const regex = /url\((https:\/\/[^)]+)\)/g;
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} font files to download.`);
  
  let i = 0;
  for (const fontUrl of urls) {
    const fontRes = await fetch(fontUrl);
    const buffer = await fontRes.buffer();
    
    // Create a local filename
    const filename = `font-${i}.woff2`;
    const localPath = path.join(FONTS_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    
    // Replace URL in CSS
    // The CSS might be used in src/index.css or src/styles/fonts.css.
    // If we use src/styles/fonts.css, the relative path to assets/fonts is ../assets/fonts/font-i.woff2
    cssText = cssText.replace(fontUrl, `../assets/fonts/${filename}`);
    
    i++;
  }

  fs.writeFileSync(CSS_FILE, cssText);
  console.log('Done! Generated src/styles/fonts.css');
}

run().catch(console.error);
