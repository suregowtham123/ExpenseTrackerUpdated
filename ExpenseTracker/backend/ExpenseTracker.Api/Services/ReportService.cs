using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Services;

public interface IReportService
{
    DashboardSummaryDto GetDashboardSummary(int? month, int? year);
    List<MonthlyReportDto> GetMonthly(int? year, DateTime? from, DateTime? to);
    List<CategoryBreakdownDto> GetCategoryBreakdown(DateTime? from, DateTime? to, TransactionType type);
}

public class ReportService : IReportService
{
    private const int MaxMonthsInReport = 120;

    private readonly IDataStore _store;
    private readonly IBudgetService _budgets;

    public ReportService(IDataStore store, IBudgetService budgets)
    {
        _store = store;
        _budgets = budgets;
    }

    public DashboardSummaryDto GetDashboardSummary(int? month, int? year)
    {
        var today = DateTime.Today;
        var m = month ?? today.Month;
        var y = year ?? today.Year;
        if (m is < 1 or > 12) throw new ValidationAppException("Month must be between 1 and 12.");
        if (y is < 2000 or > 2100) throw new ValidationAppException("Year must be between 2000 and 2100.");

        var monthStart = new DateTime(y, m, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var (totalIncome, totalExpenses, recent) = _store.Read(d =>
        {
            var names = TransactionService.CategoryNames(d);
            var income = d.Transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var expenses = d.Transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);
            var latest = d.Transactions
                .OrderByDescending(t => t.Date)
                .ThenByDescending(t => t.TransactionId)
                .Take(5)
                .Select(t => TransactionService.ToDto(t, names))
                .ToList();
            return (income, expenses, latest);
        });

        var current = GetMonthly(null, monthStart, monthEnd).FirstOrDefault();

        return new DashboardSummaryDto
        {
            Month = m,
            Year = y,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            Balance = totalIncome - totalExpenses,
            MonthIncome = current?.Income ?? 0m,
            MonthExpenses = current?.Expenses ?? 0m,
            RecentTransactions = recent,
            ExpensesByCategory = GetCategoryBreakdown(monthStart, monthEnd, TransactionType.Expense),
            BudgetUsage = _budgets.Get(m, y),
            Trend = GetMonthly(null, monthStart.AddMonths(-5), monthEnd)
        };
    }

    public List<MonthlyReportDto> GetMonthly(int? year, DateTime? from, DateTime? to)
    {
        DateTime start, endExclusive;
        if (from.HasValue || to.HasValue)
        {
            start = (from ?? new DateTime(DateTime.Today.Year, 1, 1)).Date;
            endExclusive = (to ?? DateTime.Today).Date.AddDays(1);
        }
        else
        {
            var y = year ?? DateTime.Today.Year;
            if (y is < 2000 or > 2100) throw new ValidationAppException("Year must be between 2000 and 2100.");
            start = new DateTime(y, 1, 1);
            endExclusive = start.AddYears(1);
        }

        if (endExclusive <= start) throw new ValidationAppException("The end date must not be before the start date.");

        var monthCount = (endExclusive.Year - start.Year) * 12 + endExclusive.Month - start.Month + 1;
        if (monthCount > MaxMonthsInReport) throw new ValidationAppException("Please choose a range of 10 years or less.");

        var rows = _store.Read(d => d.Transactions
            .Where(t => t.Date >= start && t.Date < endExclusive)
            .GroupBy(t => (Year: t.Date.Year, Month: t.Date.Month))
            .Select(g => new MonthlyReportDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Income = g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                Expenses = g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
            })
            .ToList());

        // Fill months that have no transactions with zeros so charts have a continuous axis
        var lookup = rows.ToDictionary(r => (r.Year, r.Month));
        var result = new List<MonthlyReportDto>();
        var cursor = new DateTime(start.Year, start.Month, 1);
        var last = endExclusive.AddDays(-1);
        var lastMonth = new DateTime(last.Year, last.Month, 1);
        while (cursor <= lastMonth)
        {
            result.Add(lookup.TryGetValue((cursor.Year, cursor.Month), out var row)
                ? row
                : new MonthlyReportDto { Year = cursor.Year, Month = cursor.Month });
            cursor = cursor.AddMonths(1);
        }
        return result;
    }

    public List<CategoryBreakdownDto> GetCategoryBreakdown(DateTime? from, DateTime? to, TransactionType type)
    {
        if (from.HasValue && to.HasValue && to.Value.Date < from.Value.Date)
            throw new ValidationAppException("The end date must not be before the start date.");

        return _store.Read(d =>
        {
            var names = TransactionService.CategoryNames(d);
            IEnumerable<Transaction> q = d.Transactions.Where(t => t.Type == type);

            if (from.HasValue)
            {
                var f = from.Value.Date;
                q = q.Where(t => t.Date >= f);
            }
            if (to.HasValue)
            {
                var exclusive = to.Value.Date.AddDays(1);
                q = q.Where(t => t.Date < exclusive);
            }

            var rows = q
                .GroupBy(t => t.CategoryId)
                .Select(g => new { CategoryId = g.Key, Total = g.Sum(t => t.Amount) })
                .ToList();

            var grandTotal = rows.Sum(r => r.Total);
            return rows
                .OrderByDescending(r => r.Total)
                .Select(r => new CategoryBreakdownDto
                {
                    CategoryId = r.CategoryId,
                    CategoryName = names.TryGetValue(r.CategoryId, out var name) ? name : "Unknown",
                    Total = r.Total,
                    Percentage = grandTotal > 0 ? Math.Round(r.Total / grandTotal * 100m, 1) : 0m
                })
                .ToList();
        });
    }
}
