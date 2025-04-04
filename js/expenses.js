// Expense Manager
import { StorageManager } from "./storage.js";

export class ExpenseManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.transactions = [];
    this.categories = [];
    this.currentFilter = "all";
    this.currentCurrency = "USD";
    this.exchangeRates = {
      USD: 1,
      EUR: 0.92,
      UAH: 38.5,
    };
    this.currencySymbols = {
      USD: "$",
      EUR: "€",
      UAH: "₴",
    };

    this.loadData();
    this.initEventListeners();
    this.renderOverview();
    this.renderCategories();
    this.renderTransactions();
    this.fetchExchangeRates();
  }

  loadData() {
    const savedTransactions = this.storageManager.getData("transactions");
    const savedCategories = this.storageManager.getData("expenseCategories");
    const savedCurrency = this.storageManager.getData("currentCurrency");

    this.transactions = savedTransactions || [
      {
        id: 1,
        type: "expense",
        category: "Food",
        description: "Lunch",
        amount: 25.5,
        date: "2023-10-15",
      },
      {
        id: 2,
        type: "income",
        category: "Salary",
        description: "Monthly salary",
        amount: 1500.0,
        date: "2023-10-10",
      },
      {
        id: 3,
        type: "expense",
        category: "Transport",
        description: "Uber",
        amount: 35.0,
        date: "2023-10-12",
      },
      {
        id: 4,
        type: "expense",
        category: "Shopping",
        description: "Clothes",
        amount: 120.75,
        date: "2023-10-14",
      },
    ];

    this.categories = savedCategories || [
      { name: "Food", budget: 200 },
      { name: "Transport", budget: 150 },
      { name: "Shopping", budget: 300 },
      { name: "Entertainment", budget: 100 },
    ];

    if (savedCurrency) {
      this.currentCurrency = savedCurrency;
      // Update currency selector
      const currencySelect = document.getElementById("currencySelect");
      if (currencySelect) {
        currencySelect.value = this.currentCurrency;
      }
    }
  }

  saveData() {
    this.storageManager.saveData("transactions", this.transactions);
    this.storageManager.saveData("expenseCategories", this.categories);
    this.storageManager.saveData("currentCurrency", this.currentCurrency);
  }

  initEventListeners() {
    // Add transaction button
    const addTransactionBtn = document.getElementById("addTransactionBtn");
    addTransactionBtn.addEventListener("click", () => {
      this.openTransactionModal();
    });

    // Transaction filters
    const transactionFilters = document.querySelectorAll(
      ".transactions__filter"
    );
    transactionFilters.forEach((filter) => {
      filter.addEventListener("click", () => {
        transactionFilters.forEach((f) =>
          f.classList.remove("transactions__filter--active")
        );
        filter.classList.add("transactions__filter--active");
        this.currentFilter = filter.dataset.filter;
        this.renderTransactions();
      });
    });

    // Transaction modal
    const closeTransactionModal = document.getElementById(
      "closeTransactionModal"
    );
    const transactionForm = document.getElementById("transactionForm");

    closeTransactionModal.addEventListener("click", () => {
      this.closeTransactionModal();
    });

    transactionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveTransactionFromForm();
    });

    // Currency selector
    const currencySelect = document.getElementById("currencySelect");
    currencySelect.addEventListener("change", () => {
      this.currentCurrency = currencySelect.value;
      this.saveData();
      this.renderOverview();
      this.renderCategories();
      this.renderTransactions();
    });
  }

  async fetchExchangeRates() {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const data = await response.json();

      if (data && data.rates) {
        this.exchangeRates = {
          USD: 1,
          EUR: data.rates.EUR,
          UAH: data.rates.UAH,
        };

        // Re-render with new exchange rates
        this.renderOverview();
        this.renderCategories();
        this.renderTransactions();
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      // Continue using default rates
    }
  }

  convertAmount(
    amount,
    fromCurrency = "USD",
    toCurrency = this.currentCurrency
  ) {
    if (fromCurrency === toCurrency) return amount;

    // Convert to USD first (if not already USD)
    const amountInUSD =
      fromCurrency === "USD"
        ? amount
        : amount / this.exchangeRates[fromCurrency];

    // Convert from USD to target currency
    return amountInUSD * this.exchangeRates[toCurrency];
  }

  formatAmount(amount, currency = this.currentCurrency) {
    const symbol = this.currencySymbols[currency];
    return `${symbol}${amount.toFixed(2)}`;
  }

  openTransactionModal() {
    const modal = document.getElementById("transactionModal");
    const transactionDate = document.getElementById("transactionDate");

    // Reset form
    document.getElementById("transactionForm").reset();

    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    transactionDate.value = formattedDate;

    // Show modal
    modal.style.display = "flex";
  }

  closeTransactionModal() {
    const modal = document.getElementById("transactionModal");
    modal.style.display = "none";
  }

  saveTransactionFromForm() {
    const type = document.getElementById("transactionType").value;
    const category = document
      .getElementById("transactionCategory")
      .value.trim();
    const description = document
      .getElementById("transactionDescription")
      .value.trim();
    const amount = parseFloat(
      document.getElementById("transactionAmount").value
    );
    const date = document.getElementById("transactionDate").value;

    if (category === "" || isNaN(amount) || amount <= 0) return;

    const newTransaction = {
      id: Date.now(),
      type,
      category,
      description,
      amount, // Always stored in USD
      date,
    };

    this.transactions.push(newTransaction);

    // Add category if it doesn't exist
    if (
      type === "expense" &&
      !this.categories.some((c) => c.name === category)
    ) {
      this.categories.push({
        name: category,
        budget: amount * 2, // Default budget is twice the first expense
      });
    }

    this.saveData();
    this.renderOverview();
    this.renderCategories();
    this.renderTransactions();
    this.closeTransactionModal();
  }

  deleteTransaction(transactionId) {
    this.transactions = this.transactions.filter((t) => t.id !== transactionId);
    this.saveData();
    this.renderOverview();
    this.renderCategories();
    this.renderTransactions();
  }

  renderOverview() {
    const balanceValue = document.getElementById("balanceValue");
    const incomeValue = document.getElementById("incomeValue");
    const expenseValue = document.getElementById("expenseValue");

    // Calculate totals
    const income = this.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + this.convertAmount(t.amount), 0);

    const expense = this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + this.convertAmount(t.amount), 0);

    const balance = income - expense;

    // Update UI
    balanceValue.textContent = this.formatAmount(balance);
    incomeValue.textContent = this.formatAmount(income);
    expenseValue.textContent = this.formatAmount(expense);

    // Add color classes
    balanceValue.className =
      "overview__stat-value overview__stat-value--balance";
    if (balance < 0) {
      balanceValue.classList.add("overview__stat-value--expense");
    }
  }

  renderCategories() {
    const categoriesList = document.getElementById("expenseCategories");

    // Calculate spending by category
    const categorySpending = {};
    this.transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const convertedAmount = this.convertAmount(t.amount);
        categorySpending[t.category] =
          (categorySpending[t.category] || 0) + convertedAmount;
      });

    // Calculate total spending
    const totalSpending = Object.values(categorySpending).reduce(
      (sum, amount) => sum + amount,
      0
    );

    // Render categories
    categoriesList.innerHTML = "";

    Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1]) // Sort by amount (descending)
      .forEach(([category, amount]) => {
        const categoryElement = document.createElement("div");
        categoryElement.className = "category-bar";

        // Find budget for category
        const categoryData = this.categories.find((c) => c.name === category);
        const budget = categoryData
          ? this.convertAmount(categoryData.budget)
          : amount * 2;

        // Calculate percentage of total and budget
        const percentOfTotal =
          totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
        const percentOfBudget = budget > 0 ? (amount / budget) * 100 : 0;

        categoryElement.innerHTML = `
                    <div class="category-bar__header">
                        <div class="category-bar__name">${category}</div>
                        <div class="category-bar__amount">${this.formatAmount(
                          amount
                        )}</div>
                    </div>
                    <div class="category-bar__progress">
                        <div class="category-bar__fill" style="width: ${percentOfBudget}%; background-color: ${
          percentOfBudget > 100 ? "var(--danger-color)" : "#000"
        }"></div>
                    </div>
                `;

        categoriesList.appendChild(categoryElement);
      });
  }

  renderTransactions() {
    const transactionsList = document.getElementById("transactionsList");

    // Filter transactions
    let filteredTransactions = [...this.transactions];

    if (this.currentFilter === "income") {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === "income"
      );
    } else if (this.currentFilter === "expense") {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === "expense"
      );
    }

    // Sort transactions by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render transactions
    transactionsList.innerHTML = "";

    if (filteredTransactions.length === 0) {
      transactionsList.innerHTML =
        '<div class="empty-state">No transactions found</div>';
      return;
    }

    filteredTransactions.forEach((transaction) => {
      const transactionElement = document.createElement("div");
      transactionElement.className = "transaction-item";

      const isExpense = transaction.type === "expense";
      const sign = isExpense ? "-" : "+";
      const convertedAmount = this.convertAmount(transaction.amount);

      transactionElement.innerHTML = `
                <div class="transaction-item__left">
                    <div class="transaction-item__icon transaction-item__icon--${
                      transaction.type
                    }">
                        <i class="fas fa-${
                          isExpense ? "arrow-down" : "arrow-up"
                        }"></i>
                    </div>
                    <div class="transaction-item__details">
                        <div class="transaction-item__category">${
                          transaction.category
                        }</div>
                        <div class="transaction-item__description">${
                          transaction.description
                        }</div>
                    </div>
                </div>
                <div class="transaction-item__right">
                    <div class="transaction-item__amount transaction-item__amount--${
                      transaction.type
                    }">${sign}${this.formatAmount(convertedAmount)}</div>
                    <div class="transaction-item__date">${this.formatDate(
                      transaction.date
                    )}</div>
                </div>
                <button class="transaction-item__delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;

      // Add delete event
      const deleteBtn = transactionElement.querySelector(
        ".transaction-item__delete"
      );
      deleteBtn.addEventListener("click", () => {
        this.deleteTransaction(transaction.id);
      });

      transactionsList.appendChild(transactionElement);
    });
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
}

// Initialize the Expense Manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const storageManager = new StorageManager();
  const expenseManager = new ExpenseManager(storageManager);
});
