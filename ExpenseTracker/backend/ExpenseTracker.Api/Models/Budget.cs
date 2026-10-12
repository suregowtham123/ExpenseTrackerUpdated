namespace ExpenseTracker.Api.Models;

public class Budget
{
    public int BudgetId { get; set; }
    public int CategoryId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal LimitAmount { get; set; }
}
