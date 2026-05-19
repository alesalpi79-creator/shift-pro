const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  // Generate pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));
  console.log('✅ pwa-192x192.png generated');

  // Generate pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));
  console.log('✅ pwa-512x512.png generated');

  // Generate screenshot-wide.png (1280x720 landscape)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .extend({
      top: 104, bottom: 104, left: 384, right: 384,
      background: { r: 99, g: 102, b: 241, alpha: 1 }
    })
    .toFile(path.join(__dirname, 'public', 'screenshot-wide.png'));
  console.log('✅ screenshot-wide.png generated (1280x720)');

  // Generate screenshot-narrow.png (540x960 portrait)
  await sharp(svgBuffer)
    .resize(400, 400)
    .png()
    .extend({
      top: 280, bottom: 280, left: 70, right: 70,
      background: { r: 99, g: 102, b: 241, alpha: 1 }
    })
    .toFile(path.join(__dirname, 'public', 'screenshot-narrow.png'));
  console.log('✅ screenshot-narrow.png generated (540x960)');

  // Verify dimensions
  const sizes = ['pwa-192x192.png','pwa-512x512.png','screenshot-wide.png','screenshot-narrow.png'];
  for (const f of sizes) {
    const meta = await sharp(path.join(__dirname, 'public', f)).metadata();
    console.log(`   ${f}: ${meta.width}x${meta.height} (${meta.format})`);
  }
}

generate().catch(console.error);
