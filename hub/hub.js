import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Theme Setup ---
    const savedTheme = localStorage.getItem('hub-theme') || 'modern';
    document.body.className = savedTheme === 'modern' ? '' : `theme-${savedTheme}`;
    
    const mainContainer = document.getElementById('hub-main');
    const statsDashboard = document.getElementById('stats-dashboard');
    const guideDashboard = document.getElementById('guide-dashboard');
    const historyDashboard = document.getElementById('history-dashboard');
    const contributeDashboard = document.getElementById('contribute-dashboard');
    const contributorsDashboard = document.getElementById('contributors-dashboard');
    const helpDropdown = document.getElementById('help-dropdown');
    const aiChatDashboard = document.getElementById('ai-chat-dashboard');
    const learnDashboard = document.getElementById('learn-dashboard');
    const ideaDashboard = document.getElementById('idea-dashboard');
    
    const closeStatsBtn = document.getElementById('close-stats');
    const closeGuideBtn = document.getElementById('close-guide');
    const closeHistoryBtn = document.getElementById('close-history');
    const closeContributeBtn = document.getElementById('close-contribute');
    const closeContributorsBtn = document.getElementById('close-contributors');
    const totalProjectsEl = document.getElementById('total-projects');
    const totalCategoriesEl = document.getElementById('total-categories');
    const searchInput = document.getElementById('search-input');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const ghostText = document.getElementById('ghost-text');
    const toggleSoundscapeBtn = document.getElementById('toggle-soundscape');
    const achievementContainer = document.getElementById('achievement-container');

    let data = { projects: [], stats: {} }; // Move data to outer scope for global access
    const COMMANDS = ['help', 'stats', 'guide', 'contribute', 'contributors', 'history', 'clear', 'matrix', 'socials', 'blog', 'feedback', 'settings', 'arcade', 'themes', 'resources', 'license', 'support', 'changelog', 'enable-ai', 'disable-ai', 'enable ai', 'disable ai', 'ask', 'learn', 'idea'];


    // --- Audio System ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let isMuted = false;

    const initAudio = () => {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };

    // --- Soundscape (Ambient Hum) ---
    let soundscapeNode = null;
    let isSoundscapeOn = false;

    const startSoundscape = () => {
        if (!audioCtx) initAudio();
        if (soundscapeNode) return;

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 2); // Fade in

        // Create a rich drone using multiple oscillators
        const frequencies = [55, 110, 165, 220]; // A1, A2, E3, A3
        const oscillators = frequencies.map(f => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, audioCtx.currentTime);

            // Add slight detune for richness
            osc.detune.setValueAtTime(Math.random() * 10 - 5, audioCtx.currentTime);

            // Lowpass filter to keep it "hum-like" and not buzzing
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, audioCtx.currentTime);

            osc.connect(filter);
            filter.connect(gainNode);
            return osc;
        });

        gainNode.connect(audioCtx.destination);
        oscillators.forEach(o => o.start());
        soundscapeNode = { gainNode, oscillators };
    };

    const stopSoundscape = () => {
        if (!soundscapeNode) return;
        const { gainNode, oscillators } = soundscapeNode;
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); // Fade out
        setTimeout(() => {
            oscillators.forEach(o => o.stop());
            soundscapeNode = null;
        }, 1100);
    };

    if (toggleSoundscapeBtn) {
        toggleSoundscapeBtn.addEventListener('click', () => {
            isSoundscapeOn = !isSoundscapeOn;
            toggleSoundscapeBtn.textContent = `SOUND: ${isSoundscapeOn ? 'ON' : 'OFF'}`;
            toggleSoundscapeBtn.classList.toggle('active', isSoundscapeOn);
            if (isSoundscapeOn) {
                startSoundscape();
                unlockAchievement('TECHNICIAN', 'Atmospheric Technician', '📻');
            }
            else stopSoundscape();
        });
    }

    const playSound = (type, theme = document.body.className.replace('theme-', '') || 'modern') => {
        if (!audioCtx || isMuted) return;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        if (type === 'type') {
            osc.type = theme === 'matrix' ? 'square' : 'sine';
            osc.frequency.setValueAtTime(theme === 'matrix' ? 400 : 800, now);
            osc.frequency.exponentialRampToValueAtTime(theme === 'matrix' ? 200 : 600, now + 0.05);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); 
            osc.stop(now + 0.05);
        } else if (type === 'hover') {
            osc.type = theme === 'matrix' ? 'sawtooth' : (theme === 'paper' ? 'sine' : 'triangle');
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gainNode.gain.setValueAtTime(0.02, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); 
            osc.stop(now + 0.1);
        } else if (type === 'switch') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.linearRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    };

    // Initialize audio on first user interaction
    document.body.addEventListener('click', initAudio, { once: true });
    document.body.addEventListener('keydown', initAudio, { once: true });

    themeBtns.forEach(btn => {
        if (btn.id === 'close-stats') return;
        
        // Mark active theme button on load
        const theme = btn.getAttribute('data-theme');
        if ((theme === 'modern' && !document.body.className) || document.body.className === `theme-${theme}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        btn.addEventListener('click', () => {
            initAudio(); // ensure audio is ready
            themeBtns.forEach(b => { 
                if(b.id !== 'close-stats' && b.id !== 'toggle-soundscape') b.classList.remove('active');
            });
            btn.classList.add('active');
            const theme = btn.getAttribute('data-theme');
            if (theme) {
                document.body.className = theme === 'modern' ? '' : `theme-${theme}`;
                localStorage.setItem('hub-theme', theme);
                playSound('switch', theme);

                // --- HIDDEN ACHIEVEMENT: THEME_EXPLORER ---
                const usedThemes = JSON.parse(localStorage.getItem('used-themes') || '[]');
                if (!usedThemes.includes(theme)) {
                    usedThemes.push(theme);
                    localStorage.setItem('used-themes', JSON.stringify(usedThemes));
                    if (usedThemes.length >= 3) {
                        unlockAchievement('THEME_MASTER', 'Interface Specialist', '🎨');
                    }
                }
                if (theme === 'matrix') unlockAchievement('ENTERING_MATRIX', 'Digital Nomad', '🕶️');
            }
        });
    });

    // --- Achievements ---
    const UNLOCKED_ACHIEVEMENTS = new Set(JSON.parse(localStorage.getItem('hub-achievements') || '[]'));

    const unlockAchievement = (id, title, icon) => {
        if (UNLOCKED_ACHIEVEMENTS.has(id)) return;
        UNLOCKED_ACHIEVEMENTS.add(id);
        localStorage.setItem('hub-achievements', JSON.stringify([...UNLOCKED_ACHIEVEMENTS]));

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-badge">${icon}</div>
            <div class="achievement-info">
                <span class="achievement-label">ACHIEVEMENT UNLOCKED</span>
                <span class="achievement-title">${title}</span>
            </div>
        `;
        achievementContainer.appendChild(toast);
        playSound('switch');

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    };

    unlockAchievement('FIRST_BOOT', 'System Initialized', '⚡');

    // --- HIDDEN ACHIEVEMENT: NIGHT_OWL ---
    const hour = new Date().getHours();
    if (hour >= 23 || hour <= 4) {
        unlockAchievement('NIGHT_OWL', 'Midnight Coder', '🌙');
    }

    // Typewriter Utility
    const typeWriter = async (element, text, speed = 40) => {
        element.textContent = '';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text.charAt(i);
            await new Promise(r => setTimeout(r, speed));
        }
    };

    // --- Stats Dashboard Renderer ---
    const renderStats = (data) => {
        // Build language graph
        const langCounts = {};
        data._meta.allTags.forEach(t => {
            if(['html','css','js','tailwind','canvas'].includes(t)) {
                langCounts[t] = (langCounts[t] || 0) + 1;
            }
        });
        
        const totalTags = Object.values(langCounts).reduce((a,b)=>a+b, 0);
        const graphsContainer = document.getElementById('stats-graphs');
        graphsContainer.innerHTML = '';
        
        Object.entries(langCounts).sort((a,b) => b[1] - a[1]).forEach(([lang, count]) => {
            const pct = Math.round((count / totalTags) * 100);
            const row = document.createElement('div');
            row.className = 'graph-row';
            row.innerHTML = `
                <div class="graph-label">${lang.toUpperCase()}</div>
                <div class="graph-bar-container">
                    <div class="graph-bar" style="width: 0%"></div>
                </div>
                <div class="graph-percent">${pct}%</div>
            `;
            graphsContainer.appendChild(row);
            
            // animate
            setTimeout(() => {
                row.querySelector('.graph-bar').style.width = `${pct}%`;
            }, 50);
        });

        document.getElementById('stat-total-projects').textContent = data.stats.total;
        document.getElementById('stat-categories').textContent = data.stats.categories;
        document.getElementById('stat-loc').textContent = data.stats.totalLinesOfCode.toLocaleString();
        document.getElementById('stat-longest-project').textContent = data.stats.longestCodeProject;
        document.getElementById('stat-latest-project').textContent = data.stats.latestProject;
    };

    try {
        const response = await fetch('projects.json');
        data = await response.json();

        // Update top header stats
        totalProjectsEl.textContent = data.stats.total.toString().padStart(2, '0');
        totalCategoriesEl.textContent = data.stats.categories.toString().padStart(2, '0');

        // Extract all tags for stats
        const allTags = [];
        const groups = data.projects.reduce((acc, project) => {
            if (!acc[project.category]) acc[project.category] = [];
            acc[project.category].push(project);
            if(project.tags) allTags.push(...project.tags);
            return acc;
        }, {});
        
        data._meta = { allTags: allTags.map(t => t.toLowerCase()) };

        // Clear loading state
        mainContainer.innerHTML = '';

        // Render groups
        Object.entries(groups).forEach(([category, projects]) => {
            const groupEl = document.createElement('section');
            groupEl.className = 'category-group';
            groupEl.dataset.category = category.toLowerCase();
            
            groupEl.innerHTML = `
                <div class="category-header">
                    <span class="cat-title" data-title="${category}"></span>
                    <span>[${projects.length}]</span>
                </div>
                <ul class="project-list">
                    ${projects.map(project => `
                        <li class="project-item" data-name="${project.name.toLowerCase()}" data-tags="${(project.tags || []).join(' ').toLowerCase()}">
                            <a href="${project.path}" class="project-link">
                                <span class="project-name">${project.name}</span>
                                <div class="project-meta">
                                    ${(project.tags || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                                    <span class="project-number">#${project.number.toString().padStart(2, '0')}</span>
                                </div>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            mainContainer.appendChild(groupEl);
        });

        // Add hover sounds
        document.querySelectorAll('.project-link').forEach(link => {
            link.addEventListener('mouseenter', () => playSound('hover'));
        });

        // Trigger Typewriter effect on headers after slight delay
        setTimeout(() => {
            document.querySelectorAll('.cat-title').forEach(el => {
                const title = el.getAttribute('data-title');
                typeWriter(el, title, 50);
            });
        }, 100);

        // Dashboard Navigation
        const hideAllDashboards = () => {
            statsDashboard.style.display = 'none';
            guideDashboard.style.display = 'none';
            historyDashboard.style.display = 'none';
            contributeDashboard.style.display = 'none';
            if (contributorsDashboard) contributorsDashboard.style.display = 'none';
            if (helpDropdown) helpDropdown.style.display = 'none';
            if (aiChatDashboard) aiChatDashboard.style.display = 'none';
            if (learnDashboard) learnDashboard.style.display = 'none';
            if (ideaDashboard) ideaDashboard.style.display = 'none';
            mainContainer.style.display = 'block';
        };

        const resetUI = () => {
            hideAllDashboards();
            searchInput.value = '';
            searchInput.focus();
            playSound('type');
            
            // Re-show all
            document.querySelectorAll('.category-group').forEach(group => {
                group.style.display = 'flex';
                group.querySelectorAll('.project-item').forEach(item => item.style.display = 'block');
            });
        };

        if (closeStatsBtn) closeStatsBtn.addEventListener('click', resetUI);
        if (closeGuideBtn) closeGuideBtn.addEventListener('click', resetUI);
        if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', resetUI);
        if (closeContributeBtn) closeContributeBtn.addEventListener('click', resetUI);
        if (closeContributorsBtn) closeContributorsBtn.addEventListener('click', resetUI);
        document.getElementById('close-ai-chat')?.addEventListener('click', resetUI);
        document.getElementById('close-learn')?.addEventListener('click', resetUI);
        document.getElementById('close-idea')?.addEventListener('click', resetUI);

        // --- Help dropdown interactivity ---
        if (helpDropdown) {
            helpDropdown.querySelectorAll('.help-item').forEach(item => {
                item.addEventListener('click', () => {
                    const cmd = item.getAttribute('data-cmd');
                    searchInput.value = cmd;
                    searchInput.dispatchEvent(new Event('input'));
                });
            });
        }

        // ==============================================
        // VS CODE-LIKE IDE ENGINE
        // ==============================================
        const IDE = (() => {
            // --- Default boilerplate content ---
            const DEFAULT = {
                'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n</head>\n<body>\n\n  <header class="site-header">\n    <h1>My Awesome Project</h1>\n    <p class="subtitle">Built via S.U.D.O Hub IDE</p>\n  </header>\n\n  <main class="container">\n    <section class="card">\n      <h2>Welcome</h2>\n      <p>Edit this HTML, style it in <code>style.css</code>, and add interactivity in <code>script.js</code>.</p>\n      <button class="btn" id="demo-btn">Click Me!</button>\n    </section>\n  </main>\n\n</body>\n</html>`,
                'style.css': `/* ========================\n   Project Stylesheet\n   ======================== */\n\n* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  font-family: 'Segoe UI', system-ui, sans-serif;\n  background: #0d1117;\n  color: #e6edf3;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 2rem;\n  padding: 2rem;\n}\n\n.site-header {\n  text-align: center;\n}\n\n.site-header h1 {\n  font-size: 2.5rem;\n  background: linear-gradient(135deg, #58a6ff, #bc8cff);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\n.subtitle {\n  margin-top: 0.5rem;\n  opacity: 0.6;\n  font-size: 0.9rem;\n}\n\n.container {\n  width: 100%;\n  max-width: 600px;\n}\n\n.card {\n  background: #161b22;\n  border: 1px solid #30363d;\n  border-radius: 8px;\n  padding: 2rem;\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n.card h2 {\n  color: #58a6ff;\n}\n\n.btn {\n  padding: 0.6rem 1.5rem;\n  background: #238636;\n  color: #fff;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  font-size: 0.95rem;\n  transition: background 0.2s;\n  align-self: flex-start;\n}\n\n.btn:hover {\n  background: #2ea043;\n}`,
                'script.js': `// ========================\n// Project JavaScript\n// ========================\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  const btn = document.getElementById('demo-btn');\n\n  let count = 0;\n\n  btn.addEventListener('click', () => {\n    count++;\n    btn.textContent = \`Clicked \${count} time\${count === 1 ? '' : 's'}!\`;\n    btn.style.background = \`hsl(\${(count * 40) % 360}, 70%, 45%)\`;\n  });\n\n  console.log('Project ready!');\n});`,
                'README.md': `# My Project\n\nBuilt via the S.U.D.O Hub IDE.\n\n## Files\n\n- \`index.html\` - Main HTML structure\n- \`style.css\` - Styles\n- \`script.js\` - JavaScript logic\n`
            };

            // --- Templates library ---
            const TEMPLATES = {
                blank: {
                    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Blank Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
                    'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { background: #111; color: #eee; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }`,
                    'script.js': `console.log('Ready!');`,
                    'README.md': `# Blank Project\nA fresh start.`
                },
                calculator: {
                    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Calculator</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="calc">\n    <div class="display" id="display">0</div>\n    <div class="buttons">\n      <button onclick="clearAll()">C</button>\n      <button onclick="appendChar('/')">/</button>\n      <button onclick="appendChar('*')">×</button>\n      <button onclick="del()">⌫</button>\n      <button onclick="appendChar('7')">7</button>\n      <button onclick="appendChar('8')">8</button>\n      <button onclick="appendChar('9')">9</button>\n      <button onclick="appendChar('-')">-</button>\n      <button onclick="appendChar('4')">4</button>\n      <button onclick="appendChar('5')">5</button>\n      <button onclick="appendChar('6')">6</button>\n      <button onclick="appendChar('+')">+</button>\n      <button onclick="appendChar('1')">1</button>\n      <button onclick="appendChar('2')">2</button>\n      <button onclick="appendChar('3')">3</button>\n      <button class="eq" onclick="calc()">=</button>\n      <button class="zero" onclick="appendChar('0')">0</button>\n      <button onclick="appendChar('.')">.</button>\n    </div>\n  </div>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
                    'style.css': `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#0d1117; display:flex; justify-content:center; align-items:center; min-height:100vh; font-family:'Segoe UI',sans-serif; }\n.calc { background:#161b22; border:1px solid #30363d; border-radius:12px; padding:1.5rem; width:300px; }\n.display { background:#0d1117; color:#58a6ff; font-size:2rem; text-align:right; padding:1rem; border-radius:8px; margin-bottom:1rem; min-height:3.5rem; word-break:break-all; }\n.buttons { display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; }\nbutton { padding:1rem; font-size:1.1rem; border:none; border-radius:8px; background:#21262d; color:#e6edf3; cursor:pointer; transition:background 0.15s; }\nbutton:hover { background:#30363d; }\n.eq { grid-row:span 2; background:#238636; color:#fff; }\n.eq:hover { background:#2ea043; }\n.zero { grid-column:span 2; }`,
                    'script.js': `let current = '0';\nconst d = document.getElementById('display');\nfunction appendChar(c) { current = current === '0' ? c : current + c; d.textContent = current; }\nfunction clearAll() { current = '0'; d.textContent = '0'; }\nfunction del() { current = current.slice(0,-1) || '0'; d.textContent = current; }\nfunction calc() { try { current = String(eval(current)); d.textContent = current; } catch { d.textContent = 'Error'; current = '0'; } }`,
                    'README.md': `# Calculator\nA sleek calculator built with vanilla JS.`
                },
                todo: {
                    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Todo App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="app">\n    <h1>📝 Todo</h1>\n    <div class="input-row">\n      <input id="task" type="text" placeholder="Add a task..." />\n      <button onclick="addTask()">Add</button>\n    </div>\n    <ul id="list"></ul>\n  </div>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
                    'style.css': `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#0d1117; color:#e6edf3; font-family:'Segoe UI',sans-serif; display:flex; justify-content:center; padding-top:4rem; min-height:100vh; }\n.app { width:100%; max-width:500px; }\nh1 { margin-bottom:1rem; }\n.input-row { display:flex; gap:0.5rem; margin-bottom:1rem; }\ninput { flex:1; padding:0.7rem; background:#161b22; border:1px solid #30363d; border-radius:6px; color:#e6edf3; font-size:1rem; outline:none; }\ninput:focus { border-color:#58a6ff; }\nbutton { padding:0.7rem 1.2rem; background:#238636; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:1rem; }\nbutton:hover { background:#2ea043; }\nul { list-style:none; }\nli { display:flex; align-items:center; gap:0.75rem; padding:0.75rem; border-bottom:1px solid #21262d; }\nli.done span { text-decoration:line-through; opacity:0.5; }\nli span { flex:1; }\n.del { background:#da3633; padding:0.3rem 0.6rem; border-radius:4px; font-size:0.8rem; }`,
                    'script.js': `let todos = JSON.parse(localStorage.getItem('todos') || '[]');\nconst list = document.getElementById('list');\nconst input = document.getElementById('task');\nfunction render() {\n  list.innerHTML = '';\n  todos.forEach((t, i) => {\n    const li = document.createElement('li');\n    if (t.done) li.classList.add('done');\n    li.innerHTML = \`<input type="checkbox" \${t.done?'checked':''} onchange="toggle(\${i})"><span>\${t.text}</span><button class="del" onclick="remove(\${i})">✕</button>\`;\n    list.appendChild(li);\n  });\n  localStorage.setItem('todos', JSON.stringify(todos));\n}\nfunction addTask() { if (!input.value.trim()) return; todos.push({ text: input.value.trim(), done: false }); input.value = ''; render(); }\nfunction toggle(i) { todos[i].done = !todos[i].done; render(); }\nfunction remove(i) { todos.splice(i, 1); render(); }\ninput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });\nrender();`,
                    'README.md': `# Todo App\nA task manager with localStorage persistence.`
                },
                portfolio: {
                    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Portfolio</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header>\n    <h1>Your Name</h1>\n    <p>Web Developer &bull; Designer</p>\n  </header>\n  <main>\n    <section class="about">\n      <h2>About Me</h2>\n      <p>I build things for the web. I love clean code and creative design.</p>\n    </section>\n    <section class="projects">\n      <h2>Projects</h2>\n      <div class="grid">\n        <div class="card">Project 1</div>\n        <div class="card">Project 2</div>\n        <div class="card">Project 3</div>\n      </div>\n    </section>\n  </main>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
                    'style.css': `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#0a0a0a; color:#e0e0e0; font-family:'Segoe UI',sans-serif; }\nheader { text-align:center; padding:6rem 2rem 3rem; background:linear-gradient(135deg,#1a1a2e,#16213e); }\nh1 { font-size:3rem; background:linear-gradient(135deg,#e94560,#0f3460); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }\nheader p { margin-top:0.5rem; opacity:0.7; }\nmain { max-width:900px; margin:0 auto; padding:3rem 2rem; }\nsection { margin-bottom:3rem; }\nh2 { color:#e94560; margin-bottom:1rem; }\n.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.5rem; }\n.card { background:#1a1a2e; border:1px solid #333; border-radius:8px; padding:2rem; text-align:center; transition:transform 0.2s,border-color 0.2s; }\n.card:hover { transform:translateY(-4px); border-color:#e94560; }`,
                    'script.js': `document.querySelectorAll('.card').forEach(c => {\n  c.addEventListener('mouseenter', () => c.style.boxShadow = '0 8px 25px rgba(233,69,96,0.2)');\n  c.addEventListener('mouseleave', () => c.style.boxShadow = 'none');\n});`,
                    'README.md': `# Portfolio\nA personal portfolio page.`
                },
                game: {
                    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Click Game</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="game">\n    <h1>🎯 Click Game</h1>\n    <p>Score: <span id="score">0</span> | Time: <span id="timer">30</span>s</p>\n    <div class="arena" id="arena"></div>\n    <button id="start" onclick="startGame()">START</button>\n  </div>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
                    'style.css': `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#0d1117; color:#e6edf3; font-family:'Segoe UI',sans-serif; display:flex; justify-content:center; padding-top:3rem; min-height:100vh; }\n.game { text-align:center; }\nh1 { margin-bottom:0.5rem; }\np { margin-bottom:1rem; opacity:0.8; }\n.arena { width:400px; height:400px; background:#161b22; border:2px solid #30363d; border-radius:12px; position:relative; margin:0 auto 1rem; overflow:hidden; }\n.target { width:40px; height:40px; background:#238636; border-radius:50%; position:absolute; cursor:pointer; transition:transform 0.1s; }\n.target:hover { transform:scale(1.1); }\nbutton { padding:0.7rem 2rem; background:#238636; color:#fff; border:none; border-radius:6px; font-size:1rem; cursor:pointer; }\nbutton:hover { background:#2ea043; }`,
                    'script.js': `let score = 0, timer = 30, interval;\nconst arena = document.getElementById('arena');\nconst scoreEl = document.getElementById('score');\nconst timerEl = document.getElementById('timer');\nfunction spawn() {\n  arena.innerHTML = '';\n  const t = document.createElement('div');\n  t.className = 'target';\n  t.style.left = Math.random() * 360 + 'px';\n  t.style.top = Math.random() * 360 + 'px';\n  t.addEventListener('click', () => { score++; scoreEl.textContent = score; spawn(); });\n  arena.appendChild(t);\n}\nfunction startGame() {\n  score = 0; timer = 30; scoreEl.textContent = 0; timerEl.textContent = 30;\n  document.getElementById('start').disabled = true;\n  spawn();\n  interval = setInterval(() => {\n    timer--; timerEl.textContent = timer;\n    if (timer <= 0) { clearInterval(interval); arena.innerHTML = '<h2 style="padding-top:40%;color:#58a6ff">Game Over!<br>Score: ' + score + '</h2>'; document.getElementById('start').disabled = false; }\n  }, 1000);\n}`,
                    'README.md': `# Click Game\nA 30-second click target mini-game.`
                },
                dashboard: {
                    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Dashboard</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="dashboard">\n    <h1>📊 Dashboard</h1>\n    <div class="cards">\n      <div class="stat"><span class="label">Users</span><span class="val" id="users">--</span></div>\n      <div class="stat"><span class="label">Revenue</span><span class="val" id="revenue">--</span></div>\n      <div class="stat"><span class="label">Growth</span><span class="val" id="growth">--</span></div>\n      <div class="stat"><span class="label">Active</span><span class="val" id="active">--</span></div>\n    </div>\n  </div>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
                    'style.css': `* { margin:0; padding:0; box-sizing:border-box; }\nbody { background:#0d1117; color:#e6edf3; font-family:'Segoe UI',sans-serif; display:flex; justify-content:center; padding-top:4rem; min-height:100vh; }\n.dashboard { width:100%; max-width:800px; padding:0 2rem; }\nh1 { margin-bottom:2rem; }\n.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1.5rem; }\n.stat { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:2rem; display:flex; flex-direction:column; gap:0.5rem; transition:border-color 0.2s; }\n.stat:hover { border-color:#58a6ff; }\n.label { font-size:0.8rem; opacity:0.6; text-transform:uppercase; letter-spacing:1px; }\n.val { font-size:2rem; font-weight:700; color:#58a6ff; }`,
                    'script.js': `function animateValue(id, end, prefix = '', suffix = '') {\n  const el = document.getElementById(id);\n  let start = 0;\n  const step = Math.ceil(end / 40);\n  const timer = setInterval(() => {\n    start += step;\n    if (start >= end) { start = end; clearInterval(timer); }\n    el.textContent = prefix + start.toLocaleString() + suffix;\n  }, 30);\n}\nanimateTo = () => {\n  animateValue('users', 12847);\n  animateValue('revenue', 48290, '$');\n  animateValue('growth', 23, '+', '%');\n  animateValue('active', 1893);\n};\nanimateTo();`,
                    'README.md': `# Dashboard\nA stats dashboard with animated counters.`
                }
            };

            // IDE state
            let files = JSON.parse(JSON.stringify(DEFAULT)); // deep copy
            let openTabs = ['index.html', 'style.css', 'script.js'];
            let activeFile = 'index.html';

            const saveIDEState = () => {
                localStorage.setItem('ide-files', JSON.stringify(files));
                localStorage.setItem('ide-folders', JSON.stringify([...folders]));
                localStorage.setItem('ide-tabs', JSON.stringify(openTabs));
                localStorage.setItem('ide-active', activeFile);
            };

            // DOM refs
            const el = {
                editor:     document.getElementById('ide-editor'),
                highlight:  document.getElementById('ide-highlight'),
                tabbar:     document.getElementById('ide-tabbar'),
                fileTree:   document.getElementById('ide-file-tree'),
                lineNums:   document.getElementById('ide-line-numbers'),
                iframe:     document.getElementById('ide-iframe'),
                findBar:    document.getElementById('ide-find-bar'),
                findInput:  document.getElementById('ide-find-input'),
                findCount:  document.getElementById('ide-find-count'),
                statusFile: document.getElementById('ide-status-file'),
                statusLang: document.getElementById('ide-status-lang'),
                statusPos:  document.getElementById('ide-status-pos'),
                ctxMenu:    document.getElementById('ide-ctx-menu'),
            };

            // ---- FIX: single-pass syntax highlighter ----
            const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

            const highlightHTML = raw => {
                const out = []; let last = 0;
                const re = /(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w-]*)([^>]*)(\/?>)/g;
                let m;
                while ((m = re.exec(raw)) !== null) {
                    if (m.index > last) out.push(esc(raw.slice(last, m.index)));
                    if (m[1]) {
                        out.push(`<span class="tok-comment">${esc(m[1])}</span>`);
                    } else {
                        const coloredAttrs = esc(m[4])
                            .replace(/([\w-]+)="([^"]*)"/g,
                                '<span class="tok-attr">$1</span>="<span class="tok-value">$2</span>"');
                        out.push(`${esc(m[2])}<span class="tok-tag">${esc(m[3])}</span>${coloredAttrs}${esc(m[5])}`);
                    }
                    last = re.lastIndex;
                }
                out.push(esc(raw.slice(last)));
                return out.join('');
            };

            const highlightJS = raw => {
                const KEYWORDS = new Set('const,let,var,function,return,if,else,for,while,do,switch,case,break,continue,new,class,import,export,default,this,typeof,instanceof,null,undefined,true,false,async,await,of,in,try,catch,finally,throw,delete,void'.split(','));
                const out = []; let last = 0;
                const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(["'`])(?:(?!\3)[^\\]|\\.)*\3|(\b\d+\.?\d*\b)|(\b[a-zA-Z_$][\w$]*\b)/g;
                let m;
                while ((m = re.exec(raw)) !== null) {
                    if (m.index > last) out.push(esc(raw.slice(last, m.index)));
                    if (m[1]||m[2]) out.push(`<span class="tok-comment">${esc(m[0])}</span>`);
                    else if (m[3])  out.push(`<span class="tok-string">${esc(m[0])}</span>`);
                    else if (m[4])  out.push(`<span class="tok-number">${esc(m[0])}</span>`);
                    else if (m[5])  out.push(KEYWORDS.has(m[5]) ? `<span class="tok-keyword">${esc(m[5])}</span>` : esc(m[5]));
                    last = re.lastIndex;
                }
                out.push(esc(raw.slice(last)));
                return out.join('');
            };

            const highlightCSS = raw => {
                const out = []; let last = 0;
                const re = /(\/\*[\s\S]*?\*\/)|(@[\w-]+)|(#[\w-]+|\.[\w-]+)(?=\s*\{)|([\w-]+)(?=\s*:)|(["'][^"']*["'])|(\b\d+\.?\d*(?:px|em|rem|vh|vw|%|s|ms|deg)?\b)/g;
                let m;
                while ((m = re.exec(raw)) !== null) {
                    if (m.index > last) out.push(esc(raw.slice(last, m.index)));
                    if (m[1]) out.push(`<span class="tok-comment">${esc(m[1])}</span>`);
                    else if (m[2]) out.push(`<span class="tok-at-rule">${esc(m[2])}</span>`);
                    else if (m[3]) out.push(`<span class="tok-selector">${esc(m[3])}</span>`);
                    else if (m[4]) out.push(`<span class="tok-prop">${esc(m[4])}</span>`);
                    else if (m[5]) out.push(`<span class="tok-string">${esc(m[5])}</span>`);
                    else if (m[6]) out.push(`<span class="tok-number">${esc(m[6])}</span>`);
                    last = re.lastIndex;
                }
                out.push(esc(raw.slice(last)));
                return out.join('');
            };

            const getExt = name => name.split('.').pop();
            const langOf = name => {
                const e = getExt(name);
                return e === 'js' ? 'js' : e === 'css' ? 'css' : e === 'md' ? 'md' : 'html';
            };
            const highlight = (code, name) => {
                const l = langOf(name);
                if (l === 'js') return highlightJS(code);
                if (l === 'css') return highlightCSS(code);
                if (l === 'md') return esc(code);
                return highlightHTML(code);
            };
            const fileIcon = name => {
                const e = getExt(name);
                if (e === 'js') return '🟡';
                if (e === 'css') return '🔵';
                if (e === 'md') return '📄';
                if (e === 'html') return '🔴';
                return '📄';
            };

            // ---- Custom IDE prompt (replaces browser prompt) ----
            const idePromptModal  = document.getElementById('ide-prompt-modal');
            const idePromptTitle  = document.getElementById('ide-prompt-title');
            const idePromptLabel  = document.getElementById('ide-prompt-label');
            const idePromptInput  = document.getElementById('ide-prompt-input');
            const idePromptOk     = document.getElementById('ide-prompt-ok');
            const idePromptCancel = document.getElementById('ide-prompt-cancel');
            let _promptResolve = null;

            const idePrompt = (title, label, placeholder, defaultVal) => {
                return new Promise(resolve => {
                    _promptResolve = resolve;
                    if (idePromptTitle)  idePromptTitle.textContent = title;
                    if (idePromptLabel)  idePromptLabel.textContent = label;
                    if (idePromptInput) { idePromptInput.placeholder = placeholder || ''; idePromptInput.value = defaultVal || ''; }
                    if (idePromptModal) idePromptModal.style.display = 'flex';
                    setTimeout(() => idePromptInput && idePromptInput.focus(), 50);
                });
            };
            const closePrompt = val => { if (idePromptModal) idePromptModal.style.display = 'none'; if (_promptResolve) { _promptResolve(val); _promptResolve = null; } };
            if (idePromptOk) idePromptOk.addEventListener('click', () => closePrompt(idePromptInput ? idePromptInput.value.trim() : ''));
            if (idePromptCancel) idePromptCancel.addEventListener('click', () => closePrompt(null));
            if (idePromptModal) idePromptModal.addEventListener('click', e => { if (e.target === idePromptModal) closePrompt(null); });
            if (idePromptInput) idePromptInput.addEventListener('keydown', e => { if (e.key === 'Enter') idePromptOk.click(); if (e.key === 'Escape') closePrompt(null); });

            // ---- Folder state ----
            let folders = new Set(); // set of folder paths e.g. "components", "pages/about"
            let collapsedFolders = new Set();

            const buildTree = () => {
                // Build a nested structure from folders + files
                const tree = {};
                // Add folders
                folders.forEach(fp => {
                    const parts = fp.split('/');
                    let node = tree;
                    parts.forEach(p => {
                        if (!node[p]) node[p] = { _isFolder: true, _children: {} };
                        node = node[p]._children;
                    });
                });
                // Add files
                Object.keys(files).forEach(name => {
                    const parts = name.split('/');
                    let node = tree;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!node[parts[i]]) node[parts[i]] = { _isFolder: true, _children: {} };
                        node = node[parts[i]]._children;
                    }
                    node[parts[parts.length - 1]] = { _isFile: true, _fullPath: name };
                });
                return tree;
            };

            const renderFileTree = () => {
                if (!el.fileTree) return;
                el.fileTree.innerHTML = '';
                const tree = buildTree();

                const renderNode = (node, parentPath, depth) => {
                    const sorted = Object.keys(node).sort((a, b) => {
                        const aFolder = node[a]._isFolder;
                        const bFolder = node[b]._isFolder;
                        if (aFolder && !bFolder) return -1;
                        if (!aFolder && bFolder) return 1;
                        return a.localeCompare(b);
                    });
                    sorted.forEach(key => {
                        const entry = node[key];
                        const fullPath = parentPath ? `${parentPath}/${key}` : key;

                        if (entry._isFolder) {
                            const isCollapsed = collapsedFolders.has(fullPath);
                            const folderDiv = document.createElement('div');
                            folderDiv.className = 'ide-tree-folder';
                            folderDiv.style.paddingLeft = `${0.75 + depth * 0.9}rem`;
                            folderDiv.innerHTML = `<span class="folder-arrow">${isCollapsed ? '▶' : '▼'}</span><span class="file-icon">📁</span><span>${esc(key)}</span>`;
                            folderDiv.addEventListener('click', () => {
                                if (isCollapsed) collapsedFolders.delete(fullPath);
                                else collapsedFolders.add(fullPath);
                                renderFileTree();
                            });
                            folderDiv.addEventListener('contextmenu', e => showCtxMenu(e, fullPath, true));
                            el.fileTree.appendChild(folderDiv);

                            if (!isCollapsed) {
                                const childContainer = document.createElement('div');
                                childContainer.className = 'ide-tree-folder-children';
                                renderNodeInto(childContainer, entry._children, fullPath, depth + 1);
                                el.fileTree.appendChild(childContainer);
                            }
                        } else if (entry._isFile) {
                            const div = document.createElement('div');
                            div.className = 'ide-tree-file' + (entry._fullPath === activeFile ? ' active' : '');
                            div.style.paddingLeft = `${0.75 + depth * 0.9}rem`;
                            div.dataset.name = entry._fullPath;
                            div.innerHTML = `<span class="file-icon">${fileIcon(entry._fullPath)}</span><span>${esc(key)}</span>`;
                            div.addEventListener('click', () => switchFile(entry._fullPath));
                            div.addEventListener('contextmenu', e => showCtxMenu(e, entry._fullPath, false));
                            el.fileTree.appendChild(div);
                        }
                    });
                };

                const renderNodeInto = (container, node, parentPath, depth) => {
                    const sorted = Object.keys(node).sort((a, b) => {
                        const aF = node[a]._isFolder, bF = node[b]._isFolder;
                        if (aF && !bF) return -1;
                        if (!aF && bF) return 1;
                        return a.localeCompare(b);
                    });
                    sorted.forEach(key => {
                        const entry = node[key];
                        const fullPath = parentPath ? `${parentPath}/${key}` : key;
                        if (entry._isFolder) {
                            const isCollapsed = collapsedFolders.has(fullPath);
                            const fdiv = document.createElement('div');
                            fdiv.className = 'ide-tree-folder';
                            fdiv.style.paddingLeft = `${0.75 + depth * 0.9}rem`;
                            fdiv.innerHTML = `<span class="folder-arrow">${isCollapsed ? '▶' : '▼'}</span><span class="file-icon">📁</span><span>${esc(key)}</span>`;
                            fdiv.addEventListener('click', () => { if(isCollapsed) collapsedFolders.delete(fullPath); else collapsedFolders.add(fullPath); renderFileTree(); });
                            fdiv.addEventListener('contextmenu', e => showCtxMenu(e, fullPath, true));
                            container.appendChild(fdiv);
                            if (!isCollapsed) {
                                const cc = document.createElement('div');
                                cc.className = 'ide-tree-folder-children';
                                renderNodeInto(cc, entry._children, fullPath, depth + 1);
                                container.appendChild(cc);
                            }
                        } else if (entry._isFile) {
                            const div = document.createElement('div');
                            div.className = 'ide-tree-file' + (entry._fullPath === activeFile ? ' active' : '');
                            div.style.paddingLeft = `${0.75 + depth * 0.9}rem`;
                            div.innerHTML = `<span class="file-icon">${fileIcon(entry._fullPath)}</span><span>${esc(key)}</span>`;
                            div.addEventListener('click', () => switchFile(entry._fullPath));
                            div.addEventListener('contextmenu', e => showCtxMenu(e, entry._fullPath, false));
                            container.appendChild(div);
                        }
                    });
                };

                renderNode(tree, '', 0);
            };

            const renderTabs = () => {
                if (!el.tabbar) return;
                el.tabbar.innerHTML = '';
                openTabs.forEach(name => {
                    const tab = document.createElement('div');
                    tab.className = 'ide-tab' + (name === activeFile ? ' active' : '');
                    const displayName = name.includes('/') ? name.split('/').pop() : name;
                    tab.innerHTML = `<span class="file-icon">${fileIcon(name)}</span><span>${esc(displayName)}</span><span class="ide-tab-close" data-close="${esc(name)}">✕</span>`;
                    tab.title = name;
                    tab.addEventListener('click', e => {
                        if (e.target.dataset.close) { closeTab(e.target.dataset.close); return; }
                        switchFile(name);
                    });
                    el.tabbar.appendChild(tab);
                });
            };

            const updateLineNumbers = () => {
                if (!el.lineNums || !el.editor) return;
                const lines = (el.editor.value.match(/\n/g) || []).length + 1;
                const old = el.lineNums.children.length;
                if (old < lines) {
                    for (let i = old + 1; i <= lines; i++) {
                        const s = document.createElement('span'); s.textContent = i;
                        el.lineNums.appendChild(s);
                    }
                } else {
                    while (el.lineNums.children.length > lines) el.lineNums.lastChild.remove();
                }
            };

            const updateStatus = () => {
                if (!el.editor) return;
                const text = el.editor.value;
                const pos  = el.editor.selectionStart;
                const before = text.slice(0, pos);
                const ln = (before.match(/\n/g) || []).length + 1;
                const col = before.split('\n').pop().length + 1;
                const langLabel = { js:'JavaScript', css:'CSS', html:'HTML', md:'Markdown' };
                if (el.statusFile) el.statusFile.textContent = activeFile;
                if (el.statusLang) el.statusLang.textContent = langLabel[langOf(activeFile)] || 'Text';
                if (el.statusPos)  el.statusPos.textContent  = `Ln ${ln}, Col ${col}`;
            };

            const refreshHighlight = () => {
                if (!el.highlight || !el.editor) return;
                el.highlight.innerHTML = highlight(el.editor.value, activeFile) + '\n';
                updateLineNumbers();
            };

            // ---- File management ----
            const switchFile = name => {
                if (files[name] === undefined) return;
                if (el.editor) files[activeFile] = el.editor.value;
                activeFile = name;
                if (!openTabs.includes(name)) openTabs.push(name);
                if (el.editor) el.editor.value = files[name];
                renderFileTree();
                renderTabs();
                refreshHighlight();
                updateStatus();
                el.editor && el.editor.focus();
            };

            const closeTab = name => {
                openTabs = openTabs.filter(t => t !== name);
                if (activeFile === name) {
                    activeFile = openTabs[openTabs.length - 1] || Object.keys(files)[0] || '';
                    if (activeFile && el.editor) el.editor.value = files[activeFile] || '';
                }
                renderTabs();
                renderFileTree();
                refreshHighlight();
                updateStatus();
            };

            const createFile = async () => {
                const name = await idePrompt('[ NEW FILE ]', 'FILE NAME', 'e.g. about.html or pages/contact.html', '');
                if (!name) return;
                if (files[name]) { alert('File already exists!'); return; }
                // Auto-register parent folders
                const parts = name.split('/');
                if (parts.length > 1) {
                    for (let i = 1; i < parts.length; i++) {
                        folders.add(parts.slice(0, i).join('/'));
                    }
                }
                files[name] = '';
                openTabs.push(name);
                saveIDEState();
                switchFile(name);
            };

            const createFolder = async () => {
                const name = await idePrompt('[ NEW FOLDER ]', 'FOLDER NAME', 'e.g. components or pages/about', '');
                if (!name) return;
                const cleaned = name.replace(/^\/|\/$/g, '');
                if (!cleaned) return;
                // Register this folder and all parent folders
                const parts = cleaned.split('/');
                for (let i = 1; i <= parts.length; i++) {
                    folders.add(parts.slice(0, i).join('/'));
                }
                unlockAchievement('ARCHITECT', 'Systems Architect', '🏗️');
                saveIDEState();
                renderFileTree();
            };

            const renameFile = async (oldName) => {
                const newName = await idePrompt('[ RENAME ]', 'NEW NAME', oldName, oldName);
                if (!newName || newName === oldName) return;
                files[newName] = files[oldName];
                delete files[oldName];
                // Re-register parent folders
                const parts = newName.split('/');
                if (parts.length > 1) {
                    for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'));
                }
                openTabs = openTabs.map(t => t === oldName ? newName : t);
                if (activeFile === oldName) activeFile = newName;
                saveIDEState();
                renderFileTree(); renderTabs(); refreshHighlight(); updateStatus();
            };

            const deleteFile = (name) => {
                if (!confirm(`Delete "${name}"?`)) return;
                delete files[name];
                openTabs = openTabs.filter(t => t !== name);
                if (activeFile === name) {
                    activeFile = openTabs[0] || Object.keys(files)[0] || '';
                    if (activeFile && el.editor) el.editor.value = files[activeFile] || '';
                }
                saveIDEState();
                renderFileTree(); renderTabs(); refreshHighlight(); updateStatus();
            };

            const deleteFolder = (folderPath) => {
                if (!confirm(`Delete folder "${folderPath}" and all its contents?`)) return;
                // Delete all files inside this folder
                Object.keys(files).forEach(fp => {
                    if (fp.startsWith(folderPath + '/')) {
                        delete files[fp];
                        openTabs = openTabs.filter(t => t !== fp);
                    }
                });
                // Remove all sub-folders
                [...folders].forEach(f => { if (f === folderPath || f.startsWith(folderPath + '/')) folders.delete(f); });
                if (activeFile.startsWith(folderPath + '/')) {
                    activeFile = openTabs[0] || Object.keys(files)[0] || '';
                    if (activeFile && el.editor) el.editor.value = files[activeFile] || '';
                }
                renderFileTree(); renderTabs(); refreshHighlight(); updateStatus();
            };

            const renameFolder = async (oldPath) => {
                const newPath = await idePrompt('[ RENAME FOLDER ]', 'NEW FOLDER NAME', oldPath, oldPath);
                if (!newPath || newPath === oldPath) return;
                // Move all files
                Object.keys(files).forEach(fp => {
                    if (fp.startsWith(oldPath + '/')) {
                        const newFp = newPath + fp.slice(oldPath.length);
                        files[newFp] = files[fp];
                        delete files[fp];
                        openTabs = openTabs.map(t => t === fp ? newFp : t);
                        if (activeFile === fp) activeFile = newFp;
                    }
                });
                // Move sub-folders
                [...folders].forEach(f => {
                    if (f === oldPath || f.startsWith(oldPath + '/')) {
                        folders.delete(f);
                        folders.add(f === oldPath ? newPath : newPath + f.slice(oldPath.length));
                    }
                });
                renderFileTree(); renderTabs(); refreshHighlight(); updateStatus();
            };

            // ---- Context menu ----
            let ctxTarget = null;
            let ctxIsFolder = false;
            const showCtxMenu = (e, name, isFolder) => {
                e.preventDefault();
                e.stopPropagation();
                ctxTarget = name;
                ctxIsFolder = isFolder;
                if (!el.ctxMenu) return;
                el.ctxMenu.style.display = 'block';
                el.ctxMenu.style.left = e.clientX + 'px';
                el.ctxMenu.style.top  = e.clientY + 'px';
            };
            if (el.ctxMenu) {
                el.ctxMenu.addEventListener('click', e => {
                    const action = e.target.dataset.ctx;
                    if (ctxIsFolder) {
                        if (action === 'rename') renameFolder(ctxTarget);
                        if (action === 'delete') deleteFolder(ctxTarget);
                    } else {
                        if (action === 'rename' && ctxTarget) renameFile(ctxTarget);
                        if (action === 'delete' && ctxTarget) deleteFile(ctxTarget);
                    }
                    el.ctxMenu.style.display = 'none';
                });
            }
            document.addEventListener('click', () => { if (el.ctxMenu) el.ctxMenu.style.display = 'none'; });
            document.addEventListener('contextmenu', e => {
                if (!e.target.closest('#ide-file-tree') && el.ctxMenu) el.ctxMenu.style.display = 'none';
            });

            // ---- Live preview ----
            const updateIframe = () => {
                if (!el.iframe) return;
                if (el.editor) files[activeFile] = el.editor.value;
                const html = files['index.html'] || '';
                const css  = `<style>${files['style.css'] || ''}</style>`;
                const js   = `<script>${files['script.js'] || ''}<\/script>`;
                let doc = html;
                doc = doc.includes('</head>') ? doc.replace('</head>', css + '</head>') : css + doc;
                doc = doc.includes('</body>') ? doc.replace('</body>', js + '</body>') : doc + js;
                const d = el.iframe.contentWindow.document;
                d.open(); d.write(doc); d.close();
            };

            // ---- Menus ----
            document.querySelectorAll('.ide-menu-trigger').forEach(trigger => {
                trigger.addEventListener('click', e => {
                    e.stopPropagation();
                    const group = trigger.parentElement;
                    const wasOpen = group.classList.contains('open');
                    document.querySelectorAll('.ide-menu-group').forEach(g => g.classList.remove('open'));
                    if (!wasOpen) group.classList.add('open');
                });
            });
            document.addEventListener('click', () => document.querySelectorAll('.ide-menu-group').forEach(g => g.classList.remove('open')));

            document.querySelectorAll('.ide-dropdown-item').forEach(item => {
                item.addEventListener('click', e => {
                    e.stopPropagation();
                    document.querySelectorAll('.ide-menu-group').forEach(g => g.classList.remove('open'));
                    const action = item.dataset.action;
                    if (action === 'new-file') createFile();
                    if (action === 'new-folder') createFolder();
                    if (action === 'save-zip') triggerSubmit();
                    if (action === 'find') toggleFind();
                });
            });

            // Sidebar create buttons
            const newFileBtn = document.getElementById('ide-btn-new-file');
            const newFolderBtn = document.getElementById('ide-btn-new-folder');
            if (newFileBtn) newFileBtn.addEventListener('click', createFile);
            if (newFolderBtn) newFolderBtn.addEventListener('click', createFolder);

            // ---- Find in file ----
            let findMatches = [], findIdx = 0;
            const toggleFind = () => {
                if (!el.findBar) return;
                const showing = el.findBar.style.display !== 'none';
                if (!showing && el.findInput) { el.findInput.focus(); el.findInput.select(); }
                if (showing) { 
                    refreshHighlight(); 
                    if(el.findCount) el.findCount.textContent = ''; 
                    unlockAchievement('INSPECTOR', 'Code Inspector', '🔍');
                }
            };
            const runFind = () => {
                if (!el.findInput || !el.highlight) return;
                const term = el.findInput.value;
                const base = highlight(el.editor ? el.editor.value : '', activeFile);
                if (!term) { el.highlight.innerHTML = base + '\n'; if(el.findCount) el.findCount.textContent = ''; return; }
                const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
                let count = 0;
                const marked = base.replace(re, m => { count++; return `<mark class="tok-find-mark">${m}</mark>`; });
                el.highlight.innerHTML = marked + '\n';
                if (el.findCount) el.findCount.textContent = count ? `${count} match${count===1?'':'es'}` : 'No results';
            };
            if (el.findInput) el.findInput.addEventListener('input', runFind);
            const findCloseBtn = document.getElementById('ide-find-close');
            if (findCloseBtn) findCloseBtn.addEventListener('click', toggleFind);
            const findPrevBtn = document.getElementById('ide-find-prev');
            const findNextBtn = document.getElementById('ide-find-next');
            if (findPrevBtn) findPrevBtn.addEventListener('click', () => {
                const marks = el.highlight.querySelectorAll('.tok-find-mark');
                if (!marks.length) return;
                findIdx = (findIdx - 1 + marks.length) % marks.length;
                marks[findIdx].scrollIntoView({ block: 'center' });
            });
            if (findNextBtn) findNextBtn.addEventListener('click', () => {
                const marks = el.highlight.querySelectorAll('.tok-find-mark');
                if (!marks.length) return;
                findIdx = (findIdx + 1) % marks.length;
                marks[findIdx].scrollIntoView({ block: 'center' });
            });

            // ---- Editor events ----
            if (el.editor) {
                el.editor.addEventListener('input', () => {
                    if (el.editor) files[activeFile] = el.editor.value;
                    saveIDEState();
                    refreshHighlight();
                    clearTimeout(el.editor._reload);
                    el.editor._reload = setTimeout(updateIframe, 500);
                    if (el.findBar && el.findBar.style.display !== 'none') runFind();
                });
                el.editor.addEventListener('keydown', e => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const s = el.editor.selectionStart, end = el.editor.selectionEnd;
                        el.editor.value = el.editor.value.slice(0, s) + '  ' + el.editor.value.slice(end);
                        el.editor.selectionStart = el.editor.selectionEnd = s + 2;
                        files[activeFile] = el.editor.value;
                        refreshHighlight();
                    }
                    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); toggleFind(); }
                    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); createFile(); }
                    if (e.ctrlKey && e.key === 's') { e.preventDefault(); triggerSubmit(); }
                    updateStatus();
                });
                el.editor.addEventListener('click', updateStatus);
                el.editor.addEventListener('keyup', updateStatus);
                el.editor.addEventListener('scroll', () => {
                    if (el.highlight) { el.highlight.scrollTop = el.editor.scrollTop; el.highlight.scrollLeft = el.editor.scrollLeft; }
                    if (el.lineNums) el.lineNums.scrollTop = el.editor.scrollTop;
                });
            }

            // Refresh preview button
            const refreshPreviewBtn = document.getElementById('refresh-preview');
            if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', updateIframe);

            // ---- Submit PR (now goes through checklist first) ----
            const triggerSubmit = () => {
                if (el.editor) files[activeFile] = el.editor.value;
                // Show checklist modal
                const checklistModal = document.getElementById('checklist-modal');
                if (!checklistModal) return;
                // Reset all checkboxes
                checklistModal.querySelectorAll('.checklist-check').forEach(cb => cb.checked = false);
                const proceedBtn = document.getElementById('checklist-proceed');
                if (proceedBtn) proceedBtn.disabled = true;
                // Polyglot achievement check
                const hasHTML = Object.keys(files).some(f => f.endsWith('.html'));
                const hasCSS = Object.keys(files).some(f => f.endsWith('.css'));
                const hasJS = Object.keys(files).some(f => f.endsWith('.js'));
                if (hasHTML && hasCSS && hasJS) {
                    unlockAchievement('POLYGLOT', 'Digital Polyglot', '🉐');
                }

                checklistModal.style.display = 'flex';
            };

            // Checklist logic
            const checklistModal = document.getElementById('checklist-modal');
            const checklistBack = document.getElementById('checklist-back');
            const checklistProceed = document.getElementById('checklist-proceed');
            if (checklistModal) {
                checklistModal.addEventListener('click', e => { if (e.target === checklistModal) checklistModal.style.display = 'none'; });
                checklistModal.querySelectorAll('.checklist-check').forEach(cb => {
                    cb.addEventListener('change', () => {
                        const all = checklistModal.querySelectorAll('.checklist-check');
                        const allChecked = [...all].every(c => c.checked);
                        if (checklistProceed) {
                            checklistProceed.disabled = !allChecked;
                            if (allChecked) {
                                checklistProceed.classList.add('active');
                            } else {
                                checklistProceed.classList.remove('active');
                            }
                        }
                    });
                });
            }
            if (checklistBack) checklistBack.addEventListener('click', () => { checklistModal.style.display = 'none'; });
            if (checklistProceed) checklistProceed.addEventListener('click', () => {
                checklistModal.style.display = 'none';
                // Now show the title/submit modal
                const submitModal = document.getElementById('submit-modal');
                const titleInput  = document.getElementById('project-title-input');
                if (!submitModal) return;
                titleInput.value = '';
                submitModal.style.display = 'flex';
                setTimeout(() => titleInput && titleInput.focus(), 50);
            });

            const submitProjectBtn = document.getElementById('submit-project');
            if (submitProjectBtn) submitProjectBtn.addEventListener('click', triggerSubmit);

            const submitModal  = document.getElementById('submit-modal');
            const titleInput   = document.getElementById('project-title-input');
            const modalConfirm = document.getElementById('modal-confirm');
            const modalCancel  = document.getElementById('modal-cancel');
            if (modalCancel) modalCancel.addEventListener('click', () => submitModal.style.display = 'none');
            if (submitModal) submitModal.addEventListener('click', e => { if(e.target===submitModal) submitModal.style.display='none'; });
            if (titleInput) titleInput.addEventListener('keydown', e => { if(e.key==='Enter') modalConfirm.click(); });
            if (modalConfirm) modalConfirm.addEventListener('click', async () => {
                const title = titleInput.value.trim();
                if (!title) { titleInput.focus(); return; }
                submitModal.style.display = 'none';
                if (el.editor) files[activeFile] = el.editor.value;
                const zip = new JSZip();
                const folderName = title.replace(/[^a-zA-Z0-9_-]/g, '');
                const folder = zip.folder(folderName);
                Object.entries(files).forEach(([name, content]) => folder.file(name, content));
                folder.file('preview.png', '');
                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url; a.download = `${folderName}.zip`;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a); URL.revokeObjectURL(url);
                playSound('switch');
                setTimeout(() => window.open('https://github.com/Mr-S-U-D-O/javascriptProjectBasedLearning/upload/main', '_blank'), 600);
            });

            // ---- Template picker logic ----
            const loadTemplate = (templateKey) => {
                const tmpl = TEMPLATES[templateKey] || DEFAULT;
                files = JSON.parse(JSON.stringify(tmpl));
                folders.clear();
                collapsedFolders.clear();
                openTabs = Object.keys(files);
                activeFile = openTabs[0] || Object.keys(files)[0];
                if (el.editor) el.editor.value = files[activeFile];
                saveIDEState();
                renderFileTree();
                renderTabs();
                refreshHighlight();
                updateStatus();
                updateIframe();
            };

            const templatePicker = document.getElementById('template-picker');
            const templateGrid = document.getElementById('template-grid');
            const templateSkip = document.getElementById('template-skip');
            if (templateGrid) {
                templateGrid.querySelectorAll('.template-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const key = card.dataset.template;
                        loadTemplate(key);
                        if (templatePicker) templatePicker.style.display = 'none';
                        playSound('switch');
                    });
                });
            }
            if (templateSkip) templateSkip.addEventListener('click', () => {
                loadTemplate('blank');
                if (templatePicker) templatePicker.style.display = 'none';
            });
            if (templatePicker) templatePicker.addEventListener('click', e => {
                if (e.target === templatePicker) { templatePicker.style.display = 'none'; loadTemplate('blank'); }
            });

            // ---- Resizing & Collapsing ----
            const initResizers = () => {
                const leftResizer = document.getElementById('ide-resizer-left');
                const rightResizer = document.getElementById('ide-resizer-right');
                const sidebar = document.getElementById('ide-sidebar');
                const previewPane = document.querySelector('.ide-preview-pane');
                const container = document.querySelector('.ide-body');

                const collapseSidebarBtn = document.getElementById('ide-btn-collapse-sidebar');
                const expandPreviewBtn = document.getElementById('ide-btn-expand-preview');

                // Load saved widths
                const savedSidebarWidth = localStorage.getItem('ide-sidebar-width');
                const savedPreviewWidth = localStorage.getItem('ide-preview-width');
                if (savedSidebarWidth) sidebar.style.width = savedSidebarWidth + 'px';
                if (savedPreviewWidth) previewPane.style.width = savedPreviewWidth + 'px';

                const setupResizer = (resizer, target, side) => {
                    let startX, startWidth;
                    
                    const onMouseDown = (e) => {
                        startX = e.clientX;
                        startWidth = target.offsetWidth;
                        resizer.classList.add('dragging');
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                        document.body.style.userSelect = 'none';
                        document.body.style.cursor = 'col-resize';
                    };

                    const onMouseMove = (e) => {
                        let newWidth;
                        if (side === 'left') {
                            newWidth = startWidth + (e.clientX - startX);
                        } else {
                            newWidth = startWidth - (e.clientX - startX);
                        }
                        
                        // Limits
                        const min = side === 'left' ? 100 : 0;
                        const max = container.offsetWidth * 0.7;
                        
                        if (newWidth >= min && newWidth <= max) {
                            target.style.width = newWidth + 'px';
                            if (side === 'left') localStorage.setItem('ide-sidebar-width', newWidth);
                            else localStorage.setItem('ide-preview-width', newWidth);
                        }
                    };

                    const onMouseUp = () => {
                        resizer.classList.remove('dragging');
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        document.body.style.userSelect = '';
                        document.body.style.cursor = '';
                        updateIframe(); // Refresh preview on resize stop
                    };

                    resizer.addEventListener('mousedown', onMouseDown);
                };

                if (leftResizer && sidebar) setupResizer(leftResizer, sidebar, 'left');
                if (rightResizer && previewPane) setupResizer(rightResizer, previewPane, 'right');

                // Collapse/Expand logic
                if (collapseSidebarBtn) {
                    collapseSidebarBtn.addEventListener('click', () => {
                        sidebar.classList.toggle('collapsed');
                        const isCollapsed = sidebar.classList.contains('collapsed');
                        collapseSidebarBtn.innerHTML = isCollapsed ? '&#10095;' : '&#10094;';
                        collapseSidebarBtn.title = isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
                        if (leftResizer) leftResizer.style.display = isCollapsed ? 'none' : 'block';
                    });
                }

                if (expandPreviewBtn) {
                    expandPreviewBtn.addEventListener('click', () => {
                        previewPane.classList.toggle('collapsed');
                        const isCollapsed = previewPane.classList.contains('collapsed');
                        expandPreviewBtn.innerHTML = isCollapsed ? '&#10094;' : '&#10095;';
                        expandPreviewBtn.title = isCollapsed ? 'Expand Preview' : 'Collapse Preview';
                        if (rightResizer) rightResizer.style.display = isCollapsed ? 'none' : 'block';
                    });
                }
            };

            // ---- Bootstrap (init) ----
            let firstLaunch = true;
            const init = () => {
                const persistedFiles = localStorage.getItem('ide-files');
                const persistedFolders = localStorage.getItem('ide-folders');
                const persistedTabs = localStorage.getItem('ide-tabs');
                const persistedActive = localStorage.getItem('ide-active');

                if (persistedFiles) {
                    files = JSON.parse(persistedFiles);
                    folders = new Set(JSON.parse(persistedFolders || '[]'));
                    openTabs = JSON.parse(persistedTabs || '[]');
                    activeFile = persistedActive || Object.keys(files)[0];
                } else {
                    files = JSON.parse(JSON.stringify(DEFAULT));
                    folders.clear();
                    // Pre-register folders from DEFAULT
                    Object.keys(files).forEach(f => {
                        const p = f.split('/');
                        if(p.length > 1) {
                            for(let i=1; i<p.length; i++) folders.add(p.slice(0,i).join('/'));
                        }
                    });
                    openTabs = ['index.html', 'style.css', 'script.js'];
                    activeFile = 'index.html';
                }

                collapsedFolders.clear();
                if (el.editor) el.editor.value = files[activeFile] || '';
                renderFileTree();
                renderTabs();
                refreshHighlight();
                updateStatus();
                updateIframe();
                
                // Show template picker on first launch
                if (firstLaunch && templatePicker && !persistedFiles) {
                    templatePicker.style.display = 'flex';
                }
                initResizers(); // Initialize resizing logic
                firstLaunch = false;
            };

            return { init, updateIframe, loadTemplate };
        })();

        // Fetchers for Dashboards
        let guideLoaded = false;
        const loadGuide = async () => {
            if (guideLoaded) return;
            try {
                const res = await fetch('guide.txt');
                const text = await res.text();
                document.getElementById('guide-content').textContent = text;
                guideLoaded = true;
            } catch (e) {
                document.getElementById('guide-content').textContent = "ERROR: Failed to load manual.";
            }
            unlockAchievement('SCHOLAR', 'Manual Reader', '📚');
        };

        let historyLoaded = false;
        const loadHistory = async () => {
            if (historyLoaded) return;
            const listEl = document.getElementById('history-list');
            try {
                const res = await fetch('https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/commits?per_page=15');
                const commits = await res.json();
                listEl.innerHTML = '';
                commits.forEach(c => {
                    const li = document.createElement('li');
                    li.className = 'history-item';
                    const date = new Date(c.commit.author.date).toLocaleString();
                    li.innerHTML = `
                        <a href="${c.html_url}" target="_blank" class="history-sha">${c.sha.substring(0, 7)}</a>
                        <span class="history-msg">${c.commit.message}</span>
                        <span class="history-date">${c.commit.author.name} - ${date}</span>
                    `;
                    listEl.appendChild(li);
                });
                historyLoaded = true;
            } catch (e) {
                listEl.innerHTML = '<div class="loading">ERROR: FAILED TO FETCH COMMITS</div>';
            }
            unlockAchievement('HISTORIAN', 'Timeline Watcher', '🕰️');
        };


