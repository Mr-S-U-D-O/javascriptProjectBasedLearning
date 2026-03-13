const buttons = [...document.querySelectorAll("button")];
buttons.forEach((button) => {
    button.addEventListener("click", function () {
        button.classList.toggle("following");
        button.textContent = button.classList.contains("following") ? "Unfollow" : "Follow";
    });
});

// for demo only
setTimeout(function () {
    document.querySelector("button").focus();
}, 500);
