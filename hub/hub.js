document.addEventListener('DOMContentLoaded', async () => {
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

    // --- Theme Switcher ---
    themeBtns.forEach(btn => {
        if (btn.id === 'close-stats') return;
        btn.addEventListener('click', () => {
            initAudio(); // ensure audio is ready
            themeBtns.forEach(b => { if(b.id !== 'close-stats') b.classList.remove('active')});
            btn.classList.add('active');
            const theme = btn.getAttribute('data-theme');
            document.body.className = theme === 'modern' ? '' : `theme-${theme}`;
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

            // ---- Render helpers ----
            const renderFileTree = () => {
                if (!el.fileTree) return;
                el.fileTree.innerHTML = '';
                Object.keys(files).sort().forEach(name => {
                    const div = document.createElement('div');
                    div.className = 'ide-tree-file' + (name === activeFile ? ' active' : '');
                    div.dataset.name = name;
                    div.innerHTML = `<span class="file-icon">${fileIcon(name)}</span><span>${esc(name)}</span>`;
                    div.addEventListener('click', () => switchFile(name));
                    div.addEventListener('contextmenu', e => showCtxMenu(e, name));
                    el.fileTree.appendChild(div);
                });
            };

            const renderTabs = () => {
                if (!el.tabbar) return;
                el.tabbar.innerHTML = '';
                openTabs.forEach(name => {
                    const tab = document.createElement('div');
                    tab.className = 'ide-tab' + (name === activeFile ? ' active' : '');
                    tab.innerHTML = `<span class="file-icon">${fileIcon(name)}</span><span>${esc(name)}</span><span class="ide-tab-close" data-close="${esc(name)}">✕</span>`;
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
                if (!files[name]) return;
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

            const createFile = () => {
                const name = window.prompt('New file name (e.g. about.html):');
                if (!name || !name.trim()) return;
                const n = name.trim();
                if (files[n]) { alert('File already exists!'); return; }
                files[n] = '';
                openTabs.push(n);
                switchFile(n);
            };

            const renameFile = (oldName) => {
                const newName = window.prompt('Rename to:', oldName);
                if (!newName || newName === oldName) return;
                files[newName] = files[oldName];
                delete files[oldName];
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

            // ---- Context menu ----
            let ctxTarget = null;
            const showCtxMenu = (e, name) => {
                e.preventDefault();
                ctxTarget = name;
                if (!el.ctxMenu) return;
                el.ctxMenu.style.display = 'block';
                el.ctxMenu.style.left = e.clientX + 'px';
                el.ctxMenu.style.top  = e.clientY + 'px';
            };
            if (el.ctxMenu) {
                el.ctxMenu.addEventListener('click', e => {
                    const action = e.target.dataset.ctx;
                    if (action === 'rename' && ctxTarget) renameFile(ctxTarget);
                    if (action === 'delete' && ctxTarget) deleteFile(ctxTarget);
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
                    if (action === 'new-folder') alert('Folders group files visually — create a file named folder/file.html to simulate nesting.');
                    if (action === 'save-zip') triggerSubmit();
                    if (action === 'find') toggleFind();
                });
            });

            // Sidebar create buttons
            const newFileBtn = document.getElementById('ide-btn-new-file');
            if (newFileBtn) newFileBtn.addEventListener('click', createFile);

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

            // ---- Submit PR ----
            const triggerSubmit = () => {
                const submitModal = document.getElementById('submit-modal');
                const titleInput  = document.getElementById('project-title-input');
                if (!submitModal) return;
                if (el.editor) files[activeFile] = el.editor.value;
                titleInput.value = '';
                submitModal.style.display = 'flex';
                setTimeout(() => titleInput && titleInput.focus(), 50);
            };

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

            // ---- Bootstrap (init) ----
            const init = () => {
                files = JSON.parse(JSON.stringify(DEFAULT));
                openTabs = ['index.html', 'style.css', 'script.js'];
                activeFile = 'index.html';
                if (el.editor) el.editor.value = files[activeFile];
                renderFileTree();
                renderTabs();
                refreshHighlight();
                updateStatus();
                updateIframe();
            };

            return { init, updateIframe };
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
        const loadContributors = async () => {
            if (contributorsLoaded) return;
            const contentEl = document.getElementById('contributors-content');
            if (!contentEl) return;
            
            contentEl.innerHTML = '<div class="loading">FETCHING GITHUB DATA... (THIS MAY TAKE A MOMENT)</div>';
            
            try {
                // Fetch all contributors
                const contributorsRes = await fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/contributors`);
                if (!contributorsRes.ok) throw new Error('Failed to fetch contributors');
                let contributors = await contributorsRes.json();
                
                // Group today's commits by author
                const today = new Date();
                today.setHours(0,0,0,0);
                const sinceIso = today.toISOString();
                let todaysCommits = [];
                try {
                    const commitsRes = await fetch(`https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/commits?since=${sinceIso}`);
                    if (commitsRes.ok) {
                        todaysCommits = await commitsRes.json();
                    }
                } catch(e) { console.warn("Could not fetch today's commits"); }
                
                const todayTally = {};
                todaysCommits.forEach(c => {
                    const login = c.author ? c.author.login : (c.commit.author ? c.commit.author.name : 'Unknown');
                    todayTally[login] = (todayTally[login] || 0) + 1;
                });
                
                // Fetch detailed info sequentially/batched (to avoid slamming rate limits)
                // For a big repo this needs pagination/safeguards, but we'll limit to top 30 for details if it gets huge.
                const limitedContributors = contributors.slice(0, 30);
                
                const detailedContributors = [];
                for (const c of limitedContributors) {
                    let details = { name: null, bio: null, public_repos: 0, followers: 0 };
                    try {
                        const userRes = await fetch(`https://api.github.com/users/${c.login}`);
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            details = {
                                name: userData.name || userData.login,
                                bio: userData.bio,
                                public_repos: userData.public_repos,
                                followers: userData.followers
                            };
                        } else {
                            // If rate limit hit (403), keep defaults and don't halt
                            if(userRes.status === 403) {
                                console.warn("Rate limit hit fetching user details.");
                            }
                        }
                    } catch(e) {}
                    
                    detailedContributors.push({
                        ...c,
                        details,
                        todayCommits: todayTally[c.login] || 0
                    });
                }
                
                // Sort by total contributions
                detailedContributors.sort((a,b) => b.contributions - a.contributions);
                
                // Today's heroes
                const todayHeroes = [...detailedContributors].filter(c => c.todayCommits > 0).sort((a,b) => b.todayCommits - a.todayCommits);
                
                renderContributorsUI(contentEl, detailedContributors, todayHeroes);
                contributorsLoaded = true;
                
            } catch (e) {
                console.error(e);
                contentEl.innerHTML = '<div class="loading">ERROR: RATE LIMIT EXCEEDED OR FAILED TO FETCH</div>';
            }
        };

        const renderContributorsUI = (container, contributors, todayHeroes) => {
            let html = ``;
            
            const generateContributorRow = (c, index, isToday) => {
                const rank = index + 1;
                const metric = isToday ? `${c.todayCommits} COMMIT<span style="opacity:0.5;">(S)</span> TODAY` : `${c.contributions} TOTAL PRs/COMMITS`;
                const nameDisplay = c.details.name && c.details.name !== c.login 
                    ? `${c.details.name} <span class="contr-login">(@${c.login})</span>` 
                    : `@${c.login}`;
                const bio = c.details.bio ? `<div class="contr-bio">"${c.details.bio}"</div>` : '';
                
                let rankMedal = `#${rank}`;
                if (!isToday) {
                    if (rank === 1) rankMedal = '🥇 1ST';
                    else if (rank === 2) rankMedal = '🥈 2ND';
                    else if (rank === 3) rankMedal = '🥉 3RD';
                }
                
                return `
                <a href="${c.html_url}" target="_blank" class="contr-row">
                    <div class="contr-rank">${rankMedal}</div>
                    <img class="contr-avatar" src="${c.avatar_url}" alt="${c.login}">
                    <div class="contr-main">
                        <div class="contr-header">
                            <span class="contr-name">${nameDisplay}</span>
                            <span class="contr-metric">${metric}</span>
                        </div>
                        ${bio}
                        <div class="contr-stats">
                            <span class="contr-stat">📦 ${c.details.public_repos||0} Repos</span>
                            <span class="contr-stat">👥 ${c.details.followers||0} Followers</span>
                        </div>
                    </div>
                    <div class="contr-action">VIEW PROFILE ↗</div>
                </a>
                `;
            };

            if (todayHeroes.length > 0) {
                html += `
                <div class="contrib-section">
                    <h3 class="contrib-section-header">🔥 TODAY'S TOP CONTRIBUTORS</h3>
                    <div class="contrib-list">
                        ${todayHeroes.map((c, i) => generateContributorRow(c, i, true)).join('')}
                    </div>
                </div>
                <hr class="contrib-divider"/>
                `;
            }
            
            html += `
            <div class="contrib-section">
                <h3 class="contrib-section-header">🏆 ALL-TIME LEADERBOARD</h3>
                <div class="contrib-list">
                    ${contributors.map((c, i) => generateContributorRow(c, i, false)).join('')}
                </div>
            </div>
            `;
            
            container.innerHTML = html;
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
                if (helpDropdown) {
                    helpDropdown.style.display = (term === 'help') ? 'block' : 'none';
                }

                if (COMMANDS.includes(term)) {
                    hideAllDashboards();
                    if (term === 'help') return; // help just shows the dropdown above, not a full-page dashboard
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
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        mainContainer.innerHTML = '<div class="loading">SYSTEM ERROR: UNABLE TO LOAD PROJECTS</div>';
    }
});
