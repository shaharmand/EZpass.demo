// Create a new panel in Chrome DevTools
chrome.devtools.panels.create(
  "Screen Presets",           // Panel title
  "",                        // Panel icon (empty for now)
  "panel.html",              // Panel page
  function(panel) {
    console.log("Desktop Screen Presets panel created");
  }
); 