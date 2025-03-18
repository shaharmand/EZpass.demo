const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = [
  'public/data/videos/embeddings',
  'public/data/course/CIV-SAF/content'
];

dirs.forEach(dir => {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Copy video data files
const files = [
  {
    src: 'video_data.json',
    dest: 'public/data/course/CIV-SAF/content/video_data.json'
  },
  {
    src: 'processed_summaries.json',
    dest: 'public/data/videos/embeddings/processed_summaries.json'
  }
];

files.forEach(file => {
  const srcPath = path.resolve(__dirname, '..', file.src);
  const destPath = path.resolve(__dirname, '..', file.dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file.src} to ${file.dest}`);
  } else {
    console.warn(`Warning: Source file ${file.src} not found`);
  }
});

console.log('Video data setup complete!'); 