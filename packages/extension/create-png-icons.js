const fs = require('fs');
const path = require('path');

// Minimal 1x1 blue PNG as base64
const bluePNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Create icons of different sizes (all will be 1x1 for now - browser will scale)
const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'public', 'icons');

sizes.forEach(size => {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), bluePNG);
  console.log(`Created icon${size}.png`);
});

console.log('PNG icons created successfully!');
console.log('Note: These are minimal placeholder icons. Use generate-icons.html to create proper ones.');
