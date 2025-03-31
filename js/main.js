// Main JavaScript file
import { TodoManager } from "./todo.js";
import { ExpenseManager } from "./expenses.js";
import { HabitManager } from "./habits.js";
import { ScheduleManager } from "./schedule.js";
import { StorageManager } from "./storage.js";

class App {
  constructor() {
    this.storageManager = new StorageManager();
    this.todoManager = new TodoManager(this.storageManager);
    this.expenseManager = new ExpenseManager(this.storageManager);
    this.habitManager = new HabitManager(this.storageManager);
    this.scheduleManager = new ScheduleManager(this.storageManager);

    this.currentTab = "schedule";
    this.isDarkMode = false;

    this.initTheme();
    this.initTabs();
  }

  initTheme() {
    // Check if dark mode is saved in localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      this.toggleDarkMode(true);
    }

    // Theme toggle button
    const themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", () => {
      this.toggleDarkMode(!this.isDarkMode);
    });
  }

  toggleDarkMode(enable) {
    const body = document.body;
    const themeIcon = document.querySelector(".header__theme-toggle i");

    if (enable) {
      body.classList.add("dark");
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      this.isDarkMode = true;
      localStorage.setItem("theme", "dark");
    } else {
      body.classList.remove("dark");
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      this.isDarkMode = false;
      localStorage.setItem("theme", "light");
    }
  }

  initTabs() {
    const tabButtons = document.querySelectorAll(".tabs__button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.dataset.tab;

        // Update active tab button
        tabButtons.forEach((btn) => {
          btn.classList.remove("tabs__button--active");
        });
        button.classList.add("tabs__button--active");

        // Update active tab content
        tabContents.forEach((content) => {
          content.classList.remove("tab-content--active");
        });
        document.getElementById(tabName).classList.add("tab-content--active");

        this.currentTab = tabName;
      });
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
});
