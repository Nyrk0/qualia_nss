const fs = require('fs-extra');
const path = require('path');

// Source and destination directories
const srcDir = path.join(__dirname, '../src/wiki/public');
const destDir = path.join(__dirname, '../public/wiki');

// Ensure destination directory exists
fs.ensureDirSync(destDir);

// Copy files from src/wiki/public to public/wiki
fs.copySync(srcDir, destDir, { overwrite: true });

console.log('Wiki files copied to public directory');
