const fs = require('fs');
const path = require('path');

// Simple blue square PNG data
function createIcon(size) {
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#007bff"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.5}" 
            fill="white" text-anchor="middle" dominant-baseline="middle" 
            font-weight="bold">RP</text>
    </svg>
  `;
  return canvas;
}

// For now, create SVG files (Chrome supports them)
const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'public', 'icons');

sizes.forEach(size => {
  const svg = createIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg);
  console.log(`Created icon${size}.svg`);
});

console.log('Icons created successfully!');
