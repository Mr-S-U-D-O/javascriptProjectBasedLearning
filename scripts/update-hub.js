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

function updateHub() {
    const items = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    
    const projects = items
        .filter(item => item.isDirectory() && /^\d+\./.test(item.name))
        .map(item => {
            const name = item.name;
            const cleanName = name.replace(/^\d+\./, '').trim();
            const number = parseInt(name.split('.')[0]);
            const dirPath = path.join(ROOT_DIR, name);
            
            return {
                id: name,
                number: number,
                name: cleanName,
                category: getCategory(cleanName),
                path: `../${name}/index.html`,
                tags: getTechTags(dirPath)
            };
        })
        .sort((a, b) => a.number - b.number);

    const data = {
        lastUpdated: new Date().toISOString(),
        projects: projects,
        stats: {
            total: projects.length,
            categories: [...new Set(projects.map(p => p.category))].length
        }
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${DATA_FILE} with ${projects.length} projects.`);
}

updateHub();
