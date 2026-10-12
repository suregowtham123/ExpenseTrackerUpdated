using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Data;

/// <summary>Everything the app stores. This object is what is written to the JSON file.</summary>
public class DataFile
{
    public int NextCategoryId { get; set; } = 1;
    public int NextTransactionId { get; set; } = 1;
    public int NextBudgetId { get; set; } = 1;

    public List<Category> Categories { get; set; } = new();
    public List<Transaction> Transactions { get; set; } = new();
    public List<Budget> Budgets { get; set; } = new();
}
