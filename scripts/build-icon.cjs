const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// We'll create an ICO from scratch by generating PNG buffers at multiple sizes
// and packing them into a valid ICO file format.

// Orange ghost SVG - clean, standalone ghost shape in HallowNet orange
const ghostSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="bodyGrad" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#ff8833"/>
      <stop offset="100%" stop-color="#cc3300"/>
    </radialGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff6600" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ff6600" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Outer glow -->
  <ellipse cx="128" cy="128" rx="110" ry="110" fill="url(#glowGrad)"/>
  
  <!-- Ghost body -->
  <path d="
    M 128 20
    C 72 20, 36 58, 36 112
    L 36 210
    Q 36 218, 44 218
    Q 52 218, 56 210
    L 64 196
    Q 68 188, 74 196
    L 82 210
    Q 86 218, 92 218
    Q 98 218, 102 210
    L 110 196
    Q 114 188, 120 196
    L 128 212
    L 136 196
    Q 142 188, 148 196
    L 156 210
    Q 160 218, 166 218
    Q 172 218, 176 210
    L 184 196
    Q 188 188, 194 196
    L 202 210
    Q 206 218, 214 218
    Q 222 218, 220 210
    L 220 112
    C 220 58, 184 20, 128 20
    Z
  " fill="url(#bodyGrad)" filter="url(#glow)"/>
  
  <!-- Left eye -->
  <ellipse cx="100" cy="105" rx="18" ry="20" fill="#0a0612"/>
  <ellipse cx="106" cy="99" rx="6" ry="6" fill="white" opacity="0.6"/>
  
  <!-- Right eye -->
  <ellipse cx="156" cy="105" rx="18" ry="20" fill="#0a0612"/>
  <ellipse cx="162" cy="99" rx="6" ry="6" fill="white" opacity="0.6"/>
  
  <!-- Mouth - spooky smile -->
  <path d="M 100 148 Q 115 162, 128 148 Q 141 162, 156 148" stroke="#0a0612" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;

async function buildIco() {
  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(Buffer.from(ghostSVG))
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
  }

  // Pack into ICO format manually
  // ICO header: 6 bytes
  // Directory entries: 16 bytes each
  // PNG data follows

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);  // reserved
  header.writeUInt16LE(1, 2);  // type: 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // image count

  const dirEntries = [];
  const imageDataBuffers = [];
  let dataOffset = 6 + pngBuffers.length * 16;

  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);  // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1);  // height
    entry.writeUInt8(0, 2);   // color palette count
    entry.writeUInt8(0, 3);   // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(dataOffset, 12); // offset to image data
    dirEntries.push(entry);
    imageDataBuffers.push(buf);
    dataOffset += buf.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageDataBuffers]);
  const outPath = path.join(__dirname, '../public/icon.ico');
  fs.writeFileSync(outPath, icoBuffer);
  console.log('✅ icon.ico created at', outPath);
}

buildIco().catch(console.error);