// --- AI Configuration (BYOK) ---

const AI_CONFIG = {
    apiKey: localStorage.getItem('gemini_api_key'),
    enabled: localStorage.getItem('ai_enabled') === 'true',
    model: 'gemini-2.5-flash-lite',
    genAI: null,
    instance: null
};

// --- Storage Utilities ---
const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('ai_enabled', 'true');
    AI_CONFIG.apiKey = key;
    AI_CONFIG.enabled = true;
};

const disableAI = () => {
    localStorage.setItem('ai_enabled', 'false');
    AI_CONFIG.enabled = false;
    showNotification('S.U.D.O AI DISABLED', 'accent');
};

        let contributorsLoaded = false;
        let _contributorData = null;

        const loadContributors = async () => {
            const contentEl = document.getElementById('contributors-content');
            if (!contentEl) return;

            // Check localStorage Cache First
            const CACHE_KEY = 'sudo_contributors_cache';
            const CACHE_TIME_KEY = 'sudo_contributors_timestamp';
            const ONE_HOUR = 60 * 60 * 1000;
            
            const cachedData = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
            const isFresh = cachedTime && (Date.now() - cachedTime < ONE_HOUR);

            if (isFresh && cachedData) {
                _contributorData = JSON.parse(cachedData);
                renderContributorsView(_contributorData, 'all-time');
                updateContribStatus(cachedTime);
                unlockAchievement('SOCIALITE', 'Community Explorer', '🤝');
                return;
            }

            contentEl.innerHTML = '<div class="loading">FETCHING GITHUB DATA...</div>';
            
            try {
                // Try fetching from local backup first (pre-generated by GH Action)
                let contributors, todaysCommits = [], weekCommits = [];
                let useAPI = false;

                try {
                    const backupRes = await fetch('contributors-backup.json');
                    if (backupRes.ok) {
                        const backup = await backupRes.json();
                        _contributorData = backup.data;
                        
                        // Render AI Insight if available
                        if (backup.ai_insight) {
                            const aiBox = document.getElementById('ai-commentary-box');
                            const aiText = document.getElementById('ai-insight-text');
                            if (aiBox && aiText) {
                                aiText.textContent = backup.ai_insight;
                                aiBox.style.display = 'block';
                            }
                        }

                        localStorage.setItem(CACHE_KEY, JSON.stringify(_contributorData));
                        localStorage.setItem(CACHE_TIME_KEY, backup.timestamp || Date.now());
                        renderContributorsView(_contributorData, 'all-time');
                        updateContribStatus(backup.timestamp);
                        return;
                    } else {
                        useAPI = true;
                    }
                } catch(e) { useAPI = true; }

                if (useAPI) {
                    // API Fallback (Rate limit risk!)
                    const contributorsRes = await fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/contributors`);
                    if (!contributorsRes.ok) throw new Error('API Rate Limited');
                    contributors = await contributorsRes.json();
                    
                    const today = new Date(); today.setHours(0,0,0,0);
                    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0,0,0,0);

                    // Batch fetches for today and week
                    const [tRes, wRes] = await Promise.all([
                        fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/commits?since=${today.toISOString()}`),
                        fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/commits?since=${weekAgo.toISOString()}&per_page=100`)
                    ]);

                    if (tRes.ok) todaysCommits = await tRes.json();
                    if (wRes.ok) weekCommits = await wRes.json();

                    const todayTally = {}; todaysCommits.forEach(c => todayTally[c.author?.login || 'Unknown'] = (todayTally[c.author?.login || 'Unknown'] || 0) + 1);
                    const weekTally = {}; weekCommits.forEach(c => weekTally[c.author?.login || 'Unknown'] = (weekTally[c.author?.login || 'Unknown'] || 0) + 1);

                    // Note: We are NO LONGER fetching individual user profiles here to save rate limits.
                    // We rely on data available in the contributors list.
                    const detailed = contributors.map(c => ({
                        ...c,
                        details: { name: c.login, bio: null, public_repos: 0, followers: 0, created_at: null },
                        todayCommits: todayTally[c.login] || 0,
                        weekCommits: weekTally[c.login] || 0
                    }));

                    const totalCommits = detailed.reduce((s, c) => s + c.contributions, 0);
                    _contributorData = { detailed, totalCommits };
                    
                    localStorage.setItem(CACHE_KEY, JSON.stringify(_contributorData));
                    localStorage.setItem(CACHE_TIME_KEY, Date.now());
                    renderContributorsView(_contributorData, 'all-time');
                    updateContribStatus(Date.now());
                }
            } catch (e) {
                console.error(e);
                contentEl.innerHTML = '<div class="loading" style="opacity:0.6;">SYSTEM: GITHUB API RATE LIMIT EXCEEDED. <br> LOADING STATIC HALL OF FAME...</div>';
            }
        };

        const updateContribStatus = (timestamp) => {
            const statusEl = document.getElementById('contrib-sync-status');
            if (statusEl) {
                const date = new Date(parseInt(timestamp));
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                statusEl.innerHTML = `<span class="status-dot"></span> LIVE SYNC: ${timeStr}`;
            }
            
            // Wire up tab buttons once data is loaded
            const tabs = document.querySelectorAll('.contrib-tab');
            tabs.forEach(tab => {
                tab.replaceWith(tab.cloneNode(true)); // remove old listeners
            });
            document.querySelectorAll('.contrib-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.contrib-tab').forEach(t => t.classList.remove('active'));
                    if (tab) tab.classList.add('active');
                    renderContributorsView(_contributorData, view);
                });
            });

            // Wire up contributor clicks for AI bios
            document.querySelectorAll('.contr-row').forEach(row => {
                row.addEventListener('click', async (e) => {
                    const login = row.querySelector('.contr-name')?.textContent?.replace('@', '');
                    if (!login || !AI_CONFIG.enabled || !AI_CONFIG.instance) return;

                    const bioText = document.getElementById('ai-insight-text');
                    const aiBox = document.getElementById('ai-commentary-box');
                    if (bioText && aiBox) {
                        aiBox.style.display = 'block';
                        bioText.textContent = `SYSTEM: ANALYZING @${login} BEHAVIOR...`;
                        
                        try {
                            const prompt = `Analyze this GitHub contributor: ${login}. Write a 1-sentence "personality profile" describing their coding style (e.g., 'The Relentless Optimizer', 'The Bug Hunter'). Be creative and technical. Respond with ONLY the profile text.`;
                            const result = await AI_CONFIG.instance.generateContent(prompt);
                            bioText.textContent = result.response.text();
                        } catch (err) {
                            console.error('AI Bio Error:', err);
                            bioText.textContent = 'ERROR: AI CORE TIMEOUT.';
                        }
                    }
                });
            });
        };

        const renderContributorsView = (data, view) => {
            const container = document.getElementById('contributors-content');
            if (!container) return;
            
            let sorted = [...data.detailed];
            let metricKey = 'contributions';
            let metricLabel = 'TOTAL';
            let emptyMsg = 'No contributors found.';
            
            if (view === 'today') {
                sorted = sorted.filter(c => c.todayCommits > 0);
                sorted.sort((a, b) => b.todayCommits - a.todayCommits);
                metricKey = 'todayCommits';
                metricLabel = 'TODAY';
                emptyMsg = 'No commits today yet — be the first! 🚀';
            } else if (view === 'this-week') {
                sorted = sorted.filter(c => c.weekCommits > 0);
                sorted.sort((a, b) => b.weekCommits - a.weekCommits);
                metricKey = 'weekCommits';
                metricLabel = 'THIS WEEK';
                emptyMsg = 'No commits this week yet — be the first! 🚀';
            } else {
                sorted.sort((a, b) => b.contributions - a.contributions);
            }
            
            if (sorted.length === 0) {
                container.innerHTML = `<div class="loading" style="animation:none;opacity:0.6;">${emptyMsg}</div>`;
                return;
            }
            
            const maxMetric = sorted[0][metricKey];
            
            const rows = sorted.map((c, i) => {
                const rank = i + 1;
                const metricVal = c[metricKey];
                const pct = maxMetric > 0 ? Math.round((metricVal / maxMetric) * 100) : 0;
                
                const nameDisplay = `@${c.login}`;
                const aiTitle = c.ai_title ? `<div class="contr-ai-title">${c.ai_title}</div>` : '';
                const bio = '';
                
                let rankDisplay = `#${rank}`;
                if (rank === 1) rankDisplay = '🥇 1ST';
                else if (rank === 2) rankDisplay = '🥈 2ND';
                else if (rank === 3) rankDisplay = '🥉 3RD';
                
                const isTop3 = rank <= 3;
                
                // --- AUTOMATED BADGE LOGIC ---
                let badges = '';
                if (isTop3) badges += `<span class="contr-badge contr-badge-top">TOP ${rank}</span>`;
                if (c.contributions <= 5) badges += `<span class="contr-badge contr-badge-new">NEW</span>`;
                if (c.todayCommits > 0) badges += `<span class="contr-badge contr-badge-active">ACTIVE TODAY</span>`;
                
                const delay = i * 0.05;
                
                return `
                <a href="${c.html_url}" target="_blank" class="contr-row${isTop3 ? ' contr-spotlight' : ''}" style="animation-delay:${delay}s;">
                    <div class="contr-rank">${rankDisplay}</div>
                    <img src="${c.avatar_url}" class="contr-avatar" alt="${c.login}">
                    <div class="contr-info">
                        <div class="contr-name">${nameDisplay}</div>
                        ${aiTitle}
                        <div class="contr-badges">${badges}</div>
                    </div>
                    <div class="contr-stat">
                        <div class="contr-stat-val">${metricVal.toLocaleString()}</div>
                        <div class="contr-stat-label">${metricLabel}</div>
                    </div>
                    <div class="contr-bar-wrap">
                        <div class="contr-bar" data-width="${pct}%"></div>
                    </div>
                </a>
                `;
            }).join('');
            
            container.innerHTML = `<div class="contrib-list">${rows}</div>`;
            
            // Animate progress bars
            setTimeout(() => {
                container.querySelectorAll('.contr-bar').forEach(bar => {
                    bar.style.width = bar.getAttribute('data-width');
                });
            }, 100);
        };

        // --- S.U.D.O AI System ---
        const openAIModal = () => {
            const modal = document.getElementById('ai-modal-overlay');
            if (modal) modal.style.display = 'flex';
        };

        const closeAIModal = () => {
            const modal = document.getElementById('ai-modal-overlay');
            if (modal) modal.style.display = 'none';
            document.getElementById('ai-validation-status').textContent = '';
        };

        const validateAndEnableAI = async () => {
            const keyInput = document.getElementById('gemini-api-key');
            const status = document.getElementById('ai-validation-status');
            const key = keyInput.value.trim();

            if (!key) {
                status.textContent = 'ERROR: No API key provided.';
                status.className = 'ai-validation-status ai-status-error';
                return;
            }

            status.textContent = 'VALIDATING CORE...';
            status.className = 'ai-validation-status';

            try {
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash-lite" 
                });
                const result = await model.generateContent("Respond with 'OK'");
                
                if (result.response.text()) {
                    saveApiKey(key);
                    AI_CONFIG.genAI = genAI;
                    AI_CONFIG.instance = model;
                    AI_CONFIG.enabled = true;
                    
                    status.textContent = 'AI CORE ACTIVATED.';
                    status.className = 'ai-validation-status ai-status-success';
                    
                    // Show all AI features
                    document.querySelectorAll('.ai-only').forEach(el => el.style.display = 'block');
                    
                    setTimeout(() => {
                        closeAIModal();
                        showNotification('S.U.D.O AI ENABLED', 'accent');
                    }, 1000);
                }
            } catch (err) {
                console.error('AI Validation Error:', err);
                const errMsg = err.message || String(err);
                if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
                    status.textContent = 'ERROR: Rate limit exceeded. Please wait a minute and try again.';
                } else if (errMsg.includes('404')) {
                    status.textContent = 'ERROR: Model not found. Please check API version.';
                } else if (errMsg.includes('400') || errMsg.includes('API_KEY_INVALID')) {
                    status.textContent = 'ERROR: Invalid API Key. Please check your key.';
                } else {
                    status.textContent = 'ERROR: Connection issue. Please try again.';
                }
                status.className = 'ai-validation-status ai-status-error';
            }
        };
        
        // --- S.U.D.O AI HANDLERS ---
        
        async function handleTerminalAIFallback(query) {
            if (!query || query.length < 3) return;
            const errorEl = document.getElementById('terminal-error');
            if (errorEl) {
                errorEl.innerHTML = `<span class="err-icon">✨</span> AI IS ANALYZING: <u>${query}</u>`;
                errorEl.style.display = 'block';
            }

            try {
                const prompt = `You are the S.U.D.O Hub Digital Assistant. The user typed an unknown command: "${query}". 
                Available commands: ${COMMANDS.join(', ')}.
                If it looks like a command, suggest the closest one. 
                If it's a question about the hub, answer it briefly (max 2 sentences).
                If it's code-related, give a very short tip.
                Respond in a concise, technical, helpful tone. Keep it under 40 words.`;
                
                const result = await AI_CONFIG.instance.generateContent(prompt);
                const response = result.response.text();
                
                if (errorEl) {
                    errorEl.innerHTML = `<span class="err-icon">🤖</span> AI_INSIGHT: ${response}`;
                    errorEl.style.display = 'block';
                }
            } catch (err) {
                console.error('Terminal AI Error:', err);
                showErrorFeedback(query);
            }
        }

        async function handleIDEReview(fileName, content) {
            if (!content) return;
            showNotification('AI IS REVIEWING CODE...', 'accent');
            
            try {
                const prompt = `Act as a senior software engineer. Review this file: ${fileName}.
                Content:
                ${content}
                
                Provide a high-level review. Point out 1 strength and 1 potential improvement.
                Be encouraging but technical. Max 60 words.`;
                
                const result = await AI_CONFIG.instance.generateContent(prompt);
                const response = result.response.text();
                
                // Show result in a popup or a dedicated section
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'ai-gen-result';
                reviewDiv.innerHTML = `
                    <div class="ai-gen-header"><i class='bx bxs-magic-wand'></i> AI CODE REVIEW: ${fileName}</div>
                    <div class="ai-gen-body">${response}</div>
                    <button class="theme-btn btn-sm" style="margin-top:10px" onclick="this.parentElement.remove()">ACKNOWLEDGE</button>
                `;
                document.querySelector('.ide-main').appendChild(reviewDiv);
            } catch (err) {
                console.error('IDE AI Error:', err);
                showNotification('AI REVIEW FAILED', 'error');
            }
        }

        async function handleStatsAnalysis(statsData) {
            showNotification('ANALYZING REPOSITORY...', 'accent');
            const graphsContainer = document.getElementById('stats-graphs');
            
            // Avoid duplicate analysis boxes
            const existing = document.querySelector('.stats-dashboard .ai-gen-result');
            if (existing) existing.remove();

            try {
                const prompt = `Analyze these repository stats for "javascriptProjectBasedLearning":
                Total Projects: ${statsData.stats.total}
                Latest Project: ${statsData.stats.latestProject}
                Longest Codebase: ${statsData.stats.longestCodeProject}
                Categories: ${statsData.stats.categories}
                
                Provide a 2-sentence "System Health" summary and 1 "S.U.D.O Recommendation" for the next project.
                Tone: Futuristic, analytical.`;
                
                const result = await AI_CONFIG.instance.generateContent(prompt);
                const response = result.response.text();
                
                const analysisDiv = document.createElement('div');
                analysisDiv.className = 'ai-gen-result';
                analysisDiv.innerHTML = `
                    <div class="ai-gen-header"><i class='bx bxs-magic-wand'></i> REPOSITORY ANALYSIS</div>
                    <div class="ai-gen-body">${response}</div>
                `;
                graphsContainer.after(analysisDiv);
            } catch (err) {
                console.error('Stats AI Error:', err);
                showNotification('ANALYSIS FAILED', 'error');
            }
        }

        // Initialize AI on load if key exists
        if (AI_CONFIG.apiKey && AI_CONFIG.enabled) {
            try {
                AI_CONFIG.genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);
                AI_CONFIG.instance = AI_CONFIG.genAI.getGenerativeModel({ 
                    model: AI_CONFIG.model 
                });
                console.log('S.U.D.O AI Core Ready');
                // Show bits
                setTimeout(() => {
                    document.querySelectorAll('.ai-only').forEach(el => el.style.display = 'block');
                }, 500);
            } catch (e) {
                console.error('Failed to init AI:', e);
            }
        }

        // --- Event Listeners for Modal ---
        document.getElementById('close-ai-modal')?.addEventListener('click', closeAIModal);
        document.getElementById('save-ai-key')?.addEventListener('click', validateAndEnableAI);
        document.getElementById('ai-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'ai-modal-overlay') closeAIModal();
        });

        // AI Feature Listeners
        document.getElementById('ai-ide-review')?.addEventListener('click', () => {
            if (activeFile) handleIDEReview(activeFile, files[activeFile]);
        });
        document.getElementById('ai-stats-analyze')?.addEventListener('click', () => {
            handleStatsAnalysis(data);
        });

        // --- Popup / Error Feedback System ---
        const showErrorFeedback = (cmd) => {
            let errorEl = document.getElementById('terminal-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.id = 'terminal-error';
                errorEl.className = 'terminal-error-message';
                document.querySelector('.search-container').appendChild(errorEl);
            }
            errorEl.innerHTML = `<span class="err-icon">⚠</span> COMMAND_NOT_FOUND: <u>${cmd}</u>`;
            errorEl.style.display = 'block';
        };

        const hideErrorFeedback = () => {
            const errorEl = document.getElementById('terminal-error');
            if (errorEl) errorEl.style.display = 'none';
        };

        const showFuturePopup = (cmd) => {
            const descriptions = {
                socials: "Stay connected! This will link to our Discord, Twitter, and GitHub community channels.",
                blog: "Deep dives and tutorials. This will showcase our latest articles on JavaScript best practices.",
                feedback: "Your voice matters. This will launch a direct portal to suggest features and report bugs.",
                settings: "Personalize your hub. This will allow toggling themes, animations, and sound levels.",
                arcade: "Play and learn. This will host a collection of mini-games built with vanilla JS and Canvas.",
                themes: "Visual override. This will let you load and create custom CSS themes for the laboratory.",
                resources: "Learning paths. This will curate the best documentation and tools for modern JS dev.",
                license: "Legal & Attribution. This will display licensing details for the open-source projects.",
                support: "Fuel the lab. This will provide ways to support the project and get priority help.",
                changelog: "Evolution log. This will show a detailed history of all hub updates and new features."
            };

            const popup = document.createElement('div');
            popup.className = 'future-popup-overlay';
            popup.innerHTML = `
                <div class="future-popup-box">
                    <div class="future-popup-header">[ FUTURE_ENHANCEMENT ]</div>
                    <div class="future-popup-body">
                        <div class="future-cmd-title">COMMAND: ${cmd.toUpperCase()}</div>
                        <p class="future-desc">${descriptions[cmd] || "Coming soon to the S.U.D.O ecosystem."}</p>
                        <div class="future-status-tag">STATUS: PLANNED_RELEASE_V1.2</div>
                    </div>
                    <div class="future-popup-footer">
                        <button class="theme-btn popup-close-btn">ACKNOWLEDGE</button>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
            playSound('switch');

            const close = () => {
                popup.classList.add('hide');
                setTimeout(() => popup.remove(), 400);
            };

            popup.querySelector('.popup-close-btn').addEventListener('click', close);
            popup.addEventListener('click', (e) => { if (e.target === popup) close(); });
        };

        // Live Search Filtering
        if (searchInput) {
            searchInput.focus(); // Auto focus terminal
            searchInput.addEventListener('input', (e) => {
                playSound('type');
                const val = e.target.value.toLowerCase();
                const term = val.trim();
                
                // Ghost text logic
                if (ghostText) {
                    ghostText.textContent = '';
                    if (val) {
                        const match = COMMANDS.find(c => c.startsWith(val));
                        if (match && match !== val) {
                            ghostText.textContent = match;
                            // ACHIEVEMENT: GHOST_USER
                            const tabCount = parseInt(localStorage.getItem('tab-autocomplete-count') || '0');
                            if (tabCount >= 5) unlockAchievement('GHOST_USER', 'Speed Demon', '👻');
                        }
                    }
                }

                // Help dropdown toggle
                if (helpDropdown && term !== 'help') {
                    helpDropdown.style.display = 'none';
                }

                if (COMMANDS.includes(term)) {
                    hideAllDashboards();
                    
                    // Show future command popup if it's one of the new placeholders
                    const futureCommands = ['socials', 'blog', 'feedback', 'settings', 'arcade', 'themes', 'resources', 'license', 'support', 'changelog'];
                    if (futureCommands.includes(term)) {
                        showFuturePopup(term);
                        searchInput.value = '';
                        if (ghostText) ghostText.textContent = '';
                        return;
                    }

                    if (term === 'help') {
                        if (helpDropdown) helpDropdown.style.display = 'block';
                        return;
                    }
                    mainContainer.style.display = 'none';
                    if (term === 'clear') {
                        resetUI();
                        return;
                    } else if (term === 'matrix') {
                        // Secret command
                        unlockAchievement('NEO', 'The Chosen One', '💊');
                        if (searchInput) {
                             searchInput.value = '';
                             searchInput.placeholder = 'Follow the white rabbit...';
                        }
                        return;
                    } else if (term === 'stats') {
                        statsDashboard.style.display = 'flex';
                        statsDashboard.style.flexDirection = 'column';
                        renderStats(data);
                        unlockAchievement('ANALYST', 'Data Scientist', '📊');
                    } else if (term === 'guide') {
                        guideDashboard.style.display = 'flex';
                        guideDashboard.style.flexDirection = 'column';
                        loadGuide();
                    } else if (term === 'history') {
                        historyDashboard.style.display = 'flex';
                        historyDashboard.style.flexDirection = 'column';
                        loadHistory();
                    } else if (term === 'contribute') {
                        contributeDashboard.style.display = 'flex';
                        contributeDashboard.style.flexDirection = 'column';
                        IDE.init();
                    } else if (term === 'contributors') {
                        if (contributorsDashboard) {
                            contributorsDashboard.style.display = 'flex';
                            contributorsDashboard.style.flexDirection = 'column';
                            loadContributors();
                        }
                    } else if (term === 'enable ai' || term === 'enable-ai') {
                        openAIModal();
                        return;
                    } else if (term === 'disable ai' || term === 'disable-ai') {
                        disableAI();
                        return;
                    } else if (term === 'ask') {
                        if (!AI_CONFIG.enabled || !AI_CONFIG.instance) {
                            showAIError('AI is not enabled. Type "enable-ai" first.');
                            searchInput.value = '';
                            return;
                        }
                        if (aiChatDashboard) {
                            aiChatDashboard.style.display = 'flex';
                            aiChatDashboard.style.flexDirection = 'column';
                            document.getElementById('ai-chat-input')?.focus();
                        }
                    } else if (term === 'learn') {
                        if (!AI_CONFIG.enabled || !AI_CONFIG.instance) {
                            showAIError('AI is not enabled. Type "enable-ai" first.');
                            searchInput.value = '';
                            return;
                        }
                        if (learnDashboard) {
                            learnDashboard.style.display = 'flex';
                            learnDashboard.style.flexDirection = 'column';
                            handleLearningPath(data);
                        }
                    } else if (term === 'idea') {
                        if (!AI_CONFIG.enabled || !AI_CONFIG.instance) {
                            showAIError('AI is not enabled. Type "enable-ai" first.');
                            searchInput.value = '';
                            return;
                        }
                        if (ideaDashboard) {
                            ideaDashboard.style.display = 'flex';
                            ideaDashboard.style.flexDirection = 'column';
                            handleIdeaGenerator(data);
                        }
                    }
                    return;
                } else {
                    // Show error if command not found and not a search term
                    const anyProjectMatches = data.projects.some(p => 
                        p.name.toLowerCase().includes(term) || 
                        p.category.toLowerCase().includes(term) || 
                        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
                    );

                    if (AI_CONFIG.enabled && AI_CONFIG.instance) {
                        handleTerminalAIFallback(term);
                    } else if (term.length > 0 && !anyProjectMatches && !COMMANDS.some(c => c.startsWith(term))) {
                        showErrorFeedback(term);
                    } else {
                        hideErrorFeedback();
                    }

                    hideAllDashboards();
                }

                const allGroups = document.querySelectorAll('.category-group');
                allGroups.forEach(group => {
                    const items = group.querySelectorAll('.project-item');
                    let visibleCount = 0;
                    
                    items.forEach(item => {
                        const name = item.getAttribute('data-name');
                        const category = group.getAttribute('data-category');
                        const tags = item.getAttribute('data-tags') || '';
                        
                        if (name.includes(term) || category.includes(term) || tags.includes(term)) {
                            item.style.display = 'block';
                            visibleCount++;
                        } else {
                            item.style.display = 'none';
                        }
                    });
                    
                    if (visibleCount === 0) {
                        group.style.display = 'none';
                    } else {
                        group.style.display = 'flex';
                    }
                });
            });

            // Tab autocomplete
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab' && ghostText && ghostText.textContent) {
                    e.preventDefault();
                    searchInput.value = ghostText.textContent;
                    ghostText.textContent = '';
                    // Increment count for achievement
                    const newCount = parseInt(localStorage.getItem('tab-autocomplete-count') || '0') + 1;
                    localStorage.setItem('tab-autocomplete-count', newCount);
                    searchInput.dispatchEvent(new Event('input'));
                }
            });

            // Help dropdown click handler
            document.querySelectorAll('.help-item').forEach(item => {
                item.addEventListener('click', () => {
                    const cmd = item.dataset.cmd;
                    if (searchInput) {
                        searchInput.value = cmd;
                        searchInput.dispatchEvent(new Event('input'));
                    }
                });
            });
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        mainContainer.innerHTML = '<div class="loading">SYSTEM ERROR: UNABLE TO LOAD PROJECTS</div>';
    }
});
