// Desktop and Laptop Screen Presets
const desktopPresets = [
  {
    name: "4K Monitor",
    width: 3840,
    height: 2160,
    deviceScaleFactor: 2,
    type: "monitor"
  },
  {
    name: "2K Monitor",
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1.5,
    type: "monitor"
  },
  {
    name: "Full HD",
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    type: "monitor"
  },
  {
    name: "HD+ Display",
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    type: "monitor"
  },
  {
    name: "MacBook Pro 16",
    width: 3456,
    height: 2234,
    deviceScaleFactor: 2,
    type: "laptop"
  },
  {
    name: "MacBook Pro 14",
    width: 3024,
    height: 1964,
    deviceScaleFactor: 2,
    type: "laptop"
  },
  {
    name: "Surface Laptop",
    width: 2256,
    height: 1504,
    deviceScaleFactor: 1.5,
    type: "laptop"
  },
  {
    name: "Standard Laptop",
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    type: "laptop"
  }
];

// Function to apply device preset
function applyPreset(preset) {
  // Send message to DevTools to update device dimensions
  chrome.devtools.inspectedWindow.eval(`
    (() => {
      // Set viewport size
      const targetWidth = ${preset.width};
      const targetHeight = ${preset.height};
      
      // Get DevTools API
      const deviceModeModel = window.UI?.panels?.elements?.DeviceModeModel;
      if (deviceModeModel) {
        deviceModeModel.setWidth(targetWidth);
        deviceModeModel.setHeight(targetHeight);
        deviceModeModel.setDeviceScaleFactor(${preset.deviceScaleFactor});
      }
    })()
  `);
}

// Create and display device cards
const deviceList = document.getElementById('deviceList');

desktopPresets.forEach(preset => {
  const card = document.createElement('div');
  card.className = 'device-card';
  card.onclick = () => applyPreset(preset);
  
  const name = document.createElement('div');
  name.className = 'device-name';
  name.textContent = preset.name;
  
  const specs = document.createElement('div');
  specs.className = 'device-specs';
  specs.textContent = `${preset.width} × ${preset.height} (${preset.deviceScaleFactor}x)`;
  
  const type = document.createElement('div');
  type.className = 'device-type';
  type.textContent = preset.type.charAt(0).toUpperCase() + preset.type.slice(1);
  
  card.appendChild(name);
  card.appendChild(specs);
  card.appendChild(type);
  deviceList.appendChild(card);
}); 