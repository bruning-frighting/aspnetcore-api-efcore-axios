using System.ComponentModel.DataAnnotations;

namespace AspNetCoreApi.DTOs;

public class CreateProductDto
{
    [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
    [MaxLength(150, ErrorMessage = "Tên sản phẩm không vượt quá 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Giá sản phẩm phải từ 0 trở lên")]
    public decimal Price { get; set; }

    [Range(0, 100000, ErrorMessage = "Số lượng tồn kho phải từ 0 trở lên")]
    public int Stock { get; set; }
}
