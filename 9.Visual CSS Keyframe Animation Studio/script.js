/**
 * CSS Keyframe Animation Studio
 * Main Logic File
 */

// --- I. STATE MANAGEMENT ---
const state = {
    isPlaying: true,
    isScrubbing: false, // Tracks if user is manually dragging the timeline
    scrubberValue: 0, // Percentage (0-100) for the scrubber
    duration: 2,
    iteration: "infinite",
    timing: "linear",
    activeKeyframePercent: 0,

    // The core data structure: Keyframes map
    // Added 'radius' to the default properties
    keyframes: {
        0: { x: 0, y: 0, scale: 1, rotate: 0, radius: 0, opacity: 1, color: "#5e54d6" },
        50: { x: 100, y: -50, scale: 1.2, rotate: 45, radius: 50, opacity: 1, color: "#f43f5e" },
        100: { x: 0, y: 0, scale: 1, rotate: 360, radius: 0, opacity: 1, color: "#5e54d6" }
    }
};

// --- II. DOM SELECTION ---
const dom = {
    // Stage Elements
    actor: document.getElementById("actor"),
    styleTag: document.getElementById("dynamic-styles"),
    code: document.getElementById("code-output"),
    timeline: document.getElementById("timeline-track"),
    activeLabel: document.getElementById("active-keyframe-label"),

    // Controls
    btnPlay: document.getElementById("play-pause-btn"),
    iconPlay: document.getElementById("icon-play"),
    iconPause: document.getElementById("icon-pause"),
    btnRestart: document.getElementById("restart-btn"),
    btnAddKeyframe: document.getElementById("add-keyframe-btn"),
    btnDeleteKeyframe: document.getElementById("delete-keyframe-btn"),
    btnCopy: document.getElementById("copy-btn"),

    // Scrubber (New)
    scrubber: document.getElementById("scrubber"),

    // Global Settings
    inputDuration: document.getElementById("duration"),
    inputIteration: document.getElementById("iteration"),
    inputTiming: document.getElementById("timing"),

    // Properties Inputs
    props: {
        x: document.getElementById("prop-x"),
        y: document.getElementById("prop-y"),
        scale: document.getElementById("prop-scale"),
        rotate: document.getElementById("prop-rotate"),
        radius: document.getElementById("prop-radius"), // New
        opacity: document.getElementById("prop-opacity"),
        color: document.getElementById("prop-color")
    },
    // Properties Value Labels
    vals: {
        x: document.getElementById("val-x"),
        y: document.getElementById("val-y"),
        scale: document.getElementById("val-scale"),
        rotate: document.getElementById("val-rotate"),
        radius: document.getElementById("val-radius"), // New
        opacity: document.getElementById("val-opacity"),
        color: document.getElementById("val-color")
    },

    // Theme
    themeToggle: document.getElementById("theme-toggle")
};

// --- III. CORE LOGIC ---

/**
 * Generates the raw CSS @keyframes string based on current state
 */
function generateKeyframesCSS() {
    // Sort keys to ensure correct CSS order (0%, then 50%, then 100%)
    const percents = Object.keys(state.keyframes).sort((a, b) => parseInt(a) - parseInt(b));

    let steps = "";
    percents.forEach((p) => {
        const k = state.keyframes[p];

        // Handle legacy keyframes that might not have radius yet
        const radius = k.radius !== undefined ? k.radius : 0;

        steps += `
    ${p}% {
        transform: translate(${k.x}px, ${k.y}px) scale(${k.scale}) rotate(${k.rotate}deg);
        border-radius: ${radius}%;
        opacity: ${k.opacity};
        background-color: ${k.color};
    }`;
    });

    return `@keyframes myAnimation {${steps}\n}`;
}

/**
 * Main Render Loop
 * 1. Generates CSS
 * 2. Applies to Actor
 * 3. Updates Code View
 * 4. Updates UI Controls
 */
