// Schedule Manager
export class ScheduleManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.events = [];
    this.selectedDate = new Date();
    this.currentMonth = new Date();

    this.loadEvents();
    this.initEventListeners();
    this.renderCalendar();
    this.renderEvents();
  }

  loadEvents() {
    const savedEvents = this.storageManager.getData("events");
    this.events = savedEvents || [
      {
        id: 1,
        title: "Team Meeting",
        date: "2025-03-15",
        time: "10:00",
      },
      {
        id: 2,
        title: "Doctor Appointment",
        date: "2025-03-20",
        time: "14:30",
      },
      {
        id: 3,
        title: "Birthday Party",
        date: "2025-03-25",
        time: "18:00",
      },
    ];
  }

  saveEvents() {
    this.storageManager.saveData("events", this.events);
  }

  initEventListeners() {
    // Calendar navigation
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");

    prevMonth.addEventListener("click", () => {
      this.changeMonth(-1);
    });

    nextMonth.addEventListener("click", () => {
      this.changeMonth(1);
    });

    // Add event
    const addEventBtn = document.getElementById("addEvent");
    const eventTitle = document.getElementById("eventTitle");
    const eventTime = document.getElementById("eventTime");

    addEventBtn.addEventListener("click", () => {
      this.addEvent();
    });

    eventTitle.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addEvent();
      }
    });
  }

  renderCalendar() {
    const calendarDays = document.getElementById("calendarDays");
    const currentMonth = document.getElementById("currentMonth");

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
    currentMonth.textContent = `${
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
      dayElement.className = "calendar__day calendar__day--other-month";
      dayElement.textContent = prevMonthLastDay - i;
      calendarDays.appendChild(dayElement);
    }

    // Get days in current month
    const daysInMonth = lastDay.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar__day";
      dayElement.textContent = i;

      // Check if day has events
      const dateStr = `${this.currentMonth.getFullYear()}-${String(
        this.currentMonth.getMonth() + 1
      ).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const hasEvents = this.events.some((event) => event.date === dateStr);

      if (hasEvents) {
        dayElement.classList.add("calendar__day--has-events");
      }

      // Check if day is today
      const today = new Date();
      if (
        today.getDate() === i &&
        today.getMonth() === this.currentMonth.getMonth() &&
        today.getFullYear() === this.currentMonth.getFullYear()
      ) {
        dayElement.classList.add("calendar__day--today");
      }

      // Check if day is selected
      if (
        this.selectedDate.getDate() === i &&
        this.selectedDate.getMonth() === this.currentMonth.getMonth() &&
        this.selectedDate.getFullYear() === this.currentMonth.getFullYear()
      ) {
        dayElement.classList.add("calendar__day--selected");
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
        dayElement.className = "calendar__day calendar__day--other-month";
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
    this.renderEvents();

    // Update selected date display
    const selectedDateElement = document.getElementById("selectedDate");
    selectedDateElement.textContent = this.formatDate(date);
  }

  renderEvents() {
    const eventsList = document.getElementById("eventsList");

    // Format selected date for comparison
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Filter events for selected date
    const dayEvents = this.events.filter((event) => event.date === dateStr);

    // Sort events by time
    dayEvents.sort((a, b) => {
      return a.time.localeCompare(b.time);
    });

    // Render events
    eventsList.innerHTML = "";

    if (dayEvents.length === 0) {
      eventsList.innerHTML =
        '<div class="empty-state">No events for this day</div>';
      return;
    }

    dayEvents.forEach((event) => {
      const eventElement = document.createElement("div");
      eventElement.className = "event-item";

      eventElement.innerHTML = `
                <div class="event-item__time">${this.formatTime(
                  event.time
                )}</div>
                <div class="event-item__title">${event.title}</div>
                <button class="event-item__delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;

      // Add delete event
      const deleteBtn = eventElement.querySelector(".event-item__delete");
      deleteBtn.addEventListener("click", () => {
        this.deleteEvent(event.id);
      });

      eventsList.appendChild(eventElement);
    });
  }

  addEvent() {
    const eventTitle = document.getElementById("eventTitle");
    const eventTime = document.getElementById("eventTime");

    const title = eventTitle.value.trim();
    const time = eventTime.value || "12:00";

    if (title === "") return;

    // Format date
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const newEvent = {
      id: Date.now(),
      title,
      date: dateStr,
      time,
    };

    this.events.push(newEvent);
    this.saveEvents();
    this.renderCalendar();
    this.renderEvents();

    // Clear input
    eventTitle.value = "";
  }

  deleteEvent(eventId) {
    this.events = this.events.filter((event) => event.id !== eventId);
    this.saveEvents();
    this.renderCalendar();
    this.renderEvents();
  }

  formatDate(date) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  }
}

// Initialize the Schedule Manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const storageManager = new StorageManager();
  const scheduleManager = new ScheduleManager(storageManager);
});
