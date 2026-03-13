document.addEventListener('DOMContentLoaded', async () => {
    const mainContainer = document.getElementById('hub-main');
    const statsDashboard = document.getElementById('stats-dashboard');
    const closeStatsBtn = document.getElementById('close-stats');
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

        // Close stats
        closeStatsBtn.addEventListener('click', () => {
            statsDashboard.style.display = 'none';
            mainContainer.style.display = 'block';
            searchInput.value = '';
            searchInput.focus();
            playSound('type');
            
            // Re-show all
            document.querySelectorAll('.category-group').forEach(group => {
                group.style.display = 'flex';
                group.querySelectorAll('.project-item').forEach(item => item.style.display = 'block');
            });
        });

        // Live Search Filtering
        if (searchInput) {
            searchInput.focus(); // Auto focus terminal
            searchInput.addEventListener('input', (e) => {
                playSound('type');
                const term = e.target.value.toLowerCase().trim();
                
                // STATS Command
                if (term === 'stats') {
                    mainContainer.style.display = 'none';
                    statsDashboard.style.display = 'flex';
                    statsDashboard.style.flexDirection = 'column';
                    renderStats(data);
                    return;
                } else {
                    if (statsDashboard.style.display === 'flex' || statsDashboard.style.display === 'block') {
                        statsDashboard.style.display = 'none';
                        mainContainer.style.display = 'block'; // Switch back to masonry/columns
                    }
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
