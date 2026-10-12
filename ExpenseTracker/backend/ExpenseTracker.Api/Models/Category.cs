namespace ExpenseTracker.Api.Models;

public class Category
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
}
