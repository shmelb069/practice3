const API_URL = 'http://localhost:3000/api';
const SUPABASE_URL = 'https://qdrfhbtmslkijjdaihub.supabase.co/storage/v1/object/public/img';
const SUPABASE_UPLOAD_URL = 'https://qdrfhbtmslkijjdaihub.supabase.co/storage/v1/object/img';
const SUPABASE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmZoYnRtc2xraWpqZGFpaHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxODAzMiwiZXhwIjoyMDc4MDk0MDMyfQ.x3vz8wCuvJRKG1YhM9CMMvLl1l8v5jICg_KtcX22oGU';

let currentUser = null;
let products = [];
let users = [];

const tariffs = [
    {
        id: 'basic',
        name: 'Базовый минимум',
        price: 300,
        period: 'час',
        features: ['Доступ к игровым ПК', 'Бесплатные напитки', 'Wi-Fi'],
        popular: false
    },
    {
        id: 'premium',
        name: 'Роскошный максимум',
        price: 500,
        period: 'час',
        features: ['Приоритетные места', 'Бесплатный кальян', 'Дополнительные мониторы', 'Механическая клавиатура'],
        popular: true
    },
    {
        id: 'night',
        name: 'Ночной',
        price: 1200,
        period: '5 часов',
        features: ['С 22:00 до 08:00', 'Неограниченные напитки', 'Комфортная зона отдыха'],
        popular: false
    }
];

async function uploadToSupabase(file) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        
        const response = await fetch(`${SUPABASE_UPLOAD_URL}/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_TOKEN}`,
                'Content-Type': file.type
            },
            body: file
        });

        if (response.ok) {
            return `${SUPABASE_URL}/${fileName}`;
        } else {
            console.error('Ошибка загрузки на Supabase:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        return null;
    }
}

function validateLogin(login) {
    if (!login || login.length < 3) return 'Логин должен быть не менее 3 символов';
    return null;
}

function validatePassword(password) {
    if (!password || password.length < 6) return 'Пароль должен быть не менее 6 символов';
    return null;
}

function validateForm(login, password) {
    const loginError = validateLogin(login);
    const passwordError = validatePassword(password);
    return { loginError, passwordError, isValid: !loginError && !passwordError };
}

async function loginUser(login, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        const result = await response.json();
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(result.user));
        }
        return result;
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        return { success: false, error: 'Ошибка соединения с сервером' };
    }
}

async function registerUser(login, password, name) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password, name })
        });
        const result = await response.json();
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(result.user));
        }
        return result;
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return { success: false, error: 'Ошибка соединения с сервером' };
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    return { success: true };
}

function getCurrentUser() {
    if (!currentUser) {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            currentUser = JSON.parse(saved);
        }
    }
    return currentUser;
}

function isAuthenticated() {
    return getCurrentUser() !== null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
        return products;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        return [];
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        users = await response.json();
        return users;
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        return [];
    }
}

function getProductById(id) {
    return products.find(p => p.id === parseInt(id));
}

function getProductsByCategory(category) {
    if (!category || category === 'all') return products;
    return products.filter(p => p.category === category);
}