function render() {
    // 1. Generate the CSS Keyframes
    const keyframesCSS = generateKeyframesCSS();

    let animationRule = "";
    let playState = "";

    // 2. Logic for Scrubbing vs Playing
    if (state.isScrubbing) {
        // When scrubbing, we PAUSE the animation and use negative animation-delay
        // to freeze the animation at the exact percentage of the duration.
        // Formula: Time = Duration * (Percentage / 100)
        const scrubTime = state.duration * (state.scrubberValue / 100);

        // We set iteration to 1 and fill-mode forwards to prevent jumping when scrubbing past end
        animationRule = `animation: myAnimation ${state.duration}s linear 1 normal forwards paused;`;
        animationRule += `\n                animation-delay: -${scrubTime.toFixed(2)}s;`;

        playState = ""; // Play state is handled in the rule above
    } else {
        // Standard Playback
        animationRule = `animation: myAnimation ${state.duration}s ${state.timing} ${state.iteration};`;
        playState = `animation-play-state: ${state.isPlaying ? "running" : "paused"};`;
    }

    // 3. Inject into Style Tag (Live Preview)
    dom.styleTag.innerHTML = `
        ${keyframesCSS}
        .actor {
            ${animationRule}
            ${playState}
        }
    `;

    // 4. Update Code Block (cleaner output for user)
    // We strip the scrubbing logic from the user-facing code to avoid confusion
    const cleanAnimationRule = `animation: myAnimation ${state.duration}s ${state.timing} ${state.iteration};`;
    dom.code.textContent = `.element {
    ${cleanAnimationRule}
}

${keyframesCSS}`;

    // 5. Update UI Controls for Active Keyframe
    updateEditorUI();

    // 6. Update Timeline Markers
    renderTimeline();

    // 7. Update Play/Pause Button State
    updatePlayButtonUI();
}

/**
 * Updates the input sliders to match the currently selected keyframe
 */
function updateEditorUI() {
    const activeK = state.keyframes[state.activeKeyframePercent];

    if (activeK) {
        dom.activeLabel.textContent = `${state.activeKeyframePercent}%`;

        // Helper to update input and label
        const setProp = (prop, val) => {
            if (dom.props[prop]) {
                dom.props[prop].value = val;
                dom.vals[prop].textContent = val;
            }
        };

        // Ensure defaults if property missing
        if (activeK.radius === undefined) activeK.radius = 0;

        setProp("x", activeK.x);
        setProp("y", activeK.y);
        setProp("scale", activeK.scale);
        setProp("rotate", activeK.rotate);
        setProp("radius", activeK.radius);
        setProp("opacity", activeK.opacity);
        setProp("color", activeK.color);

        // Show/Hide Delete Button logic
        const count = Object.keys(state.keyframes).length;
        // Prevent deleting 0% or 100% usually, or if only 2 frames exist
        const isProtected = state.activeKeyframePercent === 0 || state.activeKeyframePercent === 100;

        if (count > 2 && !isProtected) {
            dom.btnDeleteKeyframe.classList.remove("hidden");
        } else {
            dom.btnDeleteKeyframe.classList.add("hidden");
        }
    }
}

/**
 * Updates the visual state of the Play/Pause button
 */
function updatePlayButtonUI() {
    if (state.isPlaying) {
        dom.iconPlay.classList.add("hidden");
        dom.iconPause.classList.remove("hidden");
    } else {
        dom.iconPlay.classList.remove("hidden");
        dom.iconPause.classList.add("hidden");
    }
}

/**
 * Renders the dots on the timeline track
 */
function renderTimeline() {
    dom.timeline.innerHTML = "";
    const percents = Object.keys(state.keyframes).sort((a, b) => parseInt(a) - parseInt(b));

    percents.forEach((p) => {
        const marker = document.createElement("div");
        marker.className = "timeline-marker";

        // Highlight active marker
        if (parseInt(p) === parseInt(state.activeKeyframePercent)) {
            marker.classList.add("active");
        }

        marker.style.left = `${p}%`;
        marker.title = `${p}%`;

        // Allow clicking marker to select
        marker.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering add-keyframe on track
            state.activeKeyframePercent = parseInt(p);

            // If we click a marker, we stop scrubbing mode but don't necessarily play
            state.isScrubbing = false;
            render();
        });

        const label = document.createElement("span");
        label.textContent = `${p}%`;
        marker.appendChild(label);

        dom.timeline.appendChild(marker);
    });
}

// --- IV. EVENT LISTENERS ---

