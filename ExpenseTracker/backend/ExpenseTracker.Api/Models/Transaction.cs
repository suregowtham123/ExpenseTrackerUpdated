namespace ExpenseTracker.Api.Models;

public class Transaction
{
    public int TransactionId { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}
