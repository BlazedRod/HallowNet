const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function createBMP(width, height, rawData) {
    const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
    const dataSize = rowSize * height;
    const fileSize = 54 + dataSize;
    
    const buffer = Buffer.alloc(fileSize);
    
    // Header
    buffer.write('BM', 0);
    buffer.writeUInt32LE(fileSize, 2);
    buffer.writeUInt32LE(0, 6);
    buffer.writeUInt32LE(54, 10);
    
    // DIB Header
    buffer.writeUInt32LE(40, 14);
    buffer.writeUInt32LE(width, 18);
    buffer.writeUInt32LE(height, 22);
    buffer.writeUInt16LE(1, 26);
    buffer.writeUInt16LE(24, 28);
    buffer.writeUInt32LE(0, 30);
    buffer.writeUInt32LE(dataSize, 34);
    buffer.writeUInt32LE(2835, 38);
    buffer.writeUInt32LE(2835, 42);
    buffer.writeUInt32LE(0, 46);
    buffer.writeUInt32LE(0, 50);
    
    // Pixels (BMP stores rows bottom-to-top)
    let offset = 54;
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const rawOffset = (y * width + x) * 4; // Sharp outputs RGBA (4 channels)
            const r = rawData[rawOffset];
            const g = rawData[rawOffset + 1];
            const b = rawData[rawOffset + 2];
            
            buffer.writeUInt8(b, offset++);
            buffer.writeUInt8(g, offset++);
            buffer.writeUInt8(r, offset++);
        }
        // padding
        for (let p = width * 3; p < rowSize; p++) {
            buffer.writeUInt8(0, offset++);
        }
    }
    
    return buffer;
}

async function createBanners() {
  const ghostSvgStr = `
    <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z"
        fill="#301A40"
        stroke="#8B5CF6"
        stroke-width="2"
      />
      <circle cx="28" cy="36" r="6" fill="#D8B4FE" />
      <circle cx="52" cy="36" r="6" fill="#D8B4FE" />
    </svg>
  `;

  const sidebarSvg = `
    <svg width="164" height="314" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#140A1E" />
          <stop offset="100%" stop-color="#050308" />
        </linearGradient>
      </defs>
      <rect width="164" height="314" fill="url(#bg)" />
      
      <!-- HallowNet text -->
      <text x="-250" y="82" transform="rotate(-90)" font-family="Arial" font-weight="bold" font-size="20" fill="#E9D5FF" letter-spacing="8" opacity="0.9">HALLOWNET</text>
    </svg>
  `;

  const headerSvg = `
    <svg width="150" height="57" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hbg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#050308" />
          <stop offset="100%" stop-color="#140A1E" />
        </linearGradient>
      </defs>
      <rect width="150" height="57" fill="url(#hbg)" />
      
      <text x="45" y="34" font-family="Arial" font-weight="bold" font-size="14" fill="#E9D5FF" letter-spacing="1">HallowNet</text>
    </svg>
  `;

  try {
    // Render the base svgs
    const baseSidebar = await sharp(Buffer.from(sidebarSvg)).toBuffer();
    const baseHeader = await sharp(Buffer.from(headerSvg)).toBuffer();

    // Load and resize the actual inline ghost
    const ghostIconLarge = await sharp(Buffer.from(ghostSvgStr))
      .resize(80, 80)
      .toBuffer();

    const ghostIconSmall = await sharp(Buffer.from(ghostSvgStr))
      .resize(24, 24)
      .toBuffer();

    // Composite them
    const sbRaw = await sharp(baseSidebar)
      .composite([{ input: ghostIconLarge, top: 120, left: 42 }])
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    fs.writeFileSync(path.join(__dirname, 'installer-sidebar.bmp'), createBMP(sbRaw.info.width, sbRaw.info.height, sbRaw.data));

    const hdrRaw = await sharp(baseHeader)
      .composite([{ input: ghostIconSmall, top: 16, left: 12 }])
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    fs.writeFileSync(path.join(__dirname, 'installer-header.bmp'), createBMP(hdrRaw.info.width, hdrRaw.info.height, hdrRaw.data));

    console.log('AAA BMP assets generated successfully!');
  } catch (err) {
    console.error('Error with sharp:', err);
  }
}

createBanners();
