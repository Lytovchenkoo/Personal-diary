// Page initialization
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  initTheme();
});

function initTheme() {
  // Check if dark mode is saved in localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    toggleDarkMode(true);
  }

  // Theme toggle button
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    const isDarkMode = document.body.classList.contains("dark");
    toggleDarkMode(!isDarkMode);
  });
}

function toggleDarkMode(enable) {
  const body = document.body;
  const themeIcon = document.querySelector(".header__theme-toggle i");

  if (enable) {
    body.classList.add("dark");
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.remove("dark");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
    localStorage.setItem("theme", "light");
  }
}
