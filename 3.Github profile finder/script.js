// Elements
const searchBtn = document.getElementById("searchBtn");
const usernameInput = document.getElementById("username-input");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

let modal = null; // Global modal reference

// Theme toggle button created dynamically
const themeToggle = document.createElement("button");
themeToggle.innerHTML = "🌙";
themeToggle.id = "themeToggle";
document.body.appendChild(themeToggle);

// Set theme and save to localStorage
function setTheme(theme) {
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("theme", theme);
    themeToggle.innerHTML = theme === "light" ? "🌙" : "☀️";
}

// Toggle theme on button click
themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("light-theme") ? "light" : "dark";
    setTheme(currentTheme === "light" ? "dark" : "light");
});

// Load theme from storage or default to dark
setTheme(localStorage.getItem("theme") || "dark");

// Main function to fetch and show Github profile
async function fetchGithubProfile(username) {
    loading.style.display = "flex";
    errorBox.style.display = "none";

    try {
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if (!profileRes.ok) throw new Error("User not found");

        const profileData = await profileRes.json();

        // Fetch repos separately
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
        const reposData = await reposRes.json();

        // Show modal with profile info and repos
        showModal(profileData, reposData);

    } catch (err) {
        errorBox.style.display = "block";
        if (modal) {
            modal.remove();
            modal = null;
        }
    } finally {
        loading.style.display = "none";
    }
}