function renderProductCard(product) {
    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            <img src="${product.image}" alt="${product.name}" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+JHtwcm9kdWN0Lm5hbWV9PC90ZXh0Pjwvc3ZnPg=='">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="specs">
                ${product.specs && product.specs.length > 0 ? product.specs.map(spec => `<span class="spec-tag">${spec}</span>`).join('') : ''}
            </div>
            <div class="price">от ${product.price} руб/час</div>
            <button class="btn" onclick="bookProduct(${product.id})">Забронировать</button>
        </div>
    `;
}

async function renderProductList(container, category = null) {
    if (!container) return;
    
    await loadProducts();
    const productsList = getProductsByCategory(category);
    container.innerHTML = productsList.map(renderProductCard).join('');
    
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn')) {
                const productId = card.dataset.id;
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}

async function renderProductDetails(productId) {
    await loadProducts();
    const product = getProductById(productId);
    
    if (!product) {
        return `
            <section class="page-header">
                <div class="container">
                    <h1>Услуга не найдена</h1>
                    <p>Запрошенная услуга не существует.</p>
                    <a href="services.html" class="btn">Вернуться к услугам</a>
                </div>
            </section>
        `;
    }
    
    return `
        <section class="page-header">
            <div class="container">
                <h1>${product.name}</h1>
            </div>
        </section>
        
        <section class="product-detail">
            <div class="container">
                <div class="product-detail-grid">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+JHtwcm9kdWN0Lm5hbWV9PC90ZXh0Pjwvc3ZnPg=='">
                    </div>
                    <div class="product-info">
                        <p class="product-description">${product.description}</p>
                        <div class="product-specs">
                            <h3>Характеристики:</h3>
                            <ul>
                                ${product.specs && product.specs.length > 0 ? product.specs.map(spec => `<li>${spec}</li>`).join('') : '<li>Нет характеристик</li>'}
                            </ul>
                        </div>
                        <div class="product-price">
                            <span class="price">от ${product.price} руб/час</span>
                        </div>
                        <button class="btn btn-large" onclick="bookProduct(${product.id})">Забронировать</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function initProductFilters(container) {
    if (!container) return;
    
    const categories = [
        { id: 'all', name: 'Все' },
        { id: 'pc', name: 'Игровые ПК' },
        { id: 'console', name: 'Консоли' },
        { id: 'vr', name: 'VR' }
    ];
    
    const filterHTML = `
        <div class="product-filters">
            ${categories.map(cat => `
                <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" 
                        data-category="${cat.id}">${cat.name}</button>
            `).join('')}
        </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', filterHTML);
    
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const productsGrid = document.querySelector('.products-grid');
            if (productsGrid) {
                renderProductList(productsGrid, category);
            }
        });
    });
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return page || 'index.html';
}

function updateAuthUI() {
    const header = document.querySelector('.header .container');
    if (!header) return;
    
    let authStatus = document.getElementById('auth-status');
    if (!authStatus) {
        authStatus = document.createElement('div');
        authStatus.id = 'auth-status';
        header.appendChild(authStatus);
    }
    
    const user = getCurrentUser();
    
    if (isAuthenticated()) {
        authStatus.innerHTML = `
            <span>Привет, ${user.name || user.login}!</span>
            ${isAdmin() ? '<a href="admin.html" class="btn btn-small">Админка</a>' : ''}
            <button id="logout-btn" class="btn btn-small">Выйти</button>
        `;
        document.getElementById('logout-btn')?.addEventListener('click', logoutHandler);
    } else {
        authStatus.innerHTML = '';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function initEffects() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature, .promo-item, .service-card, .product-card, .pricing-plan').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

async function loginHandler(e) {
    e.preventDefault();
    const login = document.getElementById('login-input')?.value;
    const password = document.getElementById('password-input')?.value;
    
    if (!login || !password) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const result = await loginUser(login, password);
    
    if (result.success) {
        alert('Вход успешен!');
        window.location.href = 'index.html';
    } else {
        alert('Ошибка: ' + result.error);
    }
}

function logoutHandler() {
    logoutUser();
    alert('Вы вышли из аккаунта');
    window.location.reload();
}

window.bookProduct = function(productId) {
    if (!isAuthenticated()) {
        alert('Требуется авторизация!');
        window.location.href = 'login.html';
        return;
    }
    alert(`Бронирование услуги ID: ${productId}\nФункция в разработке...`);
};

window.selectTariff = function(tariffId) {
    if (!isAuthenticated()) {
        alert('Требуется авторизация!');
        window.location.href = 'login.html';
        return;
    }
    alert(`Выбран тариф: ${tariffId}\nФункция в разработке...`);
};

async function initAdminPage() {
    if (!isAdmin()) {
        alert('Доступ запрещен! Требуются права администратора.');
        window.location.href = 'index.html';
        return;
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = btn.dataset.tab + '-tab';
            document.getElementById(tabId)?.classList.add('active');
        });
    });

    await loadUsersTable();
    await loadProductsTable();

    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
}

async function loadUsersTable() {
    await loadUsers();
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.login}</td>
            <td>${user.name}</td>
            <td>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
            <td>
                <button class="btn btn-small" onclick="editUser(${user.id})">Редактировать</button>
                <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})">Удалить</button>
            </td>
        </tr>
    `).join('');
}

