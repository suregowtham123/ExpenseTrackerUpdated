using ExpenseTracker.Api.Data;

namespace ExpenseTracker.Tests;

/// <summary>An isolated JSON data file in a temp folder (with the 8 default categories, no demo data).</summary>
public sealed class TestStore : IDisposable
{
    public const int Food = 1;      // Expense
    public const int Shopping = 3;  // Expense
    public const int Salary = 7;    // Income

    private readonly string _directory = Path.Combine(Path.GetTempPath(), "expense-tests-" + Guid.NewGuid().ToString("N"));

    public string FilePath => Path.Combine(_directory, "data.json");
    public IDataStore Store { get; }

    public TestStore()
    {
        Directory.CreateDirectory(_directory);
        Store = new JsonDataStore(FilePath, seedDemoData: false);
    }

    public void Dispose()
    {
        try { Directory.Delete(_directory, recursive: true); } catch { /* best effort */ }
    }
}
