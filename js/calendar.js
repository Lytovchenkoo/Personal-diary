// Calendar Manager
import { StorageManager } from "./storage.js";

export class CalendarManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.tasks = [];
    this.categories = [
      { id: "work", name: "Work", color: "blue" },
      { id: "personal", name: "Personal", color: "green" },
      { id: "health", name: "Health", color: "orange" },
    ];
    this.selectedDate = new Date();
    this.currentMonth = new Date();

    this.loadTasks();
    this.initEventListeners();
    this.renderCalendar();
    this.renderDayTasks();
  }

  loadTasks() {
    const savedTasks = this.storageManager.getData("tasks");
    this.tasks = savedTasks || [
      {
        id: 1,
        title: "Complete project proposal",
        category: "work",
        dueDate: "2023-10-20",
        priority: "high",
        completed: false,
      },
      {
        id: 2,
        title: "Buy groceries",
        category: "personal",
        dueDate: "2023-10-15",
        priority: "medium",
        completed: true,
      },
      {
        id: 3,
        title: "Schedule dentist appointment",
        category: "health",
        dueDate: "2023-10-25",
        priority: "low",
        completed: false,
      },
      {
        id: 4,
        title: "Prepare presentation",
        category: "work",
        dueDate: "2023-10-18",
        priority: "high",
        completed: false,
      },
    ];
  }

  saveTasks() {
    this.storageManager.saveData("tasks", this.tasks);
  }

  initEventListeners() {
    // Calendar navigation
    const prevCalendarMonth = document.getElementById("prevCalendarMonth");
    const nextCalendarMonth = document.getElementById("nextCalendarMonth");

    prevCalendarMonth.addEventListener("click", () => {
      this.changeMonth(-1);
    });

    nextCalendarMonth.addEventListener("click", () => {
      this.changeMonth(1);
    });

    // Quick add task
    const quickAddTaskBtn = document.getElementById("quickAddTaskBtn");
    const quickTaskInput = document.getElementById("quickTaskInput");

    quickAddTaskBtn.addEventListener("click", () => {
      this.addQuickTask();
    });

    quickTaskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && quickTaskInput.value.trim() !== "") {
        this.addQuickTask();
      }
    });

    // Task modal
    const closeTaskModal = document.getElementById("closeTaskModal");
    const taskForm = document.getElementById("taskForm");

    closeTaskModal.addEventListener("click", () => {
      this.closeTaskModal();
    });

    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveTaskFromForm();
    });
  }

  renderCalendar() {
    const calendarDays = document.getElementById("taskCalendarDays");
    const monthDisplay = document.getElementById("taskCalendarMonth");

    // Update month display
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    monthDisplay.textContent = `${
      monthNames[this.currentMonth.getMonth()]
    } ${this.currentMonth.getFullYear()}`;

    // Clear calendar
    calendarDays.innerHTML = "";

    // Get first day of month and last day of month
    const firstDay = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      1
    );
    const lastDay = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      0
    );

    // Get day of week of first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Get days from previous month
    const prevMonthLastDay = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      0
    ).getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayElement = document.createElement("div");
      dayElement.className =
        "task-calendar__day task-calendar__day--other-month";
      dayElement.textContent = prevMonthLastDay - i;
      calendarDays.appendChild(dayElement);
    }

    // Get days in current month
    const daysInMonth = lastDay.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dayElement = document.createElement("div");
      dayElement.className = "task-calendar__day";
      dayElement.textContent = i;

      // Check if day has tasks
      const dateStr = `${this.currentMonth.getFullYear()}-${String(
        this.currentMonth.getMonth() + 1
      ).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const hasTasks = this.tasks.some((task) => task.dueDate === dateStr);

      if (hasTasks) {
        dayElement.classList.add("task-calendar__day--has-tasks");
      }

      // Check if day is today
      const today = new Date();
      if (
        today.getDate() === i &&
        today.getMonth() === this.currentMonth.getMonth() &&
        today.getFullYear() === this.currentMonth.getFullYear()
      ) {
        dayElement.classList.add("task-calendar__day--today");
      }

      // Check if day is selected
      if (
        this.selectedDate.getDate() === i &&
        this.selectedDate.getMonth() === this.currentMonth.getMonth() &&
        this.selectedDate.getFullYear() === this.currentMonth.getFullYear()
      ) {
        dayElement.classList.add("task-calendar__day--selected");
      }

      // Add click event
      dayElement.addEventListener("click", () => {
        this.selectDate(
          new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth(),
            i
          )
        );
      });

      calendarDays.appendChild(dayElement);
    }

    // Fill remaining days from next month
    const totalDaysDisplayed = firstDayOfWeek + daysInMonth;
    const remainingDays = 7 - (totalDaysDisplayed % 7);

    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const dayElement = document.createElement("div");
        dayElement.className =
          "task-calendar__day task-calendar__day--other-month";
        dayElement.textContent = i;
        calendarDays.appendChild(dayElement);
      }
    }
  }

  changeMonth(delta) {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    this.currentMonth = newMonth;
    this.renderCalendar();
  }

  selectDate(date) {
    this.selectedDate = date;
    this.renderCalendar();
    this.renderDayTasks();

    // Update selected date display
    const selectedDateElement = document.getElementById("selectedDate");
    selectedDateElement.textContent = this.formatDate(date);

    // Update task form date
    const taskDueDate = document.getElementById("taskDueDate");
    const formattedDate = date.toISOString().split("T")[0];
    taskDueDate.value = formattedDate;
  }

  renderDayTasks() {
    const dayTasksList = document.getElementById("dayTasksList");

    // Format selected date for comparison
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Filter tasks for selected date
    const dayTasks = this.tasks.filter((task) => task.dueDate === dateStr);

    // Sort tasks by priority (high, medium, low) and then by completion status
    dayTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Render tasks
    dayTasksList.innerHTML = "";

    if (dayTasks.length === 0) {
      dayTasksList.innerHTML =
        '<div class="empty-state">No tasks for this day</div>';
      return;
    }

    dayTasks.forEach((task) => {
      const taskElement = document.createElement("div");
      taskElement.className = `task-item ${
        task.completed ? "task-item--completed" : ""
      }`;

      taskElement.innerHTML = `
                <input type="checkbox" class="task-item__checkbox" ${
                  task.completed ? "checked" : ""
                }>
                <div class="task-item__content">
                    <div class="task-item__title">${task.title}</div>
                    <div class="task-item__details">
                        <div class="task-item__category">
                            <i class="fas fa-tag"></i> ${this.getCategoryName(
                              task.category
                            )}
                        </div>
                    </div>
                </div>
                <div class="task-item__priority task-item__priority--${
                  task.priority
                }">${task.priority}</div>
                <div class="task-item__actions">
                    <button class="task-item__action task-item__action--delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      // Add event listeners
      const checkbox = taskElement.querySelector(".task-item__checkbox");
      checkbox.addEventListener("change", () => {
        this.toggleTaskCompletion(task.id);
      });

      const deleteBtn = taskElement.querySelector(".task-item__action--delete");
      deleteBtn.addEventListener("click", () => {
        this.deleteTask(task.id);
      });

      dayTasksList.appendChild(taskElement);
    });
  }

  addQuickTask() {
    const quickTaskInput = document.getElementById("quickTaskInput");
    const taskTitle = quickTaskInput.value.trim();

    if (taskTitle === "") return;

    // Format date
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      category: "personal", // Default category
      dueDate: dateStr,
      priority: "medium", // Default priority
      completed: false,
    };

    this.tasks.push(newTask);
    this.saveTasks();
    this.renderCalendar();
    this.renderDayTasks();

    // Clear input
    quickTaskInput.value = "";
  }

  openTaskModal() {
    const modal = document.getElementById("taskModal");
    const taskDueDate = document.getElementById("taskDueDate");

    // Reset form
    document.getElementById("taskForm").reset();

    // Set default date to selected date
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    taskDueDate.value = dateStr;

    // Show modal
    modal.style.display = "flex";
  }

  closeTaskModal() {
    const modal = document.getElementById("taskModal");
    modal.style.display = "none";
  }

  saveTaskFromForm() {
    const taskTitle = document.getElementById("taskTitle").value.trim();
    const taskCategory = document.getElementById("taskCategory").value;
    const taskDueDate = document.getElementById("taskDueDate").value;
    const taskPriority = document.getElementById("taskPriority").value;

    if (taskTitle === "") return;

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      category: taskCategory,
      dueDate: taskDueDate,
      priority: taskPriority,
      completed: false,
    };

    this.tasks.push(newTask);
    this.saveTasks();
    this.renderCalendar();
    this.renderDayTasks();
    this.closeTaskModal();
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderDayTasks();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveTasks();
    this.renderCalendar();
    this.renderDayTasks();
  }

  getCategoryName(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  }

  formatDate(date) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-UA", options);
  }
}

// Initialize the Calendar Manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const storageManager = new StorageManager();
  const calendarManager = new CalendarManager(storageManager);
});
