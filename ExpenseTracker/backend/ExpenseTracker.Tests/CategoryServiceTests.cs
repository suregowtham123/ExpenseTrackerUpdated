using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;

namespace ExpenseTracker.Tests;

public class CategoryServiceTests
{
    [Fact]
    public void GetAll_ReturnsDefaultCategories()
    {
        using var ctx = new TestStore();
        var service = new CategoryService(ctx.Store);

        var all = service.GetAll(null);
        var income = service.GetAll(TransactionType.Income);

        Assert.Equal(8, all.Count);
        Assert.Equal(2, income.Count);
        Assert.All(income, c => Assert.Equal(TransactionType.Income, c.Type));
        Assert.Contains(all, c => c.Name == "Healthcare");
    }

    [Fact]
    public void Create_Update_Delete_CustomCategory()
    {
        using var ctx = new TestStore();
        var service = new CategoryService(ctx.Store);

        var created = service.Create(new CategoryRequest { Name = " Pets ", Type = TransactionType.Expense });
        Assert.Equal("Pets", created.Name);

        var updated = service.Update(created.CategoryId, new CategoryRequest { Name = "Pet care", Type = TransactionType.Expense });
        Assert.Equal("Pet care", updated.Name);

        service.Delete(created.CategoryId);
        Assert.Throws<NotFoundException>(() => service.GetById(created.CategoryId));
    }

    [Fact]
    public void Create_Throws_Conflict_ForDuplicate_IgnoringCase()
    {
        using var ctx = new TestStore();
        var service = new CategoryService(ctx.Store);

        Assert.Throws<ConflictException>(() =>
            service.Create(new CategoryRequest { Name = "food", Type = TransactionType.Expense }));
    }

    [Fact]
    public void Delete_Throws_Conflict_WhenCategoryHasTransactions()
    {
        using var ctx = new TestStore();
        new TransactionService(ctx.Store).Create(new TransactionRequest
        { CategoryId = TestStore.Food, Type = TransactionType.Expense, Amount = 10m, Title = "Tea", Date = new DateTime(2026, 5, 1) });

        var service = new CategoryService(ctx.Store);

        Assert.Throws<ConflictException>(() => service.Delete(TestStore.Food));
    }
}
