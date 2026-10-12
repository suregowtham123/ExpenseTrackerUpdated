using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;

namespace ExpenseTracker.Tests;

public class JsonDataStoreTests
{
    private static TransactionRequest Request(string title = "Lunch") => new()
    {
        CategoryId = TestStore.Food, Type = TransactionType.Expense, Amount = 120.5m, Title = title,
        Date = new DateTime(2026, 5, 10), Notes = "with team"
    };

    [Fact]
    public void NewFile_IsCreatedWithDefaultCategories()
    {
        using var ctx = new TestStore();

        Assert.True(File.Exists(ctx.FilePath));
        var text = File.ReadAllText(ctx.FilePath);
        Assert.Contains("\"Food\"", text);
        Assert.Contains("\"Expense\"", text);   // enums are stored as readable strings
    }

    [Fact]
    public void Data_IsPersisted_AndReloadedByANewStore()
    {
        using var ctx = new TestStore();
        var created = new TransactionService(ctx.Store).Create(Request("Persisted"));

        var reopened = new JsonDataStore(ctx.FilePath, seedDemoData: false);
        var loaded = new TransactionService(reopened).GetById(created.TransactionId);

        Assert.Equal("Persisted", loaded.Title);
        Assert.Equal(120.5m, loaded.Amount);
        Assert.Equal("with team", loaded.Notes);
        Assert.Equal(new DateTime(2026, 5, 10), loaded.Date);
    }

    [Fact]
    public void Ids_AreNotReused_AfterDelete()
    {
        using var ctx = new TestStore();
        var service = new TransactionService(ctx.Store);
        var first = service.Create(Request("one"));
        service.Delete(first.TransactionId);

        var second = service.Create(Request("two"));

        Assert.True(second.TransactionId > first.TransactionId);
    }

    [Fact]
    public void FailedWrite_LeavesDataUnchanged()
    {
        using var ctx = new TestStore();

        Assert.Throws<InvalidOperationException>(() =>
            ctx.Store.Write<int>(d =>
            {
                d.Categories.Clear();                       // half-applied change...
                throw new InvalidOperationException("boom"); // ...then a failure
            }));

        var count = ctx.Store.Read(d => d.Categories.Count);
        Assert.Equal(8, count);
    }

    [Fact]
    public void CorruptFile_IsReportedClearly_AndNotOverwritten()
    {
        using var ctx = new TestStore();
        File.WriteAllText(ctx.FilePath, "{ this is not json");

        Assert.Throws<InvalidDataException>(() => new JsonDataStore(ctx.FilePath, seedDemoData: false));
        Assert.Equal("{ this is not json", File.ReadAllText(ctx.FilePath));
    }

    [Fact]
    public void DemoData_IsSeeded_WhenRequested()
    {
        using var ctx = new TestStore();
        var demoPath = Path.Combine(Path.GetDirectoryName(ctx.FilePath)!, "demo.json");

        var store = new JsonDataStore(demoPath, seedDemoData: true);

        Assert.True(store.Read(d => d.Transactions.Count) > 20);
        Assert.True(store.Read(d => d.Budgets.Count) > 0);
    }
}
