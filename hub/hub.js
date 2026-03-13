document.addEventListener('DOMContentLoaded', async () => {
    const mainContainer = document.getElementById('hub-main');
    const totalProjectsEl = document.getElementById('total-projects');
    const totalCategoriesEl = document.getElementById('total-categories');
    const searchInput = document.getElementById('search-input');

    // Typewriter Utility
    const typeWriter = async (element, text, speed = 40) => {
        element.textContent = '';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text.charAt(i);
            await new Promise(r => setTimeout(r, speed));
        }
    };

    try {
        const response = await fetch('projects.json');
        const data = await response.json();

        // Update stats
        totalProjectsEl.textContent = data.stats.total.toString().padStart(2, '0');
        totalCategoriesEl.textContent = data.stats.categories.toString().padStart(2, '0');

        // Group projects by category
        const groups = data.projects.reduce((acc, project) => {
            if (!acc[project.category]) {
                acc[project.category] = [];
            }
            acc[project.category].push(project);
            return acc;
        }, {});

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
                        <li class="project-item" data-name="${project.name.toLowerCase()}">
                            <a href="${project.path}" class="project-link">
                                <span class="project-name">${project.name}</span>
                                <span class="project-number">#${project.number.toString().padStart(2, '0')}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            mainContainer.appendChild(groupEl);
        });

        // Trigger Typewriter effect on headers after slight delay
        setTimeout(() => {
            document.querySelectorAll('.cat-title').forEach(el => {
                const title = el.getAttribute('data-title');
                typeWriter(el, title, 50);
            });
        }, 100);

        // Live Search Filtering
        if (searchInput) {
            searchInput.focus(); // Auto focus terminal
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const allGroups = document.querySelectorAll('.category-group');
                
                allGroups.forEach(group => {
                    const items = group.querySelectorAll('.project-item');
                    let visibleCount = 0;
                    
                    items.forEach(item => {
                        const name = item.getAttribute('data-name');
                        const category = group.getAttribute('data-category');
                        
                        if (name.includes(term) || category.includes(term)) {
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
