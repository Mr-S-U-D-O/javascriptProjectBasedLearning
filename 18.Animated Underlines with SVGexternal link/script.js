// Lightweight randomness logic - no GSAP needed!
function initRandomUnderlines() {
  // const totalVariants = 6; // Number of symbol variants
  const totalVariants = document.querySelectorAll(
    '.symbol-library symbol[id^="underline-"]'
  ).length;

  let nextIndex = Math.floor(Math.random() * totalVariants); // Random start

  document.querySelectorAll("[data-draw-line]").forEach((container) => {
    const box = container.querySelector("[data-draw-line-box]");
    if (!box) return;

    container.addEventListener("mouseenter", () => {
      // Get the symbol and clone its path
      const symbol = document.querySelector(`#underline-${nextIndex + 1}`);
      const originalPath = symbol.querySelector("path");

      if (originalPath) {
        // Create a new SVG with the cloned path
        const svgHTML = `
              <svg viewBox="0 0 310 40" preserveAspectRatio="none">
                ${originalPath.outerHTML}
              </svg>
            `;

        box.innerHTML = svgHTML;

        // Now we can properly access and measure the path
        const path = box.querySelector("path");
        if (path) {
          const length = path.getTotalLength();
          // Set precise dasharray and initial offset
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          path.style.setProperty("--path-length", length);
        }
      }

      // Advance to next variant for next hover (across all items)
      nextIndex = (nextIndex + 1) % totalVariants;
    });

    // Optional: Clear SVG on mouse leave for performance
    container.addEventListener("mouseleave", () => {
      // Small delay to allow exit animation to complete
      setTimeout(() => {
        if (!container.matches(":hover")) {
          box.innerHTML = "";
        }
      }, 700);
    });
  });
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initRandomUnderlines);
