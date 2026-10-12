using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Produces("application/json")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _service;

    public CategoriesController(ICategoryService service) => _service = service;

    [HttpGet]
    public ActionResult<List<CategoryDto>> GetAll([FromQuery] TransactionType? type)
        => Ok(_service.GetAll(type));

    [HttpGet("{id:int}")]
    public ActionResult<CategoryDto> GetById(int id) => Ok(_service.GetById(id));

    [HttpPost]
    public ActionResult<CategoryDto> Create([FromBody] CategoryRequest request)
    {
        var created = _service.Create(request);
        return CreatedAtAction(nameof(GetById), new { id = created.CategoryId }, created);
    }

    [HttpPut("{id:int}")]
    public ActionResult<CategoryDto> Update(int id, [FromBody] CategoryRequest request)
        => Ok(_service.Update(id, request));

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        _service.Delete(id);
        return NoContent();
    }
}
