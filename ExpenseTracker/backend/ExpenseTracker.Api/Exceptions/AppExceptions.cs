namespace ExpenseTracker.Api.Exceptions;

/// <summary>Resource does not exist -> HTTP 404.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>Request conflicts with current data (duplicates, in-use rows) -> HTTP 409.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Business-rule validation failed -> HTTP 400.</summary>
public class ValidationAppException : Exception
{
    public ValidationAppException(string message) : base(message) { }
}
