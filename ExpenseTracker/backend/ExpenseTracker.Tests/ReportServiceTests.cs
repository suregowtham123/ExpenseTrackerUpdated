using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;

namespace ExpenseTracker.Tests;

public class ReportServiceTests
{
    private static ReportService Seeded(TestStore ctx)
    {
        var t = new TransactionService(ctx.Store);
        t.Create(new TransactionRequest { CategoryId = TestStore.Salary, Type = TransactionType.Income, Amount = 5000m, Title = "Pay", Date = new DateTime(2026, 1, 1) });
        t.Create(new TransactionRequest { CategoryId = TestStore.Food, Type = TransactionType.Expense, Amount = 300m, Title = "Food", Date = new DateTime(2026, 1, 5) });
        t.Create(new TransactionRequest { CategoryId = TestStore.Shopping, Type = TransactionType.Expense, Amount = 100m, Title = "Shirt", Date = new DateTime(2026, 3, 9) });
        return new ReportService(ctx.Store, new BudgetService(ctx.Store));
    }

    [Fact]
    public void Monthly_FillsEmptyMonths_AndComputesNet()
    {
        using var ctx = new TestStore();
        var reports = Seeded(ctx);

        var rows = reports.GetMonthly(2026, null, null);

        Assert.Equal(12, rows.Count);
        Assert.Equal(4700m, rows[0].Net);
        Assert.Equal(0m, rows[1].Income + rows[1].Expenses);   // February is empty
        Assert.Equal(-100m, rows[2].Net);
    }

    [Fact]
    public void CategoryBreakdown_ReturnsPercentages()
    {
        using var ctx = new TestStore();
        var reports = Seeded(ctx);

        var rows = reports.GetCategoryBreakdown(null, null, TransactionType.Expense);

        Assert.Equal(2, rows.Count);
        Assert.Equal("Food", rows[0].CategoryName);
        Assert.Equal(75m, rows[0].Percentage);
        Assert.Equal(25m, rows[1].Percentage);
    }

    [Fact]
    public void Monthly_Throws_WhenRangeIsReversed()
    {
        using var ctx = new TestStore();
        var reports = new ReportService(ctx.Store, new BudgetService(ctx.Store));

        Assert.Throws<ValidationAppException>(() =>
            reports.GetMonthly(null, new DateTime(2026, 5, 10), new DateTime(2026, 5, 1)));
    }

    [Fact]
    public void DashboardSummary_ComputesTotalsAndBalance()
    {
        using var ctx = new TestStore();
        var reports = Seeded(ctx);

        var summary = reports.GetDashboardSummary(1, 2026);

        Assert.Equal(5000m, summary.TotalIncome);
        Assert.Equal(400m, summary.TotalExpenses);
        Assert.Equal(4600m, summary.Balance);
        Assert.Equal(5000m, summary.MonthIncome);
        Assert.Equal(300m, summary.MonthExpenses);
        Assert.Equal(3, summary.RecentTransactions.Count);
        Assert.Equal(6, summary.Trend.Count);
    }
}
