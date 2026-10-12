using System.ComponentModel.DataAnnotations;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Dtos;

public class CategoryRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [EnumDataType(typeof(TransactionType))]
    public TransactionType Type { get; set; }
}

public class CategoryDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
}
