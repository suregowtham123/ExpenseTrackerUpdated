using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;

namespace ExpenseTracker.Tests;

public class TransactionServiceTests
{
    private static TransactionRequest Request(int categoryId = TestStore.Food, TransactionType type = TransactionType.Expense,
        decimal amount = 100m, string title = "Lunch", DateTime? date = null) => new()
    {
        CategoryId = categoryId,
        Type = type,
        Amount = amount,
        Title = title,
        Date = date ?? new DateTime(2026, 5, 10)
    };

    [Fact]
    public void Create_ReturnsTransaction_WhenValid()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);

        var created = service.Create(Request(amount: 250.456m, title: "  Lunch  "));

        Assert.True(created.TransactionId > 0);
        Assert.Equal("Lunch", created.Title);
        Assert.Equal(250.46m, created.Amount);
        Assert.Equal("Food", created.CategoryName);
    }

    [Fact]
    public void Create_Throws_WhenCategoryTypeDoesNotMatch()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);

        Assert.Throws<ValidationAppException>(() =>
            service.Create(Request(categoryId: TestStore.Food, type: TransactionType.Income)));
    }

    [Fact]
    public void Create_Throws_WhenCategoryDoesNotExist()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);

        Assert.Throws<ValidationAppException>(() => service.Create(Request(categoryId: 999)));
    }

    [Fact]
    public void Update_ChangesValues_AndThrowsNotFound_ForUnknownId()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);
        var created = service.Create(Request());

        var updated = service.Update(created.TransactionId, Request(categoryId: TestStore.Shopping, amount: 999m, title: "Shirt"));

        Assert.Equal("Shirt", updated.Title);
        Assert.Equal("Shopping", updated.CategoryName);
        Assert.Equal(999m, service.GetById(created.TransactionId).Amount);
        Assert.Throws<NotFoundException>(() => service.Update(4242, Request()));
    }

    [Fact]
    public void Delete_RemovesTransaction()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);
        var created = service.Create(Request());

        service.Delete(created.TransactionId);

        Assert.Throws<NotFoundException>(() => service.GetById(created.TransactionId));
        Assert.Throws<NotFoundException>(() => service.Delete(created.TransactionId));
    }

    [Fact]
    public void Query_Paginates_Filters_AndSorts()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);
        for (var i = 1; i <= 5; i++)
            service.Create(Request(amount: i * 100m, title: $"Item {i}", date: new DateTime(2026, 5, i)));
        service.Create(Request(TestStore.Salary, TransactionType.Income, 5000m, "Pay", new DateTime(2026, 5, 1)));

        var page2 = service.Query(new TransactionQuery
        {
            Type = TransactionType.Expense, SortBy = "amount", SortDir = "asc", Page = 2, PageSize = 2
        });

        Assert.Equal(5, page2.TotalCount);
        Assert.Equal(3, page2.TotalPages);
        Assert.Equal(new[] { 300m, 400m }, page2.Items.Select(i => i.Amount).ToArray());

        var search = service.Query(new TransactionQuery { Search = "item 3" });   // case-insensitive
        Assert.Single(search.Items);

        var range = service.Query(new TransactionQuery
        {
            DateFrom = new DateTime(2026, 5, 2), DateTo = new DateTime(2026, 5, 3), Type = TransactionType.Expense
        });
        Assert.Equal(2, range.TotalCount);

        var amounts = service.Query(new TransactionQuery { MinAmount = 200m, MaxAmount = 400m, Type = TransactionType.Expense });
        Assert.Equal(3, amounts.TotalCount);

        var byCategory = service.Query(new TransactionQuery { CategoryId = TestStore.Salary });
        Assert.Single(byCategory.Items);
    }
}
