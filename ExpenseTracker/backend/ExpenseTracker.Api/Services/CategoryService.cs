using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Exceptions;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Services;

public interface ICategoryService
{
    List<CategoryDto> GetAll(TransactionType? type);
    CategoryDto GetById(int id);
    CategoryDto Create(CategoryRequest request);
    CategoryDto Update(int id, CategoryRequest request);
    void Delete(int id);
}

public class CategoryService : ICategoryService
{
    private readonly IDataStore _store;

    public CategoryService(IDataStore store) => _store = store;

    public List<CategoryDto> GetAll(TransactionType? type) =>
        _store.Read(d => d.Categories
            .Where(c => !type.HasValue || c.Type == type.Value)
            .OrderBy(c => c.Type == TransactionType.Expense ? 0 : 1)
            .ThenBy(c => c.Name, StringComparer.OrdinalIgnoreCase)
            .Select(ToDto)
            .ToList());

    public CategoryDto GetById(int id) =>
        _store.Read(d => ToDto(Find(d, id)));

    public CategoryDto Create(CategoryRequest request) =>
        _store.Write(d =>
        {
            var name = request.Name.Trim();
            if (d.Categories.Any(c => SameName(c.Name, name) && c.Type == request.Type))
                throw new ConflictException($"A {request.Type} category named '{name}' already exists.");

            var entity = new Category { CategoryId = d.NextCategoryId++, Name = name, Type = request.Type };
            d.Categories.Add(entity);
            return ToDto(entity);
        });

    public CategoryDto Update(int id, CategoryRequest request) =>
        _store.Write(d =>
        {
            var entity = Find(d, id);
            var name = request.Name.Trim();

            if (d.Categories.Any(c => c.CategoryId != id && SameName(c.Name, name) && c.Type == request.Type))
                throw new ConflictException($"A {request.Type} category named '{name}' already exists.");

            if (entity.Type != request.Type && IsInUse(d, id))
                throw new ConflictException("The type of a category that already has transactions or budgets cannot be changed.");

            entity.Name = name;
            entity.Type = request.Type;
            return ToDto(entity);
        });

    public void Delete(int id) =>
        _store.Write(d =>
        {
            var entity = Find(d, id);
            if (IsInUse(d, id))
                throw new ConflictException("This category is used by existing transactions or budgets and cannot be deleted.");

            d.Categories.Remove(entity);
            return true;
        });

    private static Category Find(DataFile d, int id) =>
        d.Categories.FirstOrDefault(c => c.CategoryId == id)
        ?? throw new NotFoundException($"Category {id} was not found.");

    private static bool IsInUse(DataFile d, int id) =>
        d.Transactions.Any(t => t.CategoryId == id) || d.Budgets.Any(b => b.CategoryId == id);

    private static bool SameName(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    private static CategoryDto ToDto(Category c) =>
        new() { CategoryId = c.CategoryId, Name = c.Name, Type = c.Type };
}
