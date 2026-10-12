using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Services;

public interface ITransactionService
{
    PagedResult<TransactionDto> Query(TransactionQuery query);
    TransactionDto GetById(int id);
    TransactionDto Create(TransactionRequest request);
    TransactionDto Update(int id, TransactionRequest request);
    void Delete(int id);
}

public class TransactionService : ITransactionService
{
    private readonly IDataStore _store;

    public TransactionService(IDataStore store) => _store = store;

    public static Dictionary<int, string> CategoryNames(DataFile d) =>
        d.Categories.ToDictionary(c => c.CategoryId, c => c.Name);

    public static TransactionDto ToDto(Transaction t, IReadOnlyDictionary<int, string> names) => new()
    {
        TransactionId = t.TransactionId,
        CategoryId = t.CategoryId,
        CategoryName = names.TryGetValue(t.CategoryId, out var name) ? name : "Unknown",
        Title = t.Title,
        Amount = t.Amount,
        Type = t.Type,
        Date = t.Date,
        Notes = t.Notes
    };

    public PagedResult<TransactionDto> Query(TransactionQuery query) =>
        _store.Read(d =>
        {
            var names = CategoryNames(d);
            IEnumerable<Transaction> q = d.Transactions;

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim();
                q = q.Where(t =>
                    t.Title.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                    (t.Notes != null && t.Notes.Contains(s, StringComparison.OrdinalIgnoreCase)));
            }
            if (query.CategoryId.HasValue)
            {
                var categoryId = query.CategoryId.Value;
                q = q.Where(t => t.CategoryId == categoryId);
            }
            if (query.Type.HasValue)
            {
                var type = query.Type.Value;
                q = q.Where(t => t.Type == type);
            }
            if (query.DateFrom.HasValue)
            {
                var from = query.DateFrom.Value.Date;
                q = q.Where(t => t.Date >= from);
            }
            if (query.DateTo.HasValue)
            {
                var toExclusive = query.DateTo.Value.Date.AddDays(1);
                q = q.Where(t => t.Date < toExclusive);
            }
            if (query.MinAmount.HasValue)
            {
                var min = query.MinAmount.Value;
                q = q.Where(t => t.Amount >= min);
            }
            if (query.MaxAmount.HasValue)
            {
                var max = query.MaxAmount.Value;
                q = q.Where(t => t.Amount <= max);
            }

            var filtered = q.ToList();

            var desc = !string.Equals(query.SortDir, "asc", StringComparison.OrdinalIgnoreCase);
            IOrderedEnumerable<Transaction> ordered = (query.SortBy ?? "date").ToLowerInvariant() switch
            {
                "amount" => desc ? filtered.OrderByDescending(t => t.Amount) : filtered.OrderBy(t => t.Amount),
                "title" => desc
                    ? filtered.OrderByDescending(t => t.Title, StringComparer.OrdinalIgnoreCase)
                    : filtered.OrderBy(t => t.Title, StringComparer.OrdinalIgnoreCase),
                "category" => desc
                    ? filtered.OrderByDescending(t => names.GetValueOrDefault(t.CategoryId, ""), StringComparer.OrdinalIgnoreCase)
                    : filtered.OrderBy(t => names.GetValueOrDefault(t.CategoryId, ""), StringComparer.OrdinalIgnoreCase),
                "type" => desc ? filtered.OrderByDescending(t => t.Type) : filtered.OrderBy(t => t.Type),
                _ => desc ? filtered.OrderByDescending(t => t.Date) : filtered.OrderBy(t => t.Date)
            };
            var sorted = ordered.ThenByDescending(t => t.TransactionId);

            var items = sorted
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(t => ToDto(t, names))
                .ToList();

            return new PagedResult<TransactionDto>
            {
                Items = items,
                TotalCount = filtered.Count,
                Page = query.Page,
                PageSize = query.PageSize
            };
        });

    public TransactionDto GetById(int id) =>
        _store.Read(d => ToDto(Find(d, id), CategoryNames(d)));

    public TransactionDto Create(TransactionRequest request) =>
        _store.Write(d =>
        {
            ValidateCategory(d, request);

            var entity = new Transaction { TransactionId = d.NextTransactionId++ };
            Apply(entity, request);
            d.Transactions.Add(entity);
            return ToDto(entity, CategoryNames(d));
        });

    public TransactionDto Update(int id, TransactionRequest request) =>
        _store.Write(d =>
        {
            var entity = Find(d, id);
            ValidateCategory(d, request);
            Apply(entity, request);
            return ToDto(entity, CategoryNames(d));
        });

    public void Delete(int id) =>
        _store.Write(d =>
        {
            d.Transactions.Remove(Find(d, id));
            return true;
        });

    private static Transaction Find(DataFile d, int id) =>
        d.Transactions.FirstOrDefault(t => t.TransactionId == id)
        ?? throw new NotFoundException($"Transaction {id} was not found.");

    private static void ValidateCategory(DataFile d, TransactionRequest request)
    {
        var category = d.Categories.FirstOrDefault(c => c.CategoryId == request.CategoryId)
                       ?? throw new ValidationAppException($"Category {request.CategoryId} does not exist.");

        if (category.Type != request.Type)
            throw new ValidationAppException(
                $"Category '{category.Name}' is an {category.Type} category and cannot be used for an {request.Type} transaction.");
    }

    private static void Apply(Transaction entity, TransactionRequest request)
    {
        entity.CategoryId = request.CategoryId;
        entity.Title = request.Title.Trim();
        entity.Amount = Math.Round(request.Amount, 2);
        entity.Type = request.Type;
        entity.Date = request.Date!.Value.Date;
        entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
    }
}
