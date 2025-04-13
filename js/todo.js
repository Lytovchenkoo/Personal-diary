// Todo Manager
import { StorageManager } from "./storage.js";

export class TodoManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.tasks = [];
    this.categories = [
      { id: "work", name: "Work", color: "blue" },
      { id: "personal", name: "Personal", color: "green" },
      { id: "health", name: "Health", color: "orange" },
    ];
    this.currentFilter = "all";
    this.expandedCategories = {};

    this.loadTasks();
    this.initEventListeners();
    this.renderTasks();
    this.renderCategories();
  }

  loadTasks() {
    const savedTasks = this.storageManager.getData("tasks");
    this.tasks = savedTasks || [
      {
        id: 1,
        title: "Complete project proposal",
        category: "work",
        dueDate: "2025-03-20",
        priority: "high",
        completed: false,
      },
      {
        id: 2,
        title: "Buy groceries",
        category: "personal",
        dueDate: "2025-03-15",
        priority: "medium",
        completed: true,
      },
      {
        id: 3,
        title: "Schedule dentist appointment",
        category: "health",
        dueDate: "2025-03-25",
        priority: "low",
        completed: false,
      },
      {
        id: 4,
        title: "Prepare presentation",
        category: "work",
        dueDate: "2025-03-18",
        priority: "high",
        completed: false,
      },
    ];
  }

  saveTasks() {
    this.storageManager.saveData("tasks", this.tasks);
  }

  initEventListeners() {
    // Add task button
    const addTaskBtn = document.getElementById("addTaskBtn");
    const taskInput = document.getElementById("taskInput");

    addTaskBtn.addEventListener("click", () => {
      this.openTaskModal();
    });

    taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && taskInput.value.trim() !== "") {
        this.openTaskModal(taskInput.value.trim());
      }
    });

    // Task filters
    const taskFilters = document.querySelectorAll(".tasks__filter");
    taskFilters.forEach((filter) => {
      filter.addEventListener("click", () => {
        taskFilters.forEach((f) => f.classList.remove("tasks__filter--active"));
        filter.classList.add("tasks__filter--active");
        this.currentFilter = filter.dataset.filter;
        this.renderTasks();
      });
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

  openTaskModal(title = "") {
    const modal = document.getElementById("taskModal");
    const taskTitle = document.getElementById("taskTitle");
    const taskDueDate = document.getElementById("taskDueDate");

    // Reset form
    document.getElementById("taskForm").reset();

    // Set default values
    taskTitle.value = title;

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    taskDueDate.value = formattedDate;

    // Show modal
    modal.style.display = "flex";
  }

  closeTaskModal() {
    const modal = document.getElementById("taskModal");
    modal.style.display = "none";
    document.getElementById("taskInput").value = "";
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
    this.renderTasks();
    this.renderCategories();
    this.closeTaskModal();
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.renderCategories();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveTasks();
    this.renderTasks();
    this.renderCategories();
  }

  renderTasks() {
    const tasksList = document.getElementById("tasksList");

    // Filter tasks based on current filter
    let filteredTasks = [...this.tasks];

    if (this.currentFilter === "active") {
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    } else if (this.currentFilter === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.completed);
    }

    // Sort tasks by due date
    filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Render tasks
    tasksList.innerHTML = "";

    if (filteredTasks.length === 0) {
      tasksList.innerHTML = '<div class="empty-state">No tasks found</div>';
      return;
    }

    filteredTasks.forEach((task) => {
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
                        <div class="task-item__date">
                            <i class="fas fa-calendar"></i> ${this.formatDate(
                              task.dueDate
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

      tasksList.appendChild(taskElement);
    });
  }

  renderCategories() {
    const categoriesList = document.getElementById("categoriesList");

    // Count active tasks by category
    const categoryCounts = {};
    this.categories.forEach((category) => {
      categoryCounts[category.id] = this.tasks.filter(
        (task) => task.category === category.id && !task.completed
      ).length;
    });

    // Render categories
    categoriesList.innerHTML = "";

    this.categories.forEach((category) => {
      const categoryElement = document.createElement("div");
      categoryElement.className = "category-item";

      // Get tasks for this category
      const categoryTasks = this.tasks.filter(
        (task) => task.category === category.id
      );

      // Create category header
      const categoryHeader = document.createElement("div");
      categoryHeader.className = "category-item__header";
      categoryHeader.innerHTML = `
                <div class="category-item__name">
                    <div class="category-item__color category-item__color--${
                      category.id
                    }"></div>
                    ${category.name}
                </div>
                <div class="category-item__count">${
                  categoryCounts[category.id]
                } active tasks</div>
            `;

      // Create tasks container
      const tasksContainer = document.createElement("div");
      tasksContainer.className = "category-item__tasks";
      if (this.expandedCategories[category.id]) {
        tasksContainer.classList.add("category-item__tasks--visible");
      }

      // Add tasks to container
      if (categoryTasks.length === 0) {
        tasksContainer.innerHTML =
          '<div class="empty-state">No tasks in this category</div>';
      } else {
        categoryTasks.forEach((task) => {
          const taskElement = document.createElement("div");
          taskElement.className = `category-task ${
            task.completed ? "category-task--completed" : ""
          }`;

          taskElement.innerHTML = `
                        <input type="checkbox" class="category-task__checkbox" ${
                          task.completed ? "checked" : ""
                        }>
                        <div class="category-task__title">${task.title}</div>
                        <div class="category-task__date">${this.formatDate(
                          task.dueDate
                        )}</div>
                    `;

          // Add event listener for checkbox
          const checkbox = taskElement.querySelector(
            ".category-task__checkbox"
          );
          checkbox.addEventListener("change", () => {
            this.toggleTaskCompletion(task.id);
          });

          tasksContainer.appendChild(taskElement);
        });
      }

      // Add click event to header to toggle tasks visibility
      categoryHeader.addEventListener("click", () => {
        this.expandedCategories[category.id] =
          !this.expandedCategories[category.id];
        tasksContainer.classList.toggle("category-item__tasks--visible");
      });

      categoryElement.appendChild(categoryHeader);
      categoryElement.appendChild(tasksContainer);
      categoriesList.appendChild(categoryElement);
    });
  }

  getCategoryName(categoryId) {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-UK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
}

// Initialize the Todo Manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const storageManager = new StorageManager();
  const todoManager = new TodoManager(storageManager);
});
