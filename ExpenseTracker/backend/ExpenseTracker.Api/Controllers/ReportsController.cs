using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Produces("application/json")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports) => _reports = reports;

    /// <summary>Income vs expenses per month. Use either year, or from/to dates.</summary>
    [HttpGet("monthly")]
    public ActionResult<List<MonthlyReportDto>> Monthly([FromQuery] int? year, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(_reports.GetMonthly(year, from, to));

    /// <summary>Totals per category for the date range (Expense by default).</summary>
    [HttpGet("category-breakdown")]
    public ActionResult<List<CategoryBreakdownDto>> CategoryBreakdown(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] TransactionType type = TransactionType.Expense)
        => Ok(_reports.GetCategoryBreakdown(from, to, type));
}
