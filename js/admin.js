const API_URL = 'http://localhost:3000/api';

// Admin panel vars
let currentUser = null;
let users = [];
let products = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Доступ запрещен. Требуются права администратора.');
    window.location.href = 'auth.html';
    return;
  }

  document.getElementById('admin-name').textContent = `Привет, ${currentUser.name}!`;

  await loadUsers();
  await loadProducts();

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tabName}-section`).classList.add('active');
    });
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });

  document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());
  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
  
  document.getElementById('user-cancel-btn').addEventListener('click', closeUserModal);
  document.getElementById('product-cancel-btn').addEventListener('click', closeProductModal);
  
  document.getElementById('user-form').addEventListener('submit', handleUserSubmit);
  document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
  
  document.getElementById('product-image-file').addEventListener('change', handleImageUpload);
});

async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    users = await response.json();
    renderUsersTable();
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    products = await response.json();
    renderProductsTable();
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
      <td>
        <button class="btn-small btn-edit" onclick="editUser(${user.id})">Изменить</button>
        <button class="btn-small btn-delete" onclick="deleteUser(${user.id})">Удалить</button>
      </td>
    </tr>
  `).join('');
}

function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.id}</td>
      <td><img src="${product.image}" class="product-img-preview"></td>
      <td>${product.name}</td>
      <td>${product.price.toLocaleString()} ₽</td>
      <td>
        <button class="btn-small btn-edit" onclick="editProduct(${product.id})">Изменить</button>
        <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})">Удалить</button>
      </td>
    </tr>
  `).join('');
}

function openUserModal(user = null) {
  const modal = document.getElementById('user-modal');
  const title = document.getElementById('user-modal-title');
  const form = document.getElementById('user-form');
  
  if (user) {
    title.textContent = 'Редактировать пользователя';
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-name').value = user.name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('user-role').value = user.role;
  } else {
    title.textContent = 'Добавить пользователя';
    form.reset();
    document.getElementById('user-password').required = true;
  }
  
  modal.classList.add('active');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
  document.getElementById('user-form').reset();
}

function openProductModal(product = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  const currentImage = document.getElementById('current-product-image');
  
  if (product) {
    title.textContent = 'Редактировать товар';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-desc').value = product.desc;
    document.getElementById('product-image').value = product.image;
    currentImage.src = product.image;
    currentImage.style.display = 'block';
  } else {
    title.textContent = 'Добавить товар';
    form.reset();
    currentImage.style.display = 'none';
  }
  
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  document.getElementById('product-form').reset();
  document.getElementById('current-product-image').style.display = 'none';
}

async function handleUserSubmit(e) {
  e.preventDefault();
  
  const userId = document.getElementById('user-id').value;
  const userData = {
    name: document.getElementById('user-name').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value
  };
  
  const password = document.getElementById('user-password').value;
  if (password) {
    userData.password = password;
  }
  
  try {
    if (userId) {
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    } else {
      if (!password) {
        alert('Пароль обязателен для нового пользователя');
        return;
      }
      await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    }
    
    closeUserModal();
    await loadUsers();
  } catch (error) {
    alert('Ошибка при сохранении пользователя');
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  
  const productId = document.getElementById('product-id').value;
  const productData = {
    name: document.getElementById('product-name').value,
    price: parseFloat(document.getElementById('product-price').value),
    desc: document.getElementById('product-desc').value,
    image: document.getElementById('product-image').value
  };
  
  try {
    if (productId) {
      await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    } else {
      await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    }
    
    closeProductModal();
    await loadProducts();
  } catch (error) {
    alert('Ошибка при сохранении товара');
  }
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    document.getElementById('product-image').value = data.url;
    document.getElementById('current-product-image').src = data.url;
    document.getElementById('current-product-image').style.display = 'block';
  } catch (error) {
    alert('Ошибка при загрузке изображения');
  }
}

window.editUser = function(id) {
  const user = users.find(u => u.id === id);
  if (user) {
    openUserModal(user);
  }
};

window.deleteUser = async function(id) {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
    return;
  }
  
  try {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
    await loadUsers();
  } catch (error) {
    alert('Ошибка при удалении пользователя');
  }
};

window.editProduct = function(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    openProductModal(product);
  }
};

window.deleteProduct = async function(id) {
  if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
    return;
  }
  
  try {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  } catch (error) {
    alert('Ошибка при удалении товара');
  }
};

