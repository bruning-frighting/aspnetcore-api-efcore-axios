using Microsoft.EntityFrameworkCore;
using AspNetCoreApi.Models;

namespace AspNetCoreApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình Fluent API cho Entity Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.Property(e => e.Stock).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Dữ liệu mẫu ban đầu (Seed Data)
        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Id = 1,
                Name = "Laptop Dell XPS 15",
                Description = "Intel Core i7, 16GB RAM, 512GB SSD",
                Price = 35000000m,
                Stock = 10,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = 2,
                Name = "Bàn phím cơ Keychron K2",
                Description = "Gateron Brown Switch, Bluetooth & Type-C",
                Price = 1850000m,
                Stock = 25,
                CreatedAt = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = 3,
                Name = "Chuột Logitech MX Master 3S",
                Description = "Quiet clicks, cảm biến 8K DPI",
                Price = 2490000m,
                Stock = 15,
                CreatedAt = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
