const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🤖 HUB-WATCHER: Active and scanning for new directories... (Press Ctrl+C to stop)');

let debounceTimer;

fs.watch(ROOT_DIR, (eventType, filename) => {
    // Check if the change looks like a new project folder (e.g. "30.NewProject")
    if (filename && /^\d+\./.test(filename)) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log(`\nDetected system change in -> [${filename}]`);
            console.log('Running update script...');
            try {
                // Execute the update script synchronously
                execSync('node scripts/update-hub.js', { stdio: 'inherit', cwd: ROOT_DIR });
                console.log('Hub update complete.');
            } catch (error) {
                console.error('Failed to auto-update hub:', error.message);
            }
        }, 1000); // Wait 1s so the folder has time to be fully created before we scan it
    }
});
