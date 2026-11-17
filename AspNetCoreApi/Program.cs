using Microsoft.EntityFrameworkCore;
using AspNetCoreApi.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Thêm Controllers
builder.Services.AddControllers();

// 2. Thêm Swagger UI để test API dễ dàng
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Product Management API",
        Version = "v1",
        Description = "ASP.NET Core Web API CRUD với Entity Framework Core"
    });
});

// 3. Cấu hình Database & Entity Framework Core
// Cung cấp 2 lựa chọn: SQLite (mặc định để chạy ngay) hoặc SQL Server
var useSqlServer = builder.Configuration.GetValue<bool>("UseSqlServer");

if (useSqlServer)
{
    var sqlServerConnection = builder.Configuration.GetConnectionString("SqlServerConnection")
        ?? throw new InvalidOperationException("Chưa cấu hình SqlServerConnection trong appsettings.json");
    
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(sqlServerConnection));
}
else
{
    var sqliteConnection = builder.Configuration.GetConnectionString("SqliteConnection")
        ?? "Data Source=app.db";

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(sqliteConnection));
}

// 4. Cấu hình CORS để cho phép Front-end (Axios) gọi API mà không bị chặn
const string FrontendCorsPolicy = "AllowFrontendClient";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 5. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Product Management API v1");
        c.RoutePrefix = string.Empty; // Mở Swagger ngay trang gốc http://localhost:<port>/
    });
}

// Tự động kiểm tra và khởi tạo Database cùng Seed Data nếu chưa có
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
}

app.UseHttpsRedirection();

// Kích hoạt CORS (phải đặt trước UseAuthorization và MapControllers)
app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();

app.MapControllers();

app.Run();
