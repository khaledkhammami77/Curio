var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddValidation();
builder.Services.AddSingleton<QuizSessionStore>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () => TypedResults.Ok(new { status = "ok" }));
app.MapQuizEndpoints();

app.Run();
