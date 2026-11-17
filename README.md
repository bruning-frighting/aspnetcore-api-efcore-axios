# ASP.NET Core Web API CRUD với Entity Framework Core & Front-end Axios

Dự án mẫu hoàn chỉnh đáp ứng đầy đủ bài tập:
1. Xây dựng RESTful API backend bằng **ASP.NET Core (.NET 8)**.
2. Tạo **Controllers** và các **Endpoints** với đầy đủ 4 phương thức: **GET, POST, PUT, DELETE**.
3. Tạo các request từ **Front-end** đến Back-end bằng thư viện **Axios** (kèm giao diện tương tác trực tiếp).
4. Cấu hình kết nối **Database** (hỗ trợ cả **SQL Server** và **SQLite**) qua `appsettings.json`.
5. Cài đặt, cấu hình **Entity Framework Core (Code-First)** và tạo **Migration**.
6. Cấu hình **CORS** để Front-end giao tiếp với Back-end mà không bị chặn.

---

## 📁 Cấu trúc thư mục dự án

```text
aspnetcore-api-efcore-axios/
├── .gitignore                      # Cấu hình bỏ qua các file build tạm (.NET, DB, logs)
├── README.md                       # Tài liệu hướng dẫn chi tiết
├── AspNetCoreApi/                  # Source code Back-end ASP.NET Core
│   ├── AspNetCoreApi.csproj        # Khai báo NuGet packages & cấu hình project
│   ├── Program.cs                  # Điểm khởi chạy, cấu hình DI, DbContext, CORS, Middleware
│   ├── appsettings.json            # Chuỗi kết nối Database và cấu hình ứng dụng
│   ├── appsettings.Development.json
│   ├── Models/
│   │   └── Product.cs              # Entity đại diện cho bảng Products trong Database
│   ├── DTOs/                       # Data Transfer Objects
│   │   ├── CreateProductDto.cs     # DTO nhận dữ liệu tạo mới (POST)
│   │   ├── UpdateProductDto.cs     # DTO nhận dữ liệu cập nhật (PUT)
│   │   └── ProductResponseDto.cs   # DTO trả dữ liệu về cho Client (GET)
│   ├── Data/
│   │   └── AppDbContext.cs         # Lớp DbContext quản lý kết nối và Seed Data
│   ├── Migrations/                 # Các file Migration của EF Core
│   │   ├── 20261117000000_InitialCreate.cs
│   │   ├── 20261117000000_InitialCreate.Designer.cs
│   │   └── AppDbContextModelSnapshot.cs
│   └── Controllers/
│       └── ProductsController.cs   # Controller chứa các Action GET, POST, PUT, DELETE
└── Frontend/                       # Source code Front-end Client tương tác với API
    ├── index.html                  # Giao diện Web Client (HTML5 + CDN Axios)
    ├── style.css                   # Định dạng giao diện hiện đại, responsive
    ├── api.js                      # Module Axios đóng gói các hàm gọi API (GET, POST, PUT, DELETE)
    └── app.js                      # Xử lý sự kiện giao diện, DOM, Modal, Console log
```

---

## 1. Tìm hiểu cách cấu hình kết nối Database ở Back-end

Trong ASP.NET Core, chuỗi kết nối Database được khai báo trong file cấu hình `appsettings.json` và đăng ký trong `Program.cs`.

### Bước 1.1: Khai báo Connection String trong `appsettings.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "UseSqlServer": false,
  "ConnectionStrings": {
    "SqliteConnection": "Data Source=app.db",
    "SqlServerConnection": "Server=localhost;Database=ProductDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
}
```

* **SQLite (`SqliteConnection`):** Cực kỳ tiện lợi cho môi trường học tập/thực hành vì không cần cài SQL Server, cơ sở dữ liệu lưu dưới dạng 1 file `app.db` ngay trong thư mục chạy.
* **SQL Server (`SqlServerConnection`):** Dùng khi kết nối đến Microsoft SQL Server (hoặc SQL Server Express/LocalDB).

### Bước 1.2: Đăng ký DbContext với chuỗi kết nối trong `Program.cs`

```csharp
// Đọc cấu hình từ appsettings.json
var useSqlServer = builder.Configuration.GetValue<bool>("UseSqlServer");