async function loadProductsTable() {
    await loadProducts();
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody) return;

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.price} руб</td>
            <td>
                <button class="btn btn-small" onclick="editProduct(${product.id})">Редактировать</button>
                <button class="btn btn-small btn-danger" onclick="deleteProduct(${product.id})">Удалить</button>
            </td>
        </tr>
    `).join('');
}

function getCategoryName(category) {
    const categories = {
        'pc': 'Игровые ПК',
        'console': 'Консоли',
        'vr': 'VR'
    };
    return categories[category] || category;
}

window.showUserModal = function(userId = null) {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('user-modal-title');
    const form = document.getElementById('user-form');
    
    if (userId) {
        const user = users.find(u => u.id === userId);
        if (user) {
            title.textContent = 'Редактировать пользователя';
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-login').value = user.login;
            document.getElementById('user-password').value = user.password || '';
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-role').value = user.role;
        }
    } else {
        title.textContent = 'Добавить пользователя';
        form.reset();
        document.getElementById('user-id').value = '';
    }
    
    modal.style.display = 'flex';
};

window.closeUserModal = function() {
    document.getElementById('user-modal').style.display = 'none';
};

window.showProductModal = function(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            title.textContent = 'Редактировать услугу';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-specs').value = product.specs ? product.specs.join(', ') : '';
        }
    } else {
        title.textContent = 'Добавить услугу';
        form.reset();
        document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'flex';
};

window.closeProductModal = function() {
    document.getElementById('product-modal').style.display = 'none';
};

window.editUser = function(userId) {
    showUserModal(userId);
};

window.deleteUser = async function(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('Пользователь удален');
            await loadUsersTable();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Ошибка соединения с сервером');
    }
};

window.editProduct = function(productId) {
    showProductModal(productId);
};

window.deleteProduct = async function(productId) {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('Услуга удалена');
            await loadProductsTable();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка удаления услуги:', error);
        alert('Ошибка соединения с сервером');
    }
};

async function handleUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('user-id').value;
    const login = document.getElementById('user-login').value;
    const password = document.getElementById('user-password').value;
    const name = document.getElementById('user-name').value;
    const role = document.getElementById('user-role').value;

    const validation = validateForm(login, password);
    if (!validation.isValid) {
        const errors = [];
        if (validation.loginError) errors.push(validation.loginError);
        if (validation.passwordError) errors.push(validation.passwordError);
        alert('Ошибки:\n' + errors.join('\n'));
        return;
    }

    try {
        const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users`;
        const method = userId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password, name, role })
        });

        const result = await response.json();

        if (result.success) {
            alert(userId ? 'Пользователь обновлен' : 'Пользователь добавлен');
            closeUserModal();
            await loadUsersTable();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка сохранения пользователя:', error);
        alert('Ошибка соединения с сервером');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = document.getElementById('product-price').value;
    const category = document.getElementById('product-category').value;
    let image = document.getElementById('product-image').value;
    const specsInput = document.getElementById('product-specs').value;
    const specs = specsInput ? specsInput.split(',').map(s => s.trim()) : [];

    const imageFile = document.getElementById('product-image-file').files[0];
    if (imageFile) {
        const uploadedUrl = await uploadToSupabase(imageFile);
        if (uploadedUrl) {
            image = uploadedUrl;
        } else {
            alert('Ошибка загрузки изображения. Попробуйте еще раз.');
            return;
        }
    }

    if (!image) {
        alert('Укажите URL изображения или загрузите файл');
        return;
    }

    try {
        const url = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
        const method = productId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, price, image, category, specs })
        });

        const result = await response.json();

        if (result.success) {
            alert(productId ? 'Услуга обновлена' : 'Услуга добавлена');
            closeProductModal();
            await loadProductsTable();
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка сохранения услуги:', error);
        alert('Ошибка соединения с сервером');
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    updateAuthUI();
    initEffects();
    
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'login.html':
            const loginForm = document.getElementById('login-form');
            loginForm?.addEventListener('submit', loginHandler);
            break;
            
        case 'reg.html':
            const registerForm = document.getElementById('register-form');
            registerForm?.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const name = document.getElementById('name')?.value || '';
                const login = document.getElementById('login').value;
                const password = document.getElementById('password').value;
                
                const validation = validateForm(login, password);
                
                if (!validation.isValid) {
                    const errors = [];
                    if (validation.loginError) errors.push(validation.loginError);
                    if (validation.passwordError) errors.push(validation.passwordError);
                    alert('Ошибки:\n' + errors.join('\n'));
                    return;
                }
                
                const result = await registerUser(login, password, name);
                
                if (result.success) {
                    alert('Регистрация успешна! Добро пожаловать, ' + (result.user.name || result.user.login));
                    window.location.href = 'index.html';
                } else {
                    alert('Ошибка: ' + result.error);
                }
            });
            break;
            
        case 'contacts.html':
            const feedbackForm = document.getElementById('feedback-form');
            feedbackForm?.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                const message = document.getElementById('message').value;
                
                console.log('Форма обратной связи:', { name, phone, message });
                alert('Спасибо! Ваше сообщение отправлено.');
                feedbackForm.reset();
            });
            break;
            
        case 'services.html':
            const productsGrid = document.querySelector('.products-grid');
            if (productsGrid) {
                await renderProductList(productsGrid);
                
                const filtersContainer = document.querySelector('.products-section');
                if (filtersContainer) {
                    initProductFilters(filtersContainer);
                }
            }
            
            const pricingTable = document.querySelector('.pricing-table');
            if (pricingTable) {
                pricingTable.innerHTML = tariffs.map(tariff => `
                    <div class="pricing-plan ${tariff.popular ? 'popular' : ''}">
                        ${tariff.popular ? '<div class="popular-badge">Популярный</div>' : ''}
                        <h3>${tariff.name}</h3>
                        <div class="price">${tariff.price} руб/${tariff.period}</div>
                        <ul>
                            ${tariff.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                        <button class="btn" onclick="selectTariff('${tariff.id}')">Выбрать</button>
                    </div>
                `).join('');
            }
            break;
            
        case 'product.html':
            const container = document.querySelector('.main');
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            
            if (productId && container) {
                container.innerHTML = await renderProductDetails(productId);
            } else {
                container.innerHTML = `
                    <section class="page-header">
                        <div class="container">
                            <h1>Ошибка</h1>
                            <p>ID услуги не указан.</p>
                            <a href="services.html" class="btn">Вернуться к услугам</a>
                        </div>
                    </section>
                `;
            }
            break;

        case 'admin.html':
            await initAdminPage();
            break;
            
        case 'index.html':
        default:
            const heroSection = document.querySelector('.hero');
            if (heroSection && isAuthenticated()) {
                const user = getCurrentUser();
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'welcome-message';
                welcomeMsg.style.marginTop = '1rem';
                welcomeMsg.style.fontSize = '1.2rem';
                welcomeMsg.innerHTML = `<p>👋 Добро пожаловать, ${user.name || user.login}! Готовы к игре?</p>`;
                heroSection.appendChild(welcomeMsg);
            }
            break;
    }
});
