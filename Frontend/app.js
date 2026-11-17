import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, apiClient } from './api.js';

// DOM Elements
const productTableBody = document.getElementById('productTableBody');
const createForm = document.getElementById('createProductForm');
const editForm = document.getElementById('editProductForm');
const btnRefresh = document.getElementById('btnRefresh');
const alertBox = document.getElementById('alertBox');
const consoleOutput = document.getElementById('consoleOutput');
const editModal = document.getElementById('editModal');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const apiUrlInput = document.getElementById('apiUrlInput');
const btnUpdateApiUrl = document.getElementById('btnUpdateApiUrl');

// Log helper to display in the UI console box
function logMessage(msg) {
    const time = new Date().toLocaleTimeString();
    consoleOutput.textContent = `[${time}] ${msg}\n` + consoleOutput.textContent;
}

// Show alert banner
function showAlert(message, type = 'success') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 4000);
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ---------------------------------------------------------------------
// 1. READ: Lấy danh sách sản phẩm (GET /api/products)
// ---------------------------------------------------------------------
async function loadProducts() {
    productTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;
    try {
        logMessage('Gửi GET request: Lấy danh sách sản phẩm...');
        const products = await getAllProducts();
        logMessage(`GET thành công! Nhận được ${products.length} sản phẩm.`);

        if (products.length === 0) {
            productTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có sản phẩm nào.</td></tr>`;
            return;
        }

        productTableBody.innerHTML = products.map(product => `
            <tr>
                <td><strong>#${product.id}</strong></td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(product.name)}</div>
                    <small style="color: var(--text-muted);">${escapeHtml(product.description || 'Không có mô tả')}</small>
                </td>
                <td class="price">${formatCurrency(product.price)}</td>
                <td>
                    <span class="badge ${product.stock > 0 ? 'badge-in-stock' : 'badge-out-stock'}">
                        ${product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng'}
                    </span>
                </td>
                <td><small>${new Date(product.createdAt).toLocaleString('vi-VN')}</small></td>
                <td>
                    <div class="actions">
                        <button class="btn btn-secondary btn-sm btn-edit" data-id="${product.id}">Sửa (PUT)</button>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${product.id}">Xóa (DELETE)</button>
                    </div>
                </td>
            </tr>
        `).join('');

        attachActionListeners();
    } catch (error) {
        logMessage(`Lỗi GET: ${error.message}`);
        showAlert(`Không thể tải dữ liệu: ${error.response?.data?.message || error.message}`, 'danger');
        productTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu. Hãy kiểm tra Back-end có đang chạy không!</td></tr>`;
    }
}

// ---------------------------------------------------------------------
// 2. CREATE: Thêm mới sản phẩm (POST /api/products)
// ---------------------------------------------------------------------
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = createForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const newProduct = {
        name: document.getElementById('createName').value.trim(),
        description: document.getElementById('createDescription').value.trim() || null,
        price: parseFloat(document.getElementById('createPrice').value),
        stock: parseInt(document.getElementById('createStock').value, 10)
    };

    try {
        logMessage(`Gửi POST request tạo sản phẩm: "${newProduct.name}"...`);
        const created = await createProduct(newProduct);
        logMessage(`POST thành công! Đã tạo sản phẩm ID = ${created.id}`);
        showAlert(`Thêm sản phẩm "${created.name}" thành công!`, 'success');
        createForm.reset();
        await loadProducts();
    } catch (error) {
        logMessage(`Lỗi POST: ${error.message}`);
        showAlert(`Thêm sản phẩm thất bại: ${error.response?.data?.message || error.message}`, 'danger');
    } finally {
        submitBtn.disabled = false;
    }
});

// ---------------------------------------------------------------------
// 3. UPDATE: Cập nhật sản phẩm (PUT /api/products/{id})
// ---------------------------------------------------------------------
async function openEditModal(id) {
    try {
        logMessage(`Gửi GET request lấy thông tin sản phẩm ID = ${id} để sửa...`);
        const product = await getProductById(id);
        
        document.getElementById('editId').value = product.id;
        document.getElementById('editName').value = product.name;
        document.getElementById('editDescription').value = product.description || '';
        document.getElementById('editPrice').value = product.price;
        document.getElementById('editStock').value = product.stock;

        editModal.classList.add('active');
    } catch (error) {
        logMessage(`Lỗi lấy chi tiết sản phẩm: ${error.message}`);
        showAlert(`Không tìm thấy sản phẩm ID = ${id}`, 'danger');
    }
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('editId').value, 10);
    const updatedData = {
        name: document.getElementById('editName').value.trim(),
        description: document.getElementById('editDescription').value.trim() || null,
        price: parseFloat(document.getElementById('editPrice').value),
        stock: parseInt(document.getElementById('editStock').value, 10)
    };

    try {
        logMessage(`Gửi PUT request cập nhật sản phẩm ID = ${id}...`);
        const result = await updateProduct(id, updatedData);
        logMessage(`PUT thành công cho sản phẩm ID = ${id}!`);
        showAlert(`Cập nhật sản phẩm ID = ${id} thành công!`, 'success');
        editModal.classList.remove('active');
        await loadProducts();
    } catch (error) {
        logMessage(`Lỗi PUT: ${error.message}`);
        showAlert(`Cập nhật thất bại: ${error.response?.data?.message || error.message}`, 'danger');
    }
});

btnCancelEdit.addEventListener('click', () => {
    editModal.classList.remove('active');
});

// ---------------------------------------------------------------------
// 4. DELETE: Xóa sản phẩm (DELETE /api/products/{id})
// ---------------------------------------------------------------------
async function handleDelete(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm ID = ${id}?`)) {
        return;
    }

    try {
        logMessage(`Gửi DELETE request xóa sản phẩm ID = ${id}...`);
        await deleteProduct(id);
        logMessage(`DELETE thành công sản phẩm ID = ${id}!`);
        showAlert(`Đã xóa sản phẩm ID = ${id} thành công!`, 'success');
        await loadProducts();
    } catch (error) {
        logMessage(`Lỗi DELETE: ${error.message}`);
        showAlert(`Xóa thất bại: ${error.response?.data?.message || error.message}`, 'danger');
    }
}

// Gán sự kiện cho các nút Sửa & Xóa trong danh sách
function attachActionListeners() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id, 10)));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => handleDelete(parseInt(btn.dataset.id, 10)));
    });
}

// Cập nhật URL Base của API theo cấu hình giao diện
btnUpdateApiUrl.addEventListener('click', () => {
    const newUrl = apiUrlInput.value.trim();
    if (newUrl) {
        apiClient.defaults.baseURL = newUrl;
        logMessage(`Đã cập nhật baseURL của Axios thành: ${newUrl}`);
        showAlert(`Đã đổi API URL thành: ${newUrl}`, 'success');
        loadProducts();
    }
});

btnRefresh.addEventListener('click', loadProducts);

// Helper escape HTML để tránh XSS
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Tự động load dữ liệu khi khởi động
document.addEventListener('DOMContentLoaded', () => {
    apiUrlInput.value = apiClient.defaults.baseURL;
    loadProducts();
});
