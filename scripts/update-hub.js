const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'hub', 'projects.json');

// Categories based on common keywords
const CATEGORIES = {
    'Generators': ['generator', 'maker', 'studio', 'builder'],
    'Dashboards': ['dashboard', 'hub', 'admin'],
    'Visual Effects': ['effect', 'reveal', 'spotlight', 'animation', 'cursor', 'blob', 'neumorphism', 'glassmorphism'],
    'Cards': ['card', 'profile', 'list'],
    'Interactives': ['game', 'quiz', 'toggle', 'bulb', 'interactive'],
    'UI Components': ['progress', 'bar', 'kit', 'nav', 'faq', 'gallery', 'pricing'],
    'Utilities': ['weather', 'finder', 'profile', 'calc']
};

function getCategory(projectName) {
    const lowerName = projectName.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            return category;
        }
    }
    return 'Miscellaneous';
}

function getTechTags(dirPath) {
    const tags = [];
    const htmlPath = path.join(dirPath, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8').toLowerCase();
        if (htmlContent.includes('tailwind')) tags.push('Tailwind');
        if (htmlContent.includes('canvas')) tags.push('Canvas');
        if (htmlContent.includes('fetch(') || htmlContent.includes('api')) tags.push('API');
        if (htmlContent.includes('glassmorphism')) tags.push('Glass');
        if (htmlContent.includes('localstorage')) tags.push('Storage');
    }

    if (fs.existsSync(path.join(dirPath, 'style.css')) || fs.existsSync(path.join(dirPath, 'css'))) {
        tags.push('CSS');
    }
    
    if (fs.existsSync(path.join(dirPath, 'script.js')) || fs.existsSync(path.join(dirPath, 'javascript')) || fs.existsSync(path.join(dirPath, 'js'))) {
        tags.push('JS');
    }
    
    if (tags.length === 0) tags.push('HTML');

    return tags;
}

function getProjectStats(dirPath) {
    let linesJs = 0;
    let linesCss = 0;
    let linesHtml = 0;
    
    // helper to count lines
    const countLines = (filePath) => {
        if (!fs.existsSync(filePath)) return 0;
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return content.split('\n').filter(line => line.trim().length > 0).length;
        } catch(e) { return 0; }
    };

    const checkDir = (currentPath) => {
        if (!fs.existsSync(currentPath)) return;
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                if(!entry.name.includes('node_modules') && !entry.name.includes('.git')) {
                    checkDir(entryPath);
                }
            } else {
                if (entry.name.endsWith('.js')) linesJs += countLines(entryPath);
                else if (entry.name.endsWith('.css')) linesCss += countLines(entryPath);
                else if (entry.name.endsWith('.html')) linesHtml += countLines(entryPath);
            }
        }
    };
    
    checkDir(dirPath);
    
    let addedAt = new Date().toISOString();
    try {
        const stat = fs.statSync(dirPath);
        addedAt = stat.mtime.toISOString();
    } catch(e) {}
    
    return {
        linesJs,
        linesCss,
        linesHtml,
        totalLines: linesJs + linesCss + linesHtml,
        addedAt
    };
}

function updateHub() {
    const items = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    
    const projects = items
        .filter(item => item.isDirectory() && /^\d+\./.test(item.name))
        .map(item => {
            const name = item.name;
            const cleanName = name.replace(/^\d+\./, '').trim();
            const number = parseInt(name.split('.')[0]);
            const dirPath = path.join(ROOT_DIR, name);
            const stats = getProjectStats(dirPath);
            
            return {
                id: name,
                number: number,
                name: cleanName,
                category: getCategory(cleanName),
                path: `../${name}/index.html`,
                tags: getTechTags(dirPath),
                stats: stats
            };
        })
        .sort((a, b) => a.number - b.number);

    const data = {
        lastUpdated: new Date().toISOString(),
        projects: projects,
        stats: {
            total: projects.length,
            categories: [...new Set(projects.map(p => p.category))].length,
            totalLinesOfCode: projects.reduce((acc, p) => acc + p.stats.totalLines, 0),
            latestProject: projects.length > 0 ? projects[projects.length - 1].name : 'Unknown',
            longestCodeProject: projects.reduce((max, p) => p.stats.totalLines > max.stats.totalLines ? p : max, projects[0])?.name || 'Unknown'
        }
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${DATA_FILE} with ${projects.length} projects.`);
}

updateHub();
