const sharp = require('sharp');
const path = require('path');

async function createSplash() {
  const splashSvg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1F102A" />
          <stop offset="100%" stop-color="#050308" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)" />
      
      <!-- Ethereal Glow -->
      <circle cx="200" cy="120" r="80" fill="#6B21A8" opacity="0.3" filter="blur(15px)" />
      
      <!-- Ghost/Gargoyle minimal emblem -->
      <path d="M 200 60 C 140 60, 120 120, 120 180 C 120 230, 150 280, 200 310 C 250 280, 280 230, 280 180 C 280 120, 260 60, 200 60 Z" fill="#301A40" opacity="0.8" />
      <path d="M 200 70 C 150 70, 130 130, 130 180 C 130 220, 160 260, 200 290 C 240 260, 270 220, 270 180 C 270 130, 250 70, 200 70 Z" fill="#6B21A8" opacity="0.5" />
      
      <circle cx="180" cy="140" r="10" fill="#E9D5FF" opacity="0.9" />
      <circle cx="220" cy="140" r="10" fill="#E9D5FF" opacity="0.9" />
      
      <text x="200" y="260" font-family="Arial" font-weight="bold" font-size="28" fill="#D8B4FE" letter-spacing="8" text-anchor="middle" opacity="0.9">HALLOWNET</text>
      <text x="200" y="285" font-family="Arial" font-size="12" fill="#E9D5FF" letter-spacing="2" text-anchor="middle" opacity="0.5">M A N I F E S T I N G . . .</text>
    </svg>
  `;

  try {
    await sharp(Buffer.from(splashSvg))
      .gif()
      .toFile(path.join(__dirname, 'loading.gif'));

    console.log('Squirrel splash screen (loading.gif) generated successfully!');
  } catch (err) {
    console.error('Error generating splash screen:', err);
  }
}

createSplash();
