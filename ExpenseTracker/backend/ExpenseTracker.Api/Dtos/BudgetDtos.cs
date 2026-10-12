using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Api.Dtos;

public class BudgetRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "A category is required.")]
    public int CategoryId { get; set; }

    [Range(1, 12)]
    public int Month { get; set; }

    [Range(2000, 2100)]
    public int Year { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999999.99", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Limit must be greater than 0.")]
    public decimal LimitAmount { get; set; }
}

public class BudgetDto
{
    public int BudgetId { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal LimitAmount { get; set; }
    public decimal Spent { get; set; }
    public decimal Remaining { get; set; }
    public decimal PercentUsed { get; set; }
    public bool IsExceeded { get; set; }
}
