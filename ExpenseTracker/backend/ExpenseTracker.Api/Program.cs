using System.Text.Json.Serialization;
using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Middleware;
using ExpenseTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + JSON (enums are sent/received as strings: "Income" / "Expense")
builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new() { Title = "Personal Expense Tracker API", Version = "v1" });
});

// Data is stored in a JSON file (no database needed)
var configuredPath = builder.Configuration["Storage:DataFilePath"] ?? "App_Data/expense-data.json";
var dataFilePath = Path.Combine(builder.Environment.ContentRootPath, configuredPath);
builder.Services.AddSingleton<IDataStore>(_ => new JsonDataStore(dataFilePath));

// Dependency Injection: application services
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<IReportService, ReportService>();

// CORS for the React frontend
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection(); // HTTPS in production
}

app.UseCors("Frontend");
app.MapControllers();

// Load (or create) the JSON data file now, so problems show up at startup
var store = app.Services.GetRequiredService<IDataStore>();
app.Logger.LogInformation("Using data file: {Path}", (store as JsonDataStore)?.FilePath ?? dataFilePath);

app.Run();

public partial class Program { }
