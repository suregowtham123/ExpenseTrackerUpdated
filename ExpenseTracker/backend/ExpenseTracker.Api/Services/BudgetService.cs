using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Services;

public interface IBudgetService
{
    List<BudgetDto> Get(int? month, int? year);
    BudgetDto GetById(int id);
    BudgetDto Create(BudgetRequest request);
    BudgetDto Update(int id, BudgetRequest request);
    void Delete(int id);
}

public class BudgetService : IBudgetService
{
    private readonly IDataStore _store;

    public BudgetService(IDataStore store) => _store = store;

    public List<BudgetDto> Get(int? month, int? year)
    {
        if (month is < 1 or > 12) throw new ValidationAppException("Month must be between 1 and 12.");

        return _store.Read(d =>
        {
            var names = TransactionService.CategoryNames(d);
            var budgets = d.Budgets
                .Where(b => !month.HasValue || b.Month == month.Value)
                .Where(b => !year.HasValue || b.Year == year.Value)
                .OrderByDescending(b => b.Year)
                .ThenByDescending(b => b.Month)
                .ThenBy(b => names.GetValueOrDefault(b.CategoryId, ""), StringComparer.OrdinalIgnoreCase)
                .ToList();

            var spentCache = new Dictionary<(int Year, int Month), Dictionary<int, decimal>>();
            var result = new List<BudgetDto>();
            foreach (var b in budgets)
            {
                var key = (b.Year, b.Month);
                if (!spentCache.TryGetValue(key, out var spentByCategory))
                {
                    spentByCategory = SpentByCategory(d, b.Year, b.Month);
                    spentCache[key] = spentByCategory;
                }
                spentByCategory.TryGetValue(b.CategoryId, out var spent);
                result.Add(ToDto(b, names, spent));
            }
            return result;
        });
    }

    public BudgetDto GetById(int id) =>
        _store.Read(d => Map(d, Find(d, id)));

    public BudgetDto Create(BudgetRequest request) =>
        _store.Write(d =>
        {
            Validate(d, request, excludeBudgetId: null);

            var entity = new Budget { BudgetId = d.NextBudgetId++ };
            Apply(entity, request);
            d.Budgets.Add(entity);
            return Map(d, entity);
        });

    public BudgetDto Update(int id, BudgetRequest request) =>
        _store.Write(d =>
        {
            var entity = Find(d, id);
            Validate(d, request, excludeBudgetId: id);
            Apply(entity, request);
            return Map(d, entity);
        });

    public void Delete(int id) =>
        _store.Write(d =>
        {
            d.Budgets.Remove(Find(d, id));
            return true;
        });

    private static Budget Find(DataFile d, int id) =>
        d.Budgets.FirstOrDefault(b => b.BudgetId == id)
        ?? throw new NotFoundException($"Budget {id} was not found.");

    private static Dictionary<int, decimal> SpentByCategory(DataFile d, int year, int month)
    {
        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1);

        return d.Transactions
            .Where(t => t.Type == TransactionType.Expense && t.Date >= start && t.Date < end)
            .GroupBy(t => t.CategoryId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));
    }

    private static BudgetDto Map(DataFile d, Budget b)
    {
        SpentByCategory(d, b.Year, b.Month).TryGetValue(b.CategoryId, out var spent);
        return ToDto(b, TransactionService.CategoryNames(d), spent);
    }

    private static void Validate(DataFile d, BudgetRequest request, int? excludeBudgetId)
    {
        var category = d.Categories.FirstOrDefault(c => c.CategoryId == request.CategoryId)
                       ?? throw new ValidationAppException($"Category {request.CategoryId} does not exist.");

        if (category.Type != TransactionType.Expense)
            throw new ValidationAppException("Budgets can only be assigned to expense categories.");

        var duplicate = d.Budgets.Any(b =>
            b.CategoryId == request.CategoryId && b.Year == request.Year && b.Month == request.Month &&
            (excludeBudgetId == null || b.BudgetId != excludeBudgetId));

        if (duplicate)
            throw new ConflictException($"A budget for '{category.Name}' already exists for {request.Month}/{request.Year}.");
    }

    private static void Apply(Budget entity, BudgetRequest request)
    {
        entity.CategoryId = request.CategoryId;
        entity.Month = request.Month;
        entity.Year = request.Year;
        entity.LimitAmount = Math.Round(request.LimitAmount, 2);
    }

    private static BudgetDto ToDto(Budget b, IReadOnlyDictionary<int, string> names, decimal spent) => new()
    {
        BudgetId = b.BudgetId,
        CategoryId = b.CategoryId,
        CategoryName = names.TryGetValue(b.CategoryId, out var name) ? name : "Unknown",
        Month = b.Month,
        Year = b.Year,
        LimitAmount = b.LimitAmount,
        Spent = spent,
        Remaining = b.LimitAmount - spent,
        PercentUsed = b.LimitAmount > 0 ? Math.Round(spent / b.LimitAmount * 100m, 1) : 0m,
        IsExceeded = spent > b.LimitAmount
    };
}
