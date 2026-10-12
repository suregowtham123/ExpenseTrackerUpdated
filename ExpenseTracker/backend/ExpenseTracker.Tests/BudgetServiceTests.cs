using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;

namespace ExpenseTracker.Tests;

public class BudgetServiceTests
{
    private static BudgetRequest Request(int categoryId = TestStore.Food, decimal limit = 1000m) => new()
    {
        CategoryId = categoryId, Month = 5, Year = 2026, LimitAmount = limit
    };

    private static TransactionRequest Expense(decimal amount, string title, DateTime date, int categoryId = TestStore.Food) => new()
    {
        CategoryId = categoryId, Type = TransactionType.Expense, Amount = amount, Title = title, Date = date
    };

    [Fact]
    public void Budget_TracksSpending_AndFlagsExceeded()
    {
        using var ctx = new TestStore();
        var transactions = new TransactionService(ctx.Store);
        var budgets = new BudgetService(ctx.Store);

        var budget = budgets.Create(Request(limit: 1000m));

        transactions.Create(Expense(600m, "A", new DateTime(2026, 5, 3)));
        transactions.Create(Expense(500m, "B", new DateTime(2026, 5, 20)));
        transactions.Create(Expense(999m, "C", new DateTime(2026, 4, 30)));   // different month: must not count

        var loaded = budgets.GetById(budget.BudgetId);

        Assert.Equal(1100m, loaded.Spent);
        Assert.Equal(-100m, loaded.Remaining);
        Assert.Equal(110m, loaded.PercentUsed);
        Assert.True(loaded.IsExceeded);
    }

    [Fact]
    public void Budget_UnderLimit_IsNotExceeded()
    {
        using var ctx = new TestStore();
        var budgets = new BudgetService(ctx.Store);
        var created = budgets.Create(Request(limit: 1000m));
        new TransactionService(ctx.Store).Create(Expense(250m, "Small", new DateTime(2026, 5, 4)));

        var loaded = budgets.GetById(created.BudgetId);

        Assert.Equal(750m, loaded.Remaining);
        Assert.Equal(25m, loaded.PercentUsed);
        Assert.False(loaded.IsExceeded);
    }

    [Fact]
    public void Create_Throws_Conflict_ForDuplicateCategoryAndMonth()
    {
        using var ctx = new TestStore();
        var budgets = new BudgetService(ctx.Store);
        budgets.Create(Request());

        Assert.Throws<ConflictException>(() => budgets.Create(Request()));
    }

    [Fact]
    public void Create_Throws_ForIncomeCategory()
    {
        using var ctx = new TestStore();
        var budgets = new BudgetService(ctx.Store);

        Assert.Throws<ValidationAppException>(() => budgets.Create(Request(TestStore.Salary)));
    }

    [Fact]
    public void Get_FiltersByMonthAndYear_AndUpdateDelete_Work()
    {
        using var ctx = new TestStore();
        var budgets = new BudgetService(ctx.Store);
        var food = budgets.Create(Request(TestStore.Food));
        budgets.Create(new BudgetRequest { CategoryId = TestStore.Shopping, Month = 6, Year = 2026, LimitAmount = 500m });

        var may = budgets.Get(5, 2026);
        Assert.Single(may);
        Assert.Equal("Food", may[0].CategoryName);

        var updated = budgets.Update(food.BudgetId, Request(TestStore.Food, 2500m));
        Assert.Equal(2500m, updated.LimitAmount);

        budgets.Delete(food.BudgetId);
        Assert.Empty(budgets.Get(5, 2026));
        Assert.Throws<NotFoundException>(() => budgets.GetById(food.BudgetId));
    }
}
