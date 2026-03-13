const { spawn, execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('>>> [ SYSTEM STARTUP INITIATED ] <<<');

// 1. Initial Data Compile
console.log('[1/3] Compiling Project Data (update-hub.js)...');
try {
    execSync('node scripts/update-hub.js', { stdio: 'inherit', cwd: ROOT_DIR });
} catch (e) {
    console.error('Failed to compile data:', e.message);
}

// 2. Start Auto-Watcher
console.log('[2/3] Engaging Auto-Build Watcher...');
const watcher = spawn('node', ['scripts/watch-hub.js'], { 
    cwd: ROOT_DIR, 
    stdio: 'inherit' 
});

// 3. Spawns Local HTTP Server
console.log('[3/3] Deploying Local Server (http-server)...');
const server = spawn('npx', ['--yes', 'http-server', '-p', '8080'], { 
    cwd: ROOT_DIR, 
    stdio: 'inherit',
    shell: true 
});

setTimeout(() => {
    console.log('\n=========================================================');
    console.log('🚀 SYSTEM ONLINE! Access your Hub at: http://localhost:8080/hub');
    console.log('👀 The auto-watcher is monitoring for new project folders.');
    console.log('   (Press Ctrl+C to terminate all processes)');
    console.log('=========================================================\n');
}, 1500);

// Cleanup processes on exit
process.on('SIGINT', () => {
    console.log('\n[ SYSTEM SHUTDOWN INITIATED ]');
    watcher.kill();
    server.kill();
    process.exit();
});
