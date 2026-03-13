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
    const submitProjectBtn = document.getElementById('submit-project');
    
    const ideFileList = document.getElementById('ide-file-list');
    const ideEditor = document.getElementById('ide-editor');
    const ideHighlight = document.getElementById('ide-highlight');
    const currentFileLabel = document.getElementById('current-file-label');
    const ideIframe = document.getElementById('ide-iframe');
    const refreshPreviewBtn = document.getElementById('refresh-preview');
    
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

        // --- IDE Logic ---
        const ideFiles = {
            html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>New Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello Open Source</h1>\n  <p>Start coding in the pane to your left!</p>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
            css: `body { \n  background: #1e1e1e;\n  color: #00ff41;\n  font-family: monospace;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}`,
            js: `console.log("Ready to code!");`
        };
        let currentIdeFile = 'html';

        const updateIframe = () => {
            if (!ideIframe) return;
            const doc = ideIframe.contentWindow.document;
            const html = ideFiles.html;
            const css = `<style>${ideFiles.css}</style>`;
            const js = `<script>${ideFiles.js}<\/script>`;
            
            let combined = html;
            if (combined.includes('</head>')) {
                combined = combined.replace('</head>', css + '</head>');
            } else {
                combined = css + combined;
            }
            if (combined.includes('</body>')) {
                combined = combined.replace('</body>', js + '</body>');
            } else {
                combined += js;
            }

            doc.open();
            doc.write(combined);
            doc.close();
        };

        if (ideFileList && ideEditor) {
            // --- Syntax Highlighter ---
            const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            
            const highlightJS = (code) => {
                const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|import|export|default|this|typeof|instanceof|null|undefined|true|false|async|await|of|in|try|catch|finally|throw|delete|void)\b/g;
                return esc(code)
                    .replace(/(&lt;\/?[\w-]+)(\s|\/|&gt;)/g, '<span class="tok-tag">$1</span>$2')
                    .replace(/(\s|^)([\w-]+)(=)/g, '$1<span class="tok-attr">$2</span>$3')
                    .replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, '<span class="tok-string">$1</span>')
                    .replace(keywords, '<span class="tok-keyword">$&</span>')
                    .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>')
                    .replace(/(^\/\/.*$)/gm, '<span class="tok-comment">$1</span>')
                    .replace(/\/\*[\s\S]*?\*\//g, '<span class="tok-comment">$&</span>');
            };

            const highlightCSS = (code) => {
                return esc(code)
                    .replace(/(@[\w-]+)/g, '<span class="tok-at-rule">$1</span>')
                    .replace(/([\w-]+)\s*:/g, '<span class="tok-prop">$1</span>:')
                    .replace(/(".*?"|'.*?')/g, '<span class="tok-string">$1</span>')
                    .replace(/\b(\d+\.?\d*)(px|em|rem|vh|vw|%|s|ms)?\b/g, '<span class="tok-number">$1$2</span>')
                    .replace(/([.#][\w-]+)\s*\{/g, '<span class="tok-selector">$1</span> {')
                    .replace(/(^\/\*.*?\*\/)/gm, '<span class="tok-comment">$1</span>');
            };

            const highlightHTML = (code) => {
                return esc(code)
                    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-tag">$2</span>')
                    .replace(/([\w-]+)=/g, '<span class="tok-attr">$1</span>=')
                    .replace(/("[^"]*")/g, '<span class="tok-value">$1</span>')
                    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>');
            };

            const syntaxHighlight = (code, lang) => {
                if (lang === 'js') return highlightJS(code);
                if (lang === 'css') return highlightCSS(code);
                return highlightHTML(code);
            };

            const refreshHighlight = () => {
                if (!ideHighlight) return;
                ideHighlight.innerHTML = syntaxHighlight(ideEditor.value, currentIdeFile) + '\n';
            };

            ideEditor.value = ideFiles[currentIdeFile];
            refreshHighlight();
            
            // Sync scroll between textarea and highlight layer
            const wrapper = ideEditor.parentElement;
            ideEditor.addEventListener('scroll', () => {
                ideHighlight.scrollTop = ideEditor.scrollTop;
                ideHighlight.scrollLeft = ideEditor.scrollLeft;
            });
            
            ideFileList.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                
                ideFiles[currentIdeFile] = ideEditor.value;
                document.querySelectorAll('.ide-file').forEach(f => f.classList.remove('active'));
                li.classList.add('active');
                currentIdeFile = li.getAttribute('data-file');
                
                ideEditor.value = ideFiles[currentIdeFile];
                currentFileLabel.textContent = li.textContent;
                refreshHighlight();
            });

            ideEditor.addEventListener('input', () => {
                ideFiles[currentIdeFile] = ideEditor.value;
                refreshHighlight();
                clearTimeout(ideEditor.reloadTimer);
                ideEditor.reloadTimer = setTimeout(updateIframe, 500);
            });

            ideEditor.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = ideEditor.selectionStart;
                    const end = ideEditor.selectionEnd;
                    ideEditor.value = ideEditor.value.substring(0, start) + '  ' + ideEditor.value.substring(end);
                    ideEditor.selectionStart = ideEditor.selectionEnd = start + 2;
                }
            });
            
            if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', updateIframe);
            
            if (submitProjectBtn) {
                const submitModal   = document.getElementById('submit-modal');
                const titleInput    = document.getElementById('project-title-input');
                const modalConfirm  = document.getElementById('modal-confirm');
                const modalCancel   = document.getElementById('modal-cancel');

                // Show the custom modal
                submitProjectBtn.addEventListener('click', () => {
                    if (!submitModal) return;
                    titleInput.value = '';
                    submitModal.style.display = 'flex';
                    setTimeout(() => titleInput.focus(), 50);
                });

                // Cancel — close modal
                modalCancel.addEventListener('click', () => {
                    submitModal.style.display = 'none';
                });
                submitModal.addEventListener('click', (e) => {
                    if (e.target === submitModal) submitModal.style.display = 'none';
                });
                // Enter key submits
                titleInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') modalConfirm.click();
                });

                // Confirm — bundle and redirect
                modalConfirm.addEventListener('click', async () => {
                    const title = titleInput.value.trim();
                    if (!title) { titleInput.focus(); return; }
                    submitModal.style.display = 'none';

                    ideFiles[currentIdeFile] = ideEditor.value;
                    const zip = new JSZip();
                    const folderName = title.replace(/[^a-zA-Z0-9_-]/g, '');
                    const folder = zip.folder(folderName);
                    folder.file("index.html", ideFiles.html);
                    folder.file("style.css",  ideFiles.css);
                    folder.file("script.js",  ideFiles.js);
                    folder.file("preview.png", "");
                    folder.file("README.md", `# ${title}\nBuilt and submitted via S.U.D.O Hub IDE.`);

                    const content = await zip.generateAsync({type:"blob"});
                    const url = URL.createObjectURL(content);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${folderName}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    playSound('switch');
                    setTimeout(() => {
                        window.open("https://github.com/Mr-S-U-D-O/javascriptProjectBasedLearning/upload/main", "_blank");
                    }, 600);
                });
            }
        }

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
            const listEl = document.getElementById('contributors-list');
            if (!listEl) return;
            try {
                const res = await fetch('https://api.github.com/repos/Mr-S-U-D-O/javascriptProjectBasedLearning/contributors');
                const contributors = await res.json();
                listEl.innerHTML = '';
                contributors.forEach(c => {
                    const li = document.createElement('li');
                    li.className = 'contributor-card';
                    li.innerHTML = `
                        <a href="${c.html_url}" target="_blank" style="display:flex;align-items:center;gap:0.75rem;text-decoration:none;">
                            <img class="contributor-avatar" src="${c.avatar_url}" alt="${c.login}">
                            <div class="contributor-info">
                                <span class="contributor-name">${c.login}</span>
                                <span class="contributor-commits">${c.contributions} commits</span>
                            </div>
                        </a>
                    `;
                    listEl.appendChild(li);
                });
                contributorsLoaded = true;
            } catch (e) {
                listEl.innerHTML = '<div class="loading">ERROR: FAILED TO FETCH CONTRIBUTORS</div>';
            }
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
                        updateIframe();
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
