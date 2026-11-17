/**
 * api.js - Quản lý toàn bộ HTTP Request đến ASP.NET Core Back-end bằng thư viện Axios
 * Cung cấp đầy đủ 4 phương thức: GET, POST, PUT, DELETE
 */

// Địa chỉ cổng API của ASP.NET Core (chỉnh lại theo cổng thực tế khi chạy dotnet run, vd: 5000, 5100, 7000, ...)
const API_BASE_URL = 'http://localhost:5000/api';

// Khởi tạo instance của Axios với cấu hình mặc định
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 10000 // Hủy request nếu quá 10 giây
});

// Interceptor: Lắng nghe và log mọi Request trước khi gửi
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[HTTP Request] ${config.method?.toUpperCase()} -> ${config.url}`, config.data || '');
        return config;
    },
    (error) => {
        console.error('[Request Error]', error);
        return Promise.reject(error);
    }
);

// Interceptor: Lắng nghe và xử lý Response trả về từ Server
apiClient.interceptors.response.use(
    (response) => {
        console.log(`[HTTP Response] ${response.status} from ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`[API Error ${error.response.status}]`, error.response.data);
        } else if (error.request) {
            console.error('[Network Error] Không thể kết nối tới server Back-end:', error.message);
        } else {
            console.error('[Axios Error]', error.message);
        }
        return Promise.reject(error);
    }
);

// -------------------------------------------------------------
// CÁC HÀM GỌI API (GET, POST, PUT, DELETE)
// -------------------------------------------------------------

/**
 * 1. GET METHOD: Lấy danh sách toàn bộ sản phẩm
 * Endpoint: GET /api/products
 */
export async function getAllProducts() {
    const response = await apiClient.get('/products');
    return response.data;
}

/**
 * 2. GET METHOD (by ID): Lấy thông tin chi tiết một sản phẩm theo ID
 * Endpoint: GET /api/products/{id}
 */
export async function getProductById(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
}

/**
 * 3. POST METHOD: Tạo mới một sản phẩm
 * Endpoint: POST /api/products
 * @param {Object} productData { name, description, price, stock }
 */
export async function createProduct(productData) {
    const response = await apiClient.post('/products', productData);
    return response.data;
}

/**
 * 4. PUT METHOD: Cập nhật thông tin toàn bộ sản phẩm theo ID
 * Endpoint: PUT /api/products/{id}
 * @param {number} id
 * @param {Object} productData { name, description, price, stock }
 */
export async function updateProduct(id, productData) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
}

/**
 * 5. DELETE METHOD: Xóa một sản phẩm theo ID
 * Endpoint: DELETE /api/products/{id}
 * @param {number} id
 */
export async function deleteProduct(id) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
}

// Cho phép truy cập trực tiếp biến apiClient nếu cần cấu hình lại baseURL động
export { apiClient, API_BASE_URL };
