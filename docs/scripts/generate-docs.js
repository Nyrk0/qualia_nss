const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '../wiki/api');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Run JSDoc to generate API documentation
try {
  console.log('Generating API documentation...');
  
  // Install JSDoc if not already installed
  try {
    require.resolve('jsdoc');
  } catch (e) {
    console.log('Installing JSDoc...');
    execSync('npm install --save-dev jsdoc', { stdio: 'inherit' });
  }

  // Generate documentation
  execSync(`npx jsdoc -r -c ${path.join(__dirname, 'jsdoc.config.json')} -d ${outputDir}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });
  
  console.log('API documentation generated successfully!');
} catch (error) {
  console.error('Error generating documentation:', error);
  process.exit(1);
}
