document.addEventListener('DOMContentLoaded', async () => {
    const mainContainer = document.getElementById('hub-main');
    const totalProjectsEl = document.getElementById('total-projects');
    const totalCategoriesEl = document.getElementById('total-categories');

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
            
            groupEl.innerHTML = `
                <div class="category-header">
                    <span>${category}</span>
                    <span>[${projects.length}]</span>
                </div>
                <ul class="project-list">
                    ${projects.map(project => `
                        <li class="project-item">
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

    } catch (error) {
        console.error('Error loading projects:', error);
        mainContainer.innerHTML = '<div class="loading">SYSTEM ERROR: UNABLE TO LOAD PROJECTS</div>';
    }
});
