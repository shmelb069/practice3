const API_URL = 'http://localhost:3000/api';

document.addEventListener("DOMContentLoaded", async () => {
  const authForm = document.querySelector("#auth-form");
  const registerForm = document.querySelector("#register-form");
  const catalogContainer = document.querySelector("#catalog");
  const productContainer = document.querySelector("#product-detail");

  updateHeader();

  if (authForm) {
    authForm.addEventListener("submit", async e => {
      e.preventDefault();
      const email = authForm.querySelector("#email").value.trim();
      const password = authForm.querySelector("#password").value.trim();

      if (!validateEmail(email) || password.length < 4) {
        alert("Введите корректный email и пароль (мин. 4 символа)");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error);
          return;
        }

        const user = await response.json();
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        alert("Добро пожаловать!");
        
        if (user.role === 'admin') {
          window.location.href = "admin.html";
        } else {
          window.location.href = "index.html";
        }
      } catch (err) {
        alert("Ошибка при входе");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async e => {
      e.preventDefault();
      const name = registerForm.querySelector("#reg-name").value.trim();
      const email = registerForm.querySelector("#reg-email").value.trim();
      const password = registerForm.querySelector("#reg-password").value.trim();

      if (name.length < 2 || !validateEmail(email) || password.length < 4) {
        alert("Проверьте правильность введённых данных!");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error);
          return;
        }

        const user = await response.json();
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        alert("Регистрация успешна!");
        window.location.href = "index.html";
      } catch (err) {
        alert("Ошибка при регистрации");
      }
    });
  }

  if (catalogContainer) {
    try {
      const response = await fetch(`${API_URL}/products`);
      const products = await response.json();
      catalogContainer.innerHTML = products.map(p => `
        <div class="product" data-id="${p.id}">
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>${p.price.toLocaleString()} ₽</p>
          <a class="btn" href="product.html?id=${p.id}">Подробнее</a>
        </div>
      `).join("");
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  if (productContainer) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      const product = await response.json();

      if (product && !product.error) {
        productContainer.innerHTML = `
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h2>${product.name}</h2>
            <p>${product.desc}</p>
            <div class="price">${product.price.toLocaleString()} ₽</div>
            <button class="btn">Добавить в корзину</button>
          </div>
        `;
      } else {
        productContainer.innerHTML = `<p>Товар не найден</p>`;
      }
    } catch (error) {
      productContainer.innerHTML = `<p>Товар не найден</p>`;
    }
  }

  document.addEventListener("click", e => {
    if (e.target.id === "logout-btn") {
      sessionStorage.removeItem('currentUser');
      alert("Вы вышли из аккаунта");
      window.location.href = "index.html";
    }
  });
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function updateHeader() {
  const headerNav = document.querySelector("header nav");
  const user = JSON.parse(sessionStorage.getItem('currentUser'));

  if (!headerNav) return;

  if (user) {
    const adminLink = user.role === 'admin' ? '<a href="admin.html">Админка</a>' : '';
    headerNav.innerHTML = `
      <span class="welcome">Привет, ${user.name}!</span>
      ${adminLink}
      <button id="logout-btn" class="logout-btn">Выйти</button>
    `;
  } else {
    headerNav.innerHTML = `
      <a href="index.html">Каталог</a>
      <a href="auth.html">Войти</a>
    `;
  }
}

