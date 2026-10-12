using System.ComponentModel.DataAnnotations;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Dtos;

public class TransactionRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "A category is required.")]
    public int CategoryId { get; set; }

    [Required, StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "9999999999999.99", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Amount must be greater than 0.")]
    public decimal Amount { get; set; }

    [EnumDataType(typeof(TransactionType))]
    public TransactionType Type { get; set; }

    [Required]
    public DateTime? Date { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class TransactionDto
{
    public int TransactionId { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}

/// <summary>Filter / sort / paging options for GET /api/transactions.</summary>
public class TransactionQuery
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public TransactionType? Type { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MinAmount { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MaxAmount { get; set; }

    /// <summary>date | amount | title | category | type</summary>
    public string? SortBy { get; set; } = "date";

    /// <summary>asc | desc</summary>
    public string? SortDir { get; set; } = "desc";

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 10;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;
}
