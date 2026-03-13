/* ======================================================= */
let body = document.querySelector("body");
let stateToggle = document.querySelector("button");

stateToggle.addEventListener("click", () => {
    body.classList.toggle("on");
});

let l2 = document.querySelector(".lower-2");

stateToggle.addEventListener("mousedown", () => {
    l2.style.transform = "translateX(13px) translateY(0)";
});

stateToggle.addEventListener("mouseup", () => {
    l2.style.transform = "translateX(13px) translateY(-4px)";
});

stateToggle.addEventListener("mouseleave", () => {
    l2.style.transform = "translateX(13px) translateY(-4px)";
});

stateToggle.addEventListener("touchstart", () => {
    l2.style.transform = "translateX(13px) translateY(0)";
});

stateToggle.addEventListener("touchend", () => {
    l2.style.transform = "translateX(13px) translateY(-4px)";
});
