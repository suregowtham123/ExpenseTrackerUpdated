using ExpenseTracker.Api.Dtos;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Produces("application/json")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _service;

    public TransactionsController(ITransactionService service) => _service = service;

    /// <summary>Search, filter, sort and page through transactions.</summary>
    [HttpGet]
    public ActionResult<PagedResult<TransactionDto>> GetAll([FromQuery] TransactionQuery query)
        => Ok(_service.Query(query));

    [HttpGet("{id:int}")]
    public ActionResult<TransactionDto> GetById(int id) => Ok(_service.GetById(id));

    [HttpPost]
    public ActionResult<TransactionDto> Create([FromBody] TransactionRequest request)
    {
        var created = _service.Create(request);
        return CreatedAtAction(nameof(GetById), new { id = created.TransactionId }, created);
    }

    [HttpPut("{id:int}")]
    public ActionResult<TransactionDto> Update(int id, [FromBody] TransactionRequest request)
        => Ok(_service.Update(id, request));

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        _service.Delete(id);
        return NoContent();
    }
}
