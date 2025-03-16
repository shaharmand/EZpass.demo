// Desktop and Laptop Screen Presets
const desktopPresets = [
  {
    name: "4K Monitor",
    width: 3840,
    height: 2160,
    deviceScaleFactor: 2,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "2K Monitor",
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1.5,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "Full HD",
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "HD+ Display",
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "Standard Laptop",
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "MacBook Pro 16",
    width: 3456,
    height: 2234,
    deviceScaleFactor: 2,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "MacBook Pro 14",
    width: 3024,
    height: 1964,
    deviceScaleFactor: 2,
    userAgent: "Desktop",
    type: "desktop"
  },
  {
    name: "Surface Laptop",
    width: 2256,
    height: 1504,
    deviceScaleFactor: 1.5,
    userAgent: "Desktop",
    type: "desktop"
  }
];

// Function to add presets to Chrome DevTools
function addDevicePresets() {
  // This needs to be run in Chrome DevTools Console
  if (typeof chrome !== 'undefined' && chrome.devtools) {
    desktopPresets.forEach(preset => {
      chrome.devtools.panels.emulation.createDevice(preset);
    });
    console.log('Added desktop presets to Device Toolbar');
  } else {
    console.log('Please run this script in Chrome DevTools Console');
  }
}

// Instructions for adding presets manually
console.log(`
To add these presets manually in Chrome DevTools:

1. Open DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Click the devices dropdown
4. Click "Edit"
5. Click "Add custom device"
6. Add each preset with these settings:

${desktopPresets.map(preset => `
${preset.name}:
- Width: ${preset.width}
- Height: ${preset.height}
- Device Pixel Ratio: ${preset.deviceScaleFactor}
`).join('\n')}
`); 