if (useSqlServer)
{
    var sqlServerConnection = builder.Configuration.GetConnectionString("SqlServerConnection");
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
```

---

## 2. Tìm hiểu cách cài đặt, cấu hình EF Core & tạo Migration

### Bước 2.1: Cài đặt các gói NuGet cần thiết

Nếu tạo project từ đầu bằng terminal, bạn chạy các lệnh sau:
```bash
# Cài gói EF Core lõi
dotnet add package Microsoft.EntityFrameworkCore

# Gói hỗ trợ SQL Server (hoặc SQLite nếu dùng SQLite)
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Sqlite

# Gói công cụ để sinh mã Migration
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools

# Cài đặt công cụ dòng lệnh EF Core toàn cục (chỉ cần chạy 1 lần trên máy)
dotnet tool install --global dotnet-ef
```

### Bước 2.2: Định nghĩa Model và DbContext

* **Model (`Models/Product.cs`):** Định nghĩa cấu trúc các cột (Id, Name, Description, Price, Stock, CreatedAt).
* **DbContext (`Data/AppDbContext.cs`):**
  ```csharp
  public class AppDbContext : DbContext
  {
      public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

      public DbSet<Product> Products => Set<Product>();

      protected override void OnModelCreating(ModelBuilder modelBuilder)
      {
          base.OnModelCreating(modelBuilder);
          // Fluent API cấu hình bảng & Seed Data mẫu
      }
  }
  ```

### Bước 2.3: Các lệnh tạo và áp dụng Migration

```bash
# 1. Tạo migration mới khi có thay đổi Model (ví dụ: tạo bảng lần đầu)
dotnet ef migrations add InitialCreate

# 2. Cập nhật schema vào Database thực tế
dotnet ef database update

# 3. (Tùy chọn) Xóa migration gần nhất nếu chưa cập nhật DB
dotnet ef migrations remove
```
*Lưu ý:* Dự án này đã bao gồm sẵn code Migration trong thư mục `Migrations/` và trong `Program.cs` có đoạn `dbContext.Database.EnsureCreated();` giúp tự động sinh database và nạp sẵn dữ liệu mẫu khi ứng dụng khởi chạy!

---

## 3. Controllers và các Endpoints (GET, POST, PUT, DELETE)

Controller nằm tại `Controllers/ProductsController.cs` cung cấp 5 endpoint chuẩn RESTful:

| Method | Endpoint | Mô tả | Mã HTTP trả về |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | Lấy danh sách toàn bộ sản phẩm | `200 OK` |
| **GET** | `/api/products/{id}` | Lấy chi tiết một sản phẩm theo ID | `200 OK` hoặc `404 Not Found` |
| **POST** | `/api/products` | Tạo mới sản phẩm từ JSON body | `201 Created` (kèm URL chi tiết) hoặc `400 Bad Request` |
| **PUT** | `/api/products/{id}` | Cập nhật thông tin sản phẩm theo ID | `200 OK` hoặc `400 Bad Request` / `404 Not Found` |
| **DELETE** | `/api/products/{id}` | Xóa một sản phẩm theo ID | `200 OK` hoặc `404 Not Found` |

### Tóm tắt code Controller:

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context) => _context = context;

    // GET: api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetProducts()
    {
        return Ok(await _context.Products.AsNoTracking().ToListAsync());
    }

    // GET: api/products/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponseDto>> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    // POST: api/products
    [HttpPost]
    public async Task<ActionResult<ProductResponseDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        var product = new Product { Name = dto.Name, Price = dto.Price, Stock = dto.Stock };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    // PUT: api/products/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductResponseDto>> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        product.Name = dto.Name;
        product.Price = dto.Price;
        await _context.SaveChangesAsync();
        return Ok(product);
    }

    // DELETE: api/products/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return Ok(new { message = $"Đã xóa sản phẩm ID = {id}" });
    }
}
```

---

## 4. Tạo các Request từ Front-end bằng Axios

File `Frontend/api.js` tổ chức toàn bộ logic gọi HTTP bằng **Axios**:

```javascript
import axios from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

// 1. GET Request: Lấy danh sách
export async function getAllProducts() {
    const response = await apiClient.get('/products');
    return response.data;
}

// 2. GET by ID: Lấy 1 bản ghi
export async function getProductById(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
}

// 3. POST Request: Thêm mới
export async function createProduct(payload) {
    const response = await apiClient.post('/products', payload);
    return response.data;
}

// 4. PUT Request: Cập nhật
export async function updateProduct(id, payload) {
    const response = await apiClient.put(`/products/${id}`, payload);
    return response.data;
}

// 5. DELETE Request: Xóa
export async function deleteProduct(id) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
}
```

### Cấu hình CORS ở Back-end (Quan trọng)
Để Front-end có thể gửi request qua Axios mà không bị trình duyệt chặn bởi chính sách bảo mật cùng nguồn gốc, trong `Program.cs` đã cấu hình:
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontendClient", policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});
// ...
app.UseCors("AllowFrontendClient");
```

---

## 5. Hướng dẫn chạy thử nghiệm hệ thống

### Bước 1: Khởi động Back-end ASP.NET Core
Mở Terminal tại thư mục `AspNetCoreApi`:
```bash
cd AspNetCoreApi
dotnet run
```
* API sẽ chạy tại: `http://localhost:5000` (hoặc cổng được hiển thị trong terminal).
* Swagger UI để xem và thử trực tiếp: `http://localhost:5000/`

### Bước 2: Mở Front-end
* Mở file `Frontend/index.html` bằng trình duyệt (hoặc dùng tính năng **Live Server** trong VS Code).
* Bạn có thể test trực tiếp các chức năng: Xem danh sách (GET), Thêm mới (POST), Sửa (PUT), Xóa (DELETE). Dưới giao diện có khung hiển thị log gọi API từ Axios theo thời gian thực.

