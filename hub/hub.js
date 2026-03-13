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
    
    const closeStatsBtn = document.getElementById('close-stats');
    const closeGuideBtn = document.getElementById('close-guide');
    const closeHistoryBtn = document.getElementById('close-history');
    const closeContributeBtn = document.getElementById('close-contribute');
    const closeContributorsBtn = document.getElementById('close-contributors');
    const totalProjectsEl = document.getElementById('total-projects');
    const totalCategoriesEl = document.getElementById('total-categories');
    const searchInput = document.getElementById('search-input');
    const themeBtns = document.querySelectorAll('.theme-btn');


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
            themeBtns.forEach(b => { if(b.id !== 'close-stats') b.classList.remove('active')});
            btn.classList.add('active');
            const theme = btn.getAttribute('data-theme');
            document.body.className = theme === 'modern' ? '' : `theme-${theme}`;
            localStorage.setItem('hub-theme', theme);
            playSound('switch', theme);
        });
    });

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
        const data = await response.json();

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
                                <div class="project-preview">
                                    <img src="../${project.id}/preview.png" onerror="this.parentElement.style.display='none'" alt="">
                                </div>
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

        closeStatsBtn.addEventListener('click', resetUI);
        closeGuideBtn.addEventListener('click', resetUI);
        closeHistoryBtn.addEventListener('click', resetUI);
        closeContributeBtn.addEventListener('click', resetUI);
        if (closeContributorsBtn) closeContributorsBtn.addEventListener('click', resetUI);

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
                el.findBar.style.display = showing ? 'none' : 'flex';
                if (!showing && el.findInput) { el.findInput.focus(); el.findInput.select(); }
                if (showing) { refreshHighlight(); if(el.findCount) el.findCount.textContent = ''; }
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

            // ---- Bootstrap (init) ----
            let firstLaunch = true;
            const init = () => {
                files = JSON.parse(JSON.stringify(DEFAULT));
                folders.clear();
                // Pre-register folders from DEFAULT
                Object.keys(files).forEach(f => {
                    const p = f.split('/');
                    if(p.length > 1) {
                        for(let i=1; i<p.length; i++) folders.add(p.slice(0,i).join('/'));
                    }
                });
                collapsedFolders.clear();
                openTabs = ['index.html', 'style.css', 'script.js'];
                activeFile = 'index.html';
                if (el.editor) el.editor.value = files[activeFile];
                renderFileTree();
                renderTabs();
                refreshHighlight();
                updateStatus();
                updateIframe();
                // Show template picker on first launch
                if (firstLaunch && templatePicker) {
                    templatePicker.style.display = 'flex';
                    firstLaunch = false;
                }
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
        };

        let contributorsLoaded = false;
        let _contributorData = null; // cached data for tab switching

        const loadContributors = async () => {
            if (contributorsLoaded && _contributorData) {
                renderContributorsView(_contributorData, 'all-time');
                return;
            }
            const contentEl = document.getElementById('contributors-content');
            if (!contentEl) return;
            
            contentEl.innerHTML = '<div class="loading">FETCHING GITHUB DATA... (THIS MAY TAKE A MOMENT)</div>';
            
            try {
                // 1. Fetch all contributors
                const contributorsRes = await fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/contributors`);
                if (!contributorsRes.ok) throw new Error('Failed to fetch contributors');
                let contributors = await contributorsRes.json();
                
                // 2. Today's commits
                const today = new Date();
                today.setHours(0,0,0,0);
                let todaysCommits = [];
                try {
                    const r = await fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/commits?since=${today.toISOString()}`);
                    if (r.ok) todaysCommits = await r.json();
                } catch(e) {}
                
                const todayTally = {};
                todaysCommits.forEach(c => {
                    const login = c.author ? c.author.login : (c.commit?.author?.name || 'Unknown');
                    todayTally[login] = (todayTally[login] || 0) + 1;
                });

                // 3. This week's commits
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                weekAgo.setHours(0,0,0,0);
                let weekCommits = [];
                try {
                    const r = await fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/commits?since=${weekAgo.toISOString()}&per_page=100`);
                    if (r.ok) weekCommits = await r.json();
                } catch(e) {}

                const weekTally = {};
                weekCommits.forEach(c => {
                    const login = c.author ? c.author.login : (c.commit?.author?.name || 'Unknown');
                    weekTally[login] = (weekTally[login] || 0) + 1;
                });
                
                // 4. Fetch user details (top 30 to avoid rate limits)
                const limited = contributors.slice(0, 30);
                const detailed = [];
                for (const c of limited) {
                    let details = { name: null, bio: null, public_repos: 0, followers: 0 };
                    try {
                        const userRes = await fetch(`https://api.github.com/users/${c.login}`);
                        if (userRes.ok) {
                            const u = await userRes.json();
                            details = { name: u.name || u.login, bio: u.bio, public_repos: u.public_repos, followers: u.followers };
                        }
                    } catch(e) {}
                    
                    detailed.push({
                        ...c,
                        details,
                        todayCommits: todayTally[c.login] || 0,
                        weekCommits: weekTally[c.login] || 0
                    });
                }
                
                // 5. Compute totals for stat cards
                const totalContributors = detailed.length;
                const totalCommits = detailed.reduce((s, c) => s + c.contributions, 0);
                const totalToday = todaysCommits.length;
                const mvp = detailed.length > 0 ? detailed.reduce((a, b) => a.contributions > b.contributions ? a : b) : null;
                
                document.getElementById('cs-total').textContent = totalContributors;
                document.getElementById('cs-commits').textContent = totalCommits.toLocaleString();
                document.getElementById('cs-today').textContent = totalToday;
                document.getElementById('cs-mvp').textContent = mvp ? `@${mvp.login}` : '--';
                
                _contributorData = { detailed, totalCommits };
                contributorsLoaded = true;
                
                // 6. Wire up tab buttons
                const tabs = document.querySelectorAll('.contrib-tab');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        tabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        renderContributorsView(_contributorData, tab.dataset.view);
                    });
                });
                
                renderContributorsView(_contributorData, 'all-time');
                
            } catch (e) {
                console.error(e);
                contentEl.innerHTML = '<div class="loading">ERROR: RATE LIMIT EXCEEDED OR FAILED TO FETCH</div>';
            }
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
                
                const nameDisplay = c.details.name && c.details.name !== c.login 
                    ? `${c.details.name} <span class="contr-login">(@${c.login})</span>` 
                    : `@${c.login}`;
                const bio = c.details.bio ? `<div class="contr-bio">"${c.details.bio}"</div>` : '';
                
                let rankDisplay = `#${rank}`;
                if (rank === 1) rankDisplay = '🥇 1ST';
                else if (rank === 2) rankDisplay = '🥈 2ND';
                else if (rank === 3) rankDisplay = '🥉 3RD';
                
                const isTop3 = rank <= 3;
                const isNew = c.contributions <= 5;
                
                let badges = '';
                if (isTop3) badges += `<span class="contr-badge contr-badge-top">TOP ${rank}</span>`;
                if (isNew) badges += `<span class="contr-badge contr-badge-new">NEW</span>`;
                
                const delay = i * 0.05;
                
                return `
                <a href="${c.html_url}" target="_blank" class="contr-row${isTop3 ? ' contr-spotlight' : ''}" style="animation-delay:${delay}s;">
                    <div class="contr-rank">${rankDisplay}</div>
                    <img class="contr-avatar" src="${c.avatar_url}" alt="${c.login}">
                    <div class="contr-main">
                        <div class="contr-header">
                            <span class="contr-name">${nameDisplay}</span>
                            ${badges}
                            <span class="contr-metric">${metricVal} ${metricLabel}</span>
                        </div>
                        ${bio}
                        <div class="contr-stats">
                            <span>📦 ${c.details.public_repos||0} Repos</span>
                            <span>👥 ${c.details.followers||0} Followers</span>
                            <span>📝 ${c.contributions} All-time</span>
                        </div>
                        <div class="contr-progress-wrap">
                            <div class="contr-progress-bar" data-pct="${pct}"></div>
                        </div>
                    </div>
                    <div class="contr-action">VIEW PROFILE ↗</div>
                </a>
                `;
            }).join('');
            
            container.innerHTML = `<div class="contrib-list">${rows}</div>`;
            
            // Animate progress bars
            setTimeout(() => {
                container.querySelectorAll('.contr-progress-bar').forEach(bar => {
                    bar.style.width = bar.dataset.pct + '%';
                });
            }, 100);
        };

        // Live Search Filtering
        if (searchInput) {
            searchInput.focus(); // Auto focus terminal
            searchInput.addEventListener('input', (e) => {
                playSound('type');
                const term = e.target.value.toLowerCase().trim();
                
                // Dashboard commands
                const COMMANDS = ['stats', 'guide', 'history', 'contribute', 'contributors', 'help', 'clear'];

                // Help dropdown toggle
                if (helpDropdown && term !== 'help') {
                    helpDropdown.style.display = 'none';
                }

                if (COMMANDS.includes(term)) {
                    hideAllDashboards();
                    if (term === 'help') {
                        if (helpDropdown) helpDropdown.style.display = 'block';
                        return;
                    }
                    mainContainer.style.display = 'none';
                    if (term === 'clear') {
                        resetUI();
                        return;
                    } else if (term === 'stats') {
                        statsDashboard.style.display = 'flex';
                        statsDashboard.style.flexDirection = 'column';
                        renderStats(data);
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
                    }
                    return;
                } else {
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
