namespace ExpenseTracker.Api.Dtos;

public class MonthlyReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Income { get; set; }
    public decimal Expenses { get; set; }
    public decimal Net => Income - Expenses;
}

public class CategoryBreakdownDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal Percentage { get; set; }
}

public class DashboardSummaryDto
{
    public int Month { get; set; }
    public int Year { get; set; }

    // All-time figures
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal Balance { get; set; }

    // Selected month
    public decimal MonthIncome { get; set; }
    public decimal MonthExpenses { get; set; }

    public List<TransactionDto> RecentTransactions { get; set; } = new();
    public List<CategoryBreakdownDto> ExpensesByCategory { get; set; } = new();
    public List<BudgetDto> BudgetUsage { get; set; } = new();
    public List<MonthlyReportDto> Trend { get; set; } = new();
}
