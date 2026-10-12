using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IReportService _reports;

    public DashboardController(IReportService reports) => _reports = reports;

    /// <summary>Totals, monthly summary, recent transactions, category chart data, budget usage and 6-month trend.</summary>
    [HttpGet("summary")]
    public ActionResult<DashboardSummaryDto> GetSummary([FromQuery] int? month, [FromQuery] int? year)
        => Ok(_reports.GetDashboardSummary(month, year));
}
