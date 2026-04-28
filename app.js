const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'lab-aws-2026-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));

// Middleware de protección
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login?message=Debes iniciar sesión primero');
}

// ===== RUTAS DE AUTENTICACIÓN =====
app.get('/login', (req, res) => {
  res.render('login', { message: req.query.message || '' });
});

app.post('/register', async (req, res) => {
  const { reg_username, reg_password } = req.body;
  try {
    const hash = await bcrypt.hash(reg_password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [reg_username, hash], function(err) {
      if (err) return res.redirect('/login?message=Error: Usuario ya existe');
      res.redirect('/login?message=Registro exitoso. Ahora inicia sesión.');
    });
  } catch (e) {
    res.redirect('/login?message=Error en el servidor');
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.redirect('/login?message=Usuario no encontrado');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.redirect('/login?message=Contraseña incorrecta');
    
    req.session.user = { id: user.id, username: user.username };
    res.redirect('/dashboard');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ===== RUTAS DEL CRUD =====

// Dashboard - Leer todos los items
app.get('/dashboard', requireAuth, (req, res) => {
  db.all('SELECT * FROM items ORDER BY id DESC', [], (err, items) => {
    if (err) return res.status(500).send('Error al cargar items');
    res.render('dashboard', { user: req.session.user, items: items || [], message: req.query.message || '' });
  });
});

// Formulario nuevo item
app.get('/items/new', requireAuth, (req, res) => {
  res.render('item-form', { isEdit: false, item: null });
});

// Crear item
app.post('/items/create', requireAuth, (req, res) => {
  const { name, description } = req.body;
  db.run('INSERT INTO items (name, description) VALUES (?, ?)', [name, description], function(err) {
    if (err) return res.redirect('/dashboard?message=Error al crear item');
    res.redirect('/dashboard?message=Item creado exitosamente');
  });
});

// Formulario editar item
app.get('/items/edit/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM items WHERE id = ?', [req.params.id], (err, item) => {
    if (err || !item) return res.redirect('/dashboard?message=Item no encontrado');
    res.render('item-form', { isEdit: true, item: item });
  });
});

// Actualizar item
app.post('/items/update/:id', requireAuth, (req, res) => {
  const { name, description } = req.body;
  db.run('UPDATE items SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id], function(err) {
    if (err) return res.redirect('/dashboard?message=Error al actualizar item');
    res.redirect('/dashboard?message=Item actualizado exitosamente');
  });
});

// Eliminar item
app.get('/items/delete/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM items WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.redirect('/dashboard?message=Error al eliminar item');
    res.redirect('/dashboard?message=Item eliminado exitosamente');
  });
});

// Redirigir raíz a login
app.get('/', (req, res) => res.redirect('/login'));

app.listen(PORT, () => console.log(`🚀 App corriendo en http://localhost:${PORT}`));