// 1. Property Inputs (Live Editing)
Object.keys(dom.props).forEach((key) => {
    if (dom.props[key]) {
        dom.props[key].addEventListener("input", (e) => {
            let val = e.target.value;
            // Convert to number unless color
            if (e.target.type !== "color") val = parseFloat(val);

            // Update State
            state.keyframes[state.activeKeyframePercent][key] = val;

            render();
        });
    }
});

// 2. Global Settings
dom.inputDuration.addEventListener("input", (e) => {
    state.duration = parseFloat(e.target.value);
    render();
});
dom.inputIteration.addEventListener("change", (e) => {
    state.iteration = e.target.value;
    render();
});
dom.inputTiming.addEventListener("change", (e) => {
    state.timing = e.target.value;
    render();
});

// 3. Playback Controls
dom.btnPlay.addEventListener("click", () => {
    state.isPlaying = !state.isPlaying;
    state.isScrubbing = false; // Disable scrubbing if we hit play

    // Optional: Reset scrubber to 0 visually if playing (visual preference)
    if (state.isPlaying && dom.scrubber) dom.scrubber.value = 0;

    render();
});

dom.btnRestart.addEventListener("click", () => {
    // Trick to restart animation: remove class/style, void offset, re-add
    dom.actor.style.animation = "none";
    void dom.actor.offsetWidth; // Trigger reflow

    state.isPlaying = true;
    state.isScrubbing = false;
    if (dom.scrubber) dom.scrubber.value = 0;

    render();
});

// 4. Scrubber Controls (Timeline Dragging)
if (dom.scrubber) {
    dom.scrubber.addEventListener("input", (e) => {
        state.isScrubbing = true;
        state.isPlaying = false; // Pause playback automatically
        state.scrubberValue = parseFloat(e.target.value);
        render();
    });

    dom.scrubber.addEventListener("change", (e) => {
        // When drag ends, we stay paused but keep scrubber mode active
        // until the user hits play again or interacts elsewhere.
        // This keeps the preview frozen at the dragged location.
        state.scrubberValue = parseFloat(e.target.value);
        render();
    });
}

// 5. Timeline Interaction (Add Keyframe)
dom.timeline.addEventListener("click", (e) => {
    // Calculate click percentage relative to track width
    const rect = dom.timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    let percent = Math.round((clickX / rect.width) * 100);

    // Clamp 0-100
    percent = Math.max(0, Math.min(100, percent));

    // Snap to nearest 5 for cleaner steps
    percent = Math.round(percent / 5) * 5;

    // Create new keyframe if it doesn't exist
    if (!state.keyframes[percent]) {
        // Inherit values from the currently selected keyframe (better UX than 0%)
        state.keyframes[percent] = { ...state.keyframes[state.activeKeyframePercent] };
        state.activeKeyframePercent = percent;
    } else {
        // Just select it
        state.activeKeyframePercent = percent;
    }

    state.isScrubbing = false; // Reset scrubbing
    render();
});

// 6. Add/Delete Buttons
dom.btnAddKeyframe.addEventListener("click", () => {
    let p = prompt("Enter percentage for new keyframe (0-100):");
    if (p !== null) {
        p = parseInt(p);
        if (!isNaN(p) && p >= 0 && p <= 100) {
            if (!state.keyframes[p]) {
                state.keyframes[p] = { ...state.keyframes[state.activeKeyframePercent] };
            }
            state.activeKeyframePercent = p;
            render();
        }
    }
});

dom.btnDeleteKeyframe.addEventListener("click", () => {
    if (state.activeKeyframePercent !== 0 && state.activeKeyframePercent !== 100) {
        delete state.keyframes[state.activeKeyframePercent];
        // Reset active to 0 to be safe
        state.activeKeyframePercent = 0;
        render();
    }
});

// 7. Clipboard Copy
dom.btnCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(dom.code.textContent).then(() => {
        const originalText = dom.btnCopy.textContent;
        dom.btnCopy.textContent = "Copied!";
        setTimeout(() => {
            dom.btnCopy.textContent = originalText;
        }, 1500);
    });
});

// 8. Theme Switcher
function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
    if (dom.themeToggle) dom.themeToggle.checked = theme === "dark";
}

if (dom.themeToggle) {
    dom.themeToggle.addEventListener("change", () => {
        const newTheme = dom.themeToggle.checked ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    });
}

// Initial Theme Load
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

// --- V. INITIALIZATION ---
render();
