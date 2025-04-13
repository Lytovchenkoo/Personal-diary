// Habit Manager
import { StorageManager } from "./storage.js";

export class HabitManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.habits = [];
    this.completions = {};
    this.periodType = "week"; // 'week' or 'month'
    this.currentPeriodStart = this.getStartOfWeek(new Date());

    this.loadData();
    this.initEventListeners();
    this.updateAllStreaks(); // Calculate streaks on initialization
    this.renderPeriodHeader();
    this.renderHabits();
    this.renderWeeklyOverview();
    this.renderLongestStreaks();
  }

  loadData() {
    const savedHabits = this.storageManager.getData("habits");
    const savedCompletions = this.storageManager.getData("habitCompletions");

    this.habits = savedHabits || [
      { id: 1, name: "Read 30 minutes", color: "green", streak: 3 },
      { id: 2, name: "Exercise", color: "purple", streak: 2 },
      { id: 3, name: "Drink 8 glasses of water", color: "teal", streak: 7 },
    ];

    this.completions = savedCompletions || {
      // Sample data for the current week
      "1-2025-03-16": true,
      "1-2025-03-17": true,
      "1-2025-03-18": true,
      "1-2025-03-19": true,
      "1-2025-03-20": true,
      "2-2025-03-16": true,
      "2-2025-03-17": true,
      "2-2025-03-18": true,
      "3-2025-03-17": true,
      "3-2025-03-19": true,
      "4-2025-03-16": true,
      "4-2025-03-17": true,
      "4-2025-03-18": true,
      "4-2025-03-19": true,
      "4-2025-03-20": true,
      "4-2025-03-21": true,
      "4-2025-03-22": true,
    };
  }

  saveData() {
    this.storageManager.saveData("habits", this.habits);
    this.storageManager.saveData("habitCompletions", this.completions);
  }

  initEventListeners() {
    // Add habit button
    const addHabitBtn = document.getElementById("addHabitBtn");
    addHabitBtn.addEventListener("click", () => {
      this.openHabitModal();
    });

    // Habit modal
    const closeHabitModal = document.getElementById("closeHabitModal");
    const habitForm = document.getElementById("habitForm");

    closeHabitModal.addEventListener("click", () => {
      this.closeHabitModal();
    });

    habitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveHabitFromForm();
    });

    // Period navigation
    const prevPeriodBtn = document.getElementById("prevPeriodBtn");
    const nextPeriodBtn = document.getElementById("nextPeriodBtn");
    const periodType = document.getElementById("periodType");

    prevPeriodBtn.addEventListener("click", () => {
      this.changePeriod(-1);
    });

    nextPeriodBtn.addEventListener("click", () => {
      this.changePeriod(1);
    });

    periodType.addEventListener("change", () => {
      this.periodType = periodType.value;
      this.currentPeriodStart =
        this.periodType === "week"
          ? this.getStartOfWeek(new Date())
          : this.getStartOfMonth(new Date());
      this.renderPeriodHeader();
      this.renderHabits();
      this.renderWeeklyOverview();
    });
  }

  openHabitModal() {
    const modal = document.getElementById("habitModal");

    // Reset form
    document.getElementById("habitForm").reset();

    // Show modal
    modal.style.display = "flex";
  }

  closeHabitModal() {
    const modal = document.getElementById("habitModal");
    modal.style.display = "none";
  }

  saveHabitFromForm() {
    const habitName = document.getElementById("habitName").value.trim();
    const habitColor = document.getElementById("habitColor").value;

    if (habitName === "") return;

    const newHabit = {
      id: Date.now(),
      name: habitName,
      color: habitColor,
      streak: 0,
    };

    this.habits.push(newHabit);
    this.saveData();
    this.renderHabits();
    this.renderWeeklyOverview();
    this.renderLongestStreaks();
    this.closeHabitModal();
  }

  toggleHabitCompletion(habitId, dateStr) {
    const key = `${habitId}-${dateStr}`;
    this.completions[key] = !this.completions[key];

    // Update streak
    this.updateAllStreaks();

    this.saveData();
    this.renderHabits();
    this.renderWeeklyOverview();
    this.renderLongestStreaks();
  }

  updateAllStreaks() {
    // Update streaks for all habits
    this.habits.forEach((habit) => {
      this.updateStreak(habit.id);
    });
  }

  updateStreak(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from today and count backwards
    const currentDate = new Date(today);
    let streak = 0;

    // Count consecutive days
    while (true) {
      const dateStr = this.formatDateForStorage(currentDate);
      const key = `${habitId}-${dateStr}`;

      if (this.completions[key]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Update the habit's streak
    habit.streak = streak;
  }

  deleteHabit(habitId) {
    this.habits = this.habits.filter((h) => h.id !== habitId);

    // Remove completions for this habit
    Object.keys(this.completions).forEach((key) => {
      if (key.startsWith(`${habitId}-`)) {
        delete this.completions[key];
      }
    });

    this.saveData();
    this.renderHabits();
    this.renderWeeklyOverview();
    this.renderLongestStreaks();
  }

  renderPeriodHeader() {
    const currentPeriod = document.getElementById("currentPeriod");
    const habitTableHeader = document.getElementById("habitTableHeader");
    const habitTrackerTable = document.querySelector(".habit-tracker__table");

    // Update period display
    if (this.periodType === "week") {
      const endDate = new Date(this.currentPeriodStart);
      endDate.setDate(endDate.getDate() + 6);

      const startMonth = this.currentPeriodStart.toLocaleString("en-US", {
        month: "long",
      });
      const endMonth = endDate.toLocaleString("en-US", { month: "long" });

      if (startMonth === endMonth) {
        currentPeriod.textContent = `${startMonth} ${this.currentPeriodStart.getDate()}-${endDate.getDate()}, ${this.currentPeriodStart.getFullYear()}`;
      } else {
        currentPeriod.textContent = `${startMonth} ${this.currentPeriodStart.getDate()} - ${endMonth} ${endDate.getDate()}, ${this.currentPeriodStart.getFullYear()}`;
      }

      habitTrackerTable.classList.remove("habit-tracker__table--month");
    } else {
      const monthName = this.currentPeriodStart.toLocaleString("en-US", {
        month: "long",
      });
      currentPeriod.textContent = `${monthName} ${this.currentPeriodStart.getFullYear()}`;

      habitTrackerTable.classList.add("habit-tracker__table--month");
    }

    // Update table header
    habitTableHeader.innerHTML = "";

    // Add habit and streak columns
    const habitCell = document.createElement("div");
    habitCell.className =
      "habit-tracker__header-cell habit-tracker__header-cell--habit";
    habitCell.textContent = "Habit";

    const streakCell = document.createElement("div");
    streakCell.className =
      "habit-tracker__header-cell habit-tracker__header-cell--streak";
    streakCell.textContent = "Streak";

    habitTableHeader.appendChild(habitCell);
    habitTableHeader.appendChild(streakCell);

    const periodDates = this.getPeriodDates();

    periodDates.forEach((date) => {
      const dayCell = document.createElement("div");
      dayCell.className = "habit-tracker__header-cell";

      if (this.periodType === "week") {
        const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });
        dayCell.textContent = dayOfWeek;
      } else {
        dayCell.textContent = date.getDate();
      }

      habitTableHeader.appendChild(dayCell);
    });

    const numDays = periodDates.length;
    const gridTemplate = `minmax(100px, 1fr) 0.5fr repeat(${numDays}, 1fr)`;
    habitTableHeader.style.gridTemplateColumns = gridTemplate;

    document.querySelectorAll(".habit-item").forEach((item) => {
      item.style.gridTemplateColumns = gridTemplate;
    });
  }

  renderHabits() {
    const habitsList = document.getElementById("habitsList");

    // Render habits
    habitsList.innerHTML = "";

    if (this.habits.length === 0) {
      habitsList.innerHTML =
        '<div class="empty-state">No habits added yet</div>';
      return;
    }

    // Get period dates
    const periodDates = this.getPeriodDates();

    // Get grid template from header
    const numDays = periodDates.length;
    const gridTemplate = `minmax(100px, 1fr) 0.5fr repeat(${numDays}, 1fr)`;

    this.habits.forEach((habit) => {
      const habitElement = document.createElement("div");
      habitElement.className = "habit-item";
      habitElement.style.gridTemplateColumns = gridTemplate;

      // Create habit name cell
      const nameCell = document.createElement("div");
      nameCell.className = "habit-item__name";
      nameCell.innerHTML = `
        <div class="habit-item__color habit-item__color--${habit.color}"></div>
        <span class="habit-item__name-text">${habit.name}</span>
      `;

      // Create streak cell
      const streakCell = document.createElement("div");
      streakCell.className = "habit-item__streak";
      streakCell.textContent = habit.streak;

      habitElement.appendChild(nameCell);
      habitElement.appendChild(streakCell);

      // Create day cells
      let completedDays = 0;

      periodDates.forEach((date) => {
        const dateStr = this.formatDateForStorage(date);
        const key = `${habit.id}-${dateStr}`;
        const isCompleted = this.completions[key];

        const dayCell = document.createElement("div");
        dayCell.className = `habit-item__day habit-item__day--${habit.color} ${
          isCompleted ? "habit-item__day--completed" : ""
        }`;
        dayCell.innerHTML = isCompleted ? '<i class="fas fa-check"></i>' : "";

        // Disable future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date > today) {
          dayCell.classList.add("habit-item__day--disabled");
        } else {
          dayCell.addEventListener("click", () => {
            this.toggleHabitCompletion(habit.id, dateStr);
          });
        }

        if (isCompleted) {
          completedDays++;
        }

        habitElement.appendChild(dayCell);
      });

      // Calculate completion percentage
      const totalDays = periodDates.length;
      const percentage =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      // Create progress bar
      const progressBar = document.createElement("div");
      progressBar.className = "habit-item__progress";
      progressBar.innerHTML = `
        <div class="habit-item__progress-fill habit-item__progress-fill--${habit.color}" style="width: ${percentage}%"></div>
        <div class="habit-item__percentage">${percentage}%</div>
      `;

      habitElement.appendChild(progressBar);

      // Add delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "habit-item__delete";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.addEventListener("click", () => {
        this.deleteHabit(habit.id);
      });

      habitElement.appendChild(deleteBtn);
      habitsList.appendChild(habitElement);
    });
  }

  renderWeeklyOverview() {
    const weeklyOverview = document.getElementById("weeklyOverview");

    // Get period dates
    const periodDates = this.getPeriodDates();

    // Render weekly overview
    weeklyOverview.innerHTML = "";

    periodDates.forEach((date) => {
      const dayName =
        this.periodType === "week"
          ? date.toLocaleString("default", { weekday: "short" })
          : date.getDate().toString();

      // Count completed habits for this day
      let completedHabits = 0;
      const dateStr = this.formatDateForStorage(date);

      this.habits.forEach((habit) => {
        const key = `${habit.id}-${dateStr}`;
        if (this.completions[key]) {
          completedHabits++;
        }
      });

      const totalHabits = this.habits.length;
      const percentage =
        totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

      const dayElement = document.createElement("div");
      dayElement.className = "day-stat";

      dayElement.innerHTML = `
        <div class="day-stat__name">${dayName}</div>
        <div class="day-stat__progress">
          <div class="day-stat__fill" style="width: ${percentage}%"></div>
        </div>
        <div class="day-stat__count">${completedHabits}/${totalHabits}</div>
      `;

      weeklyOverview.appendChild(dayElement);
    });
  }

  renderLongestStreaks() {
    const longestStreaksList = document.getElementById("longestStreaksList");

    // Sort habits by streak (descending)
    const sortedHabits = [...this.habits].sort((a, b) => b.streak - a.streak);

    // Render longest streaks
    longestStreaksList.innerHTML = "";

    sortedHabits.slice(0, 3).forEach((habit) => {
      if (habit.streak === 0) return;

      const streakElement = document.createElement("div");
      streakElement.className = "streak-item";

      streakElement.innerHTML = `
        <div class="streak-item__color streak-item__color--${habit.color}"></div>
        <div class="streak-item__name">${habit.name}</div>
        <div class="streak-item__count">${habit.streak} <span class="streak-item__days">days</span></div>
      `;

      longestStreaksList.appendChild(streakElement);
    });

    if (longestStreaksList.children.length === 0) {
      longestStreaksList.innerHTML =
        '<div class="empty-state">No streaks yet</div>';
    }
  }

  changePeriod(delta) {
    if (this.periodType === "week") {
      const newStart = new Date(this.currentPeriodStart);
      newStart.setDate(newStart.getDate() + delta * 7);
      this.currentPeriodStart = newStart;
    } else {
      const newStart = new Date(this.currentPeriodStart);
      newStart.setMonth(newStart.getMonth() + delta);
      this.currentPeriodStart = newStart;
    }

    this.renderPeriodHeader();
    this.renderHabits();
    this.renderWeeklyOverview();
  }

  getPeriodDates() {
    const dates = [];

    if (this.periodType === "week") {
      // Get 7 days for week view
      for (let i = 0; i < 7; i++) {
        const date = new Date(this.currentPeriodStart);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
    } else {
      // Get all days in month for month view
      const year = this.currentPeriodStart.getFullYear();
      const month = this.currentPeriodStart.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        dates.push(date);
      }
    }

    return dates;
  }

  getStartOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay() || 7; // Convert Sunday (0) to 7
    if (day !== 1) {
      // If not Monday
      result.setDate(result.getDate() - (day - 1));
    }
    result.setHours(0, 0, 0, 0);
    return result;
  }

  getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

// Initialize the Habit Manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const storageManager = new StorageManager();
  const habitManager = new HabitManager(storageManager);
});
