import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const upload = multer({ storage: multer.memoryStorage() });

const SUPABASE_URL = 'https://uweyhelciikjhgbyqxia.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZXloZWxjaWlramhnYnlxeGlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1NTE2NiwiZXhwIjoyMDc4MTMxMTY2fQ.oeASb7onwZn9h3CwhIOjYLOoU7Okh73EnDAFsb9yPsM';

async function readJSON(filename) {
  const data = await fs.readFile(path.join(__dirname, 'server', 'data', filename), 'utf-8');
  return JSON.parse(data);
}

async function writeJSON(filename, data) {
  await fs.writeFile(path.join(__dirname, 'server', 'data', filename), JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/users', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    res.json(users.map(u => ({ ...u, password: undefined })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const { name, email, password, role } = req.body;
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name,
      email,
      password,
      role: role || 'user'
    };
    
    users.push(newUser);
    await writeJSON('users.json', users);
    
    res.json({ ...newUser, password: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const userId = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[index] = { ...users[index], ...req.body };
    await writeJSON('users.json', users);
    
    res.json({ ...users[index], password: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const userId = parseInt(req.params.id);
    const filtered = users.filter(u => u.id !== userId);
    
    if (filtered.length === users.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await writeJSON('users.json', filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    const { name, email, password } = req.body;
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name,
      email,
      password,
      role: 'user'
    };
    
    users.push(newUser);
    await writeJSON('users.json', users);
    
    res.json({ ...newUser, password: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await readJSON('products.json');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const products = await readJSON('products.json');
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read product' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const products = await readJSON('products.json');
    const { name, price, desc, image } = req.body;
    
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name,
      price: parseFloat(price),
      desc,
      image
    };
    
    products.push(newProduct);
    await writeJSON('products.json', products);
    
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const products = await readJSON('products.json');
    const productId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === productId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products[index] = { 
      ...products[index], 
      ...req.body,
      id: productId,
      price: parseFloat(req.body.price)
    };
    await writeJSON('products.json', products);
    
    res.json(products[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const products = await readJSON('products.json');
    const productId = parseInt(req.params.id);
    const filtered = products.filter(p => p.id !== productId);
    
    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await writeJSON('products.json', filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/bambam/${fileName}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': req.file.mimetype
      },
      body: req.file.buffer
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/bambam/${fileName}`;
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'ошибка' });
  }
});

app.listen(PORT, () => {
  console.log(`запущен на http://localhost:${PORT}`);
});
