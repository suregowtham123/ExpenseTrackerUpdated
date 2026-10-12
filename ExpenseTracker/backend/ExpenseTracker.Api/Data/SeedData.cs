using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Data;

/// <summary>Creates the initial contents of a brand-new data file.</summary>
public static class SeedData
{
    public static DataFile Create(bool includeDemoData)
    {
        var data = new DataFile();

        void AddCategory(string name, TransactionType type) =>
            data.Categories.Add(new Category { CategoryId = data.NextCategoryId++, Name = name, Type = type });

        // Default categories (IDs 1-8)
        AddCategory("Food", TransactionType.Expense);
        AddCategory("Travel", TransactionType.Expense);
        AddCategory("Shopping", TransactionType.Expense);
        AddCategory("Bills", TransactionType.Expense);
        AddCategory("Healthcare", TransactionType.Expense);
        AddCategory("Entertainment", TransactionType.Expense);
        AddCategory("Salary", TransactionType.Income);
        AddCategory("Freelance", TransactionType.Income);

        if (!includeDemoData) return data;

        var today = DateTime.Today;
        var firstOfThisMonth = new DateTime(today.Year, today.Month, 1);
        var ids = data.Categories.ToDictionary(c => c.Name, c => c.CategoryId);

        void Add(DateTime monthStart, bool isCurrent, int day, string title, decimal amount, string category,
            TransactionType type, string? notes = null)
        {
            // Don't create future-dated rows in the current month
            var d = isCurrent ? Math.Min(day, Math.Max(1, today.Day)) : day;
            data.Transactions.Add(new Transaction
            {
                TransactionId = data.NextTransactionId++,
                Title = title,
                Amount = amount,
                CategoryId = ids[category],
                Type = type,
                Date = monthStart.AddDays(d - 1),
                Notes = notes
            });
        }

        for (var m = 0; m < 4; m++)
        {
            var start = firstOfThisMonth.AddMonths(-m);
            var cur = m == 0;
            const TransactionType inc = TransactionType.Income;
            const TransactionType exp = TransactionType.Expense;

            Add(start, cur, 1, "Monthly salary", 85000m + m * 500, "Salary", inc);
            if (m % 2 == 0) Add(start, cur, 12, "Freelance project", 18000m, "Freelance", inc, "Website redesign");
            Add(start, cur, 2, "House rent / EMI", 22000m, "Bills", exp);
            Add(start, cur, 5, "Electricity bill", 1800m + m * 120, "Bills", exp);
            Add(start, cur, 3, "Groceries", 4200m + m * 150, "Food", exp);
            Add(start, cur, 9, "Dinner out", 1650m, "Food", exp, "Birthday dinner");
            Add(start, cur, 16, "Groceries", 3900m, "Food", exp);
            Add(start, cur, 7, "Cab rides", 1400m + m * 100, "Travel", exp);
            Add(start, cur, 14, "Weekend trip", 6500m, "Travel", exp);
            Add(start, cur, 10, "Clothes", 3200m + m * 300, "Shopping", exp);
            Add(start, cur, 18, "Pharmacy", 850m, "Healthcare", exp);
            Add(start, cur, 20, "Movie & streaming", 1100m, "Entertainment", exp);
        }

        var budgets = new (string Category, decimal Limit)[]
        {
            ("Food", 12000m), ("Bills", 25000m), ("Shopping", 4000m), ("Travel", 8000m), ("Entertainment", 3000m)
        };
        foreach (var (category, limit) in budgets)
        {
            data.Budgets.Add(new Budget
            {
                BudgetId = data.NextBudgetId++,
                CategoryId = ids[category],
                Month = today.Month,
                Year = today.Year,
                LimitAmount = limit
            });
        }

        return data;
    }
}
