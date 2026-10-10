# Bowling PWA — b1v1

This is the initial visual prototype. It includes:
- Header with `b1v1` at the far left, centered Bowling title, and a 20 × 20 px Settings gear at the right.
- Actions menu: Add, Change, Delete, Import, Export, Quit. The menu closes after an item is selected.
- Settings display with a Return to Home button.
- Cute bowling home illustration centered below the menu, constrained to 90% of the available width and 75% of the display height, with no cropping or distortion.
- PWA manifest and service worker for installation and offline launch after the first successful load.

Database tables and data-entry screens are intentionally not included yet. Actions are placeholders; Import/Export will be implemented when BowlingDB is added.

## Publish with GitHub Pages
1. Extract the ZIP.
2. Upload the contents of this folder to the root of your GitHub repository (so `index.html` is at the repository root).
3. In GitHub, open **Settings → Pages** and publish from your chosen branch and root folder.
4. Open the published HTTPS site in your phone's browser, then use the browser menu's **Install app** or **Add to Home screen** option.

For the service worker and installation features, use the HTTPS GitHub Pages address rather than opening `index.html` directly from the device's file manager.