// Create and show modal popup with user profile and repos
function showModal(profileData, reposData) {
    // Remove existing modal if present
    if (modal) {
        modal.remove();
        modal = null;
    }

    // Create modal overlay
    modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `GitHub profile of ${profileData.login}`);

    // Modal content container
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    // Close button
    const closeButton = document.createElement("button");
    closeButton.className = "modal-close-btn";
    closeButton.setAttribute("aria-label", "Close profile modal");
    closeButton.innerHTML = "&times;";

    closeButton.addEventListener("click", () => {
        if (modal) {
            modal.remove();
            modal = null;
        }
    });

    modalContent.appendChild(closeButton);

    // Profile header with avatar and basic info
    const profileHeader = document.createElement("div");
    profileHeader.className = "profile-header";

    const avatar = document.createElement("img");
    avatar.src = profileData.avatar_url;
    avatar.alt = `${profileData.login} avatar`;
    profileHeader.appendChild(avatar);

    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";

    const nameEl = document.createElement("h2");
    nameEl.textContent = profileData.name || "No name provided";
    profileInfo.appendChild(nameEl);

    const usernameEl = document.createElement("div");
    usernameEl.className = "profile-username";
    usernameEl.textContent = `@${profileData.login}`;
    profileInfo.appendChild(usernameEl);

    // Location (conditionally displayed)
    if (profileData.location) {
        const locationDiv = document.createElement("div");
        locationDiv.className = "profile-location";

        // Location icon SVG
        locationDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M168 0C75.1 0 0 75.1 0 168c0 87.9 136 344 168 344s168-256.1 168-344c0-92.9-75.1-168-168-168zm0 224a56 56 0 1 1 0-112 56 56 0 0 1 0 112z"/>
            </svg>
            <span>${profileData.location}</span>
        `;
        profileInfo.appendChild(locationDiv);
    }

    profileHeader.appendChild(profileInfo);
    modalContent.appendChild(profileHeader);

    // Profile stats displayed inline (no boxes)
    const stats = document.createElement("div");
    stats.className = "profile-stats";

    stats.innerHTML = `
        <span title="Public Repositories">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M80 160H32V48C32 21.5 53.5 0 80 0H368c26.5 0 48 21.5 48 48v112h-48V96H80v64zm288 128c0-35.3-28.7-64-64-64H144c-35.3 0-64 28.7-64 64v48c0 8.8 7.2 16 16 16h256c8.8 0 16-7.2 16-16v-48z"/></svg>
            ${profileData.public_repos}
        </span>
        <span title="Followers">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M224 256a128 128 0 1 0 0-256 128 128 0 0 0 0 256zm89.6 32h-6.4c-22.2 10.9-46.8 17.7-73.2 17.7s-51-6.8-73.2-17.7h-6.4A134.6 134.6 0 0 0 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-52.7-42.9-95.9-95.4-95.9z"/></svg>
            ${profileData.followers}
        </span>
        <span title="Following">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M224 256a128 128 0 1 0 0-256 128 128 0 0 0 0 256zm0 32c35.4 0 67.2 15.6 88 40.1V448H136v-89.9c20.8-24.5 52.6-40.1 88-40.1z"/></svg>
            ${profileData.following}
        </span>
        <span title="Public Gists">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M256 32C132.3 32 32 132.3 32 256c0 123.7 100.3 224 224 224 123.7 0 224-100.3 224-224 0-123.7-100.3-224-224-224zm0 368c-35.3 0-64-28.7-64-64v-32h128v32c0 35.3-28.7 64-64 64z"/></svg>
            ${profileData.public_gists}
        </span>
    `;

    modalContent.appendChild(stats);

    // Blog and Profile links
    const linksDiv = document.createElement("div");
    linksDiv.className = "profile-links";

    // Profile link always present
    const profileLink = document.createElement("a");
    profileLink.className = "profile-link";
    profileLink.href = profileData.html_url;
    profileLink.target = "_blank";
    profileLink.rel = "noopener noreferrer";
    profileLink.setAttribute("aria-label", `${profileData.login} Github profile`);
    profileLink.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.388-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.086 1.84 1.236 1.84 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.762-1.604-2.665-.304-5.466-1.332-5.466-5.933 0-1.312.47-2.383 1.236-3.222-.124-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.655 1.65.245 2.874.12 3.176.77.839 1.234 1.91 1.234 3.222 0 4.61-2.807 5.625-5.48 5.922.43.37.814 1.1.814 2.222v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.29 24 12c0-6.63-5.37-12-12-12z"/>
        </svg> Github Profile
    `;
    linksDiv.appendChild(profileLink);

    // Blog link only if available and not empty string
    if (profileData.blog && profileData.blog.trim() !== "") {
        const blogLink = document.createElement("a");
        blogLink.className = "profile-link";
        // Ensure blog URL starts with http or https
        const blogUrl = profileData.blog.startsWith("http") ? profileData.blog : `https://${profileData.blog}`;
        blogLink.href = blogUrl;
        blogLink.target = "_blank";
        blogLink.rel = "noopener noreferrer";
        blogLink.setAttribute("aria-label", `${profileData.login} Blog`);
        blogLink.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 2a10 10 0 0 0-7.07 17.07 9.963 9.963 0 0 0 14.14 0A9.963 9.963 0 0 0 12 2zm1 14.5h-2v-1.25a3.75 3.75 0 0 1-2-3.5v-1h2v1.25a1.75 1.75 0 0 0 1 1.5v-4.5h2v7z"/>
            </svg> Blog
        `;
        linksDiv.appendChild(blogLink);
    }

    modalContent.appendChild(linksDiv);

    // Latest repos section
    const reposDiv = document.createElement("div");
    reposDiv.className = "repos-list";

    const reposTitle = document.createElement("h3");
    reposTitle.textContent = "Latest Repositories";
    reposDiv.appendChild(reposTitle);

    reposData.forEach((repo) => {
        const repoItem = document.createElement("a");
        repoItem.className = "repo-item";
        repoItem.href = repo.html_url;
        repoItem.target = "_blank";
        repoItem.rel = "noopener noreferrer";
        repoItem.textContent = repo.name;
        reposDiv.appendChild(repoItem);
    });

    modalContent.appendChild(reposDiv);

    // Giant GitHub icon at bottom
    const giantGithubIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    giantGithubIcon.setAttribute("viewBox", "0 0 24 24");
    giantGithubIcon.classList.add("giant-github-icon");
    giantGithubIcon.setAttribute("aria-hidden", "true");
    giantGithubIcon.innerHTML = `
        <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.388-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.086 1.84 1.236 1.84 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.762-1.604-2.665-.304-5.466-1.332-5.466-5.933 0-1.312.47-2.383 1.236-3.222-.124-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.655 1.65.245 2.874.12 3.176.77.839 1.234 1.91 1.234 3.222 0 4.61-2.807 5.625-5.48 5.922.43.37.814 1.1.814 2.222v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.29 24 12c0-6.63-5.37-12-12-12z"/>
    `;
    modalContent.appendChild(giantGithubIcon);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Accessibility: Focus modal for screen readers
    modalContent.focus();
}

// Event Listeners

// On clicking search button
searchBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    if (username) fetchGithubProfile(username);
});

// On pressing enter key in input
usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const username = usernameInput.value.trim();
        if (username) fetchGithubProfile(username);
    }
});
