const sharp = require('sharp');
const fs = require('fs');

async function processFog() {
  console.log("Loading fog image...");
  const metadata = await sharp('public/fog.png').metadata();
  const { width, height } = metadata;
  
  console.log(`Image size: ${width}x${height}`);
  
  const maskSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0" />
          <stop offset="35%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#fade)" />
    </svg>
  `;

  console.log("Applying alpha mask...");
  await sharp('public/fog.png')
    .composite([{
      input: Buffer.from(maskSvg),
      blend: 'dest-in'
    }])
    .toFile('public/fog-masked.png');
    
  console.log("Done! Replacing original file...");
  fs.copyFileSync('public/fog-masked.png', 'public/fog.png');
  fs.unlinkSync('public/fog-masked.png');
  console.log("Fog masked successfully!");
}

processFog().catch(console.error);
