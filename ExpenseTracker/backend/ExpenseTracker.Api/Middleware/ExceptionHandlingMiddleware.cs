using System.Text.Json;
using ExpenseTracker.Api.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Middleware;

/// <summary>Turns exceptions into consistent RFC 7807 ProblemDetails JSON responses.</summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted) throw;

            var (status, title) = ex switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, "Not Found"),
                ConflictException => (StatusCodes.Status409Conflict, "Conflict"),
                ValidationAppException => (StatusCodes.Status400BadRequest, "Bad Request"),
                _ => (StatusCodes.Status500InternalServerError, "Server Error")
            };

            if (status == StatusCodes.Status500InternalServerError)
                _logger.LogError(ex, "Unhandled exception for {Path}", context.Request.Path);
            else
                _logger.LogWarning("{Title}: {Message}", title, ex.Message);

            var problem = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = status == StatusCodes.Status500InternalServerError
                    ? "An unexpected error occurred. Please try again."
                    : ex.Message,
                Instance = context.Request.Path
            };

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
    }
}
