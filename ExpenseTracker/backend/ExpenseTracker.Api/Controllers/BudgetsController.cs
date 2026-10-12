using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/budgets")]
[Produces("application/json")]
public class BudgetsController : ControllerBase
{
    private readonly IBudgetService _service;

    public BudgetsController(IBudgetService service) => _service = service;

    /// <summary>List budgets with spent / remaining amounts. Optionally filter by month and year.</summary>
    [HttpGet]
    public ActionResult<List<BudgetDto>> GetAll([FromQuery] int? month, [FromQuery] int? year)
        => Ok(_service.Get(month, year));

    [HttpGet("{id:int}")]
    public ActionResult<BudgetDto> GetById(int id) => Ok(_service.GetById(id));

    [HttpPost]
    public ActionResult<BudgetDto> Create([FromBody] BudgetRequest request)
    {
        var created = _service.Create(request);
        return CreatedAtAction(nameof(GetById), new { id = created.BudgetId }, created);
    }

    [HttpPut("{id:int}")]
    public ActionResult<BudgetDto> Update(int id, [FromBody] BudgetRequest request)
        => Ok(_service.Update(id, request));

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        _service.Delete(id);
        return NoContent();
    }
}
