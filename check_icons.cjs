const fs = require('fs');

function detectFormat(filepath) {
  const buf = fs.readFileSync(filepath);
  const header = buf.slice(0, 16).toString('hex');
  const headerStr = buf.slice(0, 4).toString('binary');
  
  let format = 'unknown';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    format = 'PNG';
    // Standard PNG: IHDR at offset 16
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    console.log(`${filepath}: PNG ${w}x${h}, bytes: ${buf.length}`);
  } else if (buf[0] === 0xFF && buf[1] === 0xD8) {
    format = 'JPEG';
    console.log(`${filepath}: JPEG, bytes: ${buf.length}`);
  } else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    format = 'WebP';
    console.log(`${filepath}: WebP, bytes: ${buf.length}`);
  } else {
    console.log(`${filepath}: UNKNOWN format, header: ${header}, bytes: ${buf.length}`);
  }
}

detectFormat('public/pwa-192x192.png');
detectFormat('public/pwa-512x512.png');
detectFormat('public/favicon.png